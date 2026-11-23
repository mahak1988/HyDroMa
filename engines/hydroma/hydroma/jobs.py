"""Persistent job store and worker lifecycle (SQLite, stdlib only).

Lifecycle: queued -> running -> completed | failed.

Design notes / limits:
* Single-process, single-node. SQLite is used as a small durable store, not as a
  distributed queue. It is safe for the Phase 2.1 slice and local workers only.
* Claiming is atomic (a single conditional UPDATE) and serialized in-process by a
  lock, so two workers cannot both claim the same run.
* Stale running runs (crashed worker) can be requeued via an explicit policy.
* This is NOT production-grade distributed job infrastructure.
"""

from __future__ import annotations

import json
import sqlite3
import threading
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

__all__ = ["JobStore", "RUN_STATES", "SCHEMA_VERSION"]

RUN_STATES = ("queued", "running", "completed", "failed")
SCHEMA_VERSION = 1

_SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
    run_id          TEXT PRIMARY KEY,
    model_id        TEXT NOT NULL,
    model_version   TEXT NOT NULL,
    status          TEXT NOT NULL,
    requested_by    TEXT NOT NULL,
    tenant_id       TEXT,
    requested_at    TEXT NOT NULL,
    attempts        INTEGER NOT NULL DEFAULT 0,
    worker_id       TEXT,
    heartbeat_at    TEXT,
    started_at      TEXT,
    finished_at     TEXT,
    input_json      TEXT,
    result_json     TEXT,
    provenance_json TEXT,
    error_json      TEXT
);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _row_to_dict(row: sqlite3.Row) -> dict:
    data = dict(row)
    for key in ("input_json", "result_json", "provenance_json", "error_json"):
        if data.get(key) is not None:
            data[key] = json.loads(data[key])
    return data


class JobStore:
    def __init__(self, path: str = ":memory:") -> None:
        self.path = path
        self._lock = threading.RLock()
        # timeout => SQLite busy_timeout; lets concurrent processes/threads serialize
        # a write instead of failing with "database is locked".
        self._conn = sqlite3.connect(path, check_same_thread=False, timeout=10.0)
        self._conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self) -> None:
        with self._lock:
            self._conn.executescript(_SCHEMA)
            # minimal schema versioning
            current = self._conn.execute("PRAGMA user_version").fetchone()[0]
            if current < SCHEMA_VERSION:
                # forward-compatible: add worker_id if an older table lacks it
                cols = {r["name"] for r in self._conn.execute("PRAGMA table_info(runs)")}
                if "worker_id" not in cols:
                    self._conn.execute("ALTER TABLE runs ADD COLUMN worker_id TEXT")
                self._conn.execute(f"PRAGMA user_version = {SCHEMA_VERSION}")
            self._conn.commit()

    def close(self) -> None:
        with self._lock:
            self._conn.close()

    def create_run(
        self,
        model_id: str,
        model_version: str,
        requested_by: str,
        input_data: dict,
        tenant_id: Optional[str] = None,
    ) -> str:
        if not isinstance(input_data, dict):
            raise ValueError("input_data must be a dict")
        run_id = uuid.uuid4().hex
        with self._lock:
            self._conn.execute(
                "INSERT INTO runs (run_id, model_id, model_version, status, requested_by,"
                " tenant_id, requested_at, attempts, input_json) VALUES (?,?,?,?,?,?,?,?,?)",
                (run_id, model_id, model_version, "queued", requested_by, tenant_id,
                 _now(), 0, json.dumps(input_data)),
            )
            self._conn.commit()
        return run_id

    def get_run(self, run_id: str) -> Optional[dict]:
        with self._lock:
            row = self._conn.execute(
                "SELECT * FROM runs WHERE run_id = ?", (run_id,)
            ).fetchone()
        return _row_to_dict(row) if row else None

    def list_runs(self, limit: int = 50) -> list:
        with self._lock:
            rows = self._conn.execute(
                "SELECT * FROM runs ORDER BY requested_at DESC LIMIT ?", (limit,)
            ).fetchall()
        return [_row_to_dict(r) for r in rows]

    def claim(self, run_id: str, worker_id: str = "worker-1") -> bool:
        now = _now()
        with self._lock:
            cur = self._conn.execute(
                "UPDATE runs SET status='running', attempts=attempts+1, worker_id=?,"
                " heartbeat_at=?, started_at=COALESCE(started_at, ?)"
                " WHERE run_id=? AND status='queued'",
                (worker_id, now, now, run_id),
            )
            self._conn.commit()
            return cur.rowcount == 1

    def heartbeat(self, run_id: str, worker_id: Optional[str] = None) -> None:
        with self._lock:
            if worker_id is None:
                self._conn.execute(
                    "UPDATE runs SET heartbeat_at=? WHERE run_id=? AND status='running'",
                    (_now(), run_id),
                )
            else:
                self._conn.execute(
                    "UPDATE runs SET heartbeat_at=? WHERE run_id=? AND status='running'"
                    " AND worker_id=?",
                    (_now(), run_id, worker_id),
                )
            self._conn.commit()

    def complete(self, run_id: str, result: dict, provenance: dict) -> None:
        with self._lock:
            self._conn.execute(
                "UPDATE runs SET status='completed', result_json=?, provenance_json=?,"
                " finished_at=?, error_json=NULL WHERE run_id=? AND status='running'",
                (json.dumps(result), json.dumps(provenance), _now(), run_id),
            )
            self._conn.commit()

    def fail(self, run_id: str, error: dict) -> None:
        with self._lock:
            self._conn.execute(
                "UPDATE runs SET status='failed', error_json=?, finished_at=?"
                " WHERE run_id=? AND status='running'",
                (json.dumps(error), _now(), run_id),
            )
            self._conn.commit()

    def recover_stale(self, timeout_seconds: int = 300) -> int:
        cutoff = (datetime.now(timezone.utc) - timedelta(seconds=timeout_seconds)).isoformat()
        with self._lock:
            cur = self._conn.execute(
                "UPDATE runs SET status='queued', worker_id=NULL, heartbeat_at=NULL"
                " WHERE status='running' AND heartbeat_at IS NOT NULL AND heartbeat_at < ?",
                (cutoff,),
            )
            self._conn.commit()
            return cur.rowcount