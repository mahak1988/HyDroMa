"""Climate-Driven Multi-Period Crop Water Workflow (Phase 3.20).

An orchestration that connects the **existing** accepted-climate pipeline to the
**existing** FAO-56 ET0, crop ETc, effective-precipitation and multi-period
soil-water models. It does not reimplement any of them; it wires them together
with an explicit, verifiable climate-variable binding and a provenance chain.

Sequence
--------
1. climate ingestion + contract + QC + acceptance  (``ingest_and_accept_climate``)
2. MODEL_READY gate (rejected/pending climate never reaches the models)
3. FAO-56 ET0 over the accepted series             (``climate_et0.compute_et0_series``)
4. per-period crop ETc = Kc * ET0                  (``crop_etc.compute_crop_etc``)
5. per-period effective precipitation (SCS-CN)     (``effective_precip.compute_effective_precipitation``)
6. per-period precipitation binding (exact accumulation interval)
7. multi-period soil-water simulation              (``multi_period_sim.simulate_multi_period``)
8. provenance + verification

Explicit semantics (no conflation)
----------------------------------
* ETc is crop **demand**; it is *not* labelled actual ET. When no explicit
  ``et_actual_mm`` is supplied, ETc is used as the soil-water ET sink and the
  binding records ``et_source="crop_etc"`` / ``et_is_actual=False``.
* Total precipitation feeds the root-zone balance; SCS-CN effective precipitation
  is a *separate* accounting view and is never summed with total precipitation.
* Irrigation is an explicit per-period net depth supplied by the caller. The
  workflow never auto-schedules irrigation and never applies an end-of-period
  recommendation to the same period.
* Periods must be whole days (no implicit sub-daily/multi-day aggregation).
* No interpolation, filling, resampling or timezone normalisation.

Software-tested; scientific status **NOT_VALIDATED**.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .climate import ClimateSeries
from .climate_et0 import ET0IntegrationConfig, compute_et0_series
from .climate_qc_integration import (
    _coerce_config,
    _coerce_qc_policy,
    _coerce_source,
    _find_precip,
    _json_safe,
    ingest_and_accept_climate,
)
from .crop_etc import compute_crop_etc
from .effective_precip import compute_effective_precipitation
from .multi_period_sim import simulate_multi_period
from .provenance import sha256_json
from .water_stress import compute_stress_aware_series
from .irrigation_demand import compute_irrigation_demand

__all__ = [
    "CLIMATE_CROP_WORKFLOW_MODEL",
    "CLIMATE_CROP_WORKFLOW_DEFINITION",
    "WORKFLOW_VERSION",
    "MAPPING_VERSION",
    "run_climate_crop_workflow",
    "climate_crop_workflow_adapter",
    "verify_climate_crop_provenance",
]

WORKFLOW_VERSION = "1.0.0"
MAPPING_VERSION = "1.0.0"
WORKFLOW_ID = "eco-nojin.hydroma.climate-crop-workflow"
_EPS = 1e-9

CLIMATE_CROP_WORKFLOW_MODEL = {
    "id": WORKFLOW_ID,
    "version": WORKFLOW_VERSION,
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "stages": [
        "climate_ingest", "climate_qc_accept", "model_ready", "et0",
        "etc", "effective_precip", "precip_binding", "soil_water_sim",
    ],
}

ASSUMPTIONS = [
    "reuses_existing_models",
    "daily_periods_only",
    "explicit_crop_coefficient",
    "etc_not_actual_et",
    "no_irrigation_auto_schedule",
    "explicit_climate_binding",
]
LIMITATIONS = [
    "notValidated",
    "no_water_stress_actual_et",
    "single_root_zone_bucket",
    "no_crop_database",
    "daily_periods_only",
    "scs_cn_effective_precip_separate_view",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). FAO Irrigation and Drainage Paper 56.",
    "USDA Soil Conservation Service (1972). Hydrology Section 4, National Engineering Handbook.",
]


def _err(code: str, field: str, message: str, **extra) -> Dict[str, Any]:
    d = {"code": code, "field": field, "message": message}
    d.update(extra)
    return d


def _parse_ts(value: Any) -> datetime:
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def _date_of(timestamp: Any) -> Optional[str]:
    text = str(timestamp).strip()
    if len(text) >= 10 and text[4] == "-" and text[7] == "-":
        return text[:10]
    try:
        return _parse_ts(text).date().isoformat()
    except (ValueError, TypeError):
        return None


def _coerce_et0_config(cfg) -> ET0IntegrationConfig:
    if cfg is None:
        return ET0IntegrationConfig()
    if isinstance(cfg, ET0IntegrationConfig):
        return cfg
    if isinstance(cfg, dict):
        allowed = {"variable_mapping", "derive_mean_from_minmax", "elevation_m",
                   "quality_policy", "missing_day_policy", "max_records"}
        return ET0IntegrationConfig(**{k: v for k, v in cfg.items() if k in allowed})
    raise ValueError("et0_config must be an ET0IntegrationConfig or an object")


def _validate_period(p: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    ps, pe = p.get("period_start"), p.get("period_end")
    try:
        s, e = _parse_ts(ps), _parse_ts(pe)
    except (ValueError, TypeError):
        return _err("INVALID_TIMESTAMP", "period", "period_start/period_end must be ISO timestamps")
    if (s.tzinfo is None) != (e.tzinfo is None):
        return _err("INVALID_TIMEZONE", "period", "period_start/period_end must share timezone awareness")
    if e <= s:
        return _err("INVALID_INTERVAL", "period", "period_end must be after period_start")
    if (e - s) != timedelta(days=1):
        return _err("UNSUPPORTED_PERIOD_DURATION", "period",
                    "only whole-day periods are supported (no implicit aggregation)")
    if p.get("kc") is None:
        return _err("MISSING_KC", "kc", "a crop coefficient (kc) is required per period")
    return None


def _acceptance_payload(acc: Dict[str, Any]) -> Dict[str, Any]:
    prov = acc.get("provenance") or {}
    return {
        "accepted_series_hash": prov.get("normalized_dataset_hash"),
        "unit_policy": prov.get("unit_policy"),
        "contract_valid": bool(acc.get("contract_valid")),
        "qc_policy_hash": sha256_json(prov.get("qc_config")),
        "qc_report_hash": prov.get("qc_hash"),
        "status": acc.get("status"),
        "reason": (acc.get("acceptance") or {}).get("reason"),
    }


def _build_provenance(acc, et0, etc_records, ep_records, mappings, sim_input, sim, scenario="DEMAND_BASED_NO_STRESS", demand_records=None, analytics=None) -> Dict[str, Any]:
    et0_prov = et0.provenance if hasattr(et0, "provenance") else {}
    acceptance_payload = _acceptance_payload(acc)
    et0_payload = {
        "climate_series_hash": et0_prov.get("climate_series_hash"),
        "variable_mapping": et0_prov.get("variable_mapping"),
        "elevation_m": et0_prov.get("elevation_m"),
        "records": et0.records,
    }
    ep_payload = {"records": ep_records}
    sim_prov = sim.get("provenance") or {}
    payloads = {
        "acceptance": acceptance_payload,
        "et0": et0_payload,
        "etc": etc_records,
        "effective_precipitation": ep_payload,
        "mapping": mappings,
        "simulation_input": sim_input,
        "simulation_result": sim_prov.get("result_payload"),
    }
    provenance = {
        "workflow_version": WORKFLOW_VERSION,
        "mapping_version": MAPPING_VERSION,
        "scenario": scenario,
        "acceptance_hash": sha256_json(acceptance_payload),
        "et0_hash": sha256_json(et0_payload),
        "etc_hash": sha256_json(etc_records),
        "effective_precipitation_hash": sha256_json(ep_payload),
        "mapping_hash": sha256_json(mappings),
        "simulation_input_hash": sha256_json(sim_input),
        "step_input_hashes": sim_prov.get("step_hashes"),
        "final_result_hash": sim_prov.get("result_hash"),
    }
    if demand_records is not None:
        provenance["demand_hash"] = sha256_json(demand_records)
        payloads["irrigation_demand"] = demand_records
    if analytics is not None:
        provenance["analytics_hash"] = sha256_json(analytics)
        payloads["irrigation_analytics"] = analytics
    provenance["payloads"] = payloads
    return provenance


def _fulfillment_status(applied: float, demand: Optional[float]) -> str:
    if demand is None:
        return "INVALID"
    if demand <= _EPS:
        return "NO_DEMAND"
    if applied >= demand - _EPS:
        return "FULLY_MET"
    if applied > _EPS:
        return "PARTIALLY_MET"
    return "UNMET"


def _demand_coverage(applied: float, demand: Optional[float]) -> Optional[float]:
    if demand is None:
        return None
    if demand <= _EPS:
        return 1.0  # no demand to cover
    return min(applied / demand, 1.0)


def _build_irrigation_analytics(bindings, stress_steps, demand_records) -> Dict[str, Any]:
    """Per-period and scenario-level irrigation-outcome analytics (derived only)."""
    periods: List[dict] = []
    for b, s, d in zip(bindings, stress_steps, demand_records):
        applied = round(float(b["irrigation"]), 4)
        valid = d.get("demand_decision") != "INVALID"
        net = d.get("calculated_net_demand_mm") if valid else None
        gross = d.get("calculated_gross_demand_mm") if valid else None
        unmet = round(max(net - applied, 0.0), 4) if net is not None else None
        excess = round(max(applied - net, 0.0), 4) if net is not None else None
        coverage = _demand_coverage(applied, net)
        periods.append({
            "step": b["index"],
            "period_start": b["ps"], "period_end": b["pe"],
            "storage_before_mm": s["initial_storage_mm"],
            "storage_after_mm": s["final_storage_mm"],
            "storage_change_mm": round(s["final_storage_mm"] - s["initial_storage_mm"], 4),
            "calculated_net_demand_mm": net,
            "calculated_gross_demand_mm": gross,
            "explicit_applied_irrigation_mm": applied,
            "demand_application_difference_mm": d.get("demand_application_difference_mm"),
            "demand_coverage_fraction": round(coverage, 4) if coverage is not None else None,
            "demand_fulfillment_status": _fulfillment_status(applied, net),
            "unmet_demand_mm": unmet,
            "application_excess_mm": excess,
            "period_et0_mm": round(float(b["et0"]), 4),
            "period_etc_mm": round(float(b["etc"]), 4),
            "period_eta_mm": s["eta_mm"],
            "period_precipitation_mm": s["precipitation_mm"],
            "period_effective_precipitation_mm": b["ep_val"],
            "period_runoff_mm": s["runoff_mm"],
            "period_deep_percolation_mm": s["deep_percolation_mm"],
            "domain_status": s["status"],
        })

    valid_periods = [p for p in periods if p["demand_fulfillment_status"] != "INVALID"]
    total_valid_demand = sum(p["calculated_net_demand_mm"] for p in valid_periods)
    total_unmet = sum(p["unmet_demand_mm"] for p in valid_periods)
    total_excess = sum(p["application_excess_mm"] for p in valid_periods)
    overall_coverage = ((total_valid_demand - total_unmet) / total_valid_demand) if total_valid_demand > _EPS else 1.0
    trajectory: List[float] = []
    if stress_steps:
        trajectory = [stress_steps[0]["initial_storage_mm"]] + [s["final_storage_mm"] for s in stress_steps]

    summary = {
        "period_count": len(periods),
        "valid_period_count": len(valid_periods),
        "invalid_period_count": len(periods) - len(valid_periods),
        "periods_with_positive_demand": sum(1 for p in valid_periods if p["calculated_net_demand_mm"] > _EPS),
        "periods_fully_met": sum(1 for p in valid_periods if p["demand_fulfillment_status"] == "FULLY_MET"),
        "periods_with_unmet_demand": sum(1 for p in valid_periods if (p["unmet_demand_mm"] or 0.0) > _EPS),
        "total_explicit_irrigation_mm": round(sum(p["explicit_applied_irrigation_mm"] for p in periods), 4),
        "total_valid_calculated_demand_mm": round(total_valid_demand, 4),
        "total_unmet_demand_mm": round(total_unmet, 4),
        "total_application_excess_mm": round(total_excess, 4),
        "overall_demand_coverage_fraction": round(min(max(overall_coverage, 0.0), 1.0), 4),
        "initial_storage_mm": trajectory[0] if trajectory else None,
        "final_storage_mm": trajectory[-1] if trajectory else None,
        "total_storage_change_mm": round(trajectory[-1] - trajectory[0], 4) if trajectory else None,
        "min_storage_mm": round(min(trajectory), 4) if trajectory else None,
        "max_storage_mm": round(max(trajectory), 4) if trajectory else None,
        "total_precipitation_mm": round(sum(s["precipitation_mm"] for s in stress_steps), 4),
        "total_eta_mm": round(sum(s["eta_mm"] for s in stress_steps), 4),
        "total_runoff_mm": round(sum(s["runoff_mm"] for s in stress_steps), 4),
        "total_deep_percolation_mm": round(sum(s["deep_percolation_mm"] for s in stress_steps), 4),
        "total_excess_mm": round(sum(s["excess_mm"] for s in stress_steps), 4),
        "aggregation_rules": "sums/counts over valid (non-INVALID) periods; overall coverage derived from totals, not by averaging percentages",
    }
    return {"periods": periods, "summary": summary}


def verify_climate_crop_provenance(record: Optional[dict]) -> Dict[str, Any]:
    """Recompute every deterministic hash from the stored payloads.

    Detects tampering of the acceptance, ET0, ETc, effective-precipitation,
    mapping, simulation-input and step/final result payloads. Integrity/replay
    only -- never scientific validation.
    """
    errors: List[Dict[str, Any]] = []
    if not isinstance(record, dict):
        return {"valid": False, "errors": [{"code": "INVALID_PROVENANCE_RECORD"}]}
    p = record.get("payloads") or {}
    checks = [
        ("acceptance_hash", "acceptance"),
        ("et0_hash", "et0"),
        ("etc_hash", "etc"),
        ("effective_precipitation_hash", "effective_precipitation"),
        ("mapping_hash", "mapping"),
        ("simulation_input_hash", "simulation_input"),
        ("demand_hash", "irrigation_demand"),
        ("analytics_hash", "irrigation_analytics"),
    ]
    for hash_key, payload_key in checks:
        if payload_key in p and record.get(hash_key) != sha256_json(p[payload_key]):
            errors.append({"code": f"{hash_key.upper()}_MISMATCH"})
    sim_result = p.get("simulation_result")
    if isinstance(sim_result, dict):
        if record.get("step_input_hashes") != [sha256_json(step) for step in (sim_result.get("steps") or [])]:
            errors.append({"code": "STEP_HASH_MISMATCH"})
        if record.get("final_result_hash") != sha256_json(sim_result):
            errors.append({"code": "FINAL_RESULT_HASH_MISMATCH"})
    return {"valid": len(errors) == 0, "errors": errors}


def run_climate_crop_workflow(input_data: Optional[dict] = None) -> Dict[str, Any]:
    """Run the climate-driven multi-period crop-water workflow. Never raises on bad input."""
    input_data = input_data or {}
    periods = input_data.get("periods")
    soil = input_data.get("soil")

    if not isinstance(periods, list) or not periods:
        return {"status": "FAILED", "reason_code": "INVALID_PERIODS",
                "errors": [_err("INVALID_PERIODS", "periods", "periods must be a non-empty list")]}
    if not isinstance(soil, dict):
        return {"status": "FAILED", "reason_code": "INVALID_SOIL",
                "errors": [_err("INVALID_SOIL", "soil", "soil must be an object")]}
    if not isinstance(soil.get("layers"), list) or not soil.get("layers"):
        return {"status": "FAILED", "reason_code": "INVALID_SOIL",
                "errors": [_err("INVALID_LAYERS", "soil.layers", "soil.layers must be a non-empty list")]}
    if soil.get("initial_storage_mm") is None:
        return {"status": "FAILED", "reason_code": "INVALID_SOIL",
                "errors": [_err("INVALID_INITIAL", "soil.initial_storage_mm", "initial storage is required")]}

    # 1. climate ingestion + QC + acceptance (canonical)
    try:
        config = _coerce_config(input_data.get("config"))
        qc_policy = _coerce_qc_policy(input_data.get("qc_policy"))
        source = _coerce_source(input_data.get("source"))
    except (ValueError, TypeError) as exc:
        return {"status": "FAILED", "reason_code": "INVALID_INPUT", "errors": [_err("INVALID_INPUT", "source", str(exc))]}
    unit_policy = input_data.get("unit_policy", "LEGACY")
    acc = ingest_and_accept_climate(source, config, qc_policy, unit_policy)
    if not acc["model_ready"]:
        return {"status": "BLOCKED", "reason_code": acc["reason_code"], "acceptance": acc}

    # 2. ET0 (existing FAO-56 integration)
    try:
        et0_cfg = _coerce_et0_config(input_data.get("et0_config"))
    except (ValueError, TypeError) as exc:
        return {"status": "FAILED", "reason_code": "INVALID_ET0_CONFIG", "errors": [_err("INVALID_ET0_CONFIG", "et0_config", str(exc))]}
    et0 = compute_et0_series(acc["series"], et0_cfg)
    if not et0.records:
        return {"status": "FAILED", "reason_code": "ET0_UNAVAILABLE", "acceptance": acc, "et0": et0.to_dict()}
    et0_by_date = {r["date"]: r for r in et0.records}

    # 3. per-period binding (ET0, ETc, precipitation, effective precipitation)
    scenario = input_data.get("scenario", "DEMAND_BASED_NO_STRESS")
    if scenario not in ("DEMAND_BASED_NO_STRESS", "STRESS_ADJUSTED_ET", "IRRIGATION_APPLICATION"):
        return {"status": "FAILED", "reason_code": "INVALID_SCENARIO",
                "errors": [_err("INVALID_SCENARIO", "scenario", f"unknown scenario: {scenario!r}")]}

    bindings: List[dict] = []
    etc_records: List[dict] = []
    ep_records: List[dict] = []
    for i, p in enumerate(periods):
        perr = _validate_period(p)
        if perr:
            return {"status": "FAILED", "reason_code": perr["code"], "step": i, "errors": [perr], "acceptance": acc}
        ps, pe = p["period_start"], p["period_end"]
        et0_date = _date_of(ps)
        et0_rec = et0_by_date.get(et0_date)
        if et0_rec is None:
            return {"status": "FAILED", "reason_code": "ET0_MISSING", "step": i,
                    "errors": [_err("ET0_MISSING", "et0", f"no ET0 for date {et0_date}")], "acceptance": acc}
        et0_val = float(et0_rec["et0_mm_per_day"])

        etc_res = compute_crop_etc({"et0_mm": et0_val, "kc": p.get("kc"), "period": "period"})
        if not etc_res["ok"]:
            return {"status": "FAILED", "reason_code": "ETC_ERROR", "step": i,
                    "errors": etc_res["errors"], "acceptance": acc}
        etc_val = float(etc_res["result"]["etc_mm"])

        obs, bind_err = _find_precip(acc["series"], ps, pe)
        if bind_err:
            return {"status": "FAILED", "reason_code": "PRECIP_BINDING_ERROR", "step": i,
                    "errors": [_err(bind_err, "precipitation", f"precipitation binding failed for step {i}")],
                    "acceptance": acc}
        if obs.unit != "mm":
            return {"status": "FAILED", "reason_code": "PRECIP_BINDING_ERROR", "step": i,
                    "errors": [_err("INVALID_UNIT", "precipitation",
                                    f"precipitation unit must be mm (got {obs.unit!r}); no implicit conversion")],
                    "acceptance": acc}
        precip = float(obs.value)

        cn = p.get("curve_number")
        if cn is not None:
            ep_res = compute_effective_precipitation({"precipitation_mm": precip, "curve_number": cn, "period": "period"})
            if not ep_res["ok"]:
                return {"status": "FAILED", "reason_code": "EFFECTIVE_PRECIP_ERROR", "step": i,
                        "errors": ep_res["errors"], "acceptance": acc}
            ep_val: Optional[float] = float(ep_res["result"]["effective_precipitation_mm"])
            ep_status = "COMPLETED"
        else:
            ep_val = None
            ep_status = "NOT_AVAILABLE"

        bindings.append({
            "index": i, "ps": ps, "pe": pe, "et0_date": et0_date, "et0": et0_val,
            "kc": float(p["kc"]), "etc": etc_val, "precip": precip,
            "precip_observation": {
                "variable": obs.variable, "unit": obs.unit, "timestamp": obs.timestamp,
                "accumulation_start": obs.accumulation_start, "accumulation_end": obs.accumulation_end,
                "value": obs.value, "quality": obs.quality,
            },
            "ep_val": ep_val, "curve_number": cn,
            "irrigation": float(p.get("irrigation_mm", 0.0)),
            "runoff": float(p.get("runoff_mm", 0.0)),
            "deep_perc": p.get("deep_percolation_mm"),
            "et_actual_mm": p.get("et_actual_mm"),
            "p": p.get("p"),
        })
        etc_records.append({"step": i, "date": et0_date, "et0_mm": et0_val, "kc": float(p["kc"]), "etc_mm": etc_val})
        ep_records.append({"step": i, "curve_number": cn, "effective_precipitation_mm": ep_val, "status": ep_status})

    # 4. scenario-specific simulation
    if scenario in ("STRESS_ADJUSTED_ET", "IRRIGATION_APPLICATION"):
        p_global = soil.get("p", input_data.get("p"))
        if p_global is None:
            per_p = {b["p"] for b in bindings}
            if len(per_p) == 1 and None not in per_p:
                p_global = next(iter(per_p))
        if p_global is None:
            return {"status": "FAILED", "reason_code": "MISSING_P", "acceptance": acc,
                    "errors": [_err("MISSING_P", "p", "the stress scenario requires an explicit depletion fraction p (0, 1]")]}
        stress_input = {
            "layers": soil["layers"], "initial_storage_mm": float(soil["initial_storage_mm"]),
            "p": float(p_global),
            "periods": [{
                "period_start": b["ps"], "period_end": b["pe"], "et0_mm": b["et0"], "kc": b["kc"],
                "precipitation_mm": b["precip"], "irrigation_mm": b["irrigation"],
                "runoff_mm": b["runoff"],
                "deep_percolation_mm": float(b["deep_perc"]) if b["deep_perc"] is not None else 0.0,
            } for b in bindings],
        }
        sim = compute_stress_aware_series(stress_input)
        if not sim.get("ok"):
            codes = {e.get("code") for e in sim.get("errors", []) if isinstance(e, dict)}
            if "INVALID_P" in codes:
                reason = "INVALID_P"
            elif sim.get("result", {}).get("status") == "OUT_OF_DOMAIN":
                reason = "OUT_OF_DOMAIN"
            else:
                reason = "SIMULATION_ERROR"
            return {"status": "FAILED", "reason_code": reason, "acceptance": acc, "scenario": scenario, "simulation": sim}
        stress_steps = sim["result"]["steps"]
        mappings: List[dict] = []
        for b, s in zip(bindings, stress_steps):
            mappings.append({
                "step": b["index"], "period_start": b["ps"], "period_end": b["pe"], "et0_date": b["et0_date"],
                "et0_mm": b["et0"], "kc": b["kc"], "etc_mm": b["etc"],
                "precipitation_mm": b["precip"], "precip_observation": b["precip_observation"],
                "effective_precipitation_mm": b["ep_val"], "curve_number": b["curve_number"],
                "irrigation_mm": b["irrigation"], "runoff_mm": b["runoff"], "deep_percolation_mm": b["deep_perc"],
                "ks": s["ks"], "eta_mm": s["eta_mm"],
                "et_source": "stress_adjusted_eta", "et_is_actual": False, "mapping_version": MAPPING_VERSION,
            })
        provenance = _build_provenance(acc, et0, etc_records, ep_records, mappings, stress_input, sim, scenario)
        result = {
            "status": "COMPLETED", "workflow": WORKFLOW_ID, "version": WORKFLOW_VERSION, "scenario": scenario,
            "acceptance": acc, "et0": {"records": et0.records, "metadata": et0.metadata},
            "etc": etc_records, "effective_precipitation": ep_records, "mappings": mappings,
            "stress": {"p": float(p_global)}, "simulation": sim,
        }
        if scenario == "IRRIGATION_APPLICATION":
            demand_target = input_data.get("demand_target") or {}
            demand_records: List[dict] = []
            for b, s in zip(bindings, stress_steps):
                applied = float(b["irrigation"])
                d = compute_irrigation_demand({
                    "layers": soil["layers"],
                    "initial_storage_mm": s["initial_storage_mm"],
                    "et0_mm": b["et0"], "kc": b["kc"], "p": float(p_global),
                    **demand_target,
                })
                if d.get("ok"):
                    dr = d["result"]
                    demand_records.append({
                        "step": b["index"],
                        "storage_before_mm": s["initial_storage_mm"],
                        "calculated_net_demand_mm": dr["net_irrigation_mm"],
                        "calculated_gross_demand_mm": dr["gross_irrigation_mm"],
                        "explicit_applied_irrigation_mm": round(applied, 4),
                        "demand_application_difference_mm": round(applied - dr["net_irrigation_mm"], 4),
                        "demand_decision": d["decision"],
                        "demand_detected": dr["demand_detected"],
                        "irrigation_recommended": dr["irrigation_recommended"],
                        "ks": dr["ks"], "etc_mm": dr["etc_mm"], "eta_mm": dr["eta_mm"],
                    })
                else:
                    demand_records.append({
                        "step": b["index"],
                        "storage_before_mm": s["initial_storage_mm"],
                        "explicit_applied_irrigation_mm": round(applied, 4),
                        "demand_decision": "INVALID",
                        "demand_errors": d.get("errors", []),
                    })
            result["irrigation_demand"] = demand_records
            result["demand_target"] = demand_target
            analytics = _build_irrigation_analytics(bindings, stress_steps, demand_records)
            result["irrigation_analytics"] = analytics
            provenance = _build_provenance(acc, et0, etc_records, ep_records, mappings, stress_input, sim,
                                           scenario, demand_records=demand_records, analytics=analytics)
        result["provenance"] = provenance
        return result

    # DEMAND_BASED_NO_STRESS (existing Phase 3.20 behaviour, unchanged)
    sim_steps: List[dict] = []
    mappings = []
    for b in bindings:
        if b["et_actual_mm"] is not None:
            et_sink = float(b["et_actual_mm"])
            et_source, et_is_actual = "explicit_actual", True
        else:
            et_sink = b["etc"]
            et_source, et_is_actual = "crop_etc", False
        step = {
            "period_start": b["ps"], "period_end": b["pe"], "precipitation_mm": b["precip"],
            "irrigation_mm": b["irrigation"], "et_actual_mm": et_sink, "runoff_mm": b["runoff"],
        }
        if b["deep_perc"] is not None:
            step["deep_percolation_mm"] = float(b["deep_perc"])
        sim_steps.append(step)
        mappings.append({
            "step": b["index"], "period_start": b["ps"], "period_end": b["pe"], "et0_date": b["et0_date"],
            "et0_mm": b["et0"], "kc": b["kc"], "etc_mm": b["etc"],
            "precipitation_mm": b["precip"], "precip_observation": b["precip_observation"],
            "effective_precipitation_mm": b["ep_val"], "curve_number": b["curve_number"],
            "irrigation_mm": b["irrigation"], "runoff_mm": b["runoff"], "deep_percolation_mm": b["deep_perc"],
            "et_source": et_source, "et_is_actual": et_is_actual, "mapping_version": MAPPING_VERSION,
        })

    sim_input = {
        "period_start": periods[0]["period_start"], "period_end": periods[-1]["period_end"],
        "layers": soil["layers"], "initial_storage_mm": float(soil["initial_storage_mm"]), "steps": sim_steps,
    }
    sim = simulate_multi_period(sim_input)
    if not sim.get("ok"):
        return {"status": "FAILED", "reason_code": "SIMULATION_ERROR", "acceptance": acc, "scenario": scenario,
                "mappings": mappings, "simulation": sim}

    provenance = _build_provenance(acc, et0, etc_records, ep_records, mappings, sim_input, sim, scenario)
    return {
        "status": "COMPLETED", "workflow": WORKFLOW_ID, "version": WORKFLOW_VERSION, "scenario": scenario,
        "acceptance": acc, "et0": {"records": et0.records, "metadata": et0.metadata},
        "etc": etc_records, "effective_precipitation": ep_records, "mappings": mappings,
        "simulation": sim, "provenance": provenance,
    }


# --- Runtime/API adapter ---------------------------------------------------

def climate_crop_workflow_adapter(input_data: dict) -> dict:
    """Runtime adapter: ``executor(input_data)`` -> workflow result (JSON-safe)."""
    return _json_safe(run_climate_crop_workflow(input_data))


CLIMATE_CROP_WORKFLOW_DEFINITION = {
    "id": WORKFLOW_ID,
    "version": WORKFLOW_VERSION,
    "domain": "agriculture",
    "title": "Climate-driven multi-period crop water workflow",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm"],
    "precision": {"decimals": 4, "rounding": "half_up"},
    "inputs": [
        {"name": "source", "kind": "object", "required": True,
         "description": "climate source: ClimateSeries, serialized series object, or CSV/JSON text"},
        {"name": "periods", "kind": "array", "required": True,
         "description": "list of {period_start, period_end, kc, curve_number?, irrigation_mm?, runoff_mm?, deep_percolation_mm?, et_actual_mm?} (whole-day periods)"},
        {"name": "soil", "kind": "object", "required": True,
         "description": "{layers, initial_storage_mm, p?} (p required for STRESS_ADJUSTED_ET)"},
        {"name": "scenario", "kind": "string", "required": False,
         "description": "DEMAND_BASED_NO_STRESS (default) | STRESS_ADJUSTED_ET (FAO-56 Ks/ETa) | IRRIGATION_APPLICATION (stress sim + Phase 3.23 demand vs explicit application)"},
        {"name": "demand_target", "kind": "object", "required": False,
         "description": "IRRIGATION_APPLICATION target: {target_policy: FIELD_CAPACITY|RAW | target_depletion_mm | target_storage_mm, application_efficiency?}"},
        {"name": "config", "kind": "object", "required": False, "description": "ClimateIngestionConfig fields"},
        {"name": "qc_policy", "kind": "object", "required": False, "description": "QualityControlPolicy fields"},
        {"name": "unit_policy", "kind": "string", "required": False, "description": "LEGACY (default) | STRICT"},
        {"name": "et0_config", "kind": "object", "required": False,
         "description": "ET0IntegrationConfig fields (variable_mapping must map rn explicitly)"},
    ],
    "outputs": [
        {"name": "status", "kind": "string"},
        {"name": "acceptance", "kind": "object"},
        {"name": "et0", "kind": "object"},
        {"name": "etc", "kind": "array"},
        {"name": "effective_precipitation", "kind": "array"},
        {"name": "mappings", "kind": "array"},
        {"name": "simulation", "kind": "object"},
        {"name": "irrigation_demand", "kind": "array", "description": "IRRIGATION_APPLICATION only: per-period calculated demand vs explicit applied irrigation"},
        {"name": "irrigation_analytics", "kind": "object", "description": "IRRIGATION_APPLICATION only: per-period outcomes + scenario summary"},
        {"name": "provenance", "kind": "object"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_climate_crop_workflow.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}