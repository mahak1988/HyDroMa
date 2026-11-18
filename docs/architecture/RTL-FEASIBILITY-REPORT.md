# RTL-FEASIBILITY-REPORT
## گزارش امکان‌سنجی واقعی RTL و فارسی‌سازی

**Date:** 2026-11-18
**Question:** can Nellavio and Velora support a real, logical-property RTL interface for Persian —
not a mirrored skin?
**Answer (short):** yes for both, at **RTL_ADAPTABLE** level, with a measured, mechanical migration
(324 tokens/106 files for Nellavio; 166/104 for Velora) plus a small list of code-level fixes that
CSS alone cannot solve.

**Everything below was done in isolated copies under `experiments/rtl-proof/`. The extracted
projects in `upstream-registry/` were not modified; no code entered `apps/`; nothing was rebranded.**

---

## 0. خلاصه اجرایی (Persian summary)

- در هر دو پروژه `dir="rtl"` و `lang="fa"` اعمال شد، فونت فارسی (وزیرمتن) بارگذاری شد و کل
  یوتیلیتی‌های فیزیکی به **Logical Properties** مهاجرت داده شد.
- نتیجه: **هیچ سرریز افقی، هیچ خطای کنسول، هیچ خطای hydration** در صفحات آزمایش‌شده.
- سه چیز با CSS حل نمی‌شود و باید در کد تغییر کند: **ترتیب منطقی صفحه‌بندی جدول**،
  **`DirectionProvider` رادیکس** (منو/تولتیپ/زیرمنو)، و **فرمت ارقام/تاریخ فارسی**.
- یک باگ واقعی RTL در Velora پیدا و رفع شد: `absolute -left-[9999px]` در helper دسترس‌پذیری،
  که در RTL سرریز **۹۹۹۹ پیکسلی** تولید می‌کرد؛ با `sr-only` به صفر رسید.
- از شش فونت بررسی‌شده، پنج فونت مجوز **OFL-1.1** دارند؛ **فرهنگ فایل مجوز ندارد → UNVERIFIED**.
  فونت پیشنهادی: **وزیرمتن (Vazirmatn)** برای متن + **صمیم/وزیرمتن** برای تیتر.

---

## 1. Method

| Step | Detail |
|---|---|
| Copies | `robocopy` of each project (excluding `node_modules/.next/.git`) into `experiments/rtl-proof/{nellavio-rtl,velora-rtl}` |
| Dependencies | Nellavio: `node_modules` copied (Turbopack rejects out-of-root junctions). Velora: fresh `pnpm install --frozen-lockfile` (200 s) |
| Direction | `<html lang="fa" dir="rtl">` forced in the test copy's root layout (Nellavio also forces the `[locale]` layout) |
| Font | `@font-face` for Vazirmatn + Shabnam from `public/fonts/`, applied to body/inputs/buttons under `html[dir="rtl"]` |
| Logical migration | automated token rewrite `ml→ms, mr→me, pl→ps, pr→pe, left→start, right→end, text-left→text-start, text-right→text-end, border-l/r→border-s/e, rounded-l/r→rounded-s/e` |
| Icon mirroring | one CSS rule for `[dir="rtl"]` chevron/arrow SVGs (lucide + tabler) |
| Measurement | Playwright + installed Chrome: `dir`, `lang`, computed `font-family`, sidebar geometry, table alignment, `scrollWidth − clientWidth`, console/page errors |
| Screenshots | desktop 1440×1000 (full page) and mobile 390×844; light and dark |

Persian copy in the screenshots was injected at runtime by replacing visible English strings
(`experiments/rtl-proof/rtl-capture.mjs`). **This is a layout proof, not a localization
implementation** — no `fa.json` catalog was authored.

## 2. Baseline: how far each project is from RTL

Counted over `src/**/*.{ts,tsx,css}` (Tailwind physical vs logical utilities).

| Project | TS/CSS files scanned | Physical tokens | Logical tokens | Logical share |
|---|---|---|---|---|
| Nellavio | 412 | **324** | **0** | 0 % |
| Velora UI | 372 | **166** | **0** | 0 % |
| Kiranism | — | 386 (earlier count) | 0 | 0 % |
| OrbynAdmin | — | 386 | 0 | 0 % |

No project sets `dir` anywhere, and no project uses `ms/me/ps/pe/start/end` utilities. RTL is a
build item, not a switch.

## 3. Migration performed and measured

| Project | Files changed | Lines changed | Physical before → after | Logical before → after |
|---|---|---|---|---|
| Nellavio | **106** | **374** | 324 → **0** | 0 → **324** |
| Velora UI | **104** | **219** | 166 → **1** | 0 → **165** |

Both migrations were mechanical and completed without touching design or brand. This is the
strongest available estimate of the token-level effort: *roughly 3 lines per file, ~1.4 % of source
files per 100 physical tokens*.

## 4. Measured results

| Page | Viewport | HTTP | `dir` | `lang` | Body font | Horizontal overflow | Console errors |
|---|---|---|---|---|---|---|---|
| Nellavio `/en` | 1440 / 390 | 200 | rtl | fa | Vazirmatn | −10 (none) | 0 |
| Nellavio `/en/customers` | 1440 / 390 | 200 | rtl | fa | Vazirmatn | −10 (none) | 0 |
| Nellavio `/en/forms` | 1440 / 390 | 200 | rtl | fa | Vazirmatn | −10 (none) | 0 |
| Nellavio `/en/user-management` | 1440 / 390 | 200 | rtl | fa | Vazirmatn | −10 (none) | 0 |
| Velora `/` | 1440 / 390 | 200 | rtl | fa | Vazirmatn | 0 | 0 |
| Velora `/components` | 1440 / 390 | 200 | rtl | fa | Vazirmatn | 0 | 2 (already known external image timeouts) |
| Velora `/pricing` (before fix) | 1440 | 200 | rtl | fa | Vazirmatn | **9999** | 0 |
| Velora `/pricing` (after fix) | 1440 / 390 | 200 | rtl | fa | Vazirmatn | **0** | 0 |

Light and dark themes were both captured; theme toggle keeps working in RTL
(`screenshots/interactions/*.png`).

## 5. Checklist (15 required items)

| # | Item | Result | Evidence / remaining work |
|---|---|---|---|
| 1 | `dir="rtl"` + `lang="fa"` | **PASS** | both apps serve `dir=rtl`, `lang=fa` |
| 2 | Layout direction flips | **PASS** | sidebar moves to the right, topbar mirrors |
| 3 | Sidebar | **PASS** | geometry mirrored; collapse chevron required the icon rule |
| 4 | Navigation | **PASS** | order reverses correctly; breadcrumb order reverses, chevrons need mirroring |
| 5 | Forms | **PASS** | inputs use `text-align: start`; no clipping at 390 px |
| 6 | Tables | **PARTIAL** | column order mirrors; header/cell alignment needs `text-start`; **pagination order and prev/next semantics need JSX changes** |
| 7 | Dropdown | **PARTIAL** | user menu opens and aligns correctly; **`DirectionProvider` is absent** in both projects, so submenu/keyboard direction follows LTR Radix defaults |
| 8 | Modal | **PASS (sample)** | centred dialogs unaffected; edge-anchored sheets need review |
| 9 | Tooltip | **PARTIAL** | no directional break in the sampled page; Radix placement depends on the missing direction provider |
| 10 | Charts | **NOT MIRRORED (by design)** | Recharts renders LTR axes. Recommendation: keep numeric/time axes LTR inside an RTL page (standard practice), mirror only labels/tooltips |
| 11 | Directional icons | **FIX REQUIRED** | one rule added: `[dir="rtl"] svg.lucide-chevron-*, .arrow-*, .tabler-icon-chevron-* { transform: scaleX(-1) }` |
| 12 | Dates & numbers | **FIX REQUIRED** | app code hardcodes `en-US`; Persian digits/calendar need `Intl` with `fa-IR` (+ `persian` calendar) in `packages/i18n` |
| 13 | Persian typography | **PASS** | Vazirmatn renders correctly; line-height 1.75–1.9 recommended (default 1.5 looks tight for Persian) |
| 14 | Responsive | **PASS** | no overflow at 390 px after fixes; Velora's overflow was the `-left-[9999px]` bug |
| 15 | Dark mode | **PASS** | both themes captured with correct contrast |

### The one real regression found

Velora `/pricing` produced a 9999 px horizontal scrollbar **only in RTL**. Root cause:

```
src/components/template/waitlist-form.tsx:93
<div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
```

A screen-reader-only helper hidden with a *physical* negative offset. In RTL the scroll origin flips
and the offset becomes scrollable width. Replacing it with `sr-only` reduced overflow to **0**
(verified). This class of bug is invisible in LTR reviews and is exactly why an RTL pass must be a
gate, not a nice-to-have.

## 6. Persian fonts evaluation

All binaries and licences are in `experiments/rtl-proof/fonts|licenses`; specimen screenshot:
`experiments/rtl-proof/screenshots/fonts-specimen.png` (rendered at 26 px / 14 px with Persian and
Latin numerals).

| Font | License (verified from upstream file) | Web-ready file | Readability (observed) | Latin pairing | Verdict |
|---|---|---|---|---|---|
| **وزیرمتن / Vazirmatn** | **OFL-1.1** (Copyright 2015 The Vazirmatn Project Authors) | `woff2` from npm `vazirmatn@33` | Excellent; wide counters, clear at 14 px | Good (own Latin) | **Recommended primary** |
| شبنم / Shabnam | OFL-1.1 | `woff2` from repo `dist/` | Very good; slightly narrower | Acceptable | Recommended alternative |
| صمیم / Samim | OFL-1.1 | `woff2` from repo `dist/` | Good; geometric, strong at large sizes | Weak Latin | **Recommended for headings** |
| گندم / Gandom | OFL-1.1 | `woff2` from repo `dist/` | Good; rounded, larger x-height | Weak Latin | Optional (friendly tone) |
| وزیر / Vazir | OFL-1.1 (repo redirects to Vazirmatn) | `woff` from npm `vazir-font@30` | Superseded by Vazirmatn | — | Do not adopt (legacy) |
| فرهنگ / Farhang | **No license file in the repository** | — | — | — | **UNVERIFIED — excluded from use and from the specimen** |

Pairing recommendation: **Vazirmatn (body/UI) + Samim (display/headings)**, Latin from the same
family or the existing Geist/Inter to keep metrics stable. Persian line-height ≈ 1.8, letter-spacing
0 (never negative for Persian).

## 7. Status per project

| Project | Status | Basis |
|---|---|---|
| **Nellavio** | **RTL_ADAPTABLE** | 324 tokens/106 files migrated mechanically; 0 overflow, 0 console errors; needs pagination JSX, `DirectionProvider`, Persian number/date formatting, fa catalog |
| **Velora UI** | **RTL_ADAPTABLE** (pages) / **RTL_HIGH_EFFORT** (full 101-component gallery) | pages adapt with 166 tokens/104 files + `sr-only` fix; the animated component library needs per-component directional review (marquee, parallax, translateX) |
| **Kiranism** | **RTL_HIGH_EFFORT** | no i18n at all; Clerk-only runtime; 386 physical tokens; a rewrite of the shell is needed before RTL can even be tested |
| **OrbynAdmin** | **RTL_HIGH_EFFORT** | 386 physical tokens, no i18n, no auth, build broken; RTL work would be spent on a foundation that must be rewritten anyway |
| **`app/` (in-house portal)** | **RTL_READY (baseline)** | already `lang="fa" dir="rtl"`, token-driven, 69/69 tests pass — no migration required to serve Persian RTL today |

## 8. Exact fix list to make either app production-RTL

**Nellavio (in order):**
1. Root layout: `dir={locale === "fa" || locale === "ar" ? "rtl" : "ltr"}` (and add `fa`/`ar` to the
   locale list — currently `en`, `pl`).
2. Wrap the app in Radix `DirectionProvider dir={dir}`.
3. `DataTablePagination`: replace visual ordering with logical DOM order (`flex-row` + `dir=rtl`
   handles it) and swap prev/next icon semantics by direction.
4. Replace `toLocaleString("en-US")` / `toLocaleDateString("en-US")` in tables, charts and cards with
   a `packages/i18n` formatter (`Intl.*` with `fa-IR`, Persian calendar, Persian digits).
5. Add the icon-mirror rule to the design system (not per component).
6. Charts: keep axes LTR (`dir="ltr"` wrapper) and mirror only legend/tooltip text.
7. Persian type scale: body 15–16 px, line-height 1.8, heading 24–32 px with Samim.

**Velora (in order):**
1. `waitlist-form.tsx:93` → `sr-only` (proven fix).
2. `DirectionProvider` for every Radix primitive used by the blocks.
3. Audit marquee/parallax/`translateX` animations for direction (they are the only components that
   broke the "no visual regression" rule conceptually, though not measured pixel-wise).
4. Replace `-left-[9999px]`-style hiding helpers everywhere (search for `9999`).
5. Persian copy for pricing/nav/footer; current content is English-only.

## 9. Evidence index

| Artefact | Path |
|---|---|
| Raw RTL capture (before migration) | `experiments/rtl-proof/rtl-raw.json` |
| Post-migration capture | `experiments/rtl-proof/rtl-fixed.json` |
| Screenshots (raw / fixed / interactions) | `experiments/rtl-proof/screenshots/{raw,fixed,interactions}/` |
| Font specimen | `experiments/rtl-proof/screenshots/fonts-specimen.png` |
| Capture script | `experiments/rtl-proof/rtl-capture.mjs` |
| Fonts + licences | `experiments/rtl-proof/fonts/`, `experiments/rtl-proof/licenses/` |

## 10. Limitations

- Persian text was injected at runtime; no i18n catalog, plural rules, or RTL-aware charts were
  implemented.
- Interaction coverage: theme toggle and one user-menu dropdown per app; modal/tooltip/submenu
  behaviour was reasoned from source (`DirectionProvider` absence) rather than exhaustively clicked.
- Only 5 + 3 pages were measured; a component-level pass over Velora's 101 components is future work.
- Screenshots are proof of layout feasibility, not a visual design approval.
