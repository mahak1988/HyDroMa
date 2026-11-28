# Phase 3.75 — HyDroMA Readiness Review & Traceability Report

## Baseline / final HEAD
`3dbd46532ba780eb1c8eff5ef8ad642853145ed0` → unchanged · branch `main`. No Git mutations.

## Files created / modified
- `services/api/src/db.mjs` — `hydroma_readiness_assessments`, `hydroma_readiness_reviews` (+indexes).
- `services/api/src/server.mjs` — extracted `computeReadiness` (+SHA-256 fingerprint); POST/GET/list/get/review/reviews assessment routes.
- `packages/api-client/src/client.ts` — hydroma assessment/review methods.
- `apps/platform/src/services/hooks.ts` — assessment/review hooks.
- `apps/platform/src/sections/agriculture/ReadinessModule.tsx` — save assessment, saved list, review actions, history, currentness.
- `vitest.config.ts` — `hookTimeout: 30000` (spawn-server tests; not a weakening).
- Tests: `services/api/tests/readiness-review.test.mjs`, `tests/readiness.spec.ts` (review E2E).

## Schema
Assessment snapshot (org, farm, cropCycle, contract/version, rulesVersion, state, snapshot JSON, sources JSON,
fingerprint, creator, timestamps, review_state/by/at/note). Append-only `hydroma_readiness_reviews`.

## Lifecycle
Assessment: ASSESSMENT_CREATED → PENDING_REVIEW → REVIEWED_ACCEPTABLE / REVIEWED_WITH_FINDINGS (owner/admin/manager).
Review state distinct from assessment state; original snapshot/state immutable; repeat review no-op; NOT_READY never upgraded.

## Snapshot integrity & staleness
SHA-256 fingerprint over canonical {farm.areaHa, cycle.farmId/season, irrigation sorted by id:[qty,unit,occurredAt]}.
GET assessment recomputes → `currentness: current | inputs_changed`. Snapshots never rewritten.

## Frontend
Select farm/cycle → live readiness → Save (owner) → saved list (state/reviewState) → review acceptable/findings →
history + currentness. Read-only sources; fa/en/ar; responsive; "SCIENTIFIC EXECUTION NOT AUTHORIZED" notice.

## Security
Org isolation (cross-tenant assessment → 404); RBAC (review owner/admin/manager; member 403); read-only sources;
immutable snapshots; no execution endpoint; `GET /v1/users` unchanged; no scientific status change.

## Tests (executed)
typecheck 0 · lint 0 · check:arch 0 · check:boundaries 0 · build 0 · unit **536** · backend `readiness-review`
**1/1** (persist/list/get currentness/review/history/no-op/stale/immutable/cross-tenant) · browser E2E **2/2**
(assess; save→review→history, execution-not-authorized banner).

## Limitations
Fingerprint covers current contract inputs only (not full DB); offset list (≤100); no execution/calibration/
validation; no live acquisition/EDI; no production/WCAG/scientific claims. Unrelated `health` E2E route drift not touched.

## Manifest
`manifest.sha256` (10 files) verified.

## Classification
`HYDROMA_READINESS_REVIEW_AND_TRACEABILITY_IMPLEMENTED_AND_VERIFIED_WITH_LIMITATIONS`.