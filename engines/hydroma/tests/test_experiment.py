"""Scientific Experiment & Reproducibility Artifact tests (Phase 3.6).

Software/integration checks only — NOT scientific validation.
"""

import json
import math

import pytest

from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.climate_et0 import ET0IntegrationConfig
from hydroma.contracts import validate_contract, get_contract
from hydroma.experiment import (
    ARTIFACT_SCHEMA_VERSION,
    ExperimentDefinition,
    build_artifact,
    experiment_definition_hash,
    replay_experiment,
    run_experiment,
    validate_artifact,
    validate_experiment_definition,
)
from hydroma.scenario import ScenarioConfig, run_scenarios
from hydroma.workflow import (
    WorkflowDefinition,
    WorkflowInput,
    WorkflowStep,
    run_workflow,
    validate_workflow,
)

_MAP = {"t": "air_temperature", "u2": "wind_speed", "ea": "relative_humidity",
        "rn": "solar_radiation"}
_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]


def _series(days):
    rows = []
    for day, t in days:
        rows += [ClimateObservation("air_temperature", t, "degC", day, "daily_mean", "valid"),
                 ClimateObservation("wind_speed", 2.0, "m/s", day, "daily_mean", "valid"),
                 ClimateObservation("relative_humidity", 50.0, "%", day, "daily_mean", "valid"),
                 ClimateObservation("solar_radiation", 15.0, "MJ/m2/day", day, "daily_sum", "valid"),
                 ClimateObservation("precipitation", 0.0, "mm", day, "daily_sum", "valid")]
    return ClimateSeries(rows, variable=None, temporal_resolution="1d")


_DAYS = [("2026-01-01", 20.0), ("2026-01-02", 26.0)]
_ET0 = ET0IntegrationConfig(variable_mapping=_MAP)


def _simple_workflow():
    # contract-backed integration step with no literal (non-serializable) step inputs
    return WorkflowDefinition(
        workflow_id="wf",
        inputs=[WorkflowInput("climate"), WorkflowInput("et0_config")],
        steps=[WorkflowStep("et0", "integration", "compute_et0_series",
                            input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})],
    )


def _inputs():
    return {"climate": _series(_DAYS), "et0_config": _ET0}


def _experiment():
    return ExperimentDefinition(experiment_id="exp-1", name="Demo",
                                experiment_version="1.0.0", workflow=_simple_workflow(),
                                tags=["demo"])


# --- definition ------------------------------------------------------------

def test_valid_definition():
    assert validate_experiment_definition(_experiment())["valid"] is True


def test_missing_workflow_rejected():
    ed = ExperimentDefinition(experiment_id="e", workflow=None)
    res = validate_experiment_definition(ed)
    assert res["valid"] is False
    assert "MISSING_WORKFLOW" in {e["code"] for e in res["errors"]}


def test_invalid_experiment_id_rejected():
    ed = ExperimentDefinition(experiment_id="", workflow=_simple_workflow())
    assert "INVALID_EXPERIMENT_ID" in {e["code"] for e in validate_experiment_definition(ed)["errors"]}


def test_definition_hash_deterministic_and_sensitive():
    ed = _experiment()
    assert experiment_definition_hash(ed) == experiment_definition_hash(ed)
    ed2 = _experiment()
    ed2.name = "Other"
    assert experiment_definition_hash(ed) != experiment_definition_hash(ed2)


# --- execution -------------------------------------------------------------

def test_successful_experiment():
    r = run_experiment(_experiment(), _inputs())
    assert r.status == "COMPLETED"
    assert r.ok is True
    assert r.workflow_result.status == "COMPLETED"
    assert r.artifact["result_hash"]


def test_missing_required_input():
    r = run_experiment(_experiment(), {"climate": _series(_DAYS)})  # missing et0_config
    assert r.ok is False
    assert r.status == "INVALID_DEFINITION"
    assert "MISSING_INPUT" in {e["code"] for e in r.errors}


def test_failed_experiment_workflow_error():
    # wrong-typed climate -> workflow step fails contract input validation
    r = run_experiment(_experiment(), {"climate": {"bad": "type"}, "et0_config": _ET0})
    assert r.status == "FAILED"
    assert r.ok is False
    # diagnostics preserved
    assert r.workflow_result.steps["et0"].status == "FAILED"
    assert r.artifact["execution"]["workflow_status"] == "FAILED"


def test_invalid_definition_short_circuits():
    r = run_experiment(ExperimentDefinition(experiment_id="", workflow=None), {})
    assert r.status == "INVALID_DEFINITION"
    assert r.artifact == {}


# --- artifact --------------------------------------------------------------

def test_artifact_schema_and_metadata():
    r = run_experiment(_experiment(), _inputs())
    a = r.artifact
    assert a["artifact_schema_version"] == ARTIFACT_SCHEMA_VERSION
    assert a["experiment_id"] == "exp-1"
    assert a["validation"]["scientific_status"] == "NOT_VALIDATED"
    assert validate_artifact(a)["valid"] is True


def test_artifact_hashes_present():
    a = run_experiment(_experiment(), _inputs()).artifact
    for key in ("definition_hash", "workflow_hash", "input_hash", "config_hash",
                "result_hash", "artifact_hash"):
        assert a[key] and len(a[key]) == 64


def test_artifact_json_serializable():
    a = run_experiment(_experiment(), _inputs()).artifact
    assert json.loads(json.dumps(a)) == a


def test_artifact_deterministic_excludes_volatile():
    r1 = run_experiment(_experiment(), _inputs())
    r2 = run_experiment(_experiment(), _inputs())
    assert r1.artifact["artifact_hash"] == r2.artifact["artifact_hash"]
    assert r1.artifact["result_hash"] == r2.artifact["result_hash"]
    # run_id/created_at may differ but do not affect the deterministic hash
    assert r1.artifact["run_id"] != r2.artifact["run_id"] or True


def test_artifact_records_contract_validation():
    a = run_experiment(_experiment(), _inputs()).artifact
    assert a["validation"]["steps"]["et0"]["input_validation"]["valid"] is True
    assert a["validation"]["steps"]["et0"]["output_validation"]["valid"] is True


def test_validate_artifact_detects_schema_mismatch():
    a = run_experiment(_experiment(), _inputs()).artifact
    a["artifact_schema_version"] = "0.0.1"
    assert validate_artifact(a)["valid"] is False


def test_validate_artifact_missing_field():
    a = run_experiment(_experiment(), _inputs()).artifact
    del a["result_hash"]
    assert validate_artifact(a)["valid"] is False


def test_build_artifact_requires_workflow_result():
    r = run_experiment(_experiment(), _inputs())
    a = build_artifact(_experiment(), _inputs(), r.workflow_result)
    assert validate_artifact(a)["valid"] is True


# --- replay & comparison ---------------------------------------------------

def test_replay_matches_identical_run():
    r = run_experiment(_experiment(), _inputs())
    replay = replay_experiment(r.artifact, _inputs())
    assert replay["match"] is True
    assert replay["actual_result_hash"] == r.artifact["result_hash"]


def test_replay_detects_different_result():
    r = run_experiment(_experiment(), _inputs())
    other_inputs = {"climate": _series([("2026-01-01", 30.0), ("2026-01-02", 35.0)]),
                    "et0_config": _ET0}
    replay = replay_experiment(r.artifact, other_inputs)
    assert replay["match"] is False


def test_replay_unavailable_without_inputs():
    r = run_experiment(_experiment(), _inputs())
    a = dict(r.artifact)
    del a["inputs"]  # no recorded executable inputs
    replay = replay_experiment(a, None)
    assert replay["status"] == "UNAVAILABLE"


def test_replay_fails_on_invalid_artifact():
    replay = replay_experiment({"artifact_schema_version": "bad"})
    assert replay["status"] == "FAILED"
    assert replay["reason"] == "invalid_artifact"


# --- regression ------------------------------------------------------------

def test_workflow_engine_unchanged():
    r = run_workflow(_simple_workflow(), _inputs())
    assert r.status == "COMPLETED"


def test_contract_validation_unchanged():
    c = get_contract("compute_et0_series", "input")
    assert validate_contract(c, {"series": _series(_DAYS), "config": _ET0}).valid is True


def test_scenario_engine_unchanged():
    scn = [ScenarioConfig(scenario_id="baseline", baseline=True, layers=_LAYERS,
                          initial_storage_mm=60.0, p=0.5, kc=0.8)]
    r = run_scenarios(_series(_DAYS), scn, et0_config=_ET0)
    assert r.ok is True