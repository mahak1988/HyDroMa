"""Adapters from connector outputs to the core Environmental Data Foundation.

Reuses the existing ``ClimateSeries`` contract (no duplicate) and the existing
``item_from_data_artifact`` STAC mapping. No network.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from ..climate import ClimateObservation, ClimateSeries, SpatialContext
from ..stac import Item, item_from_data_artifact

__all__ = ["chirps_to_climate_series", "artifact_to_catalogue_item"]


def chirps_to_climate_series(records: List[Dict[str, Any]], *,
                             variable: str = "precipitation", unit: str = "mm",
                             basis: str = "daily_sum",
                             spatial: Optional[SpatialContext] = None,
                             source: Optional[Dict[str, Any]] = None) -> ClimateSeries:
    """Convert CHIRPS records ``[{timestamp, value}]`` to a core ClimateSeries."""
    obs = []
    for r in records:
        ts = r.get("timestamp") or r.get("date")
        if not ts:
            raise ValueError("record missing timestamp")
        obs.append(ClimateObservation(
            variable=variable, value=r.get("value"), unit=unit,
            timestamp=ts, basis=basis, quality=r.get("quality", "unchecked"),
            source=source,
        ))
    return ClimateSeries(observations=obs, variable=variable,
                         temporal_resolution="daily", spatial=spatial)


def artifact_to_catalogue_item(artifact: Dict[str, Any], identifier: str,
                               bbox: List[float], datetime: Optional[str] = None,
                               collection: Optional[str] = None) -> Item:
    """Map a DataArtifact reference to a STAC Item (existing integration point)."""
    return item_from_data_artifact(artifact, identifier, bbox, datetime=datetime,
                                   collection=collection)