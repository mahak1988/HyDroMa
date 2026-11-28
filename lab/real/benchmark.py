"""Deterministic benchmark runner with fingerprints (lab-only, stdlib)."""

from __future__ import annotations

import hashlib
import json
import time
from typing import Any, Callable, Dict

__all__ = ["fingerprint", "run"]


def fingerprint(obj: Any) -> str:
    canon = json.dumps(obj, sort_keys=True, default=str)
    return hashlib.sha256(canon.encode("utf-8")).hexdigest()[:16]


def run(case_id: str, model_id: str, fn: Callable[[dict], dict],
        input_data: dict) -> Dict[str, Any]:
    t0 = time.perf_counter()
    try:
        out = fn(input_data)
        err = None
        ok = bool(out.get("ok", True)) if isinstance(out, dict) else True
    except Exception as exc:  # noqa: BLE001
        out, err, ok = None, f"{type(exc).__name__}: {exc}", False
    ms = (time.perf_counter() - t0) * 1000.0
    rec = {
        "case_id": case_id, "model_id": model_id,
        "input_fingerprint": fingerprint(input_data),
        "output_fingerprint": fingerprint(out) if out is not None else None,
        "ok": ok, "error": err, "runtime_ms": round(ms, 3),
    }
    if isinstance(out, dict):
        rec["result"] = out.get("result")
    return rec