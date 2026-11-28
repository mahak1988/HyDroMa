# AUTONOMOUS PHASE 3 — SECURITY HARDENING & OPERATIONAL VERIFICATION

**Mission type:** `AUTONOMOUS_SECURITY_ENGINEERING_AND_VERIFICATION`
**Date:** 2026-11-28
**Executor:** Resident Agent (Kilo)
**Root:** `D:\NOJIN`
**Baseline:** `docs/reports/AUTONOMOUS_PHASE_2_RESEARCH_AND_DOMAIN_AUDIT.md`

> Evidence rule: every claim cites `file:line` or a real command output. No unrun test is called
> passing; no full-compliance claim is made. Green tests ≠ production security.

---

## 1. Baseline & Final Git State

**Baseline (start of phase):** HEAD `a310306` on `main`; large pre-existing uncommitted body
(341 changed paths) from prior phases, treated as user property and left intact.

**Final (this phase):** HEAD unchanged (`a310306`); no commit/tag/branch/remote/reset/clean/stash.
New changes this phase:
`services/api/src/server.mjs` (M), `services/api/src/auth.mjs` (M), `playwright.config.ts` (M),
new tests `cors/rate-limit/tenant-isolation/cookie.test.mjs` (untracked), this report (untracked).
E2E test DB was moved aside and restored (no residue).

---

## 2. Executive Summary

Phase 3 closed the in-scope security gaps from Phase 2 and produced **real operational evidence**:

- **SEC-03 Rate limiting implemented** (in-process, per-IP, configurable, no Redis): failed-login
  throttle, registration throttle, success-reset, window-reset (no permanent lockout), generic 429
  (no account enumeration), `X-Forwarded-For` trusted only when `NOJIN_TRUST_PROXY=true`.
- **SEC-05 Secure cookie** implemented (auto/HTTPS/env; off for http dev) + **SEC-06 CSRF** Origin
  validation on state-changing requests.
- **SEC-01/SEC-02** re-verified with dedicated regression suites (tenant isolation 5 scenarios, CORS/
  CSRF 9 cases).
- **Tests added:** 4 new API suites; API total **150 tests (149 pass, 1 pre-existing skip, 0 fail)**.
- **Full `verify` green:** typecheck, lint, boundaries (605/21), arch (11), tokens (733), unit
  (581/90), api (150), build, bundle (767.9 KB).
- **E2E executed** (system Chrome, no download): smoke 7/7, representative subset **36/37**
  (farm-detail has a real pre-existing product defect, not a security regression), **a11y 117/117**.
- **SEC-07 password policy** analyzed vs NIST SP 800-63B-4 (report only; no policy change).
- All 48 HyDroMA models remain `NOT_VALIDATED` (no scientific change).

**Classification:** `SECURITY_HARDENING_COMPLETED_WITH_LIMITATIONS` (§13).

---

## 3. SEC-01 (Tenant Isolation) & SEC-02 (CORS) Review

**SEC-01** (fix from Phase 2 at `server.mjs` `PATCH /v1/users/:id`): now resolves the caller's active
memberships, requires a **shared organization** with the target and a **write role in that shared
org**; non-shared → `404` (no existence leak), shared-but-no-write → `403`; role change is scoped to
the shared org only. Verified by `tenant-isolation.test.mjs` (5 scenarios):
1. manager A cannot touch a B-only user → 404 (suspend/rename/role all 404);
2. manager A manages a shared user, role change affects **A only** (B membership unchanged);
3. multi-org membership grants no extra authority (viewer-in-A + manager-in-B is 403 for an A-only target);
4. no-write user → 403;
5. 404 (non-shared) vs 403 (shared-no-write) policy holds.

**SEC-02** (CORS, `server.mjs` `cors()` + `isAllowedOrigin()`): default allow-list now includes the
real dev origin `http://localhost:5181` (was missing — a latent CORS gap). Verified by `cors.test.mjs`:
allowed→reflected+credentials; disallowed→no ACAO; no-Origin→unaffected; preflight advertises
methods/headers; **wildcard never combined with credentials**; cross-origin mutation→403; same-origin/
no-Origin mutations pass; GET never blocked.

---

## 4. SEC-03 … SEC-10 Status

| ID | Status | Detail / Evidence |
|---|---|---|
| SEC-03 Rate limiting | **FIXED** | `createRateLimiter` + `clientIp` in `server.mjs`; wired into register/login/accept-invite. Env: `NOJIN_RATE_LIMIT_MAX` (20), `_WINDOW_MS` (900000), `_DISABLED`, `NOJIN_TRUST_PROXY`. Tests: `rate-limit.test.mjs` (6). |
| SEC-04 Sync execution (event-loop block) | **OPEN** | `engine-execution.mjs:13-20` `spawnSync` ≤30s; architectural (needs worker, D-HYDROMA-03). Not changed. |
| SEC-05 Secure cookie | **FIXED** | `auth.mjs` `sessionCookie(token,expires,secure)` / `clearedCookie(secure)`; `cookieSecure(req)` auto-detects HTTPS (`req.socket.encrypted` / `x-forwarded-proto`) or `NOJIN_COOKIE_SECURE`/`options.cookieSecure`. Tests: `cookie.test.mjs` (3). |
| SEC-06 CSRF | **FIXED** | Dispatcher rejects state-changing requests whose `Origin` is present and not allowed (`origin_forbidden` 403); GET/HEAD/OPTIONS exempt; no-Origin (non-browser) allowed. Tests: `cors.test.mjs`. |
| SEC-07 Password policy | **ANALYZED** | See §10. No change (owner-gated). |
| SEC-08 Verbose error log | OPEN | `server.mjs` `console.error("api error", error)` — log hygiene only. |
| SEC-09 Orphan comment block | OPEN | `server.mjs:1-119` dead commented duplicate; low risk. |
| SEC-10 Silent truncation / naive CSV | OPEN | `str()` truncates; env CSV `split(",")` no quoting. Minor. |

---

## 5. Implemented Changes

1. **Rate limiter** (`server.mjs`): `createRateLimiter({max,windowMs,disabled})` fixed-window per-IP;
   `clientIp(req)` trusts `X-Forwarded-For` only if `NOJIN_TRUST_PROXY=true`; `limited()` returns a
   generic 429 with `Retry-After`. Wired: register (counts every attempt), login (counts failures,
   resets on success), accept-invite (counts attempts, resets on success). Injectable via
   `createApp({rateLimit})` for deterministic tests — **no production bypass**.
2. **CSRF** (`server.mjs` dispatcher): Origin check before dispatch.
3. **Secure cookie** (`auth.mjs` + `server.mjs`): `Secure` added on HTTPS; dev http unaffected.
4. **CORS** (`server.mjs`): `isAllowedOrigin` helper; added `5181`; wildcard-without-credentials.
5. **Tests**: `cors.test.mjs`, `rate-limit.test.mjs`, `tenant-isolation.test.mjs`, `cookie.test.mjs`.
6. **E2E config** (`playwright.config.ts`): `NOJIN_RATE_LIMIT_DISABLED=true` in the E2E API env so the
   harness (hundreds of auths from one IP) is not throttled — test-only, documented.

No other source changed; no git history operations.

---

## 6. New Security Findings

- **N-01 (LOW):** rate-limit state is per-process → in a multi-instance deployment limits are
  per-instance (documented; a shared store would be needed). No Redis added by design.
- **N-02 (INFO):** registration counts successful attempts too (anti-spam) but never resets on
  success — a single shared-NAT IP could throttle legitimate co-located sign-ups; acceptable for a
  local-first app and documented; login success resets.
- **N-03 (LOW):** `PATCH /v1/users/:id` global `users.status` mutation still affects the user across
  all orgs once authorized for one shared org (inherent to a global `users` table); cross-tenant
  mutation is now blocked, but global-status semantics remain a design note.
- No new cross-tenant read/write, mass-assignment, or injection vector found in the reviewed paths.

---

## 7. Tests Added

| File | Coverage | Count |
|---|---|---|
| `services/api/tests/cors.test.mjs` | CORS allow/deny/wildcard/no-origin/preflight + CSRF allow/deny/safe-method | 9 |
| `services/api/tests/rate-limit.test.mjs` | login throttle+Retry-After, success-reset, window-reset, register variation, generic 429, disabled | 6 |
| `services/api/tests/tenant-isolation.test.mjs` | SEC-01 scenarios 1–7 | 5 |
| `services/api/tests/cookie.test.mjs` | Secure off on http, on for HTTPS, logout clears with Secure | 3 |

---

## 8. Real Test Results (this phase)

| Command | Result |
|---|---|
| `pnpm run test:api` | **150 tests, 149 pass, 1 skip, 0 fail** (exit 0) |
| `pnpm run verify` | **exit 0** — typecheck, lint, boundaries 605/21, arch 11, tokens 733, apps, unit 581/90, api 150, build, bundle 767.9 KB |
| `playwright smoke.spec.ts` | **7 passed** |
| `playwright admin/farms/farm-detail/science/env-sources/territories` | **36 passed, 1 failed** (farm-detail) |
| `playwright a11y.spec.ts` (+ market/tourism/admin a11y) | **117 passed** |

**E2E failure (honest):** `farm-detail.spec.ts:31` — "linked projects are visible … reload". Farm
detail renders the linked-project **count** (`FarmsModule.tsx:346`) and a server timeline, but the
E2E expects a named project **link** that the page does not render. Reproduced on a clean e2e DB, so
it is a **real pre-existing product/test defect**, not caused by Phase 3 changes (no prior E2E
baseline existed to regress from). **Not skipped or deleted** — flagged for product follow-up (§15).

---

## 9. E2E & Accessibility

- Browsers: system **Chrome found** (`C:\Program Files (x86)\Google\Chrome\...`); Playwright 1.65.1;
  config uses `channel: "chrome"` → **no download/install needed** (Workstream E satisfied without a
  heavy install).
- Ran via the real API (`:8000`) + Vite dev server (`:5181`); CORS/CSRF changes verified compatible
  with the `5181` origin.
- a11y (axe) **117/117** across public, admin, market, tourism (incl. RTL Persian).
- Skipped tests: the pre-existing `hydroma-live.spec.ts` self-skips without `NOJIN_HYDROMA_URL`
  (engine not running) — reported, not counted as pass.

---

## 10. Limited, Documented Standards Alignment (no full-compliance claim)

- **OWASP ASVS 5.0.0**: applied controls — session management, access control, injection/output
  handling, CORS/CSRF. **Not** a full ASVS assessment (most chapters unverified) → no compliance claim.
- **NIST SP 800-63B-4** (password/authenticator): current state — single-factor password auth,
  **no MFA**, min length **10** (`server.mjs:588,771`), **no blocklist**, no composition rules,
  salt 16 bytes (`auth.mjs:14`), hashed+salted (scrypt). NIST single-factor min is **15** and
  **SHALL rate-limit** (§3.2.2 — now satisfied by SEC-03). Recommended (owner decision): raise min
  length to ≥12–15, add a breached-password blocklist, offer MFA. **No global policy change made.**
- **OWASP Top 10** mapping: A01 broken access control (SEC-01 fixed), A05 misconfig (CORS/CSRF/
  cookie fixed), A07 auth failures (rate limit added). Not a certification.

---

## 11. Remaining Risks

- SEC-04 blocking `spawnSync` execution (DoS via long model runs) — architectural.
- Rate limiter is per-process (multi-instance gap); shared-NAT throttling (N-02).
- Global `users.status` semantics (N-03).
- No MFA; password policy below NIST single-factor minimum (owner decision).
- `node:sqlite` experimental (persistence portability).
- farm-detail E2E product defect; E2E not run for the *entire* 385-test suite (representative subset + a11y run).

---

## 12. Owner Decisions Required

- D-04 identity provider (MFA, Secure-cookie TLS, password policy).
- Rate-limit thresholds and whether to front with a shared store (SEC-03 multi-instance).
- Whether to fix the farm-detail linked-project rendering (product).
- D-HYDROMA-03 worker for SEC-04.

---

## 13. Final Classification

`SECURITY_HARDENING_COMPLETED_WITH_LIMITATIONS`

In-scope gaps (SEC-01/02 verified, SEC-03/05/06 implemented) are closed with reproducible tests; the
full `verify` gate is green; E2E (smoke + representative subset) and a11y (117) ran on real Chrome.
Limitations are explicit: one pre-existing E2E product defect (farm-detail), SEC-04/07/08/09/10
open or owner-gated, per-process rate-limit scope, and no full-standards compliance claimed. Green
tests are not represented as production security.

---

## 14. Files Created / Changed

| File | Change |
|---|---|
| `services/api/src/server.mjs` | rate limiter, clientIp, CSRF origin check, CORS refactor + 5181, secure-cookie wiring, `fail` headers (M) |
| `services/api/src/auth.mjs` | `sessionCookie(...,secure)`, `clearedCookie(secure)` (M) |
| `playwright.config.ts` | `NOJIN_RATE_LIMIT_DISABLED` in e2e API env (M) |
| `services/api/tests/cors.test.mjs` | new (9) |
| `services/api/tests/rate-limit.test.mjs` | new (6) |
| `services/api/tests/tenant-isolation.test.mjs` | new (5) |
| `services/api/tests/cookie.test.mjs` | new (3) |
| `docs/reports/AUTONOMOUS_PHASE_3_SECURITY_AND_OPERATIONAL_VERIFICATION.md` | this report |

---

## 15. Prioritized Next-Step Plan

1. Fix farm-detail linked-project rendering (product) so the E2E is green; then run the **full** E2E suite.
2. SEC-04: move model execution to a worker (D-HYDROMA-03) to remove event-loop blocking.
3. Adopt owner-approved password policy (min length, blocklist) and MFA (D-04).
4. Add a shared rate-limit store only if multi-instance deployment is chosen.
5. Independent scientific validation of one HyDroMA model (move off `NOT_VALIDATED`).
6. Clean SEC-08/09/10 minor items; sync README test counts after a full E2E run.