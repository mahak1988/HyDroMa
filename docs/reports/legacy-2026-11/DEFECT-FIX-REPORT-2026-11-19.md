# DEFECT FIX REPORT — Frontend Consolidation Review Findings
**Date:** 2026-11-19 · **Workspace:** `D:\NOJIN`
**Input:** `experiments/frontend-consolidation-review/NEMOTRON-INDEPENDENT-REVIEW.md`
**Mode:** minimal, targeted repair — no architecture expansion

---

## 1. Git Before / After

| Field | Before | After |
|---|---|---|
| Branch | `main` | `main` |
| HEAD | `b8a157e` | `b8a157e` (**unchanged**) |
| Staged | 0 | 0 |
| Modified (tracked) | 55 | 55 |
| Untracked | 115 | **116** (+1: `packages/ui/tests/charts-scale.test.tsx`) |
| Tags | 1 | 1 (**unchanged**) |
| Remotes | 0 | 0 |
| Commits / pushes | — | **0 / 0** |

No `reset`, `clean`, `stash`, `checkout`, `rebase`, no commit/tag/remote change, no dependency
installed (`package-lock.json` untouched by this mission), no file deleted or moved.

**Files touched (10):**

| # | File | Change |
|---|---|---|
| 1 | `packages/domain-types/src/money.ts` | F-10 + F-09 rewrite |
| 2 | `packages/domain-types/src/index.ts` | export `toMinorExact`, `toMajorString` |
| 3 | `packages/domain-types/tests/money.test.ts` | +19 tests (F-09/F-10) |
| 4 | `packages/ui/src/charts.tsx` | F-01 single-pass scan, gaps, flat series, empty caption |
| 5 | `packages/ui/src/index.ts` | export `summarizeSeries` |
| 6 | `packages/ui/src/date-picker.tsx` | F-07 strict ISO validation |
| 7 | `packages/ui/tests/charts-date-picker.test.tsx` | +7 F-07 tests, removed 1 duplicate |
| 8 | `packages/ui/tests/charts-scale.test.tsx` | **new**, 18 tests (F-01) |
| 9 | `apps/portal/tests/static.spec.ts` | F-17 CI fail-closed |
| 10 | `apps/portal/package.json` | `pretest:e2e` → `build:static` |

---

## 2. F-10 — Currency minor digits (MEDIUM)

**Before.** `MINOR_DIGITS` listed only `EUR, USD, IRR, GBP, AED, SAR, TRY`; every other code fell
back to `2`. Measured: `BHD/KWD/OMR/JOD/TND/IQD/LYD → 2`, so `formatMoney({amountMinor:1,currency:'BHD'})`
rendered `0.01` instead of `0.001` — a 10× scale error.

**Root cause found during repair.** Relying on `Intl` alone is *not* sufficient: the runtime's CLDR
data reports **`IQD` with 0 digits**, while ISO 4217 specifies 3. A pure-Intl fix would have
corrected six currencies and silently broken a seventh.

**Change.** `minorDigits` now resolves in three steps, cached in a `Map`:
1. explicit ISO 4217 table (three-decimal: `BHD, IQD, JOD, KWD, LYD, OMR, TND`; zero-decimal:
   `IRR, JPY, KRW, CLP, ISK, XAF, XOF, XPF`; plus the two-decimal currencies already in use);
2. otherwise the runtime's CLDR data via `Intl.NumberFormat(...).resolvedOptions().maximumFractionDigits`
   (guarded against non-integers and out-of-range values);
3. otherwise `2`.
Malformed codes (`"US"`, `""`, `"DOLLARS"`) never throw.

**Files:** `packages/domain-types/src/money.ts` (lines 30–110).

**Tests added:** 7 (three- and zero/two-decimal tables, the "1 whole unit must not render as 0.01"
acceptance case, `toMajorString`, unknown/malformed codes, precision round-trip).

**Result:** `packages/domain-types/tests/money.test.ts` → **34/34 passed** (15 pre-existing + 19 new).

**Acceptance:** **MET** — `toMajor(1,'BHD') === 0.001`, `toMajorString(1,'BHD') === "0.001"`,
`formatMoney(...,'BHD')` matches `/^BHD\s0\.001$/`. One whole unit of a three-decimal currency is no
longer displayed as one hundredth.

---

## 3. F-09 — Decimal-exact `toMinor` (MEDIUM)

**Before.** `toMinor = Math.round(major * 10 ** digits)` on a binary float. Measured:
`toMinor(1.005,'USD') = 100`, `toMinor(0.145,'USD') = 14` — contradicting the module's own
"decimal-safe" claim.

**Consumer analysis (done first).** `toMinor` had **no production consumers**: only the test and the
`index.ts` barrel. The contract could therefore be tightened without breaking any app.

**Change.** Added an exact decimal-string path and routed the `number` API through it:
- `expandExponential` — rewrites `1.5e+2` → `150` so exponent forms do not lose precision.
- `toMinorExact(major: string, currency)` — **new**; shifts the decimal separator in string space,
  rounds **half-up on the discarded digits**, and throws `RangeError` for a malformed literal or a
  result outside the safe-integer range.
- `toMinor(major: number, currency)` — unchanged signature; now delegates via `String(major)` so
  `1.005` is handled as the literal `1.005`, not as a float product.
- `toMajorString(amountMinor, currency)` — **new**; exact major-unit rendering without a float,
  which makes round-tripping testable.

**Rounding policy (documented in the module header):** half-up, away from zero on an exact tie,
applied to the decimal literal. **No epsilon is used anywhere** — an epsilon would merely move the
boundary and still fail for other values.

**Precision limit (documented):** a `number` is exact only up to `Number.MAX_SAFE_INTEGER` and
carries the shortest round-tripping decimal; authoritative input should use `toMinorExact`.

**Files:** `packages/domain-types/src/money.ts`, `packages/domain-types/src/index.ts`.

**Tests added:** 19, covering exactly the required set — `1.005`, `0.145`, `1.0049`, `-1.005`, zero
(and no negative zero), large values, three-decimal currencies, excess precision — plus negatives,
zero-decimal currencies, exponential notation, `NaN`/`Infinity`, malformed strings, safe-integer
overflow, and the documented precision limit (`0.1 + 0.2 → 30`).

**Result:** 34/34 passed.

**Acceptance:** **MET** — `toMinor(1.005,'USD') === 101`, `toMinor(0.145,'USD') === 15`,
`toMinor(1.0049,'USD') === 100`, `toMinor(-1.005,'USD') === -101`, `toMinor(0,'USD') === 0`.
API preserved (no caller broke); the only behavioural change is correct rounding.

---

## 4. F-01 — Large chart series (MEDIUM)

**Before.** `scaleSeries` used `Math.min(...values)` / `Math.max(...values)`. Measured:
20 000 points → 13 ms (fine); **150 000 points → `RangeError: Maximum call stack size exceeded`**.

**Change.**
- `summarizeSeries(values)` — **new**; single-pass min/max that skips non-finite values and reports
  `finiteCount` / `allFinite`. Exported so callers and tests can use it.
- `scaleSeries` — one pass, no spread. A **constant series is now centred** (`max === min` → mid-height)
   instead of being pinned to the baseline, which read as "dropped to zero". `min`/`max` stay truthful.
- `LineChart` — builds from finite points only; a non-finite value **breaks the line** (new `M`) so
  the chart shows a gap rather than interpolating over missing data. The area fill is emitted only for
  an unbroken series. The sr-only caption now states `N of M points … (missing values skipped)`, or
  `no finite values` for an empty/all-invalid series — this also fixes the misleading
  "from  to 0.0 mm" caption found in review (F-02).
- `Sparkline` — filters non-finite values and returns `null` when nothing is drawable.

**API preserved:** all component props unchanged; `readonly number[]` accepted.

**Files:** `packages/ui/src/charts.tsx`, `packages/ui/src/index.ts`.

**Tests added:** 18, non-timing-based performance assertions: 20 000 points, **150 000 points without
throwing**, 150 000 through `scaleSeries`, flat series, negative range, single point, empty series,
`NaN`/`Infinity`, gap rendering, area suppression on gaps, uncertainty band at 20 000 points, and
`Sparkline` degenerate input.

**Result:** `packages/ui/tests/charts-scale.test.tsx` → **18/18 passed**. Full UI suite **46/46**.

**Acceptance:** **MET** — 150 000 points no longer throws; empty, flat, negative and invalid inputs
behave as documented.

---

## 5. F-17 — Portal static test (MEDIUM, coverage trap)

**Before.** `test.skip(!existsSync(dist/index.html), …)` meant a pipeline that never built the static
output reported **green** while never checking prerender, sitemap or robots. The portal's `test:e2e`
was bare `playwright test` with no build dependency.

**Change.**
- `apps/portal/tests/static.spec.ts` — computes `missingStaticOutput` once at module load; **throws**
  with an actionable message when `process.env.CI` is set and the output is absent. Locally it still
  skips (so a bare `playwright test` stays usable) but the message now points at `npm run test:e2e`.
- `apps/portal/package.json` — added `"pretest:e2e": "npm run build:static"`, so the build and
  prerender run **before** the tests by default and the local order matches CI.

**Files:** `apps/portal/tests/static.spec.ts`, `apps/portal/package.json`.

**Tests:** no test removed or weakened; the three existing static tests are unchanged.

**Result — both branches executed:**
- `npm run test:e2e --workspace @eco-nojin/portal` → ran `build:static` (12 routes prerendered) then
  **76 passed** including the 3 static tests.
- `CI=1` with `dist` temporarily hidden → **exit 1** with
  `Error: Static output is missing: run 'npm run build:portal:static' before the E2E stage…`,
  `No tests found`. The directory was restored and the suite re-verified (3 passed).

**Acceptance:** **MET** — CI cannot report success without executing the static tests.

---

## 6. F-07 — DatePicker input validation (LOW, reviewed and fixed)

**Before.** `new Date(\`${value}T00:00:00\`)` accepted anything; an invalid ISO value silently rolled
over (`2026-02-29` → 1 March 2026) and was displayed as fact.

**Change.** Added `parseIsoDate(value)` — strict `yyyy-mm-dd` + component round-trip check, returning a
**local-midnight** `Date` (preserving the correct no-timezone-shift behaviour), and
`isValidIsoDate(value)`. `DatePicker` now:
- omits the caption for an invalid non-empty value,
- sets `aria-invalid="true"` and renders a `role="alert"` message,
- keeps `aria-describedby` wiring intact.

Component props are unchanged.

**Files:** `packages/ui/src/date-picker.tsx`.

**Tests added:** 7 — valid date, impossible date (no rollover to 1 March), real leap day (2028-02-29),
out-of-range/malformed list, empty value treated as unset, API value outside min/max still showing the
same calendar day, ISO emission on change.

**Result:** UI suite 46/46 passed.

**Acceptance:** **MET**.

---

## 7. F-05 and F-20 — investigated only (no change, per instructions)

### F-05 — `sideEffects: false` for `packages/ui`

| Question | Finding |
|---|---|
| Does `packages/ui` import CSS or have other side effects? | **No.** No `.css` import and no top-level side-effectful statement in `src/`; the package is pure components/helpers. Design-system CSS is imported by the apps directly. |
| Is it compatible? | **Yes.** Nothing in `ui` would be wrongly dropped. |
| Caveat | If a future `ui` module adds a CSS import or self-registers at import time, `sideEffects: false` would let a bundler drop it. Pair it with explicit side-effect imports then. |
| Is it needed? | **Low value now.** Measured: after this mission, console and portal bundles are **byte-identical** (tree-shaking already drops the unused chart/date-picker module), and the science bundle grew only **+0.91 kB gzip** (131.25 → 131.56) despite new code. My earlier review overstated this. |

**Recommendation:** safe to add for future-proofing, but it is **not urgent** and not required for
correctness. Defer until a real dead-code problem is measured.

### F-20 — `scripts/migrate-chart-imports.mjs`

| Question | Finding |
|---|---|
| One-off tool? | **Yes** — an idempotent codemod that rewrites six chart imports. |
| Referenced elsewhere? | **No.** Only two mentions in the implementation report and one self-reference in its own header. Not in `package.json`, CI, or any workflow. |
| Is the migration complete? | **Yes** — zero remaining `components/Charts` imports in `apps/scientific-workspace/src`. |
| Would deleting it hurt reproducibility? | **No.** The outcome is verifiable directly from the code, and the script is re-runnable if ever needed. |

**Recommendation:** deleting is safe but optional. If it is kept, move it to `scripts/one-off/` or add a
`// one-off — safe to delete` header so it is not mistaken for maintained tooling. **Not deleted** in
this mission, per the instruction that removal is not required.

---

## 8. Before / After comparison

| Gate | Before | After | Verdict |
|---|---|---|---|
| `npm run typecheck` | exit 0 | exit 0 | unchanged |
| `npm run lint` | exit 0, 0 findings | exit 0, 0 findings | unchanged |
| `check-boundaries.mjs` | 236 files / 13 units | **237 files / 13 units** | +1 test file, 0 violations |
| `check-tokens.mjs` | 141 files / 6 targets | 141 files / 6 targets | unchanged |
| Unit tests | **231 / 25 files** | **274 / 26 files** | **+43 tests**, 0 failed |
| E2E (5 apps) | 386 / 386 | **386 / 386** | unchanged |
| Builds (5 apps) | 5/5 | 5/5 | unchanged |
| `npm audit --omit=dev` | 0 vulnerabilities | 0 vulnerabilities | unchanged |

**Unit test delta reconciliation:** +19 (money F-09/F-10) +7 (DatePicker F-07) +18 (chart scale F-01)
−1 (duplicate test removed) = **+43** → 231 + 43 = **274**. ✔

**Bundle sizes after:**

| App | Before (gzip) | After (gzip) | Note |
|---|---|---|---|
| console | 105.82 kB | 105.82 kB | identical hash — charts/date-picker shaken out |
| portal | 151.09 kB | 151.09 kB | identical hash |
| marketplace | 146.34 kB | 146.51 kB | +0.17 kB (money digits) |
| tourism | 180.21 kB | 180.64 kB | +0.43 kB (DatePicker validation) |
| scientific-workspace | 131.25 kB | 131.56 kB | +0.31 kB (chart scan) |

All remain within the ≤200 kB gzip initial budget.

### Flaky test observed (reported, not caused by this mission)

The first full console run reported **74/75** with `identity.spec.ts:62 "filters by search and role"`.
It **passed in isolation (1/1)** and the **full suite passed 75/75 on re-run**. My changes touch only
`packages/ui` charts/date-picker and `packages/domain-types` money — none of which the console's user
table uses. This is a pre-existing timing sensitivity in that test (URL state + React re-render under
parallel load), not a regression. Recommendation for a later cluster: replace the fixed-count
assertion with `expect.poll` on the row count.

---

## 9. Out of scope — untouched

Accounting UI, Inventory UI, Wallet UI, Payment UI, Cesium/3D, spatial Extent/CRS, backend, database,
real API, root cleanup, archive migration: **not started**. `upstream-registry/`,
`upstream-archives/`, `experiments/` were only read. `D:\HyDroMA` and `D:\eco_nojin` were not touched.

---

## 10. Verdict

| Defect | Severity | Status |
|---|---|---|
| F-10 currency minor digits | MEDIUM | **FIXED & ACCEPTED** |
| F-09 decimal-exact `toMinor` | MEDIUM | **FIXED & ACCEPTED** |
| F-01 large chart series | MEDIUM | **FIXED & ACCEPTED** |
| F-17 portal static test in CI | MEDIUM | **FIXED & ACCEPTED** |
| F-07 DatePicker validation | LOW | **FIXED & ACCEPTED** |
| F-05 `sideEffects` | LOW | **ANALYZED — no change recommended yet** |
| F-20 migration script | LOW | **ANALYZED — deletion optional, not performed** |

**All four MEDIUM findings from the review are closed, plus the LOW validation finding. Every
pre-existing test still passes (+43 new). No commit, tag, remote, dependency or destructive Git
operation was performed.**

**Mission stopped here.**