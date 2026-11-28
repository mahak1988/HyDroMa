"""Groundwater / aquifer water balance (single-bucket, lumped).

A bounded, deterministic, stdlib-only lumped aquifer balance over a period:

    dS = recharge + lateral_in - discharge - pumping - lateral_out      [mm]
    S_final = S_initial + dS

All fluxes are depths (mm) over the stated period. Storage is **never clamped**:
a negative final storage is flagged ``out_of_domain`` (a depleted/over-abstracted
aquifer), not silently set to zero. This is a lumped accounting model: no
spatial groundwater flow, no Richards/ vadose-zone physics, no water quality.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "GROUNDWATER_MODEL",
    "GROUNDWATER_DEFINITION",
    "compute_groundwater_balance",
    "validate_groundwater_input",
]

ROUND_DECIMALS = 4
VALID_PERIODS = ("day", "month", "year", "period")

GROUNDWATER_MODEL = {
    "id": "eco-nojin.hydroma.groundwater-balance",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "dS = recharge + lateral_in - discharge - pumping - lateral_out",
    "units": {"storage": "mm", "flux": "mm"},
    "method": "Lumped single-bucket aquifer balance",
}

ASSUMPTIONS = [
    "lumped_single_bucket",
    "fluxes_as_depths_mm",
    "no_spatial_flow",
    "no_vadose_zone_physics",
    "storage_never_clamped",
]
LIMITATIONS = [
    "notValidated",
    "not_modflow_distributed",
    "no_water_quality",
    "no_capillary_or_recharge_model",
    "single_period_accounting",
]
REFERENCES = [
    "Freeze, R.A., Cherry, J.A. (1979). Groundwater. Prentice-Hall.",
    "Fetter, C.W. (2001). Applied Hydrogeology, 4th ed. Prentice-Hall.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def validate_groundwater_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    for key in ("initial_storage_mm", "recharge_mm", "discharge_mm", "pumping_mm"):
        v = input.get(key)
        if not _finite(v):
            errors.append({"field": key, "code": "INVALID_FLUX",
                           "message": f"{key} must be a finite number >= 0"})
        elif float(v) < 0:
            errors.append({"field": key, "code": "NEGATIVE",
                           "message": f"{key} must be >= 0"})
    for key in ("lateral_in_mm", "lateral_out_mm"):
        if key in input and input[key] is not None:
            if not _finite(input[key]) or float(input[key]) < 0:
                errors.append({"field": key, "code": "INVALID_FLUX",
                               "message": f"{key} must be a finite number >= 0"})
    period = input.get("period", "period")
    if period not in VALID_PERIODS:
        errors.append({"field": "period", "code": "INVALID_PERIOD"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_groundwater_balance(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_groundwater_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": GROUNDWATER_MODEL, "errors": validation["errors"]}

    s0 = float(input["initial_storage_mm"])
    recharge = float(input["recharge_mm"])
    discharge = float(input["discharge_mm"])
    pumping = float(input["pumping_mm"])
    lateral_in = float(input.get("lateral_in_mm") or 0.0)
    lateral_out = float(input.get("lateral_out_mm") or 0.0)
    period = input.get("period", "period")

    inflow = recharge + lateral_in
    outflow = discharge + pumping + lateral_out
    ds = inflow - outflow
    s_final = s0 + ds
    out_of_domain = s_final < 0.0
    status = "depleted" if out_of_domain else ("rising" if ds > 0 else "falling" if ds < 0 else "balanced")

    return {
        "ok": True,
        "model": GROUNDWATER_MODEL,
        "inputs": {"period": period},
        "result": {
            "initial_storage_mm": _round(s0),
            "inflow_mm": _round(inflow),
            "outflow_mm": _round(outflow),
            "storage_change_mm": _round(ds),
            "final_storage_mm": _round(s_final),
            "out_of_domain": out_of_domain,
            "status": status,
            "unit": f"mm/{period}",
            "period": period,
        },
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


GROUNDWATER_DEFINITION = {
    "id": GROUNDWATER_MODEL["id"],
    "version": GROUNDWATER_MODEL["version"],
    "domain": "groundwater",
    "title": "Lumped aquifer water balance",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "initial_storage_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "recharge_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "discharge_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "pumping_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "lateral_in_mm", "kind": "number", "unit": "mm", "required": False},
        {"name": "lateral_out_mm", "kind": "number", "unit": "mm", "required": False},
        {"name": "period", "kind": "string", "required": False},
    ],
    "outputs": [
        {"name": "storage_change_mm", "kind": "number", "unit": "mm"},
        {"name": "final_storage_mm", "kind": "number", "unit": "mm"},
        {"name": "status", "kind": "string"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_groundwater.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}