# apps/console — authenticated workspace

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Responsibility: the shared shell for every authenticated actor (individual user, organization
member, org admin, expert, internal staff): navigation, organization/tenant switching,
role-aware menus, settings, notifications, audit-visible activity.

Boundary:
- In: session/identity via `services/identity`, membership and role claims via
  `services/organization`, personal preferences via `services/user-management`.
- Out: marketplace/tourism transactional UX (separate apps for now), scientific run UI.
- Rule: the console renders capabilities; it never decides permissions locally. Permission
  decisions come from the service layer and are re-checked server-side.

Status: skeleton.
