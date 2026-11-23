"""Effective precipitation (SCS Curve Number) & preliminary crop water balance.

Two bounded, deterministic, HTTP-free models:

1. ``compute_effective_precipitation`` - effective precipitation from total
   precipitation using the USDA Soil Conservation Service (SCS) Curve Number
   runoff method (SCS 1972; Chow, Maidment & Mays 1988):

       S  = 25400 / CN - 254            [mm]   (potential maximum retention)
       Ia = 0.2 * S                     [mm]   (initial abstraction)
       RO = (P - Ia)^2 / (P + 0.8*S)    [mm]   if P > Ia else 0
       Pe = P - RO                      [mm]   (effective precipitation)

   Requires an explicit Curve Number (0 < CN <= 100). CN is NOT inferred from
   soil/crop; if absent -> INVALID_CN.

2. ``compute_preliminary_water_balance`` - a preliminary accounting result:

       balance = effective_precipitation - ETc

   Sign convention: > 0 preliminary surplus, 0 balanced, < 0 preliminary deficit.
   This is NOT root-zone storage, NOT an irrigation requirement, NOT actual ET.

Both are software-tested; NOT scientifically validated.
"""

from __future__ import annotations

import math

__all__ = [
    "EFFECTIVE_PRECIP_MODEL",
    "EFFECTIVE_PRECIP_DEFINITION",
    "WATER_BALANCE_PRELIM_MODEL",
    "WATER_BALANCE_PRELIM_DEFINITION",
    "compute_effective_precipitation",
    "compute_preliminary_water_balance",
    "validate_effective_precip_input",
    "validate_preliminary_balance_input",
]

ROUND_DECIMALS = 4
VALID_PERIODS = ("day", "period")

EFFECTIVE_PRECIP_MODEL = {
    "id": "eco-nojin.hydroma.effective-precipitation",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "Pe = P - RO; RO = (P-Ia)^2/(P+0.8S); S=25400/CN-254; Ia=0.2S",
    "units": {"precip": "mm", "cn": "fraction"},
    "method": "USDA-SCS Curve Number (SCS 1972)",
}

WATER_BALANCE_PRELIM_MODEL = {
    "id": "eco-nojin.hydroma.water-balance-prelim",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "balance = effective_precipitation - ETc",
    "units": {"water": "mm"},
}

ASSUMPTIONS = [
    "scs_curve_number_method",
    "cn_supplied_not_inferred",
    "daily_or_period_scale",
    "preliminary_accounting_only",
]
LIMITATIONS = [
    "notValidated",
    "not_root_zone_storage",
    "not_irrigation_requirement",
    "not_actual_et",
    "empirical_cn_method",
]
REFERENCES = [
    "USDA Soil Conservation Service (1972). Hydrology Section 4, National Engineering Handbook.",
    "Chow, V.T., Maidment, D.R., Mays, L.W. (1988). Applied Hydrology. McGraw-Hill.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def validate_effective_precip_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    p = input.get("precipitation_mm")
    if not _finite(p) or float(p) < 0:
        errors.append({"field": "precipitation_mm", "code": "INVALID_PRECIP", "message": "precipitation_mm must be finite >= 0"})
    cn = input.get("curve_number")
    if not _finite(cn) or not (0.0 < float(cn) <= 100.0):
        errors.append({"field": "curve_number", "code": "INVALID_CN", "message": "curve_number must be in (0, 100]"})
    period = input.get("period", "day")
    if period not in VALID_PERIODS:
        errors.append({"field": "period", "code": "INVALID_PERIOD"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_effective_precipitation(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_effective_precip_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": EFFECTIVE_PRECIP_MODEL, "errors": validation["errors"]}

    p = float(input["precipitation_mm"])
    cn = float(input["curve_number"])
    period = input.get("period", "day")

    s = 25400.0 / cn - 254.0
    ia = 0.2 * s
    if p > ia:
        ro = (p - ia) ** 2 / (p + 0.8 * s)
    else:
        ro = 0.0
    pe = p - ro

    return {
        "ok": True,
        "model": EFFECTIVE_PRECIP_MODEL,
        "inputs": input,
        "result": {
            "precipitation_mm": _round(p),
            "curve_number": _round(cn, 2),
            "retention_s_mm": _round(s),
            "initial_abstraction_mm": _round(ia),
            "runoff_mm": _round(ro),
            "effective_precipitation_mm": _round(pe),
            "unit": f"mm/{period}",
            "period": period,
            "method": "USDA-SCS Curve Number",
        },
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


def validate_preliminary_balance_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    pe = input.get("effective_precipitation_mm")
    if not _finite(pe) or float(pe) < 0:
        errors.append({"field": "effective_precipitation_mm", "code": "INVALID_PRECIP"})
    etc = input.get("etc_mm")
    if not _finite(etc) or float(etc) < 0:
        errors.append({"field": "etc_mm", "code": "INVALID_ETC"})
    period = input.get("period", "day")
    if period not in VALID_PERIODS:
        errors.append({"field": "period", "code": "INVALID_PERIOD"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_preliminary_water_balance(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_preliminary_balance_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": WATER_BALANCE_PRELIM_MODEL, "errors": validation["errors"]}

    pe = float(input["effective_precipitation_mm"])
    etc = float(input["etc_mm"])
    period = input.get("period", "day")

    balance = pe - etc
    eps = 1e-9
    status = "surplus" if balance > eps else "deficit" if balance < -eps else "balanced"

    return {
        "ok": True,
        "model": WATER_BALANCE_PRELIM_MODEL,
        "inputs": input,
        "result": {
            "effective_precipitation_mm": _round(pe),
            "etc_mm": _round(etc),
            "balance_mm": _round(balance),
            "status": status,
            "unit": f"mm/{period}",
            "period": period,
            "interpretation": "preliminary accounting only; not root-zone storage or irrigation requirement",
        },
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


EFFECTIVE_PRECIP_DEFINITION = {
    "id": EFFECTIVE_PRECIP_MODEL["id"],
    "version": EFFECTIVE_PRECIP_MODEL["version"],
    "domain": "agriculture",
    "title": "Effective precipitation (SCS Curve Number)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "precipitation_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "curve_number", "kind": "number", "unit": "fraction", "required": True,
         "description": "SCS curve number (0 < CN <= 100), supplied"},
        {"name": "period", "kind": "string", "required": False},
    ],
    "outputs": [
        {"name": "effective_precipitation_mm", "kind": "number", "unit": "mm"},
        {"name": "runoff_mm", "kind": "number", "unit": "mm"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_effective_precip.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}

WATER_BALANCE_PRELIM_DEFINITION = {
    "id": WATER_BALANCE_PRELIM_MODEL["id"],
    "version": WATER_BALANCE_PRELIM_MODEL["version"],
    "domain": "agriculture",
    "title": "Preliminary crop water balance (Pe - ETc)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "effective_precipitation_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "etc_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "period", "kind": "string", "required": False},
    ],
    "outputs": [
        {"name": "balance_mm", "kind": "number", "unit": "mm"},
        {"name": "status", "kind": "string"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_effective_precip.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}