"""Model-gateway contract: redaction, usage accounting, secret rejection.

The `model-gateway` role is the SINGLE egress point to LLM providers. In this
phase the gateway is a contract layer only:

- `redact(text)` applies deterministic, documented redaction rules before any
  content could ever leave the boundary (the governance plane runs it now;
  no provider is contacted).
- `TokenUsageRecord` is the accounting record for token/cost usage —
  record-only, no network, no pricing table invented.
- `assert_no_provider_secrets` rejects configurations that carry provider
  credential fields; the error names the offending KEY, never the value.
- `call_provider` raises `GatewayNotConnected`: provider connectivity is
  NOT_ACTIVE in this phase (ADR-0013). There is no key storage, no network
  client, no retry logic — nothing to leak.

Part of the ai-workforce engine governance layer (ADR-0013). Stdlib-only
(`re` + `hashlib` via the audit module; no HTTP client anywhere).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Mapping, Optional, Tuple

GATEWAY_STATUS = "NOT_CONNECTED"


class GatewayNotConnected(RuntimeError):
    """Provider egress is not active in this phase (ADR-0013)."""


class ProviderKeyRejected(ValueError):
    """A configuration carries provider credential fields.

    The exception message lists offending key NAMES only — credential values
    are never copied into messages, logs or tests.
    """

    def __init__(self, offending_keys: Tuple[str, ...]) -> None:
        self.offending_keys = tuple(offending_keys)
        super().__init__(
            "PROVIDER_KEY_REJECTED: configuration carries credential fields "
            f"{list(self.offending_keys)}; provider keys are never accepted by the "
            "model-gateway contract (ADR-0013)."
        )


class InvalidTokenUsage(ValueError):
    """A token-usage record failed validation; `.errors` is structured."""

    def __init__(self, errors: List[Dict[str, str]]) -> None:
        self.errors = list(errors)
        codes = ", ".join(e["code"] for e in self.errors)
        super().__init__(f"INVALID_TOKEN_USAGE: {codes}")


@dataclass(frozen=True)
class RedactionRule:
    """One deterministic redaction rule (name + regex + replacement)."""

    name: str
    pattern: str
    replacement: str


REDACTION_RULES: Tuple[RedactionRule, ...] = (
    RedactionRule(
        name="PROVIDER_API_KEY",
        pattern=r"\b(?:sk|pk|rk)-[A-Za-z0-9_-]{12,}\b",
        replacement="[REDACTED:PROVIDER_API_KEY]",
    ),
    RedactionRule(
        name="AUTHORIZATION_HEADER",
        pattern=r"(?i)\bauthorization\b\s*[:=]\s*.*",
        replacement="[REDACTED:AUTHORIZATION_HEADER]",
    ),
    RedactionRule(
        name="BEARER_TOKEN",
        pattern=r"(?i)\bbearer\s+[A-Za-z0-9._-]{12,}",
        replacement="[REDACTED:BEARER_TOKEN]",
    ),
)

# Configuration keys that mean "a provider credential is present". Matched
# case-insensitively against top-level keys of a config mapping.
SECRET_KEY_NAMES: Tuple[str, ...] = (
    "api_key",
    "apikey",
    "api-key",
    "secret",
    "secret_key",
    "password",
    "access_token",
    "auth_token",
    "private_key",
)

_SECRET_KEY_SET = frozenset(SECRET_KEY_NAMES)


def redact(text: str) -> Dict[str, Any]:
    """Apply every redaction rule; the input string is never mutated.

    Returns {"redacted", "applied_rules", "changed"}. `applied_rules` lists
    the rule names that matched, in rule order.
    """
    redacted = text
    applied: List[str] = []
    for rule in REDACTION_RULES:
        new_text, count = re.subn(rule.pattern, rule.replacement, redacted)
        if count:
            redacted = new_text
            applied.append(rule.name)
    return {
        "redacted": redacted,
        "applied_rules": applied,
        "changed": bool(applied),
    }


def assert_no_provider_secrets(config: Mapping[str, Any]) -> None:
    """Reject a config that carries provider credential fields.

    Scans top-level keys only (values are never read, logged or copied).
    Raises `ProviderKeyRejected` naming the offending keys.
    """
    offending = tuple(
        sorted(
            str(key)
            for key in config.keys()
            if str(key).strip().lower() in _SECRET_KEY_SET
        )
    )
    if offending:
        raise ProviderKeyRejected(offending)


@dataclass(frozen=True)
class TokenUsageRecord:
    """Accounting record for one would-be (or locally-simulated) LLM usage.

    The gateway records usage for cost accounting without contacting any
    provider: in this phase a record is either a governance-plane ledger entry
    or data about a *future* call. No pricing table is invented; if `cost`
    is present it must be an explicit caller-supplied non-negative number
    with the caller accountable for its source.
    """

    provider: str
    model: str
    input_tokens: int
    output_tokens: int
    recorded_at_utc: str
    note: Optional[str] = None
    cost: Optional[float] = None

    def validate(self) -> List[Dict[str, str]]:
        errors: List[Dict[str, str]] = []

        def add(code: str, message: str) -> None:
            errors.append({"code": code, "message": message})

        if not isinstance(self.provider, str) or not self.provider.strip():
            add("PROVIDER_MISSING", "provider must be a non-empty identifier.")
        if not isinstance(self.model, str) or not self.model.strip():
            add("MODEL_MISSING", "model must be a non-empty identifier.")
        for name in ("input_tokens", "output_tokens"):
            value = getattr(self, name)
            if not isinstance(value, int) or isinstance(value, bool) or value < 0:
                add(
                    "TOKENS_INVALID",
                    f"{name} must be a non-negative integer; got {value!r}.",
                )
        if self.cost is not None:
            if not isinstance(self.cost, (int, float)) or isinstance(self.cost, bool):
                add("COST_INVALID", "cost must be a number when supplied.")
            elif self.cost < 0:
                add("COST_INVALID", "cost must be non-negative when supplied.")
        return errors

    def to_dict(self) -> Dict[str, Any]:
        return {
            "provider": self.provider,
            "model": self.model,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "recorded_at_utc": self.recorded_at_utc,
            "note": self.note,
            "cost": self.cost,
        }


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def call_provider(*args: Any, **kwargs: Any) -> None:
    """Always refuses: provider egress is NOT_ACTIVE in this phase.

    Kept as an explicit named boundary so that future enablement is a code
    change with an ADR, not an accident.
    """
    raise GatewayNotConnected(
        "NOT_ACTIVE: the model-gateway is not connected to any LLM provider in "
        "this phase (ADR-0013). Activating egress requires an owner decision "
        "recorded in a new ADR."
    )
