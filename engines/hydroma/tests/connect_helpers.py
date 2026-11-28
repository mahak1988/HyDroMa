"""Shared test helpers for the optional connectors (offline, no network)."""

from __future__ import annotations

import json

from hydroma.connect.base import ConnectorError, ErrorCode


class FakeTransport:
    """In-memory transport used by tests. No network, no optional deps."""

    def __init__(self, payloads=None, default=b"fake-bytes", fail=None):
        self.payloads = payloads or {}
        self.default = default
        self.fail = set(fail or [])
        self.calls = []

    def fetch(self, url, policy):
        self.calls.append(url)
        if url in self.fail:
            raise ConnectorError(ErrorCode.NETWORK_ERROR, "boom", retryable=True)
        data = self.payloads.get(url, self.default)
        if isinstance(data, str):
            data = data.encode("utf-8")
        if len(data) > policy.max_bytes:
            raise ConnectorError(ErrorCode.TOO_LARGE, "max_bytes exceeded")
        return data

    def fetch_json(self, url, policy):
        return json.loads(self.fetch(url, policy).decode("utf-8"))