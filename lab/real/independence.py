"""Independence audit for the reference implementation (lab-only, stdlib).

Parses the reference source and reports imported module roots and whether the
computational pathway is independent of hydroma and of the lab's shared helpers.
Evidence-based, not a textual claim.
"""

from __future__ import annotations

import ast
import os
from typing import Any, Dict

__all__ = ["audit_reference", "CLASSIFICATIONS"]

CLASSIFICATIONS = ["NOT_INDEPENDENT", "PARTIALLY_INDEPENDENT",
                   "COMPUTATIONALLY_INDEPENDENT", "INDEPENDENCE_NOT_ESTABLISHED"]

_SHARED_LAB = {"normalize", "datasets", "acquire", "quality", "simulate", "benchmark"}


def audit_reference(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as fh:
        tree = ast.parse(fh.read(), filename=path)
    roots = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for a in node.names:
                roots.add(a.name.split(".")[0])
        elif isinstance(node, ast.ImportFrom) and node.module:
            roots.add(node.module.split(".")[0])
    hydroma = any(r == "hydroma" or r.startswith("hydroma") for r in roots)
    shared = sorted(roots & _SHARED_LAB)
    if hydroma:
        cls = "NOT_INDEPENDENT"
    elif shared:
        cls = "PARTIALLY_INDEPENDENT"
    elif "math" in roots or not roots:
        cls = "COMPUTATIONALLY_INDEPENDENT"
    else:
        cls = "INDEPENDENCE_NOT_ESTABLISHED"
    return {"file": os.path.basename(path), "imports": sorted(roots),
            "hydroma_imported": hydroma, "shared_lab_helpers": shared,
            "classification": cls}