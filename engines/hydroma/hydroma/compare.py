"""Experiment comparison & result inspection (Phase 3.7).

A bounded, descriptive comparison layer for Phase 3.6 experiment artifacts and
experiment results. It reports **structural** differences — identity, compatibility
dimensions, execution status, result paths/values, and provenance — and never claims
that one experiment is scientifically better, more accurate, or causally responsible
for a difference.

Public API
----------
* :func:`compare_experiments` — compare two artifacts (``dict``) or two
  :class:`~hydroma.experiment.ExperimentResult` objects.
* :func:`compare_experiment_results` — compare two ``ExperimentResult`` objects
  (enables result-path/value inspection because results carry step outputs).
* :func:`flatten_result` — flatten a nested result structure to dotted paths.

Compatibility statuses: ``IDENTICAL``, ``DIFFERENT``, ``INCOMPATIBLE``, ``UNKNOWN``,
``NOT_AVAILABLE``. Comparison never invents scientific equivalence.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from .experiment import (
    ARTIFACT_SCHEMA_VERSION,
    ExperimentResult,
    validate_artifact,
    verify_artifact_integrity,
)
from .provenance import sha256_json

__all__ = [
    "COMPARISON_SCHEMA_VERSION",
    "COMPAT_STATUSES",
    "ExperimentComparison",
    "compare_experiments",
    "compare_experiment_results",
    "flatten_result",
]

COMPARISON_SCHEMA_VERSION = "1.0.0"
COMPAT_STATUSES = ("IDENTICAL", "DIFFERENT", "INCOMPATIBLE", "UNKNOWN", "NOT_AVAILABLE")

_VOLATILE_ARTIFACT_KEYS = ("run_id", "created_at", "artifact_hash")


def _status_from_hashes(a: Any, b: Any) -> str:
    if a is None or b is None:
        return "NOT_AVAILABLE"
    return "IDENTICAL" if a == b else "DIFFERENT"


def _json_safe(obj: Any) -> Any:
    if obj is None or isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, dict):
        return {str(k): _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_safe(v) for v in obj]
    if hasattr(obj, "to_dict") and callable(getattr(obj, "to_dict")):
        return _json_safe(obj.to_dict())
    return repr(obj)


def flatten_result(obj: Any, prefix: str = "") -> Dict[str, Any]:
    """Flatten a nested result structure to dotted paths (deterministic)."""
    items: Dict[str, Any] = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            key = f"{prefix}.{k}" if prefix else str(k)
            items.update(flatten_result(v, key))
    elif isinstance(obj, (list, tuple)):
        for i, v in enumerate(obj):
            key = f"{prefix}[{i}]"
            items.update(flatten_result(v, key))
    else:
        items[prefix] = obj
    return items


def _is_number(v: Any) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(float(v))


def _type_name(v: Any) -> str:
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "boolean"
    if isinstance(v, (int, float)):
        return "number"
    if isinstance(v, str):
        return "string"
    if isinstance(v, dict):
        return "object"
    if isinstance(v, (list, tuple)):
        return "array"
    return type(v).__name__


def _result_paths(result: Optional[ExperimentResult]) -> Dict[str, Any]:
    """Flatten a step-output structure from an ExperimentResult for comparison."""
    if result is None or result.workflow_result is None:
        return {}
    flat: Dict[str, Any] = {}
    for sid, sr in (result.workflow_result.steps or {}).items():
        if sr.output is None:
            continue
        step_flat = flatten_result(_json_safe(sr.output), f"step.{sid}")
        flat.update(step_flat)
    return flat


def _compare_paths(pa: Dict[str, Any], pb: Dict[str, Any]) -> Dict[str, Any]:
    keys_a, keys_b = set(pa), set(pb)
    added = sorted(keys_b - keys_a)
    removed = sorted(keys_a - keys_b)
    matching = sorted(keys_a & keys_b)
    identical: List[str] = []
    changed: List[Dict[str, Any]] = []
    type_changed: List[Dict[str, Any]] = []
    non_finite: List[str] = []

    for k in matching:
        va, vb = pa[k], pb[k]
        if type(va) is not type(vb):
            type_changed.append({"path": k, "a_type": _type_name(va), "b_type": _type_name(vb)})
            continue
        if _is_number(va) and _is_number(vb):
            if va == vb:
                identical.append(k)
            else:
                changed.append({"path": k, "a": va, "b": vb, "difference": vb - va})
        elif isinstance(va, float) and isinstance(vb, float) and not (
                math.isfinite(va) and math.isfinite(vb)):
            non_finite.append(k)
        elif va == vb:
            identical.append(k)
        else:
            changed.append({"path": k, "a": _json_safe(va), "b": _json_safe(vb)})

    return {
        "added": added,
        "removed": removed,
        "matching": matching,
        "identical": identical,
        "changed": changed,
        "type_changed": type_changed,
        "non_finite": non_finite,
    }


def _contract_versions(artifact: Dict[str, Any]) -> Dict[str, str]:
    versions: Dict[str, str] = {}
    steps = (artifact.get("validation") or {}).get("steps") or {}
    for sid, v in steps.items():
        for direction in ("input_validation", "output_validation"):
            vd = v.get(direction) or {}
            cid = vd.get("contract_id")
            cver = vd.get("contract_version")
            if cid and cver:
                versions[f"{cid}"] = cver
    return versions


def _engine_versions(artifact: Dict[str, Any]) -> Dict[str, str]:
    prov = (artifact.get("provenance") or {}).get("workflow") or {}
    step_prov = prov.get("step_provenance") or {}
    versions: Dict[str, str] = {}
    for sid, sp in step_prov.items():
        op = sp.get("operation")
        if op:
            versions[op] = "workflow-step"
    return versions


def _identity(artifact: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "experiment_id": artifact.get("experiment_id"),
        "experiment_version": artifact.get("experiment_version"),
        "run_id": artifact.get("run_id"),
        "artifact_schema_version": artifact.get("artifact_schema_version"),
    }


@dataclass
class ExperimentComparison:
    """Structured, serializable comparison result (descriptive only)."""

    status: str
    identity: Dict[str, Any]
    integrity: Dict[str, Any]
    compatibility: Dict[str, str]
    execution: Dict[str, Any]
    result: Dict[str, Any]
    provenance: Dict[str, Any]
    warnings: List[str] = field(default_factory=list)
    limitations: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "comparison_schema_version": COMPARISON_SCHEMA_VERSION,
            "status": self.status,
            "identity": self.identity,
            "integrity": self.integrity,
            "compatibility": self.compatibility,
            "execution": self.execution,
            "result": self.result,
            "provenance": self.provenance,
            "warnings": self.warnings,
            "limitations": self.limitations,
        }


def _as_artifact(obj: Any) -> Tuple[Optional[Dict[str, Any]], Optional[ExperimentResult]]:
    """Return (artifact_dict, experiment_result_or_None) from either input kind."""
    if isinstance(obj, ExperimentResult):
        return obj.artifact, obj
    if isinstance(obj, dict):
        return obj, None
    return None, None


def _compare(a: Any, b: Any) -> ExperimentComparison:
    art_a, res_a = _as_artifact(a)
    art_b, res_b = _as_artifact(b)

    warnings: List[str] = []
    limitations = [
        "Descriptive comparison only; no scientific equivalence, ranking, or causal attribution.",
        "Different fields are not assumed to share units; no unit conversion or tolerance is applied.",
        "Numeric differences are raw (no tolerance); floating-point similarity is not scientific equivalence.",
        "Artifact-to-artifact comparison is hash-level for results; pass ExperimentResult for path/value inspection.",
        "Comparison never constitutes scientific validation.",
    ]

    # --- validity / schema compatibility (before structure) ---
    if not isinstance(art_a, dict) or not isinstance(art_b, dict):
        return ExperimentComparison(
            status="INVALID",
            identity={"a": _identity(art_a) if isinstance(art_a, dict) else None,
                      "b": _identity(art_b) if isinstance(art_b, dict) else None},
            integrity={"a_valid": False, "b_valid": False,
                       "a_errors": [{"code": "INVALID_ARTIFACT"}],
                       "b_errors": [{"code": "INVALID_ARTIFACT"}]},
            compatibility={}, execution={}, result={}, provenance={},
            warnings=warnings + ["invalid_artifact"], limitations=limitations,
        )

    sa = art_a.get("artifact_schema_version")
    sb = art_b.get("artifact_schema_version")
    if sa is None or sb is None:
        # not an artifact at all (no schema marker)
        return ExperimentComparison(
            status="INVALID",
            identity={"a": _identity(art_a), "b": _identity(art_b)},
            integrity={"a_valid": False, "b_valid": False,
                       "a_errors": [{"code": "INVALID_ARTIFACT"}],
                       "b_errors": [{"code": "INVALID_ARTIFACT"}]},
            compatibility={}, execution={}, result={}, provenance={},
            warnings=warnings + ["invalid_artifact"], limitations=limitations,
        )
    if sa != sb or sa != ARTIFACT_SCHEMA_VERSION:
        return ExperimentComparison(
            status="INCOMPATIBLE",
            identity={"a": _identity(art_a), "b": _identity(art_b)},
            integrity={"a_schema": sa, "b_schema": sb},
            compatibility={"schema": "INCOMPATIBLE"},
            execution={}, result={}, provenance={},
            warnings=warnings + ["schema_version_mismatch"], limitations=limitations,
        )

    va = validate_artifact(art_a)
    vb = validate_artifact(art_b)
    integrity = {
        "a_valid": va["valid"],
        "b_valid": vb["valid"],
        "a_errors": va.get("errors", []),
        "b_errors": vb.get("errors", []),
    }
    if not va["valid"] or not vb["valid"]:
        return ExperimentComparison(
            status="INVALID", identity={"a": _identity(art_a), "b": _identity(art_b)},
            integrity=integrity, compatibility={}, execution={}, result={}, provenance={},
            warnings=warnings + ["invalid_artifact"], limitations=limitations,
        )

    # content-vs-hash integrity
    ia = verify_artifact_integrity(art_a)
    ib = verify_artifact_integrity(art_b)
    integrity["a_integrity_valid"] = ia["valid"]
    integrity["b_integrity_valid"] = ib["valid"]
    if not ia["valid"]:
        warnings.append("artifact_a_integrity_mismatch")
    if not ib["valid"]:
        warnings.append("artifact_b_integrity_mismatch")

    # --- compatibility dimensions (independent) ---
    compatibility = {
        "definition": _status_from_hashes(art_a.get("definition_hash"), art_b.get("definition_hash")),
        "workflow": _status_from_hashes(art_a.get("workflow_hash"), art_b.get("workflow_hash")),
        "input": _status_from_hashes(art_a.get("input_hash"), art_b.get("input_hash")),
        "configuration": _status_from_hashes(art_a.get("config_hash"), art_b.get("config_hash")),
    }
    # engine: layer id/version
    if art_a.get("layer_id") == art_b.get("layer_id") and art_a.get("layer_version") == art_b.get("layer_version"):
        compatibility["engine"] = "IDENTICAL"
    else:
        compatibility["engine"] = "DIFFERENT"
    # contract versions
    cva, cvb = _contract_versions(art_a), _contract_versions(art_b)
    if not cva and not cvb:
        compatibility["contract"] = "NOT_AVAILABLE"
    elif cva == cvb:
        compatibility["contract"] = "IDENTICAL"
    else:
        compatibility["contract"] = "DIFFERENT"

    # --- execution comparison ---
    ea = art_a.get("execution") or {}
    eb = art_b.get("execution") or {}
    step_changes: List[Dict[str, Any]] = []
    steps_a = ea.get("steps") or {}
    steps_b = eb.get("steps") or {}
    for sid in sorted(set(steps_a) | set(steps_b)):
        sa = (steps_a.get(sid) or {}).get("status")
        sb = (steps_b.get(sid) or {}).get("status")
        if sa != sb:
            step_changes.append({"step_id": sid, "a_status": sa, "b_status": sb})
    execution = {
        "a_workflow_status": ea.get("workflow_status"),
        "b_workflow_status": eb.get("workflow_status"),
        "a_workflow_partial": ea.get("workflow_partial"),
        "b_workflow_partial": eb.get("workflow_partial"),
        "status": "IDENTICAL" if (ea.get("workflow_status") == eb.get("workflow_status")
                                  and not step_changes) else "DIFFERENT",
        "step_status_changes": step_changes,
        "a_steps": steps_a,
        "b_steps": steps_b,
    }

    # --- result comparison ---
    if res_a is not None and res_b is not None:
        pa, pb = _result_paths(res_a), _result_paths(res_b)
        result = {"mode": "path", **_compare_paths(pa, pb)}
        result["a_result_hash"] = art_a.get("result_hash")
        result["b_result_hash"] = art_b.get("result_hash")
        result["hash_match"] = (art_a.get("result_hash") == art_b.get("result_hash"))
    else:
        result = {
            "mode": "hash",
            "a_result_hash": art_a.get("result_hash"),
            "b_result_hash": art_b.get("result_hash"),
            "hash_match": (art_a.get("result_hash") == art_b.get("result_hash")),
            "note": "artifacts do not store outputs; result comparison is hash-level. "
                    "Pass ExperimentResult objects for path/value inspection.",
        }

    # --- provenance comparison ---
    provenance = {
        "workflow_hash": _status_from_hashes(art_a.get("workflow_hash"), art_b.get("workflow_hash")),
        "input_hash": _status_from_hashes(art_a.get("input_hash"), art_b.get("input_hash")),
        "config_hash": _status_from_hashes(art_a.get("config_hash"), art_b.get("config_hash")),
        "result_hash": _status_from_hashes(art_a.get("result_hash"), art_b.get("result_hash")),
        "definition_hash": _status_from_hashes(art_a.get("definition_hash"), art_b.get("definition_hash")),
        "a_result_hash": art_a.get("result_hash"),
        "b_result_hash": art_b.get("result_hash"),
    }

    # --- warnings ---
    if art_a.get("experiment_version") != art_b.get("experiment_version"):
        warnings.append("experiment_version_differs")
    if compatibility["workflow"] == "DIFFERENT":
        warnings.append("workflow_definition_differs")
    if compatibility["input"] == "DIFFERENT":
        warnings.append("input_differs")
    if compatibility["configuration"] == "DIFFERENT":
        warnings.append("configuration_differs")
    if compatibility["contract"] == "DIFFERENT":
        warnings.append("contract_versions_differ")

    status = "COMPARABLE"
    return ExperimentComparison(
        status=status,
        identity={"a": _identity(art_a), "b": _identity(art_b)},
        integrity=integrity,
        compatibility=compatibility,
        execution=execution,
        result=result,
        provenance=provenance,
        warnings=warnings,
        limitations=limitations,
    )


def compare_experiments(artifact_a: Any, artifact_b: Any) -> Dict[str, Any]:
    """Compare two experiment artifacts (dicts) or ``ExperimentResult`` objects.

    Returns a serializable comparison dict. Descriptive only — no scientific
    equivalence or causal claims.
    """
    return _compare(artifact_a, artifact_b).to_dict()


def compare_experiment_results(result_a: ExperimentResult,
                               result_b: ExperimentResult) -> Dict[str, Any]:
    """Compare two ``ExperimentResult`` objects (enables result-path inspection)."""
    return _compare(result_a, result_b).to_dict()