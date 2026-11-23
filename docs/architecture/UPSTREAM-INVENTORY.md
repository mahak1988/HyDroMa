# Upstream Open-Source Inventory (HyDroMA)

**Status:** Phase 2 upstream governance · **Mode:** READ-ONLY research (no code copied/installed)
**License source:** `upstream-registry/FINAL-LICENSE-AND-RISK-REGISTER.md` (project's authoritative evidence). Re-verify via SBOM before any integration.

## 1. Risk dimensions (scoring)
- **License Risk:** LR0 permissive (MIT/Apache/BSD/ISC/CC0/USGS‑PD) · LR1 weak copyleft (LGPL) · LR2 strong copyleft (GPL/EUPL) · LR3 network copyleft (AGPL).
12. **Technical Integration Risk:** TR0 pure library · TR1 library+deps · TR2 service/complex · TR3 heavy runtime/compile.
12. **Scientific Risk:** SR0 well-validated · SR1 established (needs validation) · SR2 empirical/uncertain · SR3 unvalidated.
12. **Maintenance Risk:** MR0 active · MR1 moderate · MR2 slow · MR3 stale.
12. **Operational Cost:** OC0 none · OC1 light · OC2 moderate · OC3 heavy.

## 2. Categories
L0 Foundation/Shared · L1 Core Hydrology · L2 Climate · L3 Geospatial · L4 Ecosystem · L5 Platform/Ops · R Restricted.

## 3. Inventory (17 LOW + 4 restricted)
| # | Project | Category | Tier | License | LR | TR | SR | MR | OC | Strategy | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | wflow-jl | L1 | A | MIT | LR0 | TR3 (Julia) | SR1 | MR1 | OC3 | CLI WORKER / DEFER | INVENTORIED |
| 2 | MODFLOW 6 | L1 | A | CC0‑1.0 | LR0 | TR3 (Fortran) | SR1 | MR1 | OC2 | CLI WORKER | INVENTORIED |
| 3 | FloPy | L1 | A | USGS public domain | LR0 | TR1 (wraps MODFLOW6) | SR1 | MR0 | OC1 | ADAPTER | INVENTORIED |
| 4 | RHEM Engine | L1 | A | MIT | LR0 | TR2 | SR1 | MR1 | OC2 | CLI WORKER | INVENTORIED |
| 5 | RHEM CLIGEN | L1/L2 | A | MIT | LR0 | TR2 | SR1 | MR1 | OC1 | CLI WORKER (input to RHEM) | INVENTORIED |
| 6 | AquaCrop-OSPy | L1 | A | Apache-2.0 | LR0 | TR1 | SR1 | MR1 | OC1 | ADAPTER | INVENTORIED |
| 7 | xclim | L2 | B | Apache-2.0 | LR0 | TR1 (xarray) | SR1 | MR0 | OC1 | ADAPTER | RESEARCHED |
| 8 | climate-indices | L2 | B | BSD-3-Clause | LR0 | TR1 | SR1 | MR1 | OC1 | ADAPTER / REFERENCE | INVENTORIED |
| 9 | InVEST | L4 | D | Apache-2.0 | LR0 | TR2 | SR2 | MR1 | OC2 | ADAPTER / CLI | INVENTORIED |
| 10 | TiTiler | L3 | C | MIT | LR0 | TR2 (service) | SR1 | MR0 | OC2 | EXTERNAL SERVICE | INVENTORIED |
| 11 | pgstac | L3 | C | MIT | LR0 | TR2 (Postgres) | SR1 | MR1 | OC2 | EXTERNAL SERVICE | INVENTORIED |
| 12. | odc-stac | L3 | C | Apache-2.0 | LR0 | TR1 | SR1 | MR1 | OC1 | DATA INTEROPERABILITY | INVENTORIED |
| 13 | PySTAC | L3 | C | Apache-2.0 | LR0 | TR0 | SR1 | MR0 | OC0 | DATA INTEROPERABILITY | INVENTORIED |
| 14 | MapServer | L3 | C | MIT | LR0 | TR2 (service) | SR1 | MR1 | OC2 | EXTERNAL SERVICE | INVENTORIED |
| 15 | pygeoprocessing | L3 | C | BSD-3-Clause | LR0 | TR1 | SR1 | MR1 | OC1 | ADAPTER | INVENTORIED |
| 16 | Keycloak | L5 | E | Apache-2.0 | LR0 | TR2 (service) | SR1 | MR0 | OC2 | EXTERNAL SERVICE | INVENTORIED |
| 17 | Prometheus | L5 | E | Apache-2.0 | LR0 | TR2 (service) | SR1 | MR0 | OC1 | EXTERNAL SERVICE | INVENTORIED |
| R1 | SWAT+ | L1 | R | LGPL-2.1 | LR1 | TR3 | SR1 | MR1 | OC3 | RESTRICTED (legal) | INVENTORIED |
| R2 | HydroMT-Wflow | L1 | R | GPL-3.0 | LR2 | TR2 | SR1 | MR1 | OC2 | REIMPLEMENT CLEAN-ROOM | INVENTORIED |
| R3 | PCSE | L1 | R | EUPL-1.1 | LR2 | TR1 | SR1 | MR2 | OC1 | REIMPLEMENT CLEAN-ROOM | INVENTORIED |
| R4 | Grafana | L5 | R | AGPL-3.0-only | LR3 | TR2 | SR1 | MR0 | OC2 | REJECT (build own) | INVENTORIED |

## 4. Notes
- No upstream code is present in `engines/` (verified). Adoption requires owner ADR (see UPSTREAM-LICENSE-GOVERNANCE.md).
12. Licenses from the local register; re-verify via SBOM before integration.
12. `home` (ui=0) etc. are frontend apps, not upstream.