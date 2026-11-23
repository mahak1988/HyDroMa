"""Phase 3.23 stress-aware irrigation demand tests (software only; NOT validation).

Synthetic fixtures verify arithmetic and decision logic; they are not evidence of
scientific validity and do not represent real irrigation execution.
"""

import json

from fastapi.testclient import TestClient

from hydroma.api import create_app
from hydroma.irrigation_demand import compute_irrigation_demand
from hydroma.jobs import JobStore
from hydroma.runtime import build_registry, execute_run

# fc=90, wp=30, taw=60
LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]
FC, WP, TAW = 90.0, 30.0, 60.0


def _demand(**over):
    base = {"layers": LAYERS, "initial_storage_mm": 40.0, "et0_mm": 5.0, "kc": 0.8,
            "p": 0.5, "target_policy": "RAW"}
    base.update(over)
    return compute_irrigation_demand(base)


# --- decision logic --------------------------------------------------------

def test_no_demand():
    r = _demand(initial_storage_mm=80.0)  # dr=10 <= RAW=30
    assert r["ok"] is True
    assert r["decision"] == "NO_DEMAND"
    assert r["result"]["demand_detected"] is False
    assert r["result"]["irrigation_recommended"] is False
    assert r["result"]["net_irrigation_mm"] == 0.0


def test_demand_detected():
    r = _demand(initial_storage_mm=40.0)  # dr=50 > RAW=30
    assert r["decision"] == "DEMAND"
    assert r["result"]["demand_detected"] is True
    assert r["result"]["irrigation_recommended"] is True
    assert r["result"]["recommendation_restricted"] is False
    assert r["result"]["restriction_reason"] is None
    assert r["result"]["net_irrigation_mm"] == 20.0


def test_above_fc_no_demand():
    r = _demand(initial_storage_mm=95.0)  # dr=-5
    assert r["decision"] == "NO_DEMAND"
    assert r["result"]["above_field_capacity"] is True
    assert r["result"]["demand_detected"] is False
    assert r["result"]["net_irrigation_mm"] == 0.0


def test_below_wp_out_of_domain():
    r = _demand(initial_storage_mm=20.0)  # dr=70 > TAW=60
    assert r["decision"] == "OUT_OF_DOMAIN"
    assert r["result"]["below_wilting_point"] is True
    assert r["result"]["ks"] == 0.0
    assert r["result"]["eta_mm"] == 0.0
    # numerical demand is preserved, but no operational recommendation is issued
    assert r["result"]["net_irrigation_mm"] == 40.0
    assert r["result"]["demand_detected"] is True
    assert r["result"]["irrigation_recommended"] is False
    assert r["result"]["recommendation_restricted"] is True
    assert r["result"]["restriction_reason"] == "BELOW_WILTING_POINT"


# --- validation ------------------------------------------------------------

def test_invalid_soil():
    r = compute_irrigation_demand({"layers": [], "initial_storage_mm": 40.0, "et0_mm": 5.0,
                                   "kc": 0.8, "p": 0.5, "target_policy": "RAW"})
    assert r["ok"] is False and r["decision"] == "INVALID"


def test_invalid_crop():
    assert _demand(et0_mm=-1.0)["ok"] is False
    assert _demand(kc=-0.1)["ok"] is False


def test_invalid_p():
    for bad in (0.0, 1.0, 1.5):
        r = _demand(p=bad)
        assert r["ok"] is False
        assert any(e["code"] == "INVALID_P" for e in r["errors"])


def test_invalid_efficiency():
    r = _demand(application_efficiency=1.5)
    assert r["ok"] is False
    assert any(e["code"] == "INVALID_EFFICIENCY" for e in r["errors"])


def test_missing_target():
    r = _demand(target_policy=None)
    assert r["ok"] is False
    assert any(e["code"] == "MISSING_TARGET" for e in r["errors"])


# --- net / gross -----------------------------------------------------------

def test_net_irrigation():
    r = _demand(initial_storage_mm=40.0)["result"]
    assert r["net_irrigation_mm"] == 20.0  # dr=50 - target RAW=30
    assert r["storage_after_irrigation_mm"] == 60.0


def test_gross_irrigation():
    r = _demand(initial_storage_mm=40.0, application_efficiency=0.8)["result"]
    assert r["net_irrigation_mm"] == 20.0
    assert r["gross_irrigation_mm"] == 25.0
    assert r["irrigation_loss_mm"] == 5.0
    assert r["storage_after_irrigation_mm"] == 60.0  # net, not gross, enters storage


def test_gross_none_without_efficiency():
    r = _demand(initial_storage_mm=40.0)["result"]
    assert r["gross_irrigation_mm"] is None
    assert r["irrigation_loss_mm"] is None


# --- explicit targets ------------------------------------------------------

def test_target_field_capacity():
    r = _demand(initial_storage_mm=40.0, target_policy="FIELD_CAPACITY")["result"]
    assert r["target_policy"] == "FIELD_CAPACITY"
    assert r["target_storage_mm"] == FC
    assert r["net_irrigation_mm"] == 50.0


def test_target_storage():
    r = _demand(initial_storage_mm=40.0, target_policy=None, target_storage_mm=60.0)["result"]
    assert r["target_policy"] == "TARGET_STORAGE"
    assert r["target_storage_mm"] == 60.0
    assert r["net_irrigation_mm"] == 20.0


def test_conflicting_targets_rejected():
    r = _demand(target_policy=None, target_depletion_mm=30.0, target_storage_mm=60.0)
    assert r["ok"] is False
    assert any(e["code"] == "CONFLICTING_TARGET" for e in r["errors"])


def test_target_policy_with_explicit_rejected():
    r = _demand(target_depletion_mm=30.0)  # target_policy defaults to RAW -> conflict
    assert r["ok"] is False
    assert any(e["code"] == "CONFLICTING_TARGET" for e in r["errors"])


def test_invalid_target_below_wp():
    r = _demand(target_policy=None, target_storage_mm=20.0)  # < WP=30 -> depletion 70 > TAW
    assert r["ok"] is False
    assert any(e["code"] == "INVALID_TARGET" for e in r["errors"])


def test_invalid_target_above_fc():
    r = _demand(target_policy=None, target_storage_mm=100.0)  # > FC=90 -> depletion -10
    assert r["ok"] is False
    assert any(e["code"] == "INVALID_TARGET" for e in r["errors"])


def test_calculation_type_and_ks_informational():
    r = _demand(initial_storage_mm=40.0)["result"]
    assert r["calculation_type"] == "CURRENT_STATE_TARGET_REPLENISHMENT"
    assert r["temporal_basis"] == "current_state"
    assert r["ks_eta_role"] == "informational_stress_diagnostics"
    # net is independent of p/Ks when the target is explicit; Ks is diagnostic only
    a = _demand(initial_storage_mm=40.0, target_policy=None, target_depletion_mm=30.0, p=0.5)["result"]
    b = _demand(initial_storage_mm=40.0, target_policy=None, target_depletion_mm=30.0, p=0.3)["result"]
    assert a["net_irrigation_mm"] == b["net_irrigation_mm"] == 20.0
    assert a["ks"] != b["ks"]


def test_storage_after_semantics():
    r = _demand(initial_storage_mm=40.0)["result"]
    assert r["storage_after_basis"].startswith("initial_storage")
    assert abs((r["initial_storage_mm"] + r["net_irrigation_mm"]) - r["storage_after_irrigation_mm"]) < 1e-6


# --- domain / accounting ---------------------------------------------------

def test_near_zero_taw():
    near = [{"thickness_mm": 300, "theta_fc": 0.3000000001, "theta_wp": 0.30}]
    r = compute_irrigation_demand({"layers": near, "initial_storage_mm": 90.0, "et0_mm": 5.0,
                                   "kc": 0.8, "p": 0.5, "target_policy": "RAW"})
    assert r["ok"] is True
    assert 0.0 <= r["result"]["ks"] <= 1.0


def test_water_balance_closure():
    r = _demand(initial_storage_mm=40.0)["result"]
    # storage_after = initial + net; equals target storage
    assert abs((r["initial_storage_mm"] + r["net_irrigation_mm"]) - r["storage_after_irrigation_mm"]) < 1e-6
    assert r["storage_after_irrigation_mm"] == r["target_storage_mm"]
    assert r["water_deficit_mm"] == r["net_irrigation_mm"]


def test_deficit_concepts_distinct():
    r = _demand(initial_storage_mm=40.0, target_policy="FIELD_CAPACITY")["result"]
    assert r["stress_deficit_mm"] == 20.0  # dr - RAW = 50 - 30
    assert r["water_deficit_mm"] == 50.0   # dr - target(FC)=0
    assert r["net_irrigation_mm"] == 50.0


def test_ks_bounded_and_eta_le_etc():
    for S in (0.0, 20.0, 30.0, 45.0, 60.0, 90.0):
        r = _demand(initial_storage_mm=S)
        if r["ok"]:
            assert 0.0 <= r["result"]["ks"] <= 1.0
            assert r["result"]["eta_mm"] <= r["result"]["etc_mm"] + 1e-9


# --- determinism / provenance ----------------------------------------------

def test_deterministic():
    a = _demand(initial_storage_mm=40.0, application_efficiency=0.8)
    b = _demand(initial_storage_mm=40.0, application_efficiency=0.8)
    assert json.dumps(a, sort_keys=True, default=str) == json.dumps(b, sort_keys=True, default=str)


def test_provenance():
    r = _demand(initial_storage_mm=40.0)
    prov = r["provenance"]
    assert prov["model"] == "eco-nojin.hydroma.irrigation-demand"
    assert prov["target_policy"] == "RAW"
    assert prov["scientific_status"] == "NOT_VALIDATED"
    assert prov["input_hash"] and prov["result_hash"]


# --- runtime / API ---------------------------------------------------------

def test_runtime_execution():
    store = JobStore(":memory:")
    reg = build_registry()
    rid = store.create_run("eco-nojin.hydroma.irrigation-demand", "1.0.0", "alice",
                           {"layers": LAYERS, "initial_storage_mm": 40.0, "et0_mm": 5.0,
                            "kc": 0.8, "p": 0.5, "target_policy": "RAW"})
    run = execute_run(store, rid, reg)
    assert run["status"] == "completed"
    assert run["result_json"]["decision"] == "DEMAND"


def test_api_execution():
    c = TestClient(create_app())
    resp = c.post("/v1/runs", json={"model_id": "eco-nojin.hydroma.irrigation-demand",
                                    "input": {"layers": LAYERS, "initial_storage_mm": 40.0,
                                              "et0_mm": 5.0, "kc": 0.8, "p": 0.5,
                                              "target_policy": "RAW", "application_efficiency": 0.8}})
    assert resp.status_code == 202
    run = c.get(f"/v1/runs/{resp.json()['run_id']}").json()
    assert run["status"] == "completed"
    assert run["result_json"]["decision"] == "DEMAND"
    assert run["result_json"]["result"]["gross_irrigation_mm"] == 25.0


def test_sequential_demand_then_apply():
    # demand at a depleted state, then verify the net depth restores toward target
    d = _demand(initial_storage_mm=40.0, target_policy="RAW")
    net = d["result"]["net_irrigation_mm"]
    assert abs((40.0 + net) - d["result"]["target_storage_mm"]) < 1e-6