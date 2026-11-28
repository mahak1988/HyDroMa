"""Security tests for the acquisition layer (offline)."""

import pytest

from hydroma.connect.acquisition import AcquisitionPolicy, is_url_allowed, safe_join
from hydroma.connect.base import ConnectorError, ErrorCode
from hydroma.connect.cache import CacheManager
from connect_helpers import FakeTransport
from hydroma.connect.acquisition import download_to_cache
from hydroma.connect.base import AcquisitionRequest


def test_ssrf_metadata_blocked():
    p = AcquisitionPolicy()
    for url in ("https://169.254.169.254/latest", "https://127.0.0.1/",
                "https://10.1.2.3/", "https://192.168.0.1/", "http://example.com/"):
        allowed, _ = is_url_allowed(url, p)
        assert allowed is False, url


def test_public_https_allowed():
    allowed, _ = is_url_allowed("https://data.example.com/file", AcquisitionPolicy())
    assert allowed is True


def test_path_traversal_blocked(tmp_path):
    c = CacheManager(str(tmp_path))
    with pytest.raises(ConnectorError) as ei:
        safe_join(str(tmp_path), "..", "..", "windows", "system32")
    assert ei.value.code == ErrorCode.PATH_TRAVERSAL
    with pytest.raises(ConnectorError):
        c._paths("../../evil")


def test_oversize_rejected(tmp_path):
    policy = AcquisitionPolicy(cache_dir=str(tmp_path), max_bytes=8)
    req = AcquisitionRequest(url="https://data.example/big", dataset_id="chirps-v2.0")
    res = download_to_cache(FakeTransport(default=b"0123456789"), req, policy,
                            CacheManager(policy.cache_dir), source_id="chirps")
    assert res.ok is False and res.error["code"] == ErrorCode.TOO_LARGE


def test_no_credentials_in_artifact(tmp_path, monkeypatch):
    monkeypatch.setenv("CDS_API_KEY", "SECRET-XYZ")
    from hydroma.connect.connectors.era5 import ERA5Connector
    policy = AcquisitionPolicy(cache_dir=str(tmp_path))
    req = AcquisitionRequest(url="https://cds.example/x", dataset_id="reanalysis-era5-single-levels")
    res = ERA5Connector().acquire(req, FakeTransport(), policy, CacheManager(policy.cache_dir))
    assert "SECRET-XYZ" not in str(res.to_dict())


def test_failed_download_no_usable_artifact(tmp_path):
    policy = AcquisitionPolicy(cache_dir=str(tmp_path))
    req = AcquisitionRequest(url="https://data.example/x", dataset_id="chirps-v2.0")
    res = download_to_cache(FakeTransport(fail={"https://data.example/x"}), req, policy,
                            CacheManager(policy.cache_dir), source_id="chirps")
    assert res.ok is False and res.artifact is None