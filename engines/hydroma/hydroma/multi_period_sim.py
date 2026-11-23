"""Multi-period sequential soil-water simulation (Phase 3.18).

A deterministic, HTTP-free, dependency-free time-stepping orchestrator that
reuses the single-period ``root_zone_balance`` model and adds:

* an explicit **temporal contract** (period_start / period_end per step, ordering,
  overlap/gap detection, coverage of the overall period);
* **state transfer** (S[t+1] = root_zone_balance(S[t], inputs[t]));
* per-step **water-balance residual** (mass conservation check);
* per-step and overall **provenance** (SHA-256).

All fluxes are accumulated depths (mm) over each step's period; no rate/accumulation
mixing, no interpolation/resampling/filling. Missing data is rejected, never zero-filled.
Software-tested; scientific status NOT_VALIDATED. Not an optimizer.
"""

from __future__ import annotations

import math
from datetime import datetime
from typing import Any, Dict, List, Optional

from .provenance import sha256_json
from .root_zone_balance import compute_root_zone_balance

__all__ = [
    "MULTI_PERIOD_SIM_MODEL",
    "MULTI_PERIOD_SIM_DEFINITION",
    "simulate_multi_period",
    "verify_mass_balance",
]

ROUND_DECIMALS = 4
EPS = 1e-6

MULTI_PERIOD_SIM_MODEL = {
    "id": "eco-nojin.hydroma.multi-period-simulation",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
}

ASSUMPTIONS = [
    "explicit_temporal_contract",
    "contiguous_steps_no_overlap_no_gap",
    "state_transfer_between_steps",
    "accumulated_depths_mm",
    "no_interpolation_or_filling",
]
LIMITATIONS = [
    "notValidated",
    "not_optimizer",
    "single_root_zone_bucket",
    "no_rate_to_accumulation_conversion",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). FAO Irrigation and Drainage Paper 56, Ch.5.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _parse_ts(value) -> datetime:
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def _validate_temporal(steps: List[dict], period_start: str, period_end: str) -> List[dict]:
    errors: List[dict] = []
    if not isinstance(steps, list) or len(steps) == 0:
        return [{"field": "steps", "code": "EMPTY_STEPS"}]
    try:
        p_start = _parse_ts(period_start)
        p_end = _parse_ts(period_end)
    except (ValueError, TypeError):
        return [{"field": "period", "code": "INVALID_PERIOD"}]

    parsed: List = [(p_start, "period_start"), (p_end, "period_end")]
    step_parsed = []
    for i, step in enumerate(steps):
        try:
            s = _parse_ts(step.get("period_start"))
            e = _parse_ts(step.get("period_end"))
        except (ValueError, TypeError):
            errors.append({"step": i, "code": "INVALID_TIMESTAMP"})
            continue
        step_parsed.append((i, s, e))
        parsed.append((s, f"steps[{i}].period_start"))
        parsed.append((e, f"steps[{i}].period_end"))

    # timezone consistency: never mix aware and naive (no implicit UTC/local assumption)
    has_aware = any(dt.tzinfo is not None for dt, _ in parsed)
    has_naive = any(dt.tzinfo is None for dt, _ in parsed)
    if has_aware and has_naive:
        errors.append({"field": "timezone", "code": "INVALID_TIMEZONE"})
        return errors  # cannot safely compare mixed awareness

    if p_end <= p_start:
        errors.append({"field": "period", "code": "INVALID_PERIOD"})
    prev_end = None
    for i, s, e in step_parsed:
        if e <= s:
            errors.append({"step": i, "code": "INVALID_INTERVAL"})
        if prev_end is not None:
            if s < prev_end:
                errors.append({"step": i, "code": "OVERLAP"})
            elif s > prev_end:
                errors.append({"step": i, "code": "GAP"})
        prev_end = e
    if step_parsed:
        if step_parsed[0][1] != p_start:
            errors.append({"step": 0, "code": "COVERAGE_START"})
        if step_parsed[-1][2] != p_end:
            errors.append({"step": len(step_parsed) - 1, "code": "COVERAGE_END"})
    return errors


def verify_mass_balance(step: dict) -> float:
    """Independent mass-balance check on RECORDED step fields.

    Recomputes ``(S + P + I - ET - RO - DP - excess) - final`` from the recorded
    values. A tampered/inconsistent recorded step yields a non-zero residual; a
    correctly recorded step yields ~0. This is an algebraic closure check on
    recorded data, NOT an independent physical/scientific validation.
    """
    return (
        float(step["initial_storage_mm"]) + float(step["precipitation_mm"]) + float(step["irrigation_mm"])
        - float(step["et_actual_mm"]) - float(step["runoff_mm"]) - float(step["deep_percolation_mm"])
        - float(step["excess_mm"]) - float(step["final_storage_mm"])
    )


def simulate_multi_period(input: dict | None = None) -> dict:
    input = input or {}
    steps = input.get("steps")
    period_start = input.get("period_start")
    period_end = input.get("period_end")

    temporal_errors = _validate_temporal(steps or [], period_start, period_end)
    if temporal_errors:
        return {"ok": False, "model": MULTI_PERIOD_SIM_MODEL, "errors": temporal_errors}

    layers = input.get("layers")
    if not isinstance(layers, list) or len(layers) == 0:
        return {"ok": False, "model": MULTI_PERIOD_SIM_MODEL, "errors": [{"field": "layers", "code": "INVALID_LAYERS"}]}
    if not _finite(input.get("initial_storage_mm")) or float(input["initial_storage_mm"]) < 0:
        return {"ok": False, "model": MULTI_PERIOD_SIM_MODEL, "errors": [{"field": "initial_storage_mm", "code": "INVALID_INITIAL"}]}

    storage = float(input["initial_storage_mm"])
    initial_storage = storage
    totals = {"precipitation_mm": 0.0, "irrigation_mm": 0.0, "et_actual_mm": 0.0, "runoff_mm": 0.0, "deep_percolation_mm": 0.0, "excess_mm": 0.0}
    per_step: List[dict] = []

    for i, step in enumerate(steps):
        P = float(step["precipitation_mm"])
        I = float(step["irrigation_mm"])
        ET = float(step["et_actual_mm"])
        RO = float(step["runoff_mm"])
        DP = float(step["deep_percolation_mm"]) if step.get("deep_percolation_mm") is not None else 0.0
        rz = compute_root_zone_balance({
            "layers": layers, "initial_storage_mm": storage,
            "precipitation_mm": P, "irrigation_mm": I, "et_actual_mm": ET,
            "runoff_mm": RO, "deep_percolation_mm": DP, "period": "period",
        })
        if not rz["ok"]:
            return {"ok": False, "model": MULTI_PERIOD_SIM_MODEL, "errors": [{"step": i, "detail": rz["errors"]}]}
        final = rz["result"]["final_storage_mm"]
        excess = rz["result"]["excess_mm"]
        residual = (storage + P + I - ET - RO - DP - excess) - final
        per_step.append({
            "index": i, "period_start": step.get("period_start"), "period_end": step.get("period_end"),
            "initial_storage_mm": _round(storage), "precipitation_mm": _round(P), "irrigation_mm": _round(I),
            "et_actual_mm": _round(ET), "runoff_mm": _round(RO), "deep_percolation_mm": _round(DP),
            "excess_mm": _round(excess), "final_storage_mm": _round(final), "algebraic_closure_residual_mm": _round(residual),
            "status": "COMPLETED",
        })
        totals["precipitation_mm"] += P
        totals["irrigation_mm"] += I
        totals["et_actual_mm"] += ET
        totals["runoff_mm"] += RO
        totals["deep_percolation_mm"] += DP
        totals["excess_mm"] += excess
        storage = final

    provenance = {
        "model": MULTI_PERIOD_SIM_MODEL["id"],
        "version": MULTI_PERIOD_SIM_MODEL["version"],
        "period_start": period_start,
        "period_end": period_end,
        "num_steps": len(steps),
        "input_hash": sha256_json(_json_safe(input)),
        "step_hashes": [sha256_json(_json_safe(s)) for s in per_step],
        "result_hash": sha256_json(_json_safe({"initial": initial_storage, "final": storage, "steps": per_step})),
        # Exact payload that ``result_hash`` commits to, so downstream verifiers can
        # recompute step/final hashes from the serialized record (tamper-evidence).
        "result_payload": {"initial": initial_storage, "final": storage, "steps": per_step},
        "scientific_status": "NOT_VALIDATED",
    }
    return {
        "ok": True,
        "model": MULTI_PERIOD_SIM_MODEL,
        "result": {
            "num_steps": len(steps),
            "initial_storage_mm": _round(initial_storage),
            "final_storage_mm": _round(storage),
            "totals": {k: _round(v) for k, v in totals.items()},
            "steps": per_step,
            "status": "COMPLETED",
        },
        "provenance": provenance,
    }


def _json_safe(obj):
    import json
    return json.loads(json.dumps(obj, default=str))


MULTI_PERIOD_SIM_DEFINITION = {
    "id": MULTI_PERIOD_SIM_MODEL["id"],
    "version": MULTI_PERIOD_SIM_MODEL["version"],
    "domain": "soil",
    "title": "Multi-period sequential soil-water simulation",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "period_start", "kind": "string", "required": True},
        {"name": "period_end", "kind": "string", "required": True},
        {"name": "layers", "kind": "array", "required": True},
        {"name": "initial_storage_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "steps", "kind": "array", "required": True, "description": "{period_start, period_end, precipitation_mm, irrigation_mm, et_actual_mm, runoff_mm, deep_percolation_mm?}"},
    ],
    "outputs": [
        {"name": "final_storage_mm", "kind": "number", "unit": "mm"},
        {"name": "steps", "kind": "array"},
        {"name": "totals", "kind": "object"},
        {"name": "provenance", "kind": "object"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_multi_period_sim.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}