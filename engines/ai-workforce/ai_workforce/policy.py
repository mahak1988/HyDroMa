"""Action limits, escalation policy and the permanent financial-tooling ban.

Hard rule (AGENTS.md; engines/ai-workforce/README.md): no agent is connected
to payment, wallet, token or financial execution tooling, and no agent may
spend. `evaluate_action` denies `spend` / `touch_finance` for every role,
always — there is no configuration that turns this off in this phase.

Escalation: privileged roles (administrator, manager, model-gateway,
agent-registry) must declare a non-empty escalation path to a human
(`owner` / `human-operator`) or a governed role.

Part of the ai-workforce engine governance layer (ADR-0013). Stdlib-only.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import FrozenSet, List, Optional, Tuple

from .permissions import ROLES

FINANCIAL_ACTIONS: FrozenSet[str] = frozenset({"spend", "touch_finance"})

PRIVILEGED_ROLES: FrozenSet[str] = frozenset(
    {"administrator", "manager", "model-gateway", "agent-registry"}
)

# A non-agent escalation target is always a human authority.
HUMAN_ESCALATION_TARGETS: FrozenSet[str] = frozenset({"owner", "human-operator"})


@dataclass(frozen=True)
class ActionLimits:
    """Declared action budget of one agent.

    `None` means "unlimited within the governance plane, every use recorded";
    `0` means "none allowed". There is intentionally NO spending-limit field:
    spending is not limited, it is forbidden — a limit would imply it can be
    configured to a positive amount.
    """

    max_actions_per_session: Optional[int] = None
    max_tool_calls_per_action: Optional[int] = None

    def validate(self) -> List[Dict[str, str]]:
        errors: List[Dict[str, str]] = []
        for name in ("max_actions_per_session", "max_tool_calls_per_action"):
            value = getattr(self, name)
            if value is None:
                continue
            if not isinstance(value, int) or isinstance(value, bool) or value < 0:
                errors.append(
                    {
                        "code": "LIMITS_INVALID",
                        "message": f"{name} must be None (unlimited, recorded) or a non-negative integer; got {value!r}.",
                    }
                )
        return errors

    def to_dict(self) -> dict:
        return {
            "max_actions_per_session": self.max_actions_per_session,
            "max_tool_calls_per_action": self.max_tool_calls_per_action,
        }


@dataclass(frozen=True)
class EscalationStep:
    """One hop of an agent's escalation path."""

    description: str
    target: str  # a governed role, "owner" or "human-operator"

    def validate(self) -> List[Dict[str, str]]:
        errors: List[Dict[str, str]] = []
        valid_targets = frozenset(ROLES) | HUMAN_ESCALATION_TARGETS
        if not self.description or not self.description.strip():
            errors.append(
                {
                    "code": "ESCALATION_STEP_INVALID",
                    "message": "Escalation step needs a non-empty description.",
                }
            )
        if self.target not in valid_targets:
            errors.append(
                {
                    "code": "ESCALATION_STEP_INVALID",
                    "message": f"Escalation target '{self.target}' is not a governed role or a human authority.",
                }
            )
        return errors


@dataclass(frozen=True)
class PolicyDecision:
    """Structured result of a policy evaluation (independent of permissions)."""

    decision: str  # "ALLOW" | "DENY"
    codes: Tuple[str, ...]
    reasons: Tuple[str, ...]

    def to_dict(self) -> dict:
        return {
            "decision": self.decision,
            "codes": list(self.codes),
            "reasons": list(self.reasons),
        }


def evaluate_action(role: str, action: str, limits: ActionLimits) -> PolicyDecision:
    """Evaluate the policy layer for one (role, action) pair.

    This layer is role-agnostic on purpose: financial tooling is denied for
    every role, and an exhausted action budget denies every action. Role-level
    grants are the permissions layer's job (`permissions.check_permission`).
    """
    codes: List[str] = []
    reasons: List[str] = []
    if action in FINANCIAL_ACTIONS:
        codes.append("FINANCE_TOOLING_FORBIDDEN")
        reasons.append(
            "Financial tooling and spending are forbidden for every agent in this "
            "phase (AGENTS.md; engines/ai-workforce/README.md)."
        )
    if limits.max_actions_per_session == 0:
        codes.append("ACTION_BUDGET_EXHAUSTED")
        reasons.append(
            "The agent declares max_actions_per_session=0; no action may be taken."
        )
    limits_errors = limits.validate()
    if limits_errors:
        codes.append("LIMITS_INVALID")
        reasons.extend(e["message"] for e in limits_errors)
    if codes:
        return PolicyDecision("DENY", tuple(codes), tuple(reasons))
    return PolicyDecision(
        "ALLOW",
        ("POLICY_OK",),
        (
            "Action is within declared limits and involves no financial tooling; "
            "the execution plane remains NOT_ACTIVE regardless of this decision.",
        ),
    )


def requires_escalation(role: str) -> bool:
    """Privileged roles must declare a non-empty escalation path."""
    return role in PRIVILEGED_ROLES


def validate_escalation_path(role: str, path: Tuple[EscalationStep, ...]) -> List[Dict[str, str]]:
    """Escalation-path requirement for a role. Returns structured errors."""
    errors: List[Dict[str, str]] = []
    if requires_escalation(role) and not path:
        errors.append(
            {
                "code": "ESCALATION_REQUIRED",
                "message": f"Role '{role}' is privileged and must declare a non-empty escalation path.",
            }
        )
    for step in path:
        errors.extend(step.validate())
    return errors
