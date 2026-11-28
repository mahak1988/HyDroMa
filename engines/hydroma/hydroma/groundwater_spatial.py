"""Groundwater (MODFLOW-lite): Darcy flow, 1D steady head, WTF recharge.

Three bounded, deterministic, stdlib-only models (lumped / 1-D; not a
distributed MODFLOW solver):

1. **Darcy flow** (1-D confined):

       Q = K * A * (h1 - h2) / L          [m3/s]

2. **1-D steady head profile with recharge** (confined, both ends fixed):

       h(x) = h1 + (h2 - h1)*(x/L) + (R/(2K))*(L - x)*x

   where ``R`` is recharge per unit area [m/s] and ``x`` in [0, L].

3. **Water-table fluctuation recharge** (Healy & Cook 2002):

       R = Sy * dh / dt                  [m/s]

Software-tested; **NOT scientifically validated**. No vertical leakage, no
unconfined non-linearity, no transport.
"""

from __future__ import annotations

import math

__all__ = [
    "GROUNDWATER_SPATIAL_MODEL",
    "GROUNDWATER_SPATIAL_DEFINITION",
    "compute_darcy_flow",
    "compute_head_profile",
    "compute_wtf_recharge",
    "groundwater_spatial_adapter",
    "validate_darcy_input",
    "validate_head_profile_input",
    "validate_wtf_input",
]

ROUND_DECIMALS = 6

GROUNDWATER_SPATIAL_MODEL = {
    "id": "eco-nojin.hydroma.groundwater-spatial",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "Q=K*A*(h1-h2)/L; R=Sy*dh/dt",
    "units": {"flow": "m3/s", "head": "m", "recharge": "m/s"},
    "method": "Darcy + 1D steady head + WTF recharge",
}

ASSUMPTIONS = [
    "confined_1d_darcy",
    "homogeneous_isotropic_k",
    "fixed_boundary_heads",
    "wtf_specific_yield",
]
LIMITATIONS = [
    "notValidated",
    "not_distributed_modflow",
    "no_vertical_leakage",
    "no_unconfined_nonlinearity",
    "no_transport",
]
REFERENCES = [
    "Freeze, R.A., Cherry, J.A. (1979). Groundwater. Prentice-Hall.",
    "Healy, R.W., Cook, P.G. (2002). Using groundwater levels to estimate recharge. Hydrogeology Journal 10.",
    "Harbaugh, A.W. (2005). MODFLOW-2005. USGS Techniques and Methods 6-A16.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def validate_darcy_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    for key in ("k_m_s", "area_m2", "h1_m", "h2_m", "length_m"):
        if not _finite(input.get(key)):
            errors.append({"field": key, "code": "INVALID"})
    if _finite(input.get("area_m2")) and float(input["area_m2"]) <= 0:
        errors.append({"field": "area_m2", "code": "NONPOSITIVE"})
    if _finite(input.get("length_m")) and float(input["length_m"]) <= 0:
        errors.append({"field": "length_m", "code": "NONPOSITIVE"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_darcy_flow(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_darcy_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": GROUNDWATER_SPATIAL_MODEL, "errors": validation["errors"]}
    k = float(input["k_m_s"])
    a = float(input["area_m2"])
    h1 = float(input["h1_m"])
    h2 = float(input["h2_m"])
    length = float(input["length_m"])
    gradient = (h1 - h2) / length
    q = k * a * gradient
    return {
        "ok": True, "model": GROUNDWATER_SPATIAL_MODEL,
        "result": {"k_m_s": _round(k), "area_m2": _round(a),
                   "gradient": _round(gradient), "flow_m3_s": _round(q),
                   "flow_direction": "h1_to_h2" if q >= 0 else "h2_to_h1"},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def validate_head_profile_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    for key in ("k_m_s", "h1_m", "h2_m", "length_m", "recharge_m_s", "x_m"):
        if not _finite(input.get(key)):
            errors.append({"field": key, "code": "INVALID"})
    if _finite(input.get("length_m")) and float(input["length_m"]) <= 0:
        errors.append({"field": "length_m", "code": "NONPOSITIVE"})
    if _finite(input.get("x_m")) and _finite(input.get("length_m")):
        if not (0.0 <= float(input["x_m"]) <= float(input["length_m"])):
            errors.append({"field": "x_m", "code": "OUT_OF_RANGE"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_head_profile(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_head_profile_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": GROUNDWATER_SPATIAL_MODEL, "errors": validation["errors"]}
    k = float(input["k_m_s"])
    h1 = float(input["h1_m"])
    h2 = float(input["h2_m"])
    length = float(input["length_m"])
    r = float(input["recharge_m_s"])
    x = float(input["x_m"])
    h = h1 + (h2 - h1) * (x / length) + (r / (2.0 * k)) * (length - x) * x
    return {
        "ok": True, "model": GROUNDWATER_SPATIAL_MODEL,
        "result": {"x_m": _round(x), "head_m": _round(h),
                   "h1_m": _round(h1), "h2_m": _round(h2), "length_m": _round(length)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def validate_wtf_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    for key in ("specific_yield", "dh_m", "dt_s"):
        if not _finite(input.get(key)):
            errors.append({"field": key, "code": "INVALID"})
    if _finite(input.get("specific_yield")) and not (0.0 < float(input["specific_yield"]) <= 1.0):
        errors.append({"field": "specific_yield", "code": "INVALID_SY"})
    if _finite(input.get("dt_s")) and float(input["dt_s"]) <= 0:
        errors.append({"field": "dt_s", "code": "NONPOSITIVE"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_wtf_recharge(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_wtf_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": GROUNDWATER_SPATIAL_MODEL, "errors": validation["errors"]}
    sy = float(input["specific_yield"])
    dh = float(input["dh_m"])
    dt = float(input["dt_s"])
    recharge = sy * dh / dt  # m/s
    return {
        "ok": True, "model": GROUNDWATER_SPATIAL_MODEL,
        "result": {"specific_yield": _round(sy), "dh_m": _round(dh),
                   "dt_s": _round(dt), "recharge_m_s": _round(recharge),
                   "recharge_mm_day": _round(recharge * 1000.0 * 86400.0)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def groundwater_spatial_adapter(input: dict | None = None) -> dict:
    input = input or {}
    method = input.get("method", "darcy")
    if method == "head_profile":
        return compute_head_profile(input)
    if method == "wtf_recharge":
        return compute_wtf_recharge(input)
    return compute_darcy_flow(input)


GROUNDWATER_SPATIAL_DEFINITION = {
    "id": GROUNDWATER_SPATIAL_MODEL["id"],
    "version": GROUNDWATER_SPATIAL_MODEL["version"],
    "domain": "groundwater",
    "title": "Groundwater MODFLOW-lite (Darcy + 1D head + WTF recharge)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["m3/s", "m", "m/s"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "method", "kind": "string", "required": False, "description": "darcy (default) | head_profile | wtf_recharge"},
        {"name": "k_m_s", "kind": "number", "required": False},
        {"name": "area_m2", "kind": "number", "required": False},
        {"name": "h1_m", "kind": "number", "required": False},
        {"name": "h2_m", "kind": "number", "required": False},
        {"name": "length_m", "kind": "number", "required": False},
        {"name": "recharge_m_s", "kind": "number", "required": False},
        {"name": "x_m", "kind": "number", "required": False},
        {"name": "specific_yield", "kind": "number", "required": False},
        {"name": "dh_m", "kind": "number", "required": False},
        {"name": "dt_s", "kind": "number", "required": False},
    ],
    "outputs": [
        {"name": "flow_m3_s", "kind": "number"},
        {"name": "head_m", "kind": "number"},
        {"name": "recharge_m_s", "kind": "number"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_groundwater_spatial.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}