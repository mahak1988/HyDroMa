# AI & Agent Architecture (branch index)

**Status:** SCAFFOLDED. No agent active, no provider connected, no credentials. Authoritative depth:
`engines/ai-workforce/README.md`, module catalog (AI-*), `ARCHITECTURE-DECISIONS-OPEN.md` D-AI-01.

## Distinctions (do not conflate)

AI model · AI provider · AI gateway · agent · tool · workflow · application.

## Target components

AI gateway · model providers · provider adapters · model registry · model routing · agent runtime ·
agent registry · tool registry · agent permissions · execution · prompt management + versioning · AI
evaluation · monitoring · cost management · human approval · AI policies · security · governance ·
agent audit.

## Agent boundaries (mandatory)

Agents must **not** receive unrestricted access to: database, files, infrastructure, secrets,
financial operations, production systems, user administration. Controlled tool-based access only;
allowlisted, risk-classed, logged; no raw DB tool; no self-approval.

## Current state

6 governed roles documented (analyst, administrator, manager, employees, model-gateway,
agent-registry). No runtime, no provider, no active agent.

## Related

- [../component-registry.md](../component-registry.md) · [../system-boundaries.md](../system-boundaries.md) · D-AI-01