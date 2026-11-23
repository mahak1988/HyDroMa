"""Accepted climate -> simulation binding tests (software only; NOT validation)."""

from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.ingestion import ClimateIngestionConfig
from hydroma.climate_qc_integration import (
    build_sim_input_from_climate,
    ingest_and_accept_climate,
    run_gated_simulation_from_climate,
)

_CFG = ClimateIngestionConfig(format="json")
_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]
_PS = "2026-01-01T00:00:00Z"
_PE = "2026-01-02T00:00:00Z"


def _series(precip=10.0, unit="mm", ts=_PE, acc_start=_PS, acc_end=_PE, with_acc=True):
    kw = {}
    if with_acc:
        kw = {"accumulation_start": acc_start, "accumulation_end": acc_end}
    return ClimateSeries([ClimateObservation("precipitation", precip, unit, ts, "daily_sum", **kw)])


def _spec(**kw):
    base = {"layers": _LAYERS, "initial_storage_mm": 60.0,
            "steps": [{"period_start": _PS, "period_end": _PE, "et_actual_mm": 5.0}]}
    base.update(kw)
    return base


def test_binding_exact_interval():
    acc = ingest_and_accept_climate(_series(), _CFG)
    built = build_sim_input_from_climate(acc, _spec())
    assert built["ok"] is True
    assert built["sim_input"]["steps"][0]["precipitation_mm"] == 10.0


def test_accumulation_start_mismatch():
    r = run_gated_simulation_from_climate(_series(acc_start="2026-01-01T01:00:00Z"), _CFG, _spec())
    assert r["status"] == "FAILED"
    assert any(e.get("code") == "ACCUMULATION_INTERVAL_MISMATCH" for e in r.get("errors", []))


def test_missing_accumulation_metadata():
    r = run_gated_simulation_from_climate(_series(with_acc=False), _CFG, _spec())
    assert r["status"] == "FAILED"
    assert any(e.get("code") == "MISSING_ACCUMULATION_INTERVAL" for e in r.get("errors", []))


def test_unit_policy_propagated():
    assert ingest_and_accept_climate(_series(), _CFG, unit_policy="STRICT")["unit_policy"] == "STRICT"
    assert ingest_and_accept_climate(_series(), _CFG, unit_policy="LEGACY")["unit_policy"] == "LEGACY"


def test_caller_cannot_inject_precip():
    spec = _spec()
    spec["steps"][0]["precipitation_mm"] = 999.0  # bogus, must be ignored
    r = run_gated_simulation_from_climate(_series(precip=10.0), _CFG, spec)
    assert r["status"] == "COMPLETED"
    assert r["simulation"]["result"]["steps"][0]["precipitation_mm"] == 10.0


def test_rejected_climate_blocks():
    r = run_gated_simulation_from_climate(_series(precip=-5.0), _CFG, _spec())
    assert r["status"] == "BLOCKED"
    assert r["simulation"] is None


def test_precip_change_changes_result_hash():
    r1 = run_gated_simulation_from_climate(_series(precip=10.0), _CFG, _spec())
    r2 = run_gated_simulation_from_climate(_series(precip=20.0), _CFG, _spec())
    assert r1["simulation"]["provenance"]["result_hash"] != r2["simulation"]["provenance"]["result_hash"]


def test_registered_and_api():
    from hydroma.runtime import build_registry
    reg = build_registry()
    assert reg.get("eco-nojin.hydroma.climate-sim-binding") is not None
    from fastapi.testclient import TestClient
    from hydroma.api import create_app
    ids = {m["id"] for m in TestClient(create_app()).get("/v1/models").json()["models"]}
    assert "eco-nojin.hydroma.climate-sim-binding" in ids


def test_existing_models_still_valid():
    from hydroma.registry import validate_definition
    from hydroma.multi_period_sim import MULTI_PERIOD_SIM_DEFINITION
    from hydroma.climate_qc_integration import CLIMATE_QC_GATE_DEFINITION, CLIMATE_SIM_BINDING_DEFINITION

    for d in (MULTI_PERIOD_SIM_DEFINITION, CLIMATE_QC_GATE_DEFINITION, CLIMATE_SIM_BINDING_DEFINITION):
        validate_definition(d)