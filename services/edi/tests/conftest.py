import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def make_record(**overrides):
    record = {
        "contract_version": "1.0.0",
        "record_kind": "point_observation",
        "observation_id": "sha256:0123456789abcdef0123456789abcdef",
        "source_id": "NOAA_GSOD_95704099999",
        "source_product": "Global Surface Summary of the Day",
        "source_type": "ground_station",
        "variable": "air_temperature",
        "dataset_id": "dataset-test",
        "dataset_version": "v1",
        "value_encoding": "scalar",
        "value": 25.0,
        "unit": "degC",
        "timestamp": "2024-03-01T00:00:00Z",
        "timezone": "UTC",
        "hour_labeling": "unknown",
        "hour_labeling_status": "NOT_APPLICABLE",
        "hour_labeling_evidence": "daily product",
        "temporal_resolution": "P1D",
        "temporal_basis": "daily_mean",
        "spatial_resolution": "point",
        "geometry_crs": "EPSG:4326",
        "geometry": {"type": "Point", "coordinates": [146.0666666, -34.25]},
        "grid": None,
        "asset": None,
        "spatial_support": {"type": "point", "radius_m": None, "area_m2": None},
        "measurement_height_m": 2.0,
        "measurement_depth_m": None,
        "sensor_elevation_m": 135.0,
        "elevation_datum": "source_reported",
        "quality_flag": "valid",
        "uncertainty": None,
        "provenance": {
            "source_url": "https://www.ncei.noaa.gov/data/global-summary-of-the-day/",
            "raw_file": "test.csv",
            "raw_sha256": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            "retrieved_at": "2026-11-23T09:00:00Z",
            "adapter_version": "test/0.1",
            "transform_version": "edi/1.0",
            "processing_history": ["test"],
            "dataset_version": "v1",
            "upstream_sources": ["NOAA_ISD"],
        },
        "retrieved_at": "2026-11-23T09:00:00Z",
        "valid_from": "2024-03-01T00:00:00Z",
        "valid_to": "2024-03-02T00:00:00Z",
        "stale": False,
        "stale_since": None,
        "alternate_of": None,
        "selection_id": None,
        "processing_version": "edi-pipeline/1.0.0",
        "scientific_status": "NOT_VALIDATED",
    }
    record.update(overrides)
    return record


@pytest.fixture
def record():
    return make_record()