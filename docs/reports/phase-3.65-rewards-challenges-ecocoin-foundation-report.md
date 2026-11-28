# Phase 3.65 — Rewards, Challenges & EcoCoin Foundation Report

## 1. Implementation summary
The Rewards / Challenges / EcoCoin foundation is **present and functional** in the repository. On
inspection, the subsystem was implemented by a **concurrent agent** (its frontend `rewards/` modules,
`hooks.ts`, `RewardsChallenges.test.tsx` are untracked; the backend in `server.mjs`/`db.mjs`/
`api.test.mjs` and `client.ts` are modified). Per the mission's coordination constraint ("do not
overwrite or modify files owned by another active agent without coordination"), **this executor made
no code changes** — the correct action was to verify the existing implementation end-to-end and
report evidence, not to duplicate it.

EcoCoin is internal, non-tradable, non-redeemable, non-monetary, with no blockchain, no external
issuance, no exchange rate and no monetary value. No HIC functionality was created.

## 2. Files changed
**By this executor: none.** (No source, test or config file was modified, created or deleted.)
The subsystem files (owned by the concurrent agent) are:
- Backend: `services/api/src/db.mjs` (schema), `services/api/src/server.mjs` (routes),
  `services/api/tests/api.test.mjs` (4 API tests).
- Client/contract: `packages/api-client/src/client.ts` (typed `rewards`/`challenges`/`ecocoin`).
- Frontend: `apps/platform/src/sections/rewards/ChallengesModule.tsx`, `RewardsModule.tsx`,
  `apps/platform/src/services/hooks.ts`, `apps/platform/tests/unit/services/RewardsChallenges.test.tsx`.

## 3. API contracts (verified against `client.ts`)
- `GET/POST /v1/rewards/rules`, `PATCH /v1/rewards/rules/:id` — reward-rule config.
- `GET/POST /v1/challenges`, `GET/PATCH /v1/challenges/:id`,
  `POST /v1/challenges/:id/transition`, `POST /v1/challenges/:id/participate`,
  `GET /v1/challenges/:id/participations`,
  `POST /v1/challenges/:id/participations/:pid/verify`.
- `GET /v1/ecocoin/ledger`, `GET /v1/ecocoin/summary`, `GET /v1/ecocoin/balance`,
  `GET /v1/ecocoin/reconcile`, `POST /v1/ecocoin/adjustments`.

## 4. Data model & persistence (verified in `db.mjs`)
Tables: `reward_rules`, `challenges`, `challenge_participations`, `eco_coin_ledger` (+ indexes on
org/status, participation challenge/user, ledger org/user and a **UNIQUE(org_id, reference)**). All
tenant rows carry `org_id`; foreign keys enforce referential integrity.

## 5. Ledger integrity design (verified in `server.mjs`)
- Append-only `eco_coin_ledger` (only INSERTs; corrections are compensating entries, never edits).
- Idempotent `creditEcoCoin` via `INSERT OR IGNORE` + `UNIQUE(org_id, reference)`: a repeat returns
  the original entry with `duplicate: true` (no double credit).
- Credits originate only from server-verified challenge completion or owner/admin adjustment — never
  from a client-supplied balance.
- Balance is reconstructible by summing entries; `reconcile` projects per-user balances + anomalies.
- Every credit/debit writes an audit row.

## 6. Idempotency evidence
API test `ecocoin: owner/admin adjustments are idempotent, append-only and tenancy-isolated` passes,
as does `challenge reward respects the per-user issuance limit (no over-issuance)`.

## 7. Challenge workflow (verified)
Lifecycle state machine `draft→published→closed→archived` (`CHALLENGE_TRANSITIONS`, backend
authoritative). Participation enforces duplicate/capacity/window; verification (owner/admin) issues
the reward exactly once, respecting the rule's per-user issuance limit.

## 8. Verification workflow
`POST …/participations/:pid/verify` by owner/admin → marks verified and issues EcoCoin via the
idempotent credit path; returns `{ participation, reward: { entry, duplicate, limitReached } }`.

## 9. RBAC & tenancy evidence
Write roles (owner/admin/manager) for create/config; verify/adjust restricted to owner/admin; every
query filtered by `org_id` (cross-org → 404). Covered by the passing API tests (`reward rules … RBAC
and tenancy`, `ecocoin … tenancy-isolated`).

## 10. Tests executed & results (full `pnpm run verify`, exit 0)
typecheck 0 · lint 0 · check:boundaries 560 files/21 units 0 · check:arch 0 · test:arch 6/6 ·
check:tokens 215 files 0 · check:apps 2 apps 0 · **vitest 530 passed (75 files)** ·
**test:api 35 passed** (incl. the 4 rewards/challenges/ecocoin tests) · build:all ✓ ·
bundle budget OK (868.88 KB / 900 KB). No failures.

## 11. Limitations
- EcoCoin is a participation/motivation ledger only (no value, no redemption) — by design.
- Integrations with Farms/CropCycles/Irrigation/FieldObservations/Tourism/Marketplace/MRV are not
  wired (future work; only verified activities should ever mint credit).
- HIC intentionally not implemented (independent discovery mission).
- This executor did not author the code; correctness is reported from executed tests, not authorship.

## 12. Remaining integration opportunities
Verified challenge completion → EcoCoin is the only credit path; future: link challenges to farm/
crop-cycle/observation/restoration activities once those expose verifiable completion contracts.

## 13. Manifest reconciliation
No new app/package/engine/service; `check:apps` and `app-manifest.mjs` green. The rewards UI is a
section inside `apps/platform`.

## 14. Git preservation evidence
HEAD `3dbd46532ba780eb1c8eff5ef8ad642853145ed0` unchanged; branch `main`; no commit/push/pull/merge/
rebase/branch/tag/remote/deploy; no file created/modified/deleted by this executor; concurrent agent
files untouched.

## 15. Classification
**IMPLEMENTED (by concurrent agent) — VERIFIED by this executor.** The functional subsystem exists
and the full verification suite is green (530 unit + 35 API). This executor made no changes to avoid
interfering with concurrent ownership. Not production-ready; no monetary value or scientific claim.