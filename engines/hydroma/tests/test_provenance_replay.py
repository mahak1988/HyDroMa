"""Workflow provenance & replay integrity tests (Phase 3.12).

Software/integration checks only — NOT scientific validation.
"""

import json
import math

import pytest

from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.climate_et0 import ET0IntegrationConfig
from hydroma.experiment import (
    ExperimentDefinition,
    replay_experiment,
    run_experiment,
    verify_artifact_integrity,
    verify_experiment_integrity,
)
from hydroma.provenance import sha256_json
from hydroma.quality import QualityControlPolicy
from hydroma.workflow import (
    WorkflowDefinition,
    WorkflowInput,
    WorkflowQCConfig,
    WorkflowStep,
    run_workflow,
)

_MAP = {"t": "air_temperature", "u2": "wind_speed", "ea": "relative_humidity",
        "rn": "solar_radiation"}
_ET0 = ET0IntegrationConfig(variable_mapping=_MAP, elevation_m=0.0)


def _full_series(day="2026-01-01", t=20.0, precip=0.0):
    return ClimateSeries([
        ClimateObservation("air_temperature", t, "degC", day, "daily_mean", "valid"),
        ClimateObservation("wind_speed", 2.0, "m/s", day, "daily_mean", "valid"),
        ClimateObservation("relative_humidity", 50.0, "%", day, "daily_mean", "valid"),
        ClimateObservation("solar_radiation", 15.0, "MJ/m2/day", day, "daily_sum", "valid"),
        ClimateObservation("precipitation", precip, "mm", day, "daily_sum", "valid"),
    ], variable=None, temporal_resolution="1d")


def _wf(qc=None, step_inputs=None):
    step = WorkflowStep("et0", "integration", "compute_et0_series",
                        inputs=step_inputs or {},
                        input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})
    return WorkflowDefinition(workflow_id="wf", qc=qc,
                              inputs=[WorkflowInput("climate"), WorkflowInput("et0_config")],
                              steps=[step])


def _inputs(series=None):
    return {"climate": series or _full_series(), "et0_config": _ET0}


# --- canonical hashing -----------------------------------------------------

def test_canonical_json_order_independent():
    a = {"b": 1, "a": {"y": 2, "x": 1}}
    b = {"a": {"x": 1, "y": 2}, "b": 1}
    assert sha256_json(a) == sha256_json(b)


def test_hash_sensitive_to_value():
    assert sha256_json({"x": 1}) != sha256_json({"x": 2})


# --- workflow provenance ---------------------------------------------------

def test_step_provenance_has_input_output_deps():
    r = run_workflow(_wf(), _inputs())
    sp = r.provenance["step_provenance"]["et0"]
    assert sp["input_hash"]
    assert sp["output_hash"]
    assert sp["dependencies"] == []
    assert sp["status"] == "COMPLETED"


def test_workflow_provenance_hashes_present():
    r = run_workflow(_wf(), _inputs())
    prov = r.provenance
    for key in ("workflow_hash", "input_hash", "result_hash"):
        assert prov[key] and len(prov[key]) == 64
    # no qc -> qc hashes absent (legacy)
    assert prov.get("qc_hash") is None


def test_qc_evidence_in_provenance():
    qc = WorkflowQCConfig(enabled=True, policy=QualityControlPolicy())
    r = run_workflow(_wf(qc=qc), _inputs())
    prov = r.provenance
    assert prov["qc_hash"]
    assert prov["qc_config_hash"]
    sp = prov["step_provenance"]["et0"]
    assert sp["input_qc"] == "QC_PASSED"
    assert sp["input_qc_hash"]


def test_qc_config_change_changes_qc_hash():
    qc1 = WorkflowQCConfig(enabled=True, policy=QualityControlPolicy())
    qc2 = WorkflowQCConfig(enabled=True, policy=QualityControlPolicy(
        thresholds={"air_temperature": {"min": -10, "max": 50}}))
    r1 = run_workflow(_wf(qc=qc1), _inputs())
    r2 = run_workflow(_wf(qc=qc2), _inputs())
    assert r1.provenance["qc_hash"] != r2.provenance["qc_hash"]


def test_input_change_changes_result_hash():
    r1 = run_workflow(_wf(), _inputs(_full_series(t=20.0)))
    r2 = run_workflow(_wf(), _inputs(_full_series(t=30.0)))
    assert r1.provenance["result_hash"] != r2.provenance["result_hash"]


# --- experiment integrity --------------------------------------------------

def test_verify_experiment_integrity_ok():
    ed = ExperimentDefinition(experiment_id="e", workflow=_wf())
    res = run_experiment(ed, _inputs())
    v = verify_experiment_integrity(res.artifact)
    assert v["valid"] is True


def test_verify_experiment_integrity_detects_tampering():
    ed = ExperimentDefinition(experiment_id="e", workflow=_wf())
    res = run_experiment(ed, _inputs())
    a = json.loads(json.dumps(res.artifact))
    a["result_hash"] = "deadbeef" * 8
    v = verify_experiment_integrity(a)
    assert v["valid"] is False


# --- replay verification ---------------------------------------------------

def test_replay_match():
    ed = ExperimentDefinition(experiment_id="e", workflow=_wf())
    res = run_experiment(ed, _inputs())
    rep = replay_experiment(res.artifact, _inputs())
    assert rep["verification_status"] == "MATCH"
    assert rep["match"] is True


def test_replay_mismatch_on_different_inputs():
    ed = ExperimentDefinition(experiment_id="e", workflow=_wf())
    res = run_experiment(ed, _inputs(_full_series(t=20.0)))
    rep = replay_experiment(res.artifact, _inputs(_full_series(t=35.0)))
    assert rep["verification_status"] == "MISMATCH"
    assert rep["match"] is False
    assert "result" in rep["discrepancies"]


def test_replay_not_available_without_inputs():
    ed = ExperimentDefinition(experiment_id="e", workflow=_wf())
    res = run_experiment(ed, _inputs())
    a = dict(res.artifact)
    a.pop("inputs", None)
    rep = replay_experiment(a, None)
    assert rep["verification_status"] == "NOT_AVAILABLE"


def test_replay_invalid_artifact():
    rep = replay_experiment({"artifact_schema_version": "bad"})
    assert rep["verification_status"] == "NOT_AVAILABLE"


def test_replay_with_qc_match():
    qc = WorkflowQCConfig(enabled=True, policy=QualityControlPolicy())
    ed = ExperimentDefinition(experiment_id="e", workflow=_wf(qc=qc))
    res = run_experiment(ed, _inputs())
    rep = replay_experiment(res.artifact, _inputs())
    assert rep["verification_status"] == "MATCH"
    assert rep["checks"]["qc"] == "MATCH"


def test_replay_qc_mismatch_on_config_change():
    qc1 = WorkflowQCConfig(enabled=True, policy=QualityControlPolicy())
    ed = ExperimentDefinition(experiment_id="e", workflow=_wf(qc=qc1))
    res = run_experiment(ed, _inputs())
    # Tamper the stored qc config hash to simulate a changed effective policy
    a = json.loads(json.dumps(res.artifact))
    a["provenance"]["workflow"]["qc_hash"] = "tampered"
    rep = replay_experiment(a, _inputs())
    assert rep["verification_status"] == "MISMATCH"


def test_replay_does_not_mutate_original_artifact():
    ed = ExperimentDefinition(experiment_id="e", workflow=_wf())
    res = run_experiment(ed, _inputs())
    before = json.dumps(res.artifact, sort_keys=True)
    replay_experiment(res.artifact, _inputs())
    after = json.dumps(res.artifact, sort_keys=True)
    assert before == after


def test_legacy_experiment_without_qc_replay_match():
    ed = ExperimentDefinition(experiment_id="e", workflow=_wf(qc=None))
    res = run_experiment(ed, _inputs())
    rep = replay_experiment(res.artifact, _inputs())
    assert rep["verification_status"] == "MATCH"


# --- regression ------------------------------------------------------------

def test_existing_workflow_still_runs():
    assert run_workflow(_wf(), _inputs()).status == "COMPLETED"


def test_existing_et0_contract():
    from hydroma.fao56_et0 import FAO56_ET0_DEFINITION
    from hydroma.registry import validate_definition
    validate_definition(FAO56_ET0_DEFINITION)