# ADR-0011 — Optional External Environmental Data Connectors for HyDroMA

- **Status:** ACCEPTED
- **Date:** 2026-11-27
- **Deciders:** Owner (Eco Nojin) / Chief Architect
- **Related:** Phase 3.96 mission; `ARCHITECTURE-DECISIONS-OPEN.md`; ADR-0010

## Context

HyDroMA's scientific core is offline-first with an empty dependency set
(`pyproject.toml: dependencies = []`) and a boundary test
(`tests/test_boundaries.py`) that forbids HTTP/geospatial imports in core
modules. Environmental data (CHIRPS, ERA5, Sentinel-2, etc.) is needed to feed
models, but adding network code to the core would violate the offline guarantee
and the import-isolation rules. We need a way to *discover, acquire, cache,
verify, catalogue and ingest* external data without touching the core.

## Options considered

| Option | Pros | Cons | Risk |
|---|---|---|---|
| Network in core | Simple | Breaks offline-first, boundary tests, empty deps | High |
| Separate `connect` package (optional deps) | Core untouched; lazy optional libs; testable offline | Extra package; two-layer complexity | Low |
| External service only | No engine code | Duplicate catalogue/QC; no provenance in-engine | Medium |
| Manual download only | No code | No integrity/licence/provenance automation | Medium |

## Decision

Implement an **optional `hydroma.connect` package** (Phase 3.96) that is never
imported by the core. It provides: a connector framework (`base`, `registry`),
an acquisition layer (`acquisition`: policy, SSRF/path-traversal protection,
bounded retries, timeouts, size limits, lazy `httpx`), a local cache
(`cache`: deterministic keys, atomic writes, SHA-256 verification, no silent
overwrite), an artifact manifest (`artifacts`: core `DataArtifact` dict +
distinct lifecycle statuses), optional STAC discovery (`stac`), three initial
connectors (CHIRPS, ERA5/ERA5-Land distinct, Sentinel-2), and adapters to the
existing `ClimateSeries` and `item_from_data_artifact`. Optional dependencies
(`connect = ["httpx","pystac"]`, `raster = ["rasterio"]`) are declared but the
core stays `dependencies = []`. All connector tests run offline via a fake
transport; live acquisition is opt-in.

## Consequences

- Positive: core offline guarantee preserved (boundary tests green); reusable
  acquisition/cache/artifact/provenance; CHIRPS→ClimateSeries integration;
  dataset identity/version and licence retained; calibration/validation roles
  kept distinct (no auto-assignment).
- Negative: two-layer architecture; connectors are reference-grade (not full
  provider SDKs); real CDS retrieval needs optional `cdsapi`.
- Follow-up: NDVI processing pipeline (explicit, separate); more connectors;
  optional live E2E in CI with mocks; hydroma-connect distribution.

## Security & data governance

- SSRF: only HTTPS; loopback/private/link-local/metadata hosts blocked.
- Path traversal: `safe_join` confines all cache writes under the cache root.
- Credentials: read from env only; never logged, embedded, or written to
  artifacts (test-verified).
- Integrity: SHA-256 recorded + verified; incomplete downloads are not valid.
- Licence/attribution stored on the artifact; raw data preserved.
- No automatic Calibration/Validation assignment; no scientific validation.

## Rejected alternatives

- Network in core (breaks offline-first).
- Reimplementing catalogue/QC/STAC (duplication, drift).
- Unrestricted URL fetching (SSRF/abuse).