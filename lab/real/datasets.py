"""Benchmark dataset catalogue + cache identity (lab-only, stdlib).

Defines several climatic regimes with documented coordinates/elevation. Cache
identity is a SHA-256 of the request metadata; an existing file is accepted only
if its recorded fingerprint matches (never merely because it exists).
"""

from __future__ import annotations

import hashlib
import json
import os
from typing import Any, Dict, List, Optional

from acquire import fetch_archive

__all__ = ["BENCHMARKS", "cache_fingerprint", "load_benchmark", "DATA_DIR"]

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

# id -> location + climate + period. Elevations are approximate (documented).
BENCHMARKS: List[Dict[str, Any]] = [
    {"id": "tehran", "name": "Tehran (arid/semi-arid)", "lat": 35.7, "lon": 51.4,
     "elev_m": 1200.0, "climate": "arid", "start": "2023-01-01", "end": "2023-12-31"},
    {"id": "isfahan", "name": "Isfahan (arid)", "lat": 32.65, "lon": 51.67,
     "elev_m": 1575.0, "climate": "arid", "start": "2023-01-01", "end": "2023-12-31"},
    {"id": "nairobi", "name": "Nairobi (humid highland)", "lat": -1.29, "lon": 36.82,
     "elev_m": 1795.0, "climate": "humid", "start": "2023-01-01", "end": "2023-12-31"},
    {"id": "london", "name": "London (humid temperate)", "lat": 51.51, "lon": -0.13,
     "elev_m": 11.0, "climate": "humid", "start": "2023-01-01", "end": "2023-12-31"},
    {"id": "helsinki", "name": "Helsinki (cold continental)", "lat": 60.17, "lon": 24.94,
     "elev_m": 26.0, "climate": "cold", "start": "2023-01-01", "end": "2023-12-31"},
]


def cache_fingerprint(b: Dict[str, Any]) -> str:
    meta = {"source": "open-meteo", "lat": b["lat"], "lon": b["lon"],
            "start": b["start"], "end": b["end"],
            "vars": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum",
                     "shortwave_radiation_sum", "wind_speed_10m_mean", "wind_speed_10m_max"],
            "schema": "1.0.0"}
    return hashlib.sha256(json.dumps(meta, sort_keys=True).encode()).hexdigest()[:16]


def load_benchmark(bid: str, *, allow_fetch: bool = True) -> Optional[Dict[str, Any]]:
    """Return {daily, meta} or None if unavailable (no fabrication)."""
    b = next((x for x in BENCHMARKS if x["id"] == bid), None)
    if b is None:
        raise KeyError(f"unknown benchmark: {bid}")
    fp = cache_fingerprint(b)
    path = os.path.join(DATA_DIR, f"{bid}_{fp}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as fh:
            rec = json.load(fh)
        if rec.get("meta", {}).get("fingerprint") == fp:
            return {"daily": rec["daily"], "meta": rec["meta"], "path": path}
    if not allow_fetch:
        return None
    try:
        daily = fetch_archive(b["lat"], b["lon"], b["start"], b["end"], path)
    except Exception:
        return None
    # stamp fingerprint into the cached file's meta (best-effort)
    try:
        with open(path, "r", encoding="utf-8") as fh:
            rec = json.load(fh)
        rec["meta"]["fingerprint"] = fp
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(rec, fh)
    except Exception:
        pass
    return {"daily": daily, "meta": {"source": "open-meteo", "fingerprint": fp,
                                     "location": b}, "path": path}