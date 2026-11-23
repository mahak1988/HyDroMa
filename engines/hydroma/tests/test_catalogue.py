import json
import os
import sqlite3

import pytest

from hydroma.catalogue import (
    CATALOGUE_SCHEMA_VERSION,
    CatalogueStore,
    CatalogueStoreError,
    DuplicateItemError,
    ItemValidationError,
)
from hydroma.data import is_data_artifact
from hydroma.stac import (
    Asset,
    Collection,
    Item,
    item_from_data_artifact,
    spatial_extent,
    temporal_extent,
    validate_item,
)

COG = "image/tiff; application=geotiff; profile=cloud-optimized"


def _item(
    id="item-1",
    bbox=(10.0, 20.0, 11.0, 21.0),
    datetime="2026-01-01T00:00:00Z",
    collection="precipitation",
    assets=None,
    properties=None,
    geometry=None,
):
    return Item(
        id=id,
        geometry=geometry,
        bbox=list(bbox),
        datetime=datetime,
        properties=properties or {},
        collection=collection,
        assets=assets
        if assets is not None
        else {"data": Asset(href="file:///data/a.tif", media_type=COG, roles=["data"])},
    )


def _artifact(**overrides):
    base = {
        "id": "precip-2026",
        "kind": "model_ready",
        "uri": "file:///data/precip-2026.tif",
        "mediaType": COG,
        "checksum": "sha256:abc",
        "spatial": {"crs": "EPSG:4326", "domain": {"kind": "raster", "crs": "EPSG:4326"}},
        "temporal": {"start": "2026-01-01T00:00:00Z", "end": "2026-12-31T00:00:00Z"},
        "license": "CC-BY-4.0",
    }
    base.update(overrides)
    return base


# --- registration / persistence -------------------------------------------

def test_register_and_get_item():
    store = CatalogueStore()
    item = _item()
    store.register_item(item)
    fetched = store.get_item("item-1")
    assert fetched is not None
    assert fetched.id == "item-1"
    assert fetched.bbox == [10.0, 20.0, 11.0, 21.0]
    assert fetched.assets["data"].href == "file:///data/a.tif"
    assert fetched.datetime == "2026-01-01T00:00:00Z"
    store.close()


def test_get_missing_item_returns_none():
    store = CatalogueStore()
    assert store.get_item("nope") is None
    assert store.get_item_dict("nope") is None
    assert store.item_exists("nope") is False
    store.close()


def test_duplicate_id_rejected():
    store = CatalogueStore()
    store.register_item(_item())
    with pytest.raises(DuplicateItemError):
        store.register_item(_item())
    # Original metadata unchanged (no silent overwrite).
    fetched = store.get_item("item-1")
    assert fetched.assets["data"].href == "file:///data/a.tif"
    assert store.count() == 1
    store.close()


def test_duplicate_id_explicit_overwrite():
    store = CatalogueStore()
    store.register_item(_item())
    replacement = _item(assets={"data": Asset(href="file:///data/b.tif", media_type=COG)})
    store.register_item(replacement, overwrite=True)
    fetched = store.get_item("item-1")
    assert fetched.assets["data"].href == "file:///data/b.tif"
    assert store.count() == 1
    store.close()


def test_persistence_across_restart(tmp_path):
    db = str(tmp_path / "catalogue.db")
    store = CatalogueStore(db)
    store.register_item(_item())
    store.close()

    reopened = CatalogueStore(db)
    assert reopened.count() == 1
    assert reopened.get_item("item-1") is not None
    reopened.close()


def test_schema_version_set(tmp_path):
    db = str(tmp_path / "catalogue.db")
    store = CatalogueStore(db)
    version = store._conn.execute("PRAGMA user_version").fetchone()[0]
    assert version == CATALOGUE_SCHEMA_VERSION
    store.close()


# --- validation -----------------------------------------------------------

def test_invalid_item_rejected():
    store = CatalogueStore()
    with pytest.raises(ItemValidationError):
        store.register_item("not-an-item")
    bad = _item()
    bad.assets["data"].href = ""
    with pytest.raises(ItemValidationError):
        store.register_item(bad)
    assert store.count() == 0
    store.close()


def test_invalid_bbox_rejected_at_construction():
    with pytest.raises(ValueError):
        _item(bbox=(1.0, 2.0, 3.0))


# --- collections ----------------------------------------------------------

def _collection(id="precipitation"):
    return Collection(
        id=id,
        description="Daily precipitation",
        extent={
            "spatial": spatial_extent([10.0, 20.0, 11.0, 21.0]),
            "temporal": temporal_extent("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z"),
        },
        license="CC-BY-4.0",
    )


def test_register_and_get_collection():
    store = CatalogueStore()
    store.register_collection(_collection())
    fetched = store.get_collection("precipitation")
    assert fetched is not None
    assert fetched.id == "precipitation"
    assert fetched.extent["spatial"]["bbox"] == [[10.0, 20.0, 11.0, 21.0]]
    assert [c.id for c in store.list_collections()] == ["precipitation"]
    store.close()


def test_duplicate_collection_rejected():
    store = CatalogueStore()
    store.register_collection(_collection())
    with pytest.raises(DuplicateItemError):
        store.register_collection(_collection())
    store.close()


# --- filtering ------------------------------------------------------------

def test_filter_by_collection():
    store = CatalogueStore()
    store.register_item(_item(id="a", collection="precipitation"))
    store.register_item(_item(id="b", collection="temperature"))
    result = store.list_items(collection="temperature")
    assert [i.id for i in result] == ["b"]
    store.close()


def test_filter_by_item_id():
    store = CatalogueStore()
    store.register_item(_item(id="a"))
    store.register_item(_item(id="b"))
    assert [i.id for i in store.list_items(item_id="a")] == ["a"]
    store.close()


def test_filter_by_media_type():
    store = CatalogueStore()
    store.register_item(
        _item(id="raster", assets={"data": Asset(href="file:///a.tif", media_type=COG)})
    )
    store.register_item(
        _item(id="vector", assets={"data": Asset(href="file:///a.geojson", media_type="application/geo+json")})
    )
    result = store.list_items(media_type=COG)
    assert [i.id for i in result] == ["raster"]
    # base-type match is case-insensitive and parameter-insensitive
    result2 = store.list_items(media_type="image/tiff")
    assert [i.id for i in result2] == ["raster"]
    store.close()


def test_filter_by_temporal_point():
    store = CatalogueStore()
    store.register_item(_item(id="jan", datetime="2026-01-15T00:00:00Z"))
    store.register_item(_item(id="jun", datetime="2026-06-15T00:00:00Z"))
    result = store.list_items(start="2026-01-01T00:00:00Z", end="2026-03-01T00:00:00Z")
    assert [i.id for i in result] == ["jan"]
    store.close()


def test_temporal_boundary_inclusive():
    store = CatalogueStore()
    store.register_item(_item(id="edge", datetime="2026-01-01T00:00:00Z"))
    assert [i.id for i in store.list_items(start="2026-01-01T00:00:00Z")] == ["edge"]
    assert [i.id for i in store.list_items(end="2026-01-01T00:00:00Z")] == ["edge"]
    store.close()


def test_temporal_interval_overlap():
    store = CatalogueStore()
    store.register_item(
        _item(
            id="interval",
            datetime=None,
            properties={"start_datetime": "2026-01-01T00:00:00Z", "end_datetime": "2026-12-31T00:00:00Z"},
        )
    )
    # query inside the interval -> overlap
    assert [i.id for i in store.list_items(start="2026-06-01T00:00:00Z", end="2026-07-01T00:00:00Z")] == ["interval"]
    # query entirely before -> no match
    assert store.list_items(start="2025-01-01T00:00:00Z", end="2025-02-01T00:00:00Z") == []
    store.close()


def test_item_without_temporal_metadata_excluded_when_filtering():
    store = CatalogueStore()
    store.register_item(_item(id="no-time", datetime=None))
    assert store.list_items(start="2026-01-01T00:00:00Z") == []
    # without a temporal filter it is returned
    assert [i.id for i in store.list_items()] == ["no-time"]
    store.close()


def test_filter_by_bbox_overlap():
    store = CatalogueStore()
    store.register_item(_item(id="a", bbox=(10.0, 20.0, 11.0, 21.0)))
    store.register_item(_item(id="b", bbox=(30.0, 40.0, 31.0, 41.0)))
    # overlapping query
    assert [i.id for i in store.list_items(bbox=(10.5, 20.5, 10.6, 20.6))] == ["a"]
    # disjoint query
    assert store.list_items(bbox=(0.0, 0.0, 1.0, 1.0)) == []
    store.close()


def test_bbox_touching_edges_count_as_overlap():
    store = CatalogueStore()
    store.register_item(_item(id="a", bbox=(10.0, 20.0, 11.0, 21.0)))
    # query max_x == item min_x -> touching
    assert [i.id for i in store.list_items(bbox=(11.0, 20.0, 12.0, 22.0))] == ["a"]
    store.close()


def test_bbox_3d_reduced_to_2d():
    store = CatalogueStore()
    store.register_item(_item(id="a", bbox=(10.0, 20.0, 0.0, 11.0, 21.0, 5.0)))
    assert [i.id for i in store.list_items(bbox=(10.5, 20.5, 10.6, 20.6))] == ["a"]
    store.close()


# --- deterministic ordering / pagination ---------------------------------

def test_deterministic_ordering():
    store = CatalogueStore()
    store.register_item(_item(id="b", datetime="2026-02-01T00:00:00Z"))
    store.register_item(_item(id="a", datetime="2026-01-01T00:00:00Z"))
    store.register_item(_item(id="c", datetime=None))
    ids = [i.id for i in store.list_items()]
    assert ids == ["a", "b", "c"]
    store.close()


def test_limit_and_offset():
    store = CatalogueStore()
    for i in range(5):
        store.register_item(_item(id=f"i{i}", datetime=f"2026-01-0{i + 1}T00:00:00Z"))
    page = store.list_items(limit=2, offset=1)
    assert [i.id for i in page] == ["i1", "i2"]
    store.close()


# --- serialization --------------------------------------------------------

def test_stored_item_roundtrips_json():
    store = CatalogueStore()
    item = _item(assets={"data": Asset(href="file:///a.tif", media_type=COG, checksum="sha256:xyz")})
    store.register_item(item)
    stored = store._conn.execute("SELECT stac_json FROM items WHERE id='item-1'").fetchone()["stac_json"]
    json.loads(stored)  # valid JSON
    fetched = store.get_item("item-1")
    assert fetched.to_dict() == item.to_dict()
    store.close()


def test_to_catalog_serializes_links():
    store = CatalogueStore()
    store.register_item(_item(id="a"))
    store.register_item(_item(id="b"))
    catalog = store.to_catalog(id="test-catalog")
    d = catalog.to_dict()
    assert d["id"] == "test-catalog"
    assert {link["href"] for link in d["links"]} == {"item://a", "item://b"}
    json.dumps(d)
    store.close()


# --- DataArtifact integration --------------------------------------------

def test_item_from_data_artifact_registers():
    store = CatalogueStore()
    artifact = _artifact()
    assert is_data_artifact(artifact) is True
    item = item_from_data_artifact(
        artifact, identifier="precip-2026", bbox=(10.0, 20.0, 11.0, 21.0), datetime="2026-06-01T00:00:00Z"
    )
    validate_item(item)
    store.register_item(item)

    fetched = store.get_item("precip-2026")
    assert fetched.assets["precip-2026"].href == "file:///data/precip-2026.tif"
    assert fetched.assets["precip-2026"].checksum == "sha256:abc"
    assert fetched.properties["eco-nojin:data:crs"] == "EPSG:4326"
    assert fetched.properties["license"] == "CC-BY-4.0"
    # searchable by media type + collection + temporal + bbox
    assert [i.id for i in store.list_items(media_type=COG)] == ["precip-2026"]
    assert [i.id for i in store.list_items(bbox=(10.5, 20.5, 10.6, 20.6))] == ["precip-2026"]
    store.close()


# --- database error behaviour --------------------------------------------

def test_readonly_db_raises_catalogue_error(tmp_path):
    db = str(tmp_path / "catalogue.db")
    store = CatalogueStore(db)
    store.register_item(_item())
    store.close()
    os.chmod(db, 0o444)
    try:
        readonly = CatalogueStore(db)
        with pytest.raises(CatalogueStoreError):
            readonly.register_item(_item(id="second"))
        readonly.close()
    finally:
        os.chmod(db, 0o644)


def test_context_manager_closes():
    with CatalogueStore() as store:
        store.register_item(_item())
        assert store.count() == 1