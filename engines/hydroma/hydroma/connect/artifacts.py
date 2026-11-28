"""Artifact manifest & DataArtifact contract (stdlib-only).

Produces the core's ``DataArtifact`` dict (validated by
``hydroma.data.is_data_artifact``) enriched with connector metadata, and manages
the distinct acquisition lifecycle statuses. A remote COG reference is never
represented as locally acquired/verified unless that actually happened.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from ..data import is_data_artifact
from .base import ArtifactStatus

__all__ = [
    "ArtifactManifest",
    "build_artifact",
    "set_artifact_status",
    "ARTIFACT_STATUS_ORDER",
]

ARTIFACT_STATUS_ORDER = ArtifactStatus.ORDER

_ALLOWED_TRANSITIONS = {
    ArtifactStatus.DISCOVERED: {ArtifactStatus.REFERENCED, ArtifactStatus.ACQUIRED},
    ArtifactStatus.REFERENCED: {ArtifactStatus.ACQUIRED, ArtifactStatus.DISCOVERED},
    ArtifactStatus.ACQUIRED: {ArtifactStatus.VERIFIED, ArtifactStatus.DISCOVERED},
    ArtifactStatus.VERIFIED: {ArtifactStatus.IMPORTED, ArtifactStatus.ACQUIRED},
    ArtifactStatus.IMPORTED: {ArtifactStatus.QC_REVIEWED, ArtifactStatus.VERIFIED},
    ArtifactStatus.QC_REVIEWED: {ArtifactStatus.IMPORTED},
}


def build_artifact(*, artifact_id: str, source_id: str, dataset_id: str,
                   dataset_version: Optional[str] = None, local_path: Optional[str] = None,
                   remote_reference: Optional[str] = None, checksum: Optional[str] = None,
                   checksum_algorithm: str = "sha256", size_bytes: Optional[int] = None,
                   acquired_at: Optional[str] = None, media_type: str = "application/octet-stream",
                   license: Optional[str] = None, attribution: Optional[str] = None,
                   units: Optional[str] = None, status: str = ArtifactStatus.REFERENCED,
                   quality_status: str = "unchecked", processing_status: str = "raw",
                   metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Build a DataArtifact dict. ``local_path`` set only for real local files."""
    uri = local_path if local_path is not None else remote_reference
    if not uri:
        raise ValueError("artifact needs a local_path or remote_reference")
    artifact: Dict[str, Any] = {
        "id": artifact_id,
        "kind": "raw",
        "uri": uri,
        "mediaType": media_type,
        "sourceId": source_id,
        "datasetId": dataset_id,
        "datasetVersion": dataset_version,
        "provider": metadata.get("provider") if metadata else None,
        "license": license,
        "sourceAttribution": attribution,
        "checksumAlgorithm": checksum_algorithm,
        "acquisitionStatus": status,
        "qualityStatus": quality_status,
        "processingStatus": processing_status,
        "localPath": local_path,
        "remoteReference": remote_reference,
        "acquiredAt": acquired_at,
        "sizeBytes": size_bytes,
        "units": units,
        "metadata": metadata or {},
    }
    if checksum is not None:
        artifact["checksum"] = checksum
    artifact = {k: v for k, v in artifact.items() if v is not None}
    if not is_data_artifact(artifact):
        raise ValueError("built artifact does not satisfy the DataArtifact contract")
    return artifact


def set_artifact_status(artifact: Dict[str, Any], new_status: str) -> Dict[str, Any]:
    """Return a copy with a validated status transition (no silent jumps)."""
    if new_status not in ARTIFACT_STATUS_ORDER:
        raise ValueError(f"unknown status: {new_status}")
    current = artifact.get("acquisitionStatus", ArtifactStatus.DISCOVERED)
    if new_status == current:
        return dict(artifact)
    if new_status not in _ALLOWED_TRANSITIONS.get(current, set()):
        raise ValueError(f"illegal status transition {current} -> {new_status}")
    out = dict(artifact)
    out["acquisitionStatus"] = new_status
    return out


class ArtifactManifest:
    """In-memory manifest of artifacts keyed by artifact_id."""

    def __init__(self) -> None:
        self._items: Dict[str, Dict[str, Any]] = {}

    def add(self, artifact: Dict[str, Any]) -> None:
        aid = artifact["id"]
        if aid in self._items:
            raise ValueError(f"duplicate artifact id: {aid}")
        self._items[aid] = artifact

    def get(self, artifact_id: str) -> Dict[str, Any]:
        return self._items[artifact_id]

    def ids(self):
        return list(self._items.keys())

    def by_status(self, status: str):
        return [a for a in self._items.values() if a.get("acquisitionStatus") == status]