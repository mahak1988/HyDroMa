# Phase 3.66 — Integrated Challenges, Activities & EcoCoin Rewards

## Baseline / HEAD
`3dbd46532ba780eb1c8eff5ef8ad642853145ed0` (unchanged) · branch `main`.

## Implementation summary
Completed the backend-enforced participation→evidence→review→reward workflow on the existing
challenge/EcoCoin architecture (no new balance/accounting system):
- **Evidence** (new `challenge_evidence` table, structured source refs — no file storage): participant
  submits type + optional source resource (validated to exist in the same org/type) + description.
- **Review** (owner/admin): `approve` requires evidence, issues the configured reward **idempotently**
  (deterministic `challenge-reward:<pid>` reference, issuance-limit enforced); `reject` issues nothing.
  Repeated review is a no-op. All decisions audited.
- **Client**: `challenges.submitEvidence/getEvidence/review` + `Evidence` type.

## Files changed
- `services/api/src/db.mjs` — `challenge_evidence` table.
- `services/api/src/server.mjs` — evidence submit/get + review (approve/reject) routes.
- `packages/api-client/src/client.ts` — evidence/review methods + `Evidence` type.
- `services/api/tests/challenge-workflow.test.mjs` (new) — real API+SQLite workflow tests.
- Report.

## API contracts
`POST/GET /v1/challenges/:id/participations/:pid/evidence`, `POST .../review {decision}`.
Reuses `challenge_participations`, `reward_rules`, `eco_coin_ledger`, `resources`.

## Data relationships / evidence model
Evidence 1:1 participation (UNIQUE org+participation); optional sourceType/sourceId → `resources`
(org-scoped, type-validated). Status flow: joined→submitted→approved/rejected (→reward_issued).

## Reward issuance / ledger integrity
Server-side only; existing reward rules authoritative; idempotent; limit-checked; ledger provenance;
balance reconstructable. Reject → no credit. Reuses Phase 3.65 ledger guarantees.

## Security & tenancy
Review owner/admin only; evidence own-participation only; source must be same-org; cross-org blocked;
no self-approval by member; EcoCoin internal/non-monetary; four-eyes manual adjustments untouched.

## Tests executed
`node --test challenge-workflow.test.mjs ecocoin-ledger.test.mjs` → **6/6 pass** (`backend.txt`):
full join→evidence→approve (reward 5) + repeat-approve no-op (1 ledger entry); reject→no reward;
member-review 403; approve-without-evidence 409; bad source 404. typecheck 0, lint 0, check:arch 0, build 0.

## E2E evidence
Real HTTP API + SQLite integration tests above are the executed end-to-end proof (fresh server, real DB).
A Playwright API-E2E was attempted but the harness reuses a stale API server (pre-change code → 404);
removed to keep the suite truthful. Browser UI E2E not added this pass.

## Limitations / remaining work
- Participant/reviewer **UI panel** in `ChallengesModule` not yet built (client methods ready).
- Playwright browser E2E pending a fresh-server harness.
- Evidence is structured refs (no file upload).

## Manifest / Git
`manifest.sha256` (5 files) verified. HEAD/branch unchanged; no commit/push/tag/branch/remote/deploy;
concurrent work preserved.

## Classification
`INTEGRATED_WORKFLOW_IMPLEMENTED_WITH_LIMITATIONS` (backend workflow + client + real API/DB tests verified; UI panel + browser E2E outstanding).