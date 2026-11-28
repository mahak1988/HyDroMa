"""CHIRPS connector + climate adapter tests (offline)."""

from hydroma.connect.acquisition import AcquisitionPolicy
from hydroma.connect.cache import CacheManager
from hydroma.connect.connectors.chirps import CHIRPSConnector
from hydroma.connect.base import AcquisitionRequest
from hydroma.connect.adapters import chirps_to_climate_series
from connect_helpers import FakeTransport


def test_chirps_acquire(tmp_path):
    policy = AcquisitionPolicy(cache_dir=str(tmp_path))
    cache = CacheManager(policy.cache_dir)
    transport = FakeTransport(payloads={"https://data.chc.ucsb.edu/chirps.tif": b"CHIRPS"})
    req = AcquisitionRequest(url="https://data.chc.ucsb.edu/chirps.tif",
                             dataset_id="chirps-v2.0", variable="precipitation", unit="mm")
    res = CHIRPSConnector().acquire(req, transport, policy, cache)
    assert res.ok is True
    assert res.artifact["mediaType"].startswith("image/tiff")
    assert res.artifact["license"].startswith("CC BY 3.0")
    assert res.artifact["acquisitionStatus"] == "VERIFIED"


def test_chirps_unsupported_dataset(tmp_path):
    policy = AcquisitionPolicy(cache_dir=str(tmp_path))
    req = AcquisitionRequest(url="https://x/y", dataset_id="chirps-v9")
    res = CHIRPSConnector().acquire(req, FakeTransport(), policy, CacheManager(policy.cache_dir))
    assert res.ok is False and res.error["code"] == "UNSUPPORTED"


def test_chirps_to_climate_series():
    records = [
        {"timestamp": "2024-01-01T00:00:00Z", "value": 5.0},
        {"timestamp": "2024-01-02T00:00:00Z", "value": None},
    ]
    series = chirps_to_climate_series(records, variable="precipitation", unit="mm")
    assert series.variable == "precipitation"
    assert series.temporal_resolution == "daily"
    assert series.observations[0].unit == "mm"
    assert series.observations[1].value is None  # missing preserved explicitly


def test_chirps_capabilities():
    caps = CHIRPSConnector().capabilities()
    assert "climate_series_adapter" in caps and "checksum" in caps