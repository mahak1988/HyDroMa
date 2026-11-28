"""Real-data acquisition for the HyDroMA lab (outside engines/).

Fetches REAL daily climate from Open-Meteo (free, no key, CC BY 4.0) and caches
it locally with source/licence metadata. Network is used here only — never in the
scientific core.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone

import urllib.request

__all__ = ["fetch_archive", "DEFAULT_LOCATION"]

DEFAULT_LOCATION = {"latitude": 35.7, "longitude": 51.4, "name": "Tehran, Iran"}

_URL = ("https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}"
        "&start_date={s}&end_date={e}"
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,"
        "shortwave_radiation_sum,wind_speed_10m_mean,wind_speed_10m_max&timezone=UTC")

_VARS = ["temperature_2m_max", "temperature_2m_min", "precipitation_sum",
         "shortwave_radiation_sum", "wind_speed_10m_mean", "wind_speed_10m_max"]


def fetch_archive(lat, lon, start, end, cache_path):
    """Return the daily dict, using the cache if present, else fetch + cache."""
    if os.path.exists(cache_path):
        with open(cache_path, "r", encoding="utf-8") as fh:
            return json.load(fh)["daily"]

    url = _URL.format(lat=lat, lon=lon, s=start, e=end)
    with urllib.request.urlopen(url, timeout=60) as resp:
        payload = json.load(resp)
    daily = payload["daily"]
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    record = {
        "meta": {
            "source": "Open-Meteo Historical Weather API",
            "url": url,
            "license": "CC BY 4.0",
            "location": {"latitude": lat, "longitude": lon},
            "period": {"start": start, "end": end},
            "variables": _VARS,
            "wind_variable": "wind_speed_10m_mean",
            "wind_unit": "kmh",
            "wind_height_m": 10.0,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        },
        "daily": daily,
    }
    with open(cache_path, "w", encoding="utf-8") as fh:
        json.dump(record, fh)
    return daily