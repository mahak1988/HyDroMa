"""Shared test fixtures for the ai-workforce governance suite."""

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(__file__))

from ai_workforce.permissions import PermissionScope  # noqa: E402
from ai_workforce.policy import ActionLimits, EscalationStep  # noqa: E402
from ai_workforce.registry import AgentDefinition  # noqa: E402


@pytest.fixture
def analyst():
    """A minimal valid analyst agent bound to one org."""
    return AgentDefinition(
        agent_id="analyst.demo",
        version="1.0.0",
        role="analyst",
        purpose="Run read-only HyDroMA analyses and produce reports.",
        permitted_tools=("hydroma.query_models", "hydroma.run_analysis"),
        permission_scope=PermissionScope(org_ids=frozenset({"org-1"}), domains=frozenset({"water"})),
        data_classification="internal",
        limits=ActionLimits(max_actions_per_session=100),
        escalation_path=(),
    )


@pytest.fixture
def manager():
    """A valid manager agent with a mandatory escalation path."""
    return AgentDefinition(
        agent_id="manager.demo",
        version="1.0.0",
        role="manager",
        purpose="Plan and route approvals for one org.",
        permitted_tools=("planner.plan",),
        permission_scope=PermissionScope(org_ids=frozenset({"org-1"})),
        data_classification="confidential",
        limits=ActionLimits(max_actions_per_session=50),
        escalation_path=(EscalationStep(description="Route to owner", target="owner"),),
    )
