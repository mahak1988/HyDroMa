"""Phase 3.21 root-zone water-stress model tests (software only; NOT validation).

Synthetic fixtures verify the arithmetic and state transitions; they are not
evidence of scientific validity.
"""

import json
import math

import pytest

from hydroma.water_stress import _ks, compute_stress_aware_series, compute_water_stress

# fc=90, wp=30, taw=60
LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]
FC, WP, TAW = 90.0, 30.0, 60.0


def _ws(S, et0=5.0, kc=0.8, p=0.5, P=0.0, I=0.0, RO=0.0, DP=0.0):
    return compute_water_stress({
        "layers": LAYERS, "initial_storage_mm": S, "et0_mm": et0, "kc": kc, "p": p,
        "precipitation_mm": P, "irrigation_mm": I, "runoff_mm": RO, "deep_percolation_mm": DP,
    })


# --- soil-water states -----------------------------------------------------

def test_no_stress_at_or_below_raw():
    r = _ws(60.0)["result"]  # dr = 30 = RAW
    assert r["ks"] == 1.0
    assert math.isclose(r["eta_mm"], r["etc_mm"], abs_tol=1e-9)
    assert r["status"] == "NO_STRESS"


def test_onset_of_stress():
    r = _ws(55.0)["result"]  # dr = 35 > RAW=30
    assert math.isclose(r["ks"], (TAW - 35.0) / (TAW - 30.0), abs_tol=1e-6)
    assert r["eta_mm"] < r["etc_mm"]
    assert r["status"] == "STRESSED"


def test_moderate_stress():
    r = _ws(45.0)["result"]  # dr = 45
    assert math.isclose(r["ks"], 0.5, abs_tol=1e-6)


def test_severe_stress():
    r = _ws(32.0)["result"]  # dr = 58
    assert math.isclose(r["ks"], (TAW - 58.0) / (TAW - 30.0), abs_tol=1e-6)
    assert r["ks"] < 0.1


def test_depletion_at_taw():
    r = _ws(30.0)["result"]  # dr = 60 = TAW
    assert r["ks"] == 0.0
    assert r["eta_mm"] == 0.0


def test_depletion_beyond_taw():
    r = _ws(25.0)["result"]  # dr = 65 > TAW
    assert r["ks"] == 0.0
    assert r["eta_mm"] == 0.0
    assert r["status"] == "BELOW_WILTING_POINT"
    assert r["below_wilting_point"] is True


def test_initial_at_field_capacity():
    r = _ws(90.0, P=5.0)["result"]  # dr = 0; P above FC drains
    assert r["ks"] == 1.0
    assert r["excess_mm"] > 0.0
    assert r["final_storage_mm"] == FC


def test_initial_at_wilting_point():
    r = _ws(30.0)["result"]
    assert r["ks"] == 0.0
    assert r["eta_mm"] == 0.0


def test_invalid_storage_rejected():
    r = _ws(-1.0)
    assert r["ok"] is False
    assert any(e["code"] == "INVALID_INITIAL" for e in r["errors"])


# --- computation / accounting ---------------------------------------------

def test_etc_is_kc_times_et0():
    r = _ws(60.0, et0=5.0, kc=0.8)["result"]
    assert math.isclose(r["etc_mm"], 4.0, abs_tol=1e-9)


def test_water_balance_closure():
    r = _ws(60.0, P=10.0, I=2.0, RO=1.0, DP=0.5)["result"]
    lhs = r["initial_storage_mm"] + r["precipitation_mm"] + r["irrigation_mm"] \
        - r["eta_mm"] - r["runoff_mm"] - r["deep_percolation_mm"] - r["excess_mm"]
    assert math.isclose(lhs, r["final_storage_mm"], abs_tol=1e-3)


def test_excess_above_fc_distinct_from_runoff_and_dp():
    r = _ws(85.0, P=20.0, RO=1.0, DP=0.0)["result"]
    assert r["excess_mm"] > 0.0
    assert r["runoff_mm"] == 1.0
    assert r["final_storage_mm"] == FC


def test_invalid_p_rejected():
    for bad in (0.0, -0.1, 1.5, None):
        r = _ws(60.0, p=bad)
        assert r["ok"] is False
        assert any(e["code"] == "INVALID_P" for e in r["errors"])


def test_out_of_domain_single_period():
    r = _ws(2.0, DP=5.0)  # deep percolation exceeds available water
    assert r["ok"] is True
    assert r["result"]["out_of_domain"] is True
    assert r["result"]["final_storage_mm"] < 0.0
    assert r["result"]["status"] == "OUT_OF_DOMAIN"


# --- sequential simulation -------------------------------------------------

def _periods(n, et0=5.0, kc=0.8, P=0.0, I=0.0, DP=0.0, start_day=1):
    out = []
    for i in range(n):
        d1 = f"2026-01-{start_day + i:02d}T00:00:00Z"
        d2 = f"2026-01-{start_day + i + 1:02d}T00:00:00Z"
        out.append({"period_start": d1, "period_end": d2, "et0_mm": et0, "kc": kc,
                    "precipitation_mm": P, "irrigation_mm": I, "deep_percolation_mm": DP})
    return out


def test_sequential_state_transfer():
    r = compute_stress_aware_series({"layers": LAYERS, "initial_storage_mm": 60.0, "p": 0.5,
                                     "periods": _periods(3)})
    assert r["ok"] is True
    steps = r["result"]["steps"]
    assert math.isclose(steps[1]["initial_storage_mm"], steps[0]["final_storage_mm"], abs_tol=1e-6)
    assert math.isclose(steps[2]["initial_storage_mm"], steps[1]["final_storage_mm"], abs_tol=1e-6)
    for s in steps:
        assert abs(s["algebraic_closure_residual_mm"]) < 1e-6


def test_sequential_increasing_depletion_reduces_ks():
    r = compute_stress_aware_series({"layers": LAYERS, "initial_storage_mm": 60.0, "p": 0.5,
                                     "periods": _periods(3)})
    ks = [s["ks"] for s in r["result"]["steps"]]
    assert ks[0] >= ks[1] >= ks[2]  # depletion grows -> Ks non-increasing


def test_sequential_rainfall_recovery():
    dry = compute_stress_aware_series({"layers": LAYERS, "initial_storage_mm": 40.0, "p": 0.5,
                                       "periods": _periods(1, P=0.0)})
    wet = compute_stress_aware_series({"layers": LAYERS, "initial_storage_mm": 40.0, "p": 0.5,
                                       "periods": _periods(1, P=30.0)})
    assert wet["result"]["final_storage_mm"] > dry["result"]["final_storage_mm"]


def test_sequential_irrigation_recovery():
    dry = compute_stress_aware_series({"layers": LAYERS, "initial_storage_mm": 40.0, "p": 0.5,
                                       "periods": _periods(1, I=0.0)})
    irr = compute_stress_aware_series({"layers": LAYERS, "initial_storage_mm": 40.0, "p": 0.5,
                                       "periods": _periods(1, I=20.0)})
    assert irr["result"]["final_storage_mm"] > dry["result"]["final_storage_mm"]


def test_sequential_stress_reduction_after_recovery():
    # period 0 stressed; period 1 receives rainfall; period 2 shows reduced stress
    # (Ks is computed from start-of-period storage, so recovery appears the next step)
    r = compute_stress_aware_series({"layers": LAYERS, "initial_storage_mm": 40.0, "p": 0.5,
                                     "periods": _periods(1, P=0.0, start_day=1)
                                     + _periods(1, P=40.0, start_day=2)
                                     + _periods(1, P=0.0, start_day=3)})
    ks = [s["ks"] for s in r["result"]["steps"]]
    assert ks[2] > ks[1]


def test_sequential_noncontiguous_rejected():
    periods = [
        {"period_start": "2026-01-01T00:00:00Z", "period_end": "2026-01-02T00:00:00Z", "et0_mm": 5.0, "kc": 0.8},
        {"period_start": "2026-01-03T00:00:00Z", "period_end": "2026-01-04T00:00:00Z", "et0_mm": 5.0, "kc": 0.8},
    ]
    r = compute_stress_aware_series({"layers": LAYERS, "initial_storage_mm": 60.0, "p": 0.5, "periods": periods})
    assert r["ok"] is False
    assert any(e.get("code") == "NONCONTIGUOUS" for e in r["errors"])


def test_sequential_out_of_domain_blocks():
    r = compute_stress_aware_series({"layers": LAYERS, "initial_storage_mm": 2.0, "p": 0.5,
                                     "periods": _periods(1, DP=5.0)})
    assert r["ok"] is False
    assert r["result"]["status"] == "OUT_OF_DOMAIN"
    assert any(e.get("code") == "OUT_OF_DOMAIN" for e in r["errors"])


def test_sequential_provenance_deterministic():
    a = compute_stress_aware_series({"layers": LAYERS, "initial_storage_mm": 60.0, "p": 0.5,
                                     "periods": _periods(2)})
    b = compute_stress_aware_series({"layers": LAYERS, "initial_storage_mm": 60.0, "p": 0.5,
                                     "periods": _periods(2)})
    assert a["provenance"]["result_hash"] == b["provenance"]["result_hash"]
    assert a["provenance"]["scenario"] == "STRESS_ADJUSTED_ET"
    assert a["provenance"]["scientific_status"] == "NOT_VALIDATED"


# --- Phase 3.21.1 depletion-fraction boundary ------------------------------

def test_p_one_rejected():
    r = _ws(60.0, p=1.0)
    assert r["ok"] is False
    assert any(e["code"] == "INVALID_P" for e in r["errors"])


def test_p_one_sequential_rejected():
    r = compute_stress_aware_series({"layers": LAYERS, "initial_storage_mm": 60.0, "p": 1.0,
                                     "periods": _periods(1)})
    assert r["ok"] is False
    assert any(e.get("code") == "INVALID_P" for e in r["errors"])


def test_p_just_below_one():
    p = 0.999
    # at the wilting point (dr = TAW) Ks must be 0
    assert _ws(30.0, p=p)["result"]["ks"] == 0.0
    # just inside the (very narrow) stress interval
    r = _ws(30.05, p=p)["result"]  # dr = 59.95, RAW = 59.94
    assert 0.0 < r["ks"] < 1.0
    # well above RAW -> no stress
    assert _ws(59.0, p=p)["result"]["ks"] == 1.0


def test_p_near_lower_bound():
    p = 0.001
    r = _ws(89.0, p=p)["result"]  # dr = 1, RAW = 0.06 -> strong stress
    assert 0.0 < r["ks"] < 1.0
    assert r["ks"] > 0.9  # close to 1 but below


def test_raw_boundary():
    r = _ws(60.0, p=0.5)["result"]  # dr = 30 = RAW
    assert r["ks"] == 1.0


def test_taw_wp_boundary():
    r = _ws(30.0, p=0.5)["result"]  # dr = 60 = TAW (wilting point)
    assert r["ks"] == 0.0
    assert r["eta_mm"] == 0.0
    assert r["status"] in ("STRESSED", "BELOW_WILTING_POINT")


def test_ks_bounded():
    for p in (0.001, 0.5, 0.999):
        for S in (0.0, 10.0, 30.0, 45.0, 60.0, 89.0):
            r = _ws(S, p=p)
            if r["ok"]:
                assert 0.0 <= r["result"]["ks"] <= 1.0


def test_p_out_of_domain_values_rejected():
    for bad in (0.0, -0.1, 1.0, 1.5):
        r = _ws(60.0, p=bad)
        assert r["ok"] is False
        assert any(e["code"] == "INVALID_P" for e in r["errors"])


# --- Phase 3.22 domain integrity -------------------------------------------

def test_zero_taw_rejected():
    zero_taw = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.30}]
    r = compute_water_stress({"layers": zero_taw, "initial_storage_mm": 60.0,
                              "et0_mm": 5.0, "kc": 0.8, "p": 0.5})
    assert r["ok"] is False
    assert any(e["code"] in ("THETA_FC_MUST_EXCEED_WP", "TAW_NONPOSITIVE") for e in r["errors"])


def test_near_zero_taw_flagged_not_failed():
    near_zero = [{"thickness_mm": 300, "theta_fc": 0.3000000001, "theta_wp": 0.30}]
    r = compute_water_stress({"layers": near_zero, "initial_storage_mm": 90.0,
                              "et0_mm": 5.0, "kc": 0.8, "p": 0.5})
    assert r["ok"] is True
    assert r["result"]["near_zero_taw"] is True
    assert 0.0 <= r["result"]["ks"] <= 1.0


def test_invalid_soil_rejected():
    cases = [
        [],  # empty
        [{"thickness_mm": 0, "theta_fc": 0.3, "theta_wp": 0.1}],  # bad thickness
        [{"thickness_mm": 300, "theta_fc": 0.1, "theta_wp": 0.3}],  # fc <= wp
        [{"thickness_mm": 300, "theta_fc": 1.5, "theta_wp": 0.1}],  # theta out of range
    ]
    for layers in cases:
        r = compute_water_stress({"layers": layers, "initial_storage_mm": 60.0,
                                  "et0_mm": 5.0, "kc": 0.8, "p": 0.5})
        assert r["ok"] is False, layers


def test_above_fc_drains_conservatively():
    r = _ws(95.0)["result"]  # S0=95 > FC=90, ETc=4
    assert r["above_field_capacity"] is True
    assert r["dr_above_fc"] is True
    assert r["excess_mm"] == 1.0
    assert r["final_storage_mm"] == FC
    # mass balance: 95 - 4 - 1 = 90
    assert math.isclose(r["initial_storage_mm"] - r["eta_mm"] - r["excess_mm"],
                        r["final_storage_mm"], abs_tol=1e-6)


def test_below_wp_no_stress():
    r = _ws(20.0)["result"]  # S0=20 < WP=30
    assert r["below_wilting_point"] is True
    assert r["dr_below_wp"] is True
    assert r["ks"] == 0.0
    assert r["eta_mm"] == 0.0
    assert r["final_storage_mm"] == 20.0


def test_ks_bounded_near_boundaries():
    for p in (0.001, 0.5, 0.999999):
        raw = p * TAW
        for dr in (raw - 1e-9, raw, raw + 1e-9, TAW - 1e-9, TAW, TAW + 1e-9):
            ks = _ks(dr, TAW, raw)
            assert 0.0 <= ks <= 1.0, (p, dr, ks)


def test_eta_never_exceeds_etc():
    for p in (0.001, 0.5, 0.999):
        for S in (0.0, 20.0, 30.0, 45.0, 60.0, 90.0):
            r = _ws(S, p=p)
            if r["ok"]:
                assert r["result"]["eta_mm"] <= r["result"]["etc_mm"] + 1e-9
                assert r["result"]["eta_exceeds_etc"] is False


def test_sequential_zero_taw_rejected():
    zero_taw = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.30}]
    r = compute_stress_aware_series({"layers": zero_taw, "initial_storage_mm": 60.0, "p": 0.5,
                                     "periods": _periods(1)})
    assert r["ok"] is False
    assert any(e.get("code") in ("THETA_FC_MUST_EXCEED_WP", "TAW_NONPOSITIVE") for e in r["errors"])