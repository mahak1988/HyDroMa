# Eco Nojin Frontend — Routing & Navigation

**Status:** unified platform (ADR-0010) · **Framework:** `react-router-dom` v7

This documents the **actual** routing architecture: one SPA, lazy sections, one
session.

## 1. One SPA

- `apps/platform` is the only user-facing application, served at `/` by the
  unified host on port 5180.
- The router is `createBrowserRouter` in `apps/platform/src/app/router.tsx`,
  with `basename` from `routerBasename(import.meta.env.BASE_URL)`.
- `apps/brand` is a separate static design showcase at `/brand/`.

## 2. Route map

| Path | Owner | Kind |
|---|---|---|
| `/` | public core (`PortalLayout`) | static content pages + real `/login` |
| `/platform/*` | workspace (`PlatformLayout`) | page registry (`src/content/pages.ts`) |
| `/tourism/*` | tourism section | lazy section, `internal: true` |
| `/market/*` | market section | lazy section, `internal: true` |
| `/landscape/*` | landscape section | lazy section, `internal: true` |
| `/landscape/field/*` | field collection | nested in the landscape section |
| `/landscape/admin/*` | administration | nested in the landscape section |
| `/science/*` | science section | lazy section, `internal: true` |
| `/hydroma` | public intro page | content page; CTA to `/science` |
| `/profile`, `/security` | public core | real console account pages |
| `/api/**` | `services/api` | same-origin proxy |

Each section is loaded through `React.lazy` + `Suspense` with a light
`role="status"` fallback. A failed section chunk does not take down the public
core.

## 3. Navigation

- Public header/footer and page registry are data (`src/public/content/*.ts`,
  `src/content/pages.ts`).
- Section navigation is internal to the section (tourism `NAV`, market
  `NAV_GROUPS`, science `NAV`, admin `NAV_GROUPS`); all section links go through
  a `*/paths.ts` helper so the section prefix is preserved.
- Section entries are listed in `apps/platform/src/sections/manifest.ts` with
  `internal` and a lazy `loader`.

## 4. Guards

- Tourism: `HostRoute` (real session, org `kind === "business"`).
- Market: `SellerRoute` (real session + seller record from the API).
- Admin: `RoutePermissionGuard` with route `handle.permissions` (server
  re-checks every call).
- Field: no route guard; a guest queue stays `pending` until sign-in.

## 5. API

- All frontend calls go to `/api`; Vite dev and both hosts proxy to
  `http://127.0.0.1:8000`.
- Session cookie is `SameSite=Lax`; same-origin is mandatory.
- HyDroMA engine base URL is configurable (`VITE_HYDROMA_BASE_URL`); an
  unreachable engine renders an explicit unavailable state.

## 6. Fallbacks

- Every section declares a catch-all rendering its `NotFoundPage`.
- The platform root declares `path: "*"` → `NotFoundPage`.
- Legacy apps (`console`, `marketplace`, `tourism`, `field-collection`,
  `scientific-workspace`) live under `archive/legacy-*`; they keep their own
  routers for reference but are not served, built or reachable. The registry
  contains `platform` and `brand` only.

## 7. Testing

- `apps/platform/tests/smoke.spec.ts` — public core, workspace, real login.
- `tourism.spec.ts`, `market.spec.ts`, `landscape.spec.ts`, `field.spec.ts`,
  `admin.spec.ts`, `account.spec.ts`, `science.spec.ts` — section e2e.
- `*-a11y.spec.ts` — zero-tolerance axe gate per section.
- `packages/configuration/tests` — registry v2.
- `node --test services/api/tests/api.test.mjs` — API contract.