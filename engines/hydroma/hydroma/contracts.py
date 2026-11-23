"""Scientific data contracts & validation (Phase 3.5).

A lightweight, dependency-free contract layer that describes the **shape** of data
passed between workflow operations and validates it at runtime. It distinguishes:

* **structural** validation — required fields present, expected types/shapes, units,
  serializability;
* **data** validation — finite numbers, declared numeric constraints;

and explicitly **not** scientific validation (no calibration/accuracy/field claims).

Contracts are associated with workflow operations through a bounded registry
(:data:`CONTRACTS`). Operations without a declared contract are handled explicitly
(contractless → no contract validation; documented policy).

The system is intentionally small: a :class:`FieldSpec` tree + :class:`DataContract`,
validated by :func:`validate_contract`. No JSON-Schema, no plugin system, no deps.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Sequence

from .climate import ClimateSeries
from .climate_et0 import ET0IntegrationConfig
from .crop_water_series import CropWaterSeriesConfig
from .irrigation_series import IrrigationSeriesConfig
from .soil_water_series import SoilWaterSeriesConfig
from .units import validate_unit

__all__ = [
    "FieldSpec",
    "DataContract",
    "ValidationResult",
    "CONTRACTS",
    "validate_contract",
    "validate_data",
    "get_contract",
    "CONTRACTLESS_POLICY",
]

# Policy for operations with no declared contract.
CONTRACTLESS_POLICY = (
    "Operations without a declared contract are executed without contract "
    "validation; their inputs/outputs are trusted to the underlying model. This "
    "is explicit and does not invent a contract."
)


def _err(code: str, path: str, message: str) -> Dict[str, Any]:
    return {"code": code, "path": path, "message": message}


def _is_number(v: Any) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(float(v))


def _get_field(obj: Any, name: str) -> Any:
    if isinstance(obj, dict):
        return obj.get(name)
    return getattr(obj, name, None)


def _has_field(obj: Any, name: str) -> bool:
    if isinstance(obj, dict):
        return name in obj
    return hasattr(obj, name)


# --- field / contract model ------------------------------------------------

@dataclass
class FieldSpec:
    """A field contract: type, requirement, unit, constraints and nested shape."""

    name: str
    type: str = "any"                 # "any"|"object"|"array"|"string"|"number"|"boolean"
    required: bool = False
    unit: Optional[str] = None
    min: Optional[float] = None
    max: Optional[float] = None
    finite: bool = False
    expected_class: Optional[type] = None      # for type="object"
    fields: Optional[Dict[str, "FieldSpec"]] = None   # nested object fields
    item_type: Optional[str] = None            # for type="array"
    item_fields: Optional[Dict[str, "FieldSpec"]] = None  # per-item nested shape


@dataclass
class DataContract:
    """A named, versioned contract for one direction (input/output) of an operation."""

    contract_id: str
    version: str
    direction: str                    # "input" | "output"
    category: str                     # "structural" | "data"
    fields: Dict[str, FieldSpec]


@dataclass
class ValidationResult:
    """Structured, deterministic validation outcome."""

    valid: bool
    category: str
    contract_id: Optional[str]
    contract_version: Optional[str]
    errors: List[Dict[str, Any]]
    warnings: List[Dict[str, Any]]
    units: List[Dict[str, Any]] = field(default_factory=list)
    unit_policy: str = "LEGACY"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "valid": self.valid,
            "category": self.category,
            "contract_id": self.contract_id,
            "contract_version": self.contract_version,
            "errors": self.errors,
            "warnings": self.warnings,
            "units": self.units,
            "unit_policy": self.unit_policy,
        }


def _validate_value(spec: FieldSpec, value: Any, path: str,
                    errors: List[Dict[str, Any]], warnings: List[Dict[str, Any]],
                    units: Optional[List[Dict[str, Any]]] = None,
                    unit_policy: str = "LEGACY") -> None:
    if units is None:
        units = []

    # --- unit validation (only when the field declares an expected unit) ---
    if spec.unit is not None:
        if isinstance(value, dict) and "value" in value and "unit" in value:
            qv, qunit = value.get("value"), value.get("unit")
            if not _is_number(qv):
                errors.append(_err("TYPE_MISMATCH", path,
                                   f"expected finite number, got {type(qv).__name__}"))
            status = validate_unit(qunit, spec.unit)
            units.append({"path": path, **status})
            if status["status"] == "UNIT_UNKNOWN":
                errors.append(_err("UNIT_UNKNOWN", path,
                                   f"unknown unit {qunit!r} for field {path!r}"))
            elif status["status"] == "UNIT_INCOMPATIBLE":
                errors.append(_err("UNIT_INCOMPATIBLE", path,
                                   f"unit {qunit!r} is dimensionally incompatible with "
                                   f"expected {spec.unit!r}"))
            return
        elif _is_number(value) or spec.type == "number":
            units.append({"path": path, "status": "UNIT_MISSING",
                          "actual_unit": None, "expected_unit": spec.unit})
            if unit_policy == "STRICT":
                errors.append(_err(
                    "UNIT_MISSING", path,
                    f"field {path!r} declares unit {spec.unit!r} but the value has no "
                    f"unit metadata (STRICT unit policy)"))
            # LEGACY: missing unit metadata is a documented gap, not a failure

    t = spec.type
    if t == "any":
        return
    if t == "number":
        if not _is_number(value):
            errors.append(_err("TYPE_MISMATCH", path, f"expected finite number, got {type(value).__name__}"))
            return
        if spec.min is not None and value < spec.min:
            errors.append(_err("CONSTRAINT_MIN", path, f"value {value} < min {spec.min}"))
        if spec.max is not None and value > spec.max:
            errors.append(_err("CONSTRAINT_MAX", path, f"value {value} > max {spec.max}"))
        return
    if t == "string":
        if not isinstance(value, str):
            errors.append(_err("TYPE_MISMATCH", path, f"expected string, got {type(value).__name__}"))
        return
    if t == "boolean":
        if not isinstance(value, bool):
            errors.append(_err("TYPE_MISMATCH", path, f"expected boolean, got {type(value).__name__}"))
        return
    if t == "array":
        if not isinstance(value, (list, tuple)):
            errors.append(_err("TYPE_MISMATCH", path, f"expected array, got {type(value).__name__}"))
            return
        if spec.item_type == "number":
            for i, item in enumerate(value):
                if not _is_number(item):
                    errors.append(_err("TYPE_MISMATCH", f"{path}[{i}]",
                                       f"expected number item, got {type(item).__name__}"))
        if spec.item_fields:
            for i, item in enumerate(value):
                for name, fspec in spec.item_fields.items():
                    if fspec.required and not _has_field(item, name):
                        errors.append(_err("MISSING_FIELD", f"{path}[{i}].{name}",
                                           f"missing required field {name!r}"))
                    elif _has_field(item, name):
                        _validate_value(fspec, _get_field(item, name), f"{path}[{i}].{name}",
                                        errors, warnings, units, unit_policy)
        return
    if t == "object":
        if spec.expected_class is not None:
            if not isinstance(value, spec.expected_class):
                errors.append(_err("TYPE_MISMATCH", path,
                                   f"expected {spec.expected_class.__name__}, "
                                   f"got {type(value).__name__}"))
                return
        elif not isinstance(value, dict):
            errors.append(_err("TYPE_MISMATCH", path, f"expected object, got {type(value).__name__}"))
            return
        if spec.fields:
            for name, fspec in spec.fields.items():
                if fspec.required and not _has_field(value, name):
                    errors.append(_err("MISSING_FIELD", f"{path}.{name}",
                                       f"missing required field {name!r}"))
                elif _has_field(value, name):
                    _validate_value(fspec, _get_field(value, name), f"{path}.{name}",
                                    errors, warnings, units, unit_policy)
        return


def validate_contract(contract: DataContract, data: Any,
                      unit_policy: str = "LEGACY") -> ValidationResult:
    """Validate ``data`` against ``contract``; returns a structured, deterministic result.

    ``data`` may be a mapping (e.g. workflow kwargs) or an object/dataclass (e.g. an
    integration result); fields are read via key or attribute.

    ``unit_policy`` selects unit enforcement for fields that declare ``FieldSpec.unit``:
    ``LEGACY`` (default) records a plain number without unit metadata as ``UNIT_MISSING``
    (a documented gap, no failure); ``STRICT`` treats it as a ``UNIT_MISSING`` **error**.
    In both policies, an unknown/incompatible unit is an error.
    """
    if unit_policy not in ("LEGACY", "STRICT"):
        unit_policy = "LEGACY"
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []
    units: List[Dict[str, Any]] = []

    if data is None:
        errors.append(_err("TYPE_MISMATCH", "$", "expected an object, got None"))
        return ValidationResult(False, contract.category, contract.contract_id, contract.version,
                                errors, warnings, units, unit_policy)

    for name, spec in contract.fields.items():
        if spec.required and not _has_field(data, name):
            errors.append(_err("MISSING_FIELD", name, f"missing required field {name!r}"))
            continue
        if _has_field(data, name):
            _validate_value(spec, _get_field(data, name), name, errors, warnings, units, unit_policy)

    return ValidationResult(len(errors) == 0, contract.category, contract.contract_id,
                            contract.version, errors, warnings, units, unit_policy)


def validate_data(contract: DataContract, data: Any) -> ValidationResult:
    """Alias for :func:`validate_contract`."""
    return validate_contract(contract, data)


# --- contract registry -----------------------------------------------------

def _in_series():
    return FieldSpec("series", "object", required=True, expected_class=ClimateSeries,
                     unit=None)


_ET0_OUTPUT = DataContract(
    contract_id="compute_et0_series.output", version="1.0.0", direction="output",
    category="structural",
    fields={
        "ok": FieldSpec("ok", "boolean", required=True),
        "records": FieldSpec("records", "array", required=True),
    },
)

_SOIL_OUTPUT = DataContract(
    contract_id="simulate_climate_soil_water.output", version="1.0.0", direction="output",
    category="structural",
    fields={
        "ok": FieldSpec("ok", "boolean", required=True),
        "records": FieldSpec("records", "array", required=True),
    },
)

_CROP_OUTPUT = DataContract(
    contract_id="simulate_climate_crop_water.output", version="1.0.0", direction="output",
    category="structural",
    fields={
        "ok": FieldSpec("ok", "boolean", required=True),
        "records": FieldSpec("records", "array", required=True),
    },
)

_IRRIGATION_OUTPUT = DataContract(
    contract_id="simulate_climate_irrigation.output", version="1.0.0", direction="output",
    category="structural",
    fields={
        "ok": FieldSpec("ok", "boolean", required=True),
        "records": FieldSpec("records", "array", required=True),
    },
)

_SCENARIO_OUTPUT = DataContract(
    contract_id="run_scenarios.output", version="1.0.0", direction="output",
    category="structural",
    fields={
        "ok": FieldSpec("ok", "boolean", required=True),
        "results": FieldSpec("results", "array", required=True),
        "comparison": FieldSpec("comparison", "object", required=True),
    },
)


def _series_input_contract(contract_id: str, config_class: type) -> DataContract:
    return DataContract(
        contract_id=contract_id, version="1.0.0", direction="input", category="structural",
        fields={
            "series": _in_series(),
            "config": FieldSpec("config", "object", required=False, expected_class=config_class),
        },
    )


CONTRACTS: Dict[str, Dict[str, DataContract]] = {
    "assess_climate_quality": {
        "input": DataContract(
            contract_id="assess_climate_quality.input", version="1.0.0", direction="input",
            category="structural",
            fields={
                "series": FieldSpec("series", "object", required=True, expected_class=ClimateSeries),
                "policy": FieldSpec("policy", "any", required=False),
            },
        ),
        "output": DataContract(
            contract_id="assess_climate_quality.output", version="1.0.0", direction="output",
            category="structural",
            fields={
                "ok": FieldSpec("ok", "boolean", required=True),
                "status": FieldSpec("status", "string", required=True),
            },
        ),
    },
    "compute_et0_series": {
        "input": _series_input_contract("compute_et0_series.input", ET0IntegrationConfig),
        "output": _ET0_OUTPUT,
    },
    "simulate_climate_soil_water": {
        "input": _series_input_contract("simulate_climate_soil_water.input", SoilWaterSeriesConfig),
        "output": _SOIL_OUTPUT,
    },
    "simulate_climate_crop_water": {
        "input": _series_input_contract("simulate_climate_crop_water.input", CropWaterSeriesConfig),
        "output": _CROP_OUTPUT,
    },
    "simulate_climate_irrigation": {
        "input": _series_input_contract("simulate_climate_irrigation.input", IrrigationSeriesConfig),
        "output": _IRRIGATION_OUTPUT,
    },
    "run_scenarios": {
        "input": DataContract(
            contract_id="run_scenarios.input", version="1.0.0", direction="input",
            category="structural",
            fields={
                "series": _in_series(),
                "scenarios": FieldSpec("scenarios", "array", required=True),
                "et0_config": FieldSpec("et0_config", "object", required=False,
                                        expected_class=ET0IntegrationConfig),
                "start_date": FieldSpec("start_date", "string", required=False),
                "end_date": FieldSpec("end_date", "string", required=False),
            },
        ),
        "output": _SCENARIO_OUTPUT,
    },
}


def get_contract(operation: str, direction: str) -> Optional[DataContract]:
    """Return the contract for an operation/direction, or ``None`` if none is declared."""
    entry = CONTRACTS.get(operation)
    if not entry:
        return None
    return entry.get(direction)