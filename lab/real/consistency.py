"""Cross-model physical-consistency checks (lab-only, stdlib).

Each check returns a status; incompatibility is reported, never forced.
"""

from __future__ import annotations

from typing import Any, Dict, List

from hydroma.crop_etc import compute_crop_etc
from hydroma.water_balance import compute_water_balance
from hydroma.irrigation import compute_irrigation_schedule

__all__ = ["run_consistency"]

_LAYERS = [{"name": "L1", "thickness": 300.0, "thickness_mm": 300.0,
            "thetaFc": 0.28, "thetaWp": 0.12, "theta_fc": 0.28, "theta_wp": 0.12}]


def run_consistency() -> List[Dict[str, Any]]:
    out = []

    # ET0 -> crop ETc: etc == kc * et0
    etc = compute_crop_etc({"et0_mm": 5.0, "kc": 0.8})
    if etc.get("ok"):
        val = etc["result"]["etc_mm"]
        ok = abs(val - 4.0) < 1e-6
        out.append({"check": "et0_to_crop_etc", "status": "CONSISTENT" if ok else "INCONSISTENT",
                    "expected": 4.0, "actual": val})
    else:
        out.append({"check": "et0_to_crop_etc", "status": "INCONCLUSIVE"})

    # Precipitation -> water balance mass closure
    wb = compute_water_balance({"periodDays": 1, "precipitation": 10.0, "irrigation": 0.0,
                                "runoff": 0.0, "evapotranspiration": 4.0, "deepPercolation": 0.0})
    if wb.get("ok"):
        r = wb["result"]
        ds = r.get("storageChangeMm")
        inflow = r.get("inflowMm")
        outflow = r.get("outflowMm")
        if ds is not None and inflow is not None and outflow is not None:
            closes = abs(ds - (inflow - outflow)) < 1e-6
            out.append({"check": "precip_to_mass_balance",
                        "status": "CONSISTENT" if closes else "INCONSISTENT",
                        "storage_change": ds, "inflow": inflow, "outflow": outflow})
        else:
            out.append({"check": "precip_to_mass_balance", "status": "INCONCLUSIVE"})
    else:
        out.append({"check": "precip_to_mass_balance", "status": "INCONCLUSIVE"})

    # Soil depletion -> irrigation demand monotonic
    lo = compute_irrigation_schedule({"layers": _LAYERS, "p": 0.55, "depletion_mm": 10.0})
    hi = compute_irrigation_schedule({"layers": _LAYERS, "p": 0.55, "depletion_mm": 90.0})
    if lo.get("ok") and hi.get("ok"):
        a = lo["result"].get("irrigationRequirementMm", lo["result"].get("netIrrigationMm"))
        b = hi["result"].get("irrigationRequirementMm", hi["result"].get("netIrrigationMm"))
        status = "CONSISTENT" if (a is not None and b is not None and b >= a) else "INCONCLUSIVE"
        out.append({"check": "soil_to_irrigation_monotonic", "status": status,
                    "low_depletion": a, "high_depletion": b})
    else:
        out.append({"check": "soil_to_irrigation_monotonic", "status": "INCONCLUSIVE"})
    return out