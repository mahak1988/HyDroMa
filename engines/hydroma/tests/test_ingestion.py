"""Phase 3.10 ingestion & acceptance pipeline tests (software verification only)."""

import copy
import math

from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.quality import QualityControlPolicy
from hydroma.ingestion import (
    AcceptanceStatus,
    DatasetStatus,
    build_model_ready_dataset,
    decide_acceptance,
    run_ingestion_pipeline,
    validate_dataset,
)


def _series(unit="degC", value=20.0, n=2):
    obs = [
        ClimateObservation(variable="air_temperature", value=value, unit=unit,
                           timestamp=f"2026-01-0{i+1}T00:00:00Z", basis="daily_mean")
        for i in range(n)
    ]
    return ClimateSeries(observations=obs, variable="air_temperature")


class _FakeQC:
    def __init__(self, flags):
        self.flags = flags
        self.counts_by_severity = {
            "ERROR": sum(1 for f in flags if f.get("severity") == "ERROR"),
            "WARNING": sum(1 for f in flags if f.get("severity") == "WARNING"),
            "INFO": 0,
        }


def _dec(**kw):
    base = dict(contract_valid=True, unit_policy="LEGACY", unit_findings=[],
                qc_report=_FakeQC([]), qc_policy=QualityControlPolicy(),
                domain_qc_available=True, review_required=False)
    base.update(kw)
    return decide_acceptance(**base)


def test_rule1_contract_invalid():
    d = _dec(contract_valid=False)
    assert d.status == AcceptanceStatus.REJECTED and d.reason_code == "CONTRACT_INVALID"

def test_rule2_strict_missing_unit_not_downgradeable():
    d = _dec(unit_policy="STRICT", unit_findings=[{"status": "UNIT_MISSING"}])
    assert d.status == AcceptanceStatus.REJECTED and d.reason_code == "STRICT_UNIT_MISSING"

def test_rule3_qc_error_blocks():
    d = _dec(qc_report=_FakeQC([{"severity": "ERROR"}]))
    assert d.status == AcceptanceStatus.REJECTED and d.reason_code == "QC_ERROR"

def test_rule4_domain_qc_unavailable():
    d = _dec(domain_qc_available=False)
    assert d.status == AcceptanceStatus.PENDING_REVIEW and d.reason_code == "QC_UNAVAILABLE"

def test_rule5_review_required():
    d = _dec(review_required=True)
    assert d.status == AcceptanceStatus.PENDING_REVIEW and d.reason_code == "REVIEW_REQUIRED"

def test_rule6_warning_blocks_when_configured():
    d = _dec(qc_report=_FakeQC([{"severity": "WARNING"}]),
             qc_policy=QualityControlPolicy(warn_blocks_execution=True))
    assert d.status == AcceptanceStatus.REJECTED and d.reason_code == "QC_WARNING_BLOCKING"

def test_rule6_nonblocking_qc_error_accepted_with_warnings():
    # Canonical Phase 3.10: a non-blocking QC ERROR is ACCEPTED_WITH_WARNINGS /
    # QC_ERRORS_NONBLOCKING (never silently ACCEPTED).
    d = _dec(qc_report=_FakeQC([{"severity": "ERROR"}]),
             qc_policy=QualityControlPolicy(error_blocks_execution=False))
    assert d.status == AcceptanceStatus.ACCEPTED_WITH_WARNINGS
    assert d.reason_code == "QC_ERRORS_NONBLOCKING"

def test_rule7_accepted_with_warnings():
    d = _dec(qc_report=_FakeQC([{"severity": "WARNING"}]))
    assert d.status == AcceptanceStatus.ACCEPTED_WITH_WARNINGS
    assert d.reason_code == "QC_WARNINGS"

def test_rule8_clean_accepted():
    d = _dec()
    assert d.status == AcceptanceStatus.ACCEPTED and d.reason_code == "PASSED"

def test_rule2_strict_unknown_unit_not_downgradeable():
    d = _dec(unit_policy="STRICT", unit_findings=[{"status": "UNIT_UNKNOWN"}])
    assert d.status == AcceptanceStatus.REJECTED and d.reason_code == "STRICT_UNIT_MISSING"

def test_precedence_contract_beats_strict():
    d = _dec(contract_valid=False, unit_policy="STRICT", unit_findings=[{"status": "UNIT_MISSING"}])
    assert d.reason_code == "CONTRACT_INVALID"

def test_precedence_strict_beats_qc_error():
    d = _dec(unit_policy="STRICT", unit_findings=[{"status": "UNIT_MISSING"}],
             qc_report=_FakeQC([{"severity": "ERROR"}]))
    assert d.reason_code == "STRICT_UNIT_MISSING"

def test_validate_dataset_units():
    s = _series(unit="degC")
    assert validate_dataset(s, "LEGACY")["valid"] is True
    assert validate_dataset(s, "STRICT")["valid"] is True
    # Climate units are structurally mandatory (validate_series): a missing unit is
    # rejected under BOTH policies; STRICT additionally records UNIT_MISSING.
    bad = _series(unit="")
    assert validate_dataset(bad, "LEGACY")["valid"] is False
    strict = validate_dataset(bad, "STRICT")
    assert strict["valid"] is False
    assert any(e["code"] == "UNIT_MISSING" for e in strict["errors"])

def test_model_ready_gate():
    acc = _dec().status
    # accepted -> ok
    acc_ok = _dec()
    mr = build_model_ready_dataset(_series(), acc_ok, {"h": "x"})
    assert mr.status == DatasetStatus.MODEL_READY
    # rejected -> raises
    acc_bad = _dec(contract_valid=False)
    try:
        build_model_ready_dataset(_series(), acc_bad, {})
        assert False, "expected ValueError"
    except ValueError:
        pass

def test_pipeline_end_to_end_inmemory():
    s = _series(unit="degC", value=20.0)
    before = copy.deepcopy(s.to_dict())
    result = run_ingestion_pipeline(s.to_dict(), unit_policy="STRICT", qc_policy=QualityControlPolicy())
    assert result["status"] == DatasetStatus.MODEL_READY.value
    assert result["model_ready"] is not None
    # non-mutation
    assert s.to_dict() == before
    prov = result["provenance"]
    for k in ("source_hash", "normalized_hash", "config_hash", "qc_config_hash", "result_hash"):
        assert prov.get(k), k
    # distinct hashes
    assert len({prov["source_hash"], prov["normalized_hash"], prov["config_hash"],
                prov["qc_config_hash"], prov["result_hash"]}) >= 4

def test_pipeline_pending_review_when_domain_qc_unavailable():
    # Domain-appropriate QC unavailable -> PENDING_REVIEW, never MODEL_READY
    s = _series(unit="degC")
    result = run_ingestion_pipeline(s.to_dict(), unit_policy="STRICT", domain_qc_available=False)
    assert result["status"] == AcceptanceStatus.PENDING_REVIEW.value
    assert result["model_ready"] is None


def test_et0_from_model_ready_integration():
    from hydroma.climate import ClimateObservation, ClimateSeries
    from hydroma.ingestion import et0_from_model_ready
    s = ClimateSeries(observations=[
        ClimateObservation("air_temperature", 20.0, "degC", "2026-01-01T00:00:00Z", "daily_mean"),
        ClimateObservation("wind_speed", 2.0, "m/s", "2026-01-01T00:00:00Z", "daily_mean"),
    ])
    result = run_ingestion_pipeline(s.to_dict(), unit_policy="STRICT")
    assert result["status"] == DatasetStatus.MODEL_READY.value
    out = et0_from_model_ready(result["model_ready_obj"], "2026-01-01T00:00:00Z", rn_mm=15.0, ea_kpa=1.5)
    assert out["et0"]["ok"] is True
    assert "et0_mm_per_day" in out["et0"]["result"]


def test_et0_refuses_non_model_ready():
    from hydroma.ingestion import et0_from_model_ready
    s = _series(unit="degC")
    result = run_ingestion_pipeline(s.to_dict(), unit_policy="STRICT", domain_qc_available=False)
    assert result["status"] == AcceptanceStatus.PENDING_REVIEW.value
    try:
        et0_from_model_ready(result["model_ready_obj"], "2026-01-01T00:00:00Z", 15.0, 1.5)
        assert False, "expected ValueError"
    except ValueError:
        pass