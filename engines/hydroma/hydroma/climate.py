"""Climate Data Foundation: source-independent climate observation & series contracts.

A lightweight, dependency-free (stdlib-only) layer that describes climate
observations and time series so that HyDroMA scientific models (FAO-56 ET0, daily
soil-water balance, crop-water, irrigation) can consume climate data through a
single, deterministic contract — independent of any weather provider, network,
database, GIS or HTTP service.

Design principles (mirrors the rest of the engine)
--------------------------------------------------
* Explicit units; no silent conversion (only the canonical unit per variable).
* No silent repair / interpolation / aggregation / discarding of observations.
  Structural validation only *reports* problems (errors/warnings).
* Deterministic serialization (canonical JSON via :mod:`hydroma.provenance`).
* Quality flags never modify values; they annotate them.
* Missing data is represented explicitly, never assumed to be zero.
* Software-tested; NOT scientifically validated.

Main types
----------
* :class:`ClimateObservation` — one variable/value/unit/time/basis/quality record.
* :class:`ClimateSeries` — ordered observations + optional resolution/spatial/provenance.
* :class:`SpatialContext` — optional lat/lon/elevation/station/source.
* :class:`DataProvenance` — lightweight source/processing/qc metadata.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from .provenance import sha256_json

__all__ = [
    "CLIMATE_VARIABLES",
    "CLIMATE_VARIABLE_IDS",
    "TEMPORAL_BASES",
    "QUALITY_FLAGS",
    "MISSING_DATA_POLICIES",
    "ClimateObservation",
    "ClimateSeries",
    "SpatialContext",
    "DataProvenance",
    "GEOGRAPHIC_CRS",
    "is_geographic_crs",
    "validate_observation",
    "validate_series",
    "validate_spatial",
    "validate_provenance",
    "validate_missing_data_policy",
    "is_unit_compatible",
    "is_valid_quality",
    "parse_timestamp",
    "parse_resolution",
    "missing_periods",
    "observation_to_dict",
    "observation_from_dict",
    "series_to_dict",
    "series_from_dict",
    "series_hash",
    "canonical_series_json",
]

# --- variables, canonical units and allowed temporal bases -----------------

# Each variable declares its canonical unit, the units accepted for it, and the
# temporal bases that are meaningful for it. Values are never auto-converted.
CLIMATE_VARIABLES: Dict[str, Dict[str, Any]] = {
    "air_temperature": {
        "canonical_unit": "degC",
        "units": ("degC",),
        "bases": ("instant", "period_mean", "daily_mean"),
        "description": "air temperature",
    },
    "min_air_temperature": {
        "canonical_unit": "degC",
        "units": ("degC",),
        "bases": ("instant", "daily_min"),
        "description": "minimum air temperature (daily extremum)",
    },
    "max_air_temperature": {
        "canonical_unit": "degC",
        "units": ("degC",),
        "bases": ("instant", "daily_max"),
        "description": "maximum air temperature (daily extremum)",
    },
    "precipitation": {
        "canonical_unit": "mm",
        "units": ("mm",),
        "bases": ("period_sum", "daily_sum"),
        "description": "precipitation accumulation",
    },
    "relative_humidity": {
        "canonical_unit": "%",
        "units": ("%",),
        "bases": ("instant", "period_mean", "daily_mean"),
        "description": "relative humidity",
    },
    "wind_speed": {
        "canonical_unit": "m/s",
        "units": ("m/s",),
        "bases": ("instant", "period_mean", "daily_mean"),
        "description": "wind speed",
    },
    "solar_radiation": {
        "canonical_unit": "MJ/m2/day",
        "units": ("MJ/m2/day",),
        "bases": ("period_sum", "daily_sum"),
        "description": "solar radiation (accumulated over the period)",
    },
    "evaporation": {
        "canonical_unit": "mm",
        "units": ("mm",),
        "bases": ("period_sum", "daily_sum"),
        "description": "evaporation (accumulated over the period)",
    },
}

CLIMATE_VARIABLE_IDS = tuple(CLIMATE_VARIABLES.keys())

# Temporal semantics (kept distinct; a daily value is not an instant).
TEMPORAL_BASES = (
    "instant",       # instantaneous value at the timestamp
    "period_mean",   # mean over the preceding period ending at the timestamp
    "period_sum",    # accumulation over the preceding period ending at the timestamp
    "daily_mean",    # mean over the calendar day
    "daily_min",     # minimum over the calendar day
    "daily_max",     # maximum over the calendar day
    "daily_sum",     # accumulation over the calendar day
)

# Quality flags (extensible; values are never modified by a flag).
QUALITY_FLAGS = ("unchecked", "valid", "suspect", "invalid", "missing")

# Explicit missing-data policies for future model integrations (no algorithms here).
MISSING_DATA_POLICIES = ("error", "skip", "flag_only")

_RES_RE = re.compile(r"^(\d+)([smhd])$")
_RES_SECONDS = {"s": 1, "m": 60, "h": 3600, "d": 86400}


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def is_valid_quality(flag: Any) -> bool:
    return flag in QUALITY_FLAGS


def is_unit_compatible(variable: str, unit: Any) -> bool:
    """True iff ``unit`` is an accepted (canonical) unit for ``variable``."""
    spec = CLIMATE_VARIABLES.get(variable)
    if spec is None or not isinstance(unit, str):
        return False
    return unit in spec["units"]


def validate_missing_data_policy(policy: Any) -> bool:
    return policy in MISSING_DATA_POLICIES


def parse_timestamp(value: Any) -> datetime:
    """Parse an ISO-8601 date/timestamp to a naive UTC ``datetime``.

    A date-only value (``YYYY-MM-DD``) is interpreted as midnight UTC. A value
    with an explicit offset is converted to UTC; a value without an offset is
    interpreted as UTC. Raises ``ValueError`` on an unparseable value.
    """
    if not isinstance(value, str) or not value.strip():
        raise ValueError("timestamp must be a non-empty ISO-8601 string")
    text = value.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    dt = datetime.fromisoformat(text)
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def parse_resolution(value: Any) -> timedelta:
    """Parse a simple resolution string like ``1d``, ``3h``, ``30m``, ``900s``.

    Returns a :class:`datetime.timedelta`. Raises ``ValueError`` otherwise.
    """
    if not isinstance(value, str):
        raise ValueError("temporal_resolution must be a string like '1d', '3h', '30m'")
    match = _RES_RE.match(value.strip())
    if not match:
        raise ValueError(f"invalid temporal_resolution: {value!r}")
    n = int(match.group(1))
    if n <= 0:
        raise ValueError("temporal_resolution must be a positive multiple")
    return timedelta(seconds=n * _RES_SECONDS[match.group(2)])


# --- dataclasses -----------------------------------------------------------

@dataclass
class ClimateObservation:
    """A single climate observation (one variable/value/unit/time/quality)."""

    variable: str
    value: Optional[float]
    unit: str
    timestamp: str
    basis: str
    quality: str = "unchecked"
    source: Optional[Dict[str, Any]] = None
    accumulation_start: Optional[str] = None  # ISO period start (for accumulated fluxes)
    accumulation_end: Optional[str] = None    # ISO period end (== timestamp for accumulated)

    def to_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {
            "variable": self.variable,
            "value": self.value,
            "unit": self.unit,
            "timestamp": self.timestamp,
            "basis": self.basis,
            "quality": self.quality,
        }
        if self.source is not None:
            d["source"] = self.source
        if self.accumulation_start is not None:
            d["accumulation_start"] = self.accumulation_start
        if self.accumulation_end is not None:
            d["accumulation_end"] = self.accumulation_end
        return d

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "ClimateObservation":
        return cls(
            variable=d["variable"],
            value=d.get("value"),
            unit=d["unit"],
            timestamp=d["timestamp"],
            basis=d["basis"],
            quality=d.get("quality", "unchecked"),
            source=d.get("source"),
            accumulation_start=d.get("accumulation_start"),
            accumulation_end=d.get("accumulation_end"),
        )


@dataclass
class SpatialContext:
    """Optional spatial context for a climate series."""

    latitude: Optional[float] = None
    longitude: Optional[float] = None
    elevation: Optional[float] = None
    station_id: Optional[str] = None
    source_id: Optional[str] = None
    crs: Optional[str] = None  # coordinate reference system identifier (never inferred)

    def to_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {}
        for key in ("latitude", "longitude", "elevation", "station_id", "source_id", "crs"):
            val = getattr(self, key)
            if val is not None:
                d[key] = val
        return d

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "SpatialContext":
        return cls(
            latitude=d.get("latitude"),
            longitude=d.get("longitude"),
            elevation=d.get("elevation"),
            station_id=d.get("station_id"),
            source_id=d.get("source_id"),
            crs=d.get("crs"),
        )


# Supported geographic CRS identifiers (case-insensitive). Anything else that is
# present is treated as NOT a supported geographic CRS (e.g. projected) - geographic
# lat/lon bounds are NOT applied. Absent/unknown CRS => bounds are not evaluated.
GEOGRAPHIC_CRS = {
    "epsg:4326", "ogc:crs84", "crs84", "wgs84", "wgs 84", "geographic",
}


def is_geographic_crs(crs: Optional[str]) -> bool:
    """True only when *crs* is an explicitly supported geographic CRS. Never infers."""
    return crs is not None and crs.strip().lower() in GEOGRAPHIC_CRS


@dataclass
class DataProvenance:
    """Lightweight provenance for climate data (kept compatible with the engine)."""

    source_id: Optional[str] = None
    source_type: Optional[str] = None
    retrieved_at: Optional[str] = None
    original_units: Optional[Dict[str, str]] = None
    processing_history: List[str] = field(default_factory=list)
    qc_history: List[str] = field(default_factory=list)
    dataset_version: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {}
        for key in ("source_id", "source_type", "retrieved_at", "dataset_version"):
            val = getattr(self, key)
            if val is not None:
                d[key] = val
        if self.original_units is not None:
            d["original_units"] = self.original_units
        if self.processing_history:
            d["processing_history"] = list(self.processing_history)
        if self.qc_history:
            d["qc_history"] = list(self.qc_history)
        return d

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "DataProvenance":
        return cls(
            source_id=d.get("source_id"),
            source_type=d.get("source_type"),
            retrieved_at=d.get("retrieved_at"),
            original_units=d.get("original_units"),
            processing_history=list(d.get("processing_history", [])),
            qc_history=list(d.get("qc_history", [])),
            dataset_version=d.get("dataset_version"),
        )


@dataclass
class ClimateSeries:
    """An ordered set of climate observations with optional resolution/context."""

    observations: List[ClimateObservation]
    variable: Optional[str] = None
    temporal_resolution: Optional[str] = None
    spatial: Optional[SpatialContext] = None
    provenance: Optional[DataProvenance] = None
    missing_data_policy: str = "flag_only"

    def to_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {
            "observations": [o.to_dict() for o in self.observations],
            "missing_data_policy": self.missing_data_policy,
        }
        if self.variable is not None:
            d["variable"] = self.variable
        if self.temporal_resolution is not None:
            d["temporal_resolution"] = self.temporal_resolution
        if self.spatial is not None:
            d["spatial"] = self.spatial.to_dict()
        if self.provenance is not None:
            d["provenance"] = self.provenance.to_dict()
        return d

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "ClimateSeries":
        return cls(
            observations=[ClimateObservation.from_dict(o) for o in d.get("observations", [])],
            variable=d.get("variable"),
            temporal_resolution=d.get("temporal_resolution"),
            spatial=SpatialContext.from_dict(d["spatial"]) if d.get("spatial") else None,
            provenance=DataProvenance.from_dict(d["provenance"]) if d.get("provenance") else None,
            missing_data_policy=d.get("missing_data_policy", "flag_only"),
        )


# --- serialization helpers -------------------------------------------------

def observation_to_dict(obs: ClimateObservation) -> Dict[str, Any]:
    return obs.to_dict()


def observation_from_dict(d: Dict[str, Any]) -> ClimateObservation:
    return ClimateObservation.from_dict(d)


def series_to_dict(series: ClimateSeries) -> Dict[str, Any]:
    return series.to_dict()


def series_from_dict(d: Dict[str, Any]) -> ClimateSeries:
    return ClimateSeries.from_dict(d)


def canonical_series_json(series: ClimateSeries) -> str:
    """Deterministic JSON of a series (sorted keys, compact, UTF-8)."""
    from .provenance import canonical_json

    return canonical_json(series.to_dict())


def series_hash(series: ClimateSeries) -> str:
    """SHA-256 of the canonical series representation (existing hashing utility)."""
    return sha256_json(series.to_dict())


# --- validation ------------------------------------------------------------

def _err(code: str, field: str, message: str, **extra) -> Dict[str, Any]:
    d = {"code": code, "field": field, "message": message}
    d.update(extra)
    return d


def validate_observation(obs: Any) -> Dict[str, Any]:
    """Validate a single observation. Returns ``{"valid", "errors", "warnings"}``."""
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if not isinstance(obs, ClimateObservation):
        return {"valid": False, "errors": [_err("INVALID_OBSERVATION", "observation",
                                                "observation must be a ClimateObservation")],
                "warnings": []}

    spec = CLIMATE_VARIABLES.get(obs.variable)
    if spec is None:
        errors.append(_err("UNKNOWN_VARIABLE", "variable",
                           f"unknown climate variable: {obs.variable!r}"))
    else:
        if obs.unit not in spec["units"]:
            errors.append(_err("INCOMPATIBLE_UNIT", "unit",
                               f"unit {obs.unit!r} is not compatible with {obs.variable!r} "
                               f"(expected {spec['canonical_unit']!r})"))
        if obs.basis not in TEMPORAL_BASES:
            errors.append(_err("INVALID_BASIS", "basis", f"invalid temporal basis: {obs.basis!r}"))
        elif obs.basis not in spec["bases"]:
            errors.append(_err("BASIS_INCOMPATIBLE", "basis",
                               f"basis {obs.basis!r} is not valid for {obs.variable!r}"))

    # value / quality relationship (missing values are explicit, never assumed)
    if obs.quality not in QUALITY_FLAGS:
        errors.append(_err("INVALID_QUALITY", "quality", f"invalid quality flag: {obs.quality!r}"))
    if obs.value is None:
        if obs.quality != "missing":
            errors.append(_err("MISSING_VALUE_WITHOUT_FLAG", "value",
                               "a null value requires quality 'missing'"))
    else:
        if not _is_number(obs.value):
            errors.append(_err("INVALID_VALUE", "value", "value must be a finite number"))
        if obs.quality == "missing":
            errors.append(_err("VALUE_WITH_MISSING_FLAG", "value",
                               "quality 'missing' requires a null value"))

    # temporal representation
    try:
        parse_timestamp(obs.timestamp)
    except (ValueError, TypeError):
        errors.append(_err("INVALID_TIMESTAMP", "timestamp",
                           f"timestamp is not a valid ISO-8601 date/time: {obs.timestamp!r}"))

    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


def validate_spatial(spatial: Any) -> Dict[str, Any]:
    """Validate optional spatial context (CRS-aware: geographic bounds only for a geographic CRS)."""
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []
    if spatial is None:
        return {"valid": True, "errors": [], "warnings": []}
    if not isinstance(spatial, SpatialContext):
        return {"valid": False, "errors": [_err("INVALID_SPATIAL", "spatial",
                                                "spatial must be a SpatialContext")], "warnings": []}
    lat, lon, elev = spatial.latitude, spatial.longitude, spatial.elevation
    geo = is_geographic_crs(spatial.crs)
    if (lat is not None or lon is not None) and not geo:
        warnings.append(_err("SPATIAL_BOUNDS_NOT_EVALUATED", "spatial.crs",
                             "geographic lat/lon bounds not evaluated (CRS is not a supported geographic CRS)"))
    if lat is not None:
        if not _is_number(lat):
            errors.append(_err("INVALID_LATITUDE", "latitude", f"latitude must be finite: {lat!r}"))
        elif geo and not (-90.0 <= float(lat) <= 90.0):
            errors.append(_err("INVALID_LATITUDE", "latitude", f"latitude out of range: {lat!r}"))
    if lon is not None:
        if not _is_number(lon):
            errors.append(_err("INVALID_LONGITUDE", "longitude", f"longitude must be finite: {lon!r}"))
        elif geo and not (-180.0 <= float(lon) <= 180.0):
            errors.append(_err("INVALID_LONGITUDE", "longitude", f"longitude out of range: {lon!r}"))
    if elev is not None and not _is_number(elev):
        errors.append(_err("INVALID_ELEVATION", "elevation", f"elevation must be finite: {elev!r}"))
    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


def validate_provenance(prov: Any) -> Dict[str, Any]:
    """Validate optional provenance metadata (lightweight, permissive)."""
    errors: List[Dict[str, Any]] = []
    if prov is None:
        return {"valid": True, "errors": [], "warnings": []}
    if not isinstance(prov, DataProvenance):
        return {"valid": False, "errors": [_err("INVALID_PROVENANCE", "provenance",
                                                "provenance must be a DataProvenance")], "warnings": []}
    for key in ("processing_history", "qc_history"):
        val = getattr(prov, key)
        if not isinstance(val, list) or not all(isinstance(x, str) for x in val):
            errors.append(_err("INVALID_PROVENANCE", key, f"{key} must be a list of strings"))
    return {"valid": len(errors) == 0, "errors": errors, "warnings": []}


def validate_series(series: Any) -> Dict[str, Any]:
    """Validate a climate series: observations, ordering, duplicates, resolution,
    missing periods, spatial and provenance. Returns ``{"valid","errors","warnings"}``.

    Structural validation only — it never repairs, sorts, aggregates or drops data.
    """
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if not isinstance(series, ClimateSeries):
        return {"valid": False, "errors": [_err("INVALID_SERIES", "series",
                                                "series must be a ClimateSeries")], "warnings": []}

    if not validate_missing_data_policy(series.missing_data_policy):
        errors.append(_err("INVALID_MISSING_POLICY", "missing_data_policy",
                           f"invalid missing-data policy: {series.missing_data_policy!r}"))

    # per-observation validation (indexed)
    for i, obs in enumerate(series.observations):
        res = validate_observation(obs)
        for e in res["errors"]:
            errors.append(_err(e["code"], f"observations[{i}].{e['field']}", e["message"]))
        for w in res["warnings"]:
            warnings.append(_err(w["code"], f"observations[{i}].{w['field']}", w["message"]))

    if not series.observations:
        warnings.append(_err("EMPTY_SERIES", "observations", "series contains no observations"))
    else:
        # variable consistency
        variables = {o.variable for o in series.observations}
        if series.variable is not None:
            for i, obs in enumerate(series.observations):
                if obs.variable != series.variable:
                    errors.append(_err("VARIABLE_MISMATCH", f"observations[{i}].variable",
                                       f"series variable {series.variable!r} != "
                                       f"observation variable {obs.variable!r}"))
        elif len(variables) > 1:
            warnings.append(_err("MIXED_VARIABLES", "variable",
                                 f"series mixes variables: {sorted(variables)}"))

        # ordering + duplicates/conflicts
        try:
            times = [parse_timestamp(o.timestamp) for o in series.observations]
        except (ValueError, TypeError):
            times = None
        if times is not None:
            out_of_order = any(times[i] > times[i + 1] for i in range(len(times) - 1))
            if out_of_order:
                warnings.append(_err("OUT_OF_ORDER", "observations",
                                     "observations are not in ascending time order"))
            # Duplicate/conflict detection is per (timestamp, variable): a
            # multi-variable series legitimately carries several variables at the
            # same timestamp, which is not a conflict.
            seen: Dict[Any, int] = {}
            for i, t in enumerate(times):
                key = (t, series.observations[i].variable)
                if key in seen:
                    j = seen[key]
                    if series.observations[j].value == series.observations[i].value:
                        warnings.append(_err("DUPLICATE_OBSERVATION", f"observations[{i}].timestamp",
                                             f"duplicate timestamp {series.observations[i].timestamp!r}"))
                    else:
                        errors.append(_err("CONFLICTING_OBSERVATION", f"observations[{i}].timestamp",
                                           f"conflicting values at {series.observations[i].timestamp!r}"))
                else:
                    seen[key] = i
            # missing periods (only when resolution is defined)
            if series.temporal_resolution is not None:
                try:
                    res_delta = parse_resolution(series.temporal_resolution)
                    ordered = sorted(range(len(times)), key=lambda k: times[k])
                    for a, b in zip(ordered, ordered[1:]):
                        expected = times[a] + res_delta
                        if times[b] > expected:
                            step = res_delta.total_seconds()
                            n_missing = int(round((times[b] - expected).total_seconds() / step))
                            warnings.append(_err(
                                "MISSING_PERIODS", "observations",
                                f"{n_missing} missing period(s) between "
                                f"{series.observations[a].timestamp!r} and "
                                f"{series.observations[b].timestamp!r}",
                                after=series.observations[a].timestamp,
                                missing_count=n_missing,
                            ))
                except ValueError as exc:
                    errors.append(_err("INVALID_RESOLUTION", "temporal_resolution", str(exc)))
            else:
                # resolution not defined: cannot check missing periods (informational)
                pass
        else:
            # temporal resolution parse check even if timestamps are bad
            if series.temporal_resolution is not None:
                try:
                    parse_resolution(series.temporal_resolution)
                except ValueError as exc:
                    errors.append(_err("INVALID_RESOLUTION", "temporal_resolution", str(exc)))

    # spatial + provenance
    sp = validate_spatial(series.spatial)
    errors.extend(sp["errors"])
    warnings.extend(sp["warnings"])
    pv = validate_provenance(series.provenance)
    errors.extend(pv["errors"])
    warnings.extend(pv["warnings"])

    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


def missing_periods(series: ClimateSeries) -> List[Dict[str, Any]]:
    """Return explicit missing-period descriptors (requires ``temporal_resolution``).

    Each entry: ``{"after", "expected", "missing_count"}``. Raises ``ValueError``
    if the series has no resolvable ``temporal_resolution``. Does not modify the
    series and never fabricates values.
    """
    if not isinstance(series, ClimateSeries):
        raise ValueError("series must be a ClimateSeries")
    if series.temporal_resolution is None:
        raise ValueError("temporal_resolution is required to detect missing periods")
    res = parse_resolution(series.temporal_resolution)
    if len(series.observations) < 2:
        return []
    ordered = sorted(series.observations, key=lambda o: parse_timestamp(o.timestamp))
    gaps: List[Dict[str, Any]] = []
    for a, b in zip(ordered, ordered[1:]):
        ta = parse_timestamp(a.timestamp)
        tb = parse_timestamp(b.timestamp)
        expected = ta + res
        if tb > expected:
            n = int(round((tb - expected).total_seconds() / res.total_seconds()))
            gaps.append({
                "after": a.timestamp,
                "expected": expected.replace(microsecond=0).isoformat(),
                "missing_count": n,
            })
    return gaps