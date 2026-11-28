"""Controlled lab harness: run HyDroMA models across pilots and check behaviour.

Deterministic, offline, stdlib-only. Uses the installed ``hydroma`` package from
``engines/hydroma`` (read-only). Produces a structured report; no file writes
here (the CLI writes results).
"""

from __future__ import annotations

import os
import sys
from typing import Any, Dict, List, Tuple

_HERE = os.path.dirname(os.path.abspath(__file__))
_ENGINE = os.path.join(os.path.dirname(_HERE), "engines", "hydroma")
if _ENGINE not in sys.path:
    sys.path.insert(0, _ENGINE)

from hydroma.fao56_et0 import compute_fao56_et0
from hydroma.water_balance import compute_water_balance
from hydroma.soil_water import compute_soil_water_storage
from hydroma.crop_water import compute_crop_water
from hydroma.irrigation import compute_irrigation_schedule
from hydroma.effective_precip import compute_effective_precipitation
from hydroma.drought import compute_drought_index
from hydroma.drought_wmo import compute_spi_gamma
from hydroma.agroclimate import compute_thornthwaite, compute_aridity_index
from hydroma.crop_growth import compute_crop_growth
from hydroma.crop_dssat import compute_dssat_lite
from hydroma.crop_dual import compute_aquacrop_lite
from hydroma.water_footprint import compute_water_footprint
from hydroma.water_productivity import compute_water_productivity, compute_water_scarcity
from hydroma.carbon import compute_4per1000
from hydroma.calibration import compute_calibration
from hydroma.surface_hydrology import compute_low_flow_7q10

from pilots import PILOTS

__all__ = ["run_all", "BATTERY"]

BATTERY = [
    "fao56_et0", "water_balance", "soil_water", "crop_water", "irrigation",
    "effective_precip", "drought_spi", "spi_gamma", "thornthwaite", "aridity",
    "crop_growth", "crop_dssat", "aquacrop", "water_footprint", "water_productivity",
    "water_scarcity", "carbon_4per1000", "calibration", "low_flow_7q10",
]


def _pet(temps: List[float]) -> List[float]:
    return [round(max(0.0, t) * 8.0, 2) for t in temps]


def _safe(fn, payload) -> Dict[str, Any]:
    try:
        out = fn(payload)
        ok = bool(out.get("ok", True))
        return {"ok": ok, "result": out.get("result"), "error": out.get("errors") if not ok else None}
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "result": None, "error": f"{type(exc).__name__}: {exc}"}


def _run_pilot(pid: str, p: Dict[str, Any]) -> Dict[str, Any]:
    temps = p["monthly_temps_c"]
    lat = p["latitude_deg"]
    et0_mean = p["et0_mean"]
    soil = p["soil"]
    crop = p["crop"]
    water = p["water"]
    precip = p["precip"]
    pet = _pet(temps)
    taw = round((soil["theta_fc"] - soil["theta_wp"]) * soil["thickness_mm"], 3)
    depletion = round(0.5 * taw, 3)
    layers = [{"name": "L1", "thickness": soil["thickness_mm"],
               "thickness_mm": soil["thickness_mm"],
               "thetaFc": soil["theta_fc"], "thetaWp": soil["theta_wp"],
               "theta_fc": soil["theta_fc"], "theta_wp": soil["theta_wp"]}]
    annual_p = round(sum(precip), 2)
    annual_pet = round(sum(pet), 2) or 1.0

    res: Dict[str, Any] = {}
    res["fao56_et0"] = _safe(compute_fao56_et0,
                             {"rn": round(et0_mean * 2.45 / 0.77, 3), "t": round(sum(temps) / 12, 2),
                              "u2": 2.0, "ea": 1.2, "z": 0})
    res["water_balance"] = _safe(compute_water_balance,
                                 {"periodDays": 30, "precipitation": annual_p / 12,
                                  "irrigation": 0.0, "runoff": 0.0,
                                  "evapotranspiration": round(et0_mean * 30 * crop["kc"], 2),
                                  "deepPercolation": 0.0})
    res["soil_water"] = _safe(compute_soil_water_storage, {"layers": layers, "p": soil["p"]})
    res["crop_water"] = _safe(compute_crop_water,
                              {"et0_mm_per_day": et0_mean, "kc": crop["kc"], "p": soil["p"],
                               "taw_mm": taw, "depletion_mm": depletion})
    res["irrigation"] = _safe(compute_irrigation_schedule,
                              {"layers": layers, "p": soil["p"], "depletion_mm": depletion})
    res["effective_precip"] = _safe(compute_effective_precipitation,
                                    {"precipitation_mm": annual_p / 12, "curve_number": 75})
    res["drought_spi"] = _safe(compute_drought_index, {"mode": "SPI", "series": precip})
    nonzero = [v for v in precip if v > 0] or [1.0]
    res["spi_gamma"] = _safe(compute_spi_gamma, {"series": nonzero})
    res["thornthwaite"] = _safe(compute_thornthwaite,
                                {"monthly_temps_c": temps, "latitude_deg": lat})
    res["aridity"] = _safe(compute_aridity_index,
                           {"precipitation_mm": annual_p, "pet_mm": annual_pet})
    res["crop_growth"] = _safe(compute_crop_growth,
                               {"days": p["crop_days"], "rue": crop["rue"],
                                "par_fraction": crop["par_fraction"],
                                "harvest_index": crop["harvest_index"],
                                "tbase_c": crop["tbase_c"], "tmin_c": crop["tmin_c"],
                                "topt_c": crop["topt_c"], "tmax_c": crop["tmax_c"]})
    res["crop_dssat"] = _safe(compute_dssat_lite,
                              {"days": p["crop_days"], "tbase_c": crop["tbase_c"],
                               "rue": crop["rue"], "par_fraction": crop["par_fraction"],
                               "stage_gdd": crop["stage_gdd"],
                               "harvest_index_by_stage": crop["hi_by_stage"],
                               "tmin_c": crop["tmin_c"], "topt_c": crop["topt_c"],
                               "tmax_c": crop["tmax_c"]})
    res["aquacrop"] = _safe(compute_aquacrop_lite,
                            {"transpiration_series": p["transpiration"], "wpb": p["wpb"],
                             "harvest_index": crop["harvest_index"]})
    res["water_footprint"] = _safe(compute_water_footprint,
                                   {"et_green_mm": p["et_green"], "et_blue_mm": p["et_blue"],
                                    "yield_t_ha": round(p["yield_kg_ha"] / 1000.0, 3)})
    res["water_productivity"] = _safe(compute_water_productivity,
                                      {"yield_kg_ha": p["yield_kg_ha"],
                                       "et_mm": round(et0_mean * 30, 2)})
    res["water_scarcity"] = _safe(compute_water_scarcity,
                                  {"withdrawal": water["withdrawal"],
                                   "availability": water["availability"],
                                   "environmental_flow_fraction": 0.3})
    res["carbon_4per1000"] = _safe(compute_4per1000,
                                   {"soc_stock_t_ha": p["carbon"]["soc_stock"],
                                    "actual_rate_pct": p["carbon"]["actual_rate"]})
    res["calibration"] = _safe(compute_calibration, {
        "x": [i * 0.5 for i in range(11)],
        "y_obs": [10.0 * pow(2.718281828, -0.5 * (i * 0.5)) for i in range(11)],
        "a_bounds": [0.0, 50.0], "k_bounds": [0.0, 2.0]})
    res["low_flow_7q10"] = _safe(compute_low_flow_7q10, {"series": p["flow"]})
    return res


def _num(res: Dict[str, Any], model: str, key: str, default=None):
    r = res.get(model, {})
    if not r.get("ok") or not isinstance(r.get("result"), dict):
        return default
    return r["result"].get(key, default)


def _check_pilot(pid: str, p: Dict[str, Any], res: Dict[str, Any]) -> List[str]:
    fails: List[str] = []
    for m in BATTERY:
        if not res.get(m, {}).get("ok"):
            fails.append(f"{pid}: model {m} not ok ({res.get(m, {}).get('error')})")
    ar = _num(res, "aridity", "class")
    if ar not in p["expect"]["aridity"]:
        fails.append(f"{pid}: aridity class {ar} not in {p['expect']['aridity']}")
    return fails


def run_all() -> Dict[str, Any]:
    results: Dict[str, Any] = {}
    failures: List[str] = []
    for pid, p in PILOTS.items():
        res = _run_pilot(pid, p)
        results[pid] = res
        failures.extend(_check_pilot(pid, p, res))

    # Cross-pilot qualitative checks.
    def net_irr(pid):
        r = results[pid]
        etc = _num(r, "crop_water", "etc_mm_per_day") or 0.0
        return etc

    arid_low = _num(results["arid"], "low_flow_7q10", "low_flow_7q10")
    humid_low = _num(results["humid"], "low_flow_7q10", "low_flow_7q10")
    if arid_low is not None and humid_low is not None and not (arid_low < humid_low):
        failures.append("cross: arid 7Q10 should be < humid 7Q10")
    cold_gdd = _num(results["cold"], "crop_dssat", "total_gdd")
    arid_gdd = _num(results["arid"], "crop_dssat", "total_gdd")
    if cold_gdd is not None and arid_gdd is not None and not (cold_gdd < arid_gdd):
        failures.append("cross: cold total GDD should be < arid total GDD")
    saline_bio = _num(results["saline"], "crop_growth", "total_biomass_g_m2")
    semi_bio = _num(results["semi_arid"], "crop_growth", "total_biomass_g_m2")
    if saline_bio is not None and semi_bio is not None and not (saline_bio < semi_bio):
        failures.append("cross: saline biomass should be < semi-arid biomass (stress)")
    arid_sc = _num(results["arid"], "water_scarcity", "scarcity_index")
    humid_sc = _num(results["humid"], "water_scarcity", "scarcity_index")
    if arid_sc is not None and humid_sc is not None and not (arid_sc > humid_sc):
        failures.append("cross: arid scarcity should be > humid scarcity")

    return {
        "battery": BATTERY,
        "pilots": list(PILOTS.keys()),
        "results": results,
        "failures": failures,
        "passed": len(failures) == 0,
    }