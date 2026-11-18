# ECO NOJIN — ARCHITECTURE CORRECTION AND DEVELOPMENT READINESS
## سند اصلاح معماری و آمادگی توسعه

**Document ID:** ECO-NOJIN-ARCHITECTURE-CORRECTION-AND-READINESS
**Version:** 1.0
**Date:** 2026-11-18
**Role:** Independent Principal Architect and Quality Authority
**Target:** `D:\NOJIN`
**Mode:** READ-ONLY against all existing files. **No source code changed. No architecture standard edited. No Git operation. No owner decision approved.**
**Scope:** resolve the *verified* inconsistencies F-01…F-06 and establish a minimal, honest development-readiness position. This is not a re-audit.

**Reference set:** `architecture\ECO-NOJIN-INDEPENDENT-TECHNICAL-RESEARCH-BASELINE.md` · `INDEPENDENT-ARCHITECTURE-AND-CODE-REVIEW.md` · `architecture\consolidated-v1\*` · `brand\eco-nojin-visual-identity-v3\*` (37 standards + decision registers).

**Legal note on scope:** "Create only" was honoured — this is the only file written. Corrections to the four primary deliverables are **specified here as exact replacement text**, not applied, because this mission must not modify existing files.

---

## 0. Verification log (reproducible evidence)

| Check | Command | Observed | Used for |
|---|---|---|---|
| Interpreter | `py -3 --version` | `Python 3.12.10` | F-01 |
| Interpreter path | `py -0p` | `...\Python312\python.exe`; also `uv` CPython 3.15.0 | F-01 |
| pip | `py -3 -m pip --version` | `pip 25.0.1 (python 3.12)` | F-01 |
| venv | `py -3 -c "import venv"` | OK, 3.12.10 | F-01 |
| crypto/db | `py -3 -c "import ssl,sqlite3"` | OpenSSL 3.0.16, SQLite 3.51.3 | F-01 |
| Installed deps | `py -3 -m pip list` | 5 lines (base only) | F-01 |
| Project env | search `.venv`, `requirements*.txt`, `pyproject.toml` | **none** outside registry | F-01 |
| Review matrix rows | regex on review file | **V1…V16 = 16 rows; V8 false** | F-05 |
| Review claims | regex `16 of 17` | found **twice** (matrix + verdict) | F-05 |
| DS QA evidence | `reports\final-qa-report.md` | Contrast PASS(2), Keyboard PASS, Responsive PASS, SR NOT_TESTED | F-02 |
| Integration facts | `UPSTREAM-INTEGRATION-STATUS.csv` | see §3 | F-04, F-06, Task 3 |
| Root inventory | `Get-ChildItem` | stray empty `firebase-debug.log` (0 B, 11/17) | §2 |

---

## 1. Verified Corrections (F-01 → F-06)

### F-01 — Python: interpreter present, project runtime absent

| Field | Value |
|---|---|
| **Classification** | **Technical** (environmental fact) + documentary (wrong value) |
| **Exact incorrect statement** | `DEVELOPMENT-FOUNDATION-REPORT.md` §2, table row: `| Python | not available | per experiments/geospatial-poc/EVALUATION_REPORT.md §1 |` |
| **Evidence** | `python` (MS-Store alias) fails, but `py -3` → CPython **3.12.10** with pip **25.0.1**, `venv` module, OpenSSL 3.0.16, SQLite 3.51.3. A second interpreter (`uv` CPython **3.15.0**) also exists. |
| **The distinction the report missed** | **Installed interpreter + runtime tooling = AVAILABLE.** **Configured, reproducible project runtime = ABSENT** (no `.venv`, no `requirements.txt`/`pyproject.toml`, `pip list` = base-only). The ETL/science stack has never been provisioned, but it *can* be. |
| **Minimum correction** | Replace the row with the verified fact and the distinction. |
| **Affected documents** | `DEVELOPMENT-FOUNDATION-REPORT.md` (§2); downstream wording in `NEXT-IMPLEMENTATION-PLAN.md` §5 (Wave 1/2 Python items). |
| **Decision IDs affected** | none renamed; `D-17` (scientific models) still OPEN. |

**Corrected statement (EN, verbatim insert):**

> | Python | **3.12.10 via `py -3`** (pip 25.0.1, `venv` available; OpenSSL 3.0.16, SQLite 3.51.3). The `python` alias is an unconfigured MS-Store stub; a second `uv` CPython 3.15.0 is present. | `py -3 --version`, `py -0p` |
> | Python project runtime | **NOT PROVISIONED** — no `.venv`, no dependency manifest; `pip list` is base-only. Science/ETL dependencies are not yet installed. | `pip list`, filesystem search |
>
> *Consequence:* Python-based services (`titiler`, `xclim`, `landlab`, `aquacrop`, `flopy`, `pgstac`) are **runnable after environment provisioning**, which is a technical task, not an owner decision.

---

### F-02 — Design-System QA: automated results ≠ full acceptance

| Field | Value |
|---|---|
| **Classification** | **Documentary** (evidence misquoted) |
| **Exact incorrect statement** | `ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md` §3: "…but **not** contrast/WCAG/keyboard/AT tested and **not** owner-approved." |
| **Evidence (authoritative)** | `brand\eco-nojin-design-system-v2-qa\reports\final-qa-report.md`: **WCAG Contrast PASS** (400 samples, 104→2 residual, documented), **Keyboard PASS**, **Responsive PASS** (320–1920), **RTL/LTR PASS**, **Screen Reader NOT_TESTED**; overall `QA_ACCEPTED_WITH_CORRECTIONS`, status `DRAFT — NOT APPROVED`. |
| **The distinction** | The v2 prototype *has* passing automated contrast/keyboard/responsive/RTL evidence. It does **not** have: screen-reader conformance, owner approval of colour/typography/logo (`COLOR-01`, `TYPO-01..06`, `ID-07`), or final token SSOT. "Automated test pass" ≠ "Design System accepted". |
| **Minimum correction** | Replace the sentence with a two-part statement (tested vs not accepted). |
| **Affected documents** | `ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md` (§3 only). |
| **Decision IDs affected** | none; `COLOR-01/TYPO-*/ID-07` stay OPEN. |

**Corrected statement (EN, verbatim insert):**

> **Maturity:** `DESIGNED`. Automated QA on the v2 prototype passed for **contrast (2 documented residual), keyboard, responsive (320–1920) and RTL/LTR**; **screen-reader and full assistive-technology conformance are NOT_TESTED**. The system is **not** accepted and **not** owner-approved: colour route (`COLOR-01`), typography (`TYPO-01..06`) and logo (`ID-07`) remain open owner decisions, and token duplication (`F6`) is unresolved.

---

### F-03 — Keycloak / Temporal ownership contradiction (architectural)

| Field | Value |
|---|---|
| **Classification** | **Architectural** (dependency direction) |
| **Exact contradiction** | `ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md` §2.0 Boundary **3 (Core)** lists touchpoints "keycloak, temporal/kestra, erpnext/dolibarr, farmos"; §10 Boundary **8 (Integration Layer)** claims "Identity upstream (if Keycloak adopted): OIDC adapter"; §12 **rule 6** says "Upstream code never crosses the Integration Layer boundary un-wrapped." |
| **Resolution rule** | An upstream *product* (IdP, workflow server, ERP) is always reached **through an adapter in Boundary 8**; Boundary 3 owns only the *consuming bounded context* (`BC-IAM`, `BC-WF`) and our contract. "Standalone" describes **licence isolation**, not an exemption from the adapter. |
| **Minimum correction** | Remove `keycloak` and `temporal/kestra` from Boundary 3's touchpoint list; state them once, in Boundary 8, as adapters. |
| **Affected documents** | `ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md` §2.0 row 3, §10. |
| **Decision IDs affected** | `D-04` (IdP) and `D-07` (workflow) stay OPEN; no ID renumbered. |

**Corrected statement (EN, verbatim insert for §2.0 row 3):**

> | 3 | Eco Nojin Core | … | `DU-CORE` | **via Integration Layer adapters only** (identity: Keycloak/OIDC; workflow: Temporal/Kestra or internal engine; ERP/FarmOS: protocol adapters) | `DESIGNED` |

**And for §10 (added clause):** *Identity and workflow upstreams are owned as adapters here; Boundary 3 never imports or configures them directly. This satisfies §12 rule 6.*

---

### F-04 — Framework matrix omitted Angular

| Field | Value |
|---|---|
| **Classification** | **Technical (evaluation)** + documentary |
| **Exact defect** | `DEVELOPMENT-FOUNDATION-REPORT.md` §4 scored 7 candidates; **Angular absent**, although the operating environment ships an official Angular v20+ capability and Angular 22 is the current active line (verified 2026-11-18). |
| **Minimum correction** | Add Angular 22 as an eighth candidate under the *same* weights; keep the recommendation non-binding. Do **not** recommend it merely because it is available. |
| **Affected documents** | `DEVELOPMENT-FOUNDATION-REPORT.md` §4.1/§4.2/§4.3. |
| **Decision IDs affected** | `AUDIT-MISS-01` / `B1` remain OPEN. |

The scored matrix with Angular added is in **§3** of this report.

---

### F-05 — Two separate reconciliations

**(a) The review's own count is wrong (self-correction, documentary).**

| Field | Value |
|---|---|
| **Exact defect** | `INDEPENDENT-ARCHITECTURE-AND-CODE-REVIEW.md` states "**16 of 17** claims reproduced exactly. One factual claim is false (V8)" — **twice** (matrix summary + verdict). But the verification matrix contains exactly **V1…V16 (16 rows)**, of which **V8 is false**. |
| **Arithmetic** | 16 rows − 1 false = **15 true**. The "17" implies a verification entry **V17 that does not exist**. |
| **Missing finding number** | **None.** Findings are contiguous `F-01…F-10`; no finding ID is skipped. What is missing is a **17th verification row**, not a finding. |
| **Minimum correction** | Restate as: "**15 of 16 verification claims reproduced exactly; V8 (Python availability) is false.**" (Recorded here; the review file is not edited per scope.) |

**(b) Ecosystem "exactly one boundary" completeness claim (architectural, remains OPEN).**

| Field | Value |
|---|---|
| **Exact claim** | `ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md` §13: "Every one of the 178 catalogued modules maps into exactly one of Boundaries 1–8." |
| **Defect** | No 178-row module→boundary artefact exists; §13 maps at BC/layer granularity only; `BC-PRES` is split across Boundary 1 (UI-DESIGN) and Boundary 2 (UI-SHELL/UI-OFFLINE). |
| **Minimum correction** | Either generate the map from `architecture\executable-v1\MODULE-EXECUTION-MAP.csv`, or downgrade the claim to *bounded-context* granularity. |
| **Affected documents** | `ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md` §13 (one sentence). |

**Corrected statement (EN):** *"Every bounded context maps to one primary boundary (module-level mapping available in `MODULE-EXECUTION-MAP.csv`); `BC-PRES` is intentionally split between Boundary 1 (design decisions) and Boundary 2 (shell/offline)."*

---

### F-06 — Wave 1 re-evaluated against real readiness

| Field | Value |
|---|---|
| **Classification** | **Technical (sequencing)** |
| **Exact defect** | `NEXT-IMPLEMENTATION-PLAN.md` §5.5 "start-low-risk-high-value" lists 5 items as Wave 1; two are not startable: `keycloak` (owner `D-04` OPEN, needs a JVM service) and `titiler` (Python service, cost M, needs a provisioned runtime). |
| **Minimum correction** | Split Wave 1 into 1a / 1b / 1c by *actual* blockers. |
| **Affected documents** | `NEXT-IMPLEMENTATION-PLAN.md` §5.5 and §5.2 counts. |

**Corrected Wave structure (EN):**

| Sub-wave | Items | Class / cost | Blocking condition | Can start |
|---|---|---|---|---|
| **1a — unblocked** | `maplibre-gl-js` (BSD-3, ADOPT, S) · `giro3d` (MIT, ADOPT, S, already RUN_TESTED) · `pystac` (Apache-2.0, ADOPT, S) | client / pure lib | none (framework-neutral; works vanilla/Vite) | **now** |
| **1b — after technical correction** | `titiler` (MIT, INTEGRATE, M) | Python service | Python venv + deps provisioned (F-01) | after T-1 |
| **1c — requires owner decision** | `keycloak` (Apache-2.0, ADOPT, L) | JVM service | `D-04` IdP decision | after owner |

Resulting wave counts: **1a=3, 1b=1, 1c=1**, remainder unchanged (2=15, 3=22, D=12 → 53 + 1 reclassified = 54). No project row is removed.

---

## 2. Remaining Contradictions (carried, not blocking current slice)

| ID | Contradiction | Status | Owner impact |
|---|---|---|---|
| F-07 | CSV rubric defines 6 integration classes; data uses 4 (`CUSTOMIZE`, `BUILD` unused) → internal BUILD domains (ledger, MRV) unrepresented | LOW — documentation | none |
| F-08 | Deploy units `DU-CORE/DU-ENGINE/DU-GEO` named while `D-01` topology is OPEN | LOW — label as provisional | `D-01` OPEN |
| F-09 | "GeoLibre is React 19" asserted from a `PARTIALLY_VERIFIED` source | LOW — mark `ASSUMPTION` | none |
| F-10 | "No existing document overwritten" unprovable without VCS | LOW — limitation | resolved by `G0` |
| N-01 | Stray empty `firebase-debug.log` (0 B, 2026-11-17) in root | INFO — housekeeping; contains no data, no external operation evidenced | none |
| N-02 | `tokens.css` vs `themes.css` duplicate token values (F6 in roadmap) | MEDIUM — technical debt | none (fix = `B2`) |
| DS-01 | 3 security standards (22/24/31) with colliding `SEC-D*`; 2 API standards (30/34) with incompatible `ApiError`; 2 a11y standards (21/32) | MEDIUM — frontend corpus debt | `DOC-01/02/03` designation |

None of the above blocks the first public page (see §5).

---

## 3. Framework Comparison (Angular added; identical weights)

### 3.1 Criteria coverage (mission's required dimensions)

| Dimension | React (Next / RR7 / Vite) | **Angular 22** | SvelteKit (Vue/Nuxt noted) |
|---|---|---|---|
| 227 planned pages | strong (file routing, RSC) | strong (module/lazy routing) | strong |
| 188 planned modules | good (needs discipline) | **strong (DI + NgModule/standalone boundaries)** | good |
| RTL/LTR | good (manual `dir`) | **strong (built-in i18n + RTL)** | good |
| fa/ar/en | good (i18next/Intl) | **strong (built-in ICU i18n, per-locale builds)** | good (svelte-i18n) |
| Scientific dashboards | strong | **strong (RxJS/signals, structured)** | medium |
| MapLibre / geospatial | **strong (react-map-gl, deck.gl)** | strong (libs are framework-agnostic) | medium |
| 3D (Cesium/Giro3D) | strong (`resium`) | strong (agnostic) | medium |
| Shared Design System | strong (tokens as CSS vars) | strong (same) | strong |
| Accessibility | good (needs discipline) | good (+ CDK a11y) | good |
| Testing | strong (vitest/playwright) | **strong (built-in TestBed, Karma/Jasmine, Playwright)** | good |
| Build performance | good (Vite/Turbopack) | medium (heavier baseline; esbuild improves) | **best (smallest)** |
| Long-term maintenance | good (churn risk) | **strong (opinionated, 12-mo major/24-mo LTS)** | medium (smaller ecosystem) |
| Upstream compatibility | **best (GeoLibre, react-map-gl, resium)** | good (agnostic engines) | fair |
| Dev availability / ops cost | **highest talent pool** | high in enterprise, smaller than React | smallest pool |

### 3.2 Weighted matrix (weights identical to `DEVELOPMENT-FOUNDATION-REPORT.md` §3; Σ = 100)

| Candidate | R1 SEO 15 | R2 Viz 15 | R3 i18n 12 | R8 Perf 12 | Eco 13 | R9 Deploy 10 | R10 Maint 10 | R6 PWA 7 | Learn 6 | **Score** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Next.js (React) | 5 | 5 | 5 | 4 | 5 | 3 | 4 | 4 | 3 | **87.8** |
| React Router v7 | 5 | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | **84.8** |
| Vite + React SPA | 2 | 5 | 4 | 4 | 5 | 5 | 4 | 5 | 5 | **84.2** |
| **Angular 22 (added)** | 4 | 5 | 5 | 4 | 3 | 4 | 4 | 5 | 3 | **83.0** |
| Nuxt (Vue 3) | 5 | 4 | 5 | 4 | 3 | 3 | 4 | 4 | 3 | **79.6** |
| Astro (islands) | 5 | 2 | 4 | 5 | 3 | 5 | 4 | 4 | 4 | **78.8** |
| SvelteKit | 5 | 4 | 3 | 5 | 3 | 4 | 3 | 4 | 4 | **78.4** |
| Qwik | 4 | 4 | 3 | 5 | 2 | 4 | 2 | 3 | 2 | **67.0** |

Angular arithmetic: (15·4 + 15·5 + 12·5 + 12·4 + 13·3 + 10·4 + 10·4 + 7·5 + 6·3) ÷ 5 = 415 ÷ 5 = **83.0**.

### 3.3 Reading it honestly

- Angular lands **4th (83.0)**, within 1.2 points of Vite+React and behind Next.js by ~4.8. It is **competitive, not merely available**: it wins on *i18n/RTL and large-module structure* (both directly relevant to 188 modules and fa/ar/en), and loses on *geospatial ecosystem breadth* and *learning curve*.
- **Do not select Angular for availability alone.** The environment advantage is a tiebreaker only if the owner weights enterprise structure and built-in i18n higher than ecosystem breadth.
- The React family's lead is driven almost entirely by **ecosystem (13)** and **SEO (15)**. If the owner de-scopes public SEO to phase 2, Vite+React and Angular converge.

### 3.4 Recommendation (NON-BINDING — `OWNER_DECISION_REQUIRED`)

1. **Primary:** **Next.js (React)** — best single fit for public SEO + dashboards + heavy geo viz + largest talent pool.
2. **Credible alternative:** **Angular 22** — choose if built-in ICU i18n/RTL, DI-driven modularity for 188 modules, and long-term LTS governance outweigh ecosystem breadth.
3. **Lowest-ops alternative:** **Vite + React SPA** (add prerender if SEO is required).
4. **Regardless of choice:** adopt a **monorepo** with `design-system`, `shared-ui`, `shared-contracts` packages; keep the framework behind a thin adapter so the engine and contracts stay framework-neutral.
5. **Sequence:** framework decision **after** the read-only repository audit (per `37` §19), not before.

---

## 4. Integration Boundary Recommendations

| Component | Product owner (boundary) | Architectural layer | Runtime requirement | Integration interface | Dependency direction | License | Deployment assumption | Unresolved owner decision |
|---|---|---|---|---|---|---|---|---|
| **Keycloak** | Core `BC-IAM` consumes; adapter owned by Boundary 8 | Integration Layer (adapter) → IdP service | JVM service + its own DB | OIDC/OAuth2 + SCIM over HTTPS | Core → our interface → adapter → Keycloak (one-way) | Apache-2.0 | Standalone service, no Docker required (VM/PaaS) | **`D-04` IdP** |
| **Temporal** | Core `BC-WF` consumes; adapter in Boundary 8 | Integration Layer (adapter) | Server + persistence DB | gRPC/HTTP SDK, workflow contract | Core → our job contract → adapter → Temporal | MIT | Standalone; alternative = internal WF engine | **`D-07` workflow engine** |
| **TiTiler** | HyDroMA/Geo (`BC-GEO`) consumes; adapter in Boundary 8 | Integration Layer (server) | **Python** service + `asyncpg`/rasterio | HTTP tile/COG API (XYZ/WMTS) | UI/Core → our tile URL contract → adapter → TiTiler | MIT | Python venv on VM/PaaS; **not** Docker | `D-01`/`D-13` (deployment only) |
| **PySTAC** | Shared Contracts (Boundary 7) | Library (server-side) | Python package (no service) | Python import + STAC 1.0 JSON | Contract layer → pystac (in-process) | Apache-2.0 | Runs inside any Python process; zero infra | none |
| **MapLibre GL JS** | Shared UI (Boundary 2) | Client library | Browser / WebGL | JS API + style JSON | UI → MapLibre directly (client lib, not upstream code) | BSD-3-Clause | Static bundle; RTL native in v6 | none (2D engine select is technical) |
| **Scientific engines** (`xclim`, `wflow-jl`, `modflow6`+`flopy`, `swatplus`, `aquacrop`, `landlab`) | HyDroMA (Boundary 4) | Engine adapters inside `DU-ENGINE` | Python + Julia + Fortran runtimes | Job contract (`ScenarioRequest → ResultSet+Provenance`) | Core/MRV → job API → engine adapter → model | Apache-2.0 / MIT / CC0 / public domain / **LGPL-2.1 (swatplus)** | Isolated processes; LGPL = separate execution only | **`D-17` models**, **`D-18` RothC**, **`D-19` licenses** |

**Boundary rules fixed by this table:**
1. No product imports an upstream library directly; identity/workflow/ERP/geo-services are reached **only** through Boundary 8 adapters (closes F-03).
2. Client map engines (MapLibre/Giro3D/Cesium/deck.gl) are the *only* upstreams legitimately imported by Boundary 2, because they are browser libraries, not services.
3. `swatplus` (LGPL-2.1) stays a **separate process**; never linked into the engine binary.
4. Python availability (§F-01) makes `titiler`/`xclim` **technically** deployable; it does **not** approve `D-17`/`D-19`.

---

## 5. Development Readiness Matrix

### 5.1 Can start immediately (no owner decision, no blocker)

| Work | Why it is safe now | Evidence base |
|---|---|---|
| Documentation corrections F-01…F-06 (+N-01) | editorial; no code | this report §1 |
| MapLibre 2D spike in **framework-neutral** form (vanilla/Vite) | client lib, BSD-3, no framework decision needed | `giro3d` RUN_TESTED; MapLibre v6 |
| PySTAC contract prototype (server-side, in a venv) | pure library, Apache-2.0, no service | §4 |
| Token SSOT consolidation (`B2`) on existing CSS/JSON | no framework; fixes N-02 | design-system v2 |
| Extend `geo-measure` unit suite / edge cases | existing code, 23/23 green | `geo-measure` |
| Consolidate DS QA evidence into one baseline doc | documentary | `final-qa-report.md` |

### 5.2 Can start after technical correction

| Work | Correction needed | Owner decision? |
|---|---|---|
| TiTiler adapter spike | **T-1:** provision Python venv + deps (F-01) | No |
| Python scientific env (`xclim` smoke test) | **T-1** | No (model selection `D-17` separate) |
| Single automated gate (`B5`) | **T-2:** needs a build tool ⇒ depends on framework | No (technical) |
| Monorepo scaffold | **T-2** + framework | No (technical) |

### 5.3 Requires owner decision

| Work | Decision |
|---|---|
| Framework / rendering / monorepo layout | `AUDIT-MISS-01` / `B1` (**G1**) |
| Repository creation + Git authorization | `A1` (**G0**) |
| Authority matrix + agent policy | `GOV-03`, `GOV-08` (**G0b**) |
| Keycloak production integration | `D-04` |
| Temporal adoption | `D-07` |
| Project CRS (map area correctness) | `B14` |
| First scientific models | `D-17` |
| Soil carbon (RothC) | `D-18` |
| Copyleft acceptance | `D-19` |

### 5.4 Must remain blocked

| Work | Blocked by |
|---|---|
| `PUB-01` page build | `G0` + `G1` (repo + framework) |
| Any financial UI / ledger / settlement | `D-05`, `D-16`, `37 §12.4` activation |
| ECO/HIC issuance, token, chain, balances | `D-15` (owner-gated; no chain authorized) |
| MRV credit issuance | `D-17`/`D-18` + methodology approval |
| Production APIs / deployment / remote | separate written authorization |

### 5.5 Critical de-coupling (prevent over-blocking)

`PUB-01` (public Home) requires **only** `A1` (repository), `B1` (framework), `B2` (token SSOT) and `B5` (gate). It does **not** require `D-02/03/04/05/06/13/14/15/16/17/18/19`, CRS, IdP, or any financial/scientific decision. The first page must not be delayed by decisions that cannot affect a data-free, auth-free public page.

---

## 6. Owner Decisions Required (all OPEN; none approved here)

| Priority | Decision | ID | Blocks |
|---|---|---|---|
| P0 | Framework / rendering / monorepo | `AUDIT-MISS-01` / `B1` | all UI code |
| P0 | Repository + Git authorization | `A1` | any commit/diff/rollback |
| P0 | Authority matrix | `GOV-03` | legitimacy of decisions |
| P0 | Agent authority policy | `GOV-08` | mission boundaries |
| P1 | IdP | `D-04` | Keycloak production |
| P1 | Workflow engine | `D-07` | Temporal adoption |
| P1 | Project CRS | `B14` | map/parcel area |
| P1 | First scientific models | `D-17` | HyDroMA scope |
| P1 | Soil carbon | `D-18` | MRV-SOC |
| P1 | Copyleft acceptance | `D-19` | swatplus/erpnext/etc. |
| P2 | DB / tenancy / topology / scenario | `D-01/02/03/13` | backend build |
| P2 | Jurisdiction / retention / payments | `D-14/20/16` | compliance |
| P3 | EcoCoin / HIC | `D-15` | digital economy (suspended) |
| P3 | Identity / colour / typography / logo | `ID-07`/`COLOR-01`/`TYPO-*` | visual layer |

---

## 7. Exact Next Implementation Sequence (minimum delay)

```text
T-0  (agent, doc only)   Apply corrections F-01…F-06 + N-01 to the 4 deliverables;
                         re-issue the framework matrix with Angular (non-binding).
T-1  (agent, technical)  Provision Python venv (§F-01); install titiler + xclim smoke deps;
                         run `geo-measure` 23/23 inside it to confirm the gate.
T-2  (agent)             Prototype MapLibre 2D + PySTAC in a framework-neutral sandbox;
                         consolidate DS QA evidence into one baseline.
G0   (OWNER)             Create repository; authorize Git; first commit = design-system baseline.
G0b  (OWNER)             Record GOV-03 + GOV-08 with owner id/date.
G1   (OWNER)             Ratify framework/rendering + monorepo as ADR (basis = §3).
G2   (eng)               Token SSOT (B2).
G3   (eng)               Single gate: typecheck + lint + unit (incl. geo-measure) + build.
G4   (eng)               Build PUB-01 (4 states, 375/768/1440, fa-RTL/en-LTR, keyboard).
G5   (eng)               Wave 1a integrations (maplibre, giro3d, pystac) behind adapters.
G6   (owner+eng)         Wave 1b (titiler) after T-1; Wave 1c (keycloak) after D-04.
```

**Minimum path to first real code = `G0` + `G1`.** Everything before them adds no application software. Everything in §5.1 can proceed in parallel without them.

---

## 8. Status Statement

- No existing source code, architecture standard or decision register was modified.
- No owner decision was approved, implied, or pre-empted. `AUDIT-MISS-01`/`B1`, `A1`, `GOV-03`/`GOV-08`, and `D-01…D-25` remain **OPEN**.
- The only corrected *numbers* in this document are arithmetic reconciliations of prior reports (review 15/16; wave 1a/1b/1c), with original files left intact.
- Verdict on readiness: **READY FOR CONTROLLED DEVELOPMENT UPON G0+G1**, with technical tasks T-1/T-2 executable immediately.

**END OF ARCHITECTURE CORRECTION AND READINESS REPORT.**
