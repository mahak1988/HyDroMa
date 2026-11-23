"""Minimal persistent scientific data catalogue for HyDroMA.

Purpose
-------
Make the existing :mod:`hydroma.stac` / :mod:`hydroma.data` capability
*persistently usable and searchable* without adopting PySTAC, PgSTAC, PostGIS or
any third-party dependency. This is a small, local-first, SQLite-backed store of
STAC 1.0.0-subset Items and Collections produced by the engine (typically via
:func:`hydroma.stac.item_from_data_artifact`).

Design principles (mirrors :mod:`hydroma.jobs`, but is *not* coupled to it)
--------------------------------------------------------------------------
* stdlib-only (``sqlite3`` + ``json``); no new dependency.
* Parameterised SQL only; no string interpolation of values.
* The catalogue stores **metadata and references**, never asset bytes. It never
  opens, downloads, or resolves the URIs it records.
* It never silently overwrites. A duplicate Item ID is an explicit error.
* Scientific metadata is stored as-is; missing values are never invented.
* The catalogue is independent of scientific model execution: registering or
  querying it never runs a model, and models do not depend on it.

Storage schema
--------------
``items``
    ``id`` (PK), ``collection``, ``datetime``, ``bbox_min_x/min_y/max_x/max_y``,
    ``stac_json`` (canonical JSON of the full Item), ``checksum``, ``created_at``.
``item_assets``
    ``item_id`` (FK → items.id), ``key``, ``href``, ``media_type``, ``checksum``.
    Indexed on ``media_type`` for media-type filtering.
``collections``
    ``id`` (PK), ``stac_json`` (canonical JSON of the full Collection),
    ``created_at``.

Query semantics
---------------
* **Collection** — exact match on the Item's ``collection`` field.
* **Item ID** — exact match (primary key).
* **Media type** — an Item matches if *any* of its assets has that media type
  (exact, case-insensitive base type match after stripping parameters).
* **Temporal** — an Item matches a query ``[start, end]`` when:
    - it has a point ``datetime`` and ``start <= datetime <= end`` (open bounds
      allowed), or
    - it has a ``start_datetime``/``end_datetime`` interval (STAC common
      metadata) that *overlaps* the query interval
      (``item_start <= end`` and ``item_end >= start``).
  Items with **no** temporal metadata are **excluded** when a temporal filter is
  supplied (the store cannot confirm a match, so it does not guess).
* **Bounding box** — bounding-box **overlap** only (not precise geometry):
  ``item_min_x <= query_max_x`` and ``item_max_x >= query_min_x`` and the same
  for Y. Touching edges count as overlap. 6-number 3D bboxes are reduced to
  their 2D X/Y extent. This is **not** a GIS geometry engine.

Ordering is deterministic: non-null ``datetime`` first (ascending), then items
with null ``datetime``, then ``id`` ascending.

Limitations
-----------
* STAC 1.0.0 subset only (see :mod:`hydroma.stac`); not full STAC compliance.
* No STAC API, no search endpoint, no paging tokens, no extension modules.
* No asset resolution / download / validation of remote references.
* Single-process, single-node; not a distributed catalogue.
"""

from __future__ import annotations

import json
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from .stac import Asset, Catalog, Collection, Item, validate_item

__all__ = [
    "CatalogueError",
    "DuplicateItemError",
    "ItemValidationError",
    "CatalogueStoreError",
    "CatalogueStore",
    "CATALOGUE_SCHEMA_VERSION",
]

CATALOGUE_SCHEMA_VERSION = 1

_SCHEMA = """
CREATE TABLE IF NOT EXISTS items (
    id            TEXT PRIMARY KEY,
    collection    TEXT,
    datetime      TEXT,
    bbox_min_x    REAL,
    bbox_min_y    REAL,
    bbox_max_x    REAL,
    bbox_max_y    REAL,
    stac_json     TEXT NOT NULL,
    checksum      TEXT,
    created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_items_collection ON items(collection);
CREATE INDEX IF NOT EXISTS idx_items_datetime ON items(datetime);

CREATE TABLE IF NOT EXISTS item_assets (
    item_id     TEXT NOT NULL,
    key         TEXT NOT NULL,
    href        TEXT NOT NULL,
    media_type  TEXT,
    checksum    TEXT,
    PRIMARY KEY (item_id, key),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_item_assets_media ON item_assets(media_type);

CREATE TABLE IF NOT EXISTS collections (
    id          TEXT PRIMARY KEY,
    stac_json   TEXT NOT NULL,
    created_at  TEXT NOT NULL
);
"""


class CatalogueError(Exception):
    """Base class for catalogue errors."""


class DuplicateItemError(CatalogueError):
    """Raised when registering an Item ID that already exists (never overwritten)."""


class ItemValidationError(CatalogueError):
    """Raised when an Item/Collection fails catalogue-level validation."""


class CatalogueStoreError(CatalogueError):
    """Raised for unexpected database/integrity failures."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _canonical_json(obj: Any) -> str:
    """Deterministic JSON (sorted keys, compact, UTF-8, no NaN) for storage."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)


def _base_media_type(media_type: Optional[str]) -> Optional[str]:
    if not media_type:
        return None
    return media_type.split(";", 1)[0].strip().lower()


def _parse_dt(value: Any) -> Optional[datetime]:
    """Parse an ISO-8601 string to an aware UTC datetime (None if unparseable)."""
    if not isinstance(value, str):
        return None
    text = value.strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _bbox_2d(bbox: Sequence[float]) -> Tuple[float, float, float, float]:
    """Reduce a 4- or 6-number bbox to (min_x, min_y, max_x, max_y)."""
    if len(bbox) == 4:
        return float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])
    if len(bbox) == 6:
        return float(bbox[0]), float(bbox[1]), float(bbox[3]), float(bbox[4])
    raise ItemValidationError("bbox must contain 4 or 6 numbers")


def _item_bbox(item: Item) -> Tuple[float, float, float, float]:
    return _bbox_2d(item.bbox)


def _bbox_overlaps(
    a: Tuple[float, float, float, float], b: Tuple[float, float, float, float]
) -> bool:
    """Bounding-box overlap (inclusive edges). Not precise geometry."""
    return a[0] <= b[2] and a[2] >= b[0] and a[1] <= b[3] and a[3] >= b[1]


def _temporal_matches(item: Item, start: Optional[str], end: Optional[str]) -> bool:
    """Return True if the item's temporal metadata matches the query window."""
    q_start = _parse_dt(start)
    q_end = _parse_dt(end)
    if q_start is None and q_end is None:
        return True

    point = _parse_dt(item.datetime)
    if point is not None:
        if q_start is not None and point < q_start:
            return False
        if q_end is not None and point > q_end:
            return False
        return True

    # Interval metadata (STAC common metadata start_datetime / end_datetime).
    props = item.properties or {}
    item_start = _parse_dt(props.get("start_datetime"))
    item_end = _parse_dt(props.get("end_datetime"))
    if item_start is None and item_end is None:
        # No temporal metadata available: cannot confirm a match.
        return False
    if q_end is not None and item_start is not None and item_start > q_end:
        return False
    if q_start is not None and item_end is not None and item_end < q_start:
        return False
    return True


class CatalogueStore:
    """A small, persistent, SQLite-backed STAC-subset catalogue.

    The store is local-first and single-node. It records metadata and asset
    *references* only; it never fetches or resolves the referenced assets.
    """

    def __init__(self, path: str = ":memory:") -> None:
        self.path = path
        self._lock = threading.RLock()
        self._conn = sqlite3.connect(path, check_same_thread=False, timeout=10.0)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA foreign_keys = ON")
        self._init_schema()

    # -- lifecycle ---------------------------------------------------------
    def _init_schema(self) -> None:
        with self._lock:
            self._conn.executescript(_SCHEMA)
            current = self._conn.execute("PRAGMA user_version").fetchone()[0]
            if current < CATALOGUE_SCHEMA_VERSION:
                self._conn.execute(f"PRAGMA user_version = {CATALOGUE_SCHEMA_VERSION}")
            self._conn.commit()

    def close(self) -> None:
        with self._lock:
            self._conn.close()

    def __enter__(self) -> "CatalogueStore":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    # -- internal helpers --------------------------------------------------
    def _row_to_item(self, row: sqlite3.Row) -> Item:
        try:
            data = json.loads(row["stac_json"])
            return Item.from_dict(data)
        except (KeyError, ValueError, TypeError) as exc:
            raise CatalogueStoreError(
                f"stored item {row['id']!r} cannot be deserialized: {exc}"
            ) from exc

    def _item_assets(self, item: Item) -> List[Dict[str, Any]]:
        rows = []
        for key, asset in item.assets.items():
            rows.append((item.id, key, asset.href, asset.media_type, asset.checksum))
        return rows

    # -- registration ------------------------------------------------------
    def register_item(self, item: Item, overwrite: bool = False) -> None:
        """Persist an Item. Duplicate IDs raise :class:`DuplicateItemError`.

        ``overwrite=False`` (default) guarantees no silent overwrite of stored
        scientific metadata. ``overwrite=True`` is an explicit opt-in that
        replaces the stored representation atomically.
        """
        if not isinstance(item, Item):
            raise ItemValidationError("item must be a hydroma.stac.Item")
        try:
            validate_item(item)
        except ValueError as exc:
            raise ItemValidationError(str(exc)) from exc

        min_x, min_y, max_x, max_y = _item_bbox(item)
        stac_json = _canonical_json(item.to_dict())
        checksum = self._item_checksum(item)
        created_at = _now()

        with self._lock:
            try:
                if overwrite:
                    self._conn.execute("DELETE FROM items WHERE id = ?", (item.id,))
                self._conn.execute(
                    "INSERT INTO items (id, collection, datetime, bbox_min_x, bbox_min_y,"
                    " bbox_max_x, bbox_max_y, stac_json, checksum, created_at)"
                    " VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (
                        item.id,
                        item.collection,
                        item.datetime,
                        min_x,
                        min_y,
                        max_x,
                        max_y,
                        stac_json,
                        checksum,
                        created_at,
                    ),
                )
                self._conn.executemany(
                    "INSERT INTO item_assets (item_id, key, href, media_type, checksum)"
                    " VALUES (?,?,?,?,?)",
                    self._item_assets(item),
                )
                self._conn.commit()
            except sqlite3.IntegrityError as exc:
                self._conn.rollback()
                raise DuplicateItemError(f"item already registered: {item.id!r}") from exc
            except sqlite3.Error as exc:
                self._conn.rollback()
                raise CatalogueStoreError(f"failed to register item: {exc}") from exc

    def register_collection(self, collection: Collection, overwrite: bool = False) -> None:
        """Persist a Collection. Duplicate IDs raise :class:`DuplicateItemError`."""
        if not isinstance(collection, Collection):
            raise ItemValidationError("collection must be a hydroma.stac.Collection")
        stac_json = _canonical_json(collection.to_dict())
        created_at = _now()
        with self._lock:
            try:
                if overwrite:
                    self._conn.execute("DELETE FROM collections WHERE id = ?", (collection.id,))
                self._conn.execute(
                    "INSERT INTO collections (id, stac_json, created_at) VALUES (?,?,?)",
                    (collection.id, stac_json, created_at),
                )
                self._conn.commit()
            except sqlite3.IntegrityError as exc:
                self._conn.rollback()
                raise DuplicateItemError(
                    f"collection already registered: {collection.id!r}"
                ) from exc
            except sqlite3.Error as exc:
                self._conn.rollback()
                raise CatalogueStoreError(f"failed to register collection: {exc}") from exc

    @staticmethod
    def _item_checksum(item: Item) -> Optional[str]:
        """Derive a single checksum for the item from its assets, if any."""
        checksums = [a.checksum for a in item.assets.values() if a.checksum]
        if not checksums:
            return None
        if len(set(checksums)) == 1:
            return checksums[0]
        # Multiple distinct asset checksums: record a stable composite reference.
        return "composite:" + ",".join(sorted(checksums))

    # -- retrieval ---------------------------------------------------------
    def get_item(self, item_id: str) -> Optional[Item]:
        with self._lock:
            row = self._conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
        return self._row_to_item(row) if row else None

    def get_item_dict(self, item_id: str) -> Optional[Dict[str, Any]]:
        item = self.get_item(item_id)
        return item.to_dict() if item is not None else None

    def item_exists(self, item_id: str) -> bool:
        with self._lock:
            row = self._conn.execute(
                "SELECT 1 FROM items WHERE id = ?", (item_id,)
            ).fetchone()
        return row is not None

    def get_collection(self, collection_id: str) -> Optional[Collection]:
        with self._lock:
            row = self._conn.execute(
                "SELECT * FROM collections WHERE id = ?", (collection_id,)
            ).fetchone()
        if row is None:
            return None
        try:
            return Collection.from_dict(json.loads(row["stac_json"]))
        except (KeyError, ValueError, TypeError) as exc:
            raise CatalogueStoreError(
                f"stored collection {row['id']!r} cannot be deserialized: {exc}"
            ) from exc

    def list_collections(self) -> List[Collection]:
        with self._lock:
            rows = self._conn.execute(
                "SELECT * FROM collections ORDER BY id ASC"
            ).fetchall()
        collections = []
        for row in rows:
            try:
                collections.append(Collection.from_dict(json.loads(row["stac_json"])))
            except (KeyError, ValueError, TypeError) as exc:
                raise CatalogueStoreError(
                    f"stored collection {row['id']!r} cannot be deserialized: {exc}"
                ) from exc
        return collections

    def count(self) -> int:
        with self._lock:
            row = self._conn.execute("SELECT COUNT(*) AS n FROM items").fetchone()
        return int(row["n"])

    # -- search ------------------------------------------------------------
    def list_items(
        self,
        collection: Optional[str] = None,
        item_id: Optional[str] = None,
        media_type: Optional[str] = None,
        start: Optional[str] = None,
        end: Optional[str] = None,
        bbox: Optional[Sequence[float]] = None,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> List[Item]:
        """Search Items with deterministic ordering.

        Filters are combined with AND. See the module docstring for the exact
        semantics of each filter (notably: bbox = overlap only; items with no
        temporal metadata are excluded when a temporal filter is supplied).
        """
        if limit is not None and (not isinstance(limit, int) or limit < 0):
            raise ValueError("limit must be a non-negative integer")
        if not isinstance(offset, int) or offset < 0:
            raise ValueError("offset must be a non-negative integer")

        query_bbox = None
        if bbox is not None:
            try:
                query_bbox = _bbox_2d(bbox)
            except (TypeError, IndexError) as exc:
                raise ValueError("bbox must be a sequence of 4 or 6 numbers") from exc

        sql = ["SELECT * FROM items"]
        clauses: List[str] = []
        params: List[Any] = []

        if item_id is not None:
            clauses.append("id = ?")
            params.append(item_id)
        if collection is not None:
            clauses.append("collection = ?")
            params.append(collection)

        if clauses:
            sql.append("WHERE " + " AND ".join(clauses))
        # Deterministic order: non-null datetime ascending first, then nulls, then id.
        sql.append("ORDER BY (datetime IS NULL) ASC, datetime ASC, id ASC")

        with self._lock:
            try:
                rows = self._conn.execute(" ".join(sql), params).fetchall()
            except sqlite3.Error as exc:
                raise CatalogueStoreError(f"failed to query items: {exc}") from exc

        items = [self._row_to_item(row) for row in rows]

        # Media-type filter: match on any asset's base media type (case-insensitive).
        if media_type is not None:
            wanted = _base_media_type(media_type)
            items = [
                item
                for item in items
                if any(_base_media_type(a.media_type) == wanted for a in item.assets.values())
            ]

        # Bounding-box overlap (inclusive edges), reduced to 2D.
        if query_bbox is not None:
            items = [item for item in items if _bbox_overlaps(_item_bbox(item), query_bbox)]

        # Temporal filter (point datetime or interval overlap).
        if start is not None or end is not None:
            items = [item for item in items if _temporal_matches(item, start, end)]

        if offset:
            items = items[offset:]
        if limit is not None:
            items = items[:limit]
        return items

    def find_items(self, **kwargs: Any) -> List[Item]:
        """Alias for :meth:`list_items` (convenience)."""
        return self.list_items(**kwargs)

    # -- catalog serialization --------------------------------------------
    def to_catalog(self, id: str = "hydroma-catalogue", description: Optional[str] = None) -> Catalog:
        """Serialize the catalogue as a STAC Catalog of links to its items.

        This is a *description*: the links point at item IDs/hrefs but are not
        resolved. It does not fetch anything.
        """
        from .stac import Link

        links = [
            Link(rel="item", href=f"item://{row['id']}", media_type="application/json")
            for row in self._all_item_ids()
        ]
        return Catalog(
            id=id,
            description=description or "HyDroMA local scientific data catalogue",
            links=links,
        )

    def _all_item_ids(self) -> List[sqlite3.Row]:
        with self._lock:
            return self._conn.execute("SELECT id FROM items ORDER BY id ASC").fetchall()