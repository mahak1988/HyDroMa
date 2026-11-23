"""FE-3.19.5 acceptance-policy consistency tests (software only; NOT validation).

Verifies that ``LEGACY``/``STRICT`` unit policy, structural contract enforcement
and QC precedence are identical across the canonical Phase 3.10 pipeline
(``ingest_climate``) and every public climate gate entry point.
"""

import pytest

from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.climate_qc_integration import (
    ingest_and_accept_climate,
    run_gated_simulation,
    run_gated_simulation_from_climate,
)
from hydroma.ingest import ClimateIngestionConfig, ingest_climate
from hydroma.quality import QualityControlPolicy

PS = "2026-01-01T00:00:00Z"
PE = "2026-01-02T00:00:00Z"
_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]


def _series(unit="mm", value=10.0, variable="precipitation", quality="valid", ts=PE):
    return ClimateSeries([
        ClimateObservation(
            variable, value, unit, ts,
            "daily_sum" if variable == "precipitation" else "daily_mean",
            quality=quality,
            accumulation_start=PS, accumulation_end=PE,
        )
    ])


def _sim_spec():
    return {
        "layers": _LAYERS, "initial_storage_mm": 60.0,
        "steps": [{"period_start": PS, "period_end": PE, "et_actual_mm": 5.0}],
    }


def _sim_input():
    return {
        "period_start": PS, "period_end": PE, "layers": _LAYERS, "initial_storage_mm": 60.0,
        "steps": [{"period_start": PS, "period_end": PE, "precipitation_mm": 10.0,
                   "irrigation_mm": 0.0, "et_actual_mm": 5.0, "runoff_mm": 0.0}],
    }


# (name, series, unit_policy, qc_policy, domain, expected_status, expected_reason)
_CASES = [
    ("legacy_valid", _series(), "LEGACY", None, "climate", "ACCEPTED", "PASSED"),
    ("strict_valid", _series(), "STRICT", None, "climate", "ACCEPTED", "PASSED"),
    ("legacy_missing_unit", _series(unit=""), "LEGACY", None, "climate", "ACCEPTED_WITH_WARNINGS", "QC_WARNINGS"),
    ("strict_missing_unit", _series(unit=""), "STRICT", None, "climate", "REJECTED", "STRICT_UNIT_MISSING"),
    ("legacy_unsupported_unit", _series(unit="furlong"), "LEGACY", None, "climate", "ACCEPTED", "PASSED"),
    ("strict_unsupported_unit", _series(unit="furlong"), "STRICT", None, "climate", "REJECTED", "STRICT_UNIT_MISSING"),
    ("legacy_incompatible_unit", _series(unit="degC"), "LEGACY", None, "climate", "ACCEPTED", "PASSED"),
    ("strict_incompatible_unit", _series(unit="degC"), "STRICT", None, "climate", "REJECTED", "STRICT_UNIT_MISSING"),
    ("structural_error", _series(ts="not-a-time"), "LEGACY", None, "climate", "REJECTED", "CONTRACT_INVALID"),
    ("qc_warning_nonblocking", _series(variable="air_temperature", unit="degC", value=60.0), "LEGACY",
     QualityControlPolicy(thresholds={"air_temperature": {"min": -10, "max": 50}}), "climate",
     "ACCEPTED_WITH_WARNINGS", "QC_WARNINGS"),
    ("qc_warning_blocking", _series(variable="air_temperature", unit="degC", value=60.0), "LEGACY",
     QualityControlPolicy(thresholds={"air_temperature": {"min": -10, "max": 50}}, warn_blocks_execution=True),
     "climate", "REJECTED", "QC_WARNING_BLOCKING"),
    ("qc_error_blocking", _series(value=-5.0), "LEGACY", None, "climate", "REJECTED", "QC_ERROR"),
    ("qc_error_nonblocking", _series(value=-5.0), "LEGACY",
     QualityControlPolicy(error_blocks_execution=False), "climate",
     "ACCEPTED_WITH_WARNINGS", "QC_ERRORS_NONBLOCKING"),
    ("qc_unavailable", _series(), "LEGACY", None, "soil", "PENDING_REVIEW", "QC_UNAVAILABLE"),
]


@pytest.mark.parametrize("name,series,policy,qc_policy,domain,exp_status,exp_reason", _CASES)
def test_gate_matches_canonical_acceptance(name, series, policy, qc_policy, domain, exp_status, exp_reason):
    canonical = ingest_climate(
        series, ClimateIngestionConfig(format="memory", unit_policy=policy, qc_policy=qc_policy, domain=domain)
    )
    gate = ingest_and_accept_climate(
        series, ClimateIngestionConfig(format="memory", domain=domain), qc_policy=qc_policy, unit_policy=policy
    )
    assert (canonical.status, canonical.acceptance["reason"]) == (exp_status, exp_reason), name
    # The gate must reach the SAME decision as the canonical pipeline.
    assert (gate["status"], gate["reason_code"]) == (canonical.status, canonical.acceptance["reason"]), name
    assert gate["model_ready"] == canonical.ok, name


@pytest.mark.parametrize("name,series,policy,qc_policy,domain,exp_status,exp_reason", _CASES)
def test_gated_executors_share_acceptance(name, series, policy, qc_policy, domain, exp_status, exp_reason):
    """Both gated executors report the same acceptance as the canonical pipeline."""
    cfg = ClimateIngestionConfig(format="memory", domain=domain)
    gate = ingest_and_accept_climate(series, cfg, qc_policy=qc_policy, unit_policy=policy)
    direct = run_gated_simulation(series, cfg, _sim_input(), qc_policy=qc_policy, unit_policy=policy)
    bound = run_gated_simulation_from_climate(series, cfg, _sim_spec(), qc_policy=qc_policy, unit_policy=policy)
    assert direct["acceptance"]["status"] == gate["status"], name
    assert bound["acceptance"]["status"] == gate["status"], name
    if exp_status in ("ACCEPTED", "ACCEPTED_WITH_WARNINGS"):
        # accepted climate passes the gate (it may still fail binding on a bad
        # spec/unit, but it must never be BLOCKED by acceptance)
        assert direct["status"] != "BLOCKED", name
        assert bound["status"] != "BLOCKED", name
    else:
        # rejected/pending climate never reaches the model
        assert direct["status"] == "BLOCKED", name
        assert bound["status"] == "BLOCKED", name


def test_default_unit_policy_is_legacy():
    gate = ingest_and_accept_climate(_series(), ClimateIngestionConfig(format="memory"))
    assert gate["unit_policy"] == "LEGACY"


def test_structural_error_blocks_even_in_legacy():
    gate = ingest_and_accept_climate(_series(ts="not-a-time"), ClimateIngestionConfig(format="memory"), unit_policy="LEGACY")
    assert gate["status"] == "REJECTED"
    assert gate["reason_code"] == "CONTRACT_INVALID"
    assert gate["contract_valid"] is False
    assert gate["model_ready"] is False


def test_unit_findings_are_reported():
    gate = ingest_and_accept_climate(_series(unit="furlong"), ClimateIngestionConfig(format="memory"), unit_policy="STRICT")
    assert gate["status"] == "REJECTED"
    assert any(f["code"] == "RULE-UNIT-UNKNOWN" for f in gate["unit_findings"])