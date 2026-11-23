"""Scientific spatial metadata (Python port of ``packages/scientific/src/spatial.ts``).

This is deliberately smaller than the MapLibre layer model in
``packages/spatial``: it describes what a model consumes or produces, not how a
map renders it. It is pure data + validation, with no dependency on any
geospatial library, so the engine stays installable with an empty dependency set.

The TypeScript module is the behavioural reference; this module reproduces its
contract (same domain kinds, same validation rules) so the two runtimes agree.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Sequence, Tuple

__all__ = [
    "SPATIAL_DOMAIN_KINDS",
    "SPATIAL_CRS_KINDS",
    "Bbox",
    "SpatialCrs",
    "SpatialExtent",
    "SpatialResolution",
    "SpatialDomain",
    "SpatialMetadata",
    "is_bbox",
    "is_spatial_metadata",
    "is_spatial_crs",
    "is_spatial_extent",
    "is_spatial_resolution",
    "bbox_from_extent",
]

Bbox = Tuple[float, float, float, float]

SPATIAL_CRS_KINDS = ("geographic", "projected", "local")

SPATIAL_DOMAIN_KINDS = ("raster", "vector", "grid", "h3", "point", "polygon")

_VECTOR_GEOMETRY_TYPES = ("point", "line", "polygon")


def _is_record(value: Any) -> bool:
    return isinstance(value, dict)


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and len(value.strip()) > 0


def is_bbox(value: Any) -> bool:
    """A bbox is exactly four finite numbers: ``[minX, minY, maxX, maxY]``."""
    return (
        isinstance(value, (list, tuple))
        and len(value) == 4
        and all(_is_number(entry) for entry in value)
    )


def is_spatial_crs(value: Any) -> bool:
    if not _is_record(value):
        return False
    return _is_non_empty_string(value.get("code")) and value.get("kind") in SPATIAL_CRS_KINDS


def is_spatial_resolution(value: Any) -> bool:
    if not _is_record(value):
        return False
    return (
        _is_number(value.get("x"))
        and _is_number(value.get("y"))
        and _is_non_empty_string(value.get("unit"))
    )


def is_spatial_extent(value: Any) -> bool:
    if not _is_record(value):
        return False
    return is_bbox(value.get("bbox")) and _is_non_empty_string(value.get("crs"))


def is_spatial_domain(value: Any) -> bool:
    if not _is_record(value):
        return False
    kind = value.get("kind")
    if kind not in SPATIAL_DOMAIN_KINDS:
        return False
    if kind == "h3":
        return _is_number(value.get("resolution"))
    if kind == "grid":
        return _is_number(value.get("cellSize")) and _is_non_empty_string(value.get("unit"))
    if kind == "vector":
        geometry_types = value.get("geometryTypes")
        return isinstance(geometry_types, (list, tuple)) and all(
            entry in _VECTOR_GEOMETRY_TYPES for entry in geometry_types
        )
    if kind == "raster":
        crs = value.get("crs")
        if not _is_non_empty_string(crs):
            return False
        if "resolution" in value and value["resolution"] is not None:
            return is_spatial_resolution(value["resolution"])
        return True
    # point / polygon
    return _is_non_empty_string(value.get("crs"))


def is_spatial_metadata(value: Any) -> bool:
    """Validate a ``SpatialMetadata`` record against the shared contract."""
    if not _is_record(value):
        return False
    if not _is_non_empty_string(value.get("crs")):
        return False
    if not is_spatial_domain(value.get("domain")):
        return False
    if value.get("extent") is not None and not is_spatial_extent(value["extent"]):
        return False
    if value.get("resolution") is not None and not is_spatial_resolution(value["resolution"]):
        return False
    return True


def bbox_from_extent(
    min_x: float, min_y: float, max_x: float, max_y: float, crs: str
) -> Dict[str, Any]:
    """Build a ``SpatialExtent`` record, rejecting an inverted bbox."""
    if not all(_is_number(v) for v in (min_x, min_y, max_x, max_y)):
        raise ValueError("extent coordinates must be finite numbers")
    if min_x >= max_x or min_y >= max_y:
        raise ValueError("extent requires min_x < max_x and min_y < max_y")
    return {"bbox": [float(min_x), float(min_y), float(max_x), float(max_y)], "crs": crs}