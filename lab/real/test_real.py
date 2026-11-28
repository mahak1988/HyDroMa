"""Pytest for the real-data lab. Uses cached real data; skips if absent (offline CI)."""

import json
import os
import sys

import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "..", "engines", "hydroma"))

CACHE = os.path.join(HERE, "data", "tehran_2023.json")


def test_real_data_simulation():
    if not os.path.exists(CACHE):
        pytest.skip("no cached real data (run lab/real/run_real.py online once)")
    daily = json.load(open(CACHE, encoding="utf-8"))["daily"]
    from simulate import simulate
    r = simulate(daily, 35.7)
    assert r["n_days"] == 365
    assert r["aridity"]["class"] in ("arid", "semi_arid", "dry_sub_humid")
    ev = r["evaluation_fao56_vs_hargreaves"]
    assert ev["nse"]["status"] == "OK" and ev["rmse"]["status"] == "OK"
    assert r["root_zone"]["final_storage_mm"] >= 0.0