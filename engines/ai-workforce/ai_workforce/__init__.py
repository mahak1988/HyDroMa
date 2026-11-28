"""engines/ai-workforce — agent governance layer (registry, permissions,
audit chain, policy, model-gateway contract).

Software status: implemented and tested (pytest suite in `engines/ai-workforce/tests`).
Capability status: the governance plane is ACTIVE; the execution plane is
NOT_ACTIVE — no agent is connected to any tool or LLM provider, and payment,
wallet, token or financial-execution tooling is forbidden for every agent
(AGENTS.md; ADR-0013). See `engines/ai-workforce/README.md` for the full contract.
"""

from __future__ import annotations

CAPABILITY_STATUS = {
    "governance_plane": "ACTIVE",
    "execution_plane": "NOT_ACTIVE",
    "llm_connectivity": "NOT_CONNECTED",
    "payment_tooling": "FORBIDDEN",
}

__version__ = "0.1.0"

from .audit import (  # noqa: E402
    AuditEntry,
    AuditError,
    AuditLog,
    EVENT_TYPES,
    GENESIS_HASH,
    sha256_json,
)
from .gateway import (  # noqa: E402
    GatewayNotConnected,
    InvalidTokenUsage,
    ProviderKeyRejected,
    RedactionRule,
    REDACTION_RULES,
    SECRET_KEY_NAMES,
    TokenUsageRecord,
    assert_no_provider_secrets,
    call_provider,
    redact,
)
from .permissions import (  # noqa: E402
    ACTIONS,
    DATA_CLASSIFICATIONS,
    PermissionScope,
    ROLES,
    ROLE_PERMISSIONS,
    RolePermissions,
    check_permission,
)
from .policy import (  # noqa: E402
    ActionLimits,
    EscalationStep,
    FINANCIAL_ACTIONS,
    PolicyDecision,
    PRIVILEGED_ROLES,
    evaluate_action,
    requires_escalation,
    validate_escalation_path,
)
from .registry import (  # noqa: E402
    AgentDefinition,
    AgentRegistry,
    DATA_CLASSIFICATION_LEVELS,
    DeprecatedAgentError,
    DuplicateAgentError,
    FORBIDDEN_TOOL_PATTERNS,
    InvalidAgentDefinition,
    RegistryError,
    UnknownAgentError,
)
from .runtime import AgentRuntime, EXECUTION_PLANE_STATUS, GOVERNANCE_PLANE_STATUS  # noqa: E402

__all__ = [
    "CAPABILITY_STATUS",
    "__version__",
    # audit
    "AuditEntry",
    "AuditError",
    "AuditLog",
    "EVENT_TYPES",
    "GENESIS_HASH",
    "sha256_json",
    # gateway
    "GatewayNotConnected",
    "InvalidTokenUsage",
    "ProviderKeyRejected",
    "RedactionRule",
    "REDACTION_RULES",
    "SECRET_KEY_NAMES",
    "TokenUsageRecord",
    "assert_no_provider_secrets",
    "call_provider",
    "redact",
    # permissions
    "ACTIONS",
    "DATA_CLASSIFICATIONS",
    "PermissionScope",
    "ROLES",
    "ROLE_PERMISSIONS",
    "RolePermissions",
    "check_permission",
    # policy
    "ActionLimits",
    "EscalationStep",
    "FINANCIAL_ACTIONS",
    "PolicyDecision",
    "PRIVILEGED_ROLES",
    "evaluate_action",
    "requires_escalation",
    "validate_escalation_path",
    # registry
    "AgentDefinition",
    "AgentRegistry",
    "DATA_CLASSIFICATION_LEVELS",
    "DeprecatedAgentError",
    "DuplicateAgentError",
    "FORBIDDEN_TOOL_PATTERNS",
    "InvalidAgentDefinition",
    "RegistryError",
    "UnknownAgentError",
    # runtime
    "AgentRuntime",
    "EXECUTION_PLANE_STATUS",
    "GOVERNANCE_PLANE_STATUS",
]
