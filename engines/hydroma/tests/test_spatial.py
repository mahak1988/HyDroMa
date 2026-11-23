from hydroma.spatial import (
    SPATIAL_CRS_KINDS,
    SPATIAL_DOMAIN_KINDS,
    bbox_from_extent,
    is_bbox,
    is_spatial_crs,
    is_spatial_metadata,
)

import pytest


def test_bbox_validation():
    assert is_bbox([1, 2, 3, 4]) is True
    assert is_bbox((1, 2, 3, 4)) is True
    assert is_bbox([1, 2, 3]) is False
    assert is_bbox([1, 2, 3, "4"]) is False
    assert is_bbox([1, 2, 3, float("nan")]) is False


def test_crs_validation():
    assert is_spatial_crs({"code": "EPSG:4326", "kind": "geographic"}) is True
    assert is_spatial_crs({"code": "EPSG:4326", "kind": "unknown"}) is False
    assert is_spatial_crs({"code": "", "kind": "geographic"}) is False
    assert set(SPATIAL_CRS_KINDS) == {"geographic", "projected", "local"}


def test_domain_kinds_match_contract():
    assert SPATIAL_DOMAIN_KINDS == ("raster", "vector", "grid", "h3", "point", "polygon")


def test_is_spatial_metadata_h3():
    assert is_spatial_metadata({"crs": "EPSG:4326", "domain": {"kind": "h3", "resolution": 7}}) is True
    assert is_spatial_metadata({"crs": "EPSG:4326", "domain": {"kind": "h3", "resolution": "7"}}) is False


def test_is_spatial_metadata_grid_and_vector():
    assert is_spatial_metadata(
        {"crs": "EPSG:4326", "domain": {"kind": "grid", "cellSize": 0.01, "unit": "deg"}}
    ) is True
    assert is_spatial_metadata(
        {"crs": "EPSG:4326", "domain": {"kind": "grid", "cellSize": 0.01}}
    ) is False
    assert is_spatial_metadata(
        {"crs": "EPSG:4326", "domain": {"kind": "vector", "geometryTypes": ["polygon"]}}
    ) is True
    assert is_spatial_metadata(
        {"crs": "EPSG:4326", "domain": {"kind": "vector", "geometryTypes": ["circle"]}}
    ) is False


def test_is_spatial_metadata_raster_with_resolution_and_extent():
    meta = {
        "crs": "EPSG:4326",
        "domain": {
            "kind": "raster",
            "crs": "EPSG:4326",
            "resolution": {"x": 0.01, "y": 0.01, "unit": "deg"},
            "extent": {"bbox": [10.0, 20.0, 11.0, 21.0], "crs": "EPSG:4326"},
        },
        "resolution": {"x": 0.01, "y": 0.01, "unit": "deg"},
    }
    assert is_spatial_metadata(meta) is True
    bad = dict(meta)
    bad["resolution"] = {"x": 0.01, "y": 0.01}
    assert is_spatial_metadata(bad) is False


def test_is_spatial_metadata_rejects_bad_extent():
    meta = {
        "crs": "EPSG:4326",
        "domain": {"kind": "raster", "crs": "EPSG:4326"},
        "extent": {"bbox": [1, 2, 3], "crs": "EPSG:4326"},
    }
    assert is_spatial_metadata(meta) is False


def test_bbox_from_extent_rejects_inverted():
    extent = bbox_from_extent(10.0, 20.0, 11.0, 21.0, "EPSG:4326")
    assert extent["bbox"] == [10.0, 20.0, 11.0, 21.0]
    assert extent["crs"] == "EPSG:4326"
    with pytest.raises(ValueError):
        bbox_from_extent(11.0, 20.0, 10.0, 21.0, "EPSG:4326")