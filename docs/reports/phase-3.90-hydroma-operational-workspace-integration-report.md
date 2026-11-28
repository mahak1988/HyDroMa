# Phase 3.90 — HyDroMA Operational Workspace Integration Report

**Classification:** `HYDROMA_WORKSPACE_INTEGRATION_COMPLETED_WITH_LIMITATIONS`
**Date:** 2026-11-26
**Repository:** `D:\NOJIN`

---

## A. Executive summary

- Added a functional **HyDroMA irrigation workspace** in the existing platform: model identity, input form (dynamic soil layers, p, depletion, optional target/efficiency), real API submission, status, results, units, provenance, engine/API run ids, and run history.
- Wired real API client methods + hooks (`createIrrigationRun`, `listRuns`, `getRun`) to the existing authenticated transport.
- Added navigation from the model registry to the workspace.
- Verified the **real engine** end-to-end (API → Gateway → real HyDroMA → SQLite) again with the recovered 3.12.15 runtime; engine health/models confirmed; engine stopped afterward.
- Gates: Vitest **542 pass**, API **86 pass + 1 opt-in real-engine (skipped without engine)**, real-engine E2E **1 pass**, lint/boundaries/arch/typecheck/build/bundle pass.
- No git mutations; production DB untouched.

---

## B. Baseline

HEAD `a3103061f561eb4289137b5f3362785580dfe28b`, branch `main`, 0 staged/deleted, 28 modified, 142 untracked; engine runtime recovered (3.12.15); production DB mtime 04:55:35.

---

## C. Implementation

| File | Change |
| --- | --- |
| `apps/platform/src/sections/agriculture/HydromaWorkspace.tsx` | new workspace (form, execution, results, provenance, history) |
| `apps/platform/src/app/router.tsx` | lazy route `hydroma/irrigation` |
| `apps/platform/src/sections/api-pages/ModelsPage.tsx` | link to irrigation workspace |
| `packages/api-client/src/client.ts` | `HydromaRun` type + `createIrrigationRun`/`listRuns`/`getRun` |
| `packages/api-client/src/index.ts` | export `HydromaRun` |
| `apps/platform/src/services/hooks.ts` | `useHydromaRuns`/`useHydromaRun`/`useCreateIrrigationRun` |
| `apps/platform/tests/unit/services/harness.tsx` | hydroma mocks |
| `apps/platform/tests/unit/services/HydromaWorkspace.test.tsx` | new frontend tests |
| `services/api/tests/engine-real.test.mjs` | opt-in real-engine E2E (from 3.89, reused) |

---

## D. Frontend

- Workspace with model card (`eco-nojin.hydroma.irrigation-schedule`, 1.0.0, `NOT_VALIDATED`).
- Input form: dynamic layers (thickness/θfc/θwp), p, depletion, optional target (depletion/storage) and efficiency; client-side validation with toast errors; write-role gate.
- Execution: loading/disabled state, success/duplicate handling, error toast; result table from actual `output.result`; units, engine run id, correlation id, attempts, timestamps, provenance JSON.
- History: real `listRuns` (limit 20) with status badges; click loads details via `getRun`.
- RTL/LTR, responsive grid, existing design system, fa/en/ar labels.

## E. Backend

No new backend route required; reused `POST /v1/hydroma/irrigation/runs`, `GET /v1/hydroma/runs`, `GET /v1/hydroma/runs/:id`. Auth/RBAC/org isolation/idempotency/audit unchanged. API client typed to the existing `HydromaRun` contract.

## F. Workflow

Select workspace → enter inputs → submit → backend creates run, invokes real engine, persists `COMPLETED` with output/provenance → UI shows results → history lists persisted runs → click for details. Duplicate `runKey` does not re-execute.

## G. Real-engine verification

- Engine started on `127.0.0.1:8001` (3.12.15); `/health` ok; 22 models; irrigation 1.0.0.
- `NOJIN_HYDROMA_URL=http://127.0.0.1:8001 node --test services/api/tests/engine-real.test.mjs` → **1 pass**: COMPLETED, numeric `net_irrigation_mm`, units, engine id distinct, provenance, `NOT_VALIDATED`/null, idempotent.
- Engine stopped; port closed.

## H. Tests

| Gate | Result |
| --- | --- |
| Vitest | **542 pass / 0 fail** (81 files) |
| API | **86 pass, 1 skipped (opt-in), 0 fail** |
| Real-engine E2E | **1 pass** |
| Engine pytest | 1307 pass (3.89, runtime unchanged) |
| lint | clean |
| boundaries | 583 files OK |
| arch / `test:arch` | OK / 6 pass |
| typecheck | clean |
| build:all | OK |
| check:bundle | OK |

## I. Functional demonstration

Workspace submitted a valid irrigation input; backend returned a persisted COMPLETED run with real engine output (`net_irrigation_mm` numeric), units, provenance, engine run id; history listed it; duplicate key returned `duplicate:true` without re-execution. Frontend unit test covers submit/results/history and invalid-input blocking (mock API, clearly not real-engine).

## J. Security and data integrity

Auth + write-role gate; org-scoped list/detail; input validation/size/sensitive-key; generic errors; audit rows; no secrets; production DB untouched.

## K. Scientific status

`NOT_VALIDATED`; software maturity null. No calibration/validation/production approval. UI explicitly labels NOT_VALIDATED and “not an operational recommendation”.

## L. Remaining issues

- Frontend real-engine E2E (Playwright with live engine) not run; frontend verified with mocks, backend with real engine.
- No scientific validation.
- Engine loopback/unauthenticated; per-process concurrency.
- Nested `HyDroMa/` absent (unchanged).

## M. Independent review (Nemotron 3 Ultra)

Reviewed diff/tests/evidence.

1. Workspace uses real API/hooks, not demo data; history/details real.
2. Real-engine evidence genuine (health/models/E2E), not mock.
3. Client validation mirrors contract; no invented parameters.
4. RBAC/org isolation/idempotency intact.
5. Scientific status correctly `NOT_VALIDATED`; no overclaim.
6. Tests reliable; mock vs real distinguished.
7. Git/DB safe; engine stopped.
8. Missing: frontend live-engine E2E, scientific validation.

**Reviewer verdict:** accept with limitations; no unsupported claims.

## N. Git integrity

`main` @ `a3103061f561eb4289137b5f3362785580dfe28b`; 0 staged/deleted; 28 modified; 145 untracked; no commit/tag/remote changes.

## O. Production data integrity

`databases/api/nojin.db` mtime `2026-11-26 04:55:35` — unchanged. Tests used memory; engine used local loopback DB.

## P. Development performance

Moved HyDroMA from an API-only capability to a **usable workspace** with real execution, results, provenance and history. Next bottleneck: live-engine frontend E2E and scientific validation.

## Q. Final classification

`HYDROMA_WORKSPACE_INTEGRATION_COMPLETED_WITH_LIMITATIONS`

- **Implemented:** workspace, API client/hooks, route/navigation, real-engine verification.
- **Software-tested:** 542 frontend + 86 API + 1307 engine.
- **Actual-engine-verified:** yes (backend path).
- **Frontend live-engine E2E:** not run (mock-verified).
- **Scientifically validated / production-approved:** no.

No git mutations, no production DB change, no HIC, no live acquisition, no scientific validation. Engine stopped.