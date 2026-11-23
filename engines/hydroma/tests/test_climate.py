"""Climate Data Foundation tests: observation/series contracts, temporal integrity,
quality, spatial, missing data, provenance, serialization.

These are software/structural checks. They are NOT scientific validation.
"""

import json
import math

import pytest

from hydroma.climate import (
    CLIMATE_VARIABLE_IDS,
    CLIMATE_VARIABLES,
    MISSING_DATA_POLICIES,
    QUALITY_FLAGS,
    TEMPORAL_BASES,
    ClimateObservation,
    ClimateSeries,
    DataProvenance,
    SpatialContext,
    canonical_series_json,
    is_unit_compatible,
    is_valid_quality,
    missing_periods,
    observation_from_dict,
    observation_to_dict,
    parse_resolution,
    parse_timestamp,
    series_from_dict,
    series_hash,
    series_to_dict,
    validate_missing_data_policy,
    validate_observation,
    validate_provenance,
    validate_series,
    validate_spatial,
)


def _obs(variable="air_temperature", value=20.0, unit="degC", ts="2026-01-01T00:00:00Z",
         basis="instant", quality="valid"):
    return ClimateObservation(variable, value, unit, ts, basis, quality)


def _codes(result):
    return {e["code"] for e in result["errors"]}


def _warn_codes(result):
    return {w["code"] for w in result["warnings"]}


# --- observation: valid + variable/unit/basis ------------------------------

def test_valid_observation():
    assert validate_observation(_obs())["valid"] is True


def test_unknown_variable_rejected():
    assert "UNKNOWN_VARIABLE" in _codes(validate_observation(_obs(variable="moon_phase")))


def test_unit_variable_incompatibility_rejected():
    assert "INCOMPATIBLE_UNIT" in _codes(validate_observation(_obs(unit="mm")))


def test_unit_variable_compatibility_helper():
    assert is_unit_compatible("precipitation", "mm") is True
    assert is_unit_compatible("precipitation", "degC") is False
    assert is_unit_compatible("air_temperature", "degC") is True
    assert is_unit_compatible("wind_speed", "m/s") is True
    assert is_unit_compatible("solar_radiation", "MJ/m2/day") is True
    assert is_unit_compatible("unknown", "mm") is False


def test_invalid_basis_rejected():
    assert "INVALID_BASIS" in _codes(validate_observation(_obs(basis="weekly")))


def test_basis_incompatible_for_variable():
    # precipitation cannot be an instantaneous value
    r = validate_observation(_obs(variable="precipitation", unit="mm", basis="instant"))
    assert "BASIS_INCOMPATIBLE" in _codes(r)


def test_invalid_value_rejected():
    assert "INVALID_VALUE" in _codes(validate_observation(_obs(value=float("nan"))))
    assert "INVALID_VALUE" in _codes(validate_observation(_obs(value="20")))


def test_missing_value_requires_missing_flag():
    assert "MISSING_VALUE_WITHOUT_FLAG" in _codes(validate_observation(_obs(value=None, quality="valid")))


def test_value_with_missing_flag_rejected():
    assert "VALUE_WITH_MISSING_FLAG" in _codes(validate_observation(_obs(value=20.0, quality="missing")))


def test_missing_value_with_missing_flag_ok():
    assert validate_observation(_obs(value=None, quality="missing"))["valid"] is True


def test_invalid_quality_rejected():
    assert "INVALID_QUALITY" in _codes(validate_observation(_obs(quality="good")))


def test_all_quality_states_valid():
    for q in QUALITY_FLAGS:
        value = None if q == "missing" else 20.0
        assert validate_observation(_obs(value=value, quality=q))["valid"] is True, q


def test_missing_optional_metadata_ok():
    # source is optional; absent source must not invalidate
    o = _obs()
    assert o.source is None
    assert validate_observation(o)["valid"] is True


def test_invalid_timestamp_rejected():
    assert "INVALID_TIMESTAMP" in _codes(validate_observation(_obs(ts="not-a-date")))


def test_observation_serialization_roundtrip():
    o = _obs()
    d = observation_to_dict(o)
    assert json.loads(json.dumps(d)) == d
    assert observation_from_dict(d) == o


# --- temporal integrity ----------------------------------------------------

def test_ordered_observations_ok():
    s = ClimateSeries([_obs(ts="2026-01-01T00:00:00Z"), _obs(ts="2026-01-02T00:00:00Z")],
                      variable="air_temperature")
    assert validate_series(s)["valid"] is True


def test_out_of_order_warns():
    s = ClimateSeries([_obs(ts="2026-01-02T00:00:00Z"), _obs(ts="2026-01-01T00:00:00Z")],
                      variable="air_temperature")
    r = validate_series(s)
    assert "OUT_OF_ORDER" in _warn_codes(r)


def test_duplicate_observation_warns():
    s = ClimateSeries([_obs(ts="2026-01-01T00:00:00Z", value=20.0),
                       _obs(ts="2026-01-01T00:00:00Z", value=20.0)], variable="air_temperature")
    assert "DUPLICATE_OBSERVATION" in _warn_codes(validate_series(s))


def test_conflicting_observation_errors():
    s = ClimateSeries([_obs(ts="2026-01-01T00:00:00Z", value=20.0),
                       _obs(ts="2026-01-01T00:00:00Z", value=21.0)], variable="air_temperature")
    assert "CONFLICTING_OBSERVATION" in _codes(validate_series(s))


def test_same_timestamp_different_variable_is_not_conflict():
    # a multi-variable series legitimately carries several variables at one time
    s = ClimateSeries([
        _obs(variable="air_temperature", unit="degC", value=20.0, ts="2026-01-01T00:00:00Z"),
        _obs(variable="precipitation", unit="mm", value=1.2, basis="daily_sum", ts="2026-01-01T00:00:00Z"),
    ])
    r = validate_series(s)
    assert "CONFLICTING_OBSERVATION" not in _codes(r)
    assert "DUPLICATE_OBSERVATION" not in _warn_codes(r)


def test_missing_intervals_detected():
    s = ClimateSeries([_obs(ts="2026-01-01T00:00:00Z"), _obs(ts="2026-01-03T00:00:00Z")],
                      variable="air_temperature", temporal_resolution="1d")
    assert "MISSING_PERIODS" in _warn_codes(validate_series(s))
    gaps = missing_periods(s)
    assert len(gaps) == 1 and gaps[0]["missing_count"] == 1


def test_no_missing_intervals_when_complete():
    s = ClimateSeries([_obs(ts="2026-01-01T00:00:00Z"), _obs(ts="2026-01-02T00:00:00Z")],
                      variable="air_temperature", temporal_resolution="1d")
    assert "MISSING_PERIODS" not in _warn_codes(validate_series(s))
    assert missing_periods(s) == []


def test_missing_periods_requires_resolution():
    s = ClimateSeries([_obs()], variable="air_temperature")
    with pytest.raises(ValueError):
        missing_periods(s)


def test_daily_date_only_vs_instant():
    # date-only daily value is parsed as midnight UTC, distinct from an instant timestamp
    daily = _obs(ts="2026-01-01", basis="daily_mean")
    instant = _obs(ts="2026-01-01T00:00:00Z", basis="instant")
    assert parse_timestamp(daily.timestamp) == parse_timestamp(instant.timestamp)
    assert validate_observation(daily)["valid"] is True


def test_timezone_normalisation():
    a = parse_timestamp("2026-01-01T00:00:00Z")
    b = parse_timestamp("2026-01-01T03:00:00+03:00")  # same instant
    assert a == b


def test_parse_resolution():
    assert parse_resolution("1d").total_seconds() == 86400
    assert parse_resolution("3h").total_seconds() == 10800
    assert parse_resolution("30m").total_seconds() == 1800
    with pytest.raises(ValueError):
        parse_resolution("1w")
    with pytest.raises(ValueError):
        parse_resolution("0d")


def test_invalid_resolution_errors():
    s = ClimateSeries([_obs(ts="2026-01-01T00:00:00Z"), _obs(ts="2026-01-02T00:00:00Z")],
                      variable="air_temperature", temporal_resolution="1w")
    assert "INVALID_RESOLUTION" in _codes(validate_series(s))


# --- series ----------------------------------------------------------------

def test_empty_series_behavior():
    s = ClimateSeries([], variable="air_temperature")
    r = validate_series(s)
    assert r["valid"] is True
    assert "EMPTY_SERIES" in _warn_codes(r)


def test_valid_series():
    s = ClimateSeries([_obs(ts="2026-01-01T00:00:00Z"), _obs(ts="2026-01-02T00:00:00Z")],
                      variable="air_temperature", temporal_resolution="1d")
    assert validate_series(s)["valid"] is True


def test_invalid_series_propagates_observation_errors():
    s = ClimateSeries([_obs(unit="mm")], variable="air_temperature")
    assert "INCOMPATIBLE_UNIT" in _codes(validate_series(s))


def test_mixed_variable_series_warns():
    s = ClimateSeries([_obs(variable="air_temperature", unit="degC"),
                       _obs(variable="precipitation", unit="mm", basis="daily_sum",
                            ts="2026-01-02T00:00:00Z")])
    assert "MIXED_VARIABLES" in _warn_codes(validate_series(s))


def test_variable_mismatch_errors():
    s = ClimateSeries([_obs(variable="precipitation", unit="mm", basis="daily_sum")],
                      variable="air_temperature")
    assert "VARIABLE_MISMATCH" in _codes(validate_series(s))


def test_consistent_temporal_resolution_ok():
    s = ClimateSeries([_obs(ts="2026-01-01T00:00:00Z"), _obs(ts="2026-01-02T00:00:00Z")],
                      variable="air_temperature", temporal_resolution="1d")
    assert validate_series(s)["valid"] is True


def test_series_serialization_roundtrip():
    s = ClimateSeries(
        [_obs(ts="2026-01-01T00:00:00Z"), _obs(ts="2026-01-02T00:00:00Z")],
        variable="air_temperature",
        temporal_resolution="1d",
        spatial=SpatialContext(latitude=35.0, longitude=51.0, elevation=1200.0, station_id="st1"),
        provenance=DataProvenance(source_id="demo", source_type="station", dataset_version="1"),
    )
    d = series_to_dict(s)
    assert json.loads(json.dumps(d)) == d
    restored = series_from_dict(d)
    assert restored == s


def test_series_hash_deterministic_and_sensitive():
    a = ClimateSeries([_obs(value=20.0)], variable="air_temperature")
    b = ClimateSeries([_obs(value=20.0)], variable="air_temperature")
    c = ClimateSeries([_obs(value=21.0)], variable="air_temperature")
    assert series_hash(a) == series_hash(b)
    assert series_hash(a) != series_hash(c)
    assert len(series_hash(a)) == 64


def test_canonical_series_json_stable():
    s = ClimateSeries([_obs(value=20.0)], variable="air_temperature")
    assert canonical_series_json(s) == canonical_series_json(s)
    json.loads(canonical_series_json(s))


# --- spatial ---------------------------------------------------------------

def test_valid_spatial():
    assert validate_spatial(SpatialContext(latitude=35.0, longitude=51.0, elevation=1200.0))["valid"] is True


def test_invalid_latitude():
    assert "INVALID_LATITUDE" in _codes(validate_spatial(SpatialContext(latitude=100.0, crs="EPSG:4326")))


def test_invalid_longitude():
    assert "INVALID_LONGITUDE" in _codes(validate_spatial(SpatialContext(longitude=-200.0, crs="EPSG:4326")))


def test_invalid_elevation():
    assert "INVALID_ELEVATION" in _codes(validate_spatial(SpatialContext(elevation=float("nan"))))


def test_optional_spatial_none_ok():
    assert validate_spatial(None)["valid"] is True
    s = ClimateSeries([_obs()], variable="air_temperature")  # no spatial
    assert validate_series(s)["valid"] is True


def test_spatial_in_series_validated():
    s = ClimateSeries([_obs()], variable="air_temperature",
                      spatial=SpatialContext(latitude=999.0, crs="EPSG:4326"))
    assert "INVALID_LATITUDE" in _codes(validate_series(s))


# --- missing data ----------------------------------------------------------

def test_missing_data_policies():
    assert set(MISSING_DATA_POLICIES) == {"error", "skip", "flag_only"}
    assert validate_missing_data_policy("skip") is True
    assert validate_missing_data_policy("interpolate") is False


def test_invalid_missing_policy_errors():
    s = ClimateSeries([_obs()], variable="air_temperature", missing_data_policy="interpolate")
    assert "INVALID_MISSING_POLICY" in _codes(validate_series(s))


def test_missing_observation_vs_missing_value_distinguished():
    # a missing value is an explicit record with quality 'missing'
    missing_value = _obs(value=None, quality="missing")
    assert validate_observation(missing_value)["valid"] is True
    # a missing observation is an absent timestamp (series gap), reported separately
    s = ClimateSeries([_obs(ts="2026-01-01T00:00:00Z"), _obs(ts="2026-01-03T00:00:00Z")],
                      variable="air_temperature", temporal_resolution="1d")
    assert "MISSING_PERIODS" in _warn_codes(validate_series(s))


def test_no_silent_zero_for_missing_precip():
    # missing precipitation is a null value flagged 'missing', never 0
    p = _obs(variable="precipitation", unit="mm", value=None, basis="daily_sum", quality="missing")
    assert p.value is None
    assert validate_observation(p)["valid"] is True


# --- provenance ------------------------------------------------------------

def test_optional_provenance():
    assert validate_provenance(None)["valid"] is True
    s = ClimateSeries([_obs()], variable="air_temperature")
    assert validate_series(s)["valid"] is True


def test_provenance_preserved_in_serialization():
    prov = DataProvenance(source_id="src", source_type="station", dataset_version="2",
                          processing_history=["unit-check"], qc_history=["range-check"])
    s = ClimateSeries([_obs()], variable="air_temperature", provenance=prov)
    restored = series_from_dict(series_to_dict(s))
    assert restored.provenance == prov


def test_invalid_provenance_rejected():
    bad = DataProvenance(processing_history="not-a-list")
    assert "INVALID_PROVENANCE" in _codes(validate_provenance(bad))


# --- variable vocabulary ---------------------------------------------------

def test_variable_vocabulary_present():
    for v in ("air_temperature", "min_air_temperature", "max_air_temperature",
              "precipitation", "relative_humidity", "wind_speed", "solar_radiation",
              "evaporation"):
        assert v in CLIMATE_VARIABLES
    assert set(TEMPORAL_BASES) >= {"instant", "period_mean", "period_sum",
                                   "daily_mean", "daily_min", "daily_max", "daily_sum"}


def test_quality_flag_helper():
    assert is_valid_quality("valid") is True
    assert is_valid_quality("unchecked") is True
    assert is_valid_quality("bogus") is False
    assert set(QUALITY_FLAGS) == {"unchecked", "valid", "suspect", "invalid", "missing"}


# --- regression: existing engine unaffected --------------------------------

def test_existing_provenance_unchanged():
    from hydroma.provenance import sha256_json
    from hydroma.runtime import build_provenance
    from hydroma.soil_water import SOIL_WATER_DEFINITION, compute_soil_water_storage

    inp = {"layers": [{"thickness_mm": 300, "theta_fc": 0.3, "theta_wp": 0.1}], "p": 0.5}
    prov = build_provenance("r", SOIL_WATER_DEFINITION, "alice", inp,
                            compute_soil_water_storage(inp))
    assert prov["parameter_hash"] != "none"
    assert prov["input_hashes"] == [sha256_json(inp)]


def test_existing_models_still_valid():
    from hydroma.registry import validate_definition
    from hydroma.water_balance import WATER_BALANCE_DEFINITION
    from hydroma.fao56_et0 import FAO56_ET0_DEFINITION

    validate_definition(WATER_BALANCE_DEFINITION)
    validate_definition(FAO56_ET0_DEFINITION)