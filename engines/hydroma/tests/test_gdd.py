"""GDD model tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.gdd import accumulate_gdd, compute_gdd, validate_gdd_input


def test_gdd_simple():
    r = compute_gdd({"tMax": 30, "tMin": 10, "tBase": 10})
    assert r["gdd"] == 10.0
    assert r["capped"] is False


def test_gdd_clamped():
    assert compute_gdd({"tMax": 12, "tMin": 8, "tBase": 15})["gdd"] == 0.0


def test_gdd_cap():
    r = compute_gdd({"tMax": 40, "tMin": 20, "tBase": 10, "tCap": 30})
    assert r["capped"] is True
    assert r["gdd"] == 15.0


def test_gdd_invalid():
    assert validate_gdd_input({"tMax": 5, "tMin": 10, "tBase": 0})
    with pytest.raises(ValueError):
        compute_gdd({"tMax": 5, "tMin": 10, "tBase": 0})


def test_accumulate():
    total = accumulate_gdd([
        {"tMax": 30, "tMin": 10, "tBase": 10},
        {"tMax": 20, "tMin": 10, "tBase": 10},
    ])
    assert total == 15.0