"""Calibration tests. Software checks only — NOT scientific validation."""

import math

import pytest

from hydroma.calibration import (
    nelder_mead,
    grid_search,
    objective_rmse,
    objective_nse,
    calibrate_generic,
    compute_calibration,
    validate_calibration_input,
)


def test_nelder_mead_quadratic():
    f = lambda p: (p[0] - 3.0) ** 2 + (p[1] + 1.0) ** 2
    x, fx, _ = nelder_mead(f, [0.0, 0.0])
    assert abs(x[0] - 3.0) < 1e-3
    assert abs(x[1] + 1.0) < 1e-3
    assert fx < 1e-4


def test_grid_search():
    f = lambda p: (p[0] - 2.0) ** 2
    x, fx = grid_search(f, [(-5.0, 5.0)], [21])
    assert abs(x[0] - 2.0) < 0.6


def test_objective_rmse():
    assert objective_rmse([1, 2, 3], [1, 2, 3]) == 0.0
    assert objective_rmse([0, 0], [3, 4]) == pytest.approx(3.5355339, rel=1e-4)


def test_objective_nse():
    assert objective_nse([1, 2, 3], [1, 2, 3]) == 1.0
    assert objective_nse([1, 1, 1], [1, 2, 3]) < 0.0


def test_calibrate_generic():
    f = lambda p: (p[0] - 1.5) ** 2
    r = calibrate_generic(f, [0.0], [(-5.0, 5.0)], [21])
    assert abs(r["params"][0] - 1.5) < 0.2


def test_compute_calibration_exp_decay():
    # synthetic y = 10 * exp(-0.5 x)
    xs = [i * 0.5 for i in range(11)]
    ys = [10.0 * math.exp(-0.5 * x) for x in xs]
    r = compute_calibration({"x": xs, "y_obs": ys,
                             "a_bounds": [0.0, 50.0], "k_bounds": [0.0, 2.0]})
    assert r["ok"] is True
    assert r["result"]["rmse"] < 0.5
    assert abs(r["result"]["a"] - 10.0) < 2.0
    assert abs(r["result"]["k"] - 0.5) < 0.2
    assert r["result"]["nse"] > 0.9


def test_calibration_invalid():
    assert validate_calibration_input({"x": [1], "y_obs": [1]})["valid"] is False
    r = compute_calibration({"x": [1, 2], "y_obs": [1, 2]})
    assert r["ok"] is False