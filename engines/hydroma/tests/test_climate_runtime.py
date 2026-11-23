"""FE-3.19.5 Runtime/API execution + accumulation-contract tests (software only).

Verifies that the climate models execute through the real Runtime/API contract
(``executor(input_data)``), that invalid/rejected climate cannot bypass the gate,
and that the binding layer's accumulation-interval contract cannot be bypassed by
a Runtime/API adapter.
"""

import json

from fastapi.testclient import TestClient

from hydroma.api import create_app
from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.climate_qc_integration import verify_climate_provenance
from hydroma.jobs import JobStore
from hydroma.runtime import build_registry, execute_run

PS = "2026-01-01T00:00:00Z"
PE = "2026-01-02T00:00:00Z"
_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]
_SPEC = {
    "layers": _LAYERS, "initial_storage_mm": 60.0,
    "steps": [{"period_start": PS, "period_end": PE, "et_actual_mm": 5.0}],
}
_SIM_INPUT = {
    "period_start": PS, "period_end": PE, "layers": _LAYERS, "initial_storage_mm": 60.0,
    "steps": [{"period_start": PS, "period_end": PE, "precipitation_mm": 10.0,
               "irrigation_mm": 0.0, "et_actual_mm": 5.0, "runoff_mm": 0.0}],
}


def _series(value=10.0, with_accumulation=True):
    kw = {"accumulation_start": PS, "accumulation_end": PE} if with_accumulation else {}
    return ClimateSeries([ClimateObservation("precipitation", value, "mm", PE, "daily_sum", **kw)])


def _series_json(series):
    return json.loads(json.dumps(series.to_dict()))


def _run(model_id, input_data):
    store = JobStore(":memory:")
    registry = build_registry()
    run_id = store.create_run(model_id, "1.0.0", "probe", input_data)
    return execute_run(store, run_id, registry)


# --- Runtime ---------------------------------------------------------------

def test_runtime_sim_binding_executes():
    run = _run("eco-nojin.hydroma.climate-sim-binding",
               {"source": _series_json(_series()), "sim_spec": _SPEC})
    assert run["status"] == "completed"
    result = run["result_json"]
    assert result["status"] == "COMPLETED"
    assert result["simulation"]["result"]["final_storage_mm"] == 65.0
    assert verify_climate_provenance(result["provenance"])["valid"] is True


def test_runtime_qc_gate_executes():
    run = _run("eco-nojin.hydroma.climate-qc-gate",
               {"source": _series_json(_series()), "sim_input": _SIM_INPUT})
    assert run["status"] == "completed"
    assert run["result_json"]["status"] == "COMPLETED"


def test_runtime_missing_source_returns_structured_error():
    run = _run("eco-nojin.hydroma.climate-sim-binding", {"sim_spec": _SPEC})
    assert run["status"] == "completed"
    assert run["result_json"]["status"] == "FAILED"
    assert run["result_json"]["errors"][0]["code"] == "MISSING_INPUT"


def test_runtime_invalid_config_returns_structured_error():
    run = _run("eco-nojin.hydroma.climate-sim-binding",
               {"source": _series_json(_series()), "sim_spec": _SPEC, "config": 123})
    assert run["status"] == "completed"
    assert run["result_json"]["errors"][0]["code"] == "INVALID_INPUT"


def test_runtime_rejected_climate_is_blocked():
    run = _run("eco-nojin.hydroma.climate-sim-binding",
               {"source": _series_json(_series(value=-5.0)), "sim_spec": _SPEC})
    assert run["status"] == "completed"
    assert run["result_json"]["status"] == "BLOCKED"
    assert run["result_json"]["simulation"] is None


def test_runtime_accumulation_mismatch_is_binding_error():
    run = _run("eco-nojin.hydroma.climate-sim-binding",
               {"source": _series_json(_series(with_accumulation=False)), "sim_spec": _SPEC})
    assert run["status"] == "completed"
    assert run["result_json"]["status"] == "FAILED"
    assert run["result_json"]["reason_code"] == "BINDING_ERROR"
    assert run["result_json"]["errors"][0]["code"] == "MISSING_ACCUMULATION_INTERVAL"


def test_runtime_cannot_inject_precipitation():
    """A caller-supplied precipitation in sim_spec must be ignored; climate wins."""
    spec = json.loads(json.dumps(_SPEC))
    spec["steps"][0]["precipitation_mm"] = 999.0
    run = _run("eco-nojin.hydroma.climate-sim-binding",
               {"source": _series_json(_series(value=10.0)), "sim_spec": spec})
    assert run["status"] == "completed"
    result = run["result_json"]
    assert result["status"] == "COMPLETED"
    assert result["simulation"]["result"]["steps"][0]["precipitation_mm"] == 10.0
    assert result["mapping"][0]["precip_observation"]["value"] == 10.0


# --- API -------------------------------------------------------------------

def _client():
    return TestClient(create_app())


def test_api_sim_binding_end_to_end():
    client = _client()
    resp = client.post("/v1/runs", json={
        "model_id": "eco-nojin.hydroma.climate-sim-binding",
        "input": {"source": _series_json(_series()), "sim_spec": _SPEC},
    })
    assert resp.status_code == 202
    run_id = resp.json()["run_id"]
    run = client.get(f"/v1/runs/{run_id}").json()
    assert run["status"] == "completed"
    assert run["result_json"]["status"] == "COMPLETED"
    assert run["result_json"]["simulation"]["result"]["final_storage_mm"] == 65.0
    prov = client.get(f"/v1/runs/{run_id}/provenance").json()
    assert prov["result_hashes"] and prov["schema_version"]


def test_api_invalid_input_is_not_a_server_error():
    client = _client()
    resp = client.post("/v1/runs", json={
        "model_id": "eco-nojin.hydroma.climate-sim-binding",
        "input": {"sim_spec": _SPEC},
    })
    assert resp.status_code == 202
    run = client.get(f"/v1/runs/{resp.json()['run_id']}").json()
    assert run["status"] == "completed"
    assert run["result_json"]["errors"][0]["code"] == "MISSING_INPUT"


def test_api_rejected_climate_is_blocked():
    client = _client()
    resp = client.post("/v1/runs", json={
        "model_id": "eco-nojin.hydroma.climate-sim-binding",
        "input": {"source": _series_json(_series(value=-5.0)), "sim_spec": _SPEC},
    })
    run = client.get(f"/v1/runs/{resp.json()['run_id']}").json()
    assert run["status"] == "completed"
    assert run["result_json"]["status"] == "BLOCKED"