"""One-at-a-time sensitivity analysis (lab-only, stdlib)."""

from __future__ import annotations

from typing import Any, Callable, Dict, List

__all__ = ["oat_sensitivity"]


def oat_sensitivity(base: dict, vary: Dict[str, List[float]],
                    fn: Callable[[dict], float]) -> List[Dict[str, Any]]:
    """Return OAT sensitivity rows. ``fn`` maps input dict -> scalar output."""
    base_out = fn(base)
    rows = []
    for key, deltas in vary.items():
        for d in deltas:
            inp = dict(base)
            inp[key] = base[key] + d
            out = fn(inp)
            rel = ((out - base_out) / base_out * 100.0) if base_out else None
            rows.append({"param": key, "delta": d, "output": round(out, 4),
                         "rel_change_pct": round(rel, 3) if rel is not None else None})
    return rows