# API & Contract Architecture (branch index)

**Status:** SCAFFOLDED. `contracts/` is the only legal coupling (P3). Authoritative depth:
`contracts/README.md`, `architecture/LANDSCAPE-API-CONTRACTS.md`,
`architecture/HYDROMA-SCIENTIFIC-ENGINE-PHASE1-IMPL-CONTRACT.md`.

## Conventions (target)

- REST conventions; versioned; consistent request/response/error formats.
- Validation, pagination, filtering, sorting, idempotency, request ids, rate limiting.
- AuthN/AuthZ on every operation; contract testing before VERIFIED.

## Contract homes

| Concern | Home |
|---|---|
| API contracts | `contracts/api` + `packages/api-client` |
| Shared types | `packages/domain-types` |
| Canonical schemas | `contracts/schemas` + `packages/validation` |
| Backend surface | `backend/api` (services/api) |
| Module contracts | `backend/modules` (services/*) |
| Integration contracts | `integrations/contracts` |
| Data contracts | `data/contracts` |

## Distinction (do not merge)

API contract ≠ domain model ≠ database model ≠ frontend model. Each evolves for its own consumer.

## Current state

- No operational API contract instance; local API exists. TS `packages/scientific` is the live
  cross-language scientific contract.

## Related

- [../registries/contract-registry.md](../registries/contract-registry.md) · [../integration-strategy.md](../integration-strategy.md)