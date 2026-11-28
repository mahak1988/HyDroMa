# PHASE 3.104 — FRONTEND PRODUCT INTEGRITY & DEMO ISOLATION — REPORT

**Classification:** `FRONTEND_PRODUCT_INTEGRITY_PARTIALLY_REMEDIATED`  
**Report status:** implementation complete, E2E pending, independent review pending  
**Backend / DB / HyDroMA engine / deployment / Git mutations:** none

---

## 1. Baseline and final repository state

| Item | Baseline | Final |
|---|---|---|
| HEAD | `a3103061f561eb4289137b5f3362785580dfe28b` | same |
| Branch | `main` | `main` |
| Working-tree entries | 306 (audit baseline) | 329 |
| Code changes | — | 22 tracked files modified, 3 files added (DemoLayout, integrity test, this report) |

No `git reset`, `clean`, `stash`, stage, commit, tag, branch or remote change was performed. All pre-existing worktree content was treated as protected.

## 2. Exact files modified

```
apps/platform/src/app/PlatformLayout.tsx
apps/platform/src/app/router.tsx
apps/platform/src/app/DemoLayout.tsx                    (new)
apps/platform/src/content/ui.ts
apps/platform/src/pages/PageRenderer.tsx
apps/platform/src/sections/market/app/MarketLayout.tsx
apps/platform/src/sections/science/app/ScienceLayout.tsx
apps/platform/src/sections/science/app/router.tsx
apps/platform/src/sections/science/pages/ModelsPage.tsx
packages/i18n/src/catalogs/{en,fa,ar,de,es,fr,id,it,ja,pt,ru,tr,zh}.ts
scripts/check-tokens.mjs
apps/platform/tests/unit/integrity/product-integrity.test.ts (new)
```

## 3. Routes changed

| Route | Before | After |
|---|---|---|
| `/platform/<registry path>` (76 entries) | rendered with no demo boundary | rendered inside `<DemoLayout>` persistent demo boundary (same URLs) |
| `/platform/demo` | did not exist | demo index (overview registry page) inside the boundary |
| `/platform/hydroma/run` | did not exist | canonical real HyDroMA run (reuses `RunModelPage`) |
| `/science` | demo dashboard index | `Navigate` → `/science/demo` |
| `/science/{water,soil,climate,vegetation,remote-sensing,map,simulation,scenarios,projects}` | demo pages | `Navigate` → `/science/demo/<same>` (old URLs preserved) |
| `/science/demo/*` | did not exist | demo science pages under persistent demo boundary |
| `/science/models`, `/science/run` | already real | unchanged and outside the demo boundary |
| `/market/*` | header-only DEMO badge | persistent in-body demo banner + link to `/platform/marketplace` |

## 4. Demo registry classification and reachable-route count

Measured from `content/pages.ts`:

- `PAGES` total: **77**
- Registry definitions with a non-empty path (reachable demo routes): **76**
- Registry index definitions (`path: ""`): **1** (overview; workspace index remains the real `OverviewModule`)
- All 76 are `DEMO_DATA` and now share one route-level boundary (`DemoLayout`).
- Direct URL access to any of the 76 renders the same banner; the boundary is a route element, not a dismissible notice.
- Demo-page create actions are now local-only: `PageRenderer.tsx` no longer imports `createApiClient` and no longer calls `api.resources.create`.
- Demo "Export" is disabled and labelled with the demo title.

Conflict note: where a capability route shares an exact path (e.g. `/platform/agriculture`, `/platform/projects`, `/platform/ecocoin`), the capability route still wins because it is declared first. Demo-only sub-paths (e.g. `/platform/agriculture/planning`) resolve to the demo boundary.

## 5. Marketplace API integration evidence

- **Authoritative catalog:** `/platform/marketplace` → `sections/api-pages/MarketplacePage.tsx` calls `useProducts()`, `useSellers()`, `useCategories()` → `GET /v1/catalog/*` (`services/hooks.ts:139-164`). It shows the real catalog and an explicit boundary for orders/payments.
- **Demo marketplace:** `/market/*` is retained as an explicitly labelled demonstration surface. `MarketLayout` now shows a persistent banner and a direct link to the authoritative catalog. Static fixtures remain in `sections/market/data/catalog.ts` and are labelled demo.
- No silent fallback from API failure to fixtures exists on the authoritative page.

## 6. Checkout behaviour before/after

| Aspect | Before | After |
|---|---|---|
| Success message | `market.orderPlaced` toast ("Demo order created — no payment was taken") | unchanged wording, now reached only inside the persistent demo banner |
| Persistence | `localStorage` (`eco.market.orders`), `demo: true` | unchanged; still local-only |
| Payment | never enabled | never enabled |
| Stock reservation | none | none |
| Order history | shows local demo records + DEMO badge | unchanged, now under the global demo banner and with a visible link to the real catalog |
| Real purchase claim | none in strings | none; no server confirmation path exists |

Test asserts every locally created order has `demo === true`.

## 7. HyDroMA route consolidation

- Public marketing: `/hydroma` unchanged.
- Canonical operational entry: `/platform/hydroma` (real model discovery) now exposes a workspace panel linking to:
  - `/platform/hydroma/run` (real engine execution, provenance panel),
  - `/platform/hydroma/datasets`,
  - `/platform/hydroma/readiness`,
  - `/platform/hydroma/sources`.
- Real engine paths remain operational: `RunModelPage` still calls `createHydromaClient(...).createRun/getRun`.
- Demonstration science is isolated under `/science/demo/*`; old flat URLs redirect there.
- `/science/models` and `/science/run` are outside the demo boundary.
- No scientific result was fabricated; demo indicators keep their `DEMO`/`NOT_CONNECTED` badges.

## 8. Translation changes

- `content/ui.ts` gained `close`, `create`, `saving`, `saved`, `error`, `demoBanner`, `demoBannerBody`, `demoOpen` in fa/en/ar.
- `PageRenderer` replaces `"Close"`, `"Create …"`, `"Create"`, `"saving"`, `"saved"`, `"error:"` with those keys.
- Fixed untranslated `runModel`/`run` in the Persian and Arabic catalogs.
- Added `hydroma.workspace`, `workspaceNote`, `openRun`, `openDatasets`, `openReadiness`, `openSources` to every catalog (English fallback for non-fa/ar locales, matching the existing pattern).
- Added `market.demoScope` and `market.liveCatalog` to every catalog.

## 9. Design-token changes

- Canonical palette untouched (`packages/design-system/src/tokens.css`, Aubergine/Terracotta/Champagne).
- `scripts/check-tokens.mjs` now scans `apps/` and `packages/` for the legacy "Path A" hex palette (`#0B5563`, `#C9A227`, `#35C4D7`, `#E76F51`, …) and fails if it appears outside `packages/design-system/src/brand/`.
- `check:tokens` result: **PASS — 671 files scanned, 0 violations**.

## 10. Tests executed and results

| Check | Result |
|---|---|
| `tsc --noEmit -p tsconfig.json` | **PASS** |
| `oxlint apps/platform/src packages/i18n/src scripts/check-tokens.mjs` | **PASS** |
| `vitest run` | **PASS — 89 files, 569 tests** (9 new integrity tests) |
| `node scripts/check-tokens.mjs` | **PASS — 671 files** |
| `pnpm run build:platform` | **PASS — built in 2.46 s** (existing large-chunk warning) |

New test file covers:
1. all 76 demo registry paths are classified and non-colliding;
2. `/platform/demo` and `DemoLayout` are wired;
3. demo pages cannot call the API and do not write records;
4. fa/en/ar demo labels exist;
5. local orders are always `demo: true`;
6. authoritative catalog uses `useProducts/useSellers`;
7. `/platform/hydroma/run` exists;
8. science demo routes are isolated while models/run stay outside;
9. HyDroMA run labels are translated.

## 11. E2E / visual checks

**SKIPPED — prerequisites not run in this phase.** Playwright requires Chrome channel, the API server on `:8000`, the dev server on `:5181`, and the E2E SQLite database; executing it would mutate the E2E database, which was not authorized. `playwright --list` previously enumerated 277 tests. No browser, axe or viewport verification is claimed.

## 12. Remaining limitations

1. `/market/*` still uses static fixture products while labelled demo; it is not wired to `/v1/catalog/*`. The authoritative experience is `/platform/marketplace`. Requirement 4.D is therefore only partially met.
2. Demo registry URLs remain at their existing paths (boundary layout rather than a `/demo` path move) to avoid breaking existing links; the boundary is route-level and persistent.
3. The 4 hardcoded `#ffffff` map strokes in `TourismMap.tsx` were left untouched (map rendering, outside this phase's scope).
4. Existing large vendor chunks (`ScienceMap`, `index`) remain; no bundle restructuring was attempted.
5. E2E suite may need URL assertions updated for the `/science/demo/*` redirects.

## 13. Independent review (Nemotron 3 Ultra)

**NOT_VERIFIED / PENDING.** No independent review evidence was available in this environment; no approval is claimed. The reviewer must independently verify the modified files listed in §2, especially:
- `router.tsx` demo boundary placement before `*`,
- `PageRenderer.tsx` absence of `createApiClient`,
- `MarketLayout.tsx` banner/link,
- `science/app/router.tsx` demo isolation and real routes,
- `check-tokens.mjs` legacy-palette rule.

## 14. Unresolved risks

- **Marketplace partial scope:** static demo catalog remains reachable at `/market/*`; mitigated by the persistent banner and explicit link, but not eliminated.
- **Route ordering:** demo sub-paths under a capability prefix with a dynamic segment (e.g. `/platform/agriculture/farms` vs `agriculture/:id`) still resolve to the real detail route, not the demo page. This mirrors pre-existing behaviour and is documented.
- **No browser verification:** RTL/LTR rendering, sticky banner behaviour and responsive overflow are code-reviewed but not browser-verified.
- **Translation fallback:** ten locales carry English strings for the newly added keys; this matches the project's existing fallback convention but is not a full translation.

---

### Final classification

`FRONTEND_PRODUCT_INTEGRITY_PARTIALLY_REMEDIATED`

Implemented and tested: demo boundary, no API writes from demo pages, localized demo controls, canonical HyDroMA run entry, science demo isolation, legacy-palette guard. Not fully remediated: `/market/*` still serves static demo fixtures rather than API data; E2E/browser verification and independent review are pending.
