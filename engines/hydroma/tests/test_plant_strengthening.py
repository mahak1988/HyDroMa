"""Plant strengthening tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.plant_strengthening import (
    compute_plant_strengthening,
    validate_strengthening_input,
)


def test_single_factor():
    r = compute_plant_strengthening({"silicon": 1.0})
    assert r["ok"] is True
    assert r["result"]["index"] == 1.0
    assert r["result"]["band"] == "strong"


def test_equal_weight_mean():
    r = compute_plant_strengthening({"silicon": 1.0, "isr": 0.0, "sar": 0.5, "biostimulant": 0.5})
    # mean = (1+0+0.5+0.5)/4 = 0.5
    assert abs(r["result"]["index"] - 0.5) < 1e-9
    assert r["result"]["band"] == "moderate"


def test_weighted():
    r = compute_plant_strengthening({"silicon": 1.0, "isr": 0.0,
                                     "weights": {"silicon": 3.0, "isr": 1.0}})
    # (3*1 + 1*0)/4 = 0.75
    assert abs(r["result"]["index"] - 0.75) < 1e-9


def test_no_factors():
    assert validate_strengthening_input({})["valid"] is False
    r = compute_plant_strengthening({})
    assert r["ok"] is False


def test_out_of_range():
    r = compute_plant_strengthening({"silicon": 1.5})
    assert r["ok"] is False


def test_band_none():
    r = compute_plant_strengthening({"silicon": 0.0})
    assert r["result"]["band"] == "none"
    assert r["result"]["index"] == 0.0


def test_band_strong_threshold():
    r = compute_plant_strengthening({"silicon": 0.8, "isr": 0.8})
    assert r["result"]["band"] == "strong"