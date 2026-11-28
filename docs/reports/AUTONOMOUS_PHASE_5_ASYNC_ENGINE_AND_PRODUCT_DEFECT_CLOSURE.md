# AUTONOMOUS PHASE 5 — ASYNC HYDROMA EXECUTION & PRODUCT DEFECT CLOSURE

**Mission type:** `AUTONOMOUS_ENGINE_EXECUTION_RELIABILITY_AND_PRODUCT_DEFECT_REMEDIATION`
**Date:** 2026-11-28
**Executor:** Resident Agent (Kilo) — sole executor
**Root:** `D:\NOJIN`
**Baseline:** Phase 4

> Evidence: file:line + real command output. No unrun test is reported passing; self-skips are not
> counted as passes; no scientific validation or production readiness is claimed.

## 1. Baseline Git State
HEAD `a310306` on `main`; 349 changed paths (pre-existing uncommitted body, owner property, preserved).

## 2. Final Git State
HEAD unchanged (`a310306`). No commit/tag/branch/remote/reset/clean/stash. Changed this phase:
`services/api/src/server.mjs` (M), `playwright.config.ts` (M); rewritten/new (untracked):
`engine-execution.mjs`, `engine-execution.test.mjs`, `intelligence-priorities.test.mjs`, this report.

## 3. Existing Modifications Preserved
All prior-phase uncommitted work left intact; only mission-relevant files touched. Stray test DBs
(`engines/hydroma/hydroma.db`, `databases/api/nojin-e2e.db`, temp live DB) were removed/regenerated.

## 4. SEC-04 Root Cause
`engine-execution.mjs` used `spawnSync` (`engine-execution.mjs:14` old) inside the `/v1/science/run`
handler (`server.mjs:3608`), blocking the single Node event loop for the whole run (≤30s) → stalls all
requests; a DoS vector under concurrency.

## 5. Previous Execution Architecture
Synchronous `spawnSync(PYTHON, ["-m","hydroma.exec_worker"], {timeout, maxBuffer:8MB})`; result parsed
from stdout; no concurrency cap; no explicit slot lifecycle.

## 6. New Execution Architecture
`engine-execution.mjs` now uses async `spawn` and `await`s child `close`:
- Event loop never blocked (verified, §15).
- Result contract unchanged: parsed worker stdout on success; `{ok:false, code, message, details?}` on
  failure. Caller updated to `await executeModel(...)` (`server.mjs:3608`).
- Test injection points (`python`, `args`, `env`, `spawnFn`, `maxOutputBytes`, `timeoutMs`) for real-process
  tests — no production bypass.

## 7. Concurrency Policy
In-process bounded semaphore (`executionCapacity()` = `NOJIN_HYDROMA_MAX_CONCURRENT`, default 4). When
full, `executeModel` returns `{ok:false, code:"capacity_exhausted"}` immediately (fail-fast, **no
unbounded pending queue**); the API maps this to **HTTP 503** (`server.mjs` execute route). Capacity is
released in `finally` on every path. **Limit:** per-process only; multi-instance needs a shared
coordinator (documented, no Redis added).

## 8. Timeout Policy
`NOJIN_HYDROMA_EXEC_TIMEOUT_MS` (default 30000). A timer calls `child.kill("SIGKILL")`; on close the
run resolves to `{code:"timeout"}`; the API returns 504. Slot always released.

## 9. Process Lifecycle
Handles `error` (spawn failure → `engine_unavailable`), `close` (code/signal), nonzero exit (structured
error from stdout JSON), and timeout. `stdin` EPIPE ignored; stdin is written the JSON request then ended.

## 10. Process Termination Behavior
`child.kill("SIGKILL")` force-terminates the child (Windows: `TerminateProcess`). **Documented
limitation:** on Windows the child *process tree* is not killed (no `taskkill /T`); if the worker spawns
grandchildren they are not reaped. The worker (`hydroma.exec_worker`) is single-process, so this is safe
for the supported model. No claim of reliable tree termination is made.

## 11. Output Limits
stdout/stderr captured with an 8 MiB cap each (`maxOutputBytes`); overflow sets `truncated` →
`{code:"engine_error"}` (no unbounded buffering). Diagnostics stay internal; public API returns generic
messages (no paths/secrets).

## 12. Security Considerations
Minimal env (only PATH/SystemRoot/TEMP/TMP/PATHEXT/PYTHONIOENCODING — no inherited secrets); `spawn`
with separated args (no shell); executable/worker paths controlled; tenant/authz unchanged; engine input
still validated by existing contracts; concurrent runs isolated (separate processes/stdio).

## 13. API Compatibility
Success/failure response shapes unchanged; new `capacity_exhausted` → 503 (documented). Existing
`/v1/science/run` and `/v1/hydroma/irrigation/runs` (gateway) contracts preserved.

## 14. Test Results (newly executed)
| Test | Result |
|---|---|
| `engine-execution.test.mjs` (real subprocesses) | **9/9 pass** |
| `intelligence-priorities.test.mjs` | **1/1 pass** |
| `engine-real.test.mjs` (live engine) | **1/1 pass** (was skip) |
| `hydroma-live.spec.ts` (browser→API→engine) | **1/1 pass** (was skip) |
| `pnpm run test:api` | **163 tests, 162 pass, 1 skip, 0 fail** |
| `pnpm run verify` | **exit 0** (unit 581/90, api 163, build, bundle) |
| Full E2E (engine live) | **277 passed, 0 failed, 0 skipped** |

## 15. Event Loop Responsiveness Evidence
`engine-execution.test.mjs` "event loop: stays responsive while a process runs": a 10 ms `setInterval`
ticks ~15× during a 400 ms child run (`mid > 0` asserted) — the loop is not blocked.

## 16. HyDroMA Live E2E Results
Engine started via `python -m hydroma.run_local --port 8001` (isolated `HYDROMA_DB` in temp, loopback
only). `NOJIN_HYDROMA_URL=http://127.0.0.1:8001` propagated to the E2E API webServer
(`playwright.config.ts`). Both `engine-real.test.mjs` and `hydroma-live.spec.ts` pass; the full suite is
**277/0/0** (no skip). The engine self-skip is eliminated when the engine is available; it still skips
cleanly when `NOJIN_HYDROMA_URL` is unset (no artificial pass).

## 17. Intelligence Priority Defect Root Cause (N-04)
`server.mjs` (old 2657-2660) pushed a task once per matching predicate (overdue, due_soon, unassigned).
A task that is **overdue AND unassigned** was pushed twice (high + low) → duplicate rows.

## 18. Intelligence Priority Fix
`server.mjs:2657-2671`: dedupe by task (`to` key) keeping the **single most-severe** classification
(`SEVERITY_RANK` low<medium<high). No severity info discarded; the task still appears (as overdue/high);
metrics (`overdueTasks`, `unassignedTasks`) unchanged (not hidden). Regression test asserts one entry,
reason `overdue`, severity `high`, and metrics still ≥1 each.

## 19. Locator Fixes
None required this phase — the full E2E was 277/0/0 with no flakes (Phase 4 locator repairs held).

## 20. Regression Verification
Phase 3/4 protections intact within `verify` (api 163 incl. tenant-isolation, CORS, CSRF, cookie,
rate-limit fail-safe; unit 581 incl. capabilities fail-closed). No security regression.

## 21. Remaining Limitations
- In-process concurrency (per-instance); no cross-instance coordination.
- Windows child-tree termination not implemented (single-process worker mitigates).
- Rate limiter per-process; `node:sqlite` experimental.
- HyDroMA models remain `NOT_VALIDATED`.

## 22. Owner Decisions Required
- D-HYDROMA-03 (shared queue/worker) for multi-instance execution.
- Whether to run the engine in CI for `hydroma-live` (needs the Python runtime).
- D-04 identity/MFA/TLS; production DB.

## 23. Recommended Next Product-Development Phase
Close D-PROD-01 (first slice): replace Tourism/Marketplace demo with real endpoints; then independent
scientific validation of one HyDroMA model.

## Final Classification
`ASYNC_ENGINE_EXECUTION_AND_PRODUCT_DEFECTS_VERIFIED`

The event loop no longer blocks during engine execution, concurrency is bounded with fail-fast 503,
timeout/lifecycle/output are handled and tested with real processes, capacity is released on all paths,
the intelligence priority duplication is fixed with a regression test, HyDroMA Live E2E runs (277/0/0),
and Phase 3/4 protections remain intact. No production readiness or scientific validation is claimed.