# چه چیزی از `upstream-registry` به `apps/` منتقل شود؟
## مطالعه فرانت‌اند: apps ↔ upstream-registry — نگاشت انتقال در جای درست

**تاریخ:** 2026-11-19
**دامنه:** `D:\NOJIN\apps\*` و بخش فرانت‌اند `D:\NOJIN\upstream-registry\*`
**روش:** مطالعه ۵۵ پروژه upstream (کد، نه README) + تطبیق با کد واقعی Eco Nojin + راستی‌آزمایی
**وضعیت:** تحلیلی — هیچ فایلی تغییر نکرد.

---

## 0. خلاصه اجرایی

`apps/` یک فرانت‌اند **کامل از نظر صفحات، ناقص از نظر زیرساخت** است. `upstream-registry` دارای
**الگوهای مهندسی بالغ** است که Eco Nojin در آن‌ها صفر است. این گزارش می‌گوید **چه چیزی، از کجا، به کجا**.

**سه شکاف بزرگ (به ترتیب اثر):**

| # | شکاف | وضعیت فعلی apps | منبع upstream | مقصد |
|---|---|---|---|---|
| **G1** | **بدون Route Guard / Permission در مسیر** | `apps/marketplace/src/app/router.tsx` صاف، بدون `handle`، `*` → HomePage (بدون ۴۰۴)؛ `/seller` برای همه باز | medusa `route-permission-guard.tsx` + `handle.permissions` | `packages/frontend-core` (افزودن `RequireAuth`) + هر `router.tsx` |
| **G2** | **بدون DataTable / Pagination / Filter قراردادی** | `UsersPage` با `useState`؛ `CatalogPage` بدون صفحه‌بندی؛ `<Table>` خام | spree `ResourceTable` + `defineTable` + `FilterRule[]`؛ medusa `DataTable` (URL-state) | `packages/ui` (افزودن `DataTable`) + صفحات |
| **G3** | **بدون Query-Key Factory و invalidation** | console `queries.ts` کلید آرایه‌ای inline؛ marketplace/tourism بدون TanStack Query | medusa `query-key-factory.ts`؛ spree `useResourceKey`/`useResourceMutation` | `packages/frontend-core` یا per-app `hooks/api/*` |

**قاعده حاکم:** کد upstream **کپی نمی‌شود**؛ سازوکار (mechanism) بازنویسی می‌شود. لایسنس کاندیدها:
Medusa MIT، Spree Apache-2.0/BSL، Novu MIT، Directus MSCL، Keycloak Apache-2.0، Grafana AGPL
(فقط standalone)، Kestra Apache-2.0، QloApps OSL (رد)، Arena MIT.

---

## 1. `apps/` چه دارد (خط پایه واقعی)

| اپ | نقاط قوت موجود | ضعف ساختاری |
|---|---|---|
| **console** | `AppShell` کامل (sidebar/header/breadcrumb/drawer)، `DemoSession`، `mock-backend` با `requirePermission`، `queries.ts` + TanStack Query، `api-client`، i18n ۳ زبانه، axe | مسیر بدون `handle.permissions`؛ کلید inline؛ `PermissionMap` فقط boolean؛ فرم دستی؛ جدول خام |
| **portal** | ۱۲ صفحه، `prerender.mjs` واقعی + sitemap/robots، کانتنت ۳ زبانه | بدون CMS؛ بدون i18n در URL (`/:locale/`) |
| **marketplace** | `catalog.ts` (۱۵ دسته)، `cart-logic.ts` (`groupBySeller`)، `money.ts` (minor units)، `SellerDashboardPage` | بدون TanStack Query؛ بدون صفحه‌بندی؛ `*` → HomePage؛ بدون Route Guard؛ جدول خام |
| **tourism** | `time.ts` (validity/months/overlap/sensitivity)، `HostStudio`، `TourismMap` (MapLibre)، `booking` دمو | بدون Route Guard برای `/host`؛ فرم بدون RHF/Zod؛ نقشه view-only؛ بدون legend |
| **scientific-workspace** | `ScienceMap` (MapLibre + deck.gl)، `indicators.ts` با provenance/uncertainty، ۹ صفحه | لایه‌ها hardcode؛ بدون legend؛ بدون metadata layer؛ بدون feature limiter |

**زیرساخت مشترک موجود:** `design-system` (توکن)، `ui` (۱۷ primitive)، `i18n` (۳ locale)،
`frontend-core` (Theme/I18n/QueryClient/`Can`/`PermissionProvider`)، `domain-types`، `spatial` (MapLibre)،
`validation` (Zod — **استفاده‌نشده در فرم‌ها**)، `api-client` (Envelope/Retry/CSRF).

**تصحیح یک ادعا:** `RequireAuth` در `frontend-core` **وجود ندارد** (فقط `Can`/`PermissionProvider`/`usePermissions`).
`apps/console` هم از `apiClient` به‌صورت مستقیم استفاده نمی‌کند؛ از طریق `data/index.ts` استفاده می‌شود.

---

## 2. `upstream-registry` چه دارد (۵ خوشه الگوی قابل انتقال)

### خوشه A — کنسول/داشبورد (medusa · directus · spree · novu · keycloak · grafana)

| الگو | مرجع دقیق | چرا برای Eco Nojin |
|---|---|---|
| **Route Guard از `handle`** | `medusa/packages/admin/dashboard/src/dashboard-app/components/authentication/route-permission-guard/route-permission-guard.tsx` (deepest-wins، fail-open-on-load) | مسیرها اکنون بدون مجوز |
| **Query-Key Factory** | `medusa/.../lib/query-key-factory.ts` (`all/lists()/list/details()/detail`) | کلید inline = invalidation شکننده |
| **Mutation + Invalidation + ۴۲۲ inline** | `spree/packages/dashboard-core/src/hooks/use-resource-mutation.ts` | ۴۲۲ نباید toast شود، inline در فرم |
| **ResourceTable + defineTable + FilterRule** | `spree/.../components/resource-table.tsx` (۱۱۶۰ خط)، `table-toolbar.tsx` (۱۸۸۶ خط)، `filters-to-ransack.ts` | جایگزین `<Table>` خام |
| **URL-as-state + Zod `resourceSearchSchema`** | `spree/.../resource-table.tsx:186` | state در URL = shareable/refresh-safe |
| **Pagination + persisted page size** | `novu/src/components/default-pagination.tsx`، `use-persisted-page-size.ts` | اکنون بدون صفحه‌بندی |
| **Faceted Filter** | `novu/src/components/primitives/form/faceted-filter/facated-form-filter.tsx` | فیلتر CatalogPage |
| **BulkActionBar** | `spree/.../bulk-action-bar.tsx` (`BulkAction`، `{n}` outcome) | SellerDashboard |
| **Permission `resource:operation` + implication** | `medusa/.../lib/permissions/utils.ts`، `permissions-provider.tsx` (fixture bypass) | `PermissionMap` boolean → غنی‌تر |
| **CanCanCan `can(action, subject)`** | `spree/.../lib/permissions.ts` + `components/can.tsx` | seller vs buyer |
| **ProtectedRoute tier-gated** | `novu/src/routes/protected-route.tsx`، `permission-protected-route.tsx` | `/host`، `/seller` |
| **فورم تایپ‌شده مشترک** | `keycloak/js/libs/ui-shared/src/controls/*` (`TextControl`, `FormLabel`, `FormErrorText`) + RHF `FormProvider` | جایگزین `useState` فرم‌ها |
| **Metadata-driven form registry** | `keycloak/.../components/dynamic/components.ts`؛ `collect/.../recordeditor/fields/*` | فرم داده‌محور |
| **Module registry با preRegisterCheck** | `directus/app/src/modules/index.ts` (`router.addRoute` runtime) | فقط اگر پلاگین واقعی لازم شد |

### خوشه B — ژئو/نقشه (geolibre · superset · deck.gl · maplibre-gl-js)

| الگو | مرجع دقیق | چرا برای Eco Nojin |
|---|---|---|
| **SpatialEngine + SpatialCapabilities** | `geolibre/packages/map/src/map-engine.ts` (`MapEngine`، `MapEngineCapabilities` frozen flags) | توقف وابستگی مستقیم به `Map` خام MapLibre |
| **LayerDescriptor + metadata/provenance** | `geolibre/packages/core/src/types.ts` (`GeoLibreLayer` L1375، `LegendConfig` L2064، `LayerDescriptiveMetadata`) | «هر نتیجه علمی باید provenance داشته باشد» |
| **LayerKind taxonomy + engine support matrix** | `geolibre/packages/map/src/layer-kind.ts` (`KIND_BY_TYPE`) | تایپ‌سیف؛ نوع جدید تا engineها نگویند compile نمی‌شود |
| **Legend از symbology** | `geolibre/packages/plugins/src/plugins/components/legend.ts` | ScienceMap/TourismMap اکنون بدون legend |
| **Viewport feature limiter** | `geolibre/packages/geolibre-layer-limiter/src/index.ts` (`AreaPriorityLimiter`، MinHeap O(M log K)) | ۲۶۰ پوینت بدون culling |
| **RTL: languageDirection + DirectionProvider** | `geolibre/apps/geolibre-desktop/src/i18n/languages.ts:45-53` (`RTL_LANGUAGES`)، `applyDocumentDirection`، `packages/ui/src/index.ts` (Radix DirectionProvider) | RTL سیستماتیک، نه فقط `dir` |
| **Catalog auto-discovery** | `geolibre/.../i18n/index.ts:31` (`import.meta.glob('./locales/*.json')`) | افزودن locale = فایل JSON |
| **Chart plugin registry** | `superset/superset-frontend/src/visualizations/presets/MainPreset.ts` + `ChartPlugin.register()` (۵ registry) | نمودار = پکیج |
| **deck.gl CompositeLayer** | `deck-gl/modules/core/src/lib/composite-layer.ts` (`renderLayers`، `getSubLayerProps`) | لایه مرکب، نه inline |
| **Custom CRS seam** | `maplibre-gl-js/src/geo/world_types.ts` (`WorldCoordinateHelper`) + `developer-guides/custom-crs.md` | CRS علمی (UTM/equal-area) |

### خوشه C — تجارت/رزرو (spree · novu · openforis-arena)

| الگو | مرجع دقیق | چرا برای Eco Nojin |
|---|---|---|
| **Tenancy در کلید query** | `spree/.../lib/query-keys.ts` (`useResourceKey` tenantId در position 1) | چندمستأجری ساختاری |
| **useResourceMutation (invalidate + toast + ۴۲۲)** | `spree/.../hooks/use-resource-mutation.ts` | cart/order |
| **ResourceTable برای سفارش/محصول** | `spree/.../tables/orders.tsx`، `products.tsx` | SellerDashboard |
| **Activity feed + Inbox bell** | `novu/src/components/activity/*`، `inbox-button.tsx` | اعلان‌ها |
| **Realtime polling adaptive** | `novu/src/hooks/use-pull-activity.ts` (1s in-flight → 10s settle) | وضعیت سفارش/رزرو |
| **schema-driven form + validation progress** | `arena/webapp/app/components/survey/SurveyForm/SurveyForm.js`، `RecordCompletionBar.tsx`، `RecordPageStatusIcon.tsx` | فرم رزرو/میزبان |
| **map ↔ form ↔ validation** | `arena/.../MapContainer/workspace/MapWorkspace.tsx` (Leaflet+geoman) | گردشگری/علمی |
| **debounce node persist** | `arena/.../store/ui/record/actions/update.js` (`debounceAction` 500ms) | فرم‌های طولانی |

### خوشه D — پلتفرم/ابزار (grafana · kestra · keycloak · flowise)

| الگو | مرجع دقیق | چرا برای Eco Nojin |
|---|---|---|
| **`Registry<T>` generic** | `grafana/packages/grafana-data/src/utils/Registry.ts` (register/get/getIfExists/list، duplicate guard) | پایه هر رجیستری |
| **PanelPlugin / DataSourcePlugin fluent** | `grafana/packages/grafana-data/src/panel/PanelPlugin.ts` | پنل‌های علمی آتی |
| **Zod `zod/mini` در مرزها** | `grafana/public/app/core/utils/parseJsonWithSchema.ts` | اعتبارسنجی runtime |
| **Monaco + language worker registry** | `grafana/packages/grafana-ui/src/components/Monaco/CodeEditor.tsx`، `grafana-data/src/monaco/languageRegistry.ts` | ادیتور سناریو/YAML |
| **Edition swap با Vite alias** | `kestra/ui/vite.config.base.js:36` (`override` → `src/override/` per edition) | white-label |
| **PWA + service worker** | `kestra/ui/src/utils/serviceWorker.ts`، `vite-plugin-pwa` (NetworkOnly API) | portal/tourism آفلاین |
| **Design-system machine-enforced** | `kestra/ui/src/**/kestra-tokens/no-undeclared-css-token` + `colorGuard.spec.ts` | توکن، نه رنگ hardcode |
| **ReactFlow node builder** | `flowise/packages/ui/src/views/canvas/index.jsx` (`nodeTypes`، `onDrop`، `initNode`) | workflow/ai |
| **NodesPool (server scan)** | `flowise/packages/server/src/NodesPool.ts` | رجیستری نود |
| **axe Playwright specs** | `keycloak/js/apps/admin-ui/test/realm-settings/accessibility.spec.ts` (`assertAxeViolations`) | a11y رگرسیون |

---

## 3. نگاشت انتقال: هر ویژگی → کجا در `apps/`

### 3.1 `packages/` (-shared، اولویت بالا)

| ویژگی منتقل‌شده | مقصد دقیق | الگو | فورمن |
|---|---|---|---|
| `SpatialEngine` + `SpatialCapabilities` | `packages/spatial/src/engine.ts` (جدید) | geolibre `map-engine.ts` | P1 |
| `LayerDescriptor` + `LayerRegistry` + `LegendConfig` | `packages/spatial/src/layer.ts` (جدید) | geolibre `types.ts` + `layer-kind.ts` | P1 |
| `AreaPriorityLimiter` | `packages/spatial/src/limiter.ts` (جدید) | geolibre `geolibre-layer-limiter` | P2 |
| `DataTable` (URL-state، sort، columns، pagination، filter) | `packages/ui/src/data-table.tsx` (افزودن) | spree `resource-table.tsx` + medusa `data-table.tsx` | P0 |
| `Pagination` + `usePersistedPageSize` | `packages/ui/src/pagination.tsx` | novu `default-pagination.tsx` | P0 |
| `FilterRule[]` + `resourceSearchSchema` (Zod) | `packages/validation/src/table.ts` | spree `resource-table.tsx:186` | P0 |
| `queryKeysFactory` + `useResourceQuery/Mutation` | `packages/frontend-core/src/query-keys.ts` | medusa `query-key-factory.ts` + spree `use-resource-mutation.ts` | P0 |
| `RequireAuth` + `RoutePermissionGuard` | `packages/frontend-core/src/guard.tsx` | novu `protected-route.tsx` + medusa guard | P0 |
| `resource:operation` permission + `can()` | `packages/domain-types/src/permissions.ts` + `frontend-core/src/permission.tsx` | medusa `permissions/utils.ts` | P0 |
| کنترل‌های فرم تایپ‌شده (`Field`, `FormLabel`, `FormErrorText`) | `packages/ui/src/form-controls.tsx` (گسترش) | keycloak `ui-shared/src/controls/*` | P1 |
| `useForm` + `zodResolver` convention | `packages/validation` + per-app | novu RHF+Zod | P1 |
| `Registry<T>` generic | `packages/frontend-core/src/registry.ts` | grafana `Registry.ts` | P2 |
| `languageDirection` + `DirectionProvider` | `packages/i18n/src/registry.ts` (افزودن) | geolibre `languages.ts:45-53` | P1 |

### 3.2 `apps/console`

| ویژگی | مقصد | الگو | فورمن |
|---|---|---|---|
| `handle.permissions` روی هر route | `src/app/router.tsx` | medusa `get-route.map.tsx` | P0 |
| `<RoutePermissionGuard>` | `src/app/guards.tsx` (جدید) | medusa `route-permission-guard.tsx` | P0 |
| refactor `queries.ts` به factory + invalidation | `src/features/identity/queries.ts` | medusa `hooks/api/products.tsx` | P0 |
| `DataTable` جای جدول خام | `UsersPage.tsx`, `OrganizationsPage.tsx` | spree `ResourceTable` | P0 |
| URL-as-state (search/role/status/page) | `UsersPage.tsx` | spree `resourceSearchSchema` | P1 |
| فرم دعوت با RHF+Zod | `UsersPage.tsx` invite dialog | keycloak RHF controls | P1 |
| `BulkActionBar` (تغییر نقش گروهی) | `UsersPage.tsx` | spree `bulk-action-bar.tsx` | P2 |
| `RequireAuth` در ریشه | `src/main.tsx` | novu | P0 |

### 3.3 `apps/marketplace`

| ویژگی | مقصد | الگو | فورمن |
|---|---|---|---|
| `QueryProvider` + `queryKeys` | `src/main.tsx` + `src/hooks/api/*` (جدید) | spree `query-keys.ts` | P0 |
| `useProducts/useOrders` با cache/invalidation | `src/hooks/api/products.ts` | spree `hooks/*.ts` | P0 |
| `DataTable` + فیلتر امانی + مرتب‌سازی | `CatalogPage.tsx` | spree `ResourceTable` + novu faceted filter | P0 |
| صفحه‌بندی (`Pagination` + persisted page size) | `CatalogPage`, `SellerDashboardPage`, `OrdersPage` | novu | P0 |
| `<ProtectedRoute>` برای `/seller/*` | `src/app/router.tsx` | novu `protected-route.tsx` | P0 |
| `BulkActionBar` (stock/status) | `SellerDashboardPage.tsx` | spree `bulk-action-bar.tsx` | P1 |
| `useResourceMutation` (۴۲۲ inline) | cart/checkout | spree `use-resource-mutation.ts` | P1 |
| `404` واقعی (به‌جای `*`→Home) | `src/app/router.tsx` | console `NotFoundPage` | P0 |
| `Activity feed` سفارش‌ها | `OrdersPage.tsx` | novu `activity-table.tsx` | P2 |

### 3.4 `apps/tourism`

| ویژگی | مقصد | الگو | فورمن |
|---|---|---|---|
| `<ProtectedRoute>` برای `/host` | `src/app/router.tsx` | novu | P0 |
| `useBookings` query/mutation | `src/store/bookings.tsx` → hooks | spree | P1 |
| فرم رزرو RHF+Zod | `BookPage.tsx` | keycloak RHF + spree ۴۲۲ | P1 |
| `Legend` + `LayerDescriptor` | `TourismMap.tsx` | geolibre `legend.ts` | P1 |
| `validation progress` + `ValidationReport` | booking/host | arena `RecordCompletionBar` | P2 |
| map ↔ form (draw → request) | `TourismMap` + `BookPage` | arena `MapWorkspace` | P2 |

### 3.5 `apps/scientific-workspace`

| ویژگی | مقصد | الگو | فورمن |
|---|---|---|---|
| `LayerDescriptor` + metadata/provenance روی هر لایه | `ScienceMap.tsx` | geolibre `GeoLibreLayer` | P0 |
| `Legend` (از symbology) | `ScienceMap.tsx` | geolibre `legend.ts` | P0 |
| `SpatialEngine`/`Capabilities` | `packages/spatial` | geolibre `map-engine.ts` | P1 |
| `AreaPriorityLimiter` | `ScienceMap.tsx` | geolibre `layer-limiter` | P1 |
| `ChartPlugin` registry | `src/components/charts/*` | superset `MainPreset` | P2 |
| Monaco/YAML برای سناریو | `SimulationPage.tsx` | kestra `monaco-yaml` | P2 |
| `Registry<T>` برای لایه/نمودار | `packages/frontend-core` | grafana `Registry.ts` | P2 |

### 3.6 `apps/portal`

| ویژگی | مقصد | الگو | فورمن |
|---|---|---|---|
| PWA + service worker (NetworkOnly API) | `portal/vite.config.ts` + `src/utils/serviceWorker.ts` | kestra | P2 |
| i18n در URL (`/:locale/`) | `src/app/router.tsx` | nellavio `[locale]` | P2 |
| `Registry`-based sections | `src/content/*` | velora registry | P2 |

---

## 4. اولویت‌بندی و تخمین

| فورمن | موارد | خروجی قابل تحویل | تخمین |
|---|---|---|---|
| **P0** (۱–۲ هفته) | RequireAuth + RouteGuard، queryKeysFactory، DataTable+Pagination، FilterRule schema، 404، ProtectedRoute در marketplace/tourism | «زیرساخت کنسول/داشبورد بالغ» — GDPR تنسی/مجوز/جدول | ۸–۱۲ نفر-روز |
| **P1** (۲–۴ هفته) | SpatialEngine+LayerDescriptor+Legend، RHF+Zod فرم‌ها، languageDirection، activity feed | «نقشه/فرم/RTL بالغ» | ۱۵–۲۵ نفر-روز |
| **P2** (آتی) | Limiter، ChartPlugin، Monaco/YAML، Registry<T>، ReactFlow، PWA، edition swap | «پلتفرم افزونه/گردش‌کار» | ۲۰–۴۰ نفر-روز |

**مسیر بحرانی:** P0 ابتدا روی `packages/ui` + `packages/frontend-core` (زیرساخت مشترک)، سپس
console،سپس marketplace/tourism. **بدون P0، صفحات جدید فقط UI هستند نه محصول.**

---

## 5. چه چیزی **نباید** منتقل شود

| مورد | منبع | دلیل |
|---|---|---|
| **Redux / Redux Toolkit** | grafana, arena | Eco Nojin از TanStack Query استفاده می‌کند؛ دو منبع state = تعارض |
| **PatternFly / MUI / AntD / Element Plus** | keycloak/arena/superset/kestra | با design-system توکن‌محور Eco Nojin تعارض؛ فقط الگوی کنترل |
| **Clerk SaaS** | kiranism | وابستگی خارجی سخت؛ D-04 باز |
| **QloApps / Webkul کد** | qloapps | OSL 3.0 + proprietary؛ فقط مفهوم |
| **Grafana AGPL کد** | grafana | فقط standalone |
| **Directus MSCL کد** | directus | فقط الگو |
| **iframe ZK designer** | collect | کهنگه؛ فقط به‌عنوان escape hatch |
| **Monaco در bundle اصلی** | kestra/grafana | ۴.۵MB؛ فقط lazy |
| **Tailwind/Emotion/styled-components ترکیبی** | grafana/superset | یکپارچگی استایل را می‌شکند |

---

## 6. برنامه اجرایی پیشنهادی (۶ گام)

1. **گام ۱ — P0 مشترک:** `packages/frontend-core` → `RequireAuth` + `RoutePermissionGuard` +
   `queryKeysFactory`؛ `packages/ui` → `DataTable` + `Pagination`؛ `packages/validation` → `resourceSearchSchema`.
2. **گام ۲ — console:** `handle.permissions` روی ۸ مسیر، refactor `queries.ts`، `DataTable` در Users/Orgs.
3. **گام ۳ — marketplace:** `QueryProvider`، `useProducts/useOrders`، `DataTable` در Catalog، `ProtectedRoute` برای `/seller`.
4. **گام ۴ — tourism:** `ProtectedRoute` برای `/host`، RHF+Zod در `BookPage`، `Legend` در نقشه.
5. **گام ۵ — scientific-workspace:** `LayerDescriptor` + `Legend` + provenance روی لایه‌ها.
6. **گام ۶ — portal:** PWA + i18n در URL.

**قاعده پذیرش هر گام:** typecheck + lint + boundary + unit + e2e سبز؛ بدون وابستگی جدید؛ بدون کد upstream.

---

## 7. یافته‌های کلیدی (خلاصه مدیریتی)

1. **بزرگ‌ترین شکاف، Route Guard است** — نه صفحات. `/seller` و `/host` اکنون بدون مجوز باز هستند.
2. **DataTable + Pagination غایب مطلق است** — ۴ اپ، صفر جدول حرفه‌ای.
3. **TanStack Query در marketplace/tourism استفاده نمی‌شود** — زیرساخت موجود است، استفاده نشده.
4. **Zod نصب است ولی در فرم‌ها استفاده نمی‌شود** — اعتبارسنجی دستی.
5. **نقشه بدون legend/metadata/limiter** — با قاعده provenance پروژه سازگار نیست.
6. **RTL فقط `dir` است** — بدون languageDirection/DirectionProvider/آینه‌سازی آیکون.
7. **۴۰۴ در marketplace/tourism وجود ندارد** (`*` → Home).
8. **همه الگوهای لازم در upstream موجود است** — Eco Nojin نیازی به اختراع ندارد، فقط انتخاب و بازنویسی.

**END OF REPORT**