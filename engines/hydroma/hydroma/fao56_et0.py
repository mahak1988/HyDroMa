"""FAO-56 Penman-Monteith reference evapotranspiration (ET0).

Reference: FAO Irrigation and Drainage Paper 56 (Allen, Pereira, Raes & Smith,
1998), Chapter 4, Eq. 6 (Penman-Monteith) and the supporting psychrometric /
radiation relations (Ch. 3). Daily time step.

Equation (mm/day):

    ET0 = [ 0.408 * delta * (Rn - G) + gamma * (900 / (T + 273)) * u2 * (es - ea) ]
          / [ delta + gamma * (1 + 0.34 * u2) ]

with
    es    = 0.6108 * exp(17.27 * T / (T + 237.3))          [kPa]
    delta = 4098 * es / (T + 237.3)^2                       [kPa/degC]
    gamma = 0.000665 * P                                    [kPa/degC]
    P     = 101.3 * ((293 - 0.0065 * z) / 293) ^ 5.26       [kPa]

Inputs: Rn (MJ/m2/day), G (MJ/m2/day, default 0 for daily step), T (degC),
u2 (m/s), ea (kPa); z (m, default 0 = sea level).

This is a faithful implementation of a published standard equation. It is
software-tested but NOT scientifically validated against observations. Passing
tests do not promote scientific status (stays NOT_VALIDATED).
"""

from __future__ import annotations

import math

from .units import is_quantity, quantity_value_unit

__all__ = [
    "FAO56_ET0_MODEL",
    "FAO56_ET0_DEFINITION",
    "FAO56_ET0_CONTRACT",
    "validate_fao56_et0_input",
    "compute_fao56_et0",
]

ROUND_DECIMALS = 4

FAO56_ET0_MODEL = {
    "id": "eco-nojin.hydroma.fao56-et0",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "ET0 = (0.408*delta*(Rn-G) + gamma*(900/(T+273))*u2*(es-ea)) / (delta + gamma*(1+0.34*u2))",
    "units": {"radiation": "mj_m2_day", "temperature": "degC", "wind": "m_s",
              "vapour_pressure": "kpa", "altitude": "m", "et": "mm_day"},
    "reference": "FAO Irrigation and Drainage Paper 56 (Allen et al., 1998), Chapter 4 Eq. 6",
}

FIELD_UNITS = {
    "rn": "mj_m2_day",
    "g": "mj_m2_day",
    "t": "degC",
    "u2": "m_s",
    "ea": "kpa",
    "z": "m",
}

REQUIRED_FIELDS = ["rn", "t", "u2", "ea"]
OPTIONAL_FIELDS = ["g", "z"]

ASSUMPTIONS = [
    "daily_time_step",
    "soil_heat_flux_G_defaults_to_zero",
    "sea_level_pressure_if_z_omitted",
    "ea_supplied_directly_kpa",
    "u2_measured_at_2m",
    "reference_surface_hypothetical",
]
LIMITATIONS = [
    "notValidated",
    "requires_quality_meteorological_inputs",
    "no_missing_data_gap_filling",
    "no_wind_height_adjustment",
    "accuracy_decreases_for_u2_gt_3",
    "not_an_actual_crop_evapotranspiration",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). Crop evapotranspiration - Guidelines for computing crop water requirements. FAO Irrigation and Drainage Paper 56.",
    "https://www.fao.org/4/x0490e/x0490e00.htm",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _to_number(value) -> float:
    if isinstance(value, bool):
        return float("nan")
    if isinstance(value, (int, float)):
        return float(value)
    if value is None or value == "":
        return float("nan")
    try:
        return float(value)
    except (TypeError, ValueError):
        return float("nan")


def _is_blank(value) -> bool:
    return value is None or value == ""


def _is_finite(value: float) -> bool:
    return isinstance(value, float) and math.isfinite(value)


def _normalize(input: dict):
    value: dict = {}
    errors: list = []
    for field, raw in input.items():
        if field not in FIELD_UNITS:
            value[field] = raw
            continue
        if _is_blank(raw):
            continue
        expected = FIELD_UNITS[field]
        if is_quantity(raw):
            qv, qu = quantity_value_unit(raw)
            if qu != expected:
                errors.append({"code": "UNSUPPORTED_UNIT", "field": field,
                               "message": f"{field} must use {expected}, received {qu}"})
                continue
            value[field] = qv
            continue
        value[field] = raw
    return value, errors


def validate_fao56_et0_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []

    for name in REQUIRED_FIELDS:
        raw = input.get(name)
        if _is_blank(raw):
            errors.append({"field": name, "code": "MISSING", "value": raw})
            continue
        v = _to_number(raw)
        if not _is_finite(v):
            errors.append({"field": name, "code": "NON_FINITE", "value": raw})

    # field-specific domain constraints
    t = _to_number(input.get("t"))
    if not _is_blank(input.get("t")) and _is_finite(t) and t <= -237.3:
        errors.append({"field": "t", "code": "INVALID_T", "value": input.get("t"),
                       "message": "t must be > -237.3 degC"})
    u2 = _to_number(input.get("u2"))
    if not _is_blank(input.get("u2")) and _is_finite(u2) and u2 < 0:
        errors.append({"field": "u2", "code": "NEGATIVE_U2", "value": u2})
    ea = _to_number(input.get("ea"))
    if not _is_blank(input.get("ea")) and _is_finite(ea) and ea < 0:
        errors.append({"field": "ea", "code": "NEGATIVE_EA", "value": ea})
    if not _is_blank(input.get("g")) and not _is_finite(_to_number(input.get("g"))):
        errors.append({"field": "g", "code": "NON_FINITE", "value": input.get("g")})
    z = _to_number(input.get("z"))
    if not _is_blank(input.get("z")) and _is_finite(z) and z < 0:
        errors.append({"field": "z", "code": "INVALID_Z", "value": z,
                       "message": "z (altitude) must be >= 0"})

    return {"valid": len(errors) == 0, "errors": errors}


def compute_fao56_et0(input: dict | None = None) -> dict:
    input = input or {}
    normalized, unit_errors = _normalize(input)
    if unit_errors:
        return {"ok": False, "model": FAO56_ET0_MODEL, "errors": unit_errors}

    validation = validate_fao56_et0_input(normalized)
    if not validation["valid"]:
        return {"ok": False, "model": FAO56_ET0_MODEL, "errors": validation["errors"]}

    T = _to_number(normalized["t"])
    u2 = _to_number(normalized["u2"])
    ea = _to_number(normalized["ea"])
    rn = _to_number(normalized["rn"])
    g = _to_number(normalized["g"]) if "g" in normalized else 0.0
    z = _to_number(normalized["z"]) if "z" in normalized else 0.0

    es = 0.6108 * math.exp(17.27 * T / (T + 237.3))
    delta = 4098.0 * es / ((T + 237.3) ** 2)
    pressure = 101.3 * (((293.0 - 0.0065 * z) / 293.0) ** 5.26)
    gamma = 0.000665 * pressure

    numerator = 0.408 * delta * (rn - g) + gamma * (900.0 / (T + 273.0)) * u2 * (es - ea)
    denominator = delta + gamma * (1.0 + 0.34 * u2)
    et0 = numerator / denominator

    warnings = []
    if ea > es:
        warnings.append({"code": "ES_LT_EA", "message": "ea exceeds es (condensation possible)"})
    if u2 > 3.0:
        warnings.append({"code": "HIGH_WIND", "message": "u2 > 3 m/s reduces ET0 accuracy"})
    if et0 < 0:
        warnings.append({"code": "NEGATIVE_ET0", "message": "negative ET0 indicates condensation"})

    return {
        "ok": True,
        "model": FAO56_ET0_MODEL,
        "inputs": {"rn": rn, "g": g, "t": T, "u2": u2, "ea": ea, "z": z},
        "components": {"es_kpa": _round(es), "delta_kpa_per_c": _round(delta),
                       "gamma_kpa_per_c": _round(gamma), "pressure_kpa": _round(pressure, 2)},
        "result": {
            "et0_mm_per_day": _round(et0),
            "es_kpa": _round(es),
            "delta_kpa_per_c": _round(delta),
            "gamma_kpa_per_c": _round(gamma),
            "pressure_kpa": _round(pressure, 2),
        },
        "warnings": warnings,
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


FAO56_ET0_DEFINITION = {
    "id": FAO56_ET0_MODEL["id"],
    "version": FAO56_ET0_MODEL["version"],
    "domain": "agriculture",
    "title": "FAO-56 reference evapotranspiration (ET0)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mj_m2_day", "degC", "m_s", "kpa", "m", "mm_day"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "rn", "kind": "quantity", "unit": "mj_m2_day", "required": True,
         "description": "net radiation at crop surface"},
        {"name": "t", "kind": "quantity", "unit": "degC", "required": True,
         "description": "mean daily air temperature at 2 m"},
        {"name": "u2", "kind": "quantity", "unit": "m_s", "required": True,
         "description": "wind speed at 2 m"},
        {"name": "ea", "kind": "quantity", "unit": "kpa", "required": True,
         "description": "actual vapour pressure"},
        {"name": "g", "kind": "quantity", "unit": "mj_m2_day", "required": False,
         "description": "soil heat flux (default 0 for daily step)"},
        {"name": "z", "kind": "quantity", "unit": "m", "required": False,
         "description": "altitude (default 0 = sea level)"},
    ],
    "outputs": [
        {"name": "et0_mm_per_day", "kind": "number", "unit": "mm_day"},
        {"name": "es_kpa", "kind": "number", "unit": "kpa"},
        {"name": "delta_kpa_per_c", "kind": "number", "unit": "kpa_per_c"},
        {"name": "gamma_kpa_per_c", "kind": "number", "unit": "kpa_per_c"},
        {"name": "pressure_kpa", "kind": "number", "unit": "kpa"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [
            {"kind": "unit_test", "status": "pass",
             "reference": "tests/test_fao56_et0.py",
             "notes": "software tests + independent hand-derived FAO-56 reference vectors"},
        ],
        "notes": "Software-tested only. Not validated against observations.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}

FAO56_ET0_CONTRACT = {
    "equation": FAO56_ET0_MODEL["equation"],
    "units": FAO56_ET0_MODEL["units"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "required_inputs": {k: FIELD_UNITS[k] for k in REQUIRED_FIELDS},
    "optional_inputs": {k: FIELD_UNITS[k] for k in OPTIONAL_FIELDS},
    "error_codes": ["MISSING", "NON_FINITE", "INVALID_T", "NEGATIVE_U2", "NEGATIVE_EA",
                    "INVALID_Z", "UNSUPPORTED_UNIT"],
    "warning_codes": ["ES_LT_EA", "HIGH_WIND", "NEGATIVE_ET0"],
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
}