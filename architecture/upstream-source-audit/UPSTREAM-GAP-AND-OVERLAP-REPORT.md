# UPSTREAM GAP & OVERLAP REPORT
## Eco Nojin — Source-Level Audit of 54 Projects

**Date:** 2026-11-17
**Mode:** READ-ONLY source-level analysis. No project was built, run, or modified.
**Scope:** 54 extracted projects + RothC (unprocessed) + WRF (failed).

---

## 1. OVERLAPPING CAPABILITIES (competing projects)

| Capability area | Projects | Overlap type | Recommendation |
|---|---|---|---|
| 2D WebGL maps | maplibre-gl-js, geolibre (includes maplibre), cesium | Direct overlap | Choose **maplibre-gl-js** as core; geolibre is a workbench, not a library |
| 3D globe/terrain | cesium, giro3d, deck-gl, geolibre | Direct overlap | **cesium** (3D globe) + **giro3d** (3D terrain) + **deck-gl** (layers) — complementary, not exclusive |
| Raster tile serving | titiler, mapserver, geolibre | Overlap | **titiler** (COG/STAC) + **mapserver** (OGC WMS/WFS) — different protocols |
| STAC catalog | pystac, pgstac, odc-stac | Complementary | **pystac** (client) + **pgstac** (DB) + **odc-stac** (analysis) — no overlap |
| Climate indices | xclim, climate-indices | Direct overlap | Choose **xclim**; climate-indices is a secondary/validation engine |
| Hydrology models | wflow-jl, modflow6, swatplus, flopy, hydromt-wflow | Complementary | wflow (surface) + modflow (groundwater) + swat+ (watershed) + flopy (I/O) — no overlap |
| Crop models | aquacrop-ospy, pcse | Overlap | Choose **aquacrop-ospy** (Apache) over **pcse** (EUPL copyleft) |
| Erosion | rhem-engine-singlestorm, rhem-engine-cligen, landlab | Complementary | RHEM (event-based) + landlab (component) — different scales |
| Workflow engines | temporal, kestra, node-red | Overlap | Choose **temporal** (code-first) OR **kestra** (declarative); node-red is prototyping only |
| AI agent frameworks | langgraph, agno, flowise | Overlap | Choose **langgraph** (library); agno is alternative; flowise is low-code + EE |
| Object storage | seaweedfs, (cloud S3) | Overlap | Defer until self-hosted storage is confirmed |
| Search | opensearch, (Postgres FTS) | Overlap | Defer until Postgres FTS is proven insufficient |
| BI/dashboards | superset, grafana | Complementary | **grafana** (monitoring) + **superset** (BI) — different purposes |
| E-commerce | spree, medusa, qloapps | Overlap | Choose **spree** (BSD, multi-vendor out-of-box); qloapps rejected |
| ERP/accounting | erpnext, dolibarr | Overlap | Both GPL-3.0; defer until legal + build-vs-adopt decision |
| Survey platforms | openforis-arena, collect, collect-mobile, collect-earth-online | Overlap | **openforis-arena** (web survey) + **collect** (designer) + **collect-mobile** (Android) — complementary |

---

## 2. GAPS — Capabilities with NO suitable provider

| Gap | Needed capability | Why it's a gap | Candidate projects | Gap severity |
|---|---|---|---|---|
| G1 | Accounting (permissive, not GPL) | ERPNext/Dolibarr are GPL-3.0; no permissive full ERP in registry | None | **HIGH** — build custom or accept GPL isolation |
| G2 | Double-entry ledger (Decimal, immutable) | No registry project provides a standalone Decimal-based ledger | None (Spree has order accounting but not GL) | **HIGH** — custom build required |
| G3 | MRV carbon credit issuance | No project issues official carbon credits; MRV is custom | None | **HIGH** — custom build; HyDroMA internal ≠ credits |
| G4 | EcoCoin/HIC tokenomics | No project defines EcoCoin/HIC; openzeppelin is a library only | openzeppelin-contracts (library) | **HIGH** — owner-gated; custom |
| G5 | Hydrology (hydrology) | wflow/modflow exist but need calibration data + adapters | wflow-jl, modflow6, flopy | **MEDIUM** — adapters + data needed |
| G6 | Soil organic carbon (RothC) | RothC present but `PRESENT_UNPROCESSED` | RothC (not extracted) | **HIGH** — extraction + audit needed |
| G7 | Multi-tenant SaaS billing | No project provides multi-tenant billing | None | **MEDIUM** — custom or Medusa EE |
| G8 | Tourism booking (permissive) | QloApps is OSL-3.0 (rejected); no permissive PMS | None | **MEDIUM** — custom or QloApps isolation |
| G9 | Persian/RTL design system | No project provides RTL-first design system | None | **MEDIUM** — custom |
| G10 | Scientific data catalog (non-STAC) | STAC covers raster; no catalog for model outputs | None | **LOW** — extend pgstac/STAC |

---

## 3. OVERLAP RESOLUTION (proposed, non-binding)

| Decision | Projects | Proposed resolution | Owner decision? |
|---|---|---|---|
| 2D map engine | maplibre-gl-js vs geolibre | Adopt maplibre; geolibre as UX reference | Yes |
| 3D engine | cesium vs giro3d vs deck-gl | Adopt all three (complementary: globe/terrain/layers) | Yes |
| Climate indices | xclim vs climate-indices | Adopt xclim; defer climate-indices | Yes |
| Crop model | aquacrop-ospy vs pcse | Prefer aquacrop (Apache vs EUPL) | Yes |
| Workflow | temporal vs kestra vs node-red | Choose one (temporal or kestra); reject node-red for prod | Yes |
| AI agents | langgraph vs agno vs flowise | Adopt langgraph; agno alternative; flowise EE caution | Yes |
| E-commerce | spree vs medusa vs qloapps | Adopt spree; reject qloapps; defer medusa | Yes |
| ERP | erpnext vs dolibarr | Defer both (GPL); legal review | Yes |
| Survey | openforis-arena vs collect | Adopt arena (web) + collect (designer) | Yes |

---

## 4. CAPABILITIES WITH NO PROVIDER (summary)

The following capabilities have **no permissive, production-ready provider** in the 54-project registry:
1. **Accounting/ERP (permissive)** — only GPL-3.0 options (ERPNext, Dolibarr).
2. **Double-entry ledger (Decimal)** — no standalone ledger.
3. **MRV carbon credit issuance** — no project.
4. **EcoCoin/HIC tokenomics** — owner-gated, no project.
5. **RothC soil carbon** — unprocessed.
6. **Tourism PMS (permissive)** — only OSL-3.0 QloApps.
7. **RTL-first design system** — no project.

These are **custom development** candidates, not upstream adoption candidates.

---

## 5. LICENSE RISK SUMMARY

| Risk | Count | Projects |
|---|---:|---|
| HIGH | 8 | hydromt-wflow, erpnext, dolibarr, directus, farmos, qloapps, pcse, grafana |
| MEDIUM | 5 | swatplus, opentripplanner, medusa, flowise, novu |
| REVIEW | 1 | wps (no license) |
| LOW | 40 | all others (MIT/Apache/BSD/ISC/CC0) |

**All 8 HIGH-risk projects require legal review before any proprietary integration.** None is approved.

---

## 6. LIMITATIONS

- No project was built, run, or tested.
- No dependency-level license scan was performed (transitive licenses UNKNOWN).
- No security audit was performed.
- All recommendations are non-binding; owner decides.

**END OF GAP & OVERLAP REPORT.**