"""GRACE remote sensing tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.remote_sensing import compute_grace_anomaly


def test_grace_depletion():
    # mass -5 Gt over 1e6 km2 -> height = -5e9/(1e6*1e6)*100 = -0.0005 cm? check
    r = compute_grace_anomaly({"mass_change_gt": -5.0, "area_km2": 1.0e6})
    assert r["ok"] is True
    # height_cm = (-5*1e9)/(1e6*1e6)*100 = -0.0005 cm
    assert r["result"]["equivalent_height_cm"] < 0
    assert r["result"]["trend"] == "depletion"
    assert abs(r["result"]["volume_km3"] - (-5.0)) < 1e-9


def test_grace_gain():
    r = compute_grace_anomaly({"mass_change_gt": 10.0, "area_km2": 5.0e5})
    assert r["result"]["trend"] == "gain"
    assert r["result"]["equivalent_height_cm"] > 0


def test_grace_invalid():
    r = compute_grace_anomaly({"mass_change_gt": 1.0, "area_km2": 0})
    assert r["ok"] is False


def test_grace_formula():
    # 1 Gt water = 1e9 m3; over 1e6 km2 (1e12 m2) -> 1e-3 m = 0.1 cm
    r = compute_grace_anomaly({"mass_change_gt": 1.0, "area_km2": 1.0e6})
    assert abs(r["result"]["equivalent_height_cm"] - 0.1) < 1e-9