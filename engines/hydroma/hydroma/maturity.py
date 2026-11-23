"""Scientific model maturity and scientific status.

Two independent axes are tracked and must never be collapsed:

* **Maturity** (software evidence): stub -> implemented -> tested -> verified ->
  validated -> production_approved. A model advances one level at a time and
  only when the evidence for that level has been recorded as passing.
* **Scientific status** (physical credibility): UNCALIBRATED / CALIBRATED /
  VALIDATED / NOT_VALIDATED. Passing software tests never promotes this axis.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List

__all__ = [
    "MODEL_MATURITY",
    "ModelMaturity",
    "SCIENTIFIC_STATUS",
    "ScientificStatus",
    "MaturityEvidence",
    "check_promotion",
    "maturity_rank",
]

MODEL_MATURITY = [
    "stub",
    "implemented",
    "tested",
    "verified",
    "validated",
    "production_approved",
]
ModelMaturity = str

# Scientific status is orthogonal to software maturity.
SCIENTIFIC_STATUS = ["UNCALIBRATED", "CALIBRATED", "VALIDATED", "NOT_VALIDATED"]
ScientificStatus = str

_RANK = {name: i for i, name in enumerate(MODEL_MATURITY)}

REQUIRED_EVIDENCE = {
    "implemented": ["implementation"],
    "tested": ["unit_test"],
    "verified": ["reference"],
    "validated": ["observational", "independent_review"],
    "production_approved": ["owner_approval"],
}


def maturity_rank(maturity: str) -> int:
    if maturity not in _RANK:
        raise ValueError(f"unknown maturity: {maturity!r}")
    return _RANK[maturity]


def is_scientific_status(value: str) -> bool:
    return value in SCIENTIFIC_STATUS


@dataclass
class MaturityEvidence:
    kind: str
    status: str  # pass | fail | not_performed
    reference: str = ""
    notes: str = ""

    def to_dict(self) -> dict:
        return {
            "kind": self.kind,
            "status": self.status,
            "reference": self.reference,
            "notes": self.notes,
        }


def check_promotion(current: str, target: str, evidence: List[MaturityEvidence]):
    """Return {'ok': bool, ...}. Mirrors the TypeScript checkPromotion.

    This function never promotes the scientific status axis; it only reasons
    about software maturity.
    """
    frm, to = maturity_rank(current), maturity_rank(target)
    if to <= frm:
        return {"ok": True, "maturity": target}
    if target == "stub":
        return {"ok": True, "maturity": target}
    if to > frm + 1:
        return {"ok": False, "reason": "maturity must advance one level at a time"}
    if target == "production_approved" and current != "validated":
        return {"ok": False, "reason": "production_approved requires validated first"}
    required = REQUIRED_EVIDENCE[target]
    missing = [
        k for k in required
        if not any(e.kind == k and e.status == "pass" for e in evidence)
    ]
    if missing:
        return {"ok": False, "reason": f"missing passing evidence: {', '.join(missing)}"}
    return {"ok": True, "maturity": target}