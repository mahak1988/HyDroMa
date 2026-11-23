"""Daily root-zone soil water accounting (crop-neutral tipping bucket).

A deterministic, daily water-balance model over an explicit root-zone storage
domain. It extends :mod:`hydroma.soil_water` (profile / TAW / RAW) toward
multi-day simulation. It is a SIMPLIFIED accounting model, not a Richards-equation
or layered-physics solver.

Conservation (per day), with all terms in mm over the root zone:

    candidate = storage_start + precipitation + irrigation - runoff - et_actual
    excess    = max(0, candidate - fc_storage)          # above field capacity -> drainage
    storage_next = candidate - excess                    # (<= fc_storage)

so that:  storage_start + precipitation + irrigation
        = runoff + et_actual + excess + storage_next     (exact conservation)

Excess above field capacity is removed as "drainage". This is a documented
model assumption (a bucket rule), NOT a validated drainage/infiltration process.
Storage is never clamped: if `et_actual + runoff` exceed available water,
`storage_next` may go negative (unmet demand / invalid supplied ET) and is flagged
(``below_zero``), not silently corrected.

Units: water content m3/m3, thickness mm, all storages/fluxes mm (per unit area).

Crop-neutral: `et_actual` is SUPPLIED, never inferred from ET0. ET0/crop coefficients
are out of scope for this model. It does not model Richards, conductivity,
redistribution, capillary rise, groundwater, evaporation/transpiration partitioning,
crop growth or yield, or validated runoff/drainage.

Software-tested; NOT scientifically validated.
"""

from __future__ import annotations

import math

__all__ = [
    "DAILY_SOIL_WATER_MODEL",
    "DAILY_SOIL_WATER_DEFINITION",
    "DAILY_SOIL_WATER_CONTRACT",
    "validate_daily_soil_water_input",
    "simulate_daily_soil_water",
]

ROUND_DECIMALS = 4
EPS = 1e-9

DAILY_SOIL_WATER_MODEL = {
    "id": "eco-nojin.hydroma.daily-soil-water",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "candidate = S + P + I - RO - ETa; excess = max(0, candidate - S_fc); S_next = candidate - excess",
    "units": {"water_content": "m3_per_m3", "thickness": "mm", "flux": "mm"},
}

ASSUMPTIONS = [
    "crop_neutral_et_actual_supplied",
    "bucket_excess_above_field_capacity_is_drainage",
    "no_clamping_negative_storage_flagged",
    "per_unit_area_root_zone",
    "layers_contiguous_from_surface",
    "p_is_fao56_depletion_fraction",
]
LIMITATIONS = [
    "notValidated",
    "simplified_accounting_not_richards",
    "no_unsaturated_conductivity",
    "no_dynamic_infiltration",
    "no_capillary_rise",
    "no_groundwater",
    "no_interlayer_redistribution",
    "no_evaporation_transpiration_partitioning",
    "no_crop_growth_or_yield",
    "no_validated_drainage_or_runoff",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). FAO Irrigation and Drainage Paper 56, Chapter 5 (soil water balance, TAW, RAW, depletion fraction p).",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _nonneg(value) -> bool:
    return _finite(value) and float(value) >= 0


def _validate_layers(layers, errors: list) -> bool:
    if not isinstance(layers, list) or len(layers) == 0:
        errors.append({"field": "layers", "code": "EMPTY_LAYERS", "message": "layers must be a non-empty array"})
        return False
    ok = True
    for i, layer in enumerate(layers):
        if not isinstance(layer, dict):
            errors.append({"layer": i, "code": "INVALID_LAYER", "message": "layer must be an object"})
            ok = False
            continue
        dz = layer.get("thickness_mm")
        if not _finite(dz) or float(dz) <= 0:
            errors.append({"layer": i, "field": "thickness_mm", "code": "INVALID_THICKNESS"})
            ok = False
        tfc = layer.get("theta_fc")
        twp = layer.get("theta_wp")
        if not _finite(tfc) or not (0.0 <= float(tfc) <= 1.0):
            errors.append({"layer": i, "field": "theta_fc", "code": "INVALID_THETA"})
            ok = False
        if not _finite(twp) or not (0.0 <= float(twp) <= 1.0):
            errors.append({"layer": i, "field": "theta_wp", "code": "INVALID_THETA"})
            ok = False
        if _finite(tfc) and _finite(twp) and float(tfc) <= float(twp):
            errors.append({"layer": i, "field": "theta_fc", "code": "THETA_FC_MUST_EXCEED_WP"})
            ok = False
    return ok


def validate_daily_soil_water_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []

    if not _validate_layers(input.get("layers"), errors):
        return {"valid": False, "errors": errors}

    if "initial_storage_mm" not in input or input.get("initial_storage_mm") is None:
        errors.append({"field": "initial_storage_mm", "code": "MISSING_INITIAL",
                       "message": "initial_storage_mm is required (no default)"})
    elif not _nonneg(input.get("initial_storage_mm")):
        errors.append({"field": "initial_storage_mm", "code": "INVALID_INITIAL",
                       "message": "initial_storage_mm must be a finite number >= 0"})

    days = input.get("days")
    if not isinstance(days, list) or len(days) == 0:
        errors.append({"field": "days", "code": "EMPTY_DAYS", "message": "days must be a non-empty array"})
    else:
        for i, day in enumerate(days):
            if not isinstance(day, dict):
                errors.append({"day": i, "code": "INVALID_DAY", "message": "day must be an object"})
                continue
            if not _nonneg(day.get("precipitation_mm")):
                errors.append({"day": i, "field": "precipitation_mm", "code": "NEGATIVE_PRECIP" if _finite(day.get("precipitation_mm")) else "NON_FINITE"})
            if not _nonneg(day.get("irrigation_mm")):
                errors.append({"day": i, "field": "irrigation_mm", "code": "NEGATIVE_IRRIGATION" if _finite(day.get("irrigation_mm")) else "NON_FINITE"})
            if not _nonneg(day.get("et_actual_mm")):
                errors.append({"day": i, "field": "et_actual_mm", "code": "NEGATIVE_ET" if _finite(day.get("et_actual_mm")) else "NON_FINITE"})
            if "runoff_mm" in day and day.get("runoff_mm") is not None and not _nonneg(day.get("runoff_mm")):
                errors.append({"day": i, "field": "runoff_mm", "code": "NEGATIVE_RUNOFF" if _finite(day.get("runoff_mm")) else "NON_FINITE"})
            if "date" in day and day.get("date") is not None and not isinstance(day.get("date"), str):
                errors.append({"day": i, "field": "date", "code": "INVALID_DATE", "message": "date must be a string"})

    p = input.get("p")
    if p is not None and (not _finite(p) or not (0.0 < float(p) <= 1.0)):
        errors.append({"field": "p", "code": "INVALID_P", "message": "p must be in (0, 1]"})

    return {"valid": len(errors) == 0, "errors": errors}


def simulate_daily_soil_water(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_daily_soil_water_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": DAILY_SOIL_WATER_MODEL, "errors": validation["errors"]}

    layers = input["layers"]
    p = input.get("p")

    root_zone_depth = 0.0
    wp_storage = 0.0
    fc_storage = 0.0
    for layer in layers:
        dz = float(layer["thickness_mm"])
        root_zone_depth += dz
        wp_storage += float(layer["theta_wp"]) * dz
        fc_storage += float(layer["theta_fc"]) * dz
    taw = fc_storage - wp_storage
    raw_threshold = (float(p) * taw) if (p is not None) else None

    storage = float(input["initial_storage_mm"])
    initial_storage = storage
    total_p = total_i = total_ro = total_et = total_excess = 0.0
    min_storage = storage
    day_results = []
    all_warnings: set = set()

    for idx, day in enumerate(input["days"]):
        start = storage
        precip = float(day["precipitation_mm"])
        irrigation = float(day["irrigation_mm"])
        runoff = float(day["runoff_mm"]) if day.get("runoff_mm") is not None else 0.0
        et = float(day["et_actual_mm"])

        candidate = start + precip + irrigation - runoff - et
        excess = max(0.0, candidate - fc_storage)
        final = candidate - excess
        depletion = fc_storage - final
        depletion_fraction = (depletion / taw) if taw > EPS else None
        stress = (raw_threshold is not None and depletion > raw_threshold)

        day_warnings = []
        if final < 0:
            status = "below_zero"
            day_warnings.append("BELOW_ZERO")
        elif final <= wp_storage + EPS:
            status = "at_or_below_wilting_point"
            day_warnings.append("BELOW_WILTING_POINT")
        elif final >= fc_storage - EPS:
            status = "at_field_capacity"
            if excess > EPS:
                day_warnings.append("EXCESS_WATER")
        elif raw_threshold is not None and depletion > raw_threshold:
            status = "stressed"
        else:
            status = "readily_available"

        all_warnings.update(day_warnings)
        total_p += precip
        total_i += irrigation
        total_ro += runoff
        total_et += et
        total_excess += excess
        min_storage = min(min_storage, final)
        storage = final

        day_results.append({
            "day_index": idx,
            "date": day.get("date"),
            "initial_storage_mm": _round(start),
            "precipitation_mm": _round(precip),
            "irrigation_mm": _round(irrigation),
            "runoff_mm": _round(runoff),
            "et_actual_mm": _round(et),
            "excess_mm": _round(excess),
            "final_storage_mm": _round(final),
            "depletion_mm": _round(depletion),
            "taw_mm": _round(taw),
            "raw_mm": _round(raw_threshold) if raw_threshold is not None else None,
            "depletion_fraction": _round(depletion_fraction, 4) if depletion_fraction is not None else None,
            "stress": bool(stress) if raw_threshold is not None else None,
            "status": status,
            "warnings": day_warnings,
        })

    return {
        "ok": True,
        "model": DAILY_SOIL_WATER_MODEL,
        "inputs": {"layers": layers, "p": p, "initial_storage_mm": input["initial_storage_mm"],
                   "days": input["days"]},
        "result": {
            "root_zone_depth_mm": _round(root_zone_depth),
            "wp_storage_mm": _round(wp_storage),
            "fc_storage_mm": _round(fc_storage),
            "taw_mm": _round(taw),
            "raw_mm": _round(raw_threshold) if raw_threshold is not None else None,
            "initial_storage_mm": _round(initial_storage),
            "final_storage_mm": _round(storage),
            "total_precip_mm": _round(total_p),
            "total_irrigation_mm": _round(total_i),
            "total_runoff_mm": _round(total_ro),
            "total_et_mm": _round(total_et),
            "total_excess_mm": _round(total_excess),
            "min_storage_mm": _round(min_storage),
            "days": day_results,
        },
        "warnings": [{"code": c} for c in sorted(all_warnings)],
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


DAILY_SOIL_WATER_DEFINITION = {
    "id": DAILY_SOIL_WATER_MODEL["id"],
    "version": DAILY_SOIL_WATER_MODEL["version"],
    "domain": "soil",
    "title": "Daily root-zone water dynamics (crop-neutral accounting)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["m3_per_m3", "mm"],
    "parameters": ["layers", "p"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "layers", "kind": "array", "required": True,
         "description": "array of {thickness_mm, theta_fc, theta_wp}"},
        {"name": "initial_storage_mm", "kind": "number", "unit": "mm", "required": True,
         "description": "required initial root-zone storage (no default)"},
        {"name": "days", "kind": "array", "required": True,
         "description": "array of {date?, precipitation_mm, irrigation_mm, runoff_mm?, et_actual_mm}"},
        {"name": "p", "kind": "number", "unit": "fraction", "required": False,
         "description": "FAO-56 depletion fraction (0 < p <= 1); RAW/stress only if given"},
    ],
    "outputs": [
        {"name": "final_storage_mm", "kind": "number", "unit": "mm"},
        {"name": "total_excess_mm", "kind": "number", "unit": "mm"},
        {"name": "taw_mm", "kind": "number", "unit": "mm"},
        {"name": "days", "kind": "array"},
        {"name": "min_storage_mm", "kind": "number", "unit": "mm"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [
            {"kind": "unit_test", "status": "pass",
             "reference": "tests/test_daily_soil_water.py",
             "notes": "software + independent hand-derived vectors; not scientific validation"},
        ],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}

DAILY_SOIL_WATER_CONTRACT = {
    "equation": DAILY_SOIL_WATER_MODEL["equation"],
    "conservation": "storage_start + P + I = runoff + et_actual + excess + storage_next",
    "units": DAILY_SOIL_WATER_MODEL["units"],
    "excess_rule": "excess = max(0, candidate - fc_storage); removed as drainage (documented assumption)",
    "error_codes": ["EMPTY_LAYERS", "INVALID_LAYER", "INVALID_THICKNESS", "INVALID_THETA",
                    "THETA_FC_MUST_EXCEED_WP", "MISSING_INITIAL", "INVALID_INITIAL",
                    "EMPTY_DAYS", "INVALID_DAY", "NEGATIVE_PRECIP", "NEGATIVE_IRRIGATION",
                    "NEGATIVE_ET", "NEGATIVE_RUNOFF", "NON_FINITE", "INVALID_DATE", "INVALID_P"],
    "warning_codes": ["EXCESS_WATER", "BELOW_WILTING_POINT", "BELOW_ZERO"],
    "status_values": ["at_field_capacity", "readily_available", "stressed",
                      "at_or_below_wilting_point", "below_zero"],
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
}