# FRONTEND SOURCE-CODE REALITY AUDIT

**Repository:** `D:\NOJIN`  
**HEAD:** `a3103061f561eb4289137b5f3362785580dfe28b`  
**Branch:** `main`  
**Method:** read-only source inspection + executed verify commands  
**Code changes:** none (only this report was created)  
**Completion:** `FRONTEND_AUDIT_COMPLETED_WITH_LIMITATIONS` (E2E/visual checks not executed)

> All findings below were derived from source files, not from documentation, ADRs, prior reports or READMEs. Persian text was verified with UTF-8-aware reads; an earlier apparent mojibake in `NotFound` was a terminal decoding artifact and is **not** a defect.

---

## 1. Real inventory

### 1.1 Applications

| App | Path | Stack | Role | Status |
|---|---|---|---|---|
| Platform | `apps/platform` | React 19, react-router 7, Vite 8, TanStack Query | Unified public core + `/platform` workspace + `/science`, `/market`, `/tourism`, `/landscape` sections | ACTIVE |
| Brand | `apps/brand` | React + Vite | Brand/identity SVG gallery (`BrandApp.tsx`) | ACTIVE (non-product) |
| legacy-* (8 apps) | `archive/legacy-*` | various | Archived prior apps (console, portal, tourism, market, science, home, site, field) | ARCHIVED |

Frontend source files (`apps` + `packages`, excluding node_modules): **520** TS/TSX/JS. Platform: 277. Brand: 6.

### 1.2 Shared packages (19)

`api-client, app-shell, auth-client, configuration, design-system, domain-types, frontend-core, hydroma-client, i18n, icons, scientific, spatial, ui, utilities, validation` — consumed by the platform.

### 1.3 Route declarations (counted from source)

| File | Declarations | Notes |
|---|---|---|
| `apps/platform/src/app/router.tsx` | 73 `path:` | 21 public, 4 section mounts, platform children |
| `capabilityRoutes` block | 43 entries | canonical M01…M18 module routes |
| `PAGES` registry (`content/pages.ts`) | 78 page definitions | mapped into `/platform/*` via `PageRenderer` |
| `sections/landscape/router.tsx` | 11 `<Route>` | field + admin mount |
| `sections/landscape/admin/router.tsx` | 13 `<Route>` | organizations, users, settings |
| `sections/market/app/router.tsx` | 15 `<Route>` | catalog/cart/checkout/orders/seller |
| `sections/science/app/router.tsx` | 15 `<Route>` | 12 pages + wildcard |
| `sections/tourism/app/router.tsx` | 20 `<Route>` | demo site |
| **Total declared route entries** | **≈150 platform + 74 section** | many `/platform` paths are demo registry pages |

E2E suite declares **277 tests in 33 files** (`pnpm run test:e2e:list`).

---

## 2. Page classification (primary status)

| Status | Count (approx.) | Where |
|---|---|---|
| REAL_IMPLEMENTED | ~45–60 | agriculture/hydroma/projects/rewards/territory/community/resource modules, landscape admin, science `ModelsPage` + `RunModelPage`, field offline-sync |
| PARTIALLY_IMPLEMENTED | 4 | marketplace catalog (real) vs orders (demo); `/platform/community` → notifications; `/platform/hydroma` → model list only; field sync requires auth |
| UI_ONLY | 2 | `AtlasPage` (SVG map), `WizardPage` (read-only inputs) |
| MOCK_DATA | 78 | every `PAGES` registry page rendered by `PageRenderer` |
| FAKE_INTERACTION | 3 flows | market cart/orders (localStorage), tourism booking/host drafts (localStorage), PageRenderer create + wizard |
| PLACEHOLDER | 4 | `tourism`, `inventory`, `finance`, `administration` → `CapabilityBoundary` |
| BROKEN | 0 blocking | build/typecheck/tests pass |
| DUPLICATE | 4 pairs | marketplace ×2, HyDroMA ×3, irrigation ×2, science Projects vs platform Projects |

---

## 3. Findings with evidence

### F-001 — 78 platform registry pages are static demo data (High)
- **App/Route:** Platform, all `/platform/<PAGES path>`
- **File:** `apps/platform/src/pages/PageRenderer.tsx`
- **Evidence:** Line 72 renders `UI.demo` ("Demo data"); line 128 chart subtitle `UI.demoNote`; line 224 list filter over `list(page.entity)`; lines 243–260 create form calls API but list is never refetched; line 421 detail "related" chips are a static `CONNECTED` array (line 343).
- **Data source:** `apps/platform/src/data/entities.ts` (38 KB of demo fixtures, header line 2: "Demo fixtures").
- **Actual:** KPIs, tables, detail pages, charts and reports are generated from static fixtures; `page.series` arrays in `content/pages.ts` (78 definitions).
- **Expected:** API-backed records with provenance, or an explicit global demo mode.
- **Impact:** A user can mistake demo KPIs/reports for operational data. Labels exist, but the same URLs are presented inside the authenticated workspace.
- **Direction:** Remove demo registry from `/platform` or gate it behind a visible `DEMO` shell; wire real endpoints per module.

### F-002 — Marketplace catalog ignores the real catalog API (High)
- **App/Route:** `/market/catalog`, `/market/p/:slug`, `/market/s/:slug`, `/market/categories`, `/market/stores`
- **Files:** `apps/platform/src/sections/market/pages/CatalogPage.tsx:21-22`, `apps/platform/src/sections/market/hooks/api/catalog.ts:3,26`, `apps/platform/src/sections/market/data/catalog.ts`
- **Evidence:** `CatalogPage` imports `PRODUCTS, SELLERS, COUNTRIES` from `../data/catalog`; `useProducts` query function is `filterProducts(PRODUCTS, filters)` — a static array, despite `@eco-nojin/api-client` and `/v1/catalog/*` existing.
- **Actual:** The section marketplace is a fixture catalog.
- **Expected:** Use `/v1/catalog/products|sellers|categories` (already used by `/platform/marketplace` → `sections/api-pages/MarketplacePage.tsx`).
- **Impact:** Two contradictory marketplaces: `/platform/marketplace` real, `/market/*` static.

### F-003 — Cart/orders are browser-only and marked demo (High)
- **Files:** `apps/platform/src/sections/market/store/orders.ts:3,36`; `apps/platform/src/sections/market/store/cart.tsx:4,26,58`
- **Evidence:** `const KEY = "eco.market.orders"`, `localStorage` persistence, and every order created with `demo: true`; cart likewise local.
- **Actual:** Checkout "succeeds" locally; no API, no payment, no server record.
- **Expected:** Persist via backend or hard-block checkout with a boundary.
- **Impact:** Misleading purchase completion; data lost on browser clear/other device.

### F-004 — Tourism section is a fully local demo (Medium, disclosed)
- **Files:** `sections/tourism/lib/booking-store.ts`, `sections/tourism/components/HostStudio.tsx:25,35`
- **Evidence:** bookings are `localStorage` records with `demo !== true` rejected by `isBookingRequest`; host studio writes `eco.tourism.host.*` local keys; content files state "nothing is sent to a host".
- **Actual:** Navigation, availability and booking operate on local data.
- **Expected:** Real destinations/availability endpoints or an isolated demo origin.
- **Impact:** Contained because the UI labels it DEMO, but it is mounted at `/tourism/*` on the same origin as the product.

### F-005 — Duplicate/overlapping HyDroMA surfaces (Medium)
- **Routes:** `/hydroma` (public marketing), `/platform/hydroma` → `ModelsPage` (model list), `/platform/hydroma/datasets|environment|sources|readiness|irrigation`, `/science/*` (12 pages), `/science/run` (real run).
- **Evidence:** `router.tsx` lines 171–210; `science/app/router.tsx`.
- **Actual:** Five different entry points with different capabilities; `/platform/hydroma` does not offer the real run that `/science/run` offers.
- **Expected:** One canonical HyDroMA workspace with a single run entry.
- **Impact:** Users cannot tell which HyDroMA is authoritative.

### F-006 — Hardcoded English strings inside an i18n product (Medium)
- **File:** `apps/platform/src/pages/PageRenderer.tsx:244,251,255`
- **Evidence:** `"Close"`, `` `Create ${page.entity}` ``, `submitLabel="Create"`; also status strings `"saving"`/`"saved"`/`"error:"` around lines 257–266.
- **Actual:** Persian/Arabic UI shows English controls.
- **Expected:** Use `UI` translation keys.
- **Impact:** Breaks RTL/i18n consistency on 78 pages.

### F-007 — Two conflicting brand palettes (Medium)
- **Files:** `packages/design-system/src/tokens.css:27-49` (canonical: Royal Aubergine `#5a3d50`, Terracotta `#9c4f3b`, Champagne `#8a6937`), `packages/design-system/src/brand/tokens.json` (legacy teal `#0B5563`, coral `#E76F51`).
- **Evidence:** The JSON declares itself "LEGACY CANDIDATE — NOT CANONICAL"; platform imports `tokens.css` (`main.tsx`), but brand assets and any consumer of `brand/tokens.json` use teal.
- **Actual:** Two palettes coexist in the repository.
- **Expected:** Single token source; legacy palette deleted or moved to archive.
- **Impact:** Visual identity drift.

### F-008 — Science pages are demo indicators, not engine output (Medium, disclosed)
- **Files:** `sections/science/data/indicators.ts` (162 lines of static `Indicator` records, `DataStatus = "DEMO" | "NOT_CONNECTED" | "STALE"`); `pages/DomainPage.tsx:29` badge `hydro.statusDemo`; `pages/ScenariosPage.tsx`, `SimulationPage.tsx`, `ProjectsPage.tsx`, `MapPage.tsx` use static scenarios.
- **Exception (real):** `pages/ModelsPage.tsx` via `useHydromaModels`; `pages/RunModelPage.tsx` via `createHydromaClient` (`createRun`, `getRun`) with `ProvenancePanel`.
- **Actual:** 10 of 12 science pages are demo; 2 are real.
- **Expected:** Feed charts from run results/dataset API; keep demo pages in a demo namespace.
- **Impact:** Scientific credibility risk, mitigated by explicit badges.

### F-009 — Route and module duplication (Low)
- `irrigation` and `agriculture/irrigation` both render `IrrigationModule` (`router.tsx`).
- `landscapes` and `territories` both render `TerritoriesModule`.
- `PAGES` paths collide with capability routes; capability routes are matched first, so registry pages are unreachable for those paths.
- `community` renders `NotificationsPage` (not a community page).

### F-010 — Hybrid styling system (Low)
- `styles.css` defines a large `pl-*` class layer; other sections use Tailwind utilities and their own `styles/index.css` (market, science, tourism, landscape).
- **Impact:** inconsistent spacing/typography between sections; harder token enforcement.

### F-011 — Bundle size warning (Low)
- Build output: `ScienceMap-*.js` 686 KB, `index-*.js` 784 KB, `src-*.js` 1,075 KB (Vite warns >700 KB). MapLibre/deck.gl are the cause.
- **Direction:** keep map routes code-split (already) and lazy-load deck layers.

### F-012 — Honest capability boundaries exist (Info / positive)
- `sections/CapabilityBoundary.tsx` + `services/capabilities.ts` mark tourism, inventory, finance, administration as `BLOCKED_BY_BACKEND` with precise missing contracts. No fake success.
- `WorkspaceGate.tsx` fails closed with a real sign-in panel.

### F-013 — Contact form does not fake delivery (Info / positive)
- `public/components/ContactForm.tsx`: validates locally and the comment/status states there is no contact service; it does not claim success.

### F-014 — Auth and account pages are real (Info / positive)
- `public/app/AuthPage.tsx` uses `AuthPanel` + `useRealSession`; `AccountPage.tsx` reuses the console session and real profile/security pages.

### F-015 — PWA does not cache API data (Info / positive)
- `utils/serviceWorker.ts` registers `${BASE_URL}sw.js`; `public/sw.js` is explicit; API responses are not cached by policy. No stale identity/money risk from the SW.

### F-016 — Token discipline is largely enforced (Info / positive)
- `scripts/check-tokens.mjs`: **PASS — 227 files scanned, 10 targets**.
- Only 4 hardcoded colours exist in `sections/tourism/components/TourismMap.tsx:278,289,300,311` (`#ffffff` map circle strokes).

---

## 4. Backend connection audit

| Capability | Client | Endpoint | UI uses response | Persists | Status |
|---|---|---|---|---|---|
| Farms CRUD | `services/hooks.ts` `useResourceList/Create/Update/Delete` | `/v1/resources/farms` | yes | yes + cache invalidate | REAL |
| Projects/territories/villages/sites/reports/articles/surveys | same hooks | `/v1/resources/:type` | yes | yes | REAL |
| Marketplace (platform) | `useProducts/useSellers/useCategories` | `/v1/catalog/*` | yes | read-only | REAL (read) |
| Marketplace (section) | `sections/market/hooks/api/catalog` | none (static) | n/a | no | MOCK |
| Rewards/EcoCoin/Challenges | `services/hooks.ts` | `/v1/ecocoin/*`, `/v1/challenges/*` | yes | yes | REAL |
| HyDroMA runs | `@eco-nojin/hydroma-client` | engine gateway | yes | run persistence | REAL |
| HyDroMA demo indicators | static `indicators.ts` | none | n/a | no | MOCK |
| Tourism bookings | localStorage | none | local | browser only | MOCK |
| Field observations | `utilities.readPersisted` + API sync | `/v1/resources/surveys` | yes | offline-first + sync | REAL |

Error/loading/empty handling: `components/ApiState.tsx` (`ApiBoundary`, `ApiEmpty`, loading placeholder) is used by real modules. `PageRenderer` has only a local status string.

---

## 5. Design system / visual

- Canonical tokens present and imported (`tokens.css`, `tailwind.css`, `base.css`); Aubergine/Terracotta/Champagne values correct.
- `packages/ui` provides 14 component modules (buttons, forms, tables, charts, overlays, pagination, resource CRUD).
- Legacy teal palette still in `brand/` (F-007).
- `apps/brand` is an SVG gallery, not a product surface.
- Visual consistency is mixed because four sections own separate CSS (F-010).

## 6. RTL / i18n / responsive

- **RTL is real:** `packages/i18n/src/provider.tsx:102-107` sets `document.documentElement.lang/dir`; `DirectionProvider` exposes `isRtl`; `index.html` defaults `lang="fa" dir="rtl"`.
- Locale catalogs for fa/en/ar; format helpers for numbers/dates.
- **Gaps:** hardcoded English in `PageRenderer` (F-006); public marketing strings come from content files (OK); science pages use translation keys.
- Responsive: Tailwind breakpoints and logical properties; tables wrapped (`pl-tableWrap`); E2E includes overflow test (`verify.spec.ts:76`). Not visually verified in this audit.

## 7. Accessibility / technical quality

- `@axe-core/playwright` and `a11y.spec.ts` exist; not executed here.
- Semantic landmarks in `PlatformLayout`, skip link, aria-live fallback (`SectionFallback`).
- Charts expose summaries; badges carry text.
- TypeScript strict compile passes; only a few `as never` casts in science pages.
- React key usage is sound in inspected lists; no obvious missing-key defects.

## 8. HyDroMA frontend verdict

- `RunModelPage.tsx`: real POST run + poll + provenance panel — REAL.
- `ModelsPage.tsx`: real service discovery with explicit loading/unavailable/error/empty — REAL.
- `DomainPage`, `Diagnostics`, `Scenarios`, `Simulation`, maps: demo fixtures with `DEMO`/`NOT_CONNECTED` badges — MOCK_DATA, disclosed.
- Units/uncertainty/provenance are modelled in the demo data and rendered, but they are fixture values, not measurements.

## 9. Build & runtime verification (executed)

| Command | Result |
|---|---|
| `tsc --noEmit -p tsconfig.json` | PASS (exit 0) |
| `oxlint apps/platform/src packages/ui/src` | PASS (exit 0) |
| `vitest run` | PASS — 88 files, 560 tests |
| `pnpm run build:platform` | PASS — built in ~3.1 s; chunk >700 KB warning |
| `scripts/architecture-guardrails.mjs` | PASS — 10 backend/HyDroMA files |
| `scripts/check-tokens.mjs` | PASS — 227 files, 10 targets |
| `scripts/check-bundle-budget.mjs` | PASS — capped chunks within budget (vendor excluded) |
| `playwright --list` | 277 tests in 33 files (not executed: needs API/browser/engine) |

Not executed: Playwright runtime, axe scan, real HyDroMA engine, authenticated flows requiring `services/api`.

## 10. Repository integrity

- HEAD `a3103061f561eb4289137b5f3362785580dfe28b`, branch `main` — unchanged.
- Working tree already contained 306 modified/untracked entries before the audit; the audit added only `docs/reports/frontend-source-code-reality-audit.md`.
- No source, config, build artifact, dataset or git state was modified.

---

## 11. Route inventory appendix

### 11.1 Public core (`/`, `PortalLayout`) — marketing/auth, content-driven
`/`, `/ecosystem`, `/hydroma`, `/marketplace`, `/mrv`, `/knowledge`, `/about`, `/vision`, `/impact`, `/landscapes`, `/projects`, `/technology`, `/partners`, `/accessibility`, `/privacy`, `/terms`, `/contact`, `/partner`, `/login`, `/profile`, `/security`, `*`.

### 11.2 Section mounts
`/tourism/*` (demo), `/market/*` (static catalog + demo orders), `/landscape/*` (field + admin), `/science/*` (demo + 2 real HyDroMA), `/platform` (authenticated).

### 11.3 `/platform` capability routes (REAL unless marked)
`territories`, `landscapes`, `communities/:id`, `communities`, `natural-resources`, `hydroma/sources`, `hydroma/readiness`, `hydroma/irrigation`, `hydroma/environment`, `hydroma/datasets`, `hic`, `hydroma` (ModelsPage), `agriculture/intelligence`, `agriculture/:id`, `irrigation`, `tasks/schedule`, `tasks/:id`, `tasks`, `agriculture`, `agriculture/cycles`, `agriculture/irrigation`, `agriculture/observations`, `marketplace`, `ecocoin`, `challenges`, `community` (NotificationsPage), `projects/:id`, `projects`, `field`, `mrv`, `knowledge`, `reports`, `landscapes/:id`, `villages/:id`, `farms/:id`, `sites/:id`, `articles/:id`, `surveys/:id`, `reports/:id`.
PLACEHOLDER: `tourism`, `inventory`, `finance`, `administration` → `CapabilityBoundary`.

### 11.4 `/platform` registry routes (all MOCK_DATA, 78)
Generated from `content/pages.ts` (dashboard/list/detail/wizard/report/map) and rendered by `PageRenderer`; includes agriculture planning, MRV sites, finance, incentives, governance, knowledge and community sub-pages. These are unreachable where a capability route shares the same path.

### 11.5 Section route files
- Landscape: 11 routes (field survey/records/map + `admin/*`).
- Landscape admin: 13 routes (organizations, organizations/:id, users, users/:id, notifications, profile, security, settings, components, `*`).
- Market: 15 routes (catalog, categories, stores, p/:slug, s/:slug, cart, checkout, orders, seller, seller/signin, `*`).
- Science: 15 routes (index, water, soil, climate, vegetation, remote-sensing, map, simulation, scenarios, projects, models, run, `*`).
- Tourism: 20 routes (destinations, stays, experiences, tours, events, map, host, bookings, book/:kind/:slug, `*`).

---

## 12. Prioritized remediation plan

### P0 — misleading operations
1. Isolate or remove the 78 `PAGES` demo pages from the authenticated `/platform` namespace (F-001). Acceptance: no demo KPI reachable without a visible DEMO banner and separate route prefix.
2. Block or relabel market checkout until an orders endpoint exists (F-003). Acceptance: no success state without server record.
3. Fix hardcoded English controls (F-006). Acceptance: no ASCII-only labels in fa/ar.

### P1 — fake/partial capabilities
4. Point `/market/*` to `/v1/catalog/*` or delete the duplicate section in favour of `/platform/marketplace` (F-002).
5. Consolidate HyDroMA entry points; make `/platform/hydroma` the canonical workspace including run (F-005).
6. Keep science demo pages but move to `/science/demo` or force a demo banner at layout level (F-008).

### P2 — architecture & design system
7. Remove legacy teal palette; fail CI if `brand/tokens.json` is consumed (F-007).
8. Unify section CSS into tokens/`packages/ui`; delete duplicate section styles (F-010).
9. De-duplicate routes (`irrigation`, `landscapes`/`territories`) and rename `/platform/community` (F-009).

### P3 — UX / responsive / a11y
10. Run axe + overflow E2E in CI; fix reported violations.
11. Verify RTL/LTR switching on all four sections and tables.

### P4 — performance & cleanup
12. Split map/deck chunks further; enforce bundle budget on `ScienceMap`.
13. Remove archived apps from lint scope once migration is confirmed.

**Order:** P0-1 → P0-2 → P1-4 → P1-5 → P0-3 → P2 → P3 → P4.

---

## 13. Completion classification

`FRONTEND_AUDIT_COMPLETED_WITH_LIMITATIONS`

Reason: static analysis, unit tests, typecheck, lint and production build were executed; Playwright/axe/engine-backed runtime checks were not executed because they require the API, browser matrix and Python HyDroMA runtime.
