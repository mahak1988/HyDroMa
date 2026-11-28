import copy

from conftest import make_record

from edi.validation import validate_canonical_record


def test_schema_point(record):
    validate_canonical_record(record)


def test_schema_asset_backed():
    record = make_record()
    record["record_kind"] = "asset_backed_observation"
    record["value_encoding"] = "asset"
    record["value"] = None
    record["asset"] = {
        "uri": "file:///data/edi/raster/test.tif",
        "media_type": "image/tiff; application=geotiff; profile=cloud-optimized",
        "sha256": "sha256:" + "0" * 64,
        "byte_size": 1024,
    }
    validate_canonical_record(record)


def test_schema_raster():
    record = make_record()
    record["record_kind"] = "raster_asset"
    record["value_encoding"] = "asset"
    record["value"] = None
    record["geometry"] = {
        "type": "Polygon",
        "coordinates": [[[145.0, -35.0], [147.0, -35.0], [147.0, -34.0], [145.0, -34.0], [145.0, -35.0]]],
    }
    record["grid"] = {
        "crs": "EPSG:4326",
        "shape": [10, 20],
        "cell_size": [0.1, 0.1],
        "origin": [-35.0, 145.0],
    }
    record["asset"] = {
        "uri": "file:///data/edi/raster/test.tif",
        "media_type": "image/tiff; application=geotiff; profile=cloud-optimized",
        "sha256": "sha256:" + "0" * 64,
        "byte_size": 1024,
    }
    validate_canonical_record(record)