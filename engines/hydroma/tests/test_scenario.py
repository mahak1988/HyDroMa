"""Scenario Engine tests (Phase 3.3). Software/integration checks only — NOT validation."""

import json
import math

import pytest

from hydroma.climate import ClimateObservation, ClimateSeries, series_hash
from hydroma.climate_et0 import ET0IntegrationConfig
from hydroma.scenario import (
    SCENARIO_ENGINE_ID,
    ScenarioConfig,
    compare_scenarios,
    compute_scenario_metrics,
    run_scenarios,
    scenario_config_hash,
    validate_scenarios,
)

_MAP = {"t": "air_temperature", "u2": "wind_speed", "ea": "relative_humidity",
        "rn": "solar_radiation"}
_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]
_U = {"air_temperature": "degC", "wind_speed": "m/s", "relative_humidity": "%",
      "solar_radiation": "MJ/m2/day", "precipitation": "mm"}


def _o(var, value, basis, day):
    return ClimateObservation(var, value, _U[var], day, basis, "valid")


def _series(days):
    rows = []
    for day, t in days:
        rows += [_o("air_temperature", t, "daily_mean", day),
                 _o("wind_speed", 2.0, "daily_mean", day),
                 _o("relative_humidity", 50.0, "daily_mean", day),
                 _o("solar_radiation", 15.0, "daily_sum", day),
                 _o("precipitation", 0.0, "daily_sum", day)]
    return ClimateSeries(rows, variable=None, temporal_resolution="1d")


_DAYS = [("2026-01-01", 20.0), ("2026-01-02", 26.0), ("2026-01-03", 30.0)]
_ET0 = ET0IntegrationConfig(variable_mapping=_MAP)


def _sc(sid, baseline=False, **kw):
    base = dict(layers=_LAYERS, initial_storage_mm=60.0, p=0.5, kc=0.8)
    base.update(kw)
    return ScenarioConfig(scenario_id=sid, name=sid, baseline=baseline, **base)


def _codes(errors):
    return {e["code"] for e in errors}


# --- validation ------------------------------------------------------------

def test_valid_scenarios():
    scn = [_sc("baseline", baseline=True), _sc("alt", irrigation_policy="schedule_to_target")]
    res = validate_scenarios(scn)
    assert res["valid"] is True


def test_missing_baseline_rejected():
    res = validate_scenarios([_sc("a"), _sc("b")])
    assert res["valid"] is False
    assert "MISSING_BASELINE" in _codes(res["errors"])


def test_multiple_baselines_rejected():
    res = validate_scenarios([_sc("a", baseline=True), _sc("b", baseline=True)])
    assert res["valid"] is False
    assert "MULTIPLE_BASELINES" in _codes(res["errors"])


def test_duplicate_scenario_ids_rejected():
    res = validate_scenarios([_sc("dup", baseline=True), _sc("dup")])
    assert res["valid"] is False
    assert "DUPLICATE_SCENARIO_ID" in _codes(res["errors"])


def test_invalid_scenario_config_rejected():
    res = validate_scenarios([_sc("baseline", baseline=True, layers=[])])
    assert res["valid"] is False


def test_empty_scenarios_rejected():
    res = validate_scenarios([])
    assert res["valid"] is False
    assert "EMPTY_SCENARIOS" in _codes(res["errors"])


# --- execution -------------------------------------------------------------

def test_baseline_and_alternative_execute():
    scn = [_sc("baseline", baseline=True),
           _sc("irrigated", irrigation_policy="schedule_to_target", application_efficiency=0.8)]
    r = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    assert r.ok is True
    assert r.baseline_id == "baseline"
    assert {x.scenario_id for x in r.results} == {"baseline", "irrigated"}


def test_independent_initial_conditions():
    scn = [_sc("baseline", baseline=True, initial_storage_mm=60.0),
           _sc("dry", initial_storage_mm=40.0)]
    r = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    by_id = {x.scenario_id: x for x in r.results}
    assert math.isclose(by_id["baseline"].records[0]["initial_storage_mm"], 60.0)
    assert math.isclose(by_id["dry"].records[0]["initial_storage_mm"], 40.0)


def test_common_climate_forcing_reused():
    scn = [_sc("baseline", baseline=True), _sc("alt")]
    r = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    hashes = {x.provenance["climate_series_hash"] for x in r.results}
    assert len(hashes) == 1


def test_failed_scenario_does_not_affect_others():
    # 'bad' has root_zone_depth beyond the profile -> runtime failure for that scenario only
    scn = [_sc("baseline", baseline=True),
           _sc("bad", root_zone_depth_mm=1000.0)]
    r = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    by_id = {x.scenario_id: x for x in r.results}
    assert by_id["baseline"].ok is True
    assert by_id["bad"].ok is False
    assert r.ok is False  # not all scenarios ok


def test_no_cross_scenario_contamination():
    # each scenario starts from its own initial state (no inheritance)
    scn = [_sc("a", baseline=True, initial_storage_mm=60.0),
           _sc("b", initial_storage_mm=60.0, irrigation_policy="explicit", explicit_irrigation_mm=5.0)]
    r = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    by_id = {x.scenario_id: x for x in r.results}
    assert math.isclose(by_id["a"].records[0]["initial_storage_mm"], 60.0)
    assert math.isclose(by_id["b"].records[0]["initial_storage_mm"], 60.0)
    # different irrigation -> different trajectories
    assert by_id["a"].records[-1]["final_storage_mm"] != by_id["b"].records[-1]["final_storage_mm"]


# --- comparison ------------------------------------------------------------

def test_comparison_metrics():
    scn = [_sc("baseline", baseline=True)]
    r = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    m = r.comparison["metrics"]["baseline"]
    assert m["duration_days"] == 3
    assert m["status"] == "complete"
    assert m["final_storage_mm"] is not None
    assert m["total_precipitation_mm"] == 0.0


def test_comparison_differences_vs_baseline():
    scn = [_sc("baseline", baseline=True),
           _sc("irrigated", irrigation_policy="schedule_to_target", application_efficiency=0.8)]
    r = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    diff = r.comparison["differences"]["irrigated"]["final_storage_mm"]
    base_final = r.comparison["metrics"]["baseline"]["final_storage_mm"]
    alt_final = r.comparison["metrics"]["irrigated"]["final_storage_mm"]
    assert math.isclose(diff["absolute"], alt_final - base_final, abs_tol=1e-9)
    if base_final != 0:
        assert math.isclose(diff["relative"], (alt_final - base_final) / base_final, abs_tol=1e-9)


def test_comparison_compatible_when_conditions_match():
    scn = [_sc("baseline", baseline=True), _sc("alt")]
    r = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    assert r.comparison["compatible"] is True


def test_comparison_incompatible_when_conditions_differ():
    scn = [_sc("baseline", baseline=True, initial_storage_mm=60.0),
           _sc("dry", initial_storage_mm=40.0)]
    r = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    assert r.comparison["compatible"] is False
    assert "soil_or_initial_conditions_differ" in r.comparison["warnings"]


def test_comparison_warns_on_incomplete():
    scn = [_sc("baseline", baseline=True),
           _sc("bad", root_zone_depth_mm=1000.0)]
    r = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    assert any(w.startswith("incomplete_scenarios") for w in r.comparison["warnings"])


def test_metrics_no_data_scenario():
    scn = [_sc("baseline", baseline=True)]
    r = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    m = compute_scenario_metrics(r.results[0])
    assert m["duration_days"] == 3
    assert m["days_with_stress"] >= 0


# --- provenance / determinism ---------------------------------------------

def test_deterministic_results():
    scn = [_sc("baseline", baseline=True), _sc("alt", irrigation_policy="explicit", explicit_irrigation_mm=5.0)]
    r1 = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    r2 = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    assert [x.records for x in r1.results] == [x.records for x in r2.results]
    assert r1.provenance == r2.provenance


def test_config_hash_deterministic_and_sensitive():
    sc = _sc("baseline", baseline=True)
    assert scenario_config_hash(sc) == scenario_config_hash(sc)
    sc2 = _sc("baseline", baseline=True, p=0.6)
    assert scenario_config_hash(sc) != scenario_config_hash(sc2)


def test_provenance_contents():
    scn = [_sc("baseline", baseline=True)]
    r = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    prov = r.provenance
    assert prov["engine_id"] == SCENARIO_ENGINE_ID
    assert prov["baseline_id"] == "baseline"
    assert prov["climate_series_hash"] == series_hash(_series(_DAYS))
    assert prov["scenario_config_hashes"]["baseline"]
    assert prov["scenario_result_hashes"]["baseline"]


def test_result_json_serializable():
    scn = [_sc("baseline", baseline=True), _sc("alt")]
    r = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    assert json.loads(json.dumps(r.to_dict())) == r.to_dict()


# --- regression ------------------------------------------------------------

def test_existing_irrigation_contract():
    from hydroma.registry import validate_definition
    from hydroma.irrigation import IRRIGATION_DEFINITION
    validate_definition(IRRIGATION_DEFINITION)


def test_existing_irrigation_series_still_works():
    from hydroma.irrigation_series import IrrigationSeriesConfig, simulate_climate_irrigation
    r = simulate_climate_irrigation(_series(_DAYS), IrrigationSeriesConfig(
        layers=_LAYERS, initial_storage_mm=60.0, p=0.5, kc=0.8, et0_config=_ET0))
    assert r.ok is True