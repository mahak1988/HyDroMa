"""Integrated farm water management workflow tests (software only; NOT validation)."""

import math

from hydroma.farm_water_workflow import run_farm_water_workflow

_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]


def _inp(**kw):
    base = {
        "period": "day", "et0_mm": 6.0, "kc": 0.8, "layers": _LAYERS,
        "initial_storage_mm": 60.0, "p": 0.5, "precipitation_mm": 10.0,
        "irrigation_mm": 0.0, "et_actual_mm": 5.0, "runoff_mm": 0.0,
        "curve_number": 75,
    }
    base.update(kw)
    return base


def test_full_flow():
    r = run_farm_water_workflow(_inp())
    assert r["ok"] is True
    assert r["status"] == "COMPLETED"
    st = {s["stage"]: s["status"] for s in r["stages"]}
    assert st["climate"] == "COMPLETED"
    assert st["etc"] == "COMPLETED"
    assert st["eff_precip"] == "COMPLETED"
    assert st["root_zone"] == "COMPLETED"
    assert st["prelim"] == "COMPLETED"
    assert st["irrigation"] == "COMPLETED"
    assert math.isclose(r["outputs"]["etc"]["etc_mm"], 4.8, abs_tol=1e-6)
    assert r["outputs"]["root_zone"]["final_storage_mm"] == 65.0
    assert math.isclose(r["outputs"]["prelim"]["balance_mm"], 5.2, abs_tol=1e-6)  # Pe(10) - etc(4.8)


def test_no_curve_number_marks_eff_precip_unavailable():
    r = run_farm_water_workflow(_inp(curve_number=None))
    assert r["ok"] is True
    assert r["status"] == "COMPLETED_WITH_WARNINGS"
    st = {s["stage"]: s["status"] for s in r["stages"]}
    assert st["eff_precip"] == "NOT_AVAILABLE"


def test_missing_input_fails_climate():
    r = run_farm_water_workflow({"et0_mm": 6.0, "kc": 0.8})
    assert r["ok"] is False
    assert r["status"] == "FAILED"
    st = {s["stage"]: s["status"] for s in r["stages"]}
    assert st["climate"] == "FAILED"


def test_invalid_et0_fails_etc():
    r = run_farm_water_workflow(_inp(et0_mm=-1.0))
    assert r["ok"] is False
    st = {s["stage"]: s["status"] for s in r["stages"]}
    assert st["etc"] == "FAILED"


def test_no_double_counting():
    # root_zone uses total precipitation; prelim uses effective precipitation; distinct stages
    r = run_farm_water_workflow(_inp())
    rz = r["outputs"]["root_zone"]
    pb = r["outputs"]["prelim"]
    assert rz["precipitation_mm"] == 10.0
    assert pb["effective_precipitation_mm"] == 10.0  # P=10 < Ia -> Pe=P
    # they are separate stage outputs, not summed
    assert "root_zone" in r["outputs"] and "prelim" in r["outputs"]


def test_irrigation_uses_end_of_period_storage():
    # initial 60, P10, ET5 -> end storage 65; irrigation Dr = 90-65 = 25 (NOT 90-60=30)
    r = run_farm_water_workflow(_inp(initial_storage_mm=60.0, precipitation_mm=10.0, et_actual_mm=5.0))
    irr = next(s for s in r["stages"] if s["stage"] == "irrigation")
    assert irr["status"] == "COMPLETED"
    assert irr["result"]["depletion_mm"] == 25.0
    assert r["input_mode"] == "direct"


def test_irrigation_blocked_when_out_of_domain():
    # initial 10, ET 200 -> end storage negative -> irrigation NOT_AVAILABLE (no silent clamp)
    r = run_farm_water_workflow(_inp(initial_storage_mm=10.0, precipitation_mm=0.0, et_actual_mm=200.0, runoff_mm=0.0))
    irr = next(s for s in r["stages"] if s["stage"] == "irrigation")
    assert irr["status"] == "NOT_AVAILABLE"
    assert irr["result"]["reason"] == "out_of_domain"


def test_provenance_hashes():
    r = run_farm_water_workflow(_inp())
    prov = r["provenance"]
    assert prov["workflow"] == "eco-nojin.hydroma.farm-water-workflow"
    assert prov["scientific_status"] == "NOT_VALIDATED"
    assert prov["input_hash"] and prov["result_hash"]
    # deterministic
    r2 = run_farm_water_workflow(_inp())
    assert r2["provenance"]["result_hash"] == prov["result_hash"]


def test_registered_and_executable_via_runtime():
    from hydroma.jobs import JobStore
    from hydroma.runtime import build_registry, execute_run

    reg = build_registry()
    assert reg.get("eco-nojin.hydroma.farm-water-workflow") is not None
    store = JobStore(":memory:")
    rid = store.create_run("eco-nojin.hydroma.farm-water-workflow", "1.0.0", "alice", _inp())
    run = execute_run(store, rid, reg)
    assert run["status"] == "completed"
    assert run["result_json"]["status"] == "COMPLETED"
    assert run["provenance_json"]["scientific_status"] == "NOT_VALIDATED"


def test_api_lists_model():
    from fastapi.testclient import TestClient
    from hydroma.api import create_app

    ids = {m["id"] for m in TestClient(create_app()).get("/v1/models").json()["models"]}
    assert "eco-nojin.hydroma.farm-water-workflow" in ids
    assert "eco-nojin.hydroma.irrigation-plan" in ids  # existing preserved


def test_existing_models_still_valid():
    from hydroma.registry import validate_definition
    from hydroma.crop_etc import FAO56_CROP_ETC_DEFINITION
    from hydroma.root_zone_balance import ROOT_ZONE_BALANCE_DEFINITION
    from hydroma.irrigation_plan import IRRIGATION_PLAN_DEFINITION
    from hydroma.effective_precip import EFFECTIVE_PRECIP_DEFINITION

    for d in (FAO56_CROP_ETC_DEFINITION, ROOT_ZONE_BALANCE_DEFINITION, IRRIGATION_PLAN_DEFINITION, EFFECTIVE_PRECIP_DEFINITION):
        validate_definition(d)