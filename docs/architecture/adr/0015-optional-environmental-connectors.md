# ADR 0015 — Optional Environmental Connectors

**Status:** Accepted (software architecture; no scientific approval)
**Date:** 2026-11-27
**Scope:** `engines/hydroma/hydroma/connect`

## Context

HyDroMA's scientific core is offline, dependency-free and deterministic. Eco Nojin needs optional discovery/acquisition of environmental data (CHIRPS, ERA5, Sentinel-2) without compromising that core.

## Decision

- Keep the connector layer in `hydroma.connect`, **outside** the core.
- The core must not import `hydroma.connect`, `httpx`, `rasterio` or perform network I/O. Enforced by `tests/test_connect_boundaries.py`.
- Optional extras: `connect = ["httpx", "pystac"]`, `raster = ["rasterio"]`; HTTP and STAC do not require raster.
- Acquisition is HTTPS-only, SSRF-blocked, size/time/retry bounded, cached atomically with SHA-256 verification.
- Artifacts use the existing `hydroma.data.DataArtifact` contract and distinct statuses `DISCOVERED → REFERENCED → ACQUIRED → VERIFIED → IMPORTED → QC_REVIEWED`.
- Connectors: CHIRPS (operational), ERA5/ERA5-Land (distinct, auth-gated), Sentinel-2 (STAC discovery; NDVI explicit only).
- Live acquisition is opt-in (`NOJIN_ALLOW_LIVE_ACQUISITION=1`) and never used in CI.

## Consequences

- Core remains offline and testable without optional deps.
- Connector failures never yield a usable dataset.
- Real acquisition requires owner authorization and network; fixture tests are not live evidence.
- No scientific validation or production approval is implied.