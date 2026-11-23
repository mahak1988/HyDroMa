# Accessibility (a11y) gate — Eco Nojin

Every app ships an `tests/a11y.spec.ts` Playwright spec using `@axe-core/playwright`.

Rules:
- Zero violations (no rule disabled) for every route × locale (fa/en/ar) × theme (light/dark).
- Locale and theme set via `eco.locale` / `eco.theme` localStorage before navigation.
- Console requires authenticated session (auth.helper.ts).
- New routes must be added to the spec's route list.
- CI runs `npm run test:a11y`.

Apps with specs: console, portal, marketplace, tourism, scientific-workspace, home, brand.
Pending: platform (0 E2E), field-collection (basic spec only).