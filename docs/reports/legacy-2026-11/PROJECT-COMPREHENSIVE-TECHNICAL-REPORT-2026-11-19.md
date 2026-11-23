# گزارش فنی و تحلیلی جامع پروژه Eco Nojin
## مطالعه کل کدها و مستندات + تفسیر + برنامه یکپارچه‌سازی (نسخه نهایی ادغام‌شده)

**تاریخ:** 2026-11-19
**دامنه:** `D:\NOJIN` (کد، مستندات، آرشیوها، رجیستری upstream)
**روش:** مطالعه مستقیم فایل‌ها + اجرای راستی‌آزمایی‌های واقعی + ادغام با گزارش Stage 2.8
**وضعیت:** تحلیلی — هیچ تغییری در کد محصول داده نشد؛ این سند فقط گزارش است.

---

## 0. خلاصه اجرایی (Executive Summary)

پروژه Eco Nojin یک **پلتفرم چندکشوری/چند سازمانی** است که سه محصول را ترکیب می‌کند:
1. **اکوسیستم کسب‌وکار** (مارکت‌پلیس، گردشگری، سازمان‌ها)
2. **موتور علمی HyDroMA** (آب، خاک، اقلیم، کشاورزی، MRV)
3. **نیروی کار هوشمند حکومتی‌شده** (AI Workforce با مجوز و Audit)

ساختار فعلی یک **مونو‌رپوی فرانت‌اند** با معماری **Modular Monolith** طراحی‌شده برای بک‌اند
(هنوز پیاده‌نشده) است. لایه فرانت‌اند **کاملاً پیاده‌سازی و تست شده** است:

| لایه | وضعیت واقعی (با شاهد) |
|---|---|
| ۵ برنامه فرانت‌اند (console, portal, marketplace, tourism, scientific-workspace) | **IMPLEMENTED + TESTED** — داده‌ها DEMO |
| ۸ پکیج مشترک (design-system, ui, i18n, frontend-core, domain-types, spatial, validation, api-client) | **IMPLEMENTED + TESTED** |
| سرویس‌های بک‌اند (۱۳ دامنه) | **SKELETON** — فقط README مرزی |
| موتور علمی (hydroma ۱۵ دامنه + ai-workforce ۶ جزء) | **SKELETON** — فقط قرارداد ۷ بخشی |
| قراردادها (api/events/schemas/scientific-models) | **SKELETON** — هیچ OpenAPI موجود نیست |
| پایگاه داده، زیرساخت، CI/CD | **NOT IMPLEMENTED** |
| مخزن Git | **موجود** — ۹ کامیت، برنچ `main`، تگ `fe-phase-1`، ۸۴۲ فایل tracked |

**وضعیت commit‌نشده (مهم):** کارهای Stage 2.8 (اپ tourism + پکیج spatial + domain-types/tourism.ts)
و همچنین تغییرات پیکربندی (playwright configها، package.json، tsconfig، vitest، check-boundaries،
ScienceMap) **هنوز commit نشده‌اند** — درخت کارfilled تغییرات دارد. این با قاعده پروژه سازگار است
(commit فقط با درخواست صریح مالک).

**تناقض مستندات با واقعیت:** README.md، apps/README.md، packages/README.md و
ARCHITECTURE-DECISIONS-OPEN.md هنوز می‌گویند «هیچ قابلیتی پیاده نشده و مخزن Git وجود ندارد» —
در حالی که ۵ اپ فعال و مخزن Git موجود است. کهنگگی مستندات پس از Phase 1/2 باید اصلاح شود.

**نتیجه یکپارچه‌سازی:** وضعیت فعلی «پایه فرانت‌اند آماده، بک‌اند صفر» است. مسیر:
**قراردادهای OpenAPI → سرویس identity/organization → اتصال console به API واقعی → سرویس‌های دامنه**.

---

## 1. شواهد راستی‌آزمایی (Verification Evidence — اجرای مجدد 2026-11-19)

| بررسی | دستور | نتیجه |
|---|---|---|
| TypeScript | `npm run typecheck` | **PASS** — ۰ خطا |
| Lint | `npm run lint` (oxlint) | **PASS** — بدون یافته |
| مرزبندی معماری | `node scripts/check-boundaries.mjs` | **OK — ۱۹۶ فایل / ۱۳ واحد** (شامل tourism و spatial) |
| تست واحد | `npm test` (vitest) | **PASS — ۱۴ فایل / ۹۱ تست** |
| ساخت console | `npm run build` | **PASS** — ۷۴۷ms |
| Build tourism (Stage 2.8) | `npm run build:tourism` | **PASS** — initial JS 175.70 kB gzip؛ map chunk 296.77 kB gzip |
| Regression (Stage 2.8) | e2e چهار اپ | console 75/75 · portal 76/76 · HyDroMA 61/61 · marketplace 53/53 |
| امنیت (Stage 2.8) | `npm audit --omit=dev` | **PASS** — ۰ آسیب‌پذیری |

**وضعیت Git (۲۰۲۶-۱۱-۱۹):** ۹ کامیت، برنچ `main`، تگ `fe-phase-1`، Remote ندارد.
درخت کارfilled تغییرات commit‌نشده دارد: ۱۵ فایل تغییریافته + پوشه‌های untracked
(`apps/tourism/`، `packages/spatial/`)، از جمله:
```
 M apps/console/playwright.config.ts (+testIgnore)   M apps/marketplace/playwright.config.ts
 M apps/portal/playwright.config.ts                  M apps/scientific-workspace/* (package, vite, ScienceMap)
 M apps/tourism/README.md                            M package.json / package-lock.json
 M packages/domain-types/src/index.ts                M scripts/check-boundaries.mjs
 M tsconfig.json / vitest.config.ts                  ?? apps/tourism/ (کامل)   ?? packages/spatial/
```

---

## 2. نقش فایل‌های ریشه (Root Files)

| فایل | نقش |
|---|---|
| `README.md` | معرفی پروژه، معماری در یک نگاه — **نیازمند به‌روزرسانی** (وضعیت را کهنه می‌گوید) |
| `AGENTS.md` | قواعد دائمی توسعه: حفاظت داده، Git، دامنه تصمیم، کیفیت، یکپارچگی معماری |
| `ARCHITECTURE-DECISIONS-OPEN.md` | ۱۷ تصمیم باز مالک (D-GIT-01, D-FE-01, D-04, D-DB-01/02, D-PROD-01/02, D-AI-01, …) — هیچ‌کدام نهایی نشده |
| `ECONOJJIN-ARCHITECTURE-BASELINE.md` | خط پایه معماری: Modular Monolith، مرزهای سخت، ۵ اپ، ۱۳ سرویس، ۲ موتور |
| `ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md` | معماری ۹ مرز مالکیتی (Design System → UI → Core/HyDroMA/Marketplace → Services → Contracts → Integration → Upstream) |
| `ECO-NOJIN-ARCHITECTURE-CORRECTION-AND-READINESS.md` | اصلاح مستندات F-01…F-06 + ماتریس آمادگی + توالی T-0…G6 |
| `DEVELOPMENT-FOUNDATION-REPORT.md` | ارزیابی ۷ کاندید فریم‌ورک (Next.js ۸۷.۸) — توصیه غیرالزام‌آور |
| `FIRST-PRODUCT-SLICE-REPORT.md` | شاهد تنها دارایی کد قدیمی: geo-measure (IMPLEMENTED+UNIT_TESTED) |
| `NEXT-IMPLEMENTATION-PLAN.md` | برنامه دروازه‌ای G0→G4 + Wave 1/2/3/D برای ۵۴ upstream |
| `INDEPENDENT-ARCHITECTURE-AND-CODE-REVIEW.md` | بازبینی مستقل: ۱۵/۱۶ ادعا TRUE، F-01 (Python) FALSE، ۱۰ یافته |
| `FRONTEND-FOUNDATIONS-REPORT.md` | ارزیابی ۴ مخزن فرانت‌اند (nellavio, kiranism, velora, orbyn) — همه MIT، بدون RTL |
| `FRONTEND-COMPARISON-MATRIX.md` | ماتریس وزنی: velora/orbyn ۷۵، nellavio ۷۳، kiranism ۷۰ — RTL=۱ برای همه |
| `FRONTEND-STUDY-PASS2-2026-11-18.md` | ممیزی کد ۵۵ پروژه upstream: XSS sink، localStorage، ErrorBoundary، توکن، واگرایی نسخه ژئو |
| `FRONTEND-UPSTREAM-CODE-ANALYSIS.md` | تحلیل ۶۳٬۹۶۱ فایل فرانت‌اند در ۵۴ پروژه: سه نسل فناوری، الگوهای Medusa/Directus/GeoLibre |
| `ROOT-STRUCTURE-MANIFEST.md` | منشور ساختار ریشه: مسئولیت و وضعیت هر پوشه + انحرافات عمدی |
| `UPSTREAM-FRONTEND-MANIFEST.json` | provenance ماشین‌خوان ۴ پروژه batch-16 (commit, SHA256, license, build) |
| `UPSTREAM-INTEGRATION-STATUS.csv` | ۵۴ ردیف: دامنه، لایسنس، ریسک، کلاس (ADOPT/INTEGRATE/DEFER/REJECT)، Wave، هزینه |
| `package.json` | ریشه monorepo: npm workspaces (۵ اپ + ۸ پکیج)، اسکریپت‌های dev/build/test/lint/typecheck/boundary/verify |
| `package-lock.json` | قفل وابستگی‌ها (تولیدشده، در Git) |
| `tsconfig.json` | تک‌پروژه strict typecheck با aliasهای `@eco-nojin/*` |
| `vitest.config.ts` | تست واحد: jsdom، include پکیج‌ها + unit appها، setup |
| `vitest.setup.ts` | setup تست: jest-dom، polyfill `HTMLDialogElement` و `matchMedia` |
| `playwright.config.ts` | کانفیگ E2E ریشه: testDir=apps/console/tests، Chrome headless، webServer |
| `.gitignore` | قواعد ignore: node_modules/dist/.venv/secrets/archives/registry/experiments/artifacts |
| `.gitattributes` | نرمال‌سازی EOL (LF)، باینری‌ها، generatedها |
| `firebase-debug.log` | فایل خالی (۰ بایت) — زباله محیطی، بی‌خطر |

---

## 3. لایه `apps/` — پنج برنامه deployable

### 3.1 `apps/console` — کنسول مدیریت احراز هویت‌شده (مرجع Phase 1)
**وضعیت:** IMPLEMENTED + TESTED · پورت 5175 · React 19.3 + Vite + RR7 + TanStack Query

| فایل | نقش |
|---|---|
| `index.html` | ورودی HTML + بوت‌استرپ تم (بدون flash) |
| `vite.config.ts` / `playwright.config.ts` / `package.json` | کانفیگ Vite (dedupe/alias)، E2E محلی، وابستگی‌ها |
| `README.md` | شرح مرز — **کهنه (SKELETON می‌گوید)** |
| `src/main.tsx` | ریشه ترکیب: Theme → I18n → QueryClient → DemoSession → ErrorBoundary → Router |
| `src/app/router.tsx` | مسیرها: `/`, `/components`, `/organizations[/:id]`, `/users[/:id]`, `/notifications`, `/settings`, `*` — همه lazy |
| `src/app/ShellErrorBoundary.tsx` / `RouteErrorPage.tsx` | خطای shell / صفحه خطای مسیر |
| `src/app/config/navigation.ts` | ناوبری داده‌محور: `NAV_GROUPS` + `ROUTE_BREADCRUMBS` |
| `src/app/layouts/AppShell.tsx` | پوسته: sidebar collapsible + header (OrgSwitcher/Language/Theme/Notifications/UserMenu) + breadcrumb + mobile drawer + skip-link |
| `src/app/layouts/PageHeader.tsx` | هدر صفحه |
| `src/data/index.ts` | سوییچ داده: `DATA_MODE = VITE_API_URL ? "http" : "demo"`؛ ساخت identityRepository از api-client یا mock |
| `src/data/mock-backend.ts` | بک‌اند نمایشی در حافظه (۳ سازمان، ۶ کاربر، ۷ عضویت) — **اجبار همان قواعد tenancy/permission سرور** (requirePermission، ۴۰۴ cross-tenant) |
| `src/features/identity/{Users,UserDetail,Organizations,OrganizationDetail}Page.tsx` + `queries.ts` | صفحات هویت + هوک‌های TanStack Query |
| `src/pages/{Home,Components,Notifications,Settings,NotFound}Page.tsx` | صفحات |
| `src/permissions/fixture.ts` | داده نمایشی + `DEMO_PERMISSIONS` (fixture-only، کنترل امنیتی نیست) |
| `src/services/demo-notifications.ts` | سرویس اعلان نمایشی |
| `src/session/DemoSession.tsx` | SessionProvider: کاربر/عضویت‌ها/سازمان فعال/نقش — پایه session abstraction |
| `src/styles/index.css` | Tailwind v4 + `@theme` mapping به tokens |
| `tests/{app,a11y,identity}.spec.ts` + `capture.mjs` | E2E (۴۳ تست Phase 1: ۱۹ رفتار + ۲۴ axe) + اسکرین‌شات |
| `artifacts/` | ۴۸+ اسکرین‌شات + contact sheet (خارج از Git) |

### 3.2 `apps/portal` — پورتال عمومی (SEO/static-first)
**وضعیت:** IMPLEMENTED + TESTED · پورت 4181 · React 19 + Vite + RR7 + prerender

| فایل | نقش |
|---|---|
| `src/main.tsx` / `src/app/PortalApp.tsx` | ریشه + RouterProvider |
| `src/app/PortalLayout.tsx` | پوسته عمومی: هدر ۸ آیتمی + drawer + language/theme menu + footer ۳ ستونه + breadcrumb |
| `src/app/router.tsx` | ۱۲ مسیر: `/`, `/ecosystem`, `/hydroma`, `/landscape`, `/marketplace`, `/tourism`, `/mrv`, `/knowledge`, `/about`, `/contact`, `/partner`, `/login` |
| `src/app/PageView.tsx` / `meta.ts` | رندر بلوک‌های محتوا + متادیتای SEO per-page |
| `src/components/{Brand,Sections,Artwork,ContactForm}.tsx` | برند، بخش‌ها، SVG، فرم تماس (بدون بک‌اند) |
| `src/content/{fa,en,ar}.ts` (~۶۰۰ خط هر کدام) + `index.ts` + `types.ts` + `useContent.ts` | کاتالوگ کامل محتوا per locale؛ مدل `SiteContent`/`Block`(۵ نوع)/`PageKey`(۱۱ صفحه)/`IconName`(۱۶) |
| `scripts/prerender.mjs` | **prerender واقعی**: serve dist → Chrome headless → رندر ۱۲ مسیر → HTML استاتیک + sitemap.xml + robots.txt |
| `tests/{portal,static,a11y}.spec.ts` | E2E + تست خروجی استاتیک + axe |

### 3.3 `apps/scientific-workspace` — فضای کاری HyDroMA
**وضعیت:** IMPLEMENTED + TESTED · پورت 4182 · موتور علمی: **NOT_CONNECTED** (همه DEMO)

| فایل | نقش |
|---|---|
| `src/main.tsx` | Theme → I18n → Toast → WorkspaceProvider → Router |
| `src/app/router.tsx` / `ScienceLayout.tsx` / `WorkspaceContext.tsx` | مسیرها (داشبورد، water/soil/climate/vegetation، نقشه، simulation، RS، projects) + rail لایه‌ها + زمینه مطالعاتی (۳ ناحیه) |
| `src/components/ScienceMap.tsx` | نقشه MapLibre + deck.gl (HexagonLayer تراکم، ScatterplotLayer ایستگاه‌ها، toggle لایه، RTL) — **در Stage 2.8 به MapLibre-only ساده‌تر شد** (حذف worker محلی، استفاده از spatial) |
| `src/components/{MiniMap,Charts,Cards}.tsx` | نقشه کوچک، نمودار سری زمانی، IndicatorCard |
| `src/data/indicators.ts` | **مدل داده علمی نمایشی**: ۹ KPI، ۱۱ واحد، کیفیت، وضعیت (DEMO/NOT_CONNECTED/STALE)، `model{id,version}`، `source`، `uncertaintyPct`، سری deterministic (mulberry32) — **الگوی قرارداد ۷ بخشی** |
| `src/pages/*` (۹ صفحه) | داشبورد، تحلیل دامنه، نقشه، simulation (مخفی تا load demo)، RS (بدون داده)، projects، domain |
| `tests/{workspace,a11y}.spec.ts` | E2E (واحد+provenance+uncertainty) + axe |

### 3.4 `apps/marketplace` — مارکت‌پلیس چندفروشندگی
**وضعیت:** IMPLEMENTED + TESTED · پورت 4183 · پرداخت/تسویه: **NOT_CONNECTED**

| فایل | نقش |
|---|---|
| `src/app/router.tsx` / `MarketLayout.tsx` | `/`(home), `/catalog`, `/p/:slug`, `/s/:slug`, `/cart`, `/checkout`, `/orders`, `/seller/*` + پوسته تجارت |
| `src/data/catalog.ts` | **مدل کاتالوگ**: ۱۵ دسته سلسله‌مراتبی، فروشندگان (`Seller` با `verification`، `landscapeRef`)، محصولات (`Product` با `Money`، `minOrder`، `stock`، `claims`) |
| `src/lib/cart-logic.ts` | منطق سبد: `clampQuantity`، `groupBySeller` (**یک سبد → یک سفارش per فروشنده**)، `totalsByCurrency` (بدون تبدیل ارز) |
| `src/lib/money.ts` | `formatMoney` (minor units، بدون float)، `multiplyMoney`، `addMoney` |
| `src/lib/{filter,labels}.ts` | فیلتر/مرتب‌سازی، برچسب‌ها |
| `src/store/{cart,orders}.tsx` | CartProvider (localStorage `eco.market.cart`) + سفارش‌ها |
| `src/pages/*` (۸ صفحه) | Home (هیرو+۱۵ دسته)، Catalog (grid/list)، Product، Seller، Cart، Checkout، Orders، SellerDashboard (KPI/موجودی/مالی) |
| `tests/{marketplace,a11y}.spec.ts` + `tests/unit/commerce.test.ts` | E2E + واحد + axe |

### 3.5 `apps/tourism` — گردشگری روستایی/عشایری (Stage 2.8 — untracked)
**وضعیت:** IMPLEMENTED + TESTED · پورت 4184 · رزرو/پرداخت: **NOT_CONNECTED** (درخواست نمایشی مرورگری)

| فایل | نقش |
|---|---|
| `src/app/router.tsx` / `TourismLayout.tsx` | ۱۴ مسیر: `/`, `/destinations[/:slug]`, `/nomadic[/:slug]`, `/stays[/:slug]`, `/experiences[/:slug]`, `/events`, `/map`, `/host`, `/book/:kind/:slug`, `/bookings`, `*` |
| `src/data/tourism.ts` (1590 خط) | **مدل داده گردشگری**: ۱۱ نوع مقصد، قلمروهای عشایری زمان‌مند (`validity`+`months`+`access`+`sensitivity`)، ۶ اقامتگاه، ۱۳ تجربه، ۶ رویداد، میزبان، تقویم availability deterministic |
| `src/lib/time.ts` | UTC: `parseISO`, `addDays`, `nightsBetween`, `isSeasonActive`، `activeOverlaps` (همپوشانی bbox)، `isPublicGeometry` (حساسیت) |
| `src/lib/{availability,booking,booking-store,host,money,text}.ts` | availability، `validateStayRequest`/`validateExperienceRequest`→`BookingQuote`، persist، `bookingsForHost`، پول، `pick` locale |
| `src/store/bookings.tsx` | BookingProvider (localStorage `eco.tourism.bookings`) |
| `src/components/{TourismMap,LazyTourismMap,HostStudio,SceneArt,Cards}.tsx` | نقشه lazy، استودیوی میزبان (پیش‌نویس محلی)، هنر SVG اورجینال |
| `src/content/{fa,en,ar}.ts` | محتوای سه‌زبانه (عربی HUMAN_REVIEW_REQUIRED) |
| `src/pages/*` (۱۴ صفحه) | Stays/Stay/Book/Experiences/Experience/Destinations/Destination/Nomadic/NomadicDetail/Events/Map/Host/Bookings/Home/NotFound |
| `tests/{tourism,a11y,stabilization,stage-2.8-additions}.spec.ts` + `tests/unit/{booking-store,host,money,time-guard,tourism}.test.ts` | E2E 78/78 + ۵ فایل واحد (۲۰ تست) + axe |

---

## 4. لایه `packages/` — کتابخانه‌های مشترک (۸ پکیج)

| پکیج | فایل‌ها | نقش |
|---|---|---|
| **design-system** | `tokens.css` (۲۳۰ خط: primitives رنگ/تایپوگرافی/فاصله/شعاع/ارتفاع/موشن + semantic aliases per theme + `[data-brand]`)، `base.css`، `tailwind.css` | توکن‌های طراحی — منبع واحد؛ هویت نهایی approved نیست (COLOR-01, TYPO-01..06) |
| **ui** | `button`, `form-controls` (Input/Select/Checkbox/Radio/Switch/Textarea/Field)، `data-display` (Card/Table/Badge/Avatar/EmptyState/Skeleton)، `overlays` (Dialog/Dropdown/Tooltip)، `feedback` (Alert/Toast)، `tabs` | ۱۷ primitive دسترس‌پذیر، token-driven، direction-aware |
| **i18n** | `registry.ts` (LocaleDefinition: code/tag/direction/numberingSystem/calendar/fallback/enabled — **داده‌محور**)، `provider.tsx` (t/tp/format با Intl، persist، تنظیم `dir`)، `catalogs/{fa,en,ar}.ts` (~۶۰۰ خط) | زیرساخت i18n: ۳ locale کامل، ۱۵ locale در نهایت |
| **frontend-core** | `theme.tsx` (light/dark/system، بدون flash)، `providers.tsx` (AppProviders: Theme→I18n→QueryClient)، `permission.tsx` (`Can`/`PermissionProvider`/`usePermissions`)، `error-boundary.tsx` | ریشه ترکیب اپ‌ها + موتور تم + قرارداد مجوز |
| **domain-types** | `identity.ts` (User/Org/Membership/Invitation/TenantContext — **تفکیک identity≠org≠membership**)، `permissions.ts` (۲۱ PermissionKey، ۵ نقش، `ROLE_PERMISSIONS`)، `commerce.ts` (Money/Seller/Product/CartLine/SellerOrder/StockMovement — **minor units**)، `tourism.ts` (Destination/NomadicZone/Stay/Experience/TourismEvent/TourismHost/BookingRequest — landscapeRef/sensitivity/validity) | قراردادهای دامنه مشترک |
| **spatial** | `map.ts` (`mountSpatialMap`: چرخه عمر MapLibre، کنترل‌ها، RTL، cleanup)، `style.ts` (createBaseStyle/addGraticule/addBbox)، `colors.ts` (resolveMapColors از tokens)، `worker.ts`، `maplibre-gl-worker.mjs`، `NOTICE.md` | زیرساخت نقشه: MapLibre 6.19 + worker آفلاین + رنگ از tokens — **جدید (Stage 2.8، untracked)** |
| **validation** | Zod schemas: email/phone/name/locale/role/orgKind/userCreate/userUpdate/invitationCreate/membershipRole/listQuery | اعتبارسنجی مشترک client/server |
| **api-client** | `client.ts` (createApiClient: users/organizations/members — مسیرهای `v1/…`)، `transport.ts` (timeout/abort/CSRF/X-Organization-Id/retry فقط GET)، `errors.ts` (ApiError + ErrorEnvelope + statusToCode)، `pagination.ts` | کلاینت HTTP تایپ‌شده — **هیچ کامپوننتی fetch مستقیم صدا نمی‌زند** |

---

## 5. لایه `app/` — نمونه اولیه (Prototype)
**وضعیت:** PRESERVED — رابطه با `apps/` تصمیم باز (D-ARC-02). دموی مستقل وانیلا JS:
`build.mjs`/`serve.mjs`، صفحات HTML، JS وانیلا (i18n/ناوبری/تم/تعاملات)، `engines/water-balance.js`،
استایل‌ها، تست‌های node.

---

## 6. سرویس‌ها (`services/`) — ۱۳ دامنه کسب‌وکار (SKELETON)
فقط `services/README.md` (۴۲ خط). قاعده: **Modular Monolith**، هر ماژول مالک داده خودش، ارتباط فقط از
طریق `contracts/`، رویدادها idempotent، tenant_id در هر رکورد، مجوز سمت سرور.

| سرویس | مسئولیت | مالک | صریحاً نه |
|---|---|---|---|
| `api-gateway` | ingress واحد، routing، rate limit، اعتبارسنجی | — | قوانین دامنه |
| `identity` | credentials، session، MFA، federation (adapter D-04) | رکورد هویت | عضویت/نقش |
| `organization` | موجودیت حقوقی، شاخه‌ها، عضویت‌ها، نقش/اسکوپ | گراف سازمان | پروفایل/credentials |
| `user-management` | پروفایل، ترجیحات (locale/timezone/calendar)، رضایت | پروفایل کاربر | احراز هویت |
| `marketplace` | listings، پیشنهادها، سفارش‌ها | وضعیت کاتالوگ | پرداخت/دفتر/موجودی |
| `finance` | فاکتور، پرداخت، payout، چندارزی، مالیات، ledger | اسناد مالی | wallet/token |
| `inventory` | موجودی، lots، تبدیل واحد، رزرو | دفتر موجودی | قیمت‌گذاری |
| `tourism` | املاک، تقویم availability، رزرو، نرخ | وضعیت رزرو | دریافت پرداخت |
| `notification` | تمپلیت، کانال، ترجیحات، dedupe | وضعیت تحویل | نویسندگی محتوا |
| `content` | صفحات، media metadata، محتوای محلی | رکورد محتوا | رندر سایت |
| `workflow` | تعاریف، instanceها، approvalها، human task (adapter Temporal/Kestra D-07) | وضعیت workflow | تصمیم دامنه |
| `ai-orchestration` | صف job عامل، tool-permission، run log، cost accounting | رکورد run/trace | اجرای مالی |
| `reporting` | read model، export، گزارش زمان‌بندی‌شده | read model مشتق | داده منبع |

**تحلیل:** این ۱۳ دامنه با bounded contextهای معماری اجرایی (`BC-IAM, BC-CORE, BC-ORG, …`) نگاشت
دارند. هیچ‌کدام پیاده نشده‌اند؛ **گلوگاه یکپارچه‌سازی همین‌جاست**.

---

## 7. موتورها (`engines/`)

### 7.1 `engines/hydroma` — موتور علمی (SKELETON)
`engines/hydroma/README.md` + ۱۵ دامنه خالی: `water, hydrology, groundwater, soil, erosion, climate,
meteorology, agriculture, vegetation, remote-sensing, gis, simulation, scenarios, mrv, model-registry`.

**قرارداد علمی ۷ بخشی (غیرقابل‌مذاکره):** ۱) ورودی/خروجی با واحد ۲) منابع داده با لایسنس/نسخه
۳) هویت مدل (نام/نسخه/کالیبراسیون/upstream commit) ۴) provenance کامل ۵) عدم‌قطعیت ۶) اعتبارسنجی
(پروتکل/داده مرجع/شاخص‌های مهارت/شکست‌های شناخته‌شده).

### 7.2 `engines/ai-workforce` — نیروی کار هوشمند (SKELETON)
۶ جزء: `analyst` (read-only)، `administrator` (در اسکوپ تفویضی)، `manager` (نه approval خودش)،
`employees` (scoped)، `model-gateway` (تنها egress LLM + accounting + redaction)، `agent-registry`
(تعریف/نسخه/allowlist). **قاعده سخت: هیچ عامل به ابزار مالی/کیف‌توکن متصل نمی‌شود.**

---

## 8. قراردادها، داده، زیرساخت، یکپارچه‌سازی، گردش‌کار، تست‌ها

| پوشه | وضعیت | نقش طراحی‌شده |
|---|---|---|
| `contracts/` | SKELETON | تنها اتصال قانونی: `api` (OpenAPI)، `events` (envelope + idempotency)، `schemas`، `scientific-models` (۷ بخشی). **هیچ OpenAPI موجود نیست** |
| `databases/` | SKELETON | نقش هر مخزن: relational(PostgreSQL)، geospatial(PostGIS)، time-series(Timescale/CH)، analytical(DuckDB/CH)، migrations، seeds. **هیچ چیزی نصب نشده** (D-DB-01/02) |
| `data/` | READY (ساختار) | ۱۲ زون: raw/processed/reference/geospatial/climate/hydrology/soil/agriculture/remote-sensing/scientific-models/fixtures/metadata — تفکیک سطح اعتماد |
| `infrastructure/` | SKELETON | environments/configuration/security/monitoring/backup/deployment — **هیچ منبع ابری/کانتینر/secret store** |
| `integrations/` | SKELETON | آداپتر outbound: satellite/weather/geospatial/payment/messaging/external-data — payload وندور بدون wrapper عبور نمی‌کند |
| `workflows/` | SKELETON | تعاریف فرآیند: scientific/business/finance/marketplace/tourism/ai — بدون runtime |
| `tests/` | SKELETON | ۷ لایه (unit/integration/contract/e2e/security/performance/scientific-validation) — در عمل vitest+playwright ریشه هست |

---

## 9. معماری (`architecture/`) — ۵۵ فایل

| فایل/گروه | نقش |
|---|---|
| `ECO-NOJIN-MASTER-ARCHITECTURE-V2.md` + `ECO-NOJIN-MASTER-ARCHITECTURE.md` | معماری ۱۴ لایه، اصول، فازها — مرجع بالادست |
| `executable-v1/ECO-NOJIN-EXECUTABLE-ARCHITECTURE.md` | ۱۹ bounded context (۱۹۴ رکورد = ۱۷۸ MODULE + ۱۲ AGENT + ۴ CONTROL) |
| `executable-v1/MODULE-EXECUTION-MAP.csv` | وابستگی/مالکیت داده/انتشار per ماژول — همه DESIGN |
| `executable-v1/IMPLEMENTATION-ROADMAP.md` | نقشه راه |
| `HYDROMA-SCIENTIFIC-ENGINE-ARCHITECTURE.md` | internals موتور علمی |
| `ECO-NOJIN-SECURITY-AND-INFRASTRUCTURE.md` | سناریوهای امنیت/استقرار (۱۹۴ DESIGN، ۰ IMPLEMENTED) |
| `ECO-NOJIN-DATA-DOMAIN-MODEL.md` | مالکیت داده |
| `ECO-NOJIN-ARCHITECTURE-OPEN-DECISIONS.md` | D-01…D-22 (باز) |
| `ECO-NOJIN-FRONTEND-SITEMAP.csv` | نقشه ۲۲۷ صفحه (PUB/AUTH/CONSOLE/…) با nav_group/roles/states/responsive/phase |
| `ECO-NOJIN-MODULE-CATALOG.csv` / `USER-ROLE-MATRIX.csv` / `WORKFLOW-CATALOG.csv` | کاتالوگ ماژول / ماتریس نقش / کاتالوگ گردش‌کار |
| `ECO-NOJIN-UPSTREAM-DECISION-MATRIX{,-V2}.csv` | ماتریس تصمیم upstream |
| `ECO-NOJIN-INDEPENDENT-TECHNICAL-RESEARCH-BASELINE.md` / `ECO-NOJIN-FINAL-DEVELOPMENT-READINESS.md` | خط پایه تحقیق / آمادگی نهایی |
| `I18N-AND-LANDSCAPE-DECISIONS.md` / `INTERNATIONALIZATION-ARCHITECTURE.md` | i18n |
| `LANDSCAPE-*.md` (۴ فایل) + `LANDSCAPE-API-CONTRACTS.md` | مدیریت چشم‌اند — روستا/عشایر/حوضه |
| `OWNER-DECISION-PACK.md` / `OWNER-DECISION-RESTORATION.md` | بسته تصمیم مالک |
| `RECONCILIATION-AUDIT-REPORT.md` / `ROLE-AND-ACTOR-RECONCILIATION.csv` | ممیزی آشتی |
| `TRANSLATION-GATEWAY-ARCHITECTURE.md` / `UPSTREAM-21-DECISIONS-AUDIT.md` | دروازه ترجمه / ممیزی ۲۱ تصمیم |
| `consolidated-v1/` (۱۳ فایل) | معماری تلفیقی v1 + changelog/validation |
| `independent-review-v2/INDEPENDENT-ARCHITECTURE-REVIEW-V2.md` | بازبینی مستقل v2 |
| `upstream-source-audit/` (۱۰ فایل) | ممیزی سورس upstream per batch |

---

## 10. مستندات (`docs/`)

| فایل | نقش |
|---|---|
| `docs/README.md` | نقشه مستندات — «تکرار نکن، به منبع authoritative اشاره کن» |
| `docs/adr/ADR-0000-template.md` / `ADR-0001-documentation-single-source.md` / `README.md` | قالب ADR + ADR مرجع واحد (architecture/ authoritative، docs/ فرآیند) |
| `docs/architecture/{ARCHITECTURE-DECISION-MATRIX, FINAL-ARCHITECTURE-AUDIT, FRONTEND-SELECTION-REPORT, REAL-DEVELOPMENT-ROADMAP, RTL-FEASIBILITY-REPORT, TECHNOLOGY-BASELINE-PROPOSAL}.md` | تصمیم/ممیزی/انتخاب فرانت‌اند/نقشه راه/RTL/خط پایه فناوری |
| `docs/{security,data-governance,scientific-governance,development}/README.md` | دامنه‌های سیاست با cross-link |

---

## 11. برند (`brand/`) — ۴۸۵ فایل

| پوشه | نقش |
|---|---|
| `eco-nojin-design-system-v2/` | سیستم طراحی v2: گالری، فونت‌های محلی Inter+Vazirmatn، tokens/themes — browser-verified (۱۰/۱۰) اما unapproved |
| `eco-nojin-design-system-v2-qa/` | QA: Contrast PASS (۲ residual)، Keyboard PASS، Responsive 320–1920، RTL/LTR PASS، **SR NOT_TESTED** |
| `eco-nojin-design-system-formalization-v1/` | ۶ سند: BASELINE, DECISION-CHANGELOG, EVIDENCE-INDEX, FINAL-STATUS, OWNER-DECISION-REGISTER, TECHNICAL-OPEN-ITEMS |
| `eco-nojin-visual-identity-v3/` | هویت بصری + `04-TYPOGRAPHIC-LOGO-ARCHITECTURE.md` |
| `eco-nojin-owner-review-v1/`، `owner-review/`، `identity-v2/`، `assets/` | بازبینی مالک، هویت، دارایی‌ها |

**بدهی (F6/N-02):** `tokens.css` و `themes.css` در brand/v2 تکراری‌اند — SSOT شود (کد محصول در
`packages/design-system/tokens.css` این مشکل را ندارد).

---

## 12. شواهد و آزمایشگاه‌ها (`experiments/`)

| پوشه | محتوا | وضعیت |
|---|---|---|
| `geospatial-poc/` | EVALUATION_REPORT (Giro3D/MapLibre/Cesium)، `data/*.geojson`، `vendor/maplibre/*`، **`geo-measure/`** | **تنها دارایی IMPLEMENTED+UNIT_TESTED قدیمی** (۲۳/۲۳) — geodesic با CRS fail-closed، `validated:false` |
| `frontend-foundations-run/` | interaction-results.json + ۳۰ اسکرین‌شات ۴ پروژه + interaction-test.mjs | شواهد batch-16 |
| `frontend-phase-1/` | PHASE-1-IMPLEMENTATION-REPORT (۲۳۲ خط)، OWNER-REVIEW-PACKAGE، TEST-INFRA/ OVERFLOW-REMEDIATION | گزارش‌های Phase 1 |
| `frontend-phase-2-planning/` | PHASE-2-EXECUTION-ROADMAP (۴۱۳ خط: مراحل 2.0…2.9، D-01…D-22، I18N-09، معیارهای پذیرش) + STAGE-2.0 + execution-reports (STAGE-2.1…2.8) | **نقشه راه یکپارچه‌سازی** |
| `frontend-architecture-poc/` / `frontend-build-repro/` | POC معماری (۲۳k فایل) / بازتولید بیلد (۷۲k فایل) | شواهد Next 16.1–16.2 invariant |
| `frontend-execution-architecture/` / `rtl-proof/` / `upstream-integration/` | ۱ فایل / اثبات RTL (۱۰۲k فایل) / ۴ فایل | شواهد |

---

## 13. شواهد upstream (`upstream-archives/` + `upstream-registry/`)

- **`upstream-archives/`**: ۱۰ batch آرشیو ZIP (batch-01 geospatial … batch-16 frontend-foundations) — **فقط-خواندنی**، SHA256 ثبت‌شده، در Git نیست.
- **`upstream-registry/`**: ۵۵ پوشه (۵۴ پروژه + frontend-foundations) — ۲۵۲٬۶۶۹ فایل:
  - **موتورهای علمی:** wflow-jl, modflow6, flopy, swatplus, xclim, landlab, aquacrop-ospy, invest, rhem-*, pcse, hydromt-wflow, pygeoprocessing
  - **زیرساخت/داده:** titiler, pgstac, pystac, odc-stac, mapserver, seaweedfs, opensearch, prometheus, grafana, superset, opentelemetry-collector
  - **هویت/گردش‌کار:** keycloak, temporal, kestra, langgraph, agno
  - **کسب‌وکار:** medusa, spree, erpnext, dolibarr, farmos, qloapps, novu, flowise, directus
  - **ژئو/ویژوال:** maplibre-gl-js, deck.gl, cesium, giro3d, geolibre, collect*, opentripplanner
  - **مالی:** openzeppelin-contracts (token-gated)
- **لایسنس (۵۴ ردیف):** ۴۰ LOW، ۵ MED، ۸ HIGH، ۱ REVIEW — `wps` (لایسنس absent، REJECT)، `wrf` (آرشیو خالی، INTEGRITY_FAILED، خارج رجیستری).
- **طبقه‌بندی:** ADOPT 15 / INTEGRATE 6 / DEFER 29 / REJECT 4 — Wave 1: maplibre, giro3d, pystac, keycloak, titiler.
- **قاعده:** کد upstream هرگز بدون تصمیم مالک (D-17) به `engines/hydroma` کپی نمی‌شود؛ HIGH-risk فقط standalone.
- **Stage 2.8 یافته:** QloApps (OSL 3.0 + Webkul proprietary) و OpenTripPlanner برای tourism **استفاده نشدند** — فقط الگو؛ هیچ کد third-party در `apps/`/`packages/` نیست.

---

## 14. مدل‌های دامنه (Domain Models — کد واقعی)

### 14.1 هویت و مجوز (`domain-types`)
- **User**: id, email, name, phone, status(invited/active/suspended), locale, createdAt, lastActiveAt
- **Organization**: id, name, slug, country(ISO 3166-1), kind(platform/region/community/business/research), status
- **Membership**: orgId+userId+role(owner/admin/manager/member/viewer)+status — **تفکیک سه‌لایه identity≠org≠membership**
- **Invitation**: orgId, email, role, status(pending/accepted/expired/revoked), expiresAt
- **TenantContext**: orgId, userId, role, permissions[] — **سرور دوباره محاسبه و اعتبارسنجی می‌کند**
- **۲۱ PermissionKey**: org.read/update, org.members.*, users.*, billing.*, catalog.*, orders.*, landscape.*, hydroma.run, reports.read, audit.read
- **hasPermission(role, key)** — ماتریس ROLE_PERMISSIONS (viewer حداقل، owner کامل)

### 14.2 تجارت (`commerce.ts`)
- **Money**: `{ amountMinor, currency }` — **هرگز float**
- **Seller**: kind (rural-producer/nomadic-community/cooperative/farm/workshop/local-business/equipment-supplier/service-provider/tourism-operator)، verification(verified/pending/unverified)، landscapeRef
- **Product**: price(Money)، unit(kg/piece/box/night/service/hectare)، minOrder، stock، claims[{label,status}]
- **CartLine**, **SellerOrder**(draft→placed→preparing→shipped→delivered/cancelled)، **StockMovement**(intake/sale/adjustment)

### 14.3 گردشگری (`tourism.ts` — ۳۰۶ خط)
- **LocalizedText**: `{en, fa, ar}` — همه فیلدهای نمایشی
- **Destination** (۱۱ نوع) با landscapeRef (بدون تکرار رکورد روستا)، geometry تعمیم‌یافته، warnings، community (بدون PII)
- **NomadicZone / MigrationRoute / NomadicCamp**: **زمان‌مند** — `validity` + `months`(1-12) + `access`(open/guided-only/permit/closed) + `sensitivity`(public/review-required/sensitive) — قلمروهای فصلی همپوشان مجاز
- **Stay** (۷ نوع، `RoomType`، `AvailabilityDay`، `Money`)، **Experience** (۱۲ نوع، بدون موجودیت Tour جدا)، **TourismEvent**، **TourismHost** (sellerId → marketplace)، **BookingQuote / BookingRequest** (demo:true)

### 14.4 علمی (`indicators.ts`)
- **Indicator**: id, domain(water/soil/climate/vegetation)، unit(۱۱ واحد)، value، quality، status(DEMO/NOT_CONNECTED/STALE)، **model{id,version}**، source، updatedAt، **uncertaintyPct**، series[] — الگوی عملی قرارداد ۷ بخشی

### 14.5 i18n (`registry.ts`)
- **LocaleDefinition**: code/tag/nativeName/direction/numberingSystem/calendar/fallback/enabled — locale به‌عنوان داده؛ `resolveFallbackChain`؛ DEFAULT_LOCALE=fa

---

## 15. تفسیر تحلیلی (Interpretation)

### 15.1 نقاط قوت
1. **معماری تمیز و قابل اثبات:** مرزبندی ۱۳ واحدی با `check-boundaries.mjs` (۱۹۶ فایل، ۰ violation).
2. **کیفیت کد بالا:** strict TS (`noUncheckedIndexedAccess`)، ۹۱ تست واحد سبز، axe در E2E، RTL واقعی.
3. **صداقت مهندسی:** برچسب DEMO/NOT_CONNECTED همه‌جا؛ `validated:false`؛ تفکیک داده واقعی/نمایشی.
4. **i18n/RTL از روز اول:** ۳ locale کامل + registry داده‌محور — برخلاف ۴ پروژه مرجع.
5. **تصمیم‌محوری:** ۱۷ تصمیم باز با گزینه/ریسک/توصیه — بدون دزدیدن تصمیم owner-level.
6. **شواهد reproducible:** SHA256 آرشیوها، لاگ‌های build، اسکرین‌شات‌ها، دستورات بازتولید.
7. **قراردادمحوری داده:** Money minor units، landscapeRef، sensitivity، validity — مدل‌ها داده‌محورند نه UI-محور.

### 15.2 شکاف‌ها و ریسک‌ها
| # | ریسک | شاهد | شدت |
|---|---|---|---|
| R1 | **بک‌اند صفر:** ۱۳ سرویس، DB، contracts-api هیچ پیاده نشده | READMEها + فقدان فایل | **بحرانی** |
| R2 | **مستندات کهنه:** READMEها «۰ پیاده‌سازی/بدون Git» می‌گویند ولی ۵ اپ + Git موجود | مقایسه README با git log | بالا |
| R3 | **کارهای commit‌نشده:** tourism + spatial + تغییرات پیکربندی در درخت کار | git status | بالا (خطر گم‌شدن) |
| R4 | **تصمیم‌های باز:** D-PROD-01/D-FE-01/D-04/D-ARC-03 | ARCHITECTURE-DECISIONS-OPEN.md | بالا |
| R5 | **وابستگی به DEMO:** همه اپ‌ها mock/localStorage | DATA_MODE=demo | متوسط |
| R6 | **بدهی توکن برند:** tokens.css/themes.css تکراری در brand/v2 | N-02 | متوسط |
| R7 | **I18N-09 ثبت نشده:** لیست ۱۵ زبان نهایی نیست | PHASE-2 ROADMAP §E | متوسط |
| R8 | **No CI/CD:** .github فقط README | D-GIT-01/D-QA-01 | بالا |
| R9 | **geo-measure VALIDATED نیست** (بدون داده مرجع) | FIRST-PRODUCT-SLICE | متوسط |
| R10 | **Stage 2.8 محدودیت‌ها:** QloApps vendor نشد، نقشه offline graticule، بدون عکس لایسنس‌دار، لیست‌های ثانویه انگلیسی | STAGE-2.8 §19 | متوسط |

### 15.3 نگاشت وضعیت به واژگان رسمی
- `IMPLEMENTED + UNIT_TESTED + E2E TESTED`: ۵ اپ + ۸ پکیج (فرانت‌اند کامل Phase 1+2)
- `IMPLEMENTED + UNIT_TESTED` (نه VALIDATED): geo-measure
- `DESIGNED`: ۱۳ سرویس، ۱۵ دامنه hydroma، ۶ جزء ai-workforce، contracts، databases، infrastructure
- `NOT IMPLEMENTED`: OpenAPI، DB، CI/CD، هر اتصال خارجی
- `OWNER_APPROVED`: **هیچ‌کدام**

---

## 16. برنامه یکپارچه‌سازی (Integration Roadmap)

هدف: تبدیل «۵ اپ دمو + پکیج‌های مشترک» به «پلتفرم یکپارچه با بک‌اند واقعی» (بر پایه
NEXT-IMPLEMENTATION-PLAN + PHASE-2 ROADMAP + ECO-NOJIN-ARCHITECTURE-CORRECTION §7):

### فاز 0 — تثبیت (بدون کد محصول)
| گام | اقدام | مسئول | خروجی |
|---|---|---|---|
| 0.1 | **به‌روزرسانی مستندات کهنه** (READMEها، ARCHITECTURE-DECISIONS: D-GIT-01 عملاً انجام شده) | ایجنت | مستندات هم‌راستا با واقعیت |
| 0.2 | **commit کارهای Stage 2.8** (tourism + spatial + پیکربندی‌ها) پس از بازبینی | مالک | working tree تمیز |
| 0.3 | ثبت ADR برای D-FE-01 (React+Vite SPA تأیید عملی)، D-ARC-03 (پکیج‌های geospatial/charts)، D-APP-01 (hybrid) | مالک | ۳ ADR |
| 0.4 | ثبت I18N-09 (لیست ۱۵ زبان) | مالک | تصمیم i18n |

### فاز 1 — قراردادها (Contract-first)
| گام | اقدام | خروجی |
|---|---|---|
| 1.1 | نگاشت `contracts/api` (OpenAPI 3.1): users/organizations/members (که در api-client استفاده شده) + صفحات عمومی portal | OpenAPI v1 |
| 1.2 | `contracts/schemas` = منبع واحد Zod (packages/validation با آن هم‌تراز) | schema drift = fail |
| 1.3 | `contracts/events` (envelope: name/version/producer/idempotency) | event catalog |
| 1.4 | `contracts/scientific-models` (۷ بخشی) — formalize از indicators.ts | scientific contract |

### فاز 2 — هسته بک‌اند (Modular Monolith `DU-CORE`)
| گام | اقدام | پیش‌نیاز |
|---|---|---|
| 2.1 | **سرویس identity + organization** (PostgreSQL، RLS tenant_id، session HttpOnly، OIDC adapter) | D-04 (IdP) |
| 2.2 | api-gateway (routing، rate limit، اعتبارسنجی Zod، envelope خطا) | 2.1 |
| 2.3 | اتصال `apps/console` به API واقعی: `VITE_API_URL` + api-client (کد از قبل آماده — `data/index.ts`) | 2.2 |
| 2.4 | سرویس‌های marketplace/inventory/finance (مالی append-only، minor units) + tourism | D-INT-02 (پرداخت defer) |
| 2.5 | notification، content، reporting (read-only) | 2.4 |

### فاز 3 — موتور علمی
| گام | اقدام | پیش‌نیاز |
|---|---|---|
| 3.1 | `engines/hydroma` دامنه‌ها با قرارداد ۷ بخشی؛ هر مدل با review record | D-17 |
| 3.2 | اتصال scientific-workspace به job API (async) — NEVER sync با Core | 3.1 |
| 3.3 | integrations: titiler/pystac (Python venv — T-1) | D-DB-02 |

### فاز 4 — کیفیت و انتشار
| گام | اقدام |
|---|---|
| 4.1 | CI/CD (GitHub Actions): typecheck+lint+boundary+unit+build+axe — نیاز به remote (مجوز مالک) |
| 4.2 | Pytest برای لایه علمی (D-QA-01: Vitest+PW+Pytest) |
| 4.3 | بودجه bundle (initial ≤ 200kB gzip، map chunk ≤ 500kB) + Lighthouse portal |

### وابستگی‌های بحرانی (Critical Path)
```
D-FE-01 (تأیید stack) ──┐
D-04 (IdP) ─────────────┼──► فاز 2 (هسته) ──► اتصال console ──► سرویس‌های دامنه
D-ARC-03 (پکیج‌ها) ─────┘         │
D-17 (مدل‌های علمی) ───────────────┴──► فاز 3 (HyDroMA)
D-INT-02 (پرداخت) ────────────────────► فاز 2.4 (marketplace/tourism)
```

### پیشنهاد تقدم (اگر مالک فقط یک چیز را انتخاب کند)
1. **D-PROD-01**: اولین برش = **console + سازمان‌ها** (پایه B2B SaaS) + نازک A علمی — چون بنیاد همه‌چیز است.
2. **D-04**: IdP (Keycloak یا better-auth) — بدون آن console واقعی نمی‌شود.
3. **D-ARC-01**: Modular Monolith — تأیید عملی شده؛ فقط ثبت ADR.

---

## 17. توصیه‌های عملی (Actionable Recommendations)

1. **قبل از هر چیز مستندات را با واقعیت هم‌تراز کنید** — تناقض «۰ پیاده‌سازی» با ۵ اپ فعال، هر بازبینی مستقل را گمراه می‌کند.
2. **کارهای Stage 2.8 را commit کنید** (tourism + spatial + پیکربندی‌ها) — قهر با قاعده commit فقط با درخواست مالک؛ این درخواست را ثبت کنید.
3. **OpenAPI v1 را بنویسید** — `api-client` از قبل مسیرهای `v1/…` را می‌شناسد؛ قرارداد باید عقب‌گرد کد باشد.
4. **سرویس identity/organization را با PostgreSQL + RLS بسازید** — کوچک‌ترین برش عمودی که console را واقعی می‌کند.
5. **Pytest را اضافه کنید** (D-QA-01) — لایه علمی Python است (titiler/xclim/…)، Vitest کافی نیست.
6. **CI/CD محلی اول، remote بعد** — بدون remote هم می‌توان GitHub Actions را با مجوز مالک فعال کرد.
7. **از فورک upstream پرهیز کنید** — الگوها را از Medusa/Directus/GeoLibre بگیرید، نه کد را (تأیید Stage 2.8 برای QloApps).
8. **I18N-09 را ثبت و ۱۵ زبان را نهایی کنید** — زیرساخت آماده است، فقط تصمیم + کاتالوگ مانده.
9. **محدودیت‌های Stage 2.8 را ببندید:** نقشه واقعی (tiles)، عکس لایسنس‌دار، لیست‌های ثانویه locale، همپوشانی هندسی دقیق.

---

## 18. پیوست الف — درخت فایل‌های کد (خلاصه)

```
D:\NOJIN
├── apps/
│   ├── console/          (src: app/{router,layouts,config} · data · features/identity · pages · permissions · services · session · styles · tests)
│   ├── portal/           (src: app · components · content{fa,en,ar} · styles · scripts/prerender.mjs · tests)
│   ├── marketplace/      (src: app · components · data · lib · pages · store · styles · tests)
│   ├── tourism/          (src: app · components · content · data · lib · pages · store · styles · tests) — untracked
│   └── scientific-workspace/ (src: app · components · data · pages · styles · tests)
├── packages/
│   ├── design-system/    (tokens.css · tailwind.css · base.css)
│   ├── ui/               (button · form-controls · data-display · overlays · feedback · tabs)
│   ├── i18n/             (registry · provider · catalogs{fa,en,ar})
│   ├── frontend-core/    (theme · providers · permission · error-boundary)
│   ├── domain-types/     (identity · permissions · commerce · tourism)
│   ├── spatial/          (map · style · colors · worker · maplibre-gl-worker.mjs) — untracked
│   ├── validation/       (identity schemas)
│   └── api-client/       (client · transport · errors · pagination)
├── app/                  (prototype وانیلا JS — PRESERVED)
├── services/             (۱۳ دامنه — SKELETON)
├── engines/              (hydroma ۱۵ دامنه + ai-workforce ۶ جزء — SKELETON)
├── contracts/ databases/ data/ infrastructure/ integrations/ workflows/ tests/  (SKELETON)
├── architecture/         (۵۵ فایل — authoritative)
├── docs/                 (۱۵ فایل — فرآیند + ADR)
├── brand/                (۴۸۵ فایل — design system v2/v3)
├── experiments/          (شواهد: geo-measure، phase-1/2، rtl-proof، …)
├── upstream-archives/    (۱۰ batch — فقط-خواندنی)
├── upstream-registry/    (۵۵ پروژه — شواهد)
└── (root configs: package.json · tsconfig · vitest · playwright · .gitignore · .gitattributes)
```

## پیوست ب — واژگان وضعیت (Normative Vocabulary)

`DESIGNED` → `IMPLEMENTED` → `UNIT_TESTED` → `INTEGRATION_TESTED` → `VALIDATED` → `OWNER_APPROVED`
یک قابلیت هرگز بالاتر از سطح شواهدش گزارش نمی‌شود.

**END OF REPORT**