"""Controlled laboratory pilots for HyDroMA (outside engines/).

Each pilot is a deterministic scenario (no randomness, no network) describing a
climate + soil + crop + water context. The harness (../harness.py) runs the
scientific models against every pilot and applies qualitative expectations.

All values are synthetic test conditions for software verification only — they
are NOT field data and NOT scientific validation.
"""

from __future__ import annotations

from typing import Any, Dict, List


def _layers(theta_fc: float, theta_wp: float, thickness_mm: float, n: int = 1) -> List[Dict[str, Any]]:
    return [{"name": f"L{i+1}", "thickness": thickness_mm,
             "thetaFc": theta_fc, "thetaWp": theta_wp} for i in range(n)]


def _et0_daily(mean: float, n: int = 12, amp: float = 0.0) -> List[float]:
    return [round(mean + amp * (1 if i % 2 == 0 else -1), 3) for i in range(n)]


def _precip(annual: float, wet_months=(11, 0, 1, 2, 3)) -> List[float]:
    wet = len(wet_months)
    per_wet = annual / wet if wet else 0.0
    return [round(per_wet if m in wet_months else 0.0, 2) for m in range(12)]


def _pet_from_temp(temps: List[float]) -> List[float]:
    # crude positive-degree proxy (mm/month) for aridity context only
    return [round(max(0.0, t) * 8.0, 2) for t in temps]


def _crop_days(tmax: float, tmin: float, rad: float, ks: float, n: int = 10) -> List[Dict[str, Any]]:
    return [{"date": f"d{i+1}", "solar_radiation_mj": rad, "tmax_c": tmax,
             "tmin_c": tmin, "ks": ks} for i in range(n)]


def _flow_series(base: float, n: int = 12) -> List[float]:
    return [round(base * (1.0 + 0.1 * (i % 3)), 2) for i in range(n)]


def _calib() -> Dict[str, Any]:
    import math
    xs = [i * 0.5 for i in range(11)]
    ys = [10.0 * math.exp(-0.5 * x) for x in xs]
    return {"x": xs, "y_obs": ys, "a_bounds": [0.0, 50.0], "k_bounds": [0.0, 2.0]}


def build_pilots() -> Dict[str, Dict[str, Any]]:
    pilots: Dict[str, Dict[str, Any]] = {}

    # 1) Hot arid — low rain, high ET0, sandy soil, high irrigation need.
    pilots["arid"] = {
        "name": "Hot arid (desert)",
        "latitude_deg": 30.0,
        "monthly_temps_c": [14, 16, 20, 26, 31, 35, 37, 36, 33, 27, 20, 15],
        "et0_mean": 8.5, "et0_amp": 1.5,
        "precip": _precip(120.0, wet_months=(12, 1, 2)),
        "soil": {"theta_fc": 0.16, "theta_wp": 0.07, "thickness_mm": 300.0, "p": 0.5},
        "crop": {"kc": 0.9, "rue": 3.0, "par_fraction": 0.48, "harvest_index": 0.5,
                 "stage_gdd": [50, 100], "hi_by_stage": [0.2, 0.5],
                 "tbase_c": 10.0, "tmin_c": 0.0, "topt_c": 20.0, "tmax_c": 40.0},
        "water": {"withdrawal": 85.0, "availability": 100.0, "renewable": 40.0,
                  "economic_value": 5000.0},
        "carbon": {"soc_stock": 800.0, "actual_rate": 0.1},
        "flow": _flow_series(2.0),
        "crop_days": _crop_days(38, 20, 22, ks=0.6),
        "transpiration": [2.0, 2.5, 3.0, 2.8, 2.2],
        "wpb": 4.0, "yield_kg_ha": 6000.0,
        "et_green": 120.0, "et_blue": 500.0,
        "expect": {"aridity": ["arid", "semi_arid"], "irrigation": "high"},
    }

    # 2) Semi-arid — moderate.
    pilots["semi_arid"] = {
        "name": "Semi-arid (steppe)",
        "latitude_deg": 35.0,
        "monthly_temps_c": [6, 8, 12, 17, 22, 26, 28, 27, 23, 17, 10, 7],
        "et0_mean": 5.5, "et0_amp": 1.0,
        "precip": _precip(350.0, wet_months=(3, 4, 10, 11)),
        "soil": {"theta_fc": 0.24, "theta_wp": 0.11, "thickness_mm": 400.0, "p": 0.55},
        "crop": {"kc": 0.85, "rue": 3.2, "par_fraction": 0.48, "harvest_index": 0.5,
                 "stage_gdd": [50, 100], "hi_by_stage": [0.2, 0.5],
                 "tbase_c": 10.0, "tmin_c": 0.0, "topt_c": 22.0, "tmax_c": 38.0},
        "water": {"withdrawal": 55.0, "availability": 100.0, "renewable": 80.0,
                  "economic_value": 8000.0},
        "carbon": {"soc_stock": 1500.0, "actual_rate": 0.25},
        "flow": _flow_series(5.0),
        "crop_days": _crop_days(32, 16, 20, ks=0.85),
        "transpiration": [2.5, 3.0, 3.5, 3.2, 2.6],
        "wpb": 4.2, "yield_kg_ha": 7000.0,
        "et_green": 300.0, "et_blue": 250.0,
        "expect": {"aridity": ["semi_arid", "dry_sub_humid"], "irrigation": "mid"},
    }

    # 3) Humid — high rain, low ET0, loam, low irrigation.
    pilots["humid"] = {
        "name": "Humid (temperate)",
        "latitude_deg": 48.0,
        "monthly_temps_c": [2, 3, 7, 12, 16, 20, 22, 21, 17, 12, 6, 3],
        "et0_mean": 3.0, "et0_amp": 0.8,
        "precip": _precip(1100.0, wet_months=(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11)),
        "soil": {"theta_fc": 0.32, "theta_wp": 0.16, "thickness_mm": 500.0, "p": 0.55},
        "crop": {"kc": 0.8, "rue": 3.0, "par_fraction": 0.48, "harvest_index": 0.5,
                 "stage_gdd": [50, 100], "hi_by_stage": [0.2, 0.5],
                 "tbase_c": 10.0, "tmin_c": 0.0, "topt_c": 20.0, "tmax_c": 35.0},
        "water": {"withdrawal": 20.0, "availability": 100.0, "renewable": 200.0,
                  "economic_value": 12000.0},
        "carbon": {"soc_stock": 3000.0, "actual_rate": 0.5},
        "flow": _flow_series(20.0),
        "crop_days": _crop_days(26, 14, 18, ks=1.0),
        "transpiration": [3.0, 3.5, 4.0, 3.8, 3.0],
        "wpb": 4.5, "yield_kg_ha": 8000.0,
        "et_green": 900.0, "et_blue": 100.0,
        "expect": {"aridity": ["humid", "dry_sub_humid"], "irrigation": "low"},
    }

    # 4) Cold — low temp, low PET, low GDD.
    pilots["cold"] = {
        "name": "Cold (boreal)",
        "latitude_deg": 60.0,
        "monthly_temps_c": [-10, -9, -4, 2, 8, 13, 15, 13, 8, 2, -4, -8],
        "et0_mean": 1.5, "et0_amp": 0.4,
        "precip": _precip(450.0, wet_months=(5, 6, 7, 8)),
        "soil": {"theta_fc": 0.30, "theta_wp": 0.14, "thickness_mm": 350.0, "p": 0.5},
        "crop": {"kc": 0.75, "rue": 2.8, "par_fraction": 0.48, "harvest_index": 0.45,
                 "stage_gdd": [50, 100], "hi_by_stage": [0.15, 0.45],
                 "tbase_c": 5.0, "tmin_c": 0.0, "topt_c": 18.0, "tmax_c": 30.0},
        "water": {"withdrawal": 15.0, "availability": 100.0, "renewable": 150.0,
                  "economic_value": 6000.0},
        "carbon": {"soc_stock": 4000.0, "actual_rate": 0.2},
        "flow": _flow_series(12.0),
        "crop_days": _crop_days(16, 6, 12, ks=1.0),
        "transpiration": [1.0, 1.2, 1.5, 1.4, 1.0],
        "wpb": 3.5, "yield_kg_ha": 4000.0,
        "et_green": 300.0, "et_blue": 50.0,
        "expect": {"aridity": ["humid", "dry_sub_humid"], "irrigation": "low", "gdd": "low"},
    }

    # 5) Mediterranean — wet winter, dry summer.
    pilots["mediterranean"] = {
        "name": "Mediterranean (wet winter / dry summer)",
        "latitude_deg": 38.0,
        "monthly_temps_c": [10, 11, 13, 16, 20, 25, 28, 28, 25, 20, 15, 11],
        "et0_mean": 5.0, "et0_amp": 1.2,
        "precip": _precip(500.0, wet_months=(10, 11, 0, 1, 2)),
        "soil": {"theta_fc": 0.26, "theta_wp": 0.12, "thickness_mm": 450.0, "p": 0.55},
        "crop": {"kc": 0.85, "rue": 3.1, "par_fraction": 0.48, "harvest_index": 0.5,
                 "stage_gdd": [50, 100], "hi_by_stage": [0.2, 0.5],
                 "tbase_c": 10.0, "tmin_c": 0.0, "topt_c": 22.0, "tmax_c": 38.0},
        "water": {"withdrawal": 60.0, "availability": 100.0, "renewable": 90.0,
                  "economic_value": 9000.0},
        "carbon": {"soc_stock": 1800.0, "actual_rate": 0.3},
        "flow": _flow_series(6.0),
        "crop_days": _crop_days(30, 16, 20, ks=0.8),
        "transpiration": [2.5, 3.0, 3.5, 3.2, 2.5],
        "wpb": 4.2, "yield_kg_ha": 7500.0,
        "et_green": 450.0, "et_blue": 200.0,
        "expect": {"aridity": ["semi_arid", "dry_sub_humid"], "irrigation": "mid"},
    }

    # 6) Saline / water-stress — same climate as semi-arid but stressed (ks<1).
    p = pilots["semi_arid"]
    saline = {
        **p,
        "name": "Saline / water-stressed (semi-arid + stress)",
        "crop_days": _crop_days(32, 16, 20, ks=0.4),  # strong stress
        "transpiration": [1.0, 1.2, 1.5, 1.4, 1.0],   # reduced transpiration
        "expect": {"aridity": ["semi_arid", "dry_sub_humid"], "irrigation": "mid", "stress": True},
    }
    pilots["saline"] = saline

    return pilots


PILOTS = build_pilots()