# تحلیل کامل کدهای فرانت‌اند در `upstream-registry`
## Eco Nojin / HyDroMA — گزارش مطالعه و تحلیل (READ-ONLY)

**تاریخ:** 2026-11-18
**محدوده:** تمام ۵۴ پروژه استخراج‌شده در `D:\NOJIN\upstream-registry`
**حالت:** فقط خواندن و تحلیل. هیچ کدی تغییر نکرد، هیچ نصب/بیلد/سروری اجرا نشد.

---

## 1. خلاصه اجرایی

- در ۵۴ مخزن، **۶۳٬۹۶۱ فایل فرانت‌اند** (کد، استایل، قالب) شناسایی شد؛ پس از حذف `node_modules`, `dist/build`, `vendor`, `test`, `examples`, `docs`.
- فرانت‌اند این مجموعه سه نسل فناوری هم‌زمان دارد:
  1. **نسل جدید (۲۰۲۴–۲۰۲۶):** React 19 + Vite + React Router 7/8 + TanStack Query + Tailwind 4 (medusa, novu, geolibre, spree, arena, collect-earth-cloud, erpnext-banking).
  2. **نسل میانی:** React 18 + webpack/Vite + Redux Toolkit + MUI/AntD (grafana, superset, flowise, collect, keycloak).
  3. **نسل قدیمی:** jQuery + Bootstrap + Smarty/Twig/PHP (dolibarr, qloapps, farmos)، React 17 (collect-earth-online)، کلاس‌کامپوننت با لایه state سفارشی (sepal)، وانیلا JS (node-red editor).
- **React غالب است** (≈ ۲۲ اپ)، سپس **Vue 3** (directus, kestra) و یک نمای Next.js (novu human-dashboard). هیچ Svelte/Angular در مجموعه نیست.
- چهار کتابخانه/موتور فرانت‌اند خالص هم موجود است که «اپ» نیستند: **maplibre-gl-js، deck.gl، cesium، giro3d** — این‌ها لایه رندر و پایه محصولات Geospatial هستند.
- بالاترین بلوغ مهندسی فرانت‌اند (معماری + تست + i18n): **grafana، superset، directus، medusa، geolibre، kestra**.
- مناسب‌ترین الگوهای قابل اقتباس برای Nojin: **سیستم افزونه/Injection-Zone مدوسا**، **ثبت ماژول مبتنی بر مجوز در Directus**، **الگوی PluginManager محدودشده (scoped) در GeoLibre**، و **لایه i18n/RTL GeoLibre**.

---

## 2. روش کار و دامنه شمارش

**چه چیزی «فرانت‌اند» شمرده شد:** `.ts .tsx .js .jsx .vue .svelte .css .scss .sass .less .html .htm .hbs .mustache .ejs .twig .tpl .ftl .jsp .xhtml .astro`

**استثناها:** `node_modules`, `dist`, `build`, `coverage`, `vendor`, `third_party`, `*.git*`, `.next`, `out`, `tmp`, `__pycache__`, پوشه‌های `test/tests/spec/e2e`, `examples/demo`, `docs`, `man`.

**هشدار متدولوژیک:** شماره فایل ≠ حجم کد. LOC فقط برای پوشه‌های `src` اپ‌های اصلی اندازه‌گیری شد و شامل تست‌ها هم هست. اعداد «فایل» از پیمایش کامل مخزن با فیلترهای بالا به‌دست آمده است.

---

## 3. نقشه فناوری — جدول اصلی

| پروژه | فایل FE | LOC (src) | فریم‌ورک / UI Kit | بیلد | State/Data | تست | i18n |
|---|---:|---:|---|---|---|---|---|
| medusa (admin) | 11,903 | 296k | React 18.3 + `@medusajs/ui` (Radix/Tailwind) | Vite + tsup | TanStack Query 5 + RR7 loaders | 33 (src) | 35 زبان، RTL جزئی |
| grafana | 9,952 | 1.20M | React 19 + `@grafana/ui` + Emotion | webpack 5 + Nx 24 | Redux Toolkit 2 + RR5 | 2,411 | 5,981 فایل locale |
| novu (dashboard) | 9,440 | 193k | React 19 + Tailwind 4 + shadcn/Radix + Recharts | Vite 8 | TanStack Query 5 + RR7 | 36 (src) | i18n محدود |
| directus (app) | 3,792 | 348k | Vue 3 + Pinia + Vite | Vite | Pinia + composables | 423 | vue-i18n + YAML |
| superset | 3,782 | 560k | React 18 + AntD 6 + Emotion + ECharts 6 | webpack 5 + Lerna | Redux Toolkit 1.9 + RR5 | 860 | ۳۰+ زبان (Babel `.po`) |
| openforis-arena | 2,883 | 96k | React 19 + MUI 9 + MapLibre 6 + D3/Recharts | webpack 5 | Redux Toolkit 2 + RR8 | 253 | i18next |
| cesium | 2,882 | — | JS/TS + WebGL (engine/widgets) | rollup/gulp | — | Playwright | — |
| sepal (gui) | 2,659 | 254k | React 19 + CSS Modules + state سفارشی | Vite 8 | Redux 5 + `connect`/`compose` سفارشی | 364 | ۳ زبان |
| spree (dashboard) | 2,232 | 152k | React 19 + Tailwind + shadcn | Vite | TanStack Query 5 | 39 | ۹ زبان (ar دارد) |
| kestra (ui) | 2,189 | 314k | Vue 3.5 + Element Plus + ECharts + Monaco | Vite 8 | Pinia + vue-router 5 | 587 | ۱۳ زبان |
| flowise (ui) | 1,861 | 93k | React 18 + MUI 5 + ReactFlow | Vite 5 | Redux (قدیمی) | 2 | محدود |
| qloapps | 1,797 | — | Smarty `.tpl` + jQuery + Bootstrap 3 | — | — | — | — |
| geolibre | 1,770 | 496k + 285k (packages) | React 19 + Tailwind 4 + MapLibre 6 + Cesium 26 + three | Vite 8 (+Tauri) | Zustand + PluginManager | 983 | ۲۱ زبان، **RTL کامل** |
| dolibarr | 1,157 | — | PHP + jQuery + Bootstrap + Leaflet/jsgantt | — | — | — | چندزبانه |
| keycloak (js) | 1,082 | 99k | React 18 + PatternFly 5 + react-hook-form | Vite 7 | RR7 + context | 14 | i18next |
| erpnext | 848 | — | Frappe Desk (jQuery/Vue جزیره‌ای) + banking React 19 | Vite (banking) | — | — | `fa.po` دارد |
| collect (designer) | 789 | 22k | React 19 + Redux 5 + MUI 9 + Chart.js | Vite 8 | Redux | 0 | — |
| deck.gl | 693 | — | TS + WebGL + luma.gl monorepo | ocular/rollup | — | تست per-module | — |
| collect-earth | 621 | — | ۳ SPA: React+MUI / TanStack Query / MapLibre | Vite | Query | — | — |
| maplibre-gl-js | 593 | — | TS + WebGL + workers | Vite | Zustand (داخلی) | Vitest 5 | — |
| giro3d | 276 | — | TS + three 0.180 + OpenLayers | webpack 5 | — | Vitest | — |
| collect-earth-online | 150 | — | React 17 + OpenLayers 6 + styled-components | Vite+webpack | Redux | 0 | — |
| prometheus (app) | 139 | — | React 18 + RR7 + Mantine UI | Vite | — | 33 | — |
| opentripplanner (client) | 99 | — | React 19 + MapLibre + Bootstrap 5 | Vite | — | Vitest | — |
| node-red (editor) | — | 178k | وانیلا JS + jQuery (editor-client) | — | — | — | چندزبانه |
| farmos | 53 | — | Drupal + Twig + JS وانیلا | — | — | — | — |

---

## 4. تحلیل معماری — به تفکیک خانواده

### 4.1 پلتفرم‌های داشبورد سازمانی

**Medusa Admin — بهترین الگوی «هسته + افزونه»**
- هسته `DashboardApp` مسیرها، منوها، ویجت‌ها، فرم‌ها، نمایش‌ها و layoutها را از پلاگین‌ها ادغام می‌کند و یک `ExtensionApi` محدود بیرون می‌دهد (`packages/admin/dashboard/src/dashboard-app/dashboard-app.tsx:63-596`).
- هر صفحه lazy است و در `src/routes/<domain>/<domain>-<page>/index.ts` فقط `Component/loader/Breadcrumb/seo` صادر می‌کند؛ فرم‌های create/edit به‌صورت child-route در `RouteDrawer`/`RouteFocusModal` رندر می‌شوند.
- لایه داده کاملاً یکدست: هر منبع یک فایل `src/hooks/api/<resource>.tsx` با `queryKeysFactory` و `sdk.admin.*` و invalidation هدفمند.
- RTL نیمه‌کاره اما آگاهانه: `rtl:rotate-180` در آیکون‌ها، `Switch dir="ltr"` و هوک اختصاصی `hooks/use-document-direction.tsx`.
- مناسب برای Nojin: الگوی Injection Zone برای «افزونه‌های دامنه‌ای» (مثلاً ماژول هیدرولوژی/کشاورزی) بدون فورک هسته.

**Grafana — بزرگ‌ترین و بالغ‌ترین، با بدهی نسخه‌ای**
- ۷٬۶۱۱ فایل و ۱٫۲ میلیون خط در `public/app`؛ ۶۰ پوشه feature (dashboard, explore, alerting, datasources…) و Nx monorepo با ۱۸ پکیج.
- React 19 در کنار `react-router@5` و reducerهای قدیمی: فشار مهاجرت جدی. تست‌ها بسیار قوی (۲٬۴۱۱ فایل).
- ریسک حقوقی: **AGPL-3.0-only** → فقط به‌صورت سرویس مستقل و بدون تغییر، نه embed در محصول اختصاصی.

**Apache Superset — معماری افزونه‌محور نمودار**
- هسته `@superset-ui/core` + رجیستری plugin؛ `visualizations/presets/MainPreset.ts` ده‌ها پلاگین ECharts و `preset-chart-deckgl` و نقشه‌های جغرافیایی را ثبت می‌کند.
- ۱۷ پوشه پلاگین مستقل (`plugins/plugin-chart-*`) — الگوی خوب برای «نمودار = پکیج مستقل».
- بدهی: RR5 + AntD 6 + RTK 1.9؛ Emotion/styled-components هم‌زمان؛ ۵۶۰k خط.

**Directus App — Vue 3 با ثبت ماژول مجوزمحور**
- `modules/index.ts` ماژول‌ها را با `import.meta.glob` کشف می‌کند و پیش از ثبت، `preRegisterCheck(user, permissions)` را اجرا می‌کند؛ سپس مسیرها را پویا به router اضافه می‌کند (`app/src/modules/index.ts:9-58`).
- ۹ ماژول (content, files, insights, flows, users, settings…) + ۱۴۵ کامپوننت + ۲۴ store + 45 interface و 21 display؛ مدل افزونه‌پذیری‌اش برای «فیلد سفارشی» بسیار قابل‌آموزش است.
- مجوز: MSCL (source-available/GPL) → استفاده تجاری نیازمند بررسی حقوقی.

**Keycloak — React روی PatternFly**
- `admin-ui`, `account-ui`, `ui-shared` به‌صورت پکیج جدا؛ PatternFly 5 + react-hook-form + RR7 + i18next.
- تم‌های سرور با FreeMarker (`.ftl`, ۱۱۱ فایل) هنوز بخشی از UX ورود/ثبت‌نام است → دو لایه استایل موازی.

**Novu — مسیر داده مدرن، تست کم**
- `main.tsx` با ۸۱۶ خط جدول مسیر صریح، گیت‌های `ProtectedRoute(permission=...)` و gating نسخه‌های EE/Cloud.
- کامپوننت‌ها Radix/shadcn + Tailwind 4؛ TanStack Query؛ اما تست src فقط ۳۶ فایل و اپ دوم (Next.js 16) موازی.

**Spree / Kestra / Flowise / Prometheus**
- Spree: کوچک و منظم (۵۷۸ فایل/۱۵۲k خط)، shadcn + TanStack Query، ۹ زبان؛ الگوی خوب برای «داشبورد تجارت».
- Kestra: تنها اپ بزرگ Vue؛ Element Plus + ECharts + Monaco؛ `override/` برای سفارشی‌سازی enterprise؛ PWA و Service Worker.
- Flowise: ReactFlow محور؛ Redux قدیمی با `@reduxjs/toolkit` هم‌زمان؛ فقط ۲ تست → ریسک نگهداشت.
- Prometheus: اپ React کوچک روی داده Prometheus با Mantine.

**OpenForis Arena / SEPAL — دامنه‌ای و سنگین**
- Arena: React 19 + MUI 9 + MapLibre 6 + D3/Recharts، Redux Toolkit؛ ۱٬۸۷۰ فایل/۹۶k خط اما فقط ۲۴٪ TS (بقیه JS)؛ ۲۵۳ تست. ساختار `webapp/{app,components,views,model,service,store,theme}` و `core/common/server` monorepo. نزدیک‌ترین اپ به نیاز «پرسش‌نامه میدانی + نقشه + اعتبارسنجی داده» در Eco Nojin.
- SEPAL: React 19 ظاهری، اما در عمل کلاس‌کامپوننت + `connect/compose` سفارشی + CSS Modules + صفر TS. ۲۵۴k خط و ۳۶۴ تست. سیستم ویجت (panel, tabs, split, toolbar, activation) الگوی جالبی برای workspaceهای علمی است، ولی هزینه نگهداشت بالاست.

### 4.2 خانواده ژئو/ویژوال (بااهمیت‌ترین برای HyDroMA)

| پروژه | نقش | نکات معماری کلیدی |
|---|---|---|
| **maplibre-gl-js** | موتور 2D برداری/رستری | جداسازی main-thread/Worker؛ `Bucket`ها بافرهای WebGL می‌سازند؛ `ARCHITECTURE.md` مسیر tile→layout→draw را مستند کرده؛ CRS سفارشی از طریق `WorldCoordinateHelper` |
| **deck.gl** | لایه‌های GPU | ۱۶ ماژول (`layers`, `geo-layers`, `aggregation-layers`, `mesh-layers`, `react`, …)؛ ۸۸ پکیج مثال؛ الگوی «لایه = پکیج» |
| **cesium** | کره/صحنه 3D | `engine` (Core/Renderer/Scene/DataSources/Workers) + `widgets` (Viewer, Timeline, BaseLayerPicker…) + `sandcastle` (React/Vite) |
| **giro3d** | صحنه 3D روی three.js | `entities`, `sources`, `formats`, `renderer`, `interactions` + پنل‌های Inspector (`src/gui/*`) برای دیباگ لایه‌ها/دوربین/کش |
| **geolibre** | GIS Workbench کامل | ۸ پکیج (`core, map, ui, plugins, processing, embed, collab-core, layer-limiter`) + دو اپ (desktop Tauri، mcp-app)؛ MapLibre و Cesium هم‌زمان |
| **opentripplanner client** | دیباگ مسیریابی | React 19 + MapLibre 6 + Bootstrap 5، کوچک و خوانا |
| **superset maps** | BI نقشه‌ای | پلاگین‌های `deckgl`, `cartodiagram`, `country-map`, `point-cluster-map`, `world-map` |

**GeoLibre — دقیق‌ترین سیستم افزونه در مجموعه**
- `PluginManager` رجیستری‌های host را بر اساس «مالک» آزاد می‌کند تا افزونه غیرفعال، اثر باقی نگذارد (`packages/plugins/src/plugin-manager.ts:23-31`).
- `scopeAppToPlugin` یک API محدود و generation-aware به هر افزونه می‌دهد؛ پشتیبانی از maplibre و cesium به‌صورت `MapRendererKind`.
- i18n کامل: `languageDirection()` برای ar/he/fa/ur و `DirectionProvider` در UI؛ کشف خودکار `locales/*.json` (۲۱ کاتالوگ).
- هزینه: اپ دسکتاپ ۹۹۹ فایل TS و ۴۹۶k خط؛ وابستگی سنگین Cesium+deck.gl+DuckDB-WASM (در ماتریس قابلیت هم «Heavy» علامت خورده).

### 4.3 داده‌محور / Field Collection (Open Foris)

| پروژه | Stack | ارزیابی |
|---|---|---|
| `collect` (webapp) | React 19 + Redux 5 + MUI 9 + RR7 + Chart.js | Survey Designer با ۳۰۰ فایل JS/JSX در `src` (۵۲۰ در کل مخزن)، بدون تست؛ ساختار `surveydesigner / datamanagement / backuprestore / security` |
| `collect-earth` | ۳ SPA مستقل | `map-ui` (MUI+Vite)، `cloud-dashboard` (TanStack Query+MUI)، `explorer` (MapLibre) |
| `collect-earth-online` | React 17 + OL 6 + styled-components + بک‌اند Clojure | نسل قدیمی؛ React 17 پایان پشتیبانی؛ فقط ۱۳۶ فایل |
| `collect-mobile` | Android/Java | فرانت‌اند بومی، خارج از دامنه وب |

### 4.4 سیستم‌های CMS/ERP سنتی

| پروژه | لایه UI | ریسک/نکته |
|---|---|---|
| **dolibarr** | PHP + jQuery + Bootstrap + Leaflet/jsgantt/ace؛ ۹۵۶ فایل JS و ۱۳۷ CSS | بدون بیلد مدرن؛ GPL-3.0؛ تست فرانت‌اند ندارد |
| **qloapps** | Smarty `.tpl` (۷۱۱) + jQuery + Bootstrap 3 + ۲۲۴ CSS | فورک PrestaShop 1.6؛ OSL-3.0؛ صفر TS |
| **erpnext** | Frappe Desk (server-rendered + bundleهای jQuery/Vue) + تنها یک SPA مدرن (`banking`, React 19/Vite/Tailwind 4) | GPL-3.0؛ UI اصلی خارج از این مخزن (frappe) است |
| **farmos** | Drupal + Twig (۱۴) + JS وانیلا (۱۵) | GPL-2.0؛ حداقل فرانت‌اند اختصاصی |

### 4.5 Low-code / Flow Builders
- **node-red** editor-client: ۴۴۷ فایل JS و ۱۷۸k خط، وانیلا JS + jQuery؛ قدیمی ولی کاملاً بالغ؛ Apache-2.0.
- **flowise**: ReactFlow برای چارت جریان + MUI؛ افزونه‌پذیری از طریق Nodeها؛ EE جدا.
- **kestra**: فرم‌های YAML/Code editor با Monaco، توپولوژی با پکیج `@kestra-io/topology`، و `override/` برای نسخه enterprise.

---

## 5. الگوهای مشترک و مقایسه

### 5.1 لایه داده
| الگو | پروژه‌ها |
|---|---|
| TanStack Query 5 (مدرن) | medusa, novu, spree, collect-earth-cloud, erpnext-banking |
| Redux Toolkit | grafana, superset, arena, flowise, collect, sepal, ceo |
| Zustand | maplibre (داخلی), geolibre core |
| Pinia / کامپوزبل | directus, kestra |
| State سفارشی/legacy | sepal (`connect`, `selectFrom`), node-red |

**نتیجه:** برای محصول جدید Nojin، TanStack Query + React Router data-router الگوی کم‌ریسک و اثبات‌شده است (medusa/novu/spree).

### 5.2 سیستم طراحی
- Tailwind + Radix/shadcn: medusa, novu, spree, geolibre
- MUI: arena, collect, collect-earth, flowise
- AntD: superset
- Element Plus: kestra
- PatternFly: keycloak
- Emotion/styled-components/custom CSS: grafana, sepal, directus, ceo

**نتیجه:** هیچ استاندارد واحدی در مجموعه نیست؛ انتخاب Nojin باید مستقل و مبتنی بر `brand/` و `eco-nojin-visual-identity-v3` انجام شود، نه تقلید از یک مخزن.

### 5.3 بین‌المللی‌سازی و RTL
- i18next غالب است (medusa, novu جزئی, arena, geolibre, keycloak, spree).
- کاتالوگ فارسی فقط در: **geolibre (`fa.json`)، medusa (`fa.json`)، erpnext (`fa.po`)، superset (`fa/`)**.
- **RTL واقعی:** فقط **geolibre** (تشخیص زبان + `DirectionProvider` + `dir` سند) و **medusa** به‌صورت جزئی (`rtl:` classes + هوک `use-document-direction`).
- kestra فقط `direction="rtl"` موضعی در یک کامپوننت دارد؛ سایر اپ‌ها RTL ساختاری ندارند.

**نتیجه:** اگر Nojin فارسی/عربی است، الگوی geolibre تنها مرجع کامل و قابل اتکاست.

### 5.4 تست
| سطح | پروژه‌ها |
|---|---|
| قوی (>۲۵٪ فایل‌ها) | grafana (2,411), geolibre (983), superset (860), kestra (587), directus (423), sepal (364), arena (253) |
| متوسط | medusa (33), novu (36), spree (39), keycloak (14), prometheus (33) |
| ضعیف/صفر | flowise (2), collect (0), collect-earth-online (0), farmos/qloapps/dolibarr (بدون تست فرانت‌اند) |

### 5.5 الگوهای افزونه‌پذیری (قابل اقتباس)
1. **Injection Zones + ExtensionApi** — medusa (`dashboard-app.tsx`)
2. **Module preRegisterCheck + dynamic routes** — directus (`modules/index.ts`)
3. **Owner-scoped PluginManager + renderer capability** — geolibre (`plugin-manager.ts`)
4. **Chart plugin registry/preset** — superset (`MainPreset.ts`)
5. **override directory for EE** — kestra (`ui/src/override`)
6. **Widget composition (panel/tabs/split/toolbar)** — sepal (`widget/*`)

---

## 6. یافته‌های کیفی (نقاط قوت/ضعف)

**قوت‌ها**
- مرزبندی روشن کتابخانه/اپ در خانواده ژئو (maplibre/deck/cesium/giro3d) → قابلیت ترکیب بدون فورک.
- استفاده گسترده از lazy routes و code-splitting در اپ‌های مدرن.
- وجود مستندات معماری درون‌مخزنی (`maplibre ARCHITECTURE.md`, `AGENTS.md`های medusa/directus/novu) که هزینه onboarding را کم می‌کند.
- i18n ساختاریافته با اسکیمای ترجمه در medusa (`translations/$schema.json` + تست اعتبارسنجی).

**ضعف‌ها/ریسک‌ها**
- **واگرایی نسخه‌ها:** React 17/18/19، RR 5/7/8، AntD 6 در کنار RTK 1.9 در superset؛ React 19 + RR5 در grafana.
- **اپ‌های بدون تست** در مسیرهای حساس (collect survey designer، flowise، ceo).
- **دوباره‌کاری شدید در لایه نقشه:** MapLibre در ۶ پروژه با نسخه‌های 6.3 تا 6.18.
- **RTL سطحی** در اکثر اپ‌ها؛ فقط geolibre کامل است.
- **حجم:** grafana ۱٫۲M خط، superset ۵۶۰k، directus ۳۴۸k — فورک/هارد-فیکس اقتصادی نیست.
- **قفل حقوقی:** AGPL (grafana)، GPL (erpnext, dolibarr, farmos, hydromt)، OSL (qloapps)، MSCL (directus)، EE (novu, flowise, medusa plugins).

---

## 7. توصیه‌های اجرایی برای Eco Nojin / HyDroMA

1. **پایه نقشه:** MapLibre GL JS به‌عنوان استاندارد 2D؛ deck.gl برای لایه‌های داده سنگین؛ Giro3D یا Cesium فقط برای نیاز واقعی 3D (نه هر دو).
2. **پوسته محصول:** الگوی ترکیبی medusa + directus:
   - مسیرها/منوها/ویجت‌ها از یک رجیستری افزونه با zones؛
   - دسترسی‌ها با `preRegisterCheck(permission)`؛
   - صفحات lazy با loader و query cache مشترک.
3. **لایه داده:** TanStack Query + React Router data router؛ پرهیز از Redux برای داده سرور.
4. **i18n/RTL:** الگوی geolibre (`languageDirection`, `DirectionProvider`, کشف خودکار کاتالوگ) + اسکیمای ترجمه medusa؛ فارسی به‌عنوان locale درجه‌یک با تست pseudo-RTL.
5. **داشبورد تحلیلی:** Superset (Apache-2.0) به‌صورت سرویس مستقل و افزونه‌های deck.gl/ECharts؛ Grafana فقط standalone به‌دلیل AGPL.
6. **پرهیز از فورک:** برای ERP/CMS از dolibarr/qloapps/erpnext/directus فقط به‌صورت سرویس جدا یا مطالعه الگو استفاده شود، نه ادغام کد.
7. **حداقل معیار پذیرش فرانت‌اند جدید Nojin:** TypeScript strict، تست برای هر route حساس، i18n از روز اول، RTL تست‌شده، و بدون وابستگی به UI Kit دوگانه.

---

## 8. کارهای پیشنهادی بعدی

- اندازه‌گیری bundle size واقعی برای کاندیدهای مبنا (MapLibre+deck.gl+React) و مقایسه با GeoLibre.
- استخراج یک «Design Token» مشترک از `brand/` و نگاشت آن به Tailwind (نه کپی از MUI/AntD).
- بررسی حقوقی سه مورد اثرگذار بر فرانت‌اند: grafana (AGPL)، directus (MSCL)، novu/flowise (EE).
- ساخت POC افزونه Nojin بر اساس Injection Zone مدوسا + PluginManager ژئولیبر (فقط ۲ ماژول نمونه).

---

## پیوست الف — داده خام (تعداد فایل FE به تفکیک پسوند)

| پروژه | کل | ترکیب اصلی |
|---|---:|---|
| medusa | 11,903 | `.ts` 8,171 · `.tsx` 3,124 |
| grafana | 9,952 | `.ts` 5,106 · `.tsx` 4,734 |
| novu | 9,440 | `.ts` 7,551 · `.tsx` 1,841 |
| directus | 3,792 | `.ts` 3,139 · `.vue` 596 |
| superset | 3,782 | `.ts` 1,942 · `.tsx` 1,784 |
| arena | 2,883 | `.js` 1,484 · `.ts` 963 · `.tsx` 202 |
| cesium | 2,882 | `.js` 2,410 · `.html` 319 · `.ts` 47 |
| sepal | 2,659 | `.js` 1,587 · `.jsx` 736 |
| spree | 2,232 | `.ts` 1,563 · `.tsx` 659 |
| kestra | 2,189 | `.ts` 1,500 · `.vue` 575 |
| flowise | 1,861 | `.ts` 1,310 · `.jsx` 285 |
| qloapps | 1,797 | `.tpl` 711 · `.js` 633 |
| geolibre | 1,770 | `.ts` 1,319 · `.tsx` 331 |
| dolibarr | 1,157 | `.js` 956 · `.css` 137 |
| keycloak | 1,082 | `.tsx` 630 · `.ftl` 111 |
| erpnext | 848 | `.js` 581 · `.html` 112 |
| collect | 789 | `.js` 397 · `.jsx` 123 |
| deck.gl | 693 | `.ts` 503 |
| collect-earth | 621 | `.ts` 401 · `.tsx` 166 |
| maplibre-gl-js | 593 | `.ts` 590 |
| giro3d | 276 | `.ts` 250 |
| collect-earth-online | 150 | `.jsx` 123 |
| prometheus | 139 | `.tsx` 79 · `.ts` 46 |
| invest | 105 | `.js` 46 · `.jsx` 25 |
| opentripplanner | 99 | `.tsx` 60 |
| openzeppelin | 90 | `.ts` 53 |
| farmos | 53 | `.css` 24 · `.js` 15 · `.twig` 14 |
| mapserver | 36 | `.html` 36 |
| titiler | 25 | `.html` 24 |
| seaweedfs | 20 | `.js` 10 |
| agno | 12 | `.ts` 5 |
| node-red* | 11 | (editor در `packages/node_modules/@node-red/editor-client`: ۴۴۷ فایل JS) |
| opentelemetry-collector | 7 | `.html` 7 |
| langgraph | 6 | `.ts` 5 |
| modflow6 | 4 | `.css` 4 |
| opensearch | 3 | `.ftl` 3 |

\* شمارش node-red از پوشه ریشه به‌دلیل قرارگیری editor در `packages/node_modules` کم است؛ آمار واقعی editor در ردیف خودش آمده است.

**پروژه‌های بدون فرانت‌اند وب قابل توجه (خارج از دامنه این گزارش):** wflow-jl, hydromt-wflow, landlab, aquacrop-ospy, xclim, climate-indices, swatplus, titiler(فقط قالب HTML), pgstac, odc-stac, pystac, temporal, langgraph, agno, openzeppelin, mapserver, wps, rhem-*, pcse, flopy, pygeoprocessing, invest(فقط workbench کوچک), opensearch, seaweedfs, prometheus(سرور).
