"""SDG indicator tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.sdg_indicators import (
    compute_sdg_641,
    compute_sdg_241,
    compute_sdg_1531,
    sdg_adapter,
)


def test_sdg_641():
    r = compute_sdg_641({"economic_value_usd": 1000, "water_withdrawal_m3": 500})
    assert r["ok"] is True
    assert abs(r["result"]["water_use_efficiency_usd_m3"] - 2.0) < 1e-9


def test_sdg_641_invalid():
    r = compute_sdg_641({"economic_value_usd": 100, "water_withdrawal_m3": 0})
    assert r["ok"] is False


def test_sdg_241():
    r = compute_sdg_241({"sustainable_area_ha": 250, "total_area_ha": 1000})
    assert r["ok"] is True
    assert abs(r["result"]["share_pct"] - 25.0) < 1e-9


def test_sdg_1531():
    r = compute_sdg_1531({"degraded_area_ha": 100, "total_land_area_ha": 800})
    assert r["ok"] is True
    assert abs(r["result"]["degraded_share_pct"] - 12.5) < 1e-9


def test_sdg_invalid():
    r = compute_sdg_241({"sustainable_area_ha": 10, "total_area_ha": 0})
    assert r["ok"] is False


def test_adapter():
    assert sdg_adapter({"method": "6.4.1", "economic_value_usd": 1, "water_withdrawal_m3": 1})["ok"] is True
    assert sdg_adapter({"method": "2.4.1", "sustainable_area_ha": 1, "total_area_ha": 2})["ok"] is True
    assert sdg_adapter({"method": "15.3.1", "degraded_area_ha": 1, "total_land_area_ha": 2})["ok"] is True