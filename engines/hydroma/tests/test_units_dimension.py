"""Scientific units & dimensional consistency tests (Phase 3.8).

Software/structural checks only — NOT scientific validation.
"""

import math

import pytest

from hydroma.units import (
    UnitError,
    BaseDimension,
    DIM_LENGTH,
    DIM_AREA,
    DIM_VELOCITY,
    DIM_TEMPERATURE,
    DIM_DIMENSIONLESS,
    get_unit,
    list_units,
    is_known_unit,
    are_compatible,
    convert_value,
    convert_difference,
    validate_unit,
)
from hydroma.contracts import DataContract, FieldSpec, validate_contract
from hydroma.workflow import WorkflowDefinition, WorkflowInput, WorkflowStep, run_workflow
from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.climate_et0 import ET0IntegrationConfig


# --- A. registry -----------------------------------------------------------

def test_known_units():
    for u in ("m", "mm", "cm", "km", "m2", "ha", "km2", "m3", "L", "s", "min", "h",
              "day", "m/s", "km/h", "m3/s", "m3/day", "kg", "g", "K", "degC", "Pa",
              "kPa", "1", "%", "J", "MJ", "MJ/m2/day", "mm/day", "mm/hour"):
        assert is_known_unit(u) is True, u


def test_unknown_unit_rejected():
    assert is_known_unit("furlong") is False
    with pytest.raises(UnitError):
        get_unit("furlong")


def test_list_units_sorted():
    units = list_units()
    assert units == sorted(units)
    assert "mm" in units


def test_dimension_definitions():
    assert get_unit("mm").dimension == DIM_LENGTH
    assert get_unit("m2").dimension == DIM_AREA
    assert get_unit("m/s").dimension == DIM_VELOCITY
    assert get_unit("degC").dimension == DIM_TEMPERATURE
    assert get_unit("%").dimension == DIM_DIMENSIONLESS


# --- B. dimensional compatibility ------------------------------------------

def test_compatible_dimensions():
    assert are_compatible("mm", "m") is True
    assert are_compatible("m2", "ha") is True
    assert are_compatible("m3/s", "m3/day") is True
    assert are_compatible("Pa", "kPa") is True
    assert are_compatible("1", "%") is True
    assert are_compatible("mm/day", "m/s") is True  # both L T^-1


def test_incompatible_dimensions():
    assert are_compatible("mm/day", "mm") is False   # L T^-1 vs L
    assert are_compatible("kg", "mm") is False
    assert are_compatible("m3", "m2") is False
    assert are_compatible("degC", "mm") is False


# --- C. conversion ---------------------------------------------------------

def test_convert_length_area_volume_time():
    assert math.isclose(convert_value(1000, "mm", "m"), 1.0)
    assert math.isclose(convert_value(1, "ha", "m2"), 10000.0)
    assert math.isclose(convert_value(1, "m3", "L"), 1000.0)
    assert math.isclose(convert_value(1, "day", "s"), 86400.0)


def test_convert_velocity_and_flow():
    assert math.isclose(convert_value(1, "m/s", "km/h"), 3.6)
    assert math.isclose(convert_value(1, "m3/s", "m3/day"), 86400.0)


def test_convert_temperature_absolute():
    assert math.isclose(convert_value(0, "degC", "K"), 273.15)
    assert math.isclose(convert_value(273.15, "K", "degC"), 0.0)
    assert math.isclose(convert_value(100, "degC", "K"), 373.15)


def test_convert_temperature_difference():
    assert math.isclose(convert_difference(1, "delta_degC", "delta_K"), 1.0)
    assert math.isclose(convert_difference(10, "delta_degC", "delta_K"), 10.0)


def test_convert_affine_mismatch_rejected():
    with pytest.raises(UnitError):
        convert_value(10, "degC", "delta_K")   # absolute -> difference
    with pytest.raises(UnitError):
        convert_value(10, "delta_degC", "K")   # difference -> absolute


def test_convert_incompatible_rejected():
    with pytest.raises(UnitError):
        convert_value(1, "mm", "kg")


def test_convert_unknown_unit_rejected():
    with pytest.raises(UnitError):
        convert_value(1, "mm", "furlong")


def test_convert_non_finite_and_type_rejected():
    with pytest.raises(UnitError):
        convert_value(float("nan"), "mm", "m")
    with pytest.raises(UnitError):
        convert_value("x", "mm", "m")


# --- D. temperature semantics ---------------------------------------------

def test_absolute_vs_difference_semantics():
    # 0 degC == 273.15 K (absolute)
    assert math.isclose(convert_value(0, "degC", "K"), 273.15)
    # a 1 degC difference == 1 K difference (no offset)
    assert math.isclose(convert_difference(1, "delta_degC", "delta_K"), 1.0)
    # degC is affine, delta_degC is not
    assert get_unit("degC").affine is True
    assert get_unit("delta_degC").affine is False


def test_validate_unit_statuses():
    assert validate_unit("mm", "m")["status"] == "UNIT_COMPATIBLE"
    assert validate_unit("mm", "mm")["status"] == "UNIT_EXACT_MATCH"
    assert validate_unit("mm", "kg")["status"] == "UNIT_INCOMPATIBLE"
    assert validate_unit("bogus", "m")["status"] == "UNIT_UNKNOWN"


# --- E. contracts ----------------------------------------------------------

def _unit_contract():
    return DataContract("t", "1.0.0", "input", "data", {
        "depth": FieldSpec("depth", "number", required=True, unit="mm"),
    })


def test_contract_no_unit_field_backward_compatible():
    c = DataContract("t", "1.0.0", "input", "structural", {
        "n": FieldSpec("n", "number", required=True),
    })
    v = validate_contract(c, {"n": 1.0})
    assert v.valid is True
    assert v.units == []


def test_contract_exact_unit_match():
    v = validate_contract(_unit_contract(), {"depth": {"value": 1000, "unit": "mm"}})
    assert v.valid is True
    assert v.units[0]["status"] == "UNIT_EXACT_MATCH"


def test_contract_compatible_unit():
    v = validate_contract(_unit_contract(), {"depth": {"value": 1, "unit": "m"}})
    assert v.valid is True
    assert v.units[0]["status"] == "UNIT_COMPATIBLE"


def test_contract_incompatible_unit():
    v = validate_contract(_unit_contract(), {"depth": {"value": 1, "unit": "kg"}})
    assert v.valid is False
    assert "UNIT_INCOMPATIBLE" in {e["code"] for e in v.errors}


def test_contract_unknown_unit():
    v = validate_contract(_unit_contract(), {"depth": {"value": 1, "unit": "bogus"}})
    assert v.valid is False
    assert "UNIT_UNKNOWN" in {e["code"] for e in v.errors}


def test_contract_missing_unit_metadata():
    v = validate_contract(_unit_contract(), {"depth": 1000})
    assert v.valid is True  # missing unit metadata is a documented gap, not a failure
    assert v.units[0]["status"] == "UNIT_MISSING"


def test_contract_nested_and_array_units():
    c = DataContract("t", "1.0.0", "input", "structural", {
        "items": FieldSpec("items", "array", required=True, item_fields={
            "d": FieldSpec("d", "number", required=True, unit="mm"),
        }),
    })
    v = validate_contract(c, {"items": [{"d": {"value": 1, "unit": "cm"}}]})
    assert v.valid is True
    assert v.units[0]["path"] == "items[0].d"
    assert v.units[0]["status"] == "UNIT_COMPATIBLE"


def test_validation_result_serializable():
    v = validate_contract(_unit_contract(), {"depth": {"value": 1, "unit": "kg"}})
    import json
    assert json.loads(json.dumps(v.to_dict())) == v.to_dict()


# --- F. workflow integration ----------------------------------------------

def _series(days=(("2026-01-01", 20.0),)):
    rows = []
    for day, t in days:
        rows += [ClimateObservation("air_temperature", t, "degC", day, "daily_mean", "valid"),
                 ClimateObservation("wind_speed", 2.0, "m/s", day, "daily_mean", "valid"),
                 ClimateObservation("relative_humidity", 50.0, "%", day, "daily_mean", "valid"),
                 ClimateObservation("solar_radiation", 15.0, "MJ/m2/day", day, "daily_sum", "valid"),
                 ClimateObservation("precipitation", 0.0, "mm", day, "daily_sum", "valid")]
    return ClimateSeries(rows, variable=None, temporal_resolution="1d")


_MAP = {"t": "air_temperature", "u2": "wind_speed", "ea": "relative_humidity",
        "rn": "solar_radiation"}


def _unit_contract_input():
    return DataContract("compute_et0_series.input", "1.0.0", "input", "structural", {
        "series": FieldSpec("series", "object", required=True, expected_class=ClimateSeries),
        "config": FieldSpec("config", "object", required=False, expected_class=ET0IntegrationConfig),
        "amount": FieldSpec("amount", "number", required=True, unit="mm"),
    })


def test_workflow_unit_incompatible_blocks_step(monkeypatch):
    from hydroma import workflow as wf_mod
    monkeypatch.setattr(wf_mod, "get_contract",
                        lambda op, d: _unit_contract_input() if (op == "compute_et0_series" and d == "input") else None)
    wf = WorkflowDefinition(
        workflow_id="w", inputs=[WorkflowInput("climate"), WorkflowInput("et0_config")],
        steps=[WorkflowStep("et0", "integration", "compute_et0_series",
                            inputs={"amount": {"value": 1, "unit": "kg"}},
                            input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})],
    )
    r = run_workflow(wf, {"climate": _series(), "et0_config": ET0IntegrationConfig(variable_mapping=_MAP)})
    assert r.steps["et0"].status == "FAILED"
    assert r.steps["et0"].error["code"] == "CONTRACT_INPUT_INVALID"
    assert r.steps["et0"].input_validation["units"][0]["status"] == "UNIT_INCOMPATIBLE"


def test_workflow_unit_compatible_runs(monkeypatch):
    from hydroma import workflow as wf_mod
    monkeypatch.setattr(wf_mod, "get_contract",
                        lambda op, d: _unit_contract_input() if (op == "compute_et0_series" and d == "input") else None)
    wf = WorkflowDefinition(
        workflow_id="w", inputs=[WorkflowInput("climate"), WorkflowInput("et0_config")],
        steps=[WorkflowStep("et0", "integration", "compute_et0_series",
                            inputs={"amount": {"value": 1000, "unit": "m"}},
                            input_refs={"series": "workflow.climate", "config": "workflow.et0_config"})],
    )
    r = run_workflow(wf, {"climate": _series(), "et0_config": ET0IntegrationConfig(variable_mapping=_MAP)})
    assert r.steps["et0"].status == "COMPLETED"


def test_workflow_unit_failure_skips_dependent(monkeypatch):
    from hydroma import workflow as wf_mod
    monkeypatch.setattr(wf_mod, "get_contract",
                        lambda op, d: _unit_contract_input() if (op == "compute_et0_series" and d == "input") else None)
    wf = WorkflowDefinition(
        workflow_id="w", inputs=[WorkflowInput("climate"), WorkflowInput("et0_config")],
        steps=[
            WorkflowStep("et0", "integration", "compute_et0_series",
                         inputs={"amount": {"value": 1, "unit": "kg"}},
                         input_refs={"series": "workflow.climate", "config": "workflow.et0_config"}),
            WorkflowStep("next", "integration", "compute_et0_series", dependencies=["et0"],
                         inputs={"amount": {"value": 1, "unit": "mm"}},
                         input_refs={"series": "workflow.climate", "config": "workflow.et0_config"}),
        ],
    )
    r = run_workflow(wf, {"climate": _series(), "et0_config": ET0IntegrationConfig(variable_mapping=_MAP)})
    assert r.steps["et0"].status == "FAILED"
    assert r.steps["next"].status == "SKIPPED"


def test_workflow_unit_failure_independent_continues(monkeypatch):
    from hydroma import workflow as wf_mod
    monkeypatch.setattr(wf_mod, "get_contract",
                        lambda op, d: _unit_contract_input() if (op == "compute_et0_series" and d == "input") else None)
    wf = WorkflowDefinition(
        workflow_id="w", inputs=[WorkflowInput("climate"), WorkflowInput("et0_config")],
        steps=[
            WorkflowStep("a", "integration", "compute_et0_series",
                         inputs={"amount": {"value": 1, "unit": "kg"}},
                         input_refs={"series": "workflow.climate", "config": "workflow.et0_config"}),
            WorkflowStep("b", "integration", "compute_et0_series",  # independent
                         inputs={"amount": {"value": 1, "unit": "mm"}},
                         input_refs={"series": "workflow.climate", "config": "workflow.et0_config"}),
        ],
    )
    r = run_workflow(wf, {"climate": _series(), "et0_config": ET0IntegrationConfig(variable_mapping=_MAP)})
    assert r.steps["a"].status == "FAILED"
    assert r.steps["b"].status == "COMPLETED"


# --- G. regression ---------------------------------------------------------

def test_existing_units_helpers_unchanged():
    from hydroma.units import convert, is_known, SUPPORTED_UNITS
    assert is_known("mm") is True
    assert math.isclose(convert(1000, "mm", "m"), 1.0)
    assert "mm" in SUPPORTED_UNITS


def test_existing_contracts_no_unit_fields():
    from hydroma.contracts import get_contract
    c = get_contract("compute_et0_series", "input")
    v = validate_contract(c, {"series": _series()})
    assert v.valid is True