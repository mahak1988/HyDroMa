"""Phase 3.27 model-output evaluation integration tests (software only).

Verifies the model-output adapter, run evaluation workflow, matching and
integrity. Evaluation does NOT scientifically validate any model.
"""

import json

from fastapi.testclient import TestClient

from hydroma.api import create_app
from hydroma.evaluation import (
    evaluate_run,
    extract_model_outputs,
    verify_evaluation_report,
)
from hydroma.jobs import JobStore
from hydroma.runtime import build_registry, execute_run

D1 = "2026-01-01T00:00:00Z"
D2 = "2026-01-02T00:00:00Z"
D3 = "2026-01-03T00:00:00Z"
D4 = "2026-01-04T00:00:00Z"

_MAPPING = {
    "items_path": ["result", "steps"],
    "value_field": "final_storage_mm",
    "timestamp_field": "period_end",
    "variable": "soil_storage",
    "unit": "mm",
}


def _steps(vals):
    ends = [D2, D3, D4]
    starts = [D1, D2, D3]
    return [{"period_start": starts[i], "period_end": ends[i], "final_storage_mm": v}
            for i, v in enumerate(vals)]


def _run(vals, **over):
    r = {
        "run_id": "run-1", "model_id": "eco-nojin.hydroma.example", "model_version": "1.0.0",
        "status": "completed", "created_at": "2026-01-03T00:00:00Z",
        "result_json": {"result": {"steps": _steps(vals)}},
    }
    r.update(over)
    return r


def _ds(obs=None, role="VALIDATION", variable="soil_storage", unit="mm"):
    return {
        "dataset_id": "obs-1", "version": "1.0", "role": role, "variable": variable, "unit": unit,
        "observations": obs if obs is not None else [
            {"variable": variable, "value": 60.0, "unit": unit, "timestamp": D2, "quality_flag": "valid"},
            {"variable": variable, "value": 65.0, "unit": unit, "timestamp": D3, "quality_flag": "valid"},
            {"variable": variable, "value": 70.0, "unit": unit, "timestamp": D4, "quality_flag": "valid"},
        ],
    }


# --- model-output adapter --------------------------------------------------

def test_extract_model_outputs():
    out = extract_model_outputs(_run([61.0, 64.0, 72.0])["result_json"], _MAPPING)
    assert len(out) == 3
    assert out[0]["variable"] == "soil_storage"
    assert out[0]["unit"] == "mm"
    assert out[0]["timestamp"] == D2
    assert out[0]["value"] == 61.0


def test_extract_custom_fields():
    result = {"result": {"steps": [{"end": D2, "storage": 61.0}]}}
    mapping = {"items_path": ["result", "steps"], "value_field": "storage",
               "timestamp_field": "end", "variable": "soil_storage", "unit": "mm"}
    out = extract_model_outputs(result, mapping)
    assert out[0]["value"] == 61.0 and out[0]["timestamp"] == D2


def test_extract_single_item():
    result = {"value": 61.0, "timestamp": D2}
    mapping = {"value_field": "value", "timestamp_field": "timestamp",
               "variable": "soil_storage", "unit": "mm"}
    out = extract_model_outputs(result, mapping)
    assert len(out) == 1 and out[0]["value"] == 61.0


def test_extract_no_items():
    assert extract_model_outputs({"result": {"steps": []}}, _MAPPING) == []


# --- evaluation integration ------------------------------------------------

def test_evaluate_run_valid():
    r = evaluate_run(_run([61.0, 64.0, 72.0]), _ds(), _MAPPING)
    assert r["status"] == "COMPLETED"
    assert r["sample_count"] == 3
    assert r["run"]["run_id"] == "run-1"
    assert r["model"]["id"] == "eco-nojin.hydroma.example"
    assert r["metrics"]["mae"]["status"] == "OK"


def test_evaluate_run_metrics():
    r = evaluate_run(_run([61.0, 64.0, 72.0]), _ds(), _MAPPING)
    assert abs(r["metrics"]["mae"]["value"] - 1.3333) < 1e-3
    assert abs(r["metrics"]["rmse"]["value"] - 1.4142) < 1e-3
    assert abs(r["metrics"]["bias"]["value"] - 0.6667) < 1e-3


def test_evaluate_run_no_result():
    r = evaluate_run({"run_id": "x"}, _ds(), _MAPPING)
    assert r["status"] == "NO_RUN_RESULT"


def test_evaluate_run_no_outputs():
    r = evaluate_run({"run_id": "x", "result_json": {}}, _ds(), _MAPPING)
    assert r["status"] == "NO_MODEL_OUTPUTS"


def test_evaluate_run_role_mismatch():
    r = evaluate_run(_run([61.0, 64.0, 72.0]), _ds(role="CALIBRATION"), _MAPPING, expected_role="VALIDATION")
    assert r["status"] == "ROLE_MISMATCH"


def test_evaluate_run_undefined_metrics_single_sample():
    r = evaluate_run(_run([61.0]), _ds(obs=[{"variable": "soil_storage", "value": 60.0, "unit": "mm", "timestamp": D2, "quality_flag": "valid"}]), _MAPPING)
    assert r["metrics"]["nse"]["status"] == "UNDEFINED_INSUFFICIENT_SAMPLE"


def test_evaluate_run_empty_match():
    r = evaluate_run(_run([61.0, 64.0, 72.0]), _ds(variable="other"), _MAPPING)
    assert r["matching"]["matched_count"] == 0
    assert r["metrics"]["mae"]["status"] == "NO_DATA"


# --- matching --------------------------------------------------------------

def test_evaluate_run_time_tolerance():
    run = _run([61.0, 64.0, 72.0])
    run["result_json"]["result"]["steps"][0]["period_end"] = "2026-01-02T00:00:30Z"
    r = evaluate_run(run, _ds(), _MAPPING, matching_config={"time_tolerance_seconds": 60})
    assert r["sample_count"] == 3


def test_evaluate_run_unit_mismatch():
    ds = _ds(unit="cm")
    r = evaluate_run(_run([61.0, 64.0, 72.0]), ds, _MAPPING)
    assert r["matching"]["matched_count"] == 0
    assert r["matching"]["unmatched_model_count"] == 3


def test_evaluate_run_deterministic():
    a = evaluate_run(_run([61.0, 64.0, 72.0]), _ds(), _MAPPING)
    b = evaluate_run(_run([61.0, 64.0, 72.0]), _ds(), _MAPPING)
    assert a["provenance"]["result_hash"] == b["provenance"]["result_hash"]


# --- integrity -------------------------------------------------------------

def test_evaluate_run_result_hash():
    r = evaluate_run(_run([61.0, 64.0, 72.0]), _ds(), _MAPPING)
    assert verify_evaluation_report(r)["valid"] is True


def test_evaluate_run_tamper_detected():
    r = evaluate_run(_run([61.0, 64.0, 72.0]), _ds(), _MAPPING)
    t = json.loads(json.dumps(r))
    t["run"]["run_id"] = "tampered"
    v = verify_evaluation_report(t)
    assert v["valid"] is False
    assert {"code": "RESULT_HASH_MISMATCH"} in v["errors"]


def test_evaluate_run_dataset_hash_preserved():
    r = evaluate_run(_run([61.0, 64.0, 72.0]), _ds(), _MAPPING)
    assert r["dataset"]["hash"]


def test_evaluate_run_json_roundtrip():
    r = evaluate_run(_run([61.0, 64.0, 72.0]), _ds(), _MAPPING)
    assert verify_evaluation_report(json.loads(json.dumps(r)))["valid"] is True


# --- separation ------------------------------------------------------------

def test_evaluate_run_no_maturity_change():
    r = evaluate_run(_run([61.0, 64.0, 72.0]), _ds(), _MAPPING)
    assert r["model"]["scientific_status"] == "NOT_VALIDATED"
    assert r["scientific_status"] == "NOT_VALIDATED"


# --- runtime / API ---------------------------------------------------------

def _eval_run_input():
    return {"run": _run([61.0, 64.0, 72.0]), "dataset": _ds(), "output_mapping": _MAPPING}


def test_runtime_execution():
    store = JobStore(":memory:")
    reg = build_registry()
    rid = store.create_run("eco-nojin.hydroma.model-evaluation", "1.0.0", "alice", _eval_run_input())
    run = execute_run(store, rid, reg)
    assert run["status"] == "completed"
    assert run["result_json"]["status"] == "COMPLETED"
    assert run["result_json"]["run"]["run_id"] == "run-1"


def test_api_execution():
    c = TestClient(create_app())
    resp = c.post("/v1/runs", json={"model_id": "eco-nojin.hydroma.model-evaluation", "input": _eval_run_input()})
    run = c.get(f"/v1/runs/{resp.json()['run_id']}").json()
    assert run["status"] == "completed"
    assert run["result_json"]["sample_count"] == 3