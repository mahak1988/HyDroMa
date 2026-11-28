import copy

import pytest

from edi.contracts.canonical import validate_record
from edi.errors import InvalidContract, InvalidData, UnitMismatch


def test_valid_record(record):
    validate_record(record)


def test_missing_field(record):
    del record["source_id"]
    with pytest.raises(InvalidContract):
        validate_record(record)


def test_invalid_observation_id(record):
    record["observation_id"] = "sha256:nope"
    with pytest.raises(InvalidContract):
        validate_record(record)


def test_invalid_raw_hash(record):
    record["provenance"]["raw_sha256"] = "sha256:nope"
    with pytest.raises(InvalidContract):
        validate_record(record)


def test_invalid_unit(record):
    record["unit"] = "fahrenheit"
    with pytest.raises(UnitMismatch):
        validate_record(record)


def test_unsupported_variable(record):
    record["variable"] = "moon_phase"
    with pytest.raises(InvalidContract):
        validate_record(record)


def test_invalid_timestamp(record):
    record["timestamp"] = "not-a-date"
    with pytest.raises(InvalidContract):
        validate_record(record)


def test_naive_timestamp(record):
    record["timestamp"] = "2024-03-01T00:00:00"
    with pytest.raises(InvalidContract):
        validate_record(record)


def test_missing_encoding(record):
    record["value_encoding"] = "missing"
    record["value"] = None
    record["quality_flag"] = "valid"
    with pytest.raises(InvalidData):
        validate_record(record)


def test_scalar_null(record):
    record["value"] = None
    record["quality_flag"] = "valid"
    with pytest.raises(InvalidData):
        validate_record(record)


def test_asset_without_asset(record):
    record["record_kind"] = "asset_backed_observation"
    record["value_encoding"] = "asset"
    record["value"] = None
    record["asset"] = None
    with pytest.raises(InvalidData):
        validate_record(record)


def test_stale_without_since(record):
    record["stale"] = True
    record["stale_since"] = None
    record["quality_flag"] = "suspect"
    with pytest.raises(InvalidData):
        validate_record(record)


def test_wind_height(record):
    record["variable"] = "wind_speed"
    record["unit"] = "m/s"
    record["measurement_height_m"] = 10.0
    with pytest.raises(InvalidContract):
        validate_record(record)


def test_pressure_without_elevation(record):
    record["variable"] = "air_pressure"
    record["unit"] = "kPa"
    record["sensor_elevation_m"] = None
    with pytest.raises(InvalidContract):
        validate_record(record)


def test_soil_moisture_without_depth(record):
    record["variable"] = "soil_moisture"
    record["unit"] = "m3/m3"
    record["measurement_height_m"] = None
    record["measurement_depth_m"] = None
    with pytest.raises(InvalidContract):
        validate_record(record)


def test_hour_labeling_without_evidence(record):
    record["hour_labeling"] = "hour_beginning"
    record["hour_labeling_status"] = "ASSUMPTION"
    record["hour_labeling_evidence"] = ""
    with pytest.raises(InvalidContract):
        validate_record(record)


def test_invalid_geometry(record):
    record["geometry"] = {"type": "Point", "coordinates": [999, 999]}
    with pytest.raises(InvalidContract):
        validate_record(record)


def test_invalid_grid(record):
    record["record_kind"] = "gridded_record"
    record["grid"] = {
        "crs": "EPSG:4326",
        "shape": [1, 1],
        "cell_size": [-0.5, 0.5],
        "origin": [0, 0],
    }
    with pytest.raises(InvalidContract):
        validate_record(record)


def test_unsupported_version(record):
    record["contract_version"] = "2.0.0"
    with pytest.raises(InvalidContract):
        validate_record(record)