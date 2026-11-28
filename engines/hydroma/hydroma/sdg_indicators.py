"""SDG indicator calculations: 6.4.1, 2.4.1, 15.3.1.

Three bounded, deterministic, stdlib-only models (single registered model that
dispatches on ``method``):

1. **SDG 6.4.1** - water use efficiency: economic value per unit of water
   withdrawal (US$/m³).
2. **SDG 2.4.1** - share of agricultural area under sustainable practices (%).
3. **SDG 15.3.1** - share of degraded land (degraded area / total land area, %).

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "SDG_MODEL",
    "SDG_DEFINITION",
    "compute_sdg_641",
    "compute_sdg_241",
    "compute_sdg_1531",
    "sdg_adapter",
]

ROUND_DECIMALS = 4

SDG_MODEL = {
    "id": "eco-nojin.hydroma.sdg-indicators",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "6.4.1=value/water; 2.4.1=sust/total*100; 15.3.1=degr/total*100",
    "units": {"value": "US$/m3", "share": "%"},
    "method": "SDG 6.4.1 / 2.4.1 / 15.3.1",
}

ASSUMPTIONS = [
    "value_per_water",
    "area_share",
    "degraded_area_share",
]
LIMITATIONS = [
    "notValidated",
    "single_indicator_point",
    "no_temporal_series",
]
REFERENCES = [
    "UN (2020). SDG indicator 6.4.1 metadata. UNSD.",
    "UN (2020). SDG indicator 2.4.1 metadata. UNSD.",
    "UN (2020). SDG indicator 15.3.1 metadata. UNCCD.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def compute_sdg_641(input: dict | None = None) -> dict:
    input = input or {}
    val = input.get("economic_value_usd")
    water = input.get("water_withdrawal_m3")
    if not _finite(val) or float(val) < 0 or not _finite(water) or float(water) <= 0:
        return {"ok": False, "model": SDG_MODEL,
                "errors": [{"field": "economic_value_usd/water_withdrawal_m3", "code": "INVALID"}]}
    wue = float(val) / float(water)
    return {
        "ok": True, "model": SDG_MODEL,
        "result": {"indicator": "6.4.1", "economic_value_usd": _round(float(val)),
                   "water_withdrawal_m3": _round(float(water)),
                   "water_use_efficiency_usd_m3": _round(wue)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_sdg_241(input: dict | None = None) -> dict:
    input = input or {}
    sust = input.get("sustainable_area_ha")
    total = input.get("total_area_ha")
    if not _finite(sust) or float(sust) < 0 or not _finite(total) or float(total) <= 0:
        return {"ok": False, "model": SDG_MODEL,
                "errors": [{"field": "sustainable_area_ha/total_area_ha", "code": "INVALID"}]}
    share = float(sust) / float(total) * 100.0
    return {
        "ok": True, "model": SDG_MODEL,
        "result": {"indicator": "2.4.1", "sustainable_area_ha": _round(float(sust)),
                   "total_area_ha": _round(float(total)), "share_pct": _round(share)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_sdg_1531(input: dict | None = None) -> dict:
    input = input or {}
    degr = input.get("degraded_area_ha")
    total = input.get("total_land_area_ha")
    if not _finite(degr) or float(degr) < 0 or not _finite(total) or float(total) <= 0:
        return {"ok": False, "model": SDG_MODEL,
                "errors": [{"field": "degraded_area_ha/total_land_area_ha", "code": "INVALID"}]}
    share = float(degr) / float(total) * 100.0
    return {
        "ok": True, "model": SDG_MODEL,
        "result": {"indicator": "15.3.1", "degraded_area_ha": _round(float(degr)),
                   "total_land_area_ha": _round(float(total)), "degraded_share_pct": _round(share)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def sdg_adapter(input: dict | None = None) -> dict:
    input = input or {}
    method = input.get("method", "6.4.1")
    if method == "2.4.1":
        return compute_sdg_241(input)
    if method == "15.3.1":
        return compute_sdg_1531(input)
    return compute_sdg_641(input)


SDG_DEFINITION = {
    "id": SDG_MODEL["id"],
    "version": SDG_MODEL["version"],
    "domain": "water",
    "title": "SDG indicators (6.4.1 / 2.4.1 / 15.3.1)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["US$/m3", "%"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "method", "kind": "string", "required": False, "description": "6.4.1 (default) | 2.4.1 | 15.3.1"},
        {"name": "economic_value_usd", "kind": "number", "required": False},
        {"name": "water_withdrawal_m3", "kind": "number", "required": False},
        {"name": "sustainable_area_ha", "kind": "number", "required": False},
        {"name": "total_area_ha", "kind": "number", "required": False},
        {"name": "degraded_area_ha", "kind": "number", "required": False},
        {"name": "total_land_area_ha", "kind": "number", "required": False},
    ],
    "outputs": [
        {"name": "water_use_efficiency_usd_m3", "kind": "number"},
        {"name": "share_pct", "kind": "number", "unit": "%"},
        {"name": "degraded_share_pct", "kind": "number", "unit": "%"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_sdg_indicators.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}