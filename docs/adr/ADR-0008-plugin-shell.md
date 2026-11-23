# ADR-0008 — Plugin shell: medusa Injection Zones + directus preRegisterCheck (pattern only)

- **Status:** ACCEPTED
- **Date:** 2026-11-22
- **Deciders:** owner (via resident agent)
- **Related:** Phase 2 of apps evolution plan

## Context
platform has 73 hand-written pages. Need a registry-driven shell for modules/pages/widgets without forking upstream.

## Options considered
| Option | Pros | Cons | Risk |
|---|---|---|---|
| Medusa Injection Zones + Directus preRegisterCheck (pattern) | Proven, modular | Implementation work | Low |
| Keep static page list | Simple | Does not scale | Medium |

## Decision
Adopt the pattern (not the code) from medusa (Injection Zones + ExtensionApi) and directus (preRegisterCheck + dynamic routes). Implement in packages/app-shell. No upstream code copied.

## Consequences
- Positive: scalable module registration; permission-gated.
- Negative: implementation effort.
- Follow-up work: packages/app-shell modules/; platform migration.