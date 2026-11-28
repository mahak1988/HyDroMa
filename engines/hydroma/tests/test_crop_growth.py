"""Crop growth & yield tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.crop_growth import (
    compute_crop_growth,
    validate_crop_growth_input,
    temperature_response,
)


def test_temperature_response():
    assert temperature_response(-1, 0, 20, 30) == 0.0
    assert temperature_response(20, 0, 20, 30) == 1.0
    assert temperature_response(30, 0, 20, 30) == 0.0
    assert abs(temperature_response(10, 0, 20, 30) - 0.5) < 1e-9
    assert abs(temperature_response(5, 0, 20, 30) - 0.25) < 1e-9


def test_growth_no_temp_no_stress():
    days = [
        {"solar_radiation_mj": 20},
        {"solar_radiation_mj": 20},
    ]
    r = compute_crop_growth({"days": days, "rue": 3.0, "par_fraction": 0.48,
                             "harvest_index": 0.5})
    assert r["ok"] is True
    # per day: 3.0 * 0.48 * 20 = 28.8 g/m2; 2 days = 57.6
    assert abs(r["result"]["total_biomass_g_m2"] - 57.6) < 1e-6
    assert abs(r["result"]["yield_g_m2"] - 28.8) < 1e-6
    assert abs(r["result"]["yield_t_ha"] - 0.288) < 1e-6


def test_growth_water_stress_reduces():
    base = {"rue": 3.0, "par_fraction": 0.48, "harvest_index": 0.5,
            "days": [{"solar_radiation_mj": 20}]}
    full = compute_crop_growth(base)
    stressed = compute_crop_growth({**base, "days": [{"solar_radiation_mj": 20, "ks": 0.5}]})
    assert stressed["result"]["total_biomass_g_m2"] < full["result"]["total_biomass_g_m2"]


def test_growth_temperature_scalar():
    r = compute_crop_growth({
        "days": [{"solar_radiation_mj": 20, "tmean_c": 10}],
        "rue": 3.0, "par_fraction": 0.48, "harvest_index": 0.5,
        "tmin_c": 0, "topt_c": 20, "tmax_c": 30,
    })
    # f_temp at 10 = 0.5 -> biomass = 28.8 * 0.5
    assert abs(r["result"]["total_biomass_g_m2"] - 14.4) < 1e-6


def test_invalid_inputs():
    assert validate_crop_growth_input({"days": [], "rue": 1, "par_fraction": 0.5,
                                       "harvest_index": 0.5})["valid"] is False
    assert validate_crop_growth_input({"days": [{"solar_radiation_mj": 10}],
                                       "rue": 1, "par_fraction": 2.0,
                                       "harvest_index": 0.5})["valid"] is False
    r = compute_crop_growth({"days": [{"solar_radiation_mj": -5}], "rue": 1,
                             "par_fraction": 0.5, "harvest_index": 0.5})
    assert r["ok"] is False


def test_cardinal_order():
    res = validate_crop_growth_input({
        "days": [{"solar_radiation_mj": 10}], "rue": 1, "par_fraction": 0.5,
        "harvest_index": 0.5, "tmin_c": 20, "topt_c": 10, "tmax_c": 30})
    assert res["valid"] is False