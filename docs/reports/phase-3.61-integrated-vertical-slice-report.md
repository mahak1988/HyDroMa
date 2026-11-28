# Phase 3.61 — First Integrated Vertical Slice Report

## 1. Selected slice
**Projects (M13) status workflow**, with its existing Territory / Village / Farm relationships.
Chosen by focused inspection: `apps/platform/src/sections/projects/ProjectsModule.tsx`,
`services/api/src/server.mjs` (`/v1/resources/projects`), `services/api/src/db.mjs` (SQLite
`resources`), and `packages/api-client`. The slice was already real end-to-end CRUD; the missing
*workflow* element was an enforced status lifecycle. No new planning/audit cycle was entered.

## 2. Baseline & final state
- Baseline HEAD: `3dbd46532ba780eb1c8eff5ef8ad642853145ed0` (verified).
- Final HEAD: `3dbd46532ba780eb1c8eff5ef8ad642853145ed0` — **unchanged**.
- Branch: `main` (unchanged).
- Git status before: 97 paths (pre-existing working tree, not clean). After: 101 paths — delta is
  this mission's edits + this report only. No staged files, no deletions, no relocation.

## 3. Existing controls reused (not recreated/weakened/bypassed)
`verify`, `check:boundaries`, `check:arch`, `test:arch`, HyDroMA `test_boundaries.py`, `test:api`,
vitest, `build:all`, `check:bundle`. The full `verify` pipeline was executed after implementation.

## 4. What was implemented (real, end-to-end)
**Backend state machine + transition endpoint** (`services/api/src/server.mjs`):
- `PROJECT_STATUS` + `PROJECT_TRANSITIONS` (planned→active/on_hold; active→on_hold/completed;
  on_hold→planned/active; completed terminal).
- `POST /v1/resources/projects/:id/transition` — tenancy-scoped, write-role enforced, validates the
  edge (409 `invalid_transition` with `allowed`), unknown status → 422 `invalid_status`, idempotent
  same-status → 200, writes a `project.transition` audit row (from→to).
- Bypass closed: create forces `status="planned"` (client value ignored); PATCH with a `status` field
  on projects → 409 `status_is_workflow_owned`.

**Client + hook**: `api.resources.transition(type,id,to)` (`packages/api-client/src/client.ts`);
`useTransitionResource` (`apps/platform/src/services/hooks.ts`).

**UI** (`ProjectsModule.tsx`): status removed from the create/edit form (workflow-owned); per-row
transition buttons generated from a client mirror of the state machine (backend authoritative);
toasts on success/error; write-role gated.

**Tests**:
- API integration (`services/api/tests/api.test.mjs`): create-starts-planned, forced-write rejected,
  illegal edge 409 + allowed set, unknown 422, legal planned→active→completed, terminal completed,
  viewer 403, cross-org 404.
- Unit (`ProjectsModule.test.tsx`): create payload omits `status`; a legal transition calls
  `resources.transition("projects","p1","completed")`. Harness gained a `transition` mock.

## 5. Verification (full `pnpm run verify`, exit 0)
typecheck 0 · lint 0 · check:boundaries 547 files/21 units 0 · check:arch 5 files 0 · test:arch 6/6 ·
check:tokens 210 files 0 · check:apps 2 apps 0 · vitest **514 passed** · test:api **15 passed** ·
build:all ✓ · bundle budget OK (808.49 KB / 900 KB). No check was bypassed; the one stale unit
assertion (expected client-sent `status`) was corrected to the new workflow contract.

## 6. Files created
- `docs/reports/phase-3.61-integrated-vertical-slice-report.md`.

## 7. Files modified
- `services/api/src/server.mjs` (state machine, transition route, create/PATCH guards).
- `services/api/tests/api.test.mjs` (workflow test).
- `packages/api-client/src/client.ts` (`resources.transition`).
- `apps/platform/src/services/hooks.ts` (`useTransitionResource`).
- `apps/platform/src/sections/projects/ProjectsModule.tsx` (transition UI; status form field removed).
- `apps/platform/tests/unit/services/ProjectsModule.test.tsx` + `harness.tsx` (transition test/mock).

## 8. Evidence of violation detection
API test proves the guardrails of the workflow: forced status write → 409, illegal edge → 409 with
`allowed`, unknown → 422, viewer → 403, cross-org → 404. Architecture guardrails (`check:arch`,
`check:boundaries`) remained green, confirming no new cross-layer import was introduced.

## 9. Limitations / not implemented
- Only the Projects status lifecycle is enforced; other resource types remain free-form.
- No e2e spec added for transitions (existing `projects.spec.ts` still valid; unit + API cover the
  workflow). E2E was not run (Playwright/DB not started in this mission).
- HyDroMA pytest not executed (engine `.venv` base interpreter missing — pre-existing env limit).
- No new contract framework, DB migration, infra or external service introduced.

## 10. Preservation confirmation
HEAD/branch unchanged; no commit/push/pull/merge/rebase/branch/tag/remote/deploy; no source
relocated or deleted; all pre-existing working-tree changes intact; only the files above touched.

## 11. Classification
`ARCHITECTURE_GUARDRAILS_IMPLEMENTED` baseline preserved; slice delivered end-to-end.
Overall: **IMPLEMENTED** (Projects status workflow, real UI→API→SQLite, tested, verify green).
Not production-ready; no scientific validation claimed.