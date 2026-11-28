"""Connector framework contracts (stdlib-only, no network at import)."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

__all__ = [
    "ErrorCode",
    "ConnectorError",
    "ArtifactStatus",
    "SourceMetadata",
    "AcquisitionRequest",
    "AcquisitionResult",
    "Connector",
]


class ErrorCode(str, Enum):
    INVALID_URL = "INVALID_URL"
    URL_SCHEME_BLOCKED = "URL_SCHEME_BLOCKED"
    URL_HOST_BLOCKED = "URL_HOST_BLOCKED"
    PATH_TRAVERSAL = "PATH_TRAVERSAL"
    TOO_LARGE = "TOO_LARGE"
    BAD_RESPONSE = "BAD_RESPONSE"
    NETWORK_ERROR = "NETWORK_ERROR"
    UNSUPPORTED = "UNSUPPORTED"
    AUTH_REQUIRED = "AUTH_REQUIRED"


class ConnectorError(RuntimeError):
    def __init__(self, code: ErrorCode, message: str, *, retryable: bool = False,
                 details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(f"{code.value}: {message}")
        self.code = code
        self.message = message
        self.retryable = retryable
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {"code": self.code.value, "message": self.message,
                "retryable": self.retryable, "details": self.details}


class ArtifactStatus:
    DISCOVERED = "DISCOVERED"
    REFERENCED = "REFERENCED"
    ACQUIRED = "ACQUIRED"
    VERIFIED = "VERIFIED"
    IMPORTED = "IMPORTED"
    QC_REVIEWED = "QC_REVIEWED"
    ORDER = (DISCOVERED, REFERENCED, ACQUIRED, VERIFIED, IMPORTED, QC_REVIEWED)


@dataclass
class SourceMetadata:
    source_id: str
    name: str
    provider: str
    license: str
    media_type: str
    variables: List[str] = field(default_factory=list)
    requires_auth: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_id": self.source_id, "name": self.name, "provider": self.provider,
            "license": self.license, "media_type": self.media_type,
            "variables": list(self.variables), "requires_auth": self.requires_auth,
        }


@dataclass
class AcquisitionRequest:
    source_id: str = ""
    dataset_id: str = ""
    dataset_version: str = ""
    url: str = ""
    variable: str = ""
    unit: str = ""
    basis: str = ""
    bbox: Optional[List[float]] = None
    extra: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AcquisitionResult:
    ok: bool
    source_id: str = ""
    dataset_id: str = ""
    dataset_version: str = ""
    local_path: Optional[str] = None
    remote_reference: Optional[str] = None
    checksum: Optional[str] = None
    checksum_algorithm: str = "sha256"
    size_bytes: Optional[int] = None
    acquired_at: Optional[str] = None
    artifact: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    error: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ok": self.ok, "source_id": self.source_id, "dataset_id": self.dataset_id,
            "dataset_version": self.dataset_version, "localPath": self.local_path,
            "remoteReference": self.remote_reference, "checksum": self.checksum,
            "checksumAlgorithm": self.checksum_algorithm, "sizeBytes": self.size_bytes,
            "acquiredAt": self.acquired_at, "artifact": self.artifact,
            "metadata": self.metadata, "error": self.error,
        }


class Connector:
    source_id = "base"

    def metadata(self) -> SourceMetadata:  # pragma: no cover - interface
        raise NotImplementedError

    def capabilities(self) -> List[str]:  # pragma: no cover - interface
        raise NotImplementedError

    def acquire(self, request: AcquisitionRequest, transport, policy, cache) -> AcquisitionResult:  # pragma: no cover
        raise NotImplementedError