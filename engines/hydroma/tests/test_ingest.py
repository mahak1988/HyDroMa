"""Scientific data ingestion & quality-aware pipeline tests (Phase 3.10).

Software/integration checks only — NOT scientific validation.
"""

import json
import math

import pytest

from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.climate_et0 import ET0IntegrationConfig
from hydroma.climate_import import ImportConfig
from hydroma.ingest import (
    ACCEPTANCE_OUTCOMES,
    ClimateIngestionConfig,
    IngestionError,
    ingest_climate,
    to_climate_series,
)
from hydroma.quality import QualityControlPolicy

_MAP = {"t": "air_temperature", "u2": "wind_speed", "ea": "relative_humidity",
        "rn": "solar_radiation"}

_CSV = "date,tmean,precip\n2026-01-01,20.0,1.2\n2026-01-02,22.0,0.0\n"


def _csv_config(**kw):
    base = dict(
        format="csv",
        timestamp_column="date",
        variable_columns={"air_temperature": "tmean", "precipitation": "precip"},
        input_units={"air_temperature": "degC", "precipitation": "mm"},
        basis="daily_mean",
        variable_basis={"precipitation": "daily_sum"},
        temporal_resolution="1d",
    )
    base.update(kw)
    return ImportConfig(**base)


# --- CSV -------------------------------------------------------------------

def test_valid_csv_ingestion():
    r = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config(),
                                                    source_name="demo.csv"))
    assert r.ok is True
    assert r.status in ("ACCEPTED", "ACCEPTED_WITH_WARNINGS")
    assert set(r.dataset.variables) == {"air_temperature", "precipitation"}
    assert len(to_climate_series(r).observations) == 4


def test_csv_explicit_delimiter():
    csv = "date;tmean;precip\n2026-01-01;20.0;1.2\n"
    cfg = _csv_config()
    cfg.delimiter = ";" if hasattr(cfg, "delimiter") else None
    # ImportConfig has no delimiter field; csv module auto-detects? Use comma default.
    # This test documents that non-comma delimiters require explicit handling.
    r = ingest_climate(csv, ClimateIngestionConfig(format="csv", import_config=_csv_config()))
    # default comma parse of a semicolon file -> header mismatch -> rejected
    assert r.ok is False


def test_csv_missing_required_column():
    csv = "date,tmean\n2026-01-01,20.0\n"
    cfg = _csv_config(variable_columns={"air_temperature": "tmean", "precipitation": "precip"})
    r = ingest_climate(csv, ClimateIngestionConfig(format="csv", import_config=cfg))
    assert r.ok is False
    assert any(e["code"] == "MISSING_COLUMN" for e in r.errors)


def test_csv_invalid_numeric():
    csv = "date,tmean,precip\n2026-01-01,abc,1.2\n"
    r = ingest_climate(csv, ClimateIngestionConfig(format="csv", import_config=_csv_config()))
    assert r.ok is False


def test_csv_ambiguous_timestamp_rejected():
    csv = "date,tmean,precip\n03/04/2025,20.0,1.2\n"
    r = ingest_climate(csv, ClimateIngestionConfig(format="csv", import_config=_csv_config()))
    assert r.ok is False


def test_csv_ambiguous_timestamp_with_explicit_format():
    csv = "date,tmean,precip\n03/04/2025,20.0,1.2\n"
    cfg = _csv_config(date_format="%d/%m/%Y", basis="daily_mean")
    r = ingest_climate(csv, ClimateIngestionConfig(format="csv", import_config=cfg))
    assert r.ok is True


def test_csv_variable_mapping():
    csv = "date,rain,tmean\n2026-01-01,1.2,20.0\n"
    cfg = _csv_config(variable_columns={"precipitation": "rain", "air_temperature": "tmean"})
    r = ingest_climate(csv, ClimateIngestionConfig(format="csv", import_config=cfg))
    assert r.ok is True
    assert set(r.dataset.variables) == {"precipitation", "air_temperature"}


def test_csv_unknown_variable_rejected():
    csv = "date,tmean,precip\n2026-01-01,20.0,1.2\n"
    cfg = _csv_config(variable_columns={"moon_phase": "tmean"})
    r = ingest_climate(csv, ClimateIngestionConfig(format="csv", import_config=cfg))
    assert r.ok is False


def test_csv_unit_conversion_explicit():
    csv = "date,precip\n2026-01-01,1.0\n"  # 1 cm -> 10 mm
    cfg = _csv_config(variable_columns={"precipitation": "precip"},
                      input_units={"precipitation": "cm"},
                      conversions={"precipitation": "cm_to_mm"}, basis="daily_sum")
    r = ingest_climate(csv, ClimateIngestionConfig(format="csv", import_config=cfg))
    assert r.ok is True
    assert math.isclose(r.series.observations[0].value, 10.0, abs_tol=1e-9)
    assert r.series.observations[0].unit == "mm"


def test_csv_incompatible_unit_rejected():
    csv = "date,precip\n2026-01-01,1.0\n"
    cfg = _csv_config(variable_columns={"precipitation": "precip"},
                      input_units={"precipitation": "kg"}, basis="daily_sum")
    r = ingest_climate(csv, ClimateIngestionConfig(format="csv", import_config=cfg))
    assert r.ok is False


def test_csv_raw_content_preserved():
    r = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config()))
    # the source string is unchanged (caller-owned); we only read it
    assert _CSV == "date,tmean,precip\n2026-01-01,20.0,1.2\n2026-01-02,22.0,0.0\n"


# --- JSON ------------------------------------------------------------------

def _obs_list():
    return [
        {"variable": "air_temperature", "value": 20.0, "unit": "degC",
         "timestamp": "2026-01-01T00:00:00Z", "basis": "instant", "quality": "valid"},
        {"variable": "air_temperature", "value": 22.0, "unit": "degC",
         "timestamp": "2026-01-02T00:00:00Z", "basis": "instant", "quality": "valid"},
    ]


def test_valid_json_ingestion():
    r = ingest_climate(json.dumps(_obs_list()), ClimateIngestionConfig(format="json"))
    assert r.ok is True
    assert len(r.series.observations) == 2


def test_malformed_json_rejected():
    r = ingest_climate("{not json", ClimateIngestionConfig(format="json"))
    assert r.ok is False


def test_json_missing_fields_rejected():
    bad = [{"variable": "air_temperature", "value": 20.0}]  # no unit/timestamp/basis
    r = ingest_climate(json.dumps(bad), ClimateIngestionConfig(format="json"))
    assert r.ok is False


def test_json_invalid_unit_rejected():
    bad = [{"variable": "air_temperature", "value": 20.0, "unit": "bogus",
            "timestamp": "2026-01-01T00:00:00Z", "basis": "instant"}]
    r = ingest_climate(json.dumps(bad), ClimateIngestionConfig(format="json"))
    assert r.ok is False


def test_json_raw_content_preserved():
    content = json.dumps(_obs_list())
    ingest_climate(content, ClimateIngestionConfig(format="json"))
    assert content == json.dumps(_obs_list())


# --- in-memory -------------------------------------------------------------

def test_in_memory_ingestion():
    rows = [ClimateObservation("air_temperature", 20.0, "degC", "2026-01-01", "daily_mean", "valid"),
            ClimateObservation("air_temperature", 21.0, "degC", "2026-01-02", "daily_mean", "valid")]
    s = ClimateSeries(rows, variable=None, temporal_resolution="1d")
    before = [o.to_dict() for o in s.observations]
    r = ingest_climate(s, ClimateIngestionConfig(format="memory"))
    assert r.ok is True
    # in-memory source not mutated
    assert [o.to_dict() for o in s.observations] == before


# --- strict / legacy unit policy ------------------------------------------

def test_strict_missing_unit_rejected():
    rows = [ClimateObservation("air_temperature", 20.0, "", "2026-01-01", "daily_mean", "valid")]
    s = ClimateSeries(rows, variable=None, temporal_resolution="1d")
    strict = ingest_climate(s, ClimateIngestionConfig(format="memory", unit_policy="STRICT"))
    assert strict.status == "REJECTED"
    assert "RULE-UNIT-MISSING" in {f["code"] for f in strict.quality["flags"]}


def test_legacy_missing_unit_accepted_with_warnings():
    rows = [ClimateObservation("air_temperature", 20.0, "", "2026-01-01", "daily_mean", "valid")]
    s = ClimateSeries(rows, variable=None, temporal_resolution="1d")
    legacy = ingest_climate(s, ClimateIngestionConfig(format="memory", unit_policy="LEGACY"))
    assert legacy.status == "ACCEPTED_WITH_WARNINGS"


# --- QC / acceptance -------------------------------------------------------

def test_qc_blocking_error_rejected():
    rows = [ClimateObservation("precipitation", -5.0, "mm", "2026-01-01", "daily_sum", "valid")]
    s = ClimateSeries(rows, variable=None, temporal_resolution="1d")
    r = ingest_climate(s, ClimateIngestionConfig(format="memory"))
    assert r.status == "REJECTED"
    assert r.ok is False
    assert to_climate_series.__name__  # callable


def test_qc_warning_accepted_with_warnings():
    rows = [ClimateObservation("air_temperature", 60.0, "degC", "2026-01-01", "daily_mean", "valid")]
    s = ClimateSeries(rows, variable=None, temporal_resolution="1d")
    policy = QualityControlPolicy(thresholds={"air_temperature": {"min": -10, "max": 50}})
    r = ingest_climate(s, ClimateIngestionConfig(format="memory", qc_policy=policy))
    assert r.status == "ACCEPTED_WITH_WARNINGS"


def test_unsupported_domain_pending_review():
    rows = [ClimateObservation("air_temperature", 20.0, "degC", "2026-01-01", "daily_mean", "valid")]
    s = ClimateSeries(rows, variable=None, temporal_resolution="1d")
    r = ingest_climate(s, ClimateIngestionConfig(format="memory", domain="soil"))
    assert r.status == "PENDING_REVIEW"
    assert r.quality.get("status") == "QC_NOT_AVAILABLE"


def test_rejected_dataset_cannot_be_model_ready():
    rows = [ClimateObservation("precipitation", -5.0, "mm", "2026-01-01", "daily_sum", "valid")]
    s = ClimateSeries(rows, variable=None, temporal_resolution="1d")
    r = ingest_climate(s, ClimateIngestionConfig(format="memory"))
    with pytest.raises(IngestionError):
        to_climate_series(r)


# --- provenance ------------------------------------------------------------

def test_provenance_contents():
    r = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config(),
                                                    source_name="demo.csv"))
    prov = r.provenance
    assert prov["source"]["content_hash"]
    assert prov["config_hash"]
    assert prov["normalized_dataset_hash"]
    assert prov["unit_policy"] == "LEGACY"
    assert prov["qc_config"]["unit_policy"] == "LEGACY"
    assert prov["result_hash"]


def test_deterministic_hashes():
    r1 = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config()))
    r2 = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config()))
    assert r1.provenance["config_hash"] == r2.provenance["config_hash"]
    assert r1.provenance["normalized_dataset_hash"] == r2.provenance["normalized_dataset_hash"]
    assert r1.provenance["result_hash"] == r2.provenance["result_hash"]


def test_config_hash_changes_with_policy():
    r1 = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config(),
                                                     unit_policy="LEGACY"))
    r2 = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config(),
                                                     unit_policy="STRICT"))
    assert r1.provenance["config_hash"] != r2.provenance["config_hash"]


def test_provenance_serializable():
    r = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config()))
    assert json.loads(json.dumps(r.to_dict())) == r.to_dict()


def test_acceptance_outcomes_constant():
    assert set(ACCEPTANCE_OUTCOMES) == {"ACCEPTED", "ACCEPTED_WITH_WARNINGS", "REJECTED", "PENDING_REVIEW"}


# --- model integration -----------------------------------------------------

def test_accepted_dataset_feeds_existing_model():
    from hydroma.climate_et0 import compute_et0_series
    csv = "date,tmean,u2,ea,rs\n2026-01-01,20.0,2.0,1.5,15.0\n"
    cfg = ImportConfig(
        format="csv", timestamp_column="date",
        variable_columns={"air_temperature": "tmean", "wind_speed": "u2",
                          "relative_humidity": "ea", "solar_radiation": "rs"},
        input_units={"air_temperature": "degC", "wind_speed": "m/s",
                     "relative_humidity": "%", "solar_radiation": "MJ/m2/day"},
        basis="daily_mean", variable_basis={"solar_radiation": "daily_sum"},
        temporal_resolution="1d",
    )
    r = ingest_climate(csv, ClimateIngestionConfig(format="csv", import_config=cfg))
    assert r.ok is True
    series = to_climate_series(r)
    et0 = compute_et0_series(series, ET0IntegrationConfig(variable_mapping=_MAP, elevation_m=0.0))
    assert et0.ok is True
    assert len(et0.records) == 1


def test_no_implicit_unit_conversion():
    csv = "date,tmean,precip\n2026-01-01,68.0,1.0\n"  # 68 degF if declared
    cfg = _csv_config(variable_columns={"air_temperature": "tmean"},
                      input_units={"air_temperature": "degF"},
                      conversions={"air_temperature": "degF_to_degC"}, basis="daily_mean")
    r = ingest_climate(csv, ClimateIngestionConfig(format="csv", import_config=cfg))
    assert r.ok is True
    assert math.isclose(r.series.observations[0].value, 20.0, abs_tol=1e-9)


# --- regression ------------------------------------------------------------

def test_existing_et0_still_works():
    from hydroma.climate import ClimateObservation, ClimateSeries
    from hydroma.climate_et0 import compute_et0_series
    rows = [ClimateObservation("air_temperature", 20.0, "degC", "2026-01-01", "daily_mean", "valid"),
            ClimateObservation("wind_speed", 2.0, "m/s", "2026-01-01", "daily_mean", "valid"),
            ClimateObservation("relative_humidity", 50.0, "%", "2026-01-01", "daily_mean", "valid"),
            ClimateObservation("solar_radiation", 15.0, "MJ/m2/day", "2026-01-01", "daily_sum", "valid")]
    s = ClimateSeries(rows, variable=None, temporal_resolution="1d")
    assert compute_et0_series(s, ET0IntegrationConfig(variable_mapping=_MAP, elevation_m=0.0)).ok is True


# --- acceptance precedence (Phase 3.10.1 Gap A) ---------------------------

def _mem(obs, **kw):
    s = ClimateSeries([obs], variable=None, temporal_resolution="1d")
    return ingest_climate(s, ClimateIngestionConfig(format="memory", **kw))


def test_accept_contract_invalid():
    from hydroma.climate import ClimateObservation
    r = _mem(ClimateObservation("moon_phase", 1.0, "1", "2026-01-01", "instant", "valid"))
    assert r.status == "REJECTED"
    assert r.acceptance["reason"] == "CONTRACT_INVALID"


def test_accept_strict_unit_missing():
    from hydroma.climate import ClimateObservation
    r = _mem(ClimateObservation("air_temperature", 20.0, "", "2026-01-01", "daily_mean", "valid"),
             unit_policy="STRICT")
    assert r.status == "REJECTED"
    assert r.acceptance["reason"] == "STRICT_UNIT_MISSING"


def test_accept_blocking_qc_error():
    from hydroma.climate import ClimateObservation
    r = _mem(ClimateObservation("precipitation", -5.0, "mm", "2026-01-01", "daily_sum", "valid"))
    assert r.status == "REJECTED"
    assert r.acceptance["reason"] == "QC_ERROR"


def test_accept_nonblocking_qc_error():
    from hydroma.climate import ClimateObservation
    policy = QualityControlPolicy(error_blocks_execution=False)
    r = _mem(ClimateObservation("precipitation", -5.0, "mm", "2026-01-01", "daily_sum", "valid"),
             qc_policy=policy)
    assert r.status == "ACCEPTED_WITH_WARNINGS"
    assert r.acceptance["reason"] == "QC_ERRORS_NONBLOCKING"


def test_accept_qc_unavailable():
    from hydroma.climate import ClimateObservation
    r = _mem(ClimateObservation("air_temperature", 20.0, "degC", "2026-01-01", "daily_mean", "valid"),
             domain="soil")
    assert r.status == "PENDING_REVIEW"
    assert r.acceptance["reason"] == "QC_UNAVAILABLE"


def test_accept_blocking_qc_warning():
    from hydroma.climate import ClimateObservation
    policy = QualityControlPolicy(thresholds={"air_temperature": {"min": -10, "max": 50}},
                               warn_blocks_execution=True)
    r = _mem(ClimateObservation("air_temperature", 60.0, "degC", "2026-01-01", "daily_mean", "valid"),
             qc_policy=policy)
    assert r.status == "REJECTED"
    assert r.acceptance["reason"] == "QC_WARNING_BLOCKING"


def test_accept_nonblocking_warning():
    from hydroma.climate import ClimateObservation
    policy = QualityControlPolicy(thresholds={"air_temperature": {"min": -10, "max": 50}})
    r = _mem(ClimateObservation("air_temperature", 60.0, "degC", "2026-01-01", "daily_mean", "valid"),
             qc_policy=policy)
    assert r.status == "ACCEPTED_WITH_WARNINGS"
    assert r.acceptance["reason"] == "QC_WARNINGS"


# --- MODEL_READY gate (Phase 3.10.1 Gap B) --------------------------------

def test_gate_accepted():
    r = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config()))
    assert r.status == "ACCEPTED"
    assert to_climate_series(r) is r.series


def test_gate_accepted_with_warnings():
    from hydroma.climate import ClimateObservation
    policy = QualityControlPolicy(thresholds={"air_temperature": {"min": -10, "max": 50}})
    r = _mem(ClimateObservation("air_temperature", 60.0, "degC", "2026-01-01", "daily_mean", "valid"),
             qc_policy=policy)
    assert r.status == "ACCEPTED_WITH_WARNINGS"
    # warnings preserved on the result/quality report
    assert any(f["code"] == "RULE-TEMP-PLAUSIBILITY" for f in r.quality["flags"])
    assert to_climate_series(r) is r.series


def test_gate_rejected():
    from hydroma.climate import ClimateObservation
    r = _mem(ClimateObservation("precipitation", -5.0, "mm", "2026-01-01", "daily_sum", "valid"))
    assert r.status == "REJECTED"
    with pytest.raises(IngestionError):
        to_climate_series(r)


def test_gate_pending_review():
    from hydroma.climate import ClimateObservation
    r = _mem(ClimateObservation("air_temperature", 20.0, "degC", "2026-01-01", "daily_mean", "valid"),
             domain="soil")
    assert r.status == "PENDING_REVIEW"
    with pytest.raises(IngestionError):
        to_climate_series(r)


# --- hash sensitivity (Phase 3.10.1 Gap C) --------------------------------

def test_source_hash_changes_with_content():
    r1 = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config()))
    r2 = ingest_climate(_CSV.replace("22.0", "25.0"),
                        ClimateIngestionConfig(format="csv", import_config=_csv_config()))
    assert r1.provenance["source"]["content_hash"] != r2.provenance["source"]["content_hash"]


def test_normalized_hash_changes_with_data():
    r1 = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config()))
    r2 = ingest_climate(_CSV.replace("22.0", "25.0"),
                        ClimateIngestionConfig(format="csv", import_config=_csv_config()))
    assert r1.provenance["normalized_dataset_hash"] != r2.provenance["normalized_dataset_hash"]


def test_config_hash_changes_with_qc_thresholds():
    p1 = QualityControlPolicy(thresholds={"air_temperature": {"min": -10, "max": 50}})
    p2 = QualityControlPolicy(thresholds={"air_temperature": {"min": -20, "max": 60}})
    r1 = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config(), qc_policy=p1))
    r2 = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config(), qc_policy=p2))
    assert r1.provenance["config_hash"] != r2.provenance["config_hash"]


def test_qc_hash_changes_with_findings():
    from hydroma.climate import ClimateObservation
    clean = _mem(ClimateObservation("air_temperature", 20.0, "degC", "2026-01-01", "daily_mean", "valid"))
    dirty = _mem(ClimateObservation("precipitation", -5.0, "mm", "2026-01-01", "daily_sum", "valid"))
    assert clean.provenance["qc_hash"] != dirty.provenance["qc_hash"]


def test_result_hash_changes_with_data():
    r1 = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config()))
    r2 = ingest_climate(_CSV.replace("22.0", "25.0"),
                        ClimateIngestionConfig(format="csv", import_config=_csv_config()))
    assert r1.provenance["result_hash"] != r2.provenance["result_hash"]


def test_qc_config_included_in_config_hash():
    # QC config is intentionally folded into the combined config_hash (no standalone qc_config_hash)
    p1 = QualityControlPolicy(thresholds={"air_temperature": {"min": -10, "max": 50}})
    p2 = QualityControlPolicy(thresholds={"air_temperature": {"min": -10, "max": 50}},
                             warn_blocks_execution=True)
    r1 = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config(), qc_policy=p1))
    r2 = ingest_climate(_CSV, ClimateIngestionConfig(format="csv", import_config=_csv_config(), qc_policy=p2))
    assert r1.provenance["config_hash"] != r2.provenance["config_hash"]
    assert "qc_config" in r1.provenance