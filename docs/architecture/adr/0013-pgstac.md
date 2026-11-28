# ADR-0013 — Adopt pgSTAC for satellite/STAC data indexing

Status: Proposed
Owner: Eco Nojin

## Context
Need open-source STAC catalog and search for environmental data.

## Decision
Adopt pgSTAC as the STAC indexing layer for Eco Nojin data services.

## Consequences
- MIT license.
- PostgreSQL/PostGIS based.
- No API key or paid service required.
- Integration via `services/api` and `contracts/`.

## Risks
- Requires PostgreSQL operational setup.
- Data ingestion pipeline needed.