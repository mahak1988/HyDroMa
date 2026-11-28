"""Acquisition layer: policy, URL safety, transport, cache download (stdlib-only).

No network at import. The real transport lazily imports ``httpx`` (optional
extra). Tests inject a fake transport, so no optional dependency is required to
run the suite.
"""

from __future__ import annotations

import hashlib
import ipaddress
import os
from dataclasses import dataclass, field
from typing import Any, Optional, Tuple
from urllib.parse import urlparse

from .base import AcquisitionRequest, AcquisitionResult, ConnectorError, ErrorCode
from ..provenance import utc_now_iso  # reuse existing timestamp helper

__all__ = [
    "AcquisitionPolicy",
    "HttpxTransport",
    "is_url_allowed",
    "safe_join",
    "fetch_with_retry",
    "download_to_cache",
]

_BLOCKED_HOSTS = {
    "localhost", "127.0.0.1", "0.0.0.0", "::1",
    "169.254.169.254",
}
_BLOCKED_PREFIXES = ("127.", "10.", "192.168.", "169.254.", "172.16.", "172.17.",
                     "172.18.", "172.19.", "172.2", "172.30.", "172.31.")


@dataclass
class AcquisitionPolicy:
    allowed_schemes: Tuple[str, ...] = ("https",)
    max_bytes: int = 512 * 1024 * 1024
    timeout_s: float = 30.0
    max_retries: int = 2
    max_requests: int = 100
    cache_dir: str = field(default_factory=lambda: os.environ.get(
        "HYDROMA_CONNECT_CACHE", os.path.join(os.getcwd(), ".hydroma-cache")))
    extra_blocked_hosts: Tuple[str, ...] = ()


def _host_blocked(host: str, policy: AcquisitionPolicy) -> bool:
    h = (host or "").lower().strip("[]")
    if not h:
        return True
    if h in _BLOCKED_HOSTS or h in policy.extra_blocked_hosts:
        return True
    if h.startswith(_BLOCKED_PREFIXES):
        return True
    try:
        ip = ipaddress.ip_address(h)
        return ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved
    except ValueError:
        return False


def is_url_allowed(url: str, policy: AcquisitionPolicy) -> Tuple[bool, Optional[str]]:
    """Return (allowed, reason). Blocks non-HTTPS, blocked hosts, malformed URLs."""
    try:
        p = urlparse(url)
    except Exception:
        return False, ErrorCode.INVALID_URL
    if p.scheme not in policy.allowed_schemes:
        return False, ErrorCode.URL_SCHEME_BLOCKED
    if not p.hostname:
        return False, ErrorCode.INVALID_URL
    if _host_blocked(p.hostname, policy):
        return False, ErrorCode.URL_HOST_BLOCKED
    return True, None


def safe_join(base: str, *parts: str) -> str:
    """Join ``parts`` under ``base`` rejecting absolute paths and traversal."""
    base_abs = os.path.abspath(base)
    target = os.path.abspath(os.path.join(base_abs, *parts))
    if not (target == base_abs or target.startswith(base_abs + os.sep)):
        raise ConnectorError(ErrorCode.PATH_TRAVERSAL, "path escapes cache root")
    return target


class HttpxTransport:
    """Real HTTP transport. Lazily imports ``httpx`` (optional extra)."""

    def fetch(self, url: str, policy: AcquisitionPolicy) -> bytes:
        allowed, reason = is_url_allowed(url, policy)
        if not allowed:
            raise ConnectorError(reason, f"url not allowed: {url}")
        try:
            import httpx  # lazy optional dependency
        except ImportError as exc:  # pragma: no cover - optional
            raise ConnectorError(ErrorCode.UNSUPPORTED,
                                 "httpx not installed (pip install hydroma[connect])") from exc
        buf = bytearray()
        try:
            with httpx.stream("GET", url, timeout=policy.timeout_s,
                              follow_redirects=False) as resp:
                if resp.status_code >= 400:
                    raise ConnectorError(ErrorCode.BAD_RESPONSE, f"HTTP {resp.status_code}")
                for chunk in resp.iter_bytes():
                    buf.extend(chunk)
                    if len(buf) > policy.max_bytes:
                        raise ConnectorError(ErrorCode.TOO_LARGE, "max_bytes exceeded")
        except ConnectorError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise ConnectorError(ErrorCode.NETWORK_ERROR, str(exc), retryable=True) from exc
        return bytes(buf)

    def fetch_json(self, url: str, policy: AcquisitionPolicy) -> Any:
        import json
        return json.loads(self.fetch(url, policy).decode("utf-8"))


def fetch_with_retry(transport, url: str, policy: AcquisitionPolicy) -> bytes:
    attempts = policy.max_retries + 1
    last: Optional[ConnectorError] = None
    for _ in range(attempts):
        try:
            return transport.fetch(url, policy)
        except ConnectorError as exc:
            last = exc
            if not exc.retryable:
                raise
    raise last  # type: ignore[misc]


def download_to_cache(transport, request: AcquisitionRequest, policy: AcquisitionPolicy,
                      cache, *, source_id: str) -> AcquisitionResult:
    """Acquire ``request.url`` into ``cache`` with checksum + artifact."""
    allowed, reason = is_url_allowed(request.url, policy)
    if not allowed:
        return AcquisitionResult(ok=False, source_id=source_id,
                                 dataset_id=request.dataset_id,
                                 error=ConnectorError(reason, "url not allowed").to_dict())

    key = cache.key(source_id, request.dataset_id, request.dataset_version, request.url)
    cached = cache.get_verified(key)
    if cached is not None:
        path, meta = cached
        return _result_from_cache(source_id, request, path, meta)

    try:
        data = fetch_with_retry(transport, request.url, policy)
    except ConnectorError as exc:
        return AcquisitionResult(ok=False, source_id=source_id,
                                 dataset_id=request.dataset_id, error=exc.to_dict())

    checksum = hashlib.sha256(data).hexdigest()
    meta = {
        "source_id": source_id, "dataset_id": request.dataset_id,
        "dataset_version": request.dataset_version, "url": request.url,
        "checksum": checksum, "checksum_algorithm": "sha256",
        "size_bytes": len(data), "acquired_at": utc_now_iso(),
        "variable": request.variable, "unit": request.unit, "basis": request.basis,
        "status": "VERIFIED",
    }
    path = cache.put(key, data, meta)
    return _result_from_cache(source_id, request, path, meta)


def _result_from_cache(source_id: str, request: AcquisitionRequest,
                       path: str, meta: dict) -> AcquisitionResult:
    from .artifacts import build_artifact

    artifact = build_artifact(
        artifact_id=f"{source_id}:{request.dataset_id}:{meta['checksum'][:12]}",
        source_id=source_id, dataset_id=request.dataset_id,
        dataset_version=request.dataset_version, local_path=path,
        remote_reference=request.url, checksum=meta["checksum"],
        checksum_algorithm="sha256", size_bytes=meta["size_bytes"],
        acquired_at=meta["acquired_at"],
        media_type=meta.get("media_type", "application/octet-stream"),
        license=meta.get("license"), status="VERIFIED",
        units=meta.get("unit"), metadata={"variable": request.variable, "basis": request.basis},
    )
    return AcquisitionResult(
        ok=True, source_id=source_id, dataset_id=request.dataset_id,
        dataset_version=request.dataset_version, local_path=path,
        remote_reference=request.url, checksum=meta["checksum"],
        checksum_algorithm="sha256", size_bytes=meta["size_bytes"],
        acquired_at=meta["acquired_at"], artifact=artifact, metadata=meta,
    )