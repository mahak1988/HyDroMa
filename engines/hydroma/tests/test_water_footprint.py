"""Water footprint & SDG 6.4 tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.water_footprint import (
    compute_water_footprint,
    compute_sdg_water_stress,
    validate_water_footprint_input,
    validate_sdg_water_stress_input,
)


def test_wf_green_blue():
    r = compute_water_footprint({"et_green_mm": 300, "et_blue_mm": 200, "yield_t_ha": 5})
    # green = 300*10/5 = 600; blue = 200*10/5 = 400; total 1000
    assert abs(r["result"]["wf_green_m3_ton"] - 600) < 1e-9
    assert abs(r["result"]["wf_blue_m3_ton"] - 400) < 1e-9
    assert abs(r["result"]["wf_total_m3_ton"] - 1000) < 1e-9


def test_wf_grey():
    r = compute_water_footprint({"et_green_mm": 100, "et_blue_mm": 100, "yield_t_ha": 5,
                                 "pollutant_load_kg": 10, "c_max": 100, "c_nat": 0})
    # grey = (10*1e6/100)/5 = 20000 m3/ton
    assert abs(r["result"]["wf_grey_m3_ton"] - 20000) < 1e-6
    assert r["result"]["wf_total_m3_ton"] > 0


def test_wf_invalid_yield():
    assert validate_water_footprint_input({"et_green_mm": 1, "et_blue_mm": 1, "yield_t_ha": 0})["valid"] is False


def test_wf_grey_bad_conc():
    r = compute_water_footprint({"et_green_mm": 1, "et_blue_mm": 1, "yield_t_ha": 1,
                                 "pollutant_load_kg": 1, "c_max": 1, "c_nat": 5})
    assert r["ok"] is False


def test_sdg_levels():
    assert compute_sdg_water_stress({"withdrawal": 10, "renewable_resources": 100})["result"]["level"] == "no_stress"
    assert compute_sdg_water_stress({"withdrawal": 30, "renewable_resources": 100})["result"]["level"] == "low"
    assert compute_sdg_water_stress({"withdrawal": 60, "renewable_resources": 100})["result"]["level"] == "medium"
    assert compute_sdg_water_stress({"withdrawal": 90, "renewable_resources": 100})["result"]["level"] == "high"
    assert compute_sdg_water_stress({"withdrawal": 150, "renewable_resources": 100})["result"]["level"] == "critical"


def test_sdg_invalid():
    assert validate_sdg_water_stress_input({"withdrawal": 1, "renewable_resources": 0})["valid"] is False