"""Dataset quality validation (lab-only, stdlib).

Validates a daily dict (Open-Meteo schema) without repairing it. Every problem is
recorded; nothing is silently fixed or interpolated.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List

__all__ = ["validate_daily", "QUALITY_SCHEMA_VERSION"]

QUALITY_SCHEMA_VERSION = "1.0.0"

_REQUIRED = ["time", "temperature_2m_max", "temperature_2m_min",
             "precipitation_sum", "shortwave_radiation_sum"]


def _finite(x) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


def validate_daily(daily: Dict[str, List], *, wind_key: str = "wind_speed_10m_max",
                   wind_unit: str = "kmh") -> Dict[str, Any]:
    errors: List[str] = []
    warnings: List[str] = []

    for k in _REQUIRED:
        if k not in daily:
            errors.append(f"missing variable: {k}")
    if errors:
        return {"ok": False, "errors": errors, "warnings": warnings,
                "schema_version": QUALITY_SCHEMA_VERSION}

    lengths = {k: len(daily[k]) for k in _REQUIRED}
    if len(set(lengths.values())) != 1:
        errors.append(f"array length mismatch: {lengths}")

    n = len(daily["time"])
    seen = set()
    prev = None
    for i, t in enumerate(daily["time"]):
        if t in seen:
            errors.append(f"duplicate date at index {i}: {t}")
        seen.add(t)
        if prev is not None and t <= prev:
            warnings.append(f"non-increasing date at index {i}: {prev} -> {t}")
        prev = t
        if t < "1900-01-01":
            warnings.append(f"suspicious old date: {t}")

    for i in range(n):
        tmax = daily["temperature_2m_max"][i]
        tmin = daily["temperature_2m_min"][i]
        p = daily["precipitation_sum"][i]
        rs = daily["shortwave_radiation_sum"][i]
        if not _finite(tmax) or not _finite(tmin):
            errors.append(f"non-finite temperature at {daily['time'][i]}")
            continue
        if tmin > tmax:
            errors.append(f"tmin > tmax at {daily['time'][i]}")
        if tmax > 60 or tmin < -90:
            warnings.append(f"extreme temperature at {daily['time'][i]}: {tmin}..{tmax}")
        if not _finite(p) or p < 0:
            errors.append(f"invalid precipitation at {daily['time'][i]}: {p}")
        if not _finite(rs) or rs < 0:
            errors.append(f"invalid radiation at {daily['time'][i]}: {rs}")
        if wind_key in daily:
            u = daily[wind_key][i]
            if not _finite(u) or u < 0:
                errors.append(f"invalid wind at {daily['time'][i]}: {u}")

    if wind_unit not in ("kmh", "ms"):
        warnings.append(f"unknown wind unit '{wind_unit}' (assumed kmh)")

    return {"ok": len(errors) == 0, "errors": errors, "warnings": warnings,
            "n": n, "schema_version": QUALITY_SCHEMA_VERSION}