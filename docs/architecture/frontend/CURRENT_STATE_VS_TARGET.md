# Current State vs Target

**Document ID:** `ECO-NOJIN-FE-STATE-010`
**Status:** As-built comparison
**Verified:** 2026-11-23 · HEAD `3dbd465`

> This document separates **what exists** from **what the approved architecture requires**. It does not propose changing the approved architecture. Conflicts are recorded for owner decision.

---

## 1. Repository snapshot

| Item | Value |
|---|---|
| Git HEAD | `3dbd465` |
| Git branch | `main` (no remote actions) |
| Working tree before this mission | 2 untracked paths: `docs/reports/پرامپت-ادامه-پلتفرم-یکپارچه-برای-ایجنت.md`, `services/edi/` |
| Apps | `apps/platform`, `apps/brand` |
| Archived apps | `archive/legacy-console`, `legacy-marketplace`, `legacy-tourism`, `legacy-field-collection`, `legacy-scientific-workspace` |
| Registry | `packages/configuration/apps.json` → 2 live apps |
| Packages | 14 workspace packages |
| Services | `services/api`, `services/edi` (untracked) |
| Engines | `engines/hydroma`, `engines/ai-workforce` |

---

## 2. Principle-by-principle comparison

| Principle | Target | Current | Verdict |
|---|---|---|---|
| AD-001 one public home | `/` public portal | `/` exists | PASS |
| AD-002 public pages | content pages beside `/` | 8 rendered; 3 content keys unused | PARTIAL |
| AD-003 authenticated workspace | `/platform/*` gated | `/platform/*` open | **CONFLICT C-01** |
| AD-004 one runtime | one product SPA | `apps/platform` only | PASS |
| AD-005 one router | central router | central router | PASS |
| AD-006 one origin/port | `5180`, `/api` | unified host + proxy | PASS (HyDroMA exception) |
| AD-007 domain modules | 18 modules | 18 documented; 3 proposed | PARTIAL |
| AD-008 shared header/sidebar | shared layouts | Portal/Platform/AppShell | PASS |
| AD-009 shared identity | one session + roles | real session; route handles partial | PARTIAL |
| AD-010 module registry | machine-readable | JSON + manifest; no runtime enforcement | PARTIAL |
| AD-011 design system | tokens | tokens + `check:tokens` | PASS |
| AD-012 contracts | versioned contracts | types/client/schema exist; flows missing | PARTIAL |
| AD-013 independence | HyDroMA/EDI separate | separate services | PASS |
| AD-014 lazy loading | lazy sections | all sections lazy | PASS |
| AD-015 gradual migration | archive, no rewrite | legacy archived | PASS |

---

## 3. Capability status

### 3.1 Existing (usable)

| Capability | Evidence |
|---|---|
| Public home and 8 content pages | `/`, `/ecosystem`, `/hydroma`, `/mrv`, `/knowledge`, `/about`, `/contact`, `/partner` |
| Real login/registration/logout/session | `services/api`, `@eco-nojin/auth-client` |
| Organizations/members/invitations | API + `/landscape/admin/organizations` |
| Users CRUD | API + `/landscape/admin/users` |
| Notifications (audit-derived) | `/landscape/admin/notifications` |
| Landscape pages (16) | `/landscape/landscapes/*` |
| Field observations + real survey sync | `/landscape/field/*` |
| Tourism content + host gate | `/tourism/*` |
| Market catalog/cart/orders (local) | `/market/*` |
| Science pages + model registry | `/science/*` |
| MRV/project/knowledge/finance/governance pages | `/platform/*` |
| 15-locale public content + shared catalogs | `packages/i18n`, `public/content/*` |
| Design tokens + component library | `packages/design-system`, `packages/ui` |
| Bundle budget gate | `scripts/check-bundle-budget.mjs` |

### 3.2 Partial (present but incomplete)

| Capability | Gap |
|---|---|
| Workspace authorization | no session gate; no permission handles on non-admin routes |
| Agriculture | UI only; no write API |
| Marketplace | content catalog; no seller provisioning; no payment |
| Finance | local pages; no ledger/revenue |
| Restoration | pages; no baseline/milestone engine |
| MRV | pages; no credit issuance/registry |
| Evidence | pages; no evidence store/hash |
| Tourism | content + local booking; no availability/payment |
| Booking | local demo; no revenue event |
| Public content | 3 unused content keys; hi/ko fallback to en |
| Contact | form not wired |
| Profile/security in nav | pages exist but not linked |

### 3.3 Absent

| Capability | Module |
|---|---|
| Inventory (stock, movements, valuation) | M05 |
| Challenges | M09 |
| EcoCoin / HIC | M12 |
| EDI frontend integration | M14/M15 |
| Canonical data adapter | M15 |
| Finance ledger / double-entry | M07 |
| Seller provisioning | M06 |
| Availability/payment | M18 |
| MFA / rate limit / CSRF / session rotation | security |

### 3.4 Backend-only

| Capability | Location | Status |
|---|---|---|
| EDI canonical storage | `services/edi` | BACKEND_ONLY; untracked in Git |
| HyDroMA engine | `engines/hydroma` | independent; frontend client only |

---

## 4. Conflicts

### C-01 — `/platform/*` is not session-gated

- **Target:** AD-003 says the specialised workspace is for authenticated users.
- **Current:** `/platform` renders without a session; pages show local registry content.
- **Impact:** No tenant data today, but adding API data would expose it. Also contradicts the “one authenticated workspace” model.
- **Decision needed:** gate the whole workspace or explicitly define it as a public demo workspace.

### C-02 — Public content keys `landscape`, `marketplace`, `tourism` are unused

- **Target:** public pages beside home.
- **Current:** content definitions exist, but `/marketplace` redirects to `/market/`; landscape/tourism are sections.
- **Impact:** duplicate content and translation maintenance.
- **Decision needed:** remove the keys or render them as public intros.

### C-03 — `/hydroma` and `/science` are two entries to one capability

- **Target:** one module, one entry.
- **Current:** public intro at `/hydroma`; section at `/science`.
- **Impact:** SEO/navigation ambiguity.
- **Decision needed:** keep one canonical entry; redirect the other.

### C-04 — HyDroMA base URL is absolute loopback

- **Target:** same-origin `/api`; no absolute frontend API URL.
- **Current:** `useHydromaModels` defaults to `http://127.0.0.1:8000` (`VITE_HYDROMA_BASE_URL`).
- **Impact:** breaks in deployment unless the engine is on the user's loopback.
- **Decision needed:** proxy `/hydroma` (or `/science-api`) and default to same-origin.

### C-05 — Contact form has no backend

- **Target:** a public contact page that sends messages.
- **Current:** validated form; submission not wired.
- **Impact:** user expectation vs reality.
- **Decision needed:** connect a contact endpoint or label the form clearly as unavailable.

### C-06 — Permission handles only on admin routes

- **Target:** every protected workspace route declares `handle.permissions`.
- **Current:** only `organizations`, `users`, `settings` do.
- **Impact:** any signed-in user can open agriculture/finance/MRV/projects pages.
- **Decision needed:** add handles + API checks before tenant data.

### C-07 — Registries are descriptive, not enforced

- **Target:** central module registry drives navigation/permissions.
- **Current:** JSON + `sections/manifest.ts` are documentation; the router is hand-written.
- **Impact:** drift risk.
- **Decision needed:** add a registry-driven route builder or a CI consistency check.

### C-08 — `services/edi/` is untracked

- **Target:** reproducible architecture.
- **Current:** `?? services/edi/` in Git status.
- **Impact:** code exists only on disk.
- **Decision needed:** commit the EDI service or record it as out-of-repo.

### C-09 — 15 locales vs hi/ko fallback

- **Target:** 15 fully translated locales.
- **Current:** 15 catalogs exist, but `provider.tsx` maps `ko: en`, `hi: en`; `ko` is marked planned/disabled; `hi` is active but uses en catalog.
- **Impact:** users selecting Hindi/Korean see English.
- **Decision needed:** native translation or disable those locales.

### C-10 — Dead code in sections

- `sections/landscape/admin/app/router.tsx` + `RouteErrorPage.tsx` (legacy console router).
- `sections/landscape/field/pages/NotFoundPage.tsx` (unused).
- `AppSwitcher` in `@eco-nojin/ui` (unused by platform).
- **Impact:** confusion, maintenance.
- **Decision needed:** cleanup task (not part of this documentation mission).

---

## 5. Architecture gaps

| Gap | Consequence |
|---|---|
| No inventory module | F1 blocked; agriculture inputs and marketplace stock cannot be real. |
| No challenges module | F2 blocked between restoration and field. |
| No EcoCoin | F2 blocked at digital economy; legal/owner decision. |
| No EDI adapter | F3/F5 blocked; canonical data never reaches HyDroMA. |
| No finance ledger | F1/F4 blocked at revenue. |
| No seller provisioning | M06 seller dashboard has no real onboarding. |
| No availability/payment | M17/M18 are content + local demo. |
| No permission handles | Workspace is effectively single-role for signed-in users. |

---

## 6. Migration risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Tenant data added before C-01/C-06 fixed | medium | high | gate workspace + add handles first |
| HyDroMA unreachable in production | high | medium | same-origin proxy |
| EDI not reproducible | high | medium | commit service or remove dependency |
| EcoCoin rushed without legal review | low | high | owner decision D-15; no code until approved |
| Locale fallback mistaken for translation | medium | medium | translate or disable |
| Legacy code accidentally served | low | medium | registry/build filters + tests |
| Bundle growth from new modules | medium | medium | `check:bundle` + lazy pages |

---

## 7. Owner decisions required

| ID | Decision | Options |
|---|---|---|
| O-01 | Gate `/platform` or keep it public? | gate / public demo |
| O-02 | Public content for landscape/marketplace/tourism | remove keys / render intros / redirect |
| O-03 | Canonical HyDroMA entry | `/hydroma` / `/science` |
| O-04 | HyDroMA same-origin proxy | yes / no |
| O-05 | Contact backend | connect / label unavailable |
| O-06 | Permission model for workspace | route handles / single role |
| O-07 | Commit `services/edi`? | yes / no |
| O-08 | Hindi/Korean | translate / disable |
| O-09 | Dead code cleanup | now / later |
| O-10 | Inventory/EcoCoin scope and order | phase 9 plan |

---

## 8. What this mission did not change

- No source code, router, package, dependency, token, API, backend, HyDroMA, EDI, auth, database or deployment change.
- No git add/commit/tag/push/reset/clean/checkout/restore.
- No legacy app deletion.
- No claim that unexecuted tests passed.

Only documentation files in `docs/architecture/frontend/` were created.