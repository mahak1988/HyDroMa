"""Stress-aware irrigation demand & decision support (Phase 3.23).

A deterministic, explicitly documented decision-support calculation that connects
the root-zone water state to crop demand and irrigation requirement. It **reuses**
the existing HyDroMA models and does not reimplement them:

* ``crop_etc.compute_crop_etc``          -> ETc = Kc * ET0 (crop demand)
* ``water_stress._ks``                    -> Ks (water-stress coefficient)
* ``irrigation.compute_irrigation_schedule`` -> TAW/RAW/Dr/net/gross/target
* ``soil_water.validate_soil_water_input`` -> layer validation

Distinctions (never conflated)
------------------------------
* ``etc_mm``            crop water **demand** (Kc * ET0)
* ``depletion_mm``      root-zone depletion ``Dr = FC - S``
* ``stress_deficit_mm`` depletion beyond readily available water ``max(0, Dr - RAW)``
* ``water_deficit_mm``  deficit relative to the explicit target ``max(0, Dr - target)``
* ``net_irrigation_mm`` net depth to add to reach the target
* ``gross_irrigation_mm`` net / application efficiency (only if efficiency supplied)
* ``irrigation_loss_mm`` gross - net

Temporal semantics
------------------
This is a **current-state target-replenishment** calculation: given the current
root-zone storage it computes the net depth required to reach the explicit target.
It is **not** a forecast and does not simulate ET over a future period. ``Ks`` and
``ETa`` are informational stress diagnostics and do **not** enter the net-irrigation
formula (``net = max(0, Dr - target)``). ``storage_after`` is the hypothetical
storage immediately after applying the net depth (no ET or other fluxes).

The irrigation target is explicit and singular: exactly one of
``target_depletion_mm``, ``target_storage_mm``, or ``target_policy`` in
``{"FIELD_CAPACITY", "RAW"}`` (conflicting specifications are rejected). Field
capacity is **not** assumed; ``p`` and application efficiency are never inferred.
The target must lie within ``[WP, FC]`` (target depletion in ``[0, TAW]``).

Decision semantics
------------------
* ``demand_detected``        numerical demand exists (``net > 0``), regardless of domain.
* ``irrigation_recommended`` an operational recommendation, issued only within
  ``[WP, FC]`` (``decision == "DEMAND"``); ``False`` when restricted.
* ``recommendation_restricted`` / ``restriction_reason`` explain when a numerical
  demand exists but cannot be recommended (e.g. below wilting point).

Decision
--------
* ``DEMAND``        net irrigation > 0 within the normal domain ``[WP, FC]``
* ``NO_DEMAND``     net irrigation == 0 (state at/above target, or above FC)
* ``OUT_OF_DOMAIN`` storage below the wilting point (numerical demand preserved,
                    ``irrigation_recommended=False``, ``restriction_reason`` set)
* ``INVALID``       structured validation error (ok=False)

This is decision **support** only: it never activates or executes irrigation.
Software-tested; scientific status **NOT_VALIDATED**.
"""

from __future__ import annotations

import math
from typing import Any, Dict, Optional

from .crop_etc import compute_crop_etc
from .irrigation import compute_irrigation_schedule
from .provenance import sha256_json
from .soil_water import validate_soil_water_input
from .water_stress import _ks

__all__ = [
    "IRRIGATION_DEMAND_MODEL",
    "IRRIGATION_DEMAND_DEFINITION",
    "compute_irrigation_demand",
]

ROUND_DECIMALS = 4
EPS = 1e-9

IRRIGATION_DEMAND_MODEL = {
    "id": "eco-nojin.hydroma.irrigation-demand",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "ETc=Kc*ET0; Dr=FC-S; Ks=...; ETa=Ks*ETc; net=max(0,Dr-target); gross=net/eff",
    "units": {"water": "mm", "kc": "fraction", "p": "fraction", "efficiency": "fraction"},
}

ASSUMPTIONS = [
    "reuses_crop_etc_irrigation_water_stress",
    "target_explicit_not_field_capacity_default",
    "target_singular_no_conflicting_sources",
    "target_within_wp_fc",
    "current_state_target_replenishment",
    "ks_eta_informational_only",
    "p_supplied_explicitly_in_0_1",
    "net_irrigation_is_modeled_water_to_add",
    "gross_only_with_explicit_efficiency",
    "decision_support_not_execution",
]
LIMITATIONS = [
    "notValidated",
    "not_optimizer",
    "not_automatic_control",
    "no_irrigation_execution",
    "no_efficiency_inference",
    "no_crop_stage_or_physiology",
    "single_root_zone_bucket",
    "daily_aggregated_inputs",
    "not_a_forecast",
    "no_period_et_simulation",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). FAO Irrigation and Drainage Paper 56, Ch.5 & Ch.8.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    if value is None:
        return None
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _json_safe(obj):
    import json
    return json.loads(json.dumps(obj, default=str))


def _err(code: str, field: str, message: str) -> Dict[str, Any]:
    return {"field": field, "code": code, "message": message}


def compute_irrigation_demand(input: Optional[dict] = None) -> Dict[str, Any]:
    """Compute a stress-aware irrigation demand and decision. Never raises on bad input."""
    input = input or {}

    soil = validate_soil_water_input({"layers": input.get("layers")})
    if not soil["valid"]:
        return {"ok": False, "model": IRRIGATION_DEMAND_MODEL, "decision": "INVALID", "errors": soil["errors"]}
    layers = input["layers"]

    p = input.get("p")
    if not _finite(p) or not (0.0 < float(p) < 1.0):
        return {"ok": False, "model": IRRIGATION_DEMAND_MODEL, "decision": "INVALID",
                "errors": [_err("INVALID_P", "p", "p must be a fraction in (0, 1)")]}
    p = float(p)

    etc_res = compute_crop_etc({"et0_mm": input.get("et0_mm"), "kc": input.get("kc"),
                                "period": input.get("period", "period")})
    if not etc_res["ok"]:
        return {"ok": False, "model": IRRIGATION_DEMAND_MODEL, "decision": "INVALID", "errors": etc_res["errors"]}
    et0 = float(etc_res["result"]["et0_mm"])
    kc = float(etc_res["result"]["kc"])
    etc = float(etc_res["result"]["etc_mm"])

    s0 = input.get("initial_storage_mm")
    if not _finite(s0) or float(s0) < 0:
        return {"ok": False, "model": IRRIGATION_DEMAND_MODEL, "decision": "INVALID",
                "errors": [_err("INVALID_INITIAL", "initial_storage_mm", "initial storage must be finite and >= 0")]}
    s0 = float(s0)

    # resolve the explicit irrigation target (never silently default to field capacity)
    target_depletion_mm = input.get("target_depletion_mm")
    target_storage_mm = input.get("target_storage_mm")
    target_policy = input.get("target_policy")
    specified = [name for name, val in (("target_depletion_mm", target_depletion_mm),
                                        ("target_storage_mm", target_storage_mm),
                                        ("target_policy", target_policy)) if val is not None]
    if len(specified) > 1:
        return {"ok": False, "model": IRRIGATION_DEMAND_MODEL, "decision": "INVALID",
                "errors": [_err("CONFLICTING_TARGET", "target",
                                f"specify exactly one target source; got {specified}")]}
    sched_input: Dict[str, Any] = {
        "layers": layers, "p": p, "application_efficiency": input.get("application_efficiency"),
    }
    if target_depletion_mm is not None:
        sched_input["target_depletion_mm"] = target_depletion_mm
        resolved_policy = "TARGET_DEPLETION"
    elif target_storage_mm is not None:
        sched_input["target_storage_mm"] = target_storage_mm
        resolved_policy = "TARGET_STORAGE"
    elif target_policy == "FIELD_CAPACITY":
        sched_input["target_depletion_mm"] = 0.0
        resolved_policy = "FIELD_CAPACITY"
    elif target_policy == "RAW":
        resolved_policy = "RAW"  # compute_irrigation_schedule defaults the target to RAW
    elif target_policy is not None:
        return {"ok": False, "model": IRRIGATION_DEMAND_MODEL, "decision": "INVALID",
                "errors": [_err("INVALID_TARGET", "target_policy",
                                f"target_policy must be FIELD_CAPACITY or RAW; got {target_policy!r}")]}
    else:
        return {"ok": False, "model": IRRIGATION_DEMAND_MODEL, "decision": "INVALID",
                "errors": [_err("MISSING_TARGET", "target",
                                "provide exactly one of target_depletion_mm, target_storage_mm, or target_policy (FIELD_CAPACITY|RAW)")]}

    # depletion at the current state (FC computed from the validated layers)
    fc = sum(float(l["theta_fc"]) * float(l["thickness_mm"]) for l in layers)
    dr = fc - s0
    sched_input["depletion_mm"] = dr

    sched = compute_irrigation_schedule(sched_input)
    if not sched["ok"]:
        return {"ok": False, "model": IRRIGATION_DEMAND_MODEL, "decision": "INVALID", "errors": sched["errors"]}
    sr = sched["result"]

    fc_storage = float(sr["fc_storage_mm"])
    taw = float(sr["taw_mm"])
    raw = float(sr["raw_mm"])
    wp = fc_storage - taw
    target_depletion = float(sr["target_depletion_mm"])
    target_storage = float(sr["target_storage_mm"])
    net = float(sr["net_irrigation_mm"])
    gross = sr["gross_irrigation_mm"]
    eff = sr["application_efficiency"]

    # target must lie within the physical domain [WP, FC]  <=>  target_depletion in [0, TAW]
    if target_depletion < -EPS or target_depletion > taw + EPS:
        return {"ok": False, "model": IRRIGATION_DEMAND_MODEL, "decision": "INVALID",
                "errors": [_err("INVALID_TARGET", "target",
                                f"target depletion must be within [0, TAW]; got {target_depletion}")]}

    ks = _ks(dr, taw, raw)
    eta = ks * etc
    stress_deficit = max(0.0, dr - raw)
    water_deficit = max(0.0, dr - target_depletion)
    irrigation_loss = (float(gross) - net) if gross is not None else None
    storage_after = s0 + net

    below_wp = s0 < wp - EPS
    above_fc = s0 > fc_storage + EPS
    demand_detected = net > EPS

    if below_wp:
        decision = "OUT_OF_DOMAIN"
    elif demand_detected:
        decision = "DEMAND"
    else:
        decision = "NO_DEMAND"

    # A numerical demand may exist outside the valid domain; an operational
    # recommendation is issued only when the state is within [WP, FC].
    irrigation_recommended = demand_detected and decision == "DEMAND"
    recommendation_restricted = demand_detected and decision != "DEMAND"
    restriction_reason = None
    if recommendation_restricted:
        restriction_reason = "BELOW_WILTING_POINT" if below_wp else "OUT_OF_DOMAIN"

    result = {
        "et0_mm": _round(et0),
        "kc": _round(kc),
        "etc_mm": _round(etc),
        "crop_water_demand_mm": _round(etc),
        "calculation_type": "CURRENT_STATE_TARGET_REPLENISHMENT",
        "temporal_basis": "current_state",
        "fc_storage_mm": _round(fc_storage),
        "wp_storage_mm": _round(wp),
        "taw_mm": _round(taw),
        "raw_mm": _round(raw),
        "initial_storage_mm": _round(s0),
        "depletion_mm": _round(dr),
        "ks": _round(ks, 6),
        "eta_mm": _round(eta),
        "ks_eta_role": "informational_stress_diagnostics",
        "target_policy": resolved_policy,
        "target_depletion_mm": _round(target_depletion),
        "target_storage_mm": _round(target_storage),
        "stress_deficit_mm": _round(stress_deficit),
        "water_deficit_mm": _round(water_deficit),
        "net_irrigation_mm": _round(net),
        "gross_irrigation_mm": _round(gross) if gross is not None else None,
        "application_efficiency": eff,
        "irrigation_loss_mm": _round(irrigation_loss) if irrigation_loss is not None else None,
        "irrigation_recommended": irrigation_recommended,
        "demand_detected": demand_detected,
        "recommendation_restricted": recommendation_restricted,
        "restriction_reason": restriction_reason,
        "storage_after_irrigation_mm": _round(storage_after),
        "storage_after_basis": "initial_storage + net_irrigation (no ET/other fluxes applied)",
        "below_wilting_point": below_wp,
        "above_field_capacity": above_fc,
        "unit": "mm",
    }
    provenance = {
        "model": IRRIGATION_DEMAND_MODEL["id"],
        "version": IRRIGATION_DEMAND_MODEL["version"],
        "target_policy": resolved_policy,
        "input_hash": sha256_json(_json_safe(input)),
        "result_hash": sha256_json(_json_safe(result)),
        "scientific_status": "NOT_VALIDATED",
    }
    return {
        "ok": True,
        "model": IRRIGATION_DEMAND_MODEL,
        "decision": decision,
        "result": result,
        "provenance": provenance,
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


IRRIGATION_DEMAND_DEFINITION = {
    "id": IRRIGATION_DEMAND_MODEL["id"],
    "version": IRRIGATION_DEMAND_MODEL["version"],
    "domain": "agriculture",
    "title": "Stress-aware irrigation demand & decision support",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "layers", "kind": "array", "required": True, "description": "{thickness_mm, theta_fc, theta_wp}"},
        {"name": "initial_storage_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "et0_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "kc", "kind": "number", "unit": "fraction", "required": True},
        {"name": "p", "kind": "number", "unit": "fraction", "required": True, "description": "FAO-56 depletion fraction in (0, 1)"},
        {"name": "target_depletion_mm", "kind": "number", "unit": "mm", "required": False},
        {"name": "target_storage_mm", "kind": "number", "unit": "mm", "required": False},
        {"name": "target_policy", "kind": "string", "required": False, "description": "FIELD_CAPACITY | RAW (used when no explicit target given)"},
        {"name": "application_efficiency", "kind": "number", "unit": "fraction", "required": False, "description": "0 < eff <= 1; gross irrigation only computed when supplied"},
    ],
    "outputs": [
        {"name": "decision", "kind": "string", "description": "DEMAND | NO_DEMAND | OUT_OF_DOMAIN"},
        {"name": "ks", "kind": "number", "description": "water-stress coefficient (informational diagnostic)"},
        {"name": "etc_mm", "kind": "number", "unit": "mm", "description": "crop demand"},
        {"name": "eta_mm", "kind": "number", "unit": "mm", "description": "stress-adjusted estimate (informational diagnostic)"},
        {"name": "net_irrigation_mm", "kind": "number", "unit": "mm"},
        {"name": "gross_irrigation_mm", "kind": "number", "unit": "mm"},
        {"name": "demand_detected", "kind": "boolean", "description": "numerical demand exists (net>0), regardless of domain"},
        {"name": "irrigation_recommended", "kind": "boolean", "description": "operational recommendation, only within [WP, FC]"},
        {"name": "recommendation_restricted", "kind": "boolean", "description": "demand exists but no recommendation (out of domain)"},
        {"name": "restriction_reason", "kind": "string"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_irrigation_demand.py", "notes": "software only; not scientific validation"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}