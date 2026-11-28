"""Chilling accumulation & bloom timing for temperate crops.

A bounded, deterministic, stdlib-only model with three capabilities:

1. **Chilling Hours** - count of hours within ``[0, 7.2]`` degC
   (Weinberger 1950; Richardson et al. 1974).
2. **Utah Chill Units** - weighted hourly chill units (Richardson et al. 1974):

       T <= 1.4            -> 0.0
       1.4 < T <= 2.4      -> 0.5
       2.4 < T <= 9.1      -> 1.0
       9.1 < T <= 12.4     -> 0.5
       12.4 < T <= 15.9    -> 0.0
       15.9 < T <= 18.0    -> -0.5
       T > 18.0            -> -1.0

3. **Bloom timing** - first day the accumulated chilling requirement is met
   **and** accumulated growing degree days (GDD, base ``tbase``) reach
   ``bloom_gdd`` (a simplified sequential chill-then-heat phenology model).

Software-tested; **NOT scientifically validated**. Chill portion / Dynamic
Model is intentionally not implemented.
"""

from __future__ import annotations

import math

__all__ = [
    "CHILLING_MODEL",
    "CHILLING_DEFINITION",
    "compute_chilling",
    "estimate_bloom",
    "chilling_adapter",
    "validate_chilling_input",
    "validate_bloom_input",
    "utah_chill_unit",
]

ROUND_DECIMALS = 4
CHILL_MIN_C = 0.0
CHILL_MAX_C = 7.2

CHILLING_MODEL = {
    "id": "eco-nojin.hydroma.chilling",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "chilling_hours = count(0<=T<=7.2); utah = sum(unit(T))",
    "units": {"temperature": "degC", "chill": "chill_unit"},
    "method": "Chilling Hours + Utah Chill Units (Richardson 1974)",
}

ASSUMPTIONS = [
    "hourly_temperature_input",
    "chilling_hours_range_0_to_7_2",
    "utah_weight_table",
    "bloom_chill_then_heat",
    "gdd_base_supplied",
]
LIMITATIONS = [
    "notValidated",
    "no_chill_portions_dynamic_model",
    "no_cultivar_specific_calibration",
    "simplified_sequential_phenology",
]
REFERENCES = [
    "Weinberger, J.H. (1950). Chilling requirements of peach varieties. Proc. ASHS 56.",
    "Richardson, H., Roberts, S., Cocke, J. (1974). A mobile chilling unit for dormancy research. HortScience 9.",
    "Luedeling, B., Brown, P.H. (2011). A global analysis of the comparability of winter chill models. New Phytologist 190.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def utah_chill_unit(t_c: float) -> float:
    """Utah chill-unit weight for one hour at temperature ``t_c`` (degC)."""
    if t_c <= 1.4:
        return 0.0
    if t_c <= 2.4:
        return 0.5
    if t_c <= 9.1:
        return 1.0
    if t_c <= 12.4:
        return 0.5
    if t_c <= 15.9:
        return 0.0
    if t_c <= 18.0:
        return -0.5
    return -1.0


def validate_chilling_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    temps = input.get("temperatures_c")
    if not isinstance(temps, list) or len(temps) == 0:
        errors.append({"field": "temperatures_c", "code": "INVALID_TEMPS",
                       "message": "temperatures_c must be a non-empty list"})
    else:
        for i, t in enumerate(temps):
            if not _finite(t):
                errors.append({"field": f"temperatures_c[{i}]", "code": "NON_FINITE"})
                break
    return {"valid": len(errors) == 0, "errors": errors}


def compute_chilling(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_chilling_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": CHILLING_MODEL, "errors": validation["errors"]}

    temps = [float(t) for t in input["temperatures_c"]]
    hours = sum(1 for t in temps if CHILL_MIN_C <= t <= CHILL_MAX_C)
    utah = sum(utah_chill_unit(t) for t in temps)

    return {
        "ok": True,
        "model": CHILLING_MODEL,
        "inputs": {"hours": len(temps)},
        "result": {
            "hours": len(temps),
            "chilling_hours": hours,
            "utah_chill_units": _round(utah),
            "mean_temp_c": _round(sum(temps) / len(temps)),
        },
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


def validate_bloom_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    days = input.get("days")
    if not isinstance(days, list) or len(days) == 0:
        errors.append({"field": "days", "code": "INVALID_DAYS"})
    else:
        for i, d in enumerate(days):
            if not isinstance(d, dict):
                errors.append({"field": f"days[{i}]", "code": "INVALID_DAY"})
                break
            if not _finite(d.get("tmax_c")) or not _finite(d.get("tmin_c")):
                errors.append({"field": f"days[{i}]", "code": "INVALID_TEMP"})
                break
    for key in ("chilling_requirement", "bloom_gdd", "tbase_c"):
        if not _finite(input.get(key)):
            errors.append({"field": key, "code": "INVALID_PARAM",
                           "message": f"{key} must be a finite number"})
    return {"valid": len(errors) == 0, "errors": errors}


def estimate_bloom(input: dict | None = None) -> dict:
    """Simplified chill-then-heat bloom model over a daily series.

    Each day: accumulate Utah chill units from the daily mean temperature
    (a documented approximation of hourly chilling) and GDD from ``tmax/tmin``.
    Bloom is the first day where cumulative chill >= requirement AND
    cumulative GDD >= bloom_gdd.
    """
    input = input or {}
    validation = validate_bloom_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": CHILLING_MODEL, "errors": validation["errors"]}

    days = input["days"]
    req = float(input["chilling_requirement"])
    bloom_gdd = float(input["bloom_gdd"])
    tbase = float(input["tbase_c"])

    chill = 0.0
    gdd = 0.0
    bloom_day = None
    track = []
    for i, d in enumerate(days):
        tmax = float(d["tmax_c"])
        tmin = float(d["tmin_c"])
        tmean = (tmax + tmin) / 2.0
        chill += utah_chill_unit(tmean)
        gdd += max(0.0, (tmax + tmin) / 2.0 - tbase)
        met = chill >= req and gdd >= bloom_gdd
        track.append({
            "day": d.get("date", i),
            "chill_cum": _round(chill),
            "gdd_cum": _round(gdd),
            "bloom": met and bloom_day is None,
        })
        if met and bloom_day is None:
            bloom_day = d.get("date", i)

    return {
        "ok": True,
        "model": CHILLING_MODEL,
        "inputs": {"days": len(days), "chilling_requirement": req,
                   "bloom_gdd": bloom_gdd, "tbase_c": tbase},
        "result": {
            "bloom_day": bloom_day,
            "bloom_reached": bloom_day is not None,
            "total_chill": _round(chill),
            "total_gdd": _round(gdd),
            "track": track,
        },
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


def chilling_adapter(input: dict | None = None) -> dict:
    """Dispatch to compute_chilling or estimate_bloom based on the input shape.

    The registered executor receives a single dict. Presence of ``days`` selects
    the bloom path; otherwise the chilling-hours path is used.
    """
    input = input or {}
    if "days" in input:
        return estimate_bloom(input)
    return compute_chilling(input)


CHILLING_DEFINITION = {
    "id": CHILLING_MODEL["id"],
    "version": CHILLING_MODEL["version"],
    "domain": "agriculture",
    "title": "Chilling accumulation & bloom timing",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["degC", "chill_unit", "degree-day"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "temperatures_c", "kind": "array", "required": False,
         "description": "hourly temperatures for compute_chilling"},
        {"name": "days", "kind": "array", "required": False,
         "description": "daily {date?, tmax_c, tmin_c} for estimate_bloom"},
        {"name": "chilling_requirement", "kind": "number", "required": False},
        {"name": "bloom_gdd", "kind": "number", "required": False},
        {"name": "tbase_c", "kind": "number", "required": False},
    ],
    "outputs": [
        {"name": "chilling_hours", "kind": "number", "unit": "chill_unit"},
        {"name": "utah_chill_units", "kind": "number", "unit": "chill_unit"},
        {"name": "bloom_day", "kind": "string"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_chilling.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}