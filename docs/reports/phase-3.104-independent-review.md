# PHASE 3.104 — INDEPENDENT SOURCE-CODE REVIEW

**Reviewer:** Nemotron 3 Ultra  
**Classification:** `INDEPENDENT_REVIEW_ACCEPTED_WITH_MINOR_FINDINGS`  
**Implementation / source / Git / DB / deploy authority:** none used  
**Method:** read-only source inspection, route-ranking replication, targeted typecheck/test/token runs

---

## 1. Baseline

| Item | Value |
|---|---|
| HEAD | `a3103061f561eb4289137b5f3362785580dfe28b` (unchanged) |
| Branch | `main` |
| Working tree | 330 entries (pre-existing + Phase 3.104 work) |
| Source modified during review | none |
| Git/DB/deploy mutation | none |

## 2. Scope

Phase 3.104 files: platform router/layout/demo boundary, `PageRenderer`, registry content, market demo boundary, science router/layout and HyDroMA models page, i18n catalogs, token guard, integrity test.

## 3. Method

1. Read the actual implementation files (not the executor report).
2. Counted registry definitions and capability paths by parsing source.
3. Replicated React Router ranking with `matchRoutes` on representative duplicate/static/dynamic route sets to determine which branch wins.
4. Re-ran read-only checks: `tsc --noEmit` (exit 0), the integrity test file (9/9), `check-tokens` (exit 0).
5. Inspected Playwright configuration and API database configuration for E2E safety.
6. Did **not** run the browser suite or mutate any DB.

## 4. Files inspected

```
apps/platform/src/app/router.tsx
apps/platform/src/app/PlatformLayout.tsx
apps/platform/src/app/DemoLayout.tsx
apps/platform/src/pages/PageRenderer.tsx
apps/platform/src/content/pages.ts
apps/platform/src/content/ui.ts
apps/platform/src/data/entities.ts
apps/platform/src/sections/market/app/MarketLayout.tsx
apps/platform/src/sections/market/pages/CheckoutPage.tsx
apps/platform/src/sections/market/store/orders.ts
apps/platform/src/sections/market/store/cart.tsx
apps/platform/src/sections/api-pages/MarketplacePage.tsx
apps/platform/src/services/hooks.ts
apps/platform/src/sections/science/app/router.tsx
apps/platform/src/sections/science/app/ScienceLayout.tsx
apps/platform/src/sections/science/pages/ModelsPage.tsx
apps/platform/src/sections/science/pages/RunModelPage.tsx
packages/i18n/src/catalogs/{en,fa,ar,de,es,fr,id,it,ja,pt,ru,tr,zh}.ts
packages/design-system/src/tokens.css
packages/design-system/src/brand/{tokens.json,tokens.css,themes.css}
scripts/check-tokens.mjs
apps/platform/tests/unit/integrity/product-integrity.test.ts
playwright.config.ts
services/api/src/db.mjs
apps/platform/public/sw.js
```

## 5. Demo boundary findings

Verified facts:

- `PAGES` contains **77** definitions; **76** have a non-empty path.
- The platform router wraps the registry mapping in a pathless `<DemoLayout />` route and adds `/platform/demo` (`router.tsx:218-225`).
- `DemoLayout.tsx:20-28` renders a persistent `role="note"` banner with a link back to `/platform`. It is part of the route element, so direct URL access preserves it.
- `PageRenderer.tsx` no longer imports `createApiClient` and has no `api.resources.create` call; demo create only sets local `"saved"` state (line 257). Export is disabled (line 76).
- No other mutation/persistence path exists inside `PageRenderer`; charts, lists and wizard are local/static.
- **Reachability:** 13 of the 76 registry paths are exact duplicates of capability routes and are therefore unreachable as demo pages:
  `landscapes`, `landscapes/:id`, `agriculture`, `agriculture/cycles`, `agriculture/irrigation`, `agriculture/observations`, `mrv`, `projects`, `projects/:id`, `knowledge`, `finance`, `ecocoin`, `challenges`.
  Effective demo entries: **63**; unreachable demo definitions: **13** (pre-existing collision behaviour, not introduced by Phase 3.104).
- Dynamic parameters cannot bypass the boundary: a dynamic capability branch renders a real detail page (no demo data), while static demo children outrank `:id` and render inside `DemoLayout`.

## 6. Marketplace findings

- Authoritative catalog: `/platform/marketplace` → `MarketplacePage.tsx:44-46` calls `useProducts/useSellers/useCategories`; hooks call `api.catalog.*` (`services/hooks.ts:139-164`). `ApiBoundary` renders loading/error states; no fixture fallback (`MarketplacePage.tsx:66`).
- Demo market: `MarketLayout.tsx:181-190` renders a persistent demo banner and a link to `/platform/marketplace`.
- Checkout: creates `demo: true` orders via `ordersFromGroups`, stores them in `localStorage`, shows "Demo order created — no payment was taken" (`CheckoutPage.tsx:38-41`), and the page carries a DEMO badge + payment-disabled alert (lines 95-99).
- No server order creation, payment or stock reservation exists or is claimed.
- Remaining static catalog classification: **`DEMO_ONLY_WITH_BOUNDARY`** — clearly labelled, linked to the real catalog, but not API-backed.

## 7. HyDroMA findings

- `/platform/hydroma/run` is declared (`router.tsx:80`) and lazily loads `RunModelPage`.
- `RunModelPage.tsx:22-25` calls `createHydromaClient(...).createRun()` then `getRun()`, and renders `ProvenancePanel` (line 44). Real execution flow is intact.
- `/platform/hydroma` renders `ModelsPage`, which links to run/datasets/readiness/sources (`ModelsPage.tsx:63-80`), but **only in the ready state**; loading/unavailable/error/empty states return before the workspace panel (lines 19-51).
- `/science` redirects to `/science/demo`; demo pages are under a `ScienceDemoBoundary` with a persistent warning; `/science/models` and `/science/run` are outside it (`science/app/router.tsx:87-105`).
- Old `/science/{water,…}` URLs redirect to `/science/demo/*`; no loop exists because the target routes are concrete.
- No demo indicator is presented as model output.

## 8. Route-resolution table (verified with `matchRoutes` replication)

| Requested URL | Winning branch | Boundary | Result |
|---|---|---|---|
| `/platform/agriculture` | capability `FarmsModule` | none (real) | real |
| `/platform/agriculture/abc` | capability `agriculture/:id` (`FarmDetail`) | none (real) | real |
| `/platform/agriculture/farms` | demo `agriculture/farms` | `DemoLayout` | demo |
| `/platform/agriculture/planning` | demo `agriculture/planning` | `DemoLayout` | demo |
| `/platform/agriculture/cycles` | capability (exact duplicate, first) | none | real |
| `/platform/projects` | capability `ProjectsModule` | none | real |
| `/platform/projects/p1` | capability `projects/:id` | none | real |
| `/platform/projects/list` | demo `projects/list` | `DemoLayout` | demo |
| `/platform/community/notifications` | demo | `DemoLayout` | demo |
| `/platform/demo` | demo index | `DemoLayout` | demo |
| `/science` | redirect | — | `/science/demo` |
| `/science/water` | redirect | — | `/science/demo/water` |
| `/science/models` | real | none | real |
| `/science/run` | real | none | real |

Static demo children outrank dynamic capability params (React Router ranking). The executor report's statement that capability routes always win was imprecise; actual behaviour is above. The conflict itself is pre-existing.

## 9. Translation findings

- fa/en/ar `UI` keys for close/create/saving/saved/error/demo banner exist and are non-empty.
- `runModel`/`run` are now translated in Persian and Arabic; all 13 catalogs contain the new hydroma/market keys (hi/ko re-export English).
- Remaining defect: `ENTITY_FIELDS` in `PageRenderer.tsx:16-48` still uses hardcoded English labels (`"Name"`, `"Region"`, `"Area (ha)"`, `"Owner"`, …) rendered by the demo create form in fa/ar. This is a user-facing control label, not a technical enum.
- No missing-key type error: `tsc` passes.

## 10. Token guard findings

- Canonical tokens remain authoritative (`tokens.css`; Aubergine/Terracotta/Champagne). No consumer imports the legacy brand palette.
- New guard scans `apps/` and `packages/` for seven legacy hexes and excludes only `packages/design-system/src/brand/` + `brand.css` (justified).
- **Bypass:** `walk()` only collects `.ts`, `.tsx`, `.css` (`check-tokens.mjs:43`). `.json`, `.js`, `.jsx`, `.mjs`, `.html`, `.svg`, `.scss` are not scanned; `brand/tokens.json` itself is outside the scan.
- **Incomplete palette list:** legacy files contain additional shades not matched by `LEGACY_PALETTE_RE` (e.g. `#B53030`, `#C9553A`, `#D9682B`, `#C9A34A`, `#1F4A78`).
- No false positives observed; `check-tokens` exits 0 over 671 files.

## 11. Test-quality analysis

| # | Claim | Classification | Reason |
|---|---|---|---|
| 1 | 76 registry paths / 77 pages | `STRUCTURAL_TEST` | Real data assertion against `PAGES`; does not test rendering. |
| 2 | Demo boundary wired | `SOURCE_ASSERTION` | Greps router source strings; does not resolve routes. |
| 3 | Demo pages cannot write API | `SOURCE_ASSERTION` | Absence of identifiers is good evidence but not runtime. |
| 4 | fa/en/ar demo labels | `STRUCTURAL_TEST` | Checks key presence/non-empty only. |
| 5 | Orders always `demo: true` | `BEHAVIORAL_TEST` | Executes `ordersFromGroups`. |
| 6 | Market link/hooks | `SOURCE_ASSERTION` | Greps two files; does not render. |
| 7 | `/platform/hydroma/run` exists | `SOURCE_ASSERTION` | String presence only. |
| 8 | Science demo separation | `SOURCE_ASSERTION` | String presence only; does not verify redirect/ranking. |
| 9 | HyDROMA labels translated | `SOURCE_ASSERTION` | Reads catalogs. |

Only 1 of 9 is behavioral. No test covers direct-URL banner rendering, route ranking, API-failure-no-fallback, or checkout UI wording. Claims are therefore **partially supported**.

## 12. E2E safety assessment

- `playwright.config.ts` starts `services/api/src/server.mjs` with `NOJIN_DB=databases/api/nojin-e2e.db`, `PORT=8000`, `reuseExistingServer:false`.
- That database already exists (`nojin-e2e.db` + WAL ≈ 4.5 MB), so a run would mutate an existing SQLite file; it is dedicated to E2E but not a temporary per-run database, and DB mutation was not authorized for this phase.
- The dev server uses `reuseExistingServer:true` on port 5181, which may attach to another running instance.
- **Conclusion:** E2E was **not run**. A safe run would require a fresh temporary `NOJIN_DB` (and ideally a unique port); the current config hardcodes the path and would need a config change, which this review is not authorized to make.

## 13. Regression assessment

- Proven defect: shared `PlatformLayout` now links to `${basePath}/demo` (`PlatformLayout.tsx:128`). Under `/landscape/*`, `basePath="/landscape"`, so the link targets `/landscape/demo`, which has no route and lands in the landscape wildcard 404. This is a new navigation regression in the landscape section.
- Science URL restructure relies on redirects; internal links were searched: only `PageRenderer.tsx:652` links `/science/map/`, which redirects correctly.
- PWA: `sw.js` does not cache `/api/*`; unchanged by this phase.
- Auth: `/platform/*` still behind `WorkspaceGate`; no change.
- Real API modules untouched except imports; no fallback introduced.
- No proven translation regression; typecheck passes.
- Browser-level risks remain: sticky banner stacking, RTL banner layout, active nav state after redirects.

## 14. Findings

### IR-001 — Broken demo link in landscape section (MEDIUM)
- **Location:** `apps/platform/src/app/PlatformLayout.tsx:128`
- **Evidence:** `to={`${basePath}/demo`}`; `landscape/router.tsx:36` passes `basePath="/landscape"`; landscape router has no `demo` route and falls to `*` 404 (lines 58-61).
- **Actual:** "Open demo page" in `/landscape/*` navigates to `/landscape/demo` → not found.
- **Expected:** Demo link only when a demo route exists, or a platform-absolute `/platform/demo`.
- **Impact:** Dead navigation in a real section.
- **Classification:** regression.
- **Action:** Render the footer demo link only for the platform base, or derive it from a route that exists.

### IR-002 — Hardcoded English form labels remain in demo pages (MEDIUM)
- **Location:** `apps/platform/src/pages/PageRenderer.tsx:16-48`
- **Evidence:** `ENTITY_FIELDS` labels are raw English strings (`"Name"`, `"Region"`, `"Owner"`, `"Area (ha)"`).
- **Actual:** fa/ar demo create forms show English field labels.
- **Expected:** localized labels via `UI`/`Loc`.
- **Impact:** Phase 3.104 i18n acceptance is not fully met.
- **Classification:** incomplete requirement.
- **Action:** replace with `Loc` labels and `l(...)`.

### IR-003 — Token guard has bypass paths (MEDIUM)
- **Location:** `scripts/check-tokens.mjs:33,43,79`
- **Evidence:** only `.ts/.tsx/.css` are walked; legacy regex covers 7 hex values while legacy CSS contains more.
- **Actual:** `.json/.js/.jsx/.mjs/.html/.svg/.scss` legacy palette use would pass.
- **Expected:** guard covers all source/asset formats or documents the limitation.
- **Impact:** partial governance only.
- **Classification:** incomplete control.
- **Action:** broaden extensions and derive legacy colours from the legacy token source.

### IR-004 — Tests are mostly source assertions (MEDIUM)
- **Location:** `apps/platform/tests/unit/integrity/product-integrity.test.ts`
- **Evidence:** 8 of 9 tests grep source strings or assert static data; only the order test executes behavior.
- **Actual:** route rendering, direct-URL boundary, route ranking, marketplace API failure and checkout wording are unverified.
- **Expected:** at least route-resolution and banner-presence tests.
- **Impact:** regressions like IR-001 would not be caught.
- **Classification:** insufficient coverage.
- **Action:** add `createMemoryRouter`/`matchRoutes` tests and a render test for `DemoLayout`.

### IR-005 — 13 demo registry definitions unreachable (LOW)
- **Location:** `content/pages.ts` vs `router.tsx` capability routes
- **Evidence:** exact duplicates (see §5) mean the capability element wins; registry variants never render.
- **Actual:** 63 reachable demo paths, not 76.
- **Expected:** executor report should distinguish definitions from reachable routes (it partially does, but claims the class covers all 76).
- **Impact:** dead registry definitions, no user-facing break beyond existing behaviour.
- **Classification:** documentation/behaviour mismatch.
- **Action:** record unreachable definitions or remove exact duplicates.

### IR-006 — Demo marketplace remains static (LOW / documented partial)
- **Location:** `sections/market/data/catalog.ts`, `hooks/api/catalog.ts`
- **Evidence:** `useProducts` still filters `PRODUCTS`; section catalog is not API-backed.
- **Actual:** classification `DEMO_ONLY_WITH_BOUNDARY`; authoritative catalog is `/platform/marketplace`.
- **Expected per mission 4.D:** API data if retained.
- **Impact:** partial compliance; trust risk mitigated by persistent banner.
- **Classification:** known limitation.
- **Action:** none in this phase; document as accepted boundary.

### IR-007 — HyDROMA workspace links hidden when service is unavailable (LOW)
- **Location:** `sections/science/pages/ModelsPage.tsx:19-51,58-80`
- **Evidence:** workspace panel is rendered only after all non-ready states return early.
- **Actual:** when model discovery fails/empty, the run/datasets/readiness/sources links disappear.
- **Expected:** operational entry remains available.
- **Impact:** discoverability, not execution.
- **Classification:** UX gap.
- **Action:** render the workspace panel before state branching.

### IR-008 — E2E not safely runnable under current config (INFORMATIONAL)
- **Location:** `playwright.config.ts:31-50`
- **Evidence:** fixed existing E2E DB file and shared port; DB mutation not authorized.
- **Actual:** browser/axe verification not performed.
- **Classification:** limitation.
- **Action:** use a temp DB and unique port before the next verification phase.

## 15. Limitations

- Browser rendering, RTL layout, axe and responsive behaviour were not executed.
- Route resolution was verified by replicating the same route shapes with `matchRoutes`, not by booting the built app.
- The independent review did not re-run the full 569-test suite; it re-ran typecheck, the new integrity file and the token guard.

## 16. Evidence for final classification

The core Phase 3.104 objectives are genuinely implemented in source: demo route boundary, no API mutation from demo pages, localized core demo controls, persistent market demo boundary with an authoritative API catalog, real `/platform/hydroma/run`, and science demo isolation with redirects. The defects are bounded (one broken link, remaining English field labels, an incomplete token guard, weak tests) and do not invalidate the main integrity improvements. Marketplace static data remains an explicitly declared partial.

**Final classification:** `INDEPENDENT_REVIEW_ACCEPTED_WITH_MINOR_FINDINGS`
