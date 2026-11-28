# Phase 3.65-A — EcoCoin Ledger Integrity & Concurrency Report

## Baseline
HEAD `3dbd46532ba780eb1c8eff5ef8ad642853145ed0` (unchanged) · branch `main`.

## Implementation
Inspection showed the EcoCoin ledger (Phase 3.64) already implements the required mechanics:
append-only `eco_coin_ledger` with `UNIQUE(org_id, reference)`, idempotent `creditEcoCoin`
(`INSERT OR IGNORE` → duplicate returns original entry), compensating `admin_adjustment` debits
(no history rewrite), read-only ledger API, and a `reconcile` that recomputes balances and flags
negative anomalies. No production change was required; the gap was **executable proof**. Added a real
concurrency/idempotency/reconciliation/RBAC/isolation suite (no mocks, real SQLite).

## Files changed
- Added `services/api/tests/ecocoin-ledger.test.mjs` (4 tests).
- No production/backend code modified (ledger already correct); agent B's four-eyes files untouched.

## Ledger integrity
Read-only over API (PATCH/DELETE `/v1/ecocoin/ledger/:id` → 404); credits only via verified challenge
or owner/admin adjustment; compensating debits preserve original entries; audit provenance written.

## Concurrency model
Single SQLite connection serializes writes; `UNIQUE(org_id,reference)` is authoritative. 10 concurrent
`verify` calls → exactly one 201-equivalent credit, 9 duplicates; balance = 5, ledger total = 1.
Limitation: in-memory SQLite (single writer); production multi-connection would rely on the same UNIQUE
constraint + `INSERT OR IGNORE` (documented, not separately load-tested).

## Idempotency evidence
Deterministic reference `challenge-reward:<participationId>`; sequential re-verify → `duplicate:true`,
no extra credit; not dependent on frontend state.

## Reconciliation
`reconcile` reconstructs per-member balances from the immutable ledger; a compensating debit exceeding
the balance is flagged in `anomalies` (totalBalance -5) while the original credit remains; read-only.

## Tests executed
`node --test services/api/tests/ecocoin-ledger.test.mjs` → **4/4 pass** (`mine.txt`):
concurrent single-credit, sequential no-op, reconciliation+anomaly+read-only, RBAC+tenant isolation.
Combined backend (`api+security+ecocoin`) → **31/32**; the single failure is a **concurrent** `health`
test in `api.test.mjs` (server route drift, not this mission). `check:arch` 0.

## Limitations
In-memory SQLite single-writer; no multi-process load test; EcoCoin internal/non-monetary only;
reconcile detects negative-balance anomalies (not a full double-entry audit).

## Manifest reconciliation
`manifest.sha256` (2 files) verified; logs in `%TEMP%\kilo\phase_3_65a\`.

## Git preservation
HEAD/branch unchanged; no commit/push/tag/branch/remote/deploy; no destructive ops; concurrent work
(incl. four-eyes + the in-flux `server.mjs` that briefly failed to compile) preserved — I waited for it
to compile rather than editing it.

## Classification
`LEDGER_INTEGRITY_VERIFIED_WITH_LIMITATIONS` (integrity/concurrency/idempotency/reconciliation/RBAC/
isolation proven by real tests; single-writer SQLite limitation; one unrelated concurrent test failure).