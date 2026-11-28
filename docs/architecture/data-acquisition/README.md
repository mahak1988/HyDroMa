# Data Acquisition Architecture (branch index)

**Status:** SCAFFOLDED. No data acquired, no provider connected, no credentials. Authoritative
depth: `data/README.md`, `integrations/README.md`, `architecture/…INTERNATIONALIZATION` (for units).

## Target

Provider registry + provider adapters + acquisition jobs; data source registry; provenance; metadata;
quality; validation; temporal/spatial handling; transformation; storage; failure/retry/rate-limit;
provider health; licensing + attribution.

## Future categories

Satellite · climate · meteorology · soil · water · land cover · vegetation · agricultural · geospatial
· research datasets.

## Rules

- One adapter per source (`integrations/`); vendor payload mapped to `contracts/`.
- Every dataset records checksum, licence, provenance in `data/metadata` before use.
- Real/sample/synthetic/simulated never mixed; large/confidential data not committed.
- No acquisition without an owner decision (D-INT-01) and credential procedure.

## Current state

Structure + policy only. Engine has a climate ingest pipeline (CSV/JSON → QC → model-ready) but no
network/provider ingestion.

## Related

- [../registries/integration-registry.md](../registries/integration-registry.md) · [../data-flow.md](../data-flow.md)