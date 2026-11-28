"""Security policy primitives."""

import ipaddress
import socket
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable
from urllib.parse import urlparse

from edi.errors import SecurityPolicyViolation


@dataclass
class SecurityPolicy:
    allowed_domains: tuple[str, ...] = ()
    require_https: bool = True
    max_file_size: int = 1024 * 1024 * 1024
    max_redirects: int = 3
    allowed_content_types: tuple[str, ...] = (
        "text/csv",
        "application/json",
        "application/x-netcdf",
        "image/tiff",
        "application/x-hdf",
    )
    live_acquisition_enabled: bool = False
    security_tests_passed: bool = False
    provider_authorized: bool = False
    owner_approval: bool = False
    host_resolver: Callable[[str], list] | None = None

    def _resolve_host(self, host: str) -> list[str]:
        try:
            ipaddress.ip_address(host)
            return [host]
        except ValueError:
            pass
        if self.host_resolver is not None:
            result = self.host_resolver(host)
        else:
            result = socket.getaddrinfo(host, None)
        ips: list[str] = []
        for item in result:
            if isinstance(item, tuple) and len(item) >= 5:
                ips.append(str(item[4][0]))
            elif isinstance(item, str):
                ips.append(item)
        return ips

    def validate_connection_target(self, host: str) -> list[str]:
        host = host.rstrip(".")
        if not host:
            raise SecurityPolicyViolation("missing hostname")
        if host == "localhost" or host.endswith(".localhost"):
            raise SecurityPolicyViolation("localhost is not allowed")
        ips = self._resolve_host(host)
        if not ips:
            raise SecurityPolicyViolation("host did not resolve", {"host": host})
        for value in ips:
            try:
                ip = ipaddress.ip_address(value)
            except ValueError as exc:
                raise SecurityPolicyViolation("invalid resolved IP", {"host": host, "ip": value}) from exc
            if (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local
                or ip.is_multicast
                or ip.is_reserved
                or ip.is_unspecified
            ):
                raise SecurityPolicyViolation("unsafe resolved IP", {"host": host, "ip": value})
        return ips

    def validate_url(self, url: str) -> None:
        try:
            parsed = urlparse(url)
            port = parsed.port
        except ValueError as exc:
            raise SecurityPolicyViolation("invalid URL") from exc
        if self.require_https and parsed.scheme != "https":
            raise SecurityPolicyViolation("HTTPS required", {"scheme": parsed.scheme})
        if parsed.username or parsed.password:
            raise SecurityPolicyViolation("credentials in URL are not allowed")
        if port not in (None, 443):
            raise SecurityPolicyViolation("only port 443 is allowed", {"port": port})
        host = (parsed.hostname or "").rstrip(".")
        if not host:
            raise SecurityPolicyViolation("missing hostname")
        if self.allowed_domains and not any(
            host == domain.rstrip(".") or host.endswith("." + domain.rstrip("."))
            for domain in self.allowed_domains
        ):
            raise SecurityPolicyViolation("host is not allowlisted", {"host": host})
        self.validate_connection_target(host)

    def validate_redirect(self, url: str, previous_url: str) -> None:
        self.validate_url(url)
        previous = urlparse(previous_url)
        current = urlparse(url)
        if previous.hostname and current.hostname and previous.hostname != current.hostname:
            self.validate_connection_target(current.hostname)

    def validate_path(self, path: str | Path, root: str | Path) -> Path:
        candidate = Path(path)
        if candidate.is_absolute() or str(path).startswith("\\\\"):
            raise SecurityPolicyViolation("absolute paths are not allowed")
        if ".." in candidate.parts:
            raise SecurityPolicyViolation("path traversal is not allowed")
        root_path = Path(root).resolve()
        resolved = (root_path / candidate).resolve()
        if resolved != root_path and root_path not in resolved.parents:
            raise SecurityPolicyViolation("path escapes root", {"path": str(path)})
        return resolved

    def validate_filename(self, filename: str) -> str:
        if not filename or filename != Path(filename).name:
            raise SecurityPolicyViolation("invalid filename", {"filename": filename})
        if filename in {".", ".."} or "/" in filename or "\\" in filename:
            raise SecurityPolicyViolation("unsafe filename", {"filename": filename})
        return filename

    def check_file_size(self, size: int) -> None:
        if size < 0:
            raise SecurityPolicyViolation("negative file size")
        if size > self.max_file_size:
            raise SecurityPolicyViolation("file exceeds max size", {"size": size, "max": self.max_file_size})

    def validate_content_type(self, content_type: str) -> None:
        if content_type.split(";")[0].strip() not in self.allowed_content_types:
            raise SecurityPolicyViolation("content type is not allowed", {"content_type": content_type})

    def check_live_acquisition_gate(self) -> None:
        if not self.live_acquisition_enabled:
            raise SecurityPolicyViolation("live acquisition is disabled")
        if not self.security_tests_passed:
            raise SecurityPolicyViolation("security tests have not passed")
        if not self.provider_authorized:
            raise SecurityPolicyViolation("provider is not authorized")
        if not self.owner_approval:
            raise SecurityPolicyViolation("owner approval is required")


def redact(text: str) -> str:
    import re

    text = re.sub(
        r"(?i)(authorization|token|key|secret|password|cookie)\s*[:=]\s*[^;]+",
        r"\1=[REDACTED]",
        text,
    )
    return text