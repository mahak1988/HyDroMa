# BLOCKED — Product Completion (Owner Authorization Required)

**Date:** 2026-11-22
**Status:** PARTIALLY_COMPLETED
**Verify gate:** PASS (boundaries 328/0, tokens 173, 380 unit + 12 API tests, 9 apps build)

## Blocked capabilities

| # | Capability | App(s) | Blocker | AGENTS.md § |
|---|---|---|---|---|
| 1 | Field Collection sync واقعی | field-collection | auth/session + resources API integration | §3 (Backend/DB/Auth) |
| 2 | Marketplace catalog model | marketplace | Owner decision: public fixture vs org-scoped API | §3 (Domain/decisions) |
| 3 | Run history (GET /v1/runs list) | scientific-workspace | backend endpoint missing | §3 (Backend) |
| 4 | Climate ingestion QC UI | scientific-workspace | backend endpoint (ingest) missing | §3 (Backend) |
| 5 | Real availability | tourism | real source missing | §3 (Backend) |
| 6 | Booking persistence واقعی | tourism | backend contract missing | §3 (Backend) |
| 7 | Account/profile flows واقعی | portal, console | backend auth missing | §3 (Auth) |
| 8 | Flow Builder | (new app) | owner authorization + Monaco/ReactFlow (~2MB) | §3 (Feature activation) |
| 9 | AI Workforce app | (new app) | owner authorization + AI-tool permissions | §3 (AI-tool integration) |
| 10 | 3D capabilities | scientific-workspace, platform | owner authorization; bundle budget (three.js ~600KB, cesium ~2MB) | §3 (Feature activation) |

## Feasible alternatives already implemented
- Field Collection: offline queue (localStorage) with status tracking (pending/synced/failed) + records list + retry/remove.
- Tourism: inquiry form via `/v1/resources/inquiries` (real create).
- Scientific Workspace: RunModelPage + hydroma-client (run submission + provenance).
- Platform: ResourceForm/Table + resources namespace + search/filter + a11y (6 routes).
- Marketplace: sellers from real API; catalog fixture behind TanStack Query (labeled demo).

## Rules
- No fake/demo/mock substitution for blocked capabilities.
- Blocked items must be labeled unavailable in UI (not silently substituted).
- Reopen only on owner authorization or new measurable evidence.

## References
- AGENTS.md §3 (Domain and decisions), §4 (Quality), §5 (Architecture integrity)
- docs/architecture/BUNDLE-BUDGET.md
- docs/architecture/A11Y-GATE.md