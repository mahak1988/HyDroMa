"""Drought indices: a standardized, empirical SPI/SPEI-style index.

This is a bounded, deterministic, stdlib-only model. It computes a
**standardized anomaly index** from a reference series using an empirical
rank/plotting-position transform to the standard normal distribution.

Two modes:

* ``SPI`` - Standardized Precipitation Index (McKee et al. 1993): the input
  series is precipitation.
* ``SPEI`` - Standardized Precipitation-Evapotranspiration Index
  (Vicente-Serrano et al. 2010): the input series is the climatic water
  balance ``D = precipitation - reference_ET``.

Method (documented approximation, NOT the full gamma-fit SPI):

    p_i      = (rank_i - 0.44) / (n + 0.12)        # Hazen plotting position
    index_i  = Phi^-1(p_i)                          # inverse standard normal CDF

``Phi^-1`` is Acklam's rational approximation of the inverse normal CDF
(absolute error < 1.15e-9). This empirical transform is deterministic and
dependency-free; it is **not** the two-parameter gamma fit used by operational
SPI tools and must not be reported as such.

Classification (McKee 1993 thresholds) is reported per value.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "DROUGHT_MODEL",
    "DROUGHT_DEFINITION",
    "DROUGHT_MODES",
    "DROUGHT_CLASSES",
    "compute_drought_index",
    "validate_drought_input",
    "inverse_normal_cdf",
]

ROUND_DECIMALS = 4
DROUGHT_MODES = ("SPI", "SPEI")

# McKee et al. (1993) classification by index value (upper bound, label).
DROUGHT_CLASSES = [
    (2.0, "extremely_wet"),
    (1.5, "very_wet"),
    (1.0, "moderately_wet"),
    (-1.0, "near_normal"),
    (-1.5, "moderately_dry"),
    (-2.0, "severely_dry"),
    (float("-inf"), "extremely_dry"),
]

DROUGHT_MODEL = {
    "id": "eco-nojin.hydroma.drought-index",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "index_i = Phi^-1((rank_i - 0.44)/(n + 0.12))",
    "units": {"series": "mm", "index": "dimensionless"},
    "method": "Empirical standardized index (SPI/SPEI-style)",
}

ASSUMPTIONS = [
    "empirical_plotting_position_transform",
    "not_gamma_fit_spi",
    "series_is_reference_period",
    "spi_uses_precipitation_spei_uses_water_balance",
]
LIMITATIONS = [
    "notValidated",
    "notGammaFitSPI",
    "empiricalApproximation",
    "noSeasonalGrouping",
    "noAutocorrelationCorrection",
]
REFERENCES = [
    "McKee, T.B., Doesken, N.J., Kleist, J. (1993). The relationship of drought frequency and duration to time scales. 8th Conf. Applied Climatology.",
    "Vicente-Serrano, S.M., Begueria, S., Lopez-Moreno, J.I. (2010). A multiscalar drought index sensitive to global warming: SPEI. J. Climate 23.",
    "Abramowitz, M., Stegun, I.A. (1964). Handbook of Mathematical Functions. NBS.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def inverse_normal_cdf(p: float) -> float:
    """Acklam's approximation of the inverse standard-normal CDF.

    Domain ``0 < p < 1``. Raises ``ValueError`` outside that open interval.
    """
    if not _finite(p) or not (0.0 < float(p) < 1.0):
        raise ValueError("p must be in (0, 1)")
    p = float(p)
    a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
         1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
    b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
         6.680131188771972e+01, -1.328068155288572e+01]
    c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
         -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
    d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
         3.754408661907416e+00]
    plow = 0.02425
    phigh = 1 - plow
    if p < plow:
        q = math.sqrt(-2 * math.log(p))
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / \
               ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    if phigh < p:
        q = math.sqrt(-2 * math.log(1 - p))
        return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / \
                ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    q = p - 0.5
    r = q * q
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / \
           (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)


def _classify(value: float) -> str:
    if value >= 2.0:
        return "extremely_wet"
    if value >= 1.5:
        return "very_wet"
    if value >= 1.0:
        return "moderately_wet"
    if value > -1.0:
        return "near_normal"
    if value > -1.5:
        return "moderately_dry"
    if value > -2.0:
        return "severely_dry"
    return "extremely_dry"


def validate_drought_input(input: dict | None = None) -> dict:
    input = input or {}
    errors: list = []
    mode = input.get("mode", "SPI")
    if mode not in DROUGHT_MODES:
        errors.append({"field": "mode", "code": "INVALID_MODE",
                       "message": f"mode must be one of {DROUGHT_MODES}"})
    series = input.get("series")
    if not isinstance(series, list) or len(series) < 2:
        errors.append({"field": "series", "code": "INVALID_SERIES",
                       "message": "series must be a list of >= 2 finite numbers"})
    else:
        for i, v in enumerate(series):
            if not _finite(v):
                errors.append({"field": f"series[{i}]", "code": "NON_FINITE"})
                break
    return {"valid": len(errors) == 0, "errors": errors}


def compute_drought_index(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_drought_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": DROUGHT_MODEL, "errors": validation["errors"]}

    mode = input.get("mode", "SPI")
    series = [float(v) for v in input["series"]]
    n = len(series)

    # Average ranks (ties share the mean rank) -> Hazen plotting position.
    order = sorted(range(n), key=lambda i: series[i])
    ranks = [0.0] * n
    i = 0
    while i < n:
        j = i
        while j + 1 < n and series[order[j + 1]] == series[order[i]]:
            j += 1
        avg_rank = (i + j) / 2.0 + 1.0  # 1-based average rank
        for k in range(i, j + 1):
            ranks[order[k]] = avg_rank
        i = j + 1

    results = []
    for i in range(n):
        p = (ranks[i] - 0.44) / (n + 0.12)
        idx = inverse_normal_cdf(p)
        results.append({
            "index": i,
            "value": _round(series[i]),
            "rank": ranks[i],
            "index_value": _round(idx),
            "class": _classify(idx),
        })

    return {
        "ok": True,
        "model": DROUGHT_MODEL,
        "inputs": {"mode": mode, "n": n},
        "result": {
            "mode": mode,
            "count": n,
            "values": results,
            "min_index": _round(min(r["index_value"] for r in results)),
            "max_index": _round(max(r["index_value"] for r in results)),
            "method": "empirical standardized index (not gamma-fit SPI)",
        },
        "assumptions": ASSUMPTIONS,
        "limitations": LIMITATIONS,
        "references": REFERENCES,
    }


DROUGHT_DEFINITION = {
    "id": DROUGHT_MODEL["id"],
    "version": DROUGHT_MODEL["version"],
    "domain": "drought",
    "title": "Standardized drought index (SPI/SPEI-style, empirical)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm", "dimensionless"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "series", "kind": "array", "required": True,
         "description": "reference series: precipitation (SPI) or P-ET0 (SPEI), mm"},
        {"name": "mode", "kind": "string", "required": False,
         "description": "SPI (default) or SPEI"},
    ],
    "outputs": [
        {"name": "values", "kind": "array", "unit": "dimensionless"},
        {"name": "min_index", "kind": "number", "unit": "dimensionless"},
        {"name": "max_index", "kind": "number", "unit": "dimensionless"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_drought.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}