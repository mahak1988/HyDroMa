# Eco Nojin

Eco Nojin is a multi-country, multi-organization platform combining a business ecosystem
(marketplace, tourism, organizations) with a scientific engine (**HyDroMA**) for water, land,
climate, agriculture and MRV work, plus a governed AI workforce.

**Current stage: architecture baseline + upstream evaluation. No product capability is
implemented, no technology is finally selected, and no third-party code has been merged.**

---

## What exists today

| Area | State | Notes |
|---|---|---|
| Root architecture skeleton (`apps/`, `services/`, `engines/`, `packages/`, `contracts/`, `databases/`, `data/`, `infrastructure/`, `workflows/`, `integrations/`, `tests/`, `docs/`) | **Skeleton** | boundaries defined per folder; no implementation |
| Upstream evidence (`upstream-archives/`, `upstream-registry/`) | **Present** | 54 earlier repositories + this mission's 4 frontend foundations |
| Architecture standards (`architecture/`) | **Designed** | master architecture, module catalog, open decisions |
| Brand and design system (`brand/`) | **Draft** | not owner-approved; tokens intentionally swappable |
| Prototype `app/` | **Experimental** | pre-existing demo; relationship to `apps/` is an open decision (D-ARC-02) |
| Business services, database, API | **Not implemented** | blocked on owner decisions |

## Architecture at a glance

```
apps/           5 deployable frontends (portal, console, marketplace, tourism, scientific-workspace)
services/       13 business domains, modular monolith first, extractable later
engines/        hydroma (15 scientific domains) + ai-workforce (6 governed agent roles)
packages/       shared design system, UI, i18n, clients, types, validation
contracts/      the only legal coupling: API, events, schemas, scientific-model contracts
databases/      intended store per role — nothing installed
data/           raw / processed / reference / domain / fixtures / metadata separation
infrastructure/ runtime, security, monitoring, deployment definitions — nothing provisioned
workflows/      process definitions (scientific, business, finance, marketplace, tourism, ai)
integrations/   outbound adapters — vendor payloads never cross this boundary unwrapped
tests/          7 verification layers, incl. scientific-validation
docs/           process + governance docs; indexes existing standards instead of duplicating them
```

Key rules (full list in `AGENTS.md`):

1. A service owns its data; other domains read through `contracts/`, never through tables.
2. Engines never import services; services never import engine internals.
3. Every scientific result carries units, model version, data source, provenance and uncertainty.
4. Multi-tenant by default: every row is organization-scoped, every query filters by it.
5. fa/ar/en and real RTL from the first screen, not retrofitted.
6. Upstream code is evidence until reviewed; nothing is merged or rebranded without an owner decision.

## Read next

| Document | Purpose |
|---|---|
| `ROOT-STRUCTURE-MANIFEST.md` | every root folder: responsibility and status |
| `ECONOJJIN-ARCHITECTURE-BASELINE.md` | proposed architecture baseline (filename as requested) |
| `ARCHITECTURE-DECISIONS-OPEN.md` | decisions that require the owner |
| `FRONTEND-FOUNDATIONS-REPORT.md` | this mission's repository evaluation |
| `FRONTEND-COMPARISON-MATRIX.md` | frontend comparison (RTL, i18n, backend independence, …) |
| `UPSTREAM-FRONTEND-MANIFEST.json` | machine-readable provenance for the evaluated repositories |
| `architecture/` | pre-existing master architecture and decision registers |
| `AGENTS.md` | permanent development rules for any agent working in this repository |

## Development status

- Node.js 26.13.0, npm 11.20.0, pnpm 12.18.0, Python 3.12.10 (`py -3`, no project venv), Git 2.49.0.
- `D:\Nojin` is **not yet a Git repository**; initialisation is an open decision (D-GIT-01).
- Four evaluated frontend starters install and run in their own isolated directories; see the
  frontend report for build/run results (one starter needs external authentication credentials).
