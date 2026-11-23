"""Phase 3.30 — SCAN real-data evaluation pipeline test (software only).

Uses a small, real 12-day excerpt from USDA NRCS SCAN site 2046 (Perthshire, MS),
January 2024, embedded here for offline regression. This is real data, not
synthetic; it is NOT scientific validation.
"""

import math

from examples.prepare_scan_2046 import _derive_rn, _longest_contiguous_run, main

SMS_HEADER = ("Site Id,Date,Time,PRCP.D-1 (in) ,SMS.I-1:-2 (pct)  (loam),"
              "SMS.I-1:-4 (pct)  (loam),SMS.I-1:-8 (pct)  (loam),"
              "SMS.I-1:-20 (pct)  (loam),SMS.I-1:-40 (pct)  (loam),")
SMS_ROWS = [
    "2046,2024-01-01,,   0.000,    36.1,    42.8,    41.7,    50.9,    50.7,",
    "2046,2024-01-02,,   0.000,    34.9,    42.2,    41.3,    51.6,    51.7,",
    "2046,2024-01-03,,   0.000,    34.6,    41.4,    41.1,    51.3,    51.7,",
    "2046,2024-01-04,,   0.000,    33.6,    41.2,    40.7,    51.2,    49.7,",
    "2046,2024-01-05,,   0.000,    33.0,    40.5,    40.7,    51.8,    51.0,",
    "2046,2024-01-06,,   1.240,    46.8,    50.7,    47.6,    55.3,    51.4,",
    "2046,2024-01-07,,   0.000,    44.0,    48.9,    46.9,    55.1,    49.4,",
    "2046,2024-01-08,,   0.000,    42.4,    47.3,    46.8,    54.4,    50.1,",
    "2046,2024-01-09,,   1.140,    48.8,    52.1,    50.1,    58.2,    58.1,",
    "2046,2024-01-10,,   0.120,    45.3,    50.0,    48.7,    54.8,    58.4,",
    "2046,2024-01-11,,   0.000,    44.1,    48.3,    47.7,    56.7,    60.4,",
    "2046,2024-01-12,,   0.000,    43.9,    48.9,    47.7,    55.1,    60.4,",
]
WX_HEADER = ("Site Id,Date,Time,PREC.I-1 (in) ,TOBS.I-1 (degC) ,TMAX.D-1 (degC) ,"
             "TMIN.D-1 (degC) ,TAVG.D-1 (degC) ,PRCP.D-1 (in) ,WDIRV.D-1 (degr) ,"
             "WSPDV.D-1 (mph) ,RHUM.I-1 (pct) ,SRADT.D-1 (MJ/m) ,")
WX_ROWS = [
    "2046,2024-01-01,,    4.24,     3.8,    17.8,    -0.1,     8.0,   0.000,     201,     5.7,      70,      10,",
    "2046,2024-01-02,,    4.24,    -2.0,     6.6,    -2.3,     2.7,   0.000,      14,     8.3,      84,      13,",
    "2046,2024-01-03,,    4.24,     1.5,     7.9,    -5.0,     1.2,   0.000,      20,     2.6,      81,      10,",
    "2046,2024-01-04,,    4.24,    -1.6,     8.4,    -1.6,     3.2,   0.000,     346,     2.7,      90,       6,",
    "2046,2024-01-05,,    4.24,    -0.9,     8.0,    -3.5,     1.8,   0.000,      26,     5.2,      86,      12,",
    "2046,2024-01-06,,    5.48,     5.1,     5.3,    -2.1,     1.8,   1.240,      47,     6.8,      98,       1,",
    "2046,2024-01-07,,    5.48,     6.0,     6.9,     3.2,     5.2,   0.000,     266,     6.5,      88,       3,",
    "2046,2024-01-08,,    5.48,     2.3,    12.0,     1.3,     5.8,   0.000,     200,     4.0,      88,      13,",
    "2046,2024-01-09,,    6.62,     9.3,    10.6,     1.3,     6.6,   1.140,     118,     9.9,      98,       3,",
    "2046,2024-01-10,,    6.74,     1.7,     9.8,     1.7,     5.2,   0.120,     244,    14.8,      76,       4,",
    "2046,2024-01-11,,    6.74,     7.1,    10.5,    -0.6,     4.5,   0.000,     202,     7.6,      69,      13,",
    "2046,2024-01-12,,    6.74,    15.4,    18.2,     1.8,    11.0,   0.000,     159,     9.3,      82,       9,",
]


def _write(tmp_path, name, header, rows):
    p = tmp_path / name
    p.write_text("\n".join([header] + rows), encoding="utf-8")
    return str(p)


def test_scan_pipeline_runs(tmp_path):
    sms = _write(tmp_path, "sms.csv", SMS_HEADER, SMS_ROWS)
    wx = _write(tmp_path, "wx.csv", WX_HEADER, WX_ROWS)
    r = main(sms, wx)
    assert r["status"] == "COMPLETED", r
    assert r["sample_count"] == 11
    assert r["metrics"]["mae"]["status"] == "OK"
    assert r["verify_report"]["valid"] is True
    assert r["report"]["scientific_status"] == "NOT_VALIDATED"


def test_longest_contiguous_run():
    assert _longest_contiguous_run(["2024-01-01", "2024-01-02", "2024-01-04"]) == ["2024-01-01", "2024-01-02"]
    assert _longest_contiguous_run(["2024-01-01", "2024-01-02", "2024-01-03"]) == ["2024-01-01", "2024-01-02", "2024-01-03"]


def test_derive_rn_finite():
    rn = _derive_rn(20.0, 10.0, 60.0, 15.0, 1)
    assert not math.isnan(rn)
    assert rn < (1 - 0.23) * 15.0  # net <= net shortwave