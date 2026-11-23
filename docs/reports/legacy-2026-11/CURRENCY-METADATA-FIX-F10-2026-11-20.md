# TARGETED CURRENCY METADATA CORRECTION — F-10
## ISO 4217 minor-unit table verified against the SIX Group List One

**Date:** 2026-11-20 · **Workspace:** `D:\NOJIN`
**Scope:** `packages/domain-types/src/money.ts` + the tests that asserted the defect
**Mode:** metadata correction only — no accounting, wallet, payment or backend work

---

## 1. Git Before / After

### 1.1 Repository state (HEAD, tags, remotes — unchanged throughout)

| Field | Before | After |
|---|---|---|
| Branch | `main` | `main` |
| HEAD | `b8a157e41eeb5ba3d1c1cae636fe7ef847f94b8d` | **identical** |
| Staged | 0 | 0 |
| Tags | 1 (`fe-phase-1`) | 1 (**unchanged**) |
| Remotes | 0 | 0 |
| Commits / pushes made | — | **0 / 0** |

### 1.2 Working tree — and a concurrency warning

| Metric | At mission start | At mission end |
|---|---|---|
| Modified (tracked) | 55 | **138** |
| Deleted (tracked) | 1 | **75** |
| Untracked | 117 | **252** |

**The tree-wide delta is not mine.** While this task ran, another agent was performing a large
parallel refactor of the workspace: it created five new packages (`auth-client`, `configuration`,
`icons`, `scientific`, `utilities` — none present in `HEAD`), added two apps (`apps/home`,
`apps/brand`), and rewrote 75 files. Evidence:

- `git cat-file -e HEAD:packages/auth-client/package.json` → **not in HEAD** (all five new packages are uncommitted).
- Mid-session, `npm run typecheck` failed with `TS2307: Cannot find module '@eco-nojin/auth-client'`
  and `'@eco-nojin/configuration'` across `apps/console`, `apps/marketplace`, `apps/portal`,
  `apps/scientific-workspace`. That is another agent's in-flight state, not this change.
- By the end of the session the concurrent work was complete and `npm run typecheck` returned **0 errors**,
  `check-boundaries` reported **20 units** (up from 13) and `check-tokens` **8 targets** (up from 6),
  because that agent extended `scripts/check-boundaries.mjs`, the lint script and the token targets.

Per the mission's safeguard for concurrent modification, **I did not touch any file belonging to that
work**. My change is confined to the five files in §2.

### 1.3 Files changed by this mission (5)

| # | File | Change |
|---|---|---|
| 1 | `packages/domain-types/src/money.ts` | Replaced the partial hand-kept table with the **complete 178-code ISO 4217 table**; `IRR` 0 → **2**; added 4-decimal and not-applicable handling; removed the CLDR/ICU fallback; added `ISO_MINOR_UNITS`, `NO_MINOR_UNIT_CODES`, `ZERO_MINOR_UNIT_CODES`, `isIso4217Currency`, `hasMinorUnit`; case-insensitive lookup |
| 2 | `packages/domain-types/src/index.ts` | Export the new public API |
| 3 | `packages/domain-types/tests/money.test.ts` | Corrected 5 assertions that encoded the old IRR=0 defect; added 14 tests (IRR acceptance block, N.A. vs zero distinction, unknown-code non-verification, 4-decimal, case-insensitivity, group coverage) |
| 4 | `apps/tourism/tests/unit/money.test.ts` | Corrected the IRR rendering expectation to the ISO scale |
| 5 | `apps/marketplace/tests/unit/commerce.test.ts` | Corrected the IRR rendering expectation to the ISO scale |

No file was deleted, moved or overwritten blindly. No dependency was installed. `upstream-registry/`,
`upstream-archives/` and `experiments/` were not modified. `D:\HyDroMA` and `D:\eco_nojin` were not touched.

---

## 3. Authoritative source

| Field | Value |
|---|---|
| **Maintenance agency** | SIX Group (SIX Financial Information AG), Secretariat of the ISO 4217 Maintenance Agency, on behalf of ISO and the Swiss member SNV |
| **Document** | *List One: Current Currency & Funds* |
| **Landing page** | `https://www.six-group.com/en/products-services/financial-information/market-reference-data/data-standards.html` |
| **Data file (used)** | `https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml` |
| **List publication date** | **2026-09-17** (the `Pblshd` attribute of the downloaded document) |
| **Verification date** | **2026-11-20** (this task) |
| **Document size / coverage** | 47 491 bytes · 280 country/currency entries → **178 distinct alphabetic codes** · **0 intra-list conflicts** |

**Why CLDR/ICU was removed rather than kept as a fallback.** ISO 4217 and ICU disagree on *active*
currencies, not only on withdrawn ones. The case at hand is `IRR`: ISO 4217 specifies **2** minor
units; the ICU data shipped in current browsers and Node reports **0**. Because `minorDigits` feeds
money conversion, an ICU upgrade could silently change every rial amount by 100×. The table is now the
single authority and the runtime's locale data is never consulted.

The list's currency was confirmed by its 2026 amendment (Bulgaria adopted the euro on 2026-01-01, so
`BGN` is now historic and is correctly **absent** from this table), and by the presence of recent
additions such as `XCG`, `ZWG`, `XAD` and `SLE`.

---

## 4. Verified currency table (178 codes, grouped by minor units)

### 4.1 Zero minor units — 17 codes
`BIF, CLP, DJF, GNF, ISK, JPY, KMF, KRW, PYG, RWF, UGX, UYI, VND, VUV, XAF, XOF, XPF`

### 4.2 Two minor units — 139 codes
`AED, AFN, ALL, AMD, AOA, ARS, AUD, AWG, AZN, BAM, BBD, BDT, BMD, BND, BOB, BOV, BRL, BSD, BTN, BWP, BYN, BZD, CAD, CDF, CHE, CHF, CHW, CNY, COP, COU, CRC, CUP, CVE, CZK, DKK, DOP, DZD, EGP, ERN, ETB, EUR, FJD, FKP, GBP, GEL, GHS, GIP, GMD, GTQ, GYD, HKD, HNL, HTG, HUF, IDR, ILS, INR, **IRR**, JMD, KES, KGS, KHR, KPW, KYD, KZT, LAK, LBP, LKR, LRD, LSL, MAD, MDL, MGA, MKD, MMK, MNT, MOP, MRU, MUR, MVR, MWK, MXN, MXV, MYR, MZN, NAD, NGN, NIO, NOK, NPR, NZD, PAB, PEN, PGK, PHP, PKR, PLN, QAR, RON, RSD, RUB, SAR, SBD, SCR, SDG, SEK, SGD, SHP, SLE, SOS, SRD, SSP, STN, SVC, SYP, SZL, THB, TJS, TMT, TOP, TRY, TTD, TWD, TZS, UAH, USD, USN, UYU, UZS, VED, VES, WST, XAD, XCD, XCG, YER, ZAR, ZMW, ZWG`

### 4.5 Three minor units — 7 codes
`BHD, IQD, JOD, KWD, LYD, OMR, TND`

### 4.6 Four minor units — 2 codes
`CLF, UYW`

### 4.7 Minor units **not applicable** — 13 codes
`XAG, XAU, XBA, XBB, XBC, XBD, XDR, XPD, XPT, XSU, XTS, XUA, XXX`
(Drawing rights, fund/unit-of-account codes, precious metals, a code reserved for testing, and the
"no currency involved" code.)

### 4.8 Transcription proof (programmatic, not visual)

The arrays in `money.ts` were extracted mechanically and compared with the downloaded XML:

```
official_codes=178  transcribed_codes=178
missing_from_transcription = 0
not_in_official_list       = 0
minor_unit_mismatch        = 0
IRR official=2  mine=2
```

The transcription is an exact match of the official list.

---

## 5. Test results (exact counts)

| Suite | Command | Result |
|---|---|---|
| Money tests | `npx vitest run packages/domain-types/tests/money.test.ts` | **45 passed / 45** (1 file) |
| All domain-types | `npx vitest run packages/domain-types` | **59 passed / 59** (3 files) |
| **Full unit** | `npm test` | **315 passed / 315** · 31 files · 0 failed |
| Typecheck | `npm run typecheck` | **exit 0**, 0 errors |
| Lint | `npm run lint` (oxlint) | **exit 0**, no findings |
| Boundaries | `node scripts/check-boundaries.mjs` | **OK — 261 files / 20 units** |
| Tokens | `node scripts/check-tokens.mjs` | **OK — 147 files / 8 targets** |

**Required IRR assertions — all present and green:**

| Requirement | Test | Result |
|---|---|---|
| `minorDigits('IRR') === 2` | `F-10 (regression): IRR is a two-decimal currency` | PASS |
| `toMajor(1,'IRR') === 0.01` | same block | PASS |
| `toMajorString(1,'IRR') === '0.01'` | same block | PASS |
| `formatMoney` renders one IRR minor unit at the correct scale | asserts `/0\.01/` and rejects `IRR 1` | PASS |
| Three-decimal tests still valid | `BHD → 3`, `toMajorString(1,'BHD')==='0.001'`, `toMinorExact('1','BHD')===1000` | PASS |
| Zero-decimal tests still valid | 17-code group asserted | PASS |
| USD/EUR and other two-decimal tests | 139-code group asserted | PASS |
| Unknown/malformed codes raise nothing | `isIso4217Currency('XYZ')===false`, `minorDigits('XYZ')===2`, no throw | PASS |
| No regression in `toMinorExact` / `toMinor` / `toMajorString` | full F-09 block | PASS |

### Tests corrected, not weakened

Five assertions across three files asserted the **incorrect** metadata. They were corrected to the
official value; no assertion was removed and no test was skipped:

| File | Old assertion | New assertion |
|---|---|---|
| `domain-types/tests/money.test.ts` | `minorDigits('IRR') === 0` | `=== 2` (+ explicit note that 0 was the defect) |
| `domain-types/tests/money.test.ts` | `toMajor(500,'IRR') === 500` | `=== 5` (+ `toMajor(500,'JPY')===500` keeps the zero-decimal case) |
| `domain-types/tests/money.test.ts` | IRR listed among zero-decimal | IRR moved to the two-decimal group |
| `domain-types/tests/money.test.ts` | `toMajorString(500,'IRR') === '500'` | `=== '5.00'` |
| `domain-types/tests/money.test.ts` | `toMinor(MAX_SAFE_INTEGER,'IRR')` | switched to `JPY` (0 digits) so the value is not scaled out of range |
| `apps/tourism/tests/unit/money.test.ts` | `toContain('8,400,000')` | `toMatch(/84,000\.00/)` + one-minor-unit case |
| `apps/marketplace/tests/unit/commerce.test.ts` | "IRR with **zero** minor digits" | "IRR with **two** minor digits", `125,000.00` |

---

## 6. Remaining discrepancies and limitations

| # | Item | Detail |
|---|---|---|
| L-01 | **Demo data scale (product impact)** | `apps/tourism/src/data/tourism.ts` and `apps/marketplace/src/data/catalog.ts` store prices as `amountMinor` authored under the old 0-decimal assumption (e.g. `8_400_000 IRR`). Under the correct ISO scale those now render as **84,000.00 IRR**, i.e. 100× smaller than intended. The metadata is now right; the **fixture values** would need ×100 to preserve the intended display. Rescaling demo data is outside this task's scope and was **not** done. |
| L-02 | **Unknown codes** | `minorDigits` returns the rendering fallback `2` for a code absent from the list. This is a display fallback only — `isIso4217Currency` returns `false`, so callers can tell verified from unverified. `isMoney` remains a *syntax* check (three letters) and does not assert ISO membership. |
| L-03 | **Not-applicable codes** | For the 13 N.A. codes `minorDigits` also returns `2` so formatting never throws; `hasMinorUnit` returns `false` as the truthful answer. Callers that must distinguish "no minor unit" from "minor unit not applicable" have both predicates. |
| L-04 | **Scope discipline** | Accounting, inventory, wallet, payment, backend, 3D and spatial extent/CRS were not started. |
| L-05 | **Builds / E2E not run** | The mission scoped verification to money tests, unit, typecheck, lint, boundaries and tokens. Builds and E2E were deliberately not run: the workspace is shared with an active concurrent refactor, so any build result could not be attributed to this change. `typecheck` + `unit` cover the affected surface (the changed functions have direct unit coverage). |
| L-06 | **Concurrent work** | Another agent's refactor (5 new packages, 2 new apps, 75 deletions) is in the same working tree. Nothing of theirs was modified here, but a `git commit` of this change would also capture their in-progress work — which is why **no commit was made** (and none is permitted without the owner). |

---

## 8. Verdict

**F-10 is resolved and verified against the authoritative source.**

- `IRR` is now **2** minor units, matching SIX Group List One (published 2026-09-17).
- The table covers **all 178 current ISO 4217 codes** with zero transcription error, including the
  4-decimal codes (`CLF`, `UYW`) and the 13 codes for which no minor unit exists.
- Zero minor units are modelled distinctly from minor units not applicable.
- Unknown codes are no longer treated as verified currencies.
- CLDR/ICU can no longer influence financial rounding.
- 45 money tests and 315 unit tests pass; typecheck, lint, boundaries and tokens are green.

**Mission stopped here. No commit, tag, remote or deployment was created.**