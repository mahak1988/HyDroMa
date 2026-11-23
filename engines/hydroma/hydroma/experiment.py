"""Scientific Experiment & Reproducibility Artifacts (Phase 3.6).

A bounded layer that defines scientific experiments, executes them through the
existing :class:`~hydroma.workflow.WorkflowDefinition` / :func:`~hydroma.workflow.run_workflow`,
and produces structured, serializable **reproducibility artifacts**.

It adds no scientific calculation and bypasses no existing boundary: experiment
execution delegates to the Workflow Engine (which delegates to models/integrations
and applies contract validation). The artifact records the scientific configuration,
execution context, provenance and validation status needed to inspect and (where
feasible) replay an execution.

Determinism
-----------
Four distinct hashes are produced and documented:

* ``definition_hash``  — SHA-256 of the experiment definition (identity + workflow + config).
* ``workflow_hash``    — SHA-256 of the workflow definition.
* ``input_hash``       — SHA-256 of the (JSON-safe) inputs.
* ``result_hash``      — SHA-256 of the deterministic workflow step results.
* ``artifact_hash``    — SHA-256 of the artifact content (excludes volatile ``run_id`` /
  ``created_at``).

Volatile execution metadata (run id, timestamps) is excluded from the deterministic
hashes. Equivalent definitions + inputs produce the same ``artifact_hash``.

Terminology (kept distinct): computational determinism ≠ computational
reproducibility ≠ scientific reproducibility ≠ scientific validation. The artifact
records ``scientific_status = NOT_VALIDATED``; reproducibility is not validation.

Security: no ``eval``/``exec``/dynamic import; artifacts use the existing safe
serialization helpers; no secrets or arbitrary runtime objects are serialized.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field, is_dataclass, asdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .provenance import sha256_json
from .workflow import (
    WorkflowDefinition,
    WorkflowInput,
    WorkflowResult,
    WorkflowStep,
    run_workflow,
    validate_workflow,
)

__all__ = [
    "ARTIFACT_SCHEMA_VERSION",
    "EXPERIMENT_LAYER_ID",
    "EXPERIMENT_LAYER_VERSION",
    "SCIENTIFIC_STATUS",
    "ExperimentDefinition",
    "ExperimentResult",
    "validate_experiment_definition",
    "run_experiment",
    "build_artifact",
    "validate_artifact",
    "verify_artifact_integrity",
    "verify_experiment_integrity",
    "replay_experiment",
    "experiment_definition_hash",
    "EXPERIMENT_STATUSES",
]

ARTIFACT_SCHEMA_VERSION = "1.0.0"
EXPERIMENT_LAYER_ID = "eco-nojin.hydroma.experiment"
EXPERIMENT_LAYER_VERSION = "1.0.0"
SCIENTIFIC_STATUS = "NOT_VALIDATED"

# Experiment status maps directly to the underlying workflow status.
EXPERIMENT_STATUSES = ("PENDING", "RUNNING", "COMPLETED", "FAILED", "PARTIAL",
                       "INVALID_DEFINITION", "INVALID_WORKFLOW", "UNAVAILABLE")


def _err(code: str, field_name: str, message: str) -> Dict[str, Any]:
    return {"code": code, "field": field_name, "message": message}


def _is_non_empty_str(v: Any) -> bool:
    return isinstance(v, str) and len(v.strip()) > 0


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


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


# --- definition ------------------------------------------------------------

@dataclass
class ExperimentDefinition:
    """A scientific experiment: identity + a workflow + declared metadata.

    The experiment is a *specification*; inputs are supplied at execution time and
    captured in the artifact.
    """

    experiment_id: str
    name: str = ""
    experiment_version: str = "1.0.0"
    description: str = ""
    workflow: Optional[WorkflowDefinition] = None
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "experiment_id": self.experiment_id,
            "name": self.name,
            "experiment_version": self.experiment_version,
            "description": self.description,
            "workflow": self.workflow.to_dict() if self.workflow is not None else None,
            "tags": list(self.tags),
            "metadata": self.metadata,
        }


@dataclass
class ExperimentResult:
    """Structured outcome of an experiment execution."""

    experiment_id: str
    experiment_version: str
    status: str
    ok: bool
    partial: bool
    workflow_result: Optional[WorkflowResult]
    artifact: Dict[str, Any]
    errors: List[Dict[str, Any]]
    warnings: List[Dict[str, Any]]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "experiment_id": self.experiment_id,
            "experiment_version": self.experiment_version,
            "status": self.status,
            "ok": self.ok,
            "partial": self.partial,
            "workflow_result": self.workflow_result.to_dict() if self.workflow_result else None,
            "artifact": self.artifact,
            "errors": self.errors,
            "warnings": self.warnings,
        }


def experiment_definition_hash(definition: ExperimentDefinition) -> str:
    """Deterministic SHA-256 of the experiment definition (identity + workflow + config)."""
    return sha256_json(_json_safe(definition.to_dict()))


def validate_experiment_definition(definition: Any) -> Dict[str, Any]:
    """Validate an experiment definition (identity + embedded workflow)."""
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if not isinstance(definition, ExperimentDefinition):
        return {"valid": False, "errors": [_err("INVALID_DEFINITION", "definition",
                                                "definition must be an ExperimentDefinition")],
                "warnings": []}

    if not _is_non_empty_str(definition.experiment_id):
        errors.append(_err("INVALID_EXPERIMENT_ID", "experiment_id",
                           "experiment_id must be a non-empty string"))
    if not _is_non_empty_str(definition.experiment_version):
        errors.append(_err("INVALID_EXPERIMENT_VERSION", "experiment_version",
                           "experiment_version must be a non-empty string"))
    if definition.workflow is None:
        errors.append(_err("MISSING_WORKFLOW", "workflow", "experiment must reference a workflow"))
    else:
        wv = validate_workflow(definition.workflow)
        if not wv["valid"]:
            errors.extend({"code": e["code"], "field": f"workflow.{e.get('field', '')}",
                           "message": e.get("message", "")} for e in wv["errors"])

    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


# --- artifact --------------------------------------------------------------

def _workflow_from_dict(d: Dict[str, Any]) -> WorkflowDefinition:
    """Reconstruct a WorkflowDefinition from its serialized form (safe, no dynamic code)."""
    steps = [
        WorkflowStep(
            step_id=s["step_id"],
            step_type=s["step_type"],
            operation=s["operation"],
            dependencies=list(s.get("dependencies", [])),
            inputs=dict(s.get("inputs", {})),
            input_refs=dict(s.get("input_refs", {})),
            description=s.get("description", ""),
        )
        for s in d.get("steps", [])
    ]
    inputs = [
        WorkflowInput(name=i["name"], required=i.get("required", True),
                      description=i.get("description", ""))
        for i in d.get("inputs", [])
    ]
    qc = None
    qcd = d.get("qc")
    if isinstance(qcd, dict):
        from .quality import QualityControlPolicy
        from .workflow import WorkflowQCConfig
        pol = qcd.get("policy")
        qc = WorkflowQCConfig(
            enabled=qcd.get("enabled", False),
            input_qc=qcd.get("input_qc", True),
            output_qc=qcd.get("output_qc", True),
            policy=QualityControlPolicy(**pol) if isinstance(pol, dict) else None,
            on_unavailable=qcd.get("on_unavailable", "warn"),
        )
    return WorkflowDefinition(
        workflow_id=d["workflow_id"],
        name=d.get("name", ""),
        description=d.get("description", ""),
        workflow_version=d.get("workflow_version", "1.0.0"),
        steps=steps,
        inputs=inputs,
        metadata=dict(d.get("metadata", {})),
        unit_policy=d.get("unit_policy", "LEGACY"),
        qc=qc,
    )


def _experiment_from_dict(d: Dict[str, Any]) -> ExperimentDefinition:
    wf = d.get("workflow")
    return ExperimentDefinition(
        experiment_id=d["experiment_id"],
        name=d.get("name", ""),
        experiment_version=d.get("experiment_version", "1.0.0"),
        description=d.get("description", ""),
        workflow=_workflow_from_dict(wf) if isinstance(wf, dict) else None,
        tags=list(d.get("tags", [])),
        metadata=dict(d.get("metadata", {})),
    )


def build_artifact(definition: ExperimentDefinition, inputs: Dict[str, Any],
                   workflow_result: WorkflowResult, run_id: Optional[str] = None,
                   created_at: Optional[str] = None) -> Dict[str, Any]:
    """Build a deterministic reproducibility artifact (volatile fields excluded from hashes)."""
    run_id = run_id or uuid.uuid4().hex
    created_at = created_at or _now()
    wf_prov = workflow_result.provenance or {}

    steps_exec = {}
    validation = {}
    for sid, sr in (workflow_result.steps or {}).items():
        steps_exec[sid] = {
            "step_id": sr.step_id,
            "step_type": sr.step_type,
            "operation": sr.operation,
            "status": sr.status,
        }
        validation[sid] = {
            "input_validation": sr.input_validation,
            "output_validation": sr.output_validation,
        }

    core: Dict[str, Any] = {
        "artifact_schema_version": ARTIFACT_SCHEMA_VERSION,
        "layer_id": EXPERIMENT_LAYER_ID,
        "layer_version": EXPERIMENT_LAYER_VERSION,
        "experiment_id": definition.experiment_id,
        "experiment_version": definition.experiment_version,
        "definition": _json_safe(definition.to_dict()),
        "definition_hash": experiment_definition_hash(definition),
        "workflow_hash": wf_prov.get("workflow_hash"),
        "input_hash": wf_prov.get("input_hash"),
        "config_hash": sha256_json(_json_safe({
            "workflow": definition.workflow.to_dict() if definition.workflow else None,
            "tags": list(definition.tags),
            "metadata": definition.metadata,
        })),
        "inputs": _json_safe(inputs),
        "execution": {
            "workflow_status": workflow_result.status,
            "workflow_partial": workflow_result.partial,
            "steps": steps_exec,
        },
        "provenance": {
            "workflow": wf_prov,
            "result_hash": wf_prov.get("result_hash"),
        },
        "validation": {
            "scientific_status": SCIENTIFIC_STATUS,
            "steps": validation,
        },
        "result_hash": wf_prov.get("result_hash"),
    }
    artifact_hash = sha256_json(_json_safe(core))
    artifact = dict(core)
    artifact["run_id"] = run_id
    artifact["created_at"] = created_at
    artifact["artifact_hash"] = artifact_hash
    return artifact


def validate_artifact(artifact: Any) -> Dict[str, Any]:
    """Validate artifact structure and schema version (bounded inspection).

    This checks structure and schema version only; it does not recompute hashes.
    Use :func:`verify_artifact_integrity` to check content-vs-hash consistency.
    """
    errors: List[Dict[str, Any]] = []
    if not isinstance(artifact, dict):
        return {"valid": False, "errors": [_err("INVALID_ARTIFACT", "artifact",
                                                "artifact must be an object")]}
    if artifact.get("artifact_schema_version") != ARTIFACT_SCHEMA_VERSION:
        errors.append(_err("SCHEMA_VERSION_MISMATCH", "artifact_schema_version",
                           f"expected {ARTIFACT_SCHEMA_VERSION}, "
                           f"got {artifact.get('artifact_schema_version')!r}"))
    for key in ("experiment_id", "experiment_version", "definition", "definition_hash",
                "workflow_hash", "input_hash", "config_hash", "result_hash",
                "artifact_hash", "execution", "provenance", "validation"):
        if key not in artifact:
            errors.append(_err("MISSING_ARTIFACT_FIELD", key, f"missing field {key!r}"))
    return {"valid": len(errors) == 0, "errors": errors}


# Keys excluded from the deterministic artifact hash (volatile execution metadata).
_VOLATILE_ARTIFACT_KEYS = ("run_id", "created_at", "artifact_hash")


def verify_artifact_integrity(artifact: Any) -> Dict[str, Any]:
    """Verify content-vs-hash consistency of an artifact.

    Recomputes ``artifact_hash`` from the artifact content (excluding volatile
    ``run_id``/``created_at``/``artifact_hash``) and, when present, ``input_hash``
    from the recorded ``inputs``. This detects inconsistency **only if the expected
    hash is trusted**; it is not a tamper-proof security guarantee.
    """
    errors: List[Dict[str, Any]] = []
    if not isinstance(artifact, dict):
        return {"valid": False, "errors": [_err("INVALID_ARTIFACT", "artifact",
                                                "artifact must be an object")],
                "recomputed_artifact_hash": None}

    core = {k: v for k, v in artifact.items() if k not in _VOLATILE_ARTIFACT_KEYS}
    recomputed = sha256_json(_json_safe(core))
    if artifact.get("artifact_hash") != recomputed:
        errors.append(_err("ARTIFACT_HASH_MISMATCH", "artifact_hash",
                           "artifact_hash does not match recomputed content hash"))

    if "inputs" in artifact and "input_hash" in artifact:
        recomputed_input = sha256_json(_json_safe(artifact["inputs"]))
        if artifact.get("input_hash") != recomputed_input:
            errors.append(_err("INPUT_HASH_MISMATCH", "input_hash",
                               "input_hash does not match recomputed inputs hash"))

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "recomputed_artifact_hash": recomputed,
    }


def verify_experiment_integrity(artifact: Any) -> Dict[str, Any]:
    """Verify artifact structure, content-vs-hash consistency, and result-hash coherence.

    Combines :func:`validate_artifact` and :func:`verify_artifact_integrity`, and checks
    that the top-level ``result_hash`` agrees with the workflow provenance ``result_hash``.
    """
    v = validate_artifact(artifact)
    if not v["valid"]:
        return {"valid": False, "errors": v["errors"]}
    integrity = verify_artifact_integrity(artifact)
    errors = list(integrity["errors"])
    wf = (artifact.get("provenance") or {}).get("workflow") or {}
    top = artifact.get("result_hash")
    nested = wf.get("result_hash")
    if top is not None and nested is not None and top != nested:
        errors.append(_err("RESULT_HASH_MISMATCH", "result_hash",
                           "top-level result_hash != workflow provenance result_hash"))
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "artifact_integrity_valid": integrity["valid"],
        "recomputed_artifact_hash": integrity["recomputed_artifact_hash"],
    }


# --- execution -------------------------------------------------------------

def run_experiment(definition: Any,
                   inputs: Optional[Dict[str, Any]] = None,
                   registry=None) -> ExperimentResult:
    """Validate and execute an experiment through the Workflow Engine."""
    inputs = inputs or {}

    definition_valid = validate_experiment_definition(definition)
    if not definition_valid["valid"]:
        return ExperimentResult(
            experiment_id=getattr(definition, "experiment_id", None),
            experiment_version=getattr(definition, "experiment_version", "1.0.0"),
            status="INVALID_DEFINITION", ok=False, partial=False, workflow_result=None,
            artifact={}, errors=definition_valid["errors"], warnings=definition_valid["warnings"],
        )

    # required workflow inputs present?
    missing = [inp.name for inp in definition.workflow.inputs
               if inp.required and inp.name not in inputs]
    if missing:
        return ExperimentResult(
            experiment_id=definition.experiment_id,
            experiment_version=definition.experiment_version,
            status="INVALID_DEFINITION", ok=False, partial=False, workflow_result=None,
            artifact={},
            errors=[_err("MISSING_INPUT", f"inputs.{name}",
                         f"required input {name!r} not provided") for name in missing],
            warnings=[],
        )

    wf_result = run_workflow(definition.workflow, inputs, registry)

    if wf_result.status == "COMPLETED":
        status = "COMPLETED"
    elif wf_result.status == "PARTIAL":
        status = "PARTIAL"
    else:
        status = "FAILED"

    artifact = build_artifact(definition, inputs, wf_result)
    return ExperimentResult(
        experiment_id=definition.experiment_id,
        experiment_version=definition.experiment_version,
        status=status,
        ok=(status == "COMPLETED"),
        partial=(status == "PARTIAL" or bool(wf_result.partial)),
        workflow_result=wf_result,
        artifact=artifact,
        errors=wf_result.errors,
        warnings=wf_result.warnings,
    )


# --- replay & comparison ---------------------------------------------------

def replay_experiment(artifact: Dict[str, Any],
                      inputs: Optional[Dict[str, Any]] = None,
                      registry=None) -> Dict[str, Any]:
    """Replay an experiment and **verify** it against the original evidence.

    Reconstructs the experiment definition from the artifact, re-executes through the
    Workflow Engine, and compares the original and replayed evidence: workflow hash,
    config hash, input hash, result hash, QC hash, and per-step output hashes. Returns a
    structured verification (``verification_status`` ∈ MATCH / MISMATCH / NOT_VERIFIABLE
    / NOT_AVAILABLE) with per-check results and discrepancies. The caller must supply the
    **original inputs** (the artifact records their hash, not executable objects); if not
    supplied and the recorded inputs are not usable, verification is ``NOT_AVAILABLE``.
    """
    av = validate_artifact(artifact)
    if not av["valid"]:
        return {"status": "FAILED", "verification_status": "NOT_AVAILABLE",
                "reason": "invalid_artifact", "match": None, "checks": {},
                "discrepancies": [], "new_artifact": None, "errors": av["errors"]}

    if inputs is None:
        recorded = artifact.get("inputs")
        if not isinstance(recorded, dict):
            return {"status": "UNAVAILABLE", "verification_status": "NOT_AVAILABLE",
                    "reason": "inputs_not_recorded", "match": None, "checks": {},
                    "discrepancies": [], "new_artifact": None}
        inputs = recorded

    try:
        definition = _experiment_from_dict(artifact["definition"])
    except (KeyError, TypeError) as exc:
        return {"status": "FAILED", "verification_status": "NOT_AVAILABLE",
                "reason": "definition_unreadable", "message": str(exc), "match": None,
                "checks": {}, "discrepancies": [], "new_artifact": None}

    result = run_experiment(definition, inputs, registry)
    new = result.artifact

    orig_wf = (artifact.get("provenance") or {}).get("workflow") or {}
    new_wf = (new.get("provenance") or {}).get("workflow") or {}

    checks: Dict[str, str] = {}
    discrepancies: List[str] = []

    def cmp(name: str, a: Any, b: Any) -> None:
        if a is None and b is None:
            checks[name] = "MATCH"          # both absent -> consistent (legacy)
        elif a is None or b is None:
            checks[name] = "NOT_VERIFIABLE"  # missing evidence on one side
        elif a == b:
            checks[name] = "MATCH"
        else:
            checks[name] = "MISMATCH"
            discrepancies.append(name)

    cmp("workflow", artifact.get("workflow_hash"), new.get("workflow_hash"))
    cmp("config", artifact.get("config_hash"), new.get("config_hash"))
    cmp("input", artifact.get("input_hash"), new.get("input_hash"))
    cmp("result", artifact.get("result_hash"), new.get("result_hash"))
    cmp("qc", orig_wf.get("qc_hash"), new_wf.get("qc_hash"))

    orig_sp = orig_wf.get("step_provenance") or {}
    new_sp = new_wf.get("step_provenance") or {}
    for sid in sorted(set(orig_sp) | set(new_sp)):
        cmp(f"step.{sid}",
            (orig_sp.get(sid) or {}).get("output_hash"),
            (new_sp.get(sid) or {}).get("output_hash"))

    statuses = list(checks.values())
    if "MISMATCH" in statuses:
        vstatus = "MISMATCH"
    elif statuses and all(s == "MATCH" for s in statuses):
        vstatus = "MATCH"
    else:
        vstatus = "NOT_VERIFIABLE"

    return {
        "status": result.status,
        "verification_status": vstatus,
        "match": vstatus == "MATCH",
        "checks": checks,
        "discrepancies": discrepancies,
        "expected_result_hash": artifact.get("result_hash"),
        "actual_result_hash": new.get("result_hash"),
        "new_artifact": new,
    }