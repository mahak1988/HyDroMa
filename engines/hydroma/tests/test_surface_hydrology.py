"""Surface hydrology tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.surface_hydrology import (
    compute_iha,
    compute_flow_duration,
    compute_low_flow_7q10,
    compute_flood_frequency,
    surface_hydrology_adapter,
)


def test_iha_basic():
    r = compute_iha({"series": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]})
    assert r["ok"] is True
    assert r["result"]["mean"] == 5.5
    assert r["result"]["min"] == 1.0
    assert r["result"]["max"] == 10.0
    assert r["result"]["count"] == 10


def test_flow_duration():
    r = compute_flow_duration({"series": [10, 20, 30]})
    curve = r["result"]["curve"]
    # sorted descending, exceedance ascending
    assert curve[0]["flow"] == 30
    assert curve[0]["exceedance_pct"] < curve[-1]["exceedance_pct"]


def test_low_flow_7q10():
    r = compute_low_flow_7q10({"series": list(range(1, 15))})
    assert r["ok"] is True
    assert r["result"]["low_flow_7q10"] > 0


def test_low_flow_too_short():
    r = compute_low_flow_7q10({"series": [1, 2, 3]})
    assert r["ok"] is False


def test_flood_frequency():
    r = compute_flood_frequency({"annual_maxima": [100, 120, 90, 150, 110, 130],
                                 "return_periods": [2, 10, 100]})
    assert r["ok"] is True
    # larger return period -> larger flood
    assert r["result"]["gumbel"]["100"] > r["result"]["gumbel"]["2"]
    assert r["result"]["log_pearson_iii"]["100"] >= r["result"]["log_pearson_iii"]["2"] - 1e-6


def test_flood_frequency_nonpositive():
    r = compute_flood_frequency({"annual_maxima": [100, 0, 120]})
    assert r["ok"] is False


def test_adapter():
    assert surface_hydrology_adapter({"method": "flow_duration", "series": [1, 2, 3]})["ok"] is True
    assert surface_hydrology_adapter({"method": "flood_frequency", "annual_maxima": [10, 20, 30]})["ok"] is True