"""Biodiversity & stress indices: WBGT, THI, habitat quality (InVEST-lite),
species suitability (MaxEnt-lite / BIOCLIM envelope).

Four bounded, deterministic, stdlib-only models (single registered model that
dispatches on ``method``):

1. **WBGT** (ISO 7243) - wet-bulb globe temperature:
   outdoor ``0.7 Tnwb + 0.2 Tg + 0.1 Tdb``; indoor ``0.7 Tnwb + 0.3 Tg``.

2. **THI** (NRC 1971) - temperature-humidity index:
   ``THI = (1.8 T + 32) - (0.55 - 0.0055 RH)(1.8 T - 26)``.

3. **Habitat quality (InVEST-lite)** - ``Q = 1 - sum(threat_i * weight_i *
   sensitivity)``, clamped to [0, 1].

4. **Species suitability (MaxEnt-lite)** - BIOCLIM-style envelope: the product
   of per-variable membership in ``[min, max]`` (1 inside, 0 outside).

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "BIODIVERSITY_MODEL",
    "BIODIVERSITY_DEFINITION",
    "compute_wbgt",
    "compute_thi",
    "compute_habitat_quality",
    "compute_species_suitability",
    "biodiversity_adapter",
]

ROUND_DECIMALS = 4

BIODIVERSITY_MODEL = {
    "id": "eco-nojin.hydroma.biodiversity-stress",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "WBGT; THI; Q=1-sum(threat*w*sens); suit=prod(envelope)",
    "units": {"temp": "degC", "index": "dimensionless"},
    "method": "WBGT + THI + InVEST-lite + MaxEnt-lite",
}

ASSUMPTIONS = [
    "iso7243_wbgt",
    "nrc_thi",
    "invit_threat_weighted",
    "bioclim_envelope_product",
]
LIMITATIONS = [
    "notValidated",
    "wbgt_no_solar_load_model",
    "thi_livestock_oriented",
    "maxent_lite_no_maxent",
    "habitat_single_sensitivity",
]
REFERENCES = [
    "ISO 7243 (2017). Ergonomics of the thermal environment - WBGT index.",
    "NRC (1971). A Guide to Environmental Research on Animals. National Academies Press.",
    "Sharp, N.J. et al. (2015). InVEST 3.2.0 User's Guide. Natural Capital Project.",
    "Phillips, S.J., Anderson, R.P., Schapire, R.E. (2006). Maximum entropy modeling. Ecological Modelling 190.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def compute_wbgt(input: dict | None = None) -> dict:
    input = input or {}
    errors = []
    for key in ("tnwb_c", "tg_c"):
        if not _finite(input.get(key)):
            errors.append({"field": key, "code": "INVALID"})
    if input.get("indoor") and not _finite(input.get("tg_c")):
        errors.append({"field": "tg_c", "code": "INVALID"})
    if not input.get("indoor") and not _finite(input.get("tdb_c")):
        errors.append({"field": "tdb_c", "code": "INVALID"})
    if errors:
        return {"ok": False, "model": BIODIVERSITY_MODEL, "errors": errors}
    tnwb = float(input["tnwb_c"])
    tg = float(input["tg_c"])
    if input.get("indoor"):
        wbgt = 0.7 * tnwb + 0.3 * tg
        setting = "indoor"
    else:
        tdb = float(input["tdb_c"])
        wbgt = 0.7 * tnwb + 0.2 * tg + 0.1 * tdb
        setting = "outdoor"
    return {
        "ok": True, "model": BIODIVERSITY_MODEL,
        "result": {"method": "WBGT (ISO 7243)", "setting": setting,
                   "wbgt_c": _round(wbgt)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_thi(input: dict | None = None) -> dict:
    input = input or {}
    errors = []
    if not _finite(input.get("t_c")):
        errors.append({"field": "t_c", "code": "INVALID"})
    if not _finite(input.get("rh_pct")) or not (0.0 <= float(input.get("rh_pct", -1)) <= 100.0):
        errors.append({"field": "rh_pct", "code": "INVALID"})
    if errors:
        return {"ok": False, "model": BIODIVERSITY_MODEL, "errors": errors}
    t = float(input["t_c"])
    rh = float(input["rh_pct"])
    thi = (1.8 * t + 32.0) - (0.55 - 0.0055 * rh) * (1.8 * t - 26.0)
    return {
        "ok": True, "model": BIODIVERSITY_MODEL,
        "result": {"method": "THI (NRC 1971)", "t_c": _round(t), "rh_pct": _round(rh),
                   "thi": _round(thi)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_habitat_quality(input: dict | None = None) -> dict:
    input = input or {}
    threats = input.get("threats")
    errors = []
    if not isinstance(threats, list):
        errors.append({"field": "threats", "code": "INVALID"})
    else:
        for i, th in enumerate(threats):
            if not isinstance(th, dict):
                errors.append({"field": f"threats[{i}]", "code": "INVALID"})
                break
            for k in ("weight", "sensitivity"):
                if not _finite(th.get(k)):
                    errors.append({"field": f"threats[{i}].{k}", "code": "INVALID"})
                    break
    if errors:
        return {"ok": False, "model": BIODIVERSITY_MODEL, "errors": errors}
    degradation = sum(float(th["weight"]) * float(th["sensitivity"]) for th in threats)
    quality = max(0.0, min(1.0, 1.0 - degradation))
    return {
        "ok": True, "model": BIODIVERSITY_MODEL,
        "result": {"method": "InVEST-lite habitat quality", "threats": len(threats),
                   "degradation": _round(degradation), "quality": _round(quality)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_species_suitability(input: dict | None = None) -> dict:
    input = input or {}
    variables = input.get("variables")
    errors = []
    if not isinstance(variables, list) or len(variables) == 0:
        errors.append({"field": "variables", "code": "INVALID"})
    else:
        for i, v in enumerate(variables):
            if not isinstance(v, dict):
                errors.append({"field": f"variables[{i}]", "code": "INVALID"})
                break
            for k in ("value", "min", "max"):
                if not _finite(v.get(k)):
                    errors.append({"field": f"variables[{i}].{k}", "code": "INVALID"})
                    break
            else:
                if float(v["min"]) > float(v["max"]):
                    errors.append({"field": f"variables[{i}]", "code": "MIN_GT_MAX"})
                    break
    if errors:
        return {"ok": False, "model": BIODIVERSITY_MODEL, "errors": errors}
    suitability = 1.0
    detail = []
    for v in variables:
        val, lo, hi = float(v["value"]), float(v["min"]), float(v["max"])
        member = 1.0 if lo <= val <= hi else 0.0
        suitability *= member
        detail.append({"value": _round(val), "min": _round(lo), "max": _round(hi),
                       "member": member})
    return {
        "ok": True, "model": BIODIVERSITY_MODEL,
        "result": {"method": "MaxEnt-lite (BIOCLIM envelope)", "variables": len(variables),
                   "suitability": _round(suitability), "detail": detail},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def biodiversity_adapter(input: dict | None = None) -> dict:
    input = input or {}
    method = input.get("method", "wbgt")
    if method == "thi":
        return compute_thi(input)
    if method == "habitat":
        return compute_habitat_quality(input)
    if method == "species":
        return compute_species_suitability(input)
    return compute_wbgt(input)


BIODIVERSITY_DEFINITION = {
    "id": BIODIVERSITY_MODEL["id"],
    "version": BIODIVERSITY_MODEL["version"],
    "domain": "landscape",
    "title": "Biodiversity & stress (WBGT, THI, InVEST-lite, MaxEnt-lite)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["degC", "dimensionless"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "method", "kind": "string", "required": False,
         "description": "wbgt (default) | thi | habitat | species"},
        {"name": "tnwb_c", "kind": "number", "required": False},
        {"name": "tg_c", "kind": "number", "required": False},
        {"name": "tdb_c", "kind": "number", "required": False},
        {"name": "indoor", "kind": "boolean", "required": False},
        {"name": "t_c", "kind": "number", "required": False},
        {"name": "rh_pct", "kind": "number", "required": False},
        {"name": "threats", "kind": "array", "required": False},
        {"name": "variables", "kind": "array", "required": False},
    ],
    "outputs": [
        {"name": "wbgt_c", "kind": "number"},
        {"name": "thi", "kind": "number"},
        {"name": "quality", "kind": "number"},
        {"name": "suitability", "kind": "number"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_biodiversity_stress.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}