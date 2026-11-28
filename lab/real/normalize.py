"""Unit normalization & meteorological helpers (lab-only, stdlib).

Open-Meteo returns wind in km/h by default and at 10 m. FAO-56 needs m/s at 2 m.
These helpers make conversions explicit and reversible. No network.
"""

from __future__ import annotations

import math

__all__ = [
    "wind_kmh_to_ms", "wind_ms_to_kmh", "wind_at_2m_from_10m",
    "saturation_vapour_pressure", "slope_vapour_pressure_curve",
    "extraterrestrial_radiation", "net_radiation_fao56",
]


def wind_kmh_to_ms(u_kmh: float) -> float:
    return float(u_kmh) / 3.6


def wind_ms_to_kmh(u_ms: float) -> float:
    return float(u_ms) * 3.6


def wind_at_2m_from_10m(u10_ms: float) -> float:
    """FAO-56 logarithmic wind-height conversion (z0=0.03 m, d=0)."""
    if u10_ms < 0:
        raise ValueError("wind speed must be >= 0")
    factor = 4.87 / math.log(67.8 * 10.0 - 5.42)
    return u10_ms * factor


def saturation_vapour_pressure(t_c: float) -> float:
    return 0.6108 * math.exp(17.27 * t_c / (t_c + 237.3))


def slope_vapour_pressure_curve(t_c: float) -> float:
    es = saturation_vapour_pressure(t_c)
    return 4098.0 * es / (t_c + 237.3) ** 2


def extraterrestrial_radiation(lat_deg: float, doy: int) -> float:
    phi = math.radians(lat_deg)
    dr = 1.0 + 0.033 * math.cos(2.0 * math.pi / 365.0 * doy)
    decl = 0.409 * math.sin(2.0 * math.pi / 365.0 * doy - 1.39)
    ws = math.acos(max(-1.0, min(1.0, -math.tan(phi) * math.tan(decl))))
    return (24.0 * 60.0 / math.pi) * 0.082 * dr * (
        ws * math.sin(phi) * math.sin(decl)
        + math.cos(phi) * math.cos(decl) * math.sin(ws))


def net_radiation_fao56(rs: float, tmax: float, tmin: float, ea: float,
                        ra: float, albedo: float = 0.23) -> float:
    rso = 0.75 * ra
    rs_eff = min(rs, rso) if rso > 0 else rs
    rns = (1.0 - albedo) * rs_eff
    ratio = (rs_eff / rso) if rso > 0 else 1.0
    sigma = 4.903e-9
    rnl = sigma * ((tmax + 273.16) ** 4 + (tmin + 273.16) ** 4) / 2.0 \
        * (0.34 - 0.14 * math.sqrt(max(0.0, ea))) * (1.35 * ratio - 0.35)
    return rns - rnl