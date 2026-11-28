# Components and Hooks

**Document ID:** `ECO-NOJIN-FE-COMP-003`
**Status:** As-built inventory + duplication findings
**Verified:** 2026-11-23 · HEAD `3dbd465`

> Scope: shared packages (`packages/*`) and the components/hooks inside `apps/platform`. Legacy app internals under `archive/legacy-*` are reference only and are not part of the runtime.

---

## 1. Shared component packages

### 1.1 `@eco-nojin/ui`

| Component / module | Responsibility | Status |
|---|---|---|
| `Button`, `Spinner` | Actions and loading. | Existing |
| `Form controls` (`Input`, `Select`, `Textarea`, …) | Accessible form primitives. | Existing |
| `Data display` (`Badge`, `Card`, `Notice`, `EmptyState`, …) | Status and content display. | Existing |
| `DataTable` | Sortable/filterable table with typed columns. | Existing |
| `Pagination`, `PageSizeSelect` | Pagination. | Existing |
| `Tabs` | Tabbed content. | Existing |
| `Dialog`, `Dropdown`, `Tooltip` | Overlays. | Existing |
| `Alert`, `ToastProvider`, `useToast` | Feedback. | Existing |
| `DatePicker` | Date input. | Existing |
| `ResourceForm`, `ResourceTable` | CRUD helpers. | Existing |
| `Charts` + `createChartRegistry` | Chart registry and defaults. | Existing |
| `AppSwitcher` | Legacy app switcher. | Existing, **unused in platform** |

### 1.2 `@eco-nojin/app-shell`

| Component | Responsibility | Status |
|---|---|---|
| `AppShellShell` (`shell.tsx`) | Console shell frame (sidebar, header, content). | Existing |

### 1.3 `@eco-nojin/frontend-core`

| Export | Responsibility | Status |
|---|---|---|
| `ThemeProvider`, `useTheme` | Light/dark/system theme. | Existing |
| `I18nProvider` re-export | Locale + direction + formatting. | Existing |
| `AppProviders`, `createQueryClient` | Shared providers. | Existing; platform composes providers directly, sections use `QueryClientProvider` |
| `ErrorBoundary` | App-level error boundary. | Existing |
| `PermissionGate`, `useRouteAccess`, `Can`, `usePermissions` | Permission-aware UI. | Existing |
| `useFormState` | Form state helper. | Existing |
| `queryKeysFactory`, `invalidationKeys` | Query-key conventions. | Existing |
| TanStack Query re-exports | One query version across apps. | Existing |

### 1.4 `@eco-nojin/auth-client`

| Export | Responsibility | Status |
|---|---|---|
| `RealSessionProvider`, `useRealSession` | The single session state machine. | Existing |
| `AuthPanel` | Real login/register UI. | Existing |
| `RequireRole`, `RoutePermissionGuard`, `AccessDenied` | Route guards. | Existing |
| `readRequirements` | Collects route `handle` permissions. | Existing |

### 1.5 `@eco-nojin/api-client`

| Export | Responsibility | Status |
|---|---|---|
| `createApiClient` | Typed client for auth, users, organizations, catalog, resources, notifications. | Existing |
| `createTransport` | Same-origin fetch, timeout, retry, error envelope. | Existing |
| `toQuery`, pagination types | List query helpers. | Existing |

### 1.6 Domain packages

| Package | Responsibility | Status |
|---|---|---|
| `@eco-nojin/domain-types` | Identity, permissions, tourism, commerce, money, registry. | Existing |
| `@eco-nojin/spatial` | MapLibre/deck.gl helpers. | Existing |
| `@eco-nojin/scientific` | Scientific UI helpers. | Existing |
| `@eco-nojin/hydroma-client` | HyDroMA HTTP client. | Existing |
| `@eco-nojin/icons` | Icon set. | Existing |
| `@eco-nojin/design-system` | Tokens (`tokens.css`, `base.css`, `tailwind.css`). | Existing |

---

## 2. Layout components (platform)

| Component | Location | Responsibility | Status |
|---|---|---|---|
| `PortalLayout` | `src/public/app/PortalLayout.tsx` | Public header, language/theme menus, footer. | Existing |
| `PlatformLayout` | `src/app/PlatformLayout.tsx` | Workspace sidebar, search, section nav; accepts `basePath`, `sections`, `pages`. | Existing |
| `TourismLayout` | `sections/tourism/app/TourismLayout.tsx` | Tourism header/nav/footer. | Existing |
| `MarketLayout` | `sections/market/app/MarketLayout.tsx` | Market header, search, cart badge. | Existing |
| `ScienceLayout` | `sections/science/app/ScienceLayout.tsx` | Science header and domain nav. | Existing |
| `FieldLayout` | `sections/landscape/field/app/FieldLayout.tsx` | Nested field sub-layout; no duplicate landmarks. | Existing |
| `AppShell` | `sections/landscape/admin/app/layouts/AppShell.tsx` | Admin/console shell. | Existing |
| `PageRenderer` | `src/pages/PageRenderer.tsx` | Renders 73 workspace page definitions by `kind`. | Existing |
| `PageView` | `src/public/app/PageView.tsx` | Public content page renderer. | Existing |
| `AuthPage` | `src/public/app/AuthPage.tsx` | Login/register page using `AuthPanel`. | Existing |
| `AccountPage` | `src/public/app/AccountPage.tsx` | Profile/security in public core. | Existing |
| `NotFoundPage` | `src/public/app/PageView.tsx` / section 404s | 404 states. | Existing |

---

## 3. Domain components (selection)

| Component | Location | Responsibility |
|---|---|---|
| `TourismMap`, `LazyTourismMap` | `sections/tourism/components` | MapLibre map, lazy. |
| `DestinationCard`, `StayCard`, `ExperienceCard` | `sections/tourism/components/Cards.tsx` | Tourism cards. |
| `HostStudio` | `sections/tourism/components/HostStudio.tsx` | Host dashboard content (placeholder). |
| `ProductCard`, `ProductTable` | `sections/market/components` | Catalog display. |
| `ScienceMap` | `sections/science/components` | deck.gl/MapLibre map. |
| `DomainPage` | `sections/science/pages/DomainPage.tsx` | Shared water/soil/climate/vegetation page. |
| `Identity tables/forms` | `sections/landscape/admin/features/identity` | Organizations, members, users. |
| `Observation queue` | `sections/landscape/field` | Offline-first form and records. |

---

## 4. Hooks

### 4.1 Shared / platform

| Hook | Location | Responsibility | Status |
|---|---|---|---|
| `useRealSession` | `@eco-nojin/auth-client` | Session status, user, memberships, active org, login/logout. | Existing |
| `useI18n` | `@eco-nojin/i18n` | Locale, direction, `t()`, formatters. | Existing |
| `useTheme` | `@eco-nojin/frontend-core/theme` | Theme mode. | Existing |
| `usePermissions`, `useRouteAccess` | `@eco-nojin/frontend-core` | Permission checks. | Existing |
| `usePageMeta` | `src/public/app/meta.ts` | Title/description/canonical. | Existing |
| `useSite` | `src/public/content/useContent.ts` | Public content for the active locale. | Existing |

### 4.2 Section hooks

| Hook | Location | Responsibility | Status |
|---|---|---|---|
| `useTourismSession` | `sections/tourism/session` | `isHost` from real session (business org). | Existing |
| `useTourism` | `sections/tourism/content` | Tourism content bundle. | Existing |
| `useBookings` | `sections/tourism/store/bookings` | Local demo booking store. | Existing |
| `useMarketSession` | `sections/market/session` | guest/buyer/seller from real session. | Existing |
| `useCart` | `sections/market/store/cart` | Local cart. | Existing |
| `useProducts`, `useProduct`, `useSeller`, `useSellers` | `sections/market/hooks/api/catalog` | TanStack Query catalog hooks. | Existing |
| `useObservations` | `sections/landscape/field/store` | Local queue + real sync. | Existing |
| `useWorkspace` | `sections/science/app/WorkspaceContext` | Science workspace state. | Existing |
| `useHydromaModels` | `sections/science/services` | Engine model registry state. | Existing |
| `useSession`, `useSessionOrNull` | `sections/landscape/admin/session` | Console session + role. | Existing |
| `useNotifications`, `useHealth` | `sections/landscape/admin/hooks` | Admin data. | Existing |
| `useOrganizations`, `useOrganization`, `useMembers`, `useUsers`, `useUser` | `sections/landscape/admin/features/identity/queries` | Identity queries. | Existing |

---

## 5. Services and API clients

| Service | Location | Boundary |
|---|---|---|
| Eco Nojin API | `services/api` | Session, orgs, users, catalog, resources, runs, notifications, health, models. |
| API client | `packages/api-client` | Only allowed frontend caller of the API; no direct `fetch` in components except a few admin hooks. |
| HyDroMA client | `packages/hydroma-client` + `sections/science/services/hydroma.ts` | Engine `/v1/models` and run endpoints; loopback base by default. |
| EDI | `services/edi` (Python) | Independent; canonical storage/contracts; offline by default. Not imported by frontend. |
| Design tokens | `packages/design-system` | Single token source; no hard-coded colours. |

**Finding:** `sections/landscape/admin/hooks/useConsoleData.ts` uses direct `fetch` for notifications/health rather than the typed client. This is a duplication/consistency issue, not a capability gap.

---

## 6. Duplication and dead code findings

| ID | Finding | Impact | Recommendation |
|---|---|---|---|
| D-01 | `sections/landscape/admin/app/router.tsx` + `app/RouteErrorPage.tsx` are a copied legacy console router; the section router is `admin/router.tsx`. | Dead code, confusing. | Remove in a code task; not in this documentation mission. |
| D-02 | `sections/landscape/field/pages/NotFoundPage.tsx` is unused; field 404 uses `EmptyState`. | Dead code. | Remove or route it. |
| D-03 | `AppProviders` in `frontend-core` is not used by the platform; sections use `QueryClientProvider` directly. | Two provider patterns. | Document one; migrate later. |
| D-04 | `AppSwitcher` in `@eco-nojin/ui` is unused by the platform. | Dead UI. | Archive with legacy apps. |
| D-05 | Admin hooks use raw `fetch` while the rest uses `api-client`. | Inconsistent error handling. | Migrate to `session.api`. |
| D-06 | Tourism and market have separate local stores for bookings/cart. | Correct (module independence), but no cross-module contract. | Define contracts when M07/M18 become real. |
| D-07 | Public content `landscape`, `marketplace`, `tourism` keys are unused. | Content duplication. | Remove or render. |
| D-08 | `services/edi` is untracked in Git. | Not reproducible. | Owner decision to commit. |

---

## 7. Proposed shared components

| Component | Purpose | Module |
|---|---|---|
| `ModulePageHeader` | Consistent module title, breadcrumb, actions. | M01–M18 |
| `CapabilityState` | Standard unavailable/pending/empty state. | all |
| `PermissionBadge` | Show required permission and request access. | M02 |
| `CrossModuleLink` | Contract-aware navigation between modules. | all |
| `EntityTable` | Typed table wrapper around `DataTable`. | M03–M13 |
| `StatusBadge` | Unified `pending/synced/failed/verified`. | M10, M11, M13 |
| `ContractDialog` | Show EDI/HyDroMA contract version and provenance. | M14–M16 |
| `ModuleErrorBoundary` | Isolate a lazy section failure. | all |

These are **proposed**; they are not implemented and must not be assumed to exist.