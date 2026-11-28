# Internationalization Architecture

**Status:** IMPLEMENTED (see `packages/i18n`, `docs/architecture/LOCALIZATION.md`).

## Responsibility
Language registry, locale, translation, RTL/LTR, regional formats (date/time/number/currency/units), fallback, quality.

## Boundaries
- fa/en/ar authored; 15-locale architecture; no hardcoded strings in apps.
- Scaffolding does not add languages.

## Dependencies
All UI; design system (RTL tokens).

## Maturity / Future
IMPLEMENTED (fa/en/ar) → additional locales with real translations (not claimed complete).