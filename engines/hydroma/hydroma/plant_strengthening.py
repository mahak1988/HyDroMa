"""Plant strengthening: a defense / resilience index.

A bounded, deterministic, stdlib-only **heuristic** index that combines
qualitative agronomic strengthening factors into a single resilience score in
[0, 1]. Each factor is supplied as a scalar in [0, 1] (1 = fully applied /
strong):

* ``silicon``        - silicon nutrition / mechanical strengthening
* ``isr``            - induced systemic resistance (rhizobacteria, PGPR)
* ``sar``            - systemic acquired resistance (salicylic-acid pathway)
* ``biostimulant``   - seaweed / humic / protein hydrolysate / chitosan

The index is the (optionally weighted) mean of the supplied factors:

    index = sum(w_i * f_i) / sum(w_i)        for supplied factors

This is **not** a validated biological model; it is a transparent aggregation
to support scenario comparison. It does not predict disease, yield or mortality.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "PLANT_STRENGTHENING_MODEL",
    "PLANT_STRENGTHENING_DEFINITION",
    "STRENGTHENING_FACTORS",
    "compute_plant_strengthening",
    "validate_strengthening_input",
]

ROUND_DECIMALS = 4
STRENGTHENING_FACTORS = ("silicon", "isr", "sar", "biostimulant")
DEFAULT_WEIGHTS = {f: 1.0 for f in STRENGTHENING_FACTORS}

PLANT_STRENGTHENING_MODEL = {
    "id": "eco-nojin.hydroma.plant-strengthening",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "index = sum(w_i*f_i)/sum(w_i) over supplied factors",
    "units": {"factor": "dimensionless", "index": "dimensionless"},
    "method": "Weighted mean of strengthening factors (heuristic)",
}

ASSUMPTIONS = [
    "factors_supplied_in_0_1",
    "weighted_mean_aggregation",
    "equal_weights_by_default",
    "heuristic_not_mechanistic",
]
LIMITATIONS = [
    "notValidated",
    "heuristic_aggregation",
    "no_disease_or_yield_prediction",
    "no_factor_interaction",
    "expert_weights_required_for_operational_use",
]
REFERENCES = [
    "Etesi, K., Szidarovszky, I. (2004). Silicon and plant disease resistance. Agrokemia es Talajtan.",
    "Pieterse, C.M.J., et al. (2014). Induced systemic resistance by beneficial microbes. Annu. Rev. Phytopathol.",
    "Fujiwara, T., et al. (2019). Salicylic acid signaling in plant immunity. Plant Cell Physiol.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def validate_strengthening_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    supplied = 0
    for f in STRENGTHENING_FACTORS:
        if f in input and input[f] is not None:
            supplied += 1
            if not _finite(input[f]) or not (0.0 <= float(input[f]) <= 1.0):
                errors.append({"field": f, "code": "INVALID_FACTOR",
                               "message": f"{f} must be in [0, 1]"})
    if supplied == 0:
        errors.append({"field": "factors", "code": "NO_FACTORS",
                       "message": "at least one strengthening factor is required"})
    weights = input.get("weights")
    if weights is not None:
        if not isinstance(weights, dict):
            errors.append({"field": "weights", "code": "INVALID_WEIGHTS"})
        else:
            for k, w in weights.items():
                if not _finite(w) or float(w) < 0:
                    errors.append({"field": f"weights.{k}", "code": "INVALID_WEIGHT"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_plant_strengthening(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_strengthening_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": PLANT_STRENGTHENING_MODEL, "errors": validation["errors"]}

    weights = dict(DEFAULT_WEIGHTS)
    if isinstance(input.get("weights"), dict):
        for k, w in input["weights"].items():
            if k in DEFAULT_WEIGHTS:
                weights[k] = float(w)

    num = 0.0
    den = 0.0
    used = {}
    for f in STRENGTHENING_FACTORS:
        if f in input and input[f] is not None:
            w = weights[f]
            num += w * float(input[f])
            den += w
            used[f] = {"factor": _round(float(input[f])), "weight": _round(w)}

    index = num / den if den > 0 else 0.0
    if index >= 0.75:
        band = "strong"
    elif index >= 0.5:
        band = "moderate"
    elif index > 0.0:
        band = "weak"
    else:
        band = "none"

    return {
        "ok": True,
        "model": PLANT_STRENGTHENING_MODEL,
        "inputs": {"factors_used": sorted(used.keys())},
        "result": {
            "index": _round(index),
            "band": band,
            "factors": used,
            "weights_total": _round(den),
        },
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


PLANT_STRENGTHENING_DEFINITION = {
    "id": PLANT_STRENGTHENING_MODEL["id"],
    "version": PLANT_STRENGTHENING_MODEL["version"],
    "domain": "agriculture",
    "title": "Plant strengthening / defense resilience index (heuristic)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["dimensionless"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "silicon", "kind": "number", "required": False, "description": "Si strengthening factor [0,1]"},
        {"name": "isr", "kind": "number", "required": False, "description": "induced systemic resistance [0,1]"},
        {"name": "sar", "kind": "number", "required": False, "description": "systemic acquired resistance [0,1]"},
        {"name": "biostimulant", "kind": "number", "required": False, "description": "biostimulant factor [0,1]"},
        {"name": "weights", "kind": "object", "required": False, "description": "optional per-factor weights (>=0)"},
    ],
    "outputs": [
        {"name": "index", "kind": "number", "unit": "dimensionless"},
        {"name": "band", "kind": "string"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_plant_strengthening.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}