# Authentication and Permission Architecture

**Document ID:** `ECO-NOJIN-FE-AUTH-006`
**Status:** As-built
**Verified:** 2026-11-23 · HEAD `3dbd465`

> The frontend never decides identity or authorization. It mirrors the API session and role model to avoid offering dead actions. The API is the authority for every request.

---

## 1. Authentication

### 1.1 Credentials and sessions

| Concern | Implementation |
|---|---|
| Password hashing | `scrypt`, per-user salt, 64-byte key (`services/api/src/auth.mjs`) |
| Session token | 32 random bytes, base64url |
| Session storage | Only the SHA-256 hash of the token is stored in `sessions` |
| Session lifetime | 7 days (`SESSION_DAYS`) |
| Cookie | `nojin_session`, `Path=/`, `HttpOnly`, `SameSite=Lax`, `Max-Age` |
| Logout | Destroys the session row and clears the cookie |
| CORS | `NOJIN_ORIGINS` allow-list; credentials allowed; no wildcard by default |

### 1.2 Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/v1/auth/register` | public | Create user + organization; session cookie. |
| POST | `/v1/auth/login` | public | Password login; session cookie. |
| POST | `/v1/auth/logout` | session | Destroy session. |
| GET | `/v1/auth/me` | session | User, memberships, active organization. |
| POST | `/v1/auth/accept-invite` | public (token) | Accept invitation and create session. |

### 1.3 Frontend session state machine

`RealSessionProvider` (`packages/auth-client/src/real-session.tsx`):

```text
loading ──▶ authenticated
   │            │
   └──▶ unauthenticated
```

- `loading`: initial `/v1/auth/me` call.
- `authenticated`: user + memberships; active organization resolved.
- `unauthenticated`: no session; login/register UI is shown where required.
- Active organization is remembered under `eco.console.org` in `localStorage` (a hint only; the server validates membership).
- No role or identity is stored in `localStorage`; a guest is a guest.

Provider composition (platform):

```text
ThemeProvider > I18nProvider > ToastProvider > RealSessionProvider > RouterProvider
```

The admin section wraps this with `ConsoleSessionProvider embedded`, so it reads the root session instead of creating a second one.

---

## 2. Identity, organization and membership

```text
User ──< Membership >── Organization
```

- **User**: global identity (`id`, `email`, `name`, `status`).
- **Organization**: tenant/legal entity (`id`, `name`, `slug`, `country`, `kind`, `status`).
- **Membership**: role + status inside one organization.
- A user may belong to several organizations; every domain record is scoped by `org_id`.

Organization kinds: `platform`, `region`, `community`, `business`, `research`.

---

## 3. Roles and permissions

### 3.1 Roles

`packages/domain-types/src/permissions.ts`:

| Role | Scope | Description |
|---|---|---|
| `owner` | organization | Full control, including roles and deletion. |
| `admin` | organization | Almost full control; cannot delete the org. |
| `manager` | organization | Operational writes, invitations, no role management. |
| `member` | organization | Read + limited writes by module. |
| `viewer` | organization | Read-only. |

### 3.2 Permission keys

`org.read`, `org.update`, `org.members.read`, `org.members.invite`, `org.members.manage`, `org.roles.manage`, `users.read`, `users.write`, `users.deactivate`, `billing.read`, `billing.manage`, `catalog.read`, `catalog.write`, `orders.read`, `orders.manage`, `landscape.read`, `landscape.write`, `hydroma.run`, `reports.read`, `audit.read`.

Permission strings use `resource:operation` algebra:

- `*` = universal grant.
- `<resource>:*` = every known operation on the resource.
- `manage` implies read/create/update/delete; `write` implies read/create/update.

### 3.3 Matrix (current)

| Role | Permissions |
|---|---|
| owner | all keys |
| admin | all except `org.roles.manage` |
| manager | read-only + invite + user write + catalog write + order manage + landscape write + hydroma run |
| member | read-only |
| viewer | org/members/users/catalog/reports read |

The matrix is shared by UI and server. The server still enforces its own role checks.

---

## 4. Route guards (frontend)

### 4.1 `RoutePermissionGuard`

`packages/auth-client/src/guards.tsx` + `frontend-core/permission.tsx`.

- Reads `handle` from every matched route (`useMatches`).
- Unions permissions across the chain; a child can only narrow access.
- `requireAll` requires all; default requires any.
- `redirectTo` navigates; otherwise renders 403.
- Denial is fail-closed.

### 4.2 `RequireRole`

Used for tourism host area (`isHost`) and seller area (`isSeller`). It is a boolean gate, not a permission string.

### 4.3 Current route protection

| Area | Guard | Notes |
|---|---|---|
| `/login`, `/`, public pages | public | no guard |
| `/profile`, `/security` | session | guest sees `AuthPanel` |
| `/landscape/admin/organizations` | `handle.permissions: org.read` | |
| `/landscape/admin/users` | `users.read` | |
| `/landscape/admin/settings` | `org.update` → redirect `/landscape/admin` | |
| `/tourism/host` | `isHost` (business org) | |
| `/tourism/bookings` | `isHost` | |
| `/market/seller` | `isSeller` (API seller record) | |
| `/platform/*` | **none** | C-01: workspace not gated |
| `/landscape/landscapes/*` | none | local content |
| `/science/*` | public | engine unavailable state |

**Gap (C-06):** Only admin routes declare permission handles. Agriculture, finance, MRV, projects and landscape workspace routes are reachable without a permission check. The data is local today, but this must be fixed before tenant data is added.

---

## 5. Backend authorization

### 5.1 Authentication middleware

Every route with `{ auth: true }`:

1. Reads `nojin_session` cookie.
2. `readSession` validates the token hash and expiry.
3. Loads the user; rejects if missing or `status !== "active"`.
4. Calls the handler.

### 5.2 Organization scoping

- `membershipsOf(userId)` returns active memberships.
- `membershipOf(userId, orgId)` returns the active membership or `null`.
- `orgFrom(ctx, url)` resolves the organization from `organizationId` query param or the first membership, then validates membership. It returns `[404, not_found]` if none.
- Every resource list/create/update/delete filters by `org_id`.
- Cross-tenant access is rejected as 404 (not 403) to avoid existence leaks.

### 5.3 Write authorization

- `WRITE_ROLES = { owner, admin, manager }`.
- `requireWrite(membership)` is checked before mutations (org update, invitations, user create/update, product create, resource create/update).
- Deletion and role changes require `owner` or `admin`.

### 5.4 Resource-level authorization

- `resources` rows are `(id, org_id, type, data)`.
- `GET /v1/resources/:type` lists only the caller's organization.
- `GET /v1/resources/:type/:id` checks `org_id` and `type`.
- `PATCH`/`DELETE` re-check `org_id`, `type` and role.
- `surveys` and `runs` are resource types; `GET /v1/runs` lists the caller's organization's runs.

### 5.5 Audit

Every mutation writes an `audit` row: `org_id`, `actor_id`, `action`, `entity`, `entity_id`, `detail`, `at`. Notifications are derived from audit rows; `notification_state` stores the last seen id per user.

---

## 6. Access request workflow

Current flow (implemented):

```text
Owner/Admin
  └─ POST /v1/organizations/:id/invitations { email, role }
       ├─ user exists → membership invited
       └─ user missing → create user + invited membership
            └─ invitation token returned
Invited user
  └─ POST /v1/auth/accept-invite { token, password }
       └─ session created
```

Gaps:

- No email delivery; the token is returned by the API (operator must distribute it).
- No access-request workflow for a guest to request access to an organization.
- No MFA or step-up authentication.
- No session refresh/rotation; sessions expire after 7 days.
- No rate limiting on login/register.
- No CSRF token; `SameSite=Lax` is the mitigation.

These are security gaps to be closed before production, not current capabilities.

---

## 7. Permission enforcement status

| Layer | Status |
|---|---|
| Session cookie | IMPLEMENTED |
| Password hashing | IMPLEMENTED |
| Organization scoping | IMPLEMENTED |
| Write roles | IMPLEMENTED |
| Role/permission matrix | IMPLEMENTED |
| Admin route handles | IMPLEMENTED |
| Workspace route handles | **MISSING** (C-06) |
| MFA | ABSENT |
| Rate limiting | ABSENT |
| CSRF token | ABSENT (SameSite only) |
| Permission change audit | IMPLEMENTED for role changes |

---

## 8. Security rules for module authors

1. Never read `eco.console.org` to decide permission; read the session.
2. Never store a role in `localStorage` and trust it.
3. Declare `handle.permissions` on every protected workspace route.
4. Show a permission/request-access state, not an empty page.
5. Treat 401 as signed-out, 403 as no access, 404 as not found (do not distinguish existence).
6. Keep the server as the only enforcement point.
7. Do not put tokens, secrets or `VITE_` secrets in the bundle.

---

## 9. References

- `packages/auth-client/src/real-session.tsx`
- `packages/auth-client/src/guards.tsx`
- `packages/domain-types/src/permissions.ts`
- `packages/domain-types/src/identity.ts`
- `services/api/src/auth.mjs`
- `services/api/src/server.mjs`
- [MODULES_AND_ROUTES.md](./MODULES_AND_ROUTES.md) · [CURRENT_STATE_VS_TARGET.md](./CURRENT_STATE_VS_TARGET.md)