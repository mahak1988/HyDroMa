"""Model calibration: derivative-free parameter estimation (stdlib-only).

Provides a small, deterministic calibration toolkit with **no third-party
dependency** (no scipy):

* ``nelder_mead`` - the Nelder-Mead simplex algorithm (1965).
* ``grid_search`` - exhaustive grid search over explicit bounds.
* ``objective_rmse`` / ``objective_nse`` - loss functions consistent with the
  Phase 3.26 evaluation metrics.
* ``calibrate_generic`` - refine a callable objective from an initial guess.
* ``compute_calibration`` - a registered model that fits an exponential-decay
  response ``y = a * exp(-k * x)`` to observations by grid search + Nelder-Mead.

Calibration **never** promotes a model's maturity or scientific status; it only
produces parameter estimates and an objective value with provenance. Calibration
and validation datasets must be kept distinct (see ``evaluation``).

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "CALIBRATION_MODEL",
    "CALIBRATION_DEFINITION",
    "nelder_mead",
    "grid_search",
    "objective_rmse",
    "objective_nse",
    "calibrate_generic",
    "compute_calibration",
    "validate_calibration_input",
]

ROUND_DECIMALS = 6

CALIBRATION_MODEL = {
    "id": "eco-nojin.hydroma.calibration",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "min loss(params); y=a*exp(-k*x)",
    "units": {"loss": "dimensionless"},
    "method": "Nelder-Mead + grid search (derivative-free)",
}

ASSUMPTIONS = [
    "derivative_free_optimization",
    "explicit_bounds",
    "calibration_validation_distinct",
    "deterministic",
]
LIMITATIONS = [
    "notValidated",
    "does_not_promote_maturity",
    "local_optimum_possible",
    "no_uncertainty_propagation",
]
REFERENCES = [
    "Nelder, J.A., Mead, R. (1965). A simplex method for function minimization. Computer Journal 7.",
    "Duan, Q., et al. (1992). Effective and efficient global optimization for conceptual rainfall-runoff models (SCE-UA). Water Resources Research 28.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def nelder_mead(func, x0, step=0.1, max_iter=500, tol=1e-8):
    """Minimize ``func`` from ``x0`` using the Nelder-Mead simplex method.

    Returns ``(best_x, best_f, iterations)``. ``func`` maps a list/tuple of
    floats to a float. Deterministic.
    """
    n = len(x0)
    if n == 0:
        raise ValueError("x0 must be non-empty")

    def clip(p):
        return list(p)

    simplex = [clip(x0)]
    for i in range(n):
        p = list(x0)
        delta = step if x0[i] == 0 else step * abs(x0[i])
        p[i] = p[i] + delta if delta != 0 else step
        simplex.append(p)

    fvals = [func(p) for p in simplex]
    for _ in range(max_iter):
        order = sorted(range(n + 1), key=lambda i: fvals[i])
        simplex = [simplex[i] for i in order]
        fvals = [fvals[i] for i in order]
        # convergence
        if abs(fvals[-1] - fvals[0]) <= tol:
            break
        centroid = [sum(simplex[i][j] for i in range(n)) / n for j in range(n)]
        worst = simplex[-1]
        # reflection
        xr = [centroid[j] + 1.0 * (centroid[j] - worst[j]) for j in range(n)]
        fr = func(xr)
        if fvals[0] <= fr < fvals[-2]:
            simplex[-1], fvals[-1] = xr, fr
            continue
        if fr < fvals[0]:
            xe = [centroid[j] + 2.0 * (xr[j] - centroid[j]) for j in range(n)]
            fe = func(xe)
            if fe < fr:
                simplex[-1], fvals[-1] = xe, fe
            else:
                simplex[-1], fvals[-1] = xr, fr
            continue
        # contraction
        xc = [centroid[j] + 0.5 * (worst[j] - centroid[j]) for j in range(n)]
        fc = func(xc)
        if fc < fvals[-1]:
            simplex[-1], fvals[-1] = xc, fc
            continue
        # shrink
        best = simplex[0]
        for i in range(1, n + 1):
            simplex[i] = [best[j] + 0.5 * (simplex[i][j] - best[j]) for j in range(n)]
            fvals[i] = func(simplex[i])
    best_i = min(range(n + 1), key=lambda i: fvals[i])
    return simplex[best_i], fvals[best_i], max_iter


def grid_search(func, bounds, steps):
    """Exhaustive grid search. ``bounds`` = [(lo, hi), ...]; ``steps`` = int per dim.

    Returns ``(best_x, best_f)``.
    """
    if len(bounds) != len(steps):
        raise ValueError("bounds and steps length mismatch")
    axes = []
    for (lo, hi), s in zip(bounds, steps):
        if s < 1 or hi < lo:
            raise ValueError("invalid bounds/steps")
        if s == 1:
            axes.append([lo])
        else:
            axes.append([lo + (hi - lo) * i / (s - 1) for i in range(s)])

    best_x = None
    best_f = float("inf")
    idx = [0] * len(axes)
    while True:
        x = [axes[d][idx[d]] for d in range(len(axes))]
        f = func(x)
        if f < best_f:
            best_f, best_x = f, x
        # increment
        d = len(axes) - 1
        while d >= 0:
            idx[d] += 1
            if idx[d] < len(axes[d]):
                break
            idx[d] = 0
            d -= 1
        if d < 0:
            break
    return best_x, best_f


def objective_rmse(pred, obs):
    """Root-mean-square error between paired prediction/observation lists."""
    if len(pred) != len(obs) or len(pred) == 0:
        raise ValueError("pred/obs length mismatch or empty")
    s = sum((float(p) - float(o)) ** 2 for p, o in zip(pred, obs))
    return math.sqrt(s / len(pred))


def objective_nse(pred, obs):
    """Nash-Sutcliffe efficiency (1 = perfect). Undefined -> +inf loss proxy."""
    if len(pred) != len(obs) or len(pred) == 0:
        raise ValueError("pred/obs length mismatch or empty")
    mean_o = sum(float(o) for o in obs) / len(obs)
    denom = sum((float(o) - mean_o) ** 2 for o in obs)
    if denom == 0:
        return float("inf")
    num = sum((float(o) - float(p)) ** 2 for p, o in zip(pred, obs))
    return 1.0 - num / denom


def calibrate_generic(func, x0, bounds, steps, max_iter=500):
    """Grid search then Nelder-Mead refine. Returns dict with params and loss."""
    gx, gf = grid_search(func, bounds, steps)
    bx, bf, iters = nelder_mead(func, gx, max_iter=max_iter)
    return {"params": [_round(v) for v in bx], "loss": _round(bf),
            "grid_params": [_round(v) for v in gx], "grid_loss": _round(gf),
            "iterations": iters}


def validate_calibration_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    x = input.get("x")
    y = input.get("y_obs")
    if not isinstance(x, list) or not isinstance(y, list) or len(x) != len(y) or len(x) < 3:
        errors.append({"field": "x/y_obs", "code": "INVALID"})
    else:
        for i in range(len(x)):
            if not _finite(x[i]) or not _finite(y[i]):
                errors.append({"field": f"series[{i}]", "code": "NON_FINITE"})
                break
    return {"valid": len(errors) == 0, "errors": errors}


def compute_calibration(input: dict | None = None) -> dict:
    """Fit ``y = a * exp(-k * x)`` to observations (grid + Nelder-Mead)."""
    input = input or {}
    validation = validate_calibration_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": CALIBRATION_MODEL, "errors": validation["errors"]}

    x = [float(v) for v in input["x"]]
    y = [float(v) for v in input["y_obs"]]

    def model(params):
        a, k = params
        return [a * math.exp(-k * xi) for xi in x]

    def loss(params):
        try:
            return objective_rmse(model(params), y)
        except (OverflowError, ValueError):
            return float("inf")

    a_bounds = input.get("a_bounds", [0.0, 1000.0])
    k_bounds = input.get("k_bounds", [0.0, 1.0])
    result = calibrate_generic(loss, [1.0, 0.1],
                               [list(a_bounds), list(k_bounds)], [21, 21])
    a, k = result["params"]
    pred = model([a, k])
    return {
        "ok": True, "model": CALIBRATION_MODEL,
        "result": {"method": "exponential decay fit (a*exp(-k*x))",
                   "a": a, "k": k, "rmse": _round(objective_rmse(pred, y)),
                   "nse": _round(objective_nse(pred, y)), "n": len(x),
                   "grid_params": result["grid_params"], "iterations": result["iterations"]},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


CALIBRATION_DEFINITION = {
    "id": CALIBRATION_MODEL["id"],
    "version": CALIBRATION_MODEL["version"],
    "domain": "simulation",
    "title": "Model calibration (Nelder-Mead + grid search)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["dimensionless"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "x", "kind": "array", "required": True},
        {"name": "y_obs", "kind": "array", "required": True},
        {"name": "a_bounds", "kind": "array", "required": False},
        {"name": "k_bounds", "kind": "array", "required": False},
    ],
    "outputs": [
        {"name": "a", "kind": "number"},
        {"name": "k", "kind": "number"},
        {"name": "rmse", "kind": "number"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_calibration.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}