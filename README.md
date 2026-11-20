# Eco Nojin

Eco Nojin is a multi-country, multi-organization platform combining a business ecosystem
(marketplace, tourism, organizations) with a scientific engine (**HyDroMA**) for water, land,
climate, agriculture and MRV work, plus a governed AI workforce.

**Current stage: frontend integrated on one origin; backend and scientific engine not implemented.**
Five product surfaces and an entry page run from a single port on demo data. Nothing is connected to
a live service, no payment exists, and no scientific result is presented as validated.

---

## What exists today

| Area | State | Notes |
|---|---|---|
| `apps/` — 8 runnable surfaces (entry, platform, portal, console, science, market, tourism, brand) | **Implemented (demo)** | one origin, one port (:5180), 130+ routes, 385 e2e tests |
| `packages/` — 13 shared packages | **Implemented** | i18n (530 keys × fa/en/ar), money, permissions, spatial, icons, scientific, auth-client |
| `archive/legacy-site/` | **Archived** | the zero-dependency prototype; its icons, engine and copy were extracted |
| `services/` — 13 business domains | **Skeleton** | boundaries documented, no implementation |
| `engines/hydroma` | **Not implemented** | the deterministic core lives in `packages/scientific` until the Python service exists |
| `engines/ai-workforce` | **Not implemented** | 6 governed roles, documents only |
| `contracts/`, `databases/`, `infrastructure/`, `workflows/`, `integrations/`, `data/` | **Empty by design** | blocked on owner decisions |
| Upstream evidence (`upstream-registry/`, 56 repos) | **Present, read-only** | licence register and manifests; nothing merged |

## Architecture at a glance

```
apps/            entry page + 7 surfaces, served from one origin (/console/, /portal/, /platform/, …)
packages/        configuration, design-system, ui, icons, i18n, frontend-core,
                 domain-types, spatial, validation, api-client, auth-client,
                 utilities, scientific
archive/         the legacy zero-dependency prototype (kept for provenance)
services/        13 business domains — boundaries only
engines/         hydroma + ai-workforce — boundaries only
contracts/       the only legal coupling: API, events, schemas, scientific models
databases/       intended store per role — nothing installed
infrastructure/  runtime, security, monitoring, deployment — nothing provisioned
tests/           7 verification layers, incl. scientific-validation
```

Key rules (full list in `AGENTS.md`):

1. A service owns its data; other domains read through `contracts/`, never through tables.
2. Engines never import services; services never import engine internals. The frontend reaches
   science through a package contract (`@eco-nojin/scientific`), never through `engines/`.
3. Every scientific result carries units, model version, data source, provenance and uncertainty.
4. Multi-tenant by default: every row is organization-scoped, every query filters by it.
5. fa/ar/en and real RTL from the first screen, not retrofitted.
6. Upstream code is evidence until reviewed; nothing is merged or rebranded without an owner decision.

## Run the frontend

```bash
npm install
npm run dev        # unified host: http://localhost:5180
npm run verify     # typecheck + lint + boundaries + tokens + unit tests + build all
npm run preview    # serve the production builds on the same port
```

See `apps/README.md` for the surface list, ports and standalone commands, and
`docs/adr/ADR-0002-single-origin-unified-shell.md` for the decision behind the single origin.

## Development status

- Node.js 24.20.0, npm 11.19.0; the repository is a Git repository on `main` with one tag.
- Quality gates are reproducible: `typecheck` 0, `oxlint` 0, boundaries 0 violations across 20
  units, tokens 0 violations across 8 targets, 309 unit tests, 385 e2e tests.
- `.github/workflows/verify.yml` runs the same gates on every push; it is the first CI this
  repository has had.
- Owner decisions still open: `D-FE-01` (framework, de-facto React), `D-04` (identity provider),
  `D-DB-01/02` (stores), `D-PROD-01` (first product slice), `D-AI-01` (agent autonomy).