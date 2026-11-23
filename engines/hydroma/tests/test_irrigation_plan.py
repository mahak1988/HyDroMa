"""Integrated irrigation plan tests (software verification only; NOT validation)."""

import math

from hydroma.irrigation_plan import compute_irrigation_plan

_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]  # fc=90, wp=30, TAW=60


def _inp(**kw):
    base = {"et0_mm": 6.0, "kc": 0.8, "layers": _LAYERS, "initial_storage_mm": 60.0, "p": 0.5}
    base.update(kw)
    return base


def test_plan_no_trigger():
    # Dr=90-60=30 == RAW30 -> net 0, no trigger
    r = compute_irrigation_plan(_inp())
    assert r["ok"] is True
    x = r["result"]
    assert x["etc_mm"] == 4.8
    assert x["taw_mm"] == 60.0
    assert x["raw_mm"] == 30.0
    assert x["depletion_mm"] == 30.0
    assert x["net_irrigation_mm"] == 0.0
    assert x["irrigation_triggered"] is False
    assert x["post_irrigation_storage_mm"] == 60.0


def test_plan_trigger_with_efficiency():
    # init45 -> Dr=45 > RAW30 -> net=15, gross=15/0.8=18.75, post=min(90,45+15)=60
    r = compute_irrigation_plan(_inp(initial_storage_mm=45.0, application_efficiency=0.8))
    x = r["result"]
    assert x["net_irrigation_mm"] == 15.0
    assert math.isclose(x["gross_irrigation_mm"], 18.75, abs_tol=1e-6)
    assert x["irrigation_triggered"] is True
    assert x["post_irrigation_storage_mm"] == 60.0


def test_plan_above_field_capacity():
    # init100 -> Dr=-10 -> net 0, no trigger, post capped at fc=90
    r = compute_irrigation_plan(_inp(initial_storage_mm=100.0))
    x = r["result"]
    assert x["net_irrigation_mm"] == 0.0
    assert x["irrigation_triggered"] is False
    assert x["post_irrigation_storage_mm"] == 90.0


def test_above_fc_reports_excess():
    # excess above field capacity is made explicit (not silently discarded)
    r = compute_irrigation_plan(_inp(initial_storage_mm=100.0))
    x = r["result"]
    assert x["excess_mm"] == 10.0  # 100 - 90
    assert x["post_irrigation_storage_mm"] == 90.0


def test_at_wilting_point():
    r = compute_irrigation_plan(_inp(initial_storage_mm=30.0))
    x = r["result"]
    assert x["depletion_mm"] == 60.0  # fc90 - S30
    assert x["net_irrigation_mm"] == 30.0  # to target RAW30 -> storage60
    assert x["irrigation_triggered"] is True


def test_at_field_capacity():
    r = compute_irrigation_plan(_inp(initial_storage_mm=90.0))
    x = r["result"]
    assert x["depletion_mm"] == 0.0
    assert x["net_irrigation_mm"] == 0.0
    assert x["irrigation_triggered"] is False


def test_invalid_et0():
    r = compute_irrigation_plan(_inp(et0_mm=-1.0))
    assert r["ok"] is False


def test_invalid_initial():
    r = compute_irrigation_plan(_inp(initial_storage_mm=-1.0))
    assert r["ok"] is False


def test_invalid_efficiency():
    r = compute_irrigation_plan(_inp(application_efficiency=0.0))
    assert r["ok"] is False


def test_registered_and_executable_via_runtime():
    from hydroma.jobs import JobStore
    from hydroma.runtime import build_registry, execute_run

    reg = build_registry()
    assert reg.get("eco-nojin.hydroma.irrigation-plan") is not None
    store = JobStore(":memory:")
    rid = store.create_run("eco-nojin.hydroma.irrigation-plan", "1.0.0", "alice", _inp(initial_storage_mm=45.0))
    run = execute_run(store, rid, reg)
    assert run["status"] == "completed"
    assert math.isclose(run["result_json"]["result"]["net_irrigation_mm"], 15.0, abs_tol=1e-6)
    assert run["provenance_json"]["scientific_status"] == "NOT_VALIDATED"


def test_api_lists_model():
    from fastapi.testclient import TestClient
    from hydroma.api import create_app

    ids = {m["id"] for m in TestClient(create_app()).get("/v1/models").json()["models"]}
    assert "eco-nojin.hydroma.irrigation-plan" in ids
    assert "eco-nojin.hydroma.irrigation-schedule" in ids  # existing preserved


def test_existing_models_still_valid():
    from hydroma.registry import validate_definition
    from hydroma.crop_etc import FAO56_CROP_ETC_DEFINITION
    from hydroma.irrigation import IRRIGATION_DEFINITION
    from hydroma.root_zone_balance import ROOT_ZONE_BALANCE_DEFINITION

    for d in (FAO56_CROP_ETC_DEFINITION, IRRIGATION_DEFINITION, ROOT_ZONE_BALANCE_DEFINITION):
        validate_definition(d)