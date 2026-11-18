# databases/ — storage options

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

**Nothing is installed, provisioned or migrated in this phase.** The table records the intended
role of each store so that schema work has a target; it is not a technology approval.

| Directory | Intended role | Candidate (option, not decision) |
|---|---|---|
| `relational` | system of record: identity, org, marketplace, finance, tourism | PostgreSQL |
| `geospatial` | spatial layers, catchments, property geometry | PostGIS |
| `time-series` | weather, flow, soil moisture, sensor series | TimescaleDB or ClickHouse |
| `analytical` | read models, reporting, scenario comparisons | DuckDB / ClickHouse |
| `migrations` | ordered, reviewable schema migrations | tooling TBD (D-DB-01) |
| `seeds` | reference data and demo fixtures | separated from real data |

Open: which store owns scientific gridded data (files vs DB) — see D-DB-02.

Status: skeleton. No schema, migration or seed exists.
