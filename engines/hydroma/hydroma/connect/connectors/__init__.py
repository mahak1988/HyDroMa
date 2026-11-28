"""Initial environmental data connectors (CHIRPS, ERA5, Sentinel-2)."""

from .chirps import CHIRPSConnector
from .era5 import ERA5Connector
from .sentinel2 import Sentinel2Connector

__all__ = ["CHIRPSConnector", "ERA5Connector", "Sentinel2Connector"]