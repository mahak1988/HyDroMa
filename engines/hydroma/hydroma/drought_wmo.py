"""WMO-standard drought indices: gamma-fit SPI, Z-index, simplified scPDSI.

A bounded, deterministic, stdlib-only extension of ``hydroma.drought`` that adds
the operational formulations used by WMO / national meteorological services:

1. **Gamma-fit SPI** (McKee 1993; Thom 1966; WMO 2012). A two-parameter gamma
   distribution is fitted to a nonzero precipitation series by the method of
   moments (Thom approximation); the zero-month frequency is applied; the
   cumulative probability is transformed to the standard normal via the inverse
   normal CDF.

       A     = ln(mean) - mean(ln(x))                 (nonzero months)
       alpha = (1 + sqrt(1 + 4A/3)) / (4A)            (shape)
       beta  = mean / alpha                           (scale)
       H(x)  = q + (1-q) * P(alpha, x/beta)           (q = zero fraction)
       SPI   = Phi^-1(H(x))

   ``P(a,x)`` is the regularized lower incomplete gamma function.

2. **Z-index** - a simplified Palmer moisture anomaly: the standardized
   departure of the water balance ``D = P - PET`` over the series.

3. **Simplified scPDSI** - a self-calibrated Palmer-style index using a
   single effective soil layer, supplied PET, and Palmer α/β/γ/δ calibration
   over a calibration prefix. This is a **simplified** Palmer index, not the
   full two-layer NCDC scPDSI.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

from .drought import inverse_normal_cdf, _classify

__all__ = [
    "DROUGHT_WMO_MODEL",
    "DROUGHT_WMO_DEFINITION",
    "regularized_gamma_p",
    "compute_spi_gamma",
    "compute_z_index",
    "compute_scpdsi",
    "drought_wmo_adapter",
    "validate_spi_gamma_input",
]

ROUND_DECIMALS = 4

DROUGHT_WMO_MODEL = {
    "id": "eco-nojin.hydroma.drought-wmo",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "SPI=Phi^-1(q+(1-q)P(alpha,x/beta)); Z=(D-meanD)/stdD",
    "units": {"precip": "mm", "index": "dimensionless"},
    "method": "Gamma-fit SPI + Z-index + simplified scPDSI (WMO-style)",
}

ASSUMPTIONS = [
    "gamma_fit_method_of_moments",
    "zero_frequency_adjustment",
    "thom_approximation",
    "single_layer_scpdsi",
    "supplied_pet_series",
]
LIMITATIONS = [
    "notValidated",
    "scpdsi_simplified_not_ncdc",
    "no_seasonal_grouping",
    "single_layer_palmer",
]
REFERENCES = [
    "McKee, T.B., Doesken, N.J., Kleist, J. (1993). 8th Conf. Applied Climatology.",
    "Thom, H.C.S. (1966). Normal degree of drought. J. Appl. Meteor. 5.",
    "WMO (2012). Standardized Precipitation Index Guide. WMO-No.1090.",
    "Palmer, W.C. (1965). Meteorological drought. US Weather Bureau Research Paper 45.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def regularized_gamma_p(a: float, x: float) -> float:
    """Regularized lower incomplete gamma function P(a, x).

    Series expansion for ``x < a+1``, continued fraction otherwise
    (Numerical Recipes gammp/gammq). Returns a value in [0, 1].
    """
    if a <= 0 or x < 0:
        raise ValueError("a > 0 and x >= 0 required")
    if x == 0.0:
        return 0.0
    gln = math.lgamma(a)
    if x < a + 1.0:
        ap = a
        summ = 1.0 / a
        delta = summ
        for _ in range(10000):
            ap += 1.0
            delta *= x / ap
            summ += delta
            if abs(delta) < abs(summ) * 1e-15:
                break
        return summ * math.exp(-x + a * math.log(x) - gln)
    # continued fraction for Q, P = 1 - Q
    tiny = 1e-30
    b = x + 1.0 - a
    c = 1.0 / tiny
    d = 1.0 / b
    h = d
    for i in range(1, 10000):
        an = -i * (i - a)
        b += 2.0
        d = an * d + b
        if abs(d) < tiny:
            d = tiny
        c = b + an / c
        if abs(c) < tiny:
            c = tiny
        d = 1.0 / d
        delta = d * c
        h *= delta
        if abs(delta - 1.0) < 1e-15:
            break
    q = math.exp(-x + a * math.log(x) - gln) * h
    return 1.0 - q


def validate_spi_gamma_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    series = input.get("series")
    if not isinstance(series, list) or len(series) < 2:
        errors.append({"field": "series", "code": "INVALID_SERIES"})
    else:
        for i, v in enumerate(series):
            if not _finite(v) or float(v) < 0:
                errors.append({"field": f"series[{i}]", "code": "INVALID_PRECIP"})
                break
    return {"valid": len(errors) == 0, "errors": errors}


def compute_spi_gamma(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_spi_gamma_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": DROUGHT_WMO_MODEL, "errors": validation["errors"]}

    series = [float(v) for v in input["series"]]
    n = len(series)
    zeros = sum(1 for v in series if v == 0.0)
    q = zeros / n
    nonzero = [v for v in series if v > 0.0]

    if not nonzero:
        # all-zero series: SPI undefined; report as such (no silent value).
        return {"ok": True, "model": DROUGHT_WMO_MODEL,
                "result": {"method": "gamma-fit SPI", "count": n,
                           "undefined": True, "reason": "all_zero_series"}}

    mean = sum(nonzero) / len(nonzero)
    log_mean = sum(math.log(v) for v in nonzero) / len(nonzero)
    A = math.log(mean) - log_mean
    if A > 0.0:
        alpha = (1.0 + math.sqrt(1.0 + 4.0 * A / 3.0)) / (4.0 * A)
    else:
        alpha = 1.0e6  # near-uniform limit
    beta = mean / alpha

    values = []
    for i, x in enumerate(series):
        if x == 0.0:
            h = q
        else:
            p = regularized_gamma_p(alpha, x / beta)
            h = q + (1.0 - q) * p
        h = min(max(h, 1e-9), 1.0 - 1e-9)
        spi = inverse_normal_cdf(h)
        values.append({"index": i, "value": _round(x),
                       "prob": _round(h), "spi": _round(spi),
                       "class": _classify(spi)})

    return {
        "ok": True,
        "model": DROUGHT_WMO_MODEL,
        "inputs": {"count": n, "zeros": zeros},
        "result": {
            "method": "gamma-fit SPI (Thom 1966)",
            "alpha": _round(alpha), "beta": _round(beta),
            "zero_fraction": _round(q), "count": n,
            "values": values,
        },
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


def compute_z_index(input: dict | None = None) -> dict:
    """Simplified Palmer Z-index: standardized (P - PET) departure."""
    input = input or {}
    p_series = input.get("precipitation_series")
    pet_series = input.get("pet_series")
    errors = []
    if not isinstance(p_series, list) or not isinstance(pet_series, list):
        errors.append({"field": "series", "code": "INVALID_SERIES"})
    elif len(p_series) != len(pet_series) or len(p_series) < 2:
        errors.append({"field": "series", "code": "LENGTH_MISMATCH"})
    else:
        for i in range(len(p_series)):
            if not _finite(p_series[i]) or not _finite(pet_series[i]):
                errors.append({"field": f"series[{i}]", "code": "NON_FINITE"})
                break
    if errors:
        return {"ok": False, "model": DROUGHT_WMO_MODEL, "errors": errors}

    d = [float(p_series[i]) - float(pet_series[i]) for i in range(len(p_series))]
    mean_d = sum(d) / len(d)
    var = sum((x - mean_d) ** 2 for x in d) / len(d)
    std = math.sqrt(var)
    values = []
    for i, di in enumerate(d):
        z = (di - mean_d) / std if std > 0 else 0.0
        values.append({"index": i, "d": _round(di), "z": _round(z)})
    return {
        "ok": True, "model": DROUGHT_WMO_MODEL,
        "result": {"method": "Z-index (simplified Palmer anomaly)",
                   "mean_d": _round(mean_d), "std_d": _round(std),
                   "count": len(d), "values": values},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_scpdsi(input: dict | None = None) -> dict:
    """Simplified self-calibrated Palmer drought index.

    Single effective soil layer of total available water capacity ``awc_mm``.
    Supplied PET series. Palmer alpha/beta/gamma/delta are calibrated over the
    first ``calibration_days`` entries; the index is then propagated with the
    standard duration recursion ``X_i = Z_i + c * X_{i-1}`` (c = 0.897).
    """
    input = input or {}
    p_series = input.get("precipitation_series")
    pet_series = input.get("pet_series")
    errors = []
    if not isinstance(p_series, list) or not isinstance(pet_series, list):
        errors.append({"field": "series", "code": "INVALID_SERIES"})
    elif len(p_series) != len(pet_series) or len(p_series) < 3:
        errors.append({"field": "series", "code": "LENGTH_MISMATCH"})
    else:
        for i in range(len(p_series)):
            if not _finite(p_series[i]) or not _finite(pet_series[i]) or float(pet_series[i]) < 0:
                errors.append({"field": f"series[{i}]", "code": "INVALID_VALUE"})
                break
    if not _finite(input.get("awc_mm")) or float(input.get("awc_mm", 0)) <= 0:
        errors.append({"field": "awc_mm", "code": "INVALID_AWC"})
    if errors:
        return {"ok": False, "model": DROUGHT_WMO_MODEL, "errors": errors}

    p = [float(v) for v in p_series]
    pet = [float(v) for v in pet_series]
    awc = float(input["awc_mm"])
    n = len(p)
    cal = int(input.get("calibration_days", max(3, n // 2)))
    cal = max(3, min(cal, n))

    # Single-layer bucket; potential terms for calibration.
    def run(px, petx):
        s = awc / 2.0
        out = []
        for i in range(len(px)):
            pr, pe = px[i], petx[i]
            # actual ET limited by available water
            aet = min(pe, s + pr)
            s = s + pr - aet
            if s > awc:
                recharge = s - awc
                s = awc
            else:
                recharge = 0.0
            # potential recharge / runoff proxies
            pot_recharge = max(0.0, pr - pe)
            pot_runoff = 0.0
            d = pr - pe - recharge  # moisture departure proxy
            out.append({"aet": aet, "recharge": recharge, "d": d,
                        "pot_aet": pe, "pot_recharge": pot_recharge,
                        "pot_runoff": pot_runoff, "s": s})
        return out

    base = run(p, pet)
    # Calibration coefficients (ratios over calibration prefix).
    sum_pet = sum(base[i]["pot_aet"] for i in range(cal)) or 1e-9
    sum_aet = sum(base[i]["aet"] for i in range(cal))
    sum_pot_re = sum(base[i]["pot_recharge"] for i in range(cal)) or 1e-9
    sum_re = sum(base[i]["recharge"] for i in range(cal))
    alpha = sum_aet / sum_pet
    beta = sum_re / sum_pot_re
    gamma = 1.0
    delta = 1.0
    calib = {"alpha": alpha, "beta": beta, "gamma": gamma, "delta": delta}

    # Standardized departures -> Z.
    d = [base[i]["d"] * (alpha if base[i]["d"] < 0 else 1.0) for i in range(n)]
    mean_abs = sum(abs(x) for x in d) / n or 1e-9
    z = [di / mean_abs for di in d]

    c = 0.897
    x_prev = 0.0
    values = []
    for i in range(n):
        xi = z[i] + c * x_prev
        x_prev = xi
        values.append({"index": i, "z": _round(z[i]), "pdsi": _round(xi)})
    final = x_prev
    return {
        "ok": True, "model": DROUGHT_WMO_MODEL,
        "result": {"method": "simplified scPDSI (single layer)",
                   "calibration": {k: _round(v) for k, v in calib.items()},
                   "calibration_days": cal, "count": n,
                   "final_pdsi": _round(final), "values": values},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def drought_wmo_adapter(input: dict | None = None) -> dict:
    """Dispatch by ``method``: spi_gamma | z_index | scpdsi (default spi_gamma)."""
    input = input or {}
    method = input.get("method", "spi_gamma")
    if method == "z_index":
        return compute_z_index(input)
    if method == "scpdsi":
        return compute_scpdsi(input)
    return compute_spi_gamma(input)


DROUGHT_WMO_DEFINITION = {
    "id": DROUGHT_WMO_MODEL["id"],
    "version": DROUGHT_WMO_MODEL["version"],
    "domain": "drought",
    "title": "WMO drought indices (gamma-fit SPI, Z-index, simplified scPDSI)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm", "dimensionless"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "method", "kind": "string", "required": False,
         "description": "spi_gamma (default) | z_index | scpdsi"},
        {"name": "series", "kind": "array", "required": False, "description": "spi_gamma: precipitation"},
        {"name": "precipitation_series", "kind": "array", "required": False, "description": "z_index/scpdsi"},
        {"name": "pet_series", "kind": "array", "required": False, "description": "z_index/scpdsi"},
        {"name": "awc_mm", "kind": "number", "required": False, "description": "scpdsi: total available water capacity"},
        {"name": "calibration_days", "kind": "number", "required": False},
    ],
    "outputs": [
        {"name": "values", "kind": "array", "unit": "dimensionless"},
        {"name": "final_pdsi", "kind": "number", "unit": "dimensionless"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_drought_wmo.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}