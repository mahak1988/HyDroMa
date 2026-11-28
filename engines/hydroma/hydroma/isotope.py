"""Isotope hydrology: deuterium excess & two-component mixing.

Two bounded, deterministic, stdlib-only models (single registered model that
dispatches on ``method``):

1. **Deuterium excess** (Dansgaard 1964): ``d = δ2H - 8 * δ18O`` (per mil).

2. **Two-component mixing**: the fraction of an "old" component in a mixture
   from the isotope mass balance
   ``f_old = (δ_mix - δ_new) / (δ_old - δ_new)``.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "ISOTOPE_MODEL",
    "ISOTOPE_DEFINITION",
    "compute_deuterium_excess",
    "compute_two_component_mixing",
    "isotope_adapter",
]

ROUND_DECIMALS = 4

ISOTOPE_MODEL = {
    "id": "eco-nojin.hydroma.isotope-hydrology",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "d=δ2H-8δ18O; f_old=(δmix-δnew)/(δold-δnew)",
    "units": {"isotope": "per_mil"},
    "method": "d-excess + two-component mixing",
}

ASSUMPTIONS = [
    "delta_notation_per_mil",
    "global_meteoric_line_slope_8",
    "two_endmember_mixing",
    "conservative_tracer",
]
LIMITATIONS = [
    "notValidated",
    "no_fractionation_correction",
    "two_components_only",
    "no_evaporation_line_fit",
]
REFERENCES = [
    "Dansgaard, W. (1964). Stable isotopes in precipitation. Tellus 16.",
    "Craig, H. (1961). Isotopic variations in meteoric waters. Science 133.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def compute_deuterium_excess(input: dict | None = None) -> dict:
    input = input or {}
    d2h = input.get("delta_2h")
    d18o = input.get("delta_18o")
    if not _finite(d2h) or not _finite(d18o):
        return {"ok": False, "model": ISOTOPE_MODEL,
                "errors": [{"field": "delta", "code": "INVALID"}]}
    d = float(d2h) - 8.0 * float(d18o)
    return {
        "ok": True, "model": ISOTOPE_MODEL,
        "result": {"method": "deuterium excess (Dansgaard 1964)",
                   "delta_2h": _round(float(d2h)), "delta_18o": _round(float(d18o)),
                   "d_excess": _round(d)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_two_component_mixing(input: dict | None = None) -> dict:
    input = input or {}
    for key in ("delta_mix", "delta_old", "delta_new"):
        if not _finite(input.get(key)):
            return {"ok": False, "model": ISOTOPE_MODEL,
                    "errors": [{"field": key, "code": "INVALID"}]}
    do = float(input["delta_old"])
    dn = float(input["delta_new"])
    dm = float(input["delta_mix"])
    if do == dn:
        return {"ok": False, "model": ISOTOPE_MODEL,
                "errors": [{"field": "endmembers", "code": "IDENTICAL"}]}
    f_old = (dm - dn) / (do - dn)
    return {
        "ok": True, "model": ISOTOPE_MODEL,
        "result": {"method": "two-component mixing", "delta_mix": _round(dm),
                   "delta_old": _round(do), "delta_new": _round(dn),
                   "fraction_old": _round(f_old), "fraction_new": _round(1.0 - f_old)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def isotope_adapter(input: dict | None = None) -> dict:
    input = input or {}
    method = input.get("method", "dexcess")
    if method == "mixing":
        return compute_two_component_mixing(input)
    return compute_deuterium_excess(input)


ISOTOPE_DEFINITION = {
    "id": ISOTOPE_MODEL["id"],
    "version": ISOTOPE_MODEL["version"],
    "domain": "groundwater",
    "title": "Isotope hydrology (d-excess + two-component mixing)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["per_mil"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "method", "kind": "string", "required": False, "description": "dexcess (default) | mixing"},
        {"name": "delta_2h", "kind": "number", "required": False},
        {"name": "delta_18o", "kind": "number", "required": False},
        {"name": "delta_mix", "kind": "number", "required": False},
        {"name": "delta_old", "kind": "number", "required": False},
        {"name": "delta_new", "kind": "number", "required": False},
    ],
    "outputs": [
        {"name": "d_excess", "kind": "number", "unit": "per_mil"},
        {"name": "fraction_old", "kind": "number"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_isotope.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}