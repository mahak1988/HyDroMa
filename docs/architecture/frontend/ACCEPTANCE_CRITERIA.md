# Acceptance Criteria

**Document ID:** `ECO-NOJIN-FE-ACC-009`
**Status:** Architecture + migration acceptance
**Verified:** 2026-11-23 · HEAD `3dbd465`

> These criteria are the conditions under which the unified frontend is accepted. They are written to be objectively checkable. A criterion that has not been executed is marked **NOT RUN**; a criterion that is designed but not implemented is marked **PROPOSED**.

---

## 1. Architecture criteria

| ID | Criterion | Status |
|---|---|---|
| A-01 | One product SPA (`apps/platform`) serves `/`, `/platform`, and all sections. | PASS |
| A-02 | One central router (`apps/platform/src/app/router.tsx`). | PASS |
| A-03 | One root `RealSessionProvider`; no section creates a second one. | PASS |
| A-04 | One origin/port (`5180` host); `/api` same-origin proxy. | PASS |
| A-05 | All sections are internal lazy chunks (`sections/manifest.ts` `internal:true`). | PASS |
| A-06 | 18 modules documented with owner, routes, permissions, dependencies. | PASS |
| A-07 | Existing routes marked EXISTING/PARTIALLY_EXISTING; proposed routes marked PROPOSED. | PASS |
| A-08 | HyDroMA and EDI are independent; no business module imports their internals. | PASS |
| A-09 | Shared header/sidebar (`PortalLayout`, `PlatformLayout`, `AppShell`). | PASS |
| A-10 | Shared design tokens; no hard-coded colours. | PASS |
| A-11 | `/platform/*` requires an authenticated session (AD-003). | **FAIL (C-01)** |
| A-12 | Every protected workspace route declares `handle.permissions`. | **FAIL (C-06)** |
| A-13 | Registry is enforced at runtime (navigation/permission). | **PROPOSED** |

---

## 2. Performance criteria

| ID | Criterion | Threshold | Status |
|---|---|---|---|
| P-01 | Initial entry chunk ≤ 900 KB (minified) | ≤ 900 KB | PASS (~697 KB) |
| P-02 | Section entry chunk ≤ 700 KB | ≤ 700 KB | PASS (~218 KB) |
| P-03 | Map/3D vendors are lazy, not in initial chunk | no MapLibre/deck.gl in entry | PASS |
| P-04 | Every section has a `Suspense` fallback | all | PASS |
| P-05 | `check:bundle` is part of `verify` | yes | PASS |
| P-06 | Initial JS (gzip) ≤ 300 KB | ≤ 300 KB | **NOT MEASURED in this mission** |
| P-07 | LCP < 2.5 s on a mid-tier device | < 2.5 s | **NOT MEASURED** |
| P-08 | No cumulative layout shift > 0.1 | ≤ 0.1 | **NOT MEASURED** |

Current measured chunks (last build): initial ~697 KB; largest section ~218 KB; MapLibre worker ~550 KB; ScienceMap ~670 KB.

---

## 3. Security criteria

| ID | Criterion | Status |
|---|---|---|
| S-01 | Session cookie `HttpOnly`, `SameSite=Lax`, `Path=/`. | PASS |
| S-02 | Passwords hashed with scrypt + per-user salt. | PASS |
| S-03 | Only session token hash stored. | PASS |
| S-04 | Every API mutation checks session + membership + role. | PASS |
| S-05 | Organization scoping on every domain row. | PASS |
| S-06 | Cross-tenant access returns 404. | PASS |
| S-07 | No secrets/tokens in frontend bundle. | PASS (by design; not scanned) |
| S-08 | CSRF protection beyond SameSite. | **ABSENT** |
| S-09 | Rate limiting on auth/mutations. | **ABSENT** |
| S-10 | MFA for privileged roles. | **ABSENT** |
| S-11 | Session refresh rotation / revocation list. | **ABSENT** |
| S-12 | Permission handles on every protected route. | **FAIL (C-06)** |
| S-13 | `/platform` gated. | **FAIL (C-01)** |

---

## 4. Test criteria

| ID | Criterion | Status |
|---|---|---|
| T-01 | `pnpm run typecheck` passes. | PASS (last observed) |
| T-02 | `pnpm run lint` passes. | PASS (last observed) |
| T-03 | `pnpm run check:boundaries` passes. | PASS (last observed) |
| T-04 | `pnpm run check:tokens` passes. | PASS (last observed) |
| T-05 | `pnpm run check:apps` passes. | PASS (last observed) |
| T-06 | Unit tests pass (446 tests). | PASS (last observed) |
| T-07 | API tests pass (14 tests). | PASS (last observed) |
| T-08 | `pnpm run build:all` passes (2 live apps). | PASS (last observed) |
| T-09 | `pnpm run check:bundle` passes. | PASS (last observed) |
| T-10 | Tourism e2e: 37 tests. | PASS (last observed) |
| T-11 | Market e2e: 24 tests. | PASS (last observed) |
| T-12 | Landscape e2e: 14 tests. | PASS (last observed) |
| T-13 | Field e2e: 7 tests. | PASS (last observed) |
| T-14 | Admin e2e: 12 tests. | PASS (last observed) |
| T-15 | Account e2e: 6 tests. | PASS (last observed) |
| T-16 | Science e2e: 18 tests. | PASS (last observed) |
| T-17 | Smoke e2e: 4 tests. | PASS (last observed) |
| T-18 | Axe: zero WCAG 2.2 AA violations on tested routes. | PASS (last observed) |
| T-19 | i18n parity: all catalogs have the same keys. | PASS (last observed) |
| T-20 | Every new module has unit + e2e + a11y. | **PROPOSED** for M05/M09/M12 |

> The test counts above are from the last `verify`/Playwright runs at HEAD `3dbd465`. This documentation mission did not re-run them; it did validate both JSON registries and the 18-module registry (see §7).

---

## 5. Migration criteria

| ID | Criterion | Status |
|---|---|---|
| M-01 | Legacy apps archived, not served/built. | PASS |
| M-02 | Registry contains only `platform` and `brand`. | PASS |
| M-03 | No destructive git operation used. | PASS |
| M-04 | One work package per commit. | PASS (phases 3–7) |
| M-05 | Every retired route has a replacement or a 404. | PASS |
| M-06 | No fake data replaces an unavailable capability. | PASS (explicit states) |
| M-07 | Legacy folders removed from `apps/`. | PASS (in `archive/legacy-*`) |
| M-08 | Public content is complete in 15 locales. | PARTIAL (hi/ko fallback, C-09) |
| M-09 | `/platform` gated. | **FAIL (C-01)** |

---

## 6. Production approval checklist

A production release requires **all** of the following:

- [ ] A-01…A-10 pass (architecture).
- [ ] A-11 and A-12 pass (workspace gate + permission handles).
- [ ] S-08…S-11 implemented (CSRF, rate limit, MFA, session rotation).
- [ ] P-06…P-08 measured and within budget.
- [ ] T-01…T-19 pass in CI.
- [ ] M-08 complete or locales disabled.
- [ ] EDI live acquisition approved (if used).
- [ ] EcoCoin/token decision approved (if used).
- [ ] Backup/restore drill passed.
- [ ] Owner sign-off.

**Current status:** **NOT PRODUCTION READY** — workspace gate, permission handles and security hardening are missing.

---

## 7. Validation performed for this documentation mission

| Check | Result |
|---|---|
| `module-registry.json` parses | PASS |
| 18 modules, unique ids, valid dependencies | PASS |
| `route-registry.json` parses | PASS |
| 181 declared routes (135 EXISTING + 44 PARTIALLY_EXISTING + 2 DEPRECATED_CANDIDATE) + 28 PROPOSED | PASS |
| No source code changed | PASS |
| Git HEAD unchanged | PASS (`3dbd465`) |
| `verify`/e2e re-run | NOT RUN (documentation-only mission) |

Re-validation commands:

```powershell
node -e "const r=require('./docs/architecture/frontend/module-registry.json'); if(r.modules.length!==18) throw new Error('count'); const ids=new Set(r.modules.map(m=>m.moduleId)); for(const m of r.modules) for(const d of m.dependencies) if(!ids.has(d)) throw new Error('dep'); console.log('module registry OK', r.modules.length)"
node -e "const r=require('./docs/architecture/frontend/route-registry.json'); console.log('routes', r.counts)"
```

---

## 8. References

- [UNIFIED_FRONTEND_ARCHITECTURE.md](./UNIFIED_FRONTEND_ARCHITECTURE.md)
- [MODULES_AND_ROUTES.md](./MODULES_AND_ROUTES.md)
- [AUTH_AND_PERMISSION_ARCHITECTURE.md](./AUTH_AND_PERMISSION_ARCHITECTURE.md)
- [CURRENT_STATE_VS_TARGET.md](./CURRENT_STATE_VS_TARGET.md)
- `docs/architecture/BUNDLE-BUDGET.md`
- `docs/A11Y-GATE.md`