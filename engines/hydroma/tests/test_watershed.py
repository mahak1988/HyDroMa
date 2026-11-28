"""Watershed (PRMS-lite + SPARROW-lite) tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.watershed import compute_prms_lite, compute_sparrow_lite, watershed_adapter


def test_prms_runoff():
    # cap 10; P=30 -> runoff 20, infil 10; baseflow k=0.5 on subsurface(0)=0
    r = compute_prms_lite({"infil_capacity_mm": 10, "baseflow_k": 0.5,
                           "steps": [{"precip_mm": 30, "pet_mm": 5}]})
    assert r["ok"] is True
    assert r["result"]["total_runoff_mm"] == 20.0
    assert r["result"]["track"][0]["subsurface_mm"] == 10.0


def test_prms_baseflow_next_day():
    r = compute_prms_lite({"infil_capacity_mm": 10, "baseflow_k": 0.5,
                           "steps": [{"precip_mm": 30, "pet_mm": 0},
                                     {"precip_mm": 0, "pet_mm": 0}]})
    # day2 baseflow = 0.5 * 10 = 5
    assert r["result"]["track"][1]["baseflow_mm"] == 5.0


def test_prms_invalid_k():
    r = compute_prms_lite({"infil_capacity_mm": 10, "baseflow_k": 2.0, "steps": [{}]})
    assert r["ok"] is False


def test_sparrow():
    r = compute_sparrow_lite({"sources": [100, 200, 300], "decay_fraction": 0.25})
    assert r["ok"] is True
    assert r["result"]["total_load_kg"] == 600.0
    assert abs(r["result"]["delivered_load_kg"] - 450.0) < 1e-9


def test_sparrow_invalid():
    r = compute_sparrow_lite({"sources": [100], "decay_fraction": 1.5})
    assert r["ok"] is False


def test_adapter():
    assert watershed_adapter({"method": "prms", "infil_capacity_mm": 5, "baseflow_k": 0.1,
                              "steps": [{"precip_mm": 10}]})["ok"] is True
    assert watershed_adapter({"method": "sparrow", "sources": [1, 2], "decay_fraction": 0.1})["ok"] is True