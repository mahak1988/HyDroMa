"""Parquet storage adapter."""

import json
from pathlib import Path
from typing import Any

from edi.errors import ParquetUnavailable
from edi.storage.atomic import sha256_file
from edi.validation import validate_canonical_record

try:
    import pyarrow as pa
    import pyarrow.parquet as pq

    PARQUET_AVAILABLE = True
except ImportError:
    pa = None
    pq = None
    PARQUET_AVAILABLE = False

PARQUET_SCHEMA = [
    ("observation_id", "string"),
    ("source_id", "string"),
    ("variable", "string"),
    ("value", "float64"),
    ("unit", "string"),
    ("timestamp", "string"),
    ("valid_from", "string"),
    ("valid_to", "string"),
    ("quality_flag", "string"),
    ("ingested_at", "string"),
    ("dataset_id", "string"),
    ("dataset_version", "string"),
    ("processing_version", "string"),
    ("geometry", "string"),
    ("grid", "string"),
    ("provenance_json", "string"),
]


def _require_pyarrow():
    if not PARQUET_AVAILABLE:
        raise ParquetUnavailable("pyarrow is not installed")


def _to_parquet_row(record: dict) -> dict:
    return {
        "observation_id": record["observation_id"],
        "source_id": record["source_id"],
        "variable": record["variable"],
        "value": record["value"],
        "unit": record["unit"],
        "timestamp": record["timestamp"],
        "valid_from": record["valid_from"],
        "valid_to": record["valid_to"],
        "quality_flag": record["quality_flag"],
        "ingested_at": record["retrieved_at"],
        "dataset_id": record["dataset_id"],
        "dataset_version": record["dataset_version"],
        "processing_version": record["processing_version"],
        "geometry": json.dumps(record["geometry"], sort_keys=True) if record["geometry"] is not None else None,
        "grid": json.dumps(record["grid"], sort_keys=True) if record["grid"] is not None else None,
        "provenance_json": json.dumps(record["provenance"], sort_keys=True),
    }


def write_parquet(records: list[dict], path: str | Path) -> str:
    _require_pyarrow()
    for record in records:
        validate_canonical_record(record)
    schema = pa.schema([(name, getattr(pa, kind)()) for name, kind in PARQUET_SCHEMA])
    table = pa.Table.from_pylist([_to_parquet_row(r) for r in records], schema=schema)
    pq.write_table(table, str(path), compression="zstd")
    return sha256_file(path)


def read_parquet(path: str | Path) -> list[dict]:
    _require_pyarrow()
    table = pq.read_table(str(path))
    return table.to_pylist()


def validate_parquet_file(path: str | Path, check_data: bool = True) -> bool:
    path = Path(path)
    if not path.exists() or path.stat().st_size < 8:
        return False
    with open(path, "rb") as f:
        if f.read(4) != b"PAR1":
            return False
    if PARQUET_AVAILABLE:
        try:
            pq.read_metadata(str(path))
            if check_data:
                parquet_file = pq.ParquetFile(str(path))
                for _batch in parquet_file.iter_batches(batch_size=1024):
                    pass
        except Exception:
            return False
    return True