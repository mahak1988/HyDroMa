"""Root-zone soil water balance (Phase 3.15).

A deterministic, dependency-free, daily root-zone bucket water balance following the
FAO-56 soil-water accounting (Allen et al. 1998, FAO Irrigation & Drainage Paper 56,
Chapter 4). It represents storage in a single effective root zone and updates it
sequentially from daily inputs.

Model
-----
Root-zone storage bounds:
    S_WP = θwp · Zr            [mm]   (storage at permanent wilting point)
    S_FC = θfc · Zr            [mm]   (storage at field capacity)
    TAW  = (θfc − θwp) · Zr    [mm]   (total available water)
    RAW  = p · TAW             [mm]   (readily available water)

Daily balance (per day, with S = start-of-day storage):
    candidate = S + P − RO + I
    excess    = max(0, candidate − S_FC)          # above field capacity -> bucket drainage
    after     = candidate − excess
    available = max(0, after − S_WP)              # plant-available water above WP
    actualET  = min(ETc, available)               # ET limited to available water
    unmet     = ETc − actualET                     # demand not met (not removed)
    S_final   = after − actualET
    Dr        = S_FC − S_final                     # root-zone depletion

Conservation: ``S + P + I = RO + excess + actualET + S_final``.

Units: depths/storage in mm; θ volumetric [m3/m3] (== mm/mm); ``p`` dimensionless.
Bare numbers are interpreted as mm / m3/m3; explicit length quantities (mm/cm/m) are
converted via the units contract. No silent conversion.

Scope: single effective root zone. Does NOT simulate infiltration physics, hydraulic
conductivity, capillary rise, preferential flow, groundwater, or Richards' equation.
Software-tested; NOT scientifically validated.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple

from .units import UnitError, convert, dimension, is_known, is_quantity, quantity_value_unit

__all__ = [
    "ROOT_ZONE_MODEL",
    "ROOT_ZONE_DEFINITION",
    "ROOT_ZONE_CONTRACT",
    "validate_root_zone_input",
    "compute_root_zone_water_balance",
]

ROUND_DECIMALS = 4
EPS = 1e-9

ROOT_ZONE_MODEL = {
    "id": "eco-nojin.hydroma.root-zone-water-balance",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": (
        "TAW=(theta_fc-theta_wp)*Zr; RAW=p*TAW; "
        "excess=max(0,(S+P-RO+I)-S_FC); actualET=min(ETc, max(0, after-S_WP)); "
        "S_final=after-actualET; Dr=S_FC-S_final"
    ),
    "units": {"water_content": "m3_per_m3", "depth": "mm", "storage": "mm"},
    "method": "FAO-56 root-zone bucket (Allen et al. 1998, FAO 56)",
}

ASSUMPTIONS = [
    "single_effective_root_zone",
    "theta_volumetric_m3_per_m3",
    "storage_bounds_wilting_to_field_capacity",
    "excess_above_field_capacity_removed_as_bucket_drainage",
    "actual_et_limited_to_water_above_wilting_point",
    "unmet_demand_reported_not_removed",
    "per_unit_area",
    "p_is_depletion_fraction",
]
LIMITATIONS = [
    "notValidated",
    "single_root_zone_bucket",
    "no_infiltration_physics",
    "no_hydraulic_conductivity",
    "no_capillary_rise",
    "no_percolation_or_groundwater",
    "no_crisp_soil_type_inference",
    "actual_et_equals_min_Etc_available_water",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). FAO Irrigation and Drainage Paper 56, Chapter 4 (soil water balance, TAW, RAW, p).",
]

_THETA_UNITS = {"m3_m3", "m3/m3", "m3_per_m3", "mm_mm", "mm/mm", "cm3_cm3", "fraction",
                "dimensionless", "1", "-"}


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(v: Any) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(float(v))


def _err(code: str, field: str, message: str, **extra) -> Dict[str, Any]:
    d = {"code": code, "field": field, "message": message}
    d.update(extra)
    return d


def _to_length_mm(value: Any, field: str, errors: List[Dict[str, Any]]) -> Optional[float]:
    """Parse a length (bare number = mm; quantity = explicit length unit -> mm)."""
    if not _finite(value) and not is_quantity(value):
        errors.append(_err("NON_FINITE" if value is not None else "MISSING", field,
                           f"{field} must be a finite number"))
        return None
    if is_quantity(value):
        qv, qu = quantity_value_unit(value)
        if not is_known(qu) or dimension(qu) != "length":
            errors.append(_err("UNSUPPORTED_UNIT", field,
                               f"{field} must be a length unit (mm/cm/m), got {qu!r}"))
            return None
        try:
            return float(convert(qv, qu, "mm"))
        except UnitError:
            errors.append(_err("UNSUPPORTED_UNIT", field, f"{field} could not be converted to mm"))
            return None
    return float(value)


def _to_theta(value: Any, field: str, errors: List[Dict[str, Any]]) -> Optional[float]:
    """Parse a volumetric water content (bare = m3/m3; quantity = dimensionless)."""
    if is_quantity(value):
        qv, qu = quantity_value_unit(value)
        if qu not in _THETA_UNITS:
            errors.append(_err("UNSUPPORTED_UNIT", field,
                               f"{field} must be dimensionless (m3/m3), got {qu!r}"))
            return None
        v = float(qv)
    elif _finite(value):
        v = float(value)
    else:
        errors.append(_err("NON_FINITE" if value is not None else "MISSING", field,
                           f"{field} must be a finite number"))
        return None
    if not (0.0 <= v <= 1.0):
        errors.append(_err("INVALID_THETA", field, f"{field} must be within [0, 1] m3/m3"))
        return None
    return v


def validate_root_zone_input(input: dict | None = None) -> Dict[str, Any]:
    """Validate the root-zone water balance input."""
    input = input or {}
    errors: List[Dict[str, Any]] = []

    zr = _to_length_mm(input.get("root_zone_depth_mm"), "root_zone_depth_mm", errors)
    if zr is not None and zr <= 0:
        errors.append(_err("INVALID_ROOT_ZONE_DEPTH", "root_zone_depth_mm",
                           "root_zone_depth_mm must be > 0"))

    tfc = _to_theta(input.get("theta_fc"), "theta_fc", errors)
    twp = _to_theta(input.get("theta_wp"), "theta_wp", errors)
    if tfc is not None and twp is not None and tfc <= twp:
        errors.append(_err("THETA_FC_MUST_EXCEED_WP", "theta_fc",
                           "theta_fc must be greater than theta_wp"))

    s0 = _to_length_mm(input.get("initial_storage_mm"), "initial_storage_mm", errors)
    if s0 is not None and s0 < 0:
        errors.append(_err("INVALID_INITIAL", "initial_storage_mm",
                           "initial_storage_mm must be >= 0"))

    p = input.get("p")
    if p is not None:
        if is_quantity(p):
            qv, qu = quantity_value_unit(p)
            if qu not in _THETA_UNITS:
                errors.append(_err("UNSUPPORTED_UNIT", "p", f"p must be dimensionless, got {qu!r}"))
            else:
                p = float(qv)
        if _finite(p) and not (0.0 < float(p) <= 1.0):
            errors.append(_err("INVALID_P", "p", "p must be in (0, 1]"))

    days = input.get("days")
    if not isinstance(days, list) or not days:
        errors.append(_err("EMPTY_DAYS", "days", "days must be a non-empty array"))
    else:
        for i, day in enumerate(days):
            if not isinstance(day, dict):
                errors.append(_err("INVALID_DAY", f"days[{i}]", "day must be an object"))
                continue
            if not _finite(day.get("precipitation_mm")) or float(day["precipitation_mm"]) < 0:
                errors.append(_err("INVALID_PRECIP", f"days[{i}].precipitation_mm",
                                   "precipitation_mm must be finite >= 0"))
            etc = day.get("etc_mm")
            if not _finite(etc) or float(etc) < 0:
                errors.append(_err("INVALID_ETC", f"days[{i}].etc_mm",
                                   "etc_mm must be finite >= 0"))
            for key in ("irrigation_mm", "runoff_mm"):
                if day.get(key) is not None and (not _finite(day[key]) or float(day[key]) < 0):
                    errors.append(_err("INVALID_VALUE", f"days[{i}].{key}",
                                       f"{key} must be finite >= 0"))

    return {"valid": len(errors) == 0, "errors": errors}


def compute_root_zone_water_balance(input: dict | None = None) -> Dict[str, Any]:
    """Execute the root-zone soil water balance. Never raises on bad input."""
    input = input or {}
    validation = validate_root_zone_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": ROOT_ZONE_MODEL, "errors": validation["errors"]}

    zr = float(_to_length_mm(input["root_zone_depth_mm"], "root_zone_depth_mm", []))
    tfc = float(_to_theta(input["theta_fc"], "theta_fc", []))
    twp = float(_to_theta(input["theta_wp"], "theta_wp", []))
    s0 = float(_to_length_mm(input["initial_storage_mm"], "initial_storage_mm", []))
    p = input.get("p")
    p = float(quantity_value_unit(p)[0]) if is_quantity(p) else float(p)

    s_wp = twp * zr
    s_fc = tfc * zr
    taw = s_fc - s_wp
    raw = p * taw

    storage = s0
    records: List[Dict[str, Any]] = []
    total_p = total_ro = total_i = total_et = total_excess = total_unmet = 0.0

    for i, day in enumerate(input["days"]):
        P = float(day["precipitation_mm"])
        I = float(day.get("irrigation_mm", 0.0))
        RO = float(day.get("runoff_mm", 0.0))
        ETc = float(day["etc_mm"])
        s_start = storage

        candidate = storage + P - RO + I
        excess = max(0.0, candidate - s_fc)
        after = candidate - excess
        available = max(0.0, after - s_wp)
        actual_et = min(ETc, available)
        unmet = ETc - actual_et
        final = after - actual_et
        dr = s_fc - final

        total_p += P
        total_ro += RO
        total_i += I
        total_et += actual_et
        total_excess += excess
        total_unmet += unmet
        storage = final

        records.append({
            "day_index": i,
            "date": day.get("date"),
            "precipitation_mm": _round(P),
            "irrigation_mm": _round(I),
            "runoff_mm": _round(RO),
            "etc_mm": _round(ETc),
            "actual_et_mm": _round(actual_et),
            "unmet_demand_mm": _round(unmet),
            "excess_mm": _round(excess),
            "initial_storage_mm": _round(s_start),
            "final_storage_mm": _round(final),
            "depletion_mm": _round(dr),
            "taw_mm": _round(taw),
            "raw_mm": _round(raw),
            "status": _status(dr, raw, unmet, excess),
        })

    lhs = s0 + total_p + total_i
    rhs = total_ro + total_excess + total_et + storage
    residual = lhs - rhs

    return {
        "ok": True,
        "model": ROOT_ZONE_MODEL,
        "inputs": input,
        "result": {
            "root_zone_depth_mm": _round(zr),
            "theta_fc": _round(tfc),
            "theta_wp": _round(twp),
            "wp_storage_mm": _round(s_wp),
            "fc_storage_mm": _round(s_fc),
            "taw_mm": _round(taw),
            "raw_mm": _round(raw),
            "p": _round(p),
            "initial_storage_mm": _round(s0),
            "final_storage_mm": _round(storage),
            "storage_change_mm": _round(storage - s0),
            "total_precipitation_mm": _round(total_p),
            "total_runoff_mm": _round(total_ro),
            "total_irrigation_mm": _round(total_i),
            "total_etc_mm": _round(sum(float(d["etc_mm"]) for d in input["days"])),
            "total_actual_et_mm": _round(total_et),
            "total_unmet_demand_mm": _round(total_unmet),
            "total_excess_mm": _round(total_excess),
            "final_depletion_mm": _round(s_fc - storage),
            "balance": {
                "lhs_mm": _round(lhs),
                "rhs_mm": _round(rhs),
                "residual_mm": _round(residual),
                "closes": abs(residual) <= 1e-6,
            },
            "days": records,
        },
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


def _status(dr: float, raw: float, unmet: float, excess: float) -> str:
    if unmet > EPS:
        return "unmet_demand"
    if excess > EPS:
        return "surplus"
    if dr <= EPS:
        return "at_field_capacity"
    if dr >= raw - EPS:
        return "readily_available_depleted"
    return "readily_available"


ROOT_ZONE_DEFINITION = {
    "id": ROOT_ZONE_MODEL["id"],
    "version": ROOT_ZONE_MODEL["version"],
    "domain": "soil",
    "title": "Root-zone soil water balance (FAO-56 bucket)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["m3_per_m3", "mm"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "root_zone_depth_mm", "kind": "quantity", "unit": "mm", "required": True},
        {"name": "theta_fc", "kind": "number", "unit": "m3_per_m3", "required": True},
        {"name": "theta_wp", "kind": "number", "unit": "m3_per_m3", "required": True},
        {"name": "initial_storage_mm", "kind": "quantity", "unit": "mm", "required": True},
        {"name": "p", "kind": "number", "unit": "fraction", "required": False},
        {"name": "days", "kind": "array", "required": True,
         "description": "array of {date?, precipitation_mm, irrigation_mm?, runoff_mm?, etc_mm}"},
    ],
    "outputs": [
        {"name": "taw_mm", "kind": "number", "unit": "mm"},
        {"name": "raw_mm", "kind": "number", "unit": "mm"},
        {"name": "final_storage_mm", "kind": "number", "unit": "mm"},
        {"name": "final_depletion_mm", "kind": "number", "unit": "mm"},
        {"name": "total_actual_et_mm", "kind": "number", "unit": "mm"},
        {"name": "total_excess_mm", "kind": "number", "unit": "mm"},
        {"name": "balance", "kind": "object"},
        {"name": "days", "kind": "array"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_root_zone.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}

ROOT_ZONE_CONTRACT = {
    "equation": ROOT_ZONE_MODEL["equation"],
    "units": ROOT_ZONE_MODEL["units"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "storage_bounds": {"wp_storage_mm": "theta_wp * Zr", "fc_storage_mm": "theta_fc * Zr"},
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
}