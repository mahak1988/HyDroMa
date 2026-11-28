# Architecture Overview — Eco Nojin

**Status:** SCAFFOLDED (documentation foundation). This file is an index and a reconciliation
record. It does not assert that any component is implemented.
**Authority:** `architecture/` is the authoritative deep-dive tree (ADR-0001). `docs/architecture/`
is the process, index and cross-cutting-map layer. Root `README.md`,
`ECONOJJIN-ARCHITECTURE-BASELINE.md` and `ARCHITECTURE-DECISIONS-OPEN.md` remain the top-level
references.

> Reading rule: a directory or a document existing is **not** a capability. Maturity vocabulary is
> defined in [architecture-status.md](./architecture-status.md).

## 1. What Eco Nojin is

A multi-country, multi-organization platform that combines:

- a **business ecosystem** (marketplace, tourism, organizations, finance, inventory),
- a **scientific engine** (**HyDroMA**) for water, land, climate, agriculture and MRV work,
- a **governed AI workforce** (agents behind an approval-gated gateway),
- a **shared frontend platform** (one origin, many sections) and shared packages.

The verified current stage is: **frontend integrated on one origin on demo/real-session data;
backend, database and scientific engine are not implemented as production infrastructure.** See
[root README](../../README.md) and [architecture-status.md](./architecture-status.md).

## 2. How this document set is organised

| Layer | Location | Role |
|---|---|---|
| Authoritative deep architecture | `architecture/` | Master architecture, module catalog (189 modules), data-domain model, security, HyDroMA, landscape, i18n, open decisions |
| Process + cross-cutting maps + registries | `docs/architecture/` | This set: overview, principles, registries, dependency/integration maps, C4, status, roadmap |
| Decision records | `docs/adr/` | Accepted ADRs (0001–0009) + template |
| Open decisions | `ARCHITECTURE-DECISIONS-OPEN.md` | Owner-owned decisions not yet closed |
| Domain boundaries (code homes) | `apps/`, `packages/`, `services/`, `engines/`, `contracts/`, `databases/`, `infrastructure/`, `integrations/`, `workflows/`, `data/`, `tests/` | Each has a boundary README |

No content is duplicated between `architecture/` and `docs/architecture/`. Where a reader needs
depth, this set links to `architecture/`.

## 3. The seven architectural principles (summary)

Full text in [architecture-principles.md](./architecture-principles.md).

1. **Modular monolith first** — one backend deploy unit with hard module boundaries; extract only on proven need.
2. **Component independence** — frontend / backend / data / engine / services / AI / integrations are separately owned.
3. **Contract-based integration** — `contracts/` is the only legal coupling.
4. **Progressive full-stack (vertical-slice) delivery** — capabilities ship as end-to-end slices.
5. **Scientific independence** — HyDroMA is reached only through an engine gateway; never embedded in the backend or frontend.
6. **Cost-conscious by default** — open source, reuse, minimal infrastructure, local-first.
7. **Security & evidence by design** — security is structural; maturity is never over-claimed.

## 4. Target vs actual (reconciliation)

The mission target tree (apps/home, portal, console, …; backend/; ai/; security/; governance/ …)
is an **organisational target**, not a relocation order. The repository already implements a
different, coherent tree. Per mission §4/§38/§45 the existing tree is **preserved** and the mapping
is documented in [target-architecture.md](./target-architecture.md). No application was moved.

## 5. Registries and maps (this set)

| Artefact | File |
|---|---|
| Component registry | [component-registry.md](./component-registry.md) |
| Domain registry | [domain-registry.md](./domain-registry.md) |
| Contract registry | [registries/contract-registry.md](./registries/contract-registry.md) |
| Integration registry | [registries/integration-registry.md](./registries/integration-registry.md) |
| Infrastructure registry | [registries/infrastructure-registry.md](./registries/infrastructure-registry.md) |
| ADR registry | [registries/adr-registry.md](./registries/adr-registry.md) |
| Dependency map | [dependency-map.md](./dependency-map.md) |
| System boundaries | [system-boundaries.md](./system-boundaries.md) |
| Integration map | [integration-map.md](./integration-map.md) |
| Data flow | [data-flow.md](./data-flow.md) |
| C4 diagrams | [c4/](./c4/README.md) |
| Architecture status | [architecture-status.md](./architecture-status.md) |
| Architecture roadmap | [architecture-roadmap.md](./architecture-roadmap.md) |

## 6. What this set does not claim

- It does not claim the platform is integrated, deployed or production-ready.
- It does not claim any scientific model is validated.
- It does not introduce infrastructure, credentials, or code.