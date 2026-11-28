# Phase 3.67 — Challenge Workflow UI & E2E Report

## Baseline / final HEAD
`3dbd46532ba780eb1c8eff5ef8ad642853145ed0` → unchanged · branch `main`. No Git mutations.

## Files created / modified
- Modified `apps/platform/src/sections/rewards/ChallengesModule.tsx` — participant + reviewer UI.
- Modified `apps/platform/src/services/hooks.ts` — `useSubmitEvidence`, `useReviewParticipation`, `useParticipationEvidence`.
- Modified `services/api/tests/challenge-workflow.test.mjs` — concurrency, conflict, per-user limit tests.
- Created `apps/platform/tests/challenge-workflow.spec.ts` — browser smoke.
- Report.

## Participant UI
Published challenge list with status/reward/my-status; Join (server-validated); **Submit evidence** dialog
(type, optional source type, description) for the current user's participation; status badge
(joined/submitted/approved/rejected); reward shown only after server confirmation; link path to EcoCoin.

## Reviewer UI (owner/admin)
**Review** dialog lists participations; `submitted` rows show evidence (type/source/description) with
Approve/Reject; approved/rejected show the terminal decision; reward outcome via toast; duplicate review
is a server-enforced no-op. Frontend is not a security boundary.

## Backend corrections
None required — Phase 3.66 state machine/evidence/reward verified. Added tests only.

## State machine & evidence integrity (verified)
joined→submitted→approved/rejected server-enforced; terminal decisions idempotent (repeat review returns
current, no new reward); evidence source must exist in same org + permitted type (cross-tenant/bad type → 404/422).

## Reward idempotency & concurrency (executed)
`challenge-workflow.test.mjs` (real API+SQLite): 10 concurrent approvals → **1** credit; repeat approve →
duplicate; approve-then-reject conflict → stays approved; **per-user** issuance limit enforced across
challenges (2nd credit blocked). 4/4 + ecocoin-ledger 4/4 = **8/8**.

## Security & tenancy
Member review → 403; approve-without-evidence → 409; bad source → 404; per-user limit; ledger read-only;
EcoCoin internal/non-monetary; four-eyes untouched.

## Playwright
Browser smoke (`/platform/challenges` renders + owner create action) **passes**. A full multi-user browser
E2E was attempted but the harness reuses a stale API server (`reuseExistingServer`) → evidence route 404;
the real API+SQLite integration test is the executed end-to-end backend proof. Browser E2E limitation disclosed.

## Full verification
typecheck 0 · lint 0 · check:arch 0 · build 0 · unit **530** · backend **8/8** · browser smoke 1.

## Limitations
Full click-level multi-user browser E2E blocked by stale-server harness; evidence is structured refs (no upload);
reject reason not stored (backend has no field).

## Manifest
`manifest.sha256` (5 files) verified.

## Classification
`INTEGRATED_CHALLENGE_WORKFLOW_COMPLETE_WITH_LIMITATIONS` (participant+reviewer UI + backend integrity/concurrency verified; full browser E2E harness-limited).