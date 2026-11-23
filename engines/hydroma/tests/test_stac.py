import json

import pytest

from hydroma.stac import (
    STAC_VERSION,
    Asset,
    Catalog,
    Collection,
    Item,
    Link,
    is_stac_version,
    item_from_data_artifact,
    raster_assets,
    spatial_extent,
    temporal_extent,
    validate_catalog,
    validate_collection,
    validate_item,
)

COG = "image/tiff; application=geotiff; profile=cloud-optimized"


def _item(**overrides):
    base = dict(
        id="item-1",
        geometry=None,
        bbox=[10.0, 20.0, 11.0, 21.0],
        datetime="2026-01-01T00:00:00Z",
        properties={"eo:cloud_cover": 5},
        assets={"data": Asset(href="file:///data/a.tif", media_type=COG, roles=["data"])},
    )
    base.update(overrides)
    return Item(**base)


def test_stac_version_constant_is_semver():
    assert STAC_VERSION == "1.0.0"
    assert is_stac_version(STAC_VERSION) is True
    assert is_stac_version("1.0") is False
    assert is_stac_version("abc") is False


def test_item_serializes_to_stac_shape():
    d = _item().to_dict()
    assert d["type"] == "Feature"
    assert d["stac_version"] == STAC_VERSION
    assert d["id"] == "item-1"
    assert d["bbox"] == [10.0, 20.0, 11.0, 21.0]
    assert d["properties"]["datetime"] == "2026-01-01T00:00:00Z"
    assert d["assets"]["data"]["href"] == "file:///data/a.tif"
    assert d["assets"]["data"]["type"] == COG
    # serialisable to JSON
    json.dumps(d)


def test_item_roundtrip():
    original = _item()
    restored = Item.from_dict(original.to_dict())
    assert restored.id == original.id
    assert restored.bbox == original.bbox
    assert restored.datetime == original.datetime
    assert restored.assets["data"].href == original.assets["data"].href


def test_item_rejects_invalid_bbox():
    with pytest.raises(ValueError):
        _item(bbox=[1, 2, 3])
    with pytest.raises(ValueError):
        _item(bbox=[11.0, 20.0, 10.0, 21.0])


def test_item_rejects_invalid_datetime():
    with pytest.raises(ValueError):
        _item(datetime="not-a-date")


def test_item_null_datetime_allowed():
    item = _item(datetime=None)
    assert item.to_dict()["properties"]["datetime"] is None


def test_asset_checksum_roundtrip():
    asset = Asset(href="file:///x.tif", media_type=COG, checksum="sha256:deadbeef")
    d = asset.to_dict()
    assert d["file:checksum"] == "sha256:deadbeef"
    restored = Asset.from_dict(d)
    assert restored.checksum == "sha256:deadbeef"


def test_asset_requires_href():
    with pytest.raises(ValueError):
        Asset(href="")


def test_raster_assets_filters():
    item = _item(
        assets={
            "data": Asset(href="file:///a.tif", media_type=COG),
            "thumbnail": Asset(href="file:///t.png", media_type="image/png"),
        }
    )
    rasters = raster_assets(item)
    assert list(rasters) == ["data"]
    assert rasters["data"].is_raster() is True


def test_collection_serializes_with_extent_and_license():
    collection = Collection(
        id="precipitation",
        description="Daily precipitation",
        extent={
            "spatial": spatial_extent([10.0, 20.0, 11.0, 21.0]),
            "temporal": temporal_extent("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z"),
        },
        license="CC-BY-4.0",
        summaries={"eo:cloud_cover": {"minimum": 0, "maximum": 100}},
    )
    d = collection.to_dict()
    assert d["type"] == "Collection"
    assert d["license"] == "CC-BY-4.0"
    assert d["extent"]["spatial"]["bbox"] == [[10.0, 20.0, 11.0, 21.0]]
    validate_collection(collection)
    json.dumps(d)


def test_collection_rejects_inverted_extent():
    with pytest.raises(ValueError):
        Collection(
            id="c",
            description="d",
            extent={
                "spatial": spatial_extent([11.0, 20.0, 10.0, 21.0]),
                "temporal": temporal_extent(None, None),
            },
        )


def test_collection_roundtrip():
    collection = Collection(
        id="c",
        description="d",
        extent={
            "spatial": spatial_extent([10.0, 20.0, 11.0, 21.0]),
            "temporal": temporal_extent("2026-01-01T00:00:00Z", "2026-02-01T00:00:00Z"),
        },
        assets={"data": Asset(href="file:///a.tif", media_type=COG)},
    )
    restored = Collection.from_dict(collection.to_dict())
    assert restored.id == "c"
    assert restored.extent == collection.extent
    assert restored.assets["data"].href == "file:///a.tif"


def test_catalog_serializes():
    catalog = Catalog(id="root", description="Root catalog", links=[Link(rel="child", href="./c.json")])
    d = catalog.to_dict()
    assert d["type"] == "Catalog"
    assert d["links"][0]["rel"] == "child"
    validate_catalog(catalog)
    json.dumps(d)


def test_link_requires_rel_and_href():
    with pytest.raises(ValueError):
        Link(rel="", href="x")
    with pytest.raises(ValueError):
        Link(rel="self", href="")


def test_item_from_data_artifact():
    artifact = {
        "id": "precip-2026",
        "kind": "model_ready",
        "uri": "file:///data/precip-2026.tif",
        "mediaType": COG,
        "checksum": "sha256:abc",
        "spatial": {"crs": "EPSG:4326", "domain": {"kind": "raster", "crs": "EPSG:4326"}},
        "temporal": {"start": "2026-01-01T00:00:00Z", "end": "2026-12-31T00:00:00Z"},
        "license": "CC-BY-4.0",
    }
    item = item_from_data_artifact(
        artifact, identifier="precip-2026", bbox=[10.0, 20.0, 11.0, 21.0], datetime="2026-06-01T00:00:00Z"
    )
    validate_item(item)
    d = item.to_dict()
    assert d["id"] == "precip-2026"
    assert d["assets"]["precip-2026"]["href"] == "file:///data/precip-2026.tif"
    assert d["assets"]["precip-2026"]["file:checksum"] == "sha256:abc"
    assert d["properties"]["eco-nojin:data:crs"] == "EPSG:4326"
    assert d["properties"]["eco-nojin:data:start"] == "2026-01-01T00:00:00Z"
    assert d["properties"]["license"] == "CC-BY-4.0"
    json.dumps(d)


def test_item_from_data_artifact_rejects_invalid_artifact():
    with pytest.raises(ValueError):
        item_from_data_artifact({"id": "x"}, identifier="x", bbox=[0, 0, 1, 1])


def test_validate_item_rejects_bad_asset():
    item = Item(
        id="i",
        geometry=None,
        bbox=[0.0, 0.0, 1.0, 1.0],
        datetime=None,
        assets={"data": Asset(href="file:///a.tif", media_type=COG)},
    )
    validate_item(item)
    item.assets["data"].href = ""
    with pytest.raises(ValueError):
        validate_item(item)