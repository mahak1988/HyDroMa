"""Acquisition layer tests (offline): URL safety, path traversal, cache download."""

import hashlib

import pytest

from hydroma.connect.acquisition import (
    AcquisitionPolicy,
    download_to_cache,
    is_url_allowed,
    safe_join,
)
from hydroma.connect.base import AcquisitionRequest, ConnectorError, ErrorCode
from hydroma.connect.cache import CacheManager
from connect_helpers import FakeTransport


def _policy(tmp_path, **kw):
    return AcquisitionPolicy(cache_dir=str(tmp_path), **kw)


def test_is_url_allowed():
    p = AcquisitionPolicy()
    assert is_url_allowed("https://example.com/x", p)[0] is True
    assert is_url_allowed("http://example.com/x", p) == (False, ErrorCode.URL_SCHEME_BLOCKED)
    assert is_url_allowed("https://localhost/x", p) == (False, ErrorCode.URL_HOST_BLOCKED)
    assert is_url_allowed("https://127.0.0.1/x", p) == (False, ErrorCode.URL_HOST_BLOCKED)
    assert is_url_allowed("https://169.254.169.254/x", p) == (False, ErrorCode.URL_HOST_BLOCKED)
    assert is_url_allowed("https://10.0.0.1/x", p) == (False, ErrorCode.URL_HOST_BLOCKED)


def test_safe_join(tmp_path):
    base = str(tmp_path)
    assert safe_join(base, "a", "b").startswith(base)
    with pytest.raises(ConnectorError) as ei:
        safe_join(base, "..", "etc")
    assert ei.value.code == ErrorCode.PATH_TRAVERSAL


def test_download_to_cache_and_reuse(tmp_path):
    policy = _policy(tmp_path)
    cache = CacheManager(policy.cache_dir)
    transport = FakeTransport(payloads={"https://data.example/chirps.tif": b"CHIRPS-DATA"})
    req = AcquisitionRequest(url="https://data.example/chirps.tif", dataset_id="chirps-v2.0")
    r1 = download_to_cache(transport, req, policy, cache, source_id="chirps")
    assert r1.ok is True
    assert r1.checksum == hashlib.sha256(b"CHIRPS-DATA").hexdigest()
    assert r1.local_path and r1.artifact["acquisitionStatus"] == "VERIFIED"
    calls_after_first = len(transport.calls)
    r2 = download_to_cache(transport, req, policy, cache, source_id="chirps")
    assert r2.ok is True
    assert len(transport.calls) == calls_after_first  # served from cache, no refetch


def test_download_blocked_url(tmp_path):
    policy = _policy(tmp_path)
    cache = CacheManager(policy.cache_dir)
    req = AcquisitionRequest(url="http://insecure.example/x", dataset_id="chirps-v2.0")
    r = download_to_cache(FakeTransport(), req, policy, cache, source_id="chirps")
    assert r.ok is False and r.error["code"] == ErrorCode.URL_SCHEME_BLOCKED


def test_download_too_large(tmp_path):
    policy = _policy(tmp_path, max_bytes=4)
    cache = CacheManager(policy.cache_dir)
    req = AcquisitionRequest(url="https://data.example/big", dataset_id="chirps-v2.0")
    r = download_to_cache(FakeTransport(default=b"0123456789"), req, policy, cache, source_id="chirps")
    assert r.ok is False and r.error["code"] == ErrorCode.TOO_LARGE


def test_download_retry_exhausted(tmp_path):
    policy = _policy(tmp_path, max_retries=1)
    cache = CacheManager(policy.cache_dir)
    transport = FakeTransport(fail={"https://data.example/x"})
    req = AcquisitionRequest(url="https://data.example/x", dataset_id="chirps-v2.0")
    r = download_to_cache(transport, req, policy, cache, source_id="chirps")
    assert r.ok is False and r.error["code"] == ErrorCode.NETWORK_ERROR
    assert len(transport.calls) == 2  # 1 + max_retries