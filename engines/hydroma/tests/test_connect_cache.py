"""Cache tests (offline): deterministic keys, checksum verify, no overwrite."""

import hashlib

import pytest

from hydroma.connect.acquisition import AcquisitionPolicy
from hydroma.connect.base import ConnectorError
from hydroma.connect.cache import CacheManager


def test_key_deterministic(tmp_path):
    c = CacheManager(str(tmp_path))
    k1 = c.key("chirps", "chirps-v2.0", "2.0", "https://x/y")
    k2 = c.key("chirps", "chirps-v2.0", "2.0", "https://x/y")
    k3 = c.key("chirps", "chirps-v2.0", "2.0", "https://x/z")
    assert k1 == k2 and k1 != k3


def test_put_get_verify(tmp_path):
    c = CacheManager(str(tmp_path))
    data = b"hello-cache"
    key = c.key("s", "d", None, "https://x/y")
    path = c.put(key, data, {"url": "https://x/y"})
    got = c.get_verified(key)
    assert got is not None and got[0] == path
    assert got[1]["checksum"] == hashlib.sha256(data).hexdigest()
    assert c.status(key) == "VERIFIED"


def test_tamper_detected(tmp_path):
    c = CacheManager(str(tmp_path))
    key = c.key("s", "d", None, "https://x/y")
    path = c.put(key, b"original", {"url": "https://x/y"})
    with open(path, "wb") as fh:
        fh.write(b"tampered")
    assert c.get_verified(key) is None
    assert c.status(key) == "INCOMPLETE"


def test_no_overwrite(tmp_path):
    c = CacheManager(str(tmp_path))
    key = c.key("s", "d", None, "https://x/y")
    p1 = c.put(key, b"first", {"url": "https://x/y"})
    p2 = c.put(key, b"second", {"url": "https://x/y"})
    assert p1 == p2
    with open(p1, "rb") as fh:
        assert fh.read() == b"first"  # verified file not overwritten


def test_safe_join_blocks_escape(tmp_path):
    c = CacheManager(str(tmp_path))
    with pytest.raises(ConnectorError):
        c._paths("../evil")