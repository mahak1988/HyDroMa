"""Groundwater balance tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.groundwater import compute_groundwater_balance, validate_groundwater_input


def test_rising():
    r = compute_groundwater_balance({
        "initial_storage_mm": 100, "recharge_mm": 30, "discharge_mm": 10,
        "pumping_mm": 5})
    assert r["ok"] is True
    assert r["result"]["storage_change_mm"] == 15.0
    assert r["result"]["final_storage_mm"] == 115.0
    assert r["result"]["status"] == "rising"
    assert r["result"]["out_of_domain"] is False


def test_falling():
    r = compute_groundwater_balance({
        "initial_storage_mm": 100, "recharge_mm": 5, "discharge_mm": 10,
        "pumping_mm": 5})
    assert r["result"]["storage_change_mm"] == -10.0
    assert r["result"]["status"] == "falling"


def test_depleted_not_clamped():
    r = compute_groundwater_balance({
        "initial_storage_mm": 5, "recharge_mm": 0, "discharge_mm": 10,
        "pumping_mm": 0})
    assert r["result"]["final_storage_mm"] == -5.0
    assert r["result"]["out_of_domain"] is True
    assert r["result"]["status"] == "depleted"


def test_lateral_flows():
    r = compute_groundwater_balance({
        "initial_storage_mm": 100, "recharge_mm": 10, "discharge_mm": 10,
        "pumping_mm": 0, "lateral_in_mm": 20, "lateral_out_mm": 5})
    # inflow = 30, outflow = 15 -> ds = 15
    assert r["result"]["storage_change_mm"] == 15.0


def test_balanced():
    r = compute_groundwater_balance({
        "initial_storage_mm": 100, "recharge_mm": 10, "discharge_mm": 10,
        "pumping_mm": 0})
    assert r["result"]["storage_change_mm"] == 0.0
    assert r["result"]["status"] == "balanced"


def test_negative_input():
    r = compute_groundwater_balance({
        "initial_storage_mm": 100, "recharge_mm": -5, "discharge_mm": 10,
        "pumping_mm": 0})
    assert r["ok"] is False


def test_missing_input():
    assert validate_groundwater_input({"initial_storage_mm": 100})["valid"] is False


def test_invalid_period():
    r = compute_groundwater_balance({
        "initial_storage_mm": 100, "recharge_mm": 10, "discharge_mm": 10,
        "pumping_mm": 0, "period": "week"})
    assert r["ok"] is False