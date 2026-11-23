"""Climate-driven irrigation + crop-water + soil-water integration tests (Phase 3.2).

Software/integration checks only — NOT scientific validation.
"""

import json
import math

import pytest

from hydroma.climate import ClimateObservation, ClimateSeries, series_hash
from hydroma.climate_et0 import ET0IntegrationConfig
from hydroma.irrigation import compute_irrigation_schedule
from hydroma.irrigation_series import (
    IRRIGATION_INTEGRATION_ID,
    IrrigationSeriesConfig,
    simulate_climate_irrigation,
    validate_irrigation_series_config,
)

_MAP = {"t": "air_temperature", "u2": "wind_speed", "ea": "relative_humidity",
        "rn": "solar_radiation"}
_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]  # FC=90, WP=30, TAW=60
_UNITS = {"air_temperature": "degC", "wind_speed": "m/s", "relative_humidity": "%",
          "solar_radiation": "MJ/m2/day", "precipitation": "mm"}


def _obs(var, value, basis, day, quality="valid", unit=None):
    return ClimateObservation(var, value, unit or _UNITS[var], day, basis, quality)


def _day(day, t=20.0, precip=0.0, u2=2.0, rh=50.0, rs=15.0, precip_quality="valid",
         precip_unit=None, precip_basis="daily_sum"):
    return [
        _obs("air_temperature", t, "daily_mean", day),
        _obs("wind_speed", u2, "daily_mean", day),
        _obs("relative_humidity", rh, "daily_mean", day),
        _obs("solar_radiation", rs, "daily_sum", day),
        _obs("precipitation", precip, precip_basis, day, precip_quality, precip_unit),
    ]


def _config(**kw):
    base = dict(layers=_LAYERS, initial_storage_mm=60.0, p=0.5, kc=0.8,
                et0_config=ET0IntegrationConfig(variable_mapping=_MAP, elevation_m=100.0))
    base.update(kw)
    return IrrigationSeriesConfig(**base)


def _series(observations):
    return ClimateSeries(observations, variable=None, temporal_resolution="1d")


def _codes(result):
    return {e["code"] for e in result.errors}


def _warn_codes(result):
    return {w["code"] for w in result.warnings}


# --- irrigation integration ------------------------------------------------

def test_default_policy_none_applies_no_irrigation():
    # day 2 is dry enough to trigger a recommendation, but default policy applies nothing
    obs = _day("2026-01-01") + _day("2026-01-02", t=24.0) + _day("2026-01-03", t=28.0)
    r = simulate_climate_irrigation(_series(obs), _config())
    assert r.ok is True
    assert all(rec["irrigation_applied_mm"] == 0.0 for rec in r.records)
    # recommendation still reported (never silently applied)
    assert any(rec["irrigation_recommended"] for rec in r.records)


def test_schedule_to_target_applies_net_irrigation():
    obs = _day("2026-01-01") + _day("2026-01-02", t=24.0) + _day("2026-01-03", t=28.0)
    cfg = _config(irrigation_policy="schedule_to_target", application_efficiency=0.8)
    r = simulate_climate_irrigation(_series(obs), cfg)
    assert r.ok is True
    for rec in r.records:
        if rec["irrigation_recommended"]:
            assert rec["irrigation_applied_mm"] == rec["net_irrigation_mm"]
        else:
            assert rec["irrigation_applied_mm"] == 0.0


def test_gross_irrigation_is_net_over_efficiency():
    obs = _day("2026-01-01") + _day("2026-01-02", t=24.0)
    cfg = _config(irrigation_policy="schedule_to_target", application_efficiency=0.8)
    r = simulate_climate_irrigation(_series(obs), cfg)
    for rec in r.records:
        if rec["irrigation_applied_mm"] > 0:
            assert math.isclose(rec["irrigation_gross_applied_mm"],
                                rec["irrigation_applied_mm"] / 0.8, abs_tol=1e-6)


def test_explicit_policy_applies_fixed_amount():
    obs = _day("2026-01-01") + _day("2026-01-02", t=24.0)
    cfg = _config(irrigation_policy="explicit", explicit_irrigation_mm=10.0)
    r = simulate_climate_irrigation(_series(obs), cfg)
    assert r.ok is True
    assert all(math.isclose(rec["irrigation_applied_mm"], 10.0) for rec in r.records)


def test_max_irrigation_cap():
    obs = _day("2026-01-01") + _day("2026-01-02", t=24.0) + _day("2026-01-03", t=28.0)
    cfg = _config(irrigation_policy="schedule_to_target", max_irrigation_mm=3.0,
                  application_efficiency=1.0)
    r = simulate_climate_irrigation(_series(obs), cfg)
    assert all(rec["irrigation_applied_mm"] <= 3.0 + 1e-9 for rec in r.records)


def test_irrigation_recommendation_matches_model():
    # cross-check the reported recommendation against a direct irrigation call
    obs = _day("2026-01-01") + _day("2026-01-02", t=24.0)
    r = simulate_climate_irrigation(_series(obs), _config(irrigation_policy="schedule_to_target",
                                                         application_efficiency=0.8))
    rec = r.records[1]
    dr = 90.0 - rec["initial_storage_mm"]
    direct = compute_irrigation_schedule({"layers": _LAYERS, "p": 0.5, "depletion_mm": dr,
                                          "application_efficiency": 0.8})
    assert math.isclose(rec["net_irrigation_mm"], direct["result"]["net_irrigation_mm"], abs_tol=1e-3)
    assert math.isclose(rec["gross_irrigation_mm"], direct["result"]["gross_irrigation_mm"], abs_tol=1e-3)


def test_recommendation_not_application_under_none():
    obs = _day("2026-01-01") + _day("2026-01-02", t=24.0)
    r = simulate_climate_irrigation(_series(obs), _config(irrigation_policy="none"))
    # at least one recommendation, but zero applied
    assert any(rec["irrigation_recommended"] for rec in r.records)
    assert all(rec["irrigation_applied_mm"] == 0.0 for rec in r.records)


# --- state coupling --------------------------------------------------------

def test_state_propagation():
    obs = _day("2026-01-01") + _day("2026-01-02", t=24.0)
    r = simulate_climate_irrigation(_series(obs), _config(irrigation_policy="explicit",
                                                          explicit_irrigation_mm=5.0))
    for a, b in zip(r.records, r.records[1:]):
        assert math.isclose(b["initial_storage_mm"], a["final_storage_mm"], abs_tol=1e-9)


def test_irrigation_applied_once_water_balance():
    obs = _day("2026-01-01", precip=2.0) + _day("2026-01-02", t=24.0, precip=0.0)
    r = simulate_climate_irrigation(_series(obs), _config(irrigation_policy="schedule_to_target",
                                                         application_efficiency=0.9))
    for rec in r.records:
        expected = (rec["initial_storage_mm"] + rec["precipitation_mm"]
                    + rec["irrigation_applied_mm"] - rec["runoff_mm"]
                    - rec["excess_mm"] - rec["etc_adjusted_mm_per_day"])
        assert math.isclose(rec["final_storage_mm"], expected, abs_tol=1e-6)


def test_no_duplicate_irrigation_application():
    # applied net irrigation appears exactly once in the balance (checked above);
    # also the applied amount never exceeds the recommendation in schedule mode
    obs = _day("2026-01-01") + _day("2026-01-02", t=24.0)
    r = simulate_climate_irrigation(_series(obs), _config(irrigation_policy="schedule_to_target"))
    for rec in r.records:
        assert rec["irrigation_applied_mm"] <= rec["net_irrigation_mm"] + 1e-9


# --- climate ---------------------------------------------------------------

def test_precipitation_mapping():
    r = simulate_climate_irrigation(_series(_day("2026-01-01", precip=7.0)),
                                    _config(irrigation_policy="none"))
    assert r.records[0]["precipitation_mm"] == 7.0


def test_missing_precipitation_not_zero():
    obs = [o for o in _day("2026-01-01") if o.variable != "precipitation"]
    obs.append(_obs("precipitation", None, "daily_sum", "2026-01-01", quality="missing"))
    r = simulate_climate_irrigation(_series(obs), _config())
    assert r.ok is False
    assert len(r.records) == 0


def test_incompatible_precipitation_unit():
    r = simulate_climate_irrigation(_series(_day("2026-01-01", precip_unit="cm")), _config())
    assert len(r.records) == 0


def test_missing_et0_breaks_continuity():
    obs = [o for o in _day("2026-01-01") if o.variable != "solar_radiation"]
    r = simulate_climate_irrigation(_series(obs), _config())
    assert r.ok is False
    assert len(r.records) == 0


def test_quality_strict_rejects_suspect():
    obs = [o for o in _day("2026-01-01") if o.variable != "precipitation"]
    obs.append(_obs("precipitation", 5.0, "daily_sum", "2026-01-01", quality="suspect"))
    r = simulate_climate_irrigation(_series(obs), _config(quality_policy="strict"))
    assert len(r.records) == 0


def test_quality_allow_suspect():
    obs = [o for o in _day("2026-01-01") if o.variable != "precipitation"]
    obs.append(_obs("precipitation", 5.0, "daily_sum", "2026-01-01", quality="suspect"))
    r = simulate_climate_irrigation(_series(obs), _config(quality_policy="allow_suspect"))
    assert r.ok is True
    assert "SUSPECT_ACCEPTED" in _warn_codes(r)


# --- continuity ------------------------------------------------------------

def test_missing_day_breaks_continuity():
    obs = _day("2026-01-01") + _day("2026-01-03")
    r = simulate_climate_irrigation(_series(obs), _config())
    assert r.ok is False and r.partial is True
    assert r.calculated_dates == ["2026-01-01"]
    assert "2026-01-02" in r.missing_dates


def test_interrupted_state_not_recovered():
    obs = _day("2026-01-01")
    obs += [o for o in _day("2026-01-03") if o.variable != "precipitation"]
    r = simulate_climate_irrigation(_series(obs), _config(irrigation_policy="none"))
    assert len(r.records) == 1
    assert r.simulation_end == "2026-01-01"


def test_partial_result():
    obs = _day("2026-01-01") + _day("2026-01-03")
    r = simulate_climate_irrigation(_series(obs), _config())
    assert r.partial is True and r.ok is False


# --- config validation -----------------------------------------------------

def test_invalid_initial_state():
    r = simulate_climate_irrigation(_series(_day("2026-01-01")), _config(initial_storage_mm=-1.0))
    assert r.ok is False
    assert "INVALID_INITIAL" in _codes(r)


def test_invalid_layers():
    r = simulate_climate_irrigation(_series(_day("2026-01-01")), _config(layers=[]))
    assert r.ok is False
    assert "INVALID_LAYERS" in _codes(r)


def test_invalid_policy():
    r = simulate_climate_irrigation(_series(_day("2026-01-01")), _config(irrigation_policy="auto"))
    assert r.ok is False
    assert "INVALID_IRRIGATION_POLICY" in _codes(r)


def test_invalid_efficiency():
    r = simulate_climate_irrigation(_series(_day("2026-01-01")),
                                    _config(application_efficiency=1.5))
    assert r.ok is False
    assert "INVALID_EFFICIENCY" in _codes(r)


def test_invalid_p():
    r = simulate_climate_irrigation(_series(_day("2026-01-01")), _config(p=0.0))
    assert r.ok is False
    assert "INVALID_P" in _codes(r)


def test_invalid_kc():
    r = simulate_climate_irrigation(_series(_day("2026-01-01")), _config(kc=-1.0))
    assert r.ok is False
    assert "INVALID_KC" in _codes(r)


def test_kc_length_mismatch():
    obs = _day("2026-01-01") + _day("2026-01-02")
    r = simulate_climate_irrigation(_series(obs), _config(kc=[0.8]))
    assert r.ok is False
    assert "KC_LENGTH_MISMATCH" in _codes(r)


def test_validate_config_ok():
    assert validate_irrigation_series_config(_config())["valid"] is True


# --- results ---------------------------------------------------------------

def test_result_json_serializable():
    r = simulate_climate_irrigation(_series(_day("2026-01-01")), _config())
    assert json.loads(json.dumps(r.to_dict())) == r.to_dict()


def test_deterministic_result_and_provenance():
    obs = _day("2026-01-01") + _day("2026-01-02", t=24.0)
    r1 = simulate_climate_irrigation(_series(obs), _config(irrigation_policy="schedule_to_target"))
    r2 = simulate_climate_irrigation(_series(obs), _config(irrigation_policy="schedule_to_target"))
    assert r1.records == r2.records
    assert r1.provenance["results_hash"] == r2.provenance["results_hash"]


def test_provenance_contents():
    r = simulate_climate_irrigation(_series(_day("2026-01-01")), _config())
    prov = r.provenance
    assert prov["integration_id"] == IRRIGATION_INTEGRATION_ID
    assert prov["et0_model_id"] == "eco-nojin.hydroma.fao56-et0"
    assert prov["crop_model_id"] == "eco-nojin.hydroma.fao56-crop-water"
    assert prov["soil_model_id"] == "eco-nojin.hydroma.daily-soil-water"
    assert prov["irrigation_model_id"] == "eco-nojin.hydroma.irrigation-schedule"
    assert prov["irrigation_config"]["irrigation_policy"] == "none"
    assert prov["results_hash"]


def test_climate_series_hash_in_provenance():
    s = _series(_day("2026-01-01"))
    r = simulate_climate_irrigation(s, _config())
    assert r.provenance["climate_series_hash"] == series_hash(s)


def test_simulation_bounds():
    obs = _day("2026-01-01") + _day("2026-01-02")
    r = simulate_climate_irrigation(_series(obs), _config())
    assert r.simulation_start == "2026-01-01"
    assert r.simulation_end == "2026-01-02"


def test_source_data_not_altered():
    s = _series(_day("2026-01-01"))
    before = [o.to_dict() for o in s.observations]
    simulate_climate_irrigation(s, _config())
    assert [o.to_dict() for o in s.observations] == before


def test_start_end_restrict_range():
    obs = _day("2026-01-01") + _day("2026-01-02") + _day("2026-01-03")
    r = simulate_climate_irrigation(_series(obs),
                                    _config(start_date="2026-01-02", end_date="2026-01-02"))
    assert r.calculated_dates == ["2026-01-02"]


# --- regression ------------------------------------------------------------

def test_existing_irrigation_contract():
    from hydroma.registry import validate_definition
    from hydroma.irrigation import IRRIGATION_DEFINITION
    validate_definition(IRRIGATION_DEFINITION)


def test_existing_crop_water_contract():
    from hydroma.registry import validate_definition
    from hydroma.crop_water import FAO56_CROP_WATER_DEFINITION
    validate_definition(FAO56_CROP_WATER_DEFINITION)