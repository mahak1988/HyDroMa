"""Standalone irrigation scheduling (FAO-56 depletion-based).

Given a soil profile, the allowable depletion fraction ``p`` and the current
root-zone depletion ``Dr``, compute when irrigation is warranted and how much
(net and, with an application efficiency, gross) is required to restore the root
zone to a target depletion.

Definitions (mm, per unit area):
    TAW = sum((theta_fc - theta_wp) * dz)      # total available water
    RAW = p * TAW                              # readily available water
    Dr  = current root-zone depletion          # (negative => above field capacity)
    current storage = fc_storage - Dr          # fc_storage = sum(theta_fc * dz)
    target depletion = target_depletion_mm, or (fc_storage - target_storage_mm),
                       or RAW by default (documented)
    deficit_to_target = Dr - target_depletion
    net irrigation    = max(0, Dr - target_depletion)     # water to add (modeled)
    gross irrigation  = net / application_efficiency      # if 0 < efficiency <= 1
    irrigation_recommended = net irrigation > 0           # align with management target

Depletion headroom outputs are SIGNED and never clamped:
    depletion_to_raw = RAW - Dr   # > 0: remaining before stress threshold; 0: at RAW; < 0: beyond RAW
    depletion_to_wp  = TAW - Dr   # > 0: remaining before wilting point;  0: at WP;  < 0: beyond WP

Stress threshold (Dr > RAW) is DISTINCT from the wilting-point boundary (Dr = TAW).
Inputs are never clamped; invalid inputs are rejected. Crop-neutral: Kc/p/supplied,
no inference. Software-tested; NOT scientifically validated.
"""

from __future__ import annotations

import math

from .soil_water import validate_soil_water_input

__all__ = [
    "IRRIGATION_MODEL",
    "IRRIGATION_DEFINITION",
    "compute_irrigation_schedule",
    "validate_irrigation_input",
]

ROUND_DECIMALS = 4

IRRIGATION_MODEL = {
    "id": "eco-nojin.hydroma.irrigation-schedule",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "TAW=sum((fc-wp)*dz); RAW=p*TAW; net=max(0, Dr-target); gross=net/eff",
    "units": {"water_content": "m3_per_m3", "thickness": "mm", "water": "mm"},
}

ASSUMPTIONS = [
    "target_depletion_defaults_to_RAW",
    "net_irrigation_is_modeled_water_to_add",
    "no_losses_beyond_application_efficiency",
    "dr_negative_means_above_field_capacity",
    "stress_threshold_dr_gt_RAW_distinct_from_wp",
]
LIMITATIONS = [
    "notValidated",
    "no_soil_evaporation_partitioning",
    "no_redistribution",
    "no_efficiency_inference_from_system",
    "no_weather_forecast",
    "no_crop_stage_inference",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). FAO Irrigation and Drainage Paper 56, Chapter 5 (depletion, RAW, p, irrigation scheduling).",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def validate_irrigation_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []

    # reuse soil-water layer validation
    soil = validate_soil_water_input({"layers": input.get("layers")})
    if not soil["valid"]:
        errors.extend(soil["errors"])

    p = input.get("p")
    if not _finite(p) or not (0.0 < float(p) <= 1.0):
        errors.append({"field": "p", "code": "INVALID_P"})

    if not _finite(input.get("depletion_mm")):
        errors.append({"field": "depletion_mm", "code": "INVALID_DEPLETION"})

    has_td = input.get("target_depletion_mm") is not None
    has_ts = input.get("target_storage_mm") is not None
    if has_td and has_ts:
        errors.append({"field": "target", "code": "CONFLICTING_TARGET",
                       "message": "provide target_depletion_mm OR target_storage_mm, not both"})
    if has_td:
        td = input.get("target_depletion_mm")
        if not _finite(td) or float(td) < 0:
            errors.append({"field": "target_depletion_mm", "code": "INVALID_TARGET"})
    if has_ts:
        ts = input.get("target_storage_mm")
        if not _finite(ts) or float(ts) < 0:
            errors.append({"field": "target_storage_mm", "code": "INVALID_TARGET"})

    eff = input.get("application_efficiency")
    if eff is not None:
        if not _finite(eff) or not (0.0 < float(eff) <= 1.0):
            errors.append({"field": "application_efficiency", "code": "INVALID_EFFICIENCY"})

    return {"valid": len(errors) == 0, "errors": errors}


def compute_irrigation_schedule(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_irrigation_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": IRRIGATION_MODEL, "errors": validation["errors"]}

    layers = input["layers"]
    p = float(input["p"])
    dr = float(input["depletion_mm"])
    eff = float(input["application_efficiency"]) if input.get("application_efficiency") is not None else None

    fc_storage = 0.0
    wp_storage = 0.0
    for layer in layers:
        dz = float(layer["thickness_mm"])
        fc_storage += float(layer["theta_fc"]) * dz
        wp_storage += float(layer["theta_wp"]) * dz
    taw = fc_storage - wp_storage
    raw = p * taw

    current_storage = fc_storage - dr
    depletion_to_raw = raw - dr
    depletion_to_wp = taw - dr

    if input.get("target_depletion_mm") is not None:
        target_depletion = float(input["target_depletion_mm"])
    elif input.get("target_storage_mm") is not None:
        target_depletion = fc_storage - float(input["target_storage_mm"])
    else:
        target_depletion = raw  # default target = RAW (documented)
    target_storage = fc_storage - target_depletion

    deficit_to_target = dr - target_depletion
    net_irrigation = max(0.0, dr - target_depletion)
    gross_irrigation = (net_irrigation / eff) if eff is not None else None
    irrigation_recommended = net_irrigation > 0.0

    if dr < 0:
        status = "above_field_capacity"
    elif dr >= taw:
        status = "below_wilting_point"
    elif dr > raw:
        status = "stressed"
    else:
        status = "no_stress"

    warnings = []
    if status == "stressed":
        warnings.append({"code": "STRESS_THRESHOLD_EXCEEDED"})
    elif status == "below_wilting_point":
        warnings.append({"code": "BELOW_WILTING_POINT"})
    elif status == "above_field_capacity":
        warnings.append({"code": "ABOVE_FIELD_CAPACITY"})

    return {
        "ok": True,
        "model": IRRIGATION_MODEL,
        "inputs": input,
        "result": {
            "taw_mm": _round(taw),
            "raw_mm": _round(raw),
            "depletion_mm": _round(dr),
            "current_storage_mm": _round(current_storage),
            "fc_storage_mm": _round(fc_storage),
            "depletion_to_raw_mm": _round(depletion_to_raw),
            "depletion_to_wp_mm": _round(depletion_to_wp),
            "target_depletion_mm": _round(target_depletion),
            "target_storage_mm": _round(target_storage),
            "deficit_to_target_mm": _round(deficit_to_target),
            "net_irrigation_mm": _round(net_irrigation),
            "application_efficiency": eff,
            "gross_irrigation_mm": _round(gross_irrigation) if gross_irrigation is not None else None,
            "irrigation_recommended": irrigation_recommended,
            "status": status,
        },
        "warnings": warnings,
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


IRRIGATION_DEFINITION = {
    "id": IRRIGATION_MODEL["id"],
    "version": IRRIGATION_MODEL["version"],
    "domain": "agriculture",
    "title": "Irrigation scheduling (FAO-56 depletion-based)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["m3_per_m3", "mm"],
    "parameters": ["layers", "p", "target_depletion_mm", "target_storage_mm", "application_efficiency"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "layers", "kind": "array", "required": True, "description": "{thickness_mm, theta_fc, theta_wp}"},
        {"name": "p", "kind": "number", "unit": "fraction", "required": True},
        {"name": "depletion_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "target_depletion_mm", "kind": "number", "unit": "mm", "required": False},
        {"name": "target_storage_mm", "kind": "number", "unit": "mm", "required": False},
        {"name": "application_efficiency", "kind": "number", "unit": "fraction", "required": False},
    ],
    "outputs": [
        {"name": "taw_mm", "kind": "number", "unit": "mm"},
        {"name": "raw_mm", "kind": "number", "unit": "mm"},
        {"name": "net_irrigation_mm", "kind": "number", "unit": "mm"},
        {"name": "gross_irrigation_mm", "kind": "number", "unit": "mm"},
        {"name": "irrigation_recommended", "kind": "boolean"},
        {"name": "status", "kind": "string"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_irrigation.py",
                      "notes": "software + independent hand-derived vectors; not scientific validation"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}