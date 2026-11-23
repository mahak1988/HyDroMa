"""Multi-period sequential soil-water simulation tests (software only; NOT validation)."""

import math

from hydroma.multi_period_sim import simulate_multi_period, verify_mass_balance

_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]  # fc=90, wp=30, TAW=60

_P0 = "2026-01-01T00:00:00Z"
_P1 = "2026-01-02T00:00:00Z"
_P2 = "2026-01-03T00:00:00Z"


def _steps():
    return [
        {"period_start": _P0, "period_end": _P1, "precipitation_mm": 10.0, "irrigation_mm": 0.0, "et_actual_mm": 5.0, "runoff_mm": 0.0},
        {"period_start": _P1, "period_end": _P2, "precipitation_mm": 0.0, "irrigation_mm": 0.0, "et_actual_mm": 10.0, "runoff_mm": 0.0},
    ]


def _inp(**kw):
    base = {"period_start": _P0, "period_end": _P2, "layers": _LAYERS, "initial_storage_mm": 60.0, "steps": _steps()}
    base.update(kw)
    return base


def test_two_period_state_transfer():
    r = simulate_multi_period(_inp())
    assert r["ok"] is True
    steps = r["result"]["steps"]
    # step1: 60 +10 -5 = 65; step2 initial = 65 (transferred), 65 -10 = 55
    assert steps[0]["final_storage_mm"] == 65.0
    assert steps[1]["initial_storage_mm"] == 65.0
    assert steps[1]["final_storage_mm"] == 55.0
    assert r["result"]["final_storage_mm"] == 55.0
    assert math.isclose(r["result"]["totals"]["precipitation_mm"], 10.0, abs_tol=1e-6)
    assert math.isclose(r["result"]["totals"]["et_actual_mm"], 15.0, abs_tol=1e-6)


def test_algebraic_closure_residual_zero_and_tamper_detected():
    r = simulate_multi_period(_inp())
    for s in r["result"]["steps"]:
        assert abs(s["algebraic_closure_residual_mm"]) < 1e-6
    # independent check: tampering a RECORDED field breaks the mass balance
    tampered = dict(r["result"]["steps"][0])
    tampered["final_storage_mm"] = tampered["final_storage_mm"] + 5.0
    assert abs(verify_mass_balance(tampered)) > 1.0


def test_three_step_state_transfer():
    steps = [
        {"period_start": _P0, "period_end": _P1, "precipitation_mm": 10.0, "irrigation_mm": 0.0, "et_actual_mm": 5.0, "runoff_mm": 0.0},
        {"period_start": _P1, "period_end": _P2, "precipitation_mm": 0.0, "irrigation_mm": 0.0, "et_actual_mm": 10.0, "runoff_mm": 0.0},
        {"period_start": _P2, "period_end": "2026-01-04T00:00:00Z", "precipitation_mm": 0.0, "irrigation_mm": 0.0, "et_actual_mm": 10.0, "runoff_mm": 0.0},
    ]
    r = simulate_multi_period({"period_start": _P0, "period_end": "2026-01-04T00:00:00Z", "layers": _LAYERS, "initial_storage_mm": 60.0, "steps": steps})
    assert r["ok"] is True
    s = r["result"]["steps"]
    assert s[0]["final_storage_mm"] == 65.0
    assert s[1]["initial_storage_mm"] == 65.0
    assert s[1]["final_storage_mm"] == 55.0
    assert s[2]["initial_storage_mm"] == 55.0
    assert s[2]["final_storage_mm"] == 45.0


def test_mixed_timezone_rejected():
    # naive period_start vs aware period_end -> INVALID_TIMEZONE (no implicit UTC/local)
    r = simulate_multi_period(_inp(period_start="2026-01-01T00:00:00", period_end="2026-01-03T00:00:00Z"))
    assert r["ok"] is False
    assert any(e.get("code") == "INVALID_TIMEZONE" for e in r["errors"])


def test_overlap_rejected():
    bad = _steps()
    bad[1]["period_start"] = _P0  # before step1 end
    r = simulate_multi_period(_inp(steps=bad))
    assert r["ok"] is False
    assert any(e.get("code") == "OVERLAP" for e in r["errors"])


def test_gap_rejected():
    bad = _steps()
    bad[1]["period_start"] = "2026-01-04T00:00:00Z"  # after step1 end
    r = simulate_multi_period(_inp(steps=bad))
    assert r["ok"] is False
    assert any(e.get("code") == "GAP" for e in r["errors"])


def test_coverage_mismatch_rejected():
    r = simulate_multi_period(_inp(period_start=_P1))  # period_start != step0.start
    assert r["ok"] is False
    assert any(e.get("code") == "COVERAGE_START" for e in r["errors"])


def test_invalid_interval_rejected():
    bad = _steps()
    bad[0]["period_end"] = _P0  # end <= start
    r = simulate_multi_period(_inp(steps=bad))
    assert r["ok"] is False
    assert any(e.get("code") == "INVALID_INTERVAL" for e in r["errors"])


def test_provenance_deterministic():
    r1 = simulate_multi_period(_inp())
    r2 = simulate_multi_period(_inp())
    assert r1["provenance"]["result_hash"] == r2["provenance"]["result_hash"]
    assert r1["provenance"]["scientific_status"] == "NOT_VALIDATED"


def test_registered_and_executable_via_runtime():
    from hydroma.jobs import JobStore
    from hydroma.runtime import build_registry, execute_run

    reg = build_registry()
    assert reg.get("eco-nojin.hydroma.multi-period-simulation") is not None
    store = JobStore(":memory:")
    rid = store.create_run("eco-nojin.hydroma.multi-period-simulation", "1.0.0", "alice", _inp())
    run = execute_run(store, rid, reg)
    assert run["status"] == "completed"
    assert run["result_json"]["result"]["final_storage_mm"] == 55.0


def test_api_lists_model():
    from fastapi.testclient import TestClient
    from hydroma.api import create_app

    ids = {m["id"] for m in TestClient(create_app()).get("/v1/models").json()["models"]}
    assert "eco-nojin.hydroma.multi-period-simulation" in ids
    assert "eco-nojin.hydroma.root-zone-balance" in ids  # existing preserved


def test_existing_models_still_valid():
    from hydroma.registry import validate_definition
    from hydroma.root_zone_balance import ROOT_ZONE_BALANCE_DEFINITION
    from hydroma.daily_soil_water import DAILY_SOIL_WATER_DEFINITION
    from hydroma.farm_water_workflow import FARM_WATER_WORKFLOW_DEFINITION

    for d in (ROOT_ZONE_BALANCE_DEFINITION, DAILY_SOIL_WATER_DEFINITION, FARM_WATER_WORKFLOW_DEFINITION):
        validate_definition(d)