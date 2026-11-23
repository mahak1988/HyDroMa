import pytest

from hydroma.tiling import (
    TILE_PROVIDERS,
    TileRef,
    TileRequest,
    is_tile_provider,
    tile_url,
    validate_tile_request,
)


def test_tile_request_valid():
    req = TileRequest(z=10, x=512, y=768, assets=["file:///a.tif"])
    assert req.to_dict()["z"] == 10
    assert req.to_dict()["assets"] == ["file:///a.tif"]


def test_tile_request_rejects_negative_coords():
    with pytest.raises(ValueError):
        TileRequest(z=-1, x=0, y=0, assets=["a"])
    with pytest.raises(ValueError):
        TileRequest(z=0, x=0, y=0, assets=[])


def test_tile_request_rejects_unknown_provider():
    with pytest.raises(ValueError):
        TileRequest(z=0, x=0, y=0, assets=["a"], provider="mapnik")
    assert is_tile_provider("titiler") is True
    assert is_tile_provider("custom") is True
    assert set(TILE_PROVIDERS) == {"titiler", "custom"}


def test_tile_url_builds_titiler_shape():
    url = tile_url("http://localhost:8000", 10, 512, 768, ["file:///a.tif"])
    assert url == "http://localhost:8000/tiles/WebMercatorQuad/10/512/768?asset=file:///a.tif"


def test_tile_url_with_options():
    url = tile_url("http://x/", 1, 2, 3, ["a", "b"], expression="b1/b2", tile_size=512, format="jpeg")
    assert "/tiles/WebMercatorQuad/1/2/3?" in url
    assert "asset=a" in url and "asset=b" in url
    assert "expression=b1/b2" in url
    assert "tile_size=512" in url
    assert "format=jpeg" in url


def test_tile_url_requires_assets():
    with pytest.raises(ValueError):
        tile_url("http://x", 0, 0, 0, [])


def test_validate_tile_request_mapping():
    assert validate_tile_request({"z": 1, "x": 2, "y": 3, "assets": ["a"]}) is True
    assert validate_tile_request({"z": -1, "x": 2, "y": 3, "assets": ["a"]}) is False
    assert validate_tile_request({"z": 1, "x": 2, "y": 3, "assets": []}) is False
    assert validate_tile_request({"z": 1, "x": 2, "y": 3, "assets": ["a"], "provider": "x"}) is False


def test_tile_ref_serializes():
    req = TileRequest(z=1, x=2, y=3, assets=["a"])
    ref = TileRef(url="http://x/tiles/WebMercatorQuad/1/2/3?asset=a", request=req)
    d = ref.to_dict()
    assert d["url"].startswith("http://x/tiles/")
    assert d["request"]["z"] == 1
    assert d["media_type"] == "image/png"


def test_tile_ref_requires_url():
    with pytest.raises(ValueError):
        TileRef(url="", request=TileRequest(z=0, x=0, y=0, assets=["a"]))