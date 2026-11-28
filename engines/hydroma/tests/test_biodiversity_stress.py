"""Biodiversity & stress tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.biodiversity_stress import (
    compute_wbgt,
    compute_thi,
    compute_habitat_quality,
    compute_species_suitability,
    biodiversity_adapter,
)


def test_wbgt_indoor():
    # 0.7*20 + 0.3*25 = 14 + 7.5 = 21.5
    r = compute_wbgt({"tnwb_c": 20, "tg_c": 25, "indoor": True})
    assert abs(r["result"]["wbgt_c"] - 21.5) < 1e-9


def test_wbgt_outdoor():
    # 0.7*20 + 0.2*25 + 0.1*22 = 14 + 5 + 2.2 = 21.2
    r = compute_wbgt({"tnwb_c": 20, "tg_c": 25, "tdb_c": 22, "indoor": False})
    assert abs(r["result"]["wbgt_c"] - 21.2) < 1e-9


def test_wbgt_invalid():
    r = compute_wbgt({"tnwb_c": 20, "indoor": False})
    assert r["ok"] is False


def test_thi():
    # T=25, RH=50 -> (1.8*25+32) - (0.55-0.275)*(1.8*25-26)
    r = compute_thi({"t_c": 25, "rh_pct": 50})
    thi = (1.8 * 25 + 32) - (0.55 - 0.0055 * 50) * (1.8 * 25 - 26)
    assert abs(r["result"]["thi"] - thi) < 1e-6


def test_thi_invalid():
    r = compute_thi({"t_c": 25, "rh_pct": 150})
    assert r["ok"] is False


def test_habitat():
    r = compute_habitat_quality({"threats": [{"weight": 0.3, "sensitivity": 1.0},
                                             {"weight": 0.2, "sensitivity": 1.0}]})
    assert r["ok"] is True
    # degradation 0.5 -> quality 0.5
    assert abs(r["result"]["quality"] - 0.5) < 1e-9


def test_habitat_clamped():
    r = compute_habitat_quality({"threats": [{"weight": 1.5, "sensitivity": 1.0}]})
    assert r["result"]["quality"] == 0.0


def test_species_inside():
    r = compute_species_suitability({"variables": [
        {"value": 20, "min": 10, "max": 30},
        {"value": 50, "min": 0, "max": 100},
    ]})
    assert r["result"]["suitability"] == 1.0


def test_species_outside():
    r = compute_species_suitability({"variables": [
        {"value": 5, "min": 10, "max": 30},
        {"value": 50, "min": 0, "max": 100},
    ]})
    assert r["result"]["suitability"] == 0.0


def test_species_invalid():
    r = compute_species_suitability({"variables": [{"value": 1, "min": 10, "max": 5}]})
    assert r["ok"] is False


def test_adapter():
    assert biodiversity_adapter({"method": "thi", "t_c": 20, "rh_pct": 40})["ok"] is True
    assert biodiversity_adapter({"method": "habitat", "threats": []})["ok"] is True