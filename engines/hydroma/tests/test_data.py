from hydroma.data import (
    DATA_KINDS,
    is_data_artifact,
    is_data_quality,
    is_raster_media_type,
    is_temporal_range,
)

COG = "image/tiff; application=geotiff; profile=cloud-optimized"


def _artifact(**overrides):
    base = {
        "id": "dataset-1",
        "kind": "model_ready",
        "uri": "file:///data/precipitation.tif",
        "mediaType": COG,
    }
    base.update(overrides)
    return base


def test_data_kinds_match_contract():
    assert DATA_KINDS == (
        "raw",
        "processed",
        "model_ready",
        "observation",
        "simulation_result",
        "reference",
    )


def test_valid_artifact_accepted():
    assert is_data_artifact(_artifact()) is True


def test_artifact_rejects_unknown_kind():
    assert is_data_artifact(_artifact(kind="unknown")) is False


def test_artifact_requires_id_uri_mediatype():
    assert is_data_artifact(_artifact(id="")) is False
    assert is_data_artifact(_artifact(uri="")) is False
    assert is_data_artifact(_artifact(mediaType="")) is False


def test_artifact_rejects_bad_spatial():
    assert is_data_artifact(_artifact(spatial={"crs": "EPSG:4326", "domain": {"kind": "unknown"}})) is False


def test_artifact_rejects_bad_temporal():
    assert is_data_artifact(
        _artifact(temporal={"start": "2026-02-01T00:00:00Z", "end": "2026-01-01T00:00:00Z"})
    ) is False


def test_artifact_accepts_temporal_and_checksum():
    artifact = _artifact(
        checksum="sha256:abc123",
        unit="mm",
        temporal={"start": "2026-01-01T00:00:00Z", "end": "2026-12-31T00:00:00Z"},
    )
    assert is_data_artifact(artifact) is True


def test_temporal_range_validation():
    assert is_temporal_range({"start": "2026-01-01T00:00:00Z", "end": "2026-12-31T00:00:00Z"}) is True
    assert is_temporal_range({"start": "2026-01-01T00:00:00Z"}) is False
    assert is_temporal_range({"start": "2026-02-01T00:00:00Z", "end": "2026-01-01T00:00:00Z"}) is False


def test_data_quality_validation():
    assert is_data_quality({"completeness": 0.95, "flags": ["cloud"]}) is True
    assert is_data_quality({"completeness": 1.5}) is False
    assert is_data_quality({"missingValueCount": -1}) is False


def test_raster_media_type_detection():
    assert is_raster_media_type(COG) is True
    assert is_raster_media_type("image/tiff; application=geotiff") is True
    assert is_raster_media_type("application/netcdf") is True
    assert is_raster_media_type("application/geo+json") is False
    assert is_raster_media_type(None) is False