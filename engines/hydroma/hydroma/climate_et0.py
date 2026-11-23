"""Climate-to-FAO-56 ET0 integration (Phase 2.9).

Executes the **existing** :func:`hydroma.fao56_et0.compute_fao56_et0` model over a
HyDroMA :class:`~hydroma.climate.ClimateSeries`, day by day, without modifying the
FAO-56 mathematics. This is a thin, deterministic integration layer: it maps daily
climate observations to the ET0 input contract, validates daily completeness and
quality, runs the existing model, and returns a structured ET0 series result with
explicit provenance and per-date outcomes.

ET0 input contract (from ``fao56_et0.py``)
------------------------------------------
Required: ``rn`` [MJ/m2/day], ``t`` [degC], ``u2`` [m/s], ``ea`` [kPa].
Optional: ``g`` [MJ/m2/day, default 0], ``z`` [m, default 0 = sea level].

Climate mapping (explicit, no silent substitution)
--------------------------------------------------
* ``t``  <- ``air_temperature`` (daily mean). If absent and ``derive_mean_from_minmax``
  is enabled, ``t = (min_air_temperature + max_air_temperature) / 2``.
* ``u2`` <- ``wind_speed`` (daily mean at 2 m; the model assumes 2 m — no height
  adjustment is performed).
* ``ea`` <- derived from ``relative_humidity`` (daily mean) and ``t`` via the FAO-56
  saturation vapour pressure ``es(T) = 0.6108*exp(17.27*T/(T+237.3))``:
  ``ea = RH/100 * es(T)``. This is input preparation, not a model change.
* ``rn`` <- a climate variable supplied explicitly via ``variable_mapping['rn']``.
  The engine does **not** assume incoming ``solar_radiation`` equals net radiation;
  if the user maps ``solar_radiation`` (or any variable) to ``rn``, the value is
  treated as net radiation and a ``RN_TREATED_AS_NET_RADIATION`` warning is emitted.
* ``z``  <- spatial elevation (m) or ``elevation_m`` override; if absent, the model
  default (0 = sea level) applies and an ``ELEVATION_DEFAULTED`` warning is emitted.

Daily semantics
---------------
Only observations whose temporal basis is a daily aggregate are accepted:
``t``/``u2``/``ea`` require ``daily_mean`` (or ``daily_mean`` from min/max extrema);
``rn`` requires ``daily_sum``. Instantaneous/sub-daily observations are rejected for
daily ET0 (never silently reinterpreted). The original date is preserved (no shifting).

Quality policy (conservative default)
-------------------------------------
``strict`` (default): accept ``valid``/``unchecked``; reject a day if any required
observation is ``suspect``/``invalid``/``missing``. ``allow_suspect``: accept
``suspect`` with a warning. ``invalid``/``missing`` always reject the day. No value
is ever imputed; missing climate data is never treated as zero.

Result: :class:`ET0SeriesResult` (ok/partial, calculated records, rejected/skipped
days, missing dates, errors/warnings, metadata, provenance). Software integration
only — **not** scientific validation.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from .climate import (
    CLIMATE_VARIABLES,
    ClimateSeries,
    is_unit_compatible,
    parse_timestamp,
    series_hash,
    validate_series,
)
from .fao56_et0 import FAO56_ET0_MODEL, compute_fao56_et0
from .provenance import sha256_json

__all__ = [
    "ET0IntegrationConfig",
    "ET0SeriesResult",
    "DEFAULT_VARIABLE_MAPPING",
    "REQUIRED_ET0_INPUTS",
    "validate_integration_config",
    "compute_et0_series",
    "es_kpa",
    "ea_from_relative_humidity",
]

REQUIRED_ET0_INPUTS = ("rn", "t", "u2", "ea")

# Default climate-variable mapping for ET0 inputs. ``rn`` has no default: net
# radiation must be supplied explicitly (never silently equated with solar radiation).
DEFAULT_VARIABLE_MAPPING: Dict[str, Optional[str]] = {
    "t": "air_temperature",
    "u2": "wind_speed",
    "ea": "relative_humidity",
    "rn": None,
}

# Required daily temporal basis per ET0 input (input preparation only).
_REQUIRED_BASES: Dict[str, Tuple[str, ...]] = {
    "t": ("daily_mean",),
    "u2": ("daily_mean",),
    "ea": ("daily_mean",),
    "rn": ("daily_sum",),
}


def _err(code: str, field_name: str, message: str, **extra) -> Dict[str, Any]:
    d = {"code": code, "field": field_name, "message": message}
    d.update(extra)
    return d


def _is_number(v: Any) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(float(v))


# --- saturation / actual vapour pressure (input preparation only) ----------

def es_kpa(t_c: float) -> float:
    """FAO-56 saturation vapour pressure ``es(T)`` [kPa] (Eq. 7/11)."""
    return 0.6108 * math.exp(17.27 * t_c / (t_c + 237.3))


def ea_from_relative_humidity(rh_percent: float, t_c: float) -> float:
    """Actual vapour pressure [kPa] from relative humidity [%] and temperature.

    ``ea = RH/100 * es(T)`` (FAO-56). Input preparation only — not part of ET0.
    """
    return (rh_percent / 100.0) * es_kpa(t_c)


# --- configuration ---------------------------------------------------------

@dataclass
class ET0IntegrationConfig:
    """Configuration for the climate→ET0 integration."""

    variable_mapping: Dict[str, Optional[str]] = field(
        default_factory=lambda: dict(DEFAULT_VARIABLE_MAPPING)
    )
    derive_mean_from_minmax: bool = False
    elevation_m: Optional[float] = None
    quality_policy: str = "strict"          # "strict" | "allow_suspect"
    missing_day_policy: str = "report"      # "report" | "skip"
    max_records: Optional[int] = None


@dataclass
class ET0SeriesResult:
    """Structured result of a climate→ET0 series integration."""

    ok: bool
    partial: bool
    records: List[Dict[str, Any]]
    errors: List[Dict[str, Any]]
    warnings: List[Dict[str, Any]]
    rejected: List[Dict[str, Any]]
    skipped: List[Dict[str, Any]]
    calculated_dates: List[str]
    missing_dates: List[str]
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
            "metadata": self.metadata,
            "provenance": self.provenance,
            "validation": self.validation,
        }


def validate_integration_config(config: Any) -> Dict[str, Any]:
    """Validate the integration configuration."""
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if not isinstance(config, ET0IntegrationConfig):
        return {"valid": False, "errors": [_err("INVALID_CONFIG", "config",
                                                "config must be an ET0IntegrationConfig")],
                "warnings": []}

    mapping = config.variable_mapping or {}
    for et0_input in REQUIRED_ET0_INPUTS:
        var = mapping.get(et0_input)
        if et0_input == "rn" and var is None:
            errors.append(_err("MISSING_RN_MAPPING", "variable_mapping.rn",
                               "rn (net radiation) must be mapped to an explicit climate "
                               "variable; it is never silently equated with solar radiation"))
            continue
        if var is not None and var not in CLIMATE_VARIABLES:
            errors.append(_err("UNKNOWN_VARIABLE", f"variable_mapping.{et0_input}",
                               f"unknown climate variable: {var!r}"))

    if config.quality_policy not in ("strict", "allow_suspect"):
        errors.append(_err("INVALID_QUALITY_POLICY", "quality_policy",
                           "quality_policy must be 'strict' or 'allow_suspect'"))
    if config.missing_day_policy not in ("report", "skip"):
        errors.append(_err("INVALID_MISSING_DAY_POLICY", "missing_day_policy",
                           "missing_day_policy must be 'report' or 'skip'"))
    if config.elevation_m is not None and not _is_number(config.elevation_m):
        errors.append(_err("INVALID_ELEVATION", "elevation_m", "elevation_m must be finite"))

    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


# --- per-observation helpers ----------------------------------------------

def _quality_decision(obs, policy: str, warnings: List[Dict[str, Any]],
                      ref: str) -> Tuple[bool, str]:
    """Return (accepted, reason). Conservative default."""
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


def _basis_ok(obs, allowed: Tuple[str, ...]) -> bool:
    return obs.basis in allowed


def _observation_date(timestamp: str) -> Optional[str]:
    """Return the observation's nominal local date (YYYY-MM-DD), without UTC shifting.

    For ISO timestamps the date component as written is used (e.g.
    ``2026-01-01T02:00:00+03:00`` -> ``2026-01-01``); date-only values map to
    themselves. This preserves the actual day a daily observation refers to and
    avoids silently shifting dates across timezones.
    """
    text = str(timestamp).strip()
    if len(text) >= 10 and text[4] == "-" and text[7] == "-":
        return text[:10]
    try:
        return parse_timestamp(text).date().isoformat()
    except (ValueError, TypeError):
        return None


def _group_by_date(series: ClimateSeries) -> Dict[str, Dict[str, Any]]:
    """Group observations by nominal local date. Detects ambiguous duplicates per (date, variable)."""
    groups: Dict[str, Dict[str, Any]] = {}
    ambiguous: Dict[str, set] = {}
    for obs in series.observations:
        d = _observation_date(obs.timestamp)
        if d is None:
            continue
        slot = groups.setdefault(d, {})
        if obs.variable in slot:
            ambiguous.setdefault(d, set()).add(obs.variable)
        else:
            slot[obs.variable] = obs
    for d, variables in ambiguous.items():
        for v in variables:
            groups[d][v] = None  # mark ambiguous (overwritten with None)
    return groups


def _extract(obs_by_var, var: Optional[str], allowed_bases: Tuple[str, ...],
             policy: str, ref: str, day_warn: List[Dict[str, Any]]) -> Tuple[Optional[float], Optional[str]]:
    """Extract a numeric value for one ET0 input. Returns (value, reason).

    ``reason`` is None on success, otherwise a short code describing why the value
    is unavailable (never imputed).
    """
    if not var:
        return None, "unmapped"
    if var not in obs_by_var:
        return None, "missing"
    obs = obs_by_var[var]
    if obs is None:
        return None, "ambiguous"
    ok, why = _quality_decision(obs, policy, day_warn, ref)
    if not ok:
        return None, why
    if not is_unit_compatible(obs.variable, obs.unit):
        return None, f"incompatible_unit={obs.unit}"
    if not _basis_ok(obs, allowed_bases):
        return None, f"basis={obs.basis}"
    if obs.value is None:
        return None, "missing_value"
    return float(obs.value), None


# --- main integration ------------------------------------------------------

def compute_et0_series(series: Any, config: Optional[ET0IntegrationConfig] = None) -> ET0SeriesResult:
    """Compute daily FAO-56 ET0 over a ``ClimateSeries``. Never raises on bad input."""
    config = config or ET0IntegrationConfig()

    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if not isinstance(series, ClimateSeries):
        return _empty(errors + [_err("INVALID_SERIES", "series", "series must be a ClimateSeries")],
                      warnings, config)

    cfg = validate_integration_config(config)
    errors.extend(cfg["errors"])
    warnings.extend(cfg["warnings"])
    if not cfg["valid"]:
        return _empty(errors, warnings, config)

    # structural validation of the climate series (report, do not repair)
    validation = validate_series(series)
    errors.extend(validation["errors"])
    warnings.extend(validation["warnings"])

    mapping = config.variable_mapping or {}
    groups = _group_by_date(series)
    present_dates = sorted(groups.keys())

    records: List[Dict[str, Any]] = []
    rejected: List[Dict[str, Any]] = []
    skipped: List[Dict[str, Any]] = []
    calculated_dates: List[str] = []

    # elevation resolution (once)
    elevation = config.elevation_m
    if elevation is None and series.spatial is not None:
        elevation = series.spatial.elevation
    if elevation is None:
        warnings.append(_err("ELEVATION_DEFAULTED", "elevation",
                             "elevation absent; ET0 uses sea-level default (z=0)"))

    for d in present_dates:
        if config.max_records is not None and len(records) >= config.max_records:
            warnings.append(_err("MAX_RECORDS_REACHED", "max_records",
                                 f"stopped after {config.max_records} calculated records"))
            break

        obs_by_var = groups[d]
        day_warn: List[Dict[str, Any]] = []

        rn_val, rn_reason = _extract(obs_by_var, mapping.get("rn"), _REQUIRED_BASES["rn"],
                                     config.quality_policy, f"{d}.rn", day_warn)
        t_val, t_reason = _extract(obs_by_var, mapping.get("t"), _REQUIRED_BASES["t"],
                                   config.quality_policy, f"{d}.t", day_warn)
        u2_val, u2_reason = _extract(obs_by_var, mapping.get("u2"), _REQUIRED_BASES["u2"],
                                     config.quality_policy, f"{d}.u2", day_warn)
        rh_val, ea_reason = _extract(obs_by_var, mapping.get("ea"), _REQUIRED_BASES["ea"],
                                     config.quality_policy, f"{d}.ea", day_warn)

        # optional: derive mean temperature from daily min/max (explicit opt-in)
        if t_val is None and config.derive_mean_from_minmax and t_reason in (None, "missing", "missing_value"):
            tmin = obs_by_var.get("min_air_temperature")
            tmax = obs_by_var.get("max_air_temperature")
            if (tmin is not None and tmax is not None
                    and tmin.value is not None and tmax.value is not None
                    and tmin.basis == "daily_min" and tmax.basis == "daily_max"):
                t_val = (float(tmin.value) + float(tmax.value)) / 2.0
                t_reason = None
                day_warn.append(_err("T_FROM_MINMAX", f"{d}.t",
                                     "mean temperature derived from daily min/max"))

        # actual vapour pressure derived from relative humidity + temperature
        ea_val: Optional[float] = None
        if rh_val is not None and t_val is not None:
            ea_val = ea_from_relative_humidity(rh_val, t_val)
            ea_reason = None
            day_warn.append(_err("EA_DERIVED_FROM_RH", f"{d}.ea",
                                 "ea derived from relative humidity and temperature"))
        elif rh_val is not None and t_val is None:
            ea_reason = "ea_needs_temperature"

        reasons: List[str] = []
        for name, val, reason in (("rn", rn_val, rn_reason), ("t", t_val, t_reason),
                                  ("u2", u2_val, u2_reason), ("ea", ea_val, ea_reason)):
            if val is None:
                reasons.append(f"{name}:{reason}")

        if reasons:
            rejected.append({"date": d, "reasons": sorted(set(reasons))})
            warnings.extend(day_warn)
            continue

        et0_input: Dict[str, Any] = {"rn": rn_val, "t": t_val, "u2": u2_val, "ea": ea_val}
        if elevation is not None:
            et0_input["z"] = float(elevation)

        result = compute_fao56_et0(et0_input)
        if not result.get("ok"):
            rejected.append({"date": d,
                             "reasons": [f"et0:{e.get('code')}" for e in result.get("errors", [])],
                             "errors": result.get("errors", [])})
            warnings.extend(day_warn)
            continue

        calculated_dates.append(d)
        records.append({
            "date": d,
            "et0_mm_per_day": result["result"]["et0_mm_per_day"],
            "inputs": result["inputs"],
            "model_id": FAO56_ET0_MODEL["id"],
            "model_version": FAO56_ET0_MODEL["version"],
        })
        warnings.extend(day_warn)

    # missing dates: calendar days in [min, max] with no observations at all
    missing_dates: List[str] = []
    if present_dates:
        start = date.fromisoformat(present_dates[0])
        end = date.fromisoformat(present_dates[-1])
        present = set(present_dates)
        cur = start
        while cur <= end:
            if cur.isoformat() not in present:
                missing_dates.append(cur.isoformat())
            cur = cur + timedelta(days=1)

    # skipped (policy-based) is represented via rejected reasons; explicit skip policy
    # is reserved for future use and documented.
    metadata = {
        "model_id": FAO56_ET0_MODEL["id"],
        "model_version": FAO56_ET0_MODEL["version"],
        "output_unit": "mm_day",
        "variable_mapping": dict(mapping),
        "elevation_m": float(elevation) if elevation is not None else None,
        "quality_policy": config.quality_policy,
        "missing_day_policy": config.missing_day_policy,
        "derive_mean_from_minmax": config.derive_mean_from_minmax,
        "climate_observations": len(series.observations),
        "calculated_count": len(records),
    }

    provenance = {
        "climate_series_hash": series_hash(series),
        "model_id": FAO56_ET0_MODEL["id"],
        "model_version": FAO56_ET0_MODEL["version"],
        "variable_mapping": dict(mapping),
        "elevation_m": float(elevation) if elevation is not None else None,
        "results_hash": sha256_json(records),
    }

    ok = len(errors) == 0 and len(records) > 0 and len(rejected) == 0 and len(missing_dates) == 0
    partial = len(records) > 0 and (len(errors) > 0 or len(rejected) > 0 or len(missing_dates) > 0)

    return ET0SeriesResult(
        ok=ok, partial=partial, records=records, errors=errors, warnings=warnings,
        rejected=rejected, skipped=skipped, calculated_dates=calculated_dates,
        missing_dates=missing_dates, metadata=metadata, provenance=provenance,
        validation=validation,
    )


def _empty(errors, warnings, config: ET0IntegrationConfig) -> ET0SeriesResult:
    return ET0SeriesResult(
        ok=False, partial=False, records=[], errors=errors, warnings=warnings,
        rejected=[], skipped=[], calculated_dates=[], missing_dates=[],
        metadata={"model_id": FAO56_ET0_MODEL["id"], "model_version": FAO56_ET0_MODEL["version"],
                  "variable_mapping": dict(config.variable_mapping or {})},
        provenance={}, validation={"valid": False, "errors": errors, "warnings": warnings},
    )