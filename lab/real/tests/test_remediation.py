"""Tests for REAL.2 remediation (offline, deterministic)."""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LAB = os.path.dirname(HERE)
sys.path.insert(0, LAB)
sys.path.insert(0, os.path.join(os.path.dirname(LAB), "..", "engines", "hydroma"))

from independence import audit_reference  # noqa: E402
from spi_spei import spi, spei, BASELINE_INSUFFICIENT  # noqa: E402
from stress import run_stress  # noqa: E402
from normalize import wind_kmh_to_ms, wind_at_2m_from_10m  # noqa: E402
from references import fao56_reference, REFERENCE_VERSION  # noqa: E402
from run_real import _synthetic_daily, _reference_crosscheck  # noqa: E402


def test_reference_is_computationally_independent():
    a = audit_reference(os.path.join(LAB, "references.py"))
    assert a["classification"] == "COMPUTATIONALLY_INDEPENDENT"
    assert a["hydroma_imported"] is False


def test_reference_crosscheck_matches():
    ev = _reference_crosscheck(_synthetic_daily(), 35.7)
    assert ev["nse"] > 0.999


def test_spi_rejects_negative():
    r = spi([10, -5, 20])
    assert r["ok"] is False


def test_spei_handles_negative_balance():
    r = spei([-20, -10, 0, 10, 20])
    assert r["ok"] is True
    assert any(v < 0 for v in r["values"]) and any(v > 0 for v in r["values"])


def test_baseline_insufficient_for_one_year():
    r = spi([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120])
    assert r["baseline"]["status"] == BASELINE_INSUFFICIENT


def test_wind_height_conversion_reduces():
    u10 = wind_kmh_to_ms(36.0)  # 10 m/s
    u2 = wind_at_2m_from_10m(u10)
    assert abs(u10 - 10.0) < 1e-9
    assert u2 < u10  # 2 m wind lower than 10 m


def test_neg_rad_is_valid_not_violation():
    rows = {r["id"]: r for r in run_stress()}
    assert rows["neg_rad"]["class"] == "VALID_RESULT"
    assert rows["missing_ea"]["class"] == "EXPECTED_REJECTION"


def test_reference_version_present():
    assert REFERENCE_VERSION.startswith("real2")


def test_spi_zero_frequency_handling():
    r = spi([0, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
    assert r["ok"] is True
    # zero-precip months map to the frequency q (<0.5) -> negative SPI
    assert r["values"][0] < 0 and r["values"][1] < 0
    assert any(v > 0 for v in r["values"][2:])


def test_standardized_anomaly_is_zscore_not_gamma():
    r = spei([1, 2, 3, 4, 5])
    assert r["ok"] is True
    # mean=3, std=sqrt(2); pure Z-score, defined for negatives
    expected = [-1.4142, -0.7071, 0.0, 0.7071, 1.4142]
    for got, exp in zip(r["values"], expected):
        assert abs(got - exp) < 1e-3
    assert "anomaly" in r["method"].lower()


def test_reference_matches_authoritative_fao56_vectors():
    vec_path = os.path.join(os.path.dirname(LAB), "..", "engines", "hydroma",
                            "tests", "vectors", "fao56_et0_vectors.json")
    with open(vec_path, encoding="utf-8") as fh:
        doc = json.load(fh)
    tol = doc["tolerance"]["et0"]
    checked = 0
    for v in doc["vectors"]:
        if not v["expected"].get("ok"):
            continue  # reference does not implement validation; numeric vectors only
        inp = v["input"]
        ref = fao56_reference(inp["rn"], inp["t"], inp["u2"], inp["ea"], inp.get("z", 0.0))
        assert abs(ref["et0"] - v["expected"]["et0_mm_per_day"]) <= tol, v["id"]
        checked += 1
    assert checked >= 3