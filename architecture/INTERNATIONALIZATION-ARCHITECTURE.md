# INTERNATIONALIZATION-ARCHITECTURE
## معماری بین‌المللی و چندزبانه Eco Nojin

**Date:** 2026-11-18
**Status:** ARCHITECTURE PROPOSAL — no implementation, no package installed, no external service activated.
**Relation to existing documents (no duplication):**
- Extends `ECO-NOJIN-MASTER-ARCHITECTURE-V2.md` §5.2 (بومی‌سازی) and §5.1 (multi-tenancy).
- Fulfils module `PLT-I18N` in `ECO-NOJIN-MODULE-CATALOG.csv` (Localization and Formatting).
- Complements `docs/architecture/RTL-FEASIBILITY-REPORT.md` (measured RTL evidence on real codebases).
- Dynamic-content translation is specified separately in `TRANSLATION-GATEWAY-ARCHITECTURE.md`.

---

## 0. تصمیم معماری در یک نگاه

| Question | Answer |
|---|---|
| Where do UI strings live? | **In the repository**, as per-domain JSON catalogs under `packages/i18n/locales/<locale>/` — never fetched from a translation API at render time |
| Where does the language list live? | A single **Language Registry** published as a machine-readable contract (`contracts/i18n/languages.json`) and consumed by both the TS package and the backend |
| Is language the same as country/currency/calendar? | **No.** Six independent dimensions (see §5) |
| Who translates user-generated content? | `services/translation` (internal gateway), on demand, cached, with review states |
| Does the UI work when every provider is down? | **Yes** — catalogs are local; dynamic translation degrades to source text + explicit badge |
| How are new languages added? | Registry entry + catalogs + font + QA; **no structural code change** |

---

## 1. Three layers (and why they must stay separate)

```
┌──────────────────────────────────────────────────────────────────────┐
│ L-A  Static UI text        packages/i18n/locales/**  (in repo, ICU)   │
│      buttons, forms, errors, navigation, dashboards                   │
├──────────────────────────────────────────────────────────────────────┤
│ L-B  Struct/format layer   packages/i18n/{registry,formatting,         │
│      direction,validation}  — CLDR data via Intl, dir, calendars       │
├──────────────────────────────────────────────────────────────────────┤
│ L-C  Dynamic content       services/translation (MT + TM + glossary)   │
│      product descriptions, village profiles, reviews, reports          │
└──────────────────────────────────────────────────────────────────────┘
```

Hard rules:
1. **L-A never calls L-C.** A page render must not depend on a network translation call.
2. **L-B is deterministic** and testable without network.
3. **L-C is asynchronous** and its output is always labelled with its quality state.
4. No layer may hardcode a country, currency or calendar from a language code.

---

## 2. Language Registry (single source of truth)

**Location:** `contracts/i18n/languages.json` (schema in `contracts/schemas`), consumed at build time by
`packages/i18n` and at runtime by `services/translation` and the admin UI. One file, two consumers —
no duplicated lists.

### 2.1 Required fields per language

`languageCode`, `localeCode`, `nativeName`, `englishName`, `direction` (`ltr|rtl`), `script`
(ISO 15924), `numberingSystem` (CLDR), `calendarPreference`, `dateFormat`, `timeFormat`,
`pluralCategories` (CLDR), `fonts` (families + subsets + licence), `fallbackLocale`, `translationStatus`
(`draft|in_progress|review|complete|verified`), `enabled` (bool), `supportedFeatures[]`
(`static_ui`, `dynamic_mt`, `public_seo`, `scientific_terms`, `rtl_ui`, `pdf_export`), `version`.

### 2.2 Initial 15 languages

| # | Language | Locale | Native | Dir | Script | Digits | Calendar | Plural categories | Fonts (licence) |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | English | `en` | English | LTR | Latn | latn | gregorian | one, other | Inter (OFL) |
| 2 | Persian | `fa` | فارسی | RTL | Arab | arabext | persian | one, other | Vazirmatn, Samim (OFL) |
| 3 | Arabic | `ar` | العربية | RTL | Arab | arab | gregorian (+ islamic option) | zero, one, two, few, many, other | Noto Sans Arabic (OFL) |
| 4 | Spanish | `es` | Español | LTR | Latn | latn | gregorian | one, many, other | Inter (OFL) |
| 5 | French | `fr` | Français | LTR | Latn | latn | gregorian | one, many, other | Inter (OFL) |
| 6 | Chinese (Simplified) | `zh-Hans` | 简体中文 | LTR | Hans | latn | gregorian | other | Noto Sans SC (OFL) |
| 7 | Hindi | `hi` | हिन्दी | LTR | Deva | latn | gregorian | one, other | Noto Sans Devanagari (OFL) |
| 8 | Portuguese (Brazil) | `pt-BR` | Português (Brasil) | LTR | Latn | latn | gregorian | one, many, other | Inter (OFL) |
| 9 | Russian | `ru` | Русский | LTR | Cyrl | latn | gregorian | one, few, many, other | Noto Sans (OFL) |
| 10 | Urdu | `ur` | اردو | RTL | Arab | arabext | gregorian | one, other | Noto Nastaliq Urdu (OFL) → fallback Noto Naskh Arabic |
| 11 | Bengali | `bn` | বাংলা | LTR | Beng | beng | gregorian | one, other | Noto Sans Bengali (OFL) |
| 12 | Indonesian | `id` | Bahasa Indonesia | LTR | Latn | latn | gregorian | other | Inter (OFL) |
| 13 | Turkish | `tr` | Türkçe | LTR | Latn | latn | gregorian | one, other | Inter (OFL) |
| 14 | Swahili | `sw` | Kiswahili | LTR | Latn | latn | gregorian | one, other | Inter (OFL) |
| 15 | German | `de` | Deutsch | LTR | Latn | latn | gregorian | one, other | Inter (OFL) |

Notes that the implementation must honour:
- `zh-Hans` is a **language + script** locale; `zh-Hant` can be added later without structural change.
- `pt-BR` is language + region; `pt-PT` is a separate registry entry, not a suffix hack.
- `ar` may carry regional overrides (`ar-EG`, `ar-SA`) that change **numbers/calendar**, never the language identity.
- Urdu Nastaliq requires ~2.0 line-height and a Naskh fallback; it is the single most fragile layout case.
- All listed fonts are OFL-1.1; **font files must be added only after licence verification at the file level** (as done for Vazirmatn in the RTL report).

### 2.3 Adding language #16

Required work, and nothing else:
1. Add a registry entry (JSON) with the fields above.
2. Add `packages/i18n/locales/<locale>/*.json` (can start as empty = 0 % complete).
3. Add font family + subset + licence record.
4. Run the validation suite (§8) and record completeness.
5. Enable the locale for the desired surfaces (`supportedFeatures`).

If any step requires code change beyond registry/catalog/font, the design is wrong.

### 2.4 Enabled/disabled and per-surface availability

A locale can be `enabled: true` globally but unavailable for a surface (e.g. `public_seo: false`
until legal review). The resolution algorithm returns the **nearest enabled locale** for the surface,
never a silently mixed page.

---

## 3. Catalog structure

```
packages/i18n/
├── locales/<locale>/
│   ├── common.json          navigation.json    authentication.json
│   ├── dashboard.json       organization.json  landscape.json
│   ├── village.json         nomadic.json       hydroma.json
│   ├── marketplace.json     tourism.json       agriculture.json
│   ├── finance.json         inventory.json     projects.json
│   ├── reports.json         notifications.json administration.json
│   └── ai-workforce.json
├── dictionaries/<locale>.<namespace>.runtime.ts   (optional precompiled ICU)
├── glossary/terms.json
├── src/{registry,config,formatting,direction,validation}/
├── types/  tests/
```

### 3.1 Key conventions (normative)

- Dot notation, semantic and stable: `landscape.village.profile.title`.
- No English text as key; no positional keys (`text1`).
- Keys are **append-only**; renaming requires a migration record.
- One namespace per domain, matching the module catalog (`landscape`, `village`, `nomadic`, `hydroma`, …).
- Interpolation uses ICU named arguments: `{count, plural, one {# village} other {# villages}}`.
- Brand names, product names, IDs, units and glossary terms are **non-translatable** and wrapped as
  `{brand}` / `<span class="notranslate">` markers, never embedded in translatable prose.

### 3.2 Completeness tracking per key

Every key carries state: `missing → machine → review_required → reviewed → approved → outdated`.
State lives in `packages/i18n/tests/completeness.json`, generated by the validator, not hand-edited.
A locale's `translationStatus` is derived: `complete` only when every **enabled-surface** key is
`approved`.

**No silent substitution:** when a key is missing, the runtime falls back (locale → language base →
`en`) **and records a fallback event** (`data-i18n-fallback="en"` in DOM + telemetry counter). A
build fails if a fallback is used for a key marked `required` in the surface manifest.

---

## 4. Static vs dynamic content

| Kind | Examples | Path | Review requirement |
|---|---|---|---|
| Static UI | menus, buttons, forms, validation errors, system messages, dashboards, help | local catalogs | human review, `approved` before `complete` |
| CMS content | village profiles, landscape descriptions, tourism pages, articles | `content` service + per-locale variants | editorial review; legal/financial pages require `approved` |
| User-generated | reviews, comments, community notes | stored in source language | MT allowed, always labelled |
| Scientific | model descriptions, indicator definitions | glossary-bound | scientific reviewer; never free-form MT |
| Transactional | invoices, contracts, statements | finance service templates | legal locale + human approval |

Dynamic translation is always requested with an explicit target locale, cached by the key in
`TRANSLATION-GATEWAY-ARCHITECTURE.md` §5, and never blocks first paint.

---

## 5. Language ≠ country ≠ currency ≠ calendar

Six independent dimensions, persisted independently:

```
LocalizationProfile {
  language      : LocaleCode     // fa
  country       : ISO3166-1      // DE
  region        : string|null    // optional administrative region
  currency      : ISO4217        // EUR
  measurement   : metric|imperial|custom
  timeZone      : IANA           // Europe/Berlin
  calendar      : gregorian|persian|islamic-umalqura|islamic-civil
  numberFormat  : CLDR pattern override|null
  dateFormat    : pattern|null
  timeFormat    : 12h|24h
  legalLocale   : LocaleCode     // language used for legally binding documents
}
```

Resolution order: **organization default → user preference → request locale** (explicit choice wins for
display; legalLocale wins for contracts). Changing language **must not** change currency, timezone,
calendar or measurement — a Persian-speaking user in a German organization keeps EUR, metric,
Europe/Berlin.

Storage: `organization.settings`, `user.preferences`, and per-content availability. None of these are
derived from each other.

---

## 6. RTL / LTR architecture

- `dir` is derived from the registry (`direction`), applied on `<html>`; components never branch on
  `locale === 'fa'`.
- **Logical properties only**: `ms/me/ps/pe/start/end/text-start/text-end/border-s/e/rounded-s/e`.
  A lint rule fails the build on `ml|mr|pl|pr|left-|right-|text-left|text-right` in product code.
- Directional icons mirror via one design-system rule (`[dir=rtl] .icon-directional { transform: scaleX(-1) }`);
  icons that must not mirror (logos, play buttons, checkmarks) opt out explicitly.
- Mixed-direction text (Persian sentence containing Latin product names) uses `<bdi>` or
  `unicode-bidi: plaintext`; **never** concatenate translated strings.
- Charts: numeric/time axes stay LTR inside an RTL page; labels and tooltips localize. This is a
  documented decision (see `I18N-AND-LANDSCAPE-DECISIONS.md` → I18N-06), not an accident.
- Tables: DOM order is logical; visual reversal comes from `dir`, not from `flex-row-reverse` hacks.
- Pagination and steppers are **semantic** (previous/next are translated and direction-aware), not
  mirrored numbers.

## 7. Formatting, fonts, performance

| Concern | Rule |
|---|---|
| Numbers | `Intl.NumberFormat(locale, {numberingSystem})`; Persian/Urdu → `arabext`, Arabic → `arab`, Bengali → `beng` |
| Dates | `Intl.DateTimeFormat` with the profile calendar; ISO-8601 for APIs and storage |
| Units | UCUM internally, `Intl.NumberFormat` unit formatting for display; measurement system from profile |
| Currency | ISO 4217, minor units stored as integers; display via `Intl` |
| Fonts | per-script subsets; `font-display: swap`; metric-matched fallback; Nastaliq/Urdi line-height 2.0 |
| Download | initial catalog ≤ 40 KB gzip per locale; namespaces lazy-loaded per route |
| Cache | catalogs are immutable per build, hashed filenames, `immutable` cache headers |
| Offline | all static UI works with zero network; dynamic content shows source text + badge |

## 8. Validation gates (CI-blocking)

| # | Test | Method |
|---|---|---|
| V1 | exactly 15 enabled locales + registry schema valid | JSON Schema in CI |
| V2 | locale codes are valid BCP 47 and unique | `Intl.Locale` parse test |
| V3 | every namespace file parses as JSON and matches the key schema | parser |
| V4 | no duplicate keys across namespaces | key-set diff |
| V5 | no missing `required` keys for enabled surfaces | completeness report |
| V6 | every ICU message parses; placeholders match the `en` source | ICU parser + placeholder diff |
| V7 | every locale declares the plural categories CLDR requires, and each category exists | CLDR table cross-check |
| V8 | fallback chain terminates at `en` and is acyclic | graph test |
| V9 | no hardcoded user-facing string in app code | AST lint (`t('…')` required) |
| V10 | no physical-direction utility in product code | stylelint/eslint rule |
| V11 | glossary terms are not translated in catalogs | glossary diff |
| V12 | UI renders without any provider reachable | e2e with network blocked |
| V13 | translation state is recorded per key and never silently `approved` | state-machine test |

Snapshot tests: one page per app in `fa`, `ar` (RTL) and `de`, `zh-Hans` (LTR) at 1440/390 px,
light+dark — the pattern proven in the RTL feasibility report.

## 9. SEO and accessibility

- URL strategy: locale prefix (`/fa/…`, `/de/…`); `en` unprefixed only if the owner accepts mixed URLs.
- `hreflang` for all enabled locales + `x-default`; per-locale sitemap; canonical per locale.
- `<html lang>` correct; inline foreign-language spans carry their own `lang`.
- Forms: labels/errors translated; `dir` on inputs follows the **content**, not the UI
  (a German user typing a Persian address must be able to type RTL text).
- Screen-reader text for direction-sensitive controls ("next page" not "→").

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Catalog drift between apps | inconsistent UI | single package, CI validation, no per-app overrides |
| Machine translation leaks into static UI | quality/legal | L-A/L-C separation + review states |
| Urdu Nastaliq line-height/layout | broken UI | dedicated snapshot gate, Naskh fallback |
| Persian numeral mixing | wrong-looking numbers | single formatter module, lint on `toLocaleString` |
| Locale explosion (dialects) | combinatorial QA | registry `enabled` + per-surface availability, not file forks |
| Font licence violation | legal | file-level licence record per font (pattern: RTL report §6) |
| RTL regressions after refactor | bidi bugs | `dir` snapshot tests + physical-utility lint |

## 11. Acceptance criteria

1. Registry validates against schema and contains exactly the 15 initial locales with all fields.
2. Adding a 16th locale requires **no code change** (demonstrated by a dry-run test on a dummy locale).
3. Static UI renders fully with network disabled, in all three directions, with 0 missing required keys.
4. Switching language never mutates currency, timezone, calendar or units (property test).
5. Every translated key has a tracked state; no `approved` state is produced automatically.
6. All 13 validation gates run in CI and are blocking.
7. Persian/Arabic/Urdu pages pass the 1440/390 px RTL snapshot with no horizontal overflow.
