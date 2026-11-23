# ADR-0005 — i18n/RTL standard: geolibre pattern + medusa schema

- **Status:** ACCEPTED
- **Date:** 2026-11-22
- **Deciders:** owner (via resident agent)
- **Related:** Phase 3 of apps evolution plan

## Context
Eco Nojin ships fa/en/ar with real RTL from the first page. Upstream shows real RTL only in geolibre (languageDirection + DirectionProvider + dir) and partial in medusa. Medusa has a translation schema + validation test.

## Options considered
| Option | Pros | Cons | Risk |
|---|---|---|---|
| geolibre pattern + medusa schema | Complete RTL, validated catalogs | Catalog migration work | Low |
| i18next-only | Familiar | No proven RTL in upstream | Medium |

## Decision
Adopt geolibre's languageDirection + DirectionProvider (already in packages/i18n) and medusa's translation schema/validation test. I18nProvider now wraps children in DirectionProvider so all apps inherit programmatic direction. Persian/Arabic remain first-class with pseudo-RTL tests.

## Consequences
- Positive: single RTL source of truth; DirectionProvider available app-wide.
- Negative: catalog parity tests must be kept green.
- Follow-up work: complete fa/en/ar catalogs; pseudo-RTL test harness.