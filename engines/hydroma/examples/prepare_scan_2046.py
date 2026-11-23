"""Phase 3.30 — Prepare SCAN 2046 (Perthshire, MS) and run a preliminary evaluation.

Real-data pipeline (no synthetic data):
  * Reads the USDA NRCS SCAN daily soil-moisture (SMS) and weather (WEATHER) CSV
    exports for site 2046, calendar year 2024 (downloaded separately; see README).
  * Derives root-zone storage from point soil-moisture sensors using documented
    midpoint layer boundaries (no silent "point = layer" assumption).
  * Derives net radiation (Rn) from measured solar radiation (FAO-56), then ET0
    with the existing ``fao56_et0`` model.
  * Runs the existing ``multi-period-simulation`` model (demand-based, ETc as the
    ET sink) over the longest contiguous run of complete days and evaluates
    simulated vs observed storage with the Phase 3.26 evaluator.

This is a PRELIMINARY EMPIRICAL EVALUATION, not scientific validation. Soil
hydraulic parameters (loam theta_fc/theta_wp), Kc and p are explicit documented
assumptions, not measurements.
"""

from __future__ import annotations

import json
import math
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from hydroma.evaluation import evaluate_model_output, verify_evaluation_report
from hydroma.fao56_et0 import compute_fao56_et0
from hydroma.water_stress import compute_stress_aware_series

SITE = {
    "site_id": "2046",
    "name": "Perthshire",
    "state": "Mississippi",
    "lat_deg": 33.9667,
    "elevation_m": 45.72,  # 150 ft
    "sensor_depths_in": [2, 4, 8, 20, 40],
    "layer_bounds_in": [0, 3, 6, 14, 30, 40],  # midpoint boundaries
    "theta_fc": 0.27,  # loam, Rawls et al. (1983) - documented assumption
    "theta_wp": 0.12,  # loam, Rawls et al. (1983) - documented assumption
    "kc": 1.0,         # explicit assumption (Kc=1 => ETc=ET0)
    "p": 0.5,          # explicit assumption (FAO-56 depletion fraction)
}
IN_TO_MM = 25.4
MPH_TO_MS = 0.44704


def _read_scan_csv(path):
    lines = open(path, encoding="utf-8").read().splitlines()
    idx = next(i for i, l in enumerate(lines) if l.startswith("Site Id"))
    header = [h.strip() for h in lines[idx].split(",")]
    rows = [[c.strip() for c in l.split(",")] for l in lines[idx + 1:] if l.strip()]
    return header, rows


def _col(header, prefix):
    for j, h in enumerate(header):
        if h.startswith(prefix):
            return j
    return None


def _val(row, j):
    if j is None or j >= len(row):
        return None
    v = row[j].strip()
    if v == "" or v in ("-99.90", "-99.9"):
        return None
    try:
        return float(v)
    except ValueError:
        return None


def _ra(lat_deg, doy):
    lat = math.radians(lat_deg)
    dr = 1 + 0.033 * math.cos(2 * math.pi / 365 * doy)
    decl = 0.409 * math.sin(2 * math.pi / 365 * doy - 1.39)
    ws = math.acos(-math.tan(lat) * math.tan(decl))
    return (24 * 60 / math.pi) * 0.0820 * dr * (
        ws * math.sin(lat) * math.sin(decl) + math.cos(lat) * math.cos(decl) * math.sin(ws)
    )


def _derive_rn(tmax, tmin, rh, rs, doy):
    """FAO-56 net radiation from measured solar radiation (derived, not measured)."""
    t = (tmax + tmin) / 2.0
    ea = rh / 100.0 * 0.6108 * math.exp(17.27 * t / (t + 237.3))
    ra = _ra(SITE["lat_deg"], doy)
    rso = (0.75 + 2e-5 * SITE["elevation_m"]) * ra
    rns = (1 - 0.23) * rs
    tmax_k, tmin_k = tmax + 273.16, tmin + 273.16
    rnl = 4.903e-9 * ((tmax_k ** 4 + tmin_k ** 4) / 2) * (0.34 - 0.14 * math.sqrt(max(ea, 0.0))) * (
        1.35 * min(rs / rso, 1.0) - 0.35
    )
    return rns - rnl


def _longest_contiguous_run(dates):
    """Return the longest run of consecutive calendar dates."""
    dates = sorted(dates)
    best, cur = [], []
    for d in dates:
        if cur and (datetime.fromisoformat(d) - datetime.fromisoformat(cur[-1])).days == 1:
            cur.append(d)
        else:
            cur = [d]
        if len(cur) > len(best):
            best = list(cur)
    return best


def main(sms_path, weather_path):
    sms_h, sms_rows = _read_scan_csv(sms_path)
    wx_h, wx_rows = _read_scan_csv(weather_path)

    j_prcp = _col(sms_h, "PRCP.D-1")
    j_sm = [_col(sms_h, f"SMS.I-1:-{d} ") for d in SITE["sensor_depths_in"]]
    j_tmax = _col(wx_h, "TMAX.D-1"); j_tmin = _col(wx_h, "TMIN.D-1")
    j_wspd = _col(wx_h, "WSPDV.D-1"); j_rh = _col(wx_h, "RHUM.I-1"); j_sr = _col(wx_h, "SRADT.D-1")

    wx_by_date = {r[1]: r for r in wx_rows if len(r) > 1}

    # collect complete days (soil moisture + weather)
    day_data = {}
    for r in sms_rows:
        if len(r) <= 1:
            continue
        date = r[1]
        thetas = []
        ok = True
        for j in j_sm:
            sm = _val(r, j)
            if sm is None:
                ok = False
                break
            thetas.append(sm / 100.0)
        if not ok or not thetas:
            continue
        wx = wx_by_date.get(date)
        if wx is None:
            continue
        tmax = _val(wx, j_tmax); tmin = _val(wx, j_tmin)
        wspd = _val(wx, j_wspd); rh = _val(wx, j_rh); rs = _val(wx, j_sr)
        if None in (tmax, tmin, wspd, rh, rs):
            continue
        storage = sum(th * (SITE["layer_bounds_in"][i + 1] - SITE["layer_bounds_in"][i]) * IN_TO_MM
                      for i, th in enumerate(thetas))
        prcp_in = _val(r, j_prcp) or 0.0
        day_data[date] = {"storage_mm": storage, "precip_mm": prcp_in * IN_TO_MM,
                          "tmax": tmax, "tmin": tmin, "wspd": wspd, "rh": rh, "rs": rs}

    if len(day_data) < 10:
        return {"status": "FAILED", "reason": "INSUFFICIENT_DATA", "complete_days": len(day_data)}

    run = _longest_contiguous_run(list(day_data.keys()))
    if len(run) < 10:
        return {"status": "FAILED", "reason": "INSUFFICIENT_CONTIGUOUS_RUN", "run": len(run)}

    layers = [{"thickness_mm": (SITE["layer_bounds_in"][i + 1] - SITE["layer_bounds_in"][i]) * IN_TO_MM,
               "theta_fc": SITE["theta_fc"], "theta_wp": SITE["theta_wp"]}
              for i in range(len(SITE["sensor_depths_in"]))]

    initial_storage = day_data[run[0]]["storage_mm"]
    periods = []
    model_outputs = []
    for i in range(1, len(run)):
        d0, d1 = run[i - 1], run[i]
        w = day_data[d1]
        u2 = w["wspd"] * MPH_TO_MS
        doy = datetime.fromisoformat(d1).timetuple().tm_yday
        rn = _derive_rn(w["tmax"], w["tmin"], w["rh"], w["rs"], doy)
        t = (w["tmax"] + w["tmin"]) / 2.0
        ea = w["rh"] / 100.0 * 0.6108 * math.exp(17.27 * t / (t + 237.3))
        et0_res = compute_fao56_et0({"rn": rn, "t": t, "u2": u2, "ea": ea, "g": 0.0, "z": SITE["elevation_m"]})
        if not et0_res["ok"]:
            continue
        et0 = float(et0_res["result"]["et0_mm_per_day"])
        periods.append({"period_start": d0 + "T00:00:00Z", "period_end": d1 + "T00:00:00Z",
                        "et0_mm": et0, "kc": SITE["kc"], "precipitation_mm": w["precip_mm"],
                        "irrigation_mm": 0.0, "runoff_mm": 0.0})
        model_outputs.append({"variable": "soil_storage", "value": None, "unit": "mm",
                              "timestamp": d1 + "T00:00:00Z"})

    if not periods:
        return {"status": "FAILED", "reason": "NO_USABLE_STEPS"}

    sim = compute_stress_aware_series({
        "layers": layers, "initial_storage_mm": initial_storage, "p": SITE["p"], "periods": periods,
    })
    if not sim.get("ok"):
        return {"status": "FAILED", "reason": "SIMULATION_ERROR", "errors": sim.get("errors")}

    for mo, st in zip(model_outputs, sim["result"]["steps"]):
        mo["value"] = st["final_storage_mm"]
    dataset = {
        "dataset_id": f"SCAN-{SITE['site_id']}-2024", "version": "1.0", "role": "VALIDATION",
        "variable": "soil_storage", "unit": "mm",
        "source": "USDA NRCS SCAN site 2046 (Perthshire, MS)",
        "observations": [
            {"variable": "soil_storage", "value": day_data[d]["storage_mm"], "unit": "mm",
             "timestamp": d + "T00:00:00Z", "quality_flag": "valid"}
            for d in run[1:]
        ],
    }
    report = evaluate_model_output(
        {"id": "eco-nojin.hydroma.water-stress", "version": "1.0.0",
         "scientific_status": "NOT_VALIDATED"}, dataset, model_outputs)
    return {
        "status": "COMPLETED",
        "site": SITE["name"],
        "period": {"start": run[0], "end": run[-1]},
        "complete_days": len(day_data),
        "run_days": len(run),
        "scored_steps": len(periods),
        "initial_storage_mm": round(initial_storage, 4),
        "final_storage_mm": sim["result"]["final_storage_mm"],
        "metrics": report.get("metrics"),
        "sample_count": report.get("sample_count"),
        "report_status": report.get("status"),
        "verify_report": verify_evaluation_report(report),
        "limitations": [
            "soil theta_fc/theta_wp are loam pedotransfer assumptions, not measured",
            "Kc=1.0 and p=0.5 are explicit assumptions",
            "Rn derived from Rs (FAO-56), not measured",
            "irrigation/runoff/deep percolation assumed zero (not measured)",
            "point sensors integrated via midpoint layers (documented assumption)",
            "ETc is crop demand; Ks/ETa stress-adjusted estimate, not measured actual ET",
        ],
        "report": report,
    }


if __name__ == "__main__":
    sms = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.environ.get("TEMP", "."), "kilo", "scan_2046_2024.csv")
    wx = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.environ.get("TEMP", "."), "kilo", "scan_2046_weather_2024.csv")
    result = main(sms, wx)
    print(json.dumps(result, indent=2, default=str))