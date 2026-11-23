"""Climate Dataset Import & Normalization (Phase 2.8).

Transforms user-provided climate files (CSV / JSON) into the existing HyDroMA
climate contract (:mod:`hydroma.climate`) **without** silently changing,
discarding, inventing or scientifically interpreting data.

Design principles
-----------------
* Source-independent, stdlib-only (``csv`` + ``json``); no network/DB/GIS/HTTP.
* Explicit configuration: column mapping, units, conversions, date format,
  timezone, missing-value markers, quality mapping — nothing is guessed.
* No silent unit conversion: only explicitly configured, unambiguous conversions
  from a small fixed registry are applied; the original unit/value is preserved
  in import metadata.
* No silent repair: missing/invalid data is represented explicitly (missing →
  ``quality="missing"``; invalid → structured error). No interpolation/imputation.
* Structured :class:`ImportResult` with errors/warnings/counts and explicit
  partial-success semantics.

Supported formats
-----------------
* CSV  — headers + explicit ``variable_columns`` mapping + timestamp column.
* JSON — the existing climate serialization contract: either a serialized
  ``ClimateSeries`` object (``{"observations": [...], ...}``) or a bare list of
  observation objects (same observation schema).
"""

from __future__ import annotations

import csv
import io
import json
import math
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from .climate import (
    CLIMATE_VARIABLES,
    ClimateObservation,
    ClimateSeries,
    DataProvenance,
    SpatialContext,
    is_unit_compatible,
    missing_periods,
    observation_from_dict,
    parse_resolution,
    series_from_dict,
    validate_series,
)

__all__ = [
    "ImportConfig",
    "ImportResult",
    "CONVERSIONS",
    "SUPPORTED_FORMATS",
    "validate_config",
    "import_csv",
    "import_json",
    "import_climate_data",
    "import_file",
    "apply_conversion",
]

SUPPORTED_FORMATS = ("csv", "json")

# --- explicit, unambiguous unit conversions --------------------------------
# Each conversion is a pure, named, tested function with a declared from/to unit
# and the variables it applies to. No general-purpose conversion framework.
def _degf_to_degc(v: float) -> float:
    return (v - 32.0) * 5.0 / 9.0


def _cm_to_mm(v: float) -> float:
    return v * 10.0


def _kmh_to_ms(v: float) -> float:
    return v / 3.6


def _fraction_to_percent(v: float) -> float:
    return v * 100.0


CONVERSIONS: Dict[str, Dict[str, Any]] = {
    "degF_to_degC": {
        "from": "degF", "to": "degC", "fn": _degf_to_degc,
        "variables": ("air_temperature", "min_air_temperature", "max_air_temperature"),
    },
    "cm_to_mm": {
        "from": "cm", "to": "mm", "fn": _cm_to_mm,
        "variables": ("precipitation", "evaporation"),
    },
    "kmh_to_ms": {
        "from": "km/h", "to": "m/s", "fn": _kmh_to_ms,
        "variables": ("wind_speed",),
    },
    "fraction_to_percent": {
        "from": "fraction", "to": "%", "fn": _fraction_to_percent,
        "variables": ("relative_humidity",),
    },
}

# Solar radiation is intentionally NOT convertible here (no unambiguous numeric
# conversion without an explicit physical/temporal basis); a mismatched unit is
# rejected with UNSUPPORTED_CONVERSION.

_DEFAULT_MISSING_MARKERS = ("", "NA", "N/A", "null", "NULL", "NaN", "nan")


def apply_conversion(name: str, value: float) -> float:
    """Apply a named conversion (deterministic, pure)."""
    spec = CONVERSIONS.get(name)
    if spec is None:
        raise ValueError(f"unknown conversion: {name!r}")
    return float(spec["fn"](float(value)))


# --- configuration ---------------------------------------------------------

@dataclass
class ImportConfig:
    """Structured import configuration (validated before parsing)."""

    format: str = "csv"
    # CSV
    timestamp_column: Optional[str] = None
    variable_columns: Dict[str, str] = field(default_factory=dict)  # variable_id -> column
    # units / basis
    input_units: Dict[str, str] = field(default_factory=dict)      # variable_id -> input unit
    conversions: Dict[str, str] = field(default_factory=dict)      # variable_id -> conversion name
    basis: Optional[str] = None                                    # global temporal basis
    variable_basis: Dict[str, str] = field(default_factory=dict)   # per-variable override
    temporal_resolution: Optional[str] = None
    # time
    date_format: Optional[str] = None       # explicit strptime format (CSV); enables non-ISO
    timezone: Optional[str] = None          # "UTC" or fixed offset "+HH:MM" for naive datetimes
    # missing / quality
    missing_markers: List[str] = field(default_factory=lambda: list(_DEFAULT_MISSING_MARKERS))
    quality_column: Optional[str] = None
    quality_mapping: Dict[str, str] = field(default_factory=dict)
    quality_default: str = "unchecked"
    on_unknown_quality: str = "error"       # "error" | "warn"
    # context
    station_id: Optional[str] = None
    spatial: Optional[Dict[str, Any]] = None
    source: Optional[Dict[str, Any]] = None
    dataset_version: Optional[str] = None
    source_file: Optional[str] = None


@dataclass
class ImportResult:
    """Structured import outcome with explicit partial-success semantics."""

    ok: bool
    series: Optional[ClimateSeries]
    errors: List[Dict[str, Any]]
    warnings: List[Dict[str, Any]]
    records_processed: int
    records_accepted: int
    records_rejected: int
    missing_value_count: int
    missing_periods: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    validation: Dict[str, Any]

    @property
    def partial(self) -> bool:
        """True when some observations were imported but errors remain."""
        return bool(self.errors) and self.series is not None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ok": self.ok,
            "partial": self.partial,
            "series": self.series.to_dict() if self.series is not None else None,
            "errors": self.errors,
            "warnings": self.warnings,
            "records_processed": self.records_processed,
            "records_accepted": self.records_accepted,
            "records_rejected": self.records_rejected,
            "missing_value_count": self.missing_value_count,
            "missing_periods": self.missing_periods,
            "metadata": self.metadata,
            "validation": self.validation,
        }


def _err(code: str, field_name: str, message: str, **extra) -> Dict[str, Any]:
    d = {"code": code, "field": field_name, "message": message}
    d.update(extra)
    return d


def _canonical_unit(variable: str) -> Optional[str]:
    spec = CLIMATE_VARIABLES.get(variable)
    return spec["canonical_unit"] if spec else None


def _base_unit(unit: str) -> str:
    return unit.split(";", 1)[0].strip() if isinstance(unit, str) else unit


def validate_config(config: Any, headers: Optional[List[str]] = None) -> Dict[str, Any]:
    """Validate an import configuration (optionally against CSV ``headers``)."""
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if not isinstance(config, ImportConfig):
        return {"valid": False, "errors": [_err("INVALID_CONFIG", "config",
                                                "config must be an ImportConfig")], "warnings": []}

    if config.format not in SUPPORTED_FORMATS:
        errors.append(_err("INVALID_FORMAT", "format",
                           f"format must be one of {SUPPORTED_FORMATS}, got {config.format!r}"))

    # variable mapping (required for CSV; JSON carries variables per observation)
    if config.format == "csv" and not config.variable_columns:
        errors.append(_err("MISSING_VARIABLE_MAPPING", "variable_columns",
                           "at least one variable->column mapping is required for CSV"))
    for var, col in config.variable_columns.items():
        if var not in CLIMATE_VARIABLES:
            errors.append(_err("UNKNOWN_VARIABLE", f"variable_columns.{var}",
                               f"unknown climate variable: {var!r}"))
        if not isinstance(col, str) or not col:
            errors.append(_err("INVALID_COLUMN_MAPPING", f"variable_columns.{var}",
                               "column name must be a non-empty string"))
        elif headers is not None and col not in headers:
            errors.append(_err("MISSING_COLUMN", f"variable_columns.{var}",
                               f"column {col!r} not found in headers"))

    if config.format == "csv":
        if not config.timestamp_column:
            errors.append(_err("MISSING_TIMESTAMP_COLUMN", "timestamp_column",
                               "timestamp_column is required for CSV"))
        elif headers is not None and config.timestamp_column not in headers:
            errors.append(_err("MISSING_COLUMN", "timestamp_column",
                               f"timestamp column {config.timestamp_column!r} not found"))
        if config.quality_column and headers is not None and config.quality_column not in headers:
            errors.append(_err("MISSING_COLUMN", "quality_column",
                               f"quality column {config.quality_column!r} not found"))

    # basis
    basis_values = set()
    if config.basis:
        basis_values.add(config.basis)
    basis_values.update(config.variable_basis.values())
    for b in basis_values:
        if b not in _all_bases():
            errors.append(_err("INVALID_BASIS", "basis", f"invalid temporal basis: {b!r}"))
    if config.format == "csv" and not basis_values:
        errors.append(_err("MISSING_BASIS", "basis",
                           "a temporal basis is required (basis or variable_basis)"))

    # units + conversions
    for var in config.variable_columns:
        canonical = _canonical_unit(var)
        if canonical is None:
            continue
        input_unit = config.input_units.get(var, canonical)
        conv_name = config.conversions.get(var)
        if conv_name is not None:
            conv = CONVERSIONS.get(conv_name)
            if conv is None:
                errors.append(_err("UNKNOWN_CONVERSION", f"conversions.{var}",
                                   f"unknown conversion: {conv_name!r}"))
                continue
            if var not in conv["variables"]:
                errors.append(_err("CONVERSION_NOT_APPLICABLE", f"conversions.{var}",
                                   f"conversion {conv_name!r} does not apply to {var!r}"))
            if _base_unit(conv["from"]) != _base_unit(input_unit):
                errors.append(_err("CONVERSION_UNIT_MISMATCH", f"conversions.{var}",
                                   f"conversion {conv_name!r} expects input unit "
                                   f"{conv['from']!r}, got {input_unit!r}"))
            if _base_unit(conv["to"]) != _base_unit(canonical):
                errors.append(_err("CONVERSION_UNIT_MISMATCH", f"conversions.{var}",
                                   f"conversion {conv_name!r} targets {conv['to']!r}, "
                                   f"canonical is {canonical!r}"))
        else:
            if not is_unit_compatible(var, input_unit):
                errors.append(_err("INCOMPATIBLE_UNIT", f"input_units.{var}",
                                   f"unit {input_unit!r} is not compatible with {var!r} "
                                   f"(canonical {canonical!r}); configure an explicit conversion"))

    # temporal resolution
    if config.temporal_resolution is not None:
        try:
            parse_resolution(config.temporal_resolution)
        except ValueError as exc:
            errors.append(_err("INVALID_RESOLUTION", "temporal_resolution", str(exc)))

    # timezone
    if config.timezone is not None and _parse_fixed_tz(config.timezone) is None:
        errors.append(_err("INVALID_TIMEZONE", "timezone",
                           f"timezone must be 'UTC' or a fixed offset like '+03:00', got {config.timezone!r}"))

    # quality
    if config.quality_mapping:
        for src, dst in config.quality_mapping.items():
            if not _is_quality(dst):
                errors.append(_err("INVALID_QUALITY_MAPPING", f"quality_mapping.{src}",
                                   f"maps to invalid quality flag: {dst!r}"))
    if not _is_quality(config.quality_default):
        errors.append(_err("INVALID_QUALITY_DEFAULT", "quality_default",
                           f"invalid default quality: {config.quality_default!r}"))
    if config.on_unknown_quality not in ("error", "warn"):
        errors.append(_err("INVALID_CONFIG", "on_unknown_quality",
                           "on_unknown_quality must be 'error' or 'warn'"))

    # spatial
    if config.spatial is not None:
        try:
            sp = SpatialContext(**config.spatial) if isinstance(config.spatial, dict) else config.spatial
            from .climate import validate_spatial
            sp_res = validate_spatial(sp)
            errors.extend(sp_res["errors"])
            warnings.extend(sp_res["warnings"])
        except (TypeError, ValueError) as exc:
            errors.append(_err("INVALID_SPATIAL", "spatial", str(exc)))

    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


def _all_bases():
    from .climate import TEMPORAL_BASES
    return set(TEMPORAL_BASES)


def _is_quality(flag: Any) -> bool:
    from .climate import QUALITY_FLAGS
    return flag in QUALITY_FLAGS


def _parse_fixed_tz(tz: str) -> Optional[timezone]:
    if not isinstance(tz, str):
        return None
    if tz.upper() == "UTC":
        return timezone.utc
    m = re.fullmatch(r"([+-])(\d{2}):(\d{2})", tz.strip())
    if not m:
        return None
    sign = 1 if m.group(1) == "+" else -1
    hours, minutes = int(m.group(2)), int(m.group(3))
    if hours > 23 or minutes > 59:
        return None
    return timezone(sign * timedelta(hours=hours, minutes=minutes))


# --- timestamp parsing -----------------------------------------------------

def _fmt_is_date_only(fmt: str) -> bool:
    return not any(tok in fmt for tok in ("%H", "%M", "%S", "%f"))


def _parse_timestamp_import(raw: Any, date_format: Optional[str],
                            tz_config: Optional[str]) -> Tuple[datetime, bool, str]:
    """Return (naive_utc_datetime, is_date_only, interpretation)."""
    text = str(raw).strip()
    if not text:
        raise ValueError("empty timestamp")
    is_date_only = False
    if date_format:
        dt = datetime.strptime(text, date_format)
        is_date_only = _fmt_is_date_only(date_format)
    elif re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
        dt = datetime.strptime(text, "%Y-%m-%d")
        is_date_only = True
    else:
        iso = text[:-1] + "+00:00" if text.endswith("Z") else text
        dt = datetime.fromisoformat(iso)

    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None), is_date_only, "aware"
    if is_date_only:
        return dt, True, "date_only"
    if tz_config is None:
        raise ValueError("naive timestamp requires explicit timezone configuration")
    tz = _parse_fixed_tz(tz_config)
    if tz is None:
        raise ValueError(f"unsupported timezone: {tz_config!r}")
    return dt.replace(tzinfo=tz).astimezone(timezone.utc).replace(tzinfo=None), False, "naive_configured"


def _normalize_ts(dt: datetime, is_date_only: bool) -> str:
    if is_date_only:
        return dt.strftime("%Y-%m-%d")
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


# --- value / unit helpers --------------------------------------------------

def _is_missing(raw: Any, markers: List[str]) -> bool:
    if raw is None:
        return True
    return str(raw).strip() in markers


def _parse_number(raw: Any) -> float:
    if isinstance(raw, bool):
        raise ValueError("boolean is not a number")
    if isinstance(raw, (int, float)):
        v = float(raw)
    else:
        v = float(str(raw).strip())
    if not math.isfinite(v):
        raise ValueError("non-finite number")
    return v


def _resolve_unit_and_convert(variable: str, input_unit: str, value: float,
                              conversions: Dict[str, str]) -> Tuple[float, str]:
    """Return (converted_value, canonical_unit). Raises ValueError on incompatibility.

    A configured conversion is applied only when the input unit matches the
    conversion's declared ``from`` unit; an already-canonical input unit is left
    unchanged (no double conversion).
    """
    canonical = _canonical_unit(variable)
    conv_name = conversions.get(variable)
    if conv_name is not None:
        conv = CONVERSIONS[conv_name]
        if _base_unit(input_unit) == _base_unit(conv["from"]):
            return float(conv["fn"](value)), canonical
        if is_unit_compatible(variable, input_unit):
            return value, canonical
        raise ValueError(
            f"configured conversion {conv_name!r} expects input unit {conv['from']!r}, "
            f"got {input_unit!r} for {variable!r}"
        )
    if not is_unit_compatible(variable, input_unit):
        raise ValueError(f"incompatible unit {input_unit!r} for {variable!r}")
    return value, canonical


def _resolve_quality(raw_quality: Any, config: ImportConfig, cell_missing: bool,
                     errors: List[Dict[str, Any]], ref: str) -> str:
    if cell_missing:
        return "missing"
    if raw_quality is None or str(raw_quality).strip() == "":
        return config.quality_default
    code = str(raw_quality).strip()
    if code in config.quality_mapping:
        return config.quality_mapping[code]
    if _is_quality(code):
        # already a canonical quality flag (e.g. JSON climate contract)
        return code
    # unknown source quality code: do not invent a mapping
    if config.on_unknown_quality == "error":
        errors.append(_err("UNKNOWN_QUALITY_CODE", ref, f"unknown source quality code: {code!r}"))
    return config.quality_default


# --- observation builder (shared CSV/JSON) ---------------------------------

def _build_observation(variable: str, raw_value: Any, input_unit: str, raw_ts: Any,
                       basis: str, raw_quality: Any, config: ImportConfig,
                       errors: List[Dict[str, Any]], ref: str,
                       missing_count: List[int]) -> Optional[ClimateObservation]:
    """Build one observation; returns None (and appends an error) on failure."""
    cell_missing = _is_missing(raw_value, config.missing_markers)
    quality = _resolve_quality(raw_quality, config, cell_missing, errors, ref + ".quality")

    if cell_missing:
        missing_count[0] += 1
        value: Optional[float] = None
        canonical_unit = _canonical_unit(variable)
        # still parse timestamp so the missing observation is placed in time
        try:
            dt, is_date_only, _ = _parse_timestamp_import(raw_ts, config.date_format, config.timezone)
        except (ValueError, TypeError) as exc:
            errors.append(_err("INVALID_TIMESTAMP", ref + ".timestamp",
                               f"invalid timestamp {raw_ts!r}: {exc}"))
            return None
        ts = _normalize_ts(dt, is_date_only)
        if is_date_only and not basis.startswith("daily_"):
            errors.append(_err("DATE_ONLY_NON_DAILY_BASIS", ref + ".basis",
                               "date-only timestamp with a non-daily basis"))
        return ClimateObservation(variable, None, canonical_unit, ts, basis, "missing")

    try:
        value = _parse_number(raw_value)
    except (ValueError, TypeError) as exc:
        errors.append(_err("INVALID_NUMBER", ref + ".value",
                           f"invalid numeric value {raw_value!r}: {exc}"))
        return None

    try:
        value, canonical_unit = _resolve_unit_and_convert(variable, input_unit, value, config.conversions)
    except ValueError as exc:
        errors.append(_err("INCOMPATIBLE_UNIT", ref + ".unit", str(exc)))
        return None

    try:
        dt, is_date_only, _ = _parse_timestamp_import(raw_ts, config.date_format, config.timezone)
    except (ValueError, TypeError) as exc:
        errors.append(_err("INVALID_TIMESTAMP", ref + ".timestamp",
                           f"invalid timestamp {raw_ts!r}: {exc}"))
        return None
    ts = _normalize_ts(dt, is_date_only)
    if is_date_only and not basis.startswith("daily_"):
        errors.append(_err("DATE_ONLY_NON_DAILY_BASIS", ref + ".basis",
                           "date-only timestamp with a non-daily basis"))
    if (not is_date_only) and basis.startswith("daily_"):
        errors.append(_err("DAILY_BASIS_WITH_TIME", ref + ".basis",
                           "daily basis with a time-of-day timestamp"))

    return ClimateObservation(variable, value, canonical_unit, ts, basis, quality)


def _basis_for(variable: str, config: ImportConfig) -> Optional[str]:
    return config.variable_basis.get(variable, config.basis)


def _build_spatial(config: ImportConfig) -> Optional[SpatialContext]:
    if config.spatial is None and not config.station_id:
        return None
    data: Dict[str, Any] = dict(config.spatial) if isinstance(config.spatial, dict) else {}
    if config.station_id and not data.get("station_id"):
        data["station_id"] = config.station_id
    return SpatialContext(**data)


def _build_provenance(config: ImportConfig) -> Optional[DataProvenance]:
    if not config.source:
        return None
    data: Dict[str, Any] = dict(config.source)
    if config.dataset_version and not data.get("dataset_version"):
        data["dataset_version"] = config.dataset_version
    return DataProvenance(**data)


# --- CSV import ------------------------------------------------------------

def import_csv(content: str, config: ImportConfig) -> ImportResult:
    """Import climate observations from CSV text using an explicit configuration."""
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if config.format != "csv":
        errors.append(_err("FORMAT_MISMATCH", "format", "import_csv requires format='csv'"))
        return _empty_result(errors, warnings, config)

    reader = csv.DictReader(io.StringIO(content))
    headers = reader.fieldnames
    if not headers:
        errors.append(_err("EMPTY_FILE", "file", "CSV has no header row"))
        return _empty_result(errors, warnings, config)

    cfg = validate_config(config, headers=headers)
    errors.extend(cfg["errors"])
    warnings.extend(cfg["warnings"])
    if not cfg["valid"]:
        return _empty_result(errors, warnings, config)

    observations: List[ClimateObservation] = []
    processed = 0
    accepted = 0
    rejected = 0
    missing = [0]

    for row_idx, row in enumerate(reader):
        processed += 1
        ref_base = f"row[{row_idx}]"
        raw_ts = row.get(config.timestamp_column)
        raw_q = row.get(config.quality_column) if config.quality_column else None
        for var, col in config.variable_columns.items():
            basis = _basis_for(var, config)
            input_unit = config.input_units.get(var, _canonical_unit(var))
            obs = _build_observation(var, row.get(col), input_unit, raw_ts, basis, raw_q,
                                     config, errors, f"{ref_base}.{var}", missing)
            if obs is not None:
                observations.append(obs)
                accepted += 1
            else:
                rejected += 1

    return _finalize(observations, errors, warnings, processed, accepted, rejected,
                     missing[0], config, extra_meta={"columns": list(headers)})


# --- JSON import -----------------------------------------------------------

def import_json(content: str, config: ImportConfig) -> ImportResult:
    """Import climate observations from JSON (climate serialization contract)."""
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if config.format != "json":
        errors.append(_err("FORMAT_MISMATCH", "format", "import_json requires format='json'"))
        return _empty_result(errors, warnings, config)

    try:
        data = json.loads(content)
    except (ValueError, TypeError) as exc:
        errors.append(_err("INVALID_JSON", "file", f"could not parse JSON: {exc}"))
        return _empty_result(errors, warnings, config)

    cfg = validate_config(config)
    errors.extend(cfg["errors"])
    warnings.extend(cfg["warnings"])
    if not cfg["valid"]:
        return _empty_result(errors, warnings, config)

    # Determine observations + series-level fields from the JSON contract.
    observations: List[ClimateObservation] = []
    series_variable = None
    temporal_resolution = config.temporal_resolution
    spatial = _build_spatial(config)
    provenance = _build_provenance(config)

    processed = 0
    accepted = 0
    rejected = 0
    missing = [0]

    if isinstance(data, dict) and "observations" in data:
        series_variable = data.get("variable")
        temporal_resolution = data.get("temporal_resolution", temporal_resolution)
        if data.get("spatial") and spatial is None:
            spatial = SpatialContext(**data["spatial"])
        if data.get("provenance") and provenance is None:
            provenance = DataProvenance(**data["provenance"])
        raw_obs = data.get("observations", [])
    elif isinstance(data, list):
        raw_obs = data
    else:
        errors.append(_err("INVALID_JSON_SHAPE", "file",
                           "JSON must be a ClimateSeries object or a list of observations"))
        return _empty_result(errors, warnings, config)

    if not isinstance(raw_obs, list):
        errors.append(_err("INVALID_JSON_SHAPE", "observations", "observations must be a list"))
        return _empty_result(errors, warnings, config)

    for i, rec in enumerate(raw_obs):
        processed += 1
        if not isinstance(rec, dict):
            errors.append(_err("INVALID_OBSERVATION", f"observations[{i}]", "observation must be an object"))
            rejected += 1
            continue
        var = rec.get("variable")
        if var not in CLIMATE_VARIABLES:
            errors.append(_err("UNKNOWN_VARIABLE", f"observations[{i}].variable",
                               f"unknown climate variable: {var!r}"))
            rejected += 1
            continue
        basis = rec.get("basis", _basis_for(var, config))
        if basis is None:
            errors.append(_err("MISSING_BASIS", f"observations[{i}].basis",
                               "observation basis is required"))
            rejected += 1
            continue
        input_unit = rec.get("unit", config.input_units.get(var, _canonical_unit(var)))
        obs = _build_observation(var, rec.get("value"), input_unit, rec.get("timestamp"),
                                 basis, rec.get("quality"), config, errors,
                                 f"observations[{i}]", missing)
        if obs is not None:
            # preserve an explicit source object from JSON if present
            if rec.get("source") is not None:
                obs.source = rec["source"]
            observations.append(obs)
            accepted += 1
        else:
            rejected += 1

    series = ClimateSeries(
        observations=observations,
        variable=series_variable if series_variable in CLIMATE_VARIABLES else None,
        temporal_resolution=temporal_resolution,
        spatial=spatial,
        provenance=provenance,
        missing_data_policy="flag_only",
    )
    return _finalize(observations, errors, warnings, processed, accepted, rejected,
                     missing[0], config, series=series, extra_meta={"json_type": "series" if isinstance(data, dict) else "list"})


# --- dispatch / result -----------------------------------------------------

def import_climate_data(content: str, config: ImportConfig) -> ImportResult:
    """Dispatch to the CSV or JSON importer based on ``config.format``."""
    if config.format == "csv":
        return import_csv(content, config)
    if config.format == "json":
        return import_json(content, config)
    return _empty_result([_err("INVALID_FORMAT", "format", f"unsupported format: {config.format!r}")],
                         [], config)


def import_file(path: str, config: ImportConfig) -> ImportResult:
    """Read a file (stdlib) and import it. The engine does not retain the file."""
    with open(path, "r", encoding="utf-8") as fh:
        content = fh.read()
    if not config.source_file:
        config.source_file = path
    return import_climate_data(content, config)


def _empty_result(errors, warnings, config: ImportConfig) -> ImportResult:
    return ImportResult(
        ok=False, series=None, errors=errors, warnings=warnings,
        records_processed=0, records_accepted=0, records_rejected=0,
        missing_value_count=0, missing_periods=[],
        metadata=_metadata(config, imported=0), validation={"valid": False, "errors": errors, "warnings": warnings},
    )


def _metadata(config: ImportConfig, imported: int, **extra) -> Dict[str, Any]:
    meta = {
        "format": config.format,
        "source_file": config.source_file,
        "column_mapping": dict(config.variable_columns),
        "input_units": dict(config.input_units),
        "conversions": dict(config.conversions),
        "date_format": config.date_format,
        "timezone": config.timezone,
        "basis": config.basis,
        "variable_basis": dict(config.variable_basis),
        "temporal_resolution": config.temporal_resolution,
        "missing_markers": list(config.missing_markers),
        "quality_column": config.quality_column,
        "quality_mapping": dict(config.quality_mapping),
        "station_id": config.station_id,
        "imported_records": imported,
        "processing_history": ["import", "normalize"],
    }
    meta.update(extra)
    return meta


def _finalize(observations, errors, warnings, processed, accepted, rejected, missing,
              config: ImportConfig, series: Optional[ClimateSeries] = None,
              extra_meta: Optional[Dict[str, Any]] = None) -> ImportResult:
    if series is None:
        series = ClimateSeries(
            observations=observations,
            variable=None,
            temporal_resolution=config.temporal_resolution,
            spatial=_build_spatial(config),
            provenance=_build_provenance(config),
            missing_data_policy="flag_only",
        )

    validation = validate_series(series)
    errors = list(errors) + validation["errors"]
    warnings = list(warnings) + validation["warnings"]

    mp: List[Dict[str, Any]] = []
    if series.temporal_resolution is not None:
        try:
            mp = missing_periods(series)
        except ValueError:
            mp = []

    if not observations:
        warnings.append(_err("EMPTY_IMPORT", "file", "no observations were imported"))

    ok = len(errors) == 0 and validation["valid"]
    metadata = _metadata(config, imported=accepted, **(extra_meta or {}))
    if not observations:
        metadata["empty"] = True

    return ImportResult(
        ok=ok, series=series, errors=errors, warnings=warnings,
        records_processed=processed, records_accepted=accepted, records_rejected=rejected,
        missing_value_count=missing, missing_periods=mp, metadata=metadata, validation=validation,
    )