"""Integrated irrigation requirement & scheduling plan (Phase 3.16).

An integration workflow that connects existing HyDroMA models - it does NOT
duplicate them:

* ``crop_etc.compute_crop_etc``        -> ETc = Kc * ET0
* ``soil_water`` conventions            -> fc/wp/TAW from layers
* ``irrigation.compute_irrigation_schedule`` -> net/gross irrigation, trigger

Single-decision scheduling: given ET0, Kc, soil profile, initial root-zone
storage, allowable depletion ``p`` and (optional) application efficiency, compute
the crop ETc, the current depletion, whether irrigation is triggered (Dr > RAW),
and the net/gross irrigation to restore the root zone to the target.

This is NOT an optimizer, NOT a validated recommendation, NOT a multi-day
scheduler (that is ``crop_water.simulate_crop_water_chain``). Software-tested;
scientific status NOT_VALIDATED.
"""

from __future__ import annotations

import math

from .crop_etc import compute_crop_etc
from .irrigation import compute_irrigation_schedule

__all__ = [
    "IRRIGATION_PLAN_MODEL",
    "IRRIGATION_PLAN_DEFINITION",
    "compute_irrigation_plan",
]

ROUND_DECIMALS = 4
EPS = 1e-9

IRRIGATION_PLAN_MODEL = {
    "id": "eco-nojin.hydroma.irrigation-plan",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "ETc=Kc*ET0; Dr=fc-S; net=max(0,Dr-target); gross=net/eff; trigger=Dr>RAW",
    "units": {"water": "mm", "kc": "fraction", "p": "fraction"},
}

ASSUMPTIONS = [
    "single_decision_plan",
    "reuses_crop_etc_and_irrigation_schedule",
    "target_depletion_defaults_to_RAW",
    "net_irrigation_is_modeled_water_to_add",
]
LIMITATIONS = [
    "notValidated",
    "not_optimizer",
    "not_multi_day_scheduler",
    "not_validated_recommendation",
    "kc_p_supplied",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). FAO Irrigation and Drainage Paper 56, Ch.5 & Ch.8.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def compute_irrigation_plan(input: dict | None = None) -> dict:
    input = input or {}

    etc_res = compute_crop_etc({"et0_mm": input.get("et0_mm"), "kc": input.get("kc")})
    if not etc_res["ok"]:
        return {"ok": False, "model": IRRIGATION_PLAN_MODEL, "errors": etc_res["errors"]}
    etc = etc_res["result"]["etc_mm"]
    kc = etc_res["result"]["kc"]
    et0 = etc_res["result"]["et0_mm"]

    layers = input.get("layers")
    s0 = input.get("initial_storage_mm")
    if not isinstance(layers, list) or len(layers) == 0:
        return {"ok": False, "model": IRRIGATION_PLAN_MODEL, "errors": [{"field": "layers", "code": "INVALID_LAYERS"}]}
    if not _finite(s0) or float(s0) < 0:
        return {"ok": False, "model": IRRIGATION_PLAN_MODEL, "errors": [{"field": "initial_storage_mm", "code": "INVALID_INITIAL"}]}

    fc_storage = sum(float(l["theta_fc"]) * float(l["thickness_mm"]) for l in layers)
    wp_storage = sum(float(l["theta_wp"]) * float(l["thickness_mm"]) for l in layers)
    taw = fc_storage - wp_storage
    dr = fc_storage - float(s0)

    sched = compute_irrigation_schedule({
        "layers": layers,
        "p": input.get("p"),
        "depletion_mm": dr,
        "application_efficiency": input.get("application_efficiency"),
        "target_depletion_mm": input.get("target_depletion_mm"),
    })
    if not sched["ok"]:
        return {"ok": False, "model": IRRIGATION_PLAN_MODEL, "errors": sched["errors"]}

    net = sched["result"]["net_irrigation_mm"]
    gross = sched["result"]["gross_irrigation_mm"]
    trigger = sched["result"]["irrigation_recommended"]
    target_storage = sched["result"]["target_storage_mm"]
    candidate_storage = float(s0) + net
    excess = max(0.0, candidate_storage - fc_storage)  # above field capacity -> drainage
    post = candidate_storage - excess

    return {
        "ok": True,
        "model": IRRIGATION_PLAN_MODEL,
        "inputs": input,
        "result": {
            "et0_mm": _round(et0),
            "kc": _round(kc, 4),
            "etc_mm": _round(etc),
            "fc_storage_mm": _round(fc_storage),
            "wp_storage_mm": _round(wp_storage),
            "taw_mm": _round(taw),
            "raw_mm": sched["result"]["raw_mm"],
            "initial_storage_mm": _round(float(s0)),
            "depletion_mm": _round(dr),
            "net_irrigation_mm": _round(net),
            "gross_irrigation_mm": _round(gross) if gross is not None else None,
            "irrigation_triggered": trigger,
            "target_storage_mm": _round(target_storage),
            "post_irrigation_storage_mm": _round(post),
            "excess_mm": _round(excess),
            "unit": "mm",
        },
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


IRRIGATION_PLAN_DEFINITION = {
    "id": IRRIGATION_PLAN_MODEL["id"],
    "version": IRRIGATION_PLAN_MODEL["version"],
    "domain": "agriculture",
    "title": "Irrigation requirement & scheduling plan (integrated)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm", "fraction"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "et0_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "kc", "kind": "number", "unit": "fraction", "required": True},
        {"name": "layers", "kind": "array", "required": True, "description": "{thickness_mm, theta_fc, theta_wp}"},
        {"name": "initial_storage_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "p", "kind": "number", "unit": "fraction", "required": True},
        {"name": "application_efficiency", "kind": "number", "unit": "fraction", "required": False},
        {"name": "target_depletion_mm", "kind": "number", "unit": "mm", "required": False},
    ],
    "outputs": [
        {"name": "etc_mm", "kind": "number", "unit": "mm"},
        {"name": "net_irrigation_mm", "kind": "number", "unit": "mm"},
        {"name": "gross_irrigation_mm", "kind": "number", "unit": "mm"},
        {"name": "irrigation_triggered", "kind": "boolean"},
        {"name": "post_irrigation_storage_mm", "kind": "number", "unit": "mm"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_irrigation_plan.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}