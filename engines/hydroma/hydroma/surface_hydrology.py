"""Surface hydrology: IHA, flow-duration curve, 7Q10 low flow, flood frequency.

Four bounded, deterministic, stdlib-only models (all require an ordered daily or
annual series; no interpolation, no infilling):

1. **IHA (simplified)** - Indicators of Hydrologic Alteration (Richter et al.
   1996) summary: central tendency, dispersion, exceedance percentiles, low/high
   pulse counts and zero-flow days. A documented subset of the full 33 parameters.

2. **Flow duration curve** - exceedance probability of ranked flows
   ``p = rank / (n + 1)``.

3. **7Q10** - the 10th percentile of the 7-day moving-average minima (the 7-day
   low flow with a 10-year return, a common regulatory low-flow statistic).

4. **Flood frequency** - Gumbel (method of moments) and Log-Pearson III
   (Wilson-Hilferty frequency factor) quantiles for given return periods.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

from .drought import inverse_normal_cdf

__all__ = [
    "SURFACE_HYDROLOGY_MODEL",
    "SURFACE_HYDROLOGY_DEFINITION",
    "compute_iha",
    "compute_flow_duration",
    "compute_low_flow_7q10",
    "compute_flood_frequency",
    "surface_hydrology_adapter",
    "validate_series_input",
]

ROUND_DECIMALS = 4

SURFACE_HYDROLOGY_MODEL = {
    "id": "eco-nojin.hydroma.surface-hydrology",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "FDC p=rank/(n+1); 7Q10=P10(7d-min); Gumbel/LogPearsonIII",
    "units": {"flow": "m3/s"},
    "method": "IHA + FDC + 7Q10 + flood frequency",
}

ASSUMPTIONS = [
    "ordered_series",
    "no_interpolation",
    "iha_subset",
    "gumbel_method_of_moments",
    "logpearson_wilson_hilferty",
]
LIMITATIONS = [
    "notValidated",
    "iha_not_full_33",
    "7q10_10th_percentile",
    "no_tietz",
    "stationary_series_assumed",
]
REFERENCES = [
    "Richter, B.D., et al. (1996). A spatial assessment of hydrologic alteration. Conservation Biology 10.",
    "USGS (1981). Guidelines for determining flood flow frequency. Bulletin 17B.",
    "Chow, V.T., Maidment, D.R., Mays, L.W. (1988). Applied Hydrology. McGraw-Hill.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _percentile(sorted_vals, p):
    """Linear-interpolation percentile, p in [0,100]."""
    n = len(sorted_vals)
    if n == 1:
        return sorted_vals[0]
    rank = (p / 100.0) * (n - 1)
    lo = int(math.floor(rank))
    hi = int(math.ceil(rank))
    if lo == hi:
        return sorted_vals[lo]
    frac = rank - lo
    return sorted_vals[lo] * (1 - frac) + sorted_vals[hi] * frac


def validate_series_input(input: dict | None = None, key: str = "series") -> dict:
    input = input or {}
    series = input.get(key)
    errors = []
    if not isinstance(series, list) or len(series) < 2:
        errors.append({"field": key, "code": "INVALID_SERIES"})
    else:
        for i, v in enumerate(series):
            if not _finite(v):
                errors.append({"field": f"{key}[{i}]", "code": "NON_FINITE"})
                break
    return {"valid": len(errors) == 0, "errors": errors}


def compute_iha(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_series_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": SURFACE_HYDROLOGY_MODEL, "errors": validation["errors"]}
    vals = [float(v) for v in input["series"]]
    n = len(vals)
    mean = sum(vals) / n
    var = sum((x - mean) ** 2 for x in vals) / n
    std = math.sqrt(var)
    s = sorted(vals)
    median = _percentile(s, 50)
    p25 = _percentile(s, 25)
    p75 = _percentile(s, 75)
    low_pulse = sum(1 for v in vals if v < p25)
    high_pulse = sum(1 for v in vals if v > p75)
    zero_days = sum(1 for v in vals if v == 0.0)
    reversals = sum(1 for i in range(1, n - 1)
                    if (vals[i] - vals[i - 1]) * (vals[i + 1] - vals[i]) < 0)
    return {
        "ok": True, "model": SURFACE_HYDROLOGY_MODEL,
        "result": {"method": "IHA (simplified subset)", "count": n,
                   "mean": _round(mean), "std": _round(std), "median": _round(median),
                   "p25": _round(p25), "p75": _round(p75),
                   "min": _round(min(vals)), "max": _round(max(vals)),
                   "low_pulse_days": low_pulse, "high_pulse_days": high_pulse,
                   "zero_flow_days": zero_days, "reversals": reversals},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_flow_duration(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_series_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": SURFACE_HYDROLOGY_MODEL, "errors": validation["errors"]}
    vals = sorted((float(v) for v in input["series"]), reverse=True)
    n = len(vals)
    curve = [{"rank": i + 1, "flow": _round(v),
              "exceedance_pct": _round(100.0 * (i + 1) / (n + 1))}
             for i, v in enumerate(vals)]
    return {
        "ok": True, "model": SURFACE_HYDROLOGY_MODEL,
        "result": {"method": "flow duration curve", "count": n, "curve": curve},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_low_flow_7q10(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_series_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": SURFACE_HYDROLOGY_MODEL, "errors": validation["errors"]}
    vals = [float(v) for v in input["series"]]
    n = len(vals)
    if n < 7:
        return {"ok": False, "model": SURFACE_HYDROLOGY_MODEL,
                "errors": [{"field": "series", "code": "TOO_SHORT",
                            "message": "need >= 7 values for 7-day minima"}]}
    minima = [sum(vals[i - 6:i + 1]) / 7.0 for i in range(6, n)]
    smin = sorted(minima)
    q10 = _percentile(smin, 10)
    return {
        "ok": True, "model": SURFACE_HYDROLOGY_MODEL,
        "result": {"method": "7Q10 (10th percentile of 7-day minima)",
                   "windows": len(minima), "low_flow_7q10": _round(q10),
                   "min_7day_avg": _round(min(minima))},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_flood_frequency(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_series_input(input, key="annual_maxima")
    if not validation["valid"]:
        return {"ok": False, "model": SURFACE_HYDROLOGY_MODEL, "errors": validation["errors"]}
    maxima = [float(v) for v in input["annual_maxima"]]
    for v in maxima:
        if v <= 0:
            return {"ok": False, "model": SURFACE_HYDROLOGY_MODEL,
                    "errors": [{"field": "annual_maxima", "code": "NONPOSITIVE",
                                "message": "log transform needs positive maxima"}]}
    return_periods = input.get("return_periods", [2, 5, 10, 25, 50, 100])
    n = len(maxima)
    mean = sum(maxima) / n
    std = math.sqrt(sum((x - mean) ** 2 for x in maxima) / n)

    # Gumbel (method of moments)
    alpha = std * math.sqrt(6.0) / math.pi if std > 0 else 0.0
    u = mean - 0.5772156649 * alpha
    gumbel = {}
    for T in return_periods:
        p = 1.0 - 1.0 / float(T)
        gumbel[str(T)] = _round(u - alpha * math.log(-math.log(p))) if alpha > 0 else _round(mean)

    # Log-Pearson III (Wilson-Hilferty frequency factor)
    logs = [math.log10(v) for v in maxima]
    lm = sum(logs) / n
    lstd = math.sqrt(sum((x - lm) ** 2 for x in logs) / n)
    m3 = sum((x - lm) ** 3 for x in logs) / n
    skew = m3 / (lstd ** 3) if lstd > 0 else 0.0
    logpi = {}
    for T in return_periods:
        p = 1.0 - 1.0 / float(T)
        z = inverse_normal_cdf(p)
        g = skew
        if abs(g) < 1e-6:
            k = z
        else:
            k = (2.0 / g) * ((1.0 + g * z / 6.0 - g * g / 36.0) ** 3 - 1.0)
        logpi[str(T)] = _round(10.0 ** (lm + k * lstd)) if lstd > 0 else _round(mean)

    return {
        "ok": True, "model": SURFACE_HYDROLOGY_MODEL,
        "result": {"method": "Gumbel + Log-Pearson III", "count": n,
                   "mean": _round(mean), "std": _round(std),
                   "log_skew": _round(skew),
                   "return_periods": [str(T) for T in return_periods],
                   "gumbel": gumbel, "log_pearson_iii": logpi},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def surface_hydrology_adapter(input: dict | None = None) -> dict:
    input = input or {}
    method = input.get("method", "iha")
    if method == "flow_duration":
        return compute_flow_duration(input)
    if method == "low_flow_7q10":
        return compute_low_flow_7q10(input)
    if method == "flood_frequency":
        return compute_flood_frequency(input)
    return compute_iha(input)


SURFACE_HYDROLOGY_DEFINITION = {
    "id": SURFACE_HYDROLOGY_MODEL["id"],
    "version": SURFACE_HYDROLOGY_MODEL["version"],
    "domain": "hydrology",
    "title": "Surface hydrology (IHA, FDC, 7Q10, flood frequency)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["m3/s"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "method", "kind": "string", "required": False,
         "description": "iha (default) | flow_duration | low_flow_7q10 | flood_frequency"},
        {"name": "series", "kind": "array", "required": False, "description": "daily flows (iha/fdc/7q10)"},
        {"name": "annual_maxima", "kind": "array", "required": False, "description": "flood frequency"},
        {"name": "return_periods", "kind": "array", "required": False},
    ],
    "outputs": [
        {"name": "low_flow_7q10", "kind": "number"},
        {"name": "gumbel", "kind": "object"},
        {"name": "log_pearson_iii", "kind": "object"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_surface_hydrology.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}