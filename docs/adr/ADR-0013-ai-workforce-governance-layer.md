# ADR-0013 — AI Workforce governance layer (execution plane NOT_ACTIVE)

- **Status:** ACCEPTED
- **Date:** 2026-11-29
- **Deciders:** project owner (کشت و صنعت دشت امید نارون) via the 2026-11-29 directive
  to study the `engines/` trees and develop, standardize and complete them relative to the
  master-blueprint program ("engines را مطالعه کنید باید توسعه کامل داده شود و استاندارد
  سازی شود و نسبت به برنامه کامل شود"); executed by the development agent on branch
  `engines/ai-workforce-r1` over main `b5fc2d86`.
- **Related:** ADR-0001 (documentation single source), ADR-0012 (master blueprint adoption;
  G11 = DESIGNED), `AGENTS.md` (financial-tooling prohibition), `engines/README.md`,
  `docs/blueprint/GOALS-STATUS-MATRIX.md` (G11 row).

## Context

The blueprint (G11, توسعه هوش مصنوعی) was `DESIGNED`: `engines/ai-workforce` held only a
boundary document defining six governed roles (`analyst`, `administrator`, `manager`,
`employees`, `model-gateway`, `agent-registry`) and the requirement that every agent
declare purpose, permitted tools, permission scope, data classification, limits, escalation
path and a full audit trail — with the explicit note "Nothing here is active in this phase".
No code existed. Meanwhile `engines/hydroma` grew into a mature, dependency-free, fully
tested Python runtime, so the `engines/` root README ("SKELETON — no implementation") had
drifted from reality.

Hard rules constrain any AI implementation here (AGENTS.md): connecting an agent to
payment/wallet/token/financial tooling is forbidden in this phase; engines are independent
of business services; claims require reproducible evidence.

## Options considered

| Option | Pros | Cons | Risk |
|---|---|---|---|
| Keep ai-workforce as documentation only | No new surface | G11 stays DESIGNED forever; governance requirements remain prose; engines README keeps claiming "no implementation" dishonestly for the tree | Documentation/reality drift grows |
| Implement the governance plane as a tested, stdlib-only package; execution plane stays NOT_ACTIVE (adopted) | Enforces the documented role table, forbidden-tooling ban, hash-chained audit and gateway contract in code; honest capability banner; matches the hydroma engineering pattern (tested ≠ validated/active) | No operational agent value yet | Mitigated: activation explicitly requires a new owner decision + ADR |
| Connect real LLM providers / tool execution now | Demo value | Violates AGENTS.md scope rules and the "Nothing here is active" boundary; needs keys, spending rules, approval workflow — none decided by the owner | Financial and data-leak risk; contract with no governance |

## Decision

1. **Implement the governance plane** of `engines/ai-workforce` as a stdlib-only Python
   package (`ai_workforce`, `dependencies = []`) with six modules: `permissions.py`
   (six-role allow/deny table, fail-closed checks, org/domain scopes), `registry.py`
   (immutable `id@version` agent definitions; structured validation; financial-tool
   patterns rejected as `TOOL_FORBIDDEN`), `audit.py` (append-only, SHA-256 hash-chained
   audit trail, JSONL round-trip, tamper verification — same canonicalization contract as
   hydroma's `sha256_json`), `policy.py` (action limits; escalation requirement for
   privileged roles; permanent `FINANCE_TOOLING_FORBIDDEN` denial of `spend`/`touch_finance`
   with no configuration escape), `gateway.py` (deterministic redaction rules;
   token-usage accounting records; provider-credential rejection naming keys only;
   `call_provider` always raises `GatewayNotConnected`), and `runtime.py`
   (`AgentRuntime` wiring every governance decision and refusal into the audit chain).
2. **Keep the execution plane NOT_ACTIVE**: `execute_tool` always refuses
   (`AGENT_EXECUTION_NOT_ACTIVE`; `TOOL_NOT_PERMITTED` when outside the allowlist). The
   package ships no network client, no key storage, no tool adapters. Activating
   execution or provider egress requires an owner decision recorded in a new ADR.
3. **Standardize the engines surface**: `engines/README.md` and
   `engines/ai-workforce/README.md` rewritten to match implemented reality (hydroma
   implemented/tested; ai-workforce governance implemented/tested, execution NOT_ACTIVE);
   `docs/blueprint/GOALS-STATUS-MATRIX.md` G11 moves from DESIGNED to
   "IMPLEMENTED (governance layer) — execution NOT_ACTIVE" with inspectable evidence;
   the ADR register gains this entry.
4. **Evidence**: 99 pytest tests pass locally on the pushed branch (registry 20,
   permissions/audit/policy/gateway/runtime/boundaries suites incl. a stdlib-only import
   audit and a per-pattern financial-tool rejection test). Tests are software evidence
   only; they never claim operational AI capability.

## Consequences

- Positive: G11's governance requirements are now enforced code with a reproducible test
  suite; the financial-tooling ban is structural (registration error + policy denial),
  not prose; the audit trail is tamper-evident; documentation matches reality again.
- Negative: no operational agent capability yet — the package cannot do work beyond
  governance decisions by design; keeping the capability banner honest across future
  commits is an ongoing duty.
- Neutral: the hydroma engine is untouched; no service or app changes; CI runs only the
  existing hydroma Python job (ai-workforce has no CI job yet — wiring one is a
  `blueprint-track` follow-up, not a silent omission).
