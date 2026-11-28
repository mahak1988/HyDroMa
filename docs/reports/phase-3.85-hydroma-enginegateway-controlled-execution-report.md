# Phase 3.85 — HyDroMA EngineGateway & Controlled Execution Integration

**Status:** `HYDROMA_GATEWAY_IMPLEMENTED_WITH_LIMITATIONS`
**Date:** 2026-11-26
**Repository:** `D:\NOJIN`
**Scope:** Backend → EngineGateway → HyDroMA HTTP contract → persisted scientific run, irrigation model only. No frontend, no scientific validation, no live acquisition, no HIC, no monetary EcoCoin.

---

## A. Executive summary

Implemented the first controlled software integration between the Eco Nojin backend and the independent HyDroMA engine:

- New `services/api/src/engine-gateway.mjs`: HTTP-contract gateway (POST `/v1/runs`, GET `/v1/runs/:id`), fixed irrigation model identity, input-contract validation, bounded timeout/polling, normalized output/provenance/errors, no engine imports.
- New `POST /v1/hydroma/irrigation/runs`: RBAC + tenant-scoped, idempotent by `run_key`, persists `QUEUED → RUNNING → COMPLETED|FAILED` with audit in each transaction, invokes the gateway, persists output/units/provenance, forces `scientific_status=NOT_VALIDATED` and `software_maturity=NULL`.
- 6 contract/mock integration tests (mock engine speaking the documented HTTP contract). Full API suite **76 pass / 0 fail**; lint, boundaries, arch, typecheck, build pass.

**Actual HyDroMA execution was NOT verified**: the existing `engines/hydroma/.venv` is broken (points to a missing Python 3.12) and system Python lacks `fastapi`/`uvicorn`; installing software is prohibited. This is a documented limitation, not a claim of engine verification.

---

## B. Baseline and final Git integrity

| Item | Initial | Final |
| --- | --- | --- |
| Branch | `main` | `main` |
| HEAD | `a3103061f561eb4289137b5f3362785580dfe28b` | unchanged |
| Staged / Deleted | 0 / 0 | 0 / 0 |
| Modified tracked | 28 | 28 |
| Untracked collapsed | 136 | 138 (+gateway, +gateway test) |
| Git mutations | none | none |

Production DB `databases/api/nojin.db` mtime `2026-11-26 04:55:35` — unchanged.

---

## C. Files modified

| Path | Reason | Change summary |
| --- | --- | --- |
| `services/api/src/engine-gateway.mjs` | new gateway | fixed model id/version, input validation, HTTP contract execution, timeout/poll, normalization, bounded errors |
| `services/api/src/server.mjs` | API integration | import gateway; `POST /v1/hydroma/irrigation/runs` with transactions, idempotency, audit, failure mapping |
| `services/api/tests/engine-gateway.test.mjs` | tests | mock-engine contract tests: success, invalid input, failure, timeout, malformed, tenant isolation |

No unrelated WIP overwritten; no engine source modified (not required).

---

## D. EngineGateway architecture

- **Boundary choice:** the engine already exposes an independent HTTP API (`engines/hydroma/hydroma/api.py`: `/health`, `/v1/models`, `/v1/runs`). The gateway uses that contract via `fetch`; it does **not** import Python modules or spawn processes. Justified by the existing engine API and the architecture rule that the backend must not import engine internals.
- **Responsibilities:** model resolution (fixed constant), request validation, controlled invocation, timeout/abort, polling, response normalization, error normalization, metadata (engine run id, engine version from provenance `code_version`).
- **No second registry/framework:** model identity is a frozen constant referencing the existing registry id `eco-nojin.hydroma.irrigation-schedule@1.0.0`.

---

## E. Model registry and model identity

- Authoritative model: `eco-nojin.hydroma.irrigation-schedule`, version `1.0.0` (from `irrigation.py` `IRRIGATION_MODEL`/`IRRIGATION_DEFINITION`).
- The gateway never accepts a user-supplied model id; unsupported models/params are rejected.
- Only the irrigation model is executable in this mission.

---

## F. Input contract

Required: `layers[]` (`thickness_mm>0`, `theta_fc`, `theta_wp`, `theta_wp<theta_fc`), `p∈(0,1]`, finite `depletion_mm`.
Optional: `target_depletion_mm` or `target_storage_mm` (not both, ≥0), `application_efficiency∈(0,1]`.
Unknown keys rejected. No unit conversion, no fabricated data. Invalid input → 422 before engine call (tested).

---

## G. Execution controls

- Overall timeout (`NOJIN_HYDROMA_TIMEOUT_MS`, default 10s) via `AbortController`; poll interval bounded.
- Fixed model/module; no arbitrary Python, module, file or command access.
- Input size ≤256 KiB; sensitive-key rejection; output/provenance normalized and bounded by engine response.
- Correlation ID and run ID persisted; engine base URL configurable (`NOJIN_HYDROMA_URL`, default loopback).
- No worker system added; the synchronous gateway can be moved behind a worker without redesign.
- Isolation is limited to the loopback HTTP contract and process boundary; no sandbox is claimed.

---

## H. Run lifecycle integration

`QUEUED` (insert) → `RUNNING` (before call) → `COMPLETED` (success) or `FAILED` (engine failure/timeout/malformed). Each transition + audit is transactional. Cancellation is **not implemented** and not claimed. A crash between network call and final update can leave `RUNNING` (no recovery worker yet) — documented.

---

## I. Persistence integration

Reuses `hydroma_runs` and the Phase 3.83/3.84 boundary. Persists canonical input, input/parameter hashes, model id/version, output, units, provenance, correlation id, timestamps, error. Idempotent by `(org_id, run_key)`; duplicate returns existing without re-execution (tested). Tenant isolation enforced (tested).

---

## J. Provenance

Persists engine `provenance_json` when present (model id/version, code version, run id, hashes, environment, executed_at, operator, validation status). If the engine omits provenance, the gateway records an explicit `note: "engine provenance unavailable"` with null fields rather than fabricating sources. No calibration/validation claim.

---

## K. Scientific and software maturity

- `scientific_status` forced to `NOT_VALIDATED`; `software_maturity` forced `NULL` on completion.
- Caller cannot inflate maturity (tested in 3.84; preserved here).
- No model activated; no production approval; software tests are not scientific validation.

---

## L. API integration

- `POST /v1/hydroma/irrigation/runs` (auth + write role + org scope), body `{runKey, input, farmId?, cropCycleId?, correlationId?}`.
- Returns `{run}` (200) or `{run, duplicate:true}` (200).
- Errors: 422 invalid input, 413 oversize, 502 engine error, 504 timeout; generic messages, no internal leakage.
- Existing `/v1/hydroma/runs` read/status routes remain (write-gated); the gateway route is the controlled execution path.

---

## M. Test results (actual)

- `node --test services/api/tests/engine-gateway.test.mjs` → **6 pass / 0 fail**.
- `pnpm run test:api` → **76 pass / 0 fail** (70 prior + 6 gateway).
- `pnpm run lint` → clean.
- `pnpm run check:boundaries` → OK (581 files, 21 units).
- `pnpm run check:arch` → OK (6 files scanned, engine independence).
- `pnpm run test:arch` → 6 pass.
- `pnpm run typecheck` → clean.
- `pnpm run build:all` → platform + brand OK.
- Engine pytest: **not run** — `.venv` broken (`No Python at …Python312`), system Python lacks `fastapi`; install prohibited.

---

## N. Mocked vs actual engine verification

| Status | Value |
| --- | --- |
| Gateway implemented | yes |
| Contract tested | yes (mock engine HTTP contract) |
| Mock integration tested | yes (6 tests) |
| Actual engine integration tested | **no** (environment limitation) |
| Scientific model software tested | not in this mission (engine pytest unavailable) |
| Scientifically validated | **no** |

The mock engine implements the documented contract (POST/GET, statuses, result/provenance/error), so the backend behavior is verified; the real engine was not invoked.

---

## O. Regression verification

All 70 pre-existing API tests still pass; run persistence/hardening tests unchanged and green. Lint/boundaries/arch/typecheck/build pass. Frontend untouched.

---

## P. Architecture boundary verification

Frontend → API only; API → gateway → engine HTTP contract; no engine import in backend; no backend import in engine; no DB access from engine; `check:arch` and `check:boundaries` pass. No parallel registry/persistence/execution framework.

---

## Q. Security assessment

- Auth + RBAC + tenant isolation on execution; cross-org read/re-run denied (tested).
- Fixed model, strict input allowlist, size caps, sensitive-key rejection.
- Generic errors; no internal DB/engine details exposed.
- Engine reachable only via configured base URL (loopback default); no arbitrary command/module/file access.
- Limitations: no rate limiting; engine API itself unauthenticated (loopback); no sandbox; status route remains write-gated but can set transitions outside the gateway.

---

## R. Known limitations

1. Actual engine execution not verified (broken venv, no deps, installs prohibited).
2. No cancellation; no stale-`RUNNING` recovery.
3. Synchronous saga: crash mid-execution leaves `RUNNING`.
4. Engine API unauthenticated/loopback; no mTLS/auth.
5. No rate limiting; single SQLite connection.
6. Provenance fallback is explicit but incomplete when engine omits it.
7. Status route can transition runs outside the gateway (write-gated).
8. Scientific validation not performed; all models `NOT_VALIDATED`.

---

## S. Independent reviewer findings (Nemotron 3 Ultra)

Reviewed actual diff, gateway, route, transactions, tests.

1. **Boundary:** HTTP contract is the correct choice given `api.py`; no engine import. Correct.
2. **Model identity:** fixed constant; user cannot select models. Correct.
3. **Input validation:** allowlist + numeric constraints; rejects before engine. Correct.
4. **Lifecycle/persistence:** each transition transactional with audit; failure maps to FAILED with no output. Correct.
5. **Idempotency/tenancy:** org-scoped; duplicate no re-execute; cross-org denied. Correct.
6. **Maturity:** server-forced `NOT_VALIDATED`/null. Correct.
7. **Defects/risks:** engine `failed` initially marked COMPLETED — found and fixed during testing; saga crash leaves RUNNING; no cancellation; status route bypass; no actual-engine evidence.
8. **Scope/WIP:** no unrelated files, no git mutation, prod DB untouched. Confirmed.
9. **Missing evidence:** actual engine run, engine pytest, concurrency under real engine, rate limiting.

**Reviewer verdict:** accept **with limitations**; the backend integration is correct and bounded, but actual-engine verification is absent and must not be claimed.

---

## T. Final verdict

`HYDROMA_GATEWAY_IMPLEMENTED_WITH_LIMITATIONS`

- **Implemented:** EngineGateway, controlled irrigation execution route, persistence/lifecycle integration, provenance, maturity control.
- **Software-tested:** 6 gateway tests + 70 existing API tests; lint/boundaries/arch/typecheck/build.
- **Contract-tested / mock-verified:** yes (mock engine HTTP contract).
- **Actual-engine-verified:** no (environment limitation).
- **Scientifically validated:** no.

No git staging/commit/push, no production DB change, no deployment, no HIC activation, no live acquisition, no frontend, no scientific validation.