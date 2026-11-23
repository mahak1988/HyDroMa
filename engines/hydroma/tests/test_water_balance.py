"""Independent mathematical tests for the water balance equation.

Expected values are derived by hand from the equation
    deltaS = P + I + CR - ET - R - DP
and NOT computed by the implementation under test.
"""

from hydroma.water_balance import compute_water_balance, validate_water_balance_input


def _base(**overrides):
    data = {
        "periodDays": 30,
        "precipitation": 100.0,
        "irrigation": 0.0,
        "runoff": 20.0,
        "evapotranspiration": 60.0,
    }
    data.update(overrides)
    return data


def test_basic_surplus():
    # 100 + 0 + 0 - 60 - 20 - 0 = 20
    r = compute_water_balance(_base())
    assert r["ok"] is True
    assert r["result"]["storageChangeMm"] == 20.0
    assert r["result"]["status"] == "surplus"
    assert r["result"]["inflowMm"] == 100.0
    assert r["result"]["outflowMm"] == 80.0
    assert r["defaultsApplied"] == ["deepPercolation", "capillaryRise"]


def test_deficit():
    # 100 - 200 - 20 = -120
    r = compute_water_balance(_base(evapotranspiration=200.0))
    assert r["result"]["status"] == "deficit"
    assert r["result"]["storageChangeMm"] == -120.0


def test_zero_inputs_balanced():
    # 0 - 0 - 0 - 0 = 0
    r = compute_water_balance(
        {"periodDays": 1, "precipitation": 0.0, "irrigation": 0.0,
         "runoff": 0.0, "evapotranspiration": 0.0}
    )
    assert r["result"]["storageChangeMm"] == 0.0
    assert r["result"]["status"] == "balanced"


def test_balanced_boundary():
    # 100 - 60 - 40 = 0
    r = compute_water_balance(_base(runoff=40.0))
    assert r["result"]["storageChangeMm"] == 0.0
    assert r["result"]["status"] == "balanced"


def test_volume_conversion_with_area():
    # 20 mm over 2 ha = 20 * 2 * 10 = 400 m3
    r = compute_water_balance(_base(areaHa=2.0))
    assert r["result"]["storageChangeM3"] == 400.0


def test_rounding_half_up():
    # 10 - 3.33333 = 6.66667 -> rounded to 4 decimals = 6.6667
    r = compute_water_balance(_base(precipitation=10.0, runoff=3.33333, evapotranspiration=0.0))
    assert r["result"]["storageChangeMm"] == 6.6667


def test_closure_within_tolerance():
    # computed dS = 20, observed 18 -> residual 2; tolerance = max(1, 0.02*100)=2 -> closes
    r = compute_water_balance(_base(measuredStorageChange=18.0))
    assert r["result"]["residualMm"] == 2.0
    assert r["result"]["balanceCloses"] is True


def test_closure_outside_tolerance():
    r = compute_water_balance(_base(measuredStorageChange=0.0))
    assert r["result"]["residualMm"] == 20.0
    assert r["result"]["balanceCloses"] is False


def test_out_of_domain_negative_final_storage():
    # dS = 100 - 200 - 20 = -120; final = 10 - 120 = -110 < 0
    r = compute_water_balance(_base(initialStorage=10.0, evapotranspiration=200.0))
    assert r["result"]["outOfDomain"] is True
    assert r["result"]["finalStorageMm"] is None
    assert "NEGATIVE_STORAGE" in [w["code"] for w in r["warnings"]]


def test_out_of_domain_runoff_exceeds_inflow():
    # R=200 > inflow=100
    r = compute_water_balance(_base(runoff=200.0))
    assert r["result"]["outOfDomain"] is True
    assert "RUNOFF_GT_INPUT" in [w["code"] for w in r["warnings"]]


def test_missing_required_field():
    data = _base()
    del data["precipitation"]
    r = compute_water_balance(data)
    assert r["ok"] is False
    assert "MISSING" in [e["code"] for e in r["errors"]]


def test_negative_rejected():
    r = compute_water_balance(_base(precipitation=-5.0))
    assert r["ok"] is False
    assert any(e["code"] == "NEGATIVE" for e in r["errors"])


def test_non_finite_rejected():
    r = compute_water_balance(_base(precipitation=float("nan")))
    assert r["ok"] is False
    assert any(e["code"] == "NOT_FINITE" for e in r["errors"])


def test_period_invalid():
    r = compute_water_balance(_base(periodDays=0))
    assert r["ok"] is False
    assert any(e["code"] == "PERIOD_INVALID" for e in r["errors"])


def test_period_must_be_integer():
    r = compute_water_balance(_base(periodDays=2.5))
    assert r["ok"] is False
    assert any(e["code"] == "PERIOD_INVALID" for e in r["errors"])


def test_unit_mismatch_rejected():
    r = compute_water_balance(_base(precipitation={"value": 100.0, "unit": "cm"}))
    assert r["ok"] is False
    assert any(e["code"] == "UNSUPPORTED_UNIT" for e in r["errors"])


def test_quantity_accepted():
    r = compute_water_balance(_base(precipitation={"value": 100.0, "unit": "mm"}))
    assert r["ok"] is True
    assert r["result"]["storageChangeMm"] == 20.0


def test_validate_returns_errors():
    v = validate_water_balance_input({})
    assert v["valid"] is False
    assert len(v["errors"]) > 0