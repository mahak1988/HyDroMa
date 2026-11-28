"""STAC parsing tests (offline)."""

from hydroma.connect.stac import StacClient, parse_item, extract_assets
from hydroma.connect.acquisition import AcquisitionPolicy
from connect_helpers import FakeTransport

_ITEM = {
    "type": "Feature",
    "stac_version": "1.0.0",
    "id": "S2A_123",
    "geometry": None,
    "bbox": [-10.0, -5.0, 10.0, 5.0],
    "properties": {"datetime": "2024-06-01T10:00:00Z"},
    "collection": "sentinel-2-l2a",
    "assets": {
        "B04": {"href": "https://s3/B04.tif", "type": "image/tiff; application=geotiff"},
        "B08": {"href": "https://s3/B08.tif", "type": "image/tiff; application=geotiff"},
    },
    "links": [],
}


def test_parse_item():
    item = parse_item(_ITEM)
    assert item.id == "S2A_123"
    assert item.collection == "sentinel-2-l2a"


def test_extract_assets():
    assets = extract_assets(_ITEM)
    keys = {a["key"] for a in assets}
    assert keys == {"B04", "B08"}
    assert all(a["href"] for a in assets)


def test_stac_search_featurecollection():
    import json
    payload = json.dumps({"type": "FeatureCollection", "features": [_ITEM, _ITEM]}).encode()
    transport = FakeTransport(payloads={"https://stac.example/search": payload})
    client = StacClient(transport)
    items = client.search("https://stac.example/search", collection="sentinel-2-l2a",
                          bbox=[-10, -5, 10, 5], datetime="2024-06-01/2024-06-30",
                          policy=AcquisitionPolicy())
    assert len(items) == 2
    assert items[0]["id"] == "S2A_123"