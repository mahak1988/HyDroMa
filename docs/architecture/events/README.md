# Events & Messaging Architecture (branch index)

**Status:** SCAFFOLDED. Lightweight first; no Kafka/RabbitMQ/Redis installed. Authoritative depth:
`contracts/README.md` (events), `workflows/README.md`, module catalog (INT-EVENTS, WF-OUTBOX).

## Target

- Event envelope: name, version, producer, payload schema, idempotency key (`contracts/events`).
- Ownership: the emitting domain owns the event; consumers are idempotent.
- Delivery: prefer transactional outbox + internal dispatcher; add a broker only on measured need.
- Retry, failure handling, dead-letter, event persistence, transactional consistency documented.

## Sync vs async

- Synchronous: queries and commands needing immediate consistency.
- Asynchronous: cross-domain side effects, notifications, indexing, long-running jobs.

## Current state

- No event bus, no broker, no outbox runtime. Definitions only.

## Related

- [../data-flow.md](../data-flow.md) · [../registries/contract-registry.md](../registries/contract-registry.md)