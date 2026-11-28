# Phase 3.83 — Scientific Run Persistence Foundation

**Status:** `RUN_PERSISTENCE_IMPLEMENTED_WITH_LIMITATIONS`
**Date:** 2026-11-26
**Repository:** `D:\NOJIN`
**Scope:** persistence foundation only. No EngineGateway, no model execution, no frontend, no live acquisition, no HIC, no EcoCoin monetary changes.

---

## A. Executive summary

Implemented a tenant-scoped, idempotent scientific-run persistence foundation on the existing SQLite architecture:

- Added `hydroma_runs` (append-only run records with a mutable lifecycle) and `schema_migrations`.
- Replaced the ad-hoc migration with a **versioned, transactional, forward-only** mechanism (migration 1).
- Added `busy_timeout = 5000` alongside existing WAL + foreign keys.
- Added a minimal persistence API boundary (`POST/GET /v1/hydroma/runs`, `POST /v1/hydroma/runs/:id/status`) with RBAC, org isolation, canonical SHA-256 hashes, lifecycle validation, audit rows and idempotent `run_key`.
- Added 6 real tests (temporary/in-memory SQLite). Full API suite: **64 pass / 0 fail**. Lint, boundaries, arch, typecheck, build all pass.

No model is executed, no engine is invoked, no production DB was touched, no git mutation occurred.

---

## B. Baseline and final Git integrity

| Item | Baseline | Final |
| --- | --- | --- |
| Branch | `main` | `main` |
| HEAD | `a3103061f561eb4289137b5f3362785580dfe28b` | unchanged |
| Staged | 0 | 0 |
| Deleted | 0 | 0 |
| Modified tracked | 28 | 28 (same files; content extended) |
| Untracked collapsed | 132 | 133 (new test file) |
| Git mutations | none | none |

Production DB `databases/api/nojin.db` last write `2026-11-26 04:55:35`, before this mission — **not modified**.

---

## C. Files modified

| Path | Reason | Change summary |
| --- | --- | --- |
| `services/api/src/db.mjs` | schema + migration | +`busy_timeout`; +`schema_migrations`; +`hydroma_runs` + 3 indexes; versioned `MIGRATIONS`/`runMigrations` (transactional, recorded once); legacy `eligible_roles` repair retained |
| `services/api/src/server.mjs` | persistence boundary | +canonical JSON/SHA-256 helpers, `RUN_TRANSITIONS`, `runView`; +4 routes under `/v1/hydroma/runs` (create/list/get/status); audit on create/status |
| `services/api/tests/runs.test.mjs` | tests | new file: schema/migration, lifecycle, failure/cancel, tenant isolation, canonical hashing, invalid payload |

No existing WIP file was overwritten or reverted; `db.mjs`/`server.mjs` were already modified WIP and were extended additively.

---

## D. Database schema

**`schema_migrations`**
- `version INTEGER PRIMARY KEY`, `applied_at TEXT NOT NULL`.

**`hydroma_runs`**
| Column | Type | Notes |
| --- | --- | --- |
| id | TEXT PK | `run_…` |
| org_id | TEXT NOT NULL FK organizations ON DELETE CASCADE | tenant |
| run_key | TEXT NOT NULL | idempotency key, `UNIQUE(org_id, run_key)` |
| model_id / model_version | TEXT NOT NULL | model identity |
| status | TEXT NOT NULL DEFAULT QUEUED | CHECK in QUEUED/RUNNING/COMPLETED/FAILED/CANCELLED |
| farm_id / crop_cycle_id | TEXT NULL | polymorphic references (no FK; resources are JSON) |
| input_json / input_hash / parameter_hash | TEXT NOT NULL | canonical JSON + SHA-256 |
| output_json / result_summary / provenance_json / units_json | TEXT NULL | result payload |
| software_maturity / scientific_status | TEXT NULL | honest metadata; default null |
| error | TEXT NULL | failure info |
| requested_by | TEXT FK users ON DELETE SET NULL | actor |
| correlation_id | TEXT NULL | request correlation |
| created_at / updated_at / started_at / completed_at | TEXT | timestamps |

**Indexes:** `idx_hydroma_runs_org_status`, `idx_hydroma_runs_org_farm`, `idx_hydroma_runs_org_model`; unique `(org_id, run_key)`.
**Relationships:** org cascade; user set-null; farm/crop-cycle are logical references to `resources`.

---

## E. Migration report

- Mechanism: `schema_migrations` version table; `MIGRATIONS` array; each unapplied version runs inside `BEGIN…COMMIT`, records `now()`, and is never re-applied. Failure rolls back and rethrows.
- Migration 1 (`hydroma_runs`): idempotent `CREATE TABLE/INDEX IF NOT EXISTS`.
- Legacy repair: `ALTER TABLE challenges ADD COLUMN eligible_roles` best-effort, duplicate ignored (pre-versioning DBs).
- Tested on a temporary file DB: version `[1]` after first open and still `[1]` after reopen (no reapply). In-memory DBs used elsewhere.
- No existing rows/tables altered destructively; no production DB touched.

---

## F. Run persistence architecture

`API (server.mjs) → db.mjs (SQLite) → hydroma_runs`. The service layer owns canonicalization/hashing/lifecycle; the DB enforces tenant FK, uniqueness, status CHECK and indexes. The future EngineGateway will call this boundary; it does not exist yet and is not implemented here.

Serialization: `canonicalize()` recursively sorts object keys; `canonicalJson` = `JSON.stringify(canonicalize(v))`; hashes = SHA-256 of canonical JSON. Same logical input in different key order yields identical hashes (tested).

---

## G. Run lifecycle

`QUEUED → RUNNING → COMPLETED | FAILED | CANCELLED`; `QUEUED → CANCELLED`; terminal states accept no transition (409). Enforced in `RUN_TRANSITIONS` at the persistence boundary. No asynchronous execution is implemented or claimed; the schema does not prevent a future worker from updating status.

---

## H. Tenant isolation

- Every route resolves org via `orgFrom` (query `organizationId` or first active membership) and 404s on non-membership.
- Reads/writes are `WHERE id = ? AND org_id = ?`; list is org-filtered.
- Idempotency is org-scoped (`UNIQUE(org_id, run_key)`): same key in another org is a distinct run.
- Tested: cross-org get/update 404, cross-org list empty, same key in org B distinct.

---

## I. Transaction and idempotency behavior

- Create: single `INSERT OR IGNORE` (atomic); duplicate returns existing row with `duplicate: true` (200).
- Status: single `UPDATE` (atomic) with transition validation.
- Migration: transactional per version.
- Audit insert is a separate statement (not in the same transaction as create/update) — a crash between them could leave a run without an audit row (limitation).
- No global idempotency framework; scope limited to `(org_id, run_key)`.

---

## J. Test results (actual)

Command: `node --test services/api/tests/runs.test.mjs`
- 6 tests, 6 pass, 0 fail.

Coverage: migration version/idempotency, FK/busy/index, create, duplicate, invalid transition, RUNNING/COMPLETED with output/provenance/units, terminal rejection, FAILED with error and no fabricated output, CANCELLED, cross-tenant read/list/update denial, org-scoped idempotency, canonical hash determinism, invalid payload rejection without persistence.

Full API: `pnpm run test:api` → **64 pass / 0 fail**.
`pnpm run lint` → clean. `pnpm run check:boundaries` → OK (581 files). `pnpm run check:arch` → OK. `pnpm run test:arch` → 6 pass. `pnpm run typecheck` → clean. `pnpm run build:all` → platform + brand OK.

---

## K. Regression verification

All existing API tests (58) still pass alongside the 6 new ones. Architecture/boundary/token/build gates pass. No frontend code changed, so Vitest was not required; build confirms no integration break.

---

## L. Architecture boundary verification

- Frontend untouched; no DB/engine access from UI.
- Backend remains the only persistence authority.
- No HyDroMA import in backend; no engine invocation.
- `check:arch` (engine independence) and `check:boundaries` pass.

---

## M. Security assessment

- Auth required on all run routes; writes require owner/admin/manager.
- Org isolation enforced server-side and tested.
- Generic error envelope; no internal details leaked.
- Hashes computed from canonical data, not placeholders.
- No secrets added. **Limitation:** input/output/provenance are stored verbatim; no secret redaction is performed (callers must not send secrets).
- No rate limiting (pre-existing gap).
- Not a full security audit.

---

## N. Known limitations

1. No concurrent duplicate-create test (sequential idempotency only).
2. Audit insert is not in the same transaction as the run mutation.
3. Migration DDL is duplicated in `SCHEMA` and `MIGRATIONS` (drift risk).
4. Legacy `eligible_roles` repair is not versioned.
5. `farm_id`/`crop_cycle_id` have no FK (polymorphic resources).
6. No secret redaction in serialized payloads.
7. No rate limiting; single SQLite connection (no pool).
8. No EngineGateway/execution (by design).
9. Scientific status remains `NOT_VALIDATED`; software maturity is caller-supplied metadata, not verified here.

---

## O. Independent reviewer findings (Nemotron 3 Ultra)

Reviewed actual diff, schema, migration, transactions, tenancy, lifecycle, serialization, tests, boundaries, WIP.

**Defects / risks:**
1. **DDL duplication** between `SCHEMA` and `MIGRATIONS` may drift; acceptable now but should be single-sourced later.
2. **Audit atomicity:** create/status audit is outside the mutation transaction; a crash can produce unaudited state. Recommend same-transaction audit in a later hardening step.
3. **Concurrency:** no test for simultaneous identical `run_key`; `INSERT OR IGNORE` is expected to be safe, but evidence is missing.
4. **Migration failure path:** no test that a failing migration rolls back and is not recorded.
5. **Secret redaction:** payloads stored verbatim; documented, not enforced.
6. **Status metadata trust:** `softwareMaturity`/`scientificStatus` are caller-provided; no server-side verification against the model registry (future EngineGateway must set them).
7. **No rate limiting** on run creation.
8. **Scope:** no unrelated files touched; WIP preserved; no git mutation; production DB untouched — confirmed.

**Missing evidence:** concurrency test, migration-failure test, load behavior. None blocks the persistence foundation but prevents an unqualified acceptance.

**Reviewer verdict:** implementation is correct and scoped; accept **with limitations** after noting items 1–7. A green suite alone was not used as acceptance.

---

## P. Final verdict

`RUN_PERSISTENCE_IMPLEMENTED_WITH_LIMITATIONS`

Distinctions:
- **Implemented:** schema, migration, persistence API, lifecycle, tenancy, idempotency, hashing, audit.
- **Software-tested:** 6 new + 58 existing API tests, lint, boundaries, arch, build.
- **Verified:** tenant isolation, lifecycle, serialization, migration idempotency.
- **Not validated:** scientific models (unchanged, `NOT_VALIDATED`); no scientific validation performed.
- **Not implemented (by design):** EngineGateway, execution, frontend, recommendations, task creation, live acquisition, HIC, monetary EcoCoin.

No git staging/commit/push, no production DB change, no deployment, no HIC activation, no live acquisition.