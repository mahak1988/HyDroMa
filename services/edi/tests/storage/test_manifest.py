from edi.storage.atomic import atomic_write_bytes, sha256_file
from edi.storage.manifest import new_manifest, read_manifest, verify_manifest, write_manifest


def test_manifest(tmp_path):
    parquet = tmp_path / "x.parquet"
    atomic_write_bytes(parquet, b"PAR1data")
    digest = sha256_file(parquet)
    manifest = new_manifest(
        run_id="run-1",
        dataset_id="dataset-test",
        dataset_version="v1",
        processing_version="p1",
        source_id="NOAA_GSOD_95704099999",
        parquet_uri=str(parquet),
        parquet_sha256=digest,
        status="PREPARED",
    )
    manifest["variable_id"] = "air_temperature"
    manifest["row_count"] = 1
    path = tmp_path / "manifest.json"
    write_manifest(path, manifest)
    loaded = read_manifest(path)
    assert loaded["run_id"] == "run-1"
    assert verify_manifest(loaded, parquet) is True