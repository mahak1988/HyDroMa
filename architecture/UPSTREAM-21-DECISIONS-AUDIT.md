# UPSTREAM 21 DECISIONS AUDIT
## Independent Review of the 21 Changed Decisions Between V1 and V2 Matrices

**Date:** 2026-11-17
**Mode:** READ-ONLY. No matrix was modified. No upstream project was installed, run, or merged.
**Inputs:**
- `ECO-NOJIN-UPSTREAM-DECISION-MATRIX.csv` (V1, 54 projects × 13 cols)
- `ECO-NOJIN-UPSTREAM-DECISION-MATRIX-V2.csv` (V2, 54 projects × 18 cols)
- `FINAL-UPSTREAM-CAPABILITY-MATRIX.csv` and `FINAL-UPSTREAM-REGISTRY.md` (registry evidence)

**Method:** All 54 projects compared side-by-side. For the 21 with a changed `decision`, each is independently re-evaluated against: required Eco Nojin capability, actual project evidence, technical dependencies, license risk, maintenance/customization cost, and the provable reason for the change. Recommendations are **non-binding** and use the 7-value status list.

**Key principle honored:** `INTEGRATE` is **not** issued merely to increase the usable-project count. The independent posture below is deliberately **more conservative than V2** (which issued 19 INTEGRATE).

---

## 1. SIDE-BY-SIDE COMPARISON — ALL 54 PROJECTS

| # | Project | V1 decision | V2 decision | Changed? |
|---|---|---|---|---|
| 1 | geolibre | UPSTREAM_CUSTOMIZE | DEFER | **YES** |
| 2 | giro3d | INTEGRATE | UPSTREAM_ADOPT | **YES** |
| 3 | wflow-jl | UPSTREAM_ADOPT | INTEGRATE | **YES** |
| 4 | hydromt-wflow | DEFER | DEFER | no |
| 5 | modflow6 | UPSTREAM_ADOPT | INTEGRATE | **YES** |
| 6 | landlab | DEFER | INTEGRATE | **YES** |
| 7 | aquacrop-ospy | INTEGRATE | INTEGRATE | no |
| 8 | xclim | UPSTREAM_ADOPT | UPSTREAM_ADOPT | no |
| 9 | climate-indices | DEFER | INTEGRATE | **YES** |
| 10 | swatplus | INTEGRATE | INTEGRATE | no |
| 11 | cesium | INTEGRATE | UPSTREAM_ADOPT | **YES** |
| 12 | deck-gl | INTEGRATE | UPSTREAM_ADOPT | **YES** |
| 13 | maplibre-gl-js | UPSTREAM_ADOPT | UPSTREAM_ADOPT | no |
| 14 | titiler | UPSTREAM_ADOPT | INTEGRATE | **YES** |
| 15 | pgstac | UPSTREAM_ADOPT | INTEGRATE | **YES** |
| 16 | odc-stac | DEFER | DEFER | no |
| 17 | pystac | UPSTREAM_ADOPT | UPSTREAM_ADOPT | no |
| 18 | erpnext | DEFER | DEFER | no |
| 19 | dolibarr | DEFER | DEFER | no |
| 20 | medusa | DEFER | DEFER | no |
| 21 | directus | REJECT | REJECT | no |
| 22 | opentripplanner | DEFER | INTEGRATE | **YES** |
| 23 | keycloak | UPSTREAM_ADOPT | UPSTREAM_ADOPT | no |
| 24 | temporal | INTEGRATE | DEFER | **YES** |
| 25 | kestra | DEFER | DEFER | no |
| 26 | node-red | REJECT | REJECT | no |
| 27 | langgraph | INTEGRATE | UPSTREAM_ADOPT | **YES** |
| 28 | agno | DEFER | DEFER | no |
| 29 | flowise | DEFER | DEFER | no |
| 30 | openzeppelin-contracts | DEFER | DEFER | no |
| 31 | farmos | DEFER | DEFER | no |
| 32 | openforis-arena | DEFER | INTEGRATE | **YES** |
| 33 | collect-earth | DEFER | DEFER | no |
| 34 | sepal | DEFER | DEFER | no |
| 35 | qloapps | REJECT | REJECT | no |
| 36 | spree | UPSTREAM_CUSTOMIZE | INTEGRATE | **YES** |
| 37 | novu | DEFER | INTEGRATE | **YES** |
| 38 | collect-earth-online | DEFER | DEFER | no |
| 39 | collect-mobile | DEFER | INTEGRATE | **YES** |
| 40 | collect | DEFER | DEFER | no |
| 41 | mapserver | DEFER | INTEGRATE | **YES** |
| 42 | wps | DEFER | DEFER | no |
| 43 | rhem-engine-singlestorm | INTEGRATE | INTEGRATE | no |
| 44 | rhem-engine-cligen | INTEGRATE | INTEGRATE | no |
| 45 | pcse | DEFER | DEFER | no |
| 46 | grafana | DEFER | DEFER | no |
| 47 | opentelemetry-collector | UPSTREAM_ADOPT | UPSTREAM_ADOPT | no |
| 48 | prometheus | UPSTREAM_ADOPT | UPSTREAM_ADOPT | no |
| 49 | superset | DEFER | DEFER | no |
| 50 | opensearch | DEFER | INTEGRATE | **YES** |
| 51 | seaweedfs | DEFER | INTEGRATE | **YES** |
| 52 | pygeoprocessing | UPSTREAM_ADOPT | UPSTREAM_ADOPT | no |
| 53 | invest | DEFER | INTEGRATE | **YES** |
| 54 | flopy | UPSTREAM_ADOPT | UPSTREAM_ADOPT | no |

**Totals:** 54 projects · 21 changed · 33 unchanged.

---

## 2. THE 21 CHANGED DECISIONS — DETAILED AUDIT

### 2.1 geolibre — V1 `UPSTREAM_CUSTOMIZE` → V2 `DEFER`
| Field | Value |
|---|---|
| Version in archive | 3.7.0 (V2) |
| Required capability | Geospatial Dashboard; Scientific Dashboard |
| Actual evidence | Full GIS workbench (2D/3D + raster analysis); heavy bundle (Cesium+deck.gl+DuckDB-WASM) |
| Technical deps | Cesium, deck.gl, DuckDB-WASM; WebGL; high ops |
| License | MIT (low risk) |
| Maintenance/customization cost | High — large monorepo; customizing UI to a design system is costly |
| Provable reason for change | V2: "too heavy as platform base; keep as UX reference only" — consistent with the registry's "heavy" assessment |
| **Independent recommendation** | **DEFER** — agree with V2. Adopt the components (MapLibre/deck.gl/Cesium) individually; do not adopt the whole workbench. |

### 2.2 giro3d — V1 `INTEGRATE` → V2 `UPSTREAM_ADOPT`
| Field | Value |
|---|---|
| Version | 2.0.7 |
| Required capability | 3D Terrain; 3D Globe |
| Actual evidence | Clean 3D rendering library (three.js), 939 tests passed, MIT |
| Technical deps | three.js; WebGL2; client-side only |
| License | MIT (low risk) |
| Maintenance/customization cost | Low — library-level integration |
| Provable reason | V2: "lighter than Cesium for 3D terrain cases; library-level integration" — supported by the verified 939-test pass |
| **Independent recommendation** | **ADOPT_CANDIDATE** — agree with V2. Clean, tested, MIT, low risk. |

### 2.3 wflow-jl — V1 `UPSTREAM_ADOPT` → V2 `INTEGRATE`
| Field | Value |
|---|---|
| Version | 1.0.4 |
| Required capability | Hydrology; Surface Water |
| Actual evidence | Distributed hydrological model (Julia), MIT |
| Technical deps | Julia runtime (adds ops diversity) |
| License | MIT (low risk) |
| Maintenance/customization cost | Medium — Julia runtime; needs calibration |
| Provable reason | V2: "core hydrology candidate via adapter; permissive license" — INTEGRATE (via adapter) is more accurate than ADOPT because it needs a model adapter |
| **Independent recommendation** | **INTEGRATE_CANDIDATE** — agree with V2. INTEGRATE via adapter is the correct posture. |

### 2.4 modflow6 — V1 `UPSTREAM_ADOPT` → V2 `INTEGRATE`
| Field | Value |
|---|---|
| Version | 6.8.1 |
| Required capability | Groundwater |
| Actual evidence | MODFLOW groundwater flow model (Fortran), CC0-1.0 public domain |
| Technical deps | Fortran; pairs with FloPy |
| License | CC0-1.0 (lowest risk) |
| Maintenance/customization cost | Medium — needs hydrogeological conceptual model |
| Provable reason | V2: "public domain; standard groundwater engine; pair with FloPy" — INTEGRATE via FloPy adapter is accurate |
| **Independent recommendation** | **INTEGRATE_CANDIDATE** — agree with V2. |

### 2.5 landlab — V1 `DEFER` → V2 `INTEGRATE`
| Field | Value |
|---|---|
| Version | 2.11.0 |
| Required capability | Land Degradation; Soil Erosion |
| Actual evidence | Component-based geomorph library (Python/C++), MIT — **not a turnkey model** |
| Technical deps | Python + C++ |
| License | MIT (low risk) |
| Maintenance/customization cost | Medium — component-based; requires scientific assembly |
| Provable reason | V2: "useful for erosion and landscape scenarios" — but V2's own warning says "component-based; not a turnkey model" |
| **Independent recommendation** | **DEFER** — disagree with V2. It is a component library, not a turnkey model; defer until erosion modeling is a confirmed, resourced need. |

### 2.6 climate-indices — V1 `DEFER` → V2 `INTEGRATE`
| Field | Value |
|---|---|
| Version | 3.0.0 |
| Required capability | Climate and Meteorology |
| Actual evidence | ETCCDI climate indices (Python/Rust), BSD-3-Clause; **overlaps xclim** |
| Technical deps | Python + Rust |
| License | BSD-3-Clause (low risk) |
| Maintenance/customization cost | Low — but duplicates xclim |
| Provable reason | V2: "secondary or validation engine for drought indices" — but V2's own warning says "overlaps xclim; avoid divergence" |
| **Independent recommendation** | **DEFER** — agree with V1. Adding a second climate-indices engine creates divergence risk; xclim already covers this. |

### 2.7 cesium — V1 `INTEGRATE` → V2 `UPSTREAM_ADOPT`
| Field | Value |
|---|---|
| Version | 1.147.0 |
| Required capability | 3D Globe; Terrain Visualization |
| Actual evidence | Standard 3D globe engine (Apache-2.0); Cesium ion is a separate optional paid service |
| Technical deps | Cesium; optional Cesium ion (paid) |
| License | Apache-2.0 (low risk) — **ion is separate commercial terms** |
| Maintenance/customization cost | High — heavy; ion adds cost if used |
| Provable reason | V2: "standard for 3D globe when required" — ADOPT (library) is more accurate than INTEGRATE (service) |
| **Independent recommendation** | **ADOPT_CANDIDATE** — agree with V2. Code is Apache-2.0; use without ion. |

### 2.8 deck-gl — V1 `INTEGRATE` → V2 `UPSTREAM_ADOPT`
| Field | Value |
|---|---|
| Version | 9.4.0 |
| Required capability | 2D/3D Visualization; Data Layers |
| Actual evidence | WebGL layer-rendering library (MIT); complements MapLibre |
| Technical deps | deck.gl; GPU/WebGL |
| License | MIT (low risk) |
| Maintenance/customization cost | Medium — GPU layers |
| Provable reason | V2: "GPU layers for large datasets; complements MapLibre" — ADOPT (library) is accurate |
| **Independent recommendation** | **ADOPT_CANDIDATE** — agree with V2. |

### 2.9 titiler — V1 `UPSTREAM_ADOPT` → V2 `INTEGRATE`
| Field | Value |
|---|---|
| Version | 2.4.1 |
| Required capability | Raster Serving; COG tiles |
| Actual evidence | Dynamic tile server (FastAPI+GDAL), MIT; stateless HTTP service |
| Technical deps | GDAL native libs; Python |
| License | MIT (low risk) |
| Maintenance/customization cost | Low — small footprint |
| Provable reason | V2: "smallest operational footprint for raster tiles" — INTEGRATE (service) is more accurate than ADOPT (library) |
| **Independent recommendation** | **INTEGRATE_CANDIDATE** — agree with V2. It is a service to integrate, not a library. |

### 2.10 pgstac — V1 `UPSTREAM_ADOPT` → V2 `INTEGRATE`
| Field | Value |
|---|---|
| Version | 0.9.11-dev (dev version) |
| Required capability | STAC Catalog; Geospatial Search |
| Actual evidence | PostgreSQL schema + Rust CLI for STAC catalog; MIT; **requires Postgres+PostGIS** |
| Technical deps | PostgreSQL + PostGIS; Rust |
| License | MIT (low risk) |
| Maintenance/customization cost | Medium — DB administration |
| Provable reason | V2: "conditional when a self-hosted STAC catalog is required" — conditional, dev version |
| **Independent recommendation** | **DEFER** — disagree with V2's INTEGRATE. It is conditional (only if self-hosted catalog is confirmed) and is a **dev version (0.9.11-dev)**; defer until the catalog requirement is confirmed. |

### 2.11 opentripplanner — V1 `DEFER` → V2 `INTEGRATE`
| Field | Value |
|---|---|
| Version | 2.10.0 |
| Required capability | Route Planning; Tourism |
| Actual evidence | Multimodal journey planner (Java), LGPL-3.0; heavy; needs GTFS/OSM data prep |
| Technical deps | Java; GTFS/OSM data |
| License | LGPL-3.0 (medium risk — weak copyleft) |
| Maintenance/customization cost | High — Java + data preparation |
| Provable reason | V2: "conditional on tourism route value; run as separate service" — conditional |
| **Independent recommendation** | **DEFER** — agree with V1. LGPL + heavy Java + data prep; only if routing is a confirmed core need. V2's INTEGRATE is premature. |

### 2.12 temporal — V1 `INTEGRATE` → V2 `DEFER`
| Field | Value |
|---|---|
| Version | UNKNOWN (go.mod module only) |
| Required capability | Workflow and Automation |
| Actual evidence | Durable workflow engine (Go), MIT; heavy; needs persistence DB |
| Technical deps | Go; SQLite/Cassandra/Postgres/MySQL |
| License | MIT (low risk) |
| Maintenance/customization cost | High — distributed system ops |
| Provable reason | V2: "only if durable cross-service workflows necessary; start with internal engine" — sound |
| **Independent recommendation** | **DEFER** — agree with V2. Start with an internal workflow engine; Temporal is heavy and premature. |

### 2.13 langgraph — V1 `INTEGRATE` → V2 `UPSTREAM_ADOPT`
| Field | Value |
|---|---|
| Version | 1.2.22 |
| Required capability | AI Agents |
| Actual evidence | Graph-based agent orchestration library (Python), MIT; checkpoints, human-in-the-loop |
| Technical deps | Python; optional LLM providers |
| License | MIT (low risk) |
| Maintenance/customization cost | Low — library-level |
| Provable reason | V2: "MIT library with checkpoints and graph control; model agnostic" — ADOPT (library) is accurate |
| **Independent recommendation** | **ADOPT_CANDIDATE** — agree with V2. Clean MIT library. |

### 2.14 openforis-arena — V1 `DEFER` → V2 `INTEGRATE`
| Field | Value |
|---|---|
| Version | 2.13.4 |
| Required capability | Field Data Integration; Community Participation |
| Actual evidence | Geospatial survey platform (TypeScript), MIT; **requires Postgres+PostGIS**; heavy |
| Technical deps | PostgreSQL + PostGIS; Node 24 |
| License | MIT (low risk) |
| Maintenance/customization cost | High — full platform |
| Provable reason | V2: "conditional integration for survey campaigns; MIT and mature" — conditional |
| **Independent recommendation** | **DEFER** — agree with V1. Heavy full platform; only if field survey is a confirmed core need. V2's INTEGRATE is premature. |

### 2.15 spree — V1 `UPSTREAM_CUSTOMIZE` → V2 `INTEGRATE`
| Field | Value |
|---|---|
| Version | 6.0.5 |
| Required capability | Marketplace and Commerce |
| Actual evidence | Headless commerce (Ruby/Rails), BSD-3-Clause; **multi-vendor out-of-the-box** (sellers, order splitting, commission, settlement) |
| Technical deps | Rails; PostgreSQL; Redis; Stripe optional (payouts) |
| License | BSD-3-Clause (low risk) |
| Maintenance/customization cost | High — Rails stack; some customization for Eco Nojin branding |
| Provable reason | V2: "conditional marketplace core; best OSS multi-vendor fit" — supported by the registry's out-of-box multi-vendor evidence |
| **Independent recommendation** | **INTEGRATE_CANDIDATE** — agree with V2. Best OSS multi-vendor fit; note Rails ops skill requirement and minor customization. |

### 2.16 novu — V1 `DEFER` → V2 `INTEGRATE`
| Field | Value |
|---|---|
| Version | UNKNOWN (monorepo) |
| Required capability | Notification Preferences; Notifications |
| Actual evidence | Notification platform (TypeScript), MIT core + **proprietary Enterprise** (`enterprise/packages`, approval required) |
| Technical deps | PostgreSQL; Email/SMS providers |
| License | MIT + Proprietary EE (**medium risk**) |
| Maintenance/customization cost | High — EE approval required |
| Provable reason | V2: "use MIT core only; avoid enterprise packages" — but EE boundary is a legal risk |
| **Independent recommendation** | **LEGAL_REVIEW_REQUIRED** — disagree with V2's INTEGRATE. The EE license requires written approval; do not integrate until legal clears the boundary. |

### 2.17 collect-mobile — V1 `DEFER` → V2 `INTEGRATE`
| Field | Value |
|---|---|
| Version | UNKNOWN (master) |
| Required capability | Field Data Integration |
| Actual evidence | Android mobile survey client (MIT); offline-first; custom sync protocol |
| Technical deps | Android; custom sync |
| License | MIT (low risk) |
| Maintenance/customization cost | Medium — Android-only; custom sync |
| Provable reason | V2: "offline-first field capture aligns with field workflow" — plausible but unproven at scale |
| **Independent recommendation** | **DEFER** — agree with V1. Android-only with custom sync; only if mobile field capture is a confirmed, resourced need. |

### 2.18 mapserver — V1 `DEFER` → V2 `INTEGRATE`
| Field | Value |
|---|---|
| Version | 8.7.0 |
| Required capability | OGC Services; WMS/WFS |
| Actual evidence | Classic OGC map server (C/C++), MIT; extra service to operate |
| Technical deps | C/C++ |
| License | MIT (low risk) |
| Maintenance/customization cost | Medium — extra service |
| Provable reason | V2: "conditional when OGC WMS or WFS conformance is contractually required" — conditional |
| **Independent recommendation** | **DEFER** — agree with V1. Only if OGC WMS/WFS conformance is contractually required. |

### 2.19 opensearch — V1 `DEFER` → V2 `INTEGRATE`
| Field | Value |
|---|---|
| Version | 3.11.0 |
| Required capability | Geospatial Search; Knowledge Search |
| Actual evidence | Search/analytics engine (Java), Apache-2.0; heavy; security plugin critical |
| Technical deps | Java; cluster |
| License | Apache-2.0 (low risk) |
| Maintenance/customization cost | High — cluster ops + security plugin |
| Provable reason | V2: "conditional search backend when Postgres full text is insufficient" — conditional |
| **Independent recommendation** | **DEFER** — agree with V1. Heavy; start with Postgres full-text search; only add OpenSearch if proven insufficient. |

### 2.20 seaweedfs — V1 `DEFER` → V2 `INTEGRATE`
| Field | Value |
|---|---|
| Version | UNKNOWN (master) |
| Required capability | Document Management; Object Storage |
| Actual evidence | S3-compatible object store (Go), Apache-2.0; self-hosted storage ops |
| Technical deps | Go; storage cluster |
| License | Apache-2.0 (low risk) |
| Maintenance/customization cost | Medium — storage ops ownership |
| Provable reason | V2: "conditional self-hosted S3 alternative; compare with managed object storage" — conditional |
| **Independent recommendation** | **DEFER** — agree with V1. Only if self-hosted object storage is chosen over managed. |

### 2.21 invest — V1 `DEFER` → V2 `INTEGRATE`
| Field | Value |
|---|---|
| Version | UNKNOWN (main) |
| Required capability | Ecosystem Restoration; Environmental Indicators |
| Actual evidence | Ecosystem services valuation (Python), Apache-2.0; economic assumptions are model-specific |
| Technical deps | Python |
| License | Apache-2.0 (low risk) |
| Maintenance/customization cost | Medium — economic assumptions |
| Provable reason | V2: "useful for ecosystem service scenarios; expose assumptions" — optional |
| **Independent recommendation** | **DEFER** — agree with V1. Optional ecosystem models; only if natural capital valuation is a confirmed core capability. |

---

## 3. INDEPENDENT RECOMMENDATION SUMMARY

| Status | Count | Projects |
|---|---:|---|
| **ADOPT_CANDIDATE** | 4 | giro3d, cesium, deck-gl, langgraph |
| **INTEGRATE_CANDIDATE** | 4 | wflow-jl, modflow6, titiler, spree |
| **LEGAL_REVIEW_REQUIRED** | 1 | novu |
| **DEFER** | 12 | geolibre, landlab, climate-indices, pgstac, opentripplanner, temporal, openforis-arena, collect-mobile, mapserver, opensearch, seaweedfs, invest |
| REJECT | 0 | — |
| INSUFFICIENT_EVIDENCE | 0 | — |
| CUSTOMIZE_CANDIDATE | 0 | — |

### 3.1 Comparison with V1 and V2
| Posture | ADOPT | INTEGRATE | CUSTOMIZE | DEFER | REJECT | Other |
|---|---:|---:|---:|---:|---:|---:|
| **V1 (Set 1)** | 12 | 9 | 2 | 28 | 3 | 0 |
| **V2 (Set 2)** | 12 | 19 | 0 | 20 | 3 | 0 |
| **Independent (this audit, 21 changed only)** | 4 | 4 | 0 | 12 | 0 | 1 LEGAL_REVIEW |

**Note:** the independent column covers only the 21 changed projects, not all 54. It is intentionally **more conservative than V2** — it does not issue INTEGRATE merely to increase the usable count.

### 3.2 Provable reasons summary
- **Agree with V2 (8):** giro3d, cesium, deck-gl, langgraph, wflow-jl, modflow6, titiler, spree — V2's change is supported by evidence (library-level adoption, service-level integration, or out-of-box capability).
- **Agree with V1 (12):** geolibre, landlab, climate-indices, pgstac, opentripplanner, temporal, openforis-arena, collect-mobile, mapserver, opensearch, seaweedfs, invest — V2's INTEGRATE is premature/conditional; defer.
- **Disagree with both (1):** novu — V1 said DEFER (correct instinct) but V2's INTEGRATE ignores the EE license risk; requires legal review.

---

## 12. LIMITATIONS
- No upstream project was built, run, or benchmarked in this audit (forbidden).
- Resource figures are from the registry's static analysis, not measurements.
- License observations are preliminary, not legal advice.
- Recommendations are **non-binding** and do not approve any project for production.

**No project is approved. Awaiting owner decision.**