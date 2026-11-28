"""Free data source adapter tests. Software checks only — NOT scientific validation."""

import pytest

from hydroma.free_sources import (
    FREE_SOURCES,
    SOURCE_KEYS,
    get_source,
    build_data_artifact,
    build_stac_item,
    list_sources,
)
from hydroma.data import is_data_artifact
from hydroma.stac import validate_item


def test_registry_keys():
    for key in ("sentinel-2", "landsat", "modis", "chirps", "era5", "grace", "soilgrids", "srtm"):
        assert key in FREE_SOURCES
        assert get_source(key)["license"]


def test_unknown_source():
    with pytest.raises(KeyError):
        get_source("nope")


def test_build_data_artifact_reference():
    art = build_data_artifact("sentinel-2", "s3://bucket/B04.tif", item_id="s2-1")
    assert is_data_artifact(art)
    assert art["kind"] == "raw"
    assert "s3://" in art["uri"]


def test_build_stac_item():
    item = build_stac_item("chirps", "chirps-2024", datetime_str="2024-01-01T00:00:00Z",
                           bbox=[-180, -90, 180, 90], asset_href="s3://chirps/p.tif")
    d = item.to_dict()
    assert d["id"] == "chirps-2024"
    assert d["collection"] == "chirps-v2"
    assert d["properties"]["eco-nojin:source"] == "chirps"
    assert "data" in d["assets"]
    validate_item(item)  # raises if invalid


def test_list_sources():
    srcs = list_sources()
    assert len(srcs) == len(SOURCE_KEYS)
    assert all("license" in s and "variables" in s for s in srcs)


def test_no_network_import():
    # adapter must not import network libraries
    import hydroma.free_sources as fs
    src = open(fs.__file__, encoding="utf-8").read()
    for bad in ("import requests", "import httpx", "urllib.request", "import rasterio"):
        assert bad not in src