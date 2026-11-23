"""Soil water storage tests: independent hand-derived reference vectors + unit +
integration coverage.

Expected values are hand-derived from the TAW/storage/depletion/RAW definitions,
NOT from the implementation. These are software/mathematical checks, not scientific
validation or calibration.
"""

import json
import math
import pathlib

import pytest

from hydroma.soil_water import (
    SOIL_WATER_DEFINITION,
    compute_soil_water_storage,
    validate_soil_water_input,
)
from hydroma.verification import PASS, run_vectors

_VEC = pathlib.Path(__file__).resolve().parent / "vectors" / "soil_water_vectors.json"
_DATA = json.loads(_VEC.read_text(encoding="utf-8"))
_TOL = _DATA["tolerance"]


def _project(r):
    if not r.get("ok"):
        return {"ok": False, "root_zone_depth_mm": None, "taw_mm": None, "storage_mm": None,
                "depletion_mm": None, "raw_mm": None, "remaining_mm": None,
                "depletion_fraction": None, "status": None, "warnings": [],
                "errors": sorted({e["code"] for e in r.get("errors", [])})}
    x = r["result"]
    return {"ok": True, "root_zone_depth_mm": x["root_zone_depth_mm"], "taw_mm": x["taw_mm"],
            "storage_mm": x["storage_mm"], "depletion_mm": x["depletion_mm"],
            "raw_mm": x["raw_mm"], "remaining_mm": x["remaining_mm"],
            "depletion_fraction": x["depletion_fraction"], "status": x["status"],
            "warnings": sorted({w["code"] for w in r.get("warnings", [])}), "errors": []}


def _assert_match(got, exp, ctx):
    for key, e in exp.items():
        g = got[key]
        if isinstance(e, (int, float)) and not isinstance(e, bool):
            assert g is not None and math.isclose(g, e, abs_tol=_TOL), f"{ctx}: {key} got={g} exp={e}"
        else:
            assert g == e, f"{ctx}: {key} got={g!r} exp={e!r}"


# --- reference vectors -----------------------------------------------------

@pytest.mark.parametrize("vec", _DATA["vectors"], ids=[v["id"] for v in _DATA["vectors"]])
def test_soil_water_matches_expected(vec):
    _assert_match(_project(compute_soil_water_storage(vec["input"])), vec["expected"], vec["id"])


def test_verification_report_pass():
    report = run_vectors(
        "eco-nojin.hydroma.soil-water-storage", "1.0.0",
        compute_soil_water_storage, _DATA["vectors"], _project, tolerance=_TOL,
    )
    assert report.status == PASS
    assert report.failed == 0


# --- per-layer / partial intersection -------------------------------------

def test_partial_intersection_per_layer():
    r = compute_soil_water_storage({
        "layers": [
            {"top": 0, "bottom": 200, "theta_fc": 0.30, "theta_wp": 0.10, "theta_actual": 0.20},
            {"top": 200, "bottom": 400, "theta_fc": 0.40, "theta_wp": 0.20, "theta_actual": 0.30},
        ],
        "rootZoneDepth": 300,
        "p": 0.6,
    })
    assert r["ok"] is True
    per = r["per_layer"]
    assert per[0]["effective_thickness_mm"] == 200.0
    assert per[1]["effective_thickness_mm"] == 100.0  # only intersected part
    assert math.isclose(r["result"]["root_zone_depth_mm"], 300.0)
    assert math.isclose(r["result"]["taw_mm"], 60.0)


def test_layer_below_root_zone_contributes_zero():
    r = compute_soil_water_storage({
        "layers": [
            {"top": 0, "bottom": 300, "theta_fc": 0.30, "theta_wp": 0.10},
            {"top": 300, "bottom": 600, "theta_fc": 0.50, "theta_wp": 0.30},
        ],
        "rootZoneDepth": 300,
    })
    assert r["ok"] is True
    per = r["per_layer"]
    assert per[1]["effective_thickness_mm"] == 0.0
    assert math.isclose(r["result"]["taw_mm"], 60.0)


def test_available_water_and_stress_flag():
    r = compute_soil_water_storage({
        "layers": [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10, "theta_actual": 0.20}],
        "p": 0.5,
    })
    res = r["result"]
    assert math.isclose(res["available_water_mm"], 30.0)  # (0.20-0.10)*300
    assert res["stress_reached"] is True  # depletion 30 >= raw 30


def test_stress_flag_false_when_below_raw():
    r = compute_soil_water_storage({
        "layers": [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10, "theta_actual": 0.25}],
        "p": 0.5,
    })
    assert r["result"]["stress_reached"] is False


# --- explicit units --------------------------------------------------------

def test_explicit_units_match_bare_numbers():
    bare = compute_soil_water_storage({
        "layers": [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10, "theta_actual": 0.20}],
        "p": 0.5,
    })
    explicit = compute_soil_water_storage({
        "layers": [{
            "top": {"value": 0.0, "unit": "m"},
            "bottom": {"value": 0.3, "unit": "m"},
            "theta_fc": {"value": 0.30, "unit": "m3/m3"},
            "theta_wp": {"value": 0.10, "unit": "m3/m3"},
            "theta_actual": {"value": 0.20, "unit": "m3/m3"},
        }],
        "rootZoneDepth": {"value": 300, "unit": "mm"},
        "p": {"value": 0.5, "unit": "fraction"},
    })
    assert explicit["ok"] is True
    assert math.isclose(explicit["result"]["taw_mm"], bare["result"]["taw_mm"])
    assert math.isclose(explicit["result"]["storage_mm"], bare["result"]["storage_mm"])


def test_root_zone_depth_in_metres():
    r = compute_soil_water_storage({
        "layers": [{"top": 0, "bottom": 500, "theta_fc": 0.30, "theta_wp": 0.10}],
        "rootZoneDepth": {"value": 0.3, "unit": "m"},
    })
    assert math.isclose(r["result"]["root_zone_depth_mm"], 300.0)
    assert math.isclose(r["result"]["taw_mm"], 60.0)


def test_theta_unit_mismatch_rejected():
    r = compute_soil_water_storage({
        "layers": [{"thickness_mm": 300, "theta_fc": {"value": 0.30, "unit": "mm"},
                    "theta_wp": 0.10}],
    })
    assert r["ok"] is False
    assert "UNSUPPORTED_UNIT" in {e["code"] for e in r["errors"]}


def test_depth_unit_mismatch_rejected():
    r = compute_soil_water_storage({
        "layers": [{"thickness_mm": {"value": 300, "unit": "degC"}, "theta_fc": 0.30, "theta_wp": 0.10}],
    })
    assert r["ok"] is False
    assert "UNSUPPORTED_UNIT" in {e["code"] for e in r["errors"]}


# --- validation ------------------------------------------------------------

def test_invalid_order_overlap():
    v = validate_soil_water_input({"layers": [
        {"top": 0, "bottom": 200, "theta_fc": 0.3, "theta_wp": 0.1},
        {"top": 150, "bottom": 300, "theta_fc": 0.3, "theta_wp": 0.1},
    ]})
    assert v["valid"] is False
    assert "LAYER_OVERLAP" in {e["code"] for e in v["errors"]}


def test_invalid_order_gap():
    v = validate_soil_water_input({"layers": [
        {"top": 0, "bottom": 200, "theta_fc": 0.3, "theta_wp": 0.1},
        {"top": 250, "bottom": 300, "theta_fc": 0.3, "theta_wp": 0.1},
    ]})
    assert "LAYER_GAP" in {e["code"] for e in v["errors"]}


def test_incomplete_coverage():
    v = validate_soil_water_input({
        "layers": [{"thickness_mm": 200, "theta_fc": 0.3, "theta_wp": 0.1}],
        "rootZoneDepth": 300,
    })
    assert v["valid"] is False
    assert "INCOMPLETE_COVERAGE" in {e["code"] for e in v["errors"]}


def test_invalid_thickness():
    v = validate_soil_water_input({"layers": [{"thickness_mm": 0, "theta_fc": 0.3, "theta_wp": 0.1}]})
    assert v["valid"] is False
    assert "INVALID_THICKNESS" in {e["code"] for e in v["errors"]}


def test_non_finite_theta_rejected():
    v = validate_soil_water_input({"layers": [{"thickness_mm": 300, "theta_fc": "abc", "theta_wp": 0.1}]})
    assert v["valid"] is False
    assert "NON_FINITE" in {e["code"] for e in v["errors"]}


def test_theta_out_of_bounds_rejected():
    v = validate_soil_water_input({"layers": [{"thickness_mm": 300, "theta_fc": 1.2, "theta_wp": 0.1}]})
    assert v["valid"] is False
    assert "INVALID_THETA" in {e["code"] for e in v["errors"]}


def test_invalid_root_zone_depth():
    v = validate_soil_water_input({
        "layers": [{"thickness_mm": 300, "theta_fc": 0.3, "theta_wp": 0.1}],
        "rootZoneDepth": 0,
    })
    assert v["valid"] is False
    assert "INVALID_ROOT_ZONE_DEPTH" in {e["code"] for e in v["errors"]}


def test_empty_layers():
    v = validate_soil_water_input({"layers": []})
    assert v["valid"] is False
    assert "EMPTY_LAYERS" in {e["code"] for e in v["errors"]}


# --- determinism -----------------------------------------------------------

def test_deterministic_output():
    inp = {"layers": [{"top": 0, "bottom": 300, "theta_fc": 0.30, "theta_wp": 0.10,
                       "theta_actual": 0.22}], "p": 0.55}
    a = compute_soil_water_storage(inp)
    b = compute_soil_water_storage(inp)
    assert a["result"] == b["result"]


# --- integration -----------------------------------------------------------

def test_registered_and_executable_via_runtime():
    from hydroma.jobs import JobStore
    from hydroma.runtime import build_registry, execute_run

    reg = build_registry()
    model = reg.get("eco-nojin.hydroma.soil-water-storage")
    assert model is not None

    store = JobStore(":memory:")
    run_id = store.create_run(
        "eco-nojin.hydroma.soil-water-storage", "1.0.0", "alice",
        {"layers": [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10, "theta_actual": 0.20}],
         "p": 0.5},
    )
    run = execute_run(store, run_id, reg)
    assert run["status"] == "completed"
    assert math.isclose(run["result_json"]["result"]["taw_mm"], 60.0, abs_tol=1e-3)
    prov = run["provenance_json"]
    assert prov["scientific_status"] == "NOT_VALIDATED"
    assert prov["schema_version"]


def test_api_lists_all_models():
    from fastapi.testclient import TestClient
    from hydroma.api import create_app

    models = TestClient(create_app()).get("/v1/models").json()["models"]
    ids = {m["id"] for m in models}
    assert "eco-nojin.hydroma.soil-water-storage" in ids
    assert "eco-nojin.hydroma.water-balance" in ids
    assert "eco-nojin.hydroma.fao56-et0" in ids


def test_existing_models_still_valid():
    from hydroma.registry import validate_definition
    from hydroma.water_balance import WATER_BALANCE_DEFINITION
    from hydroma.fao56_et0 import FAO56_ET0_DEFINITION

    validate_definition(WATER_BALANCE_DEFINITION)
    validate_definition(FAO56_ET0_DEFINITION)
    validate_definition(SOIL_WATER_DEFINITION)


def test_definition_contract_completeness():
    from hydroma.registry import contract_gaps
    assert contract_gaps(SOIL_WATER_DEFINITION) == []