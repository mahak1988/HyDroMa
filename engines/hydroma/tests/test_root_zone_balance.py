"""Root-zone soil-water balance tests (software verification only; NOT validation)."""

import math

from hydroma.root_zone_balance import compute_root_zone_balance

_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]  # fc=90, wp=30, TAW=60


def _inp(**kw):
    base = {"layers": _LAYERS, "initial_storage_mm": 60.0, "precipitation_mm": 10.0,
            "irrigation_mm": 0.0, "et_actual_mm": 5.0, "runoff_mm": 0.0}
    base.update(kw)
    return base


def test_basic():
    r = compute_root_zone_balance(_inp())
    assert r["ok"] is True
    x = r["result"]
    assert x["taw_mm"] == 60.0
    assert x["inflows_mm"] == 10.0
    assert x["outflows_mm"] == 5.0
    assert x["excess_mm"] == 0.0
    assert x["final_storage_mm"] == 65.0
    assert x["depletion_mm"] == 25.0
    assert x["status"] == "surplus"


def test_excess_above_field_capacity():
    r = compute_root_zone_balance(_inp(initial_storage_mm=80.0, precipitation_mm=40.0, et_actual_mm=5.0))
    x = r["result"]
    assert x["excess_mm"] == 25.0
    assert x["final_storage_mm"] == 90.0  # capped at field capacity


def test_deep_percolation_loss():
    r = compute_root_zone_balance(_inp(precipitation_mm=0.0, et_actual_mm=5.0, deep_percolation_mm=10.0))
    x = r["result"]
    assert x["deep_percolation_mm"] == 10.0
    assert x["final_storage_mm"] == 45.0  # 60 - 5 - 10


def test_closure_residual():
    r = compute_root_zone_balance(_inp(measured_storage_change_mm=18.0))
    x = r["result"]
    # storage_change = 65-60 = 5; residual = 5 - 18 = -13
    assert x["residual_mm"] == -13.0
    assert x["closure"] is False


def test_out_of_domain_negative_storage():
    r = compute_root_zone_balance(_inp(initial_storage_mm=10.0, et_actual_mm=200.0, runoff_mm=0.0, precipitation_mm=0.0))
    x = r["result"]
    assert x["out_of_domain"] is True
    assert x["final_storage_mm"] == -190.0  # not clamped


def test_negative_precip_rejected():
    r = compute_root_zone_balance(_inp(precipitation_mm=-1.0))
    assert r["ok"] is False


def test_invalid_layer_rejected():
    bad = [{"thickness_mm": 300, "theta_fc": 0.10, "theta_wp": 0.20}]
    r = compute_root_zone_balance(_inp(layers=bad))
    assert r["ok"] is False


def test_registered_and_executable_via_runtime():
    from hydroma.jobs import JobStore
    from hydroma.runtime import build_registry, execute_run

    reg = build_registry()
    assert reg.get("eco-nojin.hydroma.root-zone-balance") is not None
    store = JobStore(":memory:")
    rid = store.create_run("eco-nojin.hydroma.root-zone-balance", "1.0.0", "alice", _inp())
    run = execute_run(store, rid, reg)
    assert run["status"] == "completed"
    assert math.isclose(run["result_json"]["result"]["final_storage_mm"], 65.0, abs_tol=1e-6)
    assert run["provenance_json"]["scientific_status"] == "NOT_VALIDATED"


def test_api_lists_model():
    from fastapi.testclient import TestClient
    from hydroma.api import create_app

    ids = {m["id"] for m in TestClient(create_app()).get("/v1/models").json()["models"]}
    assert "eco-nojin.hydroma.root-zone-balance" in ids
    assert "eco-nojin.hydroma.daily-soil-water" in ids  # existing preserved


def test_existing_models_still_valid():
    from hydroma.registry import validate_definition
    from hydroma.soil_water import SOIL_WATER_DEFINITION
    from hydroma.daily_soil_water import DAILY_SOIL_WATER_DEFINITION
    from hydroma.effective_precip import EFFECTIVE_PRECIP_DEFINITION

    for d in (SOIL_WATER_DEFINITION, DAILY_SOIL_WATER_DEFINITION, EFFECTIVE_PRECIP_DEFINITION):
        validate_definition(d)