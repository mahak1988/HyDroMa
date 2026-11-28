"""Rosetta-lite pedotransfer (texture + OM → hydraulic properties).

A bounded, deterministic, stdlib-only texture-based pedotransfer that estimates
field capacity (θ33), wilting point (θ1500) and available water capacity from
sand/silt/clay and organic matter. It is a distinct, documented formulation from
``soil_physics.compute_pedotransfer`` (Rosetta-style, Schaap 1999), simplified
to a texture + OM linear model with a guaranteed θwp < θfc.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "ROSETTA_MODEL",
    "ROSETTA_DEFINITION",
    "compute_rosetta",
    "validate_rosetta_input",
]

ROUND_DECIMALS = 4

ROSETTA_MODEL = {
    "id": "eco-nojin.hydroma.rosetta-pedotransfer",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "θ33,θ1500=f(sand,silt,clay,OM); θwp<θfc",
    "units": {"theta": "m3/m3"},
    "method": "Rosetta-lite texture pedotransfer",
}

ASSUMPTIONS = [
    "texture_and_om_inputs",
    "linear_texture_response",
    "theta_wp_lt_fc",
]
LIMITATIONS = [
    "notValidated",
    "not_full_rosetta",
    "no_van_genuchten_fit",
    "soil_specific",
]
REFERENCES = [
    "Schaap, M.G., Leij, F.J., van Genuchten, M.Th. (1999). Rosetta pedotransfer. SSSAJ 63.",
    "Saxton, K.E., Rawls, W.J. (2006). Soil water characteristic estimates. SSSAJ 70.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def validate_rosetta_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    for key in ("sand_pct", "silt_pct", "clay_pct", "organic_matter_pct"):
        v = input.get(key)
        if not _finite(v) or not (0.0 <= float(v) <= 100.0):
            errors.append({"field": key, "code": "INVALID"})
    if _finite(input.get("sand_pct")) and _finite(input.get("silt_pct")) and _finite(input.get("clay_pct")):
        if float(input["sand_pct"]) + float(input["silt_pct"]) + float(input["clay_pct"]) > 100.5:
            errors.append({"field": "texture", "code": "SUM_GT_100"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_rosetta(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_rosetta_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": ROSETTA_MODEL, "errors": validation["errors"]}

    s = float(input["sand_pct"])
    si = float(input["silt_pct"])
    c = float(input["clay_pct"])
    om = float(input["organic_matter_pct"])

    # Texture + OM linear model (Rosetta-inspired, simplified).
    theta_33 = 0.18 + 0.0030 * c + 0.0012 * si + 0.012 * om
    theta_1500 = 0.06 + 0.0022 * c + 0.0007 * si + 0.005 * om
    theta_33 = _clamp(theta_33, 0.02, 0.55)
    theta_1500 = _clamp(theta_1500, 0.02, theta_33)
    theta_33 = _round(theta_33)
    theta_1500 = _round(theta_1500)
    awc = _round(max(0.0, theta_33 - theta_1500))
    return {
        "ok": True, "model": ROSETTA_MODEL,
        "result": {"sand_pct": _round(s), "silt_pct": _round(si), "clay_pct": _round(c),
                   "organic_matter_pct": _round(om),
                   "theta_fc_vol": theta_33, "theta_wp_vol": theta_1500,
                   "awc_vol": awc, "method": "Rosetta-lite (texture + OM, simplified)"},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


ROSETTA_DEFINITION = {
    "id": ROSETTA_MODEL["id"],
    "version": ROSETTA_MODEL["version"],
    "domain": "soil",
    "title": "Rosetta-lite pedotransfer (texture + OM)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["m3/m3"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "sand_pct", "kind": "number", "required": True},
        {"name": "silt_pct", "kind": "number", "required": True},
        {"name": "clay_pct", "kind": "number", "required": True},
        {"name": "organic_matter_pct", "kind": "number", "required": True},
    ],
    "outputs": [
        {"name": "theta_fc_vol", "kind": "number", "unit": "m3/m3"},
        {"name": "theta_wp_vol", "kind": "number", "unit": "m3/m3"},
        {"name": "awc_vol", "kind": "number", "unit": "m3/m3"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_rosetta.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}