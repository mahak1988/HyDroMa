# ARCHITECTURE-DECISION-MATRIX
## ماتریس تصمیم‌های باز معماری

**Date:** 2026-11-18
**Source:** all 17 entries in `ARCHITECTURE-DECISIONS-OPEN.md` (root).
**Status:** none of these is approved. This document converts a flat list into a decidable matrix.

Groups:

| Group | Meaning | Who acts |
|---|---|---|
| **A** | low-risk technical decision; a documented default can be applied by the agent | agent proposes, owner may veto |
| **B** | architecturally significant; needs a spike/PoC or more evidence before commitment | agent prepares evidence, **owner** confirms |
| **C** | requires owner approval before any work starts | **owner** only |
| **D** | intentionally deferred; acting now would be premature | nobody, until its trigger |

---

## 1. Summary matrix

| ID | Decision | Group | Authority | Recommendation (advisory) | Technical risk | Economic risk | Security risk | Depends on |
|---|---|---|---|---|---|---|---|---|
| D-GIT-01 | Initialise local Git + baseline | **C** | owner | init local repo, no remote, baseline after `.gitignore` review | low | low | low | — |
| D-ARC-01 | Modular monolith vs early services | **A** | agent→owner veto | modular monolith; `hydroma` as separate process boundary later | low | low | low | — |
| D-ARC-02 | Fate of `app/` | **B** | joint | keep as portal seed; migrate once, under D-FE-01 | low | low | low | D-FE-01 |
| D-APP-01 | Standalone apps vs console modules (marketplace, tourism) | **C** | owner | hybrid: public in portal, transactional in console | medium | medium | low | D-PROD-01 |
| D-APP-02 | Console actor model | **B** | joint | one shell, separate route trees per actor class | medium | low | **medium** (permission-shaped UI) | D-04 |
| D-FE-01 | Frontend framework/host | **C** | owner | Next.js pinned exactly (16.3.x) + `next build` gate, framework-agnostic UI package | medium | medium | low | — |
| D-04 | Identity provider | **B** | joint | self-hosted OIDC (Keycloak) or `better-auth`; avoid SaaS lock-in | medium | **high** (per-MAU) | **high** (auth is the perimeter) | D-FE-01 |
| D-DB-01 | Time-series + analytical store | **B** | joint | PostgreSQL+Timescale first; ClickHouse only on measured need | low | low | low | D-PROD-01 |
| D-DB-02 | Home of gridded scientific data | **B** | joint | object storage + COG/STAC, metadata in model-registry | medium | low | low | D-17 |
| D-QA-01 | Test stack | **A** | agent→owner veto | Vitest + Playwright + Pytest (scientific) | low | low | low | D-GIT-01 |
| D-INT-01 | Weather/climate data sources | **B** | joint | open datasets first (ERA5/CHIRPS/GPM), licence recorded per source | medium | low | low | D-17 |
| D-INT-02 | Payments/payouts | **D** | owner (later) | defer until commerce model is fixed | medium | **high** | **high** | D-PROD-01 |
| D-17 | Adopt upstream scientific models | **D** | owner (later) | hybrid per domain with a written review record | **high** (scientific correctness) | medium | low | D-DB-02, D-INT-01 |
| D-DOC-01 | Documentation authority | **A** | agent→owner veto | keep `architecture/` authoritative; `docs/` = process + index | low | low | low | — |
| D-PROD-01 | First product slice / commerce model | **C** | owner | console+organizations foundation with a thin HyDroMA slice | medium | **high** | low | — |
| D-PROD-02 | Country/currency rollout order | **D** | owner (later) | two countries from day one, after D-PROD-01 | medium | medium | medium | D-PROD-01 |
| D-AI-01 | Agent autonomy level | **D** | owner (later) | read + draft-with-approval; no financial tools | **high** (autonomy) | medium | **high** | D-PROD-01 |

Counts: **A = 3**, **B = 6**, **C = 4**, **D = 4**. Total 17.

## 2. Decisions that unblock the most work (closing order)

1. **D-GIT-01** — without a baseline, every later change is unrecoverable.
2. **D-FE-01** — decides whether `app/` becomes the portal and what the console is built on.
3. **D-ARC-02** — removes the `app/`↔`apps/` ambiguity (F-01) in one step.
4. **D-04** — identity is the perimeter of every protected surface; it also decides whether a
   Clerk-style dependency is acceptable (see FRONTEND-SELECTION-REPORT §4.2).
5. **D-PROD-01** — fixes what is actually built first; everything downstream inherits its scope.

## 3. Decision detail

### D-GIT-01 — repository initialisation · Group C · owner

- **Options:** (A) stay filesystem-only; (B) `git init` locally + `.gitignore` review + one baseline
  commit, no remote; (C) init + private remote.
- **Dependencies:** none. Blocks: CI, ADR history, review workflow, rollback.
- **Risk:** B is low risk if `upstream-archives/**/*.zip` and `data/` payloads stay ignored; the main
  danger is an unreviewed first commit that includes generated `dist/`/`node_modules`.
- **Evidence for the recommendation:** `.gitignore` already excludes archives, deps and data
  payloads; the tree has 30 skeleton files + 8 root documents, all human-readable.
- **Recommendation:** **B**, executed only after the owner reviews `.gitignore`. No remote, no push.
- **Agent may:** draft the exact `git init` + `git add` file list for approval. **May not:** run it.

### D-ARC-01 — architectural style · Group A · agent default with veto

- **Options:** modular monolith (A) / extract `hydroma`+`ai-orchestration` early (B) / microservices (C).
- **Dependencies:** none; constrains D-DB-01 and D-DB-02.
- **Risk:** C imports distributed-transaction and 13-pipeline cost with zero current benefit.
- **Recommendation:** A. Treat `hydroma` as a process boundary from day one (same repo, separate
  runtime) so scientific load never dictates business-service scaling.
- **Why group A:** reversible, cheap, and already reflected in the tree.

### D-ARC-02 — fate of `app/` · Group B · joint

- **Evidence:** `app/` is a zero-dependency, RTL-first (`lang="fa" dir="rtl"`), test-covered portal
  prototype (69/69 tests pass) using `brand/` tokens — see FINAL-ARCHITECTURE-AUDIT §6.
- **Options:** (A) keep as reference only; (B) promote to `apps/portal` when D-FE-01 closes;
  (C) delete.
- **Risk:** (C) destroys the only RTL-first asset; (A) leaves permanent ambiguity (F-01).
- **Recommendation:** B with an explicit migration note; until then label it "portal seed".
- **Depends on:** D-FE-01 (a static, dependency-free prototype cannot become the final portal if the
  owner selects SSR/ISR).

### D-APP-01 — marketplace/tourism shape · Group C · owner

- **Options:** standalone apps (A) / console modules (B) / hybrid: public in portal + transactional
  in console (C).
- **Dependencies:** D-PROD-01 (commerce model), D-INT-02 (payments).
- **Risk:** A duplicates shell/auth/i18n three times; B fights the commerce UX inside an admin shell;
  C needs disciplined routing.
- **Recommendation:** C, contingent on the commerce model. **Owner decides** because it shapes
  product surface and go-to-market.

### D-APP-02 — console actor model · Group B · joint

- **Options:** one role-driven shell (A) / two shells (B) / one shell + separate route trees per actor
  class (C).
- **Dependencies:** D-04 (claims shape), D-APP-01 (whether commerce lives here).
- **Risk:** the real risk is **permission-shaped UI leaking capability** — a security concern, not a
  layout concern. Mitigation: server-side re-check on every command (already a rule).
- **Recommendation:** C. Requires a permission matrix per actor class before implementation.

### D-FE-01 — frontend framework and host · Group C · owner

- **Options:** Next.js pinned exactly (A) / Angular 22 (B) / React+Vite SPA (C).
- **Evidence:** three of four evaluated starters fail `next build` in their prerender pipeline. A
  controlled single-variable test showed the failure **is not fixed by upgrading 16.2.10 → 16.3.7**
  and is not a Node-version issue (report §4.2). Velora builds because it uses `output: "export"` with
  complete `generateStaticParams`, not because of its version. The existing `app/` prototype is
  framework-free and RTL-first.
- **Risk:** A couples the portal to Next's data model; B discards the shadcn component ecosystem and
  the evaluated patterns; C loses SSR/SEO for the portal.
- **Recommendation:** A **with a version floor and a framework-agnostic `packages/ui`**, plus keeping
  the portal static until SEO requirements force SSR. Final choice is the owner's; a scored
  Angular comparison should be produced before closing this.
- **Blocked by nothing, blocks everything UI.**

### D-04 — identity provider · Group B · joint

- **Options:** Keycloak OIDC (A) / self-hosted `better-auth` (B) / Clerk SaaS (C).
- **Evidence:** kiranism-dashboard is **unusable offline** without Clerk keys — every route returns
  500 (frontend report §4.2). Nellavio assumes a `better-auth` server it does not ship.
- **Risk:** A operational weight (JVM); B auth security becomes ours; C data residency + per-MAU cost
  + hard vendor dependency at the perimeter.
- **Recommendation:** A or B for sovereignty. If C: budget and data-residency must be accepted
  explicitly, and a local stub provider must exist so development never blocks on a SaaS account.

### D-DB-01 — time-series/analytics · Group B · joint

- **Options:** PG+Timescale (A) / PG+ClickHouse (B) / PG+DuckDB (C).
- **Dependencies:** D-DB-02, D-PROD-01.
- **Risk:** B adds a second engine and a second operational skill before any measured need.
- **Recommendation:** A; add B only when a query-cost baseline proves it.

### D-DB-02 — gridded scientific data · Group B · joint

- **Options:** object storage + COG/STAC (A) / DB blobs (B) / filesystem share (C).
- **Dependencies:** D-17, D-INT-01.
- **Risk:** B is expensive at raster scale; C has no durability guarantees.
- **Recommendation:** A. Metadata and versions belong to `engines/hydroma/model-registry`, not to `data/`.

### D-QA-01 — test stack · Group A · agent default with veto

- **Options:** Vitest+Playwright (A) / +Pytest (B) / defer (C).
- **Recommendation:** B. The repository already has a working `node --test` scientific suite in
  `app/tests` — it proves the need for a Python/scientific layer, not only JS.
- **Constraint:** no runner is configured at root until D-GIT-01 closes (CI needs a repo).

### D-INT-01 — weather/climate sources · Group B · joint

- **Options:** open datasets only (A) / commercial (B) / mixed (C).
- **Dependencies:** D-17 (which models need which forcing).
- **Risk:** commercial licences often forbid redistribution — that would break provenance promises.
- **Recommendation:** A first; every source gets a licence + checksum record in `data/metadata`.

### D-INT-02 — payments · Group D · deferred

- **Trigger to reopen:** D-PROD-01 fixes the commerce model.
- **Risk:** high economic and compliance risk; nothing in the platform needs money movement yet.
- **Recommendation:** do not select a provider, do not integrate, do not design payout flows.

### D-17 — scientific model adoption · Group D · deferred

- **Trigger:** a domain (water balance first) has a contract, a reference dataset and a validation
  protocol.
- **Risk:** **highest technical risk in the project** — a wrong model is worse than no model.
- **Recommendation:** hybrid per domain; every adoption needs a written record (licence, version,
  calibration data, skill metrics, known failure modes). `app/tests/water-balance-validation.test.mjs`
  is the reference pattern for what "validated" must look like.

### D-DOC-01 — documentation authority · Group A · agent default with veto

- **Recommendation:** keep `architecture/` authoritative; `docs/` holds process + indexes (ADR-0001).
- **Follow-up:** add these six documents to `docs/architecture/README.md` once the owner accepts them
  (not done in this mission, which is limited to creating/updating these six files).

### D-PROD-01 — first slice / commerce model · Group C · owner

- **Options:** scientific workspace first (A) / console+organizations foundation with a thin HyDroMA
  slice (B) / marketplace first (C).
- **Risk:** C imports payments, inventory and logistics before any differentiation; A has no revenue
  story; B delays the differentiator.
- **Recommendation:** B. It reuses the existing RTL portal and the identity/organization separation,
  and it is the only slice that makes every later module cheaper.
- **This is the single most consequential decision in the list.**

### D-PROD-02 — country/currency rollout · Group D · deferred

- **Trigger:** D-PROD-01 closed.
- **Recommendation when opened:** two countries (one Persian-speaking, one Arabic-speaking) to force
  real multi-tenant/currency/calendar behaviour early.

### D-AI-01 — agent autonomy · Group D · deferred

- **Trigger:** first slice shipped with audit + approval UX.
- **Recommendation when opened:** read + draft-with-approval, cost caps, full tool-call audit.
- **Hard rule that does not wait for this decision:** no financial/wallet/token tooling for any agent.

## 4. What the agent may do now vs not

| May proceed (Group A, documented default) | May prepare (Group B) | Must wait (C/D) |
|---|---|---|
| keep monolith boundaries; document authority split; propose test stack | RTL/i18n spike, identity spike, DB sizing, data-source licence review, portal migration plan | init Git, choose framework, choose IdP, choose commerce shape, adopt models, enable agents, payments |

