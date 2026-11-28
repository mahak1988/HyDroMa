# Phase 3.95 — Environmental Data Contracts, Quality Control & Scientific Data Ingestion

**Classification:** `ENVIRONMENTAL_DATA_FOUNDATION_COMPLETED_WITH_LIMITATIONS`
**Date:** 2026-11-27
**Repository:** `D:\NOJIN`

## 1. Executive summary

- **Parameter catalogue** (migration 6): 7 seeded parameters (soil moisture/temperature; precipitation, air temperature, humidity, wind, solar radiation) with category, dimension, canonical unit, allowed units, plausible min/max.
- **Environmental observations**: `env_observations` with original value/unit + canonical value/unit, source, method/instrument, quality (`VALID|WARNING|REJECTED|UNREVIEWED`), reasons, dedupe key.
- **Unit integrity**: deterministic conversions (degC/degF/K, mm/in, m/s/km/h, fraction/percent); original preserved; unsupported units rejected.
- **Quality control**: structural + range warnings (not hard rejects); no scientific validation implied.
- **CSV ingestion**: atomic import with header mapping, validation, rejected/duplicate counts, import history; duplicate-safe via unique `(org, dedupe_key)`.
- **Workspace**: `/platform/hydroma/environment` with catalogue, CSV import, observations, import history.
- **Live verified** import/quality browser workflow.
- Gates: Vitest **560 pass**, API **101 pass + 1 opt-in**, engine **1503 pass**, env live E2E **1 pass**, lint/boundaries/arch/typecheck/build/bundle pass.
- Production DB untouched.

## 2. Baseline

HEAD `a3103061f561eb4289137b5f3362785580dfe28b`, `main`, 0 staged/deleted, 33 modified, 228 untracked; prod DB 04:55:35.

## 3. Implemented changes

Catalogue/observations/imports tables, unit conversion, quality, CSV import, API, workspace, tests.

## 4. Changed files

`services/api/src/db.mjs`, `server.mjs`, `packages/api-client/src/client.ts`, `index.ts`, `apps/platform/src/services/hooks.ts`, new `sections/agriculture/EnvDataModule.tsx`, `app/router.tsx`, `sections/api-pages/ModelsPage.tsx`, harness, new `services/api/tests/env-data.test.mjs`, new `apps/platform/tests/env-live.spec.ts`, `runs.test.mjs`.

## 5. Architectural decisions

Extended existing resources; no parallel DB; observations separate from profiles; canonical units; quality ≠ validation.

## 6. Environmental data contracts

`env_parameters` + `env_observations` versioned by migration; stable codes; units.

## 7. Parameter catalogue

7 seeded, useful parameters; extensible.

## 8. Unit integrity

Deterministic conversion; original preserved; no silent inference; unsupported rejected.

## 9. Data-quality implementation

Structural validation; range warnings; quality/reasons persisted; no auto-correction.

## 10. Ingestion workflow

CSV → header map → validate → atomic insert → counts; rejects/duplicates preserved as counts.

## 11. Import integrity

Atomic transaction; import record; dedupe key; 1000-row/300KB caps.

## 12. Context integration

Farm/project validated; org isolation.

## 13. Workspace implementation

Catalogue, import, observations, history; RTL/LTR; write gate.

## 14. HyDroMA integration readiness

Parameters/units/provenance reusable; no auto model connection; models remain `NOT_VALIDATED`.

## 15. Tests and results

| Gate | Result |
| --- | --- |
| API | 101 pass, 1 skipped, 0 fail |
| Vitest | 560 pass |
| Engine | 1503 pass |
| Env live E2E | 1 pass |
| lint/boundaries/arch/typecheck/build/bundle | pass |

## 16. Live verification

Browser import of CSV (real API/dev DB), observations + VALID + import history rendered.

## 17. Independent review (Nemotron 3 Ultra)

Catalogue/units/quality/import real; atomic + duplicate-safe; tenant isolation; no scientific overclaim; git/DB safe; artifacts untracked. Accept with limitations.

## 18. Limitations

No scientific validation; no external acquisition; quality ranges are warnings; token optional; artifacts untracked; nested repo absent.

## 19. Repository integrity

`main` @ `a310306…`; 0 staged/deleted; 34 modified; 241 untracked (incl. artifacts); no commit/tag/remote.

## 20. Production-data integrity

`nojin.db` unchanged 04:55:35; dev E2E uses `nojin-e2e.db`.

## 21. Next bottlenecks

Observation→model mapping; temporal alignment; richer quality rules; artifact ignore/cleanup; scientific validation.

**Final:** `ENVIRONMENTAL_DATA_FOUNDATION_COMPLETED_WITH_LIMITATIONS`.