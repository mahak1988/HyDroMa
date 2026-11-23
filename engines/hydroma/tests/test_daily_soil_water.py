"""Daily root-zone water dynamics tests: independent hand-derived vectors + integration.

Expected values are hand-derived from the conservation equation, NOT from the
implementation. Software/mathematical verification only; not scientific validation.
"""

import json
import math
import pathlib

import pytest

from hydroma.daily_soil_water import simulate_daily_soil_water
from hydroma.verification import PASS, run_vectors

_VEC = pathlib.Path(__file__).resolve().parent / "vectors" / "daily_soil_water_vectors.json"
_DATA = json.loads(_VEC.read_text(encoding="utf-8"))
_TOL = _DATA["tolerance"]


def _project(r):
    if not r.get("ok"):
        return {"ok": False, "days_count": None, "root_zone_depth_mm": None, "wp_storage_mm": None,
                "fc_storage_mm": None, "taw_mm": None, "raw_mm": None, "initial_storage_mm": None,
                "final_storage_mm": None, "total_precip_mm": None, "total_irrigation_mm": None,
                "total_runoff_mm": None, "total_et_mm": None, "total_excess_mm": None,
                "min_storage_mm": None, "day_finals": [], "day_excess": [], "day_status": [],
                "warnings": [], "errors": sorted({e["code"] for e in r.get("errors", [])})}
    x = r["result"]
    days = x["days"]
    return {"ok": True, "days_count": len(days), "root_zone_depth_mm": x["root_zone_depth_mm"],
            "wp_storage_mm": x["wp_storage_mm"], "fc_storage_mm": x["fc_storage_mm"],
            "taw_mm": x["taw_mm"], "raw_mm": x["raw_mm"], "initial_storage_mm": x["initial_storage_mm"],
            "final_storage_mm": x["final_storage_mm"], "total_precip_mm": x["total_precip_mm"],
            "total_irrigation_mm": x["total_irrigation_mm"], "total_runoff_mm": x["total_runoff_mm"],
            "total_et_mm": x["total_et_mm"], "total_excess_mm": x["total_excess_mm"],
            "min_storage_mm": x["min_storage_mm"],
            "day_finals": [d["final_storage_mm"] for d in days],
            "day_excess": [d["excess_mm"] for d in days],
            "day_status": [d["status"] for d in days],
            "warnings": sorted({w["code"] for w in r.get("warnings", [])}), "errors": []}


def _assert_match(got, exp, ctx):
    for key, e in exp.items():
        g = got[key]
        if isinstance(e, list):
            assert len(g) == len(e), f"{ctx}: {key} len {len(g)} != {len(e)}"
            for i, (gg, ee) in enumerate(zip(g, e)):
                if isinstance(ee, (int, float)) and not isinstance(ee, bool):
                    assert math.isclose(gg, ee, abs_tol=_TOL), f"{ctx}: {key}[{i}] {gg} != {ee}"
                else:
                    assert gg == ee, f"{ctx}: {key}[{i}] {gg!r} != {ee!r}"
        elif isinstance(e, (int, float)) and not isinstance(e, bool):
            assert math.isclose(g, e, abs_tol=_TOL), f"{ctx}: {key} got={g} exp={e}"
        else:
            assert g == e, f"{ctx}: {key} got={g!r} exp={e!r}"


@pytest.mark.parametrize("vec", _DATA["vectors"], ids=[v["id"] for v in _DATA["vectors"]])
def test_daily_matches_expected(vec):
    _assert_match(_project(simulate_daily_soil_water(vec["input"])), vec["expected"], vec["id"])


def test_conservation_holds_each_day():
    # For the multi-day scenario: start + P + I == RO + ET + excess + final, every day.
    r = simulate_daily_soil_water(_DATA["vectors"][4]["input"])
    assert r["ok"] is True
    storage = r["result"]["initial_storage_mm"]
    for day in r["result"]["days"]:
        lhs = storage + day["precipitation_mm"] + day["irrigation_mm"]
        rhs = day["runoff_mm"] + day["et_actual_mm"] + day["excess_mm"] + day["final_storage_mm"]
        assert math.isclose(lhs, rhs, abs_tol=1e-6), f"day {day['day_index']}: {lhs} != {rhs}"
        storage = day["final_storage_mm"]


def test_verification_report_pass():
    report = run_vectors(
        "eco-nojin.hydroma.daily-soil-water", "1.0.0",
        simulate_daily_soil_water, _DATA["vectors"], _project, tolerance=_TOL,
    )
    assert report.status == PASS
    assert report.failed == 0


def test_registered_and_executable_via_runtime():
    from hydroma.jobs import JobStore
    from hydroma.runtime import build_registry, execute_run

    reg = build_registry()
    assert reg.get("eco-nojin.hydroma.daily-soil-water") is not None
    store = JobStore(":memory:")
    run_id = store.create_run(
        "eco-nojin.hydroma.daily-soil-water", "1.0.0", "alice",
        {"layers": [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}],
         "initial_storage_mm": 60, "days": [{"precipitation_mm": 10, "irrigation_mm": 0, "et_actual_mm": 5}]},
    )
    run = execute_run(store, run_id, reg)
    assert run["status"] == "completed"
    assert math.isclose(run["result_json"]["result"]["final_storage_mm"], 65.0, abs_tol=1e-3)
    assert run["provenance_json"]["scientific_status"] == "NOT_VALIDATED"


def test_api_lists_all_models():
    from fastapi.testclient import TestClient
    from hydroma.api import create_app

    ids = {m["id"] for m in TestClient(create_app()).get("/v1/models").json()["models"]}
    assert "eco-nojin.hydroma.daily-soil-water" in ids
    assert "eco-nojin.hydroma.soil-water-storage" in ids
    assert "eco-nojin.hydroma.water-balance" in ids


def test_existing_models_still_valid():
    from hydroma.registry import validate_definition
    from hydroma.water_balance import WATER_BALANCE_DEFINITION
    from hydroma.fao56_et0 import FAO56_ET0_DEFINITION
    from hydroma.soil_water import SOIL_WATER_DEFINITION
    from hydroma.daily_soil_water import DAILY_SOIL_WATER_DEFINITION

    for d in (WATER_BALANCE_DEFINITION, FAO56_ET0_DEFINITION, SOIL_WATER_DEFINITION, DAILY_SOIL_WATER_DEFINITION):
        validate_definition(d)