"""Carbon & GHG tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.carbon import (
    compute_rothc_lite,
    compute_dndc_lite,
    compute_ipcc_mrv,
    compute_4per1000,
    carbon_adapter,
)


def test_rothc_decay():
    r = compute_rothc_lite({"initial_soc_t_ha": 100, "decay_k": 0.01,
                            "steps": [{"temp_c": 10, "moisture_scalar": 1.0, "input_t_ha": 0}]})
    assert r["ok"] is True
    # f=1 at 10C, decay = 0.01*100 = 1 -> final 99
    assert abs(r["result"]["final_soc_t_ha"] - 99.0) < 1e-6
    assert r["result"]["delta_soc_t_ha"] < 0


def test_rothc_input_offsets_decay():
    r = compute_rothc_lite({"initial_soc_t_ha": 100, "decay_k": 0.01,
                            "steps": [{"temp_c": 10, "moisture_scalar": 1.0, "input_t_ha": 2}]})
    # 100 + 2 - 1 = 101
    assert abs(r["result"]["final_soc_t_ha"] - 101.0) < 1e-6


def test_dndc():
    r = compute_dndc_lite({"n_input_kg_ha": 100, "emission_factor": 0.01,
                           "wfps": 0.65, "temp_c": 15})
    assert r["ok"] is True
    # f_wfps ~1 at 0.65, f_temp=1 at 15 -> n2o_n = 0.01*100 = 1 kg N2O-N
    assert r["result"]["n2o_kg_ha"] > 0


def test_ipcc_mrv():
    r = compute_ipcc_mrv({"soc_change_t_ha": -1.0, "n_input_kg_ha": 100, "emission_factor": 0.01})
    assert r["ok"] is True
    # soc loss 1 t C -> CO2 = 44/12 = 3.667 t; plus N2O
    assert r["result"]["co2_t_ha"] > 0
    assert r["result"]["co2e_t_ha"] > r["result"]["co2_t_ha"]


def test_4per1000():
    r = compute_4per1000({"soc_stock_t_ha": 1000, "actual_rate_pct": 0.2})
    assert r["ok"] is True
    # target delta = 4 t/ha/yr; actual 2 -> gap 2
    assert abs(r["result"]["target_delta_t_ha_yr"] - 4.0) < 1e-6
    assert r["result"]["target_met"] is False
    r2 = compute_4per1000({"soc_stock_t_ha": 1000, "actual_rate_pct": 0.5})
    assert r2["result"]["target_met"] is True


def test_invalid():
    r = compute_rothc_lite({"initial_soc_t_ha": -1, "decay_k": 0.01, "steps": [{}]})
    assert r["ok"] is False


def test_adapter():
    assert carbon_adapter({"method": "4per1000", "soc_stock_t_ha": 500})["ok"] is True
    assert carbon_adapter({"method": "dndc", "n_input_kg_ha": 10, "emission_factor": 0.01})["ok"] is True