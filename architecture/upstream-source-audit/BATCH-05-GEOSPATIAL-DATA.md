# BATCH 05 — GEOSPATIAL DATA — SOURCE AUDIT
## TiTiler, PgSTAC, ODC-STAC, PySTAC

**Date:** 2026-11-17
**Mode:** READ-ONLY source-level analysis. No build, no run.

---

## 1. IITILER (`titiler-main.zip`, 72 MB, MIT)
- **Architecture:** `src/titiler/{application,core,mosaic,xarray,extensions}`. FastAPI + Rasterio/GDAL.
- **Core source:** 77 source files; 251 test files.
- **Main interfaces:** REST `/cog/tiles`, `/stac/tiles`, `/wmts`, `/tilejson.json`; OpenAPI auto-generated.
- **Capabilities:** dynamic raster tiling (COG, STAC), mosaic, preview, statistics, point queries.
- **Proven:** source present; NOT executed.
- **Runtime:** Python ≥3.11 + GDAL native libs. No DB. Stateless HTTP.
- **License:** MIT. Permissive.
- **Eco Nojin modules:** `GIS-IMAGERY`, `GIS-STAC`.
- **Mapping:** `INTEGRATION_REQUIRED` (service).
- **Risks:** public endpoint needs auth + rate limiting.

## 2. PGSTAC (`pgstac-main.zip`, 3.7 MB, MIT)
- **Architecture:** `src/pgstac` (Rust CLI + SQL), `src/pgstac-migrate`, `docker/`.
- **Core source:** 52 source files; 74 test files.
- **Main interfaces:** PostgreSQL functions (CQL2 search); `pgstac-migrate` CLI.
- **Capabilities:** STAC catalog in Postgres, spatiotemporal search, partitioning.
- **Proven:** source present; NOT executed.
- **Runtime:** **Requires PostgreSQL + PostGIS.**
- **License:** MIT. Permissive.
- **Eco Nojin modules:** `GIS-STAC`, `GIS-SEARCH`.
- **Mapping:** `INTEGRATION_REQUIRED`.
- **Risks:** dev version (0.9.11-dev); DB ops.

## 3. ODC-STAC (`odc-stac-develop.zip`, 162 KB, Apache-2.0)
- **Architecture:** `odc/` (Python). Converts STAC → Open Data Cube.
- **Core source:** 18 source files; 26 test files.
- **Main interfaces:** `odc.stac.load`, `odc.stac.configure`.
- **Capabilities:** STAC → ODC data model bridge.
- **Proven:** source present; NOT executed.
- **Runtime:** Python + Open Data Cube (Postgres) for full use.
- **License:** Apache-2.0. Permissive.
- **Eco Nojin modules:** `GIS-STAC`.
- **Mapping:** `ADAPTER_REQUIRED`.
- **Risks:** only if ODC adopted.

## 4. PYSTAC (`pystac-main.zip`, 3.4 MB, Apache-2.0)
- **Architecture:** `pystac/`, `core/`, `extensions/`, `pytest-pystac/`. Pure Python.
- **Core source:** 72 source files; 672 test files.
- **Main interfaces:** `pystac.Catalog`, `Item`, `Asset`, `Collection`.
- **Capabilities:** read/write/validate STAC catalogs and items.
- **Proven:** source present; NOT executed.
- **Runtime:** Python. No DB, no external service.
- **License:** Apache-2.0. Permissive.
- **Eco Nojin modules:** `GIS-STAC`.
- **Mapping:** `DIRECT_REUSE`.
- **Risks:** none significant.

---

## 5. BATCH SUMMARY
- 4 projects, all `EXTRACTED`, all permissive (MIT/Apache).
- **Complementary chain:** PySTAC (client) → PgSTAC (catalog DB) → ODC-STAC (analysis) → TiTiler (tile serving). No overlap.
- **Immediate safe choices:** PySTAC + TiTiler (no DB, low ops).
- **Conditional:** PgSTAC (needs Postgres), ODC-STAC (needs ODC).
- **No project approved.**