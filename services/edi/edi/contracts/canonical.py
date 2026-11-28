"""Canonical EDI data contract."""

import re
from datetime import datetime
from numbers import Real

from edi.errors import InvalidContract, InvalidData, UnitMismatch

CONTRACT_VERSION = "1.0.0"

RECORD_KINDS = (
    "point_observation",
    "time_series_record",
    "gridded_record",
    "raster_asset",
    "asset_backed_observation",
)
SOURCE_TYPES = ("ground_station", "satellite", "reanalysis", "model", "derived")
VALUE_ENCODINGS = ("scalar", "asset", "missing")
QUALITY_FLAGS = ("unchecked", "valid", "suspect", "invalid", "missing")
HOUR_LABELINGS = ("hour_beginning", "hour_ending", "unknown")
TEMPORAL_BASES = (
    "instant",
    "period_mean",
    "period_sum",
    "daily_mean",
    "daily_min",
    "daily_max",
    "daily_sum",
)
SCIENTIFIC_STATUS = "NOT_VALIDATED"

VARIABLE_SPECS = {
    "air_temperature": {
        "unit": "degC",
        "allowed_units": ("degC", "K"),
        "temporal_bases": ("instant", "period_mean", "daily_mean"),
        "hydroma_variable": "air_temperature",
    },
    "max_air_temperature": {
        "unit": "degC",
        "allowed_units": ("degC", "K"),
        "temporal_bases": ("daily_max",),
        "hydroma_variable": "max_air_temperature",
    },
    "min_air_temperature": {
        "unit": "degC",
        "allowed_units": ("degC", "K"),
        "temporal_bases": ("daily_min",),
        "hydroma_variable": "min_air_temperature",
    },
    "precipitation": {
        "unit": "mm",
        "allowed_units": ("mm", "mm/day"),
        "temporal_bases": ("period_sum", "daily_sum"),
        "hydroma_variable": "precipitation",
    },
    "relative_humidity": {
        "unit": "%",
        "allowed_units": ("%", "fraction"),
        "temporal_bases": ("instant", "period_mean", "daily_mean"),
        "hydroma_variable": "relative_humidity",
    },
    "wind_speed": {
        "unit": "m/s",
        "allowed_units": ("m/s", "km/h", "knots"),
        "temporal_bases": ("instant", "period_mean", "daily_mean"),
        "hydroma_variable": "wind_speed",
    },
    "solar_radiation": {
        "unit": "MJ/m2/day",
        "allowed_units": ("MJ/m2/day", "W/m2"),
        "temporal_bases": ("period_sum", "daily_sum"),
        "hydroma_variable": "solar_radiation",
    },
    "air_pressure": {
        "unit": "kPa",
        "allowed_units": ("kPa", "hPa", "mb"),
        "temporal_bases": ("instant", "period_mean", "daily_mean"),
        "hydroma_variable": None,
    },
    "soil_moisture": {
        "unit": "m3/m3",
        "allowed_units": ("m3/m3", "%vol"),
        "temporal_bases": ("instant", "period_mean", "daily_mean"),
        "hydroma_variable": None,
    },
    "soil_temperature": {
        "unit": "degC",
        "allowed_units": ("degC", "K"),
        "temporal_bases": ("instant", "period_mean", "daily_mean"),
        "hydroma_variable": None,
    },
    "land_surface_temperature": {
        "unit": "degC",
        "allowed_units": ("degC", "K"),
        "temporal_bases": ("instant", "period_mean", "daily_mean"),
        "hydroma_variable": None,
    },
    "ndvi": {
        "unit": "1",
        "allowed_units": ("1",),
        "temporal_bases": ("instant", "period_mean", "daily_mean"),
        "hydroma_variable": None,
    },
    "evi": {
        "unit": "1",
        "allowed_units": ("1",),
        "temporal_bases": ("instant", "period_mean", "daily_mean"),
        "hydroma_variable": None,
    },
    "evapotranspiration": {
        "unit": "mm",
        "allowed_units": ("mm", "mm/day"),
        "temporal_bases": ("period_sum", "daily_sum"),
        "hydroma_variable": None,
    },
}

REQUIRED_FIELDS = (
    "contract_version",
    "record_kind",
    "observation_id",
    "source_id",
    "source_product",
    "source_type",
    "variable",
    "dataset_id",
    "dataset_version",
    "value_encoding",
    "value",
    "unit",
    "timestamp",
    "timezone",
    "hour_labeling",
    "temporal_resolution",
    "temporal_basis",
    "spatial_resolution",
    "geometry",
    "grid",
    "asset",
    "spatial_support",
    "measurement_height_m",
    "measurement_depth_m",
    "sensor_elevation_m",
    "elevation_datum",
    "quality_flag",
    "uncertainty",
    "provenance",
    "retrieved_at",
    "valid_from",
    "valid_to",
    "stale",
    "stale_since",
    "alternate_of",
    "selection_id",
    "processing_version",
    "scientific_status",
)

PROVENANCE_REQUIRED = (
    "source_url",
    "raw_file",
    "raw_sha256",
    "retrieved_at",
    "adapter_version",
    "transform_version",
    "processing_history",
    "dataset_version",
    "upstream_sources",
)


def parse_timestamp(value: str, field: str) -> datetime:
    if not isinstance(value, str) or not value:
        raise InvalidContract("missing timestamp", {"field": field})
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise InvalidContract("invalid ISO-8601 timestamp", {"field": field, "value": value}) from exc
    if parsed.tzinfo is None:
        raise InvalidContract("timestamp must be timezone-aware", {"field": field, "value": value})
    return parsed


def _require_nonempty_string(record: dict, field: str) -> None:
    value = record.get(field)
    if not isinstance(value, str) or not value.strip():
        raise InvalidContract("field must be a non-empty string", {"field": field})


def _validate_hash(value: str, field: str) -> None:
    if not isinstance(value, str) or not re.fullmatch(r"sha256:[0-9a-f]{64}", value):
        raise InvalidContract("invalid sha256 field", {"field": field, "value": value})


def _validate_asset(asset: dict | None) -> None:
    if asset is None:
        return
    if not isinstance(asset, dict):
        raise InvalidContract("asset must be an object")
    for field in ("uri", "media_type", "sha256", "byte_size"):
        if field not in asset:
            raise InvalidContract("asset missing field", {"field": field})
    if not isinstance(asset["uri"], str) or not asset["uri"]:
        raise InvalidContract("asset.uri must be non-empty")
    if not isinstance(asset["media_type"], str) or not asset["media_type"]:
        raise InvalidContract("asset.media_type must be non-empty")
    _validate_hash(asset["sha256"], "asset.sha256")
    if not isinstance(asset["byte_size"], int) or isinstance(asset["byte_size"], bool) or asset["byte_size"] < 0:
        raise InvalidContract("asset.byte_size must be a non-negative integer")


def _validate_geometry(geometry: dict | None) -> None:
    if geometry is None:
        return
    if not isinstance(geometry, dict):
        raise InvalidContract("geometry must be an object")
    kind = geometry.get("type")
    coords = geometry.get("coordinates")
    if kind == "Point":
        if not isinstance(coords, list) or len(coords) != 2 or not all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in coords):
            raise InvalidContract("Point coordinates must be [lon, lat]")
        lon, lat = coords
        if lon < -180 or lon > 180 or lat < -90 or lat > 90:
            raise InvalidContract("Point coordinates out of range")
    elif kind == "Polygon":
        if not isinstance(coords, list) or not coords:
            raise InvalidContract("Polygon coordinates must be a non-empty list")
        for ring in coords:
            if not isinstance(ring, list) or len(ring) < 4:
                raise InvalidContract("Polygon ring must have at least 4 positions")
            for point in ring:
                if not isinstance(point, list) or len(point) != 2 or not all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in point):
                    raise InvalidContract("Polygon positions must be [lon, lat]")
                lon, lat = point
                if lon < -180 or lon > 180 or lat < -90 or lat > 90:
                    raise InvalidContract("Polygon coordinates out of range")
    else:
        raise InvalidContract("geometry.type must be Point or Polygon")


def _validate_grid(grid: dict | None) -> None:
    if grid is None:
        return
    if not isinstance(grid, dict):
        raise InvalidContract("grid must be an object")
    for field in ("crs", "shape", "cell_size", "origin"):
        if field not in grid:
            raise InvalidContract("grid missing field", {"field": field})
    if not isinstance(grid["crs"], str) or not grid["crs"]:
        raise InvalidContract("grid.crs must be non-empty")
    shape = grid["shape"]
    if not isinstance(shape, list) or len(shape) != 2 or not all(isinstance(x, int) and not isinstance(x, bool) and x >= 1 for x in shape):
        raise InvalidContract("grid.shape must be [rows, cols] with positive integers")
    cell_size = grid["cell_size"]
    if not isinstance(cell_size, list) or len(cell_size) != 2 or not all(isinstance(x, (int, float)) and not isinstance(x, bool) and x > 0 for x in cell_size):
        raise InvalidContract("grid.cell_size must be [lat_size, lon_size] with positive numbers")
    origin = grid["origin"]
    if not isinstance(origin, list) or len(origin) != 2 or not all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in origin):
        raise InvalidContract("grid.origin must be [lat_origin, lon_origin]")


def _validate_provenance(provenance: dict, record: dict) -> None:
    if not isinstance(provenance, dict):
        raise InvalidContract("provenance must be an object")
    for field in PROVENANCE_REQUIRED:
        if field not in provenance:
            raise InvalidContract("missing provenance field", {"field": field})
    _validate_hash(provenance["raw_sha256"], "provenance.raw_sha256")
    if provenance["dataset_version"] != record["dataset_version"]:
        raise InvalidContract("provenance dataset_version mismatch")
    if not isinstance(provenance["upstream_sources"], list):
        raise InvalidContract("provenance.upstream_sources must be a list")
    parse_timestamp(provenance["retrieved_at"], "provenance.retrieved_at")


def validate_record(record: dict) -> None:
    if not isinstance(record, dict):
        raise InvalidContract("record must be an object")

    for field in REQUIRED_FIELDS:
        if field not in record:
            raise InvalidContract("missing required field", {"field": field})

    if record["contract_version"] != CONTRACT_VERSION:
    # supported versions are checked by versioning module
        raise InvalidContract("unsupported contract version", {"contract_version": record["contract_version"]})
    if record["record_kind"] not in RECORD_KINDS:
        raise InvalidContract("invalid record_kind", {"record_kind": record["record_kind"]})
    if record["source_type"] not in SOURCE_TYPES:
        raise InvalidContract("invalid source_type", {"source_type": record["source_type"]})
    if record["variable"] not in VARIABLE_SPECS:
        raise InvalidContract("unsupported variable", {"variable": record["variable"]})
    if record["value_encoding"] not in VALUE_ENCODINGS:
        raise InvalidContract("invalid value_encoding", {"value_encoding": record["value_encoding"]})
    if record["quality_flag"] not in QUALITY_FLAGS:
        raise InvalidContract("invalid quality_flag", {"quality_flag": record["quality_flag"]})
    if record["hour_labeling"] not in HOUR_LABELINGS:
        raise InvalidContract("invalid hour_labeling", {"hour_labeling": record["hour_labeling"]})
    if record["temporal_basis"] not in TEMPORAL_BASES:
        raise InvalidContract("invalid temporal_basis", {"temporal_basis": record["temporal_basis"]})
    if record["scientific_status"] != SCIENTIFIC_STATUS:
        raise InvalidContract("invalid scientific_status", {"scientific_status": record["scientific_status"]})

    for field in (
        "source_id",
        "source_product",
        "dataset_id",
        "dataset_version",
        "unit",
        "spatial_resolution",
        "geometry_crs",
        "processing_version",
    ):
        _require_nonempty_string(record, field)

    if not isinstance(record["observation_id"], str) or not re.fullmatch(r"sha256:[0-9a-f]{32}", record["observation_id"]):
        raise InvalidContract("invalid observation_id")

    _validate_asset(record["asset"])
    _validate_geometry(record["geometry"])
    _validate_grid(record["grid"])

    if record["hour_labeling"] != "unknown":
        if record["hour_labeling_status"] not in ("PROVIDER_CONFIRMED", "ASSUMPTION"):
            raise InvalidContract("hour_labeling_status must be PROVIDER_CONFIRMED or ASSUMPTION")
        if not isinstance(record["hour_labeling_evidence"], str) or not record["hour_labeling_evidence"]:
            raise InvalidContract("hour_labeling_evidence is required")

    spec = VARIABLE_SPECS[record["variable"]]
    if record["unit"] not in spec["allowed_units"]:
        raise UnitMismatch(
            "unit is not allowed for variable",
            {"variable": record["variable"], "unit": record["unit"], "allowed": spec["allowed_units"]},
        )
    if record["temporal_basis"] not in spec["temporal_bases"]:
        raise InvalidContract(
            "temporal_basis is not allowed for variable",
            {"variable": record["variable"], "temporal_basis": record["temporal_basis"]},
        )

    value = record["value"]
    encoding = record["value_encoding"]
    if encoding == "missing":
        if value is not None:
            raise InvalidData("missing encoding requires value=null", {"value": value})
        if record["quality_flag"] != "missing":
            raise InvalidData("missing encoding requires quality_flag=missing")
    elif encoding == "scalar":
        if not isinstance(value, Real) or isinstance(value, bool):
            raise InvalidData("scalar encoding requires numeric value", {"value": value})
        if record["quality_flag"] == "missing":
            raise InvalidData("scalar encoding cannot have quality_flag=missing")
    elif encoding == "asset":
        if value is not None:
            raise InvalidData("asset encoding requires value=null", {"value": value})
        if not record.get("asset"):
            raise InvalidData("asset encoding requires an asset reference")
        if record["quality_flag"] == "missing":
            raise InvalidData("asset encoding cannot have quality_flag=missing")

    timestamp = parse_timestamp(record["timestamp"], "timestamp")
    retrieved_at = parse_timestamp(record["retrieved_at"], "retrieved_at")
    valid_from = parse_timestamp(record["valid_from"], "valid_from")
    valid_to = parse_timestamp(record["valid_to"], "valid_to") if record["valid_to"] is not None else None
    if valid_to is not None and valid_from >= valid_to:
        raise InvalidData("valid_from must be earlier than valid_to")

    if record["stale"]:
        if not record.get("stale_since"):
            raise InvalidData("stale=true requires stale_since")
        if record["quality_flag"] not in ("suspect", "invalid"):
            raise InvalidData("stale=true requires quality_flag suspect or invalid")
        if valid_to is None:
            raise InvalidData("stale=true requires valid_to")
        parse_timestamp(record["stale_since"], "stale_since")

    _validate_provenance(record["provenance"], record)

    if record["variable"] == "wind_speed":
        if record["measurement_height_m"] != 2.0:
            raise InvalidContract(
                "wind_speed direct HyDroMA mapping requires 2 m",
                {"measurement_height_m": record["measurement_height_m"]},
            )
    if record["variable"] == "air_pressure":
        if not isinstance(record["sensor_elevation_m"], (int, float)) or isinstance(record["sensor_elevation_m"], bool):
            raise InvalidContract("air_pressure requires sensor_elevation_m")
    if record["variable"] == "soil_moisture":
        if not isinstance(record["measurement_depth_m"], (int, float)) or isinstance(record["measurement_depth_m"], bool):
            raise InvalidContract("soil_moisture requires measurement_depth_m")