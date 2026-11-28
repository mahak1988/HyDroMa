"""GRACE equivalent water height anomaly (remote sensing).

A bounded, deterministic, stdlib-only model that converts a GRACE/GRACE-FO mass
anomaly into an equivalent water height and volume:

    volume_km3   = mass_change_gt / 1.0            (1 Gt water ~ 1 km3)
    height_cm    = volume_m3 / area_m2 * 100
                 = (mass_change_gt * 1e9) / (area_km2 * 1e6) * 100

NLDAS is a data product (not a model) and is intentionally not implemented here.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "GRACE_MODEL",
    "GRACE_DEFINITION",
    "compute_grace_anomaly",
]

ROUND_DECIMALS = 4

GRACE_MODEL = {
    "id": "eco-nojin.hydroma.grace-anomaly",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "height_cm = mass_gt*1e9/(area_km2*1e6)*100",
    "units": {"mass": "Gt", "height": "cm", "volume": "km3"},
    "method": "GRACE equivalent water height",
}

ASSUMPTIONS = [
    "water_density_1_g_cm3",
    "uniform_area_distribution",
    "mass_anomaly_supplied",
]
LIMITATIONS = [
    "notValidated",
    "no_leakage_correction",
    "no_signal_separation",
    "point_estimate",
]
REFERENCES = [
    "Tapley, J.P., et al. (2018). Contributions of GRACE to climate change. Nature Climate Change 8.",
    "Wahr, J., Molenaar, D., Schmidt, R. (1998). Time variability of the Earth's gravity field. GRL 25.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def compute_grace_anomaly(input: dict | None = None) -> dict:
    input = input or {}
    mass = input.get("mass_change_gt")
    area = input.get("area_km2")
    if not _finite(mass) or not _finite(area) or float(area) <= 0:
        return {"ok": False, "model": GRACE_MODEL,
                "errors": [{"field": "mass_change_gt/area_km2", "code": "INVALID"}]}
    volume_km3 = float(mass)  # 1 Gt water ~ 1 km3
    height_cm = (float(mass) * 1e9) / (float(area) * 1e6) * 100.0
    return {
        "ok": True, "model": GRACE_MODEL,
        "result": {"method": "GRACE equivalent water height",
                   "mass_change_gt": _round(float(mass)), "area_km2": _round(float(area)),
                   "volume_km3": _round(volume_km3), "equivalent_height_cm": _round(height_cm),
                   "trend": "depletion" if height_cm < 0 else "gain"},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


GRACE_DEFINITION = {
    "id": GRACE_MODEL["id"],
    "version": GRACE_MODEL["version"],
    "domain": "remote-sensing",
    "title": "GRACE equivalent water height anomaly",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["Gt", "cm", "km3"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "mass_change_gt", "kind": "number", "required": True},
        {"name": "area_km2", "kind": "number", "required": True},
    ],
    "outputs": [
        {"name": "equivalent_height_cm", "kind": "number", "unit": "cm"},
        {"name": "volume_km3", "kind": "number", "unit": "km3"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_remote_sensing.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}