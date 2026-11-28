# Database Architecture (branch index)

**Status:** SCAFFOLDED. **Nothing is installed, provisioned or migrated.** Authoritative depth:
`architecture/ECO-NOJIN-DATA-DOMAIN-MODEL.md`, `databases/README.md`.

## Strategy

- System of record per role: relational (PostgreSQL candidate), geospatial (PostGIS), time-series
  (TimescaleDB/ClickHouse), analytical (DuckDB/ClickHouse). Options, not decisions (D-DB-01/02).
- One schema owner per module; cross-service reads via contracts, never tables.
- Multi-tenant by default: every row organization-scoped; every query tenant-filtered (RLS target).
- Files in object storage; only metadata + refs in DB (D-DB-02).

## Cross-cutting concerns (documented, not implemented)

Migrations (ordered, reviewable), transaction management, referential integrity, indexing, query
patterns, backup/recovery, data lifecycle/versioning, audit, integrity, quality, provenance.

## Current vs target

- Current: no DB, no schema, no migration, no seed.
- Target: PostgreSQL+PostGIS first; add time-series/analytical stores only on measured need.

## Related

- [../data-flow.md](../data-flow.md) · [../registries/infrastructure-registry.md](../registries/infrastructure-registry.md)
- `data/README.md` (zones) · `architecture/ECO-NOJIN-DATA-DOMAIN-MODEL.md`