"""Growing Degree Days (GDD) — custom agricultural model.

Pure, deterministic, stdlib-only. Software-tested; NOT scientifically validated.

GDD_day = max(0, (Tmax_capped + Tmin) / 2 - Tbase)
"""

from __future__ import annotations

__all__ = [
    "GDD_MODEL",
    "GDD_DEFINITION",
    "compute_gdd",
    "accumulate_gdd",
    "validate_gdd_input",
]

GDD_MODEL = {
    "id": "eco-nojin.hydroma.gdd",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "units": ["degC", "degree-day"],
}

GDD_DEFINITION = {
    **GDD_MODEL,
    "domain": "agriculture",
    "title": "Growing Degree Days",
    "executionMode": "local",
    "maturity": "tested",
    "inputs": ["tMax", "tMin", "tBase", "tCap"],
    "outputs": ["gdd", "dailyMean", "capped"],
    "assumptions": ["Daily mean is (Tmax + Tmin) / 2", "No upper cap unless tCap is provided"],
    "limitations": ["NOT_VALIDATED", "Not an operational recommendation"],
}


def validate_gdd_input(data) -> list:
    errors = []
    if not isinstance(data, dict):
        return ["input must be an object"]
    for key in ("tMax", "tMin", "tBase"):
        if key not in data or not isinstance(data[key], (int, float)):
            errors.append(f"{key} must be a number")
    if not errors and data["tMin"] > data["tMax"]:
        errors.append("tMin must be <= tMax")
    if "tCap" in data and data["tCap"] is not None and not isinstance(data["tCap"], (int, float)):
        errors.append("tCap must be a number")
    return errors


def compute_gdd(data):
    errors = validate_gdd_input(data)
    if errors:
        raise ValueError("; ".join(errors))
    t_max = float(data["tMax"])
    t_min = float(data["tMin"])
    t_base = float(data["tBase"])
    t_cap = data.get("tCap")
    capped = False
    if t_cap is not None and t_max > float(t_cap):
        t_max = float(t_cap)
        capped = True
    daily_mean = (t_max + t_min) / 2.0
    gdd = max(0.0, daily_mean - t_base)
    return {"gdd": round(gdd, 4), "dailyMean": round(daily_mean, 4), "capped": capped}


def accumulate_gdd(days):
    return round(sum(compute_gdd(d)["gdd"] for d in days), 4)