# Phase 3.84 — Scientific Run Persistence Hardening

**Status:** `RUN_PERSISTENCE_HARDENED_WITH_LIMITATIONS`
**Date:** 2026-11-26
**Repository:** `D:\NOJIN`
**Scope:** hardening of the Phase 3.83 run persistence only. No EngineGateway, execution, frontend, HIC, live acquisition or monetary EcoCoin.

---

## A. Executive summary

Hardened the scientific-run persistence foundation with focused, additive changes:

- **Atomic run+audit** for create and status transitions (`BEGIN…COMMIT`, `ROLLBACK` on error).
- **Concurrent idempotency** evidence for same-key and cross-tenant requests.
- **Migration failure/recovery** evidence with a testable `runMigrations(db, migrations)` seam.
- **Schema single-source**: `HYDROMA_RUNS_SCHEMA` now feeds both `SCHEMA` and `MIGRATIONS` (no duplicated DDL).
- **Payload protection**: size caps and sensitive-key rejection before persistence.
- **Server-controlled maturity**: `scientific_status` forced to `NOT_VALIDATED`, `software_maturity` nulled; caller cannot inflate claims.

Verification: 6 new hardening tests + 6 existing run tests + 58 pre-existing API tests = **70 API tests pass / 0 fail**; lint, boundaries, arch, typecheck, build all pass. No git mutation; production DB untouched.

---

## B. Initial and final Git integrity

| Item | Initial | Final |
| --- | --- | --- |
| Branch | `main` | `main` |
| HEAD | `a3103061f561eb4289137b5f3362785580dfe28b` | unchanged |
| Staged | 0 | 0 |
| Deleted | 0 | 0 |
| Modified tracked | 28 | 28 |
| Untracked collapsed | 134 | 135 (new hardening test) |
| Git mutations | none | none |

Production DB `databases/api/nojin.db` mtime `2026-11-26 04:55:35` — unchanged.

---

## C. Files modified

| Path | Reason | Change summary |
| --- | --- | --- |
| `services/api/src/db.mjs` | schema single-source + migration testability | +`HYDROMA_RUNS_SCHEMA` constant used by `SCHEMA` and `MIGRATIONS`; `MIGRATIONS`/`runMigrations` exported; `runMigrations(db, migrations=MIGRATIONS)`; legacy ALTER ignores “no such table” for minimal DBs |
| `services/api/src/server.mjs` | atomicity, payload, maturity | create/status wrapped in explicit transactions with audit inside; size caps + sensitive-key rejection; `scientific_status='NOT_VALIDATED'`, `software_maturity=NULL` server-side |
| `services/api/tests/runs.test.mjs` | updated expectation | create now reports `NOT_VALIDATED` |
| `services/api/tests/runs-hardening.test.mjs` | new tests | atomic create/status + rollback, concurrency, migration failure/recovery, payload protection, maturity control |

No unrelated WIP overwritten.

---

## D. Transaction and audit architecture

- Create: `BEGIN` → `INSERT OR IGNORE` → audit (only when inserted) → `COMMIT`; on error `ROLLBACK` and rethrow (generic 500 response).
- Status: `BEGIN` → `UPDATE` → audit → `COMMIT`; on error `ROLLBACK`.
- Audit rows therefore correspond only to committed mutations.
- Tests force audit failure by dropping the `audit` table in a temporary DB: create/status return 500 and the run mutation is absent/unchanged.
- Existing audit semantics and tenant scoping unchanged.

---

## E. Concurrent idempotency tests

- 8 concurrent `POST /v1/hydroma/runs` with the same `(org, run_key)`: exactly one 201, the rest 200; DB count = 1.
- Same key in a second tenant creates an independent run.
- Uniqueness remains authoritative (`UNIQUE(org_id, run_key)`); no constraint weakened.
- Limitation: the server uses one synchronous SQLite connection, so requests serialize at the event loop; the test proves deterministic behavior, not multi-process parallelism.

---

## F. Migration failure and recovery

- `runMigrations(db, migrations)` accepts an explicit list (default `MIGRATIONS`) for controlled tests.
- Test: migration 1 succeeds, migration 2 fails → version 2 not recorded, migration 1 committed, error rethrown; a later valid migration 2 succeeds and is recorded.
- Production migrations unchanged; no production DB touched.

---

## G. Schema source-of-truth

- `HYDROMA_RUNS_SCHEMA` is the single authoritative DDL (table + indexes + `schema_migrations`).
- `SCHEMA` interpolates it for new databases; `MIGRATIONS[0].statements` references it for existing databases.
- Removed the duplicated inline DDL; no destructive change; historical migration behavior preserved.
- Strategy: new DB = `SCHEMA` (which includes the constant) + version recorded; existing DB = `SCHEMA` no-op + migration records version.

---

## H. Payload protection

- Caps: input 256 KiB, output 256 KiB, provenance 64 KiB, units 16 KiB; `resultSummary`/`error` 500 chars; request body 1 MiB (existing).
- Sensitive-key detection (recursive, case-insensitive): password/passphrase, secret, token, api_key, private_key, credential. Rejects with generic 422 before persistence; values are never logged or echoed.
- Oversized payloads rejected 413 before persistence.
- Rejected payloads are not stored (tested).
- Limitation: detection is key-name based, not value-entropy based; callers must still avoid secrets.

---

## I. Maturity metadata

- `scientific_status` is forced to `NOT_VALIDATED` on create and every transition; `software_maturity` is forced to `NULL`.
- Caller-supplied `scientificStatus`/`softwareMaturity` are ignored (tested: `VALIDATED`/`production_approved` do not persist).
- No model registry is implemented; no model activated; scientific status is never inferred from software tests.
- Limitation: a future EngineGateway must set authoritative maturity through a server-controlled path; the current update path intentionally clears it.

---

## J. Test results (actual)

- `node --test services/api/tests/runs-hardening.test.mjs` → **6 pass / 0 fail**.
- `node --test services/api/tests/runs.test.mjs` → **6 pass / 0 fail**.
- `pnpm run test:api` → **70 pass / 0 fail**.
- `pnpm run lint` → clean.
- `pnpm run check:boundaries` → OK (581 files, 21 units).
- `pnpm run check:arch` → OK; `pnpm run test:arch` → 6 pass.
- `pnpm run typecheck` → clean.
- `pnpm run build:all` → platform + brand OK.

Expected 500 stack traces appear in test logs for the forced audit-failure cases; HTTP responses are generic (no internal details).

---

## K. Regression verification

All 58 pre-existing API tests still pass; run tests updated only for the server-controlled `NOT_VALIDATED` default. Architecture/boundary/typecheck/build gates pass. Frontend untouched.

---

## L. Architecture boundary verification

No frontend/DB/engine crossover; backend remains the only persistence authority; no HyDroMA import or invocation; `check:arch` and `check:boundaries` pass.

---

## M. Security assessment

- Auth + RBAC on writes; org isolation enforced and tested.
- Atomic audit prevents unaudited committed mutations.
- Payload caps + sensitive-key rejection reduce secret/oversize risk.
- Generic error envelope; no internal DB errors exposed over HTTP.
- Maturity claims cannot be inflated by clients.
- Limitations: key-name-based redaction, no rate limiting, single connection, no full security audit.

---

## N. Known limitations

1. Concurrency test is single-process/single-connection (deterministic, not parallel).
2. Audit-failure tests use `DROP TABLE audit` on temporary DBs.
3. Maturity is cleared on each update; future gateway needs a server-controlled setter.
4. Payload detection is name-based, not entropy-based.
5. No rate limiting; single SQLite connection.
6. Migration test uses an injected list; production migration list unchanged.
7. Scientific validation not performed; all models remain `NOT_VALIDATED`.

---

## O. Independent reviewer findings (Nemotron 3 Ultra)

Reviewed actual diff and tests.

1. **Atomicity:** create/status now include audit in the same transaction; rollback verified by forced audit failure. Correct.
2. **Concurrency:** uniqueness authoritative; 8-way test shows one 201. Evidence is deterministic but not multi-process; claim must stay bounded (it is).
3. **Migration:** failure not recorded, rollback holds, later success works. Correct. `runMigrations` default preserves production behavior.
4. **Schema drift:** single constant removes duplication; no destructive change. Correct.
5. **Payload:** caps and sensitive-key rejection are reasonable; name-based detection is a documented limitation.
6. **Maturity:** caller cannot inflate; server forces `NOT_VALIDATED`/null. Correct, but future gateway must not rely on the status route to set maturity.
7. **Scope/WIP:** no unrelated files, no git mutation, prod DB untouched. Confirmed.
8. **Missing evidence:** true parallel/concurrent-writer test, entropy-based secret detection, rate limiting. Non-blocking for this hardening scope.

**Reviewer verdict:** accept **with limitations**; no architectural defect found in the scoped changes.

---

## P. Final verdict

`RUN_PERSISTENCE_HARDENED_WITH_LIMITATIONS`

- **Implemented:** atomic run+audit, concurrency-safe idempotency, migration recovery, single-source schema, payload protection, server-controlled maturity.
- **Software-tested:** 12 run tests + 58 existing API tests; lint/boundaries/arch/typecheck/build.
- **Verified:** rollback, tenant isolation, migration integrity, payload rejection, maturity control.
- **Not validated:** scientific models (unchanged, `NOT_VALIDATED`); no scientific validation.
- **Not implemented (by design):** EngineGateway, execution, frontend, recommendations, tasks, live acquisition, HIC, monetary EcoCoin.

No git staging/commit/push, no production DB change, no deployment, no HIC activation, no live acquisition.