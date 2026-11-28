"""Drought index tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.drought import (
    compute_drought_index,
    validate_drought_input,
    inverse_normal_cdf,
)


def test_inverse_normal_known_values():
    assert abs(inverse_normal_cdf(0.5)) < 1e-9
    assert abs(inverse_normal_cdf(0.975) - 1.959964) < 1e-4
    assert abs(inverse_normal_cdf(0.025) + 1.959964) < 1e-4


def test_inverse_normal_domain():
    with pytest.raises(ValueError):
        inverse_normal_cdf(0.0)
    with pytest.raises(ValueError):
        inverse_normal_cdf(1.0)


def test_spi_basic():
    r = compute_drought_index({"mode": "SPI", "series": [10, 20, 30, 40, 50]})
    assert r["ok"] is True
    assert r["result"]["mode"] == "SPI"
    assert r["result"]["count"] == 5
    vals = [v["index_value"] for v in r["result"]["values"]]
    # standardized: min negative, max positive, roughly symmetric
    assert min(vals) < 0 < max(vals)


def test_spei_uses_series():
    r = compute_drought_index({"mode": "SPEI", "series": [-50, -20, 0, 20, 50]})
    assert r["ok"] is True
    assert r["result"]["mode"] == "SPEI"


def test_classification_labels():
    r = compute_drought_index({"series": [1, 2, 3, 4, 100]})
    valid = {"extremely_wet", "very_wet", "moderately_wet", "near_normal",
             "moderately_dry", "severely_dry", "extremely_dry"}
    labels = {v["class"] for v in r["result"]["values"]}
    assert labels.issubset(valid)
    assert "near_normal" in labels


def test_invalid_mode():
    r = compute_drought_index({"mode": "XXX", "series": [1, 2, 3]})
    assert r["ok"] is False


def test_short_series():
    assert validate_drought_input({"series": [1]})["valid"] is False
    r = compute_drought_index({"series": [1]})
    assert r["ok"] is False


def test_deterministic():
    a = compute_drought_index({"series": [5, 3, 8, 1, 9, 2]})
    b = compute_drought_index({"series": [5, 3, 8, 1, 9, 2]})
    assert a["result"]["values"] == b["result"]["values"]