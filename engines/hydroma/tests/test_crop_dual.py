"""Dual-Kc & AquaCrop-lite tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.crop_dual import (
    compute_dual_crop_etc,
    compute_aquacrop_lite,
    validate_dual_crop_input,
    validate_aquacrop_input,
)


def test_dual_single_kc_fallback():
    # No De -> Ke = 0 -> ETc = Ks*Kcb*ET0
    r = compute_dual_crop_etc({"et0_mm": 5, "kcb": 0.8, "ks": 1.0})
    assert r["ok"] is True
    assert abs(r["result"]["etc_mm"] - 4.0) < 1e-9
    assert r["result"]["etc_source"].startswith("single_kcb")


def test_dual_with_ke():
    r = compute_dual_crop_etc({"et0_mm": 5, "kcb": 0.8, "ks": 1.0,
                               "u2": 2, "rh_min": 45,
                               "de_mm": 5, "rew_mm": 8, "tew_mm": 20})
    assert r["result"]["ke"] > 0
    assert r["result"]["etc_mm"] > 4.0
    assert r["result"]["etc_source"] == "dual_kcb_ke"


def test_dual_stress_reduces():
    full = compute_dual_crop_etc({"et0_mm": 5, "kcb": 0.8, "ks": 1.0})
    stressed = compute_dual_crop_etc({"et0_mm": 5, "kcb": 0.8, "ks": 0.5})
    assert stressed["result"]["etc_mm"] < full["result"]["etc_mm"]


def test_dual_invalid():
    assert validate_dual_crop_input({"et0_mm": -1, "kcb": 0.8})["valid"] is False


def test_aquacrop():
    r = compute_aquacrop_lite({"transpiration_series": [2, 3, 5],
                               "wpb": 4.0, "harvest_index": 0.5})
    # total Tr = 10 mm; biomass = 40 g/m2; yield = 20 g/m2 = 0.2 t/ha
    assert abs(r["result"]["biomass_g_m2"] - 40.0) < 1e-9
    assert abs(r["result"]["yield_g_m2"] - 20.0) < 1e-9
    assert abs(r["result"]["yield_t_ha"] - 0.2) < 1e-9


def test_aquacrop_invalid():
    assert validate_aquacrop_input({"transpiration_series": [], "wpb": 1, "harvest_index": 0.5})["valid"] is False
    assert validate_aquacrop_input({"transpiration_series": [1], "wpb": 1, "harvest_index": 2.0})["valid"] is False