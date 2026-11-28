"""Isolated model execution worker (Phase 3.101).

Reads one JSON request from stdin, executes a supported model in THIS process,
and writes one JSON response to stdout. The API never imports engine internals;
it invokes this module in the engine's own virtual environment.
"""

from __future__ import annotations

import json
import sys
from typing import Any, Dict

from .execution_manifest import build_manifest, manifest_fingerprint
from .fao56_et0 import compute_fao56_et0, validate_fao56_et0_input
from .water_balance import compute_water_balance, validate_water_balance_input

__all__ = ["main"]

_MODELS = {
    "fao56_et0": ("1.0.0", validate_fao56_et0_input, compute_fao56_et0),
    "water_balance": ("1.0.0", validate_water_balance_input, compute_water_balance),
}


def main(argv=None) -> int:
    try:
        request = json.loads(sys.stdin.read() or "{}")
    except json.JSONDecodeError:
        print(json.dumps({"ok": False, "error": {"code": "invalid_request", "message": "invalid JSON"}}))
        return 2

    model_id = str(request.get("model_id") or "")
    model_version = str(request.get("model_version") or "")
    entry = _MODELS.get(model_id)
    if entry is None:
        print(json.dumps({"ok": False, "error": {"code": "unsupported_model", "message": "unsupported model"}}))
        return 2
    expected_version, validate, compute = entry
    if model_version != expected_version:
        print(json.dumps({"ok": False, "error": {"code": "unsupported_version", "message": "unsupported model version"}}))
        return 2

    model_input = request.get("input")
    if not isinstance(model_input, dict):
        print(json.dumps({"ok": False, "error": {"code": "invalid_input", "message": "input must be an object"}}))
        return 2

    validation = validate(model_input)
    if isinstance(validation, dict):
        errors = validation.get("errors") or []
        valid = validation.get("valid", not errors)
    else:
        errors = validation or []
        valid = not errors
    if not valid or errors:
        print(json.dumps({"ok": False, "error": {"code": "invalid_input", "message": "model input validation failed", "details": errors}}))
        return 2

    try:
        result = compute(model_input)
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"ok": False, "error": {"code": "execution_failed", "message": str(exc)}}))
        return 3

    manifest = build_manifest(model_id, model_version, observed={"execution": "isolated-subprocess"})
    print(json.dumps({
        "ok": True,
        "result": result,
        "manifest": manifest,
        "manifestFingerprint": manifest_fingerprint(manifest),
        "engineRunId": request.get("run_id"),
    }))
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())