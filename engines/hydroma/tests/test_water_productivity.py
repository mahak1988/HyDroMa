"""Water productivity / AEZ / scarcity tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.water_productivity import (
    compute_water_productivity,
    compute_aez,
    compute_water_scarcity,
    water_productivity_adapter,
)


def test_water_productivity():
    # yield 5000 kg/ha, ET 500 mm -> 5000/(500*10)=1.0 kg/m3
    r = compute_water_productivity({"yield_kg_ha": 5000, "et_mm": 500})
    assert r["ok"] is True
    assert abs(r["result"]["water_productivity_kg_m3"] - 1.0) < 1e-9


def test_water_productivity_invalid():
    r = compute_water_productivity({"yield_kg_ha": 100, "et_mm": 0})
    assert r["ok"] is False


def test_aez():
    # 200 days with P > 0.5 PET
    p = [100] * 200 + [10] * 165
    pet = [50] * 365
    r = compute_aez({"precipitation_series": p, "pet_series": pet})
    assert r["ok"] is True
    assert r["result"]["length_of_growing_period_days"] == 200
    assert r["result"]["zone"] == "humid"


def test_aez_arid():
    p = [10] * 365
    pet = [100] * 365
    r = compute_aez({"precipitation_series": p, "pet_series": pet})
    assert r["result"]["zone"] == "arid"


def test_scarcity():
    r = compute_water_scarcity({"withdrawal": 30, "availability": 100,
                                "environmental_flow_fraction": 0.0})
    assert r["ok"] is True
    # 30/100 = 0.3 -> moderate
    assert r["result"]["class"] == "moderate"


def test_scarcity_severe():
    r = compute_water_scarcity({"withdrawal": 90, "availability": 100,
                                "environmental_flow_fraction": 0.0})
    assert r["result"]["class"] == "severe"


def test_adapter():
    assert water_productivity_adapter({"method": "wp", "yield_kg_ha": 1000, "et_mm": 100})["ok"] is True
    assert water_productivity_adapter({"method": "scarcity", "withdrawal": 1, "availability": 10})["ok"] is True