"""Pest risk tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.pest_risk import compute_pest_risk, validate_pest_input


def test_degree_day_event():
    days = [
        {"date": "d1", "tmax_c": 20, "tmin_c": 10},
        {"date": "d2", "tmax_c": 20, "tmin_c": 10},
    ]
    # base 10 -> gdd/day = (20+10)/2 -10 = 5; required 7 -> reached on d2
    r = compute_pest_risk({"mode": "degree_day", "days": days,
                           "lower_threshold_c": 10, "required_dd": 7})
    assert r["ok"] is True
    assert r["result"]["event_reached"] is True
    assert r["result"]["event_day"] == "d2"
    assert abs(r["result"]["total_gdd"] - 10.0) < 1e-9


def test_degree_day_cap():
    days = [{"date": "d1", "tmax_c": 40, "tmin_c": 10, "tcap_c": 20}]
    r = compute_pest_risk({"mode": "degree_day", "days": days,
                           "lower_threshold_c": 10, "required_dd": 100})
    # capped tmax 20 -> gdd = (20+10)/2 -10 = 5
    assert abs(r["result"]["total_gdd"] - 5.0) < 1e-9
    assert r["result"]["event_reached"] is False


def test_suitability_high():
    r = compute_pest_risk({"mode": "suitability", "tmean_c": 25,
                           "tmin_c": 10, "topt_c": 25, "tmax_c": 40,
                           "moisture_suitability": 1.0})
    assert r["ok"] is True
    assert r["result"]["f_temp"] == 1.0
    assert r["result"]["suitability"] == 1.0
    assert r["result"]["band"] == "high"


def test_suitability_unsuitable():
    r = compute_pest_risk({"mode": "suitability", "tmean_c": 5,
                           "tmin_c": 10, "topt_c": 25, "tmax_c": 40,
                           "moisture_suitability": 1.0})
    assert r["result"]["suitability"] == 0.0
    assert r["result"]["band"] == "unsuitable"


def test_invalid_mode():
    assert validate_pest_input({"mode": "foo"})["valid"] is False


def test_degree_day_invalid_required():
    r = compute_pest_risk({"mode": "degree_day",
                           "days": [{"tmax_c": 20, "tmin_c": 10}],
                           "lower_threshold_c": 10, "required_dd": 0})
    assert r["ok"] is False


def test_suitability_invalid_moisture():
    r = compute_pest_risk({"mode": "suitability", "tmean_c": 25, "tmin_c": 10,
                           "topt_c": 25, "tmax_c": 40, "moisture_suitability": 2.0})
    assert r["ok"] is False