# AUTONOMOUS PHASE 2 — RESEARCH & DOMAIN AUDIT (Eco Nojin)

**Mission classification:** `AUTONOMOUS_RESEARCH_AND_DOMAIN_ENGINEERING`
**Date:** 2026-11-28
**Executor:** Resident Agent (Kilo)
**Root:** `D:\NOJIN`
**Builds on:** `docs/reports/AUTONOMOUS_FULL_PROJECT_ENGINEERING_REPORT.md` (Phase 1)

> Evidence rule: every domain/security/scientific claim below is backed by `file:line` from real
> code or by a live-fetched source. No demo capability is called operational; no unrun test is
> called passing; no model is called validated.

---

## 1. Executive Summary

Phase 1 fixed a CI-breaking boundary defect and turned the `verify` gate green. Phase 2 moved from
"does it build/test" to **deep domain understanding, external standards research, security audit, and
operational-test assessment** — and produced **two real, reversible security fixes** in the backend.

Key outcomes:

- **Deep audit completed** across 18 product domains, the Node backend, and the HyDroMA engine using
  three parallel read-only code audits with `file:line` evidence (summarized in §5–§8).
- **Security:** found and **fixed a HIGH cross-tenant isolation flaw** (`PATCH /v1/users/:id` let any
  tenant's manager suspend/rename users of *other* tenants) and **hardened CORS** (no more
  wildcard-with-credentials). Added a **regression test**. API suite: **128 tests, 127 pass, 1 skip**.
- **Standards & repos verified live** (webfetch) for STAC 1.0.0, OWASP ASVS 5.0.0, W3C PROV,
  FAO-56, NIST SP 800-63B, and stac-spec (Apache-2.0). Web *search* API was blocked (403); direct
  fetches of canonical sources were used instead.
- **E2E/a11y not run** — Playwright browsers are not installed and the config requires a system
  `chrome` channel plus a live API+dev server. Reported honestly, not claimed.
- **Scientific integrity intact:** all 48 HyDroMA models remain `NOT_VALIDATED`; uncertainty
  propagation is absent (documented gap); no benchmarks.

**Classification:** `RESEARCH_AND_ENGINEERING_COMPLETED_WITH_LIMITATIONS` (see §16).

---

## 2. Official Sources & Standards Reviewed (live-verified)

Each row was fetched from its canonical source during this mission (URL + what it mandates + Eco Nojin
relevance + current compliance + gap).

| Standard / Source | Version / Date | Publisher | Source URL | Requirement relevant to Eco Nojin | Current compliance | Gap / Action |
|---|---|---|---|---|---|---|
| **STAC** (SpatioTemporal Asset Catalog) | 1.0.0 | Radiant Earth / OGC-aligned community | https://stacspec.org/en/about/ | Common JSON metadata for geospatial assets; static catalog + API | Engine has STAC 1.0.0 subset (`engines/hydroma/hydroma/stac.py`, `catalogue.py`); `/v1/stac/*` served | No COG/TiTiler raster serving; catalog is in-memory/SQLite subset — document scope |
| **OWASP ASVS** | 5.0.0 (30 May 2025) | OWASP | https://owasp.org/www-project-application-security-verification-standard/ | Verification requirements incl. auth, session, injection, access control | scrypt+hashed sessions, RBAC, generic errors, tenant FK — strong | **Rate limiting absent** (see §7); add ASVS V2/V3 controls |
| **W3C PROV** | 2013 (Rec/Note) | W3C | https://www.w3.org/TR/prov-overview/ | Provenance model (entity/activity/agent, derivation, versioning) | SHA-256 provenance + schema version + completeness (`provenance.py`) | Internal model, not PROV-O RDF; acceptable (no interop requirement yet) |
| **FAO-56** (Crop evapotranspiration) | 1998, Paper 56, ISBN 92-5-104219-5 | FAO (Allen, Pereira, Raes, Smith) | https://www.fao.org/3/x0490e/x0490e00.htm | Penman-Monteith ET0; Kc/Ks; soil-water balance | `fao56_et0.py`, `crop_water.py`, `water_balance.py` implement the published equations | Equations © FAO — cite, do not copy text; **no observational validation** |
| **NIST SP 800-63B** (Digital Identity) | 2025 (supersedes 800-63B) | NIST | https://pages.nist.gov/800-63-4/sp800-63b.html | Authenticator/verifier/session; **SHALL rate-limit failed attempts** (§3.2.2); min 15-char single-factor password; salt ≥32 bits | scrypt + 16-byte salt + hashed opaque sessions; 7-day sessions | **No rate limiting**; min password length 10 (< 15); no MFA/lockout |

Additional standards identified for later phases (not yet verified against code, flagged for roadmap):
OGC API – Features/Processes, ISO 19115/19139 (geo metadata), WMO climate normals, ISO/IEC 27001,
OpenID Connect (for D-04 identity decision), WCAG 2.2 AA (a11y target).

> Note: FAO-56 text is © FAO (all rights reserved). Eco Nojin implements the *published scientific
> method* (equations/facts are not copyrightable) and cites the source; no FAO text is copied.

---

## 3. GitHub / GitLab Repositories Reviewed

No code was imported (zero new dependencies this phase). Candidate repos were assessed for future
decisions only. **Only stac-spec's license was live-verified this session (Apache-2.0, fetched from
`raw.githubusercontent.com/radiantearth/stac-spec/master/LICENSE`).** Others are listed with canonical
URLs and "license per repo — MUST re-verify before any import" (the web-search API was blocked, so
these were not re-fetched; treat as leads, not approvals).

| Domain | Candidate repo (canonical URL) | License | Why relevant | Verdict for Eco Nojin |
|---|---|---|---|---|
| STAC spec | github.com/radiantearth/stac-spec | **Apache-2.0 (verified)** | Reference for engine STAC subset | Adopt as reference only; no import |
| STAC API | github.com/stac-utils/stac-fastapi | Apache-2.0 (per repo) | Standards-compliant STAC API if API-first needed | Re-verify; not now (engine owns contract) |
| Raster tiling | github.com/developmentseed/titiler | MIT (per repo; fetch errored) | COG tiling if gridded data added | Defer until D-DB-02; re-verify license |
| Raster IO (Py) | github.com/rasterio/rasterio | BSD-3 (per repo) | Raster reading for remote sensing | Optional `raster` extra; re-verify |
| Arrays (Py) | github.com/pydata/xarray | Apache-2.0 (per repo) | Gridded climate/remote-sensing compute | Candidate for connect layer; re-verify |
| STAC (Py) | github.com/stac-utils/pystac | Apache-2.0 (per repo) | STAC catalog I/O | Already optional `connect` extra |
| Identity | github.com/keycloak/keycloak | Apache-2.0 (per repo) | OIDC IdP (D-04 option A) | Owner decision D-04 |
| Identity (light) | github.com/better-auth/better-auth | MIT (per repo) | TS-native self-host auth (D-04 option B) | Owner decision D-04 |
| PWA/offline | github.com/GoogleChrome/workbox | MIT (per repo) | Service worker/offline-first | Field app already offline-queued; evaluate if PWA install needed |

**Build-vs-adopt rationale (per domain):** Eco Nojin's scientific core is deliberately
**dependency-free** (`pyproject.toml dependencies = []`, enforced by `tests/test_boundaries.py`).
For hydrology/agro models the project **reimplements published methods with citations** (D-17 option
A/C) rather than wrapping upstream engines — this preserves testability, licence clarity, and the
two-axis maturity model. External repos are therefore *references and optional connectors*, not core
dependencies. This is a deliberate, defensible choice, not an oversight.

---

## 4. Technology Comparison (summary)

| Concern | Chosen (in-repo) | Alternatives considered | Decision |
|---|---|---|---|
| Scientific runtime | Python stdlib-only engine | Wrap DSSAT/APSIM/AquaCrop; xarray stack | Keep reimplementation + adapters (D-17); add connectors only when measured need |
| Geospatial catalog | In-engine STAC subset | stac-fastapi + pgstac + titiler | Reuse subset now; revisit at D-DB-02 |
| Identity | In-API scrypt sessions | Keycloak / better-auth / Clerk | Owner decision D-04 (no change this phase) |
| DB | `node:sqlite` (zero-dep) | PostgreSQL+PostGIS/Timescale | Owner decision D-DB-01/02 |
| Offline | Custom sync queue (field) | Workbox PWA | Adequate now; PWA install optional |

No technology was swapped this phase (all such swaps are owner-gated per AGENTS.md / open ADRs).

---

## 5. Deep Domain Audit (18 domains, real code)

Maturity: NOT_FOUND · STUB/DEMO · IMPLEMENTED (API-backed) · TESTED. "Page exists" ≠ operational;
classification is based on **where data originates** (`services/hooks.ts`/`api.ts` = real vs
`data/*.ts`/localStorage = demo).

| # | Domain | Real (API-backed) | Demo/Stub | API | Tests | Maturity |
|---|---|---|---|---|---|---|
| 1 | Core Platform (router, gate, api client) | capability registry, fail-closed gate, same-origin `/api` | — | n/a | unit capabilities/api | IMPLEMENTED+TESTED |
| 2 | Identity & Organization | register/login/logout, orgs, members, invitations, RBAC | — | `/v1/auth/*`,`/v1/organizations/*` | security/admin specs | IMPLEMENTED+TESTED |
| 3 | Portal (public core) | auth, account, 15-locale legal/marketing content | `/platform/demo/*` | auth yes | smoke/account/a11y | IMPLEMENTED+TESTED |
| 4 | HyDroMA (science) | model registry `/science/models`, run `/science/run` | `/science/demo/*` synthetic indicators | yes (models/run) | science.spec, hydroma-live (skipped w/o engine) | MIXED (real islands + demo) |
| 5 | Agricultural Mgmt | farms, crop cycles, irrigation, field obs, tasks, intelligence, readiness | none | `/v1/resources/*`,`/v1/agri/*` | extensive e2e+unit | IMPLEMENTED+TESTED |
| 6 | Soil & Water | soil profiles+versions+observations; water series via engine | none | `/v1/soil/*` | soil-versioning/context specs | IMPLEMENTED+TESTED |
| 7 | Environmental Data Integration | env sources, observations, CSV import, QC | none | `/v1/env/*` | env-sources/env-live/quality | IMPLEMENTED+TESTED |
| 8 | GIS & Remote Sensing | STAC search endpoint; demo map only | `/science/demo` map; leaflet map page | `/v1/stac/*` | stac specs | STUB (no real raster) |
| 9 | Marketplace | real catalog (products/sellers/categories) | `/market/*` storefront, cart, orders (localStorage `demo:true`) | catalog yes | market.spec/a11y | Catalog IMPL; storefront DEMO |
| 10 | Tourism | none | entire `/tourism/*` (1,590-line dataset, localStorage bookings) | no | tourism.spec (as demo) | NOT_FOUND / DEMO |
| 11 | Inventory & FEFO | declared blocked | — | — | — | NOT_FOUND (capability-blocked) |
| 12 | Accounting | declared blocked | — | — | — | NOT_FOUND (capability-blocked) |
| 13 | MRV & Carbon | generic resource pages; carbon model in engine | — | `/v1/resources/mrv` | resource unit | IMPLEMENTED (generic) / model NOT_VALIDATED |
| 14 | Rewards & Challenges | EcoCoin ledger/rules/4-eyes; challenge lifecycle+verified rewards | none | `/v1/ecocoin/*`,`/v1/challenges/*` | unit + challenge-workflow | IMPLEMENTED+TESTED |
| 15 | EcoCoin & HIC | append-only ledger + hash chain; HIC status (inactive) | — | `/v1/ecocoin/*`,`/v1/hic/status` | ecocoin-ledger/transparency | IMPLEMENTED+TESTED (non-financial) |
| 16 | Automation & AI Agents | none | — | — | — | NOT_FOUND (scaffolded, D-AI-01) |
| 17 | Data Governance | provenance, schema versioning, audit log, org FK | — | cross-cutting | integrity/unit | IMPLEMENTED (foundational) |
| 18 | Scientific Laboratory | datasets, revisions, model-input binding, execution manifest | — | `/v1/datasets/*`,`/v1/hydroma/runs/*` | dataset/runs/execution specs | IMPLEMENTED+TESTED (science NOT_VALIDATED) |

**Highest-risk demo surfaces:** Tourism (fully fabricated), Marketplace storefront (localStorage
orders), `/platform/demo/*` registry, Landscape *management* pages (atlas/rangelands/etc. render
fabricated `series`). These are honestly badged as demo but remain shipped.

---

## 6. Real Capability Status (evidence anchors)

- Real data path: `apps/platform/src/services/hooks.ts:1-9,37-52` ("NO fallback to demo data").
- Honesty layer: `apps/platform/src/services/capabilities.ts:75-260` (per-module `missing`).
- Fail-closed guest gate: `apps/platform/src/app/WorkspaceGate.tsx:42-46`.
- Demo isolation: `apps/platform/src/app/router.tsx:44-59` (demo boundary), `DemoLayout.tsx:13-30`.
- Tourism demo data: `apps/platform/src/sections/tourism/data/tourism.ts:28` (status "demo").
- Marketplace demo orders: `.../market/store/orders.ts:24-37` (`demo:true`).
- Backend is the source of truth: `services/api/src/server.mjs` (routes enumerated in §7).

---

## 7. Security Audit & Findings

Audited `services/api/src/{server,db,auth,engine-gateway,engine-execution,science,stac}.mjs`.

**Strengths (verified):** scrypt+salt passwords, hashed opaque sessions (`auth.mjs:13-56`); HttpOnly+
SameSite=Lax cookie (`auth.mjs:70`); consistent RBAC + separation-of-duties (`server.mjs:151-152,567`);
org_id FK/UNIQUE/CHECK + immutability triggers (`db.mjs`); append-only EcoCoin hash chain
(`transparency.mjs`); generic error envelopes, no stack leak (`server.mjs:3641-3648`); **no hardcoded
secrets**; **no filesystem upload surface**; zero third-party deps.

**Findings & actions:**

| ID | Severity | Finding | Evidence | Action |
|---|---|---|---|---|
| SEC-01 | **HIGH** | Cross-tenant user mutation: `PATCH /v1/users/:id` loaded target globally and checked only caller's first-org role → any manager could suspend/rename other tenants' users | `server.mjs:856-877` (before) | **FIXED** — require shared org + write role in it (§9) |
| SEC-02 | MEDIUM | CORS wildcard reflected any Origin **with credentials** if `NOJIN_ORIGINS=*` | `server.mjs:219-221` (before) | **FIXED** — wildcard no longer combined with credentials (§9) |
| SEC-03 | HIGH | No rate limiting / lockout on `/v1/auth/login` & register (brute force) | grep `rate|throttle` = none; `server.mjs:574,624` | **OPEN** — needs owner-chosen limits; NIST 800-63B §3.2.2 mandates it |
| SEC-04 | MEDIUM-HIGH | Synchronous `spawnSync` model execution blocks event loop ≤30s | `engine-execution.mjs:13-20`; `server.mjs:3502` | **OPEN** — architectural (worker); owner-gated |
| SEC-05 | MEDIUM | Session cookie lacks `Secure`/`__Host-` (TLS-dependent) | `auth.mjs:70,73` | **OPEN** — depends on TLS termination (owner/infra) |
| SEC-06 | MEDIUM | No CSRF token; relies on SameSite=Lax + JSON-only | no `csrf|xsrf` code | **OPEN** — add Origin check or token (low risk, future) |
| SEC-07 | LOW-MED | Min password length 10 < NIST 15; no blocklist/MFA | `server.mjs:582` | **OPEN** — policy decision + test updates |
| SEC-08 | LOW | Verbose server-side error log may persist SQL/params | `server.mjs:3646` | OPEN — log hygiene |
| SEC-09 | LOW | Orphaned commented duplicate route block at top of file | `server.mjs:1-119` | OPEN — dead code, low risk |
| SEC-10 | LOW | `str()` silently truncates; naive CSV split | `server.mjs:210,3179` | OPEN — minor |

No destructive security testing was performed; all work was local and reversible.

---

## 8. E2E & Accessibility Results

- **Playwright E2E / a11y: NOT RUN.** `playwright.config.ts` requires `channel: "chrome"` (system
  Chrome) and starts the real API + dev server; **no Playwright browsers are installed**
  (`%LOCALAPPDATA%\ms-playwright` absent). Running would require a large browser download + Chrome.
  Per the no-overclaim rule this is reported as *not executed*, not passed.
- **Operational evidence that DID run this phase:** API integration/security suite
  (`node --test services/api/tests/`) → **128 tests, 127 pass, 1 skip**, including the new
  cross-tenant regression test. (Phase 1: unit 581, build, bundle, typecheck, lint, 1542 HyDroMA
  pytest — all green; not re-run except the API suite touched by this phase's fix.)

---

## 9. Implemented Changes (this phase)

1. **SEC-01 fix — tenant isolation on user mutation** (`services/api/src/server.mjs`): the handler now
   resolves the caller's memberships, requires a **shared organization** with the target user, and a
   **write role in that shared org**; non-shared targets return `404` (no existence leak), shared-but-
   no-write returns `403`. The role-change branch remains scoped to that shared org.
2. **SEC-02 fix — CORS hardening** (`services/api/src/server.mjs`): an explicit allowed origin still
   gets credentialed CORS; a `*` config now returns a non-credentialed wildcard instead of reflecting
   an arbitrary Origin with `allow-credentials: true`.
3. **Regression test** (`services/api/tests/security.test.mjs`): "PATCH /v1/users/:id cannot mutate a
   user of another tenant" — asserts 404 for suspend/rename/role-escalation across tenants and that
   the victim remains active and unchanged.

No other source changed. No git reset/clean/stash/commit/push performed.

---

## 10. Real Tests (this phase)

| Command | Result |
|---|---|
| `pnpm run test:api` (`node --test services/api/tests/`) | **128 tests, 127 pass, 1 skip, exit 0** |
| New security regression test | **pass** (cross-tenant mutation blocked) |
| (Phase 1, unchanged) typecheck/lint/boundaries/tokens/apps/unit/build/bundle | green; 1542 HyDroMA pytest green |

---

## 11. Limitations

- E2E/a11y not executed (no browsers/Chrome).
- SEC-03/04/05/06/07 documented, **not fixed** (owner/infra/architectural).
- Uncertainty propagation absent in HyDroMA; no benchmarks; **no scientific validation**.
- External repo licenses (except stac-spec) not re-fetched (search API 403) — leads only.
- `node:sqlite` is experimental in Node 22 (persistence portability risk).

---

## 12. Owner Decisions Required

- **D-04** identity provider (drives SEC-05/07, MFA).
- **D-DB-01/02** DB + gridded storage (drives SEC-04 worker, raster).
- **D-PROD-01** first slice (unblocks Tourism/Marketplace/Inventory/Accounting domains).
- Rate-limit policy (SEC-03) and password policy (SEC-07) thresholds.
- Whether to remove the `tatus` artifact and the `/platform/demo/*` surface before any pilot.

---

## 13. Prioritized Roadmap

1. **Now (low-risk, in-scope):** add rate limiting to auth (configurable, skip in test) — SEC-03;
   add `Secure` cookie flag gated by env — SEC-05; add Origin-check CSRF guard — SEC-06.
2. **Next:** move model execution off the event loop (worker/queue) — SEC-04 (needs D-HYDROMA-03).
3. **Then:** close D-PROD-01; replace Tourism/Marketplace demo with real endpoints.
4. **Scientific:** implement per-domain uncertainty; run independent observational validation for one
   model to move it off `NOT_VALIDATED`.
5. **Ops:** install Playwright browsers in CI; run E2E/a11y; then sync README counts.

---

## 14. Files Changed

| File | Change |
|---|---|
| `services/api/src/server.mjs` | SEC-01 tenant-isolation fix; SEC-02 CORS hardening (tracked, M) |
| `services/api/tests/security.test.mjs` | +1 cross-tenant regression test (pre-existing untracked) |
| `docs/reports/AUTONOMOUS_PHASE_2_RESEARCH_AND_DOMAIN_AUDIT.md` | this report (new) |
| `artifacts/*.log` | gate/test logs (gitignored) |

Preserved: all Phase-1 and pre-existing uncommitted work (no destructive git ops).

---

## 15. Final Git State

Branch `main` @ `a310306`. Working tree: pre-existing large uncommitted body + this phase's
`server.mjs` (M), `security.test.mjs` (untracked, +test), new report (untracked). No commit/push/
tag/branch mutation/reset/clean/stash. `tatus` artifact left in place (owner to remove).

---

## 16. Final Classification

`RESEARCH_AND_ENGINEERING_COMPLETED_WITH_LIMITATIONS`

Research (standards + repos) and the deep 18-domain / backend / scientific audit are complete with
evidence; two in-scope HIGH/MEDIUM security defects were fixed with a regression test and the API
suite is green (128 tests). Limitations are explicit: E2E not run, several security items are
owner/infra-gated, science remains `NOT_VALIDATED`, and most commerce/tourism/AI domains are
intentionally demo/scaffolded pending owner decisions. Nothing is overclaimed.