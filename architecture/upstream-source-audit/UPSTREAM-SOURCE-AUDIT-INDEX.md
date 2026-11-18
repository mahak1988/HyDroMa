# UPSTREAM SOURCE-LEVEL AUDIT — INDEX
## Eco Nojin — 54 Projects + Batch Reports

**Date:** 2026-11-17
**Mode:** READ-ONLY source-level audit. No project was built, run, installed, or modified.
**Scope:** 54 extracted projects in `D:\Nojin\upstream-registry\` + RothC (unprocessed) + WRF (failed).

---

## 1. DELIVERABLES

| # | File | Description |
|---|---|---|
| 1 | `UPSTREAM-SOURCE-AUDIT-INDEX.md` | This index |
| 2 | `UPSTREAM-FILE-MANIFEST.csv` | 54 projects × file counts by category |
| 3 | `UPSTREAM-CAPABILITY-MATRIX.csv` | 54 projects × capability + source evidence + proven/claimed |
| 4 | `UPSTREAM-MODULE-MAPPING.csv` | 54 projects → 194 Eco Nojin modules + mapping status |
| 5 | `UPSTREAM-API-AND-DATA-INTERFACE-MATRIX.csv` | 54 projects × API type + interfaces + runtime deps |
| 6 | `UPSTREAM-LICENSE-AND-DEPENDENCY-REVIEW.csv` | 54 projects × license + deps + commercial risk |
| 7 | `UPSTREAM-GAP-AND-OVERLAP-REPORT.md` | Gaps, overlaps, license risk summary |
| 8 | `BATCH-04-VISUALIZATION.md` | Batch 04 report |
| 9 | `BATCH-05-GEOSPATIAL-DATA.md` | Batch 05 report |
| 10 | `BATCH-06-BUSINESS.md` | Batch 06 report |
| 11 | `BATCH-09-ECO.md` | Batch 09 report |
| 12 | `BATCH-10-ECO.md` | Batch 10 report |

---

## 2. PROJECT INVENTORY (54 + 2 special)

### Batch 04 — Visualization (3)
| Project | Version | License | Files | Status |
|---|---|---|---|---|
| cesium | 1.147.0 | Apache-2.0 | 5,852 | EXTRACTED |
| deck-gl | 9.4.0 | MIT | 3,003 | EXTRACTED |
| maplibre-gl-js | main/6.18.0 | BSD-3-Clause | 5,730 | EXTRACTED |

### Batch 05 — Geospatial Data (4)
| Project | Version | License | Files | Status |
|---|---|---|---|---|
| titiler | main/2.4.1 | MIT | 543 | EXTRACTED |
| pgstac | main/0.9.11-dev | MIT | 351 | EXTRACTED |
| odc-stac | develop/0.5.3 | Apache-2.0 | 91 | EXTRACTED |
| pystac | main/1.16.0 | Apache-2.0 | 1,001 | EXTRACTED |

### Batch 06 — Business (3)
| Project | Version | License | Files | Status |
|---|---|---|---|---|
| erpnext | 16.35.0 | GPL-3.0 | 5,177 | EXTRACTED |
| dolibarr | 24.0.3 | GPL-3.0 | 14,644 | EXTRACTED |
| medusa | 2.22.6 | MIT + EE | 25,034 | EXTRACTED |

### Batch 09 — Eco (14)
| Project | Version | License | Files | Status |
|---|---|---|---|---|
| keycloak | 999.0.0-SNAPSHOT | Apache-2.0 | 13,637 | EXTRACTED |
| temporal | UNKNOWN | MIT | 4,197 | EXTRACTED |
| kestra | 2.1.0-SNAPSHOT | Apache-2.0 | 6,782 | EXTRACTED |
| node-red | 5.0.9 | Apache-2.0 | 1,551 | EXTRACTED |
| langgraph | 1.2.22 | MIT | 707 | EXTRACTED |
| agno | 3.2.0 | Apache-2.0 | 6,572 | EXTRACTED |
| flowise | 3.1.4 | Apache-2.0 + EE | 2,450 | EXTRACTED |
| openzeppelin-contracts | 5.7.0 | MIT | 1,002 | EXTRACTED |
| farmos | 4.x | GPL-2.0-or-later | 1,544 | EXTRACTED |
| openforis-arena | 2.13.4 | MIT | 3,623 | EXTRACTED |
| collect-earth | 2.0-beta | MIT | 2,062 | EXTRACTED |
| sepal | 1.0.0 | MIT/ISC | 3,550 | EXTRACTED |
| qloapps | UNKNOWN | OSL-3.0 | 8,460 | EXTRACTED |
| spree | 6.0.5 | BSD-3-Clause | 9,364 | EXTRACTED |

### Batch 10 — Eco (18)
| Project | Version | License | Files | Status |
|---|---|---|---|---|
| novu | UNKNOWN | MIT + EE | 12,526 | EXTRACTED |
| collect-earth-online | UNKNOWN | MIT | 410 | EXTRACTED |
| collect-mobile | UNKNOWN | MIT | 569 | EXTRACTED |
| collect | 4.0.112-SNAPSHOT | MIT | 3,423 | EXTRACTED |
| mapserver | 8.7.0 | MIT | 773 | EXTRACTED |
| wps | 4.7.0 | **NOT FOUND** | 1,441 | EXTRACTED (license review) |
| rhem-engine-singlestorm | UNKNOWN | MIT | 21 | EXTRACTED |
| rhem-engine-cligen | UNKNOWN | MIT | 27 | EXTRACTED |
| pcse | 6.0.13 | EUPL-1.1 | 786 | EXTRACTED |
| grafana | 13.4.0-pre | AGPL-3.0-only | 24,656 | EXTRACTED |
| opentelemetry-collector | UNKNOWN | Apache-2.0 | 2,945 | EXTRACTED |
| prometheus | UNKNOWN | Apache-2.0 | 1,773 | EXTRACTED |
| superset | UNKNOWN | Apache-2.0 | 11,635 | EXTRACTED |
| opensearch | 3.11.0 | Apache-2.0 | 19,487 | EXTRACTED |
| seaweedfs | UNKNOWN | Apache-2.0 | 4,720 | EXTRACTED |
| pygeoprocessing | UNKNOWN | BSD-3-Clause | 50 | EXTRACTED |
| invest | UNKNOWN | Apache-2.0 | 435 | EXTRACTED |
| flopy | 3.13.0.dev0 | USGS public domain | 4,044 | EXTRACTED |

### Special — not in the 54
| Item | Status | Note |
|---|---|---|
| **RothC** | `PRESENT_UNPROCESSED` | `RothC_Py-1.0.0.zip` present in batch-10 but not extracted/audited |
| **WRF** | `INTEGRITY_FAILED` | `WRF-master.zip` is 178 bytes (empty archive) |

---

## 3. KEY AGGREGATE FINDINGS

- **Files analyzed:** 54 projects, ~100K+ files total (manifest in `UPSTREAM-FILE-MANIFEST.csv`).
- **Capabilities verified from source:** 52/54 `SOURCE_VERIFIED`; 2 `INSUFFICIENT_EVIDENCE` (rhem engines have 0 tests).
- **Mapping to 194 modules:** 9 `DIRECT_REUSE`, 6 `INTEGRATION_REQUIRED`, 11 `ADAPTER_REQUIRED`, 21 `DEFER`, 2 `OVERLAPPING_CAPABILITY`, 3 `REJECT`.
- **License risk:** 8 HIGH, 5 MEDIUM, 1 REVIEW, 40 LOW.
- **Gaps (no provider):** accounting (permissive), double-entry ledger, MRV carbon credits, EcoCoin/HIC, RothC, tourism PMS (permissive), RTL design system.

---

## 4. CAVEATS

- `geolibre` (116K files) and `giro3d` (48K files) manifest counts include `node_modules` from earlier installs — core source counts are still valid.
- No project was built, run, or tested in this audit. `proven_capability` distinguishes source-verified from executed.
- All recommendations are non-binding. **No project is Production Approved.**

---

## 5. STATUS

`SOURCE_AUDIT_COMPLETE` — 54 projects inventoried, file-manifested, capability-assessed, module-mapped, API-interfaced, license-reviewed, and gap-analyzed. RothC (`PRESENT_UNPROCESSED`) and WRF (`INTEGRITY_FAILED`) recorded separately.

**No project is approved for production, legal, security, scientific, or economic use. Awaiting owner decision.**