"""Real-data simulation: drive HyDroMA models with REAL Open-Meteo data.

Compares FAO-56 Penman-Monteith ET0 (hydroma) against Hargreaves ET0 (hydroma)
on the same real drivers using the evaluation metrics, then runs drought
(SPI/SPEI), aridity, crop-water and a root-zone bucket over the real year.

This is a real-data *intercomparison / behaviour test*, NOT scientific
validation. All models remain NOT_VALIDATED.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List

from hydroma.fao56_et0 import compute_fao56_et0
from hydroma.hargreaves_et0 import compute_hargreaves_et0
from hydroma.agroclimate import compute_aridity_index
from hydroma.drought_wmo import compute_spi_gamma
from hydroma.crop_water import compute_crop_water
from hydroma.evaluation import compute_metrics

__all__ = ["simulate", "DROUGHT_CLASSES"]

DROUGHT_CLASSES = ["extremely_wet", "very_wet", "moderately_wet", "near_normal",
                   "moderately_dry", "severely_dry", "extremely_dry"]

_SIGMA = 4.903e-9
_ALBEDO = 0.23


def _es(t: float) -> float:
    return 0.6108 * math.exp(17.27 * t / (t + 237.3))


def _astro(lat_deg: float, doy: int):
    phi = math.radians(lat_deg)
    dr = 1.0 + 0.033 * math.cos(2.0 * math.pi / 365.0 * doy)
    decl = 0.409 * math.sin(2.0 * math.pi / 365.0 * doy - 1.39)
    ws = math.acos(max(-1.0, min(1.0, -math.tan(phi) * math.tan(decl))))
    ra = (24.0 * 60.0 / math.pi) * 0.082 * dr * (
        ws * math.sin(phi) * math.sin(decl)
        + math.cos(phi) * math.cos(decl) * math.sin(ws))
    return ra


def _net_radiation(rs: float, tmax: float, tmin: float, ea: float, ra: float) -> float:
    rso = 0.75 * ra
    rs = min(rs, rso) if rso > 0 else rs
    rns = (1.0 - _ALBEDO) * rs
    ratio = (rs / rso) if rso > 0 else 1.0
    rnl = _SIGMA * ((tmax + 273.16) ** 4 + (tmin + 273.16) ** 4) / 2.0 \
        * (0.34 - 0.14 * math.sqrt(max(0.0, ea))) * (1.35 * ratio - 0.35)
    return rns - rnl


def _month_of(iso: str) -> int:
    return int(iso.split("-")[1])


def simulate(daily: Dict[str, List], latitude: float) -> Dict[str, Any]:
    times = daily["time"]
    tmax = daily["temperature_2m_max"]
    tmin = daily["temperature_2m_min"]
    precip = daily["precipitation_sum"]
    rs = daily["shortwave_radiation_sum"]
    wind = daily["wind_speed_10m_max"]
    n = len(times)

    fao, har = [], []
    for i in range(n):
        doy = i + 1
        ra = _astro(latitude, doy)
        ea = _es(tmin[i])  # dewpoint proxy (RH not provided)
        rn = _net_radiation(rs[i], tmax[i], tmin[i], ea, ra)
        tmean = (tmax[i] + tmin[i]) / 2.0
        f = compute_fao56_et0({"rn": round(rn, 3), "t": round(tmean, 2),
                               "u2": round(wind[i], 3), "ea": round(ea, 4), "z": 0.0})
        h = compute_hargreaves_et0({"tMax": tmax[i], "tMin": tmin[i], "ra": round(ra, 3)})
        fao.append(f["result"]["et0_mm_per_day"])
        har.append(h["et0"])

    # Real intercomparison: FAO-56 (model) vs Hargreaves (reference).
    metrics = compute_metrics([(fao[i], har[i]) for i in range(n)])

    # Monthly aggregation for drought.
    months: Dict[int, Dict[str, float]] = {}
    for i, t in enumerate(times):
        m = _month_of(t)
        months.setdefault(m, {"p": 0.0, "pet": 0.0})
        months[m]["p"] += precip[i]
        months[m]["pet"] += har[i]
    mkeys = sorted(months)
    p_series = [round(months[m]["p"], 2) for m in mkeys]
    pet_series = [round(months[m]["pet"], 2) for m in mkeys]
    balance = [round(p_series[i] - pet_series[i], 2) for i in range(len(mkeys))]
    spi = compute_spi_gamma({"series": p_series})
    spei = compute_spi_gamma({"series": [b for b in balance]})
    spi_vals = [v["spi"] for v in spi["result"].get("values", [])] if spi.get("ok") else []
    spei_vals = [v["spi"] for v in spei["result"].get("values", [])] if spei.get("ok") else []

    # Aridity (annual).
    annual_p = round(sum(precip), 2)
    annual_pet = round(sum(har), 2) or 1.0
    aridity = compute_aridity_index({"precipitation_mm": annual_p, "pet_mm": annual_pet})

    # Crop water (representative wheat-like kc) from mean FAO ET0.
    etc_mean = round(sum(fao) / n, 3)
    crop = compute_crop_water({"et0_mm_per_day": etc_mean, "kc": 0.85, "p": 0.55,
                               "taw_mm": 120.0, "depletion_mm": 60.0})

    # Simple root-zone bucket over the real year (real P, ETc = kc*ET0, stress Ks).
    taw = 120.0
    raw = 0.55 * taw
    storage = taw
    ks_min = 1.0
    for i in range(n):
        etc = 0.85 * fao[i]
        ks = 1.0 if storage >= raw else max(0.0, storage / raw)
        ks_min = min(ks_min, ks)
        storage += precip[i] - ks * etc
        if storage > taw:
            storage = taw
        if storage < 0.0:
            storage = 0.0

    return {
        "n_days": n,
        "period": {"start": times[0], "end": times[-1]},
        "et0": {"fao_mean": round(sum(fao) / n, 3),
                "hargreaves_mean": round(sum(har) / n, 3),
                "fao_min": round(min(fao), 3), "fao_max": round(max(fao), 3)},
        "evaluation_fao56_vs_hargreaves": metrics,
        "drought": {
            "spi_min": round(min(spi_vals), 3) if spi_vals else None,
            "spi_max": round(max(spi_vals), 3) if spi_vals else None,
            "spei_min": round(min(spei_vals), 3) if spei_vals else None,
            "months": mkeys,
        },
        "aridity": {"index": aridity["result"]["aridity_index"],
                    "class": aridity["result"]["class"],
                    "annual_precip_mm": annual_p, "annual_pet_mm": annual_pet},
        "crop_water": crop.get("result"),
        "root_zone": {"final_storage_mm": round(storage, 2),
                      "min_ks": round(ks_min, 3), "taw_mm": taw},
    }