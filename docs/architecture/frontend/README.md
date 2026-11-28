# Frontend Architecture (branch index)

**Status:** IMPLEMENTED (unified platform SPA, ADR-0010) — demo/real-session data. Authoritative
depth is in this directory; this file is the entry index.

## What exists

- One platform SPA (`apps/platform`) served on one origin (:5180): public core `/`, workspace
  `/platform`, and lazy sections `/tourism`, `/market`, `/landscape`, `/field`, `/admin`, `/science`.
- `apps/brand` static token showcase at `/brand/`.
- 13 shared packages (`packages/*`): design-system, ui, icons, i18n, domain-types, validation,
  api-client, auth-client, utilities, configuration, scientific, spatial, hydroma-client, frontend-core,
  app-shell.

## Authoritative documents in this folder

| File | Covers |
|---|---|
| `UNIFIED_FRONTEND_ARCHITECTURE.md` | the unified shell model |
| `MODULES_AND_ROUTES.md` · `route-registry.json` | sections and routes |
| `MODULE_REGISTRY_SCHEMA.md` · `module-registry.json` | module registry |
| `COMPONENTS_AND_HOOKS.md` | components/hooks |
| `AUTH_AND_PERMISSION_ARCHITECTURE.md` | client auth/permissions |
| `CROSS_MODULE_FLOWS.md` | cross-module flows |
| `CURRENT_STATE_VS_TARGET.md` · `MIGRATION_PLAN.md` | state & migration |
| `ACCEPTANCE_CRITERIA.md` · `ARCHITECTURE_DECISIONS.md` | acceptance & decisions |

## Rules (summary)

- Frontend owns no authoritative business logic or scientific calculation (P2/P5).
- Reuse the root `RealSessionProvider`; never create a second session provider.
- No hardcoded strings; RTL-correct; token-based styling; a11y WCAG 2.2 AA.
- A blocked capability is labelled unavailable, never faked.
- Science is reached only via `packages/hydroma-client`, never by importing `engines/`.

## Related

- [../architecture-overview.md](../architecture-overview.md) · [../component-registry.md](../component-registry.md)
- `apps/README.md` · `docs/architecture/ROUTING.md` · `docs/architecture/DESIGN-SYSTEM.md`