# Phase 3.65 — EcoCoin Integrity, Approval Controls & Challenge Verification Report

## 1. Baseline
Built on Phase 3.64 (internal EcoCoin ledger, reward rules, challenges, verified participation). Independent review identified missing SoD and four-eyes controls. This phase implements them without redesigning architecture or introducing infrastructure.

## 2. Implementation
- **DB**: `challenges.eligible_roles` (additive migration), new `eco_coin_adjustment_requests` table (REQUESTED/APPROVED/REJECTED/EXECUTED) with frozen amount/user/org/entryType/reason and idempotent `execution_reference`.
- **Eligibility**: challenge create/update accept `eligibleRoles`; participation enforces them server-side (403 `not_eligible`).
- **Four-eyes**: `POST /v1/ecocoin/adjustment-requests`, list, approve, reject, execute. Requester ≠ approver (403 `self_approval_forbidden`); only approved requests execute; execute is idempotent via `adjustment-exec:<id>` reference; rejected requests issue nothing.
- **Concurrency/idempotency**: ledger `UNIQUE(org_id, reference)` + `INSERT OR IGNORE` remains authoritative; concurrent verify returns one credit (tested with 10 parallel requests).
- **Reconciliation**: unchanged, verified against ledger-derived balances + negative anomaly detection.

## 3. Files changed
- `services/api/src/db.mjs` (schema + migration)
- `services/api/src/server.mjs` (eligibility + four-eyes routes + helper)
- `packages/api-client/src/client.ts`, `index.ts` (types + namespaces)
- `services/api/tests/ecocoin-ledger.test.mjs` (concurrent issuance + idempotency + reconciliation + SoD tests)

## 4. Approval architecture
REQUESTED → APPROVED → EXECUTED, or REQUESTED → REJECTED. Frozen fields; approval bound to original request; no execution before approval; no duplicate execution; audit per lifecycle step.

## 5. Separation of duties
Reward issuance (challenge workflow) vs administrative adjustments (direct, owner/admin) vs four-eyes correction requests (requester ≠ approver). Reuse of existing RBAC; no new auth subsystem.

## 6. Ledger concurrency evidence
10 parallel verify calls on one participation → exactly 1 ledger entry and balance 5 (test `concurrent verification produces a single credit`). Sequential re-verify is a no-op (`duplicate: true`).

## 7. Idempotency evidence
`UNIQUE(org_id, reference)` + `INSERT OR IGNORE`; `creditEcoCoin` returns original entry with `duplicate: true`. Challenge reward reference `challenge-reward:<participationId>` is deterministic. Execution reference `adjustment-exec:<id>` prevents replay.

## 8. Reconciliation results
Ledger-derived balances; negative anomaly detected when a debit exceeds balance; ledger read-only over API (404 on POST/PATCH/DELETE).

## 9. Challenge verification results
Server-side eligibility, tenant safety, completion/reward distinguishable, re-verify no duplicate, rejection no credit, limits enforced, deterministic references, audited.

## 10. E2E results
Not executed: Playwright host not started in this mission; no new e2e spec. API integration tests cover the workflows.

## 11. RBAC and tenancy evidence
403 for non-write roles on rules/ledger/requests; 404 cross-org; self-approval 403; member cannot approve/execute. 39 API tests pass.

## 12. Tests
API: 39 passed (incl. concurrent issuance, idempotency, reconciliation, SoD, four-eyes, RBAC, tenancy). Vitest: 530 passed. Typecheck 0, lint 0, build ok.

## 13. Limitations
- SoD is role-based only (owner/admin both can request and approve; separation enforced by user identity, not role).
- No persisted four-eyes approval records beyond the request table; no email/notification.
- Node sqlite single-writer; concurrency safety relies on unique constraint + synchronous writes.
- E2E not run.

## 14. Manifest reconciliation
No new app/package; routes added to existing API. `check:apps`/`check:boundaries`/`check:arch` remain green.

## 15. Git preservation
HEAD unchanged `3dbd46532ba780eb1c8eff5ef8ad642853145ed0`, branch `main`; no commits/pushes/destructive ops. Pre-existing changes preserved.

## 16. Classification
IMPLEMENTED_WITH_LIMITATIONS — four-eyes approval and SoD for EcoCoin corrections implemented and tested; concurrency/idempotency verified by integration tests; E2E not executed.