# TECHNOLOGY-BASELINE-PROPOSAL
## پیشنهاد خط پایه فناوری برای شروع توسعه

**Date:** 2026-11-18
**Nature:** proposal only. Nothing is installed, provisioned or approved. Each row names the decision
that must close before work starts.
**Status vocabulary:** `REQUIRED` · `RECOMMENDED` · `OPTIONAL` · `NOT_APPROVED` · `DEFERRED`

---

## 0. خلاصه اجرایی (Persian summary)

- حداقلِ کافی برای شروع: **Next.js (پین‌شده) + TypeScript + Tailwind + React** برای فرانت،
  **FastAPI + PostgreSQL** برای بک‌اند، **Python علمی + PostGIS + ذخیره‌سازی شیئی** برای HyDroMA.
- سه چیز **عمداً تأیید نمی‌شود**: پرداخت/کیف پول، اتصال عامل به ابزار مالی، و میکروسرویس/Kubernetes.
- هر فناوری با شاهد (نه سلیقه) ارزیابی شده: مثلاً Next 16.1–16.2 در سه قالب build سالم نداد،
  بنابراین **پین نسخه + گیت CI اجباری** بخشی از خط پایه است، نه توصیه.
- فونت فارسی پیشنهادی: **وزیرمتن (OFL-1.1)** — مجوز بررسی شد.
- هیچ چیزی در این سند نصب یا فعال نمی‌شود.

---

## 1. Frontend

| Item | Status | Proposal | Evidence / reason | Gate |
|---|---|---|---|---|
| React | **REQUIRED** | 19.x | all four candidates are React 19; ecosystem alignment | D-FE-01 |
| Next.js | **RECOMMENDED** | **16.3.x pinned exactly**, App Router | Velora prerendered 121+ paths on 16.3.7 via `output: export`; other starters fail regardless of version — pin + gate | D-FE-01 |
| Angular | **OPTIONAL** | Angular 22 as the competing option | mature i18n (`$localize`), DI, long-term governance; must be scored before D-FE-01 | D-FE-01 |
| TypeScript | **REQUIRED** | 5.9+ strict | all four use TS; typecheck caught nothing in 3/4 but is the cheapest gate | D-FE-01 |
| Tailwind CSS | **RECOMMENDED** | v4 | all four use it; **logical-property utilities must be a lint rule** | D-FE-01 |
| UI component architecture | **REQUIRED** | own `packages/ui` on Radix primitives, copy-in model (shadcn registry style) | RTL/ i18n cannot be inherited (see RTL report) | D-FE-01 |
| Design tokens | **REQUIRED** | CSS custom properties from `brand/`, Runtime-swappable | Orbyn's customizer proves runtime token swap; `app/` already token-driven | COLOR-01 / TYPO-01..06 |
| State management | **RECOMMENDED** | TanStack Query (server state) + Zustand (local UI state) + URL state (`nuqs`) | proven combination in Nellavio/Kiranism; no global store for domain data | D-FE-01 |
| API client | **REQUIRED** | generated typed client from `contracts/api` (OpenAPI) | prevents hand-written endpoint strings | D-FE-01 |
| i18n | **REQUIRED** | `packages/i18n` with `next-intl` (or ICU) + `Intl` formatters + RTL helpers | only Nellavio had i18n, and only en/pl | D-FE-01 |
| Charts | **RECOMMENDED** | Recharts for product dashboards; keep axes LTR in RTL pages | all four use Recharts; scientific plots belong to HyDroMA output, not the browser | D-FE-01 |
| Animation | **OPTIONAL** | `motion` for portal only, CSS transitions in console; respect `prefers-reduced-motion` | Velora's motion is portal-grade, not console-grade | COLOR-01 |

## 2. Backend

| Item | Status | Proposal | Reason | Gate |
|---|---|---|---|---|
| FastAPI | **RECOMMENDED** | FastAPI + Pydantic v2 | typed contracts shared with frontend, async I/O, OpenAPI generation | D-PROD-01 |
| API gateway / BFF | **RECOMMENDED** | single FastAPI edge app per deployment (no separate gateway product) | modular monolith; a reverse proxy is infrastructure, not a service | D-ARC-01 |
| Authentication | **REQUIRED** | OIDC provider; Keycloak (self-hosted) **or** `better-auth` server | kiranism proved SaaS-lock cost; Nellavio assumes an external auth server it doesn't ship | D-04 |
| Authorization | **REQUIRED** | in-service policy layer: role + permission + tenant scope, server-side on every command | avoids premature OPA/Cedar; policy must be testable | D-APP-02 |
| Domain modules | **REQUIRED** | one package per service boundary, own schema, no cross-module table access | already the stated rule | D-ARC-01 |
| Background jobs | **RECOMMENDED** | Postgres-backed queue first (pgmq / `FOR UPDATE SKIP LOCKED`); extract only on need | one less infrastructure component at start | D-ARC-01 |
| Workflow engine | **OPTIONAL** | Temporal or Kestra behind an adapter | only when approval flows outgrow simple state machines | D-07 (carried) |
| ORM / migrations | **RECOMMENDED** | SQLAlchemy 2 + Alembic, one migration history per module | no operational migration is created now | D-DB-01 |
| API style | **RECOMMENDED** | REST + OpenAPI (no GraphQL federation) | simpler contracts; GraphQL was only Nellavio's assumption | D-FE-01 |

## 3. Scientific engine (HyDroMA)

| Item | Status | Proposal | Reason | Gate |
|---|---|---|---|---|
| Python | **REQUIRED** | 3.12 (already installed) | scientific ecosystem | D-17 |
| Numeric stack | **REQUIRED** | numpy, pandas, xarray, scipy | standard, licence-clean | D-17 |
| Geospatial processing | **REQUIRED** | rasterio, geopandas, shapely, pyproj (+ GDAL via wheels) | raster/vector operations with CRS discipline | D-17 |
| Raster/vector formats | **REQUIRED** | COG (read-optimised), GeoPackage/Parquet for vectors, NetCDF/Zarr for climate | object-storage friendly, chunked | D-DB-02 |
| Model registry | **REQUIRED** | own registry: model name, version, calibration dataset, licence, upstream commit, validation report | the seven-part scientific contract requires it | D-17 |
| Execution contracts | **REQUIRED** | versioned JSON schema: inputs, units, resolution, outputs, uncertainty, provenance | prevents "numbers without provenance" | D-17 |
| Simulation orchestration | **RECOMMENDED** | job queue + worker pool, deterministic seeds, artefact storage | heavy runs must not live in the API process | D-ARC-01 |
| Notebook-based exploration | **OPTIONAL** | Jupyter for research only, never as production runtime | reproducibility risk | D-17 |
| Scientific model adoption | **DEFERRED** | hybrid per domain after a written review | D-17 is open | D-17 |

## 4. Data

| Item | Status | Proposal | Reason | Gate |
|---|---|---|---|---|
| PostgreSQL | **REQUIRED** | 17.x, one schema per module | system of record | D-DB-01 |
| PostGIS | **REQUIRED** | same instance | spatial joins, catchments, property geometry | D-DB-01 |
| Time-series store | **RECOMMENDED** | TimescaleDB extension first; ClickHouse only on measured need | one engine, one backup story | D-DB-01 |
| Analytical store | **OPTIONAL** | DuckDB (embedded) or ClickHouse | reporting read models | D-DB-01 |
| Object storage | **REQUIRED** | S3-compatible (MinIO on-prem / SeaweedFS candidate) | rasters, scenes, artefacts | D-DB-02 |
| Scientific formats | **REQUIRED** | COG, Zarr/NetCDF, GeoParquet | see §3 | D-DB-02 |
| Cache/queue | **OPTIONAL** | Redis-compatible | only for latency, never as source of truth | D-ARC-01 |
| Search | **OPTIONAL** | Postgres FTS first; OpenSearch later | avoid a second engine early | D-PROD-01 |
| pgvector | **OPTIONAL** | for document/agent retrieval | useful for AI workforce, not before | D-AI-01 |
| Data catalogue | **RECOMMENDED** | `data/metadata` JSON + (later) STAC catalogue | provenance and licence per dataset | D-INT-01 |

## 5. AI workforce

| Item | Status | Proposal | Reason | Gate |
|---|---|---|---|---|
| Cloud model gateway | **REQUIRED (when agents start)** | single internal gateway: provider abstraction, redaction, cost accounting, rate limits | keys must never reach agents | D-AI-01 |
| Agent orchestration | **DEFERRED** | LangGraph-style state machine or custom; behind `engines/ai-workforce` | no agent is active in this phase | D-AI-01 |
| Workflow engine | **OPTIONAL** | share with §2 workflow | avoid two orchestration runtimes | D-07 |
| Durable queue | **REQUIRED (when agents start)** | same Postgres queue or Temporal | agent runs must survive restarts | D-AI-01 |
| Audit trail | **REQUIRED** | append-only run log: inputs, tool calls, outputs, approvals, cost | non-negotiable for governed agents | D-AI-01 |
| Human approval | **REQUIRED** | approval gate before any write action | autonomy level B | D-AI-01 |
| Financial tools | **NOT_APPROVED** | none, at any autonomy level | explicit prohibition | — |

## 6. Engineering

| Item | Status | Proposal | Reason | Gate |
|---|---|---|---|---|
| Unit/integration tests (JS) | **REQUIRED** | Vitest + Testing Library | Nellavio's suite shape is reusable; its 50 failures are a warning | D-QA-01 |
| E2E tests | **REQUIRED** | Playwright (installed Chrome channel works here) | the only way to catch RTL/a11y regressions like the 9999 px bug | D-QA-01 |
| Scientific tests | **REQUIRED** | Pytest + reference datasets with tolerance | `app/tests/water-balance-validation.test.mjs` is the pattern | D-QA-01 |
| Contract tests | **RECOMMENDED** | schema diff against `contracts/` in CI | prevents silent breaking changes | D-QA-01 |
| Static analysis (JS) | **REQUIRED** | ESLint flat config + `eslint-plugin-jsx-a11y`; oxlint optional for speed | 2/4 candidates had lint errors incl. React purity violations | D-QA-01 |
| Static analysis (Python) | **REQUIRED** | Ruff + mypy | cheap, fast | D-QA-01 |
| Security scanning | **REQUIRED** | `gitleaks` (secrets), `pip-audit`/`npm audit` (deps), Trivy (images) | no secret/credential ever in repo | D-GIT-01 |
| Dependency management | **REQUIRED** | lockfiles committed; Renovate/Dependabot with review; **pin Next exactly** | the build defect investigation shows version drift risk | D-GIT-01 |
| CI | **REQUIRED** | GitHub Actions: install → lint → typecheck → unit → build → e2e (smoke) | `next build` must be a day-one gate | D-GIT-01 |
| Monitoring | **RECOMMENDED** | OpenTelemetry traces + structured logs; Sentry for frontend errors | needs a deployment target first | D-ARC-01 |
| Feature flags | **OPTIONAL** | simple DB-backed flags | avoid a vendor | D-PROD-01 |
| IaC | **DEFERRED** | Terraform/Ansible once a hosting decision exists | no infrastructure now | D-ARC-01 |

## 7. Explicitly not approved in this phase

| Item | Status | Why |
|---|---|---|
| Microservices / Kubernetes | **NOT_APPROVED** | no measured need; 13 pipelines before any user value |
| Kafka / event bus product | **NOT_APPROVED** | Postgres queue + domain events suffice initially |
| Payment provider, wallet, token, ledger vendor | **NOT_APPROVED** | D-INT-02 deferred; financial features prohibited |
| Agent access to financial/execution tools | **NOT_APPROVED** | explicit mission prohibition |
| Docker / containers on the dev machine | **NOT_APPROVED** | not installed, not needed to start |
| SaaS identity provider at the perimeter | **NOT_APPROVED (default)** | allowed only if D-04 explicitly accepts vendor lock-in |
| GraphQL federation | **NOT_APPROVED** | REST + OpenAPI is the baseline |
| Blockchain / on-chain attestations | **NOT_APPROVED** | no requirement; MRV evidence is a provenance chain, not a chain ledger |
| Multi-cloud | **NOT_APPROVED** | premature |

## 8. Minimum viable baseline (what "start" actually needs)

```
Frontend    Next.js (pinned) + TS + Tailwind + packages/{design-system,ui,i18n}
Backend     FastAPI + PostgreSQL + Alembic, modular monolith
Science     Python 3.12 + xarray/rasterio + PostGIS + COG/Zarr in object storage
Engineering Git (local) + Vitest/Playwright/Pytest + CI with build gate + secret scanning
Everything else          deferred with a named decision
```

Rationale: every item above is required by at least two of the three first-slice candidates, has a
licence-clean path, and does not lock the project into a vendor that would contradict D-04, D-INT-02
or D-17.

