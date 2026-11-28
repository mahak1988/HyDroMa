# Dependency Map

**Status:** SCAFFOLDED. Normative dependency rules and the allowed/forbidden matrix. Derived from
`AGENTS.md`, `architecture/ECO-NOJIN-MODULE-CATALOG.csv` (per-module allowed/forbidden), and area
boundary READMEs. Enforcement today: `scripts/check-boundaries.mjs` (20 units). This document does
not add a new enforcement system (mission §39).

## 1. Allowed dependency direction

```
apps/*            → packages/* → contracts (types) → backend API
backend API       → application → domain modules → domain-owned contracts
domain modules    → own data only; cross-domain via contracts/events
infrastructure    → implements interfaces defined by application/domain
services          → explicit contracts only
engines/hydroma   → engine contracts; imports nothing from apps/services
ai agents         → approved tools via AI gateway only
integrations      → adapters mapping to contracts
database          → via persistence interfaces only
```

## 2. Forbidden dependencies (enforceable)

| # | Forbidden | Why |
|---|---|---|
| F1 | Frontend → private database tables | bypasses API/authz/tenancy |
| F2 | Frontend → HyDroMA engine internals | breaks scientific independence (P5) |
| F3 | Frontend → privileged infrastructure | privilege escalation |
| F4 | Domain module → another module's internals | breaks module ownership (P1/P3) |
| F5 | Agent → authorization bypass | safety/security |
| F6 | Service → another module's data tables | data ownership |
| F7 | External provider → core domain logic | vendor lock-in of core |
| F8 | Scientific model → frontend code | coupling |
| F9 | Engine → services / apps imports | independence |
| F10 | Arbitrary cross-component imports | maintainability |

## 3. Per-layer dependency matrix

| From ↓ / To → | apps | packages | contracts | backend modules | engines | services | integrations | data/DB |
|---|---|---|---|---|---|---|---|---|
| apps | — | ✅ | ✅ | ✅ (API) | ❌ | ❌ | ❌ | ❌ |
| packages | ❌ | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| contracts | ❌ | ❌ | — | ❌ | ❌ | ❌ | ❌ | ❌ |
| backend modules | ❌ | ❌ | ✅ | own only | via gateway | ✅ (contracts) | via adapter | own tables |
| engines | ❌ | ❌ | ✅ (sci) | ❌ | — | ❌ | ❌ | own store |
| services | ❌ | ❌ | ✅ | ✅ | via gateway | — | via adapter | own tables |
| integrations | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | — | ❌ |
| ai agents | ❌ | ❌ | ✅ | via gateway/tools | ❌ | via gateway | ❌ | ❌ |

✅ allowed · ❌ forbidden · "own only" = module reads only its own schema.

## 4. Enforcement roadmap

- Now: `scripts/check-boundaries.mjs` + typecheck + lint in `pnpm run verify`.
- Next (Stage 1): contract tests + import-boundary lint rules per package.
- Later: architecture tests in `tests/architecture` (dependency-cruiser or equivalent) — only when
  the backend exists to police.

## 5. Change rule

A new dependency edge requires an ADR or open-decision entry and an update to this map and the
module catalog. Cross-domain data access is never granted by adding an import; it is granted by a
contract.