"""Effective precipitation (SCS-CN) & preliminary water balance tests (software only)."""

import math

from hydroma.effective_precip import (
    compute_effective_precipitation,
    compute_preliminary_water_balance,
)

# Reference: P=100, CN=75 -> S=84.6667, Ia=16.9333, RO=41.1371, Pe=58.8629
def test_effective_precip_valid():
    r = compute_effective_precipitation({"precipitation_mm": 100.0, "curve_number": 75})
    assert r["ok"] is True
    assert math.isclose(r["result"]["runoff_mm"], 41.1371, abs_tol=1e-2)
    assert math.isclose(r["result"]["effective_precipitation_mm"], 58.8629, abs_tol=1e-2)


def test_zero_precip():
    r = compute_effective_precipitation({"precipitation_mm": 0.0, "curve_number": 75})
    assert r["result"]["runoff_mm"] == 0.0
    assert r["result"]["effective_precipitation_mm"] == 0.0


def test_precip_below_initial_abstraction():
    # P=10 < Ia(16.93) -> RO=0, Pe=P
    r = compute_effective_precipitation({"precipitation_mm": 10.0, "curve_number": 75})
    assert r["result"]["runoff_mm"] == 0.0
    assert math.isclose(r["result"]["effective_precipitation_mm"], 10.0, abs_tol=1e-6)


def test_negative_precip_rejected():
    r = compute_effective_precipitation({"precipitation_mm": -1.0, "curve_number": 75})
    assert r["ok"] is False
    assert any(e["code"] == "INVALID_PRECIP" for e in r["errors"])


def test_invalid_cn_rejected():
    for cn in (0, 101, "NaN"):
        r = compute_effective_precipitation({"precipitation_mm": 100.0, "curve_number": cn})
        assert r["ok"] is False
        assert any(e["code"] == "INVALID_CN" for e in r["errors"])


def test_missing_cn_rejected():
    r = compute_effective_precipitation({"precipitation_mm": 100.0})
    assert r["ok"] is False
    assert any(e["code"] == "INVALID_CN" for e in r["errors"])


def test_water_balance_surplus():
    r = compute_preliminary_water_balance({"effective_precipitation_mm": 50.0, "etc_mm": 30.0})
    assert r["result"]["balance_mm"] == 20.0
    assert r["result"]["status"] == "surplus"


def test_water_balance_deficit():
    r = compute_preliminary_water_balance({"effective_precipitation_mm": 50.0, "etc_mm": 60.0})
    assert r["result"]["balance_mm"] == -10.0
    assert r["result"]["status"] == "deficit"


def test_water_balance_zero():
    r = compute_preliminary_water_balance({"effective_precipitation_mm": 50.0, "etc_mm": 50.0})
    assert r["result"]["balance_mm"] == 0.0
    assert r["result"]["status"] == "balanced"


def test_water_balance_rejects_negative():
    r = compute_preliminary_water_balance({"effective_precipitation_mm": -1.0, "etc_mm": 30.0})
    assert r["ok"] is False


def test_registered_and_executable_via_runtime():
    from hydroma.jobs import JobStore
    from hydroma.runtime import build_registry, execute_run

    reg = build_registry()
    assert reg.get("eco-nojin.hydroma.effective-precipitation") is not None
    assert reg.get("eco-nojin.hydroma.water-balance-prelim") is not None
    store = JobStore(":memory:")
    rid = store.create_run("eco-nojin.hydroma.effective-precipitation", "1.0.0", "alice",
                           {"precipitation_mm": 100.0, "curve_number": 75})
    run = execute_run(store, rid, reg)
    assert run["status"] == "completed"
    assert math.isclose(run["result_json"]["result"]["effective_precipitation_mm"], 58.8629, abs_tol=1e-2)
    assert run["provenance_json"]["scientific_status"] == "NOT_VALIDATED"


def test_api_lists_models():
    from fastapi.testclient import TestClient
    from hydroma.api import create_app

    ids = {m["id"] for m in TestClient(create_app()).get("/v1/models").json()["models"]}
    assert "eco-nojin.hydroma.effective-precipitation" in ids
    assert "eco-nojin.hydroma.water-balance-prelim" in ids
    assert "eco-nojin.hydroma.fao56-crop-etc" in ids  # existing preserved


def test_existing_models_still_valid():
    from hydroma.registry import validate_definition
    from hydroma.crop_etc import FAO56_CROP_ETC_DEFINITION
    from hydroma.crop_water import FAO56_CROP_WATER_DEFINITION
    from hydroma.irrigation import IRRIGATION_DEFINITION

    for d in (FAO56_CROP_ETC_DEFINITION, FAO56_CROP_WATER_DEFINITION, IRRIGATION_DEFINITION):
        validate_definition(d)