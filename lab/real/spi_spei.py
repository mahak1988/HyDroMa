"""SPI (gamma) & standardized water-balance anomaly (Z-score) — lab-only.

Method separation (per mission):
- SPI: gamma fit to POSITIVE precipitation (zeros handled via frequency q).
- Standardized water-balance anomaly (P - PET): Z-score standardization
  (X - mean)/std. Defined for NEGATIVE values (unlike a gamma fit), avoiding the
  gamma domain violation. This is NOT conventional SPEI (which fits a
  log-logistic / Pearson-III distribution and inverts the normal CDF); the name
  "SPEI" is intentionally NOT applied to this output.

Reference period: a record shorter than 30 years is flagged
INSUFFICIENT_CLIMATOLOGICAL_BASELINE (WMO-No.1090 guidance); results are then
exploratory, not operationally climatological.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List

__all__ = ["spi", "spei", "BASELINE_YEARS", "BASELINE_INSUFFICIENT"]

BASELINE_YEARS = 30
BASELINE_INSUFFICIENT = "INSUFFICIENT_CLIMATOLOGICAL_BASELINE"


def _gammainc_p(a: float, x: float) -> float:
    if x <= 0:
        return 0.0
    gln = math.lgamma(a)
    if x < a + 1.0:
        ap, summ, delta = a, 1.0 / a, 1.0 / a
        for _ in range(10000):
            ap += 1.0
            delta *= x / ap
            summ += delta
            if abs(delta) < abs(summ) * 1e-15:
                break
        return summ * math.exp(-x + a * math.log(x) - gln)
    tiny = 1e-30
    b, c, d, h = x + 1.0 - a, 1.0 / tiny, 1.0 / (x + 1.0 - a), 1.0 / (x + 1.0 - a)
    for i in range(1, 10000):
        an = -i * (i - a)
        b += 2.0
        d = an * d + b
        d = tiny if abs(d) < tiny else d
        c = b + an / c
        c = tiny if abs(c) < tiny else c
        d = 1.0 / d
        delta = d * c
        h *= delta
        if abs(delta - 1.0) < 1e-15:
            break
    return 1.0 - math.exp(-x + a * math.log(x) - gln) * h


def _inv_normal(p: float) -> float:
    p = min(max(p, 1e-9), 1.0 - 1e-9)
    a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
         1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0]
    b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
         6.680131188771972e1, -1.328068155288572e1]
    c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
         -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0]
    d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0, 3.754408661907416e0]
    if p < 0.02425:
        q = math.sqrt(-2 * math.log(p))
        return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    if p > 1 - 0.02425:
        q = math.sqrt(-2 * math.log(1 - p))
        return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    q = p - 0.5
    r = q * q
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)


def _baseline(n: int, per_year: int) -> Dict[str, Any]:
    years = n / per_year
    return {"years": round(years, 2), "required_years": BASELINE_YEARS,
            "status": BASELINE_INSUFFICIENT if years < BASELINE_YEARS else "SUFFICIENT"}


def spi(series: List[float], per_year: int = 12) -> Dict[str, Any]:
    if any(v < 0 for v in series):
        return {"ok": False, "error": "SPI requires non-negative precipitation"}
    n = len(series)
    nz = [v for v in series if v > 0]
    if not nz:
        return {"ok": True, "values": [], "baseline": _baseline(n, per_year)}
    mean = sum(nz) / len(nz)
    A = math.log(mean) - sum(math.log(v) for v in nz) / len(nz)
    alpha = (1 + math.sqrt(1 + 4 * A / 3)) / (4 * A) if A > 0 else 1e6
    beta = mean / alpha
    q = (n - len(nz)) / n
    vals = []
    for x in series:
        H = q if x == 0 else q + (1 - q) * _gammainc_p(alpha, x / beta)
        vals.append(round(_inv_normal(H), 4))
    return {"ok": True, "method": "gamma-fit SPI", "values": vals,
            "baseline": _baseline(n, per_year)}


def spei(balance: List[float], per_year: int = 12) -> Dict[str, Any]:
    """Standardized climatic water-balance anomaly (Z-score), NOT conventional SPEI.

    The function name ``spei`` is kept only for API/back-compat with existing lab
    callers. The computation is a pure Z-score ``(X - mean) / std`` of the climatic
    water balance (P - PET); it does NOT fit a log-logistic / Pearson-III
    distribution and does NOT invert the normal CDF, so its output must not be
    reported as conventional SPEI.
    """
    n = len(balance)
    if n < 2:
        return {"ok": False, "error": "SPEI needs >= 2 values"}
    mean = sum(balance) / n
    var = sum((x - mean) ** 2 for x in balance) / n
    std = math.sqrt(var)
    if std == 0:
        vals = [0.0] * n
    else:
        vals = [round((x - mean) / std, 4) for x in balance]  # Z-score (standardized anomaly; defined for negatives; NOT conventional SPEI)
    return {"ok": True, "method": "standardized climatic water-balance anomaly (Z-score; NOT conventional SPEI)",
            "values": vals, "baseline": _baseline(n, per_year)}