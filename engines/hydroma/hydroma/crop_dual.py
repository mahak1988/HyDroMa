"""FAO-56 dual crop coefficient (Kcb + Ke) & AquaCrop-lite biomass.

Two bounded, deterministic, stdlib-only models:

1. **Dual-Kc ETc** (FAO-56 Ch.7, Allen et al. 1998):

       Kc_max = max(1.2 + 0.04*u2 - 0.004*(rh_min - 30), kcb + 0.05)
       Kr     = clamp((TEW - De) / (TEW - REW), 0, 1)
       Ke     = Kr * (Kc_max - kcb)
       ETc    = (Ks*Kcb + Ke) * ET0

   ``De`` (surface evaporation depletion), ``REW`` and ``TEW`` must be supplied;
   if absent, ``Ke = 0`` (collapses to the single-Kc form, documented).

2. **AquaCrop-lite biomass** (Steduto et al. 2009; FAO 66):

       Biomass = WPb * sum(Tr)            [g/m2]  (Tr in mm, WPb g/m2/mm)
       Yield   = HI * Biomass

   A single biomass-water-productivity pool; no canopy cover dynamics, no
   climate normalization, no stress on HI.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "CROP_DUAL_MODEL",
    "CROP_DUAL_DEFINITION",
    "AQUACROP_LITE_MODEL",
    "AQUACROP_LITE_DEFINITION",
    "compute_dual_crop_etc",
    "compute_aquacrop_lite",
    "validate_dual_crop_input",
    "validate_aquacrop_input",
]

ROUND_DECIMALS = 4

CROP_DUAL_MODEL = {
    "id": "eco-nojin.hydroma.dual-kc",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "ETc=(Ks*Kcb+Ke)*ET0; Ke=Kr*(Kc_max-Kcb)",
    "units": {"etc": "mm", "kc": "dimensionless"},
    "method": "FAO-56 dual crop coefficient (Kcb + Ke)",
}

AQUACROP_LITE_MODEL = {
    "id": "eco-nojin.hydroma.aquacrop-lite",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "Biomass=WPb*sum(Tr); Yield=HI*Biomass",
    "units": {"biomass": "g/m2", "tr": "mm"},
    "method": "AquaCrop-lite biomass water productivity",
}

ASSUMPTIONS = [
    "dual_kcb_ke",
    "surface_depletion_supplied",
    "single_biomass_pool",
    "wpb_supplied",
    "harvest_index_supplied",
]
LIMITATIONS = [
    "notValidated",
    "no_canopy_cover_dynamics",
    "no_climate_normalization",
    "ke_zero_when_de_absent",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). FAO Irrigation & Drainage Paper 56.",
    "Steduto, N., Hsiao, T.C., Raes, D., Fereres, E. (2009). AquaCrop, the FAO crop model. Field Crops Research.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def validate_dual_crop_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    for key in ("et0_mm", "kcb"):
        if not _finite(input.get(key)) or float(input.get(key, 0)) < 0:
            errors.append({"field": key, "code": "INVALID"})
    ks = input.get("ks", 1.0)
    if not _finite(ks) or not (0.0 <= float(ks) <= 1.0):
        errors.append({"field": "ks", "code": "INVALID_KS"})
    # If surface-evaporation inputs are provided, they must be consistent.
    de = input.get("de_mm")
    if de is not None and (not _finite(de) or float(de) < 0):
        errors.append({"field": "de_mm", "code": "INVALID_DE"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_dual_crop_etc(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_dual_crop_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": CROP_DUAL_MODEL, "errors": validation["errors"]}

    et0 = float(input["et0_mm"])
    kcb = float(input["kcb"])
    ks = float(input.get("ks", 1.0))
    u2 = float(input.get("u2", 2.0))
    rh_min = float(input.get("rh_min", 45.0))

    kc_max = max(1.2 + 0.04 * u2 - 0.004 * (rh_min - 30.0), kcb + 0.05)

    de = input.get("de_mm")
    rew = input.get("rew_mm")
    tew = input.get("tew_mm")
    ke = 0.0
    kr = 0.0
    ke_available = False
    if de is not None and _finite(rew) and _finite(tew) and float(tew) > float(rew):
        de = float(de)
        rew = float(rew)
        tew = float(tew)
        kr = _clamp((tew - de) / (tew - rew), 0.0, 1.0)
        ke = kr * (kc_max - kcb)
        ke_available = True

    etc = (ks * kcb + ke) * et0
    return {
        "ok": True, "model": CROP_DUAL_MODEL,
        "result": {
            "et0_mm": _round(et0), "kcb": _round(kcb), "ks": _round(ks),
            "kc_max": _round(kc_max), "kr": _round(kr), "ke": _round(ke),
            "etc_mm": _round(etc),
            "etc_source": "dual_kcb_ke" if ke_available else "single_kcb (Ke=0, De absent)",
        },
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def validate_aquacrop_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    tr = input.get("transpiration_series")
    if not isinstance(tr, list) or len(tr) == 0:
        errors.append({"field": "transpiration_series", "code": "INVALID"})
    else:
        for i, v in enumerate(tr):
            if not _finite(v) or float(v) < 0:
                errors.append({"field": f"transpiration_series[{i}]", "code": "INVALID"})
                break
    for key in ("wpb", "harvest_index"):
        if not _finite(input.get(key)) or float(input.get(key, -1)) < 0:
            errors.append({"field": key, "code": "INVALID"})
    if _finite(input.get("harvest_index")) and not (0.0 <= float(input["harvest_index"]) <= 1.0):
        errors.append({"field": "harvest_index", "code": "INVALID_HI"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_aquacrop_lite(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_aquacrop_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": AQUACROP_LITE_MODEL, "errors": validation["errors"]}

    tr = [float(v) for v in input["transpiration_series"]]
    wpb = float(input["wpb"])
    hi = float(input["harvest_index"])

    total_tr = sum(tr)
    biomass = wpb * total_tr
    yield_g_m2 = hi * biomass
    return {
        "ok": True, "model": AQUACROP_LITE_MODEL,
        "result": {
            "days": len(tr), "total_transpiration_mm": _round(total_tr),
            "wpb_g_m2_per_mm": _round(wpb),
            "biomass_g_m2": _round(biomass),
            "yield_g_m2": _round(yield_g_m2),
            "yield_t_ha": _round(yield_g_m2 * 0.01),
        },
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


CROP_DUAL_DEFINITION = {
    "id": CROP_DUAL_MODEL["id"],
    "version": CROP_DUAL_MODEL["version"],
    "domain": "crop",
    "title": "FAO-56 dual crop coefficient (Kcb + Ke)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm", "dimensionless"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "et0_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "kcb", "kind": "number", "required": True, "description": "basal crop coefficient"},
        {"name": "ks", "kind": "number", "required": False, "description": "water stress [0,1] (default 1)"},
        {"name": "u2", "kind": "number", "required": False, "description": "wind 2m m/s (default 2)"},
        {"name": "rh_min", "kind": "number", "required": False, "description": "min RH % (default 45)"},
        {"name": "de_mm", "kind": "number", "required": False, "description": "surface depletion"},
        {"name": "rew_mm", "kind": "number", "required": False},
        {"name": "tew_mm", "kind": "number", "required": False},
    ],
    "outputs": [
        {"name": "etc_mm", "kind": "number", "unit": "mm"},
        {"name": "ke", "kind": "number", "unit": "dimensionless"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_crop_dual.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}

AQUACROP_LITE_DEFINITION = {
    "id": AQUACROP_LITE_MODEL["id"],
    "version": AQUACROP_LITE_MODEL["version"],
    "domain": "crop",
    "title": "AquaCrop-lite biomass & yield (water productivity)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["g/m2", "mm"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "transpiration_series", "kind": "array", "required": True, "description": "daily Tr (mm)"},
        {"name": "wpb", "kind": "number", "required": True, "description": "biomass water productivity g/m2/mm"},
        {"name": "harvest_index", "kind": "number", "required": True, "description": "HI [0,1]"},
    ],
    "outputs": [
        {"name": "biomass_g_m2", "kind": "number", "unit": "g/m2"},
        {"name": "yield_t_ha", "kind": "number", "unit": "t/ha"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_crop_dual.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}