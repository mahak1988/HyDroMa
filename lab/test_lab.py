"""Pytest wrapper for the controlled lab (run: pytest lab/test_lab.py)."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from harness import run_all  # noqa: E402


def test_lab_pass():
    r = run_all()
    assert r["passed"], r["failures"]


def test_all_models_ok_in_all_pilots():
    r = run_all()
    for pid in r["pilots"]:
        for m in r["battery"]:
            assert r["results"][pid][m]["ok"], f"{pid}/{m}: {r['results'][pid][m].get('error')}"


def test_cross_pilot_behaviour():
    r = run_all()
    res = r["results"]
    assert res["arid"]["low_flow_7q10"]["result"]["low_flow_7q10"] < \
           res["humid"]["low_flow_7q10"]["result"]["low_flow_7q10"]
    assert res["cold"]["crop_dssat"]["result"]["total_gdd"] < \
           res["arid"]["crop_dssat"]["result"]["total_gdd"]
    assert res["saline"]["crop_growth"]["result"]["total_biomass_g_m2"] < \
           res["semi_arid"]["crop_growth"]["result"]["total_biomass_g_m2"]
    assert res["arid"]["water_scarcity"]["result"]["scarcity_index"] > \
           res["humid"]["water_scarcity"]["result"]["scarcity_index"]