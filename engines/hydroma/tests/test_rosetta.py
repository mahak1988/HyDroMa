"""Rosetta-lite pedotransfer tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.rosetta import compute_rosetta, validate_rosetta_input


def test_rosetta_clay_gt_sand():
    sand = compute_rosetta({"sand_pct": 80, "silt_pct": 10, "clay_pct": 10, "organic_matter_pct": 1})
    clay = compute_rosetta({"sand_pct": 20, "silt_pct": 20, "clay_pct": 60, "organic_matter_pct": 1})
    assert clay["result"]["theta_fc_vol"] > sand["result"]["theta_fc_vol"]
    assert sand["result"]["theta_wp_vol"] < sand["result"]["theta_fc_vol"]
    assert clay["result"]["theta_wp_vol"] < clay["result"]["theta_fc_vol"]
    assert sand["result"]["awc_vol"] >= 0


def test_rosetta_invalid_sum():
    r = compute_rosetta({"sand_pct": 60, "silt_pct": 60, "clay_pct": 60, "organic_matter_pct": 1})
    assert r["ok"] is False


def test_rosetta_range():
    r = compute_rosetta({"sand_pct": 40, "silt_pct": 40, "clay_pct": 20, "organic_matter_pct": 2})
    assert 0.0 < r["result"]["theta_fc_vol"] < 1.0
    assert 0.0 < r["result"]["theta_wp_vol"] < 1.0