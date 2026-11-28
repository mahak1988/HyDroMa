import pytest

from edi.errors import ParquetUnavailable
from edi.storage.parquet import PARQUET_AVAILABLE, read_parquet, validate_parquet_file, write_parquet

pq = pytest.importorskip("pyarrow.parquet")


@pytest.mark.skipif(not PARQUET_AVAILABLE, reason="pyarrow is not installed")
def test_parquet_roundtrip(tmp_path, record):
    path = tmp_path / "x.parquet"
    write_parquet([record], path)
    assert validate_parquet_file(path, check_data=True)
    rows = read_parquet(path)
    assert len(rows) == 1
    assert rows[0]["value"] == 25.0
    assert rows[0]["unit"] == "degC"
    assert rows[0]["quality_flag"] == "valid"


@pytest.mark.skipif(not PARQUET_AVAILABLE, reason="pyarrow is not installed")
def test_parquet_schema(tmp_path, record):
    path = tmp_path / "x.parquet"
    write_parquet([record], path)
    schema = pq.read_schema(path)
    assert schema.names == [
        "observation_id",
        "source_id",
        "variable",
        "value",
        "unit",
        "timestamp",
        "valid_from",
        "valid_to",
        "quality_flag",
        "ingested_at",
        "dataset_id",
        "dataset_version",
        "processing_version",
        "geometry",
        "grid",
        "provenance_json",
    ]
    assert str(schema.field("value").type) == "double"


@pytest.mark.skipif(not PARQUET_AVAILABLE, reason="pyarrow is not installed")
def test_parquet_corrupt(tmp_path):
    path = tmp_path / "bad.parquet"
    path.write_bytes(b"PAR1not-a-parquet-file")
    assert validate_parquet_file(path, check_data=True) is False
    with pytest.raises(Exception):
        read_parquet(path)


@pytest.mark.skipif(not PARQUET_AVAILABLE, reason="pyarrow is not installed")
def test_parquet_missing(tmp_path):
    with pytest.raises(FileNotFoundError):
        read_parquet(tmp_path / "missing.parquet")


@pytest.mark.skipif(not PARQUET_AVAILABLE, reason="pyarrow is not installed")
def test_parquet_invalid_record(tmp_path):
    with pytest.raises(Exception):
        write_parquet([{"value": "not-a-number"}], tmp_path / "bad.parquet")


@pytest.mark.skipif(PARQUET_AVAILABLE, reason="pyarrow is installed")
def test_parquet_unavailable(tmp_path):
    with pytest.raises(ParquetUnavailable):
        write_parquet([], tmp_path / "x.parquet")
    fake = tmp_path / "fake.parquet"
    fake.write_bytes(b"PAR1xxxxPAR1")
    assert validate_parquet_file(fake, check_data=False) is True