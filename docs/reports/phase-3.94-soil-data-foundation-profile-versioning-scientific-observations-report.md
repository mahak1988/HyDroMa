# Phase 3.94 — Soil Data Foundation, Profile Versioning & Scientific Observations

**Classification:** `SOIL_DATA_FOUNDATION_COMPLETED_WITH_LIMITATIONS`
**Date:** 2026-11-27
**Repository:** `D:\NOJIN`

## 1. Executive summary

- **Profile versioning** (migration 5): `soil_profiles.version`, `soil_profile_versions` history; PATCH increments version and preserves prior layers/source; historical versions retrievable; runs pin `soil_profile_version`.
- **Soil observations**: `soil_observations` with farm/project/profile, depth, parameter, value, unit, source (`field_measurement|lab_measurement|user_entered|imported|estimated|derived`), method/instrument/quality/notes; validated server-side.
- **Workspace**: profile version selector (loads historical layers), save-as-new-version, observations form + list, context shown in run details.
- **Live contextual/versioned browser workflow** verified against real engine.
- Gates: Vitest **560 pass**, API **99 pass + 1 opt-in**, engine **1357 pass**, live E2E **1 pass**, lint/boundaries/arch/typecheck/build/bundle pass.
- Engine stopped; production DB untouched.

## 2. Baseline

HEAD `a3103061f561eb4289137b5f3362785580dfe28b`, `main`, 0 staged/deleted, 29 modified, 169 untracked; prod DB 04:55:35.

## 3. Implemented changes

Versioning tables/API, observations table/API, run version pin, workspace version/observations UI, tests.

## 4. Changed files

`services/api/src/db.mjs`, `server.mjs`, `packages/api-client/src/client.ts`, `index.ts`, `apps/platform/src/services/hooks.ts`, `sections/agriculture/HydromaWorkspace.tsx`, `tests/unit/services/harness.tsx`, `tests/unit/services/HydromaWorkspace.test.tsx`, `services/api/tests/runs.test.mjs`, new `soil-versioning.test.mjs`, `apps/platform/tests/hydroma-live.spec.ts`.

## 5. Architectural decisions

Additive migration; profile identity vs version; observations separate from profiles (no auto-derivation); snapshot in run.

## 6. Profile versioning

v1 on create; PATCH → v+1 with history row; GET versions/version; runs validate version.

## 7. Soil observations

Persistent, org-scoped, validated source/parameter/value/depth/timestamp; farm/project/profile context.

## 8. Observation provenance

Source enum distinguishes field/lab/user/imported/estimated/derived; no auto-conversion to FC/WP.

## 9. Data integrity

Org isolation, context validation, FKs, audit, no destructive migration.

## 10. Run snapshot integrity

`soil_profile_id` + `soil_profile_version` + `input_json`/hashes; historical runs unaffected by later profile edits.

## 11. Workspace integration

Version select, save version, observations form/list, details show soil/version; RTL/LTR.

## 12. Tests and results

| Gate | Result |
| --- | --- |
| API | 99 pass, 1 skipped, 0 fail |
| Vitest | 560 pass |
| Engine | 1357 pass |
| Live E2E | 1 pass |
| lint/boundaries/arch/typecheck/build/bundle | pass |

## 13. Real-engine verification

Engine 3.12.15; live versioned run COMPLETED; stopped.

## 14. Live-browser verification

Seeded farm/project, created profile v1→v2, observation, selected v2, ran real engine, results/history.

## 15. Independent review (Nemotron 3 Ultra)

Versioning/history real; observations validated; snapshots pinned; tenant isolation; scientific status correct; git/DB safe; artifacts untracked. Accept with limitations.

## 16. Limitations

No scientific validation; no auto-derivation; token optional; per-process concurrency; generated artifacts untracked; nested repo absent.

## 17. Repository integrity

`main` @ `a310306…`; 0 staged/deleted; 33 modified; 193 untracked (incl. artifacts); no commit/tag/remote.

## 18. Production-data integrity

`nojin.db` unchanged 04:55:35; dev E2E uses `nojin-e2e.db`.

## 19. Next bottlenecks

Scientific validation; observation→profile derivation methods; profile diff UI; artifact ignore/cleanup.

**Final:** `SOIL_DATA_FOUNDATION_COMPLETED_WITH_LIMITATIONS`.