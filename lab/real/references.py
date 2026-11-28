"""SELF-CONTAINED independent FAO-56 / Hargreaves reference (lab-only).

Independence: this module imports ONLY ``math``. It does NOT import hydroma and
does NOT import the lab's normalize/datasets helpers. Equations are transcribed
from FAO-56 (Allen et al. 1998, Irrigation & Drainage Paper 56) and
Hargreaves-Samani (1985) by the lab author (independent reimplementation).

Provenance / limitations:
- Author: HyDroMA lab (independent reimplementation).
- Source equations: FAO-56 Ch.3-4; Hargreaves & Samani 1985.
- License: lab-internal.
- This is NOT an authoritative published test vector and NOT scientific
  validation; it is an independent computational cross-check of the engine code.
"""

from __future__ import annotations

import math

REFERENCE_VERSION = "real2-1.0.0"
REFERENCE_KIND = "independent_reimplementation_not_authoritative"
PROVENANCE = {
    "author": "HyDroMA lab (independent)",
    "equations": ["FAO-56 Allen et al. 1998", "Hargreaves & Samani 1985"],
    "license": "lab-internal",
    "imports": ["math"],
}

__all__ = ["fao56_reference", "hargreaves_reference", "REFERENCE_KIND",
           "REFERENCE_VERSION", "PROVENANCE"]


def _es(t_c: float) -> float:
    return 0.6108 * math.exp(17.27 * t_c / (t_c + 237.3))


def _delta(t_c: float) -> float:
    es = _es(t_c)
    return 4098.0 * es / (t_c + 237.3) ** 2


def fao56_reference(rn: float, t: float, u2: float, ea: float, z: float = 0.0):
    es = _es(t)
    delta = _delta(t)
    p = 101.3 * ((293.0 - 0.0065 * z) / 293.0) ** 5.26
    gamma = 0.000665 * p
    lam = 2.45
    num = 0.408 * delta * rn + gamma * (900.0 / (t + 273.0)) * u2 * (es - ea)
    den = delta + gamma * (1.0 + 0.34 * u2)
    return {"et0": round(num / den, 4), "es_kpa": round(es, 4),
            "delta": round(delta, 5), "gamma": round(gamma, 5)}


def hargreaves_reference(tmax: float, tmin: float, ra: float):
    tmean = (tmax + tmin) / 2.0
    et0 = 0.0023 * (tmean + 17.8) * math.sqrt(max(0.0, tmax - tmin)) * 0.408 * ra
    return {"et0": round(max(0.0, et0), 4), "ra": round(ra, 3)}