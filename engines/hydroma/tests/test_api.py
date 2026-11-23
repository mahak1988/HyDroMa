import pytest
from fastapi.testclient import TestClient

from hydroma.api import create_app
from hydroma.run_local import is_loopback, main as run_local_main


def _client():
    return TestClient(create_app())


def test_health():
    resp = _client().get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_list_models_metadata():
    resp = _client().get("/v1/models")
    assert resp.status_code == 200
    models = resp.json()["models"]
    wb = next(m for m in models if m["id"] == "eco-nojin.hydroma.water-balance")
    assert wb["maturity"] == "tested"
    assert wb["scientific_status"] == "NOT_VALIDATED"
    assert wb["units"] == ["mm", "day", "ha", "m3"]


def test_run_lifecycle():
    client = _client()
    payload = {
        "model_id": "eco-nojin.hydroma.water-balance",
        "input": {"periodDays": 30, "precipitation": 100.0, "irrigation": 0.0,
                  "runoff": 20.0, "evapotranspiration": 60.0},
        "requested_by": "alice",
    }
    resp = client.post("/v1/runs", json=payload)
    assert resp.status_code == 202
    run_id = resp.json()["run_id"]

    run = client.get(f"/v1/runs/{run_id}").json()
    assert run["status"] == "completed"
    assert run["result_json"]["result"]["storageChangeMm"] == 20.0

    prov = client.get(f"/v1/runs/{run_id}/provenance")
    assert prov.status_code == 200
    body = prov.json()
    assert body["run_id"] == run_id
    assert len(body["result_hashes"]) == 1
    assert body["schema_version"]


def test_malformed_request_422():
    client = _client()
    # missing model_id
    resp = client.post("/v1/runs", json={"input": {}})
    assert resp.status_code == 422


def test_unknown_model_404():
    client = _client()
    resp = client.post("/v1/runs", json={"model_id": "does-not-exist", "input": {}})
    assert resp.status_code == 404


def test_unknown_run_404():
    client = _client()
    assert client.get("/v1/runs/nope").status_code == 404


def test_local_boundary_helper():
    assert is_loopback("127.0.0.1") is True
    assert is_loopback("localhost") is True
    assert is_loopback("::1") is True
    assert is_loopback("0.0.0.0") is False
    assert is_loopback("192.168.1.10") is False


def test_non_loopback_binding_refused_without_flag():
    # main() must refuse a non-loopback host before binding anything.
    with pytest.raises(SystemExit):
        run_local_main(["--host", "0.0.0.0", "--port", "9999"])