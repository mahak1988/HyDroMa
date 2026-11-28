"""Sentinel-2 STAC discovery & asset-management connector.

Supports STAC search (time/space/collection) and controlled acquisition of a
selected asset. NDVI is **not** generated automatically. Cloud-contaminated or
invalid pixels are never interpreted as usable observations by this connector.
"""

from __future__ import annotations

from typing import List

from ..acquisition import AcquisitionPolicy, download_to_cache
from ..base import (
    AcquisitionRequest,
    AcquisitionResult,
    Connector,
    ConnectorError,
    ErrorCode,
    SourceMetadata,
)
from ..stac import StacClient, extract_assets

__all__ = ["Sentinel2Connector"]

_MEDIA = "image/tiff; application=geotiff; profile=cloud-optimized"
_LICENSE = "CC BY-SA 3.0 IGO (Copernicus)"
_PROVIDER = "ESA / Copernicus"


class Sentinel2Connector(Connector):
    source_id = "sentinel-2"

    def metadata(self) -> SourceMetadata:
        return SourceMetadata(
            source_id=self.source_id, name="Sentinel-2 MSI",
            provider=_PROVIDER, license=_LICENSE, media_type=_MEDIA,
            variables=["red", "nir", "swir", "ndvi"], requires_auth=False,
        )

    def capabilities(self) -> List[str]:
        return ["stac_search", "asset_ref", "checksum", "no_auto_ndvi"]

    def acquire(self, request: AcquisitionRequest, transport, policy: AcquisitionPolicy,
                cache) -> AcquisitionResult:
        if request.extra.get("stac_search"):
            endpoint = request.extra.get("endpoint")
            if not endpoint:
                return AcquisitionResult(
                    ok=False, source_id=self.source_id, dataset_id=request.dataset_id,
                    error=ConnectorError(ErrorCode.UNSUPPORTED,
                                         "stac_search requires endpoint").to_dict())
            client = StacClient(transport)
            items = client.search(endpoint, collection=request.extra.get("collection"),
                                  bbox=request.bbox, datetime=request.extra.get("datetime"),
                                  limit=int(request.extra.get("limit", 10)), policy=policy)
            discovered = [{"id": it.get("id"), "assets": extract_assets(it)} for it in items]
            return AcquisitionResult(
                ok=True, source_id=self.source_id, dataset_id=request.dataset_id,
                metadata={"mode": "discovery", "count": len(discovered), "items": discovered})

        if request.dataset_id != "sentinel-2-l2a":
            return AcquisitionResult(
                ok=False, source_id=self.source_id, dataset_id=request.dataset_id,
                error=ConnectorError(ErrorCode.UNSUPPORTED,
                                     "only 'sentinel-2-l2a' is supported").to_dict())
        result = download_to_cache(transport, request, policy, cache, source_id=self.source_id)
        if result.ok and result.artifact is not None:
            art = dict(result.artifact)
            art["mediaType"] = _MEDIA
            art["license"] = _LICENSE
            art["provider"] = _PROVIDER
            result.artifact = art
        return result