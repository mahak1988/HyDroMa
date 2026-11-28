"""Audit tests: append-only chain, canonical hashing, tamper evidence, JSONL."""

import dataclasses
import json

import pytest

from ai_workforce.audit import (
    GENESIS_HASH,
    AuditEntry,
    AuditError,
    AuditLog,
    sha256_json,
)


def test_first_entry_links_to_genesis():
    log = AuditLog()
    entry = log.append(
        "AGENT_REGISTERED",
        agent_id="a",
        agent_version="1.0.0",
        payload={"role": "analyst"},
        timestamp_utc="2026-11-29T00:00:00+00:00",
    )
    assert entry.seq == 0
    assert entry.prev_hash == GENESIS_HASH
    assert len(entry.entry_hash) == 64


def test_chain_links_and_verifies():
    log = AuditLog()
    for i in range(5):
        log.append(
            "PERMISSION_DECISION",
            agent_id=f"agent-{i}",
            agent_version="1.0.0",
            payload={"n": i},
            timestamp_utc="2026-11-29T00:00:00+00:00",
        )
    report = log.verify()
    assert report["valid"] is True
    assert report["entries"] == 5
    assert report["broken_at"] is None
    entries = log.entries
    for prev, nxt in zip(entries, entries[1:]):
        assert nxt.prev_hash == prev.entry_hash
        assert nxt.seq == prev.seq + 1


def test_canonical_hash_is_order_insensitive_and_material_sensitive():
    assert sha256_json({"a": 1, "b": 2}) == sha256_json({"b": 2, "a": 1})
    assert sha256_json({"a": 1}) != sha256_json({"a": 2})


def test_unknown_event_type_rejected():
    log = AuditLog()
    with pytest.raises(AuditError):
        log.append("SOMETHING_ELSE")


def test_non_json_safe_payload_rejected():
    log = AuditLog()
    with pytest.raises(AuditError):
        log.append("PERMISSION_DECISION", payload={"x": float("nan")})
    with pytest.raises(AuditError):
        log.append("PERMISSION_DECISION", payload={"x": object()})


def test_tampered_payload_detected():
    log = AuditLog()
    log.append("AGENT_REGISTERED", agent_id="a", agent_version="1.0.0")
    log.append("PERMISSION_DECISION", agent_id="a", agent_version="1.0.0", payload={"ok": True})
    tampered = dataclasses.replace(log.entries[1], payload={"ok": False})
    broken_log = AuditLog()
    broken_log._entries.extend([log.entries[0], tampered])
    report = broken_log.verify()
    assert report["valid"] is False
    assert report["broken_at"] == 1
    assert report["errors"][0]["code"] == "ENTRY_HASH_MISMATCH"


def test_tampered_entry_hash_detected():
    log = AuditLog()
    log.append("AGENT_REGISTERED", agent_id="a", agent_version="1.0.0")
    log.append("PERMISSION_DECISION", agent_id="a", agent_version="1.0.0")
    tampered = dataclasses.replace(log.entries[1], entry_hash="f" * 64)
    broken_log = AuditLog()
    broken_log._entries.extend([log.entries[0], tampered])
    report = broken_log.verify()
    assert report["valid"] is False
    assert report["broken_at"] == 1


def test_broken_link_detected():
    log = AuditLog()
    log.append("AGENT_REGISTERED", agent_id="a", agent_version="1.0.0")
    log.append("PERMISSION_DECISION", agent_id="a", agent_version="1.0.0")
    tampered = dataclasses.replace(log.entries[1], prev_hash="e" * 64)
    broken_log = AuditLog()
    broken_log._entries.extend([log.entries[0], tampered])
    report = broken_log.verify()
    assert report["valid"] is False
    assert report["errors"][0]["code"] == "PREV_HASH_MISMATCH"


def test_jsonl_round_trip_preserves_chain():
    log = AuditLog()
    log.append("AGENT_REGISTERED", agent_id="a", agent_version="1.0.0", payload={"role": "analyst"})
    log.append(
        "PERMISSION_DECISION",
        agent_id="a",
        agent_version="1.0.0",
        payload={"decision": "ALLOW", "codes": ["PERMISSION_OK"]},
    )
    text = log.to_jsonl()
    lines = [json.loads(line) for line in text.splitlines()]
    assert len(lines) == 2
    rebuilt = AuditLog.from_jsonl(text)
    assert rebuilt.verify() == log.verify()
    assert rebuilt.verify()["valid"] is True
    assert [e.entry_hash for e in rebuilt.entries] == [e.entry_hash for e in log.entries]


def test_entries_exposed_immutable():
    log = AuditLog()
    log.append("AGENT_REGISTERED", agent_id="a", agent_version="1.0.0")
    assert isinstance(log.entries, tuple)
    with pytest.raises(AttributeError):
        log.entries.clear()  # type: ignore[attr-defined]


def test_fixed_timestamp_makes_chain_deterministic():
    a, b = AuditLog(), AuditLog()
    for log in (a, b):
        log.append(
            "AGENT_REGISTERED",
            agent_id="x",
            agent_version="2.0.0",
            payload={"k": ["v", 1]},
            timestamp_utc="2026-11-29T12:00:00+00:00",
        )
    assert a.entries[0].entry_hash == b.entries[0].entry_hash
