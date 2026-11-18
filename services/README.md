# services/ — business domains

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Start as a **modular monolith**: one deployable process, hard module boundaries, one schema
owner per module. Extraction into independent services is allowed later only for a module with
a proven scaling or isolation need (see `ARCHITECTURE-DECISIONS-OPEN.md` → D-ARC-01).

Cross-cutting rules for every service:
- Owns its data; no other service reads its tables. Cross-domain reads go through contracts.
- Emits domain events from `contracts/events`; consumers are idempotent.
- Every mutating command writes an audit record (actor, org, before/after, correlation id).
- Multi-tenant: every row is scoped by organization id; every query filters by it.
- Permissions are enforced server-side; the client's role claim is never trusted alone.

| Service | Responsibility | Owns | Explicitly not |
|---|---|---|---|
| `api-gateway` | single ingress, routing, token verification, rate limits, request validation | no domain data | business rules |
| `identity` | credentials, sessions, MFA, IdP federation (adapter, D-04) | identity records, sessions | org membership, roles |
| `organization` | legal entities, branches, memberships, org roles/scopes | org graph, membership, role assignments | user profile, credentials |
| `user-management` | profile, preferences (locale, timezone, calendar), consent, lifecycle | user profile | authentication, org roles |
| `marketplace` | listings, offers, marketplace orders | catalog/listing state | payments, ledger, stock counts |
| `finance` | invoices, payments, payouts, multi-currency, tax, ledger | financial documents, ledger entries | wallet/token features (not enabled) |
| `inventory` | stock, lots, units and conversions, reservations | stock ledger | pricing, invoicing |
| `tourism` | properties, availability calendars, bookings, rate rules, policies | booking state | payment capture |
| `notification` | templates, channel delivery, preferences, dedupe | delivery state | content authoring |
| `content` | pages, media metadata, localized content (adapter to Directus if adopted) | content records | site rendering |
| `workflow` | definitions, instances, approvals, human tasks (adapter to Temporal/Kestra, D-07) | workflow state | domain decisions |
| `ai-orchestration` | agent job queue, tool-permission enforcement, run logs, cost accounting hooks | run/trace records | financial execution |
| `reporting` | read models, exports, scheduled reports | derived read models | source-of-truth data |

Status: boundaries only. No service, database, migration or API is implemented in this phase.
