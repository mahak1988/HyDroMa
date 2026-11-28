"""Optional STAC discovery (stdlib JSON; pystac not required).

Parses STAC Items via the existing ``hydroma.stac.Item`` and extracts assets.
Endpoints are always supplied by the caller (never hardcoded). No network at
import; the transport is injected.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from ..stac import Item

__all__ = ["StacClient", "parse_item", "extract_assets"]


def parse_item(d: Dict[str, Any]) -> Item:
    """Parse a STAC Item dict into the core ``Item`` (raises on invalid)."""
    return Item.from_dict(d)


def extract_assets(item: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Return a normalized list of asset descriptors from a STAC Item dict."""
    assets = item.get("assets", {}) or {}
    out = []
    for key, a in assets.items():
        out.append({
            "key": key,
            "href": a.get("href"),
            "media_type": a.get("type"),
            "roles": a.get("roles", []),
            "checksum": a.get("file:checksum"),
        })
    return out


class StacClient:
    """Minimal STAC search client over an injected transport."""

    def __init__(self, transport) -> None:
        self.transport = transport

    def search(self, endpoint: str, *, collection: Optional[str] = None,
               bbox: Optional[List[float]] = None, datetime: Optional[str] = None,
               limit: int = 10, policy=None) -> List[Dict[str, Any]]:
        body: Dict[str, Any] = {"limit": limit}
        if collection:
            body["collections"] = [collection]
        if bbox:
            body["bbox"] = bbox
        if datetime:
            body["datetime"] = datetime
        data = self.transport.fetch_json(endpoint, policy)
        if isinstance(data, dict) and "features" in data:
            return list(data["features"])
        if isinstance(data, dict) and data.get("type") == "Feature":
            return [data]
        if isinstance(data, list):
            return data
        return []

    def item(self, href: str, policy=None) -> Item:
        return parse_item(self.transport.fetch_json(href, policy))