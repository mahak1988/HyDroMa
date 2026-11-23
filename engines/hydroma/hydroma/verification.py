"""Reusable verification foundation for scientific models.

Runs a model executor against shared, independently-derived test vectors and
produces a verification report. This is SOFTWARE verification (unit / parity /
mathematical reference cases). It is NOT calibration and NOT scientific
validation, and it never promotes a model's maturity or scientific status.

Terminology (kept distinct on purpose):
- Unit test ............... one implementation checked against expected values.
- Parity .................. two implementations agree on shared vectors.
- Mathematical verification  model output matches independently derived results.
- Calibration ............. fitting parameters to observations.
- Scientific validation ... skill assessed against independent observations/review.
- Operational validation .. fitness for a defined operational use.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Callable, List, Optional

__all__ = ["PASS", "FAIL", "INCOMPLETE", "VectorResult", "VerificationReport", "run_vectors"]

PASS = "PASS"
FAIL = "FAIL"
INCOMPLETE = "INCOMPLETE"


@dataclass
class VectorResult:
    id: str
    passed: bool
    detail: str = ""


@dataclass
class VerificationReport:
    model_id: str
    model_version: str
    total: int = 0
    passed: int = 0
    failed: int = 0
    results: List[VectorResult] = field(default_factory=list)

    @property
    def status(self) -> str:
        if self.total == 0:
            return INCOMPLETE
        return PASS if self.failed == 0 else FAIL

    def to_dict(self) -> dict:
        return {
            "model_id": self.model_id,
            "model_version": self.model_version,
            "total": self.total,
            "passed": self.passed,
            "failed": self.failed,
            "status": self.status,
            "results": [
                {"id": r.id, "passed": r.passed, "detail": r.detail} for r in self.results
            ],
        }


def _match(got, exp, tol: float, path: str):
    if isinstance(exp, bool) or isinstance(got, bool):
        return (got == exp), f"{path}: {got!r} != {exp!r}"
    if isinstance(exp, (int, float)) and isinstance(got, (int, float)):
        return math.isclose(float(got), float(exp), abs_tol=tol), f"{path}: {got} != {exp}"
    if isinstance(exp, list) and isinstance(got, list):
        return (got == exp), f"{path}: {got!r} != {exp!r}"
    return (got == exp), f"{path}: {got!r} != {exp!r}"


def run_vectors(
    model_id: str,
    model_version: str,
    executor: Callable[[dict], dict],
    vectors: List[dict],
    project: Callable[[dict], dict],
    tolerance: float = 1e-6,
) -> VerificationReport:
    """Execute ``executor`` over ``vectors`` and compare ``project(result)`` to each
    vector's independently-derived ``expected`` mapping."""
    report = VerificationReport(model_id=model_id, model_version=model_version)
    for vec in vectors:
        vid = vec.get("id", "?")
        try:
            got = project(executor(vec["input"]))
            ok = True
            details = []
            for key, exp in vec["expected"].items():
                match, detail = _match(got.get(key), exp, tolerance, key)
                if not match:
                    ok = False
                    details.append(detail)
            report.results.append(VectorResult(vid, ok, "; ".join(details)))
            report.total += 1
            report.passed += 1 if ok else 0
            report.failed += 0 if ok else 1
        except Exception as exc:  # noqa: BLE001
            report.results.append(VectorResult(vid, False, f"exception: {exc}"))
            report.total += 1
            report.failed += 1
    return report