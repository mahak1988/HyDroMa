"""WMO drought index tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.drought_wmo import (
    compute_spi_gamma,
    compute_z_index,
    compute_scpdsi,
    regularized_gamma_p,
    drought_wmo_adapter,
    validate_spi_gamma_input,
)


def test_gamma_p_known():
    # P(1, x) = 1 - e^-x
    assert abs(regularized_gamma_p(1.0, 1.0) - (1 - 2.718281828 ** -1)) < 1e-6
    assert regularized_gamma_p(2.0, 0.0) == 0.0


def test_spi_gamma_finite():
    r = compute_spi_gamma({"series": [10, 20, 30, 5, 0, 40, 15, 25]})
    assert r["ok"] is True
    assert r["result"]["method"].startswith("gamma-fit SPI")
    for v in r["result"]["values"]:
        assert v["spi"] == v["spi"]  # not NaN


def test_spi_gamma_all_zero():
    r = compute_spi_gamma({"series": [0, 0, 0]})
    assert r["result"]["undefined"] is True


def test_spi_gamma_invalid():
    assert validate_spi_gamma_input({"series": [1]})["valid"] is False
    r = compute_spi_gamma({"series": [1, -2, 3]})
    assert r["ok"] is False


def test_z_index_sign():
    r = compute_z_index({"precipitation_series": [100, 10, 50],
                         "pet_series": [50, 50, 50]})
    assert r["ok"] is True
    # first is wet (positive), second dry (negative)
    assert r["result"]["values"][0]["z"] > 0
    assert r["result"]["values"][1]["z"] < 0


def test_z_index_mismatch():
    r = compute_z_index({"precipitation_series": [1, 2], "pet_series": [1]})
    assert r["ok"] is False


def test_scpdsi_dry_vs_wet():
    dry = compute_scpdsi({"precipitation_series": [1, 1, 1, 1, 1, 1],
                          "pet_series": [10, 10, 10, 10, 10, 10], "awc_mm": 100})
    wet = compute_scpdsi({"precipitation_series": [30, 30, 30, 30, 30, 30],
                          "pet_series": [10, 10, 10, 10, 10, 10], "awc_mm": 100})
    assert dry["result"]["final_pdsi"] < wet["result"]["final_pdsi"]


def test_scpdsi_invalid():
    r = compute_scpdsi({"precipitation_series": [1, 2, 3],
                        "pet_series": [1, 2, 3], "awc_mm": 0})
    assert r["ok"] is False


def test_adapter_dispatch():
    assert drought_wmo_adapter({"method": "z_index",
                                "precipitation_series": [1, 2, 3],
                                "pet_series": [1, 1, 1]})["result"]["method"].startswith("Z-index")
    assert drought_wmo_adapter({"method": "spi_gamma", "series": [1, 2, 3, 4]})["ok"] is True