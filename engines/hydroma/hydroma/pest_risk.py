"""Pest risk: degree-day phenology & climate suitability (CLIMEX-lite).

A bounded, deterministic, stdlib-only model with two modes:

1. ``degree_day`` - accumulated growing degree days (base ``lower_threshold_c``,
   optional upper cap) from a daily series; reports the first day the
   ``required_dd`` (biofix-to-event requirement) is reached (emergence/event).

       GDD_day = max(0, (Tmax_capped + Tmin)/2 - lower_threshold)

2. ``suitability`` - a multiplicative climate suitability index in [0, 1]
   (a simplified CLIMEX-style stress product):

       f_temp = cardinal temperature response (0..1)
       f_moist = moisture suitability from a supplied soil-moisture scalar (0..1)
       suitability = f_temp * f_moist

Both are **simplified reference models**, not operational pest forecasts.
Degree-day uses the same formulation as ``hydroma.gdd``.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "PEST_RISK_MODEL",
    "PEST_RISK_DEFINITION",
    "PEST_MODES",
    "compute_pest_risk",
    "validate_pest_input",
]

ROUND_DECIMALS = 4
PEST_MODES = ("degree_day", "suitability")

PEST_RISK_MODEL = {
    "id": "eco-nojin.hydroma.pest-risk",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "GDD=max(0,(Tmax+Tmin)/2-Tbase); suitability=f_temp*f_moist",
    "units": {"temperature": "degC", "dd": "degree-day", "suitability": "dimensionless"},
    "method": "Degree-day phenology + CLIMEX-lite suitability",
}

ASSUMPTIONS = [
    "degree_day_base_supplied",
    "biofix_required_dd_supplied",
    "cardinal_temperature_response",
    "moisture_scalar_supplied",
    "multiplicative_stress_product",
]
LIMITATIONS = [
    "notValidated",
    "not_operational_forecast",
    "no_species_specific_calibration",
    "no_dispersal_or_host_mapping",
    "simplified_suitability",
]
REFERENCES = [
    "Campbell, K.G., Hu, G. (1981). A model of the growth and development of cereal aphids. Ann. Appl. Biol.",
    "Sutherst, R.W., Maywald, G.F. (1985). A computerised system for matching climates in ecology (CLIMEX). J. Biogeography.",
    "Baskin, J.M., Baskin, W.E. (1986). The use of degree-day models in seed germination research. Weed Science.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _temp_response(t: float, tmin: float, topt: float, tmax: float) -> float:
    if t <= tmin or t >= tmax:
        return 0.0
    if t <= topt:
        return (t - tmin) / (topt - tmin)
    return (tmax - t) / (tmax - topt)


def validate_pest_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    mode = input.get("mode", "degree_day")
    if mode not in PEST_MODES:
        errors.append({"field": "mode", "code": "INVALID_MODE",
                       "message": f"mode must be one of {PEST_MODES}"})

    if mode == "degree_day":
        days = input.get("days")
        if not isinstance(days, list) or len(days) == 0:
            errors.append({"field": "days", "code": "INVALID_DAYS"})
        else:
            for i, d in enumerate(days):
                if not isinstance(d, dict) or not _finite(d.get("tmax_c")) or not _finite(d.get("tmin_c")):
                    errors.append({"field": f"days[{i}]", "code": "INVALID_TEMP"})
                    break
                if "tcap_c" in d and d["tcap_c"] is not None and not _finite(d["tcap_c"]):
                    errors.append({"field": f"days[{i}].tcap_c", "code": "INVALID_CAP"})
                    break
        if not _finite(input.get("lower_threshold_c")):
            errors.append({"field": "lower_threshold_c", "code": "INVALID_BASE"})
        if not _finite(input.get("required_dd")) or float(input.get("required_dd", 0)) <= 0:
            errors.append({"field": "required_dd", "code": "INVALID_REQUIRED_DD"})
    else:  # suitability
        for key in ("tmean_c", "tmin_c", "topt_c", "tmax_c", "moisture_suitability"):
            if not _finite(input.get(key)):
                errors.append({"field": key, "code": "INVALID_PARAM"})
        if all(_finite(input.get(k)) for k in ("tmin_c", "topt_c", "tmax_c")):
            if not (float(input["tmin_c"]) < float(input["topt_c"]) < float(input["tmax_c"])):
                errors.append({"field": "cardinal_temps", "code": "INVALID_CARDINALS"})
        if _finite(input.get("moisture_suitability")) and not (0.0 <= float(input["moisture_suitability"]) <= 1.0):
            errors.append({"field": "moisture_suitability", "code": "INVALID_MOISTURE"})
    return {"valid": len(errors) == 0, "errors": errors}


def _degree_day(input: dict) -> dict:
    days = input["days"]
    base = float(input["lower_threshold_c"])
    required = float(input["required_dd"])

    cum = 0.0
    event_day = None
    track = []
    for i, d in enumerate(days):
        tmax = float(d["tmax_c"])
        tmin = float(d["tmin_c"])
        tcap = d.get("tcap_c")
        capped = False
        if tcap is not None and tmax > float(tcap):
            tmax = float(tcap)
            capped = True
        gdd = max(0.0, (tmax + tmin) / 2.0 - base)
        cum += gdd
        reached = cum >= required
        track.append({"day": d.get("date", i), "gdd": _round(gdd),
                      "gdd_cum": _round(cum), "capped": capped,
                      "event": reached and event_day is None})
        if reached and event_day is None:
            event_day = d.get("date", i)

    return {
        "mode": "degree_day",
        "event_day": event_day,
        "event_reached": event_day is not None,
        "total_gdd": _round(cum),
        "required_dd": _round(required),
        "track": track,
    }


def _suitability(input: dict) -> dict:
    f_temp = _temp_response(float(input["tmean_c"]), float(input["tmin_c"]),
                            float(input["topt_c"]), float(input["tmax_c"]))
    f_moist = float(input["moisture_suitability"])
    suitability = f_temp * f_moist
    if suitability >= 0.66:
        band = "high"
    elif suitability >= 0.33:
        band = "moderate"
    elif suitability > 0.0:
        band = "low"
    else:
        band = "unsuitable"
    return {
        "mode": "suitability",
        "f_temp": _round(f_temp),
        "f_moist": _round(f_moist),
        "suitability": _round(suitability),
        "band": band,
    }


def compute_pest_risk(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_pest_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": PEST_RISK_MODEL, "errors": validation["errors"]}

    mode = input.get("mode", "degree_day")
    result = _degree_day(input) if mode == "degree_day" else _suitability(input)
    result["mode"] = mode
    return {
        "ok": True,
        "model": PEST_RISK_MODEL,
        "inputs": {"mode": mode},
        "result": result,
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


PEST_RISK_DEFINITION = {
    "id": PEST_RISK_MODEL["id"],
    "version": PEST_RISK_MODEL["version"],
    "domain": "agriculture",
    "title": "Pest risk (degree-day phenology + CLIMEX-lite suitability)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["degC", "degree-day", "dimensionless"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "mode", "kind": "string", "required": False, "description": "degree_day (default) or suitability"},
        {"name": "days", "kind": "array", "required": False, "description": "degree_day: {date?, tmax_c, tmin_c, tcap_c?}"},
        {"name": "lower_threshold_c", "kind": "number", "required": False},
        {"name": "required_dd", "kind": "number", "required": False},
        {"name": "tmean_c", "kind": "number", "required": False, "description": "suitability"},
        {"name": "tmin_c", "kind": "number", "required": False},
        {"name": "topt_c", "kind": "number", "required": False},
        {"name": "tmax_c", "kind": "number", "required": False},
        {"name": "moisture_suitability", "kind": "number", "required": False},
    ],
    "outputs": [
        {"name": "event_day", "kind": "string"},
        {"name": "suitability", "kind": "number", "unit": "dimensionless"},
        {"name": "band", "kind": "string"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_pest_risk.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}