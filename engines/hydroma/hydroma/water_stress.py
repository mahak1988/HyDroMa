"""Root-zone water-stress & stress-adjusted evapotranspiration (Phase 3.21).

A simplified, explicitly documented FAO-56 depletion-based water-stress model. It
distinguishes crop **demand** (``ETc``) from a stress-adjusted **estimate**
(``ETa``); ``ETa`` is model-derived and is never labelled field-measured actual ET.

Definitions (mm, per unit area)
-------------------------------
    FC  = sum(theta_fc * dz)          field-capacity storage
    WP  = sum(theta_wp * dz)          wilting-point storage
    TAW = FC - WP                     total available water
    RAW = p * TAW                     readily available water
    Dr  = FC - S                      root-zone depletion at period start
    Ks  = 1                           if Dr <= RAW
        = (TAW - Dr) / (TAW - RAW)    if RAW < Dr < TAW
        = 0                           if Dr >= TAW
    ETc = Kc * ET0                    crop demand (existing crop_etc)
    ETa = Ks * ETc                    stress-adjusted estimate
    S_next = S + P + I - ETa - RO - DP - Excess
    Excess = max(0, S + P + I - ETa - RO - DP - FC)   (drainage above field capacity)

Water accounting
----------------
* ETc is **not** subtracted; only ETa is the soil-water sink (no double counting).
* Total precipitation feeds the bucket; SCS-CN effective precipitation is a
  separate diagnostic and is not combined here.
* ``Excess`` (above FC) is distinct from ``runoff_mm`` and ``deep_percolation_mm``.
* Negative storage is never clamped or silently discarded: a step whose computed
  storage is below zero is flagged ``OUT_OF_DOMAIN`` and the sequential run blocks
  (fail closed) rather than propagating unphysical storage.
* ``p`` is the FAO-56 depletion fraction in the open interval ``(0, 1)`` and must
  be supplied explicitly (never inferred). ``p = 1`` is excluded: it makes
  ``RAW = TAW``, collapsing the stress interval and making the FAO-56 linear
  stress equation undefined (``TAW - RAW = 0``) at the wilting-point boundary.

Domain integrity
----------------
* ``TAW = FC - WP`` must be ``> 0``; a non-positive TAW is rejected
  (``TAW_NONPOSITIVE``) rather than divided by.
* Near-zero TAW (``< 1e-6`` mm) is a valid but extreme state and is flagged
  ``near_zero_taw`` (not failed).
* ``Ks`` is bounded to ``[0, 1]`` (defensive clamp; never triggers for valid
  input). ``ETa = Ks * ETc`` therefore never exceeds ``ETc`` (``eta_exceeds_etc``
  is a sanity flag).
* ``S > FC`` drains via ``Excess`` (mass-conservative); ``S < WP`` yields
  ``Ks = 0``; negative storage is flagged ``OUT_OF_DOMAIN`` and blocks the
  sequential run (never clamped).

Sequential behaviour
--------------------
``compute_stress_aware_series`` walks periods in order, computes Ks/ETa from the
current storage, applies the balance via the existing ``root_zone_balance`` model,
and transfers the final storage to the next period. No interpolation, aggregation,
resampling or timezone normalisation is performed.

Software-tested; scientific status **NOT_VALIDATED**.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional

from .crop_etc import compute_crop_etc
from .provenance import sha256_json
from .root_zone_balance import compute_root_zone_balance
from .soil_water import validate_soil_water_input

__all__ = [
    "WATER_STRESS_MODEL",
    "WATER_STRESS_DEFINITION",
    "compute_water_stress",
    "compute_stress_aware_series",
]

ROUND_DECIMALS = 4
EPS = 1e-9
# Below this (mm) the total available water is treated as numerically negligible
# and flagged (near_zero_taw) rather than failing; it is a valid but extreme state.
_TAW_EPS = 1e-6

WATER_STRESS_MODEL = {
    "id": "eco-nojin.hydroma.water-stress",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "TAW=FC-WP; RAW=p*TAW; Dr=FC-S; Ks=...; ETa=Ks*ETc; S_next=S+P+I-ETa-RO-DP-Excess",
    "units": {"water": "mm", "p": "fraction", "kc": "fraction"},
}

ASSUMPTIONS = [
    "fao56_depletion_based_stress",
    "single_root_zone_bucket",
    "p_supplied_explicitly",
    "p_in_open_interval_0_1",
    "taw_positive_required",
    "ks_bounded_0_1",
    "etc_from_kc_times_et0",
    "eta_is_model_derived_not_measured",
    "no_soil_evaporation_partitioning",
]
LIMITATIONS = [
    "notValidated",
    "simplified_single_bucket",
    "no_redistribution_between_layers",
    "no_capillary_rise",
    "no_crop_stage_or_physiology",
    "no_interpolation_or_aggregation",
    "daily_aggregated_inputs_limit_subdaily_ordering",
    "p_1_excluded_raw_equals_taw",
    "near_zero_taw_flagged_not_failed",
    "out_of_domain_blocks_sequential",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). FAO Irrigation and Drainage Paper 56, Ch.4 & Ch.5.",
    "Hillel, D. (1998). Environmental Soil Physics. Academic Press.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _ks(dr: float, taw: float, raw: float) -> float:
    """FAO-56 water-stress coefficient, bounded to ``[0, 1]``.

    Valid for ``0 < p < 1`` (``RAW < TAW``). The result is clamped to ``[0, 1]``
    as a numerical guard; the clamp never triggers for valid inputs because the
    linear expression is mathematically within ``(0, 1)`` for ``RAW < Dr < TAW``.
    """
    if dr <= raw:
        return 1.0
    if dr >= taw:
        return 0.0
    if taw <= raw:  # unreachable under the enforced 0 < p < 1 contract; guards misuse
        return 0.0
    ks = (taw - dr) / (taw - raw)
    if ks < 0.0:
        return 0.0
    if ks > 1.0:
        return 1.0
    return ks


def _layers_summary(layers) -> Optional[Dict[str, float]]:
    fc = 0.0
    wp = 0.0
    for layer in layers:
        fc += float(layer["theta_fc"]) * float(layer["thickness_mm"])
        wp += float(layer["theta_wp"]) * float(layer["thickness_mm"])
    return {"fc": fc, "wp": wp, "taw": fc - wp}


def compute_water_stress(input: Optional[dict] = None) -> Dict[str, Any]:
    """Single-period root-zone water-stress computation. Never raises on bad input."""
    input = input or {}

    soil = validate_soil_water_input({"layers": input.get("layers")})
    if not soil["valid"]:
        return {"ok": False, "model": WATER_STRESS_MODEL, "errors": soil["errors"]}
    layers = input["layers"]
    summary = _layers_summary(layers)
    fc, wp, taw = summary["fc"], summary["wp"], summary["taw"]
    if taw <= 0.0:
        return {"ok": False, "model": WATER_STRESS_MODEL,
                "errors": [{"field": "layers", "code": "TAW_NONPOSITIVE",
                            "message": "total available water (FC-WP) must be > 0"}]}
    near_zero_taw = taw < _TAW_EPS

    p = input.get("p")
    if not _finite(p) or not (0.0 < float(p) < 1.0):
        return {"ok": False, "model": WATER_STRESS_MODEL,
                "errors": [{"field": "p", "code": "INVALID_P",
                            "message": "p must be a fraction in (0, 1); p=1 is excluded because RAW=TAW makes the FAO-56 stress equation undefined"}]}
    p = float(p)
    raw = p * taw

    etc_res = compute_crop_etc({"et0_mm": input.get("et0_mm"), "kc": input.get("kc"),
                                "period": input.get("period", "period")})
    if not etc_res["ok"]:
        return {"ok": False, "model": WATER_STRESS_MODEL, "errors": etc_res["errors"]}
    et0 = float(etc_res["result"]["et0_mm"])
    kc = float(etc_res["result"]["kc"])
    etc = float(etc_res["result"]["etc_mm"])

    s0 = input.get("initial_storage_mm")
    if not _finite(s0) or float(s0) < 0:
        return {"ok": False, "model": WATER_STRESS_MODEL,
                "errors": [{"field": "initial_storage_mm", "code": "INVALID_INITIAL",
                            "message": "initial storage must be finite and >= 0"}]}
    s0 = float(s0)

    p_flux = float(input.get("precipitation_mm", 0.0) or 0.0)
    i_flux = float(input.get("irrigation_mm", 0.0) or 0.0)
    ro_flux = float(input.get("runoff_mm", 0.0) or 0.0)
    dp_flux = float(input.get("deep_percolation_mm", 0.0) or 0.0)

    dr = fc - s0
    ks = _ks(dr, taw, raw)
    eta = ks * etc
    dr_above_fc = dr < -EPS
    dr_below_wp = dr > taw + EPS
    eta_exceeds_etc = eta > etc + EPS

    rz = compute_root_zone_balance({
        "layers": layers, "initial_storage_mm": s0,
        "precipitation_mm": p_flux, "irrigation_mm": i_flux,
        "et_actual_mm": eta, "runoff_mm": ro_flux, "deep_percolation_mm": dp_flux,
        "period": input.get("period", "period"),
    })
    if not rz["ok"]:
        return {"ok": False, "model": WATER_STRESS_MODEL, "errors": rz["errors"]}
    rz_res = rz["result"]
    final = float(rz_res["final_storage_mm"])
    excess = float(rz_res["excess_mm"])
    out_of_domain = final < -EPS
    below_wp = final < wp - EPS
    above_fc = excess > EPS

    if out_of_domain:
        status = "OUT_OF_DOMAIN"
    elif below_wp:
        status = "BELOW_WILTING_POINT"
    elif above_fc:
        status = "ABOVE_FIELD_CAPACITY"
    elif ks < 1.0 - EPS:
        status = "STRESSED"
    else:
        status = "NO_STRESS"

    closure = (s0 + p_flux + i_flux - eta - ro_flux - dp_flux - excess) - final

    return {
        "ok": True,
        "model": WATER_STRESS_MODEL,
        "inputs": input,
        "result": {
            "et0_mm": _round(et0),
            "kc": _round(kc),
            "etc_mm": _round(etc),
            "fc_storage_mm": _round(fc),
            "wp_storage_mm": _round(wp),
            "taw_mm": _round(taw),
            "raw_mm": _round(raw),
            "initial_storage_mm": _round(s0),
            "depletion_mm": _round(dr),
            "ks": _round(ks, 6),
            "eta_mm": _round(eta),
            "precipitation_mm": _round(p_flux),
            "irrigation_mm": _round(i_flux),
            "runoff_mm": _round(ro_flux),
            "deep_percolation_mm": _round(dp_flux),
            "excess_mm": _round(excess),
            "final_storage_mm": _round(final),
            "depletion_after_mm": _round(fc - final),
            "water_deficit_mm": _round(max(0.0, -final)),
            "out_of_domain": out_of_domain,
            "below_wilting_point": below_wp,
            "above_field_capacity": above_fc,
            "near_zero_taw": near_zero_taw,
            "dr_above_fc": dr_above_fc,
            "dr_below_wp": dr_below_wp,
            "eta_exceeds_etc": eta_exceeds_etc,
            "algebraic_closure_residual_mm": _round(closure),
            "status": status,
            "unit": "mm",
        },
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


def _json_safe(obj):
    import json
    return json.loads(json.dumps(obj, default=str))


def compute_stress_aware_series(input: Optional[dict] = None) -> Dict[str, Any]:
    """Sequential stress-aware multi-period simulation (reuses root_zone_balance).

    Each period computes Ks/ETa from the current storage, applies the balance via
    :func:`compute_water_stress` (which reuses ``compute_root_zone_balance``), and
    transfers the final storage to the next period. A period whose computed storage
    falls below zero blocks the run (``OUT_OF_DOMAIN``) rather than propagating
    unphysical storage.
    """
    input = input or {}
    periods = input.get("periods")
    layers = input.get("layers")
    p = input.get("p")

    if not isinstance(periods, list) or not periods:
        return {"ok": False, "model": WATER_STRESS_MODEL, "errors": [{"field": "periods", "code": "EMPTY_PERIODS"}]}
    if not _finite(input.get("initial_storage_mm")) or float(input["initial_storage_mm"]) < 0:
        return {"ok": False, "model": WATER_STRESS_MODEL, "errors": [{"field": "initial_storage_mm", "code": "INVALID_INITIAL"}]}
    if not _finite(p) or not (0.0 < float(p) < 1.0):
        return {"ok": False, "model": WATER_STRESS_MODEL,
                "errors": [{"field": "p", "code": "INVALID_P",
                            "message": "p must be a fraction in (0, 1); p=1 is excluded"}]}
    soil = validate_soil_water_input({"layers": layers})
    if not soil["valid"]:
        return {"ok": False, "model": WATER_STRESS_MODEL, "errors": soil["errors"]}
    if _layers_summary(layers)["taw"] <= 0.0:
        return {"ok": False, "model": WATER_STRESS_MODEL,
                "errors": [{"field": "layers", "code": "TAW_NONPOSITIVE",
                            "message": "total available water (FC-WP) must be > 0"}]}

    storage = float(input["initial_storage_mm"])
    initial_storage = storage
    totals = {"precipitation_mm": 0.0, "irrigation_mm": 0.0, "eta_mm": 0.0, "runoff_mm": 0.0,
              "deep_percolation_mm": 0.0, "excess_mm": 0.0}
    steps: List[dict] = []
    prev_end = None
    out_of_domain_at = None

    for i, per in enumerate(periods):
        ps, pe = per.get("period_start"), per.get("period_end")
        if prev_end is not None and str(ps) != str(prev_end):
            return {"ok": False, "model": WATER_STRESS_MODEL,
                    "errors": [{"step": i, "code": "NONCONTIGUOUS",
                                "message": "periods must be contiguous (period_start == previous period_end)"}]}
        prev_end = pe

        ws = compute_water_stress({
            "layers": layers, "initial_storage_mm": storage,
            "et0_mm": per.get("et0_mm"), "kc": per.get("kc"), "p": p,
            "precipitation_mm": per.get("precipitation_mm", 0.0),
            "irrigation_mm": per.get("irrigation_mm", 0.0),
            "runoff_mm": per.get("runoff_mm", 0.0),
            "deep_percolation_mm": per.get("deep_percolation_mm", 0.0),
            "period": "period",
        })
        if not ws["ok"]:
            return {"ok": False, "model": WATER_STRESS_MODEL, "errors": [{"step": i, "detail": ws["errors"]}]}
        r = ws["result"]
        storage = float(r["final_storage_mm"])

        steps.append({
            "index": i, "period_start": ps, "period_end": pe,
            "initial_storage_mm": r["initial_storage_mm"],
            "et0_mm": r["et0_mm"], "kc": r["kc"], "etc_mm": r["etc_mm"],
            "ks": r["ks"], "eta_mm": r["eta_mm"],
            "precipitation_mm": r["precipitation_mm"], "irrigation_mm": r["irrigation_mm"],
            "runoff_mm": r["runoff_mm"], "deep_percolation_mm": r["deep_percolation_mm"],
            "excess_mm": r["excess_mm"], "final_storage_mm": r["final_storage_mm"],
            "depletion_after_mm": r["depletion_after_mm"],
            "status": r["status"], "algebraic_closure_residual_mm": r["algebraic_closure_residual_mm"],
        })
        totals["precipitation_mm"] += float(per.get("precipitation_mm", 0.0))
        totals["irrigation_mm"] += float(per.get("irrigation_mm", 0.0))
        totals["eta_mm"] += float(r["eta_mm"])
        totals["runoff_mm"] += float(per.get("runoff_mm", 0.0))
        totals["deep_percolation_mm"] += float(per.get("deep_percolation_mm", 0.0))
        totals["excess_mm"] += float(r["excess_mm"])

        if r["out_of_domain"]:
            out_of_domain_at = i
            break

    ok = out_of_domain_at is None
    provenance = {
        "model": WATER_STRESS_MODEL["id"],
        "version": WATER_STRESS_MODEL["version"],
        "period_start": periods[0].get("period_start"),
        "period_end": periods[-1].get("period_end"),
        "num_steps": len(steps),
        "scenario": "STRESS_ADJUSTED_ET",
        "input_hash": sha256_json(_json_safe(input)),
        "step_hashes": [sha256_json(_json_safe(s)) for s in steps],
        "result_hash": sha256_json(_json_safe({"initial": initial_storage, "final": storage, "steps": steps})),
        "result_payload": {"initial": initial_storage, "final": storage, "steps": steps},
        "scientific_status": "NOT_VALIDATED",
    }
    errors = []
    if not ok:
        errors.append({"step": out_of_domain_at, "code": "OUT_OF_DOMAIN",
                       "message": "computed soil-water storage fell below zero (physically impossible); blocking"})
    return {
        "ok": ok,
        "model": WATER_STRESS_MODEL,
        "result": {
            "num_steps": len(steps),
            "initial_storage_mm": _round(initial_storage),
            "final_storage_mm": _round(storage),
            "near_zero_taw": _layers_summary(layers)["taw"] < _TAW_EPS,
            "totals": {k: _round(v) for k, v in totals.items()},
            "steps": steps,
            "status": "COMPLETED" if ok else "OUT_OF_DOMAIN",
        },
        "provenance": provenance,
        "errors": errors,
    }


WATER_STRESS_DEFINITION = {
    "id": WATER_STRESS_MODEL["id"],
    "version": WATER_STRESS_MODEL["version"],
    "domain": "agriculture",
    "title": "Root-zone water-stress & stress-adjusted ET (FAO-56 depletion-based)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "layers", "kind": "array", "required": True, "description": "{thickness_mm, theta_fc, theta_wp}"},
        {"name": "initial_storage_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "et0_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "kc", "kind": "number", "unit": "fraction", "required": True},
        {"name": "p", "kind": "number", "unit": "fraction", "required": True,
         "description": "FAO-56 depletion fraction in (0, 1); p=1 is excluded (RAW=TAW makes the stress equation undefined)"},
        {"name": "precipitation_mm", "kind": "number", "unit": "mm", "required": False},
        {"name": "irrigation_mm", "kind": "number", "unit": "mm", "required": False},
        {"name": "runoff_mm", "kind": "number", "unit": "mm", "required": False},
        {"name": "deep_percolation_mm", "kind": "number", "unit": "mm", "required": False},
    ],
    "outputs": [
        {"name": "ks", "kind": "number", "description": "water-stress coefficient (0..1)"},
        {"name": "etc_mm", "kind": "number", "unit": "mm", "description": "crop demand"},
        {"name": "eta_mm", "kind": "number", "unit": "mm", "description": "stress-adjusted model estimate (not measured)"},
        {"name": "final_storage_mm", "kind": "number", "unit": "mm"},
        {"name": "status", "kind": "string"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_water_stress.py", "notes": "software only; not scientific validation"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}