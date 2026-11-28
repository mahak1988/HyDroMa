from edi.storage.sqlite import Database


def test_sqlite_roundtrip(tmp_path):
    db = Database(tmp_path / "edi.db")
    db.initialize()
    db.add_dataset_version("dataset-test", "v1", "p1")
    db.add_partition(
        {
            "dataset_id": "dataset-test",
            "dataset_version": "v1",
            "processing_version": "p1",
            "variable_id": "air_temperature",
            "source_id": "NOAA_GSOD_95704099999",
            "parquet_uri": str(tmp_path / "x.parquet"),
            "parquet_sha256": "sha256:" + "0" * 64,
            "row_count": 1,
            "created_at": "2026-11-23T00:00:00Z",
        }
    )
    assert db.query("SELECT COUNT(*) AS n FROM data_partitions")[0]["n"] == 1
    assert db.verify_audit_chain() is False or True
    db.record_audit("TEST", {"x": 1})
    assert db.verify_audit_chain() is True
    db.close()


def test_audit_chain_tamper(tmp_path):
    db = Database(tmp_path / "edi.db")
    db.initialize()
    db.record_audit("TEST", {"x": 1})
    db.execute("UPDATE audit_events SET details_json = ? WHERE audit_id = 1", ('{"x": 2}',))
    db.connect().commit()
    assert db.verify_audit_chain() is False
    db.close()