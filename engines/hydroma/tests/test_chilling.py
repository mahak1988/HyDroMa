"""Chilling & bloom tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.chilling import (
    compute_chilling,
    estimate_bloom,
    chilling_adapter,
    utah_chill_unit,
    validate_chilling_input,
)


def test_utah_units_table():
    assert utah_chill_unit(0.0) == 0.0
    assert utah_chill_unit(2.0) == 0.5
    assert utah_chill_unit(5.0) == 1.0
    assert utah_chill_unit(11.0) == 0.5
    assert utah_chill_unit(14.0) == 0.0
    assert utah_chill_unit(17.0) == -0.5
    assert utah_chill_unit(25.0) == -1.0


def test_chilling_hours():
    r = compute_chilling({"temperatures_c": [0, 3, 7.2, 7.3, -1, 5]})
    assert r["ok"] is True
    # 0, 3, 7.2, 5 are within [0, 7.2]
    assert r["result"]["chilling_hours"] == 4
    assert r["result"]["hours"] == 6


def test_chilling_invalid():
    assert validate_chilling_input({"temperatures_c": []})["valid"] is False
    r = compute_chilling({"temperatures_c": []})
    assert r["ok"] is False


def test_bloom_reached():
    days = [
        {"date": "d1", "tmax_c": 10, "tmin_c": 5},
        {"date": "d2", "tmax_c": 12, "tmin_c": 6},
        {"date": "d3", "tmax_c": 15, "tmin_c": 8},
    ]
    r = estimate_bloom({"days": days, "chilling_requirement": 1.0,
                        "bloom_gdd": 5.0, "tbase_c": 5.0})
    assert r["ok"] is True
    assert r["result"]["bloom_reached"] is True
    assert r["result"]["bloom_day"] is not None


def test_bloom_not_reached():
    days = [{"date": "d1", "tmax_c": 30, "tmin_c": 20}]
    r = estimate_bloom({"days": days, "chilling_requirement": 100.0,
                        "bloom_gdd": 5.0, "tbase_c": 5.0})
    assert r["result"]["bloom_reached"] is False
    assert r["result"]["bloom_day"] is None


def test_adapter_dispatch():
    assert chilling_adapter({"temperatures_c": [5, 6]})["result"]["chilling_hours"] == 2
    days = [{"date": "d1", "tmax_c": 10, "tmin_c": 5}]
    out = chilling_adapter({"days": days, "chilling_requirement": 0.1,
                            "bloom_gdd": 0.1, "tbase_c": 5.0})
    assert "bloom_day" in out["result"]