"""Scientific data contracts & workflow validation tests (Phase 3.5).

Software/structural checks only — NOT scientific validation.
"""

import json

import pytest

from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.climate_et0 import ET0IntegrationConfig
from hydroma.contracts import (
    CONTRACTS,
    CONTRACTLESS_POLICY,
    DataContract,
    FieldSpec,
    get_contract,
    validate_contract,
)
from hydroma.workflow import (
    OPERATIONS,
    WorkflowDefinition,
    WorkflowInput,
    WorkflowStep,
    run_workflow,
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


_DAYS = [("2026-01-01", 20.0), ("2026-01-02", 26.0)]
_ET0 = ET0IntegrationConfig(variable_mapping=_MAP)


def _codes(errors):
    return {e["code"] for e in errors}


def _wf(steps, inputs=None):
    return WorkflowDefinition(workflow_id="wf", steps=steps, inputs=inputs or [])


# --- contract system -------------------------------------------------------

def test_valid_input_contract():
    c = get_contract("compute_et0_series", "input")
    v = validate_contract(c, {"series": _series(_DAYS), "config": _ET0})
    assert v.valid is True
    assert v.contract_id == "compute_et0_series.input"


def test_missing_required_field():
    c = get_contract("compute_et0_series", "input")
    v = validate_contract(c, {"config": _ET0})  # no series
    assert v.valid is False
    assert "MISSING_FIELD" in _codes(v.errors)


def test_type_mismatch_series():
    c = get_contract("compute_et0_series", "input")
    v = validate_contract(c, {"series": {"not": "a series"}})  # wrong type
    assert v.valid is False
    assert "TYPE_MISMATCH" in _codes(v.errors)


def test_optional_field_absent_ok():
    c = get_contract("compute_et0_series", "input")
    v = validate_contract(c, {"series": _series(_DAYS)})  # no config (optional)
    assert v.valid is True


def test_run_scenarios_input_contract():
    c = get_contract("run_scenarios", "input")
    v = validate_contract(c, {"series": _series(_DAYS), "scenarios": []})
    assert v.valid is True
    v2 = validate_contract(c, {"series": _series(_DAYS)})  # missing scenarios
    assert v2.valid is False


def test_output_contract_accepts_dataclass():
    c = get_contract("compute_et0_series", "output")
    # a real ET0SeriesResult-like object
    class R:
        ok = True
        records = [1, 2]
    assert validate_contract(c, R()).valid is True


def test_output_contract_rejects_bad_shape():
    c = get_contract("compute_et0_series", "output")
    class R:
        ok = True
        records = None  # not an array
    v = validate_contract(c, R())
    assert v.valid is False
    assert "TYPE_MISMATCH" in _codes(v.errors)


def test_nested_fields_contract():
    c = DataContract("t", "1.0.0", "input", "structural", {
        "rec": FieldSpec("rec", "object", required=True, fields={
            "id": FieldSpec("id", "string", required=True),
        }),
    })
    assert validate_contract(c, {"rec": {"id": "x"}}).valid is True
    v = validate_contract(c, {"rec": {}})
    assert "MISSING_FIELD" in _codes(v.errors)


def test_numeric_constraints():
    c = DataContract("t", "1.0.0", "data", "data", {
        "n": FieldSpec("n", "number", required=True, min=0.0, max=1.0, finite=True),
    })
    assert validate_contract(c, {"n": 0.5}).valid is True
    assert "CONSTRAINT_MAX" in _codes(validate_contract(c, {"n": 2.0}).errors)
    assert "CONSTRAINT_MIN" in _codes(validate_contract(c, {"n": -1.0}).errors)


def test_array_item_fields():
    c = DataContract("t", "1.0.0", "input", "structural", {
        "arr": FieldSpec("arr", "array", required=True,
                         item_fields={"v": FieldSpec("v", "number", required=True)}),
    })
    assert validate_contract(c, {"arr": [{"v": 1}, {"v": 2}]}).valid is True
    v = validate_contract(c, {"arr": [{"v": 1}, {"v": "x"}]})
    assert "TYPE_MISMATCH" in _codes(v.errors)


def test_deterministic_validation():
    c = get_contract("simulate_climate_irrigation", "input")
    data = {"series": _series(_DAYS)}
    assert validate_contract(c, data).to_dict() == validate_contract(c, data).to_dict()


def test_get_contract_unknown():
    assert get_contract("no_such_op", "input") is None
    assert get_contract("compute_et0_series", "sideways") is None


def test_contract_registry_covers_meaningful_ops():
    for op in ("compute_et0_series", "simulate_climate_soil_water",
               "simulate_climate_crop_water", "simulate_climate_irrigation", "run_scenarios"):
        assert op in CONTRACTS
        assert "input" in CONTRACTS[op] and "output" in CONTRACTS[op]


def test_contractless_policy_documented():
    assert isinstance(CONTRACTLESS_POLICY, str) and len(CONTRACTLESS_POLICY) > 0


# --- workflow integration --------------------------------------------------

def test_workflow_input_contract_failure():
    wf = _wf([WorkflowStep("et0", "integration", "compute_et0_series",
                           input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})],
             [WorkflowInput("climate"), WorkflowInput("et0_config")])
    r = run_workflow(wf, {"climate": {"not": "a series"}, "et0_config": _ET0})
    assert r.steps["et0"].status == "FAILED"
    assert r.steps["et0"].error["code"] == "CONTRACT_INPUT_INVALID"
    assert r.status == "FAILED"


def test_workflow_output_contract_failure(monkeypatch):
    class BadOut:
        ok = True
        records = None  # violates output contract (records must be array)

    monkeypatch.setitem(OPERATIONS, "compute_et0_series", lambda data: BadOut())
    wf = _wf([WorkflowStep("et0", "integration", "compute_et0_series",
                           input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})],
             [WorkflowInput("climate"), WorkflowInput("et0_config")])
    r = run_workflow(wf, {"climate": _series(_DAYS), "et0_config": _ET0})
    assert r.steps["et0"].status == "FAILED"
    assert r.steps["et0"].error["code"] == "CONTRACT_OUTPUT_INVALID"


def test_downstream_skipped_on_contract_failure():
    wf = _wf([
        WorkflowStep("et0", "integration", "compute_et0_series",
                     input_refs={"series": "workflow.climate", "config": "workflow.et0_config"}),
        WorkflowStep("crop", "integration", "simulate_climate_crop_water", dependencies=["et0"],
                     input_refs={"series": "workflow.climate"}),
    ], [WorkflowInput("climate"), WorkflowInput("et0_config")])
    r = run_workflow(wf, {"climate": {"bad": "type"}, "et0_config": _ET0})
    assert r.steps["et0"].status == "FAILED"
    assert r.steps["crop"].status == "SKIPPED"


def test_independent_step_runs_despite_contract_failure():
    wf = _wf([
        WorkflowStep("et0", "integration", "compute_et0_series",
                     input_refs={"series": "workflow.climate", "config": "workflow.et0_config"}),
        WorkflowStep("et0b", "integration", "compute_et0_series",  # independent
                     input_refs={"series": "workflow.climate", "config": "workflow.et0_config"}),
    ], [WorkflowInput("climate"), WorkflowInput("et0_config")])
    r = run_workflow(wf, {"climate": _series(_DAYS), "et0_config": _ET0})
    assert r.steps["et0"].status == "COMPLETED"
    assert r.steps["et0b"].status == "COMPLETED"


def test_contractless_model_step_runs():
    # model steps have no contract -> no contract validation (documented policy)
    wf = _wf([WorkflowStep("et0", "model", "eco-nojin.hydroma.fao56-et0",
                           inputs={"rn": 20.0, "t": 20.0, "u2": 2.0, "ea": 1.5, "z": 0.0})])
    r = run_workflow(wf, {})
    assert r.steps["et0"].status == "COMPLETED"
    assert r.steps["et0"].input_validation is None
    assert r.steps["et0"].output_validation is None


def test_provenance_records_validation_status():
    wf = _wf([WorkflowStep("et0", "integration", "compute_et0_series",
                           input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})],
             [WorkflowInput("climate"), WorkflowInput("et0_config")])
    r = run_workflow(wf, {"climate": _series(_DAYS), "et0_config": _ET0})
    prov = r.provenance["step_provenance"]["et0"]
    assert prov["input_validation"]["valid"] is True
    assert prov["input_validation"]["contract_id"] == "compute_et0_series.input"
    assert prov["output_validation"]["valid"] is True


def test_validation_result_serializable():
    c = get_contract("compute_et0_series", "input")
    v = validate_contract(c, {"series": _series(_DAYS)})
    assert json.loads(json.dumps(v.to_dict())) == v.to_dict()


def test_deterministic_with_validation():
    wf = _wf([WorkflowStep("et0", "integration", "compute_et0_series",
                           input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})],
             [WorkflowInput("climate"), WorkflowInput("et0_config")])
    r1 = run_workflow(wf, {"climate": _series(_DAYS), "et0_config": _ET0})
    r2 = run_workflow(wf, {"climate": _series(_DAYS), "et0_config": _ET0})
    assert r1.provenance["result_hash"] == r2.provenance["result_hash"]


# --- regression ------------------------------------------------------------

def test_existing_workflow_validation_unchanged():
    wf = _wf([WorkflowStep("et0", "integration", "compute_et0_series")])
    assert validate_workflow(wf)["valid"] is True