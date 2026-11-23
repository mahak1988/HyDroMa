"""HyDroMA Scenario Engine (Phase 3.3).

A bounded, deterministic integration layer that defines, validates, executes and
compares multiple **scenarios** using the existing climate-driven irrigation
simulation (:func:`hydroma.irrigation_series.simulate_climate_irrigation`). It adds
**no** scientific model and changes no existing integration: each scenario is an
:class:`IrrigationSeriesConfig` plus identity metadata, executed independently over
common climate forcing.

Responsibilities
----------------
* define scenarios (:class:`ScenarioConfig`),
* validate scenario definitions (unique ids, exactly one explicit baseline, valid
  integration config),
* execute each scenario independently over common forcing (sequential; a failed
  scenario never alters another),
* collect structured per-scenario results (:class:`ScenarioResult`),
* compare compatible scenarios with documented metrics (:func:`compare_scenarios`),
* attach deterministic provenance (scenario config hash + climate hash + result hash).

Isolation
---------
Each scenario starts from its **own** explicitly defined initial state; no scenario
inherits soil-water state from another. Scenario configs are plain data and are not
mutated. Forcing (climate series, ET0 config, simulation period) is shared read-only.

Maturity
--------
Software-tested; **NOT_VALIDATED** scientifically.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Sequence

from .climate import ClimateSeries, series_hash
from .climate_et0 import ET0IntegrationConfig
from .irrigation_series import (
    IRRIGATION_POLICIES,
    IrrigationSeriesConfig,
    IrrigationSeriesResult,
    simulate_climate_irrigation,
    validate_irrigation_series_config,
)
from .provenance import sha256_json

__all__ = [
    "ScenarioConfig",
    "ScenarioResult",
    "ScenarioSetResult",
    "SCENARIO_ENGINE_ID",
    "SCENARIO_ENGINE_VERSION",
    "validate_scenarios",
    "scenario_config_hash",
    "run_scenarios",
    "compute_scenario_metrics",
    "compare_scenarios",
    "METRIC_UNITS",
]

SCENARIO_ENGINE_ID = "eco-nojin.hydroma.scenario-engine"
SCENARIO_ENGINE_VERSION = "1.0.0"

# Documented metric units / semantics.
METRIC_UNITS: Dict[str, str] = {
    "final_storage_mm": "mm",
    "mean_storage_mm": "mm (mean of daily final storage)",
    "min_storage_mm": "mm (minimum daily final storage)",
    "total_precipitation_mm": "mm (sum over simulated days)",
    "total_et0_mm": "mm (sum of daily ET0 over simulated days)",
    "total_etc_adjusted_mm": "mm (sum of daily ETc_adjusted = modeled crop ET)",
    "total_net_irrigation_mm": "mm (sum of net irrigation applied)",
    "total_gross_irrigation_mm": "mm (sum of gross irrigation applied)",
    "total_runoff_mm": "mm (sum over simulated days)",
    "total_excess_mm": "mm (sum of excess above field capacity)",
    "days_with_stress": "count of days with Ks < 1",
    "mean_ks": "fraction (mean daily Ks)",
    "min_ks": "fraction (minimum daily Ks)",
    "duration_days": "count of simulated days",
    "status": "complete | partial | failed | no_data",
}

_CONFIG_FIELDS = (
    "layers", "initial_storage_mm", "p", "kc", "irrigation_policy",
    "application_efficiency", "target_depletion_mm", "target_storage_mm",
    "max_irrigation_mm", "explicit_irrigation_mm", "root_zone_depth_mm",
    "quality_policy", "runoff_mm",
)


def _err(code: str, field_name: str, message: str, **extra) -> Dict[str, Any]:
    d = {"code": code, "field": field_name, "message": message}
    d.update(extra)
    return d


def _finite(v: Any) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(float(v))


# --- scenario definition ---------------------------------------------------

@dataclass
class ScenarioConfig:
    """A scenario: identity + an explicit irrigation-series configuration.

    All fields except identity map directly to :class:`IrrigationSeriesConfig`
    (no invented parameters).
    """

    scenario_id: str
    name: str = ""
    description: str = ""
    baseline: bool = False
    layers: List[Dict[str, Any]] = field(default_factory=list)
    initial_storage_mm: Optional[float] = None
    p: Optional[float] = None
    kc: Any = None
    irrigation_policy: str = "none"
    application_efficiency: Optional[float] = None
    target_depletion_mm: Optional[float] = None
    target_storage_mm: Optional[float] = None
    max_irrigation_mm: Optional[float] = None
    explicit_irrigation_mm: float = 0.0
    root_zone_depth_mm: Optional[float] = None
    quality_policy: str = "strict"
    runoff_mm: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_integration_config(self, et0_config: Optional[ET0IntegrationConfig] = None,
                              start_date: Optional[str] = None,
                              end_date: Optional[str] = None) -> IrrigationSeriesConfig:
        return IrrigationSeriesConfig(
            layers=self.layers,
            initial_storage_mm=self.initial_storage_mm,
            p=self.p,
            kc=self.kc,
            et0_config=et0_config,
            irrigation_policy=self.irrigation_policy,
            application_efficiency=self.application_efficiency,
            target_depletion_mm=self.target_depletion_mm,
            target_storage_mm=self.target_storage_mm,
            max_irrigation_mm=self.max_irrigation_mm,
            explicit_irrigation_mm=self.explicit_irrigation_mm,
            root_zone_depth_mm=self.root_zone_depth_mm,
            quality_policy=self.quality_policy,
            runoff_mm=self.runoff_mm,
            start_date=start_date,
            end_date=end_date,
        )

    def conditions_signature(self) -> Dict[str, Any]:
        """Soil/initial conditions that should be held common for a controlled comparison."""
        return {
            "layers": self.layers,
            "root_zone_depth_mm": self.root_zone_depth_mm,
            "p": self.p,
            "initial_storage_mm": self.initial_storage_mm,
        }


@dataclass
class ScenarioResult:
    """Structured result for one scenario."""

    scenario_id: str
    name: str
    baseline: bool
    ok: bool
    partial: bool
    records: List[Dict[str, Any]]
    errors: List[Dict[str, Any]]
    warnings: List[Dict[str, Any]]
    rejected: List[Dict[str, Any]]
    skipped: List[Dict[str, Any]]
    calculated_dates: List[str]
    missing_dates: List[str]
    simulation_start: Optional[str]
    simulation_end: Optional[str]
    metadata: Dict[str, Any]
    provenance: Dict[str, Any]
    validation: Dict[str, Any]
    config_hash: str
    conditions: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "scenario_id": self.scenario_id,
            "name": self.name,
            "baseline": self.baseline,
            "ok": self.ok,
            "partial": self.partial,
            "records": self.records,
            "errors": self.errors,
            "warnings": self.warnings,
            "rejected": self.rejected,
            "skipped": self.skipped,
            "calculated_dates": self.calculated_dates,
            "missing_dates": self.missing_dates,
            "simulation_start": self.simulation_start,
            "simulation_end": self.simulation_end,
            "metadata": self.metadata,
            "provenance": self.provenance,
            "validation": self.validation,
            "config_hash": self.config_hash,
            "conditions": self.conditions,
        }


@dataclass
class ScenarioSetResult:
    """Result of executing a set of scenarios plus a comparison."""

    ok: bool
    baseline_id: Optional[str]
    results: List[ScenarioResult]
    comparison: Dict[str, Any]
    errors: List[Dict[str, Any]]
    warnings: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    provenance: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ok": self.ok,
            "baseline_id": self.baseline_id,
            "results": [r.to_dict() for r in self.results],
            "comparison": self.comparison,
            "errors": self.errors,
            "warnings": self.warnings,
            "metadata": self.metadata,
            "provenance": self.provenance,
        }


# --- hashing ---------------------------------------------------------------

def scenario_config_hash(config: ScenarioConfig) -> str:
    """Deterministic SHA-256 of the scenario's scientific configuration."""
    payload = {name: getattr(config, name) for name in _CONFIG_FIELDS}
    return sha256_json(payload)


# --- validation ------------------------------------------------------------

def validate_scenarios(scenarios: Sequence[Any]) -> Dict[str, Any]:
    """Validate scenario definitions (identity, baseline, integration config)."""
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if not isinstance(scenarios, (list, tuple)) or not scenarios:
        return {"valid": False, "errors": [_err("EMPTY_SCENARIOS", "scenarios",
                                                "at least one scenario is required")],
                "warnings": []}

    ids = set()
    baseline_count = 0
    for i, sc in enumerate(scenarios):
        if not isinstance(sc, ScenarioConfig):
            errors.append(_err("INVALID_SCENARIO", f"scenarios[{i}]",
                               "scenario must be a ScenarioConfig"))
            continue
        if not sc.scenario_id or not isinstance(sc.scenario_id, str):
            errors.append(_err("INVALID_SCENARIO_ID", f"scenarios[{i}].scenario_id",
                               "scenario_id must be a non-empty string"))
        elif sc.scenario_id in ids:
            errors.append(_err("DUPLICATE_SCENARIO_ID", f"scenarios[{i}].scenario_id",
                               f"duplicate scenario_id: {sc.scenario_id!r}"))
        else:
            ids.add(sc.scenario_id)
        if sc.baseline:
            baseline_count += 1
        # validate the underlying integration config
        cfg = validate_irrigation_series_config(sc.to_integration_config())
        for e in cfg["errors"]:
            errors.append(_err(e["code"], f"scenarios[{i}].{e.get('field', '')}",
                               e.get("message", "")))

    if baseline_count == 0:
        errors.append(_err("MISSING_BASELINE", "baseline",
                           "exactly one scenario must be marked baseline=True"))
    elif baseline_count > 1:
        errors.append(_err("MULTIPLE_BASELINES", "baseline",
                           f"exactly one baseline is allowed, found {baseline_count}"))

    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


# --- execution -------------------------------------------------------------

def _run_one(sc: ScenarioConfig, series: ClimateSeries,
             et0_config: Optional[ET0IntegrationConfig],
             start_date: Optional[str], end_date: Optional[str]) -> ScenarioResult:
    cfg = sc.to_integration_config(et0_config=et0_config, start_date=start_date, end_date=end_date)
    res: IrrigationSeriesResult = simulate_climate_irrigation(series, cfg)
    prov = dict(res.provenance)
    prov["scenario_id"] = sc.scenario_id
    prov["scenario_config_hash"] = scenario_config_hash(sc)
    prov["scenario_engine_id"] = SCENARIO_ENGINE_ID
    prov["scenario_engine_version"] = SCENARIO_ENGINE_VERSION
    return ScenarioResult(
        scenario_id=sc.scenario_id,
        name=sc.name or sc.scenario_id,
        baseline=sc.baseline,
        ok=res.ok, partial=res.partial,
        records=res.records, errors=res.errors, warnings=res.warnings,
        rejected=res.rejected, skipped=res.skipped,
        calculated_dates=res.calculated_dates, missing_dates=res.missing_dates,
        simulation_start=res.simulation_start, simulation_end=res.simulation_end,
        metadata=res.metadata, provenance=prov, validation=res.validation,
        config_hash=scenario_config_hash(sc),
        conditions=sc.conditions_signature(),
    )


def run_scenarios(series: Any,
                  scenarios: Sequence[ScenarioConfig],
                  et0_config: Optional[ET0IntegrationConfig] = None,
                  start_date: Optional[str] = None,
                  end_date: Optional[str] = None) -> ScenarioSetResult:
    """Execute scenarios over common forcing. Never raises on bad input."""
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if not isinstance(series, ClimateSeries):
        return ScenarioSetResult(False, None, [],
                                 {"errors": [_err("INVALID_SERIES", "series",
                                                  "series must be a ClimateSeries")],
                                  "warnings": []},
                                 [_err("INVALID_SERIES", "series", "series must be a ClimateSeries")],
                                 [], {"engine_id": SCENARIO_ENGINE_ID}, {})

    validation = validate_scenarios(scenarios)
    if not validation["valid"]:
        return ScenarioSetResult(False, None, [], {"errors": validation["errors"],
                                                  "warnings": validation["warnings"]},
                                 validation["errors"], validation["warnings"],
                                 {"engine_id": SCENARIO_ENGINE_ID}, {})

    baseline_id = next(sc.scenario_id for sc in scenarios if sc.baseline)
    results: List[ScenarioResult] = []
    for sc in scenarios:
        results.append(_run_one(sc, series, et0_config, start_date, end_date))

    comparison = compare_scenarios(results)
    warnings.extend({"code": w, "message": ""} for w in comparison.get("warnings", []))

    all_ok = all(r.ok for r in results)
    climate_hash = series_hash(series)

    provenance = {
        "engine_id": SCENARIO_ENGINE_ID,
        "engine_version": SCENARIO_ENGINE_VERSION,
        "climate_series_hash": climate_hash,
        "scenario_count": len(results),
        "baseline_id": baseline_id,
        "scenario_config_hashes": {r.scenario_id: r.config_hash for r in results},
        "scenario_result_hashes": {r.scenario_id: r.provenance.get("results_hash") for r in results},
    }
    metadata = {
        "engine_id": SCENARIO_ENGINE_ID,
        "engine_version": SCENARIO_ENGINE_VERSION,
        "start_date": start_date,
        "end_date": end_date,
        "scenario_count": len(results),
        "baseline_id": baseline_id,
    }

    return ScenarioSetResult(
        ok=all_ok, baseline_id=baseline_id, results=results, comparison=comparison,
        errors=errors, warnings=warnings, metadata=metadata, provenance=provenance,
    )


# --- metrics & comparison --------------------------------------------------

def compute_scenario_metrics(result: ScenarioResult) -> Dict[str, Any]:
    """Compute documented metrics from a scenario's daily records."""
    records = result.records or []
    if not records:
        return {
            "final_storage_mm": None, "mean_storage_mm": None, "min_storage_mm": None,
            "total_precipitation_mm": None, "total_et0_mm": None,
            "total_etc_adjusted_mm": None, "total_net_irrigation_mm": None,
            "total_gross_irrigation_mm": None, "total_runoff_mm": None,
            "total_excess_mm": None, "days_with_stress": 0, "mean_ks": None,
            "min_ks": None, "duration_days": 0,
            "status": "failed" if not result.ok else "no_data",
        }

    finals = [r["final_storage_mm"] for r in records if r.get("final_storage_mm") is not None]
    kss = [r["ks"] for r in records if r.get("ks") is not None]
    status = "complete" if result.ok else ("partial" if result.partial else "failed")

    return {
        "final_storage_mm": finals[-1] if finals else None,
        "mean_storage_mm": (sum(finals) / len(finals)) if finals else None,
        "min_storage_mm": min(finals) if finals else None,
        "total_precipitation_mm": sum(r.get("precipitation_mm", 0.0) for r in records),
        "total_et0_mm": sum(r.get("et0_mm_per_day", 0.0) for r in records),
        "total_etc_adjusted_mm": sum(r.get("etc_adjusted_mm_per_day", 0.0) for r in records),
        "total_net_irrigation_mm": sum(r.get("irrigation_applied_mm", 0.0) for r in records),
        "total_gross_irrigation_mm": sum(r.get("irrigation_gross_applied_mm", 0.0) for r in records),
        "total_runoff_mm": sum(r.get("runoff_mm", 0.0) for r in records),
        "total_excess_mm": sum(r.get("excess_mm", 0.0) for r in records),
        "days_with_stress": sum(1 for k in kss if k < 1.0 - 1e-9),
        "mean_ks": (sum(kss) / len(kss)) if kss else None,
        "min_ks": min(kss) if kss else None,
        "duration_days": len(records),
        "status": status,
    }


def _relative(base: Optional[float], value: Optional[float]) -> Optional[float]:
    if base is None or value is None or base == 0:
        return None
    return (value - base) / base


def _canonical_conditions(conditions: Dict[str, Any]) -> str:
    """Canonical string of a conditions signature (for cross-scenario equality)."""
    return sha256_json(conditions) if conditions else ""


def compare_scenarios(results: Sequence[ScenarioResult]) -> Dict[str, Any]:
    """Compare scenarios against the explicit baseline with documented metrics."""
    warnings: List[str] = []
    baseline = next((r for r in results if r.baseline), None)
    if baseline is None:
        return {"baseline_id": None, "metrics": {}, "differences": {},
                "compatible": False, "warnings": ["no_baseline"], "limitations": []}

    metrics = {r.scenario_id: compute_scenario_metrics(r) for r in results}

    # compatibility: common climate (by construction) + same simulation period + completeness
    periods = {(r.simulation_start, r.simulation_end) for r in results}
    if len(periods) > 1:
        warnings.append("simulation_period_differs")
    incomplete = [r.scenario_id for r in results if not r.ok or r.partial]
    if incomplete:
        warnings.append("incomplete_scenarios:" + ",".join(incomplete))

    # controlled-comparison check: soil/initial conditions should match across scenarios
    signatures = {r.scenario_id: _canonical_conditions(r.conditions) for r in results}
    if len(set(signatures.values())) > 1:
        warnings.append("soil_or_initial_conditions_differ")

    compatible = (len(periods) == 1 and not incomplete
                  and "soil_or_initial_conditions_differ" not in warnings)

    # differences vs baseline (absolute + relative)
    base_metrics = metrics[baseline.scenario_id]
    differences: Dict[str, Any] = {}
    for r in results:
        if r.scenario_id == baseline.scenario_id:
            continue
        m = metrics[r.scenario_id]
        diff = {}
        for key, bval in base_metrics.items():
            if key == "status":
                continue
            val = m.get(key)
            if bval is None or val is None:
                diff[key] = {"absolute": None, "relative": None}
            else:
                diff[key] = {
                    "absolute": val - bval,
                    "relative": _relative(bval, val),
                }
        differences[r.scenario_id] = diff

    limitations = [
        "Differences are descriptive only; they are not causal attribution.",
        "ETc_adjusted is a modeled crop ET, not measured actual ET.",
        "Comparisons are valid only when scenarios share forcing, period and initial/soil conditions.",
        "Incomplete/interrupted scenarios are marked and their metrics are partial.",
    ]

    return {
        "baseline_id": baseline.scenario_id,
        "metrics": metrics,
        "differences": differences,
        "compatible": compatible,
        "warnings": warnings,
        "limitations": limitations,
    }