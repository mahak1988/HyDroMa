"""FAO-56 ET0 tests: independent hand-derived reference vectors + runtime/API integration.

Expected values come from FAO-56 Paper 56 Eq.6 computed by hand, NOT from the
implementation. These are software/mathematical checks, not scientific validation.
"""

import json
import math
import pathlib

import pytest

from hydroma.fao56_et0 import compute_fao56_et0
from hydroma.verification import PASS, run_vectors

_VEC = pathlib.Path(__file__).resolve().parent / "vectors" / "fao56_et0_vectors.json"
_DATA = json.loads(_VEC.read_text(encoding="utf-8"))
_TOL_ET0 = _DATA["tolerance"]["et0"]
_TOL_INT = _DATA["tolerance"]["intermediate"]


def _project(r):
    if not r.get("ok"):
        return {"ok": False, "et0_mm_per_day": None, "es_kpa": None,
                "delta_kpa_per_c": None, "gamma_kpa_per_c": None,
                "pressure_kpa": None, "warnings": [],
                "errors": sorted({e["code"] for e in r.get("errors", [])})}
    x = r["result"]
    return {"ok": True, "et0_mm_per_day": x["et0_mm_per_day"], "es_kpa": x["es_kpa"],
            "delta_kpa_per_c": x["delta_kpa_per_c"], "gamma_kpa_per_c": x["gamma_kpa_per_c"],
            "pressure_kpa": x["pressure_kpa"],
            "warnings": sorted({w["code"] for w in r.get("warnings", [])}), "errors": []}


def _assert_match(got, exp, ctx):
    for key, e in exp.items():
        g = got[key]
        if isinstance(e, (int, float)) and not isinstance(e, bool):
            tol = _TOL_ET0 if key == "et0_mm_per_day" else _TOL_INT
            assert math.isclose(g, e, abs_tol=tol), f"{ctx}: {key} got={g} exp={e}"
        else:
            assert g == e, f"{ctx}: {key} got={g!r} exp={e!r}"


@pytest.mark.parametrize("vec", _DATA["vectors"], ids=[v["id"] for v in _DATA["vectors"]])
def test_fao56_matches_expected(vec):
    _assert_match(_project(compute_fao56_et0(vec["input"])), vec["expected"], vec["id"])


def test_verification_report_pass():
    report = run_vectors(
        "eco-nojin.hydroma.fao56-et0", "1.0.0",
        compute_fao56_et0, _DATA["vectors"], _project, tolerance=_TOL_ET0,
    )
    assert report.status == PASS
    assert report.failed == 0


def test_registered_and_executable_via_runtime():
    from hydroma.jobs import JobStore
    from hydroma.runtime import build_registry, execute_run

    reg = build_registry()
    assert reg.get("eco-nojin.hydroma.fao56-et0") is not None

    store = JobStore(":memory:")
    run_id = store.create_run(
        "eco-nojin.hydroma.fao56-et0", "1.0.0", "alice",
        {"rn": 15.0, "t": 20.0, "u2": 2.0, "ea": 1.5, "g": 0.0, "z": 0.0},
    )
    run = execute_run(store, run_id, reg)
    assert run["status"] == "completed"
    assert math.isclose(run["result_json"]["result"]["et0_mm_per_day"], 4.78, abs_tol=0.01)
    prov = run["provenance_json"]
    assert prov["scientific_status"] == "NOT_VALIDATED"
    assert prov["schema_version"]


def test_api_lists_et0():
    from fastapi.testclient import TestClient
    from hydroma.api import create_app

    client = TestClient(create_app())
    models = client.get("/v1/models").json()["models"]
    ids = [m["id"] for m in models]
    assert "eco-nojin.hydroma.fao56-et0" in ids
    assert "eco-nojin.hydroma.water-balance" in ids  # existing model preserved


def test_water_balance_definition_still_valid():
    # guard: existing model contract unaffected
    from hydroma.registry import validate_definition
    from hydroma.water_balance import WATER_BALANCE_DEFINITION

    validate_definition(WATER_BALANCE_DEFINITION)  # must not raise


def test_high_wind_warning_triggered():
    # u2 > 3.0 m/s triggers HIGH_WIND (accuracy caveat); u2 == 3.0 does not.
    r = compute_fao56_et0({"rn": 15.0, "t": 20.0, "u2": 3.5, "ea": 1.5})
    assert r["ok"] is True
    assert "HIGH_WIND" in [w["code"] for w in r["warnings"]]