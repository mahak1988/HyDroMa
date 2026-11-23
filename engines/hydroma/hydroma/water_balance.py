"""Root-zone water balance - faithful Python port of the TypeScript reference.

Control volume: the soil/root zone of a defined area over a defined period.
All depths are in millimetres over the period.

    deltaS = P + I + CR - ET - R - DP

    P   precipitation input                 (+)  [required]
    I   irrigation input                    (+)  [required]
    CR  capillary rise into the root zone   (+)  [optional, default 0]
    ET  actual evapotranspiration           (-)  [required]
    R   surface runoff leaving              (-)  [required]
    DP  deep percolation below the root zone (-) [optional, default 0]

Sign convention: inflows are positive contributions to storage; outflows are
subtracted. deltaS > 0 means the root zone wetted up; deltaS < 0 means it dried
down.

Maturity is ``tested``, never ``validated``: green tests are not scientific
validation.
"""

from __future__ import annotations

import math

from .units import is_quantity, quantity_value_unit, UnitError

__all__ = [
    "WATER_BALANCE_MODEL",
    "WATER_BALANCE_DEFINITION",
    "WATER_BALANCE_CONTRACT",
    "validate_water_balance_input",
    "compute_water_balance",
]

M3_PER_MM_HA = 10  # 1 mm of water over 1 ha = 10 m3
ROUND_DECIMALS = 4  # output precision; rounding is half-up (matches TS Math.round)

WATER_BALANCE_MODEL = {
    "id": "eco-nojin.hydroma.water-balance",
    "version": "1.1.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "deltaS = P + I + CR - ET - R - DP",
    "units": {"depth": "mm", "area": "ha", "volume": "m3", "period": "day"},
    "validation": {
        "status": "NOT_VALIDATED",
        "softwareTests": "unit_tests_passing",
        "scientificValidation": "not_performed",
        "note": "Green unit tests are not equivalent to scientific validation.",
    },
}

REQUIRED_FIELDS = [
    {"name": "precipitation", "symbol": "P", "unit": "mm"},
    {"name": "irrigation", "symbol": "I", "unit": "mm"},
    {"name": "runoff", "symbol": "R", "unit": "mm"},
    {"name": "evapotranspiration", "symbol": "ET", "unit": "mm"},
]
OPTIONAL_MAGNITUDE_FIELDS = [
    {"name": "deepPercolation", "symbol": "DP", "unit": "mm"},
    {"name": "capillaryRise", "symbol": "CR", "unit": "mm"},
]
# unit expected per field at the contract boundary
FIELD_UNITS = {
    "periodDays": "day",
    "precipitation": "mm",
    "irrigation": "mm",
    "runoff": "mm",
    "evapotranspiration": "mm",
    "deepPercolation": "mm",
    "capillaryRise": "mm",
    "areaHa": "ha",
    "initialStorage": "mm",
    "measuredStorageChange": "mm",
}

SIGN_CONVENTION = {
    "storage": "deltaS_positive_is_storage_increase",
    "inflow": ["P", "I", "CR"],
    "outflow": ["ET", "R", "DP"],
}

ASSUMPTIONS = [
    "controlVolume",
    "samePeriodArea",
    "actualET",
    "noLateralNoSnow",
    "storageSoilOnly",
]
LIMITATIONS = [
    "notValidated",
    "singleControlVolume",
    "dprCrUserProvided",
    "fixedSignConvention",
    "notOfficial",
    "provenanceHashesComputedByWorker",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). Crop evapotranspiration - FAO Irrigation and Drainage Paper 56.",
    "Dingman, S.L. (2015). Physical Hydrology (3rd ed.). Waveland Press.",
    "Hillel, D. (1998). Environmental Soil Physics. Academic Press.",
    "WMO (2010). Guide to Hydrological Practices, Volume I (WMO-No. 168).",
]


def _round(value: float, decimals: int = 4) -> float:
    """Match TypeScript Math.round (half toward +infinity) for reproducible output."""
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


def _normalize(input: dict) -> tuple:
    """Accept plain numbers or explicit quantities; reject unit mismatches."""
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
                errors.append(
                    {
                        "code": "UNSUPPORTED_UNIT",
                        "field": field,
                        "message": f"{field} must use {expected}, received {qu}",
                    }
                )
                continue
            value[field] = qv
            continue
        value[field] = raw
    return value, errors


def validate_water_balance_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []

    period = _to_number(input.get("periodDays"))
    if (not _is_finite(period)) or period <= 0 or not float(period).is_integer():
        errors.append(
            {"field": "periodDays", "symbol": "days", "code": "PERIOD_INVALID",
             "value": input.get("periodDays"), "unit": "day"}
        )

    for spec in REQUIRED_FIELDS:
        raw = input.get(spec["name"])
        if _is_blank(raw):
            errors.append({"field": spec["name"], "symbol": spec["symbol"], "code": "MISSING",
                           "value": raw, "unit": spec["unit"]})
            continue
        v = _to_number(raw)
        if not _is_finite(v):
            errors.append({"field": spec["name"], "symbol": spec["symbol"], "code": "NOT_FINITE",
                           "value": raw, "unit": spec["unit"]})
        elif v < 0:
            errors.append({"field": spec["name"], "symbol": spec["symbol"], "code": "NEGATIVE",
                           "value": v, "unit": spec["unit"]})

    for spec in OPTIONAL_MAGNITUDE_FIELDS:
        raw = input.get(spec["name"])
        if _is_blank(raw):
            continue
        v = _to_number(raw)
        if not _is_finite(v):
            errors.append({"field": spec["name"], "symbol": spec["symbol"], "code": "NOT_FINITE",
                           "value": raw, "unit": spec["unit"]})
        elif v < 0:
            errors.append({"field": spec["name"], "symbol": spec["symbol"], "code": "NEGATIVE",
                           "value": v, "unit": spec["unit"]})

    if not _is_blank(input.get("areaHa")):
        area = _to_number(input.get("areaHa"))
        if (not _is_finite(area)) or area <= 0:
            errors.append({"field": "areaHa", "symbol": "A", "code": "AREA_INVALID",
                           "value": input.get("areaHa"), "unit": "ha"})

    if not _is_blank(input.get("initialStorage")):
        s0 = _to_number(input.get("initialStorage"))
        if (not _is_finite(s0)) or s0 < 0:
            errors.append({"field": "initialStorage", "symbol": "S0", "code": "STORAGE_INVALID",
                           "value": input.get("initialStorage"), "unit": "mm"})

    if not _is_blank(input.get("measuredStorageChange")) and not _is_finite(
        _to_number(input.get("measuredStorageChange"))
    ):
        errors.append({"field": "measuredStorageChange", "symbol": "dS_obs", "code": "NOT_FINITE",
                       "value": input.get("measuredStorageChange"), "unit": "mm"})

    return {"valid": len(errors) == 0, "errors": errors}


def compute_water_balance(input: dict | None = None) -> dict:
    input = input or {}
    normalized, unit_errors = _normalize(input)
    if unit_errors:
        return {"ok": False, "model": WATER_BALANCE_MODEL, "errors": unit_errors}

    validation = validate_water_balance_input(normalized)
    if not validation["valid"]:
        return {"ok": False, "model": WATER_BALANCE_MODEL, "errors": validation["errors"]}

    provided = {
        "deepPercolation": not _is_blank(input.get("deepPercolation")),
        "capillaryRise": not _is_blank(input.get("capillaryRise")),
    }
    defaults_applied = []
    if not provided["deepPercolation"]:
        defaults_applied.append("deepPercolation")
    if not provided["capillaryRise"]:
        defaults_applied.append("capillaryRise")

    P = _to_number(normalized.get("precipitation"))
    I = _to_number(normalized.get("irrigation"))
    R = _to_number(normalized.get("runoff"))
    ET = _to_number(normalized.get("evapotranspiration"))
    DP = _to_number(normalized.get("deepPercolation")) if provided["deepPercolation"] else 0.0
    CR = _to_number(normalized.get("capillaryRise")) if provided["capillaryRise"] else 0.0
    period_days = _to_number(normalized.get("periodDays"))

    area_ha = None if _is_blank(normalized.get("areaHa")) else _to_number(normalized.get("areaHa"))
    initial_storage = None if _is_blank(normalized.get("initialStorage")) else _to_number(normalized.get("initialStorage"))
    measured = None if _is_blank(normalized.get("measuredStorageChange")) else _to_number(normalized.get("measuredStorageChange"))

    inflow = P + I + CR
    outflow = ET + R + DP
    storage_change = inflow - outflow

    def to_volume(mm: float):
        return None if area_ha is None else mm * area_ha * M3_PER_MM_HA

    runoff_coefficient = (R / P) if P > 0 else None
    residual = (storage_change - measured) if measured is not None else None
    closure_tolerance = max(1.0, 0.02 * abs(inflow))
    balance_closes = None if residual is None else abs(residual) <= closure_tolerance

    eps = 1e-9
    status = "surplus" if storage_change > eps else "deficit" if storage_change < -eps else "balanced"

    raw_final = None if initial_storage is None else initial_storage + storage_change
    final_storage = None
    if raw_final is not None and raw_final >= -eps:
        final_storage = _round(max(0.0, raw_final))

    out_of_domain = (raw_final is not None and raw_final < -eps) or (R > inflow + eps)

    warnings = []
    if ET > inflow + eps:
        warnings.append({"code": "ET_GT_INFLOW", "value": _round(ET - inflow), "unit": "mm"})
    if R > inflow + eps:
        warnings.append({"code": "RUNOFF_GT_INPUT", "value": _round(R - inflow), "unit": "mm"})
    if P == 0 and R > 0:
        warnings.append({"code": "NO_PRECIP_RUNOFF", "value": _round(R), "unit": "mm"})
    if raw_final is not None and raw_final < -eps:
        warnings.append({"code": "NEGATIVE_STORAGE", "value": _round(raw_final), "unit": "mm"})
    if residual is not None and not balance_closes:
        warnings.append({"code": "CLOSURE_MISMATCH", "value": _round(residual), "unit": "mm",
                         "tolerance": _round(closure_tolerance)})

    equation = {
        "formula": "dS = P + I + CR - ET - R - DP",
        "formulaDisplay": "deltaS = P + I + CR - ET - R - DP",
        "substitution": (
            f"dS = {_round(P, 2)} + {_round(I, 2)} + {_round(CR, 2)} - "
            f"{_round(ET, 2)} - {_round(R, 2)} - {_round(DP, 2)} = {_round(storage_change, 2)} mm"
        ),
    }

    return {
        "ok": True,
        "model": WATER_BALANCE_MODEL,
        "inputsProvided": provided,
        "defaultsApplied": defaults_applied,
        "inputs": {
            "periodDays": period_days,
            "areaHa": area_ha,
            "precipitation": P,
            "irrigation": I,
            "runoff": R,
            "evapotranspiration": ET,
            "deepPercolation": DP,
            "capillaryRise": CR,
            "initialStorage": initial_storage,
            "measuredStorageChange": measured,
        },
        "components": {"P": P, "I": I, "CR": CR, "ET": ET, "R": R, "DP": DP,
                       "inflow": _round(inflow), "outflow": _round(outflow)},
        "result": {
            "storageChangeMm": _round(storage_change),
            "storageChangeM3": (None if area_ha is None else _round(to_volume(storage_change))),
            "inflowMm": _round(inflow),
            "outflowMm": _round(outflow),
            "inflowM3": (None if area_ha is None else _round(to_volume(inflow))),
            "outflowM3": (None if area_ha is None else _round(to_volume(outflow))),
            "runoffCoefficient": (None if runoff_coefficient is None else _round(runoff_coefficient)),
            "residualMm": (None if residual is None else _round(residual)),
            "residualM3": (None if (residual is None or area_ha is None) else _round(to_volume(residual))),
            "residualDefinition": "deltaS_computed_minus_deltaS_observed",
            "closureToleranceMm": _round(closure_tolerance),
            "balanceCloses": balance_closes,
            "initialStorageMm": (None if initial_storage is None else _round(initial_storage)),
            "finalStorageMm": final_storage,
            "outOfDomain": out_of_domain,
            "status": status,
            "unit": "mm",
        },
        "equation": equation,
        "signConvention": SIGN_CONVENTION,
        "warnings": warnings,
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


WATER_BALANCE_DEFINITION = {
    "id": WATER_BALANCE_MODEL["id"],
    "version": WATER_BALANCE_MODEL["version"],
    "domain": "water",
    "title": "Root-zone water balance",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm", "day", "ha", "m3"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "periodDays", "kind": "number", "unit": "day", "required": True},
        {"name": "precipitation", "kind": "quantity", "unit": "mm", "required": True},
        {"name": "irrigation", "kind": "quantity", "unit": "mm", "required": True},
        {"name": "runoff", "kind": "quantity", "unit": "mm", "required": True},
        {"name": "evapotranspiration", "kind": "quantity", "unit": "mm", "required": True},
        {"name": "deepPercolation", "kind": "quantity", "unit": "mm", "required": False},
        {"name": "capillaryRise", "kind": "quantity", "unit": "mm", "required": False},
        {"name": "areaHa", "kind": "quantity", "unit": "ha", "required": False},
        {"name": "initialStorage", "kind": "quantity", "unit": "mm", "required": False},
        {"name": "measuredStorageChange", "kind": "quantity", "unit": "mm", "required": False},
    ],
    "outputs": [
        {"name": "storageChangeMm", "kind": "quantity", "unit": "mm"},
        {"name": "status", "kind": "string"},
        {"name": "balanceCloses", "kind": "boolean"},
        {"name": "finalStorageMm", "kind": "quantity", "unit": "mm"},
        {"name": "outOfDomain", "kind": "boolean"},
        {"name": "residualMm", "kind": "quantity", "unit": "mm"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": WATER_BALANCE_MODEL["validation"],
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}

# Explicit input/output contract (documentation + test reference).
WATER_BALANCE_CONTRACT = {
    "equation": "deltaS = P + I + CR - ET - R - DP",
    "sign_convention": "inflows (P, I, CR) positive; outflows (ET, R, DP) subtracted",
    "units": {"depth": "mm", "area": "ha", "volume": "m3", "period": "day"},
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "required_inputs": {
        "periodDays": {"unit": "day", "constraint": "finite integer > 0"},
        "precipitation": {"symbol": "P", "unit": "mm", "constraint": ">= 0"},
        "irrigation": {"symbol": "I", "unit": "mm", "constraint": ">= 0"},
        "runoff": {"symbol": "R", "unit": "mm", "constraint": ">= 0"},
        "evapotranspiration": {"symbol": "ET", "unit": "mm", "constraint": ">= 0"},
    },
    "optional_inputs": {
        "deepPercolation": {"symbol": "DP", "unit": "mm", "default": 0, "constraint": ">= 0"},
        "capillaryRise": {"symbol": "CR", "unit": "mm", "default": 0, "constraint": ">= 0"},
        "areaHa": {"symbol": "A", "unit": "ha", "constraint": "> 0 when present"},
        "initialStorage": {"symbol": "S0", "unit": "mm", "constraint": ">= 0 when present"},
        "measuredStorageChange": {"symbol": "dS_obs", "unit": "mm", "constraint": "finite when present"},
    },
    "outputs": {
        "storageChangeMm": "mm", "storageChangeM3": "m3 or null",
        "status": "surplus | deficit | balanced",
        "balanceCloses": "bool or null", "finalStorageMm": "mm or null",
        "outOfDomain": "bool", "residualMm": "mm or null",
    },
    "error_codes": ["MISSING", "NOT_FINITE", "NEGATIVE", "PERIOD_INVALID",
                    "AREA_INVALID", "STORAGE_INVALID", "UNSUPPORTED_UNIT"],
    "warning_codes": ["ET_GT_INFLOW", "RUNOFF_GT_INPUT", "NO_PRECIP_RUNOFF",
                      "NEGATIVE_STORAGE", "CLOSURE_MISMATCH"],
    "closure_tolerance_mm": "max(1, 0.02 * |inflow|)",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
}