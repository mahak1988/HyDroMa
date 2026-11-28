"""Registry tests: identity, immutability, validation, forbidden tooling."""

import dataclasses

import pytest

from ai_workforce.permissions import PermissionScope
from ai_workforce.policy import ActionLimits, EscalationStep
from ai_workforce.registry import (
    AgentDefinition,
    AgentRegistry,
    DATA_CLASSIFICATION_LEVELS,
    DeprecatedAgentError,
    DuplicateAgentError,
    FORBIDDEN_TOOL_PATTERNS,
    InvalidAgentDefinition,
    UnknownAgentError,
)


def test_valid_definition_registers_and_resolves(analyst):
    registry = AgentRegistry()
    stored = registry.register(analyst)
    assert stored.identity == "analyst.demo@1.0.0"
    resolved = registry.resolve("analyst.demo", "1.0.0")
    assert resolved is stored
    assert registry.resolve("analyst.demo") is stored


def test_duplicate_id_version_rejected(analyst):
    registry = AgentRegistry()
    registry.register(analyst)
    with pytest.raises(DuplicateAgentError):
        registry.register(analyst)


def test_versions_immutable_and_latest_resolution(analyst):
    registry = AgentRegistry()
    registry.register(analyst)
    v110 = dataclasses.replace(analyst, version="1.1.0")
    registry.register(v110)
    assert set(registry.list_identities()) == {
        "analyst.demo@1.0.0",
        "analyst.demo@1.1.0",
    }
    assert registry.resolve("analyst.demo").version == "1.1.0"
    assert registry.resolve("analyst.demo", "1.0.0").version == "1.0.0"


def test_unknown_agent_raises():
    registry = AgentRegistry()
    with pytest.raises(UnknownAgentError):
        registry.resolve("nobody")
    with pytest.raises(UnknownAgentError):
        registry.resolve("nobody", "1.0.0")


@pytest.mark.parametrize(
    "pattern",
    list(FORBIDDEN_TOOL_PATTERNS),
)
def test_financial_tooling_rejected_at_registration(pattern):
    definition = AgentDefinition(
        agent_id="rogue.agent",
        version="1.0.0",
        role="employees",
        purpose="Try to declare a financial tool.",
        permitted_tools=(f"core.{pattern}",),
        permission_scope=PermissionScope(org_ids=frozenset({"org-1"})),
    )
    errors = definition.validate()
    codes = [e["code"] for e in errors]
    assert "TOOL_FORBIDDEN" in codes
    registry = AgentRegistry()
    with pytest.raises(InvalidAgentDefinition) as excinfo:
        registry.register(definition)
    assert "TOOL_FORBIDDEN" in [e["code"] for e in excinfo.value.errors]


def test_tool_pattern_match_is_case_insensitive_substring():
    definition = AgentDefinition(
        agent_id="rogue.agent",
        version="1.0.0",
        role="employees",
        purpose="Try a disguised financial tool id.",
        permitted_tools=("integrations.Wallet-Transfer.v2",),
        permission_scope=PermissionScope(org_ids=frozenset({"org-1"})),
    )
    assert "TOOL_FORBIDDEN" in [e["code"] for e in definition.validate()]


def test_structured_validation_codes():
    bad = AgentDefinition(
        agent_id="Bad ID",
        version="1.0",
        role="wizard",
        purpose="   ",
        permitted_tools=("",),
        permission_scope=PermissionScope(org_ids=frozenset()),
        data_classification="topsecret",
        limits=ActionLimits(max_actions_per_session=-5),
        escalation_path=(EscalationStep(description="", target="nobody"),),
    )
    codes = {e["code"] for e in bad.validate()}
    assert {
        "AGENT_ID_INVALID",
        "VERSION_INVALID",
        "ROLE_UNKNOWN",
        "PURPOSE_MISSING",
        "TOOL_ENTRY_INVALID",
        "SCOPE_ORG_REQUIRED",
        "DATA_CLASSIFICATION_UNKNOWN",
        "LIMITS_INVALID",
        "ESCALATION_STEP_INVALID",
    } <= codes


def test_privileged_roles_require_escalation(manager, analyst):
    assert analyst.validate() == []
    no_escalation = dataclasses.replace(manager, escalation_path=())
    codes = [e["code"] for e in no_escalation.validate()]
    assert "ESCALATION_REQUIRED" in codes
    # infrastructure roles are privileged too
    gateway_agent = AgentDefinition(
        agent_id="gateway.main",
        version="1.0.0",
        role="model-gateway",
        purpose="Single egress point to LLM providers (contract only).",
        permitted_tools=(),
        permission_scope=PermissionScope(),
        escalation_path=(),
    )
    assert "ESCALATION_REQUIRED" in [e["code"] for e in gateway_agent.validate()]
    # analyst (non-privileged) needs no org exemption and no escalation
    assert analyst.role == "analyst"


def test_infrastructure_roles_exempt_from_org_scope():
    registry_agent = AgentDefinition(
        agent_id="registry.main",
        version="1.0.0",
        role="agent-registry",
        purpose="Manage agent definitions, versions and tool allowlists.",
        permitted_tools=(),
        permission_scope=PermissionScope(),
        escalation_path=(EscalationStep(description="Escalate to owner", target="owner"),),
    )
    assert registry_agent.validate() == []


def test_deprecation_blocks_resolution_until_allowed(analyst):
    registry = AgentRegistry()
    registry.register(analyst)
    registry.deprecate("analyst.demo", "1.0.0", "superseded by 1.1.0")
    assert registry.is_deprecated("analyst.demo", "1.0.0")
    with pytest.raises(DeprecatedAgentError):
        registry.resolve("analyst.demo", "1.0.0")
    assert registry.resolve("analyst.demo", "1.0.0", allow_deprecated=True) is analyst


def test_definition_is_frozen(analyst):
    with pytest.raises(dataclasses.FrozenInstanceError):
        analyst.role = "administrator"


def test_to_dict_round_trip_shape(analyst):
    payload = analyst.to_dict()
    assert payload["agent_id"] == "analyst.demo"
    assert payload["version"] == "1.0.0"
    assert payload["permission_scope"]["org_ids"] == ["org-1"]
    assert payload["limits"]["max_actions_per_session"] == 100
    assert payload["escalation_path"] == []


def test_data_classification_vocabulary():
    assert DATA_CLASSIFICATION_LEVELS == {"public", "internal", "confidential", "restricted"}
