"""Free satellite / open-data source registry & STAC/DataArtifact references.

This module is a **data-layer adapter**: it describes free, open satellite and
environmental data sources and produces STAC Items / DataArtifact *references*
for them. It performs **no network I/O** and opens no asset — the scientific core
stays offline (empty dependency set, ``test_boundaries`` preserved). A separate
connector (optional dependency, outside the core) can use ``fetch_spec`` to
download an asset and then register the reference here.

Sources (2026, all free/open; licences noted per source):

* Sentinel-1/2 (ESA / Copernicus) — raster COG, STAC via Copernicus Data Space
  / Earth Search.
* Landsat 8/9 (USGS) — raster, STAC via ``landsatlook``.
* MODIS LAI/ET (NASA LP DAAC) — raster / time series via AppEEARS.
* CHIRPS (UCSB) — precipitation, GeoTIFF.
* ERA5 (ECMWF / Copernicus CDS) — reanalysis climate ( gridded / CSV extract).
* GRACE-FO (NASA/JPL) — mass anomaly.
* SoilGrids 250m (ISRIC) — soil properties (θfc/θwp proxies).
* SRTM DEM (NASA/USGS) — elevation.

Software-tested; **NOT scientifically validated** (registry + references only).
"""

from __future__ import annotations

from .data import is_data_artifact
from .stac import Item, Asset

__all__ = [
    "FREE_SOURCES",
    "SOURCE_KEYS",
    "get_source",
    "build_data_artifact",
    "build_stac_item",
    "list_sources",
]

# key -> source descriptor. ``stac_url_template`` documents the query endpoint;
# the core never calls it. ``fetch_spec`` is advisory for an external connector.
FREE_SOURCES = {
    "sentinel-2": {
        "name": "Sentinel-2 MSI",
        "provider": "ESA / Copernicus",
        "license": "CC BY-SA 3.0 IGO (Copernicus)",
        "media_type": "image/tiff; application=geotiff; profile=cloud-optimized",
        "collection": "sentinel-2-l2a",
        "variables": ["red", "nir", "swir", "ndvi"],
        "stac_url_template": "https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a/items",
        "fetch_spec": {"api": "stac", "auth": "none", "assets": ["B04", "B08"]},
    },
    "sentinel-1": {
        "name": "Sentinel-1 GRD",
        "provider": "ESA / Copernicus",
        "license": "CC BY-SA 3.0 IGO (Copernicus)",
        "media_type": "image/tiff; application=geotiff; profile=cloud-optimized",
        "collection": "sentinel-1-grd",
        "variables": ["vv", "vh"],
        "stac_url_template": "https://earth-search.aws.element84.com/v1/collections/sentinel-1-grd/items",
        "fetch_spec": {"api": "stac", "auth": "none", "assets": ["vv", "vh"]},
    },
    "landsat": {
        "name": "Landsat 8/9 L2",
        "provider": "USGS",
        "license": "Public domain (USGS)",
        "media_type": "image/tiff; application=geotiff; profile=cloud-optimized",
        "collection": "landsat-c2-l2",
        "variables": ["sr_b2", "sr_b3", "sr_b4", "sr_b5"],
        "stac_url_template": "https://landsatlook.usgs.gov/sat-api/stac/search",
        "fetch_spec": {"api": "stac", "auth": "none", "assets": ["SR_B4", "SR_B5"]},
    },
    "modis": {
        "name": "MODIS LAI/ET (MOD15/MOD16)",
        "provider": "NASA LP DAAC",
        "license": "Free (NASA)",
        "media_type": "application/netcdf",
        "collection": "MOD15A2H",
        "variables": ["lai", "fpar", "et"],
        "stac_url_template": "https://appeears.earthdatacloud.nasa.gov/api/product",
        "fetch_spec": {"api": "appeears", "auth": "token", "assets": ["Lai_1km", "Fpar_1km"]},
    },
    "chirps": {
        "name": "CHIRPS precipitation",
        "provider": "UCSB Climate Hazards Center",
        "license": "CC BY 3.0",
        "media_type": "image/tiff; application=geotiff",
        "collection": "chirps-v2",
        "variables": ["precipitation"],
        "stac_url_template": "https://data.chc.ucsb.edu/products/CHIRPS-2.0/",
        "fetch_spec": {"api": "https", "auth": "none", "assets": ["precip"]},
    },
    "era5": {
        "name": "ERA5 reanalysis",
        "provider": "ECMWF / Copernicus CDS",
        "license": "Copernicus (free with registration)",
        "media_type": "application/json",
        "collection": "reanalysis-era5-single-levels",
        "variables": ["air_temperature", "precipitation", "solar_radiation", "wind_speed", "relative_humidity"],
        "stac_url_template": "https://cds.climate.copernicus.eu/api/v2",
        "fetch_spec": {"api": "cds", "auth": "api_key", "assets": ["2m_temperature", "total_precipitation"]},
    },
    "grace": {
        "name": "GRACE-FO mass anomaly",
        "provider": "NASA/JPL",
        "license": "Free (NASA)",
        "media_type": "application/netcdf",
        "collection": "GRACE-FO",
        "variables": ["mass_change"],
        "stac_url_template": "https://gracefo.jpl.nasa.gov/data/",
        "fetch_spec": {"api": "https", "auth": "none", "assets": ["lwe_thickness"]},
    },
    "soilgrids": {
        "name": "SoilGrids 250m",
        "provider": "ISRIC",
        "license": "CC BY 4.0",
        "media_type": "image/tiff; application=geotiff; profile=cloud-optimized",
        "collection": "soilgrids",
        "variables": ["theta_fc", "theta_wp", "sand", "clay", "silt", "soc"],
        "stac_url_template": "https://files.isric.org/soilgrids/latest/",
        "fetch_spec": {"api": "https", "auth": "none", "assets": ["theta33", "theta1500"]},
    },
    "srtm": {
        "name": "SRTM DEM",
        "provider": "NASA/USGS",
        "license": "Free (NASA/USGS)",
        "media_type": "image/tiff; application=geotiff",
        "collection": "srtm",
        "variables": ["elevation"],
        "stac_url_template": "https://s3.amazonaws.com/elevation-tiles-prod/skadi/",
        "fetch_spec": {"api": "https", "auth": "none", "assets": ["dem"]},
    },
}

SOURCE_KEYS = tuple(FREE_SOURCES.keys())


def get_source(key: str) -> dict:
    if key not in FREE_SOURCES:
        raise KeyError(f"unknown source: {key}; known: {SOURCE_KEYS}")
    return FREE_SOURCES[key]


def list_sources() -> list:
    return [{"key": k, "name": v["name"], "provider": v["provider"],
             "license": v["license"], "variables": v["variables"]}
            for k, v in FREE_SOURCES.items()]


def build_data_artifact(source_key: str, uri: str, *, item_id: str = "ref",
                        media_type: str | None = None, checksum: str | None = None) -> dict:
    """Build a DataArtifact *reference* dict (never opens ``uri``)."""
    src = get_source(source_key)
    artifact = {
        "id": item_id,
        "kind": "raw",
        "uri": uri,
        "mediaType": media_type or src["media_type"],
    }
    if checksum is not None:
        artifact["checksum"] = checksum
    if not is_data_artifact(artifact):
        raise ValueError("built artifact does not satisfy the DataArtifact contract")
    return artifact


def build_stac_item(source_key: str, item_id: str, *, datetime_str: str,
                    bbox: list, asset_href: str, checksum: str | None = None) -> Item:
    """Build a minimal STAC 1.0.0 Item referencing a free-source asset."""
    src = get_source(source_key)
    asset = Asset(href=asset_href, media_type=src["media_type"], checksum=checksum)
    props = {
        "eco-nojin:source": source_key,
        "eco-nojin:provider": src["provider"],
        "eco-nojin:license": src["license"],
        "eco-nojin:variables": src["variables"],
    }
    return Item(
        id=item_id,
        collection=src["collection"],
        datetime=datetime_str,
        geometry=None,
        bbox=bbox,
        properties=props,
        assets={"data": asset},
    )