# Eco Nojin — Localization (i18n) Architecture

**Status:** Phase 2.1 frontend (FE‑5) · **Package:** `packages/i18n` · **Locales:** `fa`, `en`, `ar`

## 1. Architecture
- `registry.ts` — locale definitions, direction, fallback chain, `resolveLocale`.
- `provider.tsx` — `I18nProvider` / `useI18n` (locale state, `t`/`tp`, `format`, document `lang`/`dir`).
- `catalogs/{en,fa,ar}.ts` — typed translation catalogs (`Catalog` = `typeof en`).
- `direction.tsx` — `DirectionProvider` / `mirrorClass` for directional UI.

## 4. Language registry
`LocaleDefinition`: `code`, `tag` (Intl), `nativeName`, `englishName`, `direction`, `numberingSystem`, `calendar`, `fallback`, `enabled`, `status?` (`active`|`planned`|`disabled`), `translated?`.
- Current: `fa` (fa-IR, rtl, arabext, persian), `en` (en-US, ltr), `ar` (ar-EG, rtl) — all `active`, `translated: true`.
- `availableLocales()` returns enabled + active; `resolveLocale(tag)` maps a BCP‑47 tag/subtag (`fa-IR`→`fa`, `EN`→`en`) to a served locale or `null`.

## 6. Resolution & fallback (deterministic)
`detectLocale()`: 1) persisted user choice (`localStorage["eco.locale"]`) → 2) `navigator.languages` (base subtag) → 3) `DEFAULT_LOCALE` (`fa`). Selection is persisted on change.
`t(key)`: catalog[locale] → (missing) fallback catalog (`en`) → key. DEV throws on missing; PROD falls back deterministically.

## 7. RTL/LTR
`I18nProvider` sets `document.documentElement.lang`, `.dir`, `.dataset.locale` on every locale change. Shared UI uses logical CSS (`border-e`, `inset-inline-start`, `ms-auto`) and `.rtl-flip` for directional icons. No per-app RTL hacks.

## 8. Typography
`--font-fa` (Vazirmatn) applied for `[lang=fa|ar|ur]` in `base.css`; `--font-sans` (Manrope) default; display/commerce/report stacks in `tokens.css`.

## 9. Formatting
`format.{number,decimal,currency,percent,date,dateTime}` use `Intl.*` with `definition.tag` + `numberingSystem`. Scientific values are never altered by locale formatting.

## 10. Catalog integrity
`tests/catalog-parity.test.ts` — `fa`/`ar` key sets must equal `en` (no missing/extra), all leaves strings. `registry.test.ts` — registry + `resolveLocale`. `locale-detection.test.tsx` — browser/stored/default resolution + RTL.

## Adding a language (path to 15)
1. Add a `LocaleDefinition` to `LOCALES` (`status: "planned"`, `enabled: false` until ready).
2. Add `catalogs/<code>.ts` typed as `Catalog` (compiler enforces key parity).
3. Flip `enabled: true`, `status: "active"`, `translated: true` when the catalog is complete.
4. `catalog-parity` + `registry` tests guard correctness. No code change needed elsewhere.

## Limitations
- Only 3 locales are served; 15 is the target (owner decision **D‑I18N‑09**).
- No external translation services; catalogs are authored, not machine-filled.
- No browser‑installed visual verification of RTL/formatting.
- `status`/`translated` are metadata; serving is gated by `enabled`.