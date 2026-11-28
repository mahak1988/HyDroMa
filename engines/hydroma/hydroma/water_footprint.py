"""Water footprint (Hoekstra) & SDG 6.4 indicators.

Two bounded, deterministic, stdlib-only models:

1. **Water footprint** (Hoekstra & Chapagain 2008):

       WF_green [m3/ton] = (ET_green * 10) / Yield        (ET mm, Yield ton/ha)
       WF_blue  [m3/ton] = (ET_blue  * 10) / Yield
       WF_grey  [m3/ton] = (Load / (c_max - c_nat)) / Yield
       WF_total = green + blue + grey

   (1 mm over 1 ha = 10 m3.)

2. **SDG 6.4.2 water stress** (UN):

       stress = withdrawal / renewable_resources * 100   [%]
       level  = no stress <25 | low 25-50 | medium 50-75 | high 75-100 | critical >100

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "WATER_FOOTPRINT_MODEL",
    "WATER_FOOTPRINT_DEFINITION",
    "SDG_WATER_STRESS_MODEL",
    "SDG_WATER_STRESS_DEFINITION",
    "compute_water_footprint",
    "compute_sdg_water_stress",
    "validate_water_footprint_input",
    "validate_sdg_water_stress_input",
]

ROUND_DECIMALS = 4

WATER_FOOTPRINT_MODEL = {
    "id": "eco-nojin.hydroma.water-footprint",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "WF=(ET*10)/Yield; WF_grey=(Load/(cmax-cnat))/Yield",
    "units": {"wf": "m3/ton", "et": "mm"},
    "method": "Hoekstra water footprint (green/blue/grey)",
}

SDG_WATER_STRESS_MODEL = {
    "id": "eco-nojin.hydroma.sdg-water-stress",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "stress=withdrawal/renewable*100",
    "units": {"stress": "%"},
    "method": "SDG 6.4.2 water stress",
}

ASSUMPTIONS = [
    "mm_to_m3_factor_10",
    "grey_dilution_factor",
    "yield_required",
    "withdrawal_and_renewable_supplied",
]
LIMITATIONS = [
    "notValidated",
    "no_temporal_hydro_year",
    "grey_uses_single_pollutant",
    "stress_threshold_ indicative",
]
REFERENCES = [
    "Hoekstra, A.Y., Chapagain, A.K. (2008). Globalization of Water. Blackwell.",
    "UN SDG indicator 6.4.2 (2020). Water stress. UNEP-DHI.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def validate_water_footprint_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    for key in ("et_green_mm", "et_blue_mm", "yield_t_ha"):
        if not _finite(input.get(key)) or float(input.get(key, -1)) < 0:
            errors.append({"field": key, "code": "INVALID"})
    if _finite(input.get("yield_t_ha")) and float(input["yield_t_ha"]) <= 0:
        errors.append({"field": "yield_t_ha", "code": "NONPOSITIVE"})
    if "pollutant_load_kg" in input and input["pollutant_load_kg"] is not None:
        for key in ("pollutant_load_kg", "c_max", "c_nat"):
            if not _finite(input.get(key)):
                errors.append({"field": key, "code": "INVALID"})
        if _finite(input.get("c_max")) and _finite(input.get("c_nat")) and float(input["c_max"]) <= float(input["c_nat"]):
            errors.append({"field": "c_max", "code": "CMAX_LE_CNAT"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_water_footprint(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_water_footprint_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": WATER_FOOTPRINT_MODEL, "errors": validation["errors"]}

    et_g = float(input["et_green_mm"])
    et_b = float(input["et_blue_mm"])
    y = float(input["yield_t_ha"])

    wf_green = (et_g * 10.0) / y
    wf_blue = (et_b * 10.0) / y
    wf_grey = 0.0
    if input.get("pollutant_load_kg") is not None:
        load = float(input["pollutant_load_kg"])
        cmax = float(input["c_max"])
        cnat = float(input["c_nat"])
        # dilution volume (m3) = load / (cmax - cnat); load kg ~ 1e6 mg, conc mg/L
        wf_grey = (load * 1.0e6 / (cmax - cnat)) / y
    total = wf_green + wf_blue + wf_grey
    return {
        "ok": True, "model": WATER_FOOTPRINT_MODEL,
        "result": {"et_green_mm": _round(et_g), "et_blue_mm": _round(et_b),
                   "yield_t_ha": _round(y),
                   "wf_green_m3_ton": _round(wf_green),
                   "wf_blue_m3_ton": _round(wf_blue),
                   "wf_grey_m3_ton": _round(wf_grey),
                   "wf_total_m3_ton": _round(total)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def validate_sdg_water_stress_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    for key in ("withdrawal", "renewable_resources"):
        if not _finite(input.get(key)) or float(input.get(key, -1)) < 0:
            errors.append({"field": key, "code": "INVALID"})
    if _finite(input.get("renewable_resources")) and float(input["renewable_resources"]) <= 0:
        errors.append({"field": "renewable_resources", "code": "NONPOSITIVE"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_sdg_water_stress(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_sdg_water_stress_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": SDG_WATER_STRESS_MODEL, "errors": validation["errors"]}

    w = float(input["withdrawal"])
    r = float(input["renewable_resources"])
    stress = w / r * 100.0
    if stress < 25:
        level = "no_stress"
    elif stress < 50:
        level = "low"
    elif stress < 75:
        level = "medium"
    elif stress <= 100:
        level = "high"
    else:
        level = "critical"
    return {
        "ok": True, "model": SDG_WATER_STRESS_MODEL,
        "result": {"withdrawal": _round(w), "renewable_resources": _round(r),
                   "water_stress_pct": _round(stress), "level": level},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


WATER_FOOTPRINT_DEFINITION = {
    "id": WATER_FOOTPRINT_MODEL["id"],
    "version": WATER_FOOTPRINT_MODEL["version"],
    "domain": "water",
    "title": "Water footprint (green/blue/grey)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["m3/ton", "mm"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "et_green_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "et_blue_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "yield_t_ha", "kind": "number", "unit": "t/ha", "required": True},
        {"name": "pollutant_load_kg", "kind": "number", "required": False},
        {"name": "c_max", "kind": "number", "required": False},
        {"name": "c_nat", "kind": "number", "required": False},
    ],
    "outputs": [
        {"name": "wf_total_m3_ton", "kind": "number", "unit": "m3/ton"},
        {"name": "wf_green_m3_ton", "kind": "number", "unit": "m3/ton"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_water_footprint.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}

SDG_WATER_STRESS_DEFINITION = {
    "id": SDG_WATER_STRESS_MODEL["id"],
    "version": SDG_WATER_STRESS_MODEL["version"],
    "domain": "water",
    "title": "SDG 6.4.2 water stress",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["%"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "withdrawal", "kind": "number", "required": True},
        {"name": "renewable_resources", "kind": "number", "required": True},
    ],
    "outputs": [
        {"name": "water_stress_pct", "kind": "number", "unit": "%"},
        {"name": "level", "kind": "string"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_water_footprint.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}