"""Experiment comparison & result inspection tests (Phase 3.7).

Software/integration checks only — NOT scientific validation.
"""

import json
import math

import pytest

from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.climate_et0 import ET0IntegrationConfig
from hydroma.compare import (
    COMPARISON_SCHEMA_VERSION,
    _compare_paths,
    compare_experiment_results,
    compare_experiments,
    flatten_result,
)
from hydroma.experiment import (
    ExperimentDefinition,
    ExperimentResult,
    run_experiment,
    validate_artifact,
    verify_artifact_integrity,
)
from hydroma.workflow import WorkflowDefinition, WorkflowInput, WorkflowStep

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


def _workflow():
    return WorkflowDefinition(
        workflow_id="wf", inputs=[WorkflowInput("climate"), WorkflowInput("et0_config")],
        steps=[WorkflowStep("et0", "integration", "compute_et0_series",
                            input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})],
    )


def _inputs(days=(("2026-01-01", 20.0), ("2026-01-02", 26.0))):
    return {"climate": _series(list(days)), "et0_config": ET0IntegrationConfig(variable_mapping=_MAP)}


def _experiment(experiment_id="exp-1", version="1.0.0"):
    return ExperimentDefinition(experiment_id=experiment_id, experiment_version=version,
                                workflow=_workflow())


# --- identical ------------------------------------------------------------

def test_identical_artifacts():
    r = run_experiment(_experiment(), _inputs())
    c = compare_experiments(r.artifact, r.artifact)
    assert c["status"] == "COMPARABLE"
    assert all(v == "IDENTICAL" for v in c["compatibility"].values())
    assert c["result"]["hash_match"] is True
    assert c["comparison_schema_version"] == COMPARISON_SCHEMA_VERSION


# --- compatibility differences ---------------------------------------------

def test_different_input_hash():
    r1 = run_experiment(_experiment(), _inputs())
    r2 = run_experiment(_experiment(), _inputs((("2026-01-01", 30.0), ("2026-01-02", 35.0))))
    c = compare_experiments(r1.artifact, r2.artifact)
    assert c["compatibility"]["input"] == "DIFFERENT"
    assert "input_differs" in c["warnings"]
    assert c["provenance"]["input_hash"] == "DIFFERENT"


def test_different_configuration_hash():
    r1 = run_experiment(_experiment(), _inputs())
    ed2 = _experiment()
    ed2.metadata = {"scenario": "B"}
    r2 = run_experiment(ed2, _inputs())
    c = compare_experiments(r1.artifact, r2.artifact)
    assert c["compatibility"]["configuration"] == "DIFFERENT"


def test_different_workflow_definition():
    r1 = run_experiment(_experiment(), _inputs())
    wf2 = _workflow()
    wf2.workflow_id = "wf-2"
    r2 = run_experiment(ExperimentDefinition(experiment_id="exp-1", workflow=wf2), _inputs())
    c = compare_experiments(r1.artifact, r2.artifact)
    assert c["compatibility"]["workflow"] == "DIFFERENT"
    assert "workflow_definition_differs" in c["warnings"]


def test_different_experiment_version():
    r1 = run_experiment(_experiment(version="1.0.0"), _inputs())
    r2 = run_experiment(_experiment(version="2.0.0"), _inputs())
    c = compare_experiments(r1.artifact, r2.artifact)
    assert c["compatibility"]["definition"] == "DIFFERENT"
    assert "experiment_version_differs" in c["warnings"]


# --- execution -------------------------------------------------------------

def test_execution_status_matching():
    r1 = run_experiment(_experiment(), _inputs())
    r2 = run_experiment(_experiment(), _inputs())
    c = compare_experiments(r1.artifact, r2.artifact)
    assert c["execution"]["status"] == "IDENTICAL"


def test_execution_status_differs_failed_vs_completed():
    r1 = run_experiment(_experiment(), _inputs())
    r2 = run_experiment(_experiment(), {"climate": {"bad": "type"},
                                        "et0_config": ET0IntegrationConfig(variable_mapping=_MAP)})
    c = compare_experiments(r1.artifact, r2.artifact)
    assert c["execution"]["a_workflow_status"] == "COMPLETED"
    assert c["execution"]["b_workflow_status"] == "FAILED"
    assert c["execution"]["status"] == "DIFFERENT"


def test_failed_experiment_comparison_does_not_crash():
    r = run_experiment(_experiment(), {"climate": {"bad": "type"},
                                       "et0_config": ET0IntegrationConfig(variable_mapping=_MAP)})
    c = compare_experiments(r.artifact, r.artifact)
    assert c["status"] == "COMPARABLE"  # structurally comparable, both failed identically
    assert c["execution"]["a_workflow_status"] == "FAILED"


# --- result paths (ExperimentResult) ---------------------------------------

def test_result_path_comparison_changes():
    r1 = run_experiment(_experiment(), _inputs((("2026-01-01", 20.0),)))
    r2 = run_experiment(_experiment(), _inputs((("2026-01-01", 30.0),)))
    c = compare_experiment_results(r1, r2)
    assert c["result"]["mode"] == "path"
    assert c["result"]["hash_match"] is False
    assert len(c["result"]["changed"]) >= 1
    # ET0 differs (warmer day -> higher ET0)
    assert any("et0_mm_per_day" in ch["path"] for ch in c["result"]["changed"])


def test_result_path_comparison_identical():
    r1 = run_experiment(_experiment(), _inputs())
    r2 = run_experiment(_experiment(), _inputs())
    c = compare_experiment_results(r1, r2)
    assert c["result"]["hash_match"] is True
    assert c["result"]["added"] == [] and c["result"]["removed"] == []
    assert c["result"]["changed"] == []


# --- path helper edge cases ------------------------------------------------

def test_paths_added_removed():
    res = _compare_paths({"a": 1}, {"b": 2})
    assert res["added"] == ["b"]
    assert res["removed"] == ["a"]


def test_paths_type_change():
    res = _compare_paths({"a": 1}, {"a": "1"})
    assert len(res["type_changed"]) == 1
    assert res["type_changed"][0]["a_type"] == "number"
    assert res["type_changed"][0]["b_type"] == "string"


def test_paths_numeric_difference_raw():
    res = _compare_paths({"a": 1.0}, {"a": 2.5})
    assert res["changed"][0]["difference"] == 1.5


def test_paths_non_finite_not_compared():
    res = _compare_paths({"a": float("nan")}, {"a": float("nan")})
    assert "a" in res["non_finite"]
    assert res["changed"] == []


def test_flatten_result():
    flat = flatten_result({"x": {"y": [1, 2]}})
    assert flat == {"x.y[0]": 1, "x.y[1]": 2}


# --- provenance ------------------------------------------------------------

def test_missing_provenance_hash_invalidates_artifact():
    # provenance hashes are required artifact fields; removing one -> INVALID
    r = run_experiment(_experiment(), _inputs())
    a = json.loads(json.dumps(r.artifact))
    del a["result_hash"]
    c = compare_experiments(a, r.artifact)
    assert c["status"] == "INVALID"


def test_empty_provenance_subdict_still_comparable():
    # the provenance sub-dict may be empty; top-level hashes drive comparison
    r = run_experiment(_experiment(), _inputs())
    a = json.loads(json.dumps(r.artifact))
    a["provenance"] = {}
    c = compare_experiments(a, r.artifact)
    assert c["status"] == "COMPARABLE"
    assert c["provenance"]["result_hash"] == "IDENTICAL"


# --- invalid artifacts -----------------------------------------------------

def test_invalid_artifact_a():
    r = run_experiment(_experiment(), _inputs())
    c = compare_experiments({"not": "an artifact"}, r.artifact)
    assert c["status"] == "INVALID"


def test_unsupported_schema():
    r = run_experiment(_experiment(), _inputs())
    a = dict(r.artifact)
    a["artifact_schema_version"] = "9.9.9"
    c = compare_experiments(a, r.artifact)
    assert c["status"] == "INCOMPATIBLE"


def test_missing_artifact():
    r = run_experiment(_experiment(), _inputs())
    c = compare_experiments(None, r.artifact)
    assert c["status"] == "INVALID"


# --- integrity verification ------------------------------------------------

def test_verify_artifact_integrity_ok():
    r = run_experiment(_experiment(), _inputs())
    v = verify_artifact_integrity(r.artifact)
    assert v["valid"] is True


def test_verify_artifact_integrity_detects_tampering():
    r = run_experiment(_experiment(), _inputs())
    a = json.loads(json.dumps(r.artifact))  # deep copy
    a["result_hash"] = "deadbeef" * 8
    v = verify_artifact_integrity(a)
    assert v["valid"] is False
    assert "ARTIFACT_HASH_MISMATCH" in {e["code"] for e in v["errors"]}


# --- determinism -----------------------------------------------------------

def test_comparison_deterministic_serialization():
    r1 = run_experiment(_experiment(), _inputs())
    r2 = run_experiment(_experiment(), _inputs((("2026-01-01", 30.0), ("2026-01-02", 35.0))))
    c1 = compare_experiments(r1.artifact, r2.artifact)
    c2 = compare_experiments(r1.artifact, r2.artifact)
    assert json.loads(json.dumps(c1)) == c1
    assert c1 == c2


# --- regression ------------------------------------------------------------

def test_workflow_still_works():
    from hydroma.workflow import run_workflow
    assert run_workflow(_workflow(), _inputs()).status == "COMPLETED"


def test_experiment_still_works():
    r = run_experiment(_experiment(), _inputs())
    assert r.status == "COMPLETED"
    assert validate_artifact(r.artifact)["valid"] is True