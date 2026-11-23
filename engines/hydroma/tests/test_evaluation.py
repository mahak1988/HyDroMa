"""Phase 3.26 scientific model-evaluation framework tests (software only).

These verify the dataset contract, matching, metrics and integrity. Computing
metrics does NOT scientifically validate any model.
"""

import json
import math

from fastapi.testclient import TestClient

from hydroma.api import create_app
from hydroma.evaluation import (
    compute_metrics,
    dataset_hash,
    evaluate_model_output,
    match_model_outputs,
    validate_dataset,
    verify_evaluation_report,
)
from hydroma.jobs import JobStore
from hydroma.runtime import build_registry, execute_run

D1 = "2026-01-01T00:00:00Z"
D2 = "2026-01-02T00:00:00Z"
D3 = "2026-01-03T00:00:00Z"


def _ds(role="VALIDATION", variable="soil_storage", unit="mm", obs=None):
    return {
        "dataset_id": "obs-1", "version": "1.0", "role": role, "variable": variable, "unit": unit,
        "observations": obs if obs is not None else [
            {"variable": variable, "value": 60.0, "unit": unit, "timestamp": D1, "quality_flag": "valid"},
            {"variable": variable, "value": 65.0, "unit": unit, "timestamp": D2, "quality_flag": "valid"},
            {"variable": variable, "value": 70.0, "unit": unit, "timestamp": D3, "quality_flag": "valid"},
        ],
    }


def _outs(vals=(61.0, 64.0, 72.0), variable="soil_storage", unit="mm", ts=(D1, D2, D3)):
    return [{"variable": variable, "value": v, "unit": unit, "timestamp": t} for v, t in zip(vals, ts)]


# --- dataset contract ------------------------------------------------------

def test_valid_dataset():
    assert validate_dataset(_ds())["valid"] is True


def test_missing_dataset_id():
    d = _ds(); d.pop("dataset_id")
    assert any(e["code"] == "MISSING_DATASET_ID" for e in validate_dataset(d)["errors"])


def test_invalid_role():
    assert any(e["code"] == "INVALID_ROLE" for e in validate_dataset(_ds(role="BOGUS"))["errors"])


def test_missing_variable():
    assert any(e["code"] == "MISSING_VARIABLE" for e in validate_dataset(_ds(variable=""))["errors"])


def test_unit_mismatch():
    d = _ds(obs=[{"variable": "soil_storage", "value": 60.0, "unit": "cm", "timestamp": D1, "quality_flag": "valid"}])
    assert any(e["code"] == "UNIT_MISMATCH" for e in validate_dataset(d)["errors"])


def test_missing_timestamp():
    d = _ds(obs=[{"variable": "soil_storage", "value": 60.0, "unit": "mm", "timestamp": None, "quality_flag": "valid"}])
    assert any(e["code"] == "INVALID_TIMESTAMP" for e in validate_dataset(d)["errors"])


def test_non_finite_value():
    d = _ds(obs=[{"variable": "soil_storage", "value": float("nan"), "unit": "mm", "timestamp": D1, "quality_flag": "valid"}])
    assert any(e["code"] == "NON_FINITE_VALUE" for e in validate_dataset(d)["errors"])


def test_duplicate_observation_warning():
    o = {"variable": "soil_storage", "value": 60.0, "unit": "mm", "timestamp": D1, "quality_flag": "valid"}
    d = _ds(obs=[o, dict(o)])
    v = validate_dataset(d)
    assert any(w["code"] == "DUPLICATE_OBSERVATION" for w in v["warnings"])


def test_dataset_hash_deterministic():
    assert dataset_hash(_ds()) == dataset_hash(_ds())
    d2 = _ds(); d2["observations"][0]["value"] = 61.0
    assert dataset_hash(_ds()) != dataset_hash(d2)


# --- matching --------------------------------------------------------------

def test_exact_match():
    m = match_model_outputs(_outs(), _ds())
    assert len(m["matched"]) == 3
    assert m["unmatched_model"] == []


def test_variable_mismatch():
    m = match_model_outputs(_outs(variable="other"), _ds())
    assert len(m["matched"]) == 0
    assert all(x["reason"] == "VARIABLE_MISMATCH" for x in m["unmatched_model"])


def test_unit_mismatch():
    m = match_model_outputs(_outs(unit="cm"), _ds())
    assert all(x["reason"] == "UNIT_MISMATCH" for x in m["unmatched_model"])


def test_spatial_mismatch():
    d = _ds(); d["spatial_id"] = "A"
    outs = _outs(); [o.update({"spatial_id": "B"}) for o in outs]
    m = match_model_outputs(outs, d)
    assert all(x["reason"] == "SPATIAL_MISMATCH" for x in m["unmatched_model"])


def test_spatial_required():
    m = match_model_outputs(_outs(), _ds(), {"require_spatial": True})
    assert all(x["reason"] == "SPATIAL_REQUIRED" for x in m["unmatched_model"])


def test_time_tolerance_match():
    outs = _outs(ts=("2026-01-01T00:00:30Z", D2, D3))
    m = match_model_outputs(outs, _ds(), {"time_tolerance_seconds": 60})
    assert len(m["matched"]) == 3


def test_time_tolerance_exceeded():
    outs = _outs(ts=("2026-01-01T00:02:00Z", D2, D3))
    m = match_model_outputs(outs, _ds(), {"time_tolerance_seconds": 60})
    assert all(x["reason"] == "NO_MATCHING_OBSERVATION" for x in m["unmatched_model"])


def test_duplicate_observations_ambiguous():
    o = {"variable": "soil_storage", "value": 60.0, "unit": "mm", "timestamp": D1, "quality_flag": "valid"}
    d = _ds(obs=[o, dict(o), {"variable": "soil_storage", "value": 65.0, "unit": "mm", "timestamp": D2, "quality_flag": "valid"}])
    m = match_model_outputs(_outs(vals=(61.0,), ts=(D1,)), d)
    assert all(x["reason"] == "AMBIGUOUS_MATCH" for x in m["unmatched_model"])


def test_missing_observation_excluded():
    d = _ds(obs=[
        {"variable": "soil_storage", "value": None, "unit": "mm", "timestamp": D1, "quality_flag": "missing"},
        {"variable": "soil_storage", "value": 65.0, "unit": "mm", "timestamp": D2, "quality_flag": "valid"},
    ])
    m = match_model_outputs(_outs(vals=(61.0, 64.0), ts=(D1, D2)), d)
    assert len(m["matched"]) == 1
    assert len(m["exclusions"]) == 1


def test_matching_deterministic():
    a = match_model_outputs(_outs(), _ds())
    b = match_model_outputs(_outs(), _ds())
    assert json.dumps(a, sort_keys=True, default=str) == json.dumps(b, sort_keys=True, default=str)


# --- metrics ---------------------------------------------------------------

def test_mae():
    assert compute_metrics([(10, 12), (20, 18)])["mae"]["value"] == 2.0


def test_rmse():
    assert compute_metrics([(10, 12), (20, 18)])["rmse"]["value"] == 2.0


def test_bias():
    assert compute_metrics([(10, 12), (20, 18)])["bias"]["value"] == 0.0


def test_nse_perfect():
    assert compute_metrics([(10, 10), (20, 20)])["nse"]["value"] == 1.0


def test_kge_perfect():
    assert compute_metrics([(10, 10), (20, 20)])["kge"]["value"] == 1.0


def test_zero_variance():
    m = compute_metrics([(5, 5), (5, 5)])
    assert m["nse"]["status"] == "UNDEFINED_ZERO_VARIANCE"
    assert m["kge"]["status"] == "UNDEFINED_ZERO_VARIANCE"


def test_empty_dataset():
    assert all(v["status"] == "NO_DATA" for v in compute_metrics([]).values())


def test_insufficient_sample():
    m = compute_metrics([(5, 6)])
    assert m["nse"]["status"] == "UNDEFINED_INSUFFICIENT_SAMPLE"
    assert m["kge"]["status"] == "UNDEFINED_INSUFFICIENT_SAMPLE"


def test_kge_undefined_zero_model_variance():
    m = compute_metrics([(5, 10), (5, 20)])  # model constant -> std_model=0
    assert m["kge"]["status"] == "UNDEFINED"


def test_non_finite_pairs_filtered():
    m = compute_metrics([(10, 12), (float("nan"), 18)])
    assert m["mae"]["status"] == "OK"


# --- calibration/validation separation -------------------------------------

def test_role_mismatch_rejected():
    r = evaluate_model_output({"id": "m"}, _ds(role="CALIBRATION"), _outs(), expected_role="VALIDATION")
    assert r["status"] == "ROLE_MISMATCH"


def test_role_preserved_in_report():
    r = evaluate_model_output({"id": "m"}, _ds(role="VALIDATION"), _outs())
    assert r["dataset"]["role"] == "VALIDATION"
    assert r["scientific_status"] == "NOT_VALIDATED"


def test_distinct_dataset_ids_distinct_hashes():
    a = _ds(); b = _ds(); b["dataset_id"] = "obs-2"
    assert dataset_hash(a) != dataset_hash(b)


# --- integrity -------------------------------------------------------------

def test_deterministic_report():
    a = evaluate_model_output({"id": "m", "version": "1"}, _ds(), _outs())
    b = evaluate_model_output({"id": "m", "version": "1"}, _ds(), _outs())
    assert a["provenance"]["result_hash"] == b["provenance"]["result_hash"]


def test_result_hash_verifies():
    r = evaluate_model_output({"id": "m"}, _ds(), _outs())
    assert verify_evaluation_report(r)["valid"] is True


def test_tamper_metrics_detected():
    r = evaluate_model_output({"id": "m"}, _ds(), _outs())
    t = json.loads(json.dumps(r)); t["metrics"]["mae"]["value"] = 999.0
    v = verify_evaluation_report(t)
    assert v["valid"] is False
    assert {"code": "RESULT_HASH_MISMATCH"} in v["errors"]


def test_tamper_dataset_detected():
    r = evaluate_model_output({"id": "m"}, _ds(), _outs())
    t = json.loads(json.dumps(r)); t["dataset"]["payload"]["observations"][0]["value"] = 1.0
    v = verify_evaluation_report(t)
    assert v["valid"] is False
    assert {"code": "DATASET_HASH_MISMATCH"} in v["errors"]


def test_json_roundtrip():
    r = evaluate_model_output({"id": "m"}, _ds(), _outs())
    assert verify_evaluation_report(json.loads(json.dumps(r)))["valid"] is True


# --- runtime / API ---------------------------------------------------------

def _eval_input():
    return {"model": {"id": "m", "version": "1"}, "dataset": _ds(), "model_outputs": _outs(),
            "matching": {"time_tolerance_seconds": 0}}


def test_runtime_execution():
    store = JobStore(":memory:")
    reg = build_registry()
    rid = store.create_run("eco-nojin.hydroma.model-evaluation", "1.0.0", "alice", _eval_input())
    run = execute_run(store, rid, reg)
    assert run["status"] == "completed"
    assert run["result_json"]["status"] == "COMPLETED"
    assert run["result_json"]["metrics"]["mae"]["status"] == "OK"


def test_api_execution():
    c = TestClient(create_app())
    resp = c.post("/v1/runs", json={"model_id": "eco-nojin.hydroma.model-evaluation", "input": _eval_input()})
    run = c.get(f"/v1/runs/{resp.json()['run_id']}").json()
    assert run["status"] == "completed"
    assert run["result_json"]["sample_count"] == 3