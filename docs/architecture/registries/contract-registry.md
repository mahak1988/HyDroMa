# Contract Registry

**Status:** SCAFFOLDED. Foundational registry of contracts. `contracts/` is the only legal coupling
between apps, services and engines (P3). No operational contract instance exists yet; entries below
are the intended contracts with their producers/consumers and compatibility policy.

Contract kinds (from `contracts/README.md`): `api`, `events`, `schemas`, `scientific-models`.

## Contract records

| Contract ID | Name | Kind | Producer | Consumer(s) | Version | Status | Compatibility |
|---|---|---|---|---|---|---|---|
| CT-API-CORE | Core REST/RPC surface | api | backend modules | apps, services | v0 (draft) | PLANNED | SemVer; breaking = new version |
| CT-EVT-DOMAIN | Domain event envelope | events | domain modules | workers, other modules | v0 (draft) | PLANNED | Backward-compatible; schema registry |
| CT-SCHEMA-ENTITY | Canonical entity schemas | schemas | domain owners | validation, domain-types | v0 (draft) | PLANNED | Single source; generated wrappers |
| CT-SCI-MODEL | Scientific model I/O contract | scientific-models | HyDroMA | backend gateway, frontend via client | 1.0.0 (TS ref) | IMPLEMENTED (TS) / TESTED (Py) | Units + provenance + uncertainty required |
| CT-SCI-PROV | Provenance record | scientific-models | HyDroMA | MRV, audit | 1.0.0 | IMPLEMENTED | SHA-256 canonical; schema_version |
| CT-SCI-CLIMATE | Climate series/observation | scientific-models | HyDroMA climate | ET0/soil/crop/irrigation | 1.0.0 | IMPLEMENTED | Explicit units/basis; no silent conversion |
| CT-LANDSCAPE | Landscape analysis request/result | api | backend (planned) | apps/scientific | draft | PLANNED | See architecture/LANDSCAPE-API-CONTRACTS |

## Rules

1. Every contract is versioned; a breaking change requires a new version.
2. No contract embeds credentials or environment secrets.
3. Speculative endpoints are forbidden; each operation maps to an implemented use case.
4. The TypeScript `packages/scientific` is the cross-language reference for `CT-SCI-*` until the
   Python runtime is the authority (D-HYDROMA-01); the two must be kept aligned with shared fixtures.
5. Contract tests (producer/consumer compatibility) are required before a contract is `VERIFIED`.

## Relationship to other registries

- Producers/consumers are components in [../component-registry.md](../component-registry.md).
- Domain ownership is in [../domain-registry.md](../domain-registry.md).
- The 189-module catalog records per-module allowed/forbidden dependencies that constrain which
  contracts a module may use (`architecture/ECO-NOJIN-MODULE-CATALOG.csv`).