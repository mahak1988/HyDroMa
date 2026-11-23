"""Generic workflow QC integration tests (Phase 3.11).

Software/integration checks only — NOT scientific validation.
"""

import json
import math

import pytest

from hydroma.climate import ClimateObservation, ClimateSeries, SpatialContext
from hydroma.climate_et0 import ET0IntegrationConfig
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


def _full_series(day="2026-01-01", t=20.0, precip=0.0, quality="valid", crs=None):
    s = ClimateSeries([
        ClimateObservation("air_temperature", t, "degC", day, "daily_mean", quality),
        ClimateObservation("wind_speed", 2.0, "m/s", day, "daily_mean", quality),
        ClimateObservation("relative_humidity", 50.0, "%", day, "daily_mean", quality),
        ClimateObservation("solar_radiation", 15.0, "MJ/m2/day", day, "daily_sum", quality),
        ClimateObservation("precipitation", precip, "mm", day, "daily_sum", quality),
    ], variable=None, temporal_resolution="1d")
    if crs is not None:
        s.spatial = SpatialContext(latitude=999.0, longitude=999.0, crs=crs)
    return s


def _et0_step(sid="et0", deps=None):
    return WorkflowStep(sid, "integration", "compute_et0_series", dependencies=deps or [],
                        input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})


def _wf(steps, qc=None, unit_policy="LEGACY"):
    return WorkflowDefinition(workflow_id="wf", unit_policy=unit_policy, qc=qc,
                              inputs=[WorkflowInput("climate"), WorkflowInput("et0_config")],
                              steps=steps)


def _run(series, qc, steps=None, extra=None):
    inputs = {"climate": series, "et0_config": _ET0}
    if extra:
        inputs.update(extra)
    return run_workflow(_wf(steps or [_et0_step()], qc=qc), inputs)


# --- configuration / compatibility ----------------------------------------

def test_legacy_no_qc_config_runs():
    r = run_workflow(_wf([_et0_step()], qc=None), {"climate": _full_series(), "et0_config": _ET0})
    assert r.status == "COMPLETED"
    assert r.steps["et0"].input_qc is None
    assert r.provenance.get("qc_config") is None


def test_qc_disabled_runs():
    r = _run(_full_series(), WorkflowQCConfig(enabled=False))
    assert r.status == "COMPLETED"
    assert r.steps["et0"].input_qc is None


def test_qc_config_deterministic_hash():
    qc1 = WorkflowQCConfig(enabled=True, policy=QualityControlPolicy())
    qc2 = WorkflowQCConfig(enabled=True, policy=QualityControlPolicy())
    r1 = _run(_full_series(), qc1)
    r2 = _run(_full_series(), qc2)
    assert r1.provenance["qc_hash"] == r2.provenance["qc_hash"]
    assert r1.provenance["qc_config_hash"] == r2.provenance["qc_config_hash"]


# --- input QC --------------------------------------------------------------

def test_input_qc_passed():
    r = _run(_full_series(), WorkflowQCConfig(enabled=True))
    assert r.status == "COMPLETED"
    assert r.steps["et0"].input_qc["status"] == "QC_PASSED"


def test_input_qc_warning_nonblocking():
    policy = QualityControlPolicy(thresholds={"air_temperature": {"min": -10, "max": 50}})
    r = _run(_full_series(t=60.0), WorkflowQCConfig(enabled=True, policy=policy))
    assert r.status == "COMPLETED"
    assert r.steps["et0"].input_qc["status"] == "QC_WARNING"


def test_input_qc_blocking_error():
    r = _run(_full_series(precip=-5.0), WorkflowQCConfig(enabled=True))
    assert r.status == "FAILED"
    assert r.steps["et0"].status == "FAILED"
    assert r.steps["et0"].input_qc["status"] == "QC_BLOCKED"


def test_input_qc_nonblocking_error():
    policy = QualityControlPolicy(error_blocks_execution=False)
    r = _run(_full_series(precip=-5.0), WorkflowQCConfig(enabled=True, policy=policy))
    assert r.steps["et0"].input_qc["status"] == "QC_WARNING"
    assert r.steps["et0"].status == "COMPLETED"


def test_input_qc_blocking_warning():
    policy = QualityControlPolicy(thresholds={"air_temperature": {"min": -10, "max": 50}},
                                 warn_blocks_execution=True)
    r = _run(_full_series(t=60.0), WorkflowQCConfig(enabled=True, policy=policy))
    assert r.steps["et0"].input_qc["status"] == "QC_BLOCKED"
    assert r.steps["et0"].status == "FAILED"


def test_qc_unavailable_nonblocking():
    # model step with numeric inputs (no ClimateSeries) -> QC_UNAVAILABLE, runs
    step = WorkflowStep("m", "model", "eco-nojin.hydroma.fao56-et0",
                        inputs={"rn": 20.0, "t": 20.0, "u2": 2.0, "ea": 1.5, "z": 0.0})
    wf = WorkflowDefinition(workflow_id="wf", qc=WorkflowQCConfig(enabled=True), steps=[step])
    r = run_workflow(wf, {})
    assert r.steps["m"].input_qc["status"] == "QC_UNAVAILABLE"
    assert r.steps["m"].status == "COMPLETED"


def test_qc_unavailable_skip():
    step = WorkflowStep("m", "model", "eco-nojin.hydroma.fao56-et0",
                        inputs={"rn": 20.0, "t": 20.0, "u2": 2.0, "ea": 1.5, "z": 0.0})
    wf = WorkflowDefinition(workflow_id="wf",
                            qc=WorkflowQCConfig(enabled=True, on_unavailable="skip"), steps=[step])
    r = run_workflow(wf, {})
    assert r.steps["m"].status == "SKIPPED"
    assert r.steps["m"].input_qc["status"] == "QC_UNAVAILABLE"


# --- output QC -------------------------------------------------------------

def test_output_qc_unavailable_for_result_object():
    # ET0 result is not a ClimateSeries -> output QC QC_UNAVAILABLE, step completes
    r = _run(_full_series(), WorkflowQCConfig(enabled=True))
    assert r.steps["et0"].output_qc["status"] == "QC_UNAVAILABLE"
    assert r.steps["et0"].status == "COMPLETED"


# --- dependency blocking ---------------------------------------------------

def test_qc_block_skips_dependent():
    r = _run(_full_series(precip=-5.0), WorkflowQCConfig(enabled=True),
             steps=[_et0_step("a"), _et0_step("b", deps=["a"])])
    assert r.steps["a"].status == "FAILED"
    assert r.steps["b"].status == "SKIPPED"


def test_qc_block_independent_continues():
    # 'a' is blocked by input QC; 'b' is an independent model step (no ClimateSeries)
    b = WorkflowStep("b", "model", "eco-nojin.hydroma.fao56-et0",
                     inputs={"rn": 20.0, "t": 20.0, "u2": 2.0, "ea": 1.5, "z": 0.0})
    r = _run(_full_series(precip=-5.0), WorkflowQCConfig(enabled=True),
             steps=[_et0_step("a"), b])
    assert r.steps["a"].status == "FAILED"
    assert r.steps["b"].status == "COMPLETED"


# --- provenance / hashing --------------------------------------------------

def test_provenance_has_qc_evidence():
    r = _run(_full_series(), WorkflowQCConfig(enabled=True))
    prov = r.provenance
    assert prov["qc_config"] is not None
    assert prov["qc_config_hash"]
    assert prov["qc_hash"]
    assert prov["qc_step_status"]["et0"]["input"] == "QC_PASSED"


def test_qc_config_change_changes_hashes():
    qc1 = WorkflowQCConfig(enabled=True, policy=QualityControlPolicy())
    qc2 = WorkflowQCConfig(enabled=True, policy=QualityControlPolicy(
        thresholds={"air_temperature": {"min": -10, "max": 50}}))
    r1 = _run(_full_series(), qc1)
    r2 = _run(_full_series(), qc2)
    assert r1.provenance["qc_hash"] != r2.provenance["qc_hash"]
    assert r1.provenance["result_hash"] != r2.provenance["result_hash"]


def test_result_hash_deterministic_with_qc():
    qc = WorkflowQCConfig(enabled=True)
    r1 = _run(_full_series(), qc)
    r2 = _run(_full_series(), qc)
    assert r1.provenance["result_hash"] == r2.provenance["result_hash"]


# --- CRS safety (workflow QC must not lat/lon-check projected coords) -------

def test_qc_crs_safety_projected():
    r = _run(_full_series(crs="EPSG:32633"), WorkflowQCConfig(enabled=True))
    assert r.status == "COMPLETED"
    assert "RULE-LAT-RANGE" not in r.steps["et0"].input_qc.get("rules_applied", [])


# --- regression ------------------------------------------------------------

def test_existing_workflow_without_qc_unchanged():
    from hydroma.workflow import run_workflow as rw
    wf = WorkflowDefinition(workflow_id="w",
                            inputs=[WorkflowInput("climate"), WorkflowInput("et0_config")],
                            steps=[_et0_step()])
    r = rw(wf, {"climate": _full_series(), "et0_config": _ET0})
    assert r.status == "COMPLETED"
    assert r.provenance.get("qc_config") is None


# --- experiment / replay preserves QC --------------------------------------

def test_experiment_preserves_qc_and_replay():
    from hydroma.experiment import ExperimentDefinition, replay_experiment, run_experiment
    wf = _wf([_et0_step()], qc=WorkflowQCConfig(enabled=True))
    ed = ExperimentDefinition(experiment_id="e", workflow=wf)
    inputs = {"climate": _full_series(), "et0_config": _ET0}
    res = run_experiment(ed, inputs)
    assert res.artifact["definition"]["workflow"]["qc"]["enabled"] is True
    replay = replay_experiment(res.artifact, inputs)
    assert replay["match"] is True
    assert replay["new_artifact"]["definition"]["workflow"]["qc"]["enabled"] is True


def test_legacy_experiment_without_qc_replay():
    from hydroma.experiment import ExperimentDefinition, replay_experiment, run_experiment
    wf = _wf([_et0_step()], qc=None)
    ed = ExperimentDefinition(experiment_id="e", workflow=wf)
    inputs = {"climate": _full_series(), "et0_config": _ET0}
    res = run_experiment(ed, inputs)
    assert res.artifact["definition"]["workflow"]["qc"] is None
    replay = replay_experiment(res.artifact, inputs)
    assert replay["match"] is True