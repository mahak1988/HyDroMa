# Phase 3.86 — HyDroMA Execution Integrity & Gateway Hardening

**Classification:** `EXECUTION_INTEGRITY_HARDENED_WITH_LIMITATIONS`
**Date:** 2026-11-26
**Repository:** `D:\NOJIN`
**Scope:** backend execution integrity and gateway hardening only. No frontend, no new model scope, no worker framework, no scientific validation.

---

## 1. Executive summary

Hardened the Phase 3.83–3.85 run persistence and EngineGateway architecture:

- **Authoritative lifecycle:** clients can no longer mark runs `COMPLETED` or `CANCELLED`; completion is gateway-only after a real engine result. Public status transitions are limited to `QUEUED→RUNNING` and abort to `FAILED`.
- **Execution integrity:** timeouts/unreachable engine now produce an **uncertain** `FAILED` with `reconciliation_required=1` (never a false completion); explicit engine failure/malformed output are authoritative failures.
- **Recovery:** explicit `POST /v1/hydroma/runs/reconcile` marks stale `RUNNING` runs as `FAILED` + `reconciliation_required=1` with audit; **no automatic re-execution**.
- **Concurrency:** per-process semaphore bounds simultaneous executions (429 `execution_capacity_exceeded`); duplicate `run_key` executes once.
- **Gateway security:** fixed model, endpoint validation (http/https, no credentials/query), input allowlist, size caps, output cap, timeout/polling bounds, sensitive-key rejection, generic errors.
- **Provenance:** API run id vs `engine_run_id` are distinct and persisted; `scientific_status=NOT_VALIDATED`, `software_maturity=NULL` enforced.

Verification: **84 API tests pass / 0 fail** (58 pre-existing + 18 run/gateway + 8 integrity); lint, boundaries, arch, typecheck, build pass. No git mutation; production DB untouched; nested repo clean.

**Actual engine verification:** `ACTUAL_ENGINE_VERIFICATION_PENDING` (broken venv, no deps, installs prohibited).

---

## 2. Initial and final repository state

| Item | Initial | Final |
| --- | --- | --- |
| Branch | `main` | `main` |
| HEAD | `a3103061f561eb4289137b5f3362785580dfe28b` | unchanged |
| Staged | 0 | 0 |
| Deleted | 0 | 0 |
| Modified tracked | 28 | 28 |
| Untracked collapsed | 139 | 140 (+integrity test) |
| Production DB | mtime 04:55:35 | unchanged |
| Nested `HyDroMa/` | `develop`@`cee0553`, clean | unchanged, clean |

No git mutations.

---

## 3. Actual files modified

| Path | Reason | Change summary |
| --- | --- | --- |
| `services/api/src/db.mjs` | schema/migration | +`engine_run_id`, `reconciliation_required`, `attempts` in authoritative DDL; migration 2 (additive, duplicate-column tolerant) |
| `services/api/src/engine-gateway.mjs` | hardening | `assertSafeGatewayUrl`, output-size cap, per-process concurrency slots, fixed model unchanged |
| `services/api/src/server.mjs` | lifecycle/API | restricted public status transitions; gateway capacity/idempotency/engine id/reconciliation; reconcile endpoint; runView fields |
| `services/api/tests/runs.test.mjs` | updated | completion/cancellation now 409; failure path; migration versions `[1,2]` |
| `services/api/tests/runs-hardening.test.mjs` | updated | status rollback uses `FAILED` |
| `services/api/tests/runs-integrity.test.mjs` | new | 8 integrity/concurrency/recovery/security tests |

No unrelated WIP overwritten.

---

## 4. Lifecycle architecture

`QUEUED → RUNNING → COMPLETED | FAILED`. `COMPLETED` is authoritative and only written by the gateway after a validated engine result. `FAILED` may be client-initiated (abort) or gateway/system-initiated. `CANCELLED` is not supported (409). Terminal states reject further transitions.

---

## 5. State transition rules

| From | To | Who |
| --- | --- | --- |
| QUEUED | RUNNING | client (write) or gateway |
| QUEUED/RUNNING | FAILED | client (abort) or gateway/system |
| RUNNING | COMPLETED | gateway only (requires engine result) |
| any | CANCELLED | rejected 409 |
| COMPLETED/FAILED | any | rejected 409 |

Illegal transitions return 409 `invalid_transition`/`forbidden_transition`. Idempotency and tenant isolation preserved.

---

## 6. Execution-integrity changes

- Capacity check **before** run creation (no orphan runs on 429).
- Duplicate `run_key` resolved before execution; concurrent duplicate inserts resolve to one run and one engine call.
- `RUNNING` persisted before the engine call; `COMPLETED` only after normalized output + provenance.
- Explicit engine `failed` → `FAILED` (reconciliation 0). Malformed/oversized output → `FAILED` (0). Timeout/unreachable after creation → `FAILED` + `reconciliation_required=1` (uncertain, not success).
- Each transition + audit is transactional; slot released in `finally`.

---

## 7. Recovery policy

- Stale detection: `RUNNING` with `updated_at` older than `NOJIN_HYDROMA_STALE_MS` (default 300s).
- `POST /v1/hydroma/runs/reconcile` (write role) marks them `FAILED` + `reconciliation_required=1`, audits each, preserves run id, and **does not re-execute**.
- No new lifecycle state; the flag distinguishes uncertain outcomes. No false completion.

---

## 8. Concurrency controls

- Per-process semaphore (`NOJIN_HYDROMA_MAX_CONCURRENT`, default 4). Excess → 429 `execution_capacity_exceeded`.
- **Per process only**, not distributed; SQLite single-node deployment. No Redis/worker.
- Limits do not permit duplicate execution; idempotency is checked first.

---

## 9. Gateway security

- Fixed model id/version; no user-selected model.
- Endpoint: `assertSafeGatewayUrl` rejects non-http(s), credentials, query/fragment; default loopback; `NOJIN_HYDROMA_URL` override allowed for dev.
- Input allowlist + numeric constraints; 256 KiB input cap; sensitive-key rejection; output cap 256 KiB; overall timeout + bounded polling; correlation id; generic errors; no arbitrary module/command/file access; no sandbox claim.

---

## 10. Provenance integrity

- `engine_run_id` persisted separately from API run id.
- Engine `provenance_json` persisted when present; explicit `note: "engine provenance unavailable"` fallback with null fields (no fabrication).
- Hashes canonical; correlation id traceable; `scientific_status=NOT_VALIDATED`, `software_maturity=NULL` server-enforced; callers cannot inflate.

---

## 11. Test results (actual)

- `node --test services/api/tests/runs-integrity.test.mjs` → **8 pass / 0 fail**.
- `node --test runs.test.mjs runs-hardening.test.mjs engine-gateway.test.mjs` → **18 pass / 0 fail**.
- `pnpm run test:api` → **84 pass / 0 fail**.
- `pnpm run lint` → clean.
- `pnpm run check:boundaries` → OK (581 files).
- `pnpm run check:arch` → OK (6 files); `pnpm run test:arch` → 6 pass.
- `pnpm run typecheck` → clean.
- `pnpm run build:all` → platform + brand OK.
- Engine pytest: not run (broken venv; install prohibited).

---

## 12. Actual vs mocked verification

| Status | Value |
| --- | --- |
| Implemented | yes |
| Software-tested | yes (84 API tests) |
| Contract-tested | yes (mock engine HTTP contract) |
| Mock-verified | yes |
| Actual-engine-verified | **pending** (`ACTUAL_ENGINE_VERIFICATION_PENDING`) |
| Scientifically validated | no |
| Production-approved | no |

---

## 13. Known limitations

1. Actual engine not run (environment).
2. Concurrency is per-process, not distributed.
3. No cancellation; no automatic stale recovery (explicit reconcile only).
4. Crash between engine completion and persistence leaves `RUNNING` until reconcile.
5. Engine API loopback/unauthenticated; no sandbox.
6. No rate limiting beyond concurrency cap.
7. Reconciliation is manual/operator-triggered.
8. Scientific validation not performed.

---

## 14. Independent review (Nemotron 3 Ultra)

Reviewed actual diff/tests.

1. **Lifecycle:** COMPLETED/CANCELLED blocked; gateway-only completion; terminal re-entry rejected. Correct.
2. **Execution integrity:** timeout flagged uncertain, not completed; explicit failure/malformed authoritative; duplicate concurrency one execution. Correct.
3. **Recovery:** stale reconcile preserves id, audits, no re-execute, no false completion. Correct.
4. **Concurrency:** per-process bound, 429, slot released; not distributed (documented). Correct.
5. **Gateway security:** endpoint validation, output cap, allowlist, fixed model. Correct.
6. **Provenance/maturity:** engine id distinct, forced NOT_VALIDATED/null. Correct.
7. **Defects found/fixed during work:** migration 2 duplicate-column on fresh DB (fixed by per-statement duplicate tolerance); concurrent duplicate insert could double-execute (fixed by inserted-flag resolution).
8. **Scope/WIP/git:** no unrelated files, no git mutation, prod DB untouched, nested clean. Confirmed.
9. **Missing evidence:** actual engine, distributed concurrency, load test.

**Reviewer verdict:** accept **with limitations**; no architectural defect remains in scope.

---

## 15. Git integrity

`main` @ `a3103061f561eb4289137b5f3362785580dfe28b`; 0 staged, 0 deleted, 28 modified tracked, 140 collapsed untracked; no commits/pushes/branches/tags/refs changed.

## 16. Production DB integrity

`databases/api/nojin.db` mtime `2026-11-26 04:55:35`, size 368640 — unchanged. All tests used `:memory:` or temp files.

## 17. Final classification

`EXECUTION_INTEGRITY_HARDENED_WITH_LIMITATIONS`

- **Implemented:** authoritative lifecycle, gateway-only completion, uncertain-failure flagging, reconcile policy, per-process concurrency, gateway endpoint/output security, engine-id provenance.
- **Software-tested / mock-verified:** 84 API tests.
- **Actual-engine-verified:** pending.
- **Scientifically validated / production-approved:** no.

No frontend, no HIC, no EcoCoin monetary change, no live acquisition, no scientific validation, no git/DB mutation.