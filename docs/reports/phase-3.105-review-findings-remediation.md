# PHASE 3.105 — REVIEW FINDINGS REMEDIATION REPORT

**Classification:** `PHASE_3.105_REMEDIATION_COMPLETED_WITH_EVIDENCE`  
**Independent review:** pending (not claimed)  
**Backend / DB / HyDroMA engine / deployment / Git:** unchanged

---

## 1. Baseline and final repository state

| Item | Baseline | Final |
|---|---|---|
| HEAD | `a3103061f561eb4289137b5f3362785580dfe28b` | same |
| Branch | `main` | `main` |
| Working-tree entries | 331 | 337 |
| Source modified by review | none | — |

No reset, clean, stash, stage, commit, branch, tag, remote or push operation was performed.

## 2. Files modified

```
apps/platform/src/app/PlatformLayout.tsx          (demo link guarded + helper exported)
apps/platform/src/app/router.tsx                  (route config exported as appRoutes)
apps/platform/src/content/ui.ts                   (central FIELD_LABELS + fieldLabel)
apps/platform/src/pages/PageRenderer.tsx          (central field labels, demo-save status)
apps/platform/src/sections/market/app/MarketLayout.tsx (MarketDemoNotice extracted)
packages/ui/src/app-switcher.tsx                  (legacy neutral fallback → canonical)
apps/brand/src/styles.css                         (legacy neutral fallbacks → canonical)
scripts/check-tokens.mjs                          (hardened guard + testable helpers)
scripts/check-tokens.d.mts                        (new type declarations)
vitest.config.ts                                  (frontend-core/theme alias for tests)
apps/platform/tests/unit/integrity/product-integrity.behavior.test.tsx (new)
apps/platform/tests/unit/integrity/token-guard.test.ts (new)
```

No unrelated file was deleted or rewritten.

## 3. F-104-01 — `/landscape/demo` repair

- **Root cause:** shared `PlatformLayout` always linked to `${basePath}/demo`; landscape (`basePath="/landscape"`) has no demo route and falls into its wildcard 404.
- **Fix:** added `demoHref(basePath)` (`PlatformLayout.tsx:17`), returning `/platform/demo` only for `/platform` and `null` elsewhere. The footer block (link **and** demo paragraph) renders only when the helper returns a path (`PlatformLayout.tsx:136-146`).
- **Result:** no broken navigation in `/landscape/*`; no misleading demo notice in real landscape pages; platform demo link remains.
- **Status:** `IMPLEMENTED` / `TESTED` (`demoHref("/landscape") === null`, `demoHref("/platform") === "/platform/demo"`).

## 4. F-104-02 — centralized entity field translation

- **Fix:** `content/ui.ts` now owns `FIELD_LABELS` (fa/en/ar) and `fieldLabel()` (lines 12, 36). Unknown keys return the raw machine key instead of a misleading translation.
- **`PageRenderer`:** `ENTITY_FIELDS` now stores `labelKey` only; labels are resolved at render via `fieldLabel(field.labelKey, locale)` (`PageRenderer.tsx:257`).
- **Coverage:** name, region, area, owner, type, role, season, period, method, status, unit, count, amount, version, source, summary, assignee, topic, community, duration, balance.
- **Additional defect fixed while testing:** demo save confirmation was rendered inside the create card that closes on submit, so the user never saw it. It is now a separate `role="status"` line (`PageRenderer.tsx:272`).
- **Status:** `IMPLEMENTED` / `TESTED` — rendered in fa (`نام`), en (`Name`), ar (`الاسم`); fetch is not called.

## 5. F-104-03 — design-token guard hardening

`scripts/check-tokens.mjs` now:

1. Scans `.ts, .tsx, .js, .jsx, .mjs, .cjs, .css, .scss, .json, .svg, .html` (line 30).
2. Uses the full legacy shade set (28 values, line 39-45) instead of 7.
3. Scans `apps/`, `packages/`, and `scripts/` (line 110).
4. Exports pure `legacyViolations` / `styleViolations` (lines 70, 82) and only auto-runs when executed directly.
5. Documents narrow exceptions (lines 48-63):
   - `packages/design-system/src/brand/` + `brand.css` — the legacy palette itself;
   - `apps/brand/public/` — static identity exploration / generated showcase;
   - guard source and guard test.

Real violations found by the hardened guard were fixed rather than excluded:
- `apps/brand/src/styles.css`: legacy neutral fallbacks → canonical warm neutrals.
- `packages/ui/src/app-switcher.tsx`: `#d5dde0` fallback → canonical `#ded5c9`.

- **Guard result:** `Tokens OK — 733 files scanned`, exit 0.
- **Test:** forbidden fixture fails (2 findings); brand legacy path passes; canonical colours pass; raw Tailwind/hex class flagged; map render value allowed.
- **Status:** `IMPLEMENTED` / `TESTED`.

## 6. F-104-04 — behavioral tests

New `product-integrity.behavior.test.tsx` (12 tests) executed in jsdom:

| Area | Behavioral assertion |
|---|---|
| Demo boundary | real `appRoutes` resolves `/platform/agriculture/planning` inside `DemoLayout`; `/platform/agriculture/abc` resolves the real `agriculture/:id` outside it |
| Direct URL | `DemoLayout` renders a persistent `role="note"` with the DEMO text |
| Demo create | submitting a demo create performs **zero** `fetch` calls and shows `Saved (demo)` |
| Landscape repair | `demoHref("/landscape")` is `null`; platform returns `/platform/demo` |
| Marketplace | `/platform/marketplace` resolves outside demo; `MarketDemoNotice` renders the real-catalog link; checkout copy states no payment |
| HyDroMA | `/platform/hydroma/run` resolves to `hydroma/run` without the demo boundary |
| I18N | village create form renders `نام` / `Name` / `الاسم` in fa/en/ar |

`token-guard.test.ts` adds 5 guard tests. Total new tests: **17**.

## 7. Tests executed

| Check | Result |
|---|---|
| `tsc --noEmit -p tsconfig.json` | **PASS** (exit 0) |
| `oxlint apps/platform/src packages/i18n/src packages/ui/src scripts` | **PASS** (exit 0; pre-existing script warnings only) |
| `vitest run` | **PASS — 91 files, 586 tests** |
| `node scripts/check-tokens.mjs` | **PASS — 733 files, 0 violations** |
| `node scripts/architecture-guardrails.mjs` | **PASS — 11 files** |
| `pnpm run build:platform` | **PASS — 2.44 s** (existing chunk warning) |

## 8. Tests not executed

- **Playwright / axe / responsive:** `IMPLEMENTED_NOT_EXECUTED`. `playwright.config.ts` uses a fixed existing E2E database (`databases/api/nojin-e2e.db` with WAL) and shared port 5181; running would mutate that DB and was not authorized. No temporary DB configuration exists without editing the test config.
- Browser verification of RTL layout, sticky demo banner and redirects is therefore **NOT_VERIFIED**.

## 9. Results summary

| Finding | Resolution | Status |
|---|---|---|
| F-104-01 broken landscape demo link | Link + notice only where demo route exists | IMPLEMENTED / TESTED |
| F-104-02 entity field i18n | Central `FIELD_LABELS`, safe fallback, fa/en/ar rendered | IMPLEMENTED / TESTED |
| F-104-03 token guard | Full shade set, broader extensions, documented exceptions, testable | IMPLEMENTED / TESTED |
| F-104-04 behavioral tests | 12 route/render/UI tests + 5 guard tests | IMPLEMENTED / TESTED |

## 10. Independent reviewer findings

**NOT_VERIFIED / PENDING.** This report is the executor's evidence. No Nemotron review was performed for Phase 3.105 in this environment. The reviewer must independently inspect:
- `PlatformLayout.tsx` conditional footer,
- `FIELD_LABELS`/`fieldLabel` and `PageRenderer` field mapping,
- `check-tokens.mjs` extensions/exceptions and the two canonical-fallback edits,
- `product-integrity.behavior.test.tsx` assertions (not just presence strings),
- `appRoutes` export and absence of backend/engine changes.

## 11. Remaining risks

1. **E2E/browser not run:** route redirects and RTL banner layout remain browser-unverified.
2. **Token guard exceptions:** `apps/brand/public/` is a broad folder but contains only static identity assets; if product code is later placed there, it would be exempt. Documented, still a risk.
3. **Unknown field keys:** intentionally render the raw key; acceptable fallback but not a translation.
4. **Marketplace static catalog:** unchanged from Phase 3.104 (`DEMO_ONLY_WITH_BOUNDARY`); not in Phase 3.105 scope.
5. **`appRoutes` refactor:** build and route tests pass, but full Playwright route matrix was not executed.

---

### Final classification

`PHASE_3.105_REMEDIATION_COMPLETED_WITH_EVIDENCE`
