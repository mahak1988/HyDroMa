"""Connector registry (stdlib-only)."""

from __future__ import annotations

from typing import Dict, List

from .base import Connector

__all__ = ["ConnectorRegistry", "build_default_registry"]


class ConnectorRegistry:
    def __init__(self) -> None:
        self._connectors: Dict[str, Connector] = {}

    def register(self, connector: Connector) -> None:
        sid = connector.source_id
        if not sid:
            raise ValueError("connector must declare a source_id")
        if sid in self._connectors:
            raise ValueError(f"connector already registered: {sid}")
        self._connectors[sid] = connector

    def get(self, source_id: str) -> Connector:
        if source_id not in self._connectors:
            raise KeyError(f"unknown connector: {source_id}")
        return self._connectors[source_id]

    def list(self) -> List[dict]:
        return [c.metadata().to_dict() for c in self._connectors.values()]

    def capabilities(self) -> Dict[str, List[str]]:
        return {c.source_id: c.capabilities() for c in self._connectors.values()}

    def __contains__(self, source_id: str) -> bool:
        return source_id in self._connectors


def build_default_registry() -> ConnectorRegistry:
    """Build a registry with the initial connectors (lazy, no network)."""
    from .connectors.chirps import CHIRPSConnector
    from .connectors.era5 import ERA5Connector
    from .connectors.sentinel2 import Sentinel2Connector

    reg = ConnectorRegistry()
    reg.register(CHIRPSConnector())
    reg.register(ERA5Connector())
    reg.register(Sentinel2Connector())
    return reg