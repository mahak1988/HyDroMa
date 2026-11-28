"""Defect register (lab-only, stdlib). Findings are exposed, not silently fixed."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List

__all__ = ["Finding", "Register", "CATEGORIES", "SEVERITIES"]

CATEGORIES = ["UNIT_ERROR", "FORMULA_ERROR", "PHYSICAL_CONSTRAINT_VIOLATION",
              "NUMERICAL_INSTABILITY", "INPUT_VALIDATION_FAILURE",
              "TEMPORAL_ALIGNMENT_ERROR", "STATISTICAL_METHOD_ERROR",
              "PARAMETER_SENSITIVITY_RISK", "DATA_PROVENANCE_GAP",
              "REPRODUCIBILITY_FAILURE", "CROSS_MODEL_INCONSISTENCY",
              "PERFORMANCE_LIMITATION", "SCIENTIFIC_VALIDATION_GAP"]
SEVERITIES = ["P0", "P1", "P2", "P3", "P4"]


@dataclass
class Finding:
    id: str
    model_id: str
    category: str
    severity: str
    summary: str
    evidence: Dict[str, Any] = field(default_factory=dict)
    source: str = ""
    suggested_correction: str = ""


class Register:
    def __init__(self) -> None:
        self.items: List[Finding] = []

    def add(self, f: Finding) -> None:
        assert f.category in CATEGORIES, f.category
        assert f.severity in SEVERITIES, f.severity
        self.items.append(f)

    def by_severity(self) -> Dict[str, int]:
        out = {s: 0 for s in SEVERITIES}
        for f in self.items:
            out[f.severity] += 1
        return out

    def to_list(self) -> List[Dict[str, Any]]:
        return [f.__dict__ for f in self.items]