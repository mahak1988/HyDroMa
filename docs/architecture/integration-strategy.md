# Integration Strategy

**Status:** SCAFFOLDED. How components integrate over time, contract-first and adapter-based. The
principle is P3 (contract-based) + P6 (cost-conscious). No integration is active.

## 1. Order of integration work

1. **Contracts first** — define `contracts/api`, `contracts/events`, `contracts/schemas` for the
   first vertical slice before any consumer is built.
2. **Backend API** — implement the API layer + one domain module behind the contract.
3. **Frontend consumer** — point `api-client` at the real API; remove demo data for that slice.
4. **Engine path** — for a scientific slice, wire API → engine gateway → HyDroMA.
5. **External adapter** — only when a slice needs external data, add one adapter in `integrations/`.

## 2. Rules

- A consumer depends on a contract, never on a producer's internals.
- Every contract is versioned; breaking change = new version + consumer migration.
- Adapters map vendor payloads to contracts and own auth/retry/rate-limit/health/provenance.
- No provider becomes a direct dependency of core domain logic (F7).
- Speculative endpoints are forbidden; each operation maps to an implemented use case.

## 3. Maturity gates

A connection moves PLANNED → IMPLEMENTED only with a working local path; → TESTED with contract tests;
→ VERIFIED with an independent reproduction. See [architecture-status.md](./architecture-status.md).

## 4. Related

- [integration-map.md](./integration-map.md)
- [registries/contract-registry.md](./registries/contract-registry.md)
- [registries/integration-registry.md](./registries/integration-registry.md)
- Depth: `architecture/LANDSCAPE-API-CONTRACTS.md`,
  `architecture/HYDROMA-SCIENTIFIC-ENGINE-PHASE1-IMPL-CONTRACT.md`