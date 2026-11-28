# AUTONOMOUS PHASE 4 — PRODUCT INTEGRITY, E2E CLOSURE & SECURITY BOUNDARY VERIFICATION

**Mission type:** `AUTONOMOUS_PRODUCT_INTEGRITY_AND_OPERATIONAL_VERIFICATION`
**Date:** 2026-11-28
**Executor:** Resident Agent (Kilo)
**Root:** `D:\NOJIN`
**Baseline:** Phase 3 (`docs/reports/AUTONOMOUS_PHASE_3_SECURITY_AND_OPERATIONAL_VERIFICATION.md`)

> Evidence rule: file:line or real command output for every material claim. No unrun test is
> reported as passing; green tests are not represented as production readiness.

---

## 1. Baseline Git State

HEAD `a310306` on `main`; 347 changed paths (large pre-existing uncommitted body from prior phases,
treated as owner property, left intact). E2E test DB present.

## 2. Final Git State

HEAD unchanged (`a310306`). No commit/tag/branch/remote/reset/clean/stash. This phase changed:
`services/api/src/server.mjs` (M), `apps/platform/tests/field.spec.ts` (M); new/edited (untracked):
`FarmsModule.tsx`, `tasks.spec.ts`, `intelligence.spec.ts`, `FarmDetail.test.tsx`,
`rate-limit/cookie/cors.test.mjs`, this report. E2E DB removed between runs (regenerated test data).

---

## 3. Executive Summary

- **Farm-detail product defect fixed** (Workstream A): the page counted linked projects but never
  rendered them; added a **Related projects** card with named, navigable links + empty state, fed by
  the real org-scoped API. E2E `farm-detail.spec.ts` now passes; unit test updated to the new contract.
- **Full E2E executed to closure** (Workstream B): final run **276 passed, 1 skipped, 0 failed**
  (skip = `hydroma-live` self-skip, engine not running). Three earlier failures were triaged and
  fixed: one real product defect (farm-detail) + three ambiguous-locator test defects (tasks,
  intelligence, field) — assertions preserved, not weakened.
- **Security boundary reviews** (C/D/E) found and fixed two real gaps: rate-limit **fail-open on
  invalid config** (NaN → never blocks) and **untrusted `x-forwarded-proto`** influence on the
  Secure-cookie decision. Added boundary tests.
- **Demo isolation** (F) re-verified fail-closed; no demo→real leak; no change needed.
- **Accessibility** (G): a11y specs are part of the full suite and pass (117 axe assertions).
- **SEC-04** (H): documented architecture assessment (no risky rewrite).
- **Verification** (I): `pnpm run verify` green; full E2E green.

**Classification:** `PRODUCT_INTEGRITY_AND_E2E_VERIFIED_WITH_LIMITATIONS` (§15).

---

## 4. Farm Detail (Workstream A)

**Root cause:** `FarmsModule.tsx` `FarmDetail` computed `relatedProjects` (filter of
`useResourceList("projects")` by `farmId`, line 303-306) and showed only a **count** (line 346) plus
a generic server timeline whose link text is "details ←" — never the project name. The E2E contract
(`farm-detail.spec.ts:31,36`: linked project visible by name, navigable, persists) is the correct UX;
the product was missing it.

**Fix (`FarmsModule.tsx`):** added a "Related projects" `Card` that maps `relatedProjects` to
`<Link to={/platform/projects/:id}>{name}</Link>`, with `L.noProjects` empty state. Data is the real
org-scoped API (no demo fallback), so tenant/permission and reload persistence hold. The resources
list returns all org projects (`server.mjs:1291`, `ORDER BY updated_at DESC`, no pagination), so the
new project is always present.

**Tests:** `farm-detail.spec.ts` passes on a fresh isolated DB (1 passed). Unit
`FarmDetail.test.tsx` updated: `findByText` → `findAllByText(...).length > 0` (the name now appears in
both the new card and the timeline mock) while still asserting the `a[href="/platform/projects/p1"]`
link and exclusion of the other-org project — contract preserved, not weakened.

## 5. Full E2E (Workstream B)

Command: `pnpm exec playwright test` (system Chrome channel, real API `:8000` + Vite `:5181`, isolated
`nojin-e2e.db`, rate limiting disabled in the E2E API env only).

| Run | Result |
|---|---|
| Initial (post farm-detail fix) | 273 passed, 3 failed, 1 skipped |
| After locator repairs | 276 passed, 0 failed, 1 skipped |
| Re-run (flake surfaced) | 275 passed, 1 failed (field strict-mode), 1 skipped |
| **Final (final code)** | **276 passed, 0 failed, 1 skipped** |

Skip: `hydroma-live.spec.ts` self-skips without `NOJIN_HYDROMA_URL` (engine not running) — reported,
not counted as pass. No test was deleted or weakened to reach green.

## 6. Failures & Fixes

| Spec | Root cause | Type | Fix |
|---|---|---|---|
| `farm-detail.spec:31` | product never rendered linked project | **product** | Related-projects card (§4) |
| `tasks.spec:23` | `.first()` on global `/in_progress/` clicked a sibling task's button when many rows exist | test locator | scope to `tr` hasText task title (`tasks.spec.ts:22`) |
| `intelligence.spec:14` | task appears in Priorities(×2)+Recent → strict-mode 3 matches | test locator (multi-widget) | `.first()` (consistent with lines 15-16) |
| `field.spec:43` | `getByText("synced")` collided with title "Synced terrace" | test locator (flake) | `{ exact: true }` on the status badge |

All four fixes preserve the original assertion intent (transition happens / item visible+navigable /
status shown); none removes coverage. The intelligence duplicate-in-priorities (same task twice, high
+ low) is logged as a minor product data-quality finding (N-04) for follow-up, not fixed here (API
aggregation change, higher risk).

## 7. Rate Limiting (Workstream C)

Reviewed `createRateLimiter`/`clientIp`/login/register/accept-invite and env
(`NOJIN_RATE_LIMIT_DISABLED/MAX/WINDOW_MS`, `NOJIN_TRUST_PROXY`).
- **Fixed (fail-open):** invalid/partial numeric config produced `NaN`, and `count >= NaN` is always
  false → limiter never blocked. `createRateLimiter` now sanitises (`Number.isFinite && >=1` else
  secure default 20 / 15 min). Test: `rate-limit.test.mjs` "invalid config fails SAFE".
- Confirmed: bypass is test-only via `createApp({rateLimit})` injection; E2E disables via env in the
  test webServer only; `X-Forwarded-For` trusted only when `NOJIN_TRUST_PROXY=true`; per-IP keying
  resists email/header variation; success resets login counter; fixed window resets (no permanent
  lockout); 429 generic + `Retry-After`.
- Documented limits: per-process state (multi-instance needs a shared store — no Redis added);
  shared-NAT throttling; registration counts successes (anti-spam) and does not reset.

## 8. CSRF / Origin (Workstream D)

Dispatcher rejects any state-changing request (POST/PUT/PATCH/DELETE) whose `Origin` is present and
not allowed (`origin_forbidden` 403) **before** auth/handler; GET/HEAD/OPTIONS exempt; no-Origin
(non-browser) allowed (SameSite=Lax is the second layer). Added `cors.test.mjs` coverage for
PUT/PATCH/DELETE cross-origin (all 403) alongside the existing POST/GET/preflight/wildcard cases.

## 9. Cookie / TLS Proxy (Workstream E)

`cookieSecure(req)`: explicit `NOJIN_COOKIE_SECURE` wins; else auto = `req.socket.encrypted` **or**
(`NOJIN_TRUST_PROXY=true` **and** `x-forwarded-proto=https`). **Fixed:** previously `x-forwarded-proto`
was trusted unconditionally — now a client cannot influence the decision unless a proxy is trusted.
Tests (`cookie.test.mjs`): Secure off on http, on for HTTPS config, logout clears with matching Secure,
and spoofed `x-forwarded-proto` ignored without trust / honoured with trust. TLS/proxy architecture
unchanged (owner-gated).

## 10. Demo Isolation (Workstream F)

Re-verified: `capabilities.ts` exposes exact `missing` capabilities and "never faking success";
`WorkspaceGate.tsx` "fails closed" for guests; demo routes isolated under `/platform/demo/*` and
`/science/demo/*` with honest badges. No demo→real data path or fail-closed weakening found. No change.

## 11. Accessibility (Workstream G)

a11y specs (`a11y.spec.ts`, `market-a11y`, `tourism-a11y`, `admin-a11y`) run inside the full suite:
117 axe assertions pass (public, admin, market, tourism incl. RTL Persian). No regression from the
farm-detail card (uses existing Card/Link primitives).

## 12. SEC-04 Architecture Assessment (spawnSync)

**Current:** `engine-execution.mjs:13-20` runs the Python engine via `spawnSync(..., {timeout:30_000})`
inside the request handler (`server.mjs` science/run routes). `spawnSync` blocks the single Node event
loop for the run duration (≤30s), stalling all other requests; on timeout it is killed (deterministic)
but the loop was blocked meanwhile → a DoS vector under concurrent runs.

**Options:**
1. **Async `spawn` + await close** (low complexity, no new infra): frees the event loop; minimal change
   to `engine-execution.mjs`; needs test updates. **Recommended first step.**
2. **`worker_threads`** (medium): offload the blocking call; in-process; more code.
3. **Separate engine service / queue** (high, D-HYDROMA-03): best isolation/scaling; new infra.

**Recommendation:** option 1 as a low-risk, in-scope improvement, bundled with D-HYDROMA-03; not
implemented this phase to avoid an untested execution-path change. HyDroMA scientific status
unchanged (`NOT_VALIDATED`).

## 13. Verification Results (final code)

| Gate | Result |
|---|---|
| `pnpm run test:api` | **153 tests, 152 pass, 1 skip, 0 fail** |
| `pnpm run verify` | **exit 0** — typecheck, lint, boundaries 605/21, arch 11, tokens 733, apps, unit 581/90, api 153, build, bundle OK |
| Full E2E (`playwright test`) | **276 passed, 0 failed, 1 skipped** (incl. a11y) |

## 14. Files Changed

| File | Change |
|---|---|
| `apps/platform/src/sections/agriculture/FarmsModule.tsx` | Related-projects card (product fix) |
| `apps/platform/tests/unit/services/FarmDetail.test.tsx` | unit updated to new contract |
| `apps/platform/tests/tasks.spec.ts` | scope in_progress click to task row |
| `apps/platform/tests/intelligence.spec.ts` | `.first()` for multi-widget item |
| `apps/platform/tests/field.spec.ts` | exact match for status badge |
| `services/api/src/server.mjs` | rate-limit config sanitize (fail-safe); cookie xfp trust gated by `NOJIN_TRUST_PROXY` |
| `services/api/tests/rate-limit.test.mjs` | invalid-config fail-safe test |
| `services/api/tests/cookie.test.mjs` | spoofed x-forwarded-proto test |
| `services/api/tests/cors.test.mjs` | PUT/PATCH/DELETE CSRF test |
| `docs/reports/AUTONOMOUS_PHASE_4_PRODUCT_INTEGRITY_AND_E2E.md` | this report |

## 15. Risks

- E2E locator brittleness can still flake under heavy data (mitigated for the 4 seen; pattern: prefer
  scoped/exact locators).
- Intelligence priorities may list the same task twice (N-04, data-quality).
- SEC-04 event-loop blocking remains (design documented).
- Rate limiter per-process; shared-NAT throttling.
- `node:sqlite` experimental; science `NOT_VALIDATED`.

## 16. Owner Decisions

- D-HYDROMA-03 (worker/queue) to close SEC-04.
- Fix intelligence priorities duplicate (product).
- D-04 identity/MFA/password policy; TLS termination for Secure cookie in production.
- Whether to run the engine for `hydroma-live` E2E in CI.

## 17. Prioritized Next Steps

1. Implement SEC-04 option 1 (async spawn) + tests; then enable `hydroma-live` E2E.
2. Fix intelligence priorities duplicate; add a regression test.
3. Sweep remaining specs for ambiguous locators (proactive flake reduction).
4. Close D-PROD-01 to replace Tourism/Marketplace demo with real endpoints.
5. Independent scientific validation of one HyDroMA model.

---

## Final Classification

`PRODUCT_INTEGRITY_AND_E2E_VERIFIED_WITH_LIMITATIONS`

The real farm-detail product defect is fixed, the **full E2E suite is green (276/0/1 skip)** on the
final code, accessibility passes, and two security-boundary gaps (rate-limit fail-open, untrusted
forwarded-proto) are closed with tests. Limitations are explicit (SEC-04 design-only, one data-quality
finding, per-process limiter, science not validated). No test was weakened; no git history mutated.