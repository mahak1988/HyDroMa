"""FAO-56 single crop-coefficient crop evapotranspiration (ETc = Kc * ET0).

A focused, HTTP-free, dependency-free crop water-demand model. It computes crop
evapotranspiration from an explicitly supplied reference evapotranspiration (ET0)
and crop coefficient (Kc):

    ETc = Kc * ET0

This is the FAO-56 single crop-coefficient method (Allen, Pereira, Raes & Smith,
1998, FAO Irrigation and Drainage Paper 56). It is CROP-NEUTRAL: Kc is supplied,
never inferred from crop identity/stage. It does NOT compute soil-water stress
(that is :mod:`hydroma.crop_water`), irrigation requirement, or crop yield.

ETc is expressed in the same depth unit as ET0 (mm) over the stated period.
Kc is dimensionless. Software-tested; NOT scientifically validated.
"""

from __future__ import annotations

import math

__all__ = [
    "FAO56_CROP_ETC_MODEL",
    "FAO56_CROP_ETC_DEFINITION",
    "compute_crop_etc",
    "validate_crop_etc_input",
]

ROUND_DECIMALS = 4
VALID_PERIODS = ("day", "period")

FAO56_CROP_ETC_MODEL = {
    "id": "eco-nojin.hydroma.fao56-crop-etc",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "ETc = Kc * ET0",
    "units": {"et": "mm", "kc": "fraction"},
    "reference": "FAO Irrigation and Drainage Paper 56 (Allen et al., 1998), single crop coefficient",
}

ASSUMPTIONS = [
    "single_crop_coefficient",
    "kc_supplied_crop_neutral",
    "et0_supplied_not_fabricated",
    "etc_same_depth_unit_as_et0",
]
LIMITATIONS = [
    "notValidated",
    "single_kc_not_dual_source",
    "no_soil_water_stress",
    "no_irrigation_requirement",
    "no_crop_yield",
    "kc_and_et0_must_be_supplied",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). Crop evapotranspiration - FAO Irrigation and Drainage Paper 56.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def validate_crop_etc_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    et0 = input.get("et0_mm")
    if not _finite(et0) or float(et0) < 0:
        errors.append({"field": "et0_mm", "code": "INVALID_ET0", "message": "et0_mm must be a finite number >= 0"})
    kc = input.get("kc")
    if not _finite(kc) or float(kc) < 0:
        errors.append({"field": "kc", "code": "INVALID_KC", "message": "kc must be a finite number >= 0"})
    period = input.get("period", "day")
    if period not in VALID_PERIODS:
        errors.append({"field": "period", "code": "INVALID_PERIOD", "message": f"period must be one of {VALID_PERIODS}"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_crop_etc(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_crop_etc_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": FAO56_CROP_ETC_MODEL, "errors": validation["errors"]}

    et0 = float(input["et0_mm"])
    kc = float(input["kc"])
    period = input.get("period", "day")
    etc = kc * et0

    return {
        "ok": True,
        "model": FAO56_CROP_ETC_MODEL,
        "inputs": input,
        "result": {
            "et0_mm": _round(et0),
            "kc": _round(kc, 4),
            "etc_mm": _round(etc),
            "unit": f"mm/{period}",
            "period": period,
        },
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


FAO56_CROP_ETC_DEFINITION = {
    "id": FAO56_CROP_ETC_MODEL["id"],
    "version": FAO56_CROP_ETC_MODEL["version"],
    "domain": "agriculture",
    "title": "FAO-56 crop evapotranspiration (ETc = Kc * ET0)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm", "fraction"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "et0_mm", "kind": "number", "unit": "mm", "required": True,
         "description": "reference evapotranspiration (mm over the period)"},
        {"name": "kc", "kind": "number", "unit": "fraction", "required": True,
         "description": "crop coefficient (dimensionless, supplied)"},
        {"name": "period", "kind": "string", "required": False,
         "description": "'day' or 'period' (semantics label)"},
    ],
    "outputs": [
        {"name": "etc_mm", "kind": "number", "unit": "mm"},
        {"name": "unit", "kind": "string"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_crop_etc.py",
                      "notes": "software tests only; not scientific validation"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}