# Vertical-Slice Strategy

**Status:** SCAFFOLDED. The standard method for delivering capabilities end-to-end (P4). Prevents
shallow, mock-only delivery. Not every slice needs HyDroMA or external services.

## Lifecycle (12 steps)

| Step | Name | Output |
|---|---|---|
| 1 | Domain definition | domain ID + owner + responsibilities (domain registry) |
| 2 | Architecture review | boundaries + dependency check (this doc set) |
| 3 | Data model & contract | `contracts/schemas` + `contracts/api` + data model |
| 4 | Backend implementation | domain module + application/API layer |
| 5 | Persistence | schema/migration for the owning module only |
| 6 | Services / engine integration (if needed) | adapter or engine-gateway call |
| 7 | Frontend implementation | section/page consuming the real API |
| 8 | Integration | wire client → API → module → (engine) |
| 9 | Testing | unit + integration + contract |
| 10 | E2E verification | Playwright journey across the slice |
| 11 | Independent review | separate reviewer checks acceptance |
| 12 | Acceptance | recorded acceptance; maturity advanced with evidence |

## Acceptance requirements (every slice)

- Domain ownership declared.
- API contract + data contract versioned.
- Security: authn/authz + tenant scoping + audit.
- Persistence for the owning module only.
- UI (no hardcoded strings; RTL-correct; token-based).
- Tests (unit/integration/contract/e2e).
- Integration path real (no permanent mock).
- Observability: request id, logs, health.
- Documentation updated (registry + status).

## Rules

- A slice never reaches into another module's tables; cross-domain needs a contract.
- A blocked capability is labelled unavailable in the UI, never faked (`docs/BLOCKED-CAPABILITIES.md`).
- "Page exists" or "builds" ≠ "works"; acceptance requires reproducible evidence.
- Scientific slices additionally require units, model version, provenance, uncertainty, and the
  two-axis maturity (software vs scientific) kept separate.

## Related

- [architecture-roadmap.md](./architecture-roadmap.md)
- [testing-strategy.md](./testing-strategy.md)
- [component-registry.md](./component-registry.md), [domain-registry.md](./domain-registry.md)