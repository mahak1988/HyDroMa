# Architecture Roadmap

**Status:** SCAFFOLDED, evidence-based. Stages are proposals grounded in the verified repository
state ([architecture-status.md](./architecture-status.md)). Executing a stage requires owner
authorization; this roadmap does not authorize implementation.

## Verified starting point

- Frontend: unified platform SPA + brand app, real, one origin (ADR-0010).
- Shared packages: 13, implemented.
- Backend: local API + EDI implemented; 13 domain modules scaffolded only.
- Engine: HyDroMA software-tested, scientifically NOT_VALIDATED.
- Data/DB/infra/integrations/workflows/AI: scaffolded, nothing provisioned.
- Governance: ADR-0001..0010 accepted; 20+ open decisions.

## Stage 0 — Architecture Foundation (this mission)

- Architecture scaffolding, governance, registries, system boundaries, dependency rules. **Status:
  SCAFFOLDED (this set).**

## Stage 1 — Integration Foundation

- API contracts, data architecture, IAM, organization, multi-tenancy, security, integration
  architecture. Blocked by D-04, D-DB-01/02, D-PROD-01.

## Stage 2 — Shared Infrastructure

- Storage, jobs, events, configuration, observability, audit, notification architecture. Blocked by
  D-DB-02, D-QA-01, D-INT-*.

## Stage 3 — Core Vertical Slices

- Real, complete slices (e.g. organizations + projects; marketplace catalog). Blocked by D-PROD-01,
  D-APP-01/02.

## Stage 4 — Scientific & Geospatial Integration

- Engine gateway as sole backend path, scientific data, geospatial (PostGIS/STAC/COG), data
  acquisition. Blocked by D-HYDROMA-01..06, D-17, D-INT-01.

## Stage 5 — Advanced Platform Capabilities

- AI, agents, search, analytics, automation. Blocked by D-AI-01.

## Stage 6 — Scale & Production Readiness

- Performance, resilience, security, backup/recovery, deployment, operational governance. Blocked by
  multiple decisions + measured need.

## Gaps & blockers (summary)

| Gap | Blocks | Decision |
|---|---|---|
| No backend domain module | Stage 1–3 | D-PROD-01, D-04 |
| No database/schema | Stage 1–2 | D-DB-01/02 |
| Engine not gateway-integrated | Stage 4 | D-HYDROMA-01 |
| No external integrations | Stage 4 | D-INT-01/02 |
| No agents active | Stage 5 | D-AI-01 |
| No deployment | Stage 6 | multiple |

## Risks

- Scientific over-claiming (mitigated by two-axis maturity).
- Two documentation authorities (mitigated by ADR-0001).
- Empty-skeleton theatre (mitigated by decision-gated folders).
- Vendor lock-in (mitigated by adapter pattern).

Full risk list: [../reports/architecture-scaffolding-report.md](../reports/architecture-scaffolding-report.md) §Q.