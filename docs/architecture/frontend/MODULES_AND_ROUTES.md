# Modules and Routes

**Document ID:** `ECO-NOJIN-FE-ROUTES-002`
**Status:** As-built + proposed
**Verified:** 2026-11-23 · HEAD `3dbd465`
**Machine-readable source:** [route-registry.json](./route-registry.json) · [module-registry.json](./module-registry.json)

> A route is **EXISTING** when it is declared in the current router (`apps/platform/src/app/router.tsx`, a section router, or `services/api/src/server.mjs`) and renders as intended. **PARTIALLY_EXISTING** when it renders but data or a required capability is incomplete. **DEPRECATED_CANDIDATE** when it exists but should be retired. **PROPOSED** routes are targets and are not implemented.

---

## 1. Route counts

| Metric | Count |
|---|---:|
| Public content definitions (`SiteContent.pages`) | 12 |
| Public content pages actually rendered | 8 |
| Public account/auth pages (login, profile, security) | 3 |
| Public redirect (`/marketplace` → `/market/`) | 1 |
| Public fallback | 1 |
| Workspace page definitions (`PAGES`) | 73 (1 index + 72) |
| Tourism routes | 16 (index + 15) + fallback |
| Market routes | 11 (index + 10) + fallback |
| Landscape routes | index + 16 pages + field 4 + admin 10 + fallback |
| Science routes | 12 (index + 11) + fallback |
| API routes | 20 |
| **Existing route entries in registry** | **181** |
| — EXISTING | 135 |
| — PARTIALLY_EXISTING | 44 |
| — DEPRECATED_CANDIDATE | 2 |
| **Proposed route entries** | **28** |
| **Total registry entries** | **209** |

Notes:

- The registry counts route *entries*, not unique URL patterns. Index and fallback entries are included.
- **PARTIALLY_EXISTING** and **DEPRECATED_CANDIDATE** are subsets of the 181 declared routes, not additional routes.
- Every entry in `route-registry.json` carries a `permissions` array. Module-level grants are the coarse requirement; route-level `handle.permissions` is the fine-grained requirement. The server remains the authority.
- The 18-module decomposition is a frontend view. The enterprise architecture catalog (178 modules) remains the backend authority.

---

## 2. The 18 modules

| ID | Module | Layer | Status | Entry routes |
|---|---|---|---|---|
| M01 | Public Experience | public | PARTIALLY_EXISTING | `/`, `/ecosystem`, `/hydroma`, `/mrv`, `/knowledge`, `/about`, `/contact`, `/partner`, `/login`, `/profile`, `/security` |
| M02 | Identity & Access | platform | IMPLEMENTED | `/login`, `/profile`, `/security`, `/landscape/admin/*` |
| M03 | Landscape Management | domain | IMPLEMENTED | `/landscape`, `/landscape/landscapes/*` |
| M04 | Agriculture | domain | PARTIALLY_EXISTING | `/platform/agriculture/*` |
| M05 | Inventory | domain | PROPOSED | — |
| M06 | Marketplace | domain | PARTIALLY_EXISTING | `/market/*` |
| M07 | Finance & Revenue | domain | PARTIALLY_EXISTING | `/platform/finance/*` |
| M08 | Restoration | domain | PARTIALLY_EXISTING | `/platform/projects/*`, `/platform/mrv/restoration`, `/landscape/landscapes/restoration-projects` |
| M09 | Challenges | domain | PROPOSED | — |
| M10 | Field Collection | domain | IMPLEMENTED | `/landscape/field/*` |
| M11 | Evidence | domain | PARTIALLY_EXISTING | `/platform/mrv/provenance`, `/platform/mrv/verification`, `/platform/mrv/reports` |
| M12 | EcoCoin | domain | PROPOSED | — |
| M13 | MRV | domain | PARTIALLY_EXISTING | `/platform/mrv/*`, `/mrv` |
| M14 | EDI | integration | BACKEND_ONLY | — |
| M15 | Canonical Data | integration | BACKEND_ONLY | — |
| M16 | HyDroMA | science | IMPLEMENTED | `/science/*`, `/hydroma` |
| M17 | Tourism | domain | PARTIALLY_EXISTING | `/tourism/*` |
| M18 | Booking | domain | PARTIALLY_EXISTING | `/tourism/book/*`, `/tourism/bookings` |

### 2.1 Module dependencies

| Module | Declared dependencies |
|---|---|
| M01 Public Experience | M02, M03, M06, M16, M17 |
| M02 Identity & Access | — |
| M03 Landscape Management | M02, M10, M13 |
| M04 Agriculture | M03, M05, M07 |
| M05 Inventory | M04, M06, M07 |
| M06 Marketplace | M02, M05, M07 |
| M07 Finance & Revenue | M05, M06, M18 |
| M08 Restoration | M03, M10, M11, M13 |
| M09 Challenges | M03, M08, M10 |
| M10 Field Collection | M14, M15 |
| M11 Evidence | M13, M16 |
| M12 EcoCoin | M07, M11, M13 |
| M13 MRV | M11, M16 |
| M14 EDI | M15 |
| M15 Canonical Data | — |
| M16 HyDroMA | — (independent engine) |
| M17 Tourism | M18, M06 |
| M18 Booking | M17, M07 |

A module must not depend on a module outside this list without an explicit contract change.

### 2.2 Module status definitions

| Status | Meaning |
|---|---|
| `IMPLEMENTED` | Routes, data path and tests exist for the module's core flow. |
| `PARTIALLY_EXISTING` | UI/routes exist, but data, API, or a required capability is incomplete. |
| `PROPOSED` | Target module; no routes or data. |
| `BACKEND_ONLY` | Service/contract exists; no frontend route. |

---

## 3. Public experience (M01) and identity (M02)

### 3.1 Public routes

| Path | Status | Notes |
|---|---|---|
| `/` | EXISTING | Home, 15-locale content. |
| `/ecosystem` | EXISTING | Ecosystem content. |
| `/hydroma` | DEPRECATED_CANDIDATE | Public HyDroMA intro; duplicate of `/science`. CTA to `/science`. |
| `/marketplace` | DEPRECATED_CANDIDATE | Document redirect to `/market/`; no public marketplace content page. |
| `/mrv` | EXISTING | Public MRV content. |
| `/knowledge` | EXISTING | Public knowledge content. |
| `/about` | EXISTING | About content. |
| `/contact` | EXISTING | Form is validated but **not wired** to a backend. |
| `/partner` | EXISTING | Partnership content. |
| `/login` | EXISTING | Real API login/register. |
| `/profile` | PARTIALLY_EXISTING | Real console profile page; not in public navigation. |
| `/security` | PARTIALLY_EXISTING | Real console security page; not in public navigation. |
| `*` | EXISTING | Public 404. |

### 3.2 Public content definitions not rendered

`SiteContent.pages` defines 12 keys. Three are not used as public content routes:

| Key | Why not rendered |
|---|---|
| `landscape` | Replaced by the `/landscape` section. |
| `marketplace` | `/marketplace` redirects to `/market/`. |
| `tourism` | Replaced by the `/tourism` section. |

This is a **conflict** (C-02) between content and routing, not an implementation claim.

### 3.3 Identity routes

| Path | Status | Guard |
|---|---|---|
| `/login` | EXISTING | public |
| `/profile` | PARTIALLY_EXISTING | session; guest sees the real AuthPanel |
| `/security` | PARTIALLY_EXISTING | session; guest sees the real AuthPanel |
| `/landscape/admin/organizations` | EXISTING | session + `org.read` |
| `/landscape/admin/organizations/:id` | EXISTING | session + `org.read` |
| `/landscape/admin/users` | EXISTING | session + `users.read` |
| `/landscape/admin/users/:id` | EXISTING | session + `users.read` |
| `/landscape/admin/settings` | EXISTING | session + `org.update`, redirect `/landscape/admin` |

### 3.4 Permissions by route group

| Route group | Required permission | Enforcement |
|---|---|---|
| Public pages, `/login` | none | public |
| `/profile`, `/security` | session | session |
| `/landscape/admin/organizations*` | `org.read` | route handle + server |
| `/landscape/admin/users*` | `users.read` | route handle + server |
| `/landscape/admin/settings` | `org.update` | route handle + server |
| `/tourism/host`, `/tourism/bookings` | business organization | `RequireRole` + server |
| `/market/seller` | seller record from API | `RequireRole` + server |
| `/platform/agriculture/*` | `landscape.read` / `landscape.write` (module-level) | **not enforced** (C-06) |
| `/platform/finance/*` | `billing.read` / `billing.manage` (module-level) | **not enforced** (C-06) |
| `/platform/mrv/*` | `reports.read` / `hydroma.run` (module-level) | **not enforced** (C-06) |
| `/science/*` | public; `hydroma.run` for run actions | partial |

The full per-route list is in `route-registry.json` (`permissions` field).

---

## 4. Workspace (AD-003) — `/platform/*`

The workspace is a single route tree generated from `apps/platform/src/content/pages.ts`. It renders 73 page definitions:

| Section | Pages | Paths |
|---|---:|---|
| overview | 1 | `/platform` |
| landscape | 16 | `/platform/landscapes`, `/atlas`, `/villages`, `/nomadic-territories`, `/rangelands`, `/farms`, `/natural-resources`, `/:id`, `/assessment`, `/management-plan`, `/restoration-projects`, `/management-group`, `/stakeholders`, `/economy`, `/monitoring`, `/reports` |
| agriculture | 10 | `/platform/agriculture`, `/farms`, `/crops`, `/planning`, `/irrigation`, `/health`, `/inputs`, `/livestock`, `/performance`, `/reports` |
| mrv | 8 | `/platform/mrv`, `/land-degradation`, `/restoration`, `/carbon`, `/methodologies`, `/reports`, `/verification`, `/provenance` |
| projects | 10 | `/platform/projects`, `/list`, `/:id`, `/design`, `/operations`, `/tasks`, `/budget`, `/monitoring`, `/results`, `/reports` |
| knowledge | 8 | `/platform/knowledge`, `/library`, `/research`, `/indigenous-knowledge`, `/courses`, `/content`, `/community`, `/researchers/:id` |
| finance | 8 | `/platform/finance`, `/accounts`, `/entries`, `/income-expense`, `/payments`, `/wallet`, `/settlements`, `/reports` |
| community | 4 | `/platform/community/notifications`, `/messages`, `/groups`, `/activities` |
| governance | 8 | `/platform/governance`, `/users`, `/organizations`, `/services`, `/content`, `/data`, `/audit`, `/settings` |

**Conflict (C-01):** `/platform/*` is not session-gated. AD-003 says the specialised workspace is for authenticated users; today any guest can open it. The pages render local registry content, not tenant data, so this is a product/security gap rather than a data leak.

---

## 5. Sections

### 5.1 Tourism (M17) + Booking (M18)

| Path | Status | Notes |
|---|---|---|
| `/tourism` | EXISTING | Section home. |
| `/tourism/destinations` | EXISTING | Content-backed destination list. |
| `/tourism/destinations/:slug` | EXISTING | Destination detail + map. |
| `/tourism/nomadic` | EXISTING | Nomadic communities. |
| `/tourism/nomadic/:slug` | EXISTING | Seasonal migration detail. |
| `/tourism/stays` | EXISTING | Stays list. |
| `/tourism/stays/:slug` | EXISTING | Stay detail. |
| `/tourism/experiences` | EXISTING | Experiences list. |
| `/tourism/experiences/:slug` | EXISTING | Experience detail. |
| `/tourism/tours` | EXISTING | Tours list. |
| `/tourism/events` | EXISTING | Events calendar. |
| `/tourism/map` | EXISTING | Map. |
| `/tourism/host/signin` | EXISTING | Host sign-in (real session). |
| `/tourism/host` | PARTIALLY_EXISTING | Gated by `isHost` (business org); dashboard content is placeholder. |
| `/tourism/bookings` | PARTIALLY_EXISTING | Gated; local booking store. |
| `/tourism/book/:kind/:slug` | PARTIALLY_EXISTING | Local demo request; no availability lock or payment. |
| `*` | EXISTING | Tourism 404. |

### 5.2 Marketplace (M06)

| Path | Status | Notes |
|---|---|---|
| `/market` | EXISTING | Market home. |
| `/market/catalog` | PARTIALLY_EXISTING | Filters, sorting, list/grid; content-backed catalog. |
| `/market/categories` | EXISTING | Category tree. |
| `/market/stores` | EXISTING | Seller list from API. |
| `/market/p/:slug` | PARTIALLY_EXISTING | Product detail; content-backed product. |
| `/market/s/:slug` | EXISTING | Seller page from API. |
| `/market/cart` | EXISTING | Local cart store. |
| `/market/checkout` | PARTIALLY_EXISTING | Splits by seller; no payment. |
| `/market/orders` | PARTIALLY_EXISTING | Local demo orders. |
| `/market/seller` | PARTIALLY_EXISTING | Gated by seller role; dashboard is placeholder. |
| `/market/seller/signin` | EXISTING | Real sign-in/register. |
| `*` | EXISTING | Market 404. |

### 5.3 Landscape (M03) + Field (M10) + Admin (M02)

| Path | Status | Notes |
|---|---|---|
| `/landscape` | EXISTING | Landscape dashboard. |
| `/landscape/landscapes/*` | EXISTING | 16 pages, atlas, register detail. |
| `/landscape/field` | EXISTING | Field home. |
| `/landscape/field/survey` | EXISTING | Observation form. |
| `/landscape/field/records` | EXISTING | Local queue + sync status. |
| `/landscape/field/map` | EXISTING | Field map. |
| `/landscape/admin` | EXISTING | Console home. |
| `/landscape/admin/components` | EXISTING | Design-system preview. |
| `/landscape/admin/organizations` | EXISTING | API-backed. |
| `/landscape/admin/organizations/:id` | EXISTING | API-backed detail. |
| `/landscape/admin/users` | EXISTING | API-backed. |
| `/landscape/admin/users/:id` | EXISTING | API-backed detail. |
| `/landscape/admin/notifications` | EXISTING | Audit-derived notifications. |
| `/landscape/admin/profile` | EXISTING | Real profile. |
| `/landscape/admin/security` | EXISTING | Real security. |
| `/landscape/admin/settings` | EXISTING | Org settings. |
| `*` | EXISTING | Landscape 404. |

### 5.4 Science (M16)

| Path | Status | Notes |
|---|---|---|
| `/science` | EXISTING | Dashboard. |
| `/science/water` | EXISTING | Water domain page. |
| `/science/soil` | EXISTING | Soil domain page. |
| `/science/climate` | EXISTING | Climate domain page. |
| `/science/vegetation` | EXISTING | Vegetation domain page. |
| `/science/remote-sensing` | EXISTING | Remote sensing. |
| `/science/map` | EXISTING | Map (vendor chunk). |
| `/science/simulation` | EXISTING | Simulation. |
| `/science/scenarios` | EXISTING | Scenarios. |
| `/science/projects` | EXISTING | Project portfolio. |
| `/science/models` | EXISTING | Model registry from the engine; explicit unavailable state. |
| `/science/run` | EXISTING | Run form; local model execution. |
| `*` | EXISTING | Science 404. |

---

## 6. Proposed routes (not implemented)

These are target routes from the module flows. They are **PROPOSED** and must not be linked from production navigation until implemented.

| Module | Proposed route | Purpose |
|---|---|---|
| M05 Inventory | `/platform/inventory`, `/items`, `/movements`, `/warehouses`, `/stock` | Stock, movements, valuation layers. |
| M09 Challenges | `/platform/challenges`, `/:id` | Restoration challenges. |
| M12 EcoCoin | `/platform/eco-coin`, `/wallet`, `/issuance`, `/transactions` | Digital economy. |
| M07 Finance | `/platform/finance/ledger`, `/reconciliation`, `/tourism-revenue` | Ledger and revenue. |
| M08 Restoration | `/platform/restoration`, `/baselines` | Restoration entry and baselines. |
| M11 Evidence | `/platform/evidence`, `/:id` | Evidence register. |
| M14 EDI | `/platform/integrations/edi` | EDI status and contracts. |
| M15 Canonical Data | `/platform/integrations/canonical` | Canonical schema browser. |
| M06 Marketplace | `/market/seller/register`, `/market/seller/products/new` | Seller provisioning. |
| M18 Booking | `/tourism/availability`, `/tourism/bookings/:id` | Availability and booking detail. |
| M13 MRV | `/platform/mrv/credits`, `/:id` | Registry credit (not issued today). |
| M04 Agriculture | `/platform/agriculture/inputs/new`, `/crops/new` | Real write flows. |

---

## 7. Conflicts and deprecated candidates

### 7.1 DEPRECATED_CANDIDATE routes

| Route | Status | Reason |
|---|---|---|
| `/marketplace` | DEPRECATED_CANDIDATE | Document redirect to `/market/`; no public marketplace page. Candidate for removal or a real intro page. |
| `/hydroma` | DEPRECATED_CANDIDATE | Duplicate public entry to the science section at `/science`. Keep one canonical entry. |

### 7.2 PARTIALLY_EXISTING routes

| Area | Status | Reason |
|---|---|---|
| `/profile`, `/security` | PARTIALLY_EXISTING | Real pages, but not linked from the public header. |
| `/platform/agriculture/*`, `/finance/*`, `/projects/*`, `/mrv/*` | PARTIALLY_EXISTING | UI pages render from local registry content; no domain API/write flow. |
| `/market/checkout`, `/market/orders`, `/tourism/book/*`, `/tourism/bookings`, `/tourism/host` | PARTIALLY_EXISTING | Local demo store; no payment, availability or revenue posting. |

### 7.3 Conflicts

| ID | Route / area | Conflict |
|---|---|---|
| C-01 | `/platform/*` | Workspace is not session-gated (AD-003). |
| C-02 | Public content keys `landscape`, `marketplace`, `tourism` | Defined but not rendered as content pages. |
| C-03 | `/hydroma` vs `/science` | Two public entry points to the same capability. |
| C-04 | `/marketplace` | Redirect to `/market/` is a document navigation, not a client-side route. |
| C-05 | `/profile`, `/security` | Real pages exist but are not linked from the public header. |
| C-06 | Field 404 | `sections/landscape/field/pages/NotFoundPage.tsx` is dead; the section uses `EmptyState`. |
| C-07 | Admin legacy router | `sections/landscape/admin/app/router.tsx` + `RouteErrorPage.tsx` are dead copies. |
| C-08 | Science `DomainPage` | Not a route; shared page component. Not a conflict, but not a standalone page. |

See [CURRENT_STATE_VS_TARGET.md](./CURRENT_STATE_VS_TARGET.md) for impact and owner decisions.