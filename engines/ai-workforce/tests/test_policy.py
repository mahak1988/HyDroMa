"""Policy tests: financial ban, action limits, escalation requirements."""

import pytest

from ai_workforce.policy import (
    ActionLimits,
    EscalationStep,
    PolicyDecision,
    evaluate_action,
    requires_escalation,
    validate_escalation_path,
)


def test_financial_actions_denied_for_every_role():
    for role in ("analyst", "administrator", "manager", "employees", "model-gateway", "agent-registry"):
        for action in ("spend", "touch_finance"):
            decision = evaluate_action(role, action, ActionLimits())
            assert decision.decision == "DENY"
            assert "FINANCE_TOOLING_FORBIDDEN" in decision.codes


def test_zero_action_budget_denies():
    decision = evaluate_action("analyst", "query_read_models", ActionLimits(max_actions_per_session=0))
    assert decision.decision == "DENY"
    assert "ACTION_BUDGET_EXHAUSTED" in decision.codes


def test_normal_action_allowed_with_documented_caveat():
    decision = evaluate_action("analyst", "query_read_models", ActionLimits(max_actions_per_session=10))
    assert decision.decision == "ALLOW"
    assert decision.codes == ("POLICY_OK",)
    assert any("NOT_ACTIVE" in reason for reason in decision.reasons)


def test_invalid_limits_detected():
    decision = evaluate_action("analyst", "query_read_models", ActionLimits(max_actions_per_session=-1))
    assert decision.decision == "DENY"
    assert "LIMITS_INVALID" in decision.codes
    limits = ActionLimits(max_tool_calls_per_action=-2)
    codes = [e["code"] for e in limits.validate()]
    assert codes == ["LIMITS_INVALID"]


def test_none_means_unlimited_but_recorded():
    limits = ActionLimits()
    assert limits.validate() == []
    assert limits.to_dict() == {
        "max_actions_per_session": None,
        "max_tool_calls_per_action": None,
    }


def test_bool_rejected_as_limit():
    limits = ActionLimits(max_actions_per_session=True)
    assert [e["code"] for e in limits.validate()] == ["LIMITS_INVALID"]


def test_escalation_required_for_privileged_roles():
    assert requires_escalation("administrator")
    assert requires_escalation("manager")
    assert requires_escalation("model-gateway")
    assert requires_escalation("agent-registry")
    assert not requires_escalation("analyst")
    assert not requires_escalation("employees")


def test_validate_escalation_path():
    errors = validate_escalation_path("manager", ())
    assert [e["code"] for e in errors] == ["ESCALATION_REQUIRED"]
    ok = (EscalationStep(description="Escalate to owner", target="owner"),)
    assert validate_escalation_path("manager", ok) == []
    bad_target = (EscalationStep(description="x", target="another-agent"),)
    assert [e["code"] for e in validate_escalation_path("manager", bad_target)] == [
        "ESCALATION_STEP_INVALID"
    ]
    empty_desc = (EscalationStep(description="  ", target="owner"),)
    assert validate_escalation_path("analyst", empty_desc) != []


def test_policy_decision_serializable():
    decision = PolicyDecision("ALLOW", ("POLICY_OK",), ("fine",))
    assert decision.to_dict() == {
        "decision": "ALLOW",
        "codes": ["POLICY_OK"],
        "reasons": ["fine"],
    }
