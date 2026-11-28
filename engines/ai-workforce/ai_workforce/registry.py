"""Agent definitions and the versioned agent registry.

The registry is the single authority for agent identity: an agent is
`agent_id@version`; a registered version is immutable (definitions are frozen
dataclasses and the registry stores exactly the validated instance). New
capability means a new version — never an in-place edit.

Validation is structured and fail-closed. Financial tooling is rejected at
registration: any permitted tool whose id matches a forbidden pattern
(payment / wallet / token transfer / financial execution / ...) is a hard
error `TOOL_FORBIDDEN`, never a warning.

Part of the ai-workforce engine governance layer (ADR-0013). Stdlib-only.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, FrozenSet, List, Optional, Tuple

from .permissions import ROLES, DATA_CLASSIFICATIONS, PermissionScope
from .policy import ActionLimits, EscalationStep, validate_escalation_path

AGENT_ROLES: FrozenSet[str] = frozenset(ROLES)

INFRASTRUCTURE_ROLES: FrozenSet[str] = frozenset({"model-gateway", "agent-registry"})

DATA_CLASSIFICATION_LEVELS: FrozenSet[str] = frozenset(DATA_CLASSIFICATIONS)

# Tool ids matching any of these substrings (case-insensitive) connect an
# agent to money movement and are rejected at registration.
FORBIDDEN_TOOL_PATTERNS: Tuple[str, ...] = (
    "payment",
    "wallet",
    "token-transfer",
    "financial-execution",
    "finance-execution",
    "crypto-transfer",
    "banking",
    "checkout",
)

_AGENT_ID_RE = re.compile(r"^[a-z][a-z0-9._-]{2,63}$")
_VERSION_RE = re.compile(r"^\d+\.\d+\.\d+$")


class RegistryError(RuntimeError):
    """Base class for registry failures."""


class InvalidAgentDefinition(RegistryError):
    """A definition failed validation; `.errors` carries the structured list."""

    def __init__(self, errors: List[Dict[str, str]]) -> None:
        self.errors = list(errors)
        codes = ", ".join(e["code"] for e in self.errors)
        super().__init__(f"INVALID_AGENT_DEFINITION: {codes}")


class DuplicateAgentError(RegistryError):
    """An `id@version` pair is already registered; versions are immutable."""


class UnknownAgentError(RegistryError):
    """No definition is registered under the requested identity."""


class DeprecatedAgentError(RegistryError):
    """The resolved version is deprecated and `allow_deprecated` was not set."""


def _version_key(version: str) -> Tuple[int, int, int]:
    parts = version.split(".")
    return tuple(int(p) for p in parts)  # type: ignore[return-value]


@dataclass(frozen=True)
class AgentDefinition:
    """A declared agent: identity, purpose, grants, limits, escalation.

    Every field of the governance contract in engines/ai-workforce/README.md
    is present: purpose, permitted tools, permission scope (org/records),
    data classification it may read, action limits, escalation path. The
    audit trail of its decisions lives in `audit.AuditLog` (runtime wires it).
    """

    agent_id: str
    version: str
    role: str
    purpose: str
    permitted_tools: Tuple[str, ...] = ()
    permission_scope: PermissionScope = PermissionScope()
    data_classification: str = "internal"
    limits: ActionLimits = ActionLimits()
    escalation_path: Tuple[EscalationStep, ...] = ()
    metadata: Dict[str, str] = field(default_factory=dict)

    @property
    def identity(self) -> str:
        return f"{self.agent_id}@{self.version}"

    def validate(self) -> List[Dict[str, str]]:
        errors: List[Dict[str, str]] = []

        def add(code: str, message: str) -> None:
            errors.append({"code": code, "message": message})

        if not isinstance(self.agent_id, str) or not _AGENT_ID_RE.match(self.agent_id):
            add(
                "AGENT_ID_INVALID",
                "agent_id must match ^[a-z][a-z0-9._-]{2,63}$ (3-64 chars).",
            )
        if not isinstance(self.version, str) or not _VERSION_RE.match(self.version):
            add("VERSION_INVALID", "version must be a numeric X.Y.Z string.")
        if self.role not in AGENT_ROLES:
            add(
                "ROLE_UNKNOWN",
                f"role '{self.role}' is not one of the six governed roles {sorted(AGENT_ROLES)}.",
            )
        if not isinstance(self.purpose, str) or not self.purpose.strip():
            add("PURPOSE_MISSING", "purpose must be a non-empty description.")
        for tool in self.permitted_tools:
            if not isinstance(tool, str) or not tool.strip():
                add("TOOL_ENTRY_INVALID", "permitted_tools entries must be non-empty strings.")
                break
        for tool in self.permitted_tools:
            lowered = tool.strip().lower()
            if any(pattern in lowered for pattern in FORBIDDEN_TOOL_PATTERNS):
                add(
                    "TOOL_FORBIDDEN",
                    f"tool '{tool}' matches financial-execution tooling; no agent may declare it "
                    "(AGENTS.md; engines/ai-workforce/README.md).",
                )
        if self.data_classification not in DATA_CLASSIFICATION_LEVELS:
            add(
                "DATA_CLASSIFICATION_UNKNOWN",
                f"data_classification '{self.data_classification}' is not one of "
                f"{sorted(DATA_CLASSIFICATION_LEVELS)}.",
            )
        if (
            self.role not in INFRASTRUCTURE_ROLES
            and not self.permission_scope.org_ids
        ):
            add(
                "SCOPE_ORG_REQUIRED",
                "Domain agents must declare at least one organization scope (multi-tenancy default).",
            )
        errors.extend(self.limits.validate())
        errors.extend(validate_escalation_path(self.role, self.escalation_path))
        return errors

    def to_dict(self) -> dict:
        return {
            "agent_id": self.agent_id,
            "version": self.version,
            "role": self.role,
            "purpose": self.purpose,
            "permitted_tools": list(self.permitted_tools),
            "permission_scope": self.permission_scope.to_dict(),
            "data_classification": self.data_classification,
            "limits": self.limits.to_dict(),
            "escalation_path": [
                {"description": s.description, "target": s.target}
                for s in self.escalation_path
            ],
            "metadata": dict(self.metadata),
        }


class AgentRegistry:
    """Immutable id@version registry. Register-only; no update, no delete."""

    def __init__(self) -> None:
        self._agents: Dict[str, AgentDefinition] = {}
        self._deprecated: Dict[str, str] = {}

    def register(self, definition: AgentDefinition) -> AgentDefinition:
        errors = definition.validate()
        if errors:
            raise InvalidAgentDefinition(errors)
        if definition.identity in self._agents:
            raise DuplicateAgentError(
                f"{definition.identity} is already registered; versions are immutable — "
                "register a new version instead."
            )
        self._agents[definition.identity] = definition
        return definition

    def resolve(
        self,
        agent_id: str,
        version: Optional[str] = None,
        allow_deprecated: bool = False,
    ) -> AgentDefinition:
        if version is not None:
            identity = f"{agent_id}@{version}"
            definition = self._agents.get(identity)
            if definition is None:
                raise UnknownAgentError(identity)
        else:
            identities = [
                k
                for k in self._agents
                if k.split("@", 1)[0] == agent_id
            ]
            if not identities:
                raise UnknownAgentError(agent_id)
            best = max(identities, key=lambda k: _version_key(k.split("@", 1)[1]))
            definition = self._agents[best]
        if not allow_deprecated and definition.identity in self._deprecated:
            raise DeprecatedAgentError(
                f"{definition.identity} is deprecated: {self._deprecated[definition.identity]}"
            )
        return definition

    def deprecate(self, agent_id: str, version: str, reason: str) -> None:
        identity = f"{agent_id}@{version}"
        if identity not in self._agents:
            raise UnknownAgentError(identity)
        self._deprecated[identity] = reason

    def is_deprecated(self, agent_id: str, version: str) -> bool:
        return f"{agent_id}@{version}" in self._deprecated

    def list_identities(self) -> Tuple[str, ...]:
        return tuple(sorted(self._agents.keys()))

    def __len__(self) -> int:
        return len(self._agents)
