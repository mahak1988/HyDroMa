# Eco Nojin / HyDroMA

Eco Nojin is a multi-country, multi-organization platform combining a business ecosystem
(marketplace, tourism, organizations, communities) with an independent scientific engine
(**HyDroMA**) for water, land, climate, agriculture and MRV work, plus a governed AI
workforce. This repository is the unified-platform monorepo (pnpm workspace).

**Current stage (2026-11-28):** the unified platform SPA and the real API backend are
implemented and gated by CI; the HyDroMA scientific engine is implemented in Python with a
large offline regression suite; a standalone EDI service and a scientific benchmark harness
(`lab/`) exist. **Marketplace/tourism still run on demo data, no payment exists anywhere,
HIC is INACTIVE, and every scientific model is `NOT_VALIDATED`.** Capability claims follow
the four-state model in [`docs/blueprint/README.md`](docs/blueprint/README.md).

---

## What exists today

| Area | State | Notes |
|---|---|---|
| `apps/platform` — unified platform SPA (ADR-0010) | **Implemented** | public core at `/`, workspace at `/platform`; lazy sections: agriculture, communities, territory, projects, rewards/challenges, market, tourism, science, landscape/admin, landscape/field; API-backed pages; PWA basics (manifest, service worker); a11y + bundle-budget gates |
| `services/api` — real backend | **Implemented** | session auth (scrypt + one-time invite tokens), RBAC (5 roles), audit log, organization-scoped multi-tenancy, `/v1/resources`, `/v1/runs`, engine gateway + engine execution, science, STAC, transparency, `GET /v1/hic/status` (INACTIVE); persistence on `node:sqlite`; large test suite incl. tenant-isolation, rate-limit, security, cookie, cors, runs integrity |
| `engines/hydroma` — scientific engine (Python) | **Implemented (NOT_VALIDATED)** | offline core with zero dependencies; FAO-56 + Hargreaves ET0, water balance, soil water, crop water chain, irrigation, GDD/crop growth, drought (3 variants), watershed, groundwater, soil physics, carbon, SDG indicators, … ; optional `connect` package (ADR-0011) for CHIRPS/ERA5/Sentinel-2 acquisition with SSRF-safe fetching and SHA-256 verified cache |
| `services/edi` — Environmental Data Infrastructure | **Implemented (early)** | canonical data contracts v1 (JSON schema), provenance, quality validation, SQLite/Parquet storage with atomic writes and recovery, security policy |
| `lab/` — scientific benchmark harness | **Evidence-gathering** | real-data pipeline (acquire/normalize/provenance/quality/consistency/benchmark, SPI/SPEI) with benchmark results and an independent review package; validation ladder promotion is owner-gated |
| `packages/` — 13 shared packages | **Implemented** | i18n (**15 shipped locales with real copy**), ui + design tokens, icons, spatial, validation, api-client, auth-client, scientific (TS parity incl. GDD + Hargreaves ET0), configuration, utilities |
| `archive/legacy-*` | **Archived** | five legacy app trees (sources tracked, not built/served) |
| `contracts/`, `databases/`, `infrastructure/`, `workflows/`, `integrations/`, `data/` | **Boundary records** | contracts now carry the hydro-model/map-adapter/STAC-search port definitions; stores and infra remain intentionally unprovisioned |
| Upstream evidence (`upstream-registry/`, `upstream-archives/`) | **Read-only** | licence register and manifests; nothing merged |

## Architecture at a glance

```
apps/platform     one SPA served from one origin (:5180) — public core + lazy sections
packages/         configuration, ui/tokens, icons, i18n (15 locales), frontend-core,
                  domain-types, spatial, validation, api-client, auth-client,
                  utilities, scientific, app-shell, hydroma-client
services/api      real API: auth/RBAC/audit/resources/runs + engine gateway & execution,
                  science, stac, transparency (node:sqlite)
services/edi      environmental data infrastructure service (Python)
engines/hydroma   scientific computation engine (Python, offline core + optional connect)
engines/ai-workforce  governed agent roles (documents only — no runtime yet)
contracts/        the only legal coupling: API, events, schemas, scientific-model ports
lab/              scientific benchmark harness (validation evidence pipeline)
archive/          legacy prototypes kept for provenance
```

Key rules (full list in [`AGENTS.md`](AGENTS.md)):

1. A service owns its data; other domains read through `contracts/`, never through tables.
2. Engines never import services; services never import engine internals. The frontend reaches
   science through a package contract (`packages/scientific`), never through `engines/`.
3. Every scientific result carries units, model version, data source, provenance and uncertainty.
4. Multi-tenant by default: every row is organization-scoped, every query filters by it.
5. fa/ar/en and real RTL from the first screen; strings live in `packages/i18n` (15 locales).
6. Upstream code is evidence until reviewed; nothing is merged or rebranded without an owner decision.

## Run it

```bash
pnpm install --frozen-lockfile          # pnpm 12.18, Node >= 22.12
pnpm run dev        # unified host: http://localhost:5180
pnpm run verify     # typecheck → lint → boundaries → arch guardrails → tokens → apps → tests → api tests → build → bundle budget
pnpm run test:api   # services/api suite (real persistence, auth, RBAC)
pip install -e "engines/hydroma[api,test]" && pytest engines/hydroma/tests
```

CI (`.github/workflows/verify.yml`) runs the core gates + the HyDroMA regression suite on
every push to `main` and every PR. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full
gate list and the local-vs-CI distinction.

## Documentation map

| Topic | Where |
|---|---|
| Master Blueprint v1.0 (strategy, G01–G16, roadmap, slices) | [`docs/blueprint/`](docs/blueprint/) — adopted per [ADR-0012](docs/adr/ADR-0012-master-blueprint-and-repo-standardization.md) |
| Goal & roadmap status with evidence | [`docs/blueprint/GOALS-STATUS-MATRIX.md`](docs/blueprint/GOALS-STATUS-MATRIX.md), [`docs/blueprint/ROADMAP-ALIGNMENT.md`](docs/blueprint/ROADMAP-ALIGNMENT.md) |
| Decision records (ADR-0001…0012) | [`docs/adr/README.md`](docs/adr/README.md) |
| Architecture guides & registries | [`docs/architecture/`](docs/architecture/) |
| Governance scopes | [`docs/security/`](docs/security/), [`docs/data-governance/`](docs/data-governance/), [`docs/scientific-governance/`](docs/scientific-governance/) |
| Phase reports & audits | [`docs/reports/`](docs/reports/), [`docs/audits/`](docs/audits/) |

## Community & governance

- Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md) — code of conduct: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)
- Security policy: [`SECURITY.md`](SECURITY.md) (report privately; no public disclosure)
- Changelog: [`CHANGELOG.md`](CHANGELOG.md) · Editor/format conventions: [`.editorconfig`](.editorconfig)
- Issue/PR templates under [`.github/`](.github/README.md); execution tracks are tracked as
  issues labeled `blueprint-track`.
- Owner decisions still open are listed in `ARCHITECTURE-DECISIONS-OPEN.md`; accepted
  decisions live in the ADR register.

## Branches & licensing

- `main` — integrated branch (CI-gated); `develop` — kept in sync via PR.
- License: [MIT](LICENSE) · Project status `0.x` while capabilities are unverified.
