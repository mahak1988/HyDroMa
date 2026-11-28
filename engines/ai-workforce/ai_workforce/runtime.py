"""AgentRuntime: the governance plane wired to the audit chain.

Two planes, explicitly separated (ADR-0013):

- **Governance plane — ACTIVE.** Agent registration, permission decisions,
  policy evaluation, scope checks, gateway accounting. Every governance
  outcome is appended to the hash-chained audit log.
- **Execution plane — NOT_ACTIVE.** `execute_tool` ALWAYS refuses with the
  structured code `AGENT_EXECUTION_NOT_ACTIVE` (and `TOOL_NOT_PERMITTED`
  when the tool is not even in the agent's allowlist). No agent is connected
  to any tool, LLM provider or payment infrastructure in this phase;
  activating the execution plane requires an owner decision recorded in a
  new ADR.

Part of the ai-workforce engine governance layer (ADR-0013). Stdlib-only.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from .audit import AuditLog, utc_now_iso
from .gateway import (
    GatewayNotConnected,
    InvalidTokenUsage,
    ProviderKeyRejected,
    TokenUsageRecord,
    assert_no_provider_secrets,
    call_provider,
    redact,
)
from .permissions import PermissionScope, check_permission
from .policy import ActionLimits, EscalationStep, evaluate_action
from .registry import (
    AgentDefinition,
    AgentRegistry,
    DeprecatedAgentError,
    InvalidAgentDefinition,
    RegistryError,
    UnknownAgentError,
)

GOVERNANCE_PLANE_STATUS = "ACTIVE"
EXECUTION_PLANE_STATUS = "NOT_ACTIVE"
LLM_CONNECTIVITY_STATUS = "NOT_CONNECTED"
PAYMENT_TOOLING_STATUS = "FORBIDDEN"

ACTIVATION_REQUIREMENT = (
    "Activating the execution plane or provider egress requires an owner "
    "decision recorded in a new ADR (ADR-0013 non-goal)."
)


class AgentRuntime:
    """Governance-plane runtime. Owns a registry and an audit log."""

    def __init__(
        self,
        registry: Optional[AgentRegistry] = None,
        audit_log: Optional[AuditLog] = None,
    ) -> None:
        self._registry = registry if registry is not None else AgentRegistry()
        self._audit = audit_log if audit_log is not None else AuditLog()

    @property
    def registry(self) -> AgentRegistry:
        return self._registry

    @property
    def audit_log(self) -> AuditLog:
        return self._audit

    def capability_status(self) -> Dict[str, str]:
        """Honest, machine-readable capability banner."""
        return {
            "governance_plane": GOVERNANCE_PLANE_STATUS,
            "execution_plane": EXECUTION_PLANE_STATUS,
            "llm_connectivity": LLM_CONNECTIVITY_STATUS,
            "payment_tooling": PAYMENT_TOOLING_STATUS,
            "activation_requires": ACTIVATION_REQUIREMENT,
        }

    # ------------------------------------------------------------------
    # Governance plane
    # ------------------------------------------------------------------

    def register_agent(self, definition: AgentDefinition) -> AgentDefinition:
        """Validate + register an agent; both outcomes are audited."""
        try:
            stored = self._registry.register(definition)
        except InvalidAgentDefinition as exc:
            self._audit.append(
                "REGISTRY_VALIDATION_FAILED",
                agent_id=definition.agent_id,
                agent_version=definition.version,
                payload={"errors": exc.errors},
            )
            raise
        self._audit.append(
            "AGENT_REGISTERED",
            agent_id=stored.agent_id,
            agent_version=stored.version,
            payload={
                "role": stored.role,
                "permitted_tools": list(stored.permitted_tools),
                "data_classification": stored.data_classification,
                "permission_scope": stored.permission_scope.to_dict(),
            },
        )
        return stored

    def deprecate_agent(self, agent_id: str, version: str, reason: str) -> None:
        self._registry.deprecate(agent_id, version, reason)
        self._audit.append(
            "AGENT_DEPRECATED",
            agent_id=agent_id,
            agent_version=version,
            payload={"reason": reason},
        )

    def decide(
        self,
        agent_id: str,
        action: str,
        version: Optional[str] = None,
        requested_org: Optional[str] = None,
        requested_domain: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Governance decision for one (agent, action, scope) request.

        Combines the permission layer (role table), the policy layer
        (financial ban + limits) and the org/domain scope. The decision is
        about PERMISSION, never about execution: even an ALLOW decision
        leaves the execution plane NOT_ACTIVE.
        """
        definition = self._registry.resolve(agent_id, version)
        codes: List[str] = []
        reasons: List[str] = []

        perm = check_permission(definition.role, action)
        if not perm["allowed"]:
            codes.append(str(perm["code"]))
            reasons.append(str(perm["reason"]))

        policy = evaluate_action(definition.role, action, definition.limits)
        if policy.decision == "DENY":
            codes.extend(policy.codes)
            reasons.extend(policy.reasons)

        if requested_org is not None and not definition.permission_scope.covers_org(
            requested_org
        ):
            codes.append("SCOPE_ORG_NOT_COVERED")
            reasons.append(
                f"Organization '{requested_org}' is not within the agent's scope "
                f"{sorted(definition.permission_scope.org_ids)}."
            )
        if (
            requested_domain is not None
            and not definition.permission_scope.covers_domain(requested_domain)
        ):
            codes.append("SCOPE_DOMAIN_NOT_COVERED")
            reasons.append(
                f"Domain '{requested_domain}' is not within the agent's scope "
                f"{sorted(definition.permission_scope.domains)}."
            )

        allowed = not codes
        result: Dict[str, Any] = {
            "decision": "ALLOW" if allowed else "DENY",
            "agent_id": definition.agent_id,
            "agent_version": definition.version,
            "role": definition.role,
            "action": action,
            "requested_org": requested_org,
            "requested_domain": requested_domain,
            "codes": codes if codes else ["PERMISSION_OK"],
            "reasons": reasons
            if reasons
            else ["Allowed by role table and policy; execution plane remains NOT_ACTIVE."],
            "execution_plane": EXECUTION_PLANE_STATUS,
        }
        self._audit.append(
            "PERMISSION_DECISION",
            agent_id=definition.agent_id,
            agent_version=definition.version,
            payload={
                "action": action,
                "decision": result["decision"],
                "codes": list(result["codes"]),
                "requested_org": requested_org,
                "requested_domain": requested_domain,
            },
        )
        return result

    def record_token_usage(
        self,
        agent_id: str,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        version: Optional[str] = None,
        note: Optional[str] = None,
        cost: Optional[float] = None,
        timestamp_utc: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Accounting record through the gateway contract (no network)."""
        definition = self._registry.resolve(agent_id, version)
        record = TokenUsageRecord(
            provider=provider,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            recorded_at_utc=timestamp_utc or utc_now_iso(),
            note=note,
            cost=cost,
        )
        errors = record.validate()
        if errors:
            raise InvalidTokenUsage(errors)
        self._audit.append(
            "TOKEN_USAGE_RECORDED",
            agent_id=definition.agent_id,
            agent_version=definition.version,
            payload={
                "provider": record.provider,
                "model": record.model,
                "input_tokens": record.input_tokens,
                "output_tokens": record.output_tokens,
            },
        )
        return record.to_dict()

    def redact_content(self, text: str) -> Dict[str, Any]:
        """Gateway redaction, audited (rule names only, never content hashes)."""
        result = redact(text)
        self._audit.append(
            "GATEWAY_REDACTED",
            payload={"applied_rules": result["applied_rules"], "changed": result["changed"]},
        )
        return result

    def check_gateway_config(self, config: Dict[str, Any]) -> None:
        """Reject provider credentials before they are ever stored.

        Raises `ProviderKeyRejected` naming the offending key names.
        """
        assert_no_provider_secrets(config)

    # ------------------------------------------------------------------
    # Execution plane — NOT_ACTIVE
    # ------------------------------------------------------------------

    def execute_tool(
        self,
        agent_id: str,
        tool: str,
        version: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """ALWAYS refuses. There is no code path that executes a tool.

        Refusal order: unknown agent -> `UnknownAgentError`; tool outside the
        agent's allowlist -> `TOOL_NOT_PERMITTED`; otherwise the execution
        plane itself refuses -> `AGENT_EXECUTION_NOT_ACTIVE`. Every refusal is
        audited with the event type it produced.
        """
        definition = self._registry.resolve(agent_id, version)
        if tool not in definition.permitted_tools:
            result: Dict[str, Any] = {
                "executed": False,
                "code": "TOOL_NOT_PERMITTED",
                "agent_id": definition.agent_id,
                "agent_version": definition.version,
                "tool": tool,
                "reason": (
                    f"Tool '{tool}' is not in the allowlist of {definition.identity}; "
                    "the execution plane is also NOT_ACTIVE."
                ),
                "execution_plane": EXECUTION_PLANE_STATUS,
            }
            self._audit.append(
                "TOOL_NOT_PERMITTED",
                agent_id=definition.agent_id,
                agent_version=definition.version,
                payload={"tool": tool},
            )
            return result
        result = {
            "executed": False,
            "code": "AGENT_EXECUTION_NOT_ACTIVE",
            "agent_id": definition.agent_id,
            "agent_version": definition.version,
            "tool": tool,
            "reason": (
                "The tool is in the agent's allowlist, but the execution plane is "
                "NOT_ACTIVE in this phase; no agent is connected to any tool or "
                "provider (ADR-0013)."
            ),
            "execution_plane": EXECUTION_PLANE_STATUS,
        }
        self._audit.append(
            "EXECUTION_REFUSED",
            agent_id=definition.agent_id,
            agent_version=definition.version,
            payload={"tool": tool, "code": result["code"]},
        )
        return result


__all__ = [
    "AgentRuntime",
    "GOVERNANCE_PLANE_STATUS",
    "EXECUTION_PLANE_STATUS",
    "LLM_CONNECTIVITY_STATUS",
    "PAYMENT_TOOLING_STATUS",
    "ACTIVATION_REQUIREMENT",
    # re-exports for callers of the governance layer
    "AgentDefinition",
    "AgentRegistry",
    "AuditLog",
    "ActionLimits",
    "EscalationStep",
    "PermissionScope",
    "RegistryError",
    "UnknownAgentError",
    "DeprecatedAgentError",
    "InvalidAgentDefinition",
    "GatewayNotConnected",
    "ProviderKeyRejected",
    "InvalidTokenUsage",
    "call_provider",
    "redact",
]
