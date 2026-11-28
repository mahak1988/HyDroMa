"""Isotope hydrology tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.isotope import (
    compute_deuterium_excess,
    compute_two_component_mixing,
    isotope_adapter,
)


def test_d_excess():
    # d = 10 - 8*(-5) = 10 + 40 = 50... use realistic: d2h=-20, d18o=-5 -> -20 -8*(-5)=20
    r = compute_deuterium_excess({"delta_2h": -20, "delta_18o": -5})
    assert r["ok"] is True
    assert abs(r["result"]["d_excess"] - 20.0) < 1e-9


def test_d_excess_invalid():
    r = compute_deuterium_excess({"delta_2h": -20})
    assert r["ok"] is False


def test_mixing():
    # f_old = (mix - new)/(old - new) = (-10 - -5)/(-20 - -5) = (-5)/(-15)=0.3333
    r = compute_two_component_mixing({"delta_mix": -10, "delta_old": -20, "delta_new": -5})
    assert r["ok"] is True
    assert abs(r["result"]["fraction_old"] - (1.0 / 3.0)) < 1e-3
    assert abs(r["result"]["fraction_new"] - (2.0 / 3.0)) < 1e-3


def test_mixing_identical():
    r = compute_two_component_mixing({"delta_mix": -10, "delta_old": -5, "delta_new": -5})
    assert r["ok"] is False


def test_adapter():
    assert isotope_adapter({"method": "dexcess", "delta_2h": 0, "delta_18o": 0})["ok"] is True
    assert isotope_adapter({"method": "mixing", "delta_mix": -10, "delta_old": -20, "delta_new": -5})["ok"] is True