"""Sentinel-2 connector tests (offline): STAC discovery + asset, no auto NDVI."""

import json

from hydroma.connect.acquisition import AcquisitionPolicy
from hydroma.connect.cache import CacheManager
from hydroma.connect.connectors.sentinel2 import Sentinel2Connector
from hydroma.connect.base import AcquisitionRequest
from connect_helpers import FakeTransport

_ITEM = {
    "type": "Feature", "stac_version": "1.0.0", "id": "S2A_1",
    "geometry": None, "bbox": [-10, -5, 10, 5],
    "properties": {"datetime": "2024-06-01T10:00:00Z"},
    "collection": "sentinel-2-l2a",
    "assets": {"B04": {"href": "https://s3/B04.tif", "type": "image/tiff"}},
    "links": [],
}


def test_sentinel2_discovery(tmp_path):
    policy = AcquisitionPolicy(cache_dir=str(tmp_path))
    payload = json.dumps({"type": "FeatureCollection", "features": [_ITEM]}).encode()
    transport = FakeTransport(payloads={"https://stac.example/search": payload})
    req = AcquisitionRequest(url="unused", dataset_id="sentinel-2-l2a",
                             extra={"stac_search": True, "endpoint": "https://stac.example/search",
                                    "collection": "sentinel-2-l2a"})
    res = Sentinel2Connector().acquire(req, transport, policy, CacheManager(policy.cache_dir))
    assert res.ok is True
    assert res.metadata["mode"] == "discovery"
    assert res.metadata["count"] == 1


def test_sentinel2_asset_acquire(tmp_path):
    policy = AcquisitionPolicy(cache_dir=str(tmp_path))
    transport = FakeTransport(payloads={"https://s3/B04.tif": b"COG"})
    req = AcquisitionRequest(url="https://s3/B04.tif", dataset_id="sentinel-2-l2a")
    res = Sentinel2Connector().acquire(req, transport, policy, CacheManager(policy.cache_dir))
    assert res.ok is True and res.artifact["acquisitionStatus"] == "VERIFIED"


def test_sentinel2_no_auto_ndvi():
    assert "no_auto_ndvi" in Sentinel2Connector().capabilities()


def test_sentinel2_unknown_dataset(tmp_path):
    policy = AcquisitionPolicy(cache_dir=str(tmp_path))
    req = AcquisitionRequest(url="https://s3/x", dataset_id="landsat")
    res = Sentinel2Connector().acquire(req, FakeTransport(), policy, CacheManager(policy.cache_dir))
    assert res.ok is False and res.error["code"] == "UNSUPPORTED"