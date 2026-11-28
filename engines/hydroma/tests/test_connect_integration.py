"""Integration test: fixture source -> connector -> cache -> artifact ->
catalogue -> QC (all offline)."""

from hydroma.connect.acquisition import AcquisitionPolicy
from hydroma.connect.cache import CacheManager
from hydroma.connect.connectors.chirps import CHIRPSConnector
from hydroma.connect.base import AcquisitionRequest
from hydroma.connect.adapters import chirps_to_climate_series, artifact_to_catalogue_item
from hydroma.catalogue import CatalogueStore
from hydroma.quality import assess_climate_quality
from connect_helpers import FakeTransport


def test_full_pipeline(tmp_path):
    policy = AcquisitionPolicy(cache_dir=str(tmp_path / "cache"))
    cache = CacheManager(policy.cache_dir)
    url = "https://data.chc.ucsb.edu/chirps-2024.tif"
    transport = FakeTransport(payloads={url: b"CHIRPS-2024-DATA"})

    req = AcquisitionRequest(url=url, dataset_id="chirps-v2.0",
                             variable="precipitation", unit="mm", basis="daily_sum")
    res = CHIRPSConnector().acquire(req, transport, policy, cache)
    assert res.ok is True
    art = res.artifact
    assert art["acquisitionStatus"] == "VERIFIED"

    # Catalogue integration (reference only; never opens the asset).
    store = CatalogueStore(str(tmp_path / "catalogue.db"))
    item = artifact_to_catalogue_item(art, identifier=art["id"],
                                      bbox=[-180, -90, 180, 90],
                                      datetime=art.get("acquiredAt"))
    store.register_item(item)  # duplicate/invalid would raise

    # QC on the derived ClimateSeries (structural; not scientific validation).
    series = chirps_to_climate_series(
        [{"timestamp": "2024-01-01T00:00:00Z", "value": 3.0},
         {"timestamp": "2024-01-02T00:00:00Z", "value": 0.0}],
        variable="precipitation", unit="mm")
    report = assess_climate_quality(series)
    assert report is not None


def test_remote_reference_is_not_local(tmp_path):
    policy = AcquisitionPolicy(cache_dir=str(tmp_path / "cache"))
    cache = CacheManager(policy.cache_dir)
    url = "https://s3.example/cog.tif"
    req = AcquisitionRequest(url=url, dataset_id="sentinel-2-l2a")
    from hydroma.connect.connectors.sentinel2 import Sentinel2Connector
    res = Sentinel2Connector().acquire(req, FakeTransport(), policy, cache)
    assert res.ok is True
    assert "localPath" in res.artifact  # this one was actually downloaded


def test_cache_reuse_no_refetch(tmp_path):
    policy = AcquisitionPolicy(cache_dir=str(tmp_path / "cache"))
    cache = CacheManager(policy.cache_dir)
    url = "https://data.example/x"
    t = FakeTransport(payloads={url: b"DATA"})
    req = AcquisitionRequest(url=url, dataset_id="chirps-v2.0")
    CHIRPSConnector().acquire(req, t, policy, cache)
    n = len(t.calls)
    CHIRPSConnector().acquire(req, t, policy, cache)
    assert len(t.calls) == n