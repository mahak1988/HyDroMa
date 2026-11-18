# contracts/ — shared contracts

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Contracts are the only legal coupling between apps, services and engines.

- `api` — HTTP/RPC surface definitions (OpenAPI/typed schemas). Speculative endpoints are
  forbidden; each operation must map to an implemented use case.
- `events` — domain event envelopes: name, version, producer, payload schema, idempotency key.
- `schemas` — canonical entity schemas shared by validation and domain types.
- `scientific-models` — model input/output contracts, units, provenance envelope, uncertainty
  descriptor, validation report shape.

Rules: version every contract; breaking changes require a new version; no contract may embed
credentials or environment secrets.

Status: skeleton. No operational API is declared yet.
