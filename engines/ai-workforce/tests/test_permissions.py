"""Permission tests: the six-role governance table is fail-closed."""

import pytest

from ai_workforce.permissions import (
    ACTIONS,
    ROLES,
    ROLE_PERMISSIONS,
    PermissionScope,
    check_permission,
)


def test_role_table_matches_governance_doc():
    assert set(ROLES) == {
        "analyst",
        "administrator",
        "manager",
        "employees",
        "model-gateway",
        "agent-registry",
    }
    assert ROLE_PERMISSIONS["analyst"].allowed_actions == {
        "query_read_models",
        "run_hydroma_analysis",
        "produce_reports",
    }
    assert ROLE_PERMISSIONS["analyst"].forbidden_actions == {"mutate_domain_records"}
    assert ROLE_PERMISSIONS["administrator"].allowed_actions == {"manage_users_in_scope"}
    assert ROLE_PERMISSIONS["administrator"].forbidden_actions == {
        "touch_finance",
        "change_permissions_beyond_grant",
    }
    assert ROLE_PERMISSIONS["manager"].allowed_actions == {
        "plan",
        "summarize",
        "route_approvals",
    }
    assert ROLE_PERMISSIONS["manager"].forbidden_actions == {
        "approve_own_proposal",
        "spend",
    }
    assert ROLE_PERMISSIONS["employees"].allowed_actions == {"execute_scoped_task"}
    assert ROLE_PERMISSIONS["employees"].forbidden_actions == {"cross_domain_access"}
    assert ROLE_PERMISSIONS["model-gateway"].allowed_actions == {
        "llm_egress_call",
        "token_cost_accounting",
        "redact_content",
    }
    assert ROLE_PERMISSIONS["model-gateway"].forbidden_actions == {"expose_provider_keys"}
    assert ROLE_PERMISSIONS["agent-registry"].allowed_actions == {"manage_agent_definitions"}
    assert ROLE_PERMISSIONS["agent-registry"].forbidden_actions == {
        "grant_permissions_beyond_policy",
    }


def test_analyst_allowed_and_denied():
    assert check_permission("analyst", "run_hydroma_analysis")["allowed"] is True
    decision = check_permission("analyst", "mutate_domain_records")
    assert decision["allowed"] is False
    assert decision["code"] == "ROLE_FORBIDDEN_ACTION"


def test_ungranted_action_is_denied_not_crashed():
    # 'plan' is a manager action; the analyst has no grant for it.
    decision = check_permission("analyst", "plan")
    assert decision["allowed"] is False
    assert decision["code"] == "ROLE_ACTION_NOT_GRANTED"


def test_fail_closed_unknown_role_and_action():
    assert check_permission("superadmin", "run_hydroma_analysis")["code"] == "UNKNOWN_ROLE"
    assert check_permission("analyst", "deploy_to_production")["code"] == "UNKNOWN_ACTION"
    assert check_permission("superadmin", "deploy_to_production")["code"] == "UNKNOWN_ROLE"


def test_financial_actions_declared_in_vocabulary():
    assert {"spend", "touch_finance"} <= set(ACTIONS)


def test_scope_coverage():
    scope = PermissionScope(org_ids=frozenset({"org-1", "org-2"}), domains=frozenset({"water"}))
    assert scope.covers_org("org-1")
    assert not scope.covers_org("org-9")
    assert scope.covers_domain("water")
    assert not scope.covers_domain("tourism")
    empty = PermissionScope()
    assert empty.covers_org("org-1") is False
    assert empty.covers_domain("water") is False


def test_scope_round_trip():
    scope = PermissionScope(org_ids=frozenset({"org-1"}), domains=frozenset({"water", "soil"}))
    payload = scope.to_dict()
    assert payload["org_ids"] == ["org-1"]
    assert payload["domains"] == ["soil", "water"]
    rebuilt = PermissionScope.from_dict(payload)
    assert rebuilt == scope


@pytest.mark.parametrize(
    "role,action",
    [
        ("manager", "spend"),
        ("administrator", "touch_finance"),
        ("employees", "cross_domain_access"),
        ("model-gateway", "expose_provider_keys"),
        ("agent-registry", "grant_permissions_beyond_policy"),
    ],
)
def test_explicit_refusals_hold(role, action):
    decision = check_permission(role, action)
    assert decision["allowed"] is False
    assert decision["code"] == "ROLE_FORBIDDEN_ACTION"
