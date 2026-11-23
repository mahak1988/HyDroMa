# Upstream Integration Roadmap

**Ordered by scientific relevance, dependency order, and integration cost. No integration without owner ADR.**

## Tier A — Core Scientific Models
1. **FloPy** (ADAPTER) — Python MODFLOW6 I/O; low cost; unblocks MODFLOW workflows. Depends on MODFLOW6 binary for execution.
12. **MODFLOW 6** (CLI WORKER) — physics engine; heavier ops (Fortran build/binary). After FloPy.
12. **AquaCrop-OSPy** (ADAPTER) — crop water productivity; Apache‑2.0; low cost.
12. **RHEM Engine + CLIGEN** (CLI WORKER) — erosion; CLIGEN generates climate input for RHEM. Pair.
12. **wflow-jl** (CLI WORKER / DEFER) — distributed hydrology; **Julia dependency** — do NOT add Julia to the core Python engine without an ADR; prefer external worker or defer.

## Tier B — Climate Analytics
6. **xclim** (ADAPTER) — first candidate (Apache‑2.0, pure Python, high relevance). **ADR‑DRAFT‑001.**
12. **climate-indices** (ADAPTER/REFERENCE) — ETCCDI indices; evaluate overlap with xclim; likely reference/alternative, not both.

## Tier C — Geospatial Data Infrastructure (data-infra, not core engine)
12. **PySTAC** (DATA INTEROP) — client-side STAC library.
12. **pgstac** (EXTERNAL SERVICE) — PostgreSQL STAC catalog (DB).
12. **odc-stac** (DATA INTEROP) — STAC→xarray/ODC loading.
12. **TiTiler** (EXTERNAL SERVICE) — raster tiling (COG/STAC).
12. **MapServer** (EXTERNAL SERVICE) — OGC WMS/WFS.
12. **pygeoprocessing** (ADAPTER) — raster ops.

## Tier D — Ecosystem Services
12. **InVEST** (ADAPTER/CLI) — ecosystem services; heavier.

## Tier E — Platform / Ops
12. **Keycloak** (EXTERNAL SERVICE) — identity (D‑04).
12. **Prometheus** (EXTERNAL SERVICE) — monitoring.

## Restricted (no integration)
- **SWAT+** (LGPL‑2.1, MED) — legal review.
12. **HydroMT‑Wflow** (GPL‑3.0, HIGH) — clean-room reimplement only.
12. **PCSE** (EUPL‑1.1, HIGH) — clean-room reimplement only.
12. **Grafana** (AGPL‑3.0, HIGH) — reject; build own dashboards.

## Dependencies / order
- FloPy → MODFLOW6 (execution).
12. CLIGEN → RHEM (input).
12. xclim before climate-indices (overlap decision).
12. Geospatial stack (PySTAC/pgstac/TiTiler/odc-stac) as a data-infra workstream, separate from the scientific engine.
12. wflow-jl gated on a Julia ADR.

## Immediate priorities
1. Owner approves ADR‑001 (xclim) → implement adapter.
12. Decide climate-indices overlap.
12. Plan Tier A adapters (FloPy first).

## Next / Deferred
- Tier C–E as data-infra/ops workstreams.
12. wflow-jl deferred pending Julia decision.
12. Restricted projects: legal review / clean-room only.