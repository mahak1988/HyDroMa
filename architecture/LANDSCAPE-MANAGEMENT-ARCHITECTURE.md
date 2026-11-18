# LANDSCAPE-MANAGEMENT-ARCHITECTURE
## معماری دامنه مدیریت یکپارچه منظر

**Date:** 2026-11-18
**Status:** ARCHITECTURE PROPOSAL — no service deployed, no schema created, no data loaded.
**Relation to existing documents (no duplication):** extends `ECO-NOJIN-MASTER-ARCHITECTURE-V2.md`
§4.4 (L4 Organization & Territory) and consolidates module-catalog entries `TER-LND`, `TER-VIL`,
`TER-NOM`, `TER-WG`, `MKT-VILLAGE` into one coherent domain. HyDroMA stays independent
(`HYDROMA-SCIENTIFIC-ENGINE-ARCHITECTURE.md`); this document only defines the seam.

---

## 0. تصمیم معماری

**Landscape Intelligence & Management یک دامنه اصلی مستقل است**، هم‌تراز با HyDroMA، Marketplace و
Tourism — نه زیرمجموعه هیچ‌کدام.

| Aspect | Decision |
|---|---|
| Layer | L4 (Organization & Territory) — extended |
| Service shape | **one module** `services/landscape` inside the modular monolith, with internal submodules; extraction-ready. The service list in `services/README.md` grows 13 → 15 (this module + `translation`) on approval; until then it is a proposal |
| Why not many services | village/nomadic/rangeland/watershed share the same spatial-temporal core; splitting them would duplicate geometry, tenancy and governance |
| Why not inside HyDroMA | HyDroMA computes; landscape **manages** boundaries, communities, plans and rights. A model must never own an administrative record |
| Village vs Nomadic | two **profiles** over one `Community` core, differing by territory temporality (fixed vs seasonal) — §3 |
| Marketplace/Tourism | consume landscape identifiers; they never own landscape data. Village storefront is `MKT-VILLAGE`, not a new engine |
| Projects | must use the shared project capability (§6), not a private project table |

## 1. Domain map (mission structure → **existing** module catalog)

The 188-module catalog already defines the territory domain as `TER-*`. This architecture **reuses
those IDs** and adds sub-capabilities as `MODULE/capability`. Only two new modules are proposed:
`TER-OBS` (Landscape Observatory) and `PRJ-*` (shared projects) — both flagged in
`I18N-AND-LANDSCAPE-DECISIONS.md` (LND-02) and requiring catalog-owner merge.

| Sub-domain | Canonical module(s) | Sub-capabilities | Owns | Explicitly not |
|---|---|---|---|---|
| Landscape Registry | `TER-LND`, `TER-PARCEL` | `/registry`, `/types`, `/boundary`, `/relationship`, `/history` | profile, type, boundaries, spatial relationships, history | analysis, projects |
| Village Management | `TER-VIL` | `/profile`, `/settlements`, `/households`, `/facilities`, `/infrastructure`, `/economy` | village profile, settlements, households, facilities, local infrastructure | storefront engine, payment |
| Nomadic Community | `TER-NOM` | `/community`, `/social-groups`, `/households`, `/mobility`, `/camps`, `/territories`, `/livestock` | community, social groups, household registry, mobility, camps, seasonal territories, livestock systems | rangeland condition (read from `TER-RNG`) |
| Rangeland | `TER-RNG` | `/registry`, `/vegetation`, `/grazing-plan`, `/capacity-records`, `/monitoring` | rangeland registry, vegetation condition, grazing plans, capacity **records**, seasonal monitoring | computing capacity (HyDroMA), livestock ownership |
| Watershed | `TER-WSH` | `/basin`, `/sub-basins`, `/water-resources`, `/erosion-risk`, `/restoration` | basin registry, water-resource records, erosion-risk records, restoration linkage | hydrological computation |
| Agricultural Landscape | `TER-FRM`, `TER-PARCEL` | `/farms`, `/fields`, `/orchards`, `/cropping`, `/irrigation` | farms, fields, orchards, cropping systems, irrigation systems | production accounting (finance/inventory) |
| Natural Resources | `TER-RES` | `/water`, `/soil`, `/vegetation`, `/biodiversity`, `/forest` | resource inventories per landscape | satellite processing (L6), modelling (HyDroMA) |
| Restoration | `TER-REST`, `MRV-IND`, `MRV-BASE` | `/assessment`, `/plan`, `/interventions`, `/monitoring`, `/outcomes` | degradation assessment, plans, interventions, monitoring outcomes | verification decision (L12 + human) |
| Community Governance | `TER-GOV`, `TER-WG`, `TER-PART` | `/groups`, `/membership`, `/roles`, `/participation`, `/decisions`, `/agreements` | working groups, membership, roles, participation, decisions, agreements | identity, org membership legal record |
| Landscape Projects | **`PRJ-REG`, `PRJ-PLAN`, `PRJ-MILE`, `PRJ-IMP` (proposed)** | — | project registry/plan/milestones/impact links | budget ledger (finance), task runtime (workflow) |
| Landscape Observatory | **`TER-OBS` (proposed)** + `MRV-MON`, `MRV-REP` | `/indicators`, `/monitoring`, `/alerts`, `/dss`, `/reports` | indicator definitions, monitoring events, alert rules, decision-support views | producing scientific values (HyDroMA) |

Existing modules reused, **not recreated**: `PLT-USER`, `PLT-I18N`, `PLT-DOC`, `MKT-VILLAGE`,
`TOU-CONTENT`, `ACC-*`, `INV-*`, `WF-APPROVAL`, `ADM-CONTENT`, `GIS-*`, `MRV-*`, `SCI-*`.

## 2. Boundary matrix (who owns what)

| Capability | Owner | Landscape's role |
|---|---|---|
| Legal entity, membership, roles | `services/organization` | references `organization_id`, `membership_id`; never stores credentials or org roles |
| Person profile, language, timezone | `services/user-management` | references `user_id` only; household data is minimized |
| Boundaries, geometry, spatial relationships | **landscape** (PostGIS-ready model) | authoritative |
| Scientific values (ET, NDVI, soil loss, carrying capacity number) | **HyDroMA** | stores the *reference* to a result + quality flags, never recalculates |
| Satellite imagery, tiles, STAC | L6 Geospatial | stores STAC item IDs only |
| Listings, orders, payouts | `marketplace` / `finance` | village storefront links to a landscape/village scoped seller space |
| Stays, bookings | `tourism` | links listings to a landscape/village |
| Budgets, invoices, ledger | `finance` | project budget references finance documents |
| Stock, inputs, assets | `inventory` | references stock movements; does not own stock |
| Approvals, task runtime | `workflow` | governance decisions and project tasks are workflow instances |
| Documents, media | `content` | document metadata + localized content |
| Notifications, alerts delivery | `notification` | defines alert rules; delivery is delegated |
| Reports, exports | `reporting` | read models over landscape + HyDroMA results |
| Agent runs | `ai-orchestration` | agents read landscape via API; never write without approval |

**Hard rules:** no landscape table is read by another module; no financial document is created in
landscape; no model is executed inside landscape; no rights are *proven* by registration.

## 3. Village and Nomadic: one core, two temporal profiles

```
Community (core)
 ├─ community_type: settled | nomadic | mixed
 ├─ households[]           (minimized personal data)
 ├─ social_groups[]        (tribal / cooperative / council)
 ├─ territory_uses[]       ── settled: fixed polygon + long validity
 │                          └ nomadic: seasonal territories + corridors + camps
 ├─ governance_body_ids[]  (working groups, councils)
 └─ agreements[]           (customary use, dated, sourced)
```

- **Village profile** = `Community(type=settled)` + `Settlement` + `Facility` + `Infrastructure` +
  local economy and 16 sub-dashboards (§7).
- **Nomadic profile** = `Community(type=nomadic)` + `SeasonalTerritory` + `MigrationRoute` +
  `SeasonalCamp` + `WaterPoint` + `LivestockSystem`.
- Shared: geometry primitives, validity periods, governance, documents, indicators, projects,
  permissions. **No second registry** for households, documents or working groups.

### 3.1 Seasonal mobility (first-class, not an attribute)

| Entity | Key fields | Rule |
|---|---|---|
| `MigrationRoute` | route geometry (LineString/MultiLineString), season, start/end window, corridor width, source | a route is **time-bounded**; it may change yearly without losing history |
| `SeasonalCamp` | point/area, capacity, water source, occupancy window, status | can be shared by multiple communities |
| `SeasonalTerritory` | polygon, season (`summer|winter|transitional`), community, rights basis, validity | overlapping claims are **allowed and recorded**, never silently merged |
| `WaterPoint` | point, type, reliability, accessibility, seasonal status | reliability is a **record with source + date**, not a boolean |
| `LivestockSystem` | species, herd composition, counts (period), feed/water demand, dependency | counts are time-series observations, not a mutable number |

Temporal integrity: every spatial claim has `valid_from`/`valid_to`; a query must state the reference
date. There is no single "current" truth for mobile territories.

## 4. Spatial model rules (summary; full entity list in `LANDSCAPE-DOMAIN-MODEL.md`)

1. Geometry stored in EPSG:4326 with `geometry(..., 4326)`; measurement in a projected CRS per
   landscape (configurable) — never compute areas in degrees.
2. Multi-geometry supported; overlapping polygons are first-class (`LandscapeRelationship` with type
   `overlaps|contains|adjacent|shares_resource|corridor_crosses`).
3. Administrative boundaries and ecological boundaries are **separate layers**; no assumption of equality.
4. Every geometry carries: source, accuracy, method, valid period, author, and a data-quality flag.
5. A landscape is **not** a tree node; the model is a graph with typed edges.
6. History is append-only (`LandscapeHistory`), current state is a materialized view.

## 5. Rangeland and carrying capacity — scientific integrity

Landscape stores the **plan and the reference**, HyDroMA produces the **number**.

Required for every carrying-capacity record: model id + version, inputs and units, data sources,
assumptions, valid region, period, calibration, validation, uncertainty, quality flag
(`UNCALIBRATED | EXPERIMENTAL | VALIDATED`). A number without these fields cannot be stored as
`authoritative`; it is stored as `draft` and rendered with a warning badge.

Grazing pressure = livestock demand (from `LivestockSystem`) vs capacity result (from HyDroMA) **with
both sides' uncertainty**; never a single ratio presented as fact.

## 6. Projects and restoration

`PRJ-REG` (shared project capability) owns: id, name, landscape ref, type, implementing org, funding
source, budget **reference**, dates, spatial extent, objectives, baseline, indicators, activities,
milestones, outputs, outcomes, risks, monitoring plan, verification status.

- Budget amounts and payments live in `finance`; the project holds a reference and a read-only rollup.
- Tasks and approvals live in `workflow`.
- Restoration is a project **type** with an additional `RestorationPlan` + `Intervention` +
  `MonitoringEvent` chain; outcomes must reference HyDroMA results and MRV evidence.
- **Open decision LND-02:** create `services/projects` as a shared module, or implement projects as a
  submodule of `workflow`. Both are acceptable; duplication is not.

## 7. Governance (participatory, not jurisdictional)

`LandscapeWorkingGroup` per landscape; members are **references** to `organization` memberships
(never duplicated identities). Membership lifecycle:

1. self-registration → 2. application → 3. identity/data check → 4. approval by authorized manager →
5. role + access grant → 6. activity log → 7. participation review → 8. renewal or revocation.

Governance rules encoded in the design:
- Membership **does not** confer land ownership.
- Registering an area **does not** prove a legal right.
- Customary rights and formal ownership are separate fields with separate sources.
- Local agreements require source + date + version; unsigned drafts are invisible to the public.
- Decisions are append-only with actor, role, quorum basis and timestamp.
- Sensitive decisions require human approval (never an agent).
- Access to household/private data is minimized and audited.

## 8. Multi-tenancy and access control

Scope tuple evaluated on every request:

```
(organization_id, landscape_id?, resource_type, resource_id, data_classification) × (role, permission)
```

| Scope | Meaning |
|---|---|
| Organization Scope | the tenant boundary; hard filter on every query |
| Landscape Scope | user may act only within assigned landscapes |
| Resource Scope | village/rangeland/watershed/farm-level restriction |
| Role | from `organization` role assignments + landscape-specific roles |
| Permission | action-level (`landscape.read`, `landscape.boundary.write`, `governance.decide`, …) |
| Data Visibility | `public / registered / community / restricted / confidential` |
| Approval Authority | who may approve a decision, plan or publication |

Role catalog (configurable data, **not** hardcoded enums): Global Administrator, Country Administrator,
Regional Manager, Landscape Manager, Village Manager, Nomadic Community Coordinator, Rangeland
Manager, Scientific Analyst, Project Manager, Local Representative, Community Member, Business Owner,
Public Viewer.

RBAC is the base; **ABAC** adds conditions (`data_classification`, `landscape_scope`,
`time_window`, `project_membership`). Both are evaluated server-side; the client never decides.

## 9. Dashboards and surfaces

| Surface | Content | Access |
|---|---|---|
| Public landscape page | name, description, type, aggregate indicators, published projects, tourism/marketplace entry | `public` data only |
| Management dashboard | all 15 sections (overview, map, environmental intelligence, community, village/nomadic, agriculture/livestock, rangeland/water, economy, tourism, projects, monitoring, reports, finance rollup, documents, admin) | role + scope |
| Working-group view | membership, decisions, agreements, tasks | group members |
| Scientific view | HyDroMA results with provenance, uncertainty, quality flags | analyst + landscape manager |
| Admin view | boundary editing, membership approval, publication, audit | landscape administrator |

Rules: household data, financial details and sensitive social information **never** appear on public
surfaces; every chart that shows a scientific value also shows its provenance affordance.

## 10. Phasing (input to the roadmap, not an approval)

| Phase | Scope | Why first |
|---|---|---|
| P1 | Landscape registry, boundaries/relationships, village profile, working group, project links, read-only indicators from HyDroMA | creates the object everything else references |
| P2 | Nomadic communities + seasonal mobility, rangeland registry + grazing plans, watershed registry | the differentiating capability; needs P1 geometry |
| P3 | Restoration plans, MRV evidence chain, observatory alerts, comparison views | needs scientific results + validation |
| P4 | Cross-landscape analytics, public observatory, agent-assisted analysis | needs clean P1–P3 data |

## 11. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Landscape becomes a second ERP | unbounded scope | hard boundary matrix (§2); shared services for finance/inventory/projects |
| Duplicate village/nomad models | divergent data | one `Community` core, two profiles (§3) |
| Overlapping claims treated as conflicts to resolve | political/social harm | overlaps are recorded, not merged; rights vs ownership separated |
| Scientific numbers presented without provenance | credibility/legal | quality flags + required provenance fields; no "authoritative" without validation |
| Household data exposure | privacy harm | minimization, classification, field-level access, audit |
| Geometry in degrees / mixed CRS | wrong areas | fixed CRS policy + validation |
| Agent writing landscape data | integrity | agents read-only; writes require human approval |
| Locale/RTL gaps in dashboards | unusable for fa/ar/ur | i18n + RTL gates apply to every surface |

## 12. Acceptance criteria

1. A landscape exists with a unique ID, type, geometry reference, validity period and history.
2. Village and nomadic communities share one household/community/document core (verified by schema).
3. Seasonal routes/territories/camps are time-bounded and multiple communities can overlap.
4. A rangeland capacity value cannot be stored as `authoritative` without HyDroMA provenance fields.
5. Every landscape-scoped query filters by organization and landscape scope (tenancy test).
6. Public surfaces expose no household, financial or restricted data (leak test).
7. Working-group membership follows the 8-step lifecycle and is auditable.
8. Projects reference shared project/budget/workflow capabilities rather than owning them.
