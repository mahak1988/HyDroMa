"""Soil physics tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.soil_physics import (
    compute_rusle,
    compute_green_ampt,
    compute_pedotransfer,
    soil_physics_adapter,
    validate_rusle_input,
    _mccool_ls,
)


def test_rusle_supplied_ls():
    r = compute_rusle({"r_factor": 200, "k_factor": 0.03, "ls_factor": 1.5,
                       "c_factor": 0.2, "p_factor": 1.0})
    assert r["ok"] is True
    # 200 * 0.03 * 1.5 * 0.2 * 1.0 = 1.8
    assert abs(r["result"]["soil_loss_t_ha_yr"] - 1.8) < 1e-9
    assert r["result"]["ls_source"] == "supplied"


def test_rusle_mccool_ls():
    r = compute_rusle({"r_factor": 200, "k_factor": 0.03, "slope_pct": 3.0,
                       "slope_length_m": 30, "c_factor": 0.2, "p_factor": 1.0})
    assert r["result"]["ls_source"] == "mccool"
    assert r["result"]["ls_factor"] > 0
    # monotonic in slope
    r2 = compute_rusle({"r_factor": 200, "k_factor": 0.03, "slope_pct": 8.0,
                        "slope_length_m": 30, "c_factor": 0.2, "p_factor": 1.0})
    assert r2["result"]["ls_factor"] > r["result"]["ls_factor"]


def test_rusle_missing_ls():
    assert validate_rusle_input({"r_factor": 1, "k_factor": 1, "c_factor": 1, "p_factor": 1})["valid"] is False


def test_green_ampt_monotonic():
    r1 = compute_green_ampt({"ks_mm_per_h": 10, "psi_mm": 100, "dtheta": 0.3, "time_h": 1})
    r2 = compute_green_ampt({"ks_mm_per_h": 10, "psi_mm": 100, "dtheta": 0.3, "time_h": 2})
    assert r1["result"]["cumulative_infiltration_mm"] > 0
    assert r2["result"]["cumulative_infiltration_mm"] > r1["result"]["cumulative_infiltration_mm"]


def test_green_ampt_invalid():
    r = compute_green_ampt({"ks_mm_per_h": 0, "psi_mm": 100, "dtheta": 0.3, "time_h": 1})
    assert r["ok"] is False


def test_pedotransfer_order():
    # clayey soil has higher FC than sandy; wp < fc always
    sand = compute_pedotransfer({"sand_pct": 80, "clay_pct": 10, "organic_matter_pct": 1})
    clay = compute_pedotransfer({"sand_pct": 20, "clay_pct": 60, "organic_matter_pct": 1})
    assert clay["result"]["theta_fc_vol"] > sand["result"]["theta_fc_vol"]
    assert sand["result"]["theta_wp_vol"] < sand["result"]["theta_fc_vol"]
    assert clay["result"]["theta_wp_vol"] < clay["result"]["theta_fc_vol"]
    assert sand["result"]["awc_vol"] >= 0 and clay["result"]["awc_vol"] >= 0


def test_pedotransfer_invalid():
    r = compute_pedotransfer({"sand_pct": 90, "clay_pct": 50, "organic_matter_pct": 1})
    assert r["ok"] is False


def test_adapter():
    assert soil_physics_adapter({"method": "pedotransfer", "sand_pct": 40, "clay_pct": 30,
                                 "organic_matter_pct": 2})["ok"] is True
    assert soil_physics_adapter({"method": "green_ampt", "ks_mm_per_h": 5, "psi_mm": 50,
                                 "dtheta": 0.2, "time_h": 1})["ok"] is True