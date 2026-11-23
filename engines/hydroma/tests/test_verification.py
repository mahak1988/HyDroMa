"""Tests for the reusable verification foundation.

Proves the mechanism works, detects failures, and does NOT promote maturity or
scientific status.
"""

import json
import pathlib

from hydroma.maturity import MaturityEvidence, check_promotion
from hydroma.verification import FAIL, INCOMPLETE, PASS, run_vectors
from hydroma.water_balance import compute_water_balance

_VEC = pathlib.Path(__file__).resolve().parent / "vectors" / "water_balance_vectors.json"


def _project(r):
    if not r.get("ok"):
        return {"ok": False, "status": None, "storageChangeMm": None,
                "storageChangeM3": None, "inflowMm": None, "outflowMm": None,
                "residualMm": None, "balanceCloses": None, "finalStorageMm": None,
                "outOfDomain": None, "warnings": [],
                "errors": sorted({e["code"] for e in r.get("errors", [])})}
    x = r["result"]
    return {"ok": True, "status": x["status"], "storageChangeMm": x["storageChangeMm"],
            "storageChangeM3": x["storageChangeM3"], "inflowMm": x["inflowMm"],
            "outflowMm": x["outflowMm"], "residualMm": x["residualMm"],
            "balanceCloses": x["balanceCloses"], "finalStorageMm": x["finalStorageMm"],
            "outOfDomain": x["outOfDomain"],
            "warnings": sorted({w["code"] for w in r.get("warnings", [])}),
            "errors": []}


def test_verification_pass_on_water_balance():
    data = json.loads(_VEC.read_text(encoding="utf-8"))
    report = run_vectors(
        "eco-nojin.hydroma.water-balance", "1.1.0",
        compute_water_balance, data["vectors"], _project,
    )
    assert report.total == len(data["vectors"])
    assert report.failed == 0
    assert report.status == PASS
    assert report.to_dict()["status"] == PASS


def test_verification_detects_failure():
    bad = [{
        "id": "wrong-expectation",
        "input": {"periodDays": 30, "precipitation": 100.0, "irrigation": 0.0,
                  "runoff": 20.0, "evapotranspiration": 60.0},
        "expected": {"storageChangeMm": 999.0},  # deliberately wrong
    }]
    report = run_vectors("m", "1.0.0", compute_water_balance, bad, _project)
    assert report.status == FAIL
    assert report.failed == 1


def test_empty_vectors_are_incomplete():
    report = run_vectors("m", "1.0.0", compute_water_balance, [], _project)
    assert report.status == INCOMPLETE


def test_verification_never_promotes_maturity():
    # A passing verification report must not promote software maturity, and never
    # touches the scientific status axis.
    evidence = [MaturityEvidence("unit_test", "pass")]
    assert check_promotion("implemented", "validated", evidence)["ok"] is False
    assert check_promotion("implemented", "tested", evidence)["ok"] is True