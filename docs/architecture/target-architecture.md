# Target Architecture & Reconciliation

**Status:** SCAFFOLDED. This document reconciles the mission's *target* repository tree with the
*actual* repository. It is a mapping record, not a relocation plan. **No existing application or
source was moved, renamed or deleted to produce this mapping** (mission §2, §4, §38, §45).

## 1. Principle of reconciliation

The mission supplies an organisational target tree. The repository already contains a coherent,
mature tree governed by ADR-0001 (`architecture/` authoritative, `docs/` process). Where the two
differ, the existing tree is preserved and the target concept is mapped onto its real home. A target
folder is created **only** when it represents a genuine missing boundary with a real purpose — never
to satisfy a checklist or to duplicate an existing home.

## 2. Target → actual mapping

| Mission target | Actual home in repo | Relationship |
|---|---|---|
| `apps/home` | `apps/platform` public core at `/` | Public entry is a section of the platform SPA (ADR-0010), not a separate app |
| `apps/portal` | `apps/platform` public core `/` | Same as above; a dedicated portal app is **not** created (D-ARC-02, D-FE-01 open) |
| `apps/console` | `apps/platform` workspace `/platform/*` | Authenticated workspace is a section |
| `apps/platform` | `apps/platform` | Real app (exists) |
| `apps/scientific-workspace` | `apps/platform` science section `/science/*` | Section, not separate app |
| `apps/marketplace` | `apps/platform` market section `/market/*` | Section (hybrid content/API) |
| `apps/tourism` | `apps/platform` tourism section `/tourism/*` | Section |
| `apps/brand` | `apps/brand` | Real separate static app (exists) |
| `packages/ui` | `packages/ui` | Exists |
| `packages/design-system` | `packages/design-system` | Exists |
| `packages/shared-types` | `packages/domain-types` | Exists under a clearer name |
| `packages/shared-contracts` | `contracts/` + `packages/validation` | Contracts live in `contracts/`; validation wraps them |
| `packages/api-client` | `packages/api-client` | Exists |
| `packages/auth-client` | `packages/auth-client` | Exists |
| `packages/i18n` | `packages/i18n` | Exists |
| `packages/config` | `packages/configuration` | Exists (build/lint presets) |
| `packages/utilities` | `packages/utilities` | Exists |
| `packages/validation` | `packages/validation` | Exists |
| `packages/maps` | `packages/spatial` | Exists |
| `packages/data-models` | `packages/domain-types` + `contracts/schemas` | Split by design |
| `packages/permissions` | `packages/frontend-core` (permissions) + `services` RBAC | Client claims vs server authority |
| `packages/telemetry` | (planned) `infrastructure/monitoring` + client hooks | Not a package yet |
| `packages/testing` | `tests/` + per-app test dirs | Not a package yet |
| `backend/api` | `services/api` + `services/api-gateway` (planned) | Modular monolith, not a `backend/` root |
| `backend/application` | `services/<domain>` (planned) | Application logic lives per module |
| `backend/domain` | `services/<domain>` + `architecture/…DATA-DOMAIN-MODEL` | Domain model documented |
| `backend/infrastructure` | `infrastructure/` | Exists as boundary |
| `backend/modules` | `services/*` (13 domains) | The module set |
| `backend/integrations` | `integrations/` | Exists as boundary |
| `backend/events` | `contracts/events` + `workflows/` | Contract + definitions |
| `backend/workflows` | `workflows/` + `services/workflow` (planned) | Definitions vs runtime |
| `backend/workers` | `engines/hydroma` jobs + `INF-JOBS` (planned) | Engine-local jobs today |
| `backend/policies` | `security/policies` (planned) + `services` authz | Not a separate root |
| `backend/tests` | `tests/` + `services/api/tests` | Layered |
| `engines/hydroma` | `engines/hydroma` | Real Python engine (exists) |
| `services/*` (9 listed) | `services/*` (13 documented) | Superset; see services README |
| `infrastructure/*` (13 listed) | `infrastructure/*` (6 areas) + `architecture/…SECURITY-AND-INFRASTRUCTURE` | Consolidated |
| `data/*` (11 listed) | `data/*` (12 zones) | Consolidated |
| `integrations/*` | `integrations/*` (6 adapters) | Consolidated |
| `ai/*` | `engines/ai-workforce` + `services/ai-orchestration` (planned) | Engine + module, not an `ai/` root |
| `security/*` | `architecture/…SECURITY-AND-INFRASTRUCTURE` + `docs/security/` | Documented, not a code root |
| `governance/*` | `architecture/` + `docs/adr/` + `ARCHITECTURE-DECISIONS-OPEN.md` | Existing governance homes |
| `tests/*` (9 listed) | `tests/*` (7 layers) | Consolidated |
| `docs/architecture/*` | `docs/architecture/` (this set) | Extended here |
| `scripts/*` | `scripts/` | Exists (verify, boundaries, scaffold) |
| `artifacts/architecture` | `artifacts/` | Exists |

## 3. Deliberate non-creations (with reason)

| Not created | Reason |
|---|---|
| `apps/portal`, `apps/console`, `apps/marketplace`, `apps/tourism` as separate apps | They are sections of the unified platform SPA (ADR-0010). Creating empty app roots would duplicate and confuse (F-01/F-07 in FINAL-ARCHITECTURE-AUDIT). |
| `backend/` root | The backend is a modular monolith under `services/`; a second root would create two competing authorities. |
| `ai/`, `security/`, `governance/` code roots | These are documented in `architecture/`, `engines/ai-workforce`, `docs/security/`, `docs/adr/`. Code roots would be empty theatre. |
| Per-domain README under `engines/hydroma/<domain>` | One authoritative contract table exists; 15 boilerplate files would hide it. |
| Duplicate `packages/configuration` vs `infrastructure/configuration` | Known naming collision (F-02); left for first-implementation rename, not duplicated. |

## 4. Where a genuine gap was filled

This mission adds cross-cutting **maps and registries** that did not exist as a consolidated set
(dependency map, integration map, C4, component/domain/contract/integration/infrastructure/ADR
registries). These live in `docs/architecture/` and reference — never restate — `architecture/`.

## 5. Rule for future change

If a future slice needs a real new top-level area, it is added only with (a) an ADR or open-decision
entry, (b) a boundary README, (c) a registry entry, and (d) an update to this mapping. Empty
directories without documentation are prohibited (mission §38).