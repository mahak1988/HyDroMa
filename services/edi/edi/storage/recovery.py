"""Recovery and reconciliation."""

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from edi.errors import IntegrityError, StorageError
from edi.storage.manifest import read_manifest, verify_manifest, write_manifest
from edi.storage.sqlite import Database, utc_now


def _quarantine(db: Database, manifest: dict[str, Any], manifest_path: Path, quarantine_dir: Path, reason: str) -> dict[str, Any]:
    quarantine_dir.mkdir(parents=True, exist_ok=True)
    src = Path(manifest["parquet_uri"])
    if src.exists():
        dst = quarantine_dir / src.name
        shutil.move(str(src), str(dst))
    try:
        db.mark_partition_status(str(src), "QUARANTINED")
    except Exception:
        pass
    manifest["status"] = "QUARANTINED"
    manifest["updated_at"] = utc_now()
    manifest["quarantine_reason"] = reason
    write_manifest(manifest_path, manifest)
    return {
        "run_id": manifest["run_id"],
        "status": "QUARANTINED",
        "reason": reason,
    }


def recover_pending(db: Database, manifest_dir: str | Path, quarantine_dir: str | Path) -> list[dict[str, Any]]:
    manifest_dir = Path(manifest_dir)
    quarantine_dir = Path(quarantine_dir)
    report: list[dict[str, Any]] = []
    for manifest_path in sorted(manifest_dir.glob("*.json")):
        manifest = read_manifest(manifest_path)
        status = manifest["status"]
        if status in ("QUARANTINED", "INVALID"):
            continue
        parquet_path = Path(manifest["parquet_uri"])
        if not parquet_path.exists():
            report.append(_quarantine(db, manifest, manifest_path, quarantine_dir, "parquet file missing"))
            continue
        if not verify_manifest(manifest, parquet_path):
            report.append(_quarantine(db, manifest, manifest_path, quarantine_dir, "checksum mismatch"))
            continue

        rows = db.query(
            "SELECT partition_id FROM data_partitions WHERE parquet_uri = ?",
            (str(parquet_path),),
        )
        if not rows:
            try:
                db.add_dataset_version(
                    manifest["dataset_id"],
                    manifest["dataset_version"],
                    manifest["processing_version"],
                )
                db.add_partition(
                    {
                        "dataset_id": manifest["dataset_id"],
                        "dataset_version": manifest["dataset_version"],
                        "processing_version": manifest["processing_version"],
                        "variable_id": manifest.get("variable_id", "unknown"),
                        "source_id": manifest["source_id"],
                        "parquet_uri": str(parquet_path),
                        "parquet_sha256": manifest["parquet_sha256"],
                        "row_count": int(manifest.get("row_count", 0)),
                        "created_at": utc_now(),
                    }
                )
            except Exception as exc:
                report.append(_quarantine(db, manifest, manifest_path, quarantine_dir, f"recovery failed: {exc}"))
                continue

        manifest["status"] = "RECOVERED"
        manifest["updated_at"] = utc_now()
        write_manifest(manifest_path, manifest)
        db.upsert_manifest(manifest)
        db.record_audit(
            "MANIFEST_RECOVERED",
            {"run_id": manifest["run_id"], "parquet_uri": str(parquet_path)},
        )
        report.append({"run_id": manifest["run_id"], "status": "RECOVERED"})
    return report