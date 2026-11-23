"""Climate-driven daily soil-water simulation integration (Phase 3.0).

Connects the Climate Foundation (:mod:`hydroma.climate`), the climate→ET0
integration (:mod:`hydroma.climate_et0`), precipitation from a ``ClimateSeries``,
and the **existing** daily soil-water model
(:func:`hydroma.daily_soil_water.simulate_daily_soil_water`) into one deterministic,
traceable daily workflow.

It does **not** add a soil-water mathematical model, does not change ET0 or
soil-water calculations, and adds no dependencies. It only:

1. validates the climate series,
2. extracts daily precipitation (explicit mapping/units/basis/quality),
3. obtains daily ET0 via the existing climate→ET0 integration,
4. aligns precipitation and ET0 by **local date** (no interpolation/filling),
5. builds a contiguous, validated daily input list and calls the existing model,
6. returns a structured :class:`SoilWaterSeriesResult` with per-day records,
   explicit missing/rejected/skipped dates, and provenance.

State continuity
----------------
The daily model propagates storage internally across the ``days`` list it is given.
This integration therefore processes days in order and **stops at the first date
that cannot be computed** (missing/invalid precipitation or ET0, or a calendar
gap). Days after that boundary are reported as skipped, not simulated — the
integration never invents a state or resumes across an interruption.

ET0 semantics
-------------
ET0 is supplied to the model as ``et_actual_mm`` (the daily ET removal). This
assumes actual ET equals reference ET0 (no water-stress / Ks reduction); that
simplification is explicit and is a separate crop-water concern. The model's own
below-zero / excess-water handling is preserved unchanged.

Quality policy (conservative default)
-------------------------------------
``strict`` accepts ``valid``/``unchecked`` and rejects a day on
``suspect``/``invalid``/``missing``; ``allow_suspect`` accepts ``suspect`` with a
warning. Missing precipitation is never replaced with zero; missing ET0 is never
invented.

Software integration only — **not** scientific validation.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from .climate import (
    ClimateSeries,
    is_unit_compatible,
    parse_timestamp,
    series_hash,
    validate_series,
)
from .climate_et0 import ET0IntegrationConfig, compute_et0_series
from .daily_soil_water import DAILY_SOIL_WATER_MODEL, simulate_daily_soil_water
from .fao56_et0 import FAO56_ET0_MODEL
from .provenance import sha256_json

__all__ = [
    "SoilWaterSeriesConfig",
    "SoilWaterSeriesResult",
    "validate_soil_water_series_config",
    "simulate_climate_soil_water",
    "INTEGRATION_ID",
    "INTEGRATION_VERSION",
]

INTEGRATION_ID = "eco-nojin.hydroma.climate-soil-water"
INTEGRATION_VERSION = "1.0.0"

_REQUIRED_SOIL_LAYERS = ("thickness_mm", "theta_fc", "theta_wp")


def _err(code: str, field_name: str, message: str, **extra) -> Dict[str, Any]:
    d = {"code": code, "field": field_name, "message": message}
    d.update(extra)
    return d


def _finite(v: Any) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(float(v))


def _local_date(timestamp: str) -> Optional[str]:
    """Nominal local date (YYYY-MM-DD) without UTC shifting."""
    text = str(timestamp).strip()
    if len(text) >= 10 and text[4] == "-" and text[7] == "-":
        return text[:10]
    try:
        return parse_timestamp(text).date().isoformat()
    except (ValueError, TypeError):
        return None


# --- configuration ---------------------------------------------------------

@dataclass
class SoilWaterSeriesConfig:
    """Configuration for the climate-driven soil-water simulation."""

    layers: List[Dict[str, Any]] = field(default_factory=list)
    initial_storage_mm: Optional[float] = None
    p: Optional[float] = None
    et0_config: Optional[ET0IntegrationConfig] = None
    precipitation_variable: str = "precipitation"
    quality_policy: str = "strict"          # "strict" | "allow_suspect"
    irrigation_mm: float = 0.0              # no irrigation data -> 0 (documented)
    runoff_mm: float = 0.0                  # no runoff data -> 0 (documented)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    max_days: Optional[int] = None


@dataclass
class SoilWaterSeriesResult:
    """Structured result of a climate-driven soil-water simulation."""

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

    def to_dict(self) -> Dict[str, Any]:
        return {
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
        }


def validate_soil_water_series_config(config: Any) -> Dict[str, Any]:
    """Validate the integration configuration (soil layers, initial state, policy)."""
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if not isinstance(config, SoilWaterSeriesConfig):
        return {"valid": False, "errors": [_err("INVALID_CONFIG", "config",
                                                "config must be a SoilWaterSeriesConfig")],
                "warnings": []}

    # layers
    if not isinstance(config.layers, list) or not config.layers:
        errors.append(_err("INVALID_LAYERS", "layers", "layers must be a non-empty array"))
    else:
        for i, layer in enumerate(config.layers):
            if not isinstance(layer, dict):
                errors.append(_err("INVALID_LAYER", f"layers[{i}]", "layer must be an object"))
                continue
            for key in _REQUIRED_SOIL_LAYERS:
                if not _finite(layer.get(key)):
                    errors.append(_err("INVALID_LAYER", f"layers[{i}].{key}",
                                       f"{key} must be a finite number"))
            dz = layer.get("thickness_mm")
            tfc = layer.get("theta_fc")
            twp = layer.get("theta_wp")
            if _finite(dz) and float(dz) <= 0:
                errors.append(_err("INVALID_THICKNESS", f"layers[{i}].thickness_mm",
                                   "thickness_mm must be > 0"))
            if _finite(tfc) and not (0.0 <= float(tfc) <= 1.0):
                errors.append(_err("INVALID_THETA", f"layers[{i}].theta_fc",
                                   "theta_fc must be within [0, 1]"))
            if _finite(twp) and not (0.0 <= float(twp) <= 1.0):
                errors.append(_err("INVALID_THETA", f"layers[{i}].theta_wp",
                                   "theta_wp must be within [0, 1]"))
            if _finite(tfc) and _finite(twp) and float(tfc) <= float(twp):
                errors.append(_err("THETA_FC_MUST_EXCEED_WP", f"layers[{i}].theta_fc",
                                   "theta_fc must be greater than theta_wp"))

    # initial storage
    if config.initial_storage_mm is None:
        errors.append(_err("INVALID_INITIAL", "initial_storage_mm",
                           "initial_storage_mm is required (no default)"))
    elif not _finite(config.initial_storage_mm) or float(config.initial_storage_mm) < 0:
        errors.append(_err("INVALID_INITIAL", "initial_storage_mm",
                           "initial_storage_mm must be a finite number >= 0"))

    # p
    if config.p is not None and not (_finite(config.p) and 0.0 < float(config.p) <= 1.0):
        errors.append(_err("INVALID_P", "p", "p must be in (0, 1]"))

    # policies
    if config.quality_policy not in ("strict", "allow_suspect"):
        errors.append(_err("INVALID_QUALITY_POLICY", "quality_policy",
                           "quality_policy must be 'strict' or 'allow_suspect'"))

    # irrigation / runoff
    if not _finite(config.irrigation_mm) or float(config.irrigation_mm) < 0:
        errors.append(_err("INVALID_IRRIGATION", "irrigation_mm",
                           "irrigation_mm must be a finite number >= 0"))
    if not _finite(config.runoff_mm) or float(config.runoff_mm) < 0:
        errors.append(_err("INVALID_RUNOFF", "runoff_mm",
                           "runoff_mm must be a finite number >= 0"))

    # date bounds
    for name in ("start_date", "end_date"):
        val = getattr(config, name)
        if val is not None:
            try:
                date.fromisoformat(val)
            except (ValueError, TypeError):
                errors.append(_err("INVALID_DATE", name, f"{name} must be YYYY-MM-DD"))
    if config.start_date and config.end_date and config.start_date > config.end_date:
        errors.append(_err("INVALID_DATE_RANGE", "start_date",
                           "start_date must be <= end_date"))

    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


# --- precipitation extraction ---------------------------------------------

def _quality_decision(obs, policy: str, warnings: List[Dict[str, Any]],
                      ref: str) -> Tuple[bool, str]:
    q = obs.quality
    if q in ("invalid", "missing"):
        return False, f"quality={q}"
    if q == "suspect":
        if policy == "allow_suspect":
            warnings.append(_err("SUSPECT_ACCEPTED", ref, "suspect observation accepted under policy"))
            return True, ""
        return False, "quality=suspect"
    if q == "unchecked":
        warnings.append(_err("QUALITY_UNCHECKED", ref, "observation quality is unchecked"))
        return True, ""
    return True, ""


def _extract_precipitation(series: ClimateSeries, config: SoilWaterSeriesConfig,
                           errors: List[Dict[str, Any]],
                           warnings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Return ``{date: {"value": float|None, "reason": str|None}}`` for precipitation."""
    var = config.precipitation_variable
    result: Dict[str, Any] = {}
    for obs in series.observations:
        if obs.variable != var:
            continue
        d = _local_date(obs.timestamp)
        if d is None:
            continue
        ref = f"{d}.{var}"
        if d in result:
            errors.append(_err("AMBIGUOUS_PRECIPITATION", ref,
                               "multiple precipitation observations for one date"))
            result[d] = {"value": None, "reason": "ambiguous"}
            continue
        ok, why = _quality_decision(obs, config.quality_policy, warnings, ref)
        if not ok:
            result[d] = {"value": None, "reason": why}
            continue
        if not is_unit_compatible(var, obs.unit):
            result[d] = {"value": None, "reason": f"incompatible_unit={obs.unit}"}
            continue
        if obs.basis not in ("daily_sum", "period_sum"):
            result[d] = {"value": None, "reason": f"basis={obs.basis}"}
            continue
        if obs.value is None:
            result[d] = {"value": None, "reason": "missing_value"}
            continue
        if float(obs.value) < 0:
            result[d] = {"value": None, "reason": "negative"}
            continue
        result[d] = {"value": float(obs.value), "reason": None}
    return result


# --- main integration ------------------------------------------------------

def simulate_climate_soil_water(series: Any,
                                config: Optional[SoilWaterSeriesConfig] = None) -> SoilWaterSeriesResult:
    """Run a climate-driven daily soil-water simulation. Never raises on bad input."""
    config = config or SoilWaterSeriesConfig()

    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if not isinstance(series, ClimateSeries):
        return _empty(errors + [_err("INVALID_SERIES", "series", "series must be a ClimateSeries")],
                      warnings, config)

    cfg = validate_soil_water_series_config(config)
    errors.extend(cfg["errors"])
    warnings.extend(cfg["warnings"])
    if not cfg["valid"]:
        return _empty(errors, warnings, config)

    # structural validation of the climate series (report, do not repair)
    validation = validate_series(series)
    errors.extend(validation["errors"])
    warnings.extend(validation["warnings"])

    # --- daily ET0 via the existing climate->ET0 integration ---
    et0_config = config.et0_config or ET0IntegrationConfig()
    et0_result = compute_et0_series(series, et0_config)
    errors.extend(et0_result.errors)
    warnings.extend(et0_result.warnings)
    et0_by_date: Dict[str, float] = {r["date"]: r["et0_mm_per_day"] for r in et0_result.records}

    # --- daily precipitation ---
    precip_by_date = _extract_precipitation(series, config, errors, warnings)

    # --- ordered calendar range ---
    all_dates: List[str] = []
    for d in list(precip_by_date.keys()) + list(et0_by_date.keys()):
        all_dates.append(d)
    for obs in series.observations:
        d = _local_date(obs.timestamp)
        if d:
            all_dates.append(d)
    if config.start_date or config.end_date:
        start = config.start_date
        end = config.end_date
    elif all_dates:
        start = min(all_dates)
        end = max(all_dates)
    else:
        start = end = None

    if start is None:
        errors.append(_err("NO_CLIMATE_DATA", "series", "climate series has no usable dates"))
        return _empty(errors, warnings, config)

    start_d = date.fromisoformat(start)
    end_d = date.fromisoformat(end)

    # --- iterate days, build contiguous valid prefix, stop at first break ---
    days: List[Dict[str, Any]] = []
    rejected: List[Dict[str, Any]] = []
    skipped: List[Dict[str, Any]] = []
    calculated_dates: List[str] = []
    missing_dates: List[str] = []
    boundary: Optional[str] = None

    cur = start_d
    count = 0
    while cur <= end_d:
        d = cur.isoformat()
        if config.max_days is not None and count >= config.max_days:
            warnings.append(_err("MAX_DAYS_REACHED", "max_days",
                                 f"stopped after {config.max_days} days"))
            boundary = d
            break

        precip = precip_by_date.get(d)
        et0 = et0_by_date.get(d)
        reasons: List[str] = []

        if precip is None:
            missing_dates.append(d)
            reasons.append("missing_precipitation")
        elif precip["value"] is None:
            reasons.append(f"precipitation:{precip['reason']}")
        if et0 is None:
            if d not in missing_dates:
                missing_dates.append(d)
            reasons.append("missing_et0")

        if reasons:
            boundary = d
            rejected.append({"date": d, "reasons": sorted(set(reasons))})
            break

        days.append({
            "date": d,
            "precipitation_mm": precip["value"],
            "irrigation_mm": float(config.irrigation_mm),
            "runoff_mm": float(config.runoff_mm),
            "et_actual_mm": et0,
        })
        calculated_dates.append(d)
        count += 1
        cur = cur + timedelta(days=1)

    # remaining dates after a boundary are skipped (continuity interrupted)
    if boundary is not None:
        cur = date.fromisoformat(boundary) + timedelta(days=1)
        while cur <= end_d:
            skipped.append({"date": cur.isoformat(), "reason": "continuity_interrupted"})
            cur = cur + timedelta(days=1)

    # --- execute the existing daily soil-water model on the contiguous prefix ---
    records: List[Dict[str, Any]] = []
    if days:
        model_input: Dict[str, Any] = {
            "layers": config.layers,
            "initial_storage_mm": float(config.initial_storage_mm),
            "days": days,
        }
        if config.p is not None:
            model_input["p"] = float(config.p)
        model_result = simulate_daily_soil_water(model_input)
        if not model_result.get("ok"):
            errors.append(_err("SOIL_MODEL_FAILED", "days",
                               "daily soil-water model rejected the input"))
            errors.extend({"code": e.get("code"), "field": e.get("field"),
                           "message": e.get("message", "")}
                          for e in model_result.get("errors", []))
        else:
            res = model_result["result"]
            for day_out in res["days"]:
                records.append({
                    "date": day_out.get("date"),
                    "precipitation_mm": day_out["precipitation_mm"],
                    "irrigation_mm": day_out["irrigation_mm"],
                    "et0_mm_per_day": day_out["et_actual_mm"],
                    "initial_storage_mm": day_out["initial_storage_mm"],
                    "final_storage_mm": day_out["final_storage_mm"],
                    "depletion_mm": day_out["depletion_mm"],
                    "excess_mm": day_out["excess_mm"],
                    "taw_mm": day_out["taw_mm"],
                    "raw_mm": day_out.get("raw_mm"),
                    "status": day_out["status"],
                    "warnings": day_out.get("warnings", []),
                })
            warnings.extend({"code": "SOIL_MODEL", "message": str(w)}
                            for w in model_result.get("warnings", []))

    # --- status ---
    interruption = boundary is not None
    ok = (len(errors) == 0 and not interruption and len(records) > 0
          and len(missing_dates) == 0)
    partial = (len(records) > 0 and (interruption or len(errors) > 0 or len(missing_dates) > 0))

    metadata = {
        "integration_id": INTEGRATION_ID,
        "integration_version": INTEGRATION_VERSION,
        "et0_model_id": FAO56_ET0_MODEL["id"],
        "et0_model_version": FAO56_ET0_MODEL["version"],
        "soil_model_id": DAILY_SOIL_WATER_MODEL["id"],
        "soil_model_version": DAILY_SOIL_WATER_MODEL["version"],
        "variable_mapping": dict(et0_config.variable_mapping or {}),
        "precipitation_variable": config.precipitation_variable,
        "quality_policy": config.quality_policy,
        "initial_storage_mm": float(config.initial_storage_mm),
        "layers": config.layers,
        "p": config.p,
        "irrigation_mm": float(config.irrigation_mm),
        "runoff_mm": float(config.runoff_mm),
        "simulated_count": len(records),
    }

    provenance = {
        "integration_id": INTEGRATION_ID,
        "integration_version": INTEGRATION_VERSION,
        "climate_series_hash": series_hash(series),
        "et0_config": {
            "variable_mapping": dict(et0_config.variable_mapping or {}),
            "quality_policy": et0_config.quality_policy,
            "elevation_m": et0_config.elevation_m,
        },
        "et0_model_id": FAO56_ET0_MODEL["id"],
        "et0_model_version": FAO56_ET0_MODEL["version"],
        "soil_model_id": DAILY_SOIL_WATER_MODEL["id"],
        "soil_model_version": DAILY_SOIL_WATER_MODEL["version"],
        "soil_config": {
            "layers": config.layers,
            "initial_storage_mm": float(config.initial_storage_mm),
            "p": config.p,
        },
        "results_hash": sha256_json(records),
    }

    return SoilWaterSeriesResult(
        ok=ok, partial=partial, records=records, errors=errors, warnings=warnings,
        rejected=rejected, skipped=skipped, calculated_dates=calculated_dates,
        missing_dates=missing_dates,
        simulation_start=calculated_dates[0] if calculated_dates else None,
        simulation_end=calculated_dates[-1] if calculated_dates else None,
        metadata=metadata, provenance=provenance, validation=validation,
    )


def _empty(errors, warnings, config: SoilWaterSeriesConfig) -> SoilWaterSeriesResult:
    return SoilWaterSeriesResult(
        ok=False, partial=False, records=[], errors=errors, warnings=warnings,
        rejected=[], skipped=[], calculated_dates=[], missing_dates=[],
        simulation_start=None, simulation_end=None,
        metadata={"integration_id": INTEGRATION_ID, "integration_version": INTEGRATION_VERSION},
        provenance={}, validation={"valid": False, "errors": errors, "warnings": warnings},
    )