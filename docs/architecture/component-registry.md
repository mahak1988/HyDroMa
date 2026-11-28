# Component Registry

**Status:** SCAFFOLDED. Foundational registry of major components. Derived from the repository tree,
the 189-module catalog (`architecture/ECO-NOJIN-MODULE-CATALOG.csv`), and area boundary READMEs.
Maturity vocabulary: see [architecture-status.md](./architecture-status.md).

A component is a separately-owned deployable or library unit. Modules inside a component are listed
in the module catalog, not repeated here.

## 1. Frontend applications & sections

| ID | Name | Type | Responsibility | Directory | Owner | Maturity |
|---|---|---|---|---|---|---|
| C-FE-PLATFORM | Platform SPA | app | Unified host: public core + workspace + sections | `apps/platform` | FE | IMPLEMENTED |
| C-FE-BRAND | Brand showcase | app | Design-token showcase | `apps/brand` | FE/Brand | IMPLEMENTED |
| — sections | public `/`, `/platform`, `/tourism`, `/market`, `/landscape`, `/science`, `/admin` | sections | Internal lazy route trees | `apps/platform/src/sections` | FE | IMPLEMENTED/IMPLEMENTED(demo) |

## 2. Shared packages

| ID | Name | Responsibility | Directory | Maturity |
|---|---|---|---|---|
| C-PKG-UI | ui | Accessible components composing tokens | `packages/ui` | IMPLEMENTED |
| C-PKG-DS | design-system | Design tokens | `packages/design-system` | IMPLEMENTED |
| C-PKG-I18N | i18n | Catalogs, pluralization, RTL, calendar | `packages/i18n` | IMPLEMENTED |
| C-PKG-DT | domain-types | Shared domain types | `packages/domain-types` | IMPLEMENTED |
| C-PKG-VAL | validation | Shared schema validation | `packages/validation` | IMPLEMENTED |
| C-PKG-API | api-client | Typed API client | `packages/api-client` | IMPLEMENTED |
| C-PKG-AUTH | auth-client | Session/permission claims | `packages/auth-client` | IMPLEMENTED |
| C-PKG-UTIL | utilities | Pure helpers | `packages/utilities` | IMPLEMENTED |
| C-PKG-CFG | configuration | Build/lint/ts presets | `packages/configuration` | IMPLEMENTED |
| C-PKG-SCI | scientific | TS scientific reference contract | `packages/scientific` | IMPLEMENTED |
| C-PKG-SPATIAL | spatial | Spatial helpers | `packages/spatial` | IMPLEMENTED |
| C-PKG-HYDRO | hydroma-client | Engine HTTP client | `packages/hydroma-client` | IMPLEMENTED |
| C-PKG-CORE | frontend-core | App shell/permissions/routing primitives | `packages/frontend-core` | IMPLEMENTED |
| C-PKG-ICONS | icons | Icon set | `packages/icons` | IMPLEMENTED |
| C-PKG-SHELL | app-shell | Shell composition | `packages/app-shell` | IMPLEMENTED |

## 3. Backend (modular monolith)

| ID | Name | Responsibility | Directory | Maturity |
|---|---|---|---|---|
| C-BE-API | Local API | Local HTTP API | `services/api` | IMPLEMENTED |
| C-BE-EDI | EDI | Electronic data interchange (Python) | `services/edi` | IMPLEMENTED |
| C-BE-GW | API gateway (planned) | Ingress, auth, rate limit | `services/api-gateway` (planned) | PLANNED |
| C-BE-DOMAINS | 13 domain modules | Business logic per domain | `services/<domain>` | SCAFFOLDED |

## 4. Engines

| ID | Name | Responsibility | Directory | Maturity | Scientific |
|---|---|---|---|---|---|
| C-ENG-HYDROMA | HyDroMA | Scientific engine (water/land/climate/agri/MRV) | `engines/hydroma` | TESTED | NOT_VALIDATED |
| C-ENG-AIWF | AI workforce | Governed agent runtime + registry | `engines/ai-workforce` | SCAFFOLDED | n/a |

## 5. Data, infrastructure, integration, workflow

| ID | Name | Responsibility | Directory | Maturity |
|---|---|---|---|---|
| C-DATA-ZONES | Data zones | Raw/processed/reference separation | `data/*` | SCAFFOLDED |
| C-DB | Databases | Intended stores per role | `databases/*` | SCAFFOLDED |
| C-INFRA | Infrastructure | Runtime/security/monitor/deploy defs | `infrastructure/*` | SCAFFOLDED |
| C-INT | Integrations | Outbound adapters | `integrations/*` | SCAFFOLDED |
| C-WF | Workflows | Process definitions | `workflows/*` | SCAFFOLDED |
| C-CONTRACTS | Contracts | Only legal coupling | `contracts/*` | SCAFFOLDED |
| C-TESTS | Test layers | Verification | `tests/*` | SCAFFOLDED |

## 6. Interfaces & dependencies (summary)

- Frontend → `packages/*` → `contracts` types → backend API. Never to private tables or engine internals.
- Backend modules → own data only; cross-domain via `contracts/`.
- HyDroMA → engine contracts only; imports nothing from apps/services.
- AI agents → approved tools via gateway only.
- Integrations → adapters mapping vendor payloads to `contracts/`.

Full rules: [dependency-map.md](./dependency-map.md). Module-level detail (189 modules with allowed /
forbidden dependencies): `architecture/ECO-NOJIN-MODULE-CATALOG.csv`.