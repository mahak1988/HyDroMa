"""Runtime tests: governance decisions audited; execution plane refuses."""

import pytest

from ai_workforce.audit import AuditLog
from ai_workforce.permissions import PermissionScope
from ai_workforce.policy import ActionLimits, EscalationStep
from ai_workforce.registry import (
    AgentDefinition,
    AgentRegistry,
    InvalidAgentDefinition,
    UnknownAgentError,
)
from ai_workforce.runtime import (
    EXECUTION_PLANE_STATUS,
    GOVERNANCE_PLANE_STATUS,
    AgentRuntime,
)


def _gateway_agent():
    return AgentDefinition(
        agent_id="gateway.main",
        version="1.0.0",
        role="model-gateway",
        purpose="Single egress point to LLM providers (contract only).",
        permitted_tools=("gateway.record_usage",),
        permission_scope=PermissionScope(),
        escalation_path=(EscalationStep(description="Escalate to owner", target="owner"),),
    )


def test_capability_status_is_honest():
    runtime = AgentRuntime()
    status = runtime.capability_status()
    assert status["governance_plane"] == GOVERNANCE_PLANE_STATUS == "ACTIVE"
    assert status["execution_plane"] == EXECUTION_PLANE_STATUS == "NOT_ACTIVE"
    assert status["llm_connectivity"] == "NOT_CONNECTED"
    assert status["payment_tooling"] == "FORBIDDEN"


def test_register_and_allow_decision(analyst):
    runtime = AgentRuntime()
    runtime.register_agent(analyst)
    result = runtime.decide("analyst.demo", "run_hydroma_analysis", version="1.0.0")
    assert result["decision"] == "ALLOW"
    assert result["codes"] == ["PERMISSION_OK"]
    assert result["execution_plane"] == "NOT_ACTIVE"


def test_denied_decision_for_forbidden_action(analyst):
    runtime = AgentRuntime()
    runtime.register_agent(analyst)
    result = runtime.decide("analyst.demo", "mutate_domain_records")
    assert result["decision"] == "DENY"
    assert "ROLE_FORBIDDEN_ACTION" in result["codes"]


def test_financial_action_denied_even_for_manager(manager):
    runtime = AgentRuntime()
    runtime.register_agent(manager)
    result = runtime.decide("manager.demo", "spend")
    assert result["decision"] == "DENY"
    assert "FINANCE_TOOLING_FORBIDDEN" in result["codes"]


def test_scope_checks_deny_outside_org(analyst):
    runtime = AgentRuntime()
    runtime.register_agent(analyst)
    inside = runtime.decide(
        "analyst.demo", "run_hydroma_analysis", requested_org="org-1", requested_domain="water"
    )
    assert inside["decision"] == "ALLOW"
    outside = runtime.decide("analyst.demo", "run_hydroma_analysis", requested_org="org-9")
    assert outside["decision"] == "DENY"
    assert "SCOPE_ORG_NOT_COVERED" in outside["codes"]
    domain_out = runtime.decide(
        "analyst.demo", "run_hydroma_analysis", requested_org="org-1", requested_domain="tourism"
    )
    assert "SCOPE_DOMAIN_NOT_COVERED" in domain_out["codes"]


def test_every_decision_audited(analyst):
    runtime = AgentRuntime()
    runtime.register_agent(analyst)
    runtime.decide("analyst.demo", "run_hydroma_analysis")
    runtime.decide("analyst.demo", "mutate_domain_records")
    events = [e.event_type for e in runtime.audit_log.entries]
    assert events == [
        "AGENT_REGISTERED",
        "PERMISSION_DECISION",
        "PERMISSION_DECISION",
    ]
    assert runtime.audit_log.verify()["valid"] is True


def test_invalid_registration_audited():
    runtime = AgentRuntime()
    bad = AgentDefinition(agent_id="Bad", version="1.0.0", role="analyst", purpose="x")
    with pytest.raises(InvalidAgentDefinition):
        runtime.register_agent(bad)
    events = [e.event_type for e in runtime.audit_log.entries]
    assert events == ["REGISTRY_VALIDATION_FAILED"]


def test_execute_tool_always_refuses_even_for_permitted_tool(analyst):
    runtime = AgentRuntime()
    runtime.register_agent(analyst)
    result = runtime.execute_tool("analyst.demo", "hydroma.run_analysis")
    assert result["executed"] is False
    assert result["code"] == "AGENT_EXECUTION_NOT_ACTIVE"
    events = [e.event_type for e in runtime.audit_log.entries]
    assert events[-1] == "EXECUTION_REFUSED"


def test_execute_tool_not_in_allowlist(analyst):
    runtime = AgentRuntime()
    runtime.register_agent(analyst)
    result = runtime.execute_tool("analyst.demo", "unlisted.tool")
    assert result["executed"] is False
    assert result["code"] == "TOOL_NOT_PERMITTED"


def test_execute_tool_unknown_agent_raises():
    runtime = AgentRuntime()
    with pytest.raises(UnknownAgentError):
        runtime.execute_tool("nobody", "any.tool")


def test_token_usage_recorded_and_audited():
    runtime = AgentRuntime()
    runtime.register_agent(_gateway_agent())
    payload = runtime.record_token_usage(
        "gateway.main",
        provider="local",
        model="demo",
        input_tokens=10,
        output_tokens=5,
        timestamp_utc="2026-11-29T00:00:00+00:00",
    )
    assert payload["input_tokens"] == 10
    events = [e.event_type for e in runtime.audit_log.entries]
    assert "TOKEN_USAGE_RECORDED" in events


def test_redaction_audited():
    runtime = AgentRuntime()
    result = runtime.redact_content("Authorization: Bearer abcdefghijklmnop")
    assert result["changed"] is True
    events = [e.event_type for e in runtime.audit_log.entries]
    assert events == ["GATEWAY_REDACTED"]


def test_gateway_config_rejection():
    runtime = AgentRuntime()
    with pytest.raises(Exception):
        runtime.check_gateway_config({"api_key": "x"})
    # nothing audited: the rejection happens before any state is stored
    assert len(runtime.audit_log) == 0


def test_deprecation_via_runtime(analyst):
    from ai_workforce.registry import DeprecatedAgentError

    runtime = AgentRuntime()
    runtime.register_agent(analyst)
    runtime.deprecate_agent("analyst.demo", "1.0.0", "superseded")
    with pytest.raises(DeprecatedAgentError):
        runtime.decide("analyst.demo", "query_read_models")
    # the refusal to resolve a deprecated agent is also audited upstream of the
    # decision; the audit chain must stay valid
    assert runtime.audit_log.verify()["valid"] is True


def test_shared_audit_log_stays_valid():
    runtime = AgentRuntime()
    runtime.register_agent(_gateway_agent())
    runtime.decide("gateway.main", "llm_egress_call")
    runtime.execute_tool("gateway.main", "gateway.record_usage")
    runtime.execute_tool("gateway.main", "other.tool")
    report = runtime.audit_log.verify()
    assert report["valid"] is True
    assert report["entries"] == 4
    types = [e.event_type for e in runtime.audit_log.entries]
    assert types == [
        "AGENT_REGISTERED",
        "PERMISSION_DECISION",
        "EXECUTION_REFUSED",
        "TOOL_NOT_PERMITTED",
    ]
