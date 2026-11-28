# docs/architecture — index

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

This directory is an **index only**; it does not restate architecture content.

Read, in this order:
1. `../../ECONOJJIN-ARCHITECTURE-BASELINE.md` — proposed baseline and open boundaries.
2. `../../architecture/ECO-NOJIN-MASTER-ARCHITECTURE-V2.md` — consolidated master architecture.
3. `../../ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md` — boundary model (with corrections noted in
   `../../ECO-NOJIN-ARCHITECTURE-CORRECTION-AND-READINESS.md`).
4. `../../ROOT-STRUCTURE-MANIFEST.md` — what each root folder is for and its status.

## Consolidated architecture set (added 2026-11-24)

This directory now also hosts the cross-cutting **maps, registries and C4** that consolidate the
authoritative `architecture/` tree without duplicating it. Start at
[architecture-overview.md](./architecture-overview.md).

| Document | Covers |
|---|---|
| `architecture-overview.md` | entry point, reading order, what is/is not claimed |
| `architecture-principles.md` | 7 normative principles + dependency direction |
| `target-architecture.md` | mission target tree ↔ actual repo reconciliation (no relocation) |
| `architecture-status.md` | two-axis maturity vocabulary + verified component status |
| `component-registry.md` / `domain-registry.md` | component & domain registries |
| `registries/contract-registry.md` · `integration-registry.md` · `infrastructure-registry.md` · `adr-registry.md` | contract/integration/infrastructure/ADR registries |
| `dependency-map.md` · `system-boundaries.md` · `integration-map.md` · `data-flow.md` | cross-cutting maps |
| `c4/` | C1 context, C2 container, C3 component, deployment (Mermaid) |
| `architecture-roadmap.md` | evidence-based staged roadmap |
| `integration-strategy.md` · `vertical-slice-strategy.md` · `testing-strategy.md` | delivery strategies |
| `<branch>/README.md` | per-branch indexes (backend, database, iam, api, events, workflows, services, hydroma, data-acquisition, geospatial, storage, integrations, ai, security, audit, observability, notifications, cache, configuration, resilience, devops, i18n, search, analytics, data-governance, governance) |

These files reference `architecture/` for depth and never restate it (ADR-0001).

## Domain architecture added 2026-11-18 (in `../../architecture/`)

| Document | Covers |
|---|---|
| `INTERNATIONALIZATION-ARCHITECTURE.md` | 15-locale registry, catalogs, direction, formatting, validation gates |
| `TRANSLATION-GATEWAY-ARCHITECTURE.md` | dynamic MT service, provider adapters, cache, TM, glossary, privacy |
| `LANDSCAPE-MANAGEMENT-ARCHITECTURE.md` | Landscape Intelligence & Management domain, governance, tenancy |
| `LANDSCAPE-DOMAIN-MODEL.md` | conceptual entities, spatial/temporal rules, merge decisions |
| `LANDSCAPE-AND-HYDROMA-INTEGRATION.md` | analysis request/result contract, provenance, quality gating |
| `LANDSCAPE-API-CONTRACTS.md` | proposed i18n/landscape/village/nomadic endpoints and authz |
| `I18N-AND-LANDSCAPE-DECISIONS.md` | 16 open decisions (A/B/C/D) for these two domains |
| `HYDROMA-SCIENTIFIC-ENGINE-PHASE1-IMPL-CONTRACT.md` | Phase 1 implementation contract: model interface, registry, data/spatial/simulation contracts, API/DB/worker/visualization architecture, risks and open decisions |
