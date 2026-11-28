"""Water productivity, agro-ecological zoning & water scarcity.

Three bounded, deterministic, stdlib-only models (single registered model that
dispatches on ``method``):

1. **Water productivity** (IWMI / FAO):

       WP = Yield / ET      [kg/m3]   (Yield kg/ha, ET mm; 1 mm·ha = 10 m3)

2. **Agro-ecological zone (AEZ-lite)** (FAO 1978) - length of growing period
   (LGP) from a daily water balance where ``P >= 0.5 * PET``; LGP class.

3. **Water scarcity index** - withdrawal / (availability − environmental flow),
   with a scarcity class (distinct thresholds from SDG 6.4.2 stress).

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "WATER_PRODUCTIVITY_MODEL",
    "WATER_PRODUCTIVITY_DEFINITION",
    "compute_water_productivity",
    "compute_aez",
    "compute_water_scarcity",
    "water_productivity_adapter",
    "validate_wp_input",
]

ROUND_DECIMALS = 4

WATER_PRODUCTIVITY_MODEL = {
    "id": "eco-nojin.hydroma.water-productivity",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "WP=Yield/ET; LGP=days(P>=0.5PET); scarcity=W/(Avail-EFR)",
    "units": {"wp": "kg/m3", "lgp": "day", "scarcity": "dimensionless"},
    "method": "WP + AEZ-lite + water scarcity",
}

ASSUMPTIONS = [
    "mm_ha_to_m3_factor_10",
    "aez_half_pet_threshold",
    "environmental_flow_fraction",
    "scarcity_thresholds",
]
LIMITATIONS = [
    "notValidated",
    "aez_lite_no_soil",
    "scarcity_indicative",
    "single_point_estimate",
]
REFERENCES = [
    "Molden, D., et al. (2009). Improving agricultural water productivity. IWMI.",
    "FAO (1978). Report on the Agro-Ecological Zones Project. FAO World Soil Resources Report 48.",
    "FAO (2007). Coping with water scarcity. FAO.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def validate_wp_input(input: dict | None = None) -> dict:
    input = input or {}
    method = input.get("method", "wp")
    errors: list = []
    if method == "wp":
        if not _finite(input.get("yield_kg_ha")) or float(input.get("yield_kg_ha", -1)) < 0:
            errors.append({"field": "yield_kg_ha", "code": "INVALID"})
        if not _finite(input.get("et_mm")) or float(input.get("et_mm", 0)) <= 0:
            errors.append({"field": "et_mm", "code": "INVALID"})
    elif method == "aez":
        p = input.get("precipitation_series")
        pet = input.get("pet_series")
        if not isinstance(p, list) or not isinstance(pet, list) or len(p) != len(pet) or len(p) == 0:
            errors.append({"field": "series", "code": "INVALID"})
    elif method == "scarcity":
        for key in ("withdrawal", "availability"):
            if not _finite(input.get(key)) or float(input.get(key, -1)) < 0:
                errors.append({"field": key, "code": "INVALID"})
        if _finite(input.get("availability")) and float(input["availability"]) <= 0:
            errors.append({"field": "availability", "code": "NONPOSITIVE"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_water_productivity(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_wp_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": WATER_PRODUCTIVITY_MODEL, "errors": validation["errors"]}
    y = float(input["yield_kg_ha"])
    et = float(input["et_mm"])
    wp = y / (et * 10.0)
    return {
        "ok": True, "model": WATER_PRODUCTIVITY_MODEL,
        "result": {"method": "water productivity", "yield_kg_ha": _round(y),
                   "et_mm": _round(et), "water_productivity_kg_m3": _round(wp)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_aez(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_wp_input({**input, "method": "aez"})
    if not validation["valid"]:
        return {"ok": False, "model": WATER_PRODUCTIVITY_MODEL, "errors": validation["errors"]}
    p = [float(v) for v in input["precipitation_series"]]
    pet = [float(v) for v in input["pet_series"]]
    growing = sum(1 for i in range(len(p)) if p[i] >= 0.5 * pet[i])
    n = len(p)
    if growing < 30:
        cls = "arid"
    elif growing < 90:
        cls = "semi_arid"
    elif growing < 180:
        cls = "sub_humid"
    elif growing < 270:
        cls = "humid"
    else:
        cls = "per_humid"
    return {
        "ok": True, "model": WATER_PRODUCTIVITY_MODEL,
        "result": {"method": "AEZ-lite (LGP)", "days": n,
                   "length_of_growing_period_days": growing,
                   "growing_fraction": _round(growing / n), "zone": cls},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_water_scarcity(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_wp_input({**input, "method": "scarcity"})
    if not validation["valid"]:
        return {"ok": False, "model": WATER_PRODUCTIVITY_MODEL, "errors": validation["errors"]}
    w = float(input["withdrawal"])
    avail = float(input["availability"])
    efr = float(input.get("environmental_flow_fraction", 0.3))
    effective = avail * (1.0 - efr)
    if effective <= 0:
        return {"ok": False, "model": WATER_PRODUCTIVITY_MODEL,
                "errors": [{"field": "availability", "code": "NO_EFFECTIVE_WATER"}]}
    scarcity = w / effective
    if scarcity < 0.2:
        cls = "low"
    elif scarcity < 0.4:
        cls = "moderate"
    elif scarcity < 0.7:
        cls = "high"
    else:
        cls = "severe"
    return {
        "ok": True, "model": WATER_PRODUCTIVITY_MODEL,
        "result": {"method": "water scarcity index", "withdrawal": _round(w),
                   "availability": _round(avail), "effective_water": _round(effective),
                   "scarcity_index": _round(scarcity), "class": cls},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def water_productivity_adapter(input: dict | None = None) -> dict:
    input = input or {}
    method = input.get("method", "wp")
    if method == "aez":
        return compute_aez(input)
    if method == "scarcity":
        return compute_water_scarcity(input)
    return compute_water_productivity(input)


WATER_PRODUCTIVITY_DEFINITION = {
    "id": WATER_PRODUCTIVITY_MODEL["id"],
    "version": WATER_PRODUCTIVITY_MODEL["version"],
    "domain": "water",
    "title": "Water productivity + AEZ-lite + water scarcity",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["kg/m3", "day", "dimensionless"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "method", "kind": "string", "required": False, "description": "wp (default) | aez | scarcity"},
        {"name": "yield_kg_ha", "kind": "number", "required": False},
        {"name": "et_mm", "kind": "number", "required": False},
        {"name": "precipitation_series", "kind": "array", "required": False},
        {"name": "pet_series", "kind": "array", "required": False},
        {"name": "withdrawal", "kind": "number", "required": False},
        {"name": "availability", "kind": "number", "required": False},
        {"name": "environmental_flow_fraction", "kind": "number", "required": False},
    ],
    "outputs": [
        {"name": "water_productivity_kg_m3", "kind": "number"},
        {"name": "length_of_growing_period_days", "kind": "number"},
        {"name": "scarcity_index", "kind": "number"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_water_productivity.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}