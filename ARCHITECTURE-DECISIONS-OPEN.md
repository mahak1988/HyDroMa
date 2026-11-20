# ARCHITECTURE-DECISIONS-OPEN

**Date:** 2026-11-18
**Rule:** nothing in this file is decided. Each entry lists options, trade-offs and a non-binding
recommendation. Only the project owner may close an entry; a closed entry becomes an ADR in
`docs/adr/` and is referenced here.

**Cross-reference:** pre-existing open items from earlier registers remain open and are not
renumbered — `COLOR-01`, `TYPO-01…06`, `ID-07` (brand), `D-07` (workflow engine), `D-17` (scientific
models). See `architecture/ECO-NOJIN-ARCHITECTURE-OPEN-DECISIONS.md`.

---

## D-GIT-01 — Repository initialisation and history policy

**Context:** `D:\Nojin` is **not a Git repository** (`git rev-parse` fails). There is no branch, no
commit history, no remote. The mission forbade `git init`-driven history changes and any commit.

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Keep filesystem-only for now | zero risk to existing work | no diff/rollback/blame, no CI, no review | high — accidental overwrite is unrecoverable |
| B. `git init` locally, no remote, first commit after owner review | history and review possible; archives excluded by `.gitignore` | one commit of the whole tree sets a baseline that may include unwanted artefacts | low |
| C. Init + remote on a private host | backup and collaboration | needs credentials; push forbidden without approval | medium (secret handling) |

**Advisory:** B, after the owner reviews the proposed `.gitignore`. **Blocks:** CI, ADR history,
review workflow. **Owner impact:** high.

## D-ARC-01 — Modular monolith vs early service extraction

**Context:** 13 business domains, a scientific engine, and an agent runtime.

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Modular monolith, extract later | one deploy, simple transactions, fast iteration, boundaries still provable | discipline required to keep modules isolated | low |
| B. Extract `hydroma` + `ai-orchestration` early | independent scaling/lifecycle for heavy compute | two runtimes to operate before any value | medium |
| C. Full microservices | independent scaling | 13 pipelines, distributed data problems, premature | high |

**Advisory:** A now, with `hydroma` as a separate *process boundary* (not a separate repo) when
compute demands it. **Owner impact:** medium.

## D-ARC-02 — Fate of the existing `app/` prototype

**Context:** `D:\Nojin\app\` is a pre-existing demo (with `dist/`, `screenshots/`, tests) that
predates the `apps/` structure.

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Keep as reference, never deploy | preserves work, zero cost | two frontend roots confuse contributors | low |
| B. Migrate its useful parts into `apps/portal` then archive it | one root, cleaner | migration work; must not be a silent copy | medium |
| C. Delete | cleanliness | loses work; requires owner authorisation | high |

**Advisory:** A until D-PROD-01 defines the portal; then B with an explicit migration note.
**Owner impact:** medium.

## D-APP-01 — Standalone apps vs console modules for marketplace and tourism

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Separate apps | distinct UX, SEO and performance budgets, independent release | duplicated shell, auth and i18n work | medium |
| B. Console modules | one shell, shared auth/nav, less duplication | heavy commerce UX inside an admin-like shell | medium |
| C. Hybrid: public pages in `portal`, transactional UX in `console` | best SEO + shared shell | two surfaces to keep coherent | low-medium |

**Advisory:** C is the cheapest coherent option, but this depends on the commerce model
(D-PROD-01). **Owner impact:** high.

## D-APP-02 — Scope of `console` for non-employee actors

**Context:** `console` is described as shared by users, org admins, experts and staff. Those actors
have different data visibility and different navigation needs.

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. One shell, role-driven navigation | one build, consistent design | risk of permission-shaped UI leaking capability | medium |
| B. Two shells (customer workspace / admin console) | clear separation of concerns | more work, more surface | low |
| C. One shell with separate route trees per actor class | balance | routing discipline required | low |

**Advisory:** C. **Owner impact:** medium-high.

## D-FE-01 — Frontend framework and host for the product apps

**Context:** all four evaluated starters use Next.js 16, but three cannot produce a pristine
production build with their pinned 16.1–16.2 (prerender invariant). Angular 22 is available in this
environment; the earlier foundation report did not score it.

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Next.js 16.3+ (pinned) | proven build in this environment (velora), SSR/ISR for portal, largest component ecosystem | framework-specific data layer, heavier server coupling | low-medium |
| B. Angular 22 | strong structure, DI, i18n/`$localize` maturity, long-term governance | different component ecosystem; shadcn patterns unusable | medium |
| C. React + Vite SPA (no SSR) | simplest deploy, maximum portability | no SSR/SEO for portal; splits the stack | medium |

**Advisory:** A with an explicit minimum-version pin and a portability rule (UI in `packages/*`
must not depend on host framework internals). Angular remains a legitimate candidate and deserves a
scored comparison before this is closed. Do not decide on the basis of "it is installed".
**Owner impact:** high.

## D-04 — Identity provider (carried, still open)

**Context:** candidates include self-hosted Keycloak, a self-hosted `better-auth` server (as nellavio
assumes), or a SaaS such as Clerk (as kiranism requires).

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Keycloak (OIDC) | self-hosted, standards-based, no vendor lock | JVM service to operate, heavy for UI-only start | medium |
| B. `better-auth` self-hosted | TypeScript-native, light, matches nellavio's shape | smaller ecosystem, auth security is our responsibility | medium |
| C. Clerk SaaS | fastest, orgs/billing built in | per-MAU cost, data residency, hard dependency (blocks offline dev) | high (vendor) |

**Advisory:** A or B for data sovereignty and offline development; C only if speed outweighs lock-in.
Kiranism's runtime failure without Clerk keys is concrete evidence of the cost of option C.
**Owner impact:** high.

## D-DB-01 — Time-series and analytical store selection

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. PostgreSQL + TimescaleDB only | one engine, one backup story, SQL | scaling limits for very wide scans | low |
| B. PostgreSQL + ClickHouse | excellent analytical performance | second engine, second operational skill | medium |
| C. PostgreSQL + DuckDB (embedded analytics) | zero extra server, fast local analytics | not a shared service for multi-user concurrency | low-medium |

**Advisory:** A first; add B only when measured query cost demands it. **Owner impact:** medium.

## D-DB-02 — Home of gridded scientific data

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Object storage + STAC/COG catalogues | standard for rasters, cheap, portable | needs an access layer (titiler/pgstac) | low |
| B. Database blobs | one backup boundary | poor for large rasters, expensive | medium |
| C. Filesystem share | simplest locally | no durability guarantees | high |

**Advisory:** A. **Owner impact:** medium.

## D-QA-01 — Test runner and quality gate baseline

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Vitest + Playwright | fast units, real browser e2e, one language | no scientific Python testing story | low |
| B. Vitest + Pytest + Playwright | covers TS and Python/HyDroMA | three tools, three configs | low-medium |
| C. Defer until first feature | no premature setup | quality debt starts immediately | medium |

**Advisory:** B, with the scientific layer using Pytest fixtures for reference datasets.
**Owner impact:** low.

## D-INT-01 — Weather / climate data providers

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Open datasets only (ERA5, CHIRPS, GPM, national services) | licence clarity, reproducibility | latency, coarse resolution | low |
| B. Commercial API | resolution, SLA | cost, licence restrictions on redistribution | medium |
| C. Mixed | fit per domain | two provenance paths to document | medium |

**Advisory:** A first; C when a domain proves the need. Every source needs a licence record.
**Owner impact:** medium.

## D-INT-02 — Payment provider and payout model

**Context:** explicitly out of implementation scope in this phase; the boundary exists so that no
domain invents its own money handling.

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Regional gateway(s) per country | local methods, compliance | multiple integrations | medium |
| B. Single global provider | one integration | coverage gaps, currency/fee limits | medium |
| C. Defer entirely | no risk now | blocks marketplace/tourism revenue design | low now |

**Advisory:** C until D-PROD-01 fixes the commerce model. **Owner impact:** high.

## D-17 — Adoption of scientific models from upstream (carried, still open)

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Reimplement selected methods with citations | control, testability, licence clarity | slow, risk of scientific drift | medium |
| B. Wrap upstream engines behind adapters | fidelity, speed | operational complexity, licence and version coupling | medium-high |
| C. Hybrid per domain | best fit | requires per-model review discipline | medium |

**Advisory:** C, with a written review record per model (inputs, units, validation, licence, version).
**Owner impact:** high.

## D-DOC-01 — Documentation authority (`architecture/` vs `docs/`)

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Keep `architecture/` authoritative, `docs/` = process only | no duplication, no migration risk | two locations | low |
| B. Consolidate everything into `docs/` | one tree | large migration, link churn, risk of losing nuance | medium |
| C. Freeze `architecture/` as archive, new standards in `docs/architecture` | clear timeline | a boundary date to police | medium |

**Advisory:** A now (implemented by ADR-0001). **Owner impact:** low.

## D-PROD-01 — First product slice and commerce model

**Context:** the platform spans marketplace, tourism, organizations and science. Building all five
apps first guarantees shallow delivery.

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Scientific workspace first (HyDroMA + data + MRV) | differentiator, defensible, no payment dependency | narrower revenue story | medium |
| B. Console + organizations first (B2B SaaS base) | reusable foundation for everything | later differentiation | low |
| C. Marketplace first | immediate commercial surface | payments, inventory, logistics complexity | high |

**Advisory:** B as foundation with a thin A slice in parallel. **Owner impact:** critical.

## D-PROD-02 — Multi-country / multi-currency rollout order

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. One country, one currency, one calendar first | fastest to correctness | later rework for multi-country | low |
| B. Two countries from day one (e.g. IR + one GCC) | forces real multi-tenancy/currency/i18n | slower initial delivery | medium |
| C. Global from day one | no rework | over-engineering before validation | high |

**Advisory:** B (two) is the cheapest way to prove the multi-country claim without global scope.
**Owner impact:** high.

## D-AI-01 — Agent autonomy level and approval gates

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Read-only analyst agents only | safe, immediately useful | limited value | low |
| B. Read + draft actions requiring human approval | useful and auditable | approval UX to build | low-medium |
| C. Autonomous writes within policy | scale | audit and rollback complexity | high |

**Advisory:** B, with `model-gateway` logging and cost caps from the first agent. No financial tooling
at any level in this phase. **Owner impact:** high.

---

## D-HYDROMA-01 — Scientific engine runtime boundary

**Context:** Phase 1 defines the scientific contract in TypeScript because the existing
`packages/scientific` is TypeScript and the frontend must not depend on a Python service that does
not exist yet. Phase 2 needs a Python runtime for the scientific libraries.

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. TypeScript contracts now, Python runtime in Phase 2 | no frontend coupling, incremental, testable now | two languages must keep the contract aligned | medium |
| B. Python-first engine now | one scientific runtime | blocks frontend integration until the backend exists | high |
| C. Keep everything TypeScript | no runtime split | cannot use NumPy/SciPy/rasterio/PyProj | high (scientific capability) |

**Advisory:** A, with the TypeScript contract treated as the cross-language reference and shared
fixtures/tests in Phase 2. **Owner impact:** high.

## D-HYDROMA-02 — Persistence and scientific storage

**Context:** Phase 2 needs job state, model metadata, provenance and dataset references. Large rasters
and result files must not go into SQLite.

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. SQLite + filesystem/object storage | zero services, local, reproducible, no Docker | write concurrency and durability limits | low-medium |
| B. PostgreSQL + PostGIS + object storage | concurrency, spatial SQL, RLS | service to operate before the first vertical slice | medium |
| C. Files only | simplest | no queryable job/model state, weak provenance | high |

**Advisory:** A for Phase 2, with a storage interface that can move to PostgreSQL/object storage later.
**Owner impact:** medium.

## D-HYDROMA-03 — Worker execution

**Context:** Scientific jobs must outlive an HTTP request. Docker is prohibited; Redis/Celery/RabbitMQ
would add infrastructure before a measured need.

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Independent local worker process + persisted SQLite jobs | no broker, recoverable, simple | process lifecycle and locking are our responsibility | low-medium |
| B. FastAPI BackgroundTasks | no extra process | dies with the request/process, not recoverable | high |
| C. Celery/RQ + Redis | mature queue semantics | broker, worker pool, ops cost, Docker temptation | medium |

**Advisory:** A, with persisted job state, bounded retries and a timeout. C only after measured need and
owner approval. **Owner impact:** medium.

## D-HYDROMA-04 — Maturity evidence gates

**Context:** Passing unit tests is not scientific validation. The lifecycle must not promote itself.

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Strict evidence per level (`checkPromotion`) | honest status, auditable, prevents overclaiming | requires discipline and evidence records | low |
| B. Free-form maturity field | flexible | silent overclaiming, no gate | high |
| C. Unit tests = validated | fast | scientifically false | critical |

**Advisory:** A. `tested` means software-tested; `validated` requires observational evidence and
independent review. **Owner impact:** high.

## D-HYDROMA-05 — Spatial abstraction

**Context:** Models consume rasters, vectors, grids, points and polygons. H3 is useful for some
aggregations but must not be imposed on every model.

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. Explicit CRS + optional domain kinds (raster/vector/grid/h3/point/polygon) | honest, composable, no global H3 | each model declares its domain | low |
| B. H3 everywhere | one index | wrong for hydrology/soil/remote sensing | high |
| C. GeoJSON only | simple | cannot represent rasters/grids | high |

**Advisory:** A. The scientific package must not import MapLibre; visualization is a separate concern.
**Owner impact:** medium.

## D-HYDROMA-06 — Visualization responsibilities

**Context:** MapLibre/deck.gl already exist. CesiumJS and Three.js would add large rendering engines;
they need a concrete scientific requirement.

| Option | Pros | Cons | Risk |
|---|---|---|---|
| A. MapLibre + deck.gl now; Cesium for terrain later; Three.js only for a defined 3D scene | reuse, low cost, clear boundary | 3D deferred | low |
| B. Add Cesium now | globe/terrain ready | large bundle, terrain data/licence, mobile cost | medium |
| C. Add Three.js now | custom 3D | duplicate renderer, no scientific requirement | high |

**Advisory:** A. No 3D dependency in Phase 1 or Phase 2 without an approved use case and performance budget.
**Owner impact:** medium.

---

## Status summary

| ID | Topic | Blocks | Owner impact |
|---|---|---|---|
| D-GIT-01 | repository init | CI, ADR history, reviews | high |
| D-ARC-01 | monolith vs services | service scaffolding | medium |
| D-ARC-02 | fate of `app/` | portal implementation | medium |
| D-APP-01 | marketplace/tourism app shape | those apps | high |
| D-APP-02 | console actor model | console routing and permissions UI | medium-high |
| D-FE-01 | frontend framework/host | every app | high |
| D-04 | identity provider | auth, console, all protected UX | high |
| D-DB-01 | time-series/analytics store | data platform | medium |
| D-DB-02 | gridded data home | HyDroMA data layer | medium |
| D-QA-01 | test stack | quality gates | low |
| D-INT-01 | weather/climate sources | HyDroMA inputs | medium |
| D-INT-02 | payments | marketplace/tourism revenue | high |
| D-17 | scientific model adoption | HyDroMA implementation | high |
| D-DOC-01 | doc authority | documentation process | low |
| D-PROD-01 | first slice / commerce model | roadmap | critical |
| D-PROD-02 | country/currency rollout | multi-tenant design | high |
| D-AI-01 | agent autonomy | ai-workforce implementation | high |
| D-HYDROMA-01 | scientific runtime boundary | Phase 2 Python runtime | high |
| D-HYDROMA-02 | scientific persistence/storage | Phase 2 DB and storage | medium |
| D-HYDROMA-03 | worker execution | Phase 2 job execution | medium |
| D-HYDROMA-04 | maturity evidence gates | model status and MRV | high |
| D-HYDROMA-05 | spatial abstraction | scientific inputs/outputs | medium |
| D-HYDROMA-06 | visualization responsibilities | 3D/terrain roadmap | medium |
