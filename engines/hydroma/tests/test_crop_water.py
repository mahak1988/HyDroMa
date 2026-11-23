"""FAO-56 crop water tests: independent hand-derived vectors + physically-consistent
chain + validation + integration.

Expected values are hand-derived from FAO-56 (ETc=Kc*ET0, Ks, ETc_adj=Ks*ETc) and
from the documented daily balance, NOT from the implementation. Software/mathematical
verification only; not scientific validation or calibration.
"""

import json
import math
import pathlib

import pytest

from hydroma.crop_water import (
    compute_crop_water,
    compute_ks,
    simulate_crop_water_chain,
    validate_crop_water_input,
)
from hydroma.verification import PASS, run_vectors

_VEC = pathlib.Path(__file__).resolve().parent / "vectors" / "crop_water_vectors.json"
_DATA = json.loads(_VEC.read_text(encoding="utf-8"))
_TOL = _DATA["tolerance"]

# 300 mm layer, theta_fc=0.30, theta_wp=0.10 -> FC=90, WP=30, TAW=60 mm.
_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]


def _project(r):
    if not r.get("ok"):
        return {"ok": False, "et0_mm_per_day": None, "kc": None, "taw_mm": None, "raw_mm": None,
                "depletion_mm": None, "ks": None, "etc_potential_mm_per_day": None,
                "etc_adjusted_mm_per_day": None, "errors": sorted({e["code"] for e in r.get("errors", [])})}
    x = r["result"]
    return {"ok": True, "et0_mm_per_day": x["et0_mm_per_day"], "kc": x["kc"], "taw_mm": x["taw_mm"],
            "raw_mm": x["raw_mm"], "depletion_mm": x["depletion_mm"], "ks": x["ks"],
            "etc_potential_mm_per_day": x["etc_potential_mm_per_day"],
            "etc_adjusted_mm_per_day": x["etc_adjusted_mm_per_day"], "errors": []}


def _assert_match(got, exp, ctx):
    for key, e in exp.items():
        g = got[key]
        if isinstance(e, (int, float)) and not isinstance(e, bool):
            assert g is not None and math.isclose(g, e, abs_tol=_TOL), f"{ctx}: {key} got={g} exp={e}"
        else:
            assert g == e, f"{ctx}: {key} got={g!r} exp={e!r}"


# --- single-day reference vectors -----------------------------------------

@pytest.mark.parametrize("vec", _DATA["vectors"], ids=[v["id"] for v in _DATA["vectors"]])
def test_crop_matches_expected(vec):
    _assert_match(_project(compute_crop_water(vec["input"])), vec["expected"], vec["id"])


def test_verification_report_pass():
    report = run_vectors(
        "eco-nojin.hydroma.fao56-crop-water", "1.0.0",
        compute_crop_water, _DATA["vectors"], _project, tolerance=_TOL,
    )
    assert report.status == PASS
    assert report.failed == 0


def test_ks_boundaries_direct():
    # Dr<=RAW -> 1; RAW<Dr<TAW -> (TAW-Dr)/(TAW-RAW); Dr>=TAW -> 0
    assert compute_ks(30, 100, 50) == 1.0
    assert math.isclose(compute_ks(60, 100, 50), 0.8, abs_tol=1e-9)
    assert compute_ks(100, 100, 50) == 0.0
    assert compute_ks(120, 100, 50) == 0.0
    # above field capacity
    assert compute_ks(-10, 100, 50) == 1.0
    # p = 1 (RAW = TAW): no stress buffer until TAW
    assert compute_ks(60, 100, 100) == 1.0
    assert compute_ks(101, 100, 100) == 0.0
    # TAW = 0 degenerate
    assert compute_ks(0, 0, 0) == 1.0
    assert compute_ks(5, 0, 0) == 0.0


# --- chain: physical accounting -------------------------------------------

def _chain(inp):
    r = simulate_crop_water_chain(inp)
    assert r["ok"] is True, r.get("errors")
    return r


def test_chain_dry_day():
    r = _chain({"layers": _LAYERS, "initial_storage_mm": 60, "p": 0.5, "kc": 0.8,
                "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 0}]})
    d = r["result"]["days"][0]
    assert math.isclose(d["ks"], 1.0, abs_tol=1e-9)          # Dr=30 <= RAW=30
    assert math.isclose(d["etc_adjusted_mm_per_day"], 4.8, abs_tol=1e-9)
    assert math.isclose(d["actual_et_mm"], 4.8, abs_tol=1e-9)
    assert math.isclose(d["unmet_demand_mm"], 0.0, abs_tol=1e-9)
    assert math.isclose(d["final_storage_mm"], 55.2, abs_tol=1e-6)


def test_chain_rainfall_day():
    r = _chain({"layers": _LAYERS, "initial_storage_mm": 60, "p": 0.5, "kc": 0.8,
                "days": [{"et0_mm_per_day": 6, "precipitation_mm": 10, "irrigation_mm": 0}]})
    d = r["result"]["days"][0]
    assert math.isclose(d["final_storage_mm"], 65.2, abs_tol=1e-6)  # 60+10-4.8
    assert math.isclose(d["excess_mm"], 0.0, abs_tol=1e-9)


def test_chain_irrigation_day():
    r = _chain({"layers": _LAYERS, "initial_storage_mm": 60, "p": 0.5, "kc": 0.8,
                "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 20}]})
    d = r["result"]["days"][0]
    assert math.isclose(d["final_storage_mm"], 75.2, abs_tol=1e-6)  # 60+20-4.8


def test_chain_consecutive_dry_stress_onset():
    r = _chain({"layers": _LAYERS, "initial_storage_mm": 60, "p": 0.5, "kc": 0.8,
                "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 0},
                         {"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 0}]})
    days = r["result"]["days"]
    assert math.isclose(days[0]["ks"], 1.0, abs_tol=1e-9)
    assert math.isclose(days[0]["final_storage_mm"], 55.2, abs_tol=1e-6)
    # day 2: Dr = 90 - 55.2 = 34.8 -> Ks = (60-34.8)/(60-30) = 0.84
    assert math.isclose(days[1]["ks"], 0.84, abs_tol=1e-9)
    assert math.isclose(days[1]["etc_adjusted_mm_per_day"], 4.032, abs_tol=1e-9)
    assert math.isclose(days[1]["final_storage_mm"], 51.168, abs_tol=1e-6)


def test_chain_stress_recovery():
    r = _chain({"layers": _LAYERS, "initial_storage_mm": 30, "p": 0.5, "kc": 0.8,
                "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 0},
                         {"et0_mm_per_day": 6, "precipitation_mm": 40, "irrigation_mm": 0},
                         {"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 0}]})
    days = r["result"]["days"]
    assert math.isclose(days[0]["ks"], 0.0, abs_tol=1e-9)       # at WP, no uptake
    assert math.isclose(days[0]["final_storage_mm"], 30.0, abs_tol=1e-6)
    assert math.isclose(days[1]["final_storage_mm"], 70.0, abs_tol=1e-6)  # 30+40
    assert math.isclose(days[2]["ks"], 1.0, abs_tol=1e-9)       # recovered
    assert math.isclose(days[2]["final_storage_mm"], 65.2, abs_tol=1e-6)


def test_chain_water_surplus():
    r = _chain({"layers": _LAYERS, "initial_storage_mm": 85, "p": 0.5, "kc": 0.8,
                "days": [{"et0_mm_per_day": 6, "precipitation_mm": 20, "irrigation_mm": 0}]})
    d = r["result"]["days"][0]
    assert math.isclose(d["excess_mm"], 15.0, abs_tol=1e-6)     # 85+20-90
    assert math.isclose(d["final_storage_mm"], 85.2, abs_tol=1e-6)
    assert d["status"] == "surplus"


def test_chain_insufficient_water_unmet_demand():
    # kc=1.0, ET0=40 -> ETc_pot=40; at Dr=RAW=30, Ks=1, available=30 -> actual=30, unmet=10
    r = _chain({"layers": _LAYERS, "initial_storage_mm": 60, "p": 0.5, "kc": 1.0,
                "days": [{"et0_mm_per_day": 40, "precipitation_mm": 0, "irrigation_mm": 0}]})
    d = r["result"]["days"][0]
    assert math.isclose(d["etc_adjusted_mm_per_day"], 40.0, abs_tol=1e-9)
    assert math.isclose(d["actual_et_mm"], 30.0, abs_tol=1e-6)   # limited to available water
    assert math.isclose(d["unmet_demand_mm"], 10.0, abs_tol=1e-6)
    assert math.isclose(d["final_storage_mm"], 30.0, abs_tol=1e-6)
    assert d["status"] == "unmet_demand"
    # unmet is NOT a water flux: conservation still closes
    assert r["result"]["conservation"]["closes"] is True


def test_chain_zero_et0():
    r = _chain({"layers": _LAYERS, "initial_storage_mm": 60, "p": 0.5, "kc": 0.8,
                "days": [{"et0_mm_per_day": 0, "precipitation_mm": 0, "irrigation_mm": 0}]})
    d = r["result"]["days"][0]
    assert math.isclose(d["etc_adjusted_mm_per_day"], 0.0, abs_tol=1e-9)
    assert math.isclose(d["final_storage_mm"], 60.0, abs_tol=1e-9)


def test_chain_zero_kc():
    r = _chain({"layers": _LAYERS, "initial_storage_mm": 60, "p": 0.5, "kc": 0.0,
                "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 0}]})
    d = r["result"]["days"][0]
    assert math.isclose(d["etc_adjusted_mm_per_day"], 0.0, abs_tol=1e-9)
    assert math.isclose(d["final_storage_mm"], 60.0, abs_tol=1e-9)


def test_chain_storage_above_fc():
    r = _chain({"layers": _LAYERS, "initial_storage_mm": 100, "p": 0.5, "kc": 0.8,
                "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 0}]})
    d = r["result"]["days"][0]
    assert math.isclose(d["dr_start_mm"], -10.0, abs_tol=1e-9)   # above FC
    assert math.isclose(d["excess_mm"], 10.0, abs_tol=1e-6)      # 100-90
    assert math.isclose(d["final_storage_mm"], 85.2, abs_tol=1e-6)


def test_chain_storage_below_wp():
    r = _chain({"layers": _LAYERS, "initial_storage_mm": 20, "p": 0.5, "kc": 0.8,
                "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 0}]})
    d = r["result"]["days"][0]
    assert math.isclose(d["ks"], 0.0, abs_tol=1e-9)              # Dr=70 > TAW
    assert math.isclose(d["actual_et_mm"], 0.0, abs_tol=1e-9)
    assert math.isclose(d["final_storage_mm"], 20.0, abs_tol=1e-9)
    assert d["status"] == "at_or_below_wilting_point"


def test_chain_conservation_multi_day():
    inp = {"layers": _LAYERS, "initial_storage_mm": 50, "p": 0.5, "kc": 0.8,
           "days": [{"et0_mm_per_day": 6, "precipitation_mm": 5, "irrigation_mm": 0},
                    {"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 10},
                    {"et0_mm_per_day": 8, "precipitation_mm": 0, "irrigation_mm": 0}]}
    r = _chain(inp)
    res = r["result"]
    cons = res["conservation"]
    assert cons["closes"] is True
    assert abs(cons["residual_mm"]) <= 1e-6
    # explicit water balance check from totals
    lhs = res["initial_storage_mm"] + res["total_precip_mm"] + res["total_irrigation_mm"]
    rhs = (res["total_runoff_mm"] + res["total_excess_mm"]
           + res["total_actual_et_mm"] + res["final_storage_mm"])
    assert math.isclose(lhs, rhs, abs_tol=1e-3)


def test_chain_deterministic():
    inp = {"layers": _LAYERS, "initial_storage_mm": 55, "p": 0.5, "kc": 0.8,
           "days": [{"et0_mm_per_day": 6, "precipitation_mm": 3, "irrigation_mm": 0}]}
    assert simulate_crop_water_chain(inp)["result"] == simulate_crop_water_chain(inp)["result"]


def test_chain_kc_per_day_list():
    r = _chain({"layers": _LAYERS, "initial_storage_mm": 60, "p": 0.5, "kc": [0.8, 0.5],
                "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 0},
                         {"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 0}]})
    days = r["result"]["days"]
    assert math.isclose(days[0]["kc"], 0.8, abs_tol=1e-9)
    assert math.isclose(days[0]["etc_potential_mm_per_day"], 4.8, abs_tol=1e-9)
    assert math.isclose(days[1]["kc"], 0.5, abs_tol=1e-9)
    assert math.isclose(days[1]["etc_potential_mm_per_day"], 3.0, abs_tol=1e-9)


def test_chain_explicit_units():
    # layers in metres + root zone in metres -> same as 300 mm thickness
    r = _chain({
        "layers": [{"top": {"value": 0.0, "unit": "m"},
                    "bottom": {"value": 0.3, "unit": "m"},
                    "theta_fc": {"value": 0.30, "unit": "m3/m3"},
                    "theta_wp": {"value": 0.10, "unit": "m3/m3"}}],
        "rootZoneDepth": {"value": 0.3, "unit": "m"},
        "initial_storage_mm": 60, "p": 0.5, "kc": 0.8,
        "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 0}],
    })
    assert math.isclose(r["result"]["taw_mm"], 60.0, abs_tol=1e-6)
    assert math.isclose(r["result"]["days"][0]["final_storage_mm"], 55.2, abs_tol=1e-6)


# --- validation -----------------------------------------------------------

def _chain_errors(inp):
    r = simulate_crop_water_chain(inp)
    assert r["ok"] is False
    return {e["code"] for e in r["errors"]}


def test_invalid_et0():
    assert "NEGATIVE_ET0" in _chain_errors({"layers": _LAYERS, "initial_storage_mm": 60, "p": 0.5,
                                            "kc": 0.8, "days": [{"et0_mm_per_day": -1, "precipitation_mm": 0}]})


def test_invalid_kc():
    assert "INVALID_KC" in _chain_errors({"layers": _LAYERS, "initial_storage_mm": 60, "p": 0.5,
                                          "kc": -1, "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0}]})


def test_invalid_p():
    assert "INVALID_P" in _chain_errors({"layers": _LAYERS, "initial_storage_mm": 60, "p": 0,
                                         "kc": 0.8, "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0}]})


def test_invalid_initial():
    assert "INVALID_INITIAL" in _chain_errors({"layers": _LAYERS, "initial_storage_mm": -1, "p": 0.5,
                                               "kc": 0.8, "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0}]})


def test_invalid_layers():
    assert "INVALID_LAYERS" in _chain_errors({"layers": [], "initial_storage_mm": 60, "p": 0.5,
                                              "kc": 0.8, "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0}]})


def test_empty_days():
    assert "EMPTY_DAYS" in _chain_errors({"layers": _LAYERS, "initial_storage_mm": 60, "p": 0.5,
                                          "kc": 0.8, "days": []})


def test_non_finite_et0():
    assert "NON_FINITE" in _chain_errors({"layers": _LAYERS, "initial_storage_mm": 60, "p": 0.5,
                                          "kc": 0.8, "days": [{"et0_mm_per_day": "NaN", "precipitation_mm": 0}]})


def test_invalid_date():
    assert "INVALID_DATE" in _chain_errors({"layers": _LAYERS, "initial_storage_mm": 60, "p": 0.5,
                                            "kc": 0.8, "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0, "date": 123}]})


def test_runoff_exceeds_water():
    assert "RUNOFF_EXCEEDS_WATER" in _chain_errors({"layers": _LAYERS, "initial_storage_mm": 10, "p": 0.5,
                                                    "kc": 0.8, "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0, "runoff_mm": 100}]})


def test_validate_crop_water_input():
    assert validate_crop_water_input({"et0_mm_per_day": 6, "kc": 0.8, "p": 0.5,
                                      "taw_mm": 100, "depletion_mm": 30})["valid"] is True
    assert validate_crop_water_input({"et0_mm_per_day": -1, "kc": 0.8, "p": 0.5,
                                      "taw_mm": 100, "depletion_mm": 30})["valid"] is False


# --- integration ----------------------------------------------------------

def test_chain_daily_integration_backcompat():
    # legacy expectations preserved by the physically-consistent balance
    r = _chain({"layers": _LAYERS, "initial_storage_mm": 60, "p": 0.5, "kc": 0.8,
                "days": [{"et0_mm_per_day": 6, "precipitation_mm": 10, "irrigation_mm": 0},
                         {"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 0}]})
    assert math.isclose(r["result"]["days"][0]["ks"], 1.0, abs_tol=1e-9)
    assert math.isclose(r["result"]["days"][0]["etc_adjusted_mm_per_day"], 4.8, abs_tol=1e-9)
    assert math.isclose(r["result"]["days"][1]["ks"], 1.0, abs_tol=1e-9)
    assert math.isclose(r["result"]["final_storage_mm"], 60.4, abs_tol=1e-3)


def test_chain_at_wilting_point_no_stress_uptake():
    r = _chain({"layers": _LAYERS, "initial_storage_mm": 30, "p": 0.5, "kc": 0.8,
                "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 0}]})
    assert math.isclose(r["result"]["days"][0]["ks"], 0.0, abs_tol=1e-9)
    assert math.isclose(r["result"]["final_storage_mm"], 30.0, abs_tol=1e-6)


def test_registered_and_executable_via_runtime():
    from hydroma.jobs import JobStore
    from hydroma.runtime import build_registry, execute_run

    reg = build_registry()
    assert reg.get("eco-nojin.hydroma.fao56-crop-water") is not None
    assert reg.get("eco-nojin.hydroma.fao56-crop-water-chain") is not None
    store = JobStore(":memory:")
    run_id = store.create_run(
        "eco-nojin.hydroma.fao56-crop-water", "1.0.0", "alice",
        {"et0_mm_per_day": 6, "kc": 0.8, "p": 0.5, "taw_mm": 100, "depletion_mm": 60},
    )
    run = execute_run(store, run_id, reg)
    assert run["status"] == "completed"
    assert math.isclose(run["result_json"]["result"]["ks"], 0.8, abs_tol=1e-6)
    assert run["provenance_json"]["scientific_status"] == "NOT_VALIDATED"
    assert run["provenance_json"]["schema_version"]


def test_chain_executable_via_runtime():
    from hydroma.jobs import JobStore
    from hydroma.runtime import build_registry, execute_run

    reg = build_registry()
    store = JobStore(":memory:")
    run_id = store.create_run(
        "eco-nojin.hydroma.fao56-crop-water-chain", "1.0.0", "bob",
        {"layers": _LAYERS, "initial_storage_mm": 60, "p": 0.5, "kc": 0.8,
         "days": [{"et0_mm_per_day": 6, "precipitation_mm": 0, "irrigation_mm": 0}]},
    )
    run = execute_run(store, run_id, reg)
    assert run["status"] == "completed"
    assert run["result_json"]["result"]["conservation"]["closes"] is True
    assert run["provenance_json"]["scientific_status"] == "NOT_VALIDATED"


def test_api_lists_all_models():
    from fastapi.testclient import TestClient
    from hydroma.api import create_app

    ids = {m["id"] for m in TestClient(create_app()).get("/v1/models").json()["models"]}
    assert "eco-nojin.hydroma.fao56-crop-water" in ids
    assert "eco-nojin.hydroma.fao56-crop-water-chain" in ids
    assert "eco-nojin.hydroma.daily-soil-water" in ids
    assert "eco-nojin.hydroma.soil-water-storage" in ids
    assert "eco-nojin.hydroma.fao56-et0" in ids
    assert "eco-nojin.hydroma.water-balance" in ids


def test_existing_models_still_valid():
    from hydroma.registry import validate_definition
    from hydroma.water_balance import WATER_BALANCE_DEFINITION
    from hydroma.fao56_et0 import FAO56_ET0_DEFINITION
    from hydroma.soil_water import SOIL_WATER_DEFINITION
    from hydroma.daily_soil_water import DAILY_SOIL_WATER_DEFINITION
    from hydroma.crop_water import FAO56_CROP_WATER_DEFINITION, FAO56_CROP_CHAIN_DEFINITION

    for d in (WATER_BALANCE_DEFINITION, FAO56_ET0_DEFINITION, SOIL_WATER_DEFINITION,
              DAILY_SOIL_WATER_DEFINITION, FAO56_CROP_WATER_DEFINITION, FAO56_CROP_CHAIN_DEFINITION):
        validate_definition(d)