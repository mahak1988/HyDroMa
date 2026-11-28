"""Execution environment manifest & determinism contract (offline core).

Captures the *observed* runtime of the process that builds the manifest. It does
not claim that a scientific model has executed, and it never fabricates values:
unavailable information is represented as ``None`` and listed in ``unavailable``.
"""

from __future__ import annotations

import hashlib
import json
import os
import platform
import sys
from importlib import metadata
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

__all__ = [
    "MANIFEST_SCHEMA_VERSION",
    "CANONICAL_VERSION",
    "HASH_ALGORITHM",
    "MODEL_SOURCES",
    "build_manifest",
    "manifest_fingerprint",
    "validate_manifest",
    "assess_repeatability",
]

MANIFEST_SCHEMA_VERSION = "1.0.0"
CANONICAL_VERSION = "1.0.0"
HASH_ALGORITHM = "sha256"

MODEL_SOURCES = {
    "fao56_et0": "fao56_et0.py",
    "water_balance": "water_balance.py",
}


def _canonical(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)


def manifest_fingerprint(manifest: Dict[str, Any]) -> str:
    return hashlib.sha256(_canonical(manifest).encode("utf-8")).hexdigest()


def _source_fingerprint(model_id: str) -> Optional[str]:
    name = MODEL_SOURCES.get(model_id)
    if not name:
        return None
    path = Path(__file__).with_name(name)
    if not path.exists():
        return None
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _declared_dependencies() -> Dict[str, Any]:
    try:
        requires = metadata.requires("hydroma") or []
    except metadata.PackageNotFoundError:
        requires = []
    return {"declaredRequires": requires, "source": "importlib.metadata.requires(hydroma)"}


def _resolved_dependencies() -> Dict[str, Any]:
    resolved: Dict[str, str] = {}
    for name in ("hydroma", "fastapi", "uvicorn", "httpx", "pydantic", "pytest"):
        try:
            resolved[name] = metadata.version(name)
        except metadata.PackageNotFoundError:
            resolved[name] = "unavailable"
    return {"resolved": resolved, "source": "importlib.metadata.version"}


def build_manifest(model_id: str, model_version: str, *, observed: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    unavailable: List[str] = []
    engine_version = "0.1.0"
    try:
        engine_version = metadata.version("hydroma")
    except metadata.PackageNotFoundError:
        unavailable.append("engine_version")
    source_fp = _source_fingerprint(model_id)
    if source_fp is None:
        unavailable.append("model_source_fingerprint")
    lockfile = Path(__file__).resolve().parents[2] / "uv.lock"
    lock_fp = hashlib.sha256(lockfile.read_bytes()).hexdigest() if lockfile.exists() else None
    if lock_fp is None:
        unavailable.append("lockfile_fingerprint")
    manifest = {
        "schemaVersion": MANIFEST_SCHEMA_VERSION,
        "canonicalVersion": CANONICAL_VERSION,
        "hashAlgorithm": HASH_ALGORITHM,
        "runtime": {
            "pythonImplementation": platform.python_implementation(),
            "pythonVersion": platform.python_version(),
            "pythonAbi": sys.implementation.cache_tag,
            "os": platform.system(),
            "osRelease": platform.release(),
            "arch": platform.machine(),
            "floatMantissaDigits": sys.float_info.mant_dig,
            "floatMaxExponent": sys.float_info.max_exp,
        },
        "engine": {
            "engineVersion": engine_version,
            "modelId": model_id,
            "modelVersion": model_version,
            "modelSourceFingerprint": source_fp,
            "sourceRevision": None,
        },
        "dependencies": {**_declared_dependencies(), **_resolved_dependencies()},
        "numerical": {
            "roundTripDigits": sys.float_info.dig,
            "threadEnv": {k: os.environ.get(k) for k in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS")},
            "randomSeed": None,
        },
        "observed": observed or {},
        "unavailable": sorted(set(unavailable)),
    }
    if manifest["engine"]["sourceRevision"] is None:
        manifest["unavailable"] = sorted(set(manifest["unavailable"] + ["source_revision"]))
    return manifest


def validate_manifest(manifest: Dict[str, Any]) -> List[str]:
    errors: List[str] = []
    if not isinstance(manifest, dict):
        return ["manifest must be an object"]
    if manifest.get("schemaVersion") != MANIFEST_SCHEMA_VERSION:
        errors.append("unsupported schemaVersion")
    if manifest.get("hashAlgorithm") != HASH_ALGORITHM:
        errors.append("unsupported hashAlgorithm")
    for section in ("runtime", "engine", "dependencies", "numerical"):
        if not isinstance(manifest.get(section), dict):
            errors.append(f"missing section: {section}")
    engine = manifest.get("engine", {})
    if not engine.get("modelId") or not engine.get("modelVersion"):
        errors.append("engine.modelId/modelVersion required")
    try:
        _canonical(manifest)
    except (TypeError, ValueError):
        errors.append("manifest contains non-finite or non-serializable values")
    return errors


def assess_repeatability(fn: Callable[[Dict[str, Any]], Any], inputs: Dict[str, Any], runs: int = 3) -> Dict[str, Any]:
    """Exact repeat comparison (no arbitrary tolerance)."""
    outputs = [fn(inputs) for _ in range(max(1, runs))]
    first = _canonical(outputs[0])
    deterministic = all(_canonical(o) == first for o in outputs)
    return {"deterministic": deterministic, "runs": len(outputs), "comparison": "exact-canonical", "output": outputs[0]}