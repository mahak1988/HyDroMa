"""FAO-56 crop ET (ETc = Kc*ET0) tests - software verification only, NOT validation."""

import math

from hydroma.crop_etc import compute_crop_etc


def test_basic():
    r = compute_crop_etc({"et0_mm": 6.0, "kc": 0.8})
    assert r["ok"] is True
    assert math.isclose(r["result"]["etc_mm"], 4.8, abs_tol=1e-6)
    assert r["result"]["unit"] == "mm/day"


def test_kc_zero():
    r = compute_crop_etc({"et0_mm": 6.0, "kc": 0.0})
    assert r["result"]["etc_mm"] == 0.0


def test_et0_zero():
    r = compute_crop_etc({"et0_mm": 0.0, "kc": 0.8})
    assert r["result"]["etc_mm"] == 0.0


def test_period_label():
    r = compute_crop_etc({"et0_mm": 5.0, "kc": 1.0, "period": "period"})
    assert r["result"]["etc_mm"] == 5.0
    assert r["result"]["unit"] == "mm/period"


def test_negative_et0_rejected():
    r = compute_crop_etc({"et0_mm": -1.0, "kc": 0.8})
    assert r["ok"] is False
    assert any(e["code"] == "INVALID_ET0" for e in r["errors"])


def test_negative_kc_rejected():
    r = compute_crop_etc({"et0_mm": 6.0, "kc": -0.5})
    assert r["ok"] is False
    assert any(e["code"] == "INVALID_KC" for e in r["errors"])


def test_non_finite_rejected():
    r = compute_crop_etc({"et0_mm": "NaN", "kc": 0.8})
    assert r["ok"] is False
    assert any(e["code"] == "INVALID_ET0" for e in r["errors"])


def test_invalid_period_rejected():
    r = compute_crop_etc({"et0_mm": 6.0, "kc": 0.8, "period": "week"})
    assert r["ok"] is False
    assert any(e["code"] == "INVALID_PERIOD" for e in r["errors"])


def test_registered_and_executable_via_runtime():
    from hydroma.jobs import JobStore
    from hydroma.runtime import build_registry, execute_run

    reg = build_registry()
    assert reg.get("eco-nojin.hydroma.fao56-crop-etc") is not None
    store = JobStore(":memory:")
    run_id = store.create_run("eco-nojin.hydroma.fao56-crop-etc", "1.0.0", "alice",
                              {"et0_mm": 6.0, "kc": 0.8})
    run = execute_run(store, run_id, reg)
    assert run["status"] == "completed"
    assert math.isclose(run["result_json"]["result"]["etc_mm"], 4.8, abs_tol=1e-6)
    assert run["provenance_json"]["scientific_status"] == "NOT_VALIDATED"


def test_api_lists_crop_etc():
    from fastapi.testclient import TestClient
    from hydroma.api import create_app

    ids = {m["id"] for m in TestClient(create_app()).get("/v1/models").json()["models"]}
    assert "eco-nojin.hydroma.fao56-crop-etc" in ids
    assert "eco-nojin.hydroma.fao56-crop-water" in ids  # existing preserved


def test_existing_models_still_valid():
    from hydroma.registry import validate_definition
    from hydroma.water_balance import WATER_BALANCE_DEFINITION
    from hydroma.fao56_et0 import FAO56_ET0_DEFINITION
    from hydroma.soil_water import SOIL_WATER_DEFINITION
    from hydroma.daily_soil_water import DAILY_SOIL_WATER_DEFINITION
    from hydroma.crop_water import FAO56_CROP_WATER_DEFINITION
    from hydroma.irrigation import IRRIGATION_DEFINITION
    from hydroma.crop_etc import FAO56_CROP_ETC_DEFINITION

    for d in (WATER_BALANCE_DEFINITION, FAO56_ET0_DEFINITION, SOIL_WATER_DEFINITION,
              DAILY_SOIL_WATER_DEFINITION, FAO56_CROP_WATER_DEFINITION, IRRIGATION_DEFINITION,
              FAO56_CROP_ETC_DEFINITION):
        validate_definition(d)