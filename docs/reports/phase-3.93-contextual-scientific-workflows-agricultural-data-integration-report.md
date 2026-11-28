# Phase 3.93 — Contextual Scientific Workflows & Agricultural Data Integration

**Classification:** `CONTEXTUAL_SCIENTIFIC_WORKFLOW_COMPLETED_WITH_LIMITATIONS`
**Date:** 2026-11-27
**Repository:** `D:\NOJIN`

## 1. Executive summary

- **Soil profiles** implemented (migration 4): org-scoped, farm/project-associated, source-tagged (`measured|user_entered|estimated|imported|derived`), CRUD API, unique name.
- **Context integrity**: server-side validation that farm/project exist in the org and project belongs to the farm; cross-org/invalid combos rejected 422.
- **Run snapshots**: runs persist `soil_profile_id`; `input_json` preserves the exact parameters used; historical traceability independent of later profile edits.
- **Workspace**: farm/project/soil selectors, profile load into layers, save-profile, context shown in details, farm-scoped history.
- **Live verified** contextual browser workflow against real engine.
- Gates: Vitest **545 pass**, API **94 pass + 1 opt-in**, engine **1307 pass**, live E2E **1 pass**, lint/boundaries/arch/typecheck/build/bundle pass.
- Engine stopped; production DB untouched.

## 2. Baseline

HEAD `a3103061f561eb4289137b5f3362785580dfe28b`, `main`, 0 staged/deleted, 29 modified, 149 untracked; prod DB 04:55:35.

## 3. Implemented changes

Soil table/API, context validation, soil_profile_id, workspace selectors, live spec context, tests.

## 4. Changed files

`services/api/src/db.mjs`, `server.mjs`, `packages/api-client/src/client.ts`, `index.ts`, `apps/platform/src/services/hooks.ts`, `sections/agriculture/HydromaWorkspace.tsx`, `tests/unit/services/harness.tsx`, `tests/unit/services/HydromaWorkspace.test.tsx`, `services/api/tests/runs.test.mjs`, new `services/api/tests/soil-context.test.mjs`, `apps/platform/tests/hydroma-live.spec.ts`.

## 5. Architecture

Reused resources (farms/projects) + hydroma_runs; additive migration; no parallel DB/API.

## 6. Agricultural-context integrity

Farm/project org checks; project-farm consistency; soil profile org check; 422 on invalid; tenant isolation.

## 7. Soil-context implementation

`soil_profiles` with layers JSON, source enum, notes, farm/project, unique(org,name); validated layers; no fabricated measurements.

## 8. Contextual workflow

Select farm → project → soil profile (or enter) → review → run → persist with context+snapshot → results → history → reuse.

## 9. Input snapshot & provenance

`input_json` + hashes + model/version + soil_profile_id + timestamps + NOT_VALIDATED.

## 10. Historical Run improvements

Farm/project filters, soil id in details, input reuse, farm-scoped history.

## 11. Gateway security

Optional token (3.92) retained; no new exposure.

## 12. Tests and results

| Gate | Result |
| --- | --- |
| API | 94 pass, 1 skipped, 0 fail |
| Vitest | 545 pass |
| Engine | 1307 pass |
| Live E2E | 1 pass |
| lint/boundaries/arch/typecheck/build/bundle | pass |

## 13. Real-engine verification

Engine 3.12.15; live run COMPLETED; stopped.

## 14. Live-browser verification

Playwright seeded farm/project/soil via API, reloaded, selected context, ran real engine, saw results/history/duplicate.

## 15. Independent review (Nemotron 3 Ultra)

Context validation real; soil snapshot preserved; tenant isolation; scientific status correct; git/DB safe; artifacts untracked but not destructive. Accept with limitations.

## 16. Limitations

No scientific validation; token optional; per-process concurrency; generated test artifacts untracked; nested repo absent.

## 17. Repository integrity

`main` @ `a310306…`; 0 staged/deleted; 29 modified; 167 untracked (incl. test artifacts); no commit/tag/remote.

## 18. Production-data integrity

`nojin.db` unchanged 04:55:35; dev E2E uses `nojin-e2e.db`.

## 19. Next bottlenecks

Scientific validation datasets; profile editing/versioning; distributed execution; artifact cleanup/ignore.

**Final:** `CONTEXTUAL_SCIENTIFIC_WORKFLOW_COMPLETED_WITH_LIMITATIONS`.