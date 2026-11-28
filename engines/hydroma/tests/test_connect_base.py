"""Connector base & registry tests (offline)."""

import pytest

from hydroma.connect.base import Connector, ConnectorError, ErrorCode, SourceMetadata
from hydroma.connect.registry import ConnectorRegistry, build_default_registry


class _Dummy(Connector):
    source_id = "dummy"

    def metadata(self):
        return SourceMetadata("dummy", "Dummy", "Test", "CC0", "text/plain")

    def capabilities(self):
        return ["https"]

    def acquire(self, request, transport, policy, cache):  # pragma: no cover
        raise NotImplementedError


def test_registry_register_get():
    reg = ConnectorRegistry()
    reg.register(_Dummy())
    assert "dummy" in reg
    assert reg.get("dummy").source_id == "dummy"
    assert reg.list()[0]["name"] == "Dummy"
    assert reg.capabilities()["dummy"] == ["https"]


def test_registry_duplicate():
    reg = ConnectorRegistry()
    reg.register(_Dummy())
    with pytest.raises(ValueError):
        reg.register(_Dummy())


def test_registry_unknown():
    with pytest.raises(KeyError):
        ConnectorRegistry().get("nope")


def test_default_registry_has_connectors():
    reg = build_default_registry()
    keys = {c.source_id for c in [reg.get(k) for k in ("chirps", "era5", "sentinel-2")]}
    assert keys == {"chirps", "era5", "sentinel-2"}


def test_connector_error_to_dict():
    e = ConnectorError(ErrorCode.AUTH_REQUIRED, "need key", retryable=False, details={"x": 1})
    d = e.to_dict()
    assert d["code"] == "AUTH_REQUIRED" and d["retryable"] is False and d["details"] == {"x": 1}