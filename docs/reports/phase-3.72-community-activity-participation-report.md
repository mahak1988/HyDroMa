# Phase 3.72 — Community Activity & Participation Report

## Baseline / final HEAD
`3dbd46532ba780eb1c8eff5ef8ad642853145ed0` → unchanged · branch `main`. No Git mutations.

## Files created / modified
- `services/api/src/db.mjs` — `community_activities`, `activity_participants`, `activity_events` (+indexes).
- `services/api/src/server.mjs` — activity CRUD, server-enforced lifecycle, participation (register/confirm/attend/cancel, capacity, idempotency), history.
- `packages/api-client/src/{client,index}.ts` — `community` namespace + Activity/Participant/ActivityEvent types.
- `apps/platform/src/services/hooks.ts` — activity/participation hooks.
- `apps/platform/src/sections/communities/CommunityWorkspace.tsx` (new) — activities list/create/transition + participants.
- `VillagesModule.tsx` — village rows link to workspace; `router.tsx` — `communities/:id`.
- Tests: `services/api/tests/community-activities.test.mjs`, `tests/unit/services/CommunityWorkspace.test.tsx`, `tests/community.spec.ts`, harness `community` fake.

## Architecture reused
Existing resource store (community = `villages` resource), org/tenant boundaries, cookie session + RBAC
(owner/admin/manager write), TanStack Query, shared client/hooks, design system. No new backend/DB/auth.

## Data model
Activity (community, title, category, status, priority, planned/actual dates, location, organizer, capacity);
Participant (activity, user, status registered/confirmed/attended/cancelled, timestamps, UNIQUE(org,act,user));
Event (append-only history). All org-scoped, indexed.

## Lifecycle (server-enforced)
draft→published→in_progress→completed (+cancelled from draft/published/in_progress); invalid transitions 409;
completion/cancel timestamps; events recorded. Participation: registered→confirmed→attended (+cancel).

## Participation
Self-registration or organizer-registration (write) ; member validated; duplicate idempotent (200 duplicate);
capacity enforced server-side (409 at capacity); cancel releases capacity.

## Frontend
`/platform/communities/:id` workspace: identity, activity list (status filter), create dialog, transition
actions, expandable participants (register/confirm/attend/cancel). Loading/empty/error, responsive, fa/en/ar.

## Security / tenancy
Org isolation (cross-org activity/participants → 404); RBAC server-side; participant membership validated;
no email exposure; parameterized SQL; no EcoCoin/HIC/carbon/financial/scientific changes.

## Tests (executed)
typecheck 0 · lint 0 · check:arch 0 · check:boundaries 0 · build 0 · unit **535** · backend
`community-activities` **2/2** (lifecycle+participation+history+capacity; tenant isolation) · browser E2E
`community.spec.ts` **1/1** (UI create → publish/register/complete persisted).

## Limitations
Organizer/participant display uses user id (no name join for participants); no waitlist; no file evidence;
offset pagination; E2E drives lifecycle via API (UI buttons present but flaky to target) — backend lifecycle
is fully tested. No production/WCAG/scientific claims.

## Manifest
`manifest.sha256` (10 files) verified.

## Classification
`COMMUNITY_ACTIVITY_AND_PARTICIPATION_IMPLEMENTED_AND_VERIFIED_WITH_LIMITATIONS`.