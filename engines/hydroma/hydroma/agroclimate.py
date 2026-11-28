"""Agro-climate indices: Thornthwaite PET, Priestley-Taylor ET0, Aridity Index,
Climate Normals.

Four bounded, deterministic, stdlib-only models:

1. **Thornthwaite PET** (Thornthwaite 1948) - monthly potential
   evapotranspiration from temperature, with a day-length correction:

       I  = sum((T/5)^1.514)  over months with T > 0     (annual heat index)
       a  = 6.75e-7 I^3 - 7.71e-5 I^2 + 1.792e-2 I + 0.49239
       PET_cm = 1.6 * (10 T / I)^a * F,   F = (N/12)*(d/30)

2. **Priestley-Taylor ET0** (Priestley & Taylor 1972):

       ET0 = alpha * delta/(delta+gamma) * (Rn - G) / lambda,  alpha = 1.26

3. **Aridity Index** (UNEP 1992): ``AI = P / PET`` + aridity class.

4. **Climate Normals** (WMO 1991-2020): n / mean / std / min / max / median over
   a reference series with a completeness fraction.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "AGROCLIMATE_MODEL",
    "AGROCLIMATE_DEFINITION",
    "compute_thornthwaite",
    "compute_priestley_taylor",
    "compute_aridity_index",
    "compute_climate_normals",
    "agroclimate_adapter",
    "validate_thornthwaite_input",
    "validate_priestley_taylor_input",
    "daylight_hours",
]

ROUND_DECIMALS = 4
MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
MONTH_MID_DOY = [15, 45, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]

AGROCLIMATE_MODEL = {
    "id": "eco-nojin.hydroma.agroclimate",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "PET=1.6(10T/I)^a F; ET0=alpha*d/(d+g)*(Rn-G)/lambda; AI=P/PET",
    "units": {"pet": "mm", "et0": "mm", "ai": "dimensionless"},
    "method": "Thornthwaite + Priestley-Taylor + Aridity + Normals",
}

ASSUMPTIONS = [
    "thornthwaite_temperature_based",
    "daylength_correction",
    "priestley_taylor_alpha_1_26",
    "aridity_unep_classes",
    "normals_reference_period",
]
LIMITATIONS = [
    "notValidated",
    "thornthwaite_low_radiation_sensitivity",
    "no Priestley-Taylor advection",
    "normals_descriptive_only",
]
REFERENCES = [
    "Thornthwaite, C.W. (1948). An approach toward a rational classification of climate. Geogr. Rev. 38.",
    "Priestley, M.H., Taylor, R.J. (1972). On the assessment of surface heat flux and evaporation. Boundary-Layer Problems.",
    "UNEP (1992). World Atlas of Desertification. UNEP.",
    "WMO (2017). WMO Guidelines on the Calculation of Climate Normals. WMO-No.1203.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def daylight_hours(latitude_deg: float, day_of_year: int) -> float:
    """Astronomical day length (hours) for a latitude and day of year."""
    lat = math.radians(latitude_deg)
    dec = math.radians(23.45 * math.sin(2.0 * math.pi * (284 + day_of_year) / 365.0))
    cos_ha = -math.tan(lat) * math.tan(dec)
    cos_ha = max(-1.0, min(1.0, cos_ha))
    ha = math.acos(cos_ha)
    return 24.0 / math.pi * ha


def validate_thornthwaite_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    temps = input.get("monthly_temps_c")
    if not isinstance(temps, list) or len(temps) != 12:
        errors.append({"field": "monthly_temps_c", "code": "INVALID_TEMPS"})
    else:
        for i, t in enumerate(temps):
            if not _finite(t):
                errors.append({"field": f"monthly_temps_c[{i}]", "code": "NON_FINITE"})
                break
    if not _finite(input.get("latitude_deg")):
        errors.append({"field": "latitude_deg", "code": "INVALID_LAT"})
    elif not (-90.0 <= float(input["latitude_deg"]) <= 90.0):
        errors.append({"field": "latitude_deg", "code": "OUT_OF_RANGE"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_thornthwaite(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_thornthwaite_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": AGROCLIMATE_MODEL, "errors": validation["errors"]}

    temps = [float(t) for t in input["monthly_temps_c"]]
    lat = float(input["latitude_deg"])
    heat_index = sum((t / 5.0) ** 1.514 for t in temps if t > 0.0)
    if heat_index <= 0.0:
        return {"ok": True, "model": AGROCLIMATE_MODEL,
                "result": {"method": "Thornthwaite", "annual_pet_mm": 0.0,
                           "monthly_pet_mm": [0.0] * 12, "heat_index": 0.0,
                           "note": "no month with T>0 -> PET=0"}}
    a = 6.75e-7 * heat_index ** 3 - 7.71e-5 * heat_index ** 2 + 1.792e-2 * heat_index + 0.49239
    monthly = []
    for m in range(12):
        t = temps[m]
        if t <= 0.0:
            monthly.append(0.0)
            continue
        pet_cm = 1.6 * (10.0 * t / heat_index) ** a
        n = daylight_hours(lat, MONTH_MID_DOY[m])
        f = (n / 12.0) * (MONTH_DAYS[m] / 30.0)
        monthly.append(pet_cm * 10.0 * f)  # cm -> mm
    return {
        "ok": True, "model": AGROCLIMATE_MODEL,
        "result": {"method": "Thornthwaite (1948)", "heat_index": _round(heat_index),
                   "a_coefficient": _round(a), "monthly_pet_mm": [_round(v) for v in monthly],
                   "annual_pet_mm": _round(sum(monthly))},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def validate_priestley_taylor_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    for key in ("rn_mj_m2_day", "t_c"):
        if not _finite(input.get(key)):
            errors.append({"field": key, "code": "INVALID"})
    if _finite(input.get("rn_mj_m2_day")) and float(input["rn_mj_m2_day"]) < 0:
        errors.append({"field": "rn_mj_m2_day", "code": "NEGATIVE"})
    if _finite(input.get("g_mj_m2_day")) and not _finite(input.get("g_mj_m2_day")):
        errors.append({"field": "g_mj_m2_day", "code": "INVALID"})
    if _finite(input.get("elevation_m")) and float(input["elevation_m"]) < 0:
        errors.append({"field": "elevation_m", "code": "NEGATIVE"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_priestley_taylor(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_priestley_taylor_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": AGROCLIMATE_MODEL, "errors": validation["errors"]}

    rn = float(input["rn_mj_m2_day"])
    t = float(input["t_c"])
    g = float(input.get("g_mj_m2_day") or 0.0)
    z = float(input.get("elevation_m") or 0.0)
    es = 0.6108 * math.exp(17.27 * t / (t + 237.3))
    delta = 4098.0 * es / (t + 237.3) ** 2
    p = 101.3 * ((293.0 - 0.0065 * z) / 293.0) ** 5.26
    gamma = 0.000665 * p
    alpha = 1.26
    lam = 2.45
    et0 = alpha * (delta / (delta + gamma)) * (rn - g) / lam
    return {
        "ok": True, "model": AGROCLIMATE_MODEL,
        "result": {"et0_mm_day": _round(et0), "delta": _round(delta),
                   "gamma": _round(gamma), "alpha": alpha, "rn_mj_m2_day": _round(rn)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_aridity_index(input: dict | None = None) -> dict:
    input = input or {}
    errors = []
    p = input.get("precipitation_mm")
    pet = input.get("pet_mm")
    if not _finite(p) or float(p) < 0:
        errors.append({"field": "precipitation_mm", "code": "INVALID"})
    if not _finite(pet) or float(pet) <= 0:
        errors.append({"field": "pet_mm", "code": "INVALID"})
    if errors:
        return {"ok": False, "model": AGROCLIMATE_MODEL, "errors": errors}
    ai = float(p) / float(pet)
    if ai < 0.03:
        cls = "hyper_arid"
    elif ai < 0.2:
        cls = "arid"
    elif ai < 0.5:
        cls = "semi_arid"
    elif ai < 0.65:
        cls = "dry_sub_humid"
    else:
        cls = "humid"
    return {
        "ok": True, "model": AGROCLIMATE_MODEL,
        "result": {"precipitation_mm": _round(float(p)), "pet_mm": _round(float(pet)),
                   "aridity_index": _round(ai), "class": cls, "method": "UNEP aridity index"},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_climate_normals(input: dict | None = None) -> dict:
    input = input or {}
    series = input.get("series")
    errors = []
    if not isinstance(series, list) or len(series) == 0:
        errors.append({"field": "series", "code": "INVALID"})
    else:
        for i, v in enumerate(series):
            if not _finite(v):
                errors.append({"field": f"series[{i}]", "code": "NON_FINITE"})
                break
    if errors:
        return {"ok": False, "model": AGROCLIMATE_MODEL, "errors": errors}
    vals = [float(v) for v in series]
    n = len(vals)
    mean = sum(vals) / n
    var = sum((x - mean) ** 2 for x in vals) / n
    std = math.sqrt(var)
    s = sorted(vals)
    median = s[n // 2] if n % 2 == 1 else 0.5 * (s[n // 2 - 1] + s[n // 2])
    return {
        "ok": True, "model": AGROCLIMATE_MODEL,
        "result": {"method": "WMO climate normals (descriptive)",
                   "count": n, "mean": _round(mean), "std": _round(std),
                   "min": _round(min(vals)), "max": _round(max(vals)),
                   "median": _round(median),
                   "period": input.get("period", "1991-2020")},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def agroclimate_adapter(input: dict | None = None) -> dict:
    """Dispatch by ``method``: thornthwaite | priestley_taylor | aridity | normals."""
    input = input or {}
    method = input.get("method", "thornthwaite")
    if method == "priestley_taylor":
        return compute_priestley_taylor(input)
    if method == "aridity":
        return compute_aridity_index(input)
    if method == "normals":
        return compute_climate_normals(input)
    return compute_thornthwaite(input)


AGROCLIMATE_DEFINITION = {
    "id": AGROCLIMATE_MODEL["id"],
    "version": AGROCLIMATE_MODEL["version"],
    "domain": "climate",
    "title": "Agro-climate (Thornthwaite, Priestley-Taylor, Aridity, Normals)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm", "dimensionless"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "method", "kind": "string", "required": False,
         "description": "thornthwaite (default) | priestley_taylor | aridity | normals"},
        {"name": "monthly_temps_c", "kind": "array", "required": False},
        {"name": "latitude_deg", "kind": "number", "required": False},
        {"name": "rn_mj_m2_day", "kind": "number", "required": False},
        {"name": "t_c", "kind": "number", "required": False},
        {"name": "elevation_m", "kind": "number", "required": False},
        {"name": "precipitation_mm", "kind": "number", "required": False},
        {"name": "pet_mm", "kind": "number", "required": False},
        {"name": "series", "kind": "array", "required": False},
    ],
    "outputs": [
        {"name": "annual_pet_mm", "kind": "number", "unit": "mm"},
        {"name": "et0_mm_day", "kind": "number", "unit": "mm"},
        {"name": "aridity_index", "kind": "number", "unit": "dimensionless"},
        {"name": "mean", "kind": "number"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_agroclimate.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}