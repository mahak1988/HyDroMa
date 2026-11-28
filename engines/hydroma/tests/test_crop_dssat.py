"""DSSAT-lite crop tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.crop_dssat import compute_dssat_lite, validate_dssat_input


def _base_input(days):
    return {
        "days": days,
        "tbase_c": 10, "rue": 3.0, "par_fraction": 0.48,
        "stage_gdd": [50, 100], "harvest_index_by_stage": [0.2, 0.5],
    }


def test_dssat_growth():
    days = [{"solar_radiation_mj": 20, "tmax_c": 30, "tmin_c": 20} for _ in range(5)]
    r = compute_dssat_lite(_base_input(days))
    assert r["ok"] is True
    # gdd/day = (30+20)/2 -10 = 15; 5 days = 75 -> stage 1 (>=50)
    assert r["result"]["final_stage"] == 1
    assert r["result"]["biomass_g_m2"] > 0


def test_dssat_stage_progression():
    days = [{"solar_radiation_mj": 20, "tmax_c": 30, "tmin_c": 20} for _ in range(10)]
    r = compute_dssat_lite(_base_input(days))
    # gdd/day 15; 10 days = 150 -> stage 1 (100 threshold, max index 1)
    assert r["result"]["final_stage"] == 1


def test_dssat_invalid():
    bad = _base_input([{"solar_radiation_mj": 20, "tmax_c": 30, "tmin_c": 20}])
    bad["stage_gdd"] = []
    assert validate_dssat_input(bad)["valid"] is False


def test_dssat_dry_run():
    r = compute_dssat_lite(_base_input([{"solar_radiation_mj": -1, "tmax_c": 30, "tmin_c": 20}]))
    assert r["ok"] is False