# Upstream Integration Register (canonical status)

**Statuses:** INVENTORIED · RESEARCHED · PROPOSED · ADR_PENDING · ADR_APPROVED · IMPLEMENTING · INTEGRATED · TESTED · VALIDATED · DEFERRED · REJECTED.
**Rule:** a project is never INTEGRATED merely because docs/adapter dir exist; requires an approved owner ADR + implemented+tested adapter. No upstream code is copied.

| Project | Category | Tier | License | LR | Strategy | ADR | Status | Next action |
|---|---|---|---|---|---|---|---|---|
| xclim | L2 | B | Apache-2.0 | LR0 | ADAPTER | ADR-DRAFT-001 (pending) | RESEARCHED | Owner approves ADR‑001 → implement adapter |
| climate-indices | L2 | B | BSD-3-Clause | LR0 | ADAPTER/REFERENCE | — | INVENTORIED | Decide after xclim (overlap) |
| FloPy | L1 | A | USGS PD | LR0 | ADAPTER | — | INVENTORIED | ADR when MODFLOW6 adopted |
| MODFLOW 6 | L1 | A | CC0-1.0 | LR0 | CLI WORKER | — | INVENTORIED | ADR (heavy; ops cost) |
| wflow-jl | L1 | A | MIT | LR0 | CLI WORKER/DEFER | — | INVENTORIED | ADR (Julia decision) |
| AquaCrop-OSPy | L1 | A | Apache-2.0 | LR0 | ADAPTER | — | INVENTORIED | ADR |
| RHEM Engine | L1 | A | MIT | LR0 | CLI WORKER | — | INVENTORIED | ADR |
| RHEM CLIGEN | L1/L2 | A | MIT | LR0 | CLI WORKER | — | INVENTORIED | ADR (with RHEM) |
| InVEST | L4 | D | Apache-2.0 | LR0 | ADAPTER/CLI | — | INVENTORIED | ADR |
| PySTAC | L3 | C | Apache-2.0 | LR0 | DATA INTEROP | — | INVENTORIED | Data-infra ADR |
| pgstac | L3 | C | MIT | LR0 | EXTERNAL SERVICE | — | INVENTORIED | Ops ADR |
| TiTiler | L3 | C | MIT | LR0 | EXTERNAL SERVICE | — | INVENTORIED | Ops ADR |
| odc-stac | L3 | C | Apache-2.0 | LR0 | DATA INTEROP | — | INVENTORIED | Data-infra ADR |
| MapServer | L3 | C | MIT | LR0 | EXTERNAL SERVICE | — | INVENTORIED | Ops ADR |
| pygeoprocessing | L3 | C | BSD-3-Clause | LR0 | ADAPTER | — | INVENTORIED | ADR |
| Keycloak | L5 | E | Apache-2.0 | LR0 | EXTERNAL SERVICE | — | INVENTORIED | D-04 (IdP) |
| Prometheus | L5 | E | Apache-2.0 | LR0 | EXTERNAL SERVICE | — | INVENTORIED | Ops ADR |
| SWAT+ | L1 | R | LGPL-2.1 | LR1 | RESTRICTED | — | INVENTORIED | Legal review |
| HydroMT-Wflow | L1 | R | GPL-3.0 | LR2 | REIMPLEMENT CLEAN-ROOM | — | INVENTORIED | Legal + clean-room ADR |
| PCSE | L1 | R | EUPL-1.1 | LR2 | REIMPLEMENT CLEAN-ROOM | — | INVENTORIED | Legal + clean-room ADR |
| Grafana | L5 | R | AGPL-3.0-only | LR3 | REJECT | — | INVENTORIED | Build own dashboards |

**Current integration status:** no upstream code integrated (all INVENTORIED/RESEARCHED). `xclim` is the first ADR candidate.