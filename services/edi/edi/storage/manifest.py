"""Manifest protocol."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from edi.errors import IntegrityError, InvalidContract
from edi.storage.atomic import sha256_file

STATUSES = ("PREPARED", "COMMITTED", "RECOVERED", "QUARANTINED", "INVALID")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def new_manifest(
    run_id: str,
    dataset_id: str,
    dataset_version: str,
    processing_version: str,
    source_id: str,
    parquet_uri: str,
    parquet_sha256: str,
    status: str = "PREPARED",
) -> dict[str, Any]:
    if status not in STATUSES:
        raise InvalidContract("invalid manifest status", {"status": status})
    now = utc_now()
    return {
        "run_id": run_id,
        "dataset_id": dataset_id,
        "dataset_version": dataset_version,
        "processing_version": processing_version,
        "source_id": source_id,
        "parquet_uri": parquet_uri,
        "parquet_sha256": parquet_sha256,
        "status": status,
        "created_at": now,
        "updated_at": now,
    }


def write_manifest(path: str | Path, manifest: dict[str, Any]) -> None:
    Path(path).write_text(
        json.dumps(manifest, indent=2, sort_keys=True, ensure_ascii=False),
        encoding="utf-8",
    )


def read_manifest(path: str | Path) -> dict[str, Any]:
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise InvalidContract("invalid manifest JSON", {"path": str(path)}) from exc
    if not isinstance(data, dict):
        raise InvalidContract("manifest must be an object")
    for field in (
        "run_id",
        "dataset_id",
        "dataset_version",
        "processing_version",
        "source_id",
        "parquet_uri",
        "parquet_sha256",
        "status",
        "created_at",
        "updated_at",
    ):
        if field not in data:
            raise InvalidContract("manifest missing field", {"field": field})
    if data["status"] not in STATUSES:
        raise InvalidContract("invalid manifest status", {"status": data["status"]})
    return data


def verify_manifest(manifest: dict[str, Any], parquet_path: str | Path | None = None) -> bool:
    parquet_path = parquet_path or manifest["parquet_uri"]
    if not Path(parquet_path).exists():
        return False
    return sha256_file(parquet_path) == manifest["parquet_sha256"]