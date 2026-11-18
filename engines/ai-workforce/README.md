# engines/ai-workforce — agent runtime

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Every agent must declare: purpose, permitted tools, permission scope (org/records), data
classification it may read, spending/action limits, escalation path, and a full audit trail of
inputs, tool calls and outputs. Nothing here is active in this phase.

| Role | Allowed to | Not allowed to |
|---|---|---|
| `analyst` | query read models, run HyDroMA analyses, produce reports | mutate domain records |
| `administrator` | manage users/orgs *within* delegated scope | touch finance, change permissions it was not granted |
| `manager` | plan, summarize, route approvals | approve its own proposals, spend |
| `employees` | execute scoped tasks inside one domain | cross-domain access without an explicit grant |
| `model-gateway` | single egress to LLM providers, token/cost accounting, redaction | expose provider keys to agents |
| `agent-registry` | agent definitions, versions, tool allowlists | grant permissions beyond the registry policy |

Hard rule: no agent is connected to payment, wallet, token or financial execution tooling.
