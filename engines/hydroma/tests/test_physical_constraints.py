"""Physical-constraint behaviour of the water balance model.

These tests pin down how the model treats storage, negative final storage,
residual, closure and clamping, and document the (deliberate) boundary rules.
They do not assert scientific correctness - the model stays NOT_VALIDATED.
"""

from hydroma.water_balance import compute_water_balance


def _wb(**kw):
    base = {"periodDays": 30, "precipitation": 100.0, "irrigation": 0.0,
            "runoff": 20.0, "evapotranspiration": 60.0}
    base.update(kw)
    return compute_water_balance(base)


def test_balance_equation_holds_in_domain():
    r = _wb()
    x = r["result"]
    assert x["storageChangeMm"] == x["inflowMm"] - x["outflowMm"]


def test_balance_equation_holds_out_of_domain():
    # Even when out of domain, storageChange is still inflow - outflow (water is
    # NOT silently discarded); the out-of-domain flag reports the implausibility.
    r = _wb(runoff=200.0)
    x = r["result"]
    assert x["outOfDomain"] is True
    assert x["storageChangeMm"] == x["inflowMm"] - x["outflowMm"]


def test_negative_final_storage_is_not_clamped_to_zero():
    # initial 10, dS -120 -> raw final -110. The model does NOT clamp to 0; it
    # returns finalStorageMm = null and raises outOfDomain + NEGATIVE_STORAGE.
    r = _wb(initialStorage=10.0, evapotranspiration=200.0)
    x = r["result"]
    assert x["outOfDomain"] is True
    assert x["finalStorageMm"] is None  # not 0.0 - no silent clamp
    assert "NEGATIVE_STORAGE" in [w["code"] for w in r["warnings"]]


def test_non_negative_final_storage_reported():
    # initial 100, dS -20 -> final 80 (valid, reported)
    r = _wb(initialStorage=100.0, evapotranspiration=80.0)  # dS = 100-80-20 = 0 -> final 100
    # use a case with a real change: ET=40 -> dS = 100-40-20 = 40 -> final 140
    r = _wb(initialStorage=100.0, evapotranspiration=40.0)
    x = r["result"]
    assert x["outOfDomain"] is False
    assert x["finalStorageMm"] == 140.0


def test_residual_is_computed_minus_observed():
    r = _wb(measuredStorageChange=5.0)  # computed 20, observed 5 -> residual 15
    x = r["result"]
    assert x["residualMm"] == 15.0
    assert x["balanceCloses"] is False


def test_closure_tolerance_formula():
    # tolerance = max(1, 0.02*|inflow|); inflow=100 -> 2. residual 2 -> closes
    r = _wb(measuredStorageChange=18.0)
    x = r["result"]
    assert x["closureToleranceMm"] == 2.0
    assert x["balanceCloses"] is True
    # residual 2.5 -> outside
    r2 = _wb(measuredStorageChange=17.5)
    assert r2["result"]["balanceCloses"] is False


def test_no_silent_clamp_changes_balance():
    # storageChangeMm is never altered by clamping; only finalStorageMm is guarded
    r = _wb(initialStorage=5.0, evapotranspiration=200.0)
    assert r["result"]["storageChangeMm"] == -120.0
    assert r["result"]["outOfDomain"] is True