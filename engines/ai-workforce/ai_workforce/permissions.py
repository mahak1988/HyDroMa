"""Role model and permission scopes for the ai-workforce governance plane.

The six governed roles and their allowed / not-allowed actions mirror
`engines/ai-workforce/README.md` exactly. Every check is fail-closed: an
unknown role or unknown action is always denied (`UNKNOWN_ROLE` /
`UNKNOWN_ACTION`), never silently allowed.

Part of the ai-workforce engine governance layer (ADR-0013). Stdlib-only;
no third-party dependency; never imports `apps/*` or `services/*`.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, FrozenSet, Tuple

ROLES: Tuple[str, ...] = (
    "analyst",
    "administrator",
    "manager",
    "employees",
    "model-gateway",
    "agent-registry",
)

# Data classifications an agent may be granted read access to.
DATA_CLASSIFICATIONS: Tuple[str, ...] = (
    "public",
    "internal",
    "confidential",
    "restricted",
)

# Canonical action vocabulary. Each id maps to one cell of the role table in
# engines/ai-workforce/README.md.
ACTIONS: Tuple[str, ...] = (
    # analyst
    "query_read_models",
    "run_hydroma_analysis",
    "produce_reports",
    # administrator
    "manage_users_in_scope",
    # manager
    "plan",
    "summarize",
    "route_approvals",
    # employees
    "execute_scoped_task",
    # model-gateway
    "llm_egress_call",
    "token_cost_accounting",
    "redact_content",
    # agent-registry
    "manage_agent_definitions",
    # explicitly governed refusals (declared so the table is complete)
    "mutate_domain_records",
    "touch_finance",
    "change_permissions_beyond_grant",
    "approve_own_proposal",
    "spend",
    "cross_domain_access",
    "expose_provider_keys",
    "grant_permissions_beyond_policy",
)


@dataclass(frozen=True)
class RolePermissions:
    """One row of the governance table: allowed and not-allowed actions."""

    role: str
    allowed_actions: FrozenSet[str] = frozenset()
    forbidden_actions: FrozenSet[str] = frozenset()


ROLE_PERMISSIONS: Dict[str, RolePermissions] = {
    "analyst": RolePermissions(
        role="analyst",
        allowed_actions=frozenset(
            {"query_read_models", "run_hydroma_analysis", "produce_reports"}
        ),
        forbidden_actions=frozenset({"mutate_domain_records"}),
    ),
    "administrator": RolePermissions(
        role="administrator",
        allowed_actions=frozenset({"manage_users_in_scope"}),
        forbidden_actions=frozenset(
            {"touch_finance", "change_permissions_beyond_grant"}
        ),
    ),
    "manager": RolePermissions(
        role="manager",
        allowed_actions=frozenset({"plan", "summarize", "route_approvals"}),
        forbidden_actions=frozenset({"approve_own_proposal", "spend"}),
    ),
    "employees": RolePermissions(
        role="employees",
        allowed_actions=frozenset({"execute_scoped_task"}),
        forbidden_actions=frozenset({"cross_domain_access"}),
    ),
    "model-gateway": RolePermissions(
        role="model-gateway",
        allowed_actions=frozenset(
            {"llm_egress_call", "token_cost_accounting", "redact_content"}
        ),
        forbidden_actions=frozenset({"expose_provider_keys"}),
    ),
    "agent-registry": RolePermissions(
        role="agent-registry",
        allowed_actions=frozenset({"manage_agent_definitions"}),
        forbidden_actions=frozenset({"grant_permissions_beyond_policy"}),
    ),
}


@dataclass(frozen=True)
class PermissionScope:
    """Org/record scope of an agent (multi-tenancy default: org-scoped).

    An empty `org_ids` means no organization grant; an empty `domains` means
    no domain grant. Absence of a grant is never interpreted as broad access.
    """

    org_ids: FrozenSet[str] = frozenset()
    domains: FrozenSet[str] = frozenset()

    def covers_org(self, org_id: str) -> bool:
        return org_id in self.org_ids

    def covers_domain(self, domain: str) -> bool:
        return domain in self.domains

    def to_dict(self) -> Dict[str, object]:
        return {
            "org_ids": sorted(self.org_ids),
            "domains": sorted(self.domains),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, object]) -> "PermissionScope":
        return cls(
            org_ids=frozenset(str(x) for x in (data.get("org_ids") or [])),
            domains=frozenset(str(x) for x in (data.get("domains") or [])),
        )


def check_permission(role: str, action: str) -> Dict[str, object]:
    """Fail-closed permission decision for a (role, action) pair.

    Returns a structured dict with `allowed`, `code` and `reason`. Unknown
    roles and unknown actions are denied with `UNKNOWN_ROLE`/`UNKNOWN_ACTION`.
    """
    if role not in ROLE_PERMISSIONS:
        return {
            "allowed": False,
            "role": role,
            "action": action,
            "code": "UNKNOWN_ROLE",
            "reason": "Role is not one of the six governed roles; denied by default.",
        }
    if action not in ACTIONS:
        return {
            "allowed": False,
            "role": role,
            "action": action,
            "code": "UNKNOWN_ACTION",
            "reason": "Action is not part of the governed action vocabulary; denied by default.",
        }
    perms = ROLE_PERMISSIONS[role]
    if action in perms.forbidden_actions:
        return {
            "allowed": False,
            "role": role,
            "action": action,
            "code": "ROLE_FORBIDDEN_ACTION",
            "reason": f"Role '{role}' is explicitly not allowed to perform '{action}' "
            "(engines/ai-workforce/README.md governance table).",
        }
    if action in perms.allowed_actions:
        return {
            "allowed": True,
            "role": role,
            "action": action,
            "code": "ROLE_ACTION_ALLOWED",
            "reason": f"Role '{role}' is allowed to perform '{action}'.",
        }
    return {
        "allowed": False,
        "role": role,
        "action": action,
        "code": "ROLE_ACTION_NOT_GRANTED",
        "reason": f"Role '{role}' has no grant for '{action}'; ungranted actions are denied.",
    }
