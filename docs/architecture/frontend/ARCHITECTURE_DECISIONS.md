# Architecture Decisions (AD-001 … AD-015)

**Document ID:** `ECO-NOJIN-FE-DEC-004`
**Status:** Owner-approved principles + as-built verification
**Verified:** 2026-11-23 · HEAD `3dbd465`

> These 15 decisions are the approved frontend architecture for the Eco Nojin Unified Modular Platform. Each record states the decision, why, consequences, constraints and current implementation status. Where the repository diverges, the divergence is a **conflict**, not a silent change of decision.

---

## Decision index

| ID | Decision | Status | Implementation |
|---|---|---|---|
| AD-001 | One public home | ACCEPTED | IMPLEMENTED |
| AD-002 | Public pages beside the home | ACCEPTED | PARTIALLY_EXISTING |
| AD-003 | One authenticated specialised workspace | ACCEPTED | PARTIALLY_EXISTING (not gated) |
| AD-004 | One main frontend runtime | ACCEPTED | IMPLEMENTED |
| AD-005 | One central router | ACCEPTED | IMPLEMENTED |
| AD-006 | One origin and one frontend entry port | ACCEPTED | IMPLEMENTED |
| AD-007 | Every domain is a domain module | ACCEPTED | PARTIALLY_EXISTING |
| AD-008 | One shared header and sidebar | ACCEPTED | IMPLEMENTED |
| AD-009 | One shared identity and permission system | ACCEPTED | PARTIALLY_EXISTING |
| AD-010 | Central module registry | ACCEPTED | PARTIALLY_EXISTING |
| AD-011 | Shared design system | ACCEPTED | IMPLEMENTED |
| AD-012 | Inter-module contracts | ACCEPTED | PARTIALLY_EXISTING |
| AD-013 | HyDroMA and EDI independence | ACCEPTED | IMPLEMENTED |
| AD-014 | Lazy loading | ACCEPTED | IMPLEMENTED |
| AD-015 | Gradual migration, no destructive rewrite | ACCEPTED | IMPLEMENTED |

---

## AD-001 — One public home

**Decision:** The public experience has exactly one root: `/`, rendered by `apps/platform` `PortalLayout`.

**Reason:** A single entry point avoids duplicate home pages, conflicting SEO canonicals and split public navigation.

**Consequences:** Public header, footer, locale/theme and auth entry are shared. Campaign pages must be added as public child routes, not as a second SPA.

**Constraints:** `/` must not redirect to a section. The public home is not the workspace.

**Status:** ACCEPTED · IMPLEMENTED. Evidence: `apps/platform/src/app/router.tsx`, `src/public/app/PortalLayout.tsx`.

---

## AD-002 — Public pages beside the home

**Decision:** Public pages (`/ecosystem`, `/about`, `/contact`, `/partner`, `/knowledge`, `/mrv`, `/hydroma`) live next to `/` in the public core.

**Reason:** These are acquisition/trust pages, not authenticated tools.

**Consequences:** They share the public layout and content model. Contact/notification forms remain unconnected until a backend exists.

**Constraints:** A public page must not require a session. A page that needs data uses an explicit unavailable state.

**Status:** ACCEPTED · PARTIALLY_EXISTING. 8 content pages are routed; `landscape`, `marketplace`, `tourism` content definitions are unused (C-02); `/contact` is not wired (C-05).

---

## AD-003 — One authenticated specialised workspace

**Decision:** Authenticated users work in one specialised workspace at `/platform/*`, not in per-domain SPAs.

**Reason:** Shared identity, navigation and page registry; no duplicated session or shell.

**Consequences:** Domain pages are entries in `PAGES` and rendered by `PageRenderer`. The workspace can be extended without a new app.

**Constraints:** The workspace is for authenticated users. **Current conflict:** `/platform/*` has no session guard (C-01).

**Status:** ACCEPTED · PARTIALLY_EXISTING.

---

## AD-004 — One main frontend runtime

**Decision:** `apps/platform` is the only user-facing runtime. `apps/brand` is a design sandbox, not a product surface.

**Reason:** One build, one router, one session, one deployment.

**Consequences:** Legacy apps are archived under `archive/legacy-*` and are not built or served.

**Constraints:** No new product SPA. A new surface must be a section or a workspace page.

**Status:** ACCEPTED · IMPLEMENTED. Evidence: `apps.json` contains `platform` and `brand`; `build-all`/`unified-dev`/`unified-serve` skip archived apps.

---

## AD-005 — One central router

**Decision:** `apps/platform/src/app/router.tsx` owns the route tree. Sections export route trees that are mounted lazily.

**Reason:** One place to reason about auth, fallback, 404 and route ordering.

**Consequences:** Route changes are central; sections cannot define a second `createBrowserRouter`.

**Constraints:** Section routers must be mounted by the central router. BrowserRouter basename comes from `routerBasename(import.meta.env.BASE_URL)`.

**Status:** ACCEPTED · IMPLEMENTED.

---

## AD-006 — One origin and one frontend entry port

**Decision:** The unified host serves the frontend on one origin/port (`5180` production preview; `5181` platform dev) and proxies `/api` to `services/api`.

**Reason:** `SameSite=Lax` session cookies and CORS-free same-origin calls.

**Consequences:** No absolute API URL in frontend code; `/api` is the only session base. The HyDroMA engine is a separate service and currently uses a configurable loopback base (C-06).

**Constraints:** Backend services are not merged into one process. One frontend port ≠ one backend process.

**Status:** ACCEPTED · IMPLEMENTED with one exception (HyDroMA base URL).

---

## AD-007 — Every domain is a domain module

**Decision:** The frontend is decomposed into 18 modules (M01–M18), each with an owner, routes, permissions and declared dependencies.

**Reason:** Clear ownership, independent lazy loading, and controlled cross-module contracts.

**Consequences:** Modules can be built and tested independently. Missing modules (inventory, challenges, EcoCoin) are explicit gaps, not hidden in a page.

**Constraints:** A module may not import another module's internals. The enterprise 178-module catalog remains the backend authority.

**Status:** ACCEPTED · PARTIALLY_EXISTING. 10 modules implemented/partial, 4 partial, 3 proposed, 2 backend-only.

---

## AD-008 — One shared header and sidebar

**Decision:** Public header/footer live in `PortalLayout`; workspace sidebar/command search live in `PlatformLayout`; section shells reuse them where appropriate.

**Reason:** Consistent navigation, one a11y implementation, one locale/theme switch.

**Consequences:** Shared chrome is a single point of regression and a single point of testing.

**Constraints:** A section may add a sub-header but must not duplicate `<main>`/`<header>` landmarks (field layout is the reference).

**Status:** ACCEPTED · IMPLEMENTED.

---

## AD-009 — One shared identity and permission system

**Decision:** `@eco-nojin/auth-client` + `@eco-nojin/domain-types` define session, memberships, roles and permissions. The server is the authority.

**Reason:** One login, one org switch, one role model.

**Consequences:** Route guards are UX only; every API call is re-checked. Roles: owner/admin/manager/member/viewer.

**Constraints:** No role switching in local storage. No permission claim in the UI that the server does not enforce.

**Status:** ACCEPTED · PARTIALLY_EXISTING. Session/roles are real; most workspace routes have no permission handles (C-07).

---

## AD-010 — Central module registry

**Decision:** A machine-readable module registry plus a section manifest describes modules, routes and ownership.

**Reason:** Navigation, docs and tests need one source of truth.

**Consequences:** `module-registry.json`, `route-registry.json`, `sections/manifest.ts` and `apps.json` must agree.

**Constraints:** The registry is descriptive today; it does not enforce navigation or permissions at runtime.

**Status:** ACCEPTED · PARTIALLY_EXISTING. JSON registries are new documentation; runtime enforcement is not implemented.

---

## AD-011 — Shared design system

**Decision:** All UI uses `@eco-nojin/design-system` tokens and `@eco-nojin/ui`; no component hard-codes colours or spacing.

**Reason:** Brand consistency, dark mode, RTL and a11y.

**Consequences:** Token changes propagate. Legacy `brand/` palette is not canonical.

**Constraints:** `check:tokens` is part of `verify`; inline styles must use real tokens.

**Status:** ACCEPTED · IMPLEMENTED.

---

## AD-012 — Inter-module contracts

**Decision:** Modules communicate through versioned contracts: `@eco-nojin/domain-types`, `@eco-nojin/api-client`, EDI canonical schema, HyDroMA client.

**Reason:** Modules must not read each other's tables or import internals.

**Consequences:** Contract changes are explicit and versioned. EDI/HyDroMA can evolve independently.

**Constraints:** No direct table access across services; no frontend import of Python packages.

**Status:** ACCEPTED · PARTIALLY_EXISTING. Types/client exist; cross-module flows (inventory, challenges, EcoCoin) are not implemented.

---

## AD-013 — HyDroMA and EDI independence

**Decision:** `engines/hydroma` and `services/edi` are independent services with their own data and tests. Business modules integrate only via clients/contracts.

**Reason:** Scientific reproducibility, security and independent deployment.

**Consequences:** Frontend renders explicit unavailable states when the engine is down. EDI is offline by default.

**Constraints:** No business module may import engine/EDI internals. No demo data may replace an unavailable capability.

**Status:** ACCEPTED · IMPLEMENTED. HyDroMA client is used; EDI has no frontend integration yet (M14/M15 backend-only).

---

## AD-014 — Lazy loading

**Decision:** Sections are lazy chunks; market/science pages are lazy; map/3D vendors are split.

**Reason:** Initial load and bundle budget.

**Consequences:** A section failure is isolated behind `Suspense`; the public core keeps working.

**Constraints:** Initial entry ≤ 900 KB; section entry ≤ 700 KB; `check:bundle` in `verify`.

**Status:** ACCEPTED · IMPLEMENTED.

---

## AD-015 — Gradual migration, no destructive rewrite

**Decision:** Legacy apps are archived, not deleted from history. Routes move into the platform incrementally, one module at a time.

**Reason:** Reversibility, reviewability and no big-bang rewrite.

**Consequences:** `archive/legacy-*` keeps old code typechecked/linted; registry/build/dev skip it. Owner approval is required for any deletion.

**Constraints:** No destructive git operations. No unapproved app deletion. One work package per commit.

**Status:** ACCEPTED · IMPLEMENTED. Five legacy apps archived; platform now owns their routes.

---

## Conflicts against these decisions

| ID | Decision affected | Conflict |
|---|---|---|
| C-01 | AD-003 | `/platform/*` is not session-gated. |
| C-02 | AD-002 | Public content keys `landscape`, `marketplace`, `tourism` are unused. |
| C-03 | AD-002/AD-007 | `/hydroma` and `/science` are two entries to one capability. |
| C-04 | AD-006 | HyDroMA base URL is absolute loopback, not same-origin. |
| C-05 | AD-002 | `/contact` form has no backend. |
| C-06 | AD-009 | Most workspace routes have no permission handles; only admin routes do. |
| C-07 | AD-010 | Registries are descriptive; no runtime enforcement. |
| C-08 | AD-013 | `services/edi` is untracked in Git. |
| C-09 | AD-015 | Legacy folders are archived but still present; final removal is owner-approved. |

See [CURRENT_STATE_VS_TARGET.md](./CURRENT_STATE_VS_TARGET.md) for impact and owner decisions.