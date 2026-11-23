"""Optional tile-serving boundary (interface only, no TiTiler dependency).

TiTiler (MIT, ``upstream-registry/titiler``) is a raster tile server built on
rio-tiler/COG. It is a **visualisation** component: it must never become a
scientific calculation engine and must never be a mandatory dependency of model
execution.

Classification: **C — REFERENCE ONLY** for the server itself, plus a minimal
**adapter interface** here. This module does not import TiTiler, rio-tiler,
rasterio or any HTTP framework. It only describes the contract between HyDroMA
spatial data references and *some* tile server (TiTiler being the reference
implementation). A deployment may wire this to TiTiler later without the engine
depending on it.

The engine therefore stays installable with an empty dependency set, and the
tile layer remains optional infrastructure outside the scientific runtime.
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Sequence, Tuple

__all__ = [
    "TILE_PROVIDERS",
    "TileRequest",
    "TileRef",
    "validate_tile_request",
    "tile_url",
    "is_tile_provider",
]

# Providers the interface can describe. "titiler" is the reference implementation;
# the engine never imports it.
TILE_PROVIDERS = ("titiler", "custom")

# WebMercator (EPSG:3857) XYZ scheme used by the reference provider.
DEFAULT_TMS = "WebMercatorQuad"
DEFAULT_TILE_SIZE = 256
DEFAULT_FORMAT = "png"


def _is_int(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def is_tile_provider(value: Any) -> bool:
    return value in TILE_PROVIDERS


class TileRequest:
    """A validated tile request description (provider-agnostic).

    ``z``/``x``/``y`` follow the standard XYZ scheme. ``assets`` is a list of
    STAC asset hrefs (or HyDroMA data URIs) to render; ``expression`` is an
    optional band-mapping expression passed through to the tile server.
    """

    __slots__ = ("z", "x", "y", "assets", "expression", "tile_size", "format",
                 "tms", "provider", "extra")

    def __init__(
        self,
        z: int,
        x: int,
        y: int,
        assets: Sequence[str],
        expression: Optional[str] = None,
        tile_size: int = DEFAULT_TILE_SIZE,
        format: str = DEFAULT_FORMAT,
        tms: str = DEFAULT_TMS,
        provider: str = "titiler",
        extra: Optional[Dict[str, Any]] = None,
    ) -> None:
        if not _is_int(z) or z < 0:
            raise ValueError("z must be a non-negative integer")
        if not _is_int(x) or x < 0:
            raise ValueError("x must be a non-negative integer")
        if not _is_int(y) or y < 0:
            raise ValueError("y must be a non-negative integer")
        if not assets:
            raise ValueError("assets must be a non-empty sequence of hrefs")
        if not is_tile_provider(provider):
            raise ValueError(f"unsupported tile provider: {provider!r}")
        self.z = z
        self.x = x
        self.y = y
        self.assets = list(assets)
        self.expression = expression
        self.tile_size = tile_size
        self.format = format
        self.tms = tms
        self.provider = provider
        self.extra = dict(extra) if extra else {}

    def to_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {
            "z": self.z,
            "x": self.x,
            "y": self.y,
            "assets": list(self.assets),
            "tile_size": self.tile_size,
            "format": self.format,
            "tms": self.tms,
            "provider": self.provider,
        }
        if self.expression is not None:
            d["expression"] = self.expression
        d.update(self.extra)
        return d


class TileRef:
    """A resolved tile reference: a URL plus the request that produced it.

    ``TileRef`` is a *description*. It does not fetch anything; producing a URL
    is not the same as serving a tile, and the engine never asserts the tile is
    reachable.
    """

    __slots__ = ("url", "request", "media_type")

    def __init__(self, url: str, request: TileRequest, media_type: str = "image/png") -> None:
        if not isinstance(url, str) or not url:
            raise ValueError("tile url must be a non-empty string")
        self.url = url
        self.request = request
        self.media_type = media_type

    def to_dict(self) -> Dict[str, Any]:
        return {
            "url": self.url,
            "media_type": self.media_type,
            "request": self.request.to_dict(),
        }


def validate_tile_request(request: Any) -> bool:
    """Structural check used by callers that receive a plain mapping."""
    if not isinstance(request, dict):
        return False
    if not all(_is_int(request.get(key)) and request[key] >= 0 for key in ("z", "x", "y")):
        return False
    assets = request.get("assets")
    if not isinstance(assets, (list, tuple)) or not assets:
        return False
    if not all(isinstance(a, str) and a for a in assets):
        return False
    if not is_tile_provider(request.get("provider", "titiler")):
        return False
    return True


def tile_url(
    base_url: str,
    z: int,
    x: int,
    y: int,
    assets: Sequence[str],
    expression: Optional[str] = None,
    tile_size: int = DEFAULT_TILE_SIZE,
    format: str = DEFAULT_FORMAT,
) -> str:
    """Build a TiTiler-compatible tile URL template string.

    This mirrors the TiTiler ``/tiles/{tileMatrixSetId}/{z}/{x}/{y}`` route shape
    (``asset=`` query parameters). It performs **no network access** and does not
    require TiTiler to be installed; it only formats a URL for an optional
    external tile service.
    """
    if not isinstance(base_url, str) or not base_url:
        raise ValueError("base_url must be a non-empty string")
    if not assets:
        raise ValueError("assets must be a non-empty sequence")
    asset_query = "&".join(f"asset={href}" for href in assets)
    url = f"{base_url.rstrip('/')}/tiles/{DEFAULT_TMS}/{z}/{x}/{y}?{asset_query}"
    if tile_size and tile_size != DEFAULT_TILE_SIZE:
        url += f"&tile_size={tile_size}"
    if format and format != DEFAULT_FORMAT:
        url += f"&format={format}"
    if expression:
        url += f"&expression={expression}"
    return url