# Upstream frontend intake — 2026-11-20

**Rule:** only permissive licences enter the product tree (MIT / Apache-2.0 / BSD / ISC / OFL).
GPL/AGPL repositories stay *reference-only*; nothing from them is copied. Every entry below records
where the code came from, its licence, and exactly what changed.

---

## 1. jalaali-js — Persian calendar conversion

| | |
|---|---|
| Repository | https://github.com/jalaali/jalaali-js |
| Licence | **MIT** (retained verbatim in `packages/utilities/src/vendor/jalaali/LICENSE`) |
| Copyright | © 2020 Behrang Norouzinia |
| Retrieved | 2026-11-20 |
| Upstream files | `index.js`, `LICENSE` |
| Destination | `packages/utilities/src/vendor/jalaali/` + wrapper `packages/utilities/src/jalali.ts` |
| Why | The platform shows Persian dates in finance, MRV, projects and profile pages. `Intl` renders Jalali, but converting *back* (Jalali → Gregorian for picking and filtering) needs a real implementation. This is the reference 33-year arithmetic calendar. |
| Changes | CommonJS → ES module named exports; TypeScript types added; the arithmetic is untouched. |
| Verification | `packages/utilities/tests/jalali.test.ts`: 400 consecutive months compared against ICU (`en-u-ca-persian-nu-latn`), round-trip for 16 years, leap years and impossible dates. |

---

## 2. Repositories reviewed and **not** taken

| Repository | Licence | Why not |
|---|---|---|
| `shadcn-ui/ui` | MIT | Component primitives duplicate `packages/ui`; our components already carry the token contract and RTL behaviour. Copying would create two design systems. |
| `tremorlabs/tremor` | Apache-2.0 | Chart primitives duplicate `packages/ui/charts` and would add a second chart grammar; the identity spec fixes chart colours by data nature, which our tokens already express. |
| `erpnext/erpnext`, `Dolibarr/dolibarr` | GPL-3.0 | **Reference only** (per the project's licence rule). Their accounting model informed the finance page structure; no file was copied. |
| `medusajs/medusa` | MIT + proprietary EE | Commerce backend, not a frontend asset; EE boundaries would be a licence trap. |
| Random "react profile page" repositories | mixed / often unlicensed | No licence file, low quality, and the profile page is 200 lines against our own tokens. Built in-house instead. |

---

## 3. What this intake changes in the product

- `@eco-nojin/utilities` now exports `formatJalali`, `formatJalaliShort`, `jalaliParts`,
  `jalaliToDate`, `jalaliYearRange`, `jalaliMonthName`, `isJalaliLeapYear`.
- The console profile and security pages use the Persian calendar for "member since", "last active",
  session times and audit events — consistently, in `fa`, `en` and `ar`.

## 4. Rules for the next intake

1. Check the licence file in the repository itself, not the README.
2. Copy the licence text next to the code and keep the copyright header.
3. Record: repo, commit/date, files, changes, licence, verification.
4. Never copy a file we can write in under ~200 lines against our own tokens.
5. Anything GPL/AGPL is read for structure only; never pasted.
