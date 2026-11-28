"""ERA5 / ERA5-Land connector (distinct datasets, auth-aware).

ERA5 (``reanalysis-era5-single-levels``) and ERA5-Land
(``reanalysis-era5-land``) are treated as **distinct** datasets. Credentials are
read from the environment only; never embedded, logged, or written to artifacts.
Real CDS retrieval requires the optional ``cdsapi`` client (documented limit).
"""

from __future__ import annotations

import os
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

__all__ = ["ERA5Connector"]

_DATASETS = {
    "reanalysis-era5-single-levels": "ERA5 single levels",
    "reanalysis-era5-land": "ERA5-Land",
}
_MEDIA = "application/json"
_LICENSE = "Copernicus (free with registration)"
_PROVIDER = "ECMWF / Copernicus CDS"


class ERA5Connector(Connector):
    source_id = "era5"

    def metadata(self) -> SourceMetadata:
        return SourceMetadata(
            source_id=self.source_id, name="ERA5 reanalysis",
            provider=_PROVIDER, license=_LICENSE, media_type=_MEDIA,
            variables=["air_temperature", "precipitation", "solar_radiation",
                       "wind_speed", "relative_humidity"],
            requires_auth=True,
        )

    def capabilities(self) -> List[str]:
        return ["https", "auth_required", "dataset_distinct", "checksum"]

    def acquire(self, request: AcquisitionRequest, transport, policy: AcquisitionPolicy,
                cache) -> AcquisitionResult:
        if request.dataset_id not in _DATASETS:
            return AcquisitionResult(
                ok=False, source_id=self.source_id, dataset_id=request.dataset_id,
                error=ConnectorError(ErrorCode.UNSUPPORTED,
                                     f"unknown ERA5 dataset: {request.dataset_id}").to_dict())
        if not os.environ.get("CDS_API_KEY"):
            return AcquisitionResult(
                ok=False, source_id=self.source_id, dataset_id=request.dataset_id,
                error=ConnectorError(
                    ErrorCode.AUTH_REQUIRED,
                    "CDS_API_KEY not set; real CDS retrieval needs the optional cdsapi client",
                    details={"dataset": request.dataset_id}).to_dict())
        result = download_to_cache(transport, request, policy, cache, source_id=self.source_id)
        if result.ok and result.artifact is not None:
            art = dict(result.artifact)
            art["mediaType"] = _MEDIA
            art["license"] = _LICENSE
            art["provider"] = _PROVIDER
            result.artifact = art
        return result