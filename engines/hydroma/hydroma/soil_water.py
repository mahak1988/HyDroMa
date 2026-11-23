"""Soil water storage and root-zone water availability model.

An independent, HTTP-free, dependency-free scientific model. For a layered soil
profile it computes, over the **effective root zone**:

* Total Available Water (TAW)            = Σ (θfcᵢ − θwpᵢ) · Zᵢ
* Current root-zone storage (mm)         = Σ θactualᵢ · Zᵢ            (if θactual supplied)
* Available water above wilting point    = Σ (θactualᵢ − θwpᵢ) · Zᵢ   (if θactual supplied)
* Depletion relative to field capacity   = Σ (θfcᵢ − θactualᵢ) · Zᵢ  (if θactual supplied)
* Readily Available Water (RAW)          = p · TAW                     (if p supplied)
* Depletion fraction                     = depletion / TAW             (if TAW > 0)
* Remaining available water              = available water above WP      (= TAW − depletion)

where Zᵢ is the **effective** thickness of layer i *within the root zone* (mm).

Units
-----
theta_fc, theta_wp, theta_actual : volumetric water content [m3/m3] (== mm/mm)
layer thickness / depth          : [mm]  (bare numbers are mm; explicit length
                                   quantities in mm/cm/m are converted via the
                                   units contract)
storage / TAW / depletion / RAW  : [mm]  (θ[m3/m3] · Z[mm] = mm; per unit area)

Layer / root-zone handling (explicit, documented)
-------------------------------------------------
* Layers are described either by explicit ``top``/``bottom`` depths (from the
  surface) or by ``thickness`` (stacked sequentially from the surface). Mixing
  is allowed as long as each layer is contiguous with the previous one.
* The first layer top must be 0; each subsequent top must equal the previous
  bottom (no gaps, no overlaps).
* ``rootZoneDepth`` is the effective root-zone depth. It is optional: when
  omitted the root zone defaults to the full profile depth (documented default,
  not a scientific assumption). When supplied, the profile must **cover** it
  (last bottom ≥ rootZoneDepth) or an explicit ``INCOMPLETE_COVERAGE`` error is
  returned — the model never extrapolates.
* A layer that straddles the root-zone boundary contributes **only the
  intersected thickness** ``min(bottom, rootZoneDepth) − top``. Layers entirely
  below the root zone contribute zero.

θactual policy
--------------
θactual is optional **per the whole profile**: supplied for ALL layers (storage /
depletion computed) or omitted for ALL layers (only TAW / RAW computed). A partial
supply is rejected (``INCOMPLETE_THETA_ACTUAL``) — values are never silently mixed.

Bounds & no-clamping
--------------------
* θ ∈ [0, 1] (physical bound); θfc must exceed θwp. Out-of-range values are
  rejected, never clamped.
* θactual outside [θwp, θfc] is physically possible (above field capacity =
  wet/draining; below wilting point = drier than WP). It is **flagged** via
  status/warnings, never clamped.
* p is the FAO-56 depletion fraction, domain (0, 1]. If omitted, RAW is not
  computed (no silent default).

This model does NOT estimate soil hydraulic properties, infiltration, drainage,
evaporation, capillary rise, percolation or crop water requirements. It is
software-tested but NOT scientifically validated.
"""

from __future__ import annotations

import math

from .units import UnitError, convert, dimension, is_known, is_quantity, quantity_value_unit

__all__ = [
    "SOIL_WATER_MODEL",
    "SOIL_WATER_DEFINITION",
    "SOIL_WATER_CONTRACT",
    "validate_soil_water_input",
    "compute_soil_water_storage",
    "root_zone_storage_terms",
]

ROUND_DECIMALS = 4
EPS = 1e-9

# Dimensionless volumetric-water-content units (all numerically equal).
_THETA_UNITS = {
    "m3_m3", "m3/m3", "m3_per_m3",
    "mm_mm", "mm/mm",
    "cm3_cm3", "cm3/cm3",
    "fraction", "dimensionless", "1", "-",
}

SOIL_WATER_MODEL = {
    "id": "eco-nojin.hydroma.soil-water-storage",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": (
        "TAW = sum((theta_fc - theta_wp) * Z); storage = sum(theta_actual * Z); "
        "depletion = sum((theta_fc - theta_actual) * Z); available = sum((theta_actual - theta_wp) * Z); "
        "RAW = p * TAW; depletion_fraction = depletion / TAW"
    ),
    "units": {"water_content": "m3_per_m3", "thickness": "mm", "storage": "mm"},
}

ASSUMPTIONS = [
    "layers_contiguous_from_surface",
    "root_zone_defaults_to_profile_depth_when_omitted",
    "partial_layer_intersection_at_root_zone_boundary",
    "theta_actual_all_or_none",
    "theta_in_0_1",
    "theta_fc_gt_theta_wp",
    "no_clamping",
    "per_unit_area_profile",
    "p_is_fao56_depletion_fraction",
]
LIMITATIONS = [
    "notValidated",
    "does_not_estimate_hydraulic_properties",
    "no_infiltration_drainage_evaporation_capillary_rise",
    "no_crop_water_requirement",
    "no_dynamic_water_transport",
    "theta_actual_required_for_storage",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). FAO Irrigation and Drainage Paper 56, Chapter 4 (soil water, TAW, RAW, p).",
    "Hillel, D. (1998). Environmental Soil Physics. Academic Press.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _is_finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _is_blank(value) -> bool:
    return value is None or value == ""


def _to_number(value) -> float:
    if isinstance(value, bool):
        return float("nan")
    if isinstance(value, (int, float)):
        return float(value)
    if value is None or value == "":
        return float("nan")
    try:
        return float(value)
    except (TypeError, ValueError):
        return float("nan")


def _pick(layer: dict, *names):
    """Return the first present, non-None value among ``names`` (camelCase + snake_case)."""
    for name in names:
        if name in layer and layer[name] is not None:
            return layer[name]
    return None


def _to_length_mm(value, field: str, layer_index, errors: list):
    """Parse a length (bare number = mm; quantity = explicit length unit -> mm)."""
    if _is_blank(value):
        errors.append({"layer": layer_index, "field": field, "code": "MISSING",
                       "message": f"{field} is required"})
        return None
    if is_quantity(value):
        qv, qu = quantity_value_unit(value)
        if not is_known(qu) or dimension(qu) != "length":
            errors.append({"layer": layer_index, "field": field, "code": "UNSUPPORTED_UNIT",
                           "message": f"{field} must be a length unit (mm/cm/m), received {qu!r}"})
            return None
        try:
            return float(convert(qv, qu, "mm"))
        except UnitError:
            errors.append({"layer": layer_index, "field": field, "code": "UNSUPPORTED_UNIT",
                           "message": f"{field} could not be converted to mm"})
            return None
    v = _to_number(value)
    if not _is_finite(v):
        errors.append({"layer": layer_index, "field": field, "code": "NON_FINITE",
                       "message": f"{field} must be a finite number"})
        return None
    return v


def _to_theta(value, field: str, layer_index, errors: list):
    """Parse a volumetric water content (bare number = m3/m3; quantity = dimensionless)."""
    if _is_blank(value):
        errors.append({"layer": layer_index, "field": field, "code": "MISSING",
                       "message": f"{field} is required"})
        return None
    if is_quantity(value):
        qv, qu = quantity_value_unit(value)
        if qu not in _THETA_UNITS:
            errors.append({"layer": layer_index, "field": field, "code": "UNSUPPORTED_UNIT",
                           "message": f"{field} must be dimensionless (m3/m3), received {qu!r}"})
            return None
        v = float(qv)
    else:
        v = _to_number(value)
    if not _is_finite(v):
        errors.append({"layer": layer_index, "field": field, "code": "NON_FINITE",
                       "message": f"{field} must be a finite number"})
        return None
    if not (0.0 <= v <= 1.0):
        errors.append({"layer": layer_index, "field": field, "code": "INVALID_THETA",
                       "message": f"{field} must be within [0, 1] m3/m3, received {v}"})
        return None
    return v


def _to_p(value, errors: list):
    """Parse the depletion fraction p (bare number = fraction; quantity = dimensionless)."""
    if _is_blank(value):
        return None
    if is_quantity(value):
        qv, qu = quantity_value_unit(value)
        if qu not in _THETA_UNITS:
            errors.append({"field": "p", "code": "UNSUPPORTED_UNIT",
                           "message": f"p must be dimensionless (fraction), received {qu!r}"})
            return None
        v = float(qv)
    else:
        v = _to_number(value)
    if not _is_finite(v):
        errors.append({"field": "p", "code": "NON_FINITE", "message": "p must be a finite number"})
        return None
    if not (0.0 < v <= 1.0):
        errors.append({"field": "p", "code": "INVALID_P",
                       "message": "p must be a finite number in (0, 1]"})
        return None
    return v


def _parse_layers(input: dict, errors: list):
    """Parse layers into a normalized list with top/bottom/theta values in mm / m3/m3.

    Returns (layers, theta_actual_present). Each layer dict:
    {index, name, top_mm, bottom_mm, thickness_mm, theta_fc, theta_wp, theta_actual?}
    """
    raw_layers = input.get("layers")
    if not isinstance(raw_layers, list) or len(raw_layers) == 0:
        errors.append({"field": "layers", "code": "EMPTY_LAYERS",
                       "message": "layers must be a non-empty array"})
        return [], False

    layers = []
    cursor = 0.0
    for i, raw in enumerate(raw_layers):
        if not isinstance(raw, dict):
            errors.append({"layer": i, "code": "INVALID_LAYER", "message": "layer must be an object"})
            return [], False

        top_raw = _pick(raw, "top", "top_mm")
        bottom_raw = _pick(raw, "bottom", "bottom_mm")
        thickness_raw = _pick(raw, "thickness", "thickness_mm", "dz", "dz_mm")

        if top_raw is not None and bottom_raw is not None:
            top = _to_length_mm(top_raw, "top", i, errors)
            bottom = _to_length_mm(bottom_raw, "bottom", i, errors)
            if top is None or bottom is None:
                return [], False
            if bottom <= top:
                errors.append({"layer": i, "field": "bottom", "code": "INVALID_THICKNESS",
                               "message": "bottom must be greater than top"})
                return [], False
            if abs(top - cursor) > 1e-6:
                if top < cursor:
                    errors.append({"layer": i, "field": "top", "code": "LAYER_OVERLAP",
                                   "message": f"layer top {top} overlaps previous bottom {cursor}"})
                else:
                    errors.append({"layer": i, "field": "top", "code": "LAYER_GAP",
                                   "message": f"layer top {top} does not continue previous bottom {cursor}"})
                return [], False
            thickness = bottom - top
        elif thickness_raw is not None:
            thickness = _to_length_mm(thickness_raw, "thickness", i, errors)
            if thickness is None:
                return [], False
            if thickness <= 0:
                errors.append({"layer": i, "field": "thickness", "code": "INVALID_THICKNESS",
                               "message": "thickness must be a finite number > 0"})
                return [], False
            top = cursor
            bottom = cursor + thickness
        else:
            errors.append({"layer": i, "field": "layers", "code": "INVALID_LAYER",
                           "message": "each layer needs thickness (or top and bottom)"})
            return [], False

        if i == 0 and abs(top) > 1e-6:
            errors.append({"layer": i, "field": "top", "code": "INVALID_LAYER",
                           "message": "first layer top must be 0 (surface)"})
            return [], False

        theta_fc = _to_theta(_pick(raw, "thetaFc", "theta_fc"), "theta_fc", i, errors)
        theta_wp = _to_theta(_pick(raw, "thetaWp", "theta_wp"), "theta_wp", i, errors)
        if theta_fc is None or theta_wp is None:
            return [], False
        if theta_fc <= theta_wp:
            errors.append({"layer": i, "field": "theta_fc", "code": "THETA_FC_MUST_EXCEED_WP",
                           "message": "theta_fc must be greater than theta_wp"})
            return [], False

        theta_actual_raw = _pick(raw, "thetaActual", "theta_actual")
        theta_actual = None
        theta_actual_supplied = theta_actual_raw is not None
        if theta_actual_supplied:
            theta_actual = _to_theta(theta_actual_raw, "theta_actual", i, errors)
            if theta_actual is None:
                return [], False

        layers.append({
            "index": i,
            "name": raw.get("name"),
            "top_mm": top,
            "bottom_mm": bottom,
            "thickness_mm": thickness,
            "theta_fc": theta_fc,
            "theta_wp": theta_wp,
            "theta_actual": theta_actual,
            "_theta_actual_supplied": theta_actual_supplied,
        })
        cursor = bottom

    supplied = [layer["_theta_actual_supplied"] for layer in layers]
    theta_actual_present = all(supplied)
    if any(supplied) and not theta_actual_present:
        errors.append({"field": "theta_actual", "code": "INCOMPLETE_THETA_ACTUAL",
                       "message": "theta_actual must be supplied for all layers or none"})
        return [], False

    return layers, theta_actual_present


def validate_soil_water_input(input: dict | None = None) -> dict:
    """Validate the model input. Returns ``{"valid": bool, "errors": [...]}``."""
    input = input or {}
    errors: list = []

    layers, _ = _parse_layers(input, errors)
    if not layers:
        return {"valid": False, "errors": errors}

    profile_depth = layers[-1]["bottom_mm"]

    root_zone_raw = input.get("rootZoneDepth", input.get("root_zone_depth_mm"))
    if not _is_blank(root_zone_raw):
        if is_quantity(root_zone_raw):
            qv, qu = quantity_value_unit(root_zone_raw)
            if not is_known(qu) or dimension(qu) != "length":
                errors.append({"field": "rootZoneDepth", "code": "UNSUPPORTED_UNIT",
                               "message": "rootZoneDepth must be a length unit (mm/cm/m)"})
            else:
                try:
                    root_zone = float(convert(qv, qu, "mm"))
                except UnitError:
                    root_zone = None
                    errors.append({"field": "rootZoneDepth", "code": "UNSUPPORTED_UNIT",
                                   "message": "rootZoneDepth could not be converted to mm"})
                else:
                    if root_zone <= 0:
                        errors.append({"field": "rootZoneDepth", "code": "INVALID_ROOT_ZONE_DEPTH",
                                       "message": "rootZoneDepth must be > 0"})
                    elif root_zone > profile_depth + 1e-6:
                        errors.append({"field": "rootZoneDepth", "code": "INCOMPLETE_COVERAGE",
                                       "message": f"profile depth {profile_depth} mm does not cover "
                                                  f"root-zone depth {root_zone} mm"})
        else:
            root_zone = _to_number(root_zone_raw)
            if not _is_finite(root_zone):
                errors.append({"field": "rootZoneDepth", "code": "NON_FINITE",
                               "message": "rootZoneDepth must be a finite number"})
            elif root_zone <= 0:
                errors.append({"field": "rootZoneDepth", "code": "INVALID_ROOT_ZONE_DEPTH",
                               "message": "rootZoneDepth must be > 0"})
            elif root_zone > profile_depth + 1e-6:
                errors.append({"field": "rootZoneDepth", "code": "INCOMPLETE_COVERAGE",
                               "message": f"profile depth {profile_depth} mm does not cover "
                                          f"root-zone depth {root_zone} mm"})

    _to_p(input.get("p"), errors)

    return {"valid": len(errors) == 0, "errors": errors}


def compute_soil_water_storage(input: dict | None = None) -> dict:
    """Execute the soil water storage model. Never raises on bad input."""
    input = input or {}
    validation = validate_soil_water_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": SOIL_WATER_MODEL, "errors": validation["errors"]}

    layers, theta_actual_present = _parse_layers(input, [])
    if not layers:  # defensive: validation already passed, so this should not happen
        return {"ok": False, "model": SOIL_WATER_MODEL,
                "errors": [{"field": "layers", "code": "EMPTY_LAYERS",
                            "message": "layers must be a non-empty array"}]}
    profile_depth = layers[-1]["bottom_mm"]

    root_zone_raw = input.get("rootZoneDepth", input.get("root_zone_depth_mm"))
    if not _is_blank(root_zone_raw):
        if is_quantity(root_zone_raw):
            root_zone = float(convert(*quantity_value_unit(root_zone_raw), "mm"))
        else:
            root_zone = float(root_zone_raw)
    else:
        root_zone = profile_depth

    p = _to_p(input.get("p"), [])

    taw = 0.0
    storage = 0.0
    available = 0.0
    depletion = 0.0
    per_layer = []
    any_above_fc = False
    any_below_wp = False

    for layer in layers:
        top = layer["top_mm"]
        bottom = layer["bottom_mm"]
        tfc = layer["theta_fc"]
        twp = layer["theta_wp"]

        # Effective thickness within the root zone (partial intersection supported).
        effective_top = top
        effective_bottom = min(bottom, root_zone)
        z = effective_bottom - effective_top
        if z < 0:
            z = 0.0

        layer_taw = (tfc - twp) * z
        taw += layer_taw

        entry = {
            "index": layer["index"],
            "name": layer["name"],
            "top_mm": _round(top),
            "bottom_mm": _round(bottom),
            "effective_thickness_mm": _round(z),
            "theta_fc": _round(tfc),
            "theta_wp": _round(twp),
            "taw_mm": _round(layer_taw),
        }
        if theta_actual_present:
            ta = layer["theta_actual"]
            layer_storage = ta * z
            layer_available = (ta - twp) * z
            layer_depletion = (tfc - ta) * z
            storage += layer_storage
            available += layer_available
            depletion += layer_depletion
            if ta > tfc + EPS:
                any_above_fc = True
            if ta < twp - EPS:
                any_below_wp = True
            entry["theta_actual"] = _round(ta)
            entry["storage_mm"] = _round(layer_storage)
            entry["available_mm"] = _round(layer_available)
            entry["depletion_mm"] = _round(layer_depletion)
        per_layer.append(entry)

    remaining = (taw - depletion) if theta_actual_present else None
    depletion_fraction = (depletion / taw) if (theta_actual_present and taw > EPS) else None
    raw = (float(p) * taw) if (p is not None) else None
    # Stress threshold: depletion has reached or exceeded RAW (EPS guards FP equality).
    stress_reached = (depletion >= raw - EPS) if (theta_actual_present and raw is not None) else None

    # Deterministic status classification (diagnostic, not a crop-stress model).
    if not theta_actual_present:
        status = "no_actual_water"
    elif taw <= EPS:
        status = "zero_taw"
    elif any_above_fc:
        status = "above_field_capacity"
    elif any_below_wp:
        status = "at_or_below_wilting_point"
    elif remaining is not None and remaining <= EPS:
        status = "at_or_below_wilting_point"
    elif depletion <= EPS:
        status = "at_field_capacity"
    elif stress_reached:
        status = "stressed"
    else:
        status = "readily_available"

    warnings = []
    if theta_actual_present and taw <= EPS:
        warnings.append({"code": "TAW_ZERO",
                         "message": "TAW is zero; depletion fraction is undefined"})
    if theta_actual_present and any_above_fc:
        warnings.append({"code": "ABOVE_FIELD_CAPACITY",
                         "message": "theta_actual exceeds theta_fc (wet / draining); not clamped"})
    if theta_actual_present and any_below_wp:
        warnings.append({"code": "BELOW_WILTING_POINT",
                         "message": "theta_actual below theta_wp; available water negative; not clamped"})
    if (theta_actual_present and not any_above_fc and not any_below_wp
            and remaining is not None and remaining <= EPS):
        warnings.append({"code": "AT_OR_BELOW_WILTING_POINT",
                         "message": "root-zone available water at or below wilting point"})
    if theta_actual_present and status == "stressed":
        warnings.append({"code": "RAW_DEPLETION_REACHED",
                         "message": "depletion has reached or exceeded RAW (readily available water exhausted)"})
    if not theta_actual_present:
        warnings.append({"code": "THETA_ACTUAL_NOT_SUPPLIED",
                         "message": "storage/depletion not computed (theta_actual omitted)"})
    if p is None:
        warnings.append({"code": "P_NOT_SUPPLIED",
                         "message": "RAW not computed (p omitted)"})

    return {
        "ok": True,
        "model": SOIL_WATER_MODEL,
        "inputs": {"layers": input.get("layers"), "p": p, "rootZoneDepth": root_zone},
        "result": {
            "root_zone_depth_mm": _round(root_zone),
            "profile_depth_mm": _round(profile_depth),
            "taw_mm": _round(taw),
            "storage_mm": _round(storage) if theta_actual_present else None,
            "available_water_mm": _round(available) if theta_actual_present else None,
            "depletion_mm": _round(depletion) if theta_actual_present else None,
            "raw_mm": _round(raw) if raw is not None else None,
            "remaining_mm": _round(remaining) if remaining is not None else None,
            "depletion_fraction": _round(depletion_fraction) if depletion_fraction is not None else None,
            "stress_reached": stress_reached,
            "status": status,
        },
        "per_layer": per_layer,
        "warnings": warnings,
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


def root_zone_storage_terms(input: dict | None = None) -> dict:
    """Return root-zone storage terms for a layer profile (single source of truth).

    Reuses the same parsing/validation as :func:`compute_soil_water_storage`
    (layer order, coverage, units, θ bounds) and returns the unrounded terms an
    integrated model needs so it does not duplicate the soil-water math:

        {
          "root_zone_depth_mm": float,
          "profile_depth_mm": float,
          "wp_storage_mm": float,   # Σ θwp · Z
          "fc_storage_mm": float,   # Σ θfc · Z
          "taw_mm": float,          # fc_storage - wp_storage
          "layers": [...],          # normalized layers (top/bottom/theta in mm, m3/m3)
        }

    Only the soil profile and root zone are validated here (not ``p`` — that is a
    caller concern). Raises :class:`ValueError` on an invalid profile/root zone.
    """
    data = input or {}
    errors: list = []
    layers, _ = _parse_layers(data, errors)
    if not layers:
        msgs = "; ".join(e.get("message", e.get("code", "?")) for e in errors) or "invalid layers"
        raise ValueError(f"invalid soil water profile: {msgs}")

    profile_depth = layers[-1]["bottom_mm"]

    root_zone_raw = data.get("rootZoneDepth", data.get("root_zone_depth_mm"))
    if _is_blank(root_zone_raw):
        root_zone = profile_depth
    elif is_quantity(root_zone_raw):
        qv, qu = quantity_value_unit(root_zone_raw)
        if not is_known(qu) or dimension(qu) != "length":
            raise ValueError(f"rootZoneDepth must be a length unit, received {qu!r}")
        root_zone = float(convert(qv, qu, "mm"))
    else:
        root_zone = _to_number(root_zone_raw)
        if not _is_finite(root_zone):
            raise ValueError("rootZoneDepth must be a finite number")
    if root_zone <= 0:
        raise ValueError("rootZoneDepth must be > 0")
    if root_zone > profile_depth + 1e-6:
        raise ValueError(
            f"profile depth {profile_depth} mm does not cover root-zone depth {root_zone} mm"
        )

    wp_storage = 0.0
    fc_storage = 0.0
    for layer in layers:
        z = min(layer["bottom_mm"], root_zone) - layer["top_mm"]
        if z < 0:
            z = 0.0
        wp_storage += layer["theta_wp"] * z
        fc_storage += layer["theta_fc"] * z

    return {
        "root_zone_depth_mm": root_zone,
        "profile_depth_mm": profile_depth,
        "wp_storage_mm": wp_storage,
        "fc_storage_mm": fc_storage,
        "taw_mm": fc_storage - wp_storage,
        "layers": layers,
    }


SOIL_WATER_DEFINITION = {
    "id": SOIL_WATER_MODEL["id"],
    "version": SOIL_WATER_MODEL["version"],
    "domain": "soil",
    "title": "Soil water storage & root-zone water availability",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["m3_per_m3", "mm"],
    "parameters": ["layers", "rootZoneDepth", "p"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "layers", "kind": "array", "required": True,
         "description": "array of {top,bottom|thickness, thetaFc, thetaWp, thetaActual?}; "
                        "depths in mm (or length quantities)"},
        {"name": "rootZoneDepth", "kind": "quantity", "unit": "mm", "required": False,
         "description": "effective root-zone depth; defaults to profile depth when omitted"},
        {"name": "p", "kind": "number", "unit": "fraction", "required": False,
         "description": "FAO-56 depletion fraction (0 < p <= 1); RAW computed only if given"},
    ],
    "outputs": [
        {"name": "root_zone_depth_mm", "kind": "number", "unit": "mm"},
        {"name": "taw_mm", "kind": "number", "unit": "mm"},
        {"name": "storage_mm", "kind": "number", "unit": "mm"},
        {"name": "available_water_mm", "kind": "number", "unit": "mm"},
        {"name": "depletion_mm", "kind": "number", "unit": "mm"},
        {"name": "raw_mm", "kind": "number", "unit": "mm"},
        {"name": "remaining_mm", "kind": "number", "unit": "mm"},
        {"name": "depletion_fraction", "kind": "number"},
        {"name": "stress_reached", "kind": "boolean"},
        {"name": "status", "kind": "string"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [
            {"kind": "unit_test", "status": "pass",
             "reference": "tests/test_soil_water.py",
             "notes": "software + independent hand-derived reference vectors; not scientific validation"},
        ],
        "notes": "Software-tested only. Not validated against observations.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}

SOIL_WATER_CONTRACT = {
    "equation": SOIL_WATER_MODEL["equation"],
    "units": SOIL_WATER_MODEL["units"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "layer_fields": {
        "top/bottom": {"unit": "mm", "constraint": "top of first layer = 0; contiguous, non-overlapping"},
        "thickness": {"unit": "mm", "constraint": "> 0 (alternative to top/bottom)"},
        "theta_fc": {"unit": "m3_per_m3", "constraint": "0..1 and > theta_wp"},
        "theta_wp": {"unit": "m3_per_m3", "constraint": "0..1"},
        "theta_actual": {"unit": "m3_per_m3", "constraint": "0..1, optional (all-or-none)"},
    },
    "optional_params": {
        "rootZoneDepth": {"unit": "mm", "constraint": "> 0 and <= profile depth"},
        "p": {"unit": "fraction", "constraint": "0 < p <= 1"},
    },
    "error_codes": ["EMPTY_LAYERS", "INVALID_LAYER", "INVALID_THICKNESS", "INVALID_THETA",
                    "THETA_FC_MUST_EXCEED_WP", "INCOMPLETE_THETA_ACTUAL", "INVALID_P",
                    "INVALID_ROOT_ZONE_DEPTH", "INCOMPLETE_COVERAGE", "LAYER_GAP",
                    "LAYER_OVERLAP", "UNSUPPORTED_UNIT", "NON_FINITE", "MISSING"],
    "warning_codes": ["ABOVE_FIELD_CAPACITY", "BELOW_WILTING_POINT",
                      "AT_OR_BELOW_WILTING_POINT", "RAW_DEPLETION_REACHED",
                      "TAW_ZERO", "THETA_ACTUAL_NOT_SUPPLIED", "P_NOT_SUPPLIED"],
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
}