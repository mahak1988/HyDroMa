"""Soil physics: RUSLE erosion, Green-Ampt infiltration, pedotransfer θ.

Three bounded, deterministic, stdlib-only models:

1. **RUSLE** (Renard et al. 1997; USDA-Agriculture Handbook 703):

       A = R * K * LS * C * P            [t/ha/yr]

   ``LS`` is either supplied or computed from slope and length via the McCool
   (1987) formulation:

       m    = 0.2 | 0.3 | 0.4 | 0.5      (slope <1 | 1-2 | 2-5 | >5 %)
       LS   = (L/22.13)^m * (65.41 sin^2(th) + 4.56 sin(th) + 0.065)

2. **Green-Ampt** (Mein & Larson 1971) ponded cumulative infiltration ``F(t)``
   solves ``F - psi*dtheta*ln(1 + F/(psi*dtheta)) = K*t``; the implicit
   equation is solved by bisection (bounded, deterministic).

3. **Pedotransfer (Saxton-Rawls 2006)** - field capacity (θ33) and wilting
   point (θ1500) from sand/clay/organic matter.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "SOIL_PHYSICS_MODEL",
    "SOIL_PHYSICS_DEFINITION",
    "compute_rusle",
    "compute_green_ampt",
    "compute_pedotransfer",
    "soil_physics_adapter",
    "validate_rusle_input",
    "validate_green_ampt_input",
    "validate_pedotransfer_input",
]

ROUND_DECIMALS = 4

SOIL_PHYSICS_MODEL = {
    "id": "eco-nojin.hydroma.soil-physics",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "A=R*K*LS*C*P; F-psi*dθ*ln(1+F/(psi*dθ))=K*t",
    "units": {"erosion": "t/ha/yr", "infil": "mm", "theta": "m3/m3"},
    "method": "RUSLE + Green-Ampt + Saxton-Rawls",
}

ASSUMPTIONS = [
    "rusle_empirical",
    "mccool_ls_factor",
    "green_ampt_ponded",
    "saxton_rawls_pedotransfer",
]
LIMITATIONS = [
    "notValidated",
    "rusle_empirical_not_physics",
    "green_ampt_no_redistribution",
    "pedotransfer_soil_specific",
]
REFERENCES = [
    "Renard, K.G., et al. (1997). Predicting Soil Erosion by Water: RUSLE. USDA-ARS Handbook 703.",
    "McCool, D.K., Brown, L.C., Foster, G.R. (1987). Revised slope steepness factor for USLE. Trans. ASAE 30.",
    "Mein, R.G., Larson, C.L. (1971). Modeling infiltration during a steady rain. Water Resources Research 7.",
    "Saxton, K.E., Rawls, W.J. (2006). Soil water characteristic estimates by texture and organic matter. SSSAJ 70.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def validate_rusle_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    for key in ("r_factor", "k_factor", "c_factor", "p_factor"):
        if not _finite(input.get(key)) or float(input.get(key, -1)) < 0:
            errors.append({"field": key, "code": "INVALID"})
    has_ls = _finite(input.get("ls_factor"))
    has_slope = _finite(input.get("slope_pct"))
    has_len = _finite(input.get("slope_length_m"))
    if not has_ls:
        if not (has_slope and has_len):
            errors.append({"field": "ls_factor", "code": "MISSING_LS",
                           "message": "provide ls_factor or slope_pct + slope_length_m"})
        else:
            if float(input["slope_pct"]) < 0 or float(input["slope_length_m"]) <= 0:
                errors.append({"field": "slope", "code": "INVALID_SLOPE"})
    return {"valid": len(errors) == 0, "errors": errors}


def _mccool_ls(slope_pct: float, length_m: float) -> float:
    s = slope_pct
    if s < 1.0:
        m = 0.2
    elif s < 2.0:
        m = 0.3
    elif s < 5.0:
        m = 0.4
    else:
        m = 0.5
    theta = math.atan(s / 100.0)
    sin_t = math.sin(theta)
    slope_factor = 65.41 * sin_t * sin_t + 4.56 * sin_t + 0.065
    return (length_m / 22.13) ** m * slope_factor


def compute_rusle(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_rusle_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": SOIL_PHYSICS_MODEL, "errors": validation["errors"]}

    r = float(input["r_factor"])
    k = float(input["k_factor"])
    c = float(input["c_factor"])
    p = float(input["p_factor"])
    if _finite(input.get("ls_factor")):
        ls = float(input["ls_factor"])
        ls_source = "supplied"
    else:
        ls = _mccool_ls(float(input["slope_pct"]), float(input["slope_length_m"]))
        ls_source = "mccool"
    a = r * k * ls * c * p
    return {
        "ok": True, "model": SOIL_PHYSICS_MODEL,
        "result": {"r_factor": _round(r), "k_factor": _round(k), "ls_factor": _round(ls),
                   "c_factor": _round(c), "p_factor": _round(p),
                   "soil_loss_t_ha_yr": _round(a), "ls_source": ls_source},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def validate_green_ampt_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    for key in ("ks_mm_per_h", "psi_mm", "dtheta", "time_h"):
        v = input.get(key)
        if not _finite(v) or float(v) <= 0:
            errors.append({"field": key, "code": "INVALID"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_green_ampt(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_green_ampt_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": SOIL_PHYSICS_MODEL, "errors": validation["errors"]}

    ks = float(input["ks_mm_per_h"])
    psi = float(input["psi_mm"])
    dtheta = float(input["dtheta"])
    t = float(input["time_h"])
    target = ks * t  # K*t (mm)
    c = psi * dtheta

    # Solve F - c*ln(1 + F/c) = target for F >= 0 by bisection. Expand the upper
    # bound until g(hi) > 0 (F grows faster than the log term for large F).
    def g(f):
        return f - c * math.log(1.0 + f / c) - target

    lo, hi = 0.0, max(target, c, 1.0)
    while g(hi) < 0.0:
        hi *= 2.0
    f = target
    for _ in range(200):
        f = 0.5 * (lo + hi)
        if g(f) > 0:
            hi = f
        else:
            lo = f
        if hi - lo < 1e-10:
            break
    infil_rate = ks * (1.0 + c / f) if f > 0 else float("inf")
    return {
        "ok": True, "model": SOIL_PHYSICS_MODEL,
        "result": {"ks_mm_per_h": _round(ks), "psi_mm": _round(psi),
                   "dtheta": _round(dtheta), "time_h": _round(t),
                   "cumulative_infiltration_mm": _round(f),
                   "infiltration_rate_mm_per_h": _round(infil_rate)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def validate_pedotransfer_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    for key in ("sand_pct", "clay_pct", "organic_matter_pct"):
        v = input.get(key)
        if not _finite(v) or not (0.0 <= float(v) <= 100.0):
            errors.append({"field": key, "code": "INVALID"})
    if _finite(input.get("sand_pct")) and _finite(input.get("clay_pct")):
        if float(input["sand_pct"]) + float(input["clay_pct"]) > 100.0:
            errors.append({"field": "texture", "code": "SUM_GT_100"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_pedotransfer(input: dict | None = None) -> dict:
    """Saxton-Rawls (2006) θ33 (field capacity) and θ1500 (wilting point)."""
    input = input or {}
    validation = validate_pedotransfer_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": SOIL_PHYSICS_MODEL, "errors": validation["errors"]}

    s = float(input["sand_pct"])
    c = float(input["clay_pct"])
    om = float(input["organic_matter_pct"])
    silt = max(0.0, 100.0 - s - c)

    # Simplified texture-based pedotransfer (Saxton-Rawls-inspired, NOT the exact
    # published equations). Guarantees θwp < θfc and increasing θ with clay.
    theta_33 = 0.20 + 0.0025 * c + 0.0010 * silt + 0.01 * om
    theta_1500 = 0.08 + 0.0018 * c + 0.0006 * silt + 0.004 * om
    theta_33 = _clamp(theta_33, 0.02, 0.55)
    theta_1500 = _clamp(theta_1500, 0.02, theta_33)

    theta_33 = _round(theta_33)
    theta_1500 = _round(theta_1500)
    awc = _round(max(0.0, theta_33 - theta_1500))
    return {
        "ok": True, "model": SOIL_PHYSICS_MODEL,
        "result": {"sand_pct": _round(s), "clay_pct": _round(c),
                   "organic_matter_pct": _round(om),
                   "theta_fc_vol": theta_33, "theta_wp_vol": theta_1500,
                   "awc_vol": awc, "method": "texture-based pedotransfer (Saxton-Rawls-inspired, simplified)"},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def soil_physics_adapter(input: dict | None = None) -> dict:
    input = input or {}
    method = input.get("method", "rusle")
    if method == "green_ampt":
        return compute_green_ampt(input)
    if method == "pedotransfer":
        return compute_pedotransfer(input)
    return compute_rusle(input)


SOIL_PHYSICS_DEFINITION = {
    "id": SOIL_PHYSICS_MODEL["id"],
    "version": SOIL_PHYSICS_MODEL["version"],
    "domain": "soil",
    "title": "Soil physics (RUSLE + Green-Ampt + pedotransfer)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["t/ha/yr", "mm", "m3/m3"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "method", "kind": "string", "required": False, "description": "rusle (default) | green_ampt | pedotransfer"},
        {"name": "r_factor", "kind": "number", "required": False},
        {"name": "k_factor", "kind": "number", "required": False},
        {"name": "ls_factor", "kind": "number", "required": False},
        {"name": "c_factor", "kind": "number", "required": False},
        {"name": "p_factor", "kind": "number", "required": False},
        {"name": "slope_pct", "kind": "number", "required": False},
        {"name": "slope_length_m", "kind": "number", "required": False},
        {"name": "ks_mm_per_h", "kind": "number", "required": False},
        {"name": "psi_mm", "kind": "number", "required": False},
        {"name": "dtheta", "kind": "number", "required": False},
        {"name": "time_h", "kind": "number", "required": False},
        {"name": "sand_pct", "kind": "number", "required": False},
        {"name": "clay_pct", "kind": "number", "required": False},
        {"name": "organic_matter_pct", "kind": "number", "required": False},
    ],
    "outputs": [
        {"name": "soil_loss_t_ha_yr", "kind": "number"},
        {"name": "cumulative_infiltration_mm", "kind": "number"},
        {"name": "theta_fc_vol", "kind": "number"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_soil_physics.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}