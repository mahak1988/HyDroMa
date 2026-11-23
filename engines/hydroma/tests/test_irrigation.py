"""Irrigation scheduling tests: independent hand-derived vectors + integration.

Expected values are hand-derived from FAO-56 (TAW, RAW=p*TAW, net=max(0,Dr-target),
gross=net/eff), NOT from the implementation. Software/mathematical verification only;
not scientific validation.
"""

import json
import math
import pathlib

import pytest

from hydroma.irrigation import compute_irrigation_schedule
from hydroma.verification import PASS, run_vectors

_VEC = pathlib.Path(__file__).resolve().parent / "vectors" / "irrigation_vectors.json"
_DATA = json.loads(_VEC.read_text(encoding="utf-8"))
_TOL = _DATA["tolerance"]


def _project(r):
    if not r.get("ok"):
        return {"ok": False, "taw_mm": None, "raw_mm": None, "depletion_mm": None,
                "current_storage_mm": None, "fc_storage_mm": None, "depletion_to_raw_mm": None,
                "depletion_to_wp_mm": None, "target_depletion_mm": None, "target_storage_mm": None,
                "deficit_to_target_mm": None, "net_irrigation_mm": None,
                "application_efficiency": None, "gross_irrigation_mm": None,
                "irrigation_recommended": None, "status": None, "errors": sorted({e["code"] for e in r.get("errors", [])})}
    x = r["result"]
    return {"ok": True, "taw_mm": x["taw_mm"], "raw_mm": x["raw_mm"], "depletion_mm": x["depletion_mm"],
            "current_storage_mm": x["current_storage_mm"], "fc_storage_mm": x["fc_storage_mm"],
            "depletion_to_raw_mm": x["depletion_to_raw_mm"], "depletion_to_wp_mm": x["depletion_to_wp_mm"],
            "target_depletion_mm": x["target_depletion_mm"], "target_storage_mm": x["target_storage_mm"],
            "deficit_to_target_mm": x["deficit_to_target_mm"], "net_irrigation_mm": x["net_irrigation_mm"],
            "application_efficiency": x["application_efficiency"], "gross_irrigation_mm": x["gross_irrigation_mm"],
            "irrigation_recommended": x["irrigation_recommended"], "status": x["status"], "errors": []}


def _assert_match(got, exp, ctx):
    for key, e in exp.items():
        g = got[key]
        if isinstance(e, (int, float)) and not isinstance(e, bool):
            assert math.isclose(g, e, abs_tol=_TOL), f"{ctx}: {key} got={g} exp={e}"
        else:
            assert g == e, f"{ctx}: {key} got={g!r} exp={e!r}"


@pytest.mark.parametrize("vec", _DATA["vectors"], ids=[v["id"] for v in _DATA["vectors"]])
def test_irrigation_matches_expected(vec):
    _assert_match(_project(compute_irrigation_schedule(vec["input"])), vec["expected"], vec["id"])


def test_verification_report_pass():
    report = run_vectors(
        "eco-nojin.hydroma.irrigation-schedule", "1.0.0",
        compute_irrigation_schedule, _DATA["vectors"], _project, tolerance=_TOL,
    )
    assert report.status == PASS
    assert report.failed == 0


def test_net_never_negative_and_gross_ge_net():
    r = compute_irrigation_schedule({
        "layers": [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}],
        "p": 0.5, "depletion_mm": 45, "application_efficiency": 0.7})
    assert r["result"]["net_irrigation_mm"] == 15.0
    assert math.isclose(r["result"]["gross_irrigation_mm"], 15.0 / 0.7, abs_tol=1e-3)
    # above target -> net 0, never negative
    r2 = compute_irrigation_schedule({
        "layers": [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}],
        "p": 0.5, "depletion_mm": 0})
    assert r2["result"]["net_irrigation_mm"] == 0.0


def test_registered_and_executable_via_runtime():
    from hydroma.jobs import JobStore
    from hydroma.runtime import build_registry, execute_run

    reg = build_registry()
    assert reg.get("eco-nojin.hydroma.irrigation-schedule") is not None
    store = JobStore(":memory:")
    run_id = store.create_run(
        "eco-nojin.hydroma.irrigation-schedule", "1.0.0", "alice",
        {"layers": [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}],
         "p": 0.5, "depletion_mm": 45},
    )
    run = execute_run(store, run_id, reg)
    assert run["status"] == "completed"
    assert math.isclose(run["result_json"]["result"]["net_irrigation_mm"], 15.0, abs_tol=1e-3)
    assert run["provenance_json"]["scientific_status"] == "NOT_VALIDATED"


def test_api_lists_all_models():
    from fastapi.testclient import TestClient
    from hydroma.api import create_app

    ids = {m["id"] for m in TestClient(create_app()).get("/v1/models").json()["models"]}
    assert "eco-nojin.hydroma.irrigation-schedule" in ids
    assert "eco-nojin.hydroma.fao56-crop-water" in ids


def test_existing_models_still_valid():
    from hydroma.registry import validate_definition
    from hydroma.water_balance import WATER_BALANCE_DEFINITION
    from hydroma.fao56_et0 import FAO56_ET0_DEFINITION
    from hydroma.soil_water import SOIL_WATER_DEFINITION
    from hydroma.daily_soil_water import DAILY_SOIL_WATER_DEFINITION
    from hydroma.crop_water import FAO56_CROP_WATER_DEFINITION, FAO56_CROP_CHAIN_DEFINITION
    from hydroma.irrigation import IRRIGATION_DEFINITION

    for d in (WATER_BALANCE_DEFINITION, FAO56_ET0_DEFINITION, SOIL_WATER_DEFINITION,
              DAILY_SOIL_WATER_DEFINITION, FAO56_CROP_WATER_DEFINITION, FAO56_CROP_CHAIN_DEFINITION,
              IRRIGATION_DEFINITION):
        validate_definition(d)


_L = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]


def test_recommendation_false_when_target_above_raw():
    # custom target (60) > RAW (30); Dr=45 below target -> net 0, recommendation False
    r = compute_irrigation_schedule({"layers": _L, "p": 0.5, "depletion_mm": 45, "target_depletion_mm": 60})
    assert r["result"]["net_irrigation_mm"] == 0.0
    assert r["result"]["irrigation_recommended"] is False


def test_recommendation_true_when_custom_target_stricter():
    # target=0 (< RAW 30); Dr=10 above target but below RAW -> net>0, recommendation True
    r = compute_irrigation_schedule({"layers": _L, "p": 0.5, "depletion_mm": 10, "target_depletion_mm": 0})
    assert r["result"]["net_irrigation_mm"] == 10.0
    assert r["result"]["irrigation_recommended"] is True


def test_recommendation_default_target_raw():
    r = compute_irrigation_schedule({"layers": _L, "p": 0.5, "depletion_mm": 45})
    assert r["result"]["net_irrigation_mm"] == 15.0
    assert r["result"]["irrigation_recommended"] is True


def test_recommendation_false_above_field_capacity():
    r = compute_irrigation_schedule({"layers": _L, "p": 0.5, "depletion_mm": -10})
    assert r["result"]["net_irrigation_mm"] == 0.0
    assert r["result"]["irrigation_recommended"] is False


def test_http_post_run_irrigation():
    from fastapi.testclient import TestClient
    from hydroma.api import create_app

    client = TestClient(create_app())
    payload = {
        "model_id": "eco-nojin.hydroma.irrigation-schedule",
        "input": {"layers": _L, "p": 0.5, "depletion_mm": 45},
        "requested_by": "alice",
    }
    resp = client.post("/v1/runs", json=payload)
    assert resp.status_code == 202
    run_id = resp.json()["run_id"]

    run = client.get(f"/v1/runs/{run_id}").json()
    assert run["status"] == "completed"
    assert math.isclose(run["result_json"]["result"]["net_irrigation_mm"], 15.0, abs_tol=1e-3)

    prov = client.get(f"/v1/runs/{run_id}/provenance").json()
    assert prov["model_id"] == "eco-nojin.hydroma.irrigation-schedule"
    assert prov["scientific_status"] == "NOT_VALIDATED"