"""Root-zone soil-water balance (single period, explicit drainage + closure).

A deterministic, HTTP-free, dependency-free accounting of the root-zone storage
for one period, with explicit soil properties and a full balance:

    inflows  = precipitation + irrigation
    outflows = et_actual + runoff + deep_percolation
    candidate = storage_start + inflows - outflows
    excess   = max(0, candidate - fc_storage)        # above field capacity -> drainage
    storage_next = candidate - excess

    TAW = sum((theta_fc - theta_wp) * dz)           [mm]
    depletion = fc_storage - storage_next           [mm]
    residual  = (storage_next - storage_start) - measured_storage_change  [mm]
    closure   = |residual| <= max(1, 0.02*|inflows|)

Distinct from ``daily_soil_water`` (multi-day time-stepper) and ``soil_water``
(TAW/storage/depletion): this is a single-period balance with explicit deep
percolation and a closure residual against an optional measured storage change.

Units: theta m3/m3, thickness mm, storage/fluxes mm. No silent clamping; negative
storage is flagged ``out_of_domain``. Software-tested; NOT scientifically validated.
"""

from __future__ import annotations

import math

__all__ = [
    "ROOT_ZONE_BALANCE_MODEL",
    "ROOT_ZONE_BALANCE_DEFINITION",
    "compute_root_zone_balance",
    "validate_root_zone_balance_input",
]

ROUND_DECIMALS = 4
EPS = 1e-9
VALID_PERIODS = ("day", "period")

ROOT_ZONE_BALANCE_MODEL = {
    "id": "eco-nojin.hydroma.root-zone-balance",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "S_next = S + P + I - ET - RO - DP - excess; excess = max(0, candidate - fc_storage)",
    "units": {"water_content": "m3_per_m3", "thickness": "mm", "water": "mm"},
}

ASSUMPTIONS = [
    "single_period",
    "excess_above_field_capacity_is_drainage",
    "deep_percolation_explicit_loss",
    "no_clamping_negative_storage_flagged",
    "per_unit_area",
]
LIMITATIONS = [
    "notValidated",
    "single_period_not_time_stepper",
    "no_redistribution_between_layers",
    "no_capillary_rise",
    "no_groundwater",
    "empirical_excess_rule",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). FAO Irrigation and Drainage Paper 56, Ch.5 (soil water balance).",
    "Dingman, S.L. (2015). Physical Hydrology (3rd ed.). Waveland Press.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _nonneg(value) -> bool:
    return _finite(value) and float(value) >= 0


def _validate_layers(layers) -> bool:
    if not isinstance(layers, list) or len(layers) == 0:
        return False
    for layer in layers:
        if not isinstance(layer, dict):
            return False
        dz, tfc, twp = layer.get("thickness_mm"), layer.get("theta_fc"), layer.get("theta_wp")
        if not (_finite(dz) and float(dz) > 0):
            return False
        if not (_finite(tfc) and 0.0 <= float(tfc) <= 1.0):
            return False
        if not (_finite(twp) and 0.0 <= float(twp) <= 1.0):
            return False
        if float(tfc) <= float(twp):
            return False
    return True


def validate_root_zone_balance_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    if not _validate_layers(input.get("layers")):
        errors.append({"field": "layers", "code": "INVALID_LAYERS"})
    if not _nonneg(input.get("initial_storage_mm")):
        errors.append({"field": "initial_storage_mm", "code": "INVALID_INITIAL"})
    for f in ("precipitation_mm", "irrigation_mm", "et_actual_mm", "runoff_mm"):
        if not _nonneg(input.get(f)):
            errors.append({"field": f, "code": "INVALID_INPUT"})
    if "deep_percolation_mm" in input and input.get("deep_percolation_mm") is not None and not _nonneg(input.get("deep_percolation_mm")):
        errors.append({"field": "deep_percolation_mm", "code": "INVALID_INPUT"})
    if "measured_storage_change_mm" in input and input.get("measured_storage_change_mm") is not None and not _finite(input.get("measured_storage_change_mm")):
        errors.append({"field": "measured_storage_change_mm", "code": "INVALID_MEASURED"})
    p = input.get("p")
    if p is not None and (not _finite(p) or not (0.0 < float(p) <= 1.0)):
        errors.append({"field": "p", "code": "INVALID_P"})
    period = input.get("period", "day")
    if period not in VALID_PERIODS:
        errors.append({"field": "period", "code": "INVALID_PERIOD"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_root_zone_balance(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_root_zone_balance_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": ROOT_ZONE_BALANCE_MODEL, "errors": validation["errors"]}

    layers = input["layers"]
    p = input.get("p")

    fc_storage = sum(float(l["theta_fc"]) * float(l["thickness_mm"]) for l in layers)
    wp_storage = sum(float(l["theta_wp"]) * float(l["thickness_mm"]) for l in layers)
    taw = fc_storage - wp_storage
    raw = (float(p) * taw) if p is not None else None

    s0 = float(input["initial_storage_mm"])
    P = float(input["precipitation_mm"])
    I = float(input["irrigation_mm"])
    ET = float(input["et_actual_mm"])
    RO = float(input["runoff_mm"])
    DP = float(input["deep_percolation_mm"]) if input.get("deep_percolation_mm") is not None else 0.0

    inflows = P + I
    outflows = ET + RO + DP
    candidate = s0 + inflows - outflows
    excess = max(0.0, candidate - fc_storage)
    storage_next = candidate - excess
    depletion = fc_storage - storage_next
    storage_change = storage_next - s0
    status = "surplus" if storage_change > EPS else "deficit" if storage_change < -EPS else "balanced"
    out_of_domain = storage_next < -EPS

    residual = None
    closure = None
    if input.get("measured_storage_change_mm") is not None:
        residual = storage_change - float(input["measured_storage_change_mm"])
        tol = max(1.0, 0.02 * abs(inflows))
        closure = abs(residual) <= tol

    return {
        "ok": True,
        "model": ROOT_ZONE_BALANCE_MODEL,
        "inputs": input,
        "result": {
            "root_zone_depth_mm": _round(sum(float(l["thickness_mm"]) for l in layers)),
            "fc_storage_mm": _round(fc_storage),
            "wp_storage_mm": _round(wp_storage),
            "taw_mm": _round(taw),
            "raw_mm": _round(raw) if raw is not None else None,
            "initial_storage_mm": _round(s0),
            "precipitation_mm": _round(P),
            "irrigation_mm": _round(I),
            "et_actual_mm": _round(ET),
            "runoff_mm": _round(RO),
            "deep_percolation_mm": _round(DP),
            "inflows_mm": _round(inflows),
            "outflows_mm": _round(outflows),
            "excess_mm": _round(excess),
            "storage_change_mm": _round(storage_change),
            "final_storage_mm": _round(storage_next),
            "depletion_mm": _round(depletion),
            "residual_mm": _round(residual) if residual is not None else None,
            "closure": closure,
            "status": status,
            "out_of_domain": out_of_domain,
            "unit": f"mm/{input.get('period', 'day')}",
        },
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


ROOT_ZONE_BALANCE_DEFINITION = {
    "id": ROOT_ZONE_BALANCE_MODEL["id"],
    "version": ROOT_ZONE_BALANCE_MODEL["version"],
    "domain": "soil",
    "title": "Root-zone soil-water balance (single period)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["m3_per_m3", "mm"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "layers", "kind": "array", "required": True, "description": "{thickness_mm, theta_fc, theta_wp}"},
        {"name": "initial_storage_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "precipitation_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "irrigation_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "et_actual_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "runoff_mm", "kind": "number", "unit": "mm", "required": True},
        {"name": "deep_percolation_mm", "kind": "number", "unit": "mm", "required": False},
        {"name": "measured_storage_change_mm", "kind": "number", "unit": "mm", "required": False},
        {"name": "p", "kind": "number", "unit": "fraction", "required": False},
    ],
    "outputs": [
        {"name": "final_storage_mm", "kind": "number", "unit": "mm"},
        {"name": "excess_mm", "kind": "number", "unit": "mm"},
        {"name": "depletion_mm", "kind": "number", "unit": "mm"},
        {"name": "closure", "kind": "boolean"},
        {"name": "status", "kind": "string"},
        {"name": "out_of_domain", "kind": "boolean"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_root_zone_balance.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}