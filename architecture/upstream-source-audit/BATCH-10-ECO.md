# BATCH 10 — ECO — SOURCE AUDIT
## Novu, Collect Earth Online, Collect Mobile, Collect, MapServer, WPS, RHEM x2, PCSE, Grafana, OTel, Prometheus, Superset, OpenSearch, SeaweedFS, PyGeoProcessing, InVEST, FloPy

**Date:** 2026-11-17
**Mode:** READ-ONLY source-level analysis. No build, no run.

---

## 1. Novu (`novu-next.zip`, 204 MB, MIT + Proprietary EE)
- **Architecture:** `apps/`, `packages/`, `libs/` (TS monorepo). Notification platform.
- **Core source:** 8,653 source files; 1,368 test files.
- **Main interfaces:** REST API (`/v1/*`); SDKs.
- **Capabilities:** email, SMS, in-app, digest, preferences.
- **Proven:** source present; NOT built.
- **Runtime:** **PostgreSQL; email/SMS providers.**
- **License:** MIT core + **Proprietary EE** (`enterprise/packages`, approval required).
- **Eco Nojin modules:** `PLT-NOTIF`.
- **Mapping:** `INTEGRATION_REQUIRED` (MIT core only).
- **Risks:** EE license; approval required.

## 2. Collect Earth Online (`collect-earth-online-main.zip`, 2.4 MB, MIT)
- **Architecture:** `src/` (Clojure/ClojureScript). CEO web app.
- **Core source:** 185 source files; 7 test files.
- **Main interfaces:** Ring/Compojure REST; ClojureScript UI.
- **Capabilities:** visual interpretation of satellite imagery (CEO).
- **Proven:** source present; NOT executed.
- **Runtime:** **PostgreSQL; GEE.**
- **License:** MIT (FAO). Permissive.
- **Eco Nojin modules:** `GIS-LULC`.
- **Mapping:** `DEFER`.
- **Risks:** Clojure runtime; external GEE.

## 3. Collect Mobile (`collect-mobile-master.zip`, 1.8 MB, MIT)
- **Architecture:** Android (Java/Kotlin). Mobile survey client.
- **Core source:** 251 source files; 29 test files.
- **Main interfaces:** Android app; custom sync protocol.
- **Capabilities:** offline field surveys.
- **Proven:** source present; NOT built.
- **Runtime:** Android.
- **License:** MIT (Open Foris). Permissive.
- **Eco Nojin modules:** `GIS-FIELD`.
- **Mapping:** `DEFER`.
- **Risks:** Android-only; custom sync.

## 4. Collect (`collect-master.zip`, 31 MB, MIT)
- **Architecture:** `collect-core/` (Java/Maven), `collect-server/`, `collect-webapp/`, `collect-rdb/`.
- **Core source:** 2,124 source files; 93 test files.
- **Main interfaces:** Java desktop; survey XML.
- **Capabilities:** survey design and data management.
- **Proven:** source present; NOT executed.
- **Runtime:** Java.
- **License:** MIT (Open Foris). Permissive.
- **Eco Nojin modules:** `TER-PART`, `GIS-FIELD`.
- **Mapping:** `DEFER`.
- **Risks:** Java desktop; overlaps arena.

## 5. MapServer (`MapServer-main.zip`, 42 MB, MIT)
- **Architecture:** C/C++. OGC map server.
- **Core source:** 454 source files; 76 test files.
- **Main interfaces:** OGC WMS/WFS/WCS; CGI/FastCGI.
- **Capabilities:** classic OGC map serving.
- **Proven:** source present; NOT built.
- **Runtime:** C/C++.
- **License:** MIT (OSGeo). Permissive; bundled libs own licenses.
- **Eco Nojin modules:** `GIS-VECTOR`, `GIS-RASTER`.
- **Mapping:** `DEFER`.
- **Risks:** extra service; overlaps titiler.

## 6. WPS (`WPS-master.zip`, 17 MB, **LICENSE NOT FOUND**)
- **Architecture:** Fortran/C. WRF Pre-Processing System.
- **Core source:** 297 source files; 99 test files.
- **Main interfaces:** WRF preprocessing; `namelist.wps`.
- **Capabilities:** WRF model input preparation.
- **Proven:** source present; NOT built.
- **Runtime:** Fortran + C.
- **License:** **NOT FOUND in archive.** Upstream WRF is Apache-2.0 but unverified from archive.
- **Eco Nojin modules:** `SCI-REG`.
- **Mapping:** `DEFER` + `LICENSE_REVIEW_REQUIRED`.
- **Risks:** license unconfirmed; legal review mandatory.

## 7. RHEM Single-Storm (`rhem_engine_singlestorm-main.zip`, 39 KB, MIT)
- **Architecture:** Fortran. RHEM single-storm erosion.
- **Core source:** 21 source files; 0 test files.
- **Main interfaces:** RHEM input files.
- **Capabilities:** single-storm erosion prediction.
- **Proven:** source present; NOT executed.
- **Runtime:** Fortran.
- **License:** MIT (ARS SWRC). Permissive.
- **Eco Nojin modules:** `SCI-REG`.
- **Mapping:** `ADAPTER_REQUIRED`.
- **Risks:** no tests; Fortran.

## 8. RHEM CLIGEN (`rhem_engine_cligen-main.zip`, 41 KB, MIT)
- **Architecture:** Fortran. RHEM + CLIGEN weather generator.
- **Core source:** 27 source files; 0 test files.
- **Main interfaces:** RHEM + CLIGEN input.
- **Capabilities:** CLIGEN-based erosion.
- **Proven:** source present; NOT executed.
- **Runtime:** Fortran.
- **License:** MIT (ARS SWRC). Permissive.
- **Eco Nojin modules:** `SCI-REG`.
- **Mapping:** `ADAPTER_REQUIRED`.
- **Risks:** no tests; Fortran.

## 9. PCSE (`pcse-master.zip`, 67 MB, **EUPL-1.1**)
- **Architecture:** `pcse/` (Python). WOFOST crop simulation.
- **Core source:** 83 source files; 562 test files.
- **Main interfaces:** `pcse.crop`, `pcse.soil`, `pcse.weather`.
- **Capabilities:** crop growth simulation.
- **Proven:** source present; NOT executed.
- **Runtime:** Python.
- **License:** **EUPL-1.1. Copyleft.**
- **Eco Nojin modules:** `SCI-REG`, `SCI-ADP`.
- **Mapping:** `DEFER` (legal).
- **Risks:** EUPL-1.1 copyleft.

## 10. Grafana (`grafana-main.zip`, 67 MB, **AGPL-3.0-only**)
- **Architecture:** Go + TS. Monitoring dashboards.
- **Core source:** 11,027 source files; 6,305 test files.
- **Main interfaces:** HTTP API (`/api/*`); plugin API.
- **Capabilities:** dashboards, alerting, visualization.
- **Proven:** source present; NOT built.
- **Runtime:** SQL (metadata).
- **License:** **AGPL-3.0-only. Strongest copyleft.**
- **Eco Nojin modules:** `ADM-MON`.
- **Mapping:** `DEFER` (use unmodified).
- **Risks:** AGPL network disclosure; do not embed in proprietary SaaS.

## 11. OpenTelemetry Collector (`opentelemetry-collector-main.zip`, 5.6 MB, Apache-2.0)
- **Architecture:** Go. Telemetry pipeline.
- **Core source:** 984 source files; 915 test files.
- **Main interfaces:** OTLP (gRPC/HTTP); config YAML.
- **Capabilities:** traces/metrics/logs collection.
- **Proven:** source present; NOT built.
- **Runtime:** Go.
- **License:** Apache-2.0. Permissive.
- **Eco Nojin modules:** `INF-OBS`.
- **Mapping:** `DIRECT_REUSE`.

## 12. Prometheus (`prometheus-main.zip`, 6.3 MB, Apache-2.0)
- **Architecture:** Go. Metrics + alerting.
- **Core source:** 695 source files; 375 test files.
- **Main interfaces:** HTTP API (`/api/v1/*`); PromQL.
- **Capabilities:** metrics storage, alerting.
- **Proven:** source present; NOT built.
- **Runtime:** TSDB.
- **License:** Apache-2.0. Permissive.
- **Eco Nojin modules:** `INF-OBS`, `ADM-MON`.
- **Mapping:** `DIRECT_REUSE`.

## 13. Superset (`superset-master.zip`, 55 MB, Apache-2.0)
- **Architecture:** `superset/` (Python+TS). BI dashboards.
- **Core source:** 4,396 source files; 3,187 test files.
- **Main interfaces:** REST API (`/api/v1/*`); SQL Lab.
- **Capabilities:** BI dashboards, SQL exploration.
- **Proven:** source present; NOT built.
- **Runtime:** SQL (metadata).
- **License:** Apache-2.0 (ASF). Permissive; NOTICE propagation.
- **Eco Nojin modules:** `ACC-REPORT`, `ADM-MON`.
- **Mapping:** `DEFER`.
- **Risks:** internet-facing; SQL Lab risk.

## 14. OpenSearch (`OpenSearch-main.zip`, 75 MB, Apache-2.0)
- **Architecture:** Java. Search/analytics engine.
- **Core source:** 9,264 source files; 7,622 test files.
- **Main interfaces:** REST API; OpenSearch DSL.
- **Capabilities:** search, log analytics.
- **Proven:** source present; NOT built.
- **Runtime:** Java cluster.
- **License:** Apache-2.0. Permissive.
- **Eco Nojin modules:** `GIS-SEARCH`, `KNW-KB`.
- **Mapping:** `DEFER`.
- **Risks:** heavy; security plugin critical.

## 15. SeaweedFS (`seaweedfs-master.zip`, 89 MB, Apache-2.0)
- **Architecture:** Go. S3-compatible object store.
- **Core source:** 1,882 source files; 2,276 test files.
- **Main interfaces:** S3 API; HTTP; gRPC.
- **Capabilities:** object/file storage.
- **Proven:** source present; NOT built.
- **Runtime:** Go cluster.
- **License:** Apache-2.0. Permissive.
- **Eco Nojin modules:** `INF-STORAGE`.
- **Mapping:** `DEFER`.
- **Risks:** storage ops.

## 16. PyGeoProcessing (`pygeoprocessing-main.zip`, 549 KB, BSD-3-Clause)
- **Architecture:** Python. Raster GIS routines.
- **Core source:** 16 source files; 7 test files.
- **Main interfaces:** `pygeoprocessing.geoprocessing.*`.
- **Capabilities:** raster algebra, zonal stats, routing.
- **Proven:** source present; NOT executed.
- **Runtime:** Python + GDAL.
- **License:** BSD-3-Clause. Permissive.
- **Eco Nojin modules:** `GIS-RASTER`, `GIS-WSHED`, `SCI-SPATIAL`.
- **Mapping:** `DIRECT_REUSE`.

## 17. InVEST (`invest-main.zip`, 21 MB, Apache-2.0)
- **Architecture:** `src/` (Python). Ecosystem services.
- **Core source:** 222 source files; 75 test files.
- **Main interfaces:** `natcap.invest.*` models.
- **Capabilities:** natural capital valuation.
- **Proven:** source present; NOT executed.
- **Runtime:** Python.
- **License:** Apache-2.0. Permissive.
- **Eco Nojin modules:** `SCI-REG`, `SCI-ADP`.
- **Mapping:** `DEFER`.
- **Risks:** economic assumptions.

## 18. FloPy (`flopy-develop.zip`, 129 MB, USGS public domain)
- **Architecture:** `flopy/` (Python, 6.5 MB source); `examples/` (409 MB); `.docs/` (114 MB).
- **Core source:** 417 source files; 109 test files.
- **Main interfaces:** `flopy.modflow.ModflowGwf` etc.; `MfGrdFile`.
- **Capabilities:** MODFLOW model I/O, post-processing.
- **Proven:** source present; NOT executed.
- **Runtime:** Python + MODFLOW binary.
- **License:** USGS public domain (CC0-like). Permissive.
- **Eco Nojin modules:** `SCI-ADP`, `SCI-STORE`.
- **Mapping:** `ADAPTER_REQUIRED`.
- **Risks:** dev version (3.13.0.dev0); 532 MB archive bloat.

---

## 19. BATCH SUMMARY
- 18 projects, all `EXTRACTED`.
- **License risk:** PCSE (EUPL-1.1) + Grafana (AGPL-3.0) = HIGH; WPS = REVIEW (no license).
- **Gaps:** no permissive ERP, no ledger, no MRV, no EcoCoin.
- **No project approved.**

### Special items
- **RothC:** `PRESENT_UNPROCESSED` (not in this batch's 18).
- **WRF:** `INTEGRITY_FAILED` (empty archive).