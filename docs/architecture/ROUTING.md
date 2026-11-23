# Eco Nojin Frontend — Routing & Navigation

**Status:** Phase 2.1 frontend (FE‑4) · **Framework:** `react-router-dom` v7

This documents the **actual** routing architecture. It is not a proposal.

## 1. Architecture
- **Data router** (`createBrowserRouter` + `RouterProvider`) in: `console`, `marketplace`, `tourism`, `portal`, `platform`, `scientific-workspace`.
- **Static (no router):** `home` (public landing), `brand` (visual showcase).
- **Base path:** every router uses `routerBasename(import.meta.env.BASE_URL)` from `@eco-nojin/configuration` — no hardcoded root assumptions.

## 2. Fallback / error routes
- Every router app declares a catch-all `path: "*"` that renders a real **NotFoundPage** (404), not the home/dashboard. `scientific-workspace` was corrected in FE‑4 (previously fell back to the Dashboard).
- Route-level error handling uses `RouteErrorPage` (console) / layout error boundaries.

## 3. Guards (authorization is server-checked; UI is presentation only)
- `console`: `RoutePermissionGuard` (route `handle.permissions`).
- `marketplace`: `SellerRoute` wraps `/seller`.
- `tourism`: `HostRoute` wraps `/host` and `/bookings`.

## 4. Shared shell
- `@eco-nojin/app-shell` provides `AppShell`/`AppHeader`/`AppSidebar`/`AppNav`/`PageHeader`/`Breadcrumbs`. Integrated into **console** (FE‑3). Other apps opt in; no app is forced.

## 5. Navigation
- Nav is data (per-app `NAV_GROUPS` / `NAV` arrays) → mapped to shared `NavGroup`s; active state via `NavLink` (`aria-current="page"`); permission filtering via `can()`.
- Breadcrumbs derived from a per-app `ROUTE_BREADCRUMBS` map (console) or shared `Breadcrumbs`.

## 6. PWA
- `portal` ships `public/manifest.webmanifest` + `public/sw.js` + service-worker registration; scope/base derive from `BASE_URL`. Not verified in an installed browser (no device test); not modified.

## 7. Route-integrity testing
- `apps/scientific-workspace/tests/route-integrity.test.ts` — asserts each router app declares a catch-all, the catch-all maps to `NotFoundPage` (not Dashboard), and ScienceLayout nav targets resolve to declared routes. Wired into the root vitest include.

## 8. Limitations
- No global cross-app route-integrity guard script (per-app tests + this doc instead).
- No E2E/visual verification of navigation in a real browser.
- Only console uses the shared shell; other apps keep their own layouts (opt-in).