"""Scientific data contracts (Python port of ``packages/scientific/src/data.ts``).

A ``DataArtifact`` is a *reference*, not a blob: large rasters, grids and result
files stay in file/object storage while metadata and checksums live here. The
engine never opens the URI; it only records and validates the reference.

This module is pure data + validation with no third-party dependency, mirroring
the TypeScript contract so both runtimes agree on what a data artifact is.
"""

from __future__ import annotations

import math
from typing import Any, Dict, Optional

from .spatial import is_spatial_metadata

__all__ = [
    "DATA_KINDS",
    "DataArtifact",
    "is_data_artifact",
    "is_temporal_range",
    "is_data_quality",
    "DATA_KIND_RASTER",
    "DATA_KIND_VECTOR",
    "RASTER_MEDIA_TYPES",
    "is_raster_media_type",
]

DATA_KINDS = (
    "raw",
    "processed",
    "model_ready",
    "observation",
    "simulation_result",
    "reference",
)

# Kinds that normally point at a raster/grid asset (used by STAC mapping).
DATA_KIND_RASTER = ("raw", "processed", "model_ready", "simulation_result")
DATA_KIND_VECTOR = ("observation", "reference")

# Common raster media types (subset of the PySTAC media-type registry that the
# engine can identify without importing PySTAC).
RASTER_MEDIA_TYPES = (
    "image/tiff; application=geotiff; profile=cloud-optimized",
    "image/tiff; application=geotiff",
    "image/tiff",
    "application/netcdf",
    "application/x-hdf5",
    "application/vnd.zarr",
)


def _is_record(value: Any) -> bool:
    return isinstance(value, dict)


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and len(value.strip()) > 0


def is_raster_media_type(media_type: Any) -> bool:
    if not isinstance(media_type, str):
        return False
    base = media_type.split(";", 1)[0].strip().lower()
    return base in {mt.split(";", 1)[0].strip().lower() for mt in RASTER_MEDIA_TYPES}


def is_temporal_range(value: Any) -> bool:
    if not _is_record(value):
        return False
    if not _is_non_empty_string(value.get("start")) or not _is_non_empty_string(value.get("end")):
        return False
    if value["start"] > value["end"]:
        return False
    interval = value.get("interval")
    return interval is None or _is_non_empty_string(interval)


def is_data_quality(value: Any) -> bool:
    if not _is_record(value):
        return False
    completeness = value.get("completeness")
    if completeness is not None and not (_is_number(completeness) and 0.0 <= completeness <= 1.0):
        return False
    missing = value.get("missingValueCount")
    if missing is not None and not (isinstance(missing, int) and not isinstance(missing, bool) and missing >= 0):
        return False
    flags = value.get("flags")
    if flags is not None and not (
        isinstance(flags, (list, tuple)) and all(isinstance(entry, str) for entry in flags)
    ):
        return False
    return True


def is_data_artifact(value: Any) -> bool:
    """Validate a ``DataArtifact`` reference against the shared contract."""
    if not _is_record(value):
        return False
    if not _is_non_empty_string(value.get("id")):
        return False
    if value.get("kind") not in DATA_KINDS:
        return False
    if not _is_non_empty_string(value.get("uri")):
        return False
    if not _is_non_empty_string(value.get("mediaType")):
        return False
    checksum = value.get("checksum")
    if checksum is not None and not _is_non_empty_string(checksum):
        return False
    unit = value.get("unit")
    if unit is not None and not _is_non_empty_string(unit):
        return False
    spatial = value.get("spatial")
    if spatial is not None and not is_spatial_metadata(spatial):
        return False
    temporal = value.get("temporal")
    if temporal is not None and not is_temporal_range(temporal):
        return False
    license_ = value.get("license")
    if license_ is not None and not isinstance(license_, str):
        return False
    quality = value.get("quality")
    if quality is not None and not is_data_quality(quality):
        return False
    return True