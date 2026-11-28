"""Simplified crop biomass growth & yield (Radiation Use Efficiency).

A bounded, deterministic, stdlib-only model based on the Monteith (1977)
radiation-use-efficiency (RUE) framework, with multiplicative water and
temperature stress scalars:

    PAR_t     = par_fraction * solar_radiation_t          [MJ/m2/day]
    f_temp_t  = cardinal temperature response (0..1)       [-]
    f_water_t = supplied water-stress scalar Ks (0..1)     [-]
    dB_t      = RUE * PAR_t * f_temp_t * f_water_t         [g/m2/day]
    Biomass   = sum_t dB_t                                 [g/m2]
    Yield     = Biomass * harvest_index                    [g/m2]

Temperature response uses three cardinal points (Tmin, Topt, Tmax) with a
piecewise-linear rise/fall. Water stress ``ks`` is supplied (never inferred);
absent -> 1.0 (no stress). This is a **simplified** growth model: no CO2,
no nutrient limitation, no phenological stage partitioning, no yield-forming
organ dynamics.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "CROP_GROWTH_MODEL",
    "CROP_GROWTH_DEFINITION",
    "compute_crop_growth",
    "validate_crop_growth_input",
    "temperature_response",
]

ROUND_DECIMALS = 4

CROP_GROWTH_MODEL = {
    "id": "eco-nojin.hydroma.crop-growth",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "dB=RUE*PAR*f_temp*f_water; Biomass=sum(dB); Yield=Biomass*HI",
    "units": {"biomass": "g/m2", "yield": "g/m2", "radiation": "MJ/m2/day"},
    "method": "Monteith 1977 RUE with water/temperature scalars",
}

ASSUMPTIONS = [
    "radiation_use_efficiency_constant",
    "par_fraction_supplied",
    "water_stress_scalar_supplied",
    "cardinal_temperature_response",
    "harvest_index_supplied",
]
LIMITATIONS = [
    "notValidated",
    "no_co2_effect",
    "no_nutrient_limitation",
    "no_phenology_partitioning",
    "single_biomass_pool",
]
REFERENCES = [
    "Monteith, J.L. (1977). Climate and the efficiency of crop production in Britain. Phil. Trans. R. Soc. B 281.",
    "Sinclair, T.R., Horie, T. (2004). Radiation use efficiency and crop growth. Field Crops Research.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def temperature_response(t: float, tmin: float, topt: float, tmax: float) -> float:
    """Piecewise-linear cardinal temperature response in [0, 1]."""
    if t <= tmin or t >= tmax:
        return 0.0
    if t <= topt:
        return (t - tmin) / (topt - tmin)
    return (tmax - t) / (tmax - topt)


def validate_crop_growth_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    days = input.get("days")
    if not isinstance(days, list) or len(days) == 0:
        errors.append({"field": "days", "code": "INVALID_DAYS"})
    else:
        for i, d in enumerate(days):
            if not isinstance(d, dict):
                errors.append({"field": f"days[{i}]", "code": "INVALID_DAY"})
                break
            if not _finite(d.get("solar_radiation_mj")) or float(d["solar_radiation_mj"]) < 0:
                errors.append({"field": f"days[{i}].solar_radiation_mj", "code": "INVALID_RAD"})
                break
            if "ks" in d and d["ks"] is not None:
                if not _finite(d["ks"]) or not (0.0 <= float(d["ks"]) <= 1.0):
                    errors.append({"field": f"days[{i}].ks", "code": "INVALID_KS"})
                    break
            if "tmean_c" in d and d["tmean_c"] is not None:
                if not _finite(d["tmean_c"]):
                    errors.append({"field": f"days[{i}].tmean_c", "code": "INVALID_TEMP"})
                    break
    for key in ("rue", "par_fraction", "harvest_index"):
        if not _finite(input.get(key)):
            errors.append({"field": key, "code": "INVALID_PARAM"})
    if _finite(input.get("rue")) and float(input["rue"]) < 0:
        errors.append({"field": "rue", "code": "INVALID_RUE"})
    if _finite(input.get("par_fraction")) and not (0.0 < float(input["par_fraction"]) <= 1.0):
        errors.append({"field": "par_fraction", "code": "INVALID_PAR_FRACTION"})
    if _finite(input.get("harvest_index")) and not (0.0 <= float(input["harvest_index"]) <= 1.0):
        errors.append({"field": "harvest_index", "code": "INVALID_HI"})
    temps = [input.get("tmin_c"), input.get("topt_c"), input.get("tmax_c")]
    if all(_finite(t) for t in temps):
        if not (float(temps[0]) < float(temps[1]) < float(temps[2])):
            errors.append({"field": "cardinal_temps", "code": "INVALID_CARDINALS",
                           "message": "require tmin_c < topt_c < tmax_c"})
    elif any(_finite(t) for t in temps):
        errors.append({"field": "cardinal_temps", "code": "INCOMPLETE_CARDINALS"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_crop_growth(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_crop_growth_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": CROP_GROWTH_MODEL, "errors": validation["errors"]}

    days = input["days"]
    rue = float(input["rue"])
    par_fraction = float(input["par_fraction"])
    hi = float(input["harvest_index"])
    has_temp = all(_finite(input.get(k)) for k in ("tmin_c", "topt_c", "tmax_c"))
    tmin = float(input.get("tmin_c")) if has_temp else 0.0
    topt = float(input.get("topt_c")) if has_temp else 0.0
    tmax = float(input.get("tmax_c")) if has_temp else 0.0

    biomass = 0.0
    track = []
    for i, d in enumerate(days):
        par = par_fraction * float(d["solar_radiation_mj"])
        ks = float(d["ks"]) if d.get("ks") is not None else 1.0
        if has_temp and d.get("tmean_c") is not None:
            f_temp = temperature_response(float(d["tmean_c"]), tmin, topt, tmax)
        else:
            f_temp = 1.0
        db = rue * par * f_temp * ks
        biomass += db
        track.append({
            "day": d.get("date", i),
            "par_mj": _round(par),
            "f_temp": _round(f_temp),
            "f_water": _round(ks),
            "biomass_inc_g_m2": _round(db),
        })

    yield_g_m2 = biomass * hi
    return {
        "ok": True,
        "model": CROP_GROWTH_MODEL,
        "inputs": {"days": len(days), "rue": rue, "par_fraction": par_fraction,
                   "harvest_index": hi},
        "result": {
            "days": len(days),
            "total_biomass_g_m2": _round(biomass),
            "yield_g_m2": _round(yield_g_m2),
            "yield_t_ha": _round(yield_g_m2 * 0.01),  # 1 g/m2 = 0.01 t/ha
            "track": track,
            "note": "yield_t_ha = yield_g_m2 * 0.01 (1 g/m2 = 0.01 t/ha)",
        },
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


CROP_GROWTH_DEFINITION = {
    "id": CROP_GROWTH_MODEL["id"],
    "version": CROP_GROWTH_MODEL["version"],
    "domain": "crop",
    "title": "Simplified crop biomass growth & yield (RUE)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["g/m2", "MJ/m2/day"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "days", "kind": "array", "required": True,
         "description": "list of {date?, solar_radiation_mj, tmean_c?, ks?}"},
        {"name": "rue", "kind": "number", "required": True, "description": "radiation use efficiency g/MJ"},
        {"name": "par_fraction", "kind": "number", "required": True, "description": "PAR fraction of solar radiation (0,1]"},
        {"name": "harvest_index", "kind": "number", "required": True, "description": "harvest index [0,1]"},
        {"name": "tmin_c", "kind": "number", "required": False},
        {"name": "topt_c", "kind": "number", "required": False},
        {"name": "tmax_c", "kind": "number", "required": False},
    ],
    "outputs": [
        {"name": "total_biomass_g_m2", "kind": "number", "unit": "g/m2"},
        {"name": "yield_g_m2", "kind": "number", "unit": "g/m2"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_crop_growth.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}