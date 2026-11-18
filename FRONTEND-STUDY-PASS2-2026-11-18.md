# مطالعه دوم فرانت‌اند — `upstream-registry`
## Eco Nojin / HyDroMA — Pass 2 (ممیزی کد، امنیت، دسترس‌پذیری، بلوغ)

**تاریخ:** 2026-11-18 (پاس دوم)
**دامنه:** ۵۵ پوشه در `D:\NOJIN\upstream-registry` (۵۴ پروژه پیشین + خانواده جدید `frontend-foundations`)
**حالت:** READ-ONLY. هیچ فایل upstream تغییر نکرد؛ هیچ نصب/بیلد جدیدی اجرا نشد.

---

## 0. چه چیزی در این پاس «جدید» است

1. **دامنه تغییر کرده است:** پوشه `frontend-foundations` (batch-16) با ۴ پروژه در ۱۸ نوامبر اضافه شده؛ شمار پوشه‌ها از ۵۴ به **۵۵** رسیده و مجموع فایل‌های فرانت‌اند از ۶۳٬۹۶۱ به **۶۵٬۹۴۶** رسید.
2. **ممیزی کد به‌جای فهرست‌گیری:** این پاس روی سینک‌های XSS، ذخیره‌سازی اعتبارنامه، مدیریت خطا، دسترس‌پذیری، توکن‌های طراحی، فرم‌ها، Real-time و واگرایی نسخه‌های ژئو متمرکز است — با شمارش روی کد، نه خواندن README.
3. **راستی‌آزمایی گزارش قبلی:** دو ادعای پاس اول تصحیح شد (RTL در Directus، تعداد locale کسترا) و اعداد کل به‌روز شد.
4. **تحلیل مستقل batch-16:** نتایج بیلد از لاگ‌های `_logs` بازبینی شد؛ سه پروژه از چهار پروژه در `next build` شکست می‌خورند و **هیچ‌کدام `dir` ندارند**.

---

## 1. روش و محدودیت‌ها

- **شمارش فایل:** پسوندهای فرانت‌اند، بدون `node_modules`, `.next`, `out`, `dist/build`, `vendor`, `test`, `examples`, `docs`.
- **متریک‌های کد:** خواندن یک‌باره هر فایل با Regex (count-based). این روش «چگالی نشانه» را می‌سنجد، نه کیفیت مطلق.
- **LOC:** پوشه‌های `src` اپ‌ها، شامل تست‌ها.
- **محدودیت‌ها:**
  - شمارش `i18n` برای Superset/Kestra کم‌برآورد است (API متفاوت `t()`/`$t`).
  - `aria-*` نشانه تلاش است، نه تضمین دسترس‌پذیری.
  - بیلد batch-16 از لاگ‌های موجود خوانده شد؛ برای پاس دوم بیلد تازه اجرا نشد.
  - اعداد LOC بین پاس‌ها ±۲٪ تفاوت دارد (روش شمارش خط).

---

## 2. موجودی به‌روزشده (پس از افزودن batch-16)

| پروژه | فایل FE | LOC (src) | Stack | تست | i18n | RTL |
|---|---:|---:|---|---:|---|---|
| medusa (admin) | 11,903 | 296k | React 18 + Vite + TanStack Query + Radix/Tailwind | 33 | ۳۵ زبان | جزئی |
| grafana | 9,952 | 1.20M | React 19 + webpack + RTK + Emotion | 2,411 | گسترده | ندارد |
| novu (dashboard) | 9,440 | 193k | React 19 + Vite + shadcn/Tailwind 4 | 36 | محدود | ندارد |
| directus (app) | 3,792 | 348k | Vue 3 + Pinia + Vite | 423 | vue-i18n | **کامل** |
| superset | 3,782 | 560k | React 18 + AntD 6 + ECharts + deck.gl | 860 | ۳۰+ (Babel) | ندارد |
| openforis-arena | 2,883 | 96k | React 19 + MUI 9 + MapLibre | 253 | i18next | ندارد |
| cesium | 2,882 | — | JS/TS + WebGL | Playwright | — | — |
| sepal | 2,659 | 254k | React 19 + state سفارشی + Redux | 364 | ۳ زبان | ندارد |
| spree | 2,232 | 152k | React 19 + Tailwind + TanStack Query | 39 | ۹ زبان | ندارد |
| kestra | 2,189 | 314k | Vue 3.5 + Element Plus + Monaco | 587 | **۱۳ زبان** | ندارد |
| flowise | 1,861 | 93k | React 18 + MUI 5 + ReactFlow | 2 | محدود | ندارد |
| qloapps | 1,797 | — | Smarty + jQuery + Bootstrap 3 | 0 | — | ندارد |
| **velora-ui** | **689** | **85k** | Next 16.3 + React 19 + Tailwind 4 + motion | 0 | ندارد | ندارد |
| **kiranism-dashboard** | **655** | **102k** | Next 16.2 + React 19 + Base UI + TanStack | 0 | ندارد | ندارد |
| **nellavio** | **458** | **80k** | Next 16.1 + React 19 + next-intl + Apollo | **32** | en/pl | ندارد |
| **orbynadmin** | **183** | **79k** | Next 16.2 + React 19 + shadcn + mock data | 0 | ندارد | ندارد |
| geolibre | 1,770 | 496k + 285k | React 19 + MapLibre + Cesium + Tauri | 983 | ۲۱ زبان | **کامل** |
| dolibarr | 1,157 | — | PHP + jQuery + Bootstrap | 0 | چندزبانه | ندارد |
| keycloak (js) | 1,082 | 99k | React 18 + PatternFly 5 | 14 | i18next | ندارد |
| erpnext | 848 | — | Frappe Desk + banking React 19 | 0 | fa.po | ندارد |
| collect | 789 | 22k | React 19 + Redux + MUI | 0 | — | ندارد |
| deck.gl | 693 | — | TS + WebGL | per-module | — | — |
| collect-earth | 621 | — | React + MUI/MapLibre | — | — | — |
| maplibre-gl-js | 593 | — | TS + WebGL | Vitest | — | — |
| giro3d | 276 | — | TS + three + OL | Vitest | — | — |

**جمع کل:** ۶۵٬۹۴۶ فایل فرانت‌اند در ۵۵ پوشه.

**نکته حاکمیتی:** `FINAL-UPSTREAM-MANIFEST.csv` هنوز ۵۴/۵۵ قدیمی را نشان می‌دهد؛ batch-16 فقط در `UPSTREAM-FRONTEND-MANIFEST.json` ثبت شده است. برای سازگاری کنترل رجیستری، این دو باید هم‌تراز شوند (پیشنهاد: بدون تغییر آرشیوها، فقط یادداشت وضعیت).

---

## 3. خانواده جدید — `frontend-foundations` (batch-16)

| معیار | kiranism | nellavio | orbynadmin | velora-ui |
|---|---|---|---|---|
| مجوز | MIT | MIT | MIT | MIT |
| نسخه | v2.0.0 | 2.0.1 | main | v0.11.0 |
| Next / React | 16.2.6 / 19.2.4 | 16.1.6 / 19.2.4 | 16.2.10 / 19.2.4 | 16.3.7 / 19.3.0 |
| صفحه (`page.tsx`) | 30 | 19 | **79** | 22 |
| Client Components | 127 | 98 | 109 | 141 |
| Server Actions | 2 | 0 | 0 | 0 |
| Route Handlers | 4 | 1 | 0 | 0 |
| تست | 0 | **32** | 0 | 0 |
| i18n | ندارد | **next-intl en/pl** | ندارد | ندارد |
| `html lang` | `en` | `locale` | `en` | `en` |
| `dir` | **ندارد** | **ندارد** | **ندارد** | **ندارد** |
| سینک HTML | 2 (chart/theme) | 1 (escape شده) | 1 (chart) | 7 (Shiki/JSON-LD) |
| `aria-*` | 84 | 227 | 99 | 206 |
| بیلد تولیدی (لاگ) | **FAIL** prerender | **FAIL** prerender | **FAIL** prerender | **PASS** |
| Dev server | 500 (Clerk) | 200 | 200 | 200 |
| وابستگی خارجی سخت | Clerk + Sentry | GraphQL/better-auth | ندارد (mock) | Unsplash (hotlink) |
| بلوغ | بالا / وابسته | متوسط / مستقل‌تر | پایین (تک‌نگهدار) | بالا در دامنه خودش |

### 3.1 kiranism-dashboard — بهترین لایه داده، بدترین استقلال
- ساختار feature-sliced: ۱۱ دامنه در `src/features/*` + `src/lib/query-client.ts` + `nuqs` برای state آدرس + Zod.
- الگوی `HydrationBoundary + useSuspenseQuery` واقعی است (نه دموی صرف) — قابل اقتباس برای کنسول Nojin.
- **اما:** Clerk اجباری است؛ بدون کلید همه مسیرها 500 می‌شوند. استفاده فقط با پذیرش SaaS هویت یا جایگزینی کامل لایه auth.

### 3.2 nellavio — تنها گزینه با i18n و RBAC ساختاریافته
- `src/i18n/routing.ts`: locale routing با `as-needed`؛ `src/config/access.ts`: نقش‌های admin/editor/viewer بدون وابستگی به کتابخانه auth (سالم برای باندل کلاینت).
- `services/` + `queries/` برای GraphQL؛ حالت presentation با `backendBackup.json`.
- تنها پروژه batch-16 با تست (۳۲ فایل) و Storybook؛ اما کاتالوگ‌ها en/pl و بدون RTL.

### 3.3 orbynadmin — بیشترین صفحه، کم‌ترین عمق
- ۷۹ صفحه/۱۰ داشبورد با داده Mock؛ theme customizer مبتنی بر CSS Variable (شاهد خوب برای معماری توکن).
- بدون auth واقعی، بدون تست، بدون لایه API؛ provenance ضعیف (تک‌مالک، ۲۰۲۶).

### 3.4 velora-ui — تنها بیلد سبز
- Next 16.3.7 با ۱۲۱+ مسیر prerender؛ registry سازگار shadcn (۱۰۱ کامپوننت + ۳۱ بلوک) + pipeline مستندات MDX.
- مناسب `portal` و زبان انیمیشن؛ **نه** پوسته کنسول. `<img>` بدون `next/image` → بهینه‌سازی تصویر وجود ندارد.

### 3.5 شکست مشترک بیلد (شاهد، نه حدس)
سه پروژه در `next build` با خطای داخلی Next شکست می‌خورند:
`Invariant: Expected workStore to be initialized` / `Expected workUnitAsyncStorage to have a store`
- فقط روی Next 16.1.6 / 16.2.6 / 16.2.10 و در مرحله prerender مسیرهای داینامیک.
- همان ماشین، Next 16.3.7 را با موفقیت بیلد می‌کند.
- Dev server همان مسیرها را 200 می‌دهد.
**نتیجه:** نقص upstream در خط 16.1–16.2 است؛ پیامد عملی = قید نسخه (Next ≥ 16.3) برای هر میزبان آینده.

---

## 4. ممیزی عرضی — یافته‌های پاس دوم

### 4.1 سینک‌های HTML (ریسک XSS)
| پروژه | تعداد | نمونه / وضعیت |
|---|---:|---|
| grafana | 25 | markdown/help با `marked` + `DOMPurify` موجود؛ mermaid با `sanitizeSVGContent` |
| directus | 20 | `v-field-template` با `dompurify.sanitize` (خط ۲۷۳)؛ بقیه ساخت ثابت |
| kestra | 13 | `v-html` روی i18n و لاگ؛ لاگ از `xss()` عبور می‌کند (کامنت nosemgrep) |
| novu | 8 | پیش‌نمایش ایمیل با `sanitize-html`؛ chart style |
| spree | 8 | DOMPurify + sanitize سمت سرور (کامنت biome) |
| geolibre | 8 | `sanitize-html.ts` اختصاصی + StoryMap |
| superset | 4 | Chart iframe/style داخلی |
| arena | 2 | markdown renderer |
| medusa / keycloak / collect | 0 | — |
| **new 4** | 2/1/1/7 | chart style، escape دستی، Shiki build-time، JSON-LD |

**حکم:** هیچ سینک بدون sanitizer در مسیر داده کاربر پیدا نشد؛ اما Directus/Novu/Spree به sanitizerهای کتابخانه‌ای و Grafana به `marked` وابسته‌اند → نسخه این کتابخانه‌ها باید pin و پایش شود.

### 4.2 ذخیره‌سازی اعتبارنامه
| پروژه | الگو | ارزیابی |
|---|---|---|
| medusa | session cookie پیش‌فرض؛ JWT اختیاری با کلید قابل‌تنظیم | سالم |
| directus | cookie/session؛ localStorage فقط SSO provider | سالم |
| novu | `getToken()` از لایه auth؛ localStorage برای UI state | سالم |
| superset | Redux persist در localStorage (شامل state داشبورد) | نیازمند مرزبندی داده حساس |
| kestra | ۱۲۸ استفاده localStorage برای UI/UID/تنظیمات | بدون راز؛ قابل قبول |
| geolibre | ۱۰۴ استفاده؛ **توکن Mapbox/Cesium در تنظیمات ماندگار** | ریسک ذاتی دسکتاپ؛ رمزنگاری لازم |
| flowise | `user`/`permissions` در localStorage؛ token در حافظه | قابل قبول، اما PII در localStorage |
| new 4 | next-themes + UI state؛ هیچ توکنی | سالم |

### 4.3 مدیریت خطا و بارگذاری
| پروژه | ErrorBoundary/errorElement | Suspense | try/catch | loading UI |
|---|---:|---:|---:|---:|
| grafana | 246 | 77 | 746 | 853 |
| medusa | 83 | 2 | 71 | 247 |
| novu | 6 | 1 | 185 | 823 |
| geolibre | 75 | 24 | 793 | 3 |
| keycloak | 10 | 1 | 267 | 113 |
| spree | **0** | 1 | 198 | 231 |
| arena | 3 | 4 | 89 | 22 |
| sepal | 4 | 0 | 35 | 27 |
| collect | **0** | 1 | 15 | 40 |
| new: kiranism | 6 + error.tsx | 19 | — | skeleton |
| new: nellavio | 11 + error.tsx | 3 | — | skeleton |

**یافته:** Spree و Collect هیچ Error Boundary ندارند؛ Novu نسبت به حجمش boundary کم دارد (۶) ولی Sentry دارد (۶۴ ارجاع).

### 4.4 دسترس‌پذیری (نشانه‌ای)
- بالاترین چگالی `aria-*`: geolibre (1006)، grafana (943)، keycloak (342)، novu (304)، spree (291)، kestra (273).
- پایین‌ترین: prometheus (0)، sepal (9)، collect (27).
- در batch-16: nellavio (227) و velora (206) از kiranism (84) و orbyn (99) جلوترند.
- **هیچ‌کدام تست a11y خودکار در CI ندارند** (به‌جز nellavio که `vitest-axe` در devDeps دارد).

### 4.5 توکن‌های طراحی و رنگ hardcode
| پروژه | hex | `var(--…)` | تفسیر |
|---|---:|---:|---|
| kestra | **23,524** | 4,955 | بدهی جدی تم؛ رنگ‌ها در SFCها پخش شده‌اند |
| sepal | 3,172 | 1,608 | نیمه‌توکن‌محور |
| grafana | 2,996 | 9 | پالت در TS، نه CSS var |
| novu | 1,465 | 256 | Tailwind + استثناها |
| geolibre | 285 | 1,325 | توکن‌محور |
| directus | 96 | **5,387** | کاملاً CSS-variable |
| spree | **4** | 25 | بهترین نظم |
| medusa | 31 | 50 | طراحی سیستم‌محور |
| orbyn | — | زیاد (customizer) | مکانیزم قابل اقتباس |

**نتیجه:** برای Nojin، مدل Directus/Spree (CSS variable + Tailwind theme) بهترین شاهد است؛ Kestra به‌عنوان الگوی توکن **نه**.

### 4.6 فرم‌ها و اعتبارسنجی
- `react-hook-form` + Zod: medusa (217/840)، spree (101/218)، keycloak (459)، novu (279/53)، kiranism (TanStack Form + Zod).
- بدون RHF/Zod: superset، directus، arena، sepal، kestra، collect → فرم‌های دستی/Redux.
- **توصیه:** مسیر RHF/Zod (یا TanStack Form) به‌عنوان استاندارد کنسول.

### 4.7 Real-time
| پروژه | WebSocket/SSE |
|---|---:|
| arena | 118 |
| novu | 47 |
| sepal | 36 |
| geolibre | 22 |
| directus | 20 |
| kestra | 11 |
| superset | 8 |
| collect | 8 |

الگوی غالب: WebSocket برای اعلان/وضعیت؛ SSE در Arena برای streaming AI.

### 4.8 واگرایی نسخه ژئو (ریسک یکپارچگی)
| کتابخانه | نسخه‌های موجود | مصرف‌کننده |
|---|---|---|
| MapLibre | 6.3.0 / 6.16.0 / 6.18.0 | opentripplanner، geolibre/collect-earth-explorer، arena |
| Cesium engine | 26.4.0 / 26.5.0 + cesium 1.146 | geolibre، cesium |
| deck.gl | ~9.4.0 / ^9.4.1 | deck-gl monorepo، geolibre، superset |
| three | 0.180 / 0.187 | giro3d، geolibre |
| OpenLayers | 6.4.3 / 10.8 / 10.10 / 10.11 | ceo، giro3d، grafana، superset |
| ECharts | 6.1 | kestra، superset |

**تصمیم پیشنهادی:** در پلتفرم Nojin فقط **یک** نسخه از هر موتور، pin شده در `packages/map-core`؛ وگرنه dupe bundle و ناسازگاری plugin.

---

## 5. تصحیح گزارش پاس اول

| ادعای پاس ۱ | وضعیت واقعی (پاس ۲) |
|---|---|
| «RTL ساختاری فقط در geolibre؛ مدوسا جزئی» | **Directus هم RTL کامل دارد**: `app/src/constants/text-direction.ts` (`ar-SA`, `fa-IR`, `he-IL`) + `app.vue` با `dir` داینامیک + آینه‌کردن آیکون‌ها |
| «kestra 18 زبان» | فایل‌های ترجمه: **۱۳** زبان (بقیه فایل تست/کد بودند) |
| «۵۴ پروژه، ۶۳٬۹۶۱ فایل» | **۵۵ پوشه، ۶۵٬۹۴۶ فایل** (batch-16 اضافه شده) |
| «مدوسا ۳۷ زبان» | ۳۵ کاتالوگ + `$schema.json` |
| «فقط geolibre الگوی کامل RTL» | Directus نیز الگوی کاملی دارد (به‌ویژه آینه‌کردن آیکون و جهت کامپوننت) |

---

## 6. رجیستر ریسک (به‌روزشده)

| # | ریسک | شاهد | شدت | اقدام |
|---|---|---|---|---|
| R1 | سه‌چهارم batch-16 در بیلد تولیدی شکست می‌خورند | `_logs/*-build.log` | بالا | قید Next ≥16.3 یا پچ upstream |
| R2 | هیچ‌کدام از ۴ پروژه جدید RTL ندارند | نبود `dir` در layoutها | بالا | ساخت `packages/i18n` + logical CSS |
| R3 | وابستگی سخت kiranism به Clerk | 500 در همه مسیرها | بالا | فقط الگو، نه فورک |
| R4 | Kestra: ۲۳٬۵۲۴ رنگ hardcode | شمارش hex | متوسط | در الگوها استفاده نشود |
| R5 | Spree/Collect بدون Error Boundary | شمارش 0 | متوسط | الگوی boundary اجباری در کنسول |
| R6 | توکن‌های Mapbox/Cesium در تنظیمات محلی GeoLibre | `useMapboxAccessToken` | متوسط | رمزنگاری/Secret store |
| R7 | واگرایی MapLibre/Cesium/OL | جدول ۴.۸ | متوسط | pin در یک پکیج مشترک |
| R8 | ناسازگاری manifest (54 vs 55) | `FINAL-UPSTREAM-MANIFEST.csv` | پایین | به‌روزرسانی وضعیت، بدون تغییر آرشیو |
| R9 | assets بدون مجوز مستقل در ۴ پروژه جدید | نبود asset license | متوسط | ممیزی تصویر/فونت قبل از استفاده |
| R10 | گرافانا AGPL / Directus MSCL / EE در Novu-Flowise-Medusa | LICENSE | بالا | فقط سرویس مستقل یا الگو |

---

## 7. توصیه‌های تصمیم‌محور

### 7.1 معماری فرانت‌اند Nojin (پیشنهاد، نه تصمیم مالک)
1. **یک پایه، چند الگو:** هیچ‌کدام از ۵۵ پروژه را فورک نکنید. پایه را در `packages/design-system` + `packages/i18n` + `packages/map-core` بسازید.
2. **پوسته کنسول:** الگوی feature-sliced و data-layer از kiranism (بدون Clerk) + locale routing و RBAC از nellavio + توکن CSS-variable از orbyn/Directus.
3. **پورتال عمومی:** الگوی registry و motion از velora؛ تصاویر با `next/image` و asset محلی.
4. **نقشه:** MapLibre به‌عنوان خط اصلی 2D؛ deck.gl برای لایه‌های GPU؛ Cesium/Giro3D فقط برای 3D واقعی.
5. **داده:** TanStack Query + router loader/data-router؛ RHF/TanStack Form + Zod.
6. **i18n/RTL:** الگوی Directus (آینه آیکون + `dir` داینامیک) + `languageDirection` ژئولیبر + اسکیمای ترجمه مدوسا. فارسی از روز اول + تست pseudo-RTL.
7. **تحلیل/پایش:** Superset (Apache-2.0) سرویس مستقل؛ Grafana فقط standalone.

### 7.2 معیار پذیرش فرانت‌اند جدید (Definition of Done)
- `next build` سبز روی Next ≥ 16.3 با prerender کامل.
- `dir` و `lang` از root؛ تست RTL برای ۵ صفحه کلیدی.
- Error Boundary/`error.tsx` برای هر route group + حالت loading.
- هیچ `dangerouslySetInnerHTML` بدون sanitizer pin شده.
- بدون رنگ hex در کامپوننت (فقط CSS variable).
- حداقل یک تست برای هر صفحه حساس؛ بودجه a11y (axe) در CI.
- بدون وابستگی سخت به SaaS هویت/لاگ.

### 7.3 گام‌های بعدی پیشنهادی
1. POC کوچک: `apps/console-shell` با ۲ ماژول (کاربران + یک داشبورد) بر اساس الگوهای بالا.
2. تعریف `packages/i18n` با کاتالوگ fa/ar/en و helper `direction()`.
3. تعریف `packages/map-core` با MapLibre pin شده و adapter برای deck.gl.
4. ممیزی حقوقی/asset برای گرافانا، Directus، Novu EE و batch-16.
5. تصمیم درباره Next 16.3+ به‌عنوان حداقل نسخه میزبان.

---

## 8. پیوست — داده خام و محدودیت‌ها

**متریک‌های پاس دوم (نمونه):**

| پروژه | سینک HTML | localStorage | ErrorBoundary | aria | hex | CSS var |
|---|---:|---:|---:|---:|---:|---:|
| medusa | 0 | 5 | 83 | 33 | 31 | 50 |
| grafana | 25 | 5 | 246 | 943 | 2,996 | 9 |
| novu | 8 | 34 | 6 | 304 | 1,465 | 256 |
| directus | 20 | 4 | 25 | 40 | 96 | 5,387 |
| superset | 4 | 13 | 56 | 188 | 35 | 3 |
| arena | 2 | 8 | 3 | 114 | 253 | 54 |
| sepal | 2 | 4 | 4 | 9 | 3,172 | 1,608 |
| spree | 8 | 4 | 0 | 291 | 4 | 25 |
| kestra | 13 | 128 | 4 | 273 | 23,524 | 4,955 |
| flowise | 2 | 76 | — | 269 | — | — |
| geolibre | 8 | 104 | 75 | 1,006 | 285 | 1,325 |
| keycloak | 0 | 0 | 10 | 342 | 15 | 144 |
| collect | 0 | 2 | 0 | 27 | 17 | 0 |
| kiranism | 2 | 0 | 6 | 84 | — | — |
| nellavio | 1 | 0 | 11 | 227 | — | — |
| orbyn | 1 | 0 | 0 | 99 | — | — |
| velora | 7 | 0 | 0 | 206 | — | — |

**محدودیت‌های صریح:**
- شمارش‌ها heuristic هستند و جایگزین ممیزی تخصصی حقوقی/امنیتی نیستند.
- بیلد batch-16 از لاگ موجود خوانده شد؛ وضعیت امروز ممکن است با تغییر وابستگی‌ها متفاوت باشد.
- `i18n` در Superset/Kestra کم‌شمرده شده است.
- هیچ کد یا asset بین مخازن و پلتفرم Nojin منتقل نشده است.
