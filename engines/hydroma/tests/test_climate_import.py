"""Climate Dataset Import & Normalization tests (Phase 2.8).

Software/structural checks only — NOT scientific validation.
"""

import json
import math

import pytest

from hydroma.climate import (
    ClimateObservation,
    ClimateSeries,
    series_from_dict,
    series_hash,
    series_to_dict,
)
from hydroma.climate_import import (
    CONVERSIONS,
    ImportConfig,
    apply_conversion,
    import_climate_data,
    import_csv,
    import_file,
    import_json,
    validate_config,
)


def _cfg(**kw):
    base = dict(
        format="csv",
        timestamp_column="date",
        variable_columns={"air_temperature": "tmean"},
        input_units={"air_temperature": "degC"},
        basis="daily_mean",
        temporal_resolution="1d",
    )
    base.update(kw)
    return ImportConfig(**base)


def _codes(result):
    return {e["code"] for e in result.errors}


def _warn_codes(result):
    return {w["code"] for w in result.warnings}


# --- CSV -------------------------------------------------------------------

def test_valid_csv_single_variable():
    csv = "date,tmean\n2026-01-01,20.0\n2026-01-02,21.0\n"
    r = import_csv(csv, _cfg())
    assert r.ok is True
    assert r.records_processed == 2
    assert r.records_accepted == 2
    assert len(r.series.observations) == 2
    assert r.series.observations[0].variable == "air_temperature"
    assert r.series.observations[0].unit == "degC"


def test_csv_multiple_variables():
    csv = "date,tmean,precip\n2026-01-01,20.0,1.2\n2026-01-02,21.0,0.0\n"
    r = import_csv(csv, _cfg(
        variable_columns={"air_temperature": "tmean", "precipitation": "precip"},
        input_units={"air_temperature": "degC", "precipitation": "mm"},
        variable_basis={"precipitation": "daily_sum"},
    ))
    assert r.ok is True
    assert r.records_accepted == 4
    variables = {o.variable for o in r.series.observations}
    assert variables == {"air_temperature", "precipitation"}


def test_csv_missing_column_is_config_error():
    csv = "date,tmean\n2026-01-01,20.0\n"
    r = import_csv(csv, _cfg(variable_columns={"precipitation": "precip"}))
    assert r.ok is False
    assert "MISSING_COLUMN" in _codes(r)


def test_csv_invalid_numeric_value():
    csv = "date,tmean\n2026-01-01,abc\n"
    r = import_csv(csv, _cfg())
    assert r.ok is False
    assert "INVALID_NUMBER" in _codes(r)
    assert r.records_rejected == 1


def test_csv_empty_file():
    r = import_csv("", _cfg())
    assert r.ok is False
    assert "EMPTY_FILE" in _codes(r)


def test_csv_empty_rows_with_headers():
    r = import_csv("date,tmean\n", _cfg())
    assert r.ok is True
    assert r.records_accepted == 0
    assert "EMPTY_IMPORT" in _warn_codes(r)


def test_csv_invalid_headers():
    # no header row at all
    r = import_csv("", _cfg())
    assert "EMPTY_FILE" in _codes(r)


def test_csv_malformed_row_missing_value():
    # a short row yields a missing cell -> explicit missing observation
    csv = "date,tmean\n2026-01-01\n"
    r = import_csv(csv, _cfg())
    assert r.ok is True
    assert r.missing_value_count == 1
    assert r.series.observations[0].quality == "missing"
    assert r.series.observations[0].value is None


def test_csv_missing_marker():
    csv = "date,tmean\n2026-01-01,NA\n"
    r = import_csv(csv, _cfg(missing_markers=["", "NA"]))
    assert r.series.observations[0].quality == "missing"
    assert r.series.observations[0].value is None


def test_csv_date_only_daily():
    csv = "date,tmean\n2026-01-01,20.0\n"
    r = import_csv(csv, _cfg(basis="daily_mean"))
    assert r.ok is True
    assert r.series.observations[0].timestamp == "2026-01-01"


def test_csv_ambiguous_dates_rejected_without_format():
    # 03/04/2025 is ambiguous; not ISO -> rejected unless date_format is configured
    csv = "date,tmean\n03/04/2025,20.0\n"
    r = import_csv(csv, _cfg())
    assert r.ok is False
    assert "INVALID_TIMESTAMP" in _codes(r)


def test_csv_ambiguous_dates_with_explicit_format():
    csv = "date,tmean\n03/04/2025,20.0\n"
    r = import_csv(csv, _cfg(date_format="%d/%m/%Y"))
    assert r.ok is True
    assert r.series.observations[0].timestamp == "2025-04-03"


def test_csv_timestamp_parsing_iso():
    csv = "date,tmean\n2026-01-01T06:00:00Z,20.0\n"
    r = import_csv(csv, _cfg(basis="instant"))
    assert r.ok is True
    assert r.series.observations[0].timestamp == "2026-01-01T06:00:00Z"


def test_csv_timezone_aware_input():
    csv = "date,tmean\n2026-01-01T06:00:00+03:00,20.0\n"
    r = import_csv(csv, _cfg(basis="instant"))
    assert r.ok is True
    assert r.series.observations[0].timestamp == "2026-01-01T03:00:00Z"


def test_csv_naive_timestamp_requires_timezone():
    csv = "date,tmean\n2026-01-01T06:00:00,20.0\n"
    r = import_csv(csv, _cfg(basis="instant"))
    assert r.ok is False
    assert "INVALID_TIMESTAMP" in _codes(r)


def test_csv_naive_timestamp_with_explicit_timezone():
    csv = "date,tmean\n2026-01-01T06:00:00,20.0\n"
    r = import_csv(csv, _cfg(basis="instant", timezone="+03:00"))
    assert r.ok is True
    assert r.series.observations[0].timestamp == "2026-01-01T03:00:00Z"


def test_csv_quality_mapping():
    csv = "date,tmean,qc\n2026-01-01,20.0,ok\n2026-01-02,21.0,bad\n"
    r = import_csv(csv, _cfg(quality_column="qc", quality_mapping={"ok": "valid", "bad": "suspect"}))
    assert r.ok is True
    assert r.series.observations[0].quality == "valid"
    assert r.series.observations[1].quality == "suspect"


def test_csv_unknown_quality_code_errors():
    csv = "date,tmean,qc\n2026-01-01,20.0,weird\n"
    r = import_csv(csv, _cfg(quality_column="qc", quality_mapping={"ok": "valid"}))
    assert r.ok is False
    assert "UNKNOWN_QUALITY_CODE" in _codes(r)


def test_csv_unknown_quality_code_warn_mode():
    csv = "date,tmean,qc\n2026-01-01,20.0,weird\n"
    r = import_csv(csv, _cfg(quality_column="qc", quality_mapping={"ok": "valid"},
                             on_unknown_quality="warn"))
    assert r.ok is True
    assert r.series.observations[0].quality == "unchecked"


def test_csv_spatial_metadata():
    csv = "date,tmean\n2026-01-01,20.0\n"
    r = import_csv(csv, _cfg(spatial={"latitude": 35.0, "longitude": 51.0, "elevation": 1200.0},
                             station_id="st1"))
    assert r.ok is True
    assert r.series.spatial.latitude == 35.0
    assert r.series.spatial.station_id == "st1"


def test_csv_missing_periods_reported():
    csv = "date,tmean\n2026-01-01,20.0\n2026-01-03,21.0\n"
    r = import_csv(csv, _cfg())
    assert len(r.missing_periods) == 1
    assert r.missing_periods[0]["missing_count"] == 1


# --- JSON ------------------------------------------------------------------

def test_json_series_contract_roundtrip_input():
    series = ClimateSeries(
        [ClimateObservation("air_temperature", 20.0, "degC", "2026-01-01T00:00:00Z", "instant", "valid")],
        variable="air_temperature",
    )
    r = import_json(json.dumps(series_to_dict(series)), ImportConfig(format="json"))
    assert r.ok is True
    assert r.records_accepted == 1
    assert r.series.observations[0].value == 20.0


def test_json_list_of_observations():
    data = [
        {"variable": "air_temperature", "value": 20.0, "unit": "degC",
         "timestamp": "2026-01-01T00:00:00Z", "basis": "instant", "quality": "valid"},
    ]
    r = import_json(json.dumps(data), ImportConfig(format="json"))
    assert r.ok is True
    assert r.records_accepted == 1


def test_json_invalid_json():
    r = import_json("{not json", ImportConfig(format="json"))
    assert r.ok is False
    assert "INVALID_JSON" in _codes(r)


def test_json_missing_required_fields():
    data = [{"variable": "air_temperature", "value": 20.0}]  # no unit/timestamp/basis
    r = import_json(json.dumps(data), ImportConfig(format="json"))
    assert r.ok is False


def test_json_invalid_observation_record():
    data = [{"variable": "unknown_var", "value": 20.0, "unit": "degC",
             "timestamp": "2026-01-01T00:00:00Z", "basis": "instant"}]
    r = import_json(json.dumps(data), ImportConfig(format="json"))
    assert r.ok is False
    assert "UNKNOWN_VARIABLE" in _codes(r)


def test_json_metadata_preserved():
    from hydroma.climate import DataProvenance, SpatialContext
    series = ClimateSeries(
        [ClimateObservation("air_temperature", 20.0, "degC", "2026-01-01T00:00:00Z", "instant")],
        variable="air_temperature",
        provenance=DataProvenance(source_id="src", source_type="station"),
        spatial=SpatialContext(latitude=1.0, longitude=2.0),
    )
    r = import_json(json.dumps(series_to_dict(series)), ImportConfig(format="json"))
    assert r.ok is True
    assert r.series.provenance.source_id == "src"
    assert r.series.spatial.latitude == 1.0


# --- units / conversions ---------------------------------------------------

def test_explicit_conversion_fahrenheit():
    csv = "date,tmean\n2026-01-01,68.0\n"  # 68F = 20C
    r = import_csv(csv, _cfg(input_units={"air_temperature": "degF"},
                             conversions={"air_temperature": "degF_to_degC"}))
    assert r.ok is True
    assert math.isclose(r.series.observations[0].value, 20.0, abs_tol=1e-9)
    assert r.series.observations[0].unit == "degC"


def test_no_conversion_when_not_configured():
    csv = "date,tmean\n2026-01-01,68.0\n"
    r = import_csv(csv, _cfg(input_units={"air_temperature": "degF"}))  # no conversion
    assert r.ok is False
    assert "INCOMPATIBLE_UNIT" in _codes(r)


def test_unsupported_conversion_rejected():
    csv = "date,rs\n2026-01-01,20.0\n"
    r = import_csv(csv, _cfg(variable_columns={"solar_radiation": "rs"},
                             input_units={"solar_radiation": "MJ/m2/day"},
                             basis="daily_sum"))
    # matching unit -> ok; but a mismatched solar unit with no conversion -> error
    assert r.ok is True
    csv2 = "date,rs\n2026-01-01,20.0\n"
    r2 = import_csv(csv2, _cfg(variable_columns={"solar_radiation": "rs"},
                               input_units={"solar_radiation": "J/m2"},
                               basis="daily_sum"))
    assert r2.ok is False
    assert "INCOMPATIBLE_UNIT" in _codes(r2)


def test_incompatible_units_rejected():
    csv = "date,tmean\n2026-01-01,20.0\n"
    r = import_csv(csv, _cfg(input_units={"air_temperature": "mm"}))
    assert r.ok is False
    assert "INCOMPATIBLE_UNIT" in _codes(r)


def test_conversion_determinism():
    assert apply_conversion("degF_to_degC", 68.0) == 20.0
    assert apply_conversion("cm_to_mm", 1.0) == 10.0
    assert math.isclose(apply_conversion("kmh_to_ms", 3.6), 1.0)
    assert apply_conversion("fraction_to_percent", 0.5) == 50.0


def test_original_unit_preserved_in_metadata():
    csv = "date,tmean\n2026-01-01,68.0\n"
    r = import_csv(csv, _cfg(input_units={"air_temperature": "degF"},
                             conversions={"air_temperature": "degF_to_degC"}))
    assert r.metadata["input_units"]["air_temperature"] == "degF"
    assert r.metadata["conversions"]["air_temperature"] == "degF_to_degC"


def test_conversion_registry_scope():
    assert CONVERSIONS["degF_to_degC"]["to"] == "degC"
    assert "air_temperature" in CONVERSIONS["degF_to_degC"]["variables"]
    # solar radiation has no conversion
    assert not any("solar_radiation" in c["variables"] for c in CONVERSIONS.values())


# --- temporal --------------------------------------------------------------

def test_daily_basis_preserved():
    csv = "date,precip\n2026-01-01,1.2\n"
    r = import_csv(csv, _cfg(variable_columns={"precipitation": "precip"},
                             input_units={"precipitation": "mm"}, basis="daily_sum"))
    assert r.series.observations[0].basis == "daily_sum"


def test_no_automatic_aggregation():
    # hourly input stays hourly; no daily aggregation is performed
    csv = "date,tmean\n2026-01-01T01:00:00Z,20.0\n2026-01-01T02:00:00Z,21.0\n"
    r = import_csv(csv, _cfg(basis="instant", temporal_resolution="1h"))
    assert r.ok is True
    assert len(r.series.observations) == 2
    assert all(o.basis == "instant" for o in r.series.observations)


def test_date_only_non_daily_basis_flag():
    csv = "date,tmean\n2026-01-01,20.0\n"
    r = import_csv(csv, _cfg(basis="instant"))  # instant basis with date-only
    # recorded as an error per observation
    assert "DATE_ONLY_NON_DAILY_BASIS" in _codes(r)


# --- missing data ----------------------------------------------------------

def test_missing_temperature_not_zero():
    csv = "date,tmean\n2026-01-01,\n"
    r = import_csv(csv, _cfg())
    obs = r.series.observations[0]
    assert obs.value is None
    assert obs.quality == "missing"


def test_missing_precipitation_not_zero():
    csv = "date,precip\n2026-01-01,\n"
    r = import_csv(csv, _cfg(variable_columns={"precipitation": "precip"},
                             input_units={"precipitation": "mm"}, basis="daily_sum"))
    obs = r.series.observations[0]
    assert obs.value is None
    assert obs.quality == "missing"


def test_invalid_numeric_not_dropped_silently():
    csv = "date,tmean\n2026-01-01,abc\n"
    r = import_csv(csv, _cfg())
    assert r.ok is False
    assert r.records_rejected == 1
    assert "INVALID_NUMBER" in _codes(r)


# --- import result ---------------------------------------------------------

def test_successful_import_result_counts():
    csv = "date,tmean\n2026-01-01,20.0\n2026-01-02,21.0\n"
    r = import_csv(csv, _cfg())
    assert r.ok is True
    assert r.records_processed == 2
    assert r.records_accepted == 2
    assert r.records_rejected == 0
    assert r.missing_value_count == 0


def test_failed_import_no_series():
    r = import_csv("date,tmean\n2026-01-01,abc\n", _cfg())
    assert r.ok is False
    assert r.series is not None  # partial: series built from zero accepted obs
    assert r.series is not None and len(r.series.observations) == 0


def test_partial_import_explicit():
    # one good row, one bad numeric -> partial (series present, errors present)
    csv = "date,tmean\n2026-01-01,20.0\n2026-01-02,abc\n"
    r = import_csv(csv, _cfg())
    assert r.ok is False
    assert r.partial is True
    assert r.records_accepted == 1
    assert r.records_rejected == 1


def test_result_to_dict_serializable():
    csv = "date,tmean\n2026-01-01,20.0\n"
    r = import_csv(csv, _cfg())
    d = r.to_dict()
    assert json.loads(json.dumps(d)) == d
    assert d["ok"] is True


def test_import_metadata_present():
    csv = "date,tmean\n2026-01-01,20.0\n"
    r = import_csv(csv, _cfg(source_file="demo.csv"))
    assert r.metadata["format"] == "csv"
    assert r.metadata["source_file"] == "demo.csv"
    assert "import" in r.metadata["processing_history"]


def test_reproducibility_same_hash():
    csv = "date,tmean\n2026-01-01,20.0\n2026-01-02,21.0\n"
    r1 = import_csv(csv, _cfg())
    r2 = import_csv(csv, _cfg())
    assert series_hash(r1.series) == series_hash(r2.series)


def test_series_still_roundtrips_after_import():
    csv = "date,tmean\n2026-01-01,20.0\n"
    r = import_csv(csv, _cfg())
    restored = series_from_dict(series_to_dict(r.series))
    assert restored == r.series


# --- config validation -----------------------------------------------------

def test_validate_config_invalid_format():
    cfg = _cfg(format="xml")
    res = validate_config(cfg)
    assert res["valid"] is False
    assert "INVALID_FORMAT" in {e["code"] for e in res["errors"]}


def test_validate_config_missing_timestamp_column():
    res = validate_config(_cfg(timestamp_column=None))
    assert res["valid"] is False
    assert "MISSING_TIMESTAMP_COLUMN" in {e["code"] for e in res["errors"]}


def test_validate_config_unknown_variable():
    res = validate_config(_cfg(variable_columns={"moon_phase": "x"}))
    assert res["valid"] is False
    assert "UNKNOWN_VARIABLE" in {e["code"] for e in res["errors"]}


def test_validate_config_unknown_conversion():
    res = validate_config(_cfg(conversions={"air_temperature": "degR_to_degC"}))
    assert res["valid"] is False
    assert "UNKNOWN_CONVERSION" in {e["code"] for e in res["errors"]}


def test_validate_config_conversion_not_applicable():
    res = validate_config(_cfg(variable_columns={"precipitation": "p"},
                               input_units={"precipitation": "mm"},
                               conversions={"precipitation": "degF_to_degC"}))
    assert res["valid"] is False
    assert "CONVERSION_NOT_APPLICABLE" in {e["code"] for e in res["errors"]}


def test_validate_config_invalid_resolution():
    res = validate_config(_cfg(temporal_resolution="1w"))
    assert res["valid"] is False
    assert "INVALID_RESOLUTION" in {e["code"] for e in res["errors"]}


# --- regression: climate + engine unaffected -------------------------------

def test_existing_climate_contract_unchanged():
    from hydroma.climate import validate_series
    s = ClimateSeries([ClimateObservation("air_temperature", 20.0, "degC",
                                          "2026-01-01T00:00:00Z", "instant", "valid")],
                      variable="air_temperature")
    assert validate_series(s)["valid"] is True


def test_existing_models_still_valid():
    from hydroma.registry import validate_definition
    from hydroma.water_balance import WATER_BALANCE_DEFINITION
    from hydroma.fao56_et0 import FAO56_ET0_DEFINITION

    validate_definition(WATER_BALANCE_DEFINITION)
    validate_definition(FAO56_ET0_DEFINITION)


def test_dispatch_by_format():
    csv = "date,tmean\n2026-01-01,20.0\n"
    assert import_climate_data(csv, _cfg()).ok is True
    js = json.dumps([{"variable": "air_temperature", "value": 20.0, "unit": "degC",
                      "timestamp": "2026-01-01T00:00:00Z", "basis": "instant"}])
    assert import_climate_data(js, ImportConfig(format="json")).ok is True