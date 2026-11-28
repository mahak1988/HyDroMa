"""Drought composite tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.drought_composite import (
    compute_edo_composite,
    compute_pdsi_2layer,
    drought_composite_adapter,
)


def test_composite_basic():
    r = compute_edo_composite({"components": {"spi": -1.5, "sm": -1.0, "et0": 0.5}})
    assert r["ok"] is True
    # mean = (-1.5-1.0+0.5)/3 = -0.6667 -> near_normal
    assert abs(r["result"]["composite"] - (-0.6667)) < 1e-3


def test_composite_weighted():
    r = compute_edo_composite({"components": {"spi": -2.0, "sm": 0.0},
                               "weights": {"spi": 3.0, "sm": 1.0}})
    # (3*-2 + 0)/4 = -1.5 -> severely_dry boundary
    assert abs(r["result"]["composite"] - (-1.5)) < 1e-9


def test_composite_invalid():
    r = compute_edo_composite({"components": {}})
    assert r["ok"] is False


def test_pdsi_2layer_dry():
    r = compute_pdsi_2layer({"precipitation_series": [1, 1, 1, 1],
                             "pet_series": [10, 10, 10, 10],
                             "awc_surface_mm": 20, "awc_rootzone_mm": 100})
    assert r["ok"] is True
    assert r["result"]["final_pdsi"] < 0


def test_pdsi_2layer_invalid():
    r = compute_pdsi_2layer({"precipitation_series": [1, 2],
                             "pet_series": [1, 2],
                             "awc_surface_mm": 20, "awc_rootzone_mm": 100})
    assert r["ok"] is False


def test_adapter():
    assert drought_composite_adapter({"method": "composite", "components": {"spi": 1.0}})["ok"] is True
    assert drought_composite_adapter({"method": "pdsi2layer", "precipitation_series": [1, 2, 3],
                                      "pet_series": [1, 1, 1], "awc_surface_mm": 10,
                                      "awc_rootzone_mm": 50})["ok"] is True