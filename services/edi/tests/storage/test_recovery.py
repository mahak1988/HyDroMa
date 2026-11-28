from edi.storage.atomic import atomic_write_bytes, sha256_file
from edi.storage.manifest import new_manifest, read_manifest, write_manifest
from edi.storage.recovery import recover_pending
from edi.storage.sqlite import Database


def test_recovery_after_rename_before_commit(tmp_path):
    db = Database(tmp_path / "edi.db")
    db.initialize()
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
    manifest_path = tmp_path / "manifest.json"
    write_manifest(manifest_path, manifest)
    report = recover_pending(db, tmp_path, tmp_path / "quarantine")
    assert report[0]["status"] == "RECOVERED"
    assert db.query("SELECT COUNT(*) AS n FROM data_partitions")[0]["n"] == 1
    second = recover_pending(db, tmp_path, tmp_path / "quarantine")
    assert second[0]["status"] == "RECOVERED"
    assert db.query("SELECT COUNT(*) AS n FROM data_partitions")[0]["n"] == 1
    db.close()


def test_recovery_quarantine_on_hash_mismatch(tmp_path):
    db = Database(tmp_path / "edi.db")
    db.initialize()
    parquet = tmp_path / "x.parquet"
    atomic_write_bytes(parquet, b"PAR1data")
    db.add_dataset_version("dataset-test", "v1", "p1")
    db.add_partition(
        {
            "dataset_id": "dataset-test",
            "dataset_version": "v1",
            "processing_version": "p1",
            "variable_id": "air_temperature",
            "source_id": "NOAA_GSOD_95704099999",
            "parquet_uri": str(parquet),
            "parquet_sha256": "sha256:" + "0" * 64,
            "row_count": 1,
            "created_at": "2026-11-23T00:00:00Z",
        }
    )
    manifest = new_manifest(
        run_id="run-2",
        dataset_id="dataset-test",
        dataset_version="v1",
        processing_version="p1",
        source_id="NOAA_GSOD_95704099999",
        parquet_uri=str(parquet),
        parquet_sha256="sha256:" + "0" * 64,
        status="PREPARED",
    )
    manifest["variable_id"] = "air_temperature"
    manifest["row_count"] = 1
    manifest_path = tmp_path / "manifest.json"
    write_manifest(manifest_path, manifest)
    report = recover_pending(db, tmp_path, tmp_path / "quarantine")
    assert report[0]["status"] == "QUARANTINED"
    assert not parquet.exists()
    assert db.get_partition_status(str(parquet)) == "QUARANTINED"
    db.close()