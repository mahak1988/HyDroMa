"""Scientific data-quality & QC tests (Phase 3.9).

Software/structural checks only — NOT scientific validation.
"""

import json
import math

import pytest

from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.climate_et0 import ET0IntegrationConfig
from hydroma.quality import (
    QUALITY_SCHEMA_VERSION,
    QC_OUTCOMES,
    QUALITY_STATES,
    SEVERITIES,
    QualityControlPolicy,
    QualityFlag,
    QualityReport,
    assess_climate_quality,
    qc_blocks_execution,
)
from hydroma.contracts import DataContract, FieldSpec, validate_contract
from hydroma.workflow import WorkflowDefinition, WorkflowInput, WorkflowStep, run_workflow

_MAP = {"t": "air_temperature", "u2": "wind_speed", "ea": "relative_humidity",
        "rn": "solar_radiation"}
_UNITS = {"air_temperature": "degC", "wind_speed": "m/s", "relative_humidity": "%",
          "solar_radiation": "MJ/m2/day", "precipitation": "mm"}


def _obs(var, value, day="2026-01-01", quality="valid", unit=None, basis=None):
    bases = {"precipitation": "daily_sum", "solar_radiation": "daily_sum"}
    return ClimateObservation(var, value, unit or _UNITS[var], day,
                              basis or bases.get(var, "daily_mean"), quality)


def _series(observations, resolution="1d"):
    return ClimateSeries(observations, variable=None, temporal_resolution=resolution)


# --- A. core structures ----------------------------------------------------

def test_quality_flag_serialization():
    f = QualityFlag(code="X", severity="WARNING", message="m", field_path="a.b",
                    observation_id="o1", rule_id="R-X")
    d = f.to_dict()
    assert json.loads(json.dumps(d)) == d
    assert d["severity"] == "WARNING"


def test_quality_report_serialization_and_hash():
    r = assess_climate_quality(_series([_obs("air_temperature", 20.0)]))
    d = r.to_dict()
    assert json.loads(json.dumps(d)) == d
    assert r.schema_version == QUALITY_SCHEMA_VERSION
    assert len(r.canonical_hash()) == 64
    assert r.canonical_hash() == r.canonical_hash()


def test_severity_and_state_aggregation():
    r = assess_climate_quality(_series([
        _obs("air_temperature", 20.0),            # good
        _obs("precipitation", -5.0),              # bad
    ]))
    assert r.counts_by_severity["ERROR"] >= 1
    assert r.counts_by_state["BAD"] >= 1
    assert r.status == "REJECTED"


def test_overall_status_pass():
    r = assess_climate_quality(_series([_obs("air_temperature", 20.0)]))
    assert r.status == "PASS"


def test_overall_status_pass_with_warnings():
    r = assess_climate_quality(_series([_obs("air_temperature", None, quality="missing")]))
    assert r.status == "PASS_WITH_WARNINGS"


def test_outcomes_constant():
    assert set(QC_OUTCOMES) == {"PASS", "PASS_WITH_WARNINGS", "REJECTED", "NOT_EVALUATED"}


# --- B. structural ---------------------------------------------------------

def test_missing_value_is_flagged():
    r = assess_climate_quality(_series([_obs("air_temperature", None, quality="missing")]))
    assert "RULE-MISSING-VALUE" in r.rules_applied
    assert r.counts_by_state["MISSING"] == 1


def test_non_finite_value():
    o = ClimateObservation("air_temperature", float("nan"), "degC", "2026-01-01", "daily_mean", "valid")
    r = assess_climate_quality(_series([o]))
    assert "RULE-NON-FINITE" in r.rules_applied
    assert r.status == "REJECTED"


def test_duplicate_timestamp():
    r = assess_climate_quality(_series([_obs("air_temperature", 20.0), _obs("air_temperature", 21.0)]))
    assert "RULE-DUPLICATE-TIMESTAMP" in r.rules_applied


def test_non_monotonic_timestamps():
    r = assess_climate_quality(_series([_obs("air_temperature", 20.0, "2026-01-02"),
                                        _obs("air_temperature", 21.0, "2026-01-01")]))
    assert "RULE-NON-MONOTONIC" in r.rules_applied


def test_invalid_timestamp():
    o = ClimateObservation("air_temperature", 20.0, "degC", "not-a-date", "daily_mean", "valid")
    r = assess_climate_quality(_series([o]))
    # invalid timestamps are not silently repaired; parse fails -> skipped from ordering,
    # but the observation itself is still evaluated
    assert r.record_count == 1


# --- C. numeric ------------------------------------------------------------

def test_negative_precipitation_invalid():
    r = assess_climate_quality(_series([_obs("precipitation", -1.0)]))
    assert "RULE-PRECIP-NEGATIVE" in r.rules_applied
    assert r.status == "REJECTED"


def test_negative_wind_and_radiation_invalid():
    r = assess_climate_quality(_series([_obs("wind_speed", -1.0), _obs("solar_radiation", -5.0, "2026-01-02")]))
    assert "RULE-WIND-NEGATIVE" in r.rules_applied
    assert "RULE-RADIATION-NEGATIVE" in r.rules_applied


def test_configurable_plausibility_threshold_warning():
    policy = QualityControlPolicy(thresholds={"air_temperature": {"min": -10.0, "max": 50.0}})
    r = assess_climate_quality(_series([_obs("air_temperature", 60.0)]), policy)
    assert "RULE-TEMP-PLAUSIBILITY" in r.rules_applied
    assert r.status == "PASS_WITH_WARNINGS"  # plausibility is a warning


def test_no_threshold_no_warning():
    r = assess_climate_quality(_series([_obs("air_temperature", 60.0)]))
    assert "RULE-TEMP-PLAUSIBILITY" not in r.rules_applied


def test_boundary_values_ok():
    r = assess_climate_quality(_series([_obs("precipitation", 0.0), _obs("relative_humidity", 100.0, "2026-01-02")]))
    assert r.status == "PASS"


# --- D. units --------------------------------------------------------------

def test_unit_exact_and_compatible():
    r = assess_climate_quality(_series([_obs("air_temperature", 20.0, unit="degC")]))
    assert r.status == "PASS"


def test_unit_unknown():
    r = assess_climate_quality(_series([_obs("air_temperature", 20.0, unit="bogus")]))
    assert "RULE-UNIT-UNKNOWN" in r.rules_applied
    assert r.status == "REJECTED"


def test_unit_incompatible():
    r = assess_climate_quality(_series([_obs("precipitation", 5.0, unit="degC")]))
    assert "RULE-UNIT-INCOMPATIBLE" in r.rules_applied


def test_unit_missing_legacy_vs_strict():
    o = ClimateObservation("air_temperature", 20.0, "", "2026-01-01", "daily_mean", "valid")
    legacy = assess_climate_quality(_series([o]), QualityControlPolicy(unit_policy="LEGACY"))
    strict = assess_climate_quality(_series([o]), QualityControlPolicy(unit_policy="STRICT"))
    assert "RULE-UNIT-MISSING" in legacy.rules_applied
    assert legacy.status == "PASS_WITH_WARNINGS"       # LEGACY: warning
    assert strict.status == "REJECTED"                  # STRICT: error


# --- E. time series --------------------------------------------------------

def test_missing_periods_detected():
    r = assess_climate_quality(_series([_obs("air_temperature", 20.0, "2026-01-01"),
                                        _obs("air_temperature", 21.0, "2026-01-03")]))
    assert "RULE-MISSING-PERIODS" in r.rules_applied


def test_complete_series_no_gap():
    r = assess_climate_quality(_series([_obs("air_temperature", 20.0, "2026-01-01"),
                                        _obs("air_temperature", 21.0, "2026-01-02")]))
    assert "RULE-MISSING-PERIODS" not in r.rules_applied


def test_empty_series_not_evaluated():
    r = assess_climate_quality(_series([]))
    assert r.status == "NOT_EVALUATED"


# --- F. spatial ------------------------------------------------------------

def test_invalid_latitude():
    from hydroma.climate import SpatialContext
    s = _series([_obs("air_temperature", 20.0)])
    s.spatial = SpatialContext(latitude=200.0, longitude=10.0, crs="EPSG:4326")
    r = assess_climate_quality(s)
    assert "RULE-LAT-RANGE" in r.rules_applied
    assert r.status == "REJECTED"


def test_invalid_longitude():
    from hydroma.climate import SpatialContext
    s = _series([_obs("air_temperature", 20.0)])
    s.spatial = SpatialContext(latitude=10.0, longitude=-200.0, crs="EPSG:4326")
    r = assess_climate_quality(s)
    assert "RULE-LON-RANGE" in r.rules_applied


def test_valid_spatial_ok():
    from hydroma.climate import SpatialContext
    s = _series([_obs("air_temperature", 20.0)])
    s.spatial = SpatialContext(latitude=35.0, longitude=51.0, elevation=1200.0, crs="EPSG:4326")
    r = assess_climate_quality(s)
    assert "RULE-LAT-RANGE" not in r.rules_applied
    assert "RULE-LON-RANGE" not in r.rules_applied
    assert "RULE-SPATIAL-BOUNDS-NOT-EVALUATED" not in r.rules_applied


def test_projected_crs_skips_geographic_bounds():
    from hydroma.climate import SpatialContext
    s = _series([_obs("air_temperature", 20.0)])
    # UTM projected coordinates (easting/northing) far outside geographic ranges
    s.spatial = SpatialContext(latitude=999.0, longitude=999.0, crs="EPSG:32633")
    r = assess_climate_quality(s)
    assert "RULE-LAT-RANGE" not in r.rules_applied
    assert "RULE-LON-RANGE" not in r.rules_applied
    assert "RULE-SPATIAL-BOUNDS-NOT-EVALUATED" in r.rules_applied


def test_unknown_crs_skips_geographic_bounds():
    from hydroma.climate import SpatialContext
    s = _series([_obs("air_temperature", 20.0)])
    s.spatial = SpatialContext(latitude=999.0, longitude=999.0)  # no CRS declared
    r = assess_climate_quality(s)
    assert "RULE-LAT-RANGE" not in r.rules_applied
    assert "RULE-SPATIAL-BOUNDS-NOT-EVALUATED" in r.rules_applied


def test_no_spatial_coords_no_bounds_finding():
    s = _series([_obs("air_temperature", 20.0)])
    r = assess_climate_quality(s)
    assert "RULE-SPATIAL-BOUNDS-NOT-EVALUATED" not in r.rules_applied


# --- G. climate ------------------------------------------------------------

def test_humidity_range():
    r = assess_climate_quality(_series([_obs("relative_humidity", 120.0)]))
    assert "RULE-RH-RANGE" in r.rules_applied
    assert r.status == "REJECTED"


def test_unknown_variable():
    o = ClimateObservation("moon_phase", 1.0, "1", "2026-01-01", "instant", "valid")
    r = assess_climate_quality(_series([o]))
    assert "RULE-UNKNOWN-VARIABLE" in r.rules_applied


# --- H. strict unit enforcement at contract boundary -----------------------

def _unit_contract():
    return DataContract("t", "1.0.0", "input", "data", {
        "d": FieldSpec("d", "number", required=True, unit="mm"),
    })


def test_legacy_plain_number_backwards_compatible():
    v = validate_contract(_unit_contract(), {"d": 1000}, "LEGACY")
    assert v.valid is True
    assert v.unit_policy == "LEGACY"
    assert v.units[0]["status"] == "UNIT_MISSING"


def test_strict_plain_number_fails():
    v = validate_contract(_unit_contract(), {"d": 1000}, "STRICT")
    assert v.valid is False
    assert "UNIT_MISSING" in {e["code"] for e in v.errors}
    assert v.unit_policy == "STRICT"


def test_strict_compatible_unit_passes():
    v = validate_contract(_unit_contract(), {"d": {"value": 1, "unit": "m"}}, "STRICT")
    assert v.valid is True


def test_strict_incompatible_unit_fails():
    v = validate_contract(_unit_contract(), {"d": {"value": 1, "unit": "kg"}}, "STRICT")
    assert v.valid is False
    assert "UNIT_INCOMPATIBLE" in {e["code"] for e in v.errors}


def test_strict_unknown_unit_fails():
    v = validate_contract(_unit_contract(), {"d": {"value": 1, "unit": "bogus"}}, "STRICT")
    assert v.valid is False
    assert "UNIT_UNKNOWN" in {e["code"] for e in v.errors}


def test_field_without_unit_unaffected_in_strict():
    c = DataContract("t", "1.0.0", "input", "x", {"n": FieldSpec("n", "number", required=True)})
    assert validate_contract(c, {"n": 1}, "STRICT").valid is True


# --- I. workflow integration ----------------------------------------------

def _climate():
    return _series([_obs("air_temperature", 20.0), _obs("wind_speed", 2.0),
                    _obs("relative_humidity", 50.0), _obs("solar_radiation", 15.0)])


def test_workflow_qc_step_warning_permits_execution():
    wf = WorkflowDefinition(
        workflow_id="w", inputs=[WorkflowInput("climate")],
        steps=[WorkflowStep("qc", "integration", "assess_climate_quality",
                            input_refs={"series": "workflow.climate"})],
    )
    r = run_workflow(wf, {"climate": _climate()})
    assert r.steps["qc"].status == "COMPLETED"


def test_workflow_qc_step_error_blocks():
    bad = _series([_obs("precipitation", -5.0)])
    wf = WorkflowDefinition(
        workflow_id="w", inputs=[WorkflowInput("climate")],
        steps=[WorkflowStep("qc", "integration", "assess_climate_quality",
                            input_refs={"series": "workflow.climate"})],
    )
    r = run_workflow(wf, {"climate": bad})
    assert r.steps["qc"].status == "FAILED"
    assert r.steps["qc"].output["status"] == "REJECTED"


def test_workflow_qc_error_skips_dependent():
    bad = _series([_obs("precipitation", -5.0)])
    wf = WorkflowDefinition(
        workflow_id="w", inputs=[WorkflowInput("climate"), WorkflowInput("et0_config")],
        steps=[
            WorkflowStep("qc", "integration", "assess_climate_quality",
                         input_refs={"series": "workflow.climate"}),
            WorkflowStep("sim", "integration", "compute_et0_series", dependencies=["qc"],
                         input_refs={"series": "workflow.climate", "config": "workflow.et0_config"}),
        ],
    )
    r = run_workflow(wf, {"climate": bad, "et0_config": ET0IntegrationConfig(variable_mapping=_MAP)})
    assert r.steps["qc"].status == "FAILED"
    assert r.steps["sim"].status == "SKIPPED"


def test_workflow_strict_unit_policy_blocks(monkeypatch):
    from hydroma import workflow as wf_mod
    from hydroma.climate import ClimateSeries
    unit_contract = DataContract("compute_et0_series.input", "1.0.0", "input", "structural", {
        "series": FieldSpec("series", "object", required=True, expected_class=ClimateSeries),
        "config": FieldSpec("config", "object", required=False, expected_class=ET0IntegrationConfig),
        "amount": FieldSpec("amount", "number", required=True, unit="mm"),
    })
    monkeypatch.setattr(wf_mod, "get_contract",
                        lambda op, d: unit_contract if (op == "compute_et0_series" and d == "input") else None)
    wf = WorkflowDefinition(
        workflow_id="w", unit_policy="STRICT",
        inputs=[WorkflowInput("climate"), WorkflowInput("et0_config")],
        steps=[WorkflowStep("et0", "integration", "compute_et0_series",
                            inputs={"amount": 1000},  # plain number, no unit -> UNIT_MISSING (STRICT)
                            input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})],
    )
    r = run_workflow(wf, {"climate": _climate(), "et0_config": ET0IntegrationConfig(variable_mapping=_MAP)})
    assert r.steps["et0"].status == "FAILED"
    assert r.steps["et0"].input_validation["unit_policy"] == "STRICT"
    assert "UNIT_MISSING" in {e["code"] for e in r.steps["et0"].error.get("detail", [])}


def test_workflow_legacy_unit_policy_allows_plain_number(monkeypatch):
    from hydroma import workflow as wf_mod
    from hydroma.climate import ClimateSeries
    unit_contract = DataContract("compute_et0_series.input", "1.0.0", "input", "structural", {
        "series": FieldSpec("series", "object", required=True, expected_class=ClimateSeries),
        "config": FieldSpec("config", "object", required=False, expected_class=ET0IntegrationConfig),
        "amount": FieldSpec("amount", "number", required=True, unit="mm"),
    })
    monkeypatch.setattr(wf_mod, "get_contract",
                        lambda op, d: unit_contract if (op == "compute_et0_series" and d == "input") else None)
    wf = WorkflowDefinition(
        workflow_id="w",  # default unit_policy LEGACY
        inputs=[WorkflowInput("climate"), WorkflowInput("et0_config")],
        steps=[WorkflowStep("et0", "integration", "compute_et0_series",
                            inputs={"amount": 1000},
                            input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})],
    )
    r = run_workflow(wf, {"climate": _climate(), "et0_config": ET0IntegrationConfig(variable_mapping=_MAP)})
    assert r.steps["et0"].status == "COMPLETED"
    assert r.steps["et0"].input_validation["unit_policy"] == "LEGACY"


def test_qc_preserves_original_inputs():
    obs = [_obs("precipitation", -5.0), _obs("air_temperature", 20.0, "2026-01-02")]
    s = _series(obs)
    before = [o.to_dict() for o in s.observations]
    assess_climate_quality(s)
    assert [o.to_dict() for o in s.observations] == before


# --- J. experiment replay preserves unit policy ---------------------------

def test_experiment_preserves_unit_policy():
    from hydroma.experiment import ExperimentDefinition, run_experiment
    wf = WorkflowDefinition(
        workflow_id="w", unit_policy="STRICT",
        inputs=[WorkflowInput("climate"), WorkflowInput("et0_config")],
        steps=[WorkflowStep("et0", "integration", "compute_et0_series",
                            input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})],
    )
    ed = ExperimentDefinition(experiment_id="e", workflow=wf)
    r = run_experiment(ed, {"climate": _climate(), "et0_config": ET0IntegrationConfig(variable_mapping=_MAP)})
    assert r.artifact["definition"]["workflow"]["unit_policy"] == "STRICT"


# --- regression ------------------------------------------------------------

def test_qc_blocks_execution_helper():
    strict = QualityControlPolicy(error_blocks_execution=True)
    r = assess_climate_quality(_series([_obs("precipitation", -1.0)]))
    assert qc_blocks_execution(r, strict) is True
    r2 = assess_climate_quality(_series([_obs("air_temperature", 20.0)]))
    assert qc_blocks_execution(r2, strict) is False