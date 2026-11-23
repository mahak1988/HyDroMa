"""Climate-driven daily crop-water simulation integration (Phase 3.1).

Connects the Climate Foundation, climate→ET0 integration, precipitation, the
**existing** crop-water model (:func:`hydroma.crop_water.compute_crop_water`) and
the **existing** daily soil-water model
(:func:`hydroma.daily_soil_water.simulate_daily_soil_water`) into one deterministic,
sequential daily crop-water workflow.

It adds **no** crop-water or soil-water mathematics and changes no existing model.
For each day it:

1. reads the soil-water state entering the day (``S``),
2. computes start-of-day depletion ``Dr = S_FC - S``,
3. runs the existing crop-water model with the day's ET0, crop coefficient ``kc``,
   depletion fraction ``p``, ``TAW`` and ``Dr`` → ``Ks`` and ``ETc_adjusted``,
4. feeds ``ETc_adjusted`` as ``et_actual_mm`` to the existing daily soil-water
   model for **that one day** (smallest safe orchestration for state feedback),
5. records the day and carries the resulting storage into the next day.

Temporal convention (documented)
--------------------------------
Stress is computed from the **start-of-day** soil-water state (``Dr = S_FC - S``),
then the adjusted ET is removed by the soil model. Stress is **not** recomputed
from the post-ET state (no double counting). ``ETc_adjusted = Ks · Kc · ET0`` is
the modeled actual crop ET for the day.

ET semantics (documented approximation)
---------------------------------------
``ET0`` (reference) → ``ETc_potential = Kc·ET0`` (potential crop ET) → ``Ks``
(depletion-based stress, existing crop-water model) → ``ETc_adjusted = Ks·
ETc_potential`` (adjusted crop ET, used as the actual ET removal). The daily
soil-water model's own accounting (excess above field capacity, below-zero
handling) is preserved unchanged.

State continuity
----------------
Days are processed in order; the simulation **stops at the first date that cannot
be computed** (missing/invalid precipitation or ET0, or a calendar gap). Days
after the boundary are reported as skipped. No state is invented or recovered.

Quality policy
--------------
``strict`` (default) accepts ``valid``/``unchecked`` and rejects a day on
``suspect``/``invalid``/``missing``; ``allow_suspect`` accepts ``suspect`` with a
warning. Missing precipitation/ET0 is never zero-filled.

Software integration only — **not** scientific validation.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from .climate import ClimateSeries, series_hash, validate_series
from .climate_et0 import ET0IntegrationConfig, compute_et0_series
from .crop_water import FAO56_CROP_WATER_MODEL, compute_crop_water
from .daily_soil_water import DAILY_SOIL_WATER_MODEL, simulate_daily_soil_water
from .fao56_et0 import FAO56_ET0_MODEL
from .provenance import sha256_json
from .soil_water import root_zone_storage_terms
from .soil_water_series import (  # reuse climate-side helpers (no duplication)
    _extract_precipitation,
    _local_date,
)

__all__ = [
    "CropWaterSeriesConfig",
    "CropWaterSeriesResult",
    "validate_crop_water_series_config",
    "simulate_climate_crop_water",
    "CROP_INTEGRATION_ID",
    "CROP_INTEGRATION_VERSION",
]

CROP_INTEGRATION_ID = "eco-nojin.hydroma.climate-crop-water"
CROP_INTEGRATION_VERSION = "1.0.0"

_REQUIRED_SOIL_LAYERS = ("thickness_mm", "theta_fc", "theta_wp")


def _err(code: str, field_name: str, message: str, **extra) -> Dict[str, Any]:
    d = {"code": code, "field": field_name, "message": message}
    d.update(extra)
    return d


def _finite(v: Any) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(float(v))


# --- configuration ---------------------------------------------------------

@dataclass
class CropWaterSeriesConfig:
    """Configuration for the climate-driven crop-water simulation."""

    layers: List[Dict[str, Any]] = field(default_factory=list)
    initial_storage_mm: Optional[float] = None
    p: Optional[float] = None
    kc: Any = None                          # scalar or per-day list
    et0_config: Optional[ET0IntegrationConfig] = None
    precipitation_variable: str = "precipitation"
    quality_policy: str = "strict"          # "strict" | "allow_suspect"
    irrigation_mm: float = 0.0
    runoff_mm: float = 0.0
    root_zone_depth_mm: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    max_days: Optional[int] = None


@dataclass
class CropWaterSeriesResult:
    """Structured result of a climate-driven crop-water simulation."""

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


def validate_crop_water_series_config(config: Any) -> Dict[str, Any]:
    """Validate the crop-water integration configuration."""
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if not isinstance(config, CropWaterSeriesConfig):
        return {"valid": False, "errors": [_err("INVALID_CONFIG", "config",
                                                "config must be a CropWaterSeriesConfig")],
                "warnings": []}

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
            dz, tfc, twp = layer.get("thickness_mm"), layer.get("theta_fc"), layer.get("theta_wp")
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

    if config.initial_storage_mm is None:
        errors.append(_err("INVALID_INITIAL", "initial_storage_mm",
                           "initial_storage_mm is required (no default)"))
    elif not _finite(config.initial_storage_mm) or float(config.initial_storage_mm) < 0:
        errors.append(_err("INVALID_INITIAL", "initial_storage_mm",
                           "initial_storage_mm must be a finite number >= 0"))

    if config.p is None:
        errors.append(_err("INVALID_P", "p", "p is required (0 < p <= 1)"))
    elif not (_finite(config.p) and 0.0 < float(config.p) <= 1.0):
        errors.append(_err("INVALID_P", "p", "p must be in (0, 1]"))

    # kc: scalar >= 0 or non-empty list of numbers >= 0
    kc = config.kc
    if kc is None:
        errors.append(_err("INVALID_KC", "kc", "kc is required"))
    elif isinstance(kc, list):
        if not kc or not all(_finite(k) and float(k) >= 0 for k in kc):
            errors.append(_err("INVALID_KC", "kc", "kc list must be non-empty numbers >= 0"))
    elif not (_finite(kc) and float(kc) >= 0):
        errors.append(_err("INVALID_KC", "kc", "kc must be a number >= 0"))

    if config.quality_policy not in ("strict", "allow_suspect"):
        errors.append(_err("INVALID_QUALITY_POLICY", "quality_policy",
                           "quality_policy must be 'strict' or 'allow_suspect'"))
    if not _finite(config.irrigation_mm) or float(config.irrigation_mm) < 0:
        errors.append(_err("INVALID_IRRIGATION", "irrigation_mm", "irrigation_mm must be >= 0"))
    if not _finite(config.runoff_mm) or float(config.runoff_mm) < 0:
        errors.append(_err("INVALID_RUNOFF", "runoff_mm", "runoff_mm must be >= 0"))

    for name in ("start_date", "end_date"):
        val = getattr(config, name)
        if val is not None:
            try:
                date.fromisoformat(val)
            except (ValueError, TypeError):
                errors.append(_err("INVALID_DATE", name, f"{name} must be YYYY-MM-DD"))
    if config.start_date and config.end_date and config.start_date > config.end_date:
        errors.append(_err("INVALID_DATE_RANGE", "start_date", "start_date must be <= end_date"))

    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


# --- main integration ------------------------------------------------------

def simulate_climate_crop_water(series: Any,
                                config: Optional[CropWaterSeriesConfig] = None) -> CropWaterSeriesResult:
    """Run a climate-driven daily crop-water simulation. Never raises on bad input."""
    config = config or CropWaterSeriesConfig()

    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if not isinstance(series, ClimateSeries):
        return _empty(errors + [_err("INVALID_SERIES", "series", "series must be a ClimateSeries")],
                      warnings, config)

    cfg = validate_crop_water_series_config(config)
    errors.extend(cfg["errors"])
    warnings.extend(cfg["warnings"])
    if not cfg["valid"]:
        return _empty(errors, warnings, config)

    validation = validate_series(series)
    errors.extend(validation["errors"])
    warnings.extend(validation["warnings"])

    # --- soil-water static terms (FC / WP / TAW) via existing soil-water helper ---
    try:
        terms = root_zone_storage_terms({
            "layers": config.layers,
            "rootZoneDepth": config.root_zone_depth_mm,
        })
    except ValueError as exc:
        errors.append(_err("INVALID_LAYERS", "layers", str(exc)))
        return _empty(errors, warnings, config)
    fc_storage = terms["fc_storage_mm"]
    taw = terms["taw_mm"]
    root_zone_depth = terms["root_zone_depth_mm"]

    # --- daily ET0 via existing climate->ET0 integration ---
    et0_config = config.et0_config or ET0IntegrationConfig()
    et0_result = compute_et0_series(series, et0_config)
    errors.extend(et0_result.errors)
    warnings.extend(et0_result.warnings)
    et0_by_date: Dict[str, float] = {r["date"]: r["et0_mm_per_day"] for r in et0_result.records}

    # --- daily precipitation (reuse soil_water_series helper) ---
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
        start, end = config.start_date, config.end_date
    elif all_dates:
        start, end = min(all_dates), max(all_dates)
    else:
        start = end = None

    if start is None:
        errors.append(_err("NO_CLIMATE_DATA", "series", "climate series has no usable dates"))
        return _empty(errors, warnings, config)

    start_d = date.fromisoformat(start)
    end_d = date.fromisoformat(end)
    total_days = (end_d - start_d).days + 1

    # kc per-day resolution
    kc = config.kc
    if isinstance(kc, list):
        if len(kc) != total_days:
            errors.append(_err("KC_LENGTH_MISMATCH", "kc",
                               f"kc list length {len(kc)} != simulation days {total_days}"))
            return _empty(errors, warnings, config)
        kc_list = [float(k) for k in kc]
    else:
        kc_list = [float(kc)] * total_days

    # --- sequential daily loop with state feedback ---
    storage = float(config.initial_storage_mm)
    records: List[Dict[str, Any]] = []
    rejected: List[Dict[str, Any]] = []
    skipped: List[Dict[str, Any]] = []
    calculated_dates: List[str] = []
    missing_dates: List[str] = []
    boundary: Optional[str] = None

    cur = start_d
    day_index = 0
    while cur <= end_d:
        d = cur.isoformat()
        if config.max_days is not None and len(records) >= config.max_days:
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

        # start-of-day depletion (pre-day stress convention)
        dr = fc_storage - storage
        kc_i = kc_list[day_index]

        crop = compute_crop_water({
            "et0_mm_per_day": et0,
            "kc": kc_i,
            "p": float(config.p),
            "taw_mm": taw,
            "depletion_mm": dr,
        })
        if not crop.get("ok"):
            boundary = d
            rejected.append({"date": d, "reasons": ["crop_water:" + str(e.get("code"))
                                                    for e in crop.get("errors", [])]})
            break
        cr = crop["result"]
        etc_adjusted = cr["etc_adjusted_mm_per_day"]

        # existing daily soil-water model for this single day (state feedback)
        soil = simulate_daily_soil_water({
            "layers": config.layers,
            "initial_storage_mm": storage,
            "p": float(config.p),
            "days": [{
                "date": d,
                "precipitation_mm": precip["value"],
                "irrigation_mm": float(config.irrigation_mm),
                "runoff_mm": float(config.runoff_mm),
                "et_actual_mm": etc_adjusted,
            }],
        })
        if not soil.get("ok"):
            boundary = d
            rejected.append({"date": d, "reasons": ["soil_model:" + str(e.get("code"))
                                                    for e in soil.get("errors", [])]})
            break
        sd = soil["result"]["days"][0]
        storage = soil["result"]["final_storage_mm"]

        records.append({
            "date": d,
            "precipitation_mm": sd["precipitation_mm"],
            "irrigation_mm": sd["irrigation_mm"],
            "et0_mm_per_day": et0,
            "kc": kc_i,
            "etc_potential_mm_per_day": cr["etc_potential_mm_per_day"],
            "ks": cr["ks"],
            "etc_adjusted_mm_per_day": etc_adjusted,
            "initial_storage_mm": sd["initial_storage_mm"],
            "final_storage_mm": sd["final_storage_mm"],
            "depletion_mm": sd["depletion_mm"],
            "excess_mm": sd["excess_mm"],
            "taw_mm": sd["taw_mm"],
            "raw_mm": cr["raw_mm"],
            "status": sd["status"],
            "warnings": sd.get("warnings", []),
        })
        warnings.extend({"code": "SOIL_MODEL", "message": str(w)} for w in soil.get("warnings", []))
        calculated_dates.append(d)
        day_index += 1
        cur = cur + timedelta(days=1)

    if boundary is not None:
        cur = date.fromisoformat(boundary) + timedelta(days=1)
        while cur <= end_d:
            skipped.append({"date": cur.isoformat(), "reason": "continuity_interrupted"})
            cur = cur + timedelta(days=1)

    interruption = boundary is not None
    ok = (len(errors) == 0 and not interruption and len(records) > 0 and len(missing_dates) == 0)
    partial = (len(records) > 0 and (interruption or len(errors) > 0 or len(missing_dates) > 0))

    metadata = {
        "integration_id": CROP_INTEGRATION_ID,
        "integration_version": CROP_INTEGRATION_VERSION,
        "et0_model_id": FAO56_ET0_MODEL["id"],
        "et0_model_version": FAO56_ET0_MODEL["version"],
        "crop_model_id": FAO56_CROP_WATER_MODEL["id"],
        "crop_model_version": FAO56_CROP_WATER_MODEL["version"],
        "soil_model_id": DAILY_SOIL_WATER_MODEL["id"],
        "soil_model_version": DAILY_SOIL_WATER_MODEL["version"],
        "variable_mapping": dict(et0_config.variable_mapping or {}),
        "precipitation_variable": config.precipitation_variable,
        "quality_policy": config.quality_policy,
        "initial_storage_mm": float(config.initial_storage_mm),
        "root_zone_depth_mm": root_zone_depth,
        "taw_mm": taw,
        "fc_storage_mm": fc_storage,
        "p": float(config.p),
        "kc": config.kc,
        "layers": config.layers,
        "simulated_count": len(records),
        "stress_convention": "start_of_day_depletion",
    }

    provenance = {
        "integration_id": CROP_INTEGRATION_ID,
        "integration_version": CROP_INTEGRATION_VERSION,
        "climate_series_hash": series_hash(series),
        "et0_config": {
            "variable_mapping": dict(et0_config.variable_mapping or {}),
            "quality_policy": et0_config.quality_policy,
            "elevation_m": et0_config.elevation_m,
        },
        "et0_model_id": FAO56_ET0_MODEL["id"],
        "et0_model_version": FAO56_ET0_MODEL["version"],
        "crop_model_id": FAO56_CROP_WATER_MODEL["id"],
        "crop_model_version": FAO56_CROP_WATER_MODEL["version"],
        "soil_model_id": DAILY_SOIL_WATER_MODEL["id"],
        "soil_model_version": DAILY_SOIL_WATER_MODEL["version"],
        "soil_config": {
            "layers": config.layers,
            "initial_storage_mm": float(config.initial_storage_mm),
            "root_zone_depth_mm": root_zone_depth,
            "p": float(config.p),
        },
        "crop_params": {"kc": config.kc, "p": float(config.p)},
        "results_hash": sha256_json(records),
    }

    return CropWaterSeriesResult(
        ok=ok, partial=partial, records=records, errors=errors, warnings=warnings,
        rejected=rejected, skipped=skipped, calculated_dates=calculated_dates,
        missing_dates=missing_dates,
        simulation_start=calculated_dates[0] if calculated_dates else None,
        simulation_end=calculated_dates[-1] if calculated_dates else None,
        metadata=metadata, provenance=provenance, validation=validation,
    )


def _empty(errors, warnings, config: CropWaterSeriesConfig) -> CropWaterSeriesResult:
    return CropWaterSeriesResult(
        ok=False, partial=False, records=[], errors=errors, warnings=warnings,
        rejected=[], skipped=[], calculated_dates=[], missing_dates=[],
        simulation_start=None, simulation_end=None,
        metadata={"integration_id": CROP_INTEGRATION_ID,
                  "integration_version": CROP_INTEGRATION_VERSION},
        provenance={}, validation={"valid": False, "errors": errors, "warnings": warnings},
    )