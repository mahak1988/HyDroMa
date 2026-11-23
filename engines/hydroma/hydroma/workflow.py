"""HyDroMA Scientific Workflow Layer (Phase 3.4).

A bounded, deterministic orchestration layer that runs existing HyDroMA models and
integrations through explicit, validated workflow definitions. It sits **above** the
models/integrations and adds no scientific calculation of its own.

What it provides
----------------
* structured workflow definitions (:class:`WorkflowDefinition`, :class:`WorkflowStep`),
* validation (unique ids, valid step types/operations, dependency existence, cycle
  detection, input-reference integrity),
* deterministic topological execution order,
* explicit input resolution (workflow inputs / upstream step outputs / literal config),
* safe operation resolution through a fixed mapping — **no** ``eval``/``exec``/
  dynamic import/plugin loading,
* per-step and workflow status, structured results, failure propagation
  (downstream steps are skipped after an upstream failure; no silent recovery),
* deterministic provenance (workflow hash, input hash, per-step provenance, result hash).

Step types (bounded)
--------------------
* ``model``       — execute a registered model via the existing :class:`ModelRegistry`
                    (``operation`` = ``model_id`` or ``model_id@version``).
* ``integration`` — execute a supported integration (``operation`` ∈ ``OPERATIONS``):
                    ``compute_et0_series``, ``simulate_climate_soil_water``,
                    ``simulate_climate_crop_water``, ``simulate_climate_irrigation``.
* ``scenario``    — execute the Scenario Engine (``operation`` = ``run_scenarios``).

Software maturity ``tested``; scientific maturity **NOT_VALIDATED**.
"""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass, field, is_dataclass
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple

from .climate_et0 import compute_et0_series
from .contracts import get_contract, validate_contract
from .climate import ClimateSeries
from .quality import QualityControlPolicy, assess_climate_quality, qc_blocks_execution
from .crop_water_series import simulate_climate_crop_water
from .irrigation_series import simulate_climate_irrigation
from .provenance import sha256_json
from .scenario import run_scenarios
from .soil_water_series import simulate_climate_soil_water

__all__ = [
    "WorkflowInput",
    "WorkflowStep",
    "WorkflowDefinition",
    "StepResult",
    "WorkflowResult",
    "WORKFLOW_LAYER_ID",
    "WORKFLOW_LAYER_VERSION",
    "STEP_TYPES",
    "OPERATIONS",
    "validate_workflow",
    "topological_order",
    "run_workflow",
    "example_climate_irrigation_workflow",
]

WORKFLOW_LAYER_ID = "eco-nojin.hydroma.workflow"
WORKFLOW_LAYER_VERSION = "1.0.0"

STEP_TYPES = ("model", "integration", "scenario")

# Status literals.
WORKFLOW_STATES = ("PENDING", "RUNNING", "COMPLETED", "FAILED", "PARTIAL")
STEP_STATES = ("PENDING", "RUNNING", "COMPLETED", "FAILED", "SKIPPED")

# --- safe operation registry ----------------------------------------------
# Each adapter takes a single resolved ``data`` dict and returns the underlying
# integration result. No arbitrary code is executed.

def _op_compute_et0(data: Dict[str, Any]):
    return compute_et0_series(data["series"], data.get("config"))


def _op_soil_water(data: Dict[str, Any]):
    return simulate_climate_soil_water(data["series"], data.get("config"))


def _op_crop_water(data: Dict[str, Any]):
    return simulate_climate_crop_water(data["series"], data.get("config"))


def _op_irrigation(data: Dict[str, Any]):
    return simulate_climate_irrigation(data["series"], data.get("config"))


def _op_scenarios(data: Dict[str, Any]):
    return run_scenarios(data["series"], data["scenarios"], data.get("et0_config"),
                         data.get("start_date"), data.get("end_date"))


def _op_quality(data: Dict[str, Any]):
    from .quality import assess_climate_quality
    report = assess_climate_quality(data["series"], data.get("policy"))
    return {
        "ok": report.status != "REJECTED",
        "status": report.status,
        "unit_policy": report.unit_policy,
        "counts_by_severity": report.counts_by_severity,
        "counts_by_state": report.counts_by_state,
        "flags": report.flags,
        "rules_applied": report.rules_applied,
    }


OPERATIONS: Dict[str, Callable[[Dict[str, Any]], Any]] = {
    "compute_et0_series": _op_compute_et0,
    "simulate_climate_soil_water": _op_soil_water,
    "simulate_climate_crop_water": _op_crop_water,
    "simulate_climate_irrigation": _op_irrigation,
    "run_scenarios": _op_scenarios,
    "assess_climate_quality": _op_quality,
}


def _err(code: str, field_name: str, message: str, **extra) -> Dict[str, Any]:
    d = {"code": code, "field": field_name, "message": message}
    d.update(extra)
    return d


def _is_non_empty_str(v: Any) -> bool:
    return isinstance(v, str) and len(v.strip()) > 0


# --- definition ------------------------------------------------------------

@dataclass
class WorkflowInput:
    """A declared workflow-level input."""

    name: str
    required: bool = True
    description: str = ""


@dataclass
class WorkflowStep:
    """A single workflow step (bounded operation + dependencies + input mapping)."""

    step_id: str
    step_type: str
    operation: str
    dependencies: List[str] = field(default_factory=list)
    inputs: Dict[str, Any] = field(default_factory=dict)
    input_refs: Dict[str, str] = field(default_factory=dict)
    description: str = ""


@dataclass
class WorkflowQCConfig:
    """Optional workflow-level QC configuration (disabled by default = legacy)."""

    enabled: bool = False
    input_qc: bool = True
    output_qc: bool = True
    policy: Optional[QualityControlPolicy] = None
    on_unavailable: str = "warn"  # "warn" | "skip"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "enabled": self.enabled,
            "input_qc": self.input_qc,
            "output_qc": self.output_qc,
            "policy": self.policy.to_dict() if self.policy is not None else None,
            "on_unavailable": self.on_unavailable,
        }


@dataclass
class WorkflowDefinition:
    """A structured workflow definition."""

    workflow_id: str
    name: str = ""
    description: str = ""
    workflow_version: str = "1.0.0"
    steps: List[WorkflowStep] = field(default_factory=list)
    inputs: List[WorkflowInput] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    unit_policy: str = "LEGACY"          # "LEGACY" | "STRICT" (contract unit enforcement)
    qc: Optional[WorkflowQCConfig] = None  # optional workflow QC (disabled = legacy)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "workflow_id": self.workflow_id,
            "name": self.name,
            "description": self.description,
            "workflow_version": self.workflow_version,
            "steps": [
                {
                    "step_id": s.step_id,
                    "step_type": s.step_type,
                    "operation": s.operation,
                    "dependencies": list(s.dependencies),
                    "inputs": s.inputs,
                    "input_refs": s.input_refs,
                    "description": s.description,
                }
                for s in self.steps
            ],
            "inputs": [{"name": i.name, "required": i.required, "description": i.description}
                       for i in self.inputs],
            "metadata": self.metadata,
            "unit_policy": self.unit_policy,
            "qc": self.qc.to_dict() if self.qc is not None else None,
        }


@dataclass
class StepResult:
    """Result of one step."""

    step_id: str
    step_type: str
    operation: str
    status: str
    output: Any = None
    error: Optional[Dict[str, Any]] = None
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    input_validation: Optional[Dict[str, Any]] = None
    output_validation: Optional[Dict[str, Any]] = None
    input_qc: Optional[Dict[str, Any]] = None
    output_qc: Optional[Dict[str, Any]] = None
    input_hash: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_id": self.step_id,
            "step_type": self.step_type,
            "operation": self.operation,
            "status": self.status,
            "output": _serialize_output(self.output),
            "error": self.error,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "input_validation": self.input_validation,
            "output_validation": self.output_validation,
            "input_qc": self.input_qc,
            "output_qc": self.output_qc,
            "input_hash": self.input_hash,
        }


@dataclass
class WorkflowResult:
    """Structured workflow result."""

    workflow_id: str
    workflow_version: str
    status: str
    partial: bool
    order: List[str]
    steps: Dict[str, StepResult]
    errors: List[Dict[str, Any]]
    warnings: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    provenance: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "workflow_id": self.workflow_id,
            "workflow_version": self.workflow_version,
            "status": self.status,
            "partial": self.partial,
            "order": self.order,
            "steps": {sid: sr.to_dict() for sid, sr in self.steps.items()},
            "errors": self.errors,
            "warnings": self.warnings,
            "metadata": self.metadata,
            "provenance": self.provenance,
        }


def _serialize_output(output: Any) -> Any:
    if output is None:
        return None
    if hasattr(output, "to_dict") and callable(getattr(output, "to_dict")):
        return _json_safe(output.to_dict())
    if is_dataclass(output):
        return _json_safe(asdict(output))
    if isinstance(output, dict):
        return _json_safe(output)
    return _json_safe(output)


def _validation_status(validation: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Reduce a validation dict to a compact, deterministic provenance record."""
    if validation is None:
        return None
    return {
        "valid": validation.get("valid"),
        "contract_id": validation.get("contract_id"),
        "contract_version": validation.get("contract_version"),
        "category": validation.get("category"),
    }


def _step_hash_payload(sr: "StepResult") -> Dict[str, Any]:
    """Deterministic per-step payload for hashing (excludes wall-clock timestamps)."""
    return {
        "step_id": sr.step_id,
        "step_type": sr.step_type,
        "operation": sr.operation,
        "status": sr.status,
        "input_hash": sr.input_hash,
        "output": _serialize_output(sr.output),
        "error": sr.error,
        "input_validation": sr.input_validation,
        "output_validation": sr.output_validation,
        "input_qc": (sr.input_qc or {}).get("status"),
        "output_qc": (sr.output_qc or {}).get("status"),
        "input_qc_hash": sha256_json(_json_safe((sr.input_qc or {}).get("report")))
        if (sr.input_qc or {}).get("report") is not None else None,
        "output_qc_hash": sha256_json(_json_safe((sr.output_qc or {}).get("report")))
        if (sr.output_qc or {}).get("report") is not None else None,
    }


def _json_safe(obj: Any) -> Any:
    """Convert an object to a deterministic, JSON-serializable structure."""
    if obj is None or isinstance(obj, (str, int, float, bool)):
        return obj
    if is_dataclass(obj):
        return _json_safe(asdict(obj))
    if isinstance(obj, dict):
        return {str(k): _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_safe(v) for v in obj]
    if hasattr(obj, "to_dict") and callable(getattr(obj, "to_dict")):
        return _json_safe(obj.to_dict())
    return repr(obj)


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def _default_registry():
    # Lazy import to avoid a circular import during package initialization.
    from .runtime import build_registry
    return build_registry()


# --- validation ------------------------------------------------------------

def _resolve_model_id(operation: str) -> Tuple[str, Optional[str]]:
    if "@" in operation:
        mid, ver = operation.split("@", 1)
        return mid, ver
    return operation, None


def validate_workflow(definition: Any) -> Dict[str, Any]:
    """Validate a workflow definition (structure, ids, dependencies, cycles, refs)."""
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if not isinstance(definition, WorkflowDefinition):
        return {"valid": False, "errors": [_err("INVALID_WORKFLOW", "workflow",
                                                "workflow must be a WorkflowDefinition")],
                "warnings": []}

    if not _is_non_empty_str(definition.workflow_id):
        errors.append(_err("INVALID_WORKFLOW_ID", "workflow_id",
                           "workflow_id must be a non-empty string"))
    if not isinstance(definition.steps, list) or not definition.steps:
        errors.append(_err("EMPTY_WORKFLOW", "steps", "at least one step is required"))
        return {"valid": False, "errors": errors, "warnings": warnings}

    ids: List[str] = []
    seen = set()
    for i, step in enumerate(definition.steps):
        if not isinstance(step, WorkflowStep):
            errors.append(_err("INVALID_STEP", f"steps[{i}]", "step must be a WorkflowStep"))
            continue
        if not _is_non_empty_str(step.step_id):
            errors.append(_err("INVALID_STEP_ID", f"steps[{i}].step_id",
                               "step_id must be a non-empty string"))
        elif step.step_id in seen:
            errors.append(_err("DUPLICATE_STEP_ID", f"steps[{i}].step_id",
                               f"duplicate step_id: {step.step_id!r}"))
        else:
            seen.add(step.step_id)
            ids.append(step.step_id)

        if step.step_type not in STEP_TYPES:
            errors.append(_err("INVALID_STEP_TYPE", f"steps[{i}].step_type",
                               f"step_type must be one of {STEP_TYPES}"))
        if not _is_non_empty_str(step.operation):
            errors.append(_err("INVALID_OPERATION", f"steps[{i}].operation",
                               "operation must be a non-empty string"))
        else:
            if step.step_type in ("integration", "scenario"):
                if step.operation not in OPERATIONS:
                    errors.append(_err("UNSUPPORTED_OPERATION", f"steps[{i}].operation",
                                       f"unsupported integration operation: {step.operation!r}"))
                if step.step_type == "scenario" and step.operation != "run_scenarios":
                    errors.append(_err("INVALID_SCENARIO_OPERATION", f"steps[{i}].operation",
                                       "scenario step must use operation 'run_scenarios'"))
            elif step.step_type == "model":
                mid, _ = _resolve_model_id(step.operation)
                if not _is_non_empty_str(mid):
                    errors.append(_err("INVALID_OPERATION", f"steps[{i}].operation",
                                       "model operation must be 'model_id' or 'model_id@version'"))

        # dependencies
        dep_seen = set()
        for dep in step.dependencies:
            if dep == step.step_id:
                errors.append(_err("SELF_DEPENDENCY", f"steps[{i}].dependencies",
                                   f"step {step.step_id!r} depends on itself"))
            elif dep in dep_seen:
                errors.append(_err("DUPLICATE_DEPENDENCY", f"steps[{i}].dependencies",
                                   f"duplicate dependency {dep!r}"))
            elif dep not in seen and dep not in [s.step_id for s in definition.steps if isinstance(s, WorkflowStep)]:
                errors.append(_err("MISSING_DEPENDENCY", f"steps[{i}].dependencies",
                                   f"unknown dependency: {dep!r}"))
            else:
                dep_seen.add(dep)

    # topological order (cycle detection) — only if step ids are unique
    if len(ids) == len(set(ids)) and ids:
        order, cycle = topological_order(definition)
        if cycle:
            errors.append(_err("DEPENDENCY_CYCLE", "steps",
                               "dependency cycle detected: " + " -> ".join(cycle)))
        else:
            # input-reference integrity: referenced step must exist and precede the step
            pos = {sid: idx for idx, sid in enumerate(order)}
            id_set = set(ids)
            for step in definition.steps:
                for param, ref in (step.input_refs or {}).items():
                    if not isinstance(ref, str) or not ref:
                        errors.append(_err("INVALID_INPUT_REF", f"steps[{step.step_id}].input_refs.{param}",
                                           "input reference must be a non-empty string"))
                        continue
                    ref_step = ref.split(".", 1)[0]
                    if ref_step == "workflow":
                        continue
                    if ref_step not in id_set:
                        errors.append(_err("INVALID_INPUT_REF", f"steps[{step.step_id}].input_refs.{param}",
                                           f"reference to unknown step: {ref_step!r}"))
                    elif pos.get(ref_step, 1e9) >= pos.get(step.step_id, -1):
                        errors.append(_err("INVALID_INPUT_REF", f"steps[{step.step_id}].input_refs.{param}",
                                           f"reference to non-upstream step: {ref_step!r}"))

    # declared inputs
    input_names = set()
    for i, inp in enumerate(definition.inputs):
        if not isinstance(inp, WorkflowInput) or not _is_non_empty_str(inp.name):
            errors.append(_err("INVALID_INPUT", f"inputs[{i}]", "input must have a name"))
        elif inp.name in input_names:
            errors.append(_err("DUPLICATE_INPUT", f"inputs[{i}].name",
                               f"duplicate input: {inp.name!r}"))
        else:
            input_names.add(inp.name)

    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


def topological_order(definition: WorkflowDefinition) -> Tuple[List[str], List[str]]:
    """Return (order, cycle). ``cycle`` is a non-empty path if a cycle exists.

    Stable: among ready steps, declaration order is preserved.
    """
    steps = [s for s in definition.steps if isinstance(s, WorkflowStep)]
    ids = [s.step_id for s in steps]
    id_set = set(ids)
    indeg = {sid: 0 for sid in ids}
    adj: Dict[str, List[str]] = {sid: [] for sid in ids}
    for s in steps:
        for dep in s.dependencies:
            if dep in id_set and dep != s.step_id:
                adj[dep].append(s.step_id)
                indeg[s.step_id] += 1

    order: List[str] = []
    # stable Kahn: repeatedly take earliest-declared ready step
    remaining = list(ids)
    while remaining:
        ready = [sid for sid in remaining if indeg[sid] == 0]
        if not ready:
            # cycle: report a path among remaining
            cycle = _find_cycle(adj, remaining)
            return order, cycle
        pick = ready[0]
        order.append(pick)
        remaining.remove(pick)
        for nxt in adj[pick]:
            indeg[nxt] -= 1
    return order, []


def _find_cycle(adj: Dict[str, List[str]], nodes: List[str]) -> List[str]:
    """Return one cycle path among ``nodes`` (DFS)."""
    node_set = set(nodes)
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {n: WHITE for n in nodes}
    stack: List[str] = []

    def dfs(u: str) -> Optional[List[str]]:
        color[u] = GRAY
        stack.append(u)
        for v in adj.get(u, []):
            if v not in node_set:
                continue
            if color[v] == GRAY:
                idx = stack.index(v)
                return stack[idx:] + [v]
            if color[v] == WHITE:
                found = dfs(v)
                if found:
                    return found
        stack.pop()
        color[u] = BLACK
        return None

    for n in nodes:
        if color[n] == WHITE:
            found = dfs(n)
            if found:
                return found
    return nodes[:1] + [nodes[0]] if nodes else []


# --- execution -------------------------------------------------------------

def _traverse(obj: Any, path: Sequence[str]) -> Any:
    cur = obj
    for key in path:
        if isinstance(cur, dict):
            if key not in cur:
                raise KeyError(f"missing key {key!r}")
            cur = cur[key]
        elif hasattr(cur, key):
            cur = getattr(cur, key)
        else:
            raise KeyError(f"missing attribute {key!r}")
    return cur


def _resolve_ref(ref: str, step_outputs: Dict[str, StepResult],
                 workflow_inputs: Dict[str, Any]) -> Any:
    parts = ref.split(".")
    if parts[0] == "workflow":
        name = parts[1] if len(parts) > 1 else None
        if name is None:
            raise KeyError("invalid workflow reference")
        return _traverse(workflow_inputs, parts[1:])
    sid = parts[0]
    if sid not in step_outputs:
        raise KeyError(f"unknown step {sid!r} in reference")
    return _traverse(step_outputs[sid].output, parts[1:])


def _build_step_inputs(step: WorkflowStep, step_outputs: Dict[str, StepResult],
                       workflow_inputs: Dict[str, Any]) -> Dict[str, Any]:
    kwargs: Dict[str, Any] = dict(step.inputs or {})
    for param, ref in (step.input_refs or {}).items():
        kwargs[param] = _resolve_ref(ref, step_outputs, workflow_inputs)
    return kwargs


def _execute_step(step: WorkflowStep, kwargs: Dict[str, Any], registry) -> Any:
    if step.step_type == "model":
        model_id, version = _resolve_model_id(step.operation)
        model = registry.get(model_id, version)
        if model is None:
            raise KeyError(f"model not registered: {step.operation!r}")
        return model["executor"](kwargs)
    if step.step_type in ("integration", "scenario"):
        adapter = OPERATIONS.get(step.operation)
        if adapter is None:
            raise KeyError(f"unsupported operation: {step.operation!r}")
        return adapter(kwargs)
    raise KeyError(f"unsupported step_type: {step.step_type!r}")


def _find_climate_series(obj: Any) -> Optional[ClimateSeries]:
    if isinstance(obj, ClimateSeries):
        return obj
    if isinstance(obj, dict):
        for value in obj.values():
            if isinstance(value, ClimateSeries):
                return value
    return None


def _qc_assess(data: Any, qc_config: "WorkflowQCConfig") -> Dict[str, Any]:
    """Run existing climate QC on data containing a ``ClimateSeries``.

    Returns a dict with a ``QC_*`` status (``QC_PASSED`` / ``QC_WARNING`` /
    ``QC_BLOCKED`` / ``QC_UNAVAILABLE`` / ``QC_NOT_EVALUATED``), a ``blocks`` flag,
    and the underlying QC report summary. Never fabricates a clean result for
    unsupported data (``QC_UNAVAILABLE``).
    """
    series = _find_climate_series(data)
    if series is None:
        return {"status": "QC_UNAVAILABLE", "reason": "no ClimateSeries in data",
                "blocks": False, "report": None}
    policy = qc_config.policy or QualityControlPolicy()
    report = assess_climate_quality(series, policy)
    if report.status == "REJECTED":
        status = "QC_BLOCKED" if policy.error_blocks_execution else "QC_WARNING"
    elif report.status == "PASS_WITH_WARNINGS":
        status = "QC_BLOCKED" if policy.warn_blocks_execution else "QC_WARNING"
    elif report.status == "NOT_EVALUATED":
        status = "QC_NOT_EVALUATED"
    else:
        status = "QC_PASSED"
    return {
        "status": status,
        "blocks": status == "QC_BLOCKED",
        "counts_by_severity": report.counts_by_severity,
        "rules_applied": report.rules_applied,
        "flags": report.flags,
        "report": report.to_dict(),
    }


def run_workflow(definition: Any,
                 inputs: Optional[Dict[str, Any]] = None,
                 registry=None) -> WorkflowResult:
    """Validate and execute a workflow in deterministic topological order."""
    inputs = inputs or {}
    registry = registry or _default_registry()

    validation = validate_workflow(definition)
    if not validation["valid"]:
        return WorkflowResult(
            workflow_id=getattr(definition, "workflow_id", None),
            workflow_version=getattr(definition, "workflow_version", "1.0.0"),
            status="FAILED", partial=False, order=[], steps={},
            errors=validation["errors"], warnings=validation["warnings"],
            metadata={"layer_id": WORKFLOW_LAYER_ID, "layer_version": WORKFLOW_LAYER_VERSION},
            provenance={},
        )

    # required workflow inputs present?
    errors: List[Dict[str, Any]] = []
    for inp in definition.inputs:
        if inp.required and inp.name not in inputs:
            errors.append(_err("MISSING_WORKFLOW_INPUT", f"inputs.{inp.name}",
                               f"required workflow input {inp.name!r} not provided"))
    if errors:
        return WorkflowResult(
            workflow_id=definition.workflow_id, workflow_version=definition.workflow_version,
            status="FAILED", partial=False, order=[], steps={}, errors=errors,
            warnings=[], metadata={"layer_id": WORKFLOW_LAYER_ID}, provenance={},
        )

    order, cycle = topological_order(definition)
    if cycle:
        return WorkflowResult(
            workflow_id=definition.workflow_id, workflow_version=definition.workflow_version,
            status="FAILED", partial=False, order=[], steps={},
            errors=[_err("DEPENDENCY_CYCLE", "steps", " -> ".join(cycle))],
            warnings=[], metadata={"layer_id": WORKFLOW_LAYER_ID}, provenance={},
        )

    step_map = {s.step_id: s for s in definition.steps if isinstance(s, WorkflowStep)}
    step_outputs: Dict[str, StepResult] = {}
    step_results: Dict[str, StepResult] = {}
    exec_errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    for sid in order:
        step = step_map[sid]
        # dependency failure -> skip
        failed_dep = next((d for d in step.dependencies
                           if d in step_results and step_results[d].status in ("FAILED", "SKIPPED")), None)
        if failed_dep is not None:
            sr = StepResult(step_id=sid, step_type=step.step_type, operation=step.operation,
                            status="SKIPPED",
                            error={"code": "SKIPPED_DEPENDENCY",
                                   "message": f"dependency {failed_dep!r} did not complete"})
            step_results[sid] = sr
            continue

        sr = StepResult(step_id=sid, step_type=step.step_type, operation=step.operation,
                        status="RUNNING", started_at=_now())
        step_results[sid] = sr
        try:
            kwargs = _build_step_inputs(step, step_outputs, inputs)
            sr.input_hash = sha256_json(_json_safe(kwargs))

            # --- input contract validation (before execution) ---
            input_contract = get_contract(step.operation, "input")
            if input_contract is not None:
                ival = validate_contract(input_contract, kwargs, definition.unit_policy)
                sr.input_validation = ival.to_dict()
                if not ival.valid:
                    sr.status = "FAILED"
                    sr.error = {"code": "CONTRACT_INPUT_INVALID",
                                "message": "step inputs violate the input contract",
                                "detail": _json_safe(ival.errors)}
                    exec_errors.append({"step_id": sid, "code": "CONTRACT_INPUT_INVALID",
                                        "message": "step inputs violate the input contract"})
                    continue

            # --- input QC (only when workflow QC is enabled) ---
            if definition.qc is not None and definition.qc.enabled and definition.qc.input_qc:
                qres = _qc_assess(kwargs, definition.qc)
                sr.input_qc = qres
                if qres.get("blocks"):
                    sr.status = "FAILED"
                    sr.error = {"code": "QC_BLOCKED_INPUT", "message": "input QC blocking finding",
                                "detail": _json_safe(qres.get("flags"))}
                    exec_errors.append({"step_id": sid, "code": "QC_BLOCKED_INPUT",
                                        "message": "input QC blocked"})
                    continue
                if qres.get("status") == "QC_UNAVAILABLE" and definition.qc.on_unavailable == "skip":
                    sr.status = "SKIPPED"
                    sr.error = {"code": "QC_UNAVAILABLE",
                                "message": "input QC unavailable and on_unavailable=skip"}
                    continue

            output = _execute_step(step, kwargs, registry)
            sr.output = output

            # --- output contract validation (after execution) ---
            output_contract = get_contract(step.operation, "output")
            if output_contract is not None:
                oval = validate_contract(output_contract, output)
                sr.output_validation = oval.to_dict()
                if not oval.valid:
                    sr.status = "FAILED"
                    sr.error = {"code": "CONTRACT_OUTPUT_INVALID",
                                "message": "step output violates the output contract",
                                "detail": _json_safe(oval.errors)}
                    exec_errors.append({"step_id": sid, "code": "CONTRACT_OUTPUT_INVALID",
                                        "message": "step output violates the output contract"})
                    continue

            # --- output QC (only when workflow QC is enabled) ---
            if definition.qc is not None and definition.qc.enabled and definition.qc.output_qc:
                qres = _qc_assess(output, definition.qc)
                sr.output_qc = qres
                if qres.get("blocks"):
                    sr.status = "FAILED"
                    sr.error = {"code": "QC_BLOCKED_OUTPUT", "message": "output QC blocking finding",
                                "detail": _json_safe(qres.get("flags"))}
                    exec_errors.append({"step_id": sid, "code": "QC_BLOCKED_OUTPUT", "message": "output QC blocked"})
                    continue
                if qres.get("status") == "QC_UNAVAILABLE" and definition.qc.on_unavailable == "skip":
                    sr.status = "SKIPPED"
                    sr.error = {"code": "QC_UNAVAILABLE",
                                "message": "output QC unavailable and on_unavailable=skip"}
                    continue

            # An operation that ran but reported ok=False is a step failure (the
            # result is preserved, but dependent steps must not run).
            ok_val = getattr(output, "ok", None)
            if ok_val is None and isinstance(output, dict):
                ok_val = output.get("ok")
            if ok_val is False:
                sr.status = "FAILED"
                err = getattr(output, "errors", None)
                sr.error = {"code": "OPERATION_NOT_OK",
                            "message": "operation returned ok=False",
                            "detail": _json_safe(err) if err is not None else None}
                exec_errors.append({"step_id": sid, "code": "OPERATION_NOT_OK",
                                    "message": "operation returned ok=False"})
            else:
                sr.status = "COMPLETED"
        except Exception as exc:  # noqa: BLE001 - record failure, do not leak
            sr.status = "FAILED"
            sr.error = {"code": "STEP_FAILED", "message": str(exc)}
            exec_errors.append({"step_id": sid, "code": "STEP_FAILED", "message": str(exc)})
        finally:
            sr.finished_at = _now()
        if sr.status == "COMPLETED":
            step_outputs[sid] = sr

    statuses = [sr.status for sr in step_results.values()]
    if all(s == "COMPLETED" for s in statuses):
        wf_status = "COMPLETED"
    elif any(s == "FAILED" for s in statuses):
        wf_status = "FAILED"
    else:
        wf_status = "PARTIAL"
    partial = any(s == "SKIPPED" for s in statuses) or (wf_status == "FAILED" and any(
        s == "COMPLETED" for s in statuses))

    qc_config_dict = definition.qc.to_dict() if definition.qc is not None else None
    qc_config_hash = sha256_json(_json_safe(qc_config_dict)) if definition.qc is not None else None
    qc_step_status = {}
    for sid, sr in step_results.items():
        iqc = sr.input_qc or {}
        oqc = sr.output_qc or {}
        qc_step_status[sid] = {
            "input": iqc.get("status"),
            "output": oqc.get("status"),
            "input_report_hash": sha256_json(_json_safe(iqc.get("report")))
            if iqc.get("report") is not None else None,
            "output_report_hash": sha256_json(_json_safe(oqc.get("report")))
            if oqc.get("report") is not None else None,
        }
    qc_hash = sha256_json(_json_safe({
        "config": qc_config_dict,
        "steps": qc_step_status,
    })) if definition.qc is not None else None

    provenance = {
        "layer_id": WORKFLOW_LAYER_ID,
        "layer_version": WORKFLOW_LAYER_VERSION,
        "workflow_id": definition.workflow_id,
        "workflow_version": definition.workflow_version,
        "workflow_hash": sha256_json(_json_safe(definition.to_dict())),
        "qc_config": qc_config_dict,
        "qc_config_hash": qc_config_hash,
        "qc_step_status": qc_step_status,
        "qc_hash": qc_hash,
        "input_hash": sha256_json(_json_safe(inputs)),
        "execution_order": order,
        "step_provenance": {
            sid: {"step_id": sr.step_id, "operation": sr.operation,
                  "step_type": sr.step_type, "status": sr.status,
                  "dependencies": list(step_map[sid].dependencies) if sid in step_map else [],
                  "input_hash": sr.input_hash,
                  "input_validation": _validation_status(sr.input_validation),
                  "output_validation": _validation_status(sr.output_validation),
                  "input_qc": (sr.input_qc or {}).get("status"),
                  "output_qc": (sr.output_qc or {}).get("status"),
                  "input_qc_hash": qc_step_status.get(sid, {}).get("input_report_hash"),
                  "output_qc_hash": qc_step_status.get(sid, {}).get("output_report_hash"),
                  "output_hash": sha256_json(_serialize_output(sr.output))
                  if sr.output is not None else None}
            for sid, sr in step_results.items()
        },
        "result_hash": sha256_json({
            "steps": [_step_hash_payload(sr) for _, sr in sorted(step_results.items())],
            "qc_hash": qc_hash,
        }),
    }
    metadata = {
        "layer_id": WORKFLOW_LAYER_ID,
        "layer_version": WORKFLOW_LAYER_VERSION,
        "step_count": len(step_results),
    }

    return WorkflowResult(
        workflow_id=definition.workflow_id, workflow_version=definition.workflow_version,
        status=wf_status, partial=partial, order=order, steps=step_results,
        errors=exec_errors, warnings=warnings, metadata=metadata, provenance=provenance,
    )


# --- example workflow ------------------------------------------------------

def example_climate_irrigation_workflow() -> WorkflowDefinition:
    """A minimal end-to-end workflow: ET0 diagnostic + scenario comparison.

    Demonstrates workflow inputs, an integration step, a scenario step, a dependency
    (scenarios run after the ET0 diagnostic), and structured outputs. It reuses the
    existing integrations/scenario engine without duplicating any calculation.
    """
    return WorkflowDefinition(
        workflow_id="example-climate-irrigation",
        name="Climate → ET0 diagnostic + irrigation scenario comparison",
        workflow_version="1.0.0",
        inputs=[WorkflowInput("climate", required=True, description="ClimateSeries"),
                WorkflowInput("et0_config", required=True, description="ET0IntegrationConfig"),
                WorkflowInput("scenarios", required=True, description="list[ScenarioConfig]")],
        steps=[
            WorkflowStep(
                step_id="et0",
                step_type="integration",
                operation="compute_et0_series",
                input_refs={"series": "workflow.climate", "config": "workflow.et0_config"},
                description="Daily ET0 diagnostic from climate",
            ),
            WorkflowStep(
                step_id="scenarios",
                step_type="scenario",
                operation="run_scenarios",
                dependencies=["et0"],
                input_refs={"series": "workflow.climate", "scenarios": "workflow.scenarios",
                            "et0_config": "workflow.et0_config"},
                description="Run and compare irrigation scenarios",
            ),
        ],
        metadata={"purpose": "end-to-end example"},
    )