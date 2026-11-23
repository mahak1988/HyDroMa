"""Scientific Workflow Layer tests (Phase 3.4). Software/integration only — NOT validation."""

import json
import math

import pytest

from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.climate_et0 import ET0IntegrationConfig
from hydroma.scenario import ScenarioConfig
from hydroma.workflow import (
    WORKFLOW_LAYER_ID,
    WorkflowDefinition,
    WorkflowInput,
    WorkflowStep,
    example_climate_irrigation_workflow,
    run_workflow,
    topological_order,
    validate_workflow,
)

_MAP = {"t": "air_temperature", "u2": "wind_speed", "ea": "relative_humidity",
        "rn": "solar_radiation"}
_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]
_U = {"air_temperature": "degC", "wind_speed": "m/s", "relative_humidity": "%",
      "solar_radiation": "MJ/m2/day", "precipitation": "mm"}


def _series(days):
    rows = []
    for day, t in days:
        rows += [ClimateObservation("air_temperature", t, "degC", day, "daily_mean", "valid"),
                 ClimateObservation("wind_speed", 2.0, "m/s", day, "daily_mean", "valid"),
                 ClimateObservation("relative_humidity", 50.0, "%", day, "daily_mean", "valid"),
                 ClimateObservation("solar_radiation", 15.0, "MJ/m2/day", day, "daily_sum", "valid"),
                 ClimateObservation("precipitation", 0.0, "mm", day, "daily_sum", "valid")]
    return ClimateSeries(rows, variable=None, temporal_resolution="1d")


_DAYS = [("2026-01-01", 20.0), ("2026-01-02", 26.0), ("2026-01-03", 30.0)]
_ET0 = ET0IntegrationConfig(variable_mapping=_MAP)


def _codes(errors):
    return {e["code"] for e in errors}


def _wf(steps, inputs=None, **kw):
    return WorkflowDefinition(workflow_id=kw.pop("workflow_id", "wf"), steps=steps,
                              inputs=inputs or [], **kw)


# --- validation ------------------------------------------------------------

def test_valid_workflow():
    wf = _wf([WorkflowStep("a", "integration", "compute_et0_series",
                           input_refs={"series": "workflow.climate"})],
             [WorkflowInput("climate")])
    assert validate_workflow(wf)["valid"] is True


def test_invalid_workflow_type():
    assert validate_workflow("nope")["valid"] is False


def test_empty_workflow_rejected():
    res = validate_workflow(_wf([]))
    assert res["valid"] is False
    assert "EMPTY_WORKFLOW" in _codes(res["errors"])


def test_duplicate_step_ids_rejected():
    wf = _wf([WorkflowStep("a", "integration", "compute_et0_series"),
              WorkflowStep("a", "integration", "compute_et0_series")])
    assert "DUPLICATE_STEP_ID" in _codes(validate_workflow(wf)["errors"])


def test_missing_dependency_rejected():
    wf = _wf([WorkflowStep("a", "integration", "compute_et0_series", dependencies=["x"])])
    assert "MISSING_DEPENDENCY" in _codes(validate_workflow(wf)["errors"])


def test_unsupported_operation_rejected():
    wf = _wf([WorkflowStep("a", "integration", "nonexistent_op")])
    assert "UNSUPPORTED_OPERATION" in _codes(validate_workflow(wf)["errors"])


def test_dependency_cycle_rejected():
    wf = _wf([
        WorkflowStep("a", "integration", "compute_et0_series", dependencies=["b"]),
        WorkflowStep("b", "integration", "compute_et0_series", dependencies=["a"]),
    ])
    res = validate_workflow(wf)
    assert res["valid"] is False
    assert "DEPENDENCY_CYCLE" in _codes(res["errors"])


def test_invalid_input_ref_rejected():
    wf = _wf([WorkflowStep("a", "integration", "compute_et0_series",
                           input_refs={"series": "workflow.climate"})],
             [WorkflowInput("climate")])
    # reference to a non-upstream / unknown step
    wf.steps[0].input_refs = {"series": "ghost.climate"}
    assert "INVALID_INPUT_REF" in _codes(validate_workflow(wf)["errors"])


def test_topological_order_deterministic():
    wf = _wf([
        WorkflowStep("c", "integration", "compute_et0_series", dependencies=["b"]),
        WorkflowStep("a", "integration", "compute_et0_series"),
        WorkflowStep("b", "integration", "compute_et0_series", dependencies=["a"]),
    ])
    order, cycle = topological_order(wf)
    assert cycle == []
    assert order == ["a", "b", "c"]


def test_topological_order_detects_cycle():
    wf = _wf([
        WorkflowStep("a", "integration", "compute_et0_series", dependencies=["b"]),
        WorkflowStep("b", "integration", "compute_et0_series", dependencies=["a"]),
    ])
    order, cycle = topological_order(wf)
    assert cycle != []


# --- execution -------------------------------------------------------------

def test_successful_execution():
    wf = _wf([WorkflowStep("et0", "integration", "compute_et0_series",
                           input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})],
             [WorkflowInput("climate"), WorkflowInput("et0_config")])
    r = run_workflow(wf, {"climate": _series(_DAYS), "et0_config": _ET0})
    assert r.status == "COMPLETED"
    assert r.steps["et0"].status == "COMPLETED"
    assert len(r.steps["et0"].output.records) == 3


def test_dependency_order_and_completion():
    wf = _wf([
        WorkflowStep("et0", "integration", "compute_et0_series",
                     input_refs={"series": "workflow.climate", "config": "workflow.et0_config"}),
        WorkflowStep("scenarios", "scenario", "run_scenarios", dependencies=["et0"],
                     input_refs={"series": "workflow.climate", "scenarios": "workflow.scenarios",
                                 "et0_config": "workflow.et0_config"}),
    ], [WorkflowInput("climate"), WorkflowInput("et0_config"), WorkflowInput("scenarios")])
    scn = [ScenarioConfig(scenario_id="baseline", baseline=True, layers=_LAYERS,
                          initial_storage_mm=60.0, p=0.5, kc=0.8, irrigation_policy="none")]
    r = run_workflow(wf, {"climate": _series(_DAYS), "et0_config": _ET0, "scenarios": scn})
    assert r.status == "COMPLETED"
    assert r.order == ["et0", "scenarios"]


def test_step_failure_propagates_to_downstream():
    # step 'a' fails (missing config -> rn unmapped -> ok=False); 'b' depends on 'a' -> skipped
    wf = _wf([
        WorkflowStep("a", "integration", "compute_et0_series",
                     input_refs={"series": "workflow.climate"}),  # no config -> ok=False
        WorkflowStep("b", "integration", "compute_et0_series", dependencies=["a"],
                     input_refs={"series": "workflow.climate", "config": "workflow.et0_config"}),
    ], [WorkflowInput("climate"), WorkflowInput("et0_config")])
    r = run_workflow(wf, {"climate": _series(_DAYS), "et0_config": _ET0})
    assert r.steps["a"].status == "FAILED"
    assert r.steps["b"].status == "SKIPPED"
    assert r.status == "FAILED"


def test_independent_step_still_runs_after_failure():
    wf = _wf([
        WorkflowStep("a", "integration", "compute_et0_series",
                     input_refs={"series": "workflow.climate"}),  # fails
        WorkflowStep("b", "integration", "compute_et0_series",  # independent -> still runs
                     input_refs={"series": "workflow.climate", "config": "workflow.et0_config"}),
    ], [WorkflowInput("climate"), WorkflowInput("et0_config")])
    r = run_workflow(wf, {"climate": _series(_DAYS), "et0_config": _ET0})
    assert r.steps["a"].status == "FAILED"
    assert r.steps["b"].status == "COMPLETED"
    assert r.status == "FAILED"


def test_missing_workflow_input_fails_fast():
    wf = _wf([WorkflowStep("et0", "integration", "compute_et0_series",
                           input_refs={"series": "workflow.climate"})],
             [WorkflowInput("climate"), WorkflowInput("et0_config")])
    r = run_workflow(wf, {"climate": _series(_DAYS)})  # missing et0_config
    assert r.status == "FAILED"
    assert "MISSING_WORKFLOW_INPUT" in _codes(r.errors)


def test_deterministic_execution():
    wf = _wf([WorkflowStep("et0", "integration", "compute_et0_series",
                           input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})],
             [WorkflowInput("climate"), WorkflowInput("et0_config")])
    r1 = run_workflow(wf, {"climate": _series(_DAYS), "et0_config": _ET0})
    r2 = run_workflow(wf, {"climate": _series(_DAYS), "et0_config": _ET0})
    assert r1.provenance["result_hash"] == r2.provenance["result_hash"]
    assert r1.provenance["workflow_hash"] == r2.provenance["workflow_hash"]


# --- model step chaining (data flow via input_refs) ------------------------

def test_model_step_data_flow():
    # et0 model -> crop water model consuming et0 output
    wf = _wf([
        WorkflowStep("et0", "model", "eco-nojin.hydroma.fao56-et0",
                     inputs={"rn": 20.0, "t": 20.0, "u2": 2.0, "ea": 1.5, "z": 0.0}),
        WorkflowStep("crop", "model", "eco-nojin.hydroma.fao56-crop-water",
                     dependencies=["et0"],
                     inputs={"kc": 0.8, "p": 0.5, "taw_mm": 100.0, "depletion_mm": 60.0},
                     input_refs={"et0_mm_per_day": "et0.result.et0_mm_per_day"}),
    ])
    r = run_workflow(wf, {})
    assert r.status == "COMPLETED"
    assert r.steps["et0"].status == "COMPLETED"
    assert r.steps["crop"].status == "COMPLETED"
    et0 = r.steps["et0"].output["result"]["et0_mm_per_day"]
    assert math.isclose(r.steps["crop"].output["result"]["etc_potential_mm_per_day"],
                        0.8 * et0, abs_tol=1e-6)


def test_model_not_registered_fails():
    wf = _wf([WorkflowStep("m", "model", "no.such.model", inputs={})])
    r = run_workflow(wf, {})
    assert r.steps["m"].status == "FAILED"
    assert r.status == "FAILED"


# --- provenance ------------------------------------------------------------

def test_provenance_contents():
    wf = _wf([WorkflowStep("et0", "integration", "compute_et0_series",
                           input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})],
             [WorkflowInput("climate"), WorkflowInput("et0_config")])
    r = run_workflow(wf, {"climate": _series(_DAYS), "et0_config": _ET0})
    prov = r.provenance
    assert prov["layer_id"] == WORKFLOW_LAYER_ID
    assert prov["workflow_id"] == "wf"
    assert prov["workflow_hash"]
    assert prov["input_hash"]
    assert prov["result_hash"]
    assert prov["step_provenance"]["et0"]["status"] == "COMPLETED"


def test_workflow_hash_sensitive_to_definition():
    wf1 = _wf([WorkflowStep("et0", "integration", "compute_et0_series")])
    wf2 = _wf([WorkflowStep("et0", "integration", "compute_et0_series", inputs={"x": 1})])
    r1 = run_workflow(wf1, {})
    r2 = run_workflow(wf2, {})
    assert r1.provenance["workflow_hash"] != r2.provenance["workflow_hash"]


def test_result_json_serializable():
    wf = _wf([WorkflowStep("et0", "integration", "compute_et0_series",
                           input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})],
             [WorkflowInput("climate"), WorkflowInput("et0_config")])
    r = run_workflow(wf, {"climate": _series(_DAYS), "et0_config": _ET0})
    assert json.loads(json.dumps(r.to_dict())) == r.to_dict()


# --- end-to-end example ----------------------------------------------------

def test_example_workflow_end_to_end():
    wf = example_climate_irrigation_workflow()
    assert validate_workflow(wf)["valid"] is True
    scn = [ScenarioConfig(scenario_id="baseline", baseline=True, layers=_LAYERS,
                          initial_storage_mm=60.0, p=0.5, kc=0.8,
                          irrigation_policy="schedule_to_target", application_efficiency=0.8)]
    r = run_workflow(wf, {"climate": _series(_DAYS), "et0_config": _ET0, "scenarios": scn})
    assert r.status == "COMPLETED"
    assert r.steps["et0"].status == "COMPLETED"
    assert r.steps["scenarios"].status == "COMPLETED"
    # scenario step output is a ScenarioSetResult with a comparison
    assert r.steps["scenarios"].output.comparison["metrics"]["baseline"]["final_storage_mm"] is not None


# --- regression ------------------------------------------------------------

def test_existing_scenario_still_works():
    from hydroma.scenario import run_scenarios
    scn = [ScenarioConfig(scenario_id="baseline", baseline=True, layers=_LAYERS,
                          initial_storage_mm=60.0, p=0.5, kc=0.8)]
    r = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    assert r.ok is True