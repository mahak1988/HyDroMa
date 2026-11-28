"""Offline tests for the real-world benchmark lab (synthetic inputs)."""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LAB = os.path.dirname(HERE)
sys.path.insert(0, LAB)
sys.path.insert(0, os.path.join(os.path.dirname(LAB), "..", "engines", "hydroma"))

from quality import validate_daily  # noqa: E402
from run_real import _synthetic_daily, _reference_crosscheck  # noqa: E402
from stress import run_stress  # noqa: E402
from sensitivity import oat_sensitivity  # noqa: E402
from consistency import run_consistency  # noqa: E402
from diagnostics import Register, Finding  # noqa: E402
from hydroma.fao56_et0 import compute_fao56_et0  # noqa: E402


def test_quality_accepts_synthetic():
    q = validate_daily(_synthetic_daily())
    assert q["ok"], q["errors"]


def test_reference_crosscheck_matches():
    ev = _reference_crosscheck(_synthetic_daily(), 35.7)
    assert ev["nse"] is not None and ev["nse"] > 0.999  # same equations, independent code


def test_stress_rejects_invalid():
    rows = run_stress()
    by = {r["id"]: r for r in rows}
    assert by["missing_ea"]["class"] == "EXPECTED_REJECTION"
    assert by["nan_temp"]["class"] == "EXPECTED_REJECTION"
    assert by["zero_wind"]["class"] == "VALID_RESULT"
    allowed = {"EXPECTED_REJECTION", "EXPECTED_WARNING", "VALID_RESULT",
               "SCIENTIFIC_CONSTRAINT_VIOLATION", "NUMERICAL_FAILURE", "UNEXPECTED_EXCEPTION"}
    assert all(r["class"] in allowed for r in rows)


def test_sensitivity_monotonic_temperature():
    base = {"rn": 10.0, "t": 20.0, "u2": 2.0, "ea": 1.0}
    rows = oat_sensitivity(base, {"t": [2.0, -2.0]},
                           lambda d: compute_fao56_et0(d)["result"]["et0_mm_per_day"])
    plus = next(r for r in rows if r["delta"] == 2.0)["output"]
    minus = next(r for r in rows if r["delta"] == -2.0)["output"]
    assert plus > minus


def test_consistency_no_inconsistency():
    rows = run_consistency()
    assert all(r["status"] in ("CONSISTENT", "INCONCLUSIVE") for r in rows)


def test_findings_register():
    reg = Register()
    reg.add(Finding("F1", "m", "UNIT_ERROR", "P3", "x"))
    assert reg.by_severity()["P3"] == 1