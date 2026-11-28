"""Groundwater MODFLOW-lite tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.groundwater_spatial import (
    compute_darcy_flow,
    compute_head_profile,
    compute_wtf_recharge,
    groundwater_spatial_adapter,
    validate_darcy_input,
    validate_wtf_input,
)


def test_darcy_basic():
    # Q = K*A*(h1-h2)/L = 1e-5 * 10 * (10-5)/100 = 5e-6
    r = compute_darcy_flow({"k_m_s": 1e-5, "area_m2": 10, "h1_m": 10, "h2_m": 5, "length_m": 100})
    assert r["ok"] is True
    assert abs(r["result"]["flow_m3_s"] - 5e-6) < 1e-12
    assert r["result"]["flow_direction"] == "h1_to_h2"


def test_darcy_reverse():
    r = compute_darcy_flow({"k_m_s": 1e-5, "area_m2": 10, "h1_m": 5, "h2_m": 10, "length_m": 100})
    assert r["result"]["flow_direction"] == "h2_to_h1"


def test_darcy_invalid():
    assert validate_darcy_input({"k_m_s": 1, "area_m2": 0, "h1_m": 1, "h2_m": 1, "length_m": 1})["valid"] is False


def test_head_profile_midpoint():
    # no recharge -> linear interpolation
    r = compute_head_profile({"k_m_s": 1e-5, "h1_m": 10, "h2_m": 20,
                              "length_m": 100, "recharge_m_s": 0.0, "x_m": 50})
    assert abs(r["result"]["head_m"] - 15.0) < 1e-9


def test_head_profile_with_recharge():
    # recharge raises the head above the linear baseline
    r = compute_head_profile({"k_m_s": 1e-5, "h1_m": 10, "h2_m": 10,
                              "length_m": 100, "recharge_m_s": 1e-8, "x_m": 50})
    assert r["result"]["head_m"] > 10.0


def test_head_profile_out_of_range():
    r = compute_head_profile({"k_m_s": 1e-5, "h1_m": 10, "h2_m": 20,
                              "length_m": 100, "recharge_m_s": 0.0, "x_m": 150})
    assert r["ok"] is False


def test_wtf_recharge():
    # R = Sy*dh/dt = 0.2*1/(86400) ; mm/day = 0.2*1/86400*1000*86400 = 200 mm/day
    r = compute_wtf_recharge({"specific_yield": 0.2, "dh_m": 1.0, "dt_s": 86400})
    assert r["ok"] is True
    assert abs(r["result"]["recharge_mm_day"] - 200.0) < 1e-6


def test_wtf_invalid_sy():
    assert validate_wtf_input({"specific_yield": 1.5, "dh_m": 1, "dt_s": 1})["valid"] is False


def test_adapter():
    assert groundwater_spatial_adapter({"method": "wtf_recharge", "specific_yield": 0.1,
                                        "dh_m": 0.5, "dt_s": 3600})["ok"] is True
    assert groundwater_spatial_adapter({"method": "head_profile", "k_m_s": 1e-5, "h1_m": 1,
                                        "h2_m": 2, "length_m": 10, "recharge_m_s": 0, "x_m": 5})["ok"] is True