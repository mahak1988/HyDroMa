"""Phase 3.20 climate-driven multi-period crop water workflow tests (software only).

These verify the orchestration and dataflow of the EXISTING models; they are not
evidence of scientific validation.
"""

import json

import pytest
from fastapi.testclient import TestClient

from hydroma.api import create_app
from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.climate_crop_workflow import (
    run_climate_crop_workflow,
    verify_climate_crop_provenance,
)
from hydroma.climate_et0 import ET0IntegrationConfig, compute_et0_series
from hydroma.jobs import JobStore
from hydroma.runtime import build_registry, execute_run

D1 = "2026-01-01T00:00:00Z"
D2 = "2026-01-02T00:00:00Z"
D3 = "2026-01-03T00:00:00Z"
D4 = "2026-01-04T00:00:00Z"
_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]
_ET0_CFG = {"variable_mapping": {"t": "air_temperature", "u2": "wind_speed",
                                 "ea": "relative_humidity", "rn": "solar_radiation"}}


def _obs(var, val, unit, ts, basis, acc=None, quality="valid"):
    kw = {"accumulation_start": acc[0], "accumulation_end": acc[1]} if acc else {}
    return {"variable": var, "value": val, "unit": unit, "timestamp": ts, "basis": basis,
            "quality": quality, **kw}


def _source(precip=((D2, D1, 10.0), (D3, D2, 5.0)), precip_unit="mm", days=(D1, D2),
            t=20.0, u2=2.0, rh=50.0, rs=15.0, quality="valid"):
    obs = []
    for d in days:
        obs += [
            _obs("air_temperature", t, "degC", d, "daily_mean", quality=quality),
            _obs("wind_speed", u2, "m/s", d, "daily_mean", quality=quality),
            _obs("relative_humidity", rh, "%", d, "daily_mean", quality=quality),
            _obs("solar_radiation", rs, "MJ/m2/day", d, "daily_sum", quality=quality),
        ]
    for ts, ps, val in precip:
        obs.append(_obs("precipitation", val, precip_unit, ts, "daily_sum", acc=(ps, ts), quality=quality))
    return {"observations": obs, "variable": None, "temporal_resolution": "1d"}


def _periods(kc=(0.8, 0.9), **extra):
    base = [(D1, D2), (D2, D3)]
    out = []
    for i, (ps, pe) in enumerate(base):
        p = {"period_start": ps, "period_end": pe, "kc": kc[i]}
        p.update(extra)
        out.append(p)
    return out


def _input(**over):
    inp = {
        "source": _source(),
        "periods": _periods(),
        "soil": {"layers": _LAYERS, "initial_storage_mm": 60.0},
        "et0_config": _ET0_CFG,
    }
    inp.update(over)
    return inp


# --- valid workflow --------------------------------------------------------

def test_valid_workflow_completes():
    r = run_climate_crop_workflow(_input())
    assert r["status"] == "COMPLETED", r.get("reason_code")
    assert r["acceptance"]["model_ready"] is True
    assert len(r["et0"]["records"]) == 2
    assert [m["precipitation_mm"] for m in r["mappings"]] == [10.0, 5.0]
    assert all(m["et_source"] == "crop_etc" and m["et_is_actual"] is False for m in r["mappings"])


def test_et0_integration_matches_existing_model():
    r = run_climate_crop_workflow(_input())
    series = ClimateSeries.from_dict(_source())
    direct = compute_et0_series(series, ET0IntegrationConfig(**_ET0_CFG))
    assert [(x["date"], x["et0_mm_per_day"]) for x in r["et0"]["records"]] == \
           [(x["date"], x["et0_mm_per_day"]) for x in direct.records]


def test_etc_integration():
    r = run_climate_crop_workflow(_input())
    for rec in r["etc"]:
        assert abs(rec["etc_mm"] - rec["kc"] * rec["et0_mm"]) < 1e-3


def test_effective_precipitation_integration():
    inp = _input(periods=_periods(curve_number=90))
    r = run_climate_crop_workflow(inp)
    assert r["status"] == "COMPLETED"
    for rec in r["effective_precipitation"]:
        assert rec["curve_number"] == 90
        assert rec["effective_precipitation_mm"] is not None
        assert rec["effective_precipitation_mm"] <= 10.0 + 1e-9
    # CN=90 with P=10 produces runoff, so Pe < total P (distinct accounting views)
    assert r["effective_precipitation"][0]["effective_precipitation_mm"] < 10.0


def test_state_transfer_and_mass_balance():
    r = run_climate_crop_workflow(_input())
    steps = r["simulation"]["result"]["steps"]
    assert abs(steps[1]["initial_storage_mm"] - steps[0]["final_storage_mm"]) < 1e-6
    for s in steps:
        assert abs(s["algebraic_closure_residual_mm"]) < 1e-6


def test_irrigation_temporal_semantics():
    inp = _input(periods=_periods(irrigation_mm=3.0))
    r = run_climate_crop_workflow(inp)
    assert [m["irrigation_mm"] for m in r["mappings"]] == [3.0, 3.0]
    # irrigation is the explicit caller input, never an auto-scheduled recommendation
    assert "irrigation_plan" not in r
    assert r["simulation"]["result"]["steps"][0]["irrigation_mm"] == 3.0


# --- fail-closed paths -----------------------------------------------------

def test_climate_acceptance_blocking():
    r = run_climate_crop_workflow(_input(source=_source(precip=((D2, D1, -5.0), (D3, D2, 5.0)))))
    assert r["status"] == "BLOCKED"
    assert r["reason_code"] == "QC_ERROR"


def test_qc_blocking():
    r = run_climate_crop_workflow(_input(source=_source(precip=((D2, D1, -5.0),))))
    assert r["status"] == "BLOCKED"


def test_missing_meteorological_inputs():
    r = run_climate_crop_workflow(_input(et0_config={"variable_mapping": {
        "t": "air_temperature", "u2": "wind_speed", "ea": "relative_humidity", "rn": None}}))
    assert r["status"] == "FAILED"
    assert r["reason_code"] == "ET0_UNAVAILABLE"


def test_invalid_temporal_interval():
    r = run_climate_crop_workflow(_input(periods=[
        {"period_start": D1, "period_end": "2026-01-01T12:00:00Z", "kc": 0.8}]))
    assert r["status"] == "FAILED"
    assert r["reason_code"] == "UNSUPPORTED_PERIOD_DURATION"


def test_noncontiguous_periods_rejected():
    src = _source(days=(D1, D2, D3),
                  precip=((D2, D1, 10.0), (D3, D2, 5.0), (D4, D3, 5.0)))
    r = run_climate_crop_workflow(_input(source=src, periods=[
        {"period_start": D1, "period_end": D2, "kc": 0.8},
        {"period_start": D3, "period_end": D4, "kc": 0.9}]))
    assert r["status"] == "FAILED"
    assert r["reason_code"] == "SIMULATION_ERROR"


def test_invalid_precip_unit_rejected():
    r = run_climate_crop_workflow(_input(source=_source(precip_unit="cm")))
    assert r["status"] == "FAILED"
    assert r["reason_code"] == "PRECIP_BINDING_ERROR"
    assert r["errors"][0]["code"] == "INVALID_UNIT"


def test_missing_precip_rejected():
    r = run_climate_crop_workflow(_input(source=_source(precip=())))
    assert r["status"] == "FAILED"
    assert r["reason_code"] == "PRECIP_BINDING_ERROR"


def test_missing_kc_rejected():
    periods = [{"period_start": D1, "period_end": D2}]
    r = run_climate_crop_workflow(_input(periods=periods))
    assert r["status"] == "FAILED"
    assert r["reason_code"] == "MISSING_KC"


def test_missing_accumulation_rejected():
    src = _source()
    for o in src["observations"]:
        if o["variable"] == "precipitation":
            o.pop("accumulation_start", None)
            o.pop("accumulation_end", None)
    r = run_climate_crop_workflow(_input(source=src))
    assert r["status"] == "FAILED"
    assert r["reason_code"] == "PRECIP_BINDING_ERROR"


# --- provenance / replay ---------------------------------------------------

def test_provenance_chain_present_and_verifies():
    r = run_climate_crop_workflow(_input())
    prov = r["provenance"]
    for key in ("acceptance_hash", "et0_hash", "etc_hash", "effective_precipitation_hash",
                "mapping_hash", "simulation_input_hash", "step_input_hashes", "final_result_hash"):
        assert prov.get(key), key
    assert verify_climate_crop_provenance(prov) == {"valid": True, "errors": []}


def test_provenance_survives_serialization():
    r = run_climate_crop_workflow(_input())
    reloaded = json.loads(json.dumps(r["provenance"]))
    assert verify_climate_crop_provenance(reloaded)["valid"] is True


def test_hash_mutation_precip():
    a = run_climate_crop_workflow(_input(source=_source(precip=((D2, D1, 10.0), (D3, D2, 5.0)))))
    b = run_climate_crop_workflow(_input(source=_source(precip=((D2, D1, 20.0), (D3, D2, 5.0)))))
    assert a["provenance"]["mapping_hash"] != b["provenance"]["mapping_hash"]
    assert a["provenance"]["simulation_input_hash"] != b["provenance"]["simulation_input_hash"]
    assert a["provenance"]["final_result_hash"] != b["provenance"]["final_result_hash"]


def test_hash_mutation_et_and_irrigation():
    base = run_climate_crop_workflow(_input())
    et = run_climate_crop_workflow(_input(periods=_periods(et_actual_mm=1.0)))
    irr = run_climate_crop_workflow(_input(periods=_periods(irrigation_mm=4.0)))
    assert base["provenance"]["simulation_input_hash"] != et["provenance"]["simulation_input_hash"]
    assert base["provenance"]["simulation_input_hash"] != irr["provenance"]["simulation_input_hash"]


def test_hash_mutation_kc():
    a = run_climate_crop_workflow(_input(periods=_periods(kc=(0.8, 0.9))))
    b = run_climate_crop_workflow(_input(periods=_periods(kc=(0.8, 1.0))))
    assert a["provenance"]["etc_hash"] != b["provenance"]["etc_hash"]
    assert a["provenance"]["mapping_hash"] != b["provenance"]["mapping_hash"]


def test_tamper_detection():
    r = run_climate_crop_workflow(_input())
    t = json.loads(json.dumps(r["provenance"]))
    t["payloads"]["mapping"][0]["precipitation_mm"] = 999.0
    res = verify_climate_crop_provenance(t)
    assert res["valid"] is False
    assert {"code": "MAPPING_HASH_MISMATCH"} in res["errors"]


def test_tamper_step_result_detection():
    r = run_climate_crop_workflow(_input())
    t = json.loads(json.dumps(r["provenance"]))
    t["payloads"]["simulation_result"]["steps"][0]["final_storage_mm"] += 5.0
    res = verify_climate_crop_provenance(t)
    assert res["valid"] is False
    assert {"code": "STEP_HASH_MISMATCH"} in res["errors"]


# --- runtime / API ---------------------------------------------------------

def test_runtime_execution():
    store = JobStore(":memory:")
    reg = build_registry()
    rid = store.create_run("eco-nojin.hydroma.climate-crop-workflow", "1.0.0", "alice", _input())
    run = execute_run(store, rid, reg)
    assert run["status"] == "completed"
    assert run["result_json"]["status"] == "COMPLETED"
    assert run["result_json"]["simulation"]["result"]["final_storage_mm"] > 0


def test_api_execution():
    c = TestClient(create_app())
    resp = c.post("/v1/runs", json={"model_id": "eco-nojin.hydroma.climate-crop-workflow",
                                    "input": _input()})
    assert resp.status_code == 202
    run = c.get(f"/v1/runs/{resp.json()['run_id']}").json()
    assert run["status"] == "completed"
    assert run["result_json"]["status"] == "COMPLETED"
    prov = c.get(f"/v1/runs/{resp.json()['run_id']}/provenance")
    assert prov.status_code == 200


def test_api_missing_source_is_structured_error():
    c = TestClient(create_app())
    resp = c.post("/v1/runs", json={"model_id": "eco-nojin.hydroma.climate-crop-workflow",
                                    "input": {"periods": _periods(), "soil": {"layers": _LAYERS, "initial_storage_mm": 60.0}}})
    run = c.get(f"/v1/runs/{resp.json()['run_id']}").json()
    assert run["status"] == "completed"
    assert run["result_json"]["status"] == "FAILED"
    assert run["result_json"]["reason_code"] == "INVALID_INPUT"


def test_architecture_boundary_no_forbidden_imports():
    import ast
    import os
    path = os.path.join("hydroma", "climate_crop_workflow.py")
    tree = ast.parse(open(path, encoding="utf-8").read())
    roots = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            roots.update(a.name.split(".")[0] for a in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            roots.add(node.module.split(".")[0])
    forbidden = {"fastapi", "starlette", "pystac", "rasterio", "flask", "django", "httpx"}
    assert roots & forbidden == set()


# --- Phase 3.21 stress-aware scenario --------------------------------------

def _stress_input(**over):
    inp = {
        "source": _source(),
        "periods": _periods(),
        "soil": {"layers": _LAYERS, "initial_storage_mm": 60.0, "p": 0.5},
        "et0_config": _ET0_CFG,
        "scenario": "STRESS_ADJUSTED_ET",
    }
    inp.update(over)
    return inp


def test_demand_mode_is_default_and_unchanged():
    r = run_climate_crop_workflow(_input())
    assert r["scenario"] == "DEMAND_BASED_NO_STRESS"
    assert all(m["et_source"] == "crop_etc" for m in r["mappings"])
    assert r["simulation"]["result"]["final_storage_mm"] == 65.9721


def test_stress_mode_no_stress_matches_demand():
    r = run_climate_crop_workflow(_stress_input())
    assert r["status"] == "COMPLETED"
    assert r["scenario"] == "STRESS_ADJUSTED_ET"
    assert all(m["et_source"] == "stress_adjusted_eta" for m in r["mappings"])
    assert all(m["ks"] == 1.0 for m in r["mappings"])
    assert r["simulation"]["result"]["final_storage_mm"] == 65.9721


def test_stress_mode_deficit_reduces_et():
    r = run_climate_crop_workflow(_stress_input(soil={"layers": _LAYERS, "initial_storage_mm": 35.0, "p": 0.5}))
    assert r["status"] == "COMPLETED"
    for m in r["mappings"]:
        assert m["ks"] < 1.0
        assert m["eta_mm"] < m["etc_mm"]
    # ETa is the sink, not ETc
    assert r["simulation"]["result"]["steps"][0]["eta_mm"] == r["mappings"][0]["eta_mm"]


def test_stress_mode_missing_p_rejected():
    r = run_climate_crop_workflow(_stress_input(soil={"layers": _LAYERS, "initial_storage_mm": 60.0}))
    assert r["status"] == "FAILED"
    assert r["reason_code"] == "MISSING_P"


def test_stress_mode_invalid_scenario_rejected():
    r = run_climate_crop_workflow(_input(scenario="BOGUS"))
    assert r["status"] == "FAILED"
    assert r["reason_code"] == "INVALID_SCENARIO"


def test_stress_mode_scenario_in_provenance():
    r = run_climate_crop_workflow(_stress_input())
    assert r["provenance"]["scenario"] == "STRESS_ADJUSTED_ET"
    assert r["stress"]["p"] == 0.5


def test_scenarios_are_distinguishable():
    demand = run_climate_crop_workflow(_input())
    stress = run_climate_crop_workflow(_stress_input())
    assert demand["scenario"] != stress["scenario"]
    assert demand["provenance"]["scenario"] != stress["provenance"]["scenario"]
    assert demand["mappings"][0]["et_source"] != stress["mappings"][0]["et_source"]


def test_stress_mode_provenance_verifies_and_survives_serialization():
    r = run_climate_crop_workflow(_stress_input(soil={"layers": _LAYERS, "initial_storage_mm": 35.0, "p": 0.5}))
    prov = r["provenance"]
    assert verify_climate_crop_provenance(prov)["valid"] is True
    assert verify_climate_crop_provenance(json.loads(json.dumps(prov)))["valid"] is True


def test_stress_mode_hash_tamper_detected():
    r = run_climate_crop_workflow(_stress_input(soil={"layers": _LAYERS, "initial_storage_mm": 35.0, "p": 0.5}))
    t = json.loads(json.dumps(r["provenance"]))
    t["payloads"]["mapping"][0]["eta_mm"] = 999.0
    res = verify_climate_crop_provenance(t)
    assert res["valid"] is False
    assert {"code": "MAPPING_HASH_MISMATCH"} in res["errors"]


def test_stress_mode_runtime_execution():
    store = JobStore(":memory:")
    reg = build_registry()
    rid = store.create_run("eco-nojin.hydroma.climate-crop-workflow", "1.0.0", "alice", _stress_input())
    run = execute_run(store, rid, reg)
    assert run["status"] == "completed"
    assert run["result_json"]["scenario"] == "STRESS_ADJUSTED_ET"


def test_stress_mode_api_execution():
    c = TestClient(create_app())
    resp = c.post("/v1/runs", json={"model_id": "eco-nojin.hydroma.climate-crop-workflow",
                                    "input": _stress_input()})
    assert resp.status_code == 202
    run = c.get(f"/v1/runs/{resp.json()['run_id']}").json()
    assert run["status"] == "completed"
    assert run["result_json"]["scenario"] == "STRESS_ADJUSTED_ET"


def test_water_stress_model_registered_and_executable():
    store = JobStore(":memory:")
    reg = build_registry()
    rid = store.create_run("eco-nojin.hydroma.water-stress", "1.0.0", "alice",
                           {"layers": _LAYERS, "initial_storage_mm": 45.0, "et0_mm": 5.0,
                            "kc": 0.8, "p": 0.5, "precipitation_mm": 0.0})
    run = execute_run(store, rid, reg)
    assert run["status"] == "completed"
    assert run["result_json"]["result"]["ks"] == 0.5


def test_stress_mode_p_one_rejected():
    r = run_climate_crop_workflow(_stress_input(soil={"layers": _LAYERS, "initial_storage_mm": 60.0, "p": 1.0}))
    assert r["status"] == "FAILED"
    assert r["reason_code"] == "INVALID_P"


# --- Phase 3.24 irrigation-application scenario ----------------------------

def _irrigation_input(**over):
    inp = {
        "source": _source(),
        "periods": _periods(irrigation_mm=10.0),
        "soil": {"layers": _LAYERS, "initial_storage_mm": 40.0, "p": 0.5},
        "et0_config": _ET0_CFG,
        "scenario": "IRRIGATION_APPLICATION",
        "demand_target": {"target_policy": "RAW"},
    }
    inp.update(over)
    return inp


def test_irrigation_application_scenario():
    r = run_climate_crop_workflow(_irrigation_input())
    assert r["status"] == "COMPLETED"
    assert r["scenario"] == "IRRIGATION_APPLICATION"
    assert len(r["irrigation_demand"]) == 2
    for d in r["irrigation_demand"]:
        assert d["demand_decision"] == "DEMAND"


def test_demand_not_auto_applied():
    # explicit applied irrigation (10) is distinct from calculated demand (20)
    r = run_climate_crop_workflow(_irrigation_input(periods=_periods(irrigation_mm=10.0)[:1]))
    d = r["irrigation_demand"][0]
    assert d["calculated_net_demand_mm"] == 20.0
    assert d["explicit_applied_irrigation_mm"] == 10.0
    assert d["demand_application_difference_mm"] == -10.0  # unmet


def test_zero_irrigation():
    r = run_climate_crop_workflow(_irrigation_input(periods=_periods(irrigation_mm=0.0)[:1]))
    d = r["irrigation_demand"][0]
    assert d["explicit_applied_irrigation_mm"] == 0.0
    assert d["calculated_net_demand_mm"] == 20.0
    assert d["demand_application_difference_mm"] == -20.0


def test_demand_fully_met():
    r = run_climate_crop_workflow(_irrigation_input(periods=_periods(irrigation_mm=20.0)[:1]))
    d = r["irrigation_demand"][0]
    assert d["calculated_net_demand_mm"] == 20.0
    assert d["explicit_applied_irrigation_mm"] == 20.0
    assert d["demand_application_difference_mm"] == 0.0


def test_no_duplicate_irrigation_flux():
    r = run_climate_crop_workflow(_irrigation_input(periods=_periods(irrigation_mm=10.0)[:1]))
    sim_step = r["simulation"]["result"]["steps"][0]
    d = r["irrigation_demand"][0]
    # explicit irrigation enters once; demand is not added to the balance
    assert sim_step["irrigation_mm"] == 10.0
    assert sim_step["irrigation_mm"] == d["explicit_applied_irrigation_mm"]


def test_irrigation_scenario_water_balance_closure():
    r = run_climate_crop_workflow(_irrigation_input())
    for s in r["simulation"]["result"]["steps"]:
        assert abs(s["algebraic_closure_residual_mm"]) < 1e-6


def test_irrigation_scenario_sequential_continuity():
    r = run_climate_crop_workflow(_irrigation_input())
    steps = r["simulation"]["result"]["steps"]
    assert steps[1]["initial_storage_mm"] == steps[0]["final_storage_mm"]
    assert r["irrigation_demand"][1]["storage_before_mm"] == steps[1]["initial_storage_mm"]


def test_irrigation_scenario_deterministic():
    a = run_climate_crop_workflow(_irrigation_input())
    b = run_climate_crop_workflow(_irrigation_input())
    assert json.dumps(a["irrigation_demand"], sort_keys=True) == json.dumps(b["irrigation_demand"], sort_keys=True)


def test_irrigation_scenario_provenance_demand_hash():
    r = run_climate_crop_workflow(_irrigation_input())
    assert "demand_hash" in r["provenance"]
    assert verify_climate_crop_provenance(r["provenance"])["valid"] is True
    t = json.loads(json.dumps(r["provenance"]))
    t["payloads"]["irrigation_demand"][0]["explicit_applied_irrigation_mm"] = 999.0
    assert verify_climate_crop_provenance(t)["valid"] is False


def test_irrigation_scenario_climate_rejection():
    src = _source()
    for o in src["observations"]:
        if o["variable"] == "precipitation":
            o["value"] = -5.0
    r = run_climate_crop_workflow(_irrigation_input(source=src))
    assert r["status"] == "BLOCKED"


def test_irrigation_scenario_missing_p():
    r = run_climate_crop_workflow(_irrigation_input(soil={"layers": _LAYERS, "initial_storage_mm": 40.0}))
    assert r["status"] == "FAILED"
    assert r["reason_code"] == "MISSING_P"


def test_irrigation_scenario_invalid_demand_target_preserves_status():
    r = run_climate_crop_workflow(_irrigation_input(demand_target={"target_policy": "BOGUS"}))
    assert r["status"] == "COMPLETED"  # application still runs; demand is flagged per period
    assert all(d["demand_decision"] == "INVALID" for d in r["irrigation_demand"])
    assert all("demand_errors" in d for d in r["irrigation_demand"])


def test_irrigation_scenario_runtime():
    store = JobStore(":memory:")
    reg = build_registry()
    rid = store.create_run("eco-nojin.hydroma.climate-crop-workflow", "1.0.0", "alice", _irrigation_input())
    run = execute_run(store, rid, reg)
    assert run["status"] == "completed"
    assert run["result_json"]["scenario"] == "IRRIGATION_APPLICATION"


def test_irrigation_scenario_api():
    c = TestClient(create_app())
    resp = c.post("/v1/runs", json={"model_id": "eco-nojin.hydroma.climate-crop-workflow",
                                    "input": _irrigation_input()})
    run = c.get(f"/v1/runs/{resp.json()['run_id']}").json()
    assert run["status"] == "completed"
    assert run["result_json"]["scenario"] == "IRRIGATION_APPLICATION"


# --- Phase 3.25 irrigation-outcome analytics -------------------------------

def test_analytics_full_fulfillment():
    r = run_climate_crop_workflow(_irrigation_input(periods=_periods(irrigation_mm=20.0)[:1]))
    a = r["irrigation_analytics"]["periods"][0]
    assert a["demand_coverage_fraction"] == 1.0
    assert a["demand_fulfillment_status"] == "FULLY_MET"
    assert a["unmet_demand_mm"] == 0.0


def test_analytics_partial_fulfillment():
    r = run_climate_crop_workflow(_irrigation_input(periods=_periods(irrigation_mm=10.0)[:1]))
    a = r["irrigation_analytics"]["periods"][0]
    assert a["demand_coverage_fraction"] == 0.5
    assert a["demand_fulfillment_status"] == "PARTIALLY_MET"
    assert a["unmet_demand_mm"] == 10.0


def test_analytics_zero_application():
    r = run_climate_crop_workflow(_irrigation_input(periods=_periods(irrigation_mm=0.0)[:1]))
    a = r["irrigation_analytics"]["periods"][0]
    assert a["demand_coverage_fraction"] == 0.0
    assert a["demand_fulfillment_status"] == "UNMET"
    assert a["unmet_demand_mm"] == 20.0


def test_analytics_zero_demand():
    r = run_climate_crop_workflow(_irrigation_input(
        periods=_periods(irrigation_mm=0.0)[:1],
        soil={"layers": _LAYERS, "initial_storage_mm": 80.0, "p": 0.5}))
    a = r["irrigation_analytics"]["periods"][0]
    assert a["demand_fulfillment_status"] == "NO_DEMAND"
    assert a["demand_coverage_fraction"] == 1.0
    assert a["unmet_demand_mm"] == 0.0


def test_analytics_excess_application():
    r = run_climate_crop_workflow(_irrigation_input(periods=_periods(irrigation_mm=30.0)[:1]))
    a = r["irrigation_analytics"]["periods"][0]
    assert a["demand_coverage_fraction"] == 1.0
    assert a["application_excess_mm"] == 10.0
    assert a["unmet_demand_mm"] == 0.0


def test_analytics_invalid_demand():
    r = run_climate_crop_workflow(_irrigation_input(demand_target={"target_policy": "BOGUS"}))
    a = r["irrigation_analytics"]["periods"][0]
    assert a["demand_fulfillment_status"] == "INVALID"
    assert a["demand_coverage_fraction"] is None
    assert r["irrigation_analytics"]["summary"]["valid_period_count"] == 0


def test_analytics_gross_net_consistency():
    r = run_climate_crop_workflow(_irrigation_input(
        periods=_periods(irrigation_mm=10.0)[:1],
        demand_target={"target_policy": "RAW", "application_efficiency": 0.8}))
    a = r["irrigation_analytics"]["periods"][0]
    assert a["calculated_net_demand_mm"] == 20.0
    assert a["calculated_gross_demand_mm"] == 25.0
    # applied is compared to net, not gross
    assert a["explicit_applied_irrigation_mm"] == 10.0


def test_analytics_summary_totals():
    r = run_climate_crop_workflow(_irrigation_input())  # 2 periods, 10 each
    s = r["irrigation_analytics"]["summary"]
    assert s["period_count"] == 2
    assert s["valid_period_count"] == 2
    assert s["total_explicit_irrigation_mm"] == 20.0
    assert s["periods_with_positive_demand"] == 2
    assert abs(s["total_valid_calculated_demand_mm"]
               - sum(d["calculated_net_demand_mm"] for d in r["irrigation_demand"])) < 1e-6


def test_analytics_storage_trajectory():
    r = run_climate_crop_workflow(_irrigation_input())
    s = r["irrigation_analytics"]["summary"]
    steps = r["simulation"]["result"]["steps"]
    traj = [steps[0]["initial_storage_mm"]] + [st["final_storage_mm"] for st in steps]
    assert s["initial_storage_mm"] == traj[0]
    assert s["final_storage_mm"] == traj[-1]
    assert s["min_storage_mm"] == min(traj)
    assert s["max_storage_mm"] == max(traj)
    assert abs(s["total_storage_change_mm"] - (s["final_storage_mm"] - s["initial_storage_mm"])) < 1e-6


def test_analytics_deterministic():
    a = run_climate_crop_workflow(_irrigation_input())
    b = run_climate_crop_workflow(_irrigation_input())
    assert json.dumps(a["irrigation_analytics"], sort_keys=True) == json.dumps(b["irrigation_analytics"], sort_keys=True)


def test_analytics_provenance_hash():
    r = run_climate_crop_workflow(_irrigation_input())
    assert "analytics_hash" in r["provenance"]
    assert verify_climate_crop_provenance(r["provenance"])["valid"] is True
    t = json.loads(json.dumps(r["provenance"]))
    t["payloads"]["irrigation_analytics"]["summary"]["total_explicit_irrigation_mm"] = 999.0
    assert verify_climate_crop_provenance(t)["valid"] is False


def test_analytics_json_roundtrip():
    r = run_climate_crop_workflow(_irrigation_input())
    reloaded = json.loads(json.dumps(r["provenance"]))
    assert verify_climate_crop_provenance(reloaded)["valid"] is True