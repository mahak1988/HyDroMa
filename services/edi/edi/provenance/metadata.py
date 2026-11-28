"""Provenance metadata helpers."""

from datetime import datetime, timezone
from typing import Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def build_provenance(
    source_url: str,
    raw_file: str,
    raw_sha256: str,
    adapter_version: str,
    transform_version: str,
    processing_history: list[str],
    dataset_version: str,
    upstream_sources: list[str],
) -> dict[str, Any]:
    return {
        "source_url": source_url,
        "raw_file": raw_file,
        "raw_sha256": raw_sha256,
        "retrieved_at": utc_now(),
        "adapter_version": adapter_version,
        "transform_version": transform_version,
        "processing_history": processing_history,
        "dataset_version": dataset_version,
        "upstream_sources": upstream_sources,
    }