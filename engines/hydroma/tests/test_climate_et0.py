"""Climate-to-FAO-56 ET0 integration tests (Phase 2.9).

Software/integration checks only — NOT scientific validation. ET0 values are
compared against the existing ``compute_fao56_et0`` model (no formula change).
"""

import math

import pytest

from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.climate_et0 import (
    DEFAULT_VARIABLE_MAPPING,
    ET0IntegrationConfig,
    compute_et0_series,
    ea_from_relative_humidity,
    es_kpa,
    validate_integration_config,
)
from hydroma.fao56_et0 import compute_fao56_et0

_MAP = {"t": "air_temperature", "u2": "wind_speed", "ea": "relative_humidity",
        "rn": "solar_radiation"}


def _obs(var, value, basis, day="2026-01-01", quality="valid", unit=None):
    units = {"air_temperature": "degC", "wind_speed": "m/s", "relative_humidity": "%",
             "solar_radiation": "MJ/m2/day", "min_air_temperature": "degC",
             "max_air_temperature": "degC"}
    return ClimateObservation(var, value, unit or units[var], day, basis, quality)


def _full_day(day="2026-01-01", t=20.0, u2=2.0, rh=50.0, rs=15.0):
    return [
        _obs("air_temperature", t, "daily_mean", day),
        _obs("wind_speed", u2, "daily_mean", day),
        _obs("relative_humidity", rh, "daily_mean", day),
        _obs("solar_radiation", rs, "daily_sum", day),
    ]


def _series(observations, resolution="1d"):
    return ClimateSeries(observations, variable=None, temporal_resolution=resolution)


def _codes(result):
    return {e["code"] for e in result.errors}


def _warn_codes(result):
    return {w["code"] for w in result.warnings}


# --- input mapping ---------------------------------------------------------

def test_correct_variable_mapping_runs():
    r = compute_et0_series(_series(_full_day()), ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.ok is True
    assert len(r.records) == 1
    assert r.records[0]["date"] == "2026-01-01"
    assert r.records[0]["model_id"] == "eco-nojin.hydroma.fao56-et0"


def test_missing_rn_mapping_is_config_error():
    cfg = ET0IntegrationConfig(variable_mapping={"t": "air_temperature", "u2": "wind_speed",
                                                 "ea": "relative_humidity", "rn": None})
    r = compute_et0_series(_series(_full_day()), cfg)
    assert r.ok is False
    assert "MISSING_RN_MAPPING" in _codes(r)


def test_unknown_variable_in_mapping():
    cfg = ET0IntegrationConfig(variable_mapping={"t": "air_temperature", "u2": "wind_speed",
                                                 "ea": "relative_humidity", "rn": "moon_phase"})
    res = validate_integration_config(cfg)
    assert res["valid"] is False
    assert "UNKNOWN_VARIABLE" in {e["code"] for e in res["errors"]}


def test_incompatible_units_rejected_by_observation_validation():
    # wind in degC -> climate series structural error, day rejected
    obs = [_obs("air_temperature", 20.0, "daily_mean"),
           _obs("wind_speed", 2.0, "daily_mean", unit="degC"),
           _obs("relative_humidity", 50.0, "daily_mean"),
           _obs("solar_radiation", 15.0, "daily_sum")]
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.ok is False
    assert len(r.records) == 0


def test_incorrect_temporal_basis_rejected():
    # instant temperature must not be consumed as a daily value
    obs = [_obs("air_temperature", 20.0, "instant"),
           _obs("wind_speed", 2.0, "daily_mean"),
           _obs("relative_humidity", 50.0, "daily_mean"),
           _obs("solar_radiation", 15.0, "daily_sum")]
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.ok is False
    assert any("basis" in reason for day in r.rejected for reason in day["reasons"])


def test_missing_spatial_metadata_is_not_an_error_when_elevation_optional():
    r = compute_et0_series(_series(_full_day()), ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.ok is True
    assert r.metadata["elevation_m"] is None


def test_explicit_spatial_elevation_override():
    r = compute_et0_series(_series(_full_day()),
                           ET0IntegrationConfig(variable_mapping=_MAP, elevation_m=250.0))
    assert r.metadata["elevation_m"] == 250.0
    assert r.records[0]["inputs"]["z"] == 250.0


def test_elevation_from_series_spatial():
    s = _series(_full_day())
    s.spatial = __import__("hydroma.climate", fromlist=["SpatialContext"]).SpatialContext(elevation=300.0)
    r = compute_et0_series(s, ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.metadata["elevation_m"] == 300.0


def test_no_invented_values_for_missing_variable():
    # no wind_speed observation -> day rejected, never defaulted
    obs = [_obs("air_temperature", 20.0, "daily_mean"),
           _obs("relative_humidity", 50.0, "daily_mean"),
           _obs("solar_radiation", 15.0, "daily_sum")]
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.ok is False
    assert len(r.records) == 0
    assert any("u2" in reason for day in r.rejected for reason in day["reasons"])


# --- daily semantics -------------------------------------------------------

def test_valid_daily_records_multiple_days():
    obs = _full_day("2026-01-01") + _full_day("2026-01-02", t=22.0)
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.ok is True
    assert r.calculated_dates == ["2026-01-01", "2026-01-02"]


def test_instant_observation_not_used_as_daily():
    obs = [_obs("air_temperature", 20.0, "instant"), _obs("wind_speed", 2.0, "daily_mean"),
           _obs("relative_humidity", 50.0, "daily_mean"), _obs("solar_radiation", 15.0, "daily_sum")]
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert len(r.records) == 0


def test_missing_days_reported():
    obs = _full_day("2026-01-01") + _full_day("2026-01-03")
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.missing_dates == ["2026-01-02"]
    assert r.ok is False and r.partial is True


def test_incompatible_temporal_resolution_does_not_block_integration():
    # resolution is not used to aggregate; daily basis drives eligibility
    obs = _full_day("2026-01-01")
    r = compute_et0_series(_series(obs, resolution=None), ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.ok is True


def test_timezone_handling_preserves_date():
    # local date is preserved as written (no UTC shift): 2026-01-01T02:00:00+03:00 -> 2026-01-01
    obs = [_obs("air_temperature", 20.0, "daily_mean", "2026-01-01T02:00:00+03:00"),
           _obs("wind_speed", 2.0, "daily_mean", "2026-01-01T02:00:00+03:00"),
           _obs("relative_humidity", 50.0, "daily_mean", "2026-01-01T02:00:00+03:00"),
           _obs("solar_radiation", 15.0, "daily_sum", "2026-01-01T02:00:00+03:00")]
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.calculated_dates == ["2026-01-01"]


def test_date_not_shifted_to_utc():
    # 2026-01-02T01:00:00+03:00 is 2026-01-01T22:00:00Z; the local date 2026-01-02 is preserved
    obs = [_obs("air_temperature", 20.0, "daily_mean", "2026-01-02T01:00:00+03:00"),
           _obs("wind_speed", 2.0, "daily_mean", "2026-01-02T01:00:00+03:00"),
           _obs("relative_humidity", 50.0, "daily_mean", "2026-01-02T01:00:00+03:00"),
           _obs("solar_radiation", 15.0, "daily_sum", "2026-01-02T01:00:00+03:00")]
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.calculated_dates == ["2026-01-02"]


def test_derive_mean_from_minmax():
    obs = [_obs("min_air_temperature", 15.0, "daily_min"),
           _obs("max_air_temperature", 25.0, "daily_max"),
           _obs("wind_speed", 2.0, "daily_mean"),
           _obs("relative_humidity", 50.0, "daily_mean"),
           _obs("solar_radiation", 15.0, "daily_sum")]
    cfg = ET0IntegrationConfig(variable_mapping=_MAP, derive_mean_from_minmax=True)
    r = compute_et0_series(_series(obs), cfg)
    assert r.ok is True
    assert r.records[0]["inputs"]["t"] == 20.0  # (15+25)/2


# --- quality ---------------------------------------------------------------

def test_valid_quality_runs():
    r = compute_et0_series(_series(_full_day()), ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.ok is True


def test_unchecked_quality_warns_but_runs():
    obs = [_obs("air_temperature", 20.0, "daily_mean", quality="unchecked"),
           _obs("wind_speed", 2.0, "daily_mean", quality="unchecked"),
           _obs("relative_humidity", 50.0, "daily_mean", quality="unchecked"),
           _obs("solar_radiation", 15.0, "daily_sum", quality="unchecked")]
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.ok is True
    assert "QUALITY_UNCHECKED" in _warn_codes(r)


def test_suspect_quality_rejected_in_strict():
    obs = [_obs("air_temperature", 20.0, "daily_mean", quality="suspect"),
           _obs("wind_speed", 2.0, "daily_mean"),
           _obs("relative_humidity", 50.0, "daily_mean"),
           _obs("solar_radiation", 15.0, "daily_sum")]
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.ok is False
    assert len(r.records) == 0


def test_suspect_quality_allowed_under_policy():
    obs = [_obs("air_temperature", 20.0, "daily_mean", quality="suspect"),
           _obs("wind_speed", 2.0, "daily_mean"),
           _obs("relative_humidity", 50.0, "daily_mean"),
           _obs("solar_radiation", 15.0, "daily_sum")]
    cfg = ET0IntegrationConfig(variable_mapping=_MAP, quality_policy="allow_suspect")
    r = compute_et0_series(_series(obs), cfg)
    assert r.ok is True
    assert "SUSPECT_ACCEPTED" in _warn_codes(r)


def test_invalid_quality_rejected():
    obs = [_obs("air_temperature", 20.0, "daily_mean", quality="invalid"),
           _obs("wind_speed", 2.0, "daily_mean"),
           _obs("relative_humidity", 50.0, "daily_mean"),
           _obs("solar_radiation", 15.0, "daily_sum")]
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert len(r.records) == 0


def test_missing_value_quality_rejected():
    obs = [_obs("air_temperature", None, "daily_mean", quality="missing"),
           _obs("wind_speed", 2.0, "daily_mean"),
           _obs("relative_humidity", 50.0, "daily_mean"),
           _obs("solar_radiation", 15.0, "daily_sum")]
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert len(r.records) == 0


# --- calculation -----------------------------------------------------------

def test_matches_direct_model_call():
    obs = _full_day()
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP, elevation_m=100.0))
    ea = ea_from_relative_humidity(50.0, 20.0)
    direct = compute_fao56_et0({"rn": 15.0, "t": 20.0, "u2": 2.0, "ea": ea, "z": 100.0})
    assert math.isclose(r.records[0]["et0_mm_per_day"],
                        direct["result"]["et0_mm_per_day"], abs_tol=1e-9)


def test_multiple_daily_calculations():
    obs = _full_day("2026-01-01") + _full_day("2026-01-02", t=22.0) + _full_day("2026-01-03", t=18.0)
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert len(r.records) == 3
    # warmer day -> higher ET0 (all else equal)
    assert r.records[1]["et0_mm_per_day"] > r.records[2]["et0_mm_per_day"]


def test_known_et0_vector_consistency():
    # rn=15, t=20, u2=2, ea from rh=50 -> compare to direct model (vector of record)
    obs = _full_day()
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP, elevation_m=0.0))
    ea = ea_from_relative_humidity(50.0, 20.0)
    direct = compute_fao56_et0({"rn": 15.0, "t": 20.0, "u2": 2.0, "ea": ea, "z": 0.0})
    assert math.isclose(r.records[0]["et0_mm_per_day"],
                        direct["result"]["et0_mm_per_day"], abs_tol=1e-9)


def test_no_change_to_et0_model():
    # the ET0 definition is untouched
    from hydroma.fao56_et0 import FAO56_ET0_DEFINITION
    assert FAO56_ET0_DEFINITION["version"] == "1.0.0"
    assert "et0_mm_per_day" in [o["name"] for o in FAO56_ET0_DEFINITION["outputs"]]


# --- failure handling ------------------------------------------------------

def test_incomplete_climate_record():
    obs = [_obs("air_temperature", 20.0, "daily_mean"),
           _obs("wind_speed", 2.0, "daily_mean")]  # missing rh + rn
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.ok is False
    assert len(r.records) == 0


def test_invalid_input_reports_errors():
    r = compute_et0_series("not-a-series", ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.ok is False
    assert "INVALID_SERIES" in _codes(r)


def test_missing_metadata_no_crash():
    # series without spatial/resolution still processes (elevation defaulted)
    r = compute_et0_series(_series(_full_day(), resolution=None),
                           ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.ok is True
    assert "ELEVATION_DEFAULTED" in _warn_codes(r)


def test_incompatible_observation_day_rejected_not_crash():
    obs = [_obs("air_temperature", 20.0, "daily_mean"),
           _obs("wind_speed", 2.0, "daily_mean"),
           _obs("relative_humidity", 50.0, "daily_mean"),
           _obs("solar_radiation", 15.0, "daily_mean")]  # wrong basis for rn
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert len(r.records) == 0
    assert any("rn" in reason for day in r.rejected for reason in day["reasons"])


def test_partial_series_calculation():
    obs = _full_day("2026-01-01")
    # day 2 missing relative humidity -> rejected; day 1 calculated
    obs += [_obs("air_temperature", 22.0, "daily_mean", "2026-01-02"),
            _obs("wind_speed", 2.0, "daily_mean", "2026-01-02"),
            _obs("solar_radiation", 15.0, "daily_sum", "2026-01-02")]
    r = compute_et0_series(_series(obs), ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.partial is True
    assert r.calculated_dates == ["2026-01-01"]
    assert any(day["date"] == "2026-01-02" for day in r.rejected)


# --- provenance ------------------------------------------------------------

def test_climate_series_hash_in_provenance():
    from hydroma.climate import series_hash
    s = _series(_full_day())
    r = compute_et0_series(s, ET0IntegrationConfig(variable_mapping=_MAP))
    assert r.provenance["climate_series_hash"] == series_hash(s)


def test_provenance_model_and_mapping():
    r = compute_et0_series(_series(_full_day()), ET0IntegrationConfig(variable_mapping=_MAP))
    prov = r.provenance
    assert prov["model_id"] == "eco-nojin.hydroma.fao56-et0"
    assert prov["model_version"] == "1.0.0"
    assert prov["variable_mapping"] == _MAP
    assert prov["results_hash"]


def test_deterministic_results():
    s = _series(_full_day())
    cfg = ET0IntegrationConfig(variable_mapping=_MAP)
    r1 = compute_et0_series(s, cfg)
    r2 = compute_et0_series(s, cfg)
    assert r1.records == r2.records
    assert r1.provenance["results_hash"] == r2.provenance["results_hash"]


def test_source_data_not_altered():
    obs = _full_day()
    s = _series(obs)
    before = [o.to_dict() for o in s.observations]
    compute_et0_series(s, ET0IntegrationConfig(variable_mapping=_MAP))
    after = [o.to_dict() for o in s.observations]
    assert before == after


def test_result_to_dict_serializable():
    import json
    r = compute_et0_series(_series(_full_day()), ET0IntegrationConfig(variable_mapping=_MAP))
    assert json.loads(json.dumps(r.to_dict())) == r.to_dict()


# --- vapour pressure helpers ----------------------------------------------

def test_es_and_ea_helpers():
    # es(20) ~ 2.338 kPa (FAO-56)
    assert math.isclose(es_kpa(20.0), 2.338, abs_tol=0.001)
    # ea at RH=50%, T=20 -> ~1.169 kPa
    assert math.isclose(ea_from_relative_humidity(50.0, 20.0), 1.169, abs_tol=0.001)


def test_default_mapping_has_no_rn():
    assert DEFAULT_VARIABLE_MAPPING["rn"] is None
    assert DEFAULT_VARIABLE_MAPPING["t"] == "air_temperature"


# --- regression ------------------------------------------------------------

def test_existing_et0_tests_contract():
    from hydroma.fao56_et0 import FAO56_ET0_DEFINITION
    from hydroma.registry import validate_definition
    validate_definition(FAO56_ET0_DEFINITION)


def test_existing_climate_tests_contract():
    from hydroma.climate import validate_series
    s = ClimateSeries([ClimateObservation("air_temperature", 20.0, "degC",
                                          "2026-01-01T00:00:00Z", "instant", "valid")],
                      variable="air_temperature")
    assert validate_series(s)["valid"] is True