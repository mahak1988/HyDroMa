"""Runtime source registry."""

import json
from pathlib import Path
from typing import Any

from edi.errors import InvalidConfiguration, InvalidContract

ACCESS_STATUSES = ("OPERATIONAL", "PARTIAL", "BLOCKED", "UNTESTED")
EVIDENCE_STATUSES = ("DOCUMENTED", "OBSERVED_ACCESS", "ACQUIRED", "NOT_TESTED")
AUTHORIZATION_STATUSES = ("AUTHORIZED", "REQUIRES_AUTHORIZATION", "RESTRICTED", "UNKNOWN")


class SourceRegistry:
    def __init__(self, sources: list[dict[str, Any]]):
        self._sources: dict[str, dict[str, Any]] = {}
        for source in sources:
            source_id = source.get("source_id")
            if not source_id:
                raise InvalidContract("source missing source_id")
            if source_id in self._sources:
                raise InvalidConfiguration(
                    "duplicate source_id",
                    {"source_id": source_id},
                )
            self._validate_source(source)
            self._sources[source_id] = source

    def _validate_source(self, source: dict[str, Any]) -> None:
        for field in ("source_id", "provider", "product", "access_status", "evidence_status", "authorization_status"):
            if field not in source:
                raise InvalidContract("source missing field", {"field": field})
        if source["access_status"] not in ACCESS_STATUSES:
            raise InvalidContract("invalid access_status", {"value": source["access_status"]})
        if source["evidence_status"] not in EVIDENCE_STATUSES:
            raise InvalidContract("invalid evidence_status", {"value": source["evidence_status"]})
        if source["authorization_status"] not in AUTHORIZATION_STATUSES:
            raise InvalidContract("invalid authorization_status", {"value": source["authorization_status"]})
        if source["evidence_status"] == "ACQUIRED" and source["access_status"] not in ("OPERATIONAL", "PARTIAL"):
            raise InvalidContract("ACQUIRED source must be OPERATIONAL or PARTIAL")
        if source["access_status"] == "BLOCKED" and source["authorization_status"] not in ("REQUIRES_AUTHORIZATION", "RESTRICTED"):
            raise InvalidContract("BLOCKED source must require authorization or be restricted")

    def get(self, source_id: str) -> dict[str, Any]:
        try:
            return self._sources[source_id]
        except KeyError as exc:
            raise InvalidContract(
                "unknown source_id",
                {"source_id": source_id},
            ) from exc

    def all(self) -> list[dict[str, Any]]:
        return list(self._sources.values())

    def is_authorized(self, source_id: str) -> bool:
        source = self.get(source_id)
        return source.get("authorization_status") == "AUTHORIZED"

    def allowed_domains(self) -> tuple[str, ...]:
        domains = set()
        for source in self._sources.values():
            for domain in source.get("allowed_domains", []):
                domains.add(domain)
        return tuple(sorted(domains))


def load_source_registry(path: str | Path) -> SourceRegistry:
    path = Path(path)
    if not path.exists():
        raise InvalidConfiguration("source registry not found", {"path": str(path)})
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise InvalidContract("invalid source registry JSON") from exc
    if isinstance(data, dict):
        sources = data.get("sources")
    else:
        sources = data
    if not isinstance(sources, list):
        raise InvalidContract("source registry must be a list or contain sources")
    return SourceRegistry(sources)