"""Root-zone soil water balance tests (Phase 3.15).

Software/mathematical checks only — NOT scientific validation.
"""

import json
import math

import pytest

from hydroma.root_zone import (
    ROOT_ZONE_DEFINITION,
    compute_root_zone_water_balance,
    validate_root_zone_input,
)

_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]


def _base(**kw):
    inp = {
        "root_zone_depth_mm": 300,
        "theta_fc": 0.30,
        "theta_wp": 0.10,
        "initial_storage_mm": 60.0,
        "p": 0.5,
        "days": [{"date": "2026-01-01", "precipitation_mm": 0.0, "irrigation_mm": 0.0,
                  "runoff_mm": 0.0, "etc_mm": 5.0}],
    }
    inp.update(kw)
    return inp


# --- soil parameters -------------------------------------------------------

def test_valid_parameters():
    assert validate_root_zone_input(_base())["valid"] is True


def test_theta_fc_must_exceed_wp():
    r = compute_root_zone_water_balance(_base(theta_fc=0.10, theta_wp=0.10))
    assert r["ok"] is False
    assert "THETA_FC_MUST_EXCEED_WP" in {e["code"] for e in r["errors"]}


def test_invalid_theta_out_of_bounds():
    assert "INVALID_THETA" in {e["code"] for e in compute_root_zone_water_balance(
        _base(theta_fc=1.2))["errors"]}


def test_invalid_root_zone_depth():
    assert "INVALID_ROOT_ZONE_DEPTH" in {e["code"] for e in compute_root_zone_water_balance(
        _base(root_zone_depth_mm=0))["errors"]}


def test_unsupported_theta_unit():
    r = compute_root_zone_water_balance(_base(theta_fc={"value": 0.30, "unit": "mm"}))
    assert r["ok"] is False
    assert "UNSUPPORTED_UNIT" in {e["code"] for e in r["errors"]}


def test_depth_in_metres_converted():
    r = compute_root_zone_water_balance(_base(root_zone_depth_mm={"value": 0.3, "unit": "m"}))
    assert r["ok"] is True
    assert math.isclose(r["result"]["root_zone_depth_mm"], 300.0, abs_tol=1e-9)
    assert math.isclose(r["result"]["taw_mm"], 60.0, abs_tol=1e-9)


# --- initial conditions ----------------------------------------------------

def test_zero_initial_storage():
    r = compute_root_zone_water_balance(_base(initial_storage_mm=0.0))
    assert r["ok"] is True
    assert r["result"]["initial_storage_mm"] == 0.0


def test_max_initial_storage():
    r = compute_root_zone_water_balance(_base(initial_storage_mm=90.0))
    assert r["ok"] is True
    assert math.isclose(r["result"]["fc_storage_mm"], 90.0)


def test_negative_initial_rejected():
    assert "INVALID_INITIAL" in {e["code"] for e in compute_root_zone_water_balance(
        _base(initial_storage_mm=-1.0))["errors"]}


# --- water balance ---------------------------------------------------------

def test_taw_and_raw():
    r = compute_root_zone_water_balance(_base())
    assert math.isclose(r["result"]["taw_mm"], 60.0, abs_tol=1e-9)   # (0.30-0.10)*300
    assert math.isclose(r["result"]["raw_mm"], 30.0, abs_tol=1e-9)   # 0.5*60


def test_no_precipitation():
    r = compute_root_zone_water_balance(_base())
    rec = r["records"][0] if "records" in r else r["result"]["days"][0]
    assert rec["precipitation_mm"] == 0.0
    assert math.isclose(rec["final_storage_mm"], 55.0, abs_tol=1e-9)  # 60 - 5


def test_precipitation_without_runoff():
    r = compute_root_zone_water_balance(_base(days=[{"date": "2026-01-01", "precipitation_mm": 10.0,
                                                     "irrigation_mm": 0.0, "runoff_mm": 0.0,
                                                     "etc_mm": 5.0}]))
    assert math.isclose(r["result"]["days"][0]["final_storage_mm"], 65.0, abs_tol=1e-9)


def test_precipitation_with_runoff():
    r = compute_root_zone_water_balance(_base(days=[{"date": "2026-01-01", "precipitation_mm": 10.0,
                                                     "irrigation_mm": 0.0, "runoff_mm": 4.0,
                                                     "etc_mm": 5.0}]))
    # 60 + 10 - 4 - 5 = 61
    assert math.isclose(r["result"]["days"][0]["final_storage_mm"], 61.0, abs_tol=1e-9)


def test_irrigation():
    r = compute_root_zone_water_balance(_base(days=[{"date": "2026-01-01", "precipitation_mm": 0.0,
                                                     "irrigation_mm": 20.0, "runoff_mm": 0.0,
                                                     "etc_mm": 5.0}]))
    # 60 + 20 - 5 = 75
    assert math.isclose(r["result"]["days"][0]["final_storage_mm"], 75.0, abs_tol=1e-9)


def test_excess_water_above_field_capacity():
    # 60 + 100 - 0 - 0 = 160 -> excess 70 (cap 90), final 90
    r = compute_root_zone_water_balance(_base(days=[{"date": "2026-01-01", "precipitation_mm": 100.0,
                                                     "irrigation_mm": 0.0, "runoff_mm": 0.0,
                                                     "etc_mm": 0.0}]))
    rec = r["result"]["days"][0]
    assert math.isclose(rec["excess_mm"], 70.0, abs_tol=1e-9)
    assert math.isclose(rec["final_storage_mm"], 90.0, abs_tol=1e-9)


def test_water_balance_closure():
    inp = _base(days=[{"date": "2026-01-01", "precipitation_mm": 12.0, "irrigation_mm": 3.0,
                       "runoff_mm": 2.0, "etc_mm": 5.0},
                      {"date": "2026-01-02", "precipitation_mm": 0.0, "irrigation_mm": 0.0,
                       "runoff_mm": 0.0, "etc_mm": 4.0}])
    r = compute_root_zone_water_balance(inp)
    res = r["result"]
    assert res["balance"]["closes"] is True
    lhs = res["initial_storage_mm"] + res["total_precipitation_mm"] + res["total_irrigation_mm"]
    rhs = (res["total_runoff_mm"] + res["total_excess_mm"]
           + res["total_actual_et_mm"] + res["final_storage_mm"])
    assert math.isclose(lhs, rhs, abs_tol=1e-6)


def test_unmet_demand_when_dry():
    # initial at WP (30), ETc 10, no precip -> available 0, actualET 0, unmet 10
    r = compute_root_zone_water_balance(_base(initial_storage_mm=30.0,
                                              days=[{"date": "2026-01-01", "precipitation_mm": 0.0,
                                                     "irrigation_mm": 0.0, "runoff_mm": 0.0,
                                                     "etc_mm": 10.0}]))
    rec = r["result"]["days"][0]
    assert math.isclose(rec["actual_et_mm"], 0.0, abs_tol=1e-9)
    assert math.isclose(rec["unmet_demand_mm"], 10.0, abs_tol=1e-9)
    assert math.isclose(rec["final_storage_mm"], 30.0, abs_tol=1e-9)


# --- temporal --------------------------------------------------------------

def test_sequential_days():
    r = compute_root_zone_water_balance(_base(days=[
        {"date": "2026-01-01", "precipitation_mm": 0.0, "irrigation_mm": 0.0, "runoff_mm": 0.0, "etc_mm": 5.0},
        {"date": "2026-01-02", "precipitation_mm": 0.0, "irrigation_mm": 0.0, "runoff_mm": 0.0, "etc_mm": 5.0},
    ]))
    assert r["ok"] is True
    assert math.isclose(r["result"]["days"][1]["initial_storage_mm"],
                        r["result"]["days"][0]["final_storage_mm"], abs_tol=1e-9)


def test_empty_days_rejected():
    assert "EMPTY_DAYS" in {e["code"] for e in compute_root_zone_water_balance(
        _base(days=[]))["errors"]}


def test_invalid_etc_rejected():
    r = compute_root_zone_water_balance(_base(days=[{"date": "2026-01-01", "precipitation_mm": 0.0,
                                                     "etc_mm": -1.0}]))
    assert r["ok"] is False


# --- integration -----------------------------------------------------------

def test_registered_in_runtime():
    from hydroma.runtime import build_registry
    reg = build_registry()
    assert reg.get("eco-nojin.hydroma.root-zone-water-balance") is not None


def test_executable_via_runtime():
    from hydroma.jobs import JobStore
    from hydroma.runtime import build_registry, execute_run
    reg = build_registry()
    store = JobStore(":memory:")
    rid = store.create_run("eco-nojin.hydroma.root-zone-water-balance", "1.0.0", "alice", _base())
    run = execute_run(store, rid, reg)
    assert run["status"] == "completed"
    assert math.isclose(run["result_json"]["result"]["taw_mm"], 60.0, abs_tol=1e-3)


def test_deterministic():
    a = compute_root_zone_water_balance(_base())
    b = compute_root_zone_water_balance(_base())
    assert a["result"] == b["result"]


def test_hash_sensitivity():
    from hydroma.provenance import sha256_json
    r1 = compute_root_zone_water_balance(_base())
    r2 = compute_root_zone_water_balance(_base(initial_storage_mm=40.0))
    assert sha256_json(r1["result"]) != sha256_json(r2["result"])


def test_json_serializable():
    r = compute_root_zone_water_balance(_base())
    assert json.loads(json.dumps(r)) == r


# --- regression ------------------------------------------------------------

def test_existing_models_still_valid():
    from hydroma.registry import validate_definition
    from hydroma.water_balance import WATER_BALANCE_DEFINITION
    validate_definition(WATER_BALANCE_DEFINITION)
    validate_definition(ROOT_ZONE_DEFINITION)