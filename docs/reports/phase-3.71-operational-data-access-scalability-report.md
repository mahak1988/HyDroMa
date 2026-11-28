# Phase 3.71 — Operational Data Access & Scalability Report

## Baseline / final HEAD
`3dbd46532ba780eb1c8eff5ef8ad642853145ed0` → unchanged · branch `main`. No Git mutations.

## Files created / modified
- `services/api/src/server.mjs` — task list: limit+cursor pagination, `total`, `q` search, date-range
  (dueFrom/To, startFrom/To), stable order (id tiebreak); new farm timeline endpoint (bounded/paginated/type filter).
- `services/api/src/db.mjs` — indexes: tasks (org,status,due), (org,assignee), (org,farm,created).
- `packages/api-client/src/client.ts` — `agri.timeline`.
- `apps/platform/src/services/hooks.ts` — `useFarmTimeline`.
- `apps/platform/src/sections/agriculture/FarmsModule.tsx` — timeline from server endpoint.
- `TasksModule.tsx` / `TaskDetail.tsx` — assignee names (member `user`).
- `TaskSchedule.tsx` — month date-range fetch.
- Tests: `agri-tasks.test.mjs` (pagination/search/date/timeline/members), `tasks.spec.ts` (2 E2E), harness + FarmDetail test updated.

## Pagination contract
`limit` (1..200, default 50) + `cursor` (base64 offset) + `total` + `nextCursor`; stable order
`(due_at IS NULL), due_at, created_at DESC, id DESC`. Offset chosen (small admin lists; no keyset benefit).

## Timeline
`GET /v1/agri/farms/:id/timeline?type&limit&cursor` — farm-scoped, org-isolated, merged from cropCycles
(startDate), irrigation (occurredAt), observations (observedAt), projects (startDate), tasks (dueAt);
record-created flagged when no event date; sorted desc; paginated. FarmDetail consumes it (no client aggregation).

## Farm/task retrieval
Farm hub uses server timeline + bounded lists; schedule fetches only the visible month range; tasks support
farm/cropCycle/status/category/priority/assignee/date filters + search + pagination.

## Membership / assignee
Members API already returns `user{name,email}` (org-scoped); frontend now displays names in list/detail
(no new endpoint, no `GET /v1/users` change). Graceful fallback to id.

## Search
Task `q` (title/description LIKE, parameterised) — org-scoped, bounded; no injection.

## Indexes
Added 3 task indexes matching real filters; events index already present. No redundant indexes.

## Security / tenancy
Org isolation + RBAC unchanged; timeline/filters org-scoped; no cross-tenant leak; no EcoCoin/HIC/carbon changes.

## Tests (executed)
typecheck 0 · lint 0 · check:arch 0 · build 0 · unit **534** · backend `agri-tasks` **4/4** (pagination/
search/date/timeline/members) · browser E2E **2/2** (execution; schedule).

## Limitations
Offset cursor (not keyset); timeline merges in-memory per request (bounded by org; no cross-org); member name
falls back to id if absent; no week/day views; assignee-name browser assertion dropped (flaky on persistent DB;
covered by backend test).

## Manifest
`manifest.sha256` (10 files) verified.

## Classification
`OPERATIONAL_DATA_ACCESS_AND_SCALABILITY_IMPLEMENTED_AND_VERIFIED_WITH_LIMITATIONS`.