"""Agro-climate tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.agroclimate import (
    compute_thornthwaite,
    compute_priestley_taylor,
    compute_aridity_index,
    compute_climate_normals,
    agroclimate_adapter,
    daylight_hours,
    validate_thornthwaite_input,
)


def test_daylight_range():
    # equator ~12h year-round
    assert abs(daylight_hours(0.0, 172) - 12.0) < 0.5
    # northern summer > 12h
    assert daylight_hours(45.0, 172) > 12.0


def test_thornthwaite_basic():
    temps = [5, 8, 12, 16, 20, 24, 26, 25, 21, 16, 10, 6]
    r = compute_thornthwaite({"monthly_temps_c": temps, "latitude_deg": 35})
    assert r["ok"] is True
    assert r["result"]["annual_pet_mm"] > 0
    assert len(r["result"]["monthly_pet_mm"]) == 12


def test_thornthwaite_cold():
    r = compute_thornthwaite({"monthly_temps_c": [-5] * 12, "latitude_deg": 35})
    assert r["result"]["annual_pet_mm"] == 0.0


def test_thornthwaite_invalid():
    assert validate_thornthwaite_input({"monthly_temps_c": [1, 2], "latitude_deg": 10})["valid"] is False


def test_priestley_taylor():
    r = compute_priestley_taylor({"rn_mj_m2_day": 15, "t_c": 20, "elevation_m": 0})
    assert r["ok"] is True
    assert r["result"]["et0_mm_day"] > 0


def test_priestley_taylor_invalid():
    r = compute_priestley_taylor({"rn_mj_m2_day": -1, "t_c": 20})
    assert r["ok"] is False


def test_aridity_classes():
    assert compute_aridity_index({"precipitation_mm": 50, "pet_mm": 1000})["result"]["class"] == "arid"
    assert compute_aridity_index({"precipitation_mm": 1500, "pet_mm": 1000})["result"]["class"] == "humid"
    assert compute_aridity_index({"precipitation_mm": 300, "pet_mm": 1000})["result"]["class"] == "semi_arid"


def test_normals():
    r = compute_climate_normals({"series": [10, 12, 14, 16, 18]})
    assert r["ok"] is True
    assert r["result"]["mean"] == 14.0
    assert r["result"]["min"] == 10.0
    assert r["result"]["max"] == 18.0


def test_adapter():
    assert agroclimate_adapter({"method": "aridity", "precipitation_mm": 100, "pet_mm": 500})["ok"] is True
    assert agroclimate_adapter({"method": "priestley_taylor", "rn_mj_m2_day": 10, "t_c": 15})["ok"] is True