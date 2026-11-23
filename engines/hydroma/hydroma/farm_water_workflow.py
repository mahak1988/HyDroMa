"""Integrated Farm Water Management workflow (Phase 3.17).

A deterministic orchestration of existing HyDroMA models - it does NOT duplicate
them. Stages:

  1. climate      - validate explicit climate inputs (et0, precipitation)
  2. etc          - crop_etc.compute_crop_etc            (ETc = Kc*ET0)
  3. eff_precip   - effective_precip.compute_effective_precipitation (SCS-CN) if CN given, else NOT_AVAILABLE (uses raw P)
  4. root_zone    - root_zone_balance.compute_root_zone_balance (storage, excess, closure)
  5. prelim       - effective_precip.compute_preliminary_water_balance (Pe - ETc)
  6. irrigation   - irrigation_plan.compute_irrigation_plan (net/gross/trigger)

All stages share one explicit ``period`` (temporal consistency). Distinct
accounting views (total P in root-zone vs effective Pe in prelim) are reported
separately and never summed (no double counting). Software-tested; scientific
status NOT_VALIDATED. Not an optimizer, not a validated recommendation.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from .provenance import sha256_json
from .crop_etc import compute_crop_etc
from .effective_precip import compute_effective_precipitation, compute_preliminary_water_balance
from .root_zone_balance import compute_root_zone_balance
from .irrigation_plan import compute_irrigation_plan

__all__ = [
    "FARM_WATER_WORKFLOW_MODEL",
    "FARM_WATER_WORKFLOW_DEFINITION",
    "run_farm_water_workflow",
]

SCHEMA_VERSION = "1.0.0"

FARM_WATER_WORKFLOW_MODEL = {
    "id": "eco-nojin.hydroma.farm-water-workflow",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "stages": ["climate", "etc", "eff_precip", "root_zone", "prelim", "irrigation"],
}

ASSUMPTIONS = [
    "single_period",
    "explicit_inputs_only",
    "reuses_existing_models",
    "no_double_counting",
    "direct_input_mode_no_ingestion_qc",
]
LIMITATIONS = [
    "notValidated",
    "not_optimizer",
    "not_validated_recommendation",
    "single_period_not_multi_day",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). FAO Irrigation and Drainage Paper 56.",
]


def _stage(name: str, status: str, result: Optional[dict] = None, error: Optional[dict] = None) -> dict:
    return {"stage": name, "status": status, "result": result, "error": error}


def run_farm_water_workflow(input: dict | None = None) -> dict:
    input = input or {}
    period = input.get("period", "day")
    stages: List[dict] = []

    # Stage 1 — climate (explicit inputs present + finite)
    required = ["et0_mm", "kc", "precipitation_mm", "irrigation_mm", "et_actual_mm", "runoff_mm"]
    missing = [k for k in required if input.get(k) is None]
    if missing:
        stages.append(_stage("climate", "FAILED", error={"code": "MISSING_INPUT", "fields": missing}))
        return _finalize(input, period, stages, ok=False)
    stages.append(_stage("climate", "COMPLETED", result={"period": period}))

    # Stage 2 — ETc
    etc = compute_crop_etc({"et0_mm": input["et0_mm"], "kc": input["kc"], "period": period})
    if not etc["ok"]:
        stages.append(_stage("etc", "FAILED", error=etc["errors"]))
        return _finalize(input, period, stages, ok=False)
    etc_mm = etc["result"]["etc_mm"]
    stages.append(_stage("etc", "COMPLETED", result=etc["result"]))

    # Stage 3 — effective precipitation (optional; SCS-CN if curve_number given)
    if input.get("curve_number") is not None:
        ep = compute_effective_precipitation({"precipitation_mm": input["precipitation_mm"], "curve_number": input["curve_number"], "period": period})
        if not ep["ok"]:
            stages.append(_stage("eff_precip", "FAILED", error=ep["errors"]))
            return _finalize(input, period, stages, ok=False)
        pe = ep["result"]["effective_precipitation_mm"]
        stages.append(_stage("eff_precip", "COMPLETED", result=ep["result"]))
    else:
        pe = float(input["precipitation_mm"])
        stages.append(_stage("eff_precip", "NOT_AVAILABLE", result={"effective_precipitation_mm": pe, "note": "no curve_number; using raw precipitation"}))

    # Stage 4 — root-zone soil-water balance (uses total precipitation)
    rzb = compute_root_zone_balance({
        "layers": input.get("layers"), "initial_storage_mm": input.get("initial_storage_mm"),
        "precipitation_mm": input["precipitation_mm"], "irrigation_mm": input["irrigation_mm"],
        "et_actual_mm": input["et_actual_mm"], "runoff_mm": input["runoff_mm"],
        "deep_percolation_mm": input.get("deep_percolation_mm"), "period": period,
    })
    if not rzb["ok"]:
        stages.append(_stage("root_zone", "FAILED", error=rzb["errors"]))
        return _finalize(input, period, stages, ok=False)
    stages.append(_stage("root_zone", "COMPLETED", result=rzb["result"]))

    # Stage 5 — preliminary balance (Pe - ETc) — distinct view, not summed with root-zone
    pb = compute_preliminary_water_balance({"effective_precipitation_mm": pe, "etc_mm": etc_mm, "period": period})
    if not pb["ok"]:
        stages.append(_stage("prelim", "FAILED", error=pb["errors"]))
        return _finalize(input, period, stages, ok=False)
    stages.append(_stage("prelim", "COMPLETED", result=pb["result"]))

    # Stage 6 — irrigation plan (uses END-OF-PERIOD root-zone storage; explicit temporal interpretation)
    end_storage = rzb["result"]["final_storage_mm"]
    if end_storage < 0:
        stages.append(_stage("irrigation", "NOT_AVAILABLE", result={"reason": "out_of_domain", "end_storage_mm": end_storage}))
    else:
        ip = compute_irrigation_plan({
            "et0_mm": input["et0_mm"], "kc": input["kc"], "layers": input.get("layers"),
            "initial_storage_mm": end_storage, "p": input.get("p"),
            "application_efficiency": input.get("application_efficiency"),
            "target_depletion_mm": input.get("target_depletion_mm"),
        })
        if not ip["ok"]:
            stages.append(_stage("irrigation", "FAILED", error=ip["errors"]))
            return _finalize(input, period, stages, ok=False)
        stages.append(_stage("irrigation", "COMPLETED", result=ip["result"]))

    return _finalize(input, period, stages, ok=True)


def _finalize(input: dict, period: str, stages: List[dict], ok: bool) -> dict:
    any_failed = any(s["status"] == "FAILED" for s in stages)
    any_na = any(s["status"] == "NOT_AVAILABLE" for s in stages)
    if any_failed:
        status = "FAILED"
    elif not ok:
        status = "FAILED"
    elif any_na:
        status = "COMPLETED_WITH_WARNINGS"
    else:
        status = "COMPLETED"

    outputs: Dict[str, Any] = {}
    for s in stages:
        if s["status"] == "COMPLETED" and isinstance(s.get("result"), dict):
            outputs[s["stage"]] = s["result"]

    provenance = {
        "workflow": FARM_WATER_WORKFLOW_MODEL["id"],
        "version": FARM_WATER_WORKFLOW_MODEL["version"],
        "schema_version": SCHEMA_VERSION,
        "period": period,
        "input_hash": sha256_json(_json_safe(input)),
        "stages": [{"stage": s["stage"], "status": s["status"]} for s in stages],
        "result_hash": sha256_json(_json_safe(outputs)),
        "scientific_status": "NOT_VALIDATED",
    }
    return {"ok": ok and not any_failed, "status": status, "period": period, "input_mode": "direct", "stages": stages, "outputs": outputs, "provenance": provenance}


def _json_safe(obj):
    return json.loads(json.dumps(obj, default=str))


FARM_WATER_WORKFLOW_DEFINITION = {
    "id": FARM_WATER_WORKFLOW_MODEL["id"],
    "version": FARM_WATER_WORKFLOW_MODEL["version"],
    "domain": "agriculture",
    "title": "Integrated farm water management workflow",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm"],
    "precision": {"decimals": 4, "rounding": "half_up"},
    "inputs": [
        {"name": "period", "kind": "string", "required": False},
        {"name": "et0_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "kc", "kind": "number", "required": True},
        {"name": "layers", "kind": "array", "required": True},
        {"name": "initial_storage_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "p", "kind": "number", "required": True},
        {"name": "precipitation_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "irrigation_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "et_actual_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "runoff_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "deep_percolation_mm", "kind": "number", "unit": "mm", "required": False},
        {"name": "curve_number", "kind": "number", "required": False},
        {"name": "application_efficiency", "kind": "number", "required": False},
        {"name": "target_depletion_mm", "kind": "number", "unit": "mm", "required": False},
    ],
    "outputs": [
        {"name": "status", "kind": "string"},
        {"name": "stages", "kind": "array"},
        {"name": "outputs", "kind": "object"},
        {"name": "provenance", "kind": "object"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_farm_water_workflow.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}