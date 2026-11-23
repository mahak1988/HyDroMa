"""FAO-56 crop water demand and soil-water-stress (single Kc) model + daily chain.

Two independent, HTTP-free components:

1. ``compute_crop_water`` (single day): given ET0, Kc, p, TAW and root-zone
   depletion Dr, compute::

       ETc_potential = Kc * ET0
       RAW           = p * TAW
       Ks            = 1                          if Dr <= RAW
                     = (TAW - Dr) / (TAW - RAW)   if RAW < Dr < TAW
                     = 0                          if Dr >= TAW
       ETc_adjusted  = Ks * ETc_potential

   Boundary semantics are explicit (see ``compute_ks`` / ``_ks_detail``): above
   field capacity (Dr < 0), at/below wilting point (Dr >= TAW), p = 1 (RAW = TAW,
   zero-width stress buffer) and TAW = 0 (degenerate, no available water).

2. ``simulate_crop_water_chain`` (multi-day): an ADDITIVE integration that, for
   each day, computes Ks from the current depletion, derives ETc_adjusted, and
   applies a physically consistent root-zone water balance with explicit
   constraints:

   * root-zone storage is bounded above by field-capacity storage (excess water
     above FC is removed and reported as ``excess`` — a bucket/drainage
     assumption, **not** measured drainage);
   * actual ET is **limited to plant-available water above the wilting point**
     (``storage − S_WP``), so storage never falls below S_WP as a result of ET;
   * unmet demand ``ETc_adjusted − actual ET`` is reported separately and is
     **never** counted as water removal;
   * exact conservation holds:
     ``S + P + I = runoff + excess + actual_ET + S_final``.

   The chain does NOT modify ``hydroma.daily_soil_water``; it is an independent,
   additive component. It reuses ``hydroma.soil_water.root_zone_storage_terms``
   for layer parsing / FC / WP / TAW so the soil-water math is not duplicated.

ET terminology (kept distinct): ET0 (reference) -> ETc_potential (demand, Kc*ET0)
-> Ks (0..1 stress) -> ETc_adjusted (stress-adjusted demand) -> actual ET (water
actually removed, ≤ ETc_adjusted) -> unmet demand (ETc_adjusted − actual ET).

This is the FAO-56 single crop-coefficient approach with a depletion-based Ks. It
is NOT the full dual-source (dual-Kc) FAO-56 model. Crop-neutral: Kc and p are
supplied, never inferred from crop identity/stage. Software-tested; NOT validated.
"""

from __future__ import annotations

import math

from .soil_water import root_zone_storage_terms

__all__ = [
    "FAO56_CROP_WATER_MODEL",
    "FAO56_CROP_WATER_DEFINITION",
    "FAO56_CROP_CHAIN_DEFINITION",
    "compute_ks",
    "compute_crop_water",
    "simulate_crop_water_chain",
    "validate_crop_water_input",
]

ROUND_DECIMALS = 4
EPS = 1e-9

FAO56_CROP_WATER_MODEL = {
    "id": "eco-nojin.hydroma.fao56-crop-water",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "ETc_pot = Kc*ET0; RAW = p*TAW; Ks = 1 if Dr<=RAW else (TAW-Dr)/(TAW-RAW) if RAW<Dr<TAW else 0; ETc_adj = Ks*ETc_pot",
    "units": {"et": "mm_per_day", "taw": "mm", "dr": "mm", "kc": "fraction", "p": "fraction"},
}

ASSUMPTIONS = [
    "single_crop_coefficient",
    "depletion_based_ks",
    "kc_and_p_supplied",
    "dr_negative_means_above_field_capacity",
    "not_dual_source",
    "et_limited_to_water_above_wilting_point",
    "excess_above_field_capacity_removed_as_bucket_drainage",
    "unmet_demand_reported_not_removed",
]
LIMITATIONS = [
    "notValidated",
    "single_kc_not_dual_source",
    "no_crop_stage_inference",
    "no_yield_prediction",
    "kc_and_p_must_be_supplied",
    "no_infiltration_physics",
    "no_percolation_capillary_rise_groundwater",
    "no_transpiration_soil_evaporation_split",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). FAO Irrigation and Drainage Paper 56, Chapters 4 & 5 (Kc, ETc, Ks, TAW, RAW, p).",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _nonneg(value) -> bool:
    return _finite(value) and float(value) >= 0


def compute_ks(dr: float, taw: float, raw: float) -> float:
    """FAO-56 depletion-based water-stress coefficient Ks in [0, 1].

    Explicit boundary semantics (documented, no clamping of the inputs):

    * ``TAW <= 0``  : degenerate (no available water). Ks = 1 if Dr <= 0 else 0.
    * ``Dr <= 0``   : at/above field capacity -> no stress -> Ks = 1.
    * ``Dr <= RAW`` : within readily available water -> Ks = 1.
    * ``RAW < Dr < TAW`` : Ks = (TAW - Dr) / (TAW - RAW). When p = 1 (RAW = TAW)
      the denominator is zero-width: Ks = 1 (stress begins only below the WP).
    * ``Dr >= TAW`` : at/below wilting point -> Ks = 0 (FAO-56 domain ends here;
      the formula is not extrapolated below the wilting point).
    """
    if taw <= EPS:
        return 1.0 if dr <= 0.0 else 0.0
    if dr <= 0.0:
        return 1.0
    if dr <= raw:
        return 1.0
    if dr < taw:
        denom = taw - raw
        if denom <= EPS:  # p == 1: no stress buffer until TAW
            return 1.0
        return (taw - dr) / denom
    return 0.0


def _ks_detail(dr: float, taw: float, raw: float):
    """Return (ks, status, warning_codes) with explicit boundary classification."""
    warnings = []
    if taw <= EPS:
        warnings.append("TAW_ZERO")
        ks = 1.0 if dr <= 0.0 else 0.0
        return ks, "zero_taw", warnings
    if dr < -EPS:
        return 1.0, "above_field_capacity", ["ABOVE_FIELD_CAPACITY"]
    if dr <= EPS:
        return 1.0, "at_field_capacity", []
    if dr <= raw + EPS:
        return 1.0, "readily_available", []
    if dr < taw - EPS:
        denom = taw - raw
        ks = 1.0 if denom <= EPS else (taw - dr) / denom
        return ks, "stressed", ["WATER_STRESS"]
    # dr >= taw (at or below wilting point)
    warnings.append("AT_OR_BELOW_WILTING_POINT" if dr <= taw + EPS else "BELOW_WILTING_POINT")
    return 0.0, "at_or_below_wilting_point", warnings


def validate_crop_water_input(input: dict | None = None) -> dict:
    """Validate single-day crop-water input. Returns ``{"valid", "errors"}``."""
    input = input or {}
    errors: list = []
    if not _nonneg(input.get("et0_mm_per_day")):
        errors.append({"field": "et0_mm_per_day",
                       "code": "NEGATIVE_ET0" if _finite(input.get("et0_mm_per_day")) else "NON_FINITE"})
    if not _nonneg(input.get("kc")):
        errors.append({"field": "kc", "code": "INVALID_KC" if _finite(input.get("kc")) else "NON_FINITE"})
    p = input.get("p")
    if not _finite(p) or not (0.0 < float(p) <= 1.0):
        errors.append({"field": "p", "code": "INVALID_P"})
    if not _nonneg(input.get("taw_mm")):
        errors.append({"field": "taw_mm", "code": "INVALID_TAW"})
    if not _finite(input.get("depletion_mm")):
        errors.append({"field": "depletion_mm", "code": "INVALID_DEPLETION"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_crop_water(input: dict | None = None) -> dict:
    """Single-day crop water: ETc_potential, Ks, ETc_adjusted (never raises)."""
    input = input or {}
    validation = validate_crop_water_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": FAO56_CROP_WATER_MODEL, "errors": validation["errors"]}

    et0 = float(input["et0_mm_per_day"])
    kc = float(input["kc"])
    p = float(input["p"])
    taw = float(input["taw_mm"])
    dr = float(input["depletion_mm"])

    etc_potential = kc * et0
    raw = p * taw
    ks, ks_status, ks_warnings = _ks_detail(dr, taw, raw)
    etc_adjusted = ks * etc_potential

    warnings = [{"code": c} for c in ks_warnings]
    if p >= 1.0 - EPS and dr > EPS:
        warnings.append({"code": "P_ONE_NO_STRESS_BUFFER",
                         "message": "p = 1: RAW = TAW; no stress buffer before the wilting point"})

    return {
        "ok": True,
        "model": FAO56_CROP_WATER_MODEL,
        "inputs": input,
        "result": {
            "et0_mm_per_day": _round(et0),
            "kc": _round(kc, 4),
            "taw_mm": _round(taw),
            "raw_mm": _round(raw),
            "depletion_mm": _round(dr),
            "ks": _round(ks, 4),
            "ks_status": ks_status,
            "etc_potential_mm_per_day": _round(etc_potential),
            "etc_adjusted_mm_per_day": _round(etc_adjusted),
        },
        "warnings": warnings,
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


def _validate_days(days, errors: list):
    """Validate the per-day list. Returns list of normalized day dicts (or [])."""
    if not isinstance(days, list) or len(days) == 0:
        errors.append({"field": "days", "code": "EMPTY_DAYS"})
        return []
    normalized = []
    for i, day in enumerate(days):
        if not isinstance(day, dict):
            errors.append({"day": i, "code": "INVALID_DAY"})
            continue
        et0 = day.get("et0_mm_per_day")
        if not _nonneg(et0):
            errors.append({"day": i, "field": "et0_mm_per_day",
                           "code": "NEGATIVE_ET0" if _finite(et0) else "NON_FINITE"})
        precip = day.get("precipitation_mm", 0.0)
        irrigation = day.get("irrigation_mm", 0.0)
        runoff = day.get("runoff_mm", 0.0)
        if not _nonneg(precip):
            errors.append({"day": i, "field": "precipitation_mm", "code": "NEGATIVE_PRECIP"})
        if not _nonneg(irrigation):
            errors.append({"day": i, "field": "irrigation_mm", "code": "NEGATIVE_IRRIGATION"})
        if not _nonneg(runoff):
            errors.append({"day": i, "field": "runoff_mm", "code": "NEGATIVE_RUNOFF"})
        date = day.get("date")
        if date is not None and not isinstance(date, str):
            errors.append({"day": i, "field": "date", "code": "INVALID_DATE"})
        normalized.append({
            "date": date if isinstance(date, str) else None,
            "et0_mm_per_day": float(et0) if _finite(et0) else None,
            "precipitation_mm": float(precip) if _finite(precip) else 0.0,
            "irrigation_mm": float(irrigation) if _finite(irrigation) else 0.0,
            "runoff_mm": float(runoff) if _finite(runoff) else 0.0,
        })
    return normalized


def simulate_crop_water_chain(input: dict | None = None) -> dict:
    """Multi-day chain: crop ET demand -> Ks -> ETc_adjusted -> root-zone balance.

    Additive integration. The existing ``daily_soil_water`` model is NOT modified
    and NOT called here: this component applies its own physically consistent
    balance so that actual ET is limited by available water and unmet demand is
    reported separately. Layer parsing / FC / WP / TAW are reused from
    ``hydroma.soil_water.root_zone_storage_terms`` (no duplicated soil math).
    """
    input = input or {}
    errors: list = []

    # Reuse the soil-water profile parser/validation (layers + root zone + units).
    try:
        terms = root_zone_storage_terms(input)
    except ValueError as exc:
        return {"ok": False, "model": FAO56_CROP_WATER_MODEL,
                "errors": [{"field": "layers", "code": "INVALID_LAYERS", "message": str(exc)}]}

    wp_storage = terms["wp_storage_mm"]
    fc_storage = terms["fc_storage_mm"]
    taw = terms["taw_mm"]
    root_zone_depth = terms["root_zone_depth_mm"]

    if not _nonneg(input.get("initial_storage_mm")):
        errors.append({"field": "initial_storage_mm", "code": "INVALID_INITIAL"})
    p = input.get("p")
    if not _finite(p) or not (0.0 < float(p) <= 1.0):
        errors.append({"field": "p", "code": "INVALID_P"})

    days = _validate_days(input.get("days"), errors)

    # Kc: scalar or per-day list.
    kc = input.get("kc")
    kc_list = None
    if isinstance(kc, list):
        if len(kc) != len(days) or not all(_nonneg(k) for k in kc):
            errors.append({"field": "kc", "code": "INVALID_KC"})
        else:
            kc_list = [float(k) for k in kc]
    elif _nonneg(kc):
        kc_list = [float(kc)] * len(days)
    else:
        errors.append({"field": "kc", "code": "INVALID_KC"})

    if errors:
        return {"ok": False, "model": FAO56_CROP_WATER_MODEL, "errors": errors}

    p = float(p)
    raw = p * taw

    storage = float(input["initial_storage_mm"])
    initial_storage = storage
    day_results = []
    all_warnings: set = set()
    total_p = total_i = total_ro = total_et = total_excess = total_unmet = total_demand = 0.0
    min_storage = storage

    for i, day in enumerate(days):
        # --- beginning-of-day root-zone state ---------------------------------
        dr_start = fc_storage - storage
        kc_i = kc_list[i]
        et0 = day["et0_mm_per_day"]

        # --- crop ET demand -> stress -> adjusted demand ----------------------
        ks = compute_ks(dr_start, taw, raw)
        etc_potential = kc_i * et0
        etc_adjusted = ks * etc_potential

        # --- physically consistent daily water balance ------------------------
        precip = day["precipitation_mm"]
        irrigation = day["irrigation_mm"]
        runoff = day["runoff_mm"]

        available_input = storage + precip + irrigation
        if runoff > available_input + EPS:
            errors.append({"day": i, "field": "runoff_mm", "code": "RUNOFF_EXCEEDS_WATER",
                           "message": f"runoff {runoff} exceeds available water {available_input}"})
            continue

        s_in = available_input - runoff
        excess = max(0.0, s_in - fc_storage)          # above FC -> bucket drainage (reported)
        s_after = s_in - excess
        available_for_et = max(0.0, s_after - wp_storage)  # plant-available water above WP
        actual_et = min(etc_adjusted, available_for_et)     # ET limited by available water
        unmet = etc_adjusted - actual_et                    # demand not met (not removed)
        final = s_after - actual_et

        # Conservation: storage + P + I = runoff + excess + actual_ET + final
        lhs = storage + precip + irrigation
        rhs = runoff + excess + actual_et + final
        residual = lhs - rhs

        depletion_end = fc_storage - final
        day_warnings = []
        if unmet > EPS:
            day_warnings.append("UNMET_DEMAND")
        if excess > EPS:
            day_warnings.append("EXCESS_WATER")
        if ks < 1.0 - EPS:
            day_warnings.append("WATER_STRESS")
        if final <= wp_storage + EPS:
            day_warnings.append("AT_OR_BELOW_WILTING_POINT")

        if unmet > EPS:
            status = "unmet_demand"
        elif excess > EPS:
            status = "surplus"
        elif depletion_end <= EPS:
            status = "at_field_capacity"
        elif depletion_end >= taw - EPS:
            status = "at_or_below_wilting_point"
        elif depletion_end > raw + EPS:
            status = "stressed"
        else:
            status = "readily_available"

        all_warnings.update(day_warnings)
        total_p += precip
        total_i += irrigation
        total_ro += runoff
        total_et += actual_et
        total_demand += etc_adjusted
        total_excess += excess
        total_unmet += unmet
        min_storage = min(min_storage, final)
        storage = final

        day_results.append({
            "day_index": i,
            "date": day["date"],
            "et0_mm_per_day": _round(et0),
            "kc": _round(kc_i, 4),
            "dr_start_mm": _round(dr_start),
            "ks": _round(ks, 4),
            "etc_potential_mm_per_day": _round(etc_potential),
            "etc_adjusted_mm_per_day": _round(etc_adjusted),
            "actual_et_mm": _round(actual_et),
            "unmet_demand_mm": _round(unmet),
            "precipitation_mm": _round(precip),
            "irrigation_mm": _round(irrigation),
            "runoff_mm": _round(runoff),
            "excess_mm": _round(excess),
            "final_storage_mm": _round(final),
            "depletion_end_mm": _round(depletion_end),
            "status": status,
            "warnings": day_warnings,
        })

    if errors:
        return {"ok": False, "model": FAO56_CROP_WATER_MODEL, "errors": errors}

    lhs = initial_storage + total_p + total_i
    rhs = total_ro + total_excess + total_et + storage
    residual = lhs - rhs

    return {
        "ok": True,
        "model": FAO56_CROP_WATER_MODEL,
        "inputs": input,
        "result": {
            "root_zone_depth_mm": _round(root_zone_depth),
            "wp_storage_mm": _round(wp_storage),
            "fc_storage_mm": _round(fc_storage),
            "taw_mm": _round(taw),
            "raw_mm": _round(raw),
            "initial_storage_mm": _round(initial_storage),
            "final_storage_mm": _round(storage),
            "total_precip_mm": _round(total_p),
            "total_irrigation_mm": _round(total_i),
            "total_runoff_mm": _round(total_ro),
            "total_etc_adjusted_mm": _round(total_demand),
            "total_actual_et_mm": _round(total_et),
            "total_unmet_demand_mm": _round(total_unmet),
            "total_excess_mm": _round(total_excess),
            "min_storage_mm": _round(min_storage),
            "conservation": {
                "lhs_mm": _round(lhs),
                "rhs_mm": _round(rhs),
                "residual_mm": _round(residual),
                "closes": abs(residual) <= 1e-6,
            },
            "days": day_results,
        },
        "warnings": [{"code": c} for c in sorted(all_warnings)],
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


FAO56_CROP_WATER_DEFINITION = {
    "id": FAO56_CROP_WATER_MODEL["id"],
    "version": FAO56_CROP_WATER_MODEL["version"],
    "domain": "agriculture",
    "title": "FAO-56 crop evapotranspiration & water-stress (single Kc)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm_per_day", "mm", "fraction"],
    "parameters": ["kc", "p"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "et0_mm_per_day", "kind": "number", "unit": "mm_per_day", "required": True},
        {"name": "kc", "kind": "number", "unit": "fraction", "required": True},
        {"name": "p", "kind": "number", "unit": "fraction", "required": True},
        {"name": "taw_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "depletion_mm", "kind": "number", "unit": "mm", "required": True},
    ],
    "outputs": [
        {"name": "etc_potential_mm_per_day", "kind": "number", "unit": "mm_per_day"},
        {"name": "ks", "kind": "number"},
        {"name": "ks_status", "kind": "string"},
        {"name": "etc_adjusted_mm_per_day", "kind": "number", "unit": "mm_per_day"},
        {"name": "raw_mm", "kind": "number", "unit": "mm"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [
            {"kind": "unit_test", "status": "pass",
             "reference": "tests/test_crop_water.py",
             "notes": "software + independent hand-derived vectors; not scientific validation"},
        ],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}

FAO56_CROP_CHAIN_DEFINITION = {
    "id": "eco-nojin.hydroma.fao56-crop-water-chain",
    "version": "1.0.0",
    "domain": "agriculture",
    "title": "FAO-56 crop ET -> Ks -> daily root-zone balance (chain)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm_per_day", "mm", "fraction"],
    "parameters": ["layers", "rootZoneDepth", "p", "kc"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "layers", "kind": "array", "required": True,
         "description": "soil layers ({top,bottom|thickness, theta_fc, theta_wp}); mm / m3/m3"},
        {"name": "rootZoneDepth", "kind": "quantity", "unit": "mm", "required": False,
         "description": "effective root-zone depth; defaults to profile depth"},
        {"name": "initial_storage_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "p", "kind": "number", "unit": "fraction", "required": True},
        {"name": "kc", "kind": "number", "required": True, "description": "scalar or per-day array"},
        {"name": "days", "kind": "array", "required": True,
         "description": "array of {date?, et0_mm_per_day, precipitation_mm, irrigation_mm, runoff_mm?}"},
    ],
    "outputs": [
        {"name": "final_storage_mm", "kind": "number", "unit": "mm"},
        {"name": "taw_mm", "kind": "number", "unit": "mm"},
        {"name": "total_actual_et_mm", "kind": "number", "unit": "mm"},
        {"name": "total_unmet_demand_mm", "kind": "number", "unit": "mm"},
        {"name": "total_excess_mm", "kind": "number", "unit": "mm"},
        {"name": "conservation", "kind": "object"},
        {"name": "days", "kind": "array"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_crop_water.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}