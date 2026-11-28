"""Hargreaves-Samani reference evapotranspiration (ET0) — custom model.

Pure, deterministic, stdlib-only. Software-tested; NOT scientifically validated.

ET0 = 0.0023 * (Tmean + 17.8) * sqrt(Tmax - Tmin) * 0.408 * Ra
"""

from __future__ import annotations

import math

__all__ = [
    "HARGREAVES_MODEL",
    "HARGREAVES_DEFINITION",
    "compute_hargreaves_et0",
    "validate_hargreaves_input",
]

HARGREAVES_MODEL = {
    "id": "eco-nojin.hydroma.hargreaves-et0",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm/day"],
}

HARGREAVES_DEFINITION = {
    **HARGREAVES_MODEL,
    "domain": "agriculture",
    "title": "Hargreaves-Samani ET0",
    "executionMode": "local",
    "maturity": "tested",
    "inputs": ["tMax", "tMin", "ra"],
    "outputs": ["et0", "tMean"],
    "assumptions": ["Temperature-based reference ET", "Ra in MJ/m^2/day"],
    "limitations": ["NOT_VALIDATED", "Not an operational recommendation"],
}


def validate_hargreaves_input(data) -> list:
    if not isinstance(data, dict):
        return ["input must be an object"]
    errors = []
    for key in ("tMax", "tMin", "ra"):
        if key not in data or not isinstance(data[key], (int, float)):
            errors.append(f"{key} must be a number")
    if not errors and data["tMin"] > data["tMax"]:
        errors.append("tMin must be <= tMax")
    if not errors and data["ra"] < 0:
        errors.append("ra must be >= 0")
    return errors


def compute_hargreaves_et0(data):
    errors = validate_hargreaves_input(data)
    if errors:
        raise ValueError("; ".join(errors))
    t_max = float(data["tMax"])
    t_min = float(data["tMin"])
    ra = float(data["ra"])
    t_mean = (t_max + t_min) / 2.0
    et0 = 0.0023 * (t_mean + 17.8) * math.sqrt(max(0.0, t_max - t_min)) * 0.408 * ra
    return {"et0": round(max(0.0, et0), 4), "tMean": round(t_mean, 4)}