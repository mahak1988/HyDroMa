# engines/ai-workforce — agent governance layer

**Status:** governance layer **implemented and tested** — **99 pytest tests, all passing**
(local run on Python 3.11+ before push; see `tests/`). The **execution plane is NOT_ACTIVE**:
no agent is connected to any tool or LLM provider, and payment, wallet, token or
financial-execution tooling is forbidden for every agent (`AGENTS.md`). Owner authorization
for this implementation is recorded in `docs/adr/ADR-0013-ai-workforce-governance-layer.md`.

**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`,
`ARCHITECTURE-DECISIONS-OPEN.md`, `docs/adr/ADR-0013-ai-workforce-governance-layer.md`.

This engine is the independent agent runtime. It owns no business data, never imports from
`apps/` or `services/`, and has an **empty dependency set** (`dependencies = []`,
stdlib-only — enforced by `tests/test_boundaries.py`).

## Two planes

| Plane | Status | What it does |
|---|---|---|
| Governance | **ACTIVE** | agent registry, permission decisions, policy limits, scope checks, hash-chained audit, gateway accounting & redaction |
| Execution | **NOT_ACTIVE** | `execute_tool` ALWAYS refuses (`AGENT_EXECUTION_NOT_ACTIVE`; `TOOL_NOT_PERMITTED` when outside the allowlist). Activation requires an owner decision recorded in a new ADR. |

## Layout

```
engines/ai-workforce/
  ai_workforce/
    permissions.py   # six governed roles, fail-closed allow/deny table, org/domain scopes
    registry.py      # AgentDefinition (id@version, immutable), structured validation,
                     #   financial-tooling rejection (TOOL_FORBIDDEN)
    audit.py         # append-only SHA-256 hash-chained audit trail (JSONL round-trip,
                     #   tamper verification, genesis linkage)
    policy.py        # action limits, escalation requirement, permanent financial ban
    gateway.py       # model-gateway contract: deterministic redaction, token-usage
                     #   accounting, provider-secret rejection, egress refused
    runtime.py       # AgentRuntime: governance decisions + refusals wired to the audit chain
  tests/             # pytest suite: registry, permissions, audit, policy, gateway,
                     #   runtime, boundaries (stdlib-only import audit, financial-tool tests)
```

## Governance table (six roles — boundary document now enforced in code)

| Role | Allowed to | Not allowed to |
|---|---|---|
| `analyst` | query read models, run HyDroMA analyses, produce reports | mutate domain records |
| `administrator` | manage users/orgs *within* delegated scope | touch finance, change permissions it was not granted |
| `manager` | plan, summarize, route approvals | approve its own proposals, spend |
| `employees` | execute scoped tasks inside one domain | cross-domain access without an explicit grant |
| `model-gateway` | single egress to LLM providers, token/cost accounting, redaction | expose provider keys to agents |
| `agent-registry` | agent definitions, versions, tool allowlists | grant permissions beyond the registry policy |

Permission checks are **fail-closed**: an unknown role (`UNKNOWN_ROLE`), an unknown action
(`UNKNOWN_ACTION`) or an ungranted action (`ROLE_ACTION_NOT_GRANTED`) is always denied.

## Contracts

### Agent definition

Every agent declares: `purpose`, `permitted_tools`, `permission_scope` (orgs/domains),
`data_classification` (public / internal / confidential / restricted), `limits`
(`max_actions_per_session`, `max_tool_calls_per_action`; `None` = unlimited-but-recorded),
and an `escalation_path` (mandatory for the four privileged roles; targets are governed
roles or the human authorities `owner` / `human-operator`). Identity is
`agent_id@version`; **registered versions are immutable** — new capability means a new
version, never an in-place edit. Definitions are frozen dataclasses.

### Financial tooling (hard rule)

Any permitted tool whose id contains `payment`, `wallet`, `token-transfer`,
`financial-execution`, `finance-execution`, `crypto-transfer`, `banking` or `checkout`
(case-insensitive) is a **registration error** (`TOOL_FORBIDDEN`) — never a warning. The
policy layer additionally denies the `spend` and `touch_finance` actions for every role
(`FINANCE_TOOLING_FORBIDDEN`). There is no configuration that disables this in this phase.

### Audit chain

Every governance event (`AGENT_REGISTERED`, `AGENT_DEPRECATED`,
`REGISTRY_VALIDATION_FAILED`, `PERMISSION_DECISION`, `EXECUTION_REFUSED`,
`TOOL_NOT_PERMITTED`, `GATEWAY_REDACTED`, `TOKEN_USAGE_RECORDED`) is appended as an
immutable entry with `prev_hash` (genesis `0…0` for the first entry) and `entry_hash` —
canonical SHA-256 over sorted-key compact JSON (the same canonicalization contract as
`engines/hydroma`'s `provenance.sha256_json`; not RFC 8785). `verify()` recomputes the
whole chain and reports the first broken sequence (`SEQ_MISMATCH` / `PREV_HASH_MISMATCH` /
`ENTRY_HASH_MISMATCH`). The chain is **tamper-evident, not tamper-proof**; durable storage
is the caller's responsibility (JSONL round-trip provided).

### Model-gateway contract

- `redact(text)` applies three deterministic rules — `PROVIDER_API_KEY`,
  `AUTHORIZATION_HEADER`, `BEARER_TOKEN` — and never mutates the input; the applied rule
  names are audited, content is not hashed or stored.
- `TokenUsageRecord` accounts provider/model/tokens (record-only; no pricing table is
  invented; an optional `cost` must be explicitly caller-supplied).
- `assert_no_provider_secrets(config)` rejects credential fields (`api_key`, `secret`,
  `password`, `access_token`, `private_key`, …); the error names the offending **keys
  only** — values never enter messages, logs or tests.
- `call_provider()` **always raises `GatewayNotConnected`**: the package ships no network
  client, no key storage, no retry logic — nothing to leak.

### Scope & limits

Org/domain requests outside the declared scope are denied (`SCOPE_ORG_NOT_COVERED` /
`SCOPE_DOMAIN_NOT_COVERED`); an empty scope means no grant — absence of a grant is never
interpreted as broad access. `max_actions_per_session=0` denies every action
(`ACTION_BUDGET_EXHAUSTED`).

## Example

```python
from ai_workforce import AgentDefinition, AgentRuntime, PermissionScope

runtime = AgentRuntime()
agent = AgentDefinition(
    agent_id="analyst.water", version="1.0.0", role="analyst",
    purpose="Run HyDroMA water analyses for one org.",
    permitted_tools=("hydroma.query_models",),
    permission_scope=PermissionScope(org_ids=frozenset({"org-1"})),
)
runtime.register_agent(agent)

decision = runtime.decide("analyst.water", "run_hydroma_analysis")
print(decision["decision"])   # "ALLOW" — a permission decision, not execution

result = runtime.execute_tool("analyst.water", "hydroma.query_models")
print(result["code"])         # "AGENT_EXECUTION_NOT_ACTIVE"

print(runtime.audit_log.verify())   # {'valid': True, 'entries': 2, ...}
```

## Limitations (honest)

- Governance plane only: no tool execution, no LLM connectivity, no payment tooling — by
  design in this phase (ADR-0013 non-goals).
- Audit log is in-memory with JSONL serialization; no durable database, no multi-node
  replication, no log rotation.
- No authentication or identity integration: agents are declared identities, not
  authenticated users; the runtime does not verify who calls it.
- Redaction is a documented, deterministic rule set — not a guarantee against every leak.
- Software-tested only; the four-state capability status of goal G11 is recorded in
  `docs/blueprint/GOALS-STATUS-MATRIX.md` (IMPLEMENTED governance layer, execution
  NOT_ACTIVE).

## How to run

```bash
python -m venv .venv
. .venv/bin/activate && pip install pytest
python -m pytest tests -q    # 99 passed (Python >= 3.11, zero third-party dependency)
```
