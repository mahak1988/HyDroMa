# Services Architecture (branch index)

**Status:** SCAFFOLDED. 13 business domains, modular monolith first (P1). Authoritative depth:
`services/README.md`, module catalog.

## Services (responsibility / owns / not)

| Service | Responsibility | Owns | Explicitly not |
|---|---|---|---|
| api-gateway | ingress, routing, token verify, rate limit | no domain data | business rules |
| identity | credentials, sessions, MFA, federation | identity records | org membership, roles |
| organization | entities, branches, memberships, roles | org graph | user profile, credentials |
| user-management | profile, preferences, consent | user profile | auth, org roles |
| marketplace | listings, offers, orders | catalog/listing state | payments, ledger, stock |
| finance | invoices, payments, ledger, FX | financial docs, ledger | wallet/token |
| inventory | stock, lots, reservations | stock ledger | pricing, invoicing |
| tourism | properties, availability, bookings | booking state | payment capture |
| notification | templates, channels, preferences | delivery state | content authoring |
| content | pages, media metadata, localized content | content records | site rendering |
| workflow | definitions, instances, approvals | workflow state | domain decisions |
| ai-orchestration | agent queue, tool-permission, run logs | run/trace records | financial execution |
| reporting | read models, exports, scheduled reports | derived read models | source-of-truth data |

## Rules

Services own their data; no cross-service table reads; emit domain events; audit every mutation;
tenant-scoped; server-side permissions. Services must not arbitrarily access other modules' data.

## Current state

Implemented: `services/api`, `services/edi`. All 13 domains: SCAFFOLDED (boundaries only).

## Related

- [../component-registry.md](../component-registry.md) · [../dependency-map.md](../dependency-map.md)