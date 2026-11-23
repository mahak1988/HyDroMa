"""Phase 3.28 dataset-independence controls & evaluation protocol tests (software only).

Verifies conservative independence assessment and the protocol contract. No
scientific independence is proven by these tests.
"""

import json

from fastapi.testclient import TestClient

from hydroma.api import create_app
from hydroma.evaluation import (
    assess_dataset_independence,
    build_evaluation_protocol,
    verify_evaluation_protocol,
)
from hydroma.jobs import JobStore
from hydroma.runtime import build_registry, execute_run

D1 = "2026-01-01T00:00:00Z"
D2 = "2026-01-02T00:00:00Z"


def _o(ts, var="soil_storage", sp=None, oid=None):
    d = {"variable": var, "value": 1.0, "unit": "mm", "timestamp": ts, "quality_flag": "valid"}
    if sp is not None:
        d["spatial_id"] = sp
    if oid is not None:
        d["observation_id"] = oid
    return d


def _ds(id, role, obs):
    return {"dataset_id": id, "version": "1.0", "role": role, "variable": "soil_storage",
            "unit": "mm", "observations": obs}


# --- independence ----------------------------------------------------------

def test_same_observation_id():
    r = assess_dataset_independence(_ds("A", "CALIBRATION", [_o(D1, oid="X")]),
                                    _ds("B", "VALIDATION", [_o(D2, oid="X")]))
    assert r["status"] == "OVERLAP_DETECTED"
    assert any(c["type"] == "OBSERVATION_IDENTITY_OVERLAP" for c in r["conflicts"])


def test_overlap_tuple_diff_dataset_ids():
    r = assess_dataset_independence(_ds("A", "CALIBRATION", [_o(D1)]),
                                    _ds("B", "VALIDATION", [_o(D1)]))
    assert r["status"] == "OVERLAP_DETECTED"


def test_temporal_overlap():
    r = assess_dataset_independence(_ds("A", "CALIBRATION", [_o(D1, var="a")]),
                                    _ds("B", "VALIDATION", [_o(D1, var="b")]))
    assert r["status"] == "POTENTIAL_OVERLAP"
    assert any(i["type"] == "TIMESTAMP_OVERLAP" for i in r["indicators"])


def test_spatial_overlap():
    r = assess_dataset_independence(_ds("A", "CALIBRATION", [_o(D1, var="a", sp="S1")]),
                                    _ds("B", "VALIDATION", [_o(D2, var="b", sp="S1")]))
    assert r["status"] == "POTENTIAL_OVERLAP"
    assert any(i["type"] == "SPATIAL_OVERLAP" for i in r["indicators"])


def test_spatial_metadata_mismatch():
    r = assess_dataset_independence(_ds("A", "CALIBRATION", [_o(D1, var="a", sp="S1")]),
                                    _ds("B", "VALIDATION", [_o(D2, var="b", sp=None)]))
    assert r["status"] == "INDETERMINATE"
    assert "spatial_metadata_mismatch" in r["indeterminate_reasons"]


def test_missing_dataset_id_indeterminate():
    a = {"version": "1.0", "role": "CALIBRATION", "variable": "v", "unit": "mm", "observations": [_o(D1, var="a", sp="S1")]}
    r = assess_dataset_independence(a, _ds("B", "VALIDATION", [_o(D2, var="b", sp="S2")]))
    assert r["status"] == "INDETERMINATE"
    assert "a:missing_dataset_id" in r["indeterminate_reasons"]


def test_missing_version_indeterminate():
    a = _ds("A", "CALIBRATION", [_o(D1, var="a", sp="S1")]); a.pop("version")
    r = assess_dataset_independence(a, _ds("B", "VALIDATION", [_o(D2, var="b", sp="S2")]))
    assert r["status"] == "INDETERMINATE"


def test_same_role_potential_overlap():
    r = assess_dataset_independence(_ds("A", "VALIDATION", [_o(D1, var="a", sp="S1")]),
                                    _ds("B", "VALIDATION", [_o(D2, var="b", sp="S2")]))
    assert r["status"] == "POTENTIAL_OVERLAP"
    assert any(i["type"] == "SAME_ROLE" for i in r["indicators"])


def test_independent_full_metadata():
    r = assess_dataset_independence(_ds("A", "CALIBRATION", [_o(D1, var="a", sp="S1")]),
                                    _ds("B", "VALIDATION", [_o(D2, var="b", sp="S2")]))
    assert r["status"] == "INDEPENDENT"


def test_independent_no_spatial():
    r = assess_dataset_independence(_ds("A", "CALIBRATION", [_o(D1, var="a")]),
                                    _ds("B", "VALIDATION", [_o(D2, var="b")]))
    assert r["status"] == "INDEPENDENT"


def test_insufficient_metadata_not_independent():
    # missing spatial on one side must not yield INDEPENDENT
    r = assess_dataset_independence(_ds("A", "CALIBRATION", [_o(D1, var="a", sp="S1")]),
                                    _ds("B", "VALIDATION", [_o(D2, var="b", sp=None)]))
    assert r["status"] != "INDEPENDENT"


def test_conflicts_traceable():
    r = assess_dataset_independence(_ds("A", "CALIBRATION", [_o(D1, oid="X")]),
                                    _ds("B", "VALIDATION", [_o(D2, oid="X")]))
    c = r["conflicts"][0]
    assert c["type"] == "OBSERVATION_IDENTITY_OVERLAP"
    assert c["count"] == 1 and c["examples"]


def test_independence_deterministic():
    a = assess_dataset_independence(_ds("A", "CALIBRATION", [_o(D1)]), _ds("B", "VALIDATION", [_o(D1)]))
    b = assess_dataset_independence(_ds("A", "CALIBRATION", [_o(D1)]), _ds("B", "VALIDATION", [_o(D1)]))
    assert json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True)


# --- protocol --------------------------------------------------------------

def test_protocol_basic():
    p = build_evaluation_protocol({"id": "m", "version": "1"}, _ds("A", "VALIDATION", [_o(D1, var="a", sp="S1")]))
    assert p["protocol_id"] == "eco-nojin.hydroma.evaluation-protocol"
    assert p["model"]["id"] == "m"
    assert len(p["datasets"]) == 1
    assert p["variable"] == "soil_storage" and p["unit"] == "mm"
    assert p["scientific_status"] == "NOT_VALIDATED"


def test_protocol_reference_independent_ready():
    p = build_evaluation_protocol({"id": "m"}, _ds("A", "CALIBRATION", [_o(D1, var="a", sp="S1")]),
                                  _ds("B", "VALIDATION", [_o(D2, var="b", sp="S2")]))
    assert len(p["datasets"]) == 2
    assert p["independence"]["status"] == "INDEPENDENT"
    assert p["status"] == "READY"


def test_protocol_overlap_conflict():
    p = build_evaluation_protocol({"id": "m"}, _ds("A", "CALIBRATION", [_o(D1, oid="X")]),
                                  _ds("B", "VALIDATION", [_o(D2, oid="X")]))
    assert p["independence"]["status"] == "OVERLAP_DETECTED"
    assert p["status"] == "CONFLICT"


def test_protocol_indeterminate():
    a = {"version": "1.0", "role": "CALIBRATION", "variable": "v", "unit": "mm", "observations": [_o(D1, var="a", sp="S1")]}
    p = build_evaluation_protocol({"id": "m"}, a, _ds("B", "VALIDATION", [_o(D2, var="b", sp="S2")]))
    assert p["independence"]["status"] == "INDETERMINATE"
    assert p["status"] == "INDETERMINATE"


def test_protocol_no_maturity_change():
    p = build_evaluation_protocol({"id": "m", "version": "1"}, _ds("A", "VALIDATION", [_o(D1, var="a", sp="S1")]))
    assert p["model"]["scientific_status"] == "NOT_VALIDATED"
    assert p["scientific_status"] == "NOT_VALIDATED"


def test_protocol_hash_verifies():
    p = build_evaluation_protocol({"id": "m"}, _ds("A", "VALIDATION", [_o(D1, var="a", sp="S1")]),
                                  _ds("B", "VALIDATION", [_o(D2, var="b", sp="S2")]))
    assert verify_evaluation_protocol(p)["valid"] is True


def test_protocol_tamper_detected():
    p = build_evaluation_protocol({"id": "m"}, _ds("A", "VALIDATION", [_o(D1, var="a", sp="S1")]))
    t = json.loads(json.dumps(p)); t["variable"] = "tampered"
    v = verify_evaluation_protocol(t)
    assert v["valid"] is False
    assert {"code": "PROTOCOL_HASH_MISMATCH"} in v["errors"]


def test_protocol_json_roundtrip():
    p = build_evaluation_protocol({"id": "m"}, _ds("A", "VALIDATION", [_o(D1, var="a", sp="S1")]),
                                  _ds("B", "VALIDATION", [_o(D2, var="b", sp="S2")]))
    assert verify_evaluation_protocol(json.loads(json.dumps(p)))["valid"] is True


def test_protocol_dataset_hashes():
    p = build_evaluation_protocol({"id": "m"}, _ds("A", "VALIDATION", [_o(D1, var="a", sp="S1")]),
                                  _ds("B", "VALIDATION", [_o(D2, var="b", sp="S2")]))
    assert all(d.get("hash") for d in p["datasets"])


# --- runtime / API ---------------------------------------------------------

def _protocol_input():
    return {
        "model": {"id": "m", "version": "1"},
        "dataset": _ds("A", "CALIBRATION", [_o(D1, var="a", sp="S1")]),
        "reference_dataset": _ds("B", "VALIDATION", [_o(D2, var="b", sp="S2")]),
    }


def test_runtime_execution():
    store = JobStore(":memory:")
    reg = build_registry()
    rid = store.create_run("eco-nojin.hydroma.evaluation-protocol", "1.0.0", "alice", _protocol_input())
    run = execute_run(store, rid, reg)
    assert run["status"] == "completed"
    assert run["result_json"]["status"] == "READY"
    assert run["result_json"]["independence"]["status"] == "INDEPENDENT"


def test_api_execution():
    c = TestClient(create_app())
    resp = c.post("/v1/runs", json={"model_id": "eco-nojin.hydroma.evaluation-protocol", "input": _protocol_input()})
    run = c.get(f"/v1/runs/{resp.json()['run_id']}").json()
    assert run["status"] == "completed"
    assert run["result_json"]["status"] == "READY"