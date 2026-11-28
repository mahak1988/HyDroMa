"""Adversarial stress tests (lab-only, stdlib).

Each case declares the EXPECTED correct behaviour. The lab does not reward a
model for returning a number when rejection was correct.
"""

from __future__ import annotations

from typing import Any, Dict, List

from hydroma.fao56_et0 import compute_fao56_et0

__all__ = ["STRESS_CASES", "run_stress"]

# expect: "reject" (input invalid) | "valid" (finite output expected)
STRESS_CASES: List[Dict[str, Any]] = [
    {"id": "high_temp", "input": {"rn": 15, "t": 60, "u2": 2, "ea": 1.0}, "expect": "valid"},
    {"id": "low_temp", "input": {"rn": 5, "t": -50, "u2": 2, "ea": 0.05}, "expect": "valid"},
    {"id": "zero_wind", "input": {"rn": 10, "t": 20, "u2": 0, "ea": 1.0}, "expect": "valid"},
    {"id": "high_wind", "input": {"rn": 10, "t": 20, "u2": 50, "ea": 1.0}, "expect": "valid"},
    {"id": "zero_rad", "input": {"rn": 0, "t": 20, "u2": 2, "ea": 1.0}, "expect": "valid"},
    {"id": "high_rad", "input": {"rn": 50, "t": 20, "u2": 2, "ea": 1.0}, "expect": "valid"},
    # Negative NET radiation (Rn) is physically valid (night / cold surfaces).
    {"id": "neg_rad", "input": {"rn": -5, "t": 20, "u2": 2, "ea": 1.0}, "expect": "valid"},
    {"id": "missing_ea", "input": {"rn": 10, "t": 20, "u2": 2}, "expect": "reject"},
    {"id": "nan_temp", "input": {"rn": 10, "t": float("nan"), "u2": 2, "ea": 1.0}, "expect": "reject"},
    {"id": "inf_wind", "input": {"rn": 10, "t": 20, "u2": float("inf"), "ea": 1.0}, "expect": "reject"},
]

_CLASS = ["EXPECTED_REJECTION", "EXPECTED_WARNING", "VALID_RESULT",
          "SCIENTIFIC_CONSTRAINT_VIOLATION", "NUMERICAL_FAILURE", "UNEXPECTED_EXCEPTION"]


def run_stress() -> List[Dict[str, Any]]:
    out = []
    for c in STRESS_CASES:
        try:
            r = compute_fao56_et0(c["input"])
            ok = bool(r.get("ok"))
            if c["expect"] == "reject":
                cls = "EXPECTED_REJECTION" if not ok else "SCIENTIFIC_CONSTRAINT_VIOLATION"
            else:
                cls = "VALID_RESULT" if ok else "NUMERICAL_FAILURE"
            val = (r.get("result") or {}).get("et0_mm_per_day") if ok else None
            out.append({"id": c["id"], "expect": c["expect"], "ok": ok,
                        "class": cls, "value": val,
                        "error": None if ok else r.get("errors")})
        except Exception as exc:  # noqa: BLE001
            out.append({"id": c["id"], "expect": c["expect"], "ok": False,
                        "class": "UNEXPECTED_EXCEPTION", "value": None,
                        "error": f"{type(exc).__name__}: {exc}"})
    return out