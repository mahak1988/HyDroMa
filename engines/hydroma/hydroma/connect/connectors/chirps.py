"""CHIRPS precipitation connector (first operational connector)."""

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

__all__ = ["CHIRPSConnector"]

_MEDIA = "image/tiff; application=geotiff"
_LICENSE = "CC BY 3.0 (UCSB Climate Hazards Center)"
_PROVIDER = "UCSB Climate Hazards Center"


class CHIRPSConnector(Connector):
    source_id = "chirps"

    def metadata(self) -> SourceMetadata:
        return SourceMetadata(
            source_id=self.source_id, name="CHIRPS precipitation",
            provider=_PROVIDER, license=_LICENSE, media_type=_MEDIA,
            variables=["precipitation"], requires_auth=False,
        )

    def capabilities(self) -> List[str]:
        return ["https", "asset", "checksum", "climate_series_adapter"]

    def acquire(self, request: AcquisitionRequest, transport, policy: AcquisitionPolicy,
                cache) -> AcquisitionResult:
        if request.dataset_id != "chirps-v2.0":
            return AcquisitionResult(
                ok=False, source_id=self.source_id, dataset_id=request.dataset_id,
                error=ConnectorError(ErrorCode.UNSUPPORTED,
                                     "only dataset 'chirps-v2.0' is supported").to_dict())
        result = download_to_cache(transport, request, policy, cache, source_id=self.source_id)
        if result.ok and result.artifact is not None:
            art = dict(result.artifact)
            art["mediaType"] = _MEDIA
            art["license"] = _LICENSE
            art["provider"] = _PROVIDER
            result.artifact = art
            result.metadata = {**result.metadata, "license": _LICENSE, "provider": _PROVIDER}
        return result