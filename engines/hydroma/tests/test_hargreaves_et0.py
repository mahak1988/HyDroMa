"""Hargreaves ET0 tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.hargreaves_et0 import compute_hargreaves_et0, validate_hargreaves_input


def test_et0_positive():
    r = compute_hargreaves_et0({"tMax": 30, "tMin": 15, "ra": 40})
    assert r["et0"] > 0
    assert r["tMean"] == 22.5


def test_et0_cold():
    assert compute_hargreaves_et0({"tMax": 5, "tMin": -5, "ra": 10})["et0"] >= 0


def test_et0_invalid():
    assert validate_hargreaves_input({"tMax": 5, "tMin": 10, "ra": 10})
    with pytest.raises(ValueError):
        compute_hargreaves_et0({"tMax": 5, "tMin": 10, "ra": 10})