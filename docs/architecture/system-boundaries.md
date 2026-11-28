# System Boundaries

**Status:** SCAFFOLDED. Defines the boundary of the Eco Nojin system and each component's
responsibility, ownership and what it must not do. Companion to C4 system-context
([c4/system-context.md](./c4/system-context.md)).

## 1. System boundary

Eco Nojin (the system) contains: frontend apps, backend (modular monolith), database, HyDroMA engine,
services, AI workforce, integrations, storage, infrastructure. External actors and providers are
**outside** the boundary.

## 2. Component boundaries

| Component | Owns | Must not |
|---|---|---|
| Frontend (`apps/*`, `packages/*`) | Presentation, routing, client state, UX | own business logic; run science; access DB/tables; hold secrets |
| Backend (`services/*`) | Domain logic, persistence, authz, audit | read other modules' tables; embed engine internals; trust client role claims |
| Database (`databases/*`) | System of record per role | be read cross-service; store files in relational blobs (D-DB-02) |
| HyDroMA (`engines/hydroma`) | Scientific computation, provenance | import apps/services; depend on frontend; claim validation without evidence |
| Services (`services/*` domains) | One domain each | arbitrary cross-domain access; own another domain's data |
| AI workforce (`engines/ai-workforce`) | Agent runtime, tool policy | unrestricted DB/file/infra/secret/financial access; self-approval |
| Integrations (`integrations/*`) | Outbound adapters | leak vendor payloads; become core dependencies; store secrets |
| Storage (`infrastructure/storage`, `INF-STORAGE`) | Files/assets | mix data trust levels; lose provenance |
| Infrastructure (`infrastructure/*`) | Runtime/security/monitor/deploy | embed secrets in code; be non-reproducible |

## 3. Trust boundaries

- **Client → API:** untrusted input; validate + authorize every request; never trust role claims alone.
- **API → Domain:** authenticated, tenant-scoped, audited.
- **Domain → DB:** parameterized, tenant-filtered, own schema only.
- **Backend → Engine:** explicit engine gateway; validated input/output contracts.
- **System → External provider:** adapter-mediated; uniform error shape; licence + provenance recorded.
- **Agent → Tool:** allowlisted, risk-classed, logged; no raw DB tool.

## 4. Data ownership boundary

Each domain/service owns its schema. Cross-domain reads go through `contracts/` or read models
(reporting), never direct table access. Files live in object storage; only metadata + refs in DB.

## 5. Scientific boundary

HyDroMA is a separate process boundary (not necessarily a separate repo). The backend reaches it only
via an engine gateway. The frontend reaches it only via `packages/hydroma-client`. The engine never
imports application code (P5, D-HYDROMA-01).