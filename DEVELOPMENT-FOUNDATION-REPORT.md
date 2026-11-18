# DEVELOPMENT FOUNDATION REPORT

**Document ID:** DEVELOPMENT-FOUNDATION-REPORT
**Version:** 1.0 (EVALUATION — NOT APPROVED)
**Date:** 2026-11-18
**Status:** Foundation readiness assessment + framework candidate evaluation. No framework is selected. No repository was created. No code was generated.
**Authority note:** This report **documents a technical basis** for framework selection, as required before any selection can be made. It **recommends** but does **not select**. Framework selection is owner decision `AUDIT-MISS-01` / work package `B1` and remains `OPEN`.

---

## 1. What "development foundation" means here

Before the first application page can be written, four things must exist:

1. **A repository** with at least one commit (rollback, diff, audit trail). — `BLOCKED` (owner act `A1`; no Git authorization).
2. **A ratified framework and rendering strategy.** — `OPEN` (`AUDIT-MISS-01` / `B1`).
3. **A single source of truth for design tokens.** — `DEFERRED` (design system v2 exists but has a token duplication defect, `F6`).
4. **An automated gate** (type-check, lint, unit, build). — `PARTIAL` (only `node --test` on the geo-measure slice runs; no project-wide gate exists).

This report establishes the *evidence* and a *documented technical basis* for items 2–4, and records precisely why 1 blocks everything.

---

## 2. Verified environment (actual evidence)

| Tool | Version | Evidence |
|---|---|---|
| Node.js | **v26.13.0** | `node --version` |
| npm | **11.20.0** | `npm --version` |
| Git | **2.49.0.windows.1** | `git --version` |
| Python | **not available** | per `experiments/geospatial-poc/EVALUATION_REPORT.md` §1 |
| Docker | **not installed / forbidden** | per evaluation report §1 |
| Browser (test) | Chrome 157 (headless) | per evaluation report §6 |
| OS | Windows (`win32`) | environment |

**Consequence for the framework decision:** the deployment target is explicitly *not container-dependent* (`D-13`, master architecture §3.2 / `ASSUMPTION` A-11). The chosen framework must run on a plain VM/PaaS Node runtime or as static output, without Docker. This is a hard evaluation criterion below.

**Network constraint observed earlier:** external throughput was severely throttled and GitLab returned HTTP 403 during the geospatial POC. Any framework scaffold that requires a large `npm install` may be slow; this favours a framework whose install footprint and postinstall are modest, and it means the evaluation is *paper-based* — no framework was installed or built here, and none is claimed to have been.

---

## 3. Actual project requirements (the evaluation basis)

These are drawn from the corpus, not invented. Each requirement is traceable.

| # | Requirement | Source | Weight rationale |
|---|---|---|---|
| R1 | **Public pages must be SEO-visible** (227-page sitemap, public website group, product/marketplace pages) | `D-035-15`, `D-016-11`, sitemap `PUB-*` | Public growth depends on indexable HTML |
| R2 | **Heavy interactive client surfaces** (2D/3D maps, WebGL, WASM raster, large datasets) | master arch §4.1/§4.6; `UI-SHELL`; Giro3D/GeoLibre POC | Must support client-only components and code-splitting |
| R3 | **RTL/LTR bilingual from day one** (fa default, en; locale-in-URL; ICU; calendar/numeral policy) | `I18N-D01..D05`, `D-035-04`, master arch §5.2 | Late i18n retrofit is expensive |
| R4 | **Three brands sharing one design system** (Eco Nojin / HyDroMA / Marketplace) | `UX-01`, `STATE-D18`, master arch §1.2 | Shared packages / monorepo needed |
| R5 | **Token-driven theming** (three themes, no hard-coded colour) | `DS-03`, `D-014-05`, roadmap B2/B4 | Framework must consume CSS variables cleanly |
| R6 | **Offline / PWA for field data collection** | A-04, `UI-OFFLINE`, `DEP-D11` | Service worker + caching support |
| R7 | **WCAG 2.2 AA** | `WEB-09`, `A11Y-D01` | Framework must not fight a11y; SSR helps first paint |
| R8 | **Good performance on low-end devices** | `D-020-05`, `PERF-*`, `D-22` client-compute limits | Bundle size and hydration cost matter |
| R9 | **Deploy on VM/PaaS without Docker (Scenario A)** | `D-13`, master arch §3.2 | Node-server or static output; no container requirement |
| R10 | **Large talent pool / maintainability** | master arch §14 (N-1, deprecation) | Avoid niche frameworks for a long-lived platform |

**Proposed evaluation weights (owner-adjustable):**

| Criterion | Weight |
|---|---:|
| R1 SEO / public rendering | 15 |
| R2 App & heavy-client viz | 15 |
| R3 i18n / RTL routing | 12 |
| R8 Performance / bundle control | 12 |
| (ecosystem breadth) | 13 |
| R9 Deploy simplicity (no Docker) | 10 |
| R10 Maintainability / hiring | 10 |
| R6 Offline / PWA | 7 |
| Learning curve / team fit | 6 |
| **Total** | **100** |

---

## 4. Framework candidates evaluated

Seven candidates were scored 1–5 per criterion (5 = best). Weighted score = Σ(weight × score) ÷ 5, on a 0–100 scale. This is an **engineering judgement aid**, not a benchmark; no candidate was installed, built, or browser-tested here.

### 4.1 Scoring matrix

| Candidate | R1 SEO | R2 App/Viz | R3 i18n | R8 Perf | Ecosystem | R9 Deploy | R10 Maintain | R6 Offline | Learning | **Weighted** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Next.js (React, App Router)** | 5 | 5 | 5 | 4 | 5 | 3 | 4 | 4 | 3 | **87.8** |
| **React Router v7 (framework mode)** | 5 | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | **84.8** |
| **Vite + React SPA** | 2 | 5 | 4 | 4 | 5 | 5 | 4 | 5 | 5 | **84.2** |
| **Nuxt (Vue 3)** | 5 | 4 | 5 | 4 | 3 | 3 | 4 | 4 | 3 | **79.6** |
| **Astro (islands)** | 5 | 2 | 4 | 5 | 3 | 5 | 4 | 4 | 4 | **78.8** |
| **SvelteKit** | 5 | 4 | 3 | 5 | 3 | 4 | 3 | 4 | 4 | **78.4** |
| **Qwik** | 4 | 4 | 3 | 5 | 2 | 4 | 2 | 3 | 2 | **67.0** |

### 4.2 Reading the result honestly

- **Next.js** wins on the *weighted* criteria because the project is genuinely hybrid: a public SEO site (R1) **and** app dashboards **and** heavy client visualization (R2), with first-class i18n routing (R3) and the largest ecosystem (so MapLibre/Giro3D/Cesium/deck-gl and data libs integrate normally). Its weakness is **deploy simplicity (R9 = 3)**: SSR wants a Node server, which is still compatible with Scenario A but is heavier than static output, and the App Router / RSC model has a learning curve.
- **React Router v7** and **Vite + React SPA** are close behind. The SPA scores *highest* on deploy simplicity, offline and learning curve, and ties on app/viz — its only real weakness is **SEO (R1 = 2)**, because a pure SPA needs prerendering/SSR added to be indexable. If the owner decides the public site can be prerendered (or that public SEO is phase-2), the SPA becomes the lowest-ops choice.
- **Nuxt** is a strong all-rounder but pulls the codebase toward Vue, which narrows the geospatial ecosystem relative to React and diverges from the React-based reference components (GeoLibre is React 19).
- **Astro** is the best *content* choice (top SEO + performance + static deploy) but is a poor fit for large app dashboards and scientific workspaces (R2 = 2).
- **SvelteKit** has the smallest client bundle (best R8) but a smaller ecosystem and talent pool for a long-lived platform (R10 = 3).
- **Qwik** scores lowest overall here (niche ecosystem, small talent pool) despite excellent raw performance.

### 4.3 Recommendation (NON-BINDING — OWNER DECIDES)

`RECOMMENDATION` **Next.js (App Router) on React** is the strongest single-framework fit for the *whole* ecosystem because it is the only candidate that is simultaneously strong on public SEO, app dashboards, heavy client viz, i18n routing and ecosystem breadth.

`RECOMMENDATION` **Fallback:** if the owner's priority is minimum operations and the public site can be statically prerendered, **Vite + React SPA** (or **React Router v7** in SPA mode) is the lower-ops path with nearly the same application capability.

`RECOMMENDATION` **Whatever is chosen:** adopt a **monorepo** with three shared packages — `design-system` (tokens), `shared-ui` (components), `shared-contracts` (generated types) — so the three brands (R4) share one implementation and the Design System boundary (Boundary 1) stays authoritative.

**This is a recommendation only.** Per `37` §7.3 and `AUDIT-MISS-01`, sending a framework from `OPEN` to `APPROVED` requires the Project Owner's explicit decision. No such decision exists.

---

## 5. Foundation readiness scorecard

| Foundation item | State | Evidence / blocker |
|---|---|---|
| Repository | **MISSING** | No `.git`; `git rev-parse` would fail; owner act `A1` + Git authorization (rules 4/7) |
| Framework decision | **OPEN** | `AUDIT-MISS-01` / `B1` — this report supplies basis, not approval |
| Token single source of truth | **DEFECT** | `tokens.css` vs `themes.css` duplication (`F6`); fix = roadmap `B2` |
| Automated gate (project-wide) | **PARTIAL** | Only `node --test` on `experiments/geospatial-poc/geo-measure/` (23/23 pass, re-verified 2026-11-18); no lint/typecheck/build config exists |
| Design system baseline | **READY (unapproved)** | `brand/eco-nojin-design-system-v2/` — 10/10 browser render checks, 0 console errors; not contrast/AT tested; colour/type/logo still owner-open |
| Scientific kernel | **IMPLEMENTED + UNIT_TESTED** | `geo-measure` 23/23; not VALIDATED |
| Upstream intake | **FROZEN** | 54 projects / 58 archives preserved and reconciled |

**Only 2 of 7 foundation items are usable today, and neither is an application.**

---

## 6. Proposed foundation gate (once repository + framework are authorized)

The first engineering gate to implement after `A1` + `B1`, per `NEXT-DEVELOPMENT-ROADMAP.md` work package `B5`, must be a single command that runs all four checks and fails the build on any error:

```
typecheck   # tsc --noEmit (or framework equivalent)
lint        # eslint / biome across app + shared packages
unit        # node --test / vitest — must include geo-measure
build       # framework production build
```

Acceptance: a fresh clone → install → the single gate passes. This does not exist yet and is **not claimed** to exist.

---

## 7. Risks in the foundation decision

| Risk | Control |
|---|---|
| Framework chosen before the repository exists (deciding on assumption) | Phase A gate: `A1` first; `B1` decided against the real repo |
| Rebuilding tokens in a new stack and drifting | `B2` (token SSOT) before `B4` (port tokens) |
| SSR/Node ops heavier than the team can run (Scenario A) | Prefer static/SPA fallback if ops capacity is the binding constraint |
| Large `npm install` under throttled network | Prefer modest-install framework; expect slow first install; do not confuse slowness with failure |
| Picking a niche framework for a 10-year platform | Weight R10 (maintainability/hiring) explicitly; owner may raise its weight |

---

## 8. Non-authorization statement

No framework was installed, scaffolded, built or tested for this report. No repository was created. No `npm install` was run. No Git command was executed. The scoring is a documented technical basis for an owner decision, not the decision itself.

**Framework: OPEN. Repository: MISSING. Foundation: NOT ESTABLISHED.**

**END OF DEVELOPMENT FOUNDATION REPORT.**