"""Append-only, hash-chained audit trail for the ai-workforce governance plane.

Every governance event (agent registration, permission decision, execution
refusal, gateway accounting) is appended as an `AuditEntry`. Each entry
records `prev_hash` (the previous entry's hash, `GENESIS_HASH` for the first
entry) and `entry_hash` — the canonical SHA-256 over the entry content.

Canonicalization matches the engine-wide contract
(`engines/hydroma/hydroma/provenance.py::sha256_json`): sorted keys, compact
separators, UTF-8, `allow_nan=False`. This is Python-oriented and is NOT
RFC 8785; byte-identical cross-language hashing is not claimed.

The chain makes the trail tamper-evident: `verify()` recomputes every hash and
reports the first broken sequence number. It is integrity evidence, not a
substitute for durable storage — persistence is the caller's responsibility
(JSONL round-trip is provided).

Part of the ai-workforce engine governance layer (ADR-0013). Stdlib-only.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

GENESIS_HASH = "0" * 64

EVENT_TYPES: Tuple[str, ...] = (
    "AGENT_REGISTERED",
    "AGENT_DEPRECATED",
    "REGISTRY_VALIDATION_FAILED",
    "PERMISSION_DECISION",
    "EXECUTION_REFUSED",
    "TOOL_NOT_PERMITTED",
    "GATEWAY_REDACTED",
    "TOKEN_USAGE_RECORDED",
)


class AuditError(ValueError):
    """Raised for invalid audit usage (unknown event type, bad JSONL)."""


def sha256_json(obj: Any) -> str:
    """Canonical SHA-256 over a JSON-safe object (engine-wide contract)."""
    payload = json.dumps(
        obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def utc_now_iso() -> str:
    """Current UTC timestamp, ISO-8601, second precision."""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _chain_content(entry: "AuditEntry") -> Dict[str, Any]:
    """The exact content covered by `entry_hash` (excludes `entry_hash`)."""
    return {
        "seq": entry.seq,
        "timestamp_utc": entry.timestamp_utc,
        "agent_id": entry.agent_id,
        "agent_version": entry.agent_version,
        "event_type": entry.event_type,
        "payload": entry.payload,
        "prev_hash": entry.prev_hash,
    }


@dataclass(frozen=True)
class AuditEntry:
    """One immutable audit record. `entry_hash` covers all other fields."""

    seq: int
    timestamp_utc: str
    agent_id: Optional[str]
    agent_version: Optional[str]
    event_type: str
    payload: Dict[str, Any]
    prev_hash: str
    entry_hash: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "seq": self.seq,
            "timestamp_utc": self.timestamp_utc,
            "agent_id": self.agent_id,
            "agent_version": self.agent_version,
            "event_type": self.event_type,
            "payload": self.payload,
            "prev_hash": self.prev_hash,
            "entry_hash": self.entry_hash,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AuditEntry":
        try:
            return cls(
                seq=int(data["seq"]),
                timestamp_utc=str(data["timestamp_utc"]),
                agent_id=data.get("agent_id"),
                agent_version=data.get("agent_version"),
                event_type=str(data["event_type"]),
                payload=dict(data.get("payload") or {}),
                prev_hash=str(data["prev_hash"]),
                entry_hash=str(data["entry_hash"]),
            )
        except (KeyError, TypeError, ValueError) as exc:
            raise AuditError(f"INVALID_ENTRY: {exc}") from exc


class AuditLog:
    """In-memory, append-only, hash-chained audit log.

    There is no update or delete API; `entries` is exposed as an immutable
    tuple. `append` accepts an explicit `timestamp_utc` for deterministic
    tests; production callers omit it.
    """

    def __init__(self) -> None:
        self._entries: List[AuditEntry] = []

    @property
    def entries(self) -> Tuple[AuditEntry, ...]:
        return tuple(self._entries)

    def __len__(self) -> int:
        return len(self._entries)

    def append(
        self,
        event_type: str,
        agent_id: Optional[str] = None,
        agent_version: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
        timestamp_utc: Optional[str] = None,
    ) -> AuditEntry:
        """Append one event; returns the stored entry.

        Raises `AuditError` for an unknown `event_type` or a non-JSON-safe
        payload (e.g. NaN, non-serializable objects) — a broken record is
        never half-written into the chain.
        """
        if event_type not in EVENT_TYPES:
            raise AuditError(f"UNKNOWN_EVENT_TYPE: {event_type}")
        safe_payload = dict(payload or {})
        try:
            json.dumps(safe_payload, allow_nan=False)
        except (TypeError, ValueError) as exc:
            raise AuditError(f"PAYLOAD_NOT_JSON_SAFE: {exc}") from exc
        seq = len(self._entries)
        prev = self._entries[-1].entry_hash if self._entries else GENESIS_HASH
        ts = timestamp_utc if timestamp_utc is not None else utc_now_iso()
        entry = AuditEntry(
            seq=seq,
            timestamp_utc=ts,
            agent_id=agent_id,
            agent_version=agent_version,
            event_type=event_type,
            payload=safe_payload,
            prev_hash=prev,
            entry_hash="",
        )
        digest = sha256_json(_chain_content(entry))
        entry = AuditEntry(
            seq=entry.seq,
            timestamp_utc=entry.timestamp_utc,
            agent_id=entry.agent_id,
            agent_version=entry.agent_version,
            event_type=entry.event_type,
            payload=entry.payload,
            prev_hash=entry.prev_hash,
            entry_hash=digest,
        )
        self._entries.append(entry)
        return entry

    def verify(self) -> Dict[str, Any]:
        """Recompute the whole chain; report the first inconsistency."""
        errors: List[Dict[str, Any]] = []
        prev = GENESIS_HASH
        for index, entry in enumerate(self._entries):
            if entry.seq != index:
                errors.append({"seq": entry.seq, "code": "SEQ_MISMATCH"})
            elif entry.prev_hash != prev:
                errors.append({"seq": entry.seq, "code": "PREV_HASH_MISMATCH"})
            else:
                expected = sha256_json(_chain_content(entry))
                if entry.entry_hash != expected:
                    errors.append({"seq": entry.seq, "code": "ENTRY_HASH_MISMATCH"})
            if errors:
                break
            prev = entry.entry_hash
        return {
            "valid": not errors,
            "entries": len(self._entries),
            "broken_at": errors[0]["seq"] if errors else None,
            "errors": errors,
        }

    def to_jsonl(self) -> str:
        """Serialize the chain as JSON Lines (one entry per line)."""
        return "\n".join(
            json.dumps(e.to_dict(), sort_keys=True, ensure_ascii=False)
            for e in self._entries
        )

    @classmethod
    def from_jsonl(cls, text: str) -> "AuditLog":
        """Rebuild a log from JSONL; the chain is NOT re-verified implicitly."""
        log = cls()
        for line_no, line in enumerate(text.splitlines(), start=1):
            stripped = line.strip()
            if not stripped:
                continue
            try:
                data = json.loads(stripped)
            except json.JSONDecodeError as exc:
                raise AuditError(f"INVALID_JSONL_LINE {line_no}: {exc}") from exc
            log._entries.append(AuditEntry.from_dict(data))
        return log
