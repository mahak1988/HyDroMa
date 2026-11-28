"""Optional environmental data connectors for HyDroMA (Phase 3.96).

This package is **optional** and **never imported by the scientific core**. It
provides a modular acquisition architecture (connectors -> acquisition -> cache
-> artifacts -> STAC -> adapters) that produces the core's existing data types.
The core stays offline-first; HTTP/STAC/raster libraries are optional extras
imported lazily. Nothing here performs network I/O at import time.
"""

from .base import (
    Connector,
    ConnectorError,
    AcquisitionRequest,
    AcquisitionResult,
    SourceMetadata,
    ArtifactStatus,
    ErrorCode,
)
from .registry import ConnectorRegistry, build_default_registry
from .acquisition import (
    AcquisitionPolicy,
    HttpxTransport,
    is_url_allowed,
    safe_join,
    download_to_cache,
)
from .cache import CacheManager
from .artifacts import ArtifactManifest, build_artifact, set_artifact_status
from .stac import StacClient, parse_item, extract_assets

__all__ = [
    "Connector", "ConnectorError", "AcquisitionRequest", "AcquisitionResult",
    "SourceMetadata", "ArtifactStatus", "ErrorCode", "ConnectorRegistry",
    "build_default_registry", "AcquisitionPolicy", "HttpxTransport",
    "is_url_allowed", "safe_join", "download_to_cache", "CacheManager",
    "ArtifactManifest", "build_artifact", "set_artifact_status", "StacClient",
    "parse_item", "extract_assets",
]