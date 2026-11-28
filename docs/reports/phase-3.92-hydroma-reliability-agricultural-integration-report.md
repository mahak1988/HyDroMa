# Phase 3.92 — HyDroMA Reliability, Agricultural Context Integration & Continuous Development

**Classification:** `HYDROMA_RELIABILITY_AND_AGRICULTURAL_INTEGRATION_COMPLETED_WITH_LIMITATIONS`
**Date:** 2026-11-26
**Repository:** `D:\NOJIN`

---

## 1. Executive summary

- **Agricultural context**: runs now persist `project_id` (migration 3) alongside `farm_id`; API list supports `farmId`/`projectId` filters; workspace adds farm/project selectors, sends context, displays it, and history is farm-scoped.
- **Gateway security**: optional shared-token boundary (`HYDROMA_API_TOKEN` → `X-Hydroma-Token`) enforced by the engine; disabled by default for dev.
- **Reliability**: fixed the duplicate `irrigation` React key (removed duplicate page); preserved lifecycle/idempotency/reconciliation; context index added.
- **Live verified**: real browser → API → Gateway → real engine → persistence → browser passes; duplicate key warning gone.
- Gates: Vitest **542 pass**, API **87 pass + 1 opt-in**, engine **1307 pass**, live E2E **1 pass**, lint/boundaries/arch/typecheck/build/bundle pass.
- Engine stopped; production DB untouched.

## 2. Baseline

HEAD `a3103061f561eb4289137b5f3362785580dfe28b`, `main`, 0 staged/deleted, 28 modified, 148 untracked; production DB mtime 04:55:35.

## 3. Implemented changes

- DB migration 3: `project_id` + `idx_hydroma_runs_org_project`.
- API: run view/insert/list filters for project/farm.
- Gateway: optional token header.
- Engine: optional token dependency.
- Workspace: context selectors, project/farm display, farm-scoped history.
- Nav: removed duplicate `irrigation` page.
- Tests: context persistence/filter; updated migration expectations.

## 4. Changed files

`services/api/src/db.mjs`, `services/api/src/server.mjs`, `services/api/src/engine-gateway.mjs`, `engines/hydroma/hydroma/api.py`, `packages/api-client/src/client.ts`, `apps/platform/src/services/hooks.ts`, `apps/platform/src/sections/agriculture/HydromaWorkspace.tsx`, `apps/platform/src/content/pages.ts`, `apps/platform/tests/unit/services/HydromaWorkspace.test.tsx`, `services/api/tests/runs.test.mjs`.

## 5. Architectural decisions

Reuse existing run persistence/API; additive migration; token optional (no new infra); context via existing `resources` farms/projects.

## 6. Execution lifecycle improvements

No unsafe retries; timeouts/reconciliation unchanged; context added without altering `QUEUED→RUNNING→COMPLETED|FAILED`.

## 7. Security improvements

Optional gateway→engine token; existing API auth/RBAC/org isolation intact; no engine exposure.

## 8. Agricultural-context integration

Farm/project selectable; persisted and filterable; history scoped by farm; missing context shown as `—` (no fabrication).

## 9. Persistence improvements

`project_id` column/index; context filters; append-only semantics preserved.

## 10. Workspace improvements

Context selectors, context in details, farm-scoped history, existing reuse/validation/RTL.

## 11. Scientific-validation readiness

Provenance/units/version/hashes retained; `NOT_VALIDATED` unchanged; no validation performed.

## 12. Tests and results

| Gate | Result |
| --- | --- |
| Engine pytest | 1307 pass |
| API | 87 pass, 1 skipped (opt-in), 0 fail |
| Vitest | 542 pass |
| Live browser E2E | 1 pass |
| lint/boundaries/arch/test:arch/typecheck/build/bundle | pass |

## 13. Real-engine verification

Engine 3.12.15 on 8001; health ok; 22 models; live run COMPLETED with results/provenance; stopped.

## 14. Live-browser verification

Playwright real app/API/engine; context form present; run completed; history; duplicate idempotent; no duplicate-key warning.

## 15. Independent review (Nemotron 3 Ultra)

Reviewed diff/evidence. Context persistence/filter real; token optional and non-breaking; lifecycle/idempotency intact; scientific status correct; git/DB safe; engine stopped. Missing: scientific validation, token rotation/load. Accept with limitations.

## 16. Remaining limitations

No scientific validation; engine loopback/token optional; per-process concurrency; nested repo absent.

## 17. Repository integrity

`main` @ `a3103061f561eb4289137b5f3362785580dfe28b`; 0 staged/deleted; 29 modified; 148 untracked; no commit/tag/remote changes.

## 18. Production-data integrity

`databases/api/nojin.db` mtime 04:55:35 — unchanged; dev E2E uses `nojin-e2e.db`.

## 19. Next technical bottlenecks

Scientific validation datasets/design; engine auth hardening; distributed execution if load requires; broader farm/project UX.

**Final:** `HYDROMA_RELIABILITY_AND_AGRICULTURAL_INTEGRATION_COMPLETED_WITH_LIMITATIONS`.