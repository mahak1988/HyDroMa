# Architecture Principles — Eco Nojin

**Status:** SCAFFOLDED. These principles are derived from the existing authoritative material
(`architecture/ECO-NOJIN-MASTER-ARCHITECTURE-V2.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`,
`AGENTS.md`) and the accepted ADRs. They are normative for future work but do not themselves
authorize implementation.

Each principle states: **rule**, **rationale**, **enforcement**, and **evidence of current state**.

---

## P1 — Modular monolith first

- **Rule:** The backend is one deployable process with hard module boundaries and one schema owner
  per module. A module becomes a separate service only with a proven scaling/isolation need
  (owner decision, see `ARCHITECTURE-DECISIONS-OPEN.md` D-ARC-01).
- **Rationale:** 13 domains + an engine + agents do not justify 13 pipelines before any value ships.
- **Enforcement:** `services/README.md` boundary table; `scripts/check-boundaries.mjs`.
- **Current state:** `services/` is a boundary skeleton (13 domains documented, 0 implemented). The
  only implemented backend artefact is `services/api` (local API) and `services/edi` (Python EDI
  component). Not a modular monolith yet — boundary only.

## P2 — Component independence

- **Rule:** Frontend, backend, database, HyDroMA, services, AI/agents, integrations, storage and
  infrastructure are separately owned, with documented responsibilities and dependencies.
- **Rationale:** independent evolution, independent release, clear ownership.
- **Enforcement:** per-area boundary READMEs; component registry.
- **Current state:** boundaries documented across `apps/`, `packages/`, `services/`, `engines/`,
  `integrations/`, `infrastructure/`, `data/`, `tests/`.

## P3 — Contract-based integration

- **Rule:** Components communicate only through explicit, versioned contracts in `contracts/`
  (`api`, `events`, `schemas`, `scientific-models`). No arbitrary cross-component imports; no
  frontend access to private tables; no service reading another service's tables.
- **Rationale:** replace implicit coupling with auditable interfaces.
- **Enforcement:** `contracts/README.md` rules; `scripts/check-boundaries.mjs`; future contract tests.
- **Current state:** `contracts/` is a documented skeleton with no operational instance yet. The
  de-facto cross-language contract today is `packages/scientific` (TypeScript reference) mirrored by
  `engines/hydroma` (Python).

## P4 — Progressive full-stack (vertical-slice) delivery

- **Rule:** Capabilities ship as end-to-end slices (domain → contract → backend → persistence →
  services/engine → frontend → integration → tests → E2E → review → acceptance). No permanent
  mock-only frontend islands.
- **Rationale:** avoid shallow delivery across many surfaces at once.
- **Enforcement:** [vertical-slice-strategy.md](./vertical-slice-strategy.md); `docs/BLOCKED-CAPABILITIES.md`.
- **Current state:** the unified frontend is real (ADR-0010) but many sections run on demo/content
  data; blocked capabilities are labelled unavailable, never faked.

## P5 — Scientific independence

- **Rule:** HyDroMA owns scientific computation and is reached only through an engine gateway /
  documented engine interface. The backend never embeds engine internals; the frontend never imports
  `engines/` and never executes models directly. Every scientific result carries units, model
  version, data source, provenance and uncertainty.
- **Rationale:** scientific reproducibility and a clean trust boundary.
- **Enforcement:** `engines/hydroma/README.md` (two-axis maturity, provenance contract);
  `packages/scientific` TS reference; `scripts/check-boundaries.mjs`.
- **Current state:** `engines/hydroma` is a real Python package, software-`tested`, scientifically
  `NOT_VALIDATED`. The frontend reaches science via `packages/hydroma-client` against an explicit
  base URL, not by importing the engine.

## P6 — Cost-conscious by default

- **Rule:** Prefer open source, reuse of existing repository capability, lightweight/local-first
  implementations, and minimal infrastructure. No new dependency or service without a concrete need
  and (where applicable) an owner decision.
- **Rationale:** operate cheaply, stay portable, avoid premature scale.
- **Enforcement:** dependency decisions recorded in ADRs / open-decisions; bundle budget gate
  (`scripts/check-bundle-budget.mjs`).
- **Current state:** zero-dependency and low-dependency choices dominate; heavy stores
  (PostGIS/ClickHouse/Redis/Kafka) are documented options, not installed.

## P7 — Security & evidence by design

- **Rule:** Security is structural (tenancy, authz, audit, secret hygiene) and maturity is reported
  honestly. Software maturity (`stub→…→production_approved`) and scientific status
  (`UNCALIBRATED/CALIBRATED/VALIDATED/NOT_VALIDATED`) are **separate axes** and are never conflated.
- **Rationale:** prevent over-claiming; keep trust auditable.
- **Enforcement:** `architecture/ECO-NOJIN-SECURITY-AND-INFRASTRUCTURE.md`; `engines/hydroma`
  maturity model; `docs/security/`.
- **Current state:** security architecture documented; no IdP, no secrets, no audit store
  implemented. Maturity is tracked per component in the registries.

---

## Dependency direction (normative)

```
Frontend (apps/*)            → packages/* (shared) → contracts (types) → backend API
Backend API                  → application → domain modules → domain-owned contracts
Domain modules               → their own data only; cross-domain via contracts/events
Infrastructure               → implements interfaces defined by application/domain
Services                     → explicit contracts only
HyDroMA (engines/hydroma)    → engine contracts; imports nothing from apps/services
AI agents                    → approved tools via AI gateway only
External integrations        → adapters in integrations/; never a direct core dependency
Database                     → accessed only through persistence interfaces
```

Forbidden (see [dependency-map.md](./dependency-map.md) for the enforceable list): frontend→private
tables, frontend→engine internals, domain→another domain's internals, agent→bypass authorization,
provider→core domain logic, engine→frontend.