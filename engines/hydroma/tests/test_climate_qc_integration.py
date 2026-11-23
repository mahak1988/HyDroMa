"""Climate ingestion & QC gate tests (software only; NOT validation)."""

from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.ingestion import ClimateIngestionConfig
from hydroma.climate_qc_integration import ingest_and_accept_climate, run_gated_simulation

_CFG = ClimateIngestionConfig(format="json")
_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]
_SIM = {
    "period_start": "2026-01-01T00:00:00Z", "period_end": "2026-01-02T00:00:00Z",
    "layers": _LAYERS, "initial_storage_mm": 60.0,
    "steps": [{"period_start": "2026-01-01T00:00:00Z", "period_end": "2026-01-02T00:00:00Z",
               "precipitation_mm": 10.0, "irrigation_mm": 0.0, "et_actual_mm": 5.0, "runoff_mm": 0.0}],
}


def _series(precip=10.0):
    return ClimateSeries(
        [ClimateObservation("precipitation", precip, "mm", "2026-01-01T00:00:00Z", "daily_sum"),
         ClimateObservation("air_temperature", 20.0, "degC", "2026-01-01T00:00:00Z", "daily_mean")],
    )


def test_valid_climate_accepted():
    acc = ingest_and_accept_climate(_series(), _CFG)
    assert acc["model_ready"] is True
    assert acc["status"] in ("ACCEPTED", "ACCEPTED_WITH_WARNINGS")


def test_rejected_climate_not_model_ready():
    acc = ingest_and_accept_climate(_series(precip=-5.0), _CFG)
    assert acc["model_ready"] is False
    assert acc["status"] == "REJECTED"


def test_gated_simulation_runs_on_accepted():
    r = run_gated_simulation(_series(), _CFG, _SIM)
    assert r["status"] == "COMPLETED"
    assert r["simulation"]["ok"] is True


def test_gated_simulation_blocked_on_rejected():
    r = run_gated_simulation(_series(precip=-5.0), _CFG, _SIM)
    assert r["status"] == "BLOCKED"
    assert r["simulation"] is None


def test_registered_and_api():
    from hydroma.runtime import build_registry
    reg = build_registry()
    assert reg.get("eco-nojin.hydroma.climate-qc-gate") is not None
    from fastapi.testclient import TestClient
    from hydroma.api import create_app
    ids = {m["id"] for m in TestClient(create_app()).get("/v1/models").json()["models"]}
    assert "eco-nojin.hydroma.climate-qc-gate" in ids
    assert "eco-nojin.hydroma.multi-period-simulation" in ids  # existing preserved


def test_existing_models_still_valid():
    from hydroma.registry import validate_definition
    from hydroma.multi_period_sim import MULTI_PERIOD_SIM_DEFINITION
    from hydroma.root_zone_balance import ROOT_ZONE_BALANCE_DEFINITION

    for d in (MULTI_PERIOD_SIM_DEFINITION, ROOT_ZONE_BALANCE_DEFINITION):
        validate_definition(d)
