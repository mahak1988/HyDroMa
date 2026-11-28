# Domain Registry

**Status:** SCAFFOLDED. Foundational registry of Eco Nojin domains, mapped to owning modules in the
authoritative catalog (`architecture/ECO-NOJIN-MODULE-CATALOG.csv`) and the data-domain model
(`architecture/ECO-NOJIN-DATA-DOMAIN-MODEL.md`). Maturity: see [architecture-status.md](./architecture-status.md).

A **domain** is a business/scientific area of ownership. It is not automatically a service
(modular monolith first, P1). "Owner modules" are catalog IDs; none are implemented yet unless the
status column says so.

## Core platform domains

| Domain ID | Name | Responsibility | Owner modules | Status |
|---|---|---|---|---|
| D-IAM | Users & Access | Identity, session, profile, preferences | PLT-IAM, PLT-SESSION, PLT-USER | SCAFFOLDED |
| D-ORG | Organizations & Membership | Legal entities, hierarchy, membership, org roles | PLT-ORG | SCAFFOLDED |
| D-TEN | Multi-tenancy | Tenant registry, isolation, quotas | PLT-TEN | SCAFFOLDED |
| D-RBAC | Roles & Permissions | RBAC/ABAC decisions, SoD, access review | PLT-RBAC | SCAFFOLDED |
| D-TER | Territories | Villages, nomadic communities, parcels, landscape units | TER-VIL, TER-NOM, TER-PARCEL, TER-LND | SCAFFOLDED |
| D-PROJ | Projects & Restoration | Restoration projects, milestones, interventions | TER-REST | SCAFFOLDED |

## Agriculture & natural-resource domains

| Domain ID | Name | Responsibility | Owner modules | Status |
|---|---|---|---|---|
| D-FARM | Farms & Crops | Farm registry, crop plan, assets | TER-FRM | SCAFFOLDED |
| D-RANGE | Rangelands | Rangeland registry, grazing capacity | TER-RNG | SCAFFOLDED |
| D-Watershed | Watersheds | Delineation, linkage to hydrology | TER-WSH, GIS-WSHED | SCAFFOLDED |
| D-REST | Restoration & Biodiversity | Restoration, vegetation indices, land cover | TER-REST, GIS-VEGIND, GIS-LULC | SCAFFOLDED |
| D-ENV | Environmental Monitoring | Indicators, monitoring records | MRV-MON, MRV-IND | SCAFFOLDED |

## Scientific domains (HyDroMA)

| Domain ID | Name | Responsibility | Owner modules | Status |
|---|---|---|---|---|
| D-SCI-REG | Model Registry | Model metadata, versions, scientific status | SCI-REG | SCAFFOLDED |
| D-SCI-EXEC | Model Execution | Launch, monitor, jobs, artifacts | SCI-EXEC, SCI-QUEUE | SCAFFOLDED (engine TESTED) |
| D-SCI-CAL | Calibration & Validation | Calibration, validation, uncertainty | SCI-CAL, SCI-VAL, SCI-UNC | SCAFFOLDED |
| D-SCI-PROV | Scientific Provenance | Input/code/parameter hashes, lineage | SCI-PROV | IMPLEMENTED in engine |
| D-CLIMATE | Climate & Meteorology | Climate series, ET0, soil/crop water | (engine climate modules) | IMPLEMENTED in engine (NOT_VALIDATED) |
| D-SCEN | Scenarios | Scenario define/execute/compare | SCI-SCEN | IMPLEMENTED in engine (NOT_VALIDATED) |

## Commerce domains

| Domain ID | Name | Responsibility | Owner modules | Status |
|---|---|---|---|---|
| D-MKT | Marketplace | Catalog, vendors, orders, pricing, commission | MKT-* | SCAFFOLDED |
| D-INV | Inventory | Stock, lots, reservations, FEFO/expiry, traceability | INV-* | SCAFFOLDED |
| D-FIN | Finance & Accounting | COA, ledger, AP/AR, FX, statements | ACC-* | SCAFFOLDED |
| D-PAY | Payment Integration | Gateway adapter, reconciliation | INT-PAYMENT, ACC-PAYREC | SCAFFOLDED (no live payments) |

## Tourism domains

| Domain ID | Name | Responsibility | Owner modules | Status |
|---|---|---|---|---|
| D-TOU | Ecotourism | Destinations, stays, experiences, reservations, guides | TOU-* | SCAFFOLDED |

## MRV domains

| Domain ID | Name | Responsibility | Owner modules | Status |
|---|---|---|---|---|
| D-MRV | Monitoring/Reporting/Verification | MRV records, carbon, evidence, uncertainty | MRV-* | SCAFFOLDED |
| D-CARBON | Carbon | Internal estimate (never sellable) | MRV-CARBON, MRV-ESTIMATE | SCAFFOLDED |

## Platform domains

| Domain ID | Name | Responsibility | Owner modules | Status |
|---|---|---|---|---|
| D-NOTIF | Notifications | Templates, channels, preferences, dedupe | PLT-NOTIF, INF-NOTIF | SCAFFOLDED |
| D-WF | Workflow & Automation | Definitions, approvals, scheduling, outbox | WF-* | SCAFFOLDED |
| D-AI | AI & Agents | Gateway, registry, tools, policy, audit | AI-* | SCAFFOLDED |
| D-RPT | Reporting & Analytics | Read models, exports, business analytics | ACC-REPORT, MKT-ANALYTICS | SCAFFOLDED |
| D-SEARCH | Search | Text/attribute + geospatial search | INT-SEARCH, GIS-SEARCH | SCAFFOLDED |
| D-KNW | Knowledge | KB, training, local knowledge, expert network | KNW-* | SCAFFOLDED |
| D-ADM | Administration | Global/org/user/scientific admin | ADM-* | SCAFFOLDED |
| D-GEO | Geospatial | Raster/vector/STAC/tiles | GIS-* | SCAFFOLDED |

## Relationships (high level)

- D-IAM/D-ORG/D-TEN/D-RBAC underpin every other domain (identity ≠ organization ≠ role).
- D-TER/D-FARM/D-RANGE/D-Watershed feed D-SCI (model inputs) and D-MRV (indicators).
- D-SCI produces results consumed by D-MRV, D-AGRI advisory (AI), and D-RPT.
- D-MKT/D-INV/D-FIN/D-PAY form the commerce chain; D-FIN is the ledger of record.
- D-AI/D-WF/D-NOTIF are cross-cutting platform capabilities.
- D-GEO serves D-TER, D-SCI, D-MRV, D-TOU.

Dependency rule: a domain reads another domain's data only through `contracts/`, never its tables
(P3). Full dependency rules: [dependency-map.md](./dependency-map.md).