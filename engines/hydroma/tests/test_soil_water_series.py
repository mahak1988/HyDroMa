"""Climate-driven soil-water simulation integration tests (Phase 3.0).

Software/integration checks only — NOT scientific validation.
"""

import json
import math

import pytest

from hydroma.climate import ClimateObservation, ClimateSeries, series_hash
from hydroma.climate_et0 import ET0IntegrationConfig
from hydroma.soil_water_series import (
    INTEGRATION_ID,
    SoilWaterSeriesConfig,
    simulate_climate_soil_water,
    validate_soil_water_series_config,
)

_MAP = {"t": "air_temperature", "u2": "wind_speed", "ea": "relative_humidity",
        "rn": "solar_radiation"}
_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]
_UNITS = {"air_temperature": "degC", "wind_speed": "m/s", "relative_humidity": "%",
          "solar_radiation": "MJ/m2/day", "precipitation": "mm"}


def _obs(var, value, basis, day, quality="valid", unit=None):
    return ClimateObservation(var, value, unit or _UNITS[var], day, basis, quality)


def _day(day, t=20.0, precip=5.0, u2=2.0, rh=50.0, rs=15.0, precip_quality="valid",
         precip_unit=None, precip_basis="daily_sum"):
    return [
        _obs("air_temperature", t, "daily_mean", day),
        _obs("wind_speed", u2, "daily_mean", day),
        _obs("relative_humidity", rh, "daily_mean", day),
        _obs("solar_radiation", rs, "daily_sum", day),
        _obs("precipitation", precip, precip_basis, day, precip_quality, precip_unit),
    ]


def _config(**kw):
    base = dict(layers=_LAYERS, initial_storage_mm=60.0, p=0.5,
                et0_config=ET0IntegrationConfig(variable_mapping=_MAP, elevation_m=100.0))
    base.update(kw)
    return SoilWaterSeriesConfig(**base)


def _series(observations):
    return ClimateSeries(observations, variable=None, temporal_resolution="1d")


def _codes(result):
    return {e["code"] for e in result.errors}


def _warn_codes(result):
    return {w["code"] for w in result.warnings}


# --- climate input: precipitation -----------------------------------------

def test_valid_single_day():
    r = simulate_climate_soil_water(_series(_day("2026-01-01")), _config())
    assert r.ok is True
    assert len(r.records) == 1
    assert r.records[0]["precipitation_mm"] == 5.0
    assert r.records[0]["et0_mm_per_day"] > 0


def test_valid_multi_day_state_propagation():
    obs = _day("2026-01-01") + _day("2026-01-02", t=22.0)
    r = simulate_climate_soil_water(_series(obs), _config())
    assert r.ok is True
    assert r.calculated_dates == ["2026-01-01", "2026-01-02"]
    # state propagates: day 2 initial storage == day 1 final storage
    assert math.isclose(r.records[1]["initial_storage_mm"], r.records[0]["final_storage_mm"],
                        abs_tol=1e-9)


def test_missing_precipitation_value_is_not_zero():
    obs = _day("2026-01-01")
    # replace precipitation with a missing-value record
    obs = [o for o in obs if o.variable != "precipitation"]
    obs.append(_obs("precipitation", None, "daily_sum", "2026-01-01", quality="missing"))
    r = simulate_climate_soil_water(_series(obs), _config())
    assert r.ok is False
    assert len(r.records) == 0
    assert any("precipitation" in reason for day in r.rejected for reason in day["reasons"])


def test_missing_precipitation_date_breaks_continuity():
    obs = _day("2026-01-01") + _day("2026-01-03")
    # day 2 has no observations at all -> calendar gap
    r = simulate_climate_soil_water(_series(obs), _config())
    assert r.ok is False and r.partial is True
    assert r.calculated_dates == ["2026-01-01"]
    assert "2026-01-02" in r.missing_dates


def test_incompatible_precipitation_unit_rejected():
    obs = _day("2026-01-01", precip_unit="cm")
    r = simulate_climate_soil_water(_series(obs), _config())
    assert r.ok is False
    assert len(r.records) == 0


def test_incompatible_precipitation_basis_rejected():
    obs = _day("2026-01-01", precip_basis="instant")
    r = simulate_climate_soil_water(_series(obs), _config())
    assert len(r.records) == 0
    assert any("precipitation" in reason for day in r.rejected for reason in day["reasons"])


def test_missing_precipitation_variable():
    obs = [o for o in _day("2026-01-01") if o.variable != "precipitation"]
    r = simulate_climate_soil_water(_series(obs), _config())
    assert r.ok is False
    assert any("missing_precipitation" in reason for day in r.rejected for reason in day["reasons"])


# --- ET0 integration -------------------------------------------------------

def test_missing_et0_breaks_continuity():
    # no radiation -> ET0 cannot be computed -> day rejected
    obs = [o for o in _day("2026-01-01") if o.variable != "solar_radiation"]
    r = simulate_climate_soil_water(_series(obs), _config())
    assert r.ok is False
    assert len(r.records) == 0


def test_et0_configuration_failure_reported():
    # unmapped rn -> ET0 config error propagates
    cfg = _config(et0_config=ET0IntegrationConfig(
        variable_mapping={"t": "air_temperature", "u2": "wind_speed",
                          "ea": "relative_humidity", "rn": None}))
    r = simulate_climate_soil_water(_series(_day("2026-01-01")), cfg)
    assert r.ok is False
    assert "MISSING_RN_MAPPING" in _codes(r)


def test_et0_date_mismatch_not_aligned():
    # ET0 variables on day 1, precipitation only on day 2 -> no common complete day
    obs = ([o for o in _day("2026-01-01") if o.variable != "precipitation"]
           + [o for o in _day("2026-01-02") if o.variable == "precipitation"])
    r = simulate_climate_soil_water(_series(obs), _config())
    assert len(r.records) == 0


# --- date alignment --------------------------------------------------------

def test_alignment_requires_same_day():
    # precip and ET0 both on day 1 -> aligned
    r = simulate_climate_soil_water(_series(_day("2026-01-01")), _config())
    assert r.records[0]["date"] == "2026-01-01"
    assert r.records[0]["precipitation_mm"] == 5.0


def test_timezone_local_date_preserved():
    day = "2026-01-01T02:00:00+03:00"
    obs = _day(day)
    r = simulate_climate_soil_water(_series(obs), _config())
    assert r.calculated_dates == ["2026-01-01"]


def test_rejected_observations_reported():
    obs = _day("2026-01-01")
    obs = [o for o in obs if o.variable != "wind_speed"]
    obs.append(_obs("wind_speed", 2.0, "instant", "2026-01-01"))  # wrong basis
    r = simulate_climate_soil_water(_series(obs), _config())
    assert len(r.records) == 0


# --- soil water model ------------------------------------------------------

def test_invalid_initial_state():
    r = simulate_climate_soil_water(_series(_day("2026-01-01")),
                                    _config(initial_storage_mm=-1.0))
    assert r.ok is False
    assert "INVALID_INITIAL" in _codes(r)


def test_missing_initial_state():
    r = simulate_climate_soil_water(_series(_day("2026-01-01")),
                                    _config(initial_storage_mm=None))
    assert r.ok is False
    assert "INVALID_INITIAL" in _codes(r)


def test_invalid_layers():
    r = simulate_climate_soil_water(_series(_day("2026-01-01")),
                                    _config(layers=[]))
    assert r.ok is False
    assert "INVALID_LAYERS" in _codes(r)


def test_invalid_p():
    r = simulate_climate_soil_water(_series(_day("2026-01-01")), _config(p=1.5))
    assert r.ok is False
    assert "INVALID_P" in _codes(r)


def test_water_balance_outputs_preserved():
    r = simulate_climate_soil_water(_series(_day("2026-01-01")), _config())
    rec = r.records[0]
    # model outputs preserved
    assert "final_storage_mm" in rec
    assert "depletion_mm" in rec
    assert "excess_mm" in rec
    assert "taw_mm" in rec
    # TAW = (0.30-0.10)*300 = 60
    assert math.isclose(rec["taw_mm"], 60.0, abs_tol=1e-9)


def test_state_continuity_multiple_days():
    obs = _day("2026-01-01") + _day("2026-01-02") + _day("2026-01-03")
    r = simulate_climate_soil_water(_series(obs), _config())
    assert r.ok is True
    for a, b in zip(r.records, r.records[1:]):
        assert math.isclose(b["initial_storage_mm"], a["final_storage_mm"], abs_tol=1e-9)


# --- quality ---------------------------------------------------------------

def test_suspect_strict_rejected():
    obs = _day("2026-01-01")
    obs = [o for o in obs if o.variable != "precipitation"]
    obs.append(_obs("precipitation", 5.0, "daily_sum", "2026-01-01", quality="suspect"))
    r = simulate_climate_soil_water(_series(obs), _config(quality_policy="strict"))
    assert len(r.records) == 0


def test_suspect_allow_policy():
    obs = _day("2026-01-01")
    obs = [o for o in obs if o.variable != "precipitation"]
    obs.append(_obs("precipitation", 5.0, "daily_sum", "2026-01-01", quality="suspect"))
    r = simulate_climate_soil_water(_series(obs), _config(quality_policy="allow_suspect"))
    assert r.ok is True
    assert "SUSPECT_ACCEPTED" in _warn_codes(r)


def test_invalid_quality_rejected():
    obs = _day("2026-01-01")
    obs = [o for o in obs if o.variable != "precipitation"]
    obs.append(_obs("precipitation", 5.0, "daily_sum", "2026-01-01", quality="invalid"))
    r = simulate_climate_soil_water(_series(obs), _config())
    assert len(r.records) == 0


def test_unchecked_quality_warns():
    obs = _day("2026-01-01")
    obs = [o for o in obs if o.variable != "precipitation"]
    obs.append(_obs("precipitation", 5.0, "daily_sum", "2026-01-01", quality="unchecked"))
    r = simulate_climate_soil_water(_series(obs), _config())
    assert r.ok is True
    assert "QUALITY_UNCHECKED" in _warn_codes(r)


# --- results ---------------------------------------------------------------

def test_result_json_serializable():
    r = simulate_climate_soil_water(_series(_day("2026-01-01")), _config())
    assert json.loads(json.dumps(r.to_dict())) == r.to_dict()


def test_partial_result():
    obs = _day("2026-01-01") + _day("2026-01-03")
    r = simulate_climate_soil_water(_series(obs), _config())
    assert r.partial is True
    assert r.ok is False


def test_failed_result():
    r = simulate_climate_soil_water(_series([]), _config())
    assert r.ok is False
    assert r.records == []


def test_missing_and_rejected_dates_reported():
    obs = _day("2026-01-01") + _day("2026-01-03")
    r = simulate_climate_soil_water(_series(obs), _config())
    assert "2026-01-02" in r.missing_dates
    assert any(day["date"] == "2026-01-02" for day in r.rejected)


def test_simulation_bounds():
    obs = _day("2026-01-01") + _day("2026-01-02")
    r = simulate_climate_soil_water(_series(obs), _config())
    assert r.simulation_start == "2026-01-01"
    assert r.simulation_end == "2026-01-02"


def test_deterministic_result():
    obs = _day("2026-01-01") + _day("2026-01-02", t=22.0)
    r1 = simulate_climate_soil_water(_series(obs), _config())
    r2 = simulate_climate_soil_water(_series(obs), _config())
    assert r1.records == r2.records
    assert r1.provenance["results_hash"] == r2.provenance["results_hash"]


def test_deterministic_provenance():
    obs = _day("2026-01-01")
    r = simulate_climate_soil_water(_series(obs), _config())
    assert r.provenance["climate_series_hash"] == series_hash(_series(obs))


# --- provenance ------------------------------------------------------------

def test_provenance_contents():
    r = simulate_climate_soil_water(_series(_day("2026-01-01")), _config())
    prov = r.provenance
    assert prov["integration_id"] == INTEGRATION_ID
    assert prov["et0_model_id"] == "eco-nojin.hydroma.fao56-et0"
    assert prov["soil_model_id"] == "eco-nojin.hydroma.daily-soil-water"
    assert prov["soil_config"]["initial_storage_mm"] == 60.0
    assert prov["results_hash"]


def test_source_data_not_altered():
    obs = _day("2026-01-01")
    s = _series(obs)
    before = [o.to_dict() for o in s.observations]
    simulate_climate_soil_water(s, _config())
    after = [o.to_dict() for o in s.observations]
    assert before == after


# --- config validation -----------------------------------------------------

def test_validate_config_ok():
    assert validate_soil_water_series_config(_config())["valid"] is True


def test_validate_config_invalid_date_range():
    res = validate_soil_water_series_config(_config(start_date="2026-02-01", end_date="2026-01-01"))
    assert res["valid"] is False
    assert "INVALID_DATE_RANGE" in {e["code"] for e in res["errors"]}


def test_start_end_restrict_range():
    obs = _day("2026-01-01") + _day("2026-01-02") + _day("2026-01-03")
    r = simulate_climate_soil_water(_series(obs), _config(start_date="2026-01-02", end_date="2026-01-02"))
    assert r.calculated_dates == ["2026-01-02"]


# --- regression ------------------------------------------------------------

def test_existing_daily_soil_water_contract():
    from hydroma.daily_soil_water import DAILY_SOIL_WATER_DEFINITION
    from hydroma.registry import validate_definition
    validate_definition(DAILY_SOIL_WATER_DEFINITION)


def test_existing_et0_contract():
    from hydroma.fao56_et0 import FAO56_ET0_DEFINITION
    from hydroma.registry import validate_definition
    validate_definition(FAO56_ET0_DEFINITION)


def test_existing_climate_contract():
    from hydroma.climate import validate_series
    s = ClimateSeries([ClimateObservation("air_temperature", 20.0, "degC",
                                          "2026-01-01T00:00:00Z", "instant", "valid")],
                      variable="air_temperature")
    assert validate_series(s)["valid"] is True