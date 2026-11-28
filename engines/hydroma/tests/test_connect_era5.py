"""ERA5 connector tests (offline): auth contract + distinct datasets."""

from hydroma.connect.acquisition import AcquisitionPolicy
from hydroma.connect.cache import CacheManager
from hydroma.connect.connectors.era5 import ERA5Connector
from hydroma.connect.base import AcquisitionRequest
from connect_helpers import FakeTransport


def test_era5_auth_required(tmp_path, monkeypatch):
    monkeypatch.delenv("CDS_API_KEY", raising=False)
    policy = AcquisitionPolicy(cache_dir=str(tmp_path))
    req = AcquisitionRequest(url="https://cds.example/x", dataset_id="reanalysis-era5-single-levels")
    res = ERA5Connector().acquire(req, FakeTransport(), policy, CacheManager(policy.cache_dir))
    assert res.ok is False and res.error["code"] == "AUTH_REQUIRED"


def test_era5_with_key(tmp_path, monkeypatch):
    monkeypatch.setenv("CDS_API_KEY", "dummy-key")
    policy = AcquisitionPolicy(cache_dir=str(tmp_path))
    cache = CacheManager(policy.cache_dir)
    transport = FakeTransport(payloads={"https://cds.example/x": b"ERA5"})
    req = AcquisitionRequest(url="https://cds.example/x",
                             dataset_id="reanalysis-era5-single-levels", variable="air_temperature")
    res = ERA5Connector().acquire(req, transport, policy, cache)
    assert res.ok is True
    # credential must never appear in the artifact
    assert "dummy-key" not in str(res.artifact)


def test_era5_land_distinct(tmp_path, monkeypatch):
    monkeypatch.setenv("CDS_API_KEY", "k")
    policy = AcquisitionPolicy(cache_dir=str(tmp_path))
    cache = CacheManager(policy.cache_dir)
    req = AcquisitionRequest(url="https://cds.example/land", dataset_id="reanalysis-era5-land")
    res = ERA5Connector().acquire(req, FakeTransport(), policy, cache)
    assert res.ok is True and res.dataset_id == "reanalysis-era5-land"


def test_era5_unknown_dataset(tmp_path):
    policy = AcquisitionPolicy(cache_dir=str(tmp_path))
    req = AcquisitionRequest(url="https://x/y", dataset_id="reanalysis-era5-unknown")
    res = ERA5Connector().acquire(req, FakeTransport(), policy, CacheManager(policy.cache_dir))
    assert res.ok is False and res.error["code"] == "UNSUPPORTED"