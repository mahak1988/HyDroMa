# Phase 3.96 — Optional Environmental Data Connectors & Acquisition Architecture

**Classification:** `OPTIONAL_CONNECTOR_ARCHITECTURE_COMPLETED_WITH_LIMITATIONS`
**Date:** 2026-11-27
**Repository:** `D:\NOJIN` · **Engine:** `D:\NOJIN\engines\hydroma`

## 1. Executive summary

- Reused and repaired the existing optional connector package `hydroma.connect` (stdlib-only, no network at import); restored `base.py` contracts to match connectors/tests.
- Framework: connector registry, acquisition policy/transport (lazy `httpx`), SSRF/size/time/retry controls, atomic cache with SHA-256, DataArtifact contract + status transitions, STAC parsing, adapters to `ClimateSeries`.
- Connectors: **CHIRPS** (operational, opt-in live), **ERA5/ERA5-Land** (distinct, auth-gated), **Sentinel-2** (STAC discovery, explicit NDVI only).
- Optional extras already declared: `connect=["httpx","pystac"]`, `raster=["rasterio"]`; core never imports them.
- Tests: **49 connector tests pass** (offline, fixtures); **full engine 1532 pass**; boundary tests enforce core isolation.
- Live acquisition **not performed** (opt-in disabled; no network/credentials). No scientific validation.

## 2. Baseline

HEAD `a3103061f561eb4289137b5f3362785580dfe28b`, `main`, 0 staged/deleted, 34 modified, 250 untracked; prod DB 04:55:35.

## 3. Repository integrity

No git mutations; production DB untouched; WIP preserved (connector package was pre-existing untracked work).

## 4. Architecture

External sources → optional connector → acquisition/cache → checksum → DataArtifact → Environmental Data Foundation → catalogue/QC/ingestion → scientific input mapping. Core offline.

## 5. ADR

`docs/architecture/adr/0015-optional-environmental-connectors.md`.

## 6. Connector framework

`connect/base.py`, `registry.py`, `acquisition.py`, `cache.py`, `artifacts.py`, `stac.py`, `adapters.py`, `connectors/*`.

## 7. Acquisition

HTTPS-only, blocked private/loopback hosts, max bytes/timeout/retries, atomic temp writes.

## 8. Cache

Deterministic keys, verified reuse, no silent overwrite.

## 9. DataArtifact

Existing contract + statuses; remote reference never marked local/verified.

## 10. STAC

Parses via core `hydroma.stac.Item`; assets extracted; endpoints caller-supplied.

## 11. CHIRPS

Implemented; unit/fixture/integration tested; live opt-in only.

## 12. ERA5

Implemented; ERA5 vs ERA5-Land distinct; `CDS_API_KEY` required; fixture-tested; live not performed.

## 13. Sentinel-2

Implemented STAC discovery/asset reference; NDVI explicit `compute_ndvi`; fixture-tested; live not performed.

## 14. Foundation integration

Adapters reuse `ClimateSeries` and STAC mapping; no parallel catalogue/QC.

## 15. Catalogue

Status transitions enforced.

## 16. QC

Existing QC reused; no scientific validation.

## 17. Ingestion

Existing environmental ingestion compatible.

## 18. Units

Explicit; no silent conversion.

## 19. Provenance

Source/dataset/version/checksum/acquired_at preserved.

## 20. Licence

CHIRPS CC-BY; ERA5 Copernicus; Sentinel-2 CC BY-SA.

## 21. Security

SSRF/private-host blocks, size/time/retry caps, path traversal guard, no credentials in artifacts/logs.

## 22. Tests

`pytest -k connect`: 49 pass. Full engine: 1532 pass. Boundary tests enforce core isolation.

## 23. Live acquisition evidence

**None.** Opt-in flag not enabled; no network/credentials. Fixture/integration only.

## 24. Independent review (Nemotron 3 Ultra)

Core isolation and optional deps verified; acquisition/cache/artifact/STAC/connectors sound; security controls present; no live overclaim; git/DB safe. Accept with limitations.

## 25. Scientific limitations

No calibration/validation; NDVI not auto-generated; models remain `NOT_VALIDATED`.

## 26. Remaining blockers

Live CHIRPS/ERA5/S2 acquisition requires owner authorization, network and (ERA5) credentials; raster processing optional.

## 27. Final classification

`OPTIONAL_CONNECTOR_ARCHITECTURE_COMPLETED_WITH_LIMITATIONS`

Per connector: CHIRPS implemented/unit/fixture/integration tested, live not tested; ERA5 implemented/fixture tested, live blocked (auth); Sentinel-2 implemented/fixture tested, live not tested.