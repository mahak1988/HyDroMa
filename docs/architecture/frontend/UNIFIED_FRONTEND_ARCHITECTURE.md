# Eco Nojin Unified Modular Platform — Frontend Architecture

**Document ID:** `ECO-NOJIN-FE-ARCH-001`
**Status:** Architecture documentation (as-built + target)
**Owner:** Eco Nojin platform
**Last verified:** 2026-11-23 · HEAD `3dbd465`
**Scope:** Frontend runtime, routing, modules, layout, identity, performance and security boundaries.

> This document describes the **as-built** unified frontend and the **approved target**. Where the repository differs from the approved principle, the difference is recorded as a conflict in [CURRENT_STATE_VS_TARGET.md](./CURRENT_STATE_VS_TARGET.md). No source code was changed to produce this document.

---

## 1. Approved principles (AD-001 … AD-015)

| ID | Principle | Implementation today |
|---|---|---|
| AD-001 | One public home | `/` renders the public portal home. |
| AD-002 | Public pages beside the home | `/ecosystem`, `/about`, `/contact`, `/partner`, `/knowledge`, `/mrv`, `/hydroma`, `/login`. |
| AD-003 | One specialised workspace for authenticated users | `/platform/*` exists, but it is **not yet session-gated**. |
| AD-004 | One main frontend runtime | `apps/platform` is the only user-facing SPA. |
| AD-005 | One central router | `apps/platform/src/app/router.tsx` (`createBrowserRouter`). |
| AD-006 | One origin and one frontend entry port | Unified host on `5180`; public core + lazy sections + `/api` proxy. |
| AD-007 | All domains are domain modules | 18 frontend modules in [module-registry.json](./module-registry.json). |
| AD-008 | Shared header and sidebar | `PortalLayout` (public) and `PlatformLayout` (workspace) + section shells. |
| AD-009 | Shared identity and permission system | `@eco-nojin/auth-client`, `@eco-nojin/domain-types`, server session. |
| AD-010 | Central module registry | Section manifest + JSON registries in this folder. |
| AD-011 | Shared design system | `@eco-nojin/design-system` tokens + `@eco-nojin/ui`. |
| AD-012 | Inter-module contracts | `@eco-nojin/domain-types`, `@eco-nojin/api-client`, EDI canonical schema, HyDroMA client. |
| AD-013 | HyDroMA and EDI independence | Separate Python services; frontend consumes clients/contracts only. |
| AD-014 | Lazy loading | Every section is a `React.lazy` chunk; section pages are lazy in market/science. |
| AD-015 | Gradual migration without destructive rewrite | Legacy apps archived under `archive/legacy-*`; no runtime dual-serve. |

---

## 2. Runtime topology

### 2.1 One frontend, one port

```text
Browser ──▶ unified host :5180
              ├─ /                 apps/platform/dist  (public core + workspace + sections)
              ├─ /brand/           apps/brand/dist     (design sandbox)
              └─ /api/**           proxy → services/api :8000
```

- `scripts/unified-serve.mjs` serves only **live** registry apps (`platform`, `brand`).
- `scripts/unified-dev.mjs` starts the API (`8000`), the platform Vite dev server (`5181`) and proxies `/api`, `/brand/`.
- Production `pnpm run preview` serves the same topology on `5180`.

### 2.2 Frontend stack

| Concern | Choice |
|---|---|
| Framework | React `19.3.1` |
| Router | `react-router-dom` `7.18.5` |
| Build | Vite `8.3.8` |
| Language | TypeScript `5.9.3` (strict) |
| Styling | Tailwind CSS `4.3.5` + design tokens |
| Server state | TanStack Query `5.108.0` (re-exported by `@eco-nojin/frontend-core`) |
| i18n | `@eco-nojin/i18n`, 15 catalogs, RTL-aware |
| Tests | Vitest `5.1.1`, Playwright, `node --test` for API |

### 2.3 Provider composition

`apps/platform/src/main.tsx` composes the whole frontend:

```text
ThemeProvider
└─ I18nProvider
   └─ ToastProvider
      └─ RealSessionProvider (baseUrl = /api)
         └─ RouterProvider (central router)
```

This is the only place where session, theme and locale providers are created. Sections must not create a second `RealSessionProvider`.

---

## 3. Layout architecture

| Surface | Layout | Responsibility |
|---|---|---|
| Public core | `public/app/PortalLayout.tsx` | Public header, language/theme menus, footer, `<Outlet/>`, skip link. |
| Workspace | `app/PlatformLayout.tsx` | Sidebar + command search + section navigation + `<Outlet/>`. Accepts `basePath`, `sections`, `pages` so the landscape section reuses it. |
| Tourism | `sections/tourism/app/TourismLayout.tsx` | Public tourism header/nav/footer; host sub-area. |
| Market | `sections/market/app/MarketLayout.tsx` | Market header, search, cart badge, seller area. |
| Science | `sections/science/app/ScienceLayout.tsx` | Science header, domain nav, workspace context. |
| Field | `sections/landscape/field/app/FieldLayout.tsx` | Nested under `/landscape/field`; deliberately no `<header>`/`<main>` landmarks. |
| Admin | `sections/landscape/admin/app/layouts/AppShell.tsx` | Console shell, user menu, org switcher, permission-aware navigation. |

### 3.1 Shared vs domain layout rules

- Shared chrome lives in `PortalLayout`, `PlatformLayout`, `@eco-nojin/app-shell`.
- A domain layout may add a sub-header, but must not duplicate `<main>` or `<header>` landmarks.
- All section links go through a local `*/lib/paths.ts` helper so the section prefix is preserved.
- Public pages and workspace pages must not import each other's layouts.

---

## 4. Routing architecture

### 4.1 Central router

`apps/platform/src/app/router.tsx` defines the complete route tree:

| Path | Kind | Module |
|---|---|---|
| `/` + public children | public portal | M01 |
| `/tourism/*` | lazy section | M17/M18 |
| `/market/*` | lazy section | M06 |
| `/landscape/*` | lazy section (landscape + field + admin) | M03/M10/M02 |
| `/science/*` | lazy section | M16 |
| `/platform/*` | workspace page registry | M03/M04/M07/M08/M13/M01/M02 |
| `*` (root) | public 404 | M01 |

### 4.2 Lazy loading and chunking

- Section entry chunks: `router-*.js`, each under the 700 KB budget.
- Market and science pages are individually lazy; tourism is a single section chunk (still under budget).
- Map/3D vendors (MapLibre, deck.gl, ScienceMap) are split into vendor chunks loaded only by the map pages.
- Budget gate: `pnpm run check:bundle` (initial entry ≤ 900 KB; section entries ≤ 700 KB).

### 4.3 Route status vocabulary

| Status | Meaning |
|---|---|
| `EXISTING` | Route is declared in the current router and renders. |
| `PARTIALLY_EXISTING` | Route renders, but data or a required capability is incomplete. |
| `PROPOSED` | Target route, not implemented. |
| `DEPRECATED_CANDIDATE` | Route exists but should be retired or replaced. |

The machine-readable route inventory is [route-registry.json](./route-registry.json).

---

## 5. Module architecture

The frontend is decomposed into **18 product modules** (M01…M18) in [module-registry.json](./module-registry.json). This is the frontend view; the enterprise architecture's 178-module catalog remains the backend authority.

| Layer | Modules |
|---|---|
| Public | M01 Public Experience |
| Platform | M02 Identity & Access |
| Domain | M03 Landscape, M04 Agriculture, M05 Inventory, M06 Marketplace, M07 Finance & Revenue, M08 Restoration, M09 Challenges, M10 Field, M11 Evidence, M12 EcoCoin, M13 MRV, M17 Tourism, M18 Booking |
| Science | M16 HyDroMA |
| Integration | M14 EDI, M15 Canonical Data |

Rules:

1. A module owns its routes, components, hooks and local stores.
2. A module may only depend on modules declared in its `dependencies`.
3. Cross-module reads go through a contract, not another module's tables or internal components.
4. `M16 HyDroMA` and `M14 EDI` are independent; business modules must not import their internals.

---

## 6. Frontend / backend boundaries

### 6.1 Same-origin API

- All frontend API calls use `baseUrl = /api` (`VITE_API_URL` may override).
- Vite dev and both hosts proxy `/api/**` to `http://127.0.0.1:8000`.
- The session cookie is `nojin_session`, `HttpOnly`, `SameSite=Lax`, `Path=/`.
- Same-origin is mandatory: a cross-origin fetch would not carry the Lax cookie.

### 6.2 HyDroMA boundary

- `packages/hydroma-client` is the only frontend client for the engine.
- `useHydromaModels` defaults to `VITE_HYDROMA_BASE_URL` or `http://127.0.0.1:8000` (the local engine).
- An unreachable engine renders `serviceUnavailable`; no demo numbers are substituted.
- **Conflict:** this is an absolute loopback URL in frontend code. It is not the session API, but it violates the same-origin rule for deployability. See `CURRENT_STATE_VS_TARGET.md` C-06.

### 6.3 EDI boundary

- `services/edi` is an independent Python package with canonical storage, provenance, security and its own tests.
- It is **offline by default**; live acquisition needs `EDI_LIVE_ACQUISITION`, a security gate, provider authorisation and owner approval.
- No frontend module imports EDI. The only allowed integration is a versioned contract (`canonical-data-v1` / `/v1/...` adapter).
- **Status:** `services/edi/` is currently untracked in Git (`?? services/edi/`). See conflicts.

### 6.4 API surface (real, current)

`services/api` exposes 20 routes, including:

- auth: register, login, logout, me, accept-invite
- organizations: list/create/get/update, members, invitations
- users: list/get/create/update
- catalog: categories, sellers, products
- resources: list/create/get/update/delete by type (`landscapes`, `villages`, `projects`, `farms`, `sites`, `reports`, `courses`, `articles`, `surveys`, `runs`, …)
- runs: `GET /v1/runs`
- notifications: list, seen
- meta: `GET /health`, `GET /v1/models`

The API is the authority for session, tenancy and role checks. The UI mirrors permissions only to avoid dead actions.

---

## 7. Performance principles

1. **Lazy sections** — a section chunk is fetched only when its route is entered.
2. **Lazy pages** — market/science pages are individually lazy.
3. **Vendor isolation** — MapLibre/deck.gl are not in the initial chunk.
4. **Budget gate** — `check:bundle` is part of `verify`.
5. **Local-first where offline is required** — field observations persist in `localStorage`, then sync.
6. **No fake data fallback** — unavailable capabilities render an explicit state, not a fixture.

Current measured budgets (minified, from the last build):

| Chunk | Size | Budget |
|---|---:|---:|
| Initial entry `index-*.js` | ~697 KB | 900 KB |
| Largest section entry `router-*.js` | ~218 KB | 700 KB |
| MapLibre worker (vendor) | ~550 KB | not capped |
| Science map (vendor) | ~670 KB | not capped |

---

## 8. Security principles

1. **Session cookie only** — no role or identity in `localStorage` except the active organization hint.
2. **Same-origin** — `/api` proxy, `SameSite=Lax`.
3. **Server authority** — every mutation re-checks session, membership and role.
4. **Organization scoping** — every domain row has `org_id`; `orgFrom()` resolves and validates the caller's membership.
5. **Route guards are UX, not enforcement** — `RoutePermissionGuard`/`RequireRole` prevent dead actions; the API returns 401/403/404.
6. **Least privilege** — roles are `owner/admin/manager/member/viewer`; writes require owner/admin/manager.
7. **No secrets in frontend** — only public `VITE_*` values.
8. **Explicit unavailability** — blocked capabilities are labelled, never simulated.

---

## 9. Non-goals and constraints

- This document does not change the approved architecture.
- It does not authorise deleting legacy apps, changing dependencies, or altering the API.
- It records the **18-module frontend decomposition** as the mission's module list; it does not replace the enterprise module catalog.
- It does not claim a route is implemented unless the route is declared in the current router and covered by a test or build.

---

## 10. References

- [MODULES_AND_ROUTES.md](./MODULES_AND_ROUTES.md)
- [COMPONENTS_AND_HOOKS.md](./COMPONENTS_AND_HOOKS.md)
- [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md)
- [MODULE_REGISTRY_SCHEMA.md](./MODULE_REGISTRY_SCHEMA.md)
- [AUTH_AND_PERMISSION_ARCHITECTURE.md](./AUTH_AND_PERMISSION_ARCHITECTURE.md)
- [CROSS_MODULE_FLOWS.md](./CROSS_MODULE_FLOWS.md)
- [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)
- [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md)
- [CURRENT_STATE_VS_TARGET.md](./CURRENT_STATE_VS_TARGET.md)
- [route-registry.json](./route-registry.json) · [module-registry.json](./module-registry.json)
- `docs/architecture/ROUTING.md`, `ADR-0010-unified-platform-sections.md`, `BUNDLE-BUDGET.md`