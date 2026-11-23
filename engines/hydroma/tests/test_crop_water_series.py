"""Climate-driven crop-water simulation integration tests (Phase 3.1).

Software/integration checks only — NOT scientific validation.
"""

import json
import math

import pytest

from hydroma.climate import ClimateObservation, ClimateSeries, series_hash
from hydroma.climate_et0 import ET0IntegrationConfig
from hydroma.crop_water import compute_crop_water
from hydroma.crop_water_series import (
    CROP_INTEGRATION_ID,
    CropWaterSeriesConfig,
    simulate_climate_crop_water,
    validate_crop_water_series_config,
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
    return CropWaterSeriesConfig(**base)


def _series(observations):
    return ClimateSeries(observations, variable=None, temporal_resolution="1d")


def _codes(result):
    return {e["code"] for e in result.errors}


def _warn_codes(result):
    return {w["code"] for w in result.warnings}


# --- model coupling --------------------------------------------------------

def test_valid_single_day():
    r = simulate_climate_crop_water(_series(_day("2026-01-01")), _config())
    assert r.ok is True
    assert len(r.records) == 1
    rec = r.records[0]
    assert rec["etc_potential_mm_per_day"] > 0
    assert 0.0 <= rec["ks"] <= 1.0
    assert rec["etc_adjusted_mm_per_day"] <= rec["etc_potential_mm_per_day"] + 1e-9


def test_crop_and_soil_models_invoked():
    # ETc_potential = Kc*ET0 and Ks from crop model; state from soil model
    r = simulate_climate_crop_water(_series(_day("2026-01-01")), _config())
    rec = r.records[0]
    expected_pot = 0.8 * rec["et0_mm_per_day"]
    assert math.isclose(rec["etc_potential_mm_per_day"], expected_pot, abs_tol=1e-3)
    assert math.isclose(rec["etc_adjusted_mm_per_day"], rec["ks"] * expected_pot, abs_tol=1e-3)


def test_correct_daily_state_handoff():
    obs = _day("2026-01-01") + _day("2026-01-02", t=24.0)
    r = simulate_climate_crop_water(_series(obs), _config())
    assert r.ok is True
    assert math.isclose(r.records[1]["initial_storage_mm"], r.records[0]["final_storage_mm"],
                        abs_tol=1e-9)


def test_stress_factor_reflects_evolving_state():
    obs = _day("2026-01-01") + _day("2026-01-02", t=24.0) + _day("2026-01-03", t=28.0)
    r = simulate_climate_crop_water(_series(obs), _config())
    ks = [rec["ks"] for rec in r.records]
    # soil dries -> depletion grows -> Ks non-increasing
    assert ks[0] >= ks[1] >= ks[2]
    assert ks[0] == 1.0  # day 1: Dr = 90-60 = 30 = RAW -> Ks = 1


def test_adjusted_et_matches_crop_model():
    # cross-check day 2 against a direct crop_water call using start-of-day storage
    obs = _day("2026-01-01") + _day("2026-01-02", t=24.0)
    r = simulate_climate_crop_water(_series(obs), _config())
    dr2 = 90.0 - r.records[0]["final_storage_mm"]
    direct = compute_crop_water({"et0_mm_per_day": r.records[1]["et0_mm_per_day"], "kc": 0.8,
                                 "p": 0.5, "taw_mm": 60.0, "depletion_mm": dr2})
    assert math.isclose(r.records[1]["ks"], direct["result"]["ks"], abs_tol=1e-3)
    assert math.isclose(r.records[1]["etc_adjusted_mm_per_day"],
                        direct["result"]["etc_adjusted_mm_per_day"], abs_tol=1e-3)


def test_no_duplicate_water_accounting():
    # final = initial + precip - irrigation - runoff - excess - ET (no double counting)
    obs = _day("2026-01-01", precip=5.0) + _day("2026-01-02", precip=0.0, t=24.0)
    r = simulate_climate_crop_water(_series(obs), _config())
    for rec in r.records:
        expected = (rec["initial_storage_mm"] + rec["precipitation_mm"]
                    - rec["irrigation_mm"] - rec["excess_mm"]
                    - rec["etc_adjusted_mm_per_day"])
        assert math.isclose(rec["final_storage_mm"], expected, abs_tol=1e-6)


# --- climate ---------------------------------------------------------------

def test_precipitation_mapping():
    r = simulate_climate_crop_water(_series(_day("2026-01-01", precip=12.0)), _config())
    assert r.records[0]["precipitation_mm"] == 12.0


def test_missing_precipitation_value_not_zero():
    obs = [o for o in _day("2026-01-01") if o.variable != "precipitation"]
    obs.append(_obs("precipitation", None, "daily_sum", "2026-01-01", quality="missing"))
    r = simulate_climate_crop_water(_series(obs), _config())
    assert r.ok is False
    assert len(r.records) == 0


def test_incompatible_precipitation_unit():
    r = simulate_climate_crop_water(_series(_day("2026-01-01", precip_unit="cm")), _config())
    assert len(r.records) == 0


def test_incompatible_precipitation_basis():
    r = simulate_climate_crop_water(_series(_day("2026-01-01", precip_basis="instant")), _config())
    assert len(r.records) == 0


def test_missing_et0_breaks_continuity():
    obs = [o for o in _day("2026-01-01") if o.variable != "solar_radiation"]
    r = simulate_climate_crop_water(_series(obs), _config())
    assert r.ok is False
    assert len(r.records) == 0


def test_et0_date_mismatch():
    obs = ([o for o in _day("2026-01-01") if o.variable != "precipitation"]
           + [o for o in _day("2026-01-02") if o.variable == "precipitation"])
    r = simulate_climate_crop_water(_series(obs), _config())
    assert len(r.records) == 0


def test_quality_strict_rejects_suspect():
    obs = [o for o in _day("2026-01-01") if o.variable != "precipitation"]
    obs.append(_obs("precipitation", 5.0, "daily_sum", "2026-01-01", quality="suspect"))
    r = simulate_climate_crop_water(_series(obs), _config(quality_policy="strict"))
    assert len(r.records) == 0


def test_quality_allow_suspect():
    obs = [o for o in _day("2026-01-01") if o.variable != "precipitation"]
    obs.append(_obs("precipitation", 5.0, "daily_sum", "2026-01-01", quality="suspect"))
    r = simulate_climate_crop_water(_series(obs), _config(quality_policy="allow_suspect"))
    assert r.ok is True
    assert "SUSPECT_ACCEPTED" in _warn_codes(r)


# --- soil state ------------------------------------------------------------

def test_invalid_initial_state():
    r = simulate_climate_crop_water(_series(_day("2026-01-01")),
                                    _config(initial_storage_mm=-1.0))
    assert r.ok is False
    assert "INVALID_INITIAL" in _codes(r)


def test_invalid_layers():
    r = simulate_climate_crop_water(_series(_day("2026-01-01")), _config(layers=[]))
    assert r.ok is False
    assert "INVALID_LAYERS" in _codes(r)


def test_invalid_p():
    r = simulate_climate_crop_water(_series(_day("2026-01-01")), _config(p=0.0))
    assert r.ok is False
    assert "INVALID_P" in _codes(r)


def test_invalid_kc():
    r = simulate_climate_crop_water(_series(_day("2026-01-01")), _config(kc=-1.0))
    assert r.ok is False
    assert "INVALID_KC" in _codes(r)


def test_storage_bounds_and_taw_preserved():
    r = simulate_climate_crop_water(_series(_day("2026-01-01", precip=100.0)), _config())
    rec = r.records[0]
    assert math.isclose(rec["taw_mm"], 60.0, abs_tol=1e-9)  # (0.30-0.10)*300
    # excess above field capacity is reported by the soil model
    assert rec["excess_mm"] >= 0.0


def test_state_propagation_multi_day():
    obs = _day("2026-01-01") + _day("2026-01-02") + _day("2026-01-03")
    r = simulate_climate_crop_water(_series(obs), _config())
    assert r.ok is True
    for a, b in zip(r.records, r.records[1:]):
        assert math.isclose(b["initial_storage_mm"], a["final_storage_mm"], abs_tol=1e-9)


def test_kc_per_day_list():
    obs = _day("2026-01-01") + _day("2026-01-02")
    r = simulate_climate_crop_water(_series(obs), _config(kc=[0.8, 0.5]))
    assert math.isclose(r.records[0]["kc"], 0.8)
    assert math.isclose(r.records[1]["kc"], 0.5)


def test_kc_length_mismatch():
    obs = _day("2026-01-01") + _day("2026-01-02")
    r = simulate_climate_crop_water(_series(obs), _config(kc=[0.8]))
    assert r.ok is False
    assert "KC_LENGTH_MISMATCH" in _codes(r)


# --- continuity ------------------------------------------------------------

def test_missing_day_breaks_continuity():
    obs = _day("2026-01-01") + _day("2026-01-03")
    r = simulate_climate_crop_water(_series(obs), _config())
    assert r.ok is False and r.partial is True
    assert r.calculated_dates == ["2026-01-01"]
    assert "2026-01-02" in r.missing_dates
    assert any(s["date"] == "2026-01-03" for s in r.skipped)


def test_interrupted_state_not_recovered():
    obs = _day("2026-01-01")
    # day 2 missing precipitation entirely -> boundary
    obs += [o for o in _day("2026-01-03") if o.variable != "precipitation"]
    r = simulate_climate_crop_water(_series(obs), _config())
    assert len(r.records) == 1
    assert r.simulation_end == "2026-01-01"


def test_partial_result():
    obs = _day("2026-01-01") + _day("2026-01-03")
    r = simulate_climate_crop_water(_series(obs), _config())
    assert r.partial is True and r.ok is False


# --- results ---------------------------------------------------------------

def test_result_json_serializable():
    r = simulate_climate_crop_water(_series(_day("2026-01-01")), _config())
    assert json.loads(json.dumps(r.to_dict())) == r.to_dict()


def test_deterministic_result_and_provenance():
    obs = _day("2026-01-01") + _day("2026-01-02", t=24.0)
    r1 = simulate_climate_crop_water(_series(obs), _config())
    r2 = simulate_climate_crop_water(_series(obs), _config())
    assert r1.records == r2.records
    assert r1.provenance["results_hash"] == r2.provenance["results_hash"]


def test_simulation_bounds():
    obs = _day("2026-01-01") + _day("2026-01-02")
    r = simulate_climate_crop_water(_series(obs), _config())
    assert r.simulation_start == "2026-01-01"
    assert r.simulation_end == "2026-01-02"


def test_provenance_contents():
    r = simulate_climate_crop_water(_series(_day("2026-01-01")), _config())
    prov = r.provenance
    assert prov["integration_id"] == CROP_INTEGRATION_ID
    assert prov["et0_model_id"] == "eco-nojin.hydroma.fao56-et0"
    assert prov["crop_model_id"] == "eco-nojin.hydroma.fao56-crop-water"
    assert prov["soil_model_id"] == "eco-nojin.hydroma.daily-soil-water"
    assert prov["soil_config"]["initial_storage_mm"] == 60.0
    assert prov["crop_params"]["p"] == 0.5
    assert prov["results_hash"]


def test_climate_series_hash_in_provenance():
    s = _series(_day("2026-01-01"))
    r = simulate_climate_crop_water(s, _config())
    assert r.provenance["climate_series_hash"] == series_hash(s)


def test_source_data_not_altered():
    s = _series(_day("2026-01-01"))
    before = [o.to_dict() for o in s.observations]
    simulate_climate_crop_water(s, _config())
    assert [o.to_dict() for o in s.observations] == before


# --- config ----------------------------------------------------------------

def test_validate_config_ok():
    assert validate_crop_water_series_config(_config())["valid"] is True


def test_start_end_restrict_range():
    obs = _day("2026-01-01") + _day("2026-01-02") + _day("2026-01-03")
    r = simulate_climate_crop_water(_series(obs),
                                    _config(start_date="2026-01-02", end_date="2026-01-02"))
    assert r.calculated_dates == ["2026-01-02"]


# --- regression ------------------------------------------------------------

def test_existing_crop_water_contract():
    from hydroma.registry import validate_definition
    from hydroma.crop_water import FAO56_CROP_WATER_DEFINITION
    validate_definition(FAO56_CROP_WATER_DEFINITION)


def test_existing_daily_soil_water_contract():
    from hydroma.registry import validate_definition
    from hydroma.daily_soil_water import DAILY_SOIL_WATER_DEFINITION
    validate_definition(DAILY_SOIL_WATER_DEFINITION)