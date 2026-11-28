# Backend Architecture (branch index)

**Status:** SCAFFOLDED. The backend is a **modular monolith** (P1): one deployable process, hard
module boundaries, one schema owner per module. This file is an index; authoritative depth is in
`architecture/ECO-NOJIN-MASTER-ARCHITECTURE-V2.md` and the module catalog.

## Layer boundaries

| Layer | Responsibility | Must not |
|---|---|---|
| API | transport, validation, auth, rate limit, request id | hold business rules |
| Application | use-case orchestration, transactions, audit | embed domain invariants |
| Domain | business rules, invariants (home of truth) | depend on API/infra details |
| Infrastructure | persistence, engine gateway, adapters, messaging | define domain policy |
| Modules | one domain each, own schema | read another module's tables |

## Module ownership & communication

- 13 modules documented in `services/README.md` (api-gateway, identity, organization,
  user-management, marketplace, finance, inventory, tourism, notification, content, workflow,
  ai-orchestration, reporting).
- Cross-module only via `contracts/` or domain events; consumers idempotent.
- Every mutating command writes an audit record; every row is tenant-scoped.

## Current state

- Implemented: `services/api` (local API), `services/edi` (Python EDI). 13 domain modules: SCAFFOLDED.
- No modular monolith process yet; boundary only.

## Related

- [../component-registry.md](../component-registry.md) · [../domain-registry.md](../domain-registry.md)
- [../c4/component-diagram.md](../c4/component-diagram.md) · `architecture/ECO-NOJIN-MODULE-CATALOG.csv`