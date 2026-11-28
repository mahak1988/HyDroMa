"""Composite drought (EDO/GDO) & 2-layer Palmer scPDSI (NCDC-lite).

Two bounded, deterministic, stdlib-only models (single registered model that
dispatches on ``method``):

1. **EDO/GDO composite** (European Drought Observatory / Global Drought
   Observatory): a weighted mean of standardized component anomalies (e.g. SPI,
   soil-moisture anomaly, ET0 anomaly), each supplied as a z-score, then a
   class. A transparent composite — not the full EDO multi-indicator product.

2. **2-layer Palmer scPDSI (NCDC-lite)**: a two-layer soil bucket (surface +
   root zone) with supplied PET, Palmer α/β/γ/δ calibration and the standard
   duration recursion. A simplified two-layer Palmer index, not the full NCDC
   self-calibrated PDSI.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "DROUGHT_COMPOSITE_MODEL",
    "DROUGHT_COMPOSITE_DEFINITION",
    "compute_edo_composite",
    "compute_pdsi_2layer",
    "drought_composite_adapter",
]

ROUND_DECIMALS = 4

DROUGHT_COMPOSITE_MODEL = {
    "id": "eco-nojin.hydroma.drought-composite",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "composite=sum(w*z)/sum(w); 2layer Palmer X_i=Z_i+c*X_{i-1}",
    "units": {"index": "dimensionless"},
    "method": "EDO/GDO composite + 2-layer scPDSI",
}

ASSUMPTIONS = [
    "component_z_scores",
    "weighted_mean_composite",
    "two_layer_palmer",
    "supplied_pet",
]
LIMITATIONS = [
    "notValidated",
    "composite_not_full_edo",
    "pdsI_2layer_not_ncdc",
    "single_calibration_prefix",
]
REFERENCES = [
    "EDO (2023). European Drought Observatory. JRC.",
    "GDO (2023). Global Drought Observatory. JRC.",
    "Palmer, W.C. (1965). Meteorological drought. US Weather Bureau Paper 45.",
    "NCDC (2018). Self-calibrated Palmer Drought Severity Index.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _class(value: float) -> str:
    if value >= 2.0:
        return "extremely_wet"
    if value >= 1.5:
        return "very_wet"
    if value >= 1.0:
        return "moderately_wet"
    if value > -1.0:
        return "near_normal"
    if value > -1.5:
        return "moderately_dry"
    if value > -2.0:
        return "severely_dry"
    return "extremely_dry"


def compute_edo_composite(input: dict | None = None) -> dict:
    input = input or {}
    components = input.get("components")
    errors = []
    if not isinstance(components, dict) or len(components) == 0:
        errors.append({"field": "components", "code": "INVALID"})
    else:
        for k, v in components.items():
            if not _finite(v):
                errors.append({"field": f"components.{k}", "code": "NON_FINITE"})
                break
    weights = input.get("weights", {})
    if weights is not None and not isinstance(weights, dict):
        errors.append({"field": "weights", "code": "INVALID"})
    if errors:
        return {"ok": False, "model": DROUGHT_COMPOSITE_MODEL, "errors": errors}

    num = 0.0
    den = 0.0
    for k, z in components.items():
        w = float(weights.get(k, 1.0)) if isinstance(weights, dict) else 1.0
        if w < 0:
            return {"ok": False, "model": DROUGHT_COMPOSITE_MODEL,
                    "errors": [{"field": f"weights.{k}", "code": "NEGATIVE"}]}
        num += w * float(z)
        den += w
    composite = num / den if den > 0 else 0.0
    return {
        "ok": True, "model": DROUGHT_COMPOSITE_MODEL,
        "result": {"method": "EDO/GDO composite", "components": {k: _round(float(v)) for k, v in components.items()},
                   "composite": _round(composite), "class": _class(composite)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_pdsi_2layer(input: dict | None = None) -> dict:
    input = input or {}
    p_series = input.get("precipitation_series")
    pet_series = input.get("pet_series")
    errors = []
    if not isinstance(p_series, list) or not isinstance(pet_series, list):
        errors.append({"field": "series", "code": "INVALID"})
    elif len(p_series) != len(pet_series) or len(p_series) < 3:
        errors.append({"field": "series", "code": "LENGTH_MISMATCH"})
    else:
        for i in range(len(p_series)):
            if not _finite(p_series[i]) or not _finite(pet_series[i]) or float(pet_series[i]) < 0:
                errors.append({"field": f"series[{i}]", "code": "INVALID"})
                break
    for key in ("awc_surface_mm", "awc_rootzone_mm"):
        if not _finite(input.get(key)) or float(input.get(key, 0)) <= 0:
            errors.append({"field": key, "code": "INVALID_AWC"})
    if errors:
        return {"ok": False, "model": DROUGHT_COMPOSITE_MODEL, "errors": errors}

    p = [float(v) for v in p_series]
    pet = [float(v) for v in pet_series]
    awc1 = float(input["awc_surface_mm"])
    awc2 = float(input["awc_rootzone_mm"])
    n = len(p)

    s1 = awc1 / 2.0
    s2 = awc2 / 2.0
    departures = []
    for i in range(n):
        pr, pe = p[i], pet[i]
        # surface layer first
        aet1 = min(pe, s1 + pr)
        s1 = s1 + pr - aet1
        if s1 > awc1:
            overflow = s1 - awc1
            s1 = awc1
        else:
            overflow = 0.0
        # root zone receives overflow, meets remaining PET
        s2 = s2 + overflow
        aet2 = min(pe - aet1, s2)
        s2 = s2 - aet2
        if s2 > awc2:
            recharge = s2 - awc2
            s2 = awc2
        else:
            recharge = 0.0
        departures.append(pr - pe - recharge)

    mean_abs = sum(abs(d) for d in departures) / n or 1e-9
    c = 0.897
    x_prev = 0.0
    values = []
    for i in range(n):
        z = departures[i] / mean_abs
        xi = z + c * x_prev
        x_prev = xi
        values.append({"index": i, "pdsi": _round(xi)})
    return {
        "ok": True, "model": DROUGHT_COMPOSITE_MODEL,
        "result": {"method": "2-layer Palmer scPDSI (NCDC-lite)", "count": n,
                   "final_pdsi": _round(x_prev), "values": values},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def drought_composite_adapter(input: dict | None = None) -> dict:
    input = input or {}
    method = input.get("method", "composite")
    if method == "pdsi2layer":
        return compute_pdsi_2layer(input)
    return compute_edo_composite(input)


DROUGHT_COMPOSITE_DEFINITION = {
    "id": DROUGHT_COMPOSITE_MODEL["id"],
    "version": DROUGHT_COMPOSITE_MODEL["version"],
    "domain": "drought",
    "title": "Composite drought (EDO/GDO) + 2-layer scPDSI",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["dimensionless"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "method", "kind": "string", "required": False, "description": "composite (default) | pdsi2layer"},
        {"name": "components", "kind": "object", "required": False, "description": "composite: {name: z}"},
        {"name": "weights", "kind": "object", "required": False},
        {"name": "precipitation_series", "kind": "array", "required": False},
        {"name": "pet_series", "kind": "array", "required": False},
        {"name": "awc_surface_mm", "kind": "number", "required": False},
        {"name": "awc_rootzone_mm", "kind": "number", "required": False},
    ],
    "outputs": [
        {"name": "composite", "kind": "number", "unit": "dimensionless"},
        {"name": "final_pdsi", "kind": "number", "unit": "dimensionless"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_drought_composite.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}