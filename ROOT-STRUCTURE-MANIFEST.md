# ROOT-STRUCTURE-MANIFEST
## فهرست ساختار ریشه و وضعیت هر بخش

**Date:** 2026-11-18
**Status vocabulary:** `READY` (آماده) · `SKELETON` (اسکلت اولیه) · `NEEDS DECISION` (نیازمند تصمیم)
· `NOT IMPLEMENTED` (هنوز پیاده‌سازی‌نشده) · `PRESERVED` (موجود و دست‌نخورده)
**Rule:** a folder existing is not a capability. Everything below is a boundary record unless stated.

---

## 1. Folders created by this mission

| Path | Responsibility | Status |
|---|---|---|
| `apps/` | 5 deployable frontends + boundary rules | SKELETON |
| `apps/portal/` | public site, SEO, public discovery | SKELETON |
| `apps/console/` | authenticated shared workspace (users/orgs/experts/staff) | NEEDS DECISION (D-APP-02) |
| `apps/marketplace/` | commerce UX | NEEDS DECISION (D-APP-01) |
| `apps/tourism/` | stays/booking UX | NEEDS DECISION (D-APP-01) |
| `apps/scientific-workspace/` | HyDroMA scientist UI (scenarios, runs, provenance) | SKELETON |
| `services/` | 13 business domains, modular-monolith boundaries | SKELETON |
| `services/api-gateway` … `services/reporting` (13 dirs) | one domain each, per `services/README.md` table | SKELETON |
| `engines/` | engine boundary overview | SKELETON |
| `engines/hydroma/` | scientific engine + mandatory scientific contract | SKELETON |
| `engines/hydroma/{water,hydrology,groundwater,soil,erosion,climate,meteorology,agriculture,vegetation,remote-sensing,gis,simulation,scenarios,mrv,model-registry}` | 15 scientific domains (responsibilities in `engines/hydroma/README.md`) | SKELETON |
| `engines/ai-workforce/` | governed agent runtime + role table | SKELETON |
| `engines/ai-workforce/{analyst,administrator,manager,employees,model-gateway,agent-registry}` | 6 agent components | SKELETON |
| `packages/` (10 dirs) | shared design system, UI, i18n, clients, types, validation, config | SKELETON |
| `contracts/` (`api`, `events`, `schemas`, `scientific-models`) | the only legal coupling between domains | SKELETON |
| `databases/` (`relational`, `geospatial`, `time-series`, `analytical`, `migrations`, `seeds`) | role per store; **nothing installed** | NEEDS DECISION (D-DB-01, D-DB-02) |
| `data/` (12 zones) | raw/processed/reference/domain/fixtures/metadata separation; payloads git-ignored | READY (structure only) |
| `infrastructure/` (6 dirs) | runtime, security, monitoring, backup, deployment definitions | SKELETON |
| `workflows/` (6 dirs) | process definitions, no runtime | SKELETON |
| `integrations/` (6 dirs) | outbound adapters; vendor payloads never cross unwrapped | SKELETON |
| `tests/` (7 dirs) | unit, integration, contract, e2e, security, performance, scientific-validation | NEEDS DECISION (D-QA-01) |
| `docs/` | process and governance docs; indexes existing standards instead of duplicating | READY |
| `docs/adr/` | ADR process, template, ADR-0001 (documentation authority) | READY |
| `docs/security`, `docs/data-governance`, `docs/scientific-governance`, `docs/development` | policy scopes with cross-links | READY |
| `scripts/` | `scaffold-architecture.mjs` (idempotent skeleton generator) | READY |
| `.github/` | placeholder; **no CI configured** | NOT IMPLEMENTED (D-GIT-01, D-QA-01) |

## 2. Pre-existing folders (preserved, not modified)

| Path | What it is | Status |
|---|---|---|
| `app/` | earlier standalone demo (with `dist/`, `screenshots/`, tests) | PRESERVED — relationship to `apps/` open (D-ARC-02) |
| `architecture/` | master architecture, module catalog, decision registers, research baseline | PRESERVED — authoritative (D-DOC-01 / ADR-0001) |
| `brand/` | brand identity, tokens, design-system iterations, owner reviews | PRESERVED — not owner-approved (COLOR-01, TYPO-01…06, ID-07) |
| `eco-nojin-visual-identity-v3/` | typographic logo architecture note | PRESERVED |
| `experiments/` | `geospatial-poc/` + this mission's `frontend-foundations-run/` evidence | PRESERVED / EXTENDED (evidence only) |
| `upstream-archives/` | 10 earlier batches + new `batch-16-frontend-foundations/` | READ-ONLY evidence |
| `upstream-registry/` | 54 extracted projects + `frontend-foundations/{4 projects}` + manifests | READ-ONLY evidence (working copies for evaluation only) |
| `.kilo/`, `.vscode/` | tooling configuration | PRESERVED |

## 3. Files created or changed at root by this mission

| File | Purpose | Note |
|---|---|---|
| `README.md` | project introduction, architecture summary, status | new |
| `AGENTS.md` | permanent development rules | **appended** — existing role document preserved verbatim above the new section |
| `.gitignore` | proposed ignore rules (deps, build, secrets, archives, data payloads) | new; repository not initialised (D-GIT-01) |
| `FRONTEND-FOUNDATIONS-REPORT.md` | repository evaluation and run/build evidence | new |
| `FRONTEND-COMPARISON-MATRIX.md` | weighted comparison of the four evaluated projects | new |
| `ECONOJJIN-ARCHITECTURE-BASELINE.md` | proposed architecture baseline (filename as requested) | new |
| `ARCHITECTURE-DECISIONS-OPEN.md` | 17 owner decisions with options and risks | new |
| `UPSTREAM-FRONTEND-MANIFEST.json` | machine-readable provenance and test status | new |
| `ROOT-STRUCTURE-MANIFEST.md` | this file | new |

Untouched pre-existing root files: `DEVELOPMENT-FOUNDATION-REPORT.md`,
`ECO-NOJIN-ARCHITECTURE-CORRECTION-AND-READINESS.md`, `ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md`,
`FIRST-PRODUCT-SLICE-REPORT.md`, `INDEPENDENT-ARCHITECTURE-AND-CODE-REVIEW.md`,
`NEXT-IMPLEMENTATION-PLAN.md`, `UPSTREAM-INTEGRATION-STATUS.csv`, `firebase-debug.log` (0 bytes, pre-existing),
and `FRONTEND-UPSTREAM-CODE-ANALYSIS.md` (appeared during this mission; **not authored here**, left as-is).

## 4. Where each new evidence artefact lives

| Artefact | Location |
|---|---|
| Archives (4 ZIPs, SHA256 recorded) | `upstream-archives/batch-16-frontend-foundations/` |
| Extracted sources | `upstream-registry/frontend-foundations/` |
| Install/build/typecheck logs | `upstream-registry/frontend-foundations/_logs/` |
| Screenshots (desktop + mobile) | `experiments/frontend-foundations-run/screenshots/` |
| Interaction/console-error JSON | `experiments/frontend-foundations-run/interaction-results.json` |
| Reproduction script | `experiments/frontend-foundations-run/interaction-test.mjs` |

## 5. Deliberate deviations from the requested tree (with reasons)

| Requested | Actual | Reason |
|---|---|---|
| `docs/architecture/*` as a document set | index-only README pointing at `architecture/` | avoid two competing authorities (D-DOC-01, ADR-0001) |
| one README per `engines/hydroma/<domain>` | one authoritative table in `engines/hydroma/README.md`; directories exist | the 15 domains share one contract; 15 boilerplate files would hide it |
| one README per `packages/*`, `services/*`, etc. | one area README with a per-module table | same principle: a boundary table is auditable, duplicate boilerplate is not |
| `.github/` content | README explaining intentional absence | CI depends on D-GIT-01/D-QA-01; creating pipelines now would be out-of-scope |
| `data/*` populated | directories + policy + `.gitignore` | real/synthetic data must not be invented or committed |

## 6. Verification performed on the new structure

| Check | Result |
|---|---|
| Generator is idempotent (`node scripts/scaffold-architecture.mjs` twice) | second run reports `created: 0`, `skipped: 30` |
| No duplicate folder meanings (e.g. two `ui` roots) | no duplicates; `package/ui` is shared code, `apps/*` is UI ownership |
| No empty placeholder files created | all created files contain defined responsibility text |
| No secret/credential introduced | verified — no `.env`, key, token or credential written |
| `D:\HyDroMA` and `D:\eco_nojin` untouched | top-level `LastWriteTime` remains 2026-11-17 03:30 (before this mission) |
| Git operations | none — `D:\Nojin` is not a repository; no init, no commit, no remote |
| Existing files overwritten | none; `AGENTS.md` appended only |

## 7. What is intentionally still missing

- Any service runtime, database, schema, migration, seed, container or deployment.
- Any operational API or event contract instance.
- Any HyDroMA domain implementation or model artefact.
- Any agent runtime, tool permission or model-provider connection.
- Any CI/CD workflow.
- Any rebranded or copied third-party component.

Each of these is blocked by an entry in `ARCHITECTURE-DECISIONS-OPEN.md`.
