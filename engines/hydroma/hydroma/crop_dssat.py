"""DSSAT/APSIM-lite crop model: thermal-time phenology + radiation biomass.

A bounded, deterministic, stdlib-only reference crop model that couples
thermal-time (growing degree day) stage development with radiation-use-efficiency
biomass accumulation and a phenology-driven harvest index:

    GDD_day = max(0, (Tmax + Tmin)/2 - Tbase)
    stage progression when cumulative GDD crosses each stage threshold
    dB      = RUE * PAR * f_temp * Ks           (per day)
    Biomass = sum(dB)
    Yield   = HI_stage * Biomass                (HI at maturity)

A simplified generic crop model (DSSAT/APSIM-inspired), not the full DSSAT or
APSIM with cultivar coefficients, soil N, or CO2.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "CROP_DSSAT_MODEL",
    "CROP_DSSAT_DEFINITION",
    "compute_dssat_lite",
    "validate_dssat_input",
]

ROUND_DECIMALS = 4

CROP_DSSAT_MODEL = {
    "id": "eco-nojin.hydroma.crop-dssat-lite",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "GDD stage; dB=RUE*PAR*f_temp*Ks; Yield=HI*Biomass",
    "units": {"biomass": "g/m2", "gdd": "degree-day"},
    "method": "DSSAT/APSIM-lite (thermal time + RUE)",
}

ASSUMPTIONS = [
    "thermal_time_stage_development",
    "radiation_use_efficiency",
    "cardinal_temperature_response",
    "stage_harvest_index",
]
LIMITATIONS = [
    "notValidated",
    "not_full_dssat_apsim",
    "no_soil_n_or_co2",
    "no_cultivar_coefficients",
    "single_biomass_pool",
]
REFERENCES = [
    "Jones, J.W., et al. (2003). The DSSAT cropping system model. European Journal of Agronomy 18.",
    "Keating, B.A., et al. (2003). An overview of APSIM. European Journal of Agronomy 18.",
    "Monteith, J.L. (1977). Climate and the efficiency of crop production in Britain.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _temp_response(t: float, tmin: float, topt: float, tmax: float) -> float:
    if t <= tmin or t >= tmax:
        return 0.0
    if t <= topt:
        return (t - tmin) / (topt - tmin)
    return (tmax - t) / (tmax - topt)


def validate_dssat_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    days = input.get("days")
    if not isinstance(days, list) or len(days) == 0:
        errors.append({"field": "days", "code": "INVALID"})
    else:
        for i, d in enumerate(days):
            if not isinstance(d, dict) or not _finite(d.get("solar_radiation_mj")) or float(d["solar_radiation_mj"]) < 0:
                errors.append({"field": f"days[{i}]", "code": "INVALID_RAD"})
                break
            if not _finite(d.get("tmax_c")) or not _finite(d.get("tmin_c")):
                errors.append({"field": f"days[{i}]", "code": "INVALID_TEMP"})
                break
    for key in ("tbase_c", "rue", "par_fraction"):
        if not _finite(input.get(key)):
            errors.append({"field": key, "code": "INVALID"})
    stages = input.get("stage_gdd")
    if not isinstance(stages, list) or len(stages) == 0:
        errors.append({"field": "stage_gdd", "code": "INVALID"})
    else:
        for i, v in enumerate(stages):
            if not _finite(v) or float(v) < 0:
                errors.append({"field": f"stage_gdd[{i}]", "code": "INVALID"})
                break
    hi = input.get("harvest_index_by_stage")
    if not isinstance(hi, list) or len(hi) != len(input.get("stage_gdd", [])):
        errors.append({"field": "harvest_index_by_stage", "code": "LENGTH_MISMATCH"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_dssat_lite(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_dssat_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": CROP_DSSAT_MODEL, "errors": validation["errors"]}

    days = input["days"]
    tbase = float(input["tbase_c"])
    rue = float(input["rue"])
    par_fraction = float(input["par_fraction"])
    stage_gdd = [float(v) for v in input["stage_gdd"]]
    hi_by_stage = [float(v) for v in input["harvest_index_by_stage"]]
    has_temp = all(_finite(input.get(k)) for k in ("tmin_c", "topt_c", "tmax_c"))
    tmin = float(input.get("tmin_c")) if has_temp else 0.0
    topt = float(input.get("topt_c")) if has_temp else 0.0
    tmax = float(input.get("tmax_c")) if has_temp else 0.0

    cum_gdd = 0.0
    biomass = 0.0
    stage = 0
    track = []
    for i, d in enumerate(days):
        tmax_d = float(d["tmax_c"])
        tmin_d = float(d["tmin_c"])
        gdd = max(0.0, (tmax_d + tmin_d) / 2.0 - tbase)
        cum_gdd += gdd
        while stage < len(stage_gdd) - 1 and cum_gdd >= stage_gdd[stage]:
            stage += 1
        par = par_fraction * float(d["solar_radiation_mj"])
        ks = float(d["ks"]) if d.get("ks") is not None else 1.0
        f_temp = _temp_response((tmax_d + tmin_d) / 2.0, tmin, topt, tmax) if has_temp else 1.0
        db = rue * par * f_temp * ks
        biomass += db
        track.append({"day": d.get("date", i), "gdd_cum": _round(cum_gdd),
                      "stage": stage, "biomass_inc": _round(db)})

    hi = hi_by_stage[stage]
    yield_g_m2 = hi * biomass
    return {
        "ok": True, "model": CROP_DSSAT_MODEL,
        "result": {"days": len(days), "total_gdd": _round(cum_gdd),
                   "final_stage": stage, "biomass_g_m2": _round(biomass),
                   "harvest_index": _round(hi), "yield_g_m2": _round(yield_g_m2),
                   "yield_t_ha": _round(yield_g_m2 * 0.01), "track": track},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


CROP_DSSAT_DEFINITION = {
    "id": CROP_DSSAT_MODEL["id"],
    "version": CROP_DSSAT_MODEL["version"],
    "domain": "crop",
    "title": "DSSAT/APSIM-lite crop model (thermal time + RUE)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["g/m2", "degree-day"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "days", "kind": "array", "required": True,
         "description": "{date?, solar_radiation_mj, tmax_c, tmin_c, ks?}"},
        {"name": "tbase_c", "kind": "number", "required": True},
        {"name": "rue", "kind": "number", "required": True},
        {"name": "par_fraction", "kind": "number", "required": True},
        {"name": "stage_gdd", "kind": "array", "required": True, "description": "cumulative GDD thresholds"},
        {"name": "harvest_index_by_stage", "kind": "array", "required": True},
        {"name": "tmin_c", "kind": "number", "required": False},
        {"name": "topt_c", "kind": "number", "required": False},
        {"name": "tmax_c", "kind": "number", "required": False},
    ],
    "outputs": [
        {"name": "yield_t_ha", "kind": "number", "unit": "t/ha"},
        {"name": "biomass_g_m2", "kind": "number", "unit": "g/m2"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_crop_dssat.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}