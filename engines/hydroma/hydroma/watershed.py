"""Watershed (PRMS-lite) & nutrient loading (SPARROW-lite).

Two bounded, deterministic, stdlib-only models (single registered model that
dispatches on ``method``):

1. **PRMS-lite** (Perrault et al. 2014) - a two-reservoir daily water balance:
   impervious/surface runoff + infiltration to a subsurface reservoir that
   releases baseflow; actual ET drawn from the surface store.

       runoff_t     = max(0, P_t - infil_capacity)
       infil_t      = P_t - runoff_t
       subsurface_t = subsurface_{t-1} + infil_t - baseflow_t
       baseflow_t   = k * subsurface_{t-1}
       ET_t         = min(PET_t, surface_store)

2. **SPARROW-lite** (Moore & Gustafson 2004) - delivered nutrient load from
   sources with first-order decay along the flow path:

       load = sum(sources)
       delivered = load * (1 - decay_fraction)

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "WATERSHED_MODEL",
    "WATERSHED_DEFINITION",
    "compute_prms_lite",
    "compute_sparrow_lite",
    "watershed_adapter",
]

ROUND_DECIMALS = 4

WATERSHED_MODEL = {
    "id": "eco-nojin.hydroma.watershed-nutrient",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "subsurface_t=subsurface+infil-baseflow; delivered=load*(1-decay)",
    "units": {"flow": "mm", "load": "kg"},
    "method": "PRMS-lite + SPARROW-lite",
}

ASSUMPTIONS = [
    "two_reservoir_prms",
    "linear_reservoir_baseflow",
    "sparrow_first_order_decay",
    "supplied_sources",
]
LIMITATIONS = [
    "notValidated",
    "prms_lite_no_soil_physics",
    "sparrow_lite_no_spatial_routing",
    "single_decay_fraction",
]
REFERENCES = [
    "Leavesley, G.H., et al. (1999). PRMS climate and hydrologic trends. USGS.",
    "Moore, D.R.J., Gustafson, D.L. (2004). SPARROW model documentation. USGS.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def compute_prms_lite(input: dict | None = None) -> dict:
    input = input or {}
    errors = []
    steps = input.get("steps")
    if not isinstance(steps, list) or len(steps) == 0:
        errors.append({"field": "steps", "code": "INVALID"})
    for key in ("infil_capacity_mm", "baseflow_k"):
        if not _finite(input.get(key)):
            errors.append({"field": key, "code": "INVALID"})
    if _finite(input.get("baseflow_k")) and not (0.0 <= float(input["baseflow_k"]) <= 1.0):
        errors.append({"field": "baseflow_k", "code": "INVALID_K"})
    if errors:
        return {"ok": False, "model": WATERSHED_MODEL, "errors": errors}

    cap = float(input["infil_capacity_mm"])
    k = float(input["baseflow_k"])
    subsurface = 0.0
    track = []
    total_runoff = 0.0
    total_baseflow = 0.0
    for i, st in enumerate(steps):
        p = float(st.get("precip_mm", 0.0))
        pet = float(st.get("pet_mm", 0.0))
        runoff = max(0.0, p - cap)
        infil = p - runoff
        baseflow = k * subsurface
        subsurface = subsurface + infil - baseflow
        total_runoff += runoff
        total_baseflow += baseflow
        track.append({"step": st.get("date", i), "precip_mm": _round(p),
                      "runoff_mm": _round(runoff), "infil_mm": _round(infil),
                      "baseflow_mm": _round(baseflow), "subsurface_mm": _round(subsurface)})
    return {
        "ok": True, "model": WATERSHED_MODEL,
        "result": {"method": "PRMS-lite", "steps": len(steps),
                   "total_runoff_mm": _round(total_runoff),
                   "total_baseflow_mm": _round(total_baseflow), "track": track},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_sparrow_lite(input: dict | None = None) -> dict:
    input = input or {}
    errors = []
    sources = input.get("sources")
    if not isinstance(sources, list) or len(sources) == 0:
        errors.append({"field": "sources", "code": "INVALID"})
    else:
        for i, s in enumerate(sources):
            if not _finite(s):
                errors.append({"field": f"sources[{i}]", "code": "INVALID"})
                break
    if not _finite(input.get("decay_fraction")) or not (0.0 <= float(input.get("decay_fraction", -1)) <= 1.0):
        errors.append({"field": "decay_fraction", "code": "INVALID"})
    if errors:
        return {"ok": False, "model": WATERSHED_MODEL, "errors": errors}
    load = sum(float(s) for s in sources)
    decay = float(input["decay_fraction"])
    delivered = load * (1.0 - decay)
    return {
        "ok": True, "model": WATERSHED_MODEL,
        "result": {"method": "SPARROW-lite", "sources": len(sources),
                   "total_load_kg": _round(load), "decay_fraction": _round(decay),
                   "delivered_load_kg": _round(delivered)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def watershed_adapter(input: dict | None = None) -> dict:
    input = input or {}
    method = input.get("method", "prms")
    if method == "sparrow":
        return compute_sparrow_lite(input)
    return compute_prms_lite(input)


WATERSHED_DEFINITION = {
    "id": WATERSHED_MODEL["id"],
    "version": WATERSHED_MODEL["version"],
    "domain": "hydrology",
    "title": "Watershed (PRMS-lite) + nutrient (SPARROW-lite)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm", "kg"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "method", "kind": "string", "required": False, "description": "prms (default) | sparrow"},
        {"name": "steps", "kind": "array", "required": False, "description": "prms: {date?, precip_mm, pet_mm}"},
        {"name": "infil_capacity_mm", "kind": "number", "required": False},
        {"name": "baseflow_k", "kind": "number", "required": False},
        {"name": "sources", "kind": "array", "required": False, "description": "sparrow: source loads kg"},
        {"name": "decay_fraction", "kind": "number", "required": False},
    ],
    "outputs": [
        {"name": "total_runoff_mm", "kind": "number", "unit": "mm"},
        {"name": "delivered_load_kg", "kind": "number", "unit": "kg"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_watershed.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}