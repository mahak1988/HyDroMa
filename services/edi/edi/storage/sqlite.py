"""SQLite metadata store."""

import hashlib
import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from edi.errors import IntegrityError, StorageError

SCHEMA = """
CREATE TABLE IF NOT EXISTS datasets (
    dataset_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dataset_versions (
    dataset_id TEXT NOT NULL,
    dataset_version TEXT NOT NULL,
    processing_version TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (dataset_id, dataset_version, processing_version),
    FOREIGN KEY (dataset_id) REFERENCES datasets(dataset_id)
);

CREATE TABLE IF NOT EXISTS data_partitions (
    partition_id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id TEXT NOT NULL,
    dataset_version TEXT NOT NULL,
    processing_version TEXT NOT NULL,
    variable_id TEXT NOT NULL,
    source_id TEXT NOT NULL,
    parquet_uri TEXT NOT NULL UNIQUE,
    parquet_sha256 TEXT NOT NULL,
    row_count INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    FOREIGN KEY (dataset_id, dataset_version, processing_version)
        REFERENCES dataset_versions(dataset_id, dataset_version, processing_version)
);

CREATE TABLE IF NOT EXISTS manifests (
    run_id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    dataset_version TEXT NOT NULL,
    processing_version TEXT NOT NULL,
    source_id TEXT NOT NULL,
    parquet_uri TEXT NOT NULL,
    parquet_sha256 TEXT NOT NULL,
    status TEXT NOT NULL,
    manifest_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_registry (
    source_id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    product TEXT NOT NULL,
    access_status TEXT NOT NULL,
    evidence_status TEXT NOT NULL,
    authorization_status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS processing_runs (
    run_id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    status TEXT NOT NULL,
    raw_sha256 TEXT,
    error_code TEXT
);

CREATE TABLE IF NOT EXISTS quality_results (
    quality_id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    variable_id TEXT NOT NULL,
    n_valid INTEGER NOT NULL,
    n_missing INTEGER NOT NULL,
    n_invalid INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES processing_runs(run_id)
);

CREATE TABLE IF NOT EXISTS audit_events (
    audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    previous_hash TEXT NOT NULL,
    record_hash TEXT NOT NULL,
    event TEXT NOT NULL,
    created_at TEXT NOT NULL,
    details_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_manifests_status ON manifests(status);
CREATE INDEX IF NOT EXISTS idx_partitions_variable ON data_partitions(variable_id, dataset_version);
CREATE INDEX IF NOT EXISTS idx_quality_run ON quality_results(run_id, variable_id);
"""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def sha256_json(value: Any) -> str:
    canonical = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class Database:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._conn: sqlite3.Connection | None = None

    def connect(self) -> sqlite3.Connection:
        if self._conn is None:
            self._conn = sqlite3.connect(str(self.path))
            self._conn.row_factory = sqlite3.Row
            self._conn.execute("PRAGMA journal_mode=WAL")
            self._conn.execute("PRAGMA synchronous=NORMAL")
            self._conn.execute("PRAGMA busy_timeout=5000")
            self._conn.execute("PRAGMA foreign_keys=ON")
        return self._conn

    def close(self) -> None:
        if self._conn is not None:
            self._conn.close()
            self._conn = None

    def initialize(self) -> None:
        conn = self.connect()
        try:
            conn.executescript(SCHEMA)
            columns = {row[1] for row in conn.execute("PRAGMA table_info(data_partitions)")}
            if "status" not in columns:
                conn.execute(
                    "ALTER TABLE data_partitions ADD COLUMN status TEXT NOT NULL DEFAULT 'AVAILABLE'"
                )
            conn.commit()
        except sqlite3.Error as exc:
            raise StorageError("failed to initialize SQLite schema") from exc

    @contextmanager
    def transaction(self) -> Iterator[sqlite3.Connection]:
        conn = self.connect()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise

    def execute(self, sql: str, params: tuple = ()) -> sqlite3.Cursor:
        conn = self.connect()
        try:
            return conn.execute(sql, params)
        except sqlite3.Error as exc:
            raise StorageError("SQLite execute failed", {"sql": sql}) from exc

    def query(self, sql: str, params: tuple = ()) -> list[sqlite3.Row]:
        conn = self.connect()
        try:
            return list(conn.execute(sql, params).fetchall())
        except sqlite3.Error as exc:
            raise StorageError("SQLite query failed", {"sql": sql}) from exc

    def record_audit(self, event: str, details: dict[str, Any] | None = None) -> str:
        details = details or {}
        conn = self.connect()
        row = conn.execute(
            "SELECT record_hash FROM audit_events ORDER BY audit_id DESC LIMIT 1"
        ).fetchone()
        previous_hash = row["record_hash"] if row else "GENESIS"
        created_at = utc_now()
        record_hash = sha256_json(
            {
                "previous_hash": previous_hash,
                "event": event,
                "created_at": created_at,
                "details": details,
            }
        )
        conn.execute(
            "INSERT INTO audit_events(previous_hash, record_hash, event, created_at, details_json) VALUES (?, ?, ?, ?, ?)",
            (
                previous_hash,
                record_hash,
                event,
                created_at,
                json.dumps(details, sort_keys=True, separators=(",", ":")),
            ),
        )
        conn.commit()
        return record_hash

    def verify_audit_chain(self) -> bool:
        conn = self.connect()
        previous_hash = "GENESIS"
        for row in conn.execute(
            "SELECT previous_hash, record_hash, event, created_at, details_json FROM audit_events ORDER BY audit_id"
        ):
            details = json.loads(row["details_json"])
            expected = sha256_json(
                {
                    "previous_hash": previous_hash,
                    "event": row["event"],
                    "created_at": row["created_at"],
                    "details": details,
                }
            )
            if row["previous_hash"] != previous_hash or row["record_hash"] != expected:
                return False
            previous_hash = row["record_hash"]
        return True

    def upsert_source(self, source: dict) -> None:
        with self.transaction() as conn:
            conn.execute(
                """
                INSERT INTO source_registry(source_id, provider, product, access_status, evidence_status, authorization_status)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(source_id) DO UPDATE SET
                    provider=excluded.provider,
                    product=excluded.product,
                    access_status=excluded.access_status,
                    evidence_status=excluded.evidence_status,
                    authorization_status=excluded.authorization_status
                """,
                (
                    source["source_id"],
                    source.get("provider", ""),
                    source.get("product", ""),
                    source.get("access_status", "UNKNOWN"),
                    source.get("evidence_status", "NOT_TESTED"),
                    source.get("authorization_status", "UNKNOWN"),
                ),
            )

    def upsert_manifest(self, manifest: dict) -> None:
        with self.transaction() as conn:
            conn.execute(
                """
                INSERT INTO manifests(
                    run_id, dataset_id, dataset_version, processing_version, source_id,
                    parquet_uri, parquet_sha256, status, manifest_json, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(run_id) DO UPDATE SET
                    status=excluded.status,
                    manifest_json=excluded.manifest_json,
                    updated_at=excluded.updated_at
                """,
                (
                    manifest["run_id"],
                    manifest["dataset_id"],
                    manifest["dataset_version"],
                    manifest["processing_version"],
                    manifest["source_id"],
                    manifest["parquet_uri"],
                    manifest["parquet_sha256"],
                    manifest["status"],
                    json.dumps(manifest, sort_keys=True, separators=(",", ":")),
                    manifest["created_at"],
                    manifest["updated_at"],
                ),
            )

    def add_partition(self, partition: dict) -> None:
        with self.transaction() as conn:
            conn.execute(
                """
                INSERT INTO data_partitions(
                    dataset_id, dataset_version, processing_version, variable_id, source_id,
                    parquet_uri, parquet_sha256, row_count, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    partition["dataset_id"],
                    partition["dataset_version"],
                    partition["processing_version"],
                    partition["variable_id"],
                    partition["source_id"],
                    partition["parquet_uri"],
                    partition["parquet_sha256"],
                    int(partition["row_count"]),
                    partition["created_at"],
                ),
            )

    def add_dataset_version(self, dataset_id: str, dataset_version: str, processing_version: str) -> None:
        with self.transaction() as conn:
            conn.execute(
                "INSERT OR IGNORE INTO datasets(dataset_id, created_at) VALUES (?, ?)",
                (dataset_id, utc_now()),
            )
            conn.execute(
                "INSERT OR IGNORE INTO dataset_versions(dataset_id, dataset_version, processing_version, created_at) VALUES (?, ?, ?, ?)",
                (dataset_id, dataset_version, processing_version, utc_now()),
            )

    def mark_partition_status(self, parquet_uri: str, status: str) -> None:
        with self.transaction() as conn:
            conn.execute(
                "UPDATE data_partitions SET status = ? WHERE parquet_uri = ?",
                (status, parquet_uri),
            )

    def get_partition_status(self, parquet_uri: str) -> str | None:
        rows = self.query(
            "SELECT status FROM data_partitions WHERE parquet_uri = ?",
            (parquet_uri,),
        )
        return rows[0]["status"] if rows else None