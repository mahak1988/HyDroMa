"""Minimal STAC (SpatioTemporal Asset Catalog) data references.

Scope and rationale
-------------------
PySTAC (Apache-2.0, ``upstream-registry/pystac``) is a complete, mature STAC
implementation. The engine does **not** need the whole library: it needs to
*describe* the raster/vector assets a model consumes or produces and to carry
their spatial, temporal and provenance metadata next to a scientific run.

This module is therefore a small, dependency-free, STAC 1.0.0-compatible subset
(classification **B — ADAPTATION** of PySTAC's data model, not a re-extraction).
It intentionally implements only what HyDroMA uses:

* ``Asset``    — href + media type + roles + checksum (PySTAC ``asset.py``).
* ``Link``     — rel + href (+ optional media type).
* ``Item``     — Feature with id, geometry, bbox, datetime, properties, assets.
* ``Collection`` — id, description, extent (spatial/temporal), license, summaries.
* ``Catalog``  — id, description, links (PySTAC ``catalog.py``).

What is deliberately **not** implemented: extension modules, JSON-Schema
validation against the STAC spec, STAC API/search, lazy object resolution,
absolute-href rewriting, and file I/O. Those belong to PySTAC/PgSTAC and are
out of scope for the scientific engine.

Version note: upstream PySTAC now defaults to STAC 1.1.0; this module targets
**STAC 1.0.0**, the broadly supported interoperable baseline. The version is a
constant so it can be raised deliberately later.

No network access, no filesystem writes, no third-party imports.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Sequence

__all__ = [
    "STAC_VERSION",
    "STAC_MEDIA_TYPES",
    "Asset",
    "Link",
    "Item",
    "Collection",
    "Catalog",
    "is_stac_version",
    "validate_item",
    "validate_collection",
    "validate_catalog",
    "item_from_data_artifact",
    "raster_assets",
    "temporal_extent",
    "spatial_extent",
]

# STAC specification version this module targets (deliberately 1.0.0, see above).
STAC_VERSION = "1.0.0"

# Media types the engine can identify (subset of the PySTAC media-type registry).
STAC_MEDIA_TYPES = {
    "cog": "image/tiff; application=geotiff; profile=cloud-optimized",
    "geotiff": "image/tiff; application=geotiff",
    "tiff": "image/tiff",
    "netcdf": "application/netcdf",
    "hdf5": "application/x-hdf5",
    "zarr": "application/vnd.zarr",
    "geojson": "application/geo+json",
    "json": "application/json",
    "png": "image/png",
    "jpeg": "image/jpeg",
}

_RASTER_BASE_TYPES = {"image/tiff", "application/netcdf", "application/x-hdf5", "application/vnd.zarr"}


def _is_record(value: Any) -> bool:
    return isinstance(value, dict)


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and len(value.strip()) > 0


def is_stac_version(value: Any) -> bool:
    """True for a dotted numeric STAC version such as ``1.0.0``."""
    if not isinstance(value, str):
        return False
    parts = value.split(".")
    return len(parts) == 3 and all(part.isdigit() for part in parts)


def _is_valid_datetime(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    # Minimal ISO-8601 check; the engine does not depend on dateutil.
    from datetime import datetime

    text = value.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        datetime.fromisoformat(text)
        return True
    except ValueError:
        return False


def _is_valid_bbox(value: Any) -> bool:
    if not isinstance(value, (list, tuple)) or len(value) not in (4, 6):
        return False
    if not all(_is_number(entry) for entry in value):
        return False
    if len(value) == 4:
        min_x, min_y, max_x, max_y = value
        return min_x < max_x and min_y < max_y
    min_x, min_y, _, max_x, max_y, _ = value
    return min_x < max_x and min_y < max_y


def _is_geometry(value: Any) -> bool:
    # GeoJSON geometry object or null (STAC allows a null geometry).
    if value is None:
        return True
    if not _is_record(value):
        return False
    return "type" in value and "coordinates" in value


class Asset:
    """A reference to data associated with an Item or Collection."""

    __slots__ = ("href", "title", "description", "media_type", "roles", "checksum", "extra_fields")

    def __init__(
        self,
        href: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        media_type: Optional[str] = None,
        roles: Optional[Sequence[str]] = None,
        checksum: Optional[str] = None,
        extra_fields: Optional[Dict[str, Any]] = None,
    ) -> None:
        if not _is_non_empty_string(href):
            raise ValueError("asset href must be a non-empty string")
        self.href = href
        self.title = title
        self.description = description
        self.media_type = media_type
        self.roles = list(roles) if roles else None
        self.checksum = checksum
        self.extra_fields = dict(extra_fields) if extra_fields else {}

    def to_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {"href": self.href}
        if self.title is not None:
            d["title"] = self.title
        if self.description is not None:
            d["description"] = self.description
        if self.media_type is not None:
            d["type"] = self.media_type
        if self.roles:
            d["roles"] = list(self.roles)
        if self.checksum is not None:
            # STAC "file:checksum" extension field; kept minimal and explicit.
            d["file:checksum"] = self.checksum
        d.update(self.extra_fields)
        return d

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Asset":
        return cls(
            href=d["href"],
            title=d.get("title"),
            description=d.get("description"),
            media_type=d.get("type"),
            roles=d.get("roles"),
            checksum=d.get("file:checksum"),
            extra_fields={k: v for k, v in d.items() if k not in {
                "href", "title", "description", "type", "roles", "file:checksum"}},
        )

    def is_raster(self) -> bool:
        if not self.media_type:
            return False
        base = self.media_type.split(";", 1)[0].strip().lower()
        return base in _RASTER_BASE_TYPES

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<Asset href={self.href!r} type={self.media_type!r}>"


class Link:
    """A link from a STAC object to another entity."""

    __slots__ = ("rel", "href", "media_type", "title", "extra_fields")

    def __init__(
        self,
        rel: str,
        href: str,
        media_type: Optional[str] = None,
        title: Optional[str] = None,
        extra_fields: Optional[Dict[str, Any]] = None,
    ) -> None:
        if not _is_non_empty_string(rel):
            raise ValueError("link rel must be a non-empty string")
        if not _is_non_empty_string(href):
            raise ValueError("link href must be a non-empty string")
        self.rel = rel
        self.href = href
        self.media_type = media_type
        self.title = title
        self.extra_fields = dict(extra_fields) if extra_fields else {}

    def to_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {"rel": self.rel, "href": self.href}
        if self.media_type is not None:
            d["type"] = self.media_type
        if self.title is not None:
            d["title"] = self.title
        d.update(self.extra_fields)
        return d

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Link":
        return cls(
            rel=d["rel"],
            href=d["href"],
            media_type=d.get("type"),
            title=d.get("title"),
            extra_fields={k: v for k, v in d.items() if k not in {"rel", "href", "type", "title"}},
        )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<Link rel={self.rel!r} href={self.href!r}>"


class _StacObject:
    """Shared serialisation behaviour for Catalog / Collection / Item."""

    STAC_OBJECT_TYPE = "object"

    def __init__(
        self,
        id: str,
        description: Optional[str] = None,
        links: Optional[Sequence[Link]] = None,
        extra_fields: Optional[Dict[str, Any]] = None,
    ) -> None:
        if not _is_non_empty_string(id):
            raise ValueError("STAC object id must be a non-empty string")
        self.id = id
        self.description = description
        self.links: List[Link] = list(links) if links else []
        self.extra_fields: Dict[str, Any] = dict(extra_fields) if extra_fields else {}

    def add_link(self, link: Link) -> None:
        self.links.append(link)

    def base_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {
            "type": self.STAC_OBJECT_TYPE,
            "stac_version": STAC_VERSION,
            "id": self.id,
            "links": [link.to_dict() for link in self.links],
        }
        if self.description is not None:
            d["description"] = self.description
        d.update(self.extra_fields)
        return d


class Catalog(_StacObject):
    """A STAC Catalog: a container of links to children/items."""

    STAC_OBJECT_TYPE = "Catalog"

    def to_dict(self) -> Dict[str, Any]:
        return self.base_dict()

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Catalog":
        return cls(
            id=d["id"],
            description=d.get("description"),
            links=[Link.from_dict(link) for link in d.get("links", [])],
            extra_fields={k: v for k, v in d.items()
                          if k not in {"type", "stac_version", "id", "description", "links"}},
        )


class Collection(_StacObject):
    """A STAC Collection: a Catalog with spatial/temporal extent and licence."""

    STAC_OBJECT_TYPE = "Collection"

    def __init__(
        self,
        id: str,
        description: str,
        extent: Dict[str, Any],
        license: str = "other",
        title: Optional[str] = None,
        keywords: Optional[Sequence[str]] = None,
        providers: Optional[Sequence[Dict[str, Any]]] = None,
        summaries: Optional[Dict[str, Any]] = None,
        assets: Optional[Dict[str, Asset]] = None,
        links: Optional[Sequence[Link]] = None,
        extra_fields: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(id=id, description=description, links=links, extra_fields=extra_fields)
        if not _is_non_empty_string(description):
            raise ValueError("collection description must be a non-empty string")
        validate_extent(extent)
        self.extent = extent
        self.license = license
        self.title = title
        self.keywords = list(keywords) if keywords else None
        self.providers = [dict(p) for p in providers] if providers else None
        self.summaries = dict(summaries) if summaries else None
        self.assets: Dict[str, Asset] = dict(assets) if assets else {}

    def to_dict(self) -> Dict[str, Any]:
        d = self.base_dict()
        d["extent"] = self.extent
        d["license"] = self.license
        if self.title is not None:
            d["title"] = self.title
        if self.keywords:
            d["keywords"] = list(self.keywords)
        if self.providers:
            d["providers"] = list(self.providers)
        if self.summaries:
            d["summaries"] = dict(self.summaries)
        if self.assets:
            d["assets"] = {key: asset.to_dict() for key, asset in self.assets.items()}
        return d

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Collection":
        return cls(
            id=d["id"],
            description=d.get("description", ""),
            extent=d["extent"],
            license=d.get("license", "other"),
            title=d.get("title"),
            keywords=d.get("keywords"),
            providers=d.get("providers"),
            summaries=d.get("summaries"),
            assets={k: Asset.from_dict(v) for k, v in d.get("assets", {}).items()},
            links=[Link.from_dict(link) for link in d.get("links", [])],
            extra_fields={k: v for k, v in d.items() if k not in {
                "type", "stac_version", "id", "description", "links", "extent",
                "license", "title", "keywords", "providers", "summaries", "assets"}},
        )


class Item(_StacObject):
    """A STAC Item: a GeoJSON Feature with assets and a datetime."""

    STAC_OBJECT_TYPE = "Feature"

    def __init__(
        self,
        id: str,
        geometry: Optional[Dict[str, Any]],
        bbox: Sequence[float],
        datetime: Optional[str],
        properties: Optional[Dict[str, Any]] = None,
        assets: Optional[Dict[str, Asset]] = None,
        collection: Optional[str] = None,
        links: Optional[Sequence[Link]] = None,
        extra_fields: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(id=id, links=links, extra_fields=extra_fields)
        if not _is_valid_bbox(bbox):
            raise ValueError("item bbox must be 4 or 6 finite numbers with min < max")
        if not _is_geometry(geometry):
            raise ValueError("item geometry must be a GeoJSON geometry object or null")
        if datetime is not None and not _is_valid_datetime(datetime):
            raise ValueError("item datetime must be an ISO-8601 string or null")
        self.geometry = geometry
        self.bbox = list(bbox)
        self.datetime = datetime
        self.properties: Dict[str, Any] = dict(properties) if properties else {}
        self.assets: Dict[str, Asset] = dict(assets) if assets else {}
        self.collection = collection

    def to_dict(self) -> Dict[str, Any]:
        properties = dict(self.properties)
        # STAC requires the datetime in properties (null when start/end are used).
        properties["datetime"] = self.datetime
        stac_extensions = self.extra_fields.get("stac_extensions")
        d: Dict[str, Any] = {
            "type": "Feature",
            "stac_version": STAC_VERSION,
            "stac_extensions": list(stac_extensions) if isinstance(stac_extensions, list) else [],
            "id": self.id,
            "geometry": self.geometry,
            "bbox": list(self.bbox),
            "properties": properties,
            "links": [link.to_dict() for link in self.links],
            "assets": {key: asset.to_dict() for key, asset in self.assets.items()},
        }
        if self.collection:
            d["collection"] = self.collection
        # Preserve any remaining extra fields (excluding the ones handled above).
        for key, value in self.extra_fields.items():
            if key != "stac_extensions" and key not in d:
                d[key] = value
        return d

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Item":
        properties = d.get("properties", {})
        return cls(
            id=d["id"],
            geometry=d.get("geometry"),
            bbox=d.get("bbox", []),
            datetime=properties.get("datetime"),
            properties={k: v for k, v in properties.items() if k != "datetime"},
            assets={k: Asset.from_dict(v) for k, v in d.get("assets", {}).items()},
            collection=d.get("collection"),
            links=[Link.from_dict(link) for link in d.get("links", [])],
            extra_fields={k: v for k, v in d.items() if k not in {
                "type", "stac_version", "stac_extensions", "id", "geometry", "bbox",
                "properties", "links", "assets", "collection"}},
        )

    def asset(self, key: str) -> Optional[Asset]:
        return self.assets.get(key)


def validate_extent(extent: Any) -> None:
    """Validate a STAC extent mapping (spatial bbox list + temporal interval)."""
    if not _is_record(extent):
        raise ValueError("extent must be an object")
    spatial = extent.get("spatial")
    if not _is_record(spatial) or not isinstance(spatial.get("bbox"), list) or not spatial["bbox"]:
        raise ValueError("extent.spatial.bbox must be a non-empty array of bboxes")
    for bbox in spatial["bbox"]:
        if not _is_valid_bbox(bbox):
            raise ValueError("extent.spatial.bbox entries must be valid bboxes")
    temporal = extent.get("temporal")
    if not _is_record(temporal) or not isinstance(temporal.get("interval"), list):
        raise ValueError("extent.temporal.interval must be an array")
    for interval in temporal["interval"]:
        if not isinstance(interval, (list, tuple)) or len(interval) != 2:
            raise ValueError("extent.temporal.interval entries must be [start, end]")
        start, end = interval
        if start is not None and not _is_valid_datetime(start):
            raise ValueError("extent.temporal start must be ISO-8601 or null")
        if end is not None and not _is_valid_datetime(end):
            raise ValueError("extent.temporal end must be ISO-8601 or null")
        if start is not None and end is not None and start > end:
            raise ValueError("extent.temporal start must not be after end")


def validate_item(item: Item) -> None:
    """Re-validate an Item's core invariants (id, bbox, datetime, assets)."""
    if not _is_non_empty_string(item.id):
        raise ValueError("item id must be a non-empty string")
    if not _is_valid_bbox(item.bbox):
        raise ValueError("item bbox is invalid")
    if item.datetime is not None and not _is_valid_datetime(item.datetime):
        raise ValueError("item datetime is invalid")
    for key, asset in item.assets.items():
        if not _is_non_empty_string(key):
            raise ValueError("asset key must be a non-empty string")
        if not _is_non_empty_string(asset.href):
            raise ValueError(f"asset {key!r} href is invalid")


def validate_collection(collection: Collection) -> None:
    """Re-validate a Collection's core invariants (id, extent, assets)."""
    if not _is_non_empty_string(collection.id):
        raise ValueError("collection id must be a non-empty string")
    validate_extent(collection.extent)
    for key, asset in collection.assets.items():
        if not _is_non_empty_string(asset.href):
            raise ValueError(f"asset {key!r} href is invalid")


def validate_catalog(catalog: Catalog) -> None:
    """Re-validate a Catalog's core invariants (id, links)."""
    if not _is_non_empty_string(catalog.id):
        raise ValueError("catalog id must be a non-empty string")
    for link in catalog.links:
        if not _is_non_empty_string(link.rel) or not _is_non_empty_string(link.href):
            raise ValueError("catalog links need a rel and href")


def spatial_extent(bbox: Sequence[float]) -> Dict[str, Any]:
    """Build a STAC ``extent.spatial`` mapping from a single bbox."""
    if not _is_valid_bbox(bbox):
        raise ValueError("bbox must be a valid 4- or 6-number extent")
    return {"bbox": [list(bbox)]}


def temporal_extent(start: Optional[str], end: Optional[str]) -> Dict[str, Any]:
    """Build a STAC ``extent.temporal`` mapping from an interval."""
    if start is not None and not _is_valid_datetime(start):
        raise ValueError("start must be ISO-8601 or null")
    if end is not None and not _is_valid_datetime(end):
        raise ValueError("end must be ISO-8601 or null")
    if start is not None and end is not None and start > end:
        raise ValueError("start must not be after end")
    return {"interval": [[start, end]]}


def raster_assets(item: Item) -> Dict[str, Asset]:
    """Return the subset of an Item's assets that are raster media types."""
    return {key: asset for key, asset in item.assets.items() if asset.is_raster()}


def item_from_data_artifact(
    artifact: Dict[str, Any],
    identifier: str,
    bbox: Sequence[float],
    datetime: Optional[str] = None,
    collection: Optional[str] = None,
    roles: Optional[Sequence[str]] = None,
    extra_properties: Optional[Dict[str, Any]] = None,
) -> Item:
    """Build a STAC Item from a validated HyDroMA ``DataArtifact`` reference.

    This is the integration point between the scientific data contract and STAC:
    a ``DataArtifact`` (id/kind/uri/mediaType/checksum/spatial/temporal) becomes
    a STAC Item whose single asset points at the same URI and carries the same
    checksum. The artifact is *not* copied; only its reference metadata is used.
    """
    from .data import is_data_artifact

    if not is_data_artifact(artifact):
        raise ValueError("artifact is not a valid DataArtifact")
    if not _is_valid_bbox(bbox):
        raise ValueError("bbox must be a valid 4- or 6-number extent")

    asset = Asset(
        href=artifact["uri"],
        media_type=artifact.get("mediaType"),
        roles=list(roles) if roles else ["data"],
        checksum=artifact.get("checksum"),
        title=artifact.get("title"),
    )

    properties: Dict[str, Any] = {
        "eco-nojin:data:id": artifact["id"],
        "eco-nojin:data:kind": artifact["kind"],
    }
    spatial = artifact.get("spatial")
    if spatial is not None:
        properties["eco-nojin:data:crs"] = spatial.get("crs")
    temporal = artifact.get("temporal")
    if temporal is not None:
        properties["eco-nojin:data:start"] = temporal.get("start")
        properties["eco-nojin:data:end"] = temporal.get("end")
    if artifact.get("license"):
        properties["license"] = artifact["license"]
    if extra_properties:
        properties.update(extra_properties)

    return Item(
        id=identifier,
        geometry=None,
        bbox=list(bbox),
        datetime=datetime,
        properties=properties,
        assets={artifact["id"]: asset},
        collection=collection,
    )