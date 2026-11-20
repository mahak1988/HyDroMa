# نقشهٔ انتقال بک‌اند و برنامهٔ اجرایی

**تاریخ:** ۲۰۲۶-۱۱-۲۰ · **دامنه:** لایه‌های `services/`, `contracts/`, `databases/`, `engines/`, `infrastructure/`, `integrations/`, `workflows/`, `tests/` و مخازن بالادستی
**وضعیت سند:** برنامه و فهرست انتقال — هیچ فایلی در این مرحله جابه‌جا یا ساخته نشده است.

---

## ۰. خلاصهٔ مدیریتی

بک‌اند پروژه امروز **صفر خط کد** دارد: ۱۳ دامنه در `services/`، ۴ قرارداد در `contracts/`، ۶ نقش ذخیره‌سازی در `databases/` و ۲۵ زیردامنه در `engines/hydroma` همه فقط `README` هستند. در عوض، **مدل دامنه و داده‌های نمایشی در فرانت‌اند زندگی می‌کنند** و همین‌ها باید منبع اولیهٔ قراردادها و بذرهای بک‌اند شوند.

سه کار در این سند تعریف شده است:

1. **فهرست A:** فایل‌های داخل پروژه که باید به پوشهٔ درست خود منتقل شوند (۱۱ مورد).
2. **فهرست B:** پروژه‌های متن‌باز بالادستی و مقصد هرکدام — با تفکیک «وابستگی قابل استفاده» از «فقط مرجع» بر اساس مجوز (۱۹ پروژه در ۴ دسته).
3. **برنامهٔ اجرایی:** ۷ فاز با معیار پذیرش، تخمین و ریسک.

**دو قاعدهٔ حاکم بر کل سند:** (۱) فقط مجوزهای MIT/Apache-2.0/BSD/ISC/CC0 وارد درخت محصول می‌شوند؛ GPL/AGPL/OSL/MSCL/EUPL **فقط مرجع** می‌مانند و کپی نمی‌شوند. (۲) هیچ تصمیم فناوری به‌جای مالک گرفته نمی‌شود؛ جایی که تصمیم باز است، صریح علامت خورده.

---

## ۱. وضعیت فعلی (شواهد اندازه‌گیری‌شده)

| مسیر | وضعیت واقعی | شاهد |
|---|---|---|
| `services/*` (۱۳ دامنه) | **۰ فایل** به‌جز README | شمارش بازگشتی |
| `contracts/{api,events,schemas,scientific-models}` | **۰ فایل** | همان |
| `databases/{relational,geospatial,time-series,analytical,migrations,seeds}` | **۰ فایل** | همان |
| `engines/hydroma` (۲۵ زیردامنه) | **۰ فایل** | همان |
| `engines/ai-workforce` | **۰ فایل** | همان |
| `infrastructure/`, `workflows/`, `integrations/`, `tests/` | **۰ فایل** | همان |
| `packages/api-client` | ۵ فایل؛ مسیرهای `v1/users`, `v1/organizations`, `v1/organizations/:id/members` در کد | `client.ts` |
| `packages/domain-types` | مدل واقعی دامنه (هویت، تجارت، گردشگری، مجوز، پول) | ۱٬۳۳۹ خط |
| `packages/scientific` | موتور بیلان آب با قرارداد خروجی کامل | ۳۵۰ خط + ۱۵ تست |
| `apps/platform/src/data/entities.ts` | ۳۸ مجموعهٔ داده، ۱۰۰+ رکورد با منبع/روش/عدم‌قطعیت | ۳۸٬۰۰۰ بایت |
| `apps/marketplace/src/data/catalog.ts` | ۸ فروشنده، ۲۰ محصول، ۲۰ دسته | ۲۹۶ خط |
| `apps/tourism/src/data/tourism.ts` | مقصد، اقامت، تجربه، رویداد | ۱٬۵۷۳ خط |
| `upstream-registry/` | ۵۵ مخزن استخراج‌شده، رجیستر مجوز کامل | `FINAL-UPSTREAM-MANIFEST.csv` |

**نتیجهٔ تحلیلی:** بک‌اند از صفر شروع نمی‌شود؛ **از مدل دامنهٔ فرانت‌اند شروع می‌شود**. این مزیت است، به شرط آنکه قراردادها قبل از کد نوشته شوند، نه بعد از آن.

---

## ۲. معماری هدف (پیشنهاد، نه تصمیم)

```
services/            مونولیت ماژولار (Node 24 + Fastify + Drizzle + PostgreSQL)
  api-gateway/       ورودی واحد، تأیید توکن، نرخ، اعتبارسنجی
  identity/          اعتبارنامه، نشست، MFA  (آداپتور Keycloak)
  organization/      نهاد حقوقی، عضویت، نقش سازمانی
  user-management/   پروفایل، ترجیح زبان/تقویم، رضایت
  marketplace/       آگهی، سفارش
  inventory/         دفتر موجودی (append-only)
  finance/           سند، دفتر کل، تسویه (بدون کیف پول/توکن)
  tourism/           اقامت، تقویم، رزرو
  notification/      قالب، تحویل، dedupe
  content/           محتوای چندزبانه
  workflow/          آداپتور Kestra یا Temporal
  ai-orchestration/  صف کار عامل، مجوز ابزار، رد اجرا
  reporting/         read model، خروجی، گزارش زمان‌بندی‌شده

engines/hydroma/     سرویس مستقل Python (FastAPI) با قرارداد contracts/scientific-models
contracts/           OpenAPI + JSON Schema + رویدادها + قرارداد مدل علمی
databases/           migration، seed، نقش هر انبار
data/                raw / processed / reference / fixtures (جدا از هم)
```

**چرا این ترکیب:** TypeScript در هر دو سر (کلاینت تایپ‌شدهٔ موجود بدون بازنویسی وصل می‌شود)، Fastify سبک و MIT است، Drizzle و Zod هم MIT‌اند و با `packages/validation` هم‌خانواده‌اند. موتور علمی به‌دلیل وابستگی‌های علمی (xarray/rasterio/flopy) در Python می‌ماند و از طریق قرارداد، سرویس می‌شود — همان چیزی که `engines/README.md` الزام کرده.

**تصمیم‌های باز که این سند حل نمی‌کند:** `D-04` (Identity Provider)، `D-DB-01` (انبار تحلیلی)، `D-ARC-01` (مونولیت/سرویس)، `D-07` (موتور گردش‌کار)، `D-17` (پذیرش مدل علمی)، `D-INT-01/02` (داده و پرداخت). سه تصمیم جدید هم لازم است: ORM، محل نگهداری رستر، و شکل استقرار موتور (پروسهٔ کنار یا کانتینر جدا).

---

## ۳. فهرست A — فایل‌های داخل پروژه که باید منتقل شوند

| # | منبع فعلی | مقصد | اقدام | چرا |
|---|---|---|---|---|
| A-01 | `packages/api-client/src/client.ts` (مسیرها و بدنه‌ها) | `contracts/api/openapi.yaml` | **استخراج** قرارداد، سپس تولید کلاینت از آن | امروز قرارداد در کد کلاینت «حک شده»؛ سند می‌گوید قرارداد تنها اتصال مجاز است |
| A-02 | `packages/domain-types/src/{identity,commerce,tourism,permissions}.ts` | `contracts/schemas/*.schema.json` | **تولید** JSON Schema از تایپ‌ها (اسکریپت `scripts/contracts/`) | مدل مشترک باید نسخه‌دار و زبان‌مستقل شود؛ TS می‌ماند منبع نگارش |
| A-03 | `packages/scientific/src/water-balance.ts` | `contracts/scientific-models/water-balance.schema.json` + `engines/hydroma/water/` | **انتقال پیاده‌سازی** به موتور، نگه‌داشتن قرارداد در پکیج | تنها کد علمی پروژه، جای درستش موتور است نه فرانت‌اند |
| A-04 | `archive/legacy-site/src/js/engines/water-balance.js` | `engines/hydroma/reference/` | **آرشیو مرجع** (غیرقابل اجرا) | سابقهٔ الگوریتم و تست‌ها؛ نباید دوباره اجرا شود |
| A-05 | `apps/platform/src/data/entities.ts` (۳۸ مجموعه) | `databases/seeds/platform/*.json` | **صدور به JSON** + اسکریپت seed | دادهٔ نمایشی باید از کد اپ جدا و از دادهٔ واقعی تفکیک شود |
| A-06 | `apps/marketplace/src/data/catalog.ts` | `databases/seeds/marketplace/{sellers,products,categories}.json` | همان | منبع اولیهٔ جداول بازارگاه |
| A-07 | `apps/tourism/src/data/tourism.ts` | `databases/seeds/tourism/*.json` | همان | منبع اولیهٔ اقامت/تجربه/رویداد |
| A-08 | `apps/console/src/data/mock-backend.ts` | `tests/fixtures/identity/` + `databases/seeds/identity/` | **تفکیک**: fixture تست از seed محیط | mock-backend الان هم تست است هم داده؛ این دو باید جدا شوند |
| A-09 | `apps/*/src/content/*.ts` (پورتال، گردشگری، بازارگاه) | `services/content/seed/{fa,en,ar}/` | **انتقال** با حفظ ساختار سه‌زبانه | محتوا مالک دارد: سرویس content، نه باندل هر اپ |
| A-10 | `packages/domain-types/src/money.ts` | `contracts/schemas/money.schema.json` + استفاده در سرویس مالی | **استخراج قرارداد** | قاعدهٔ پول (minor units، ارز) باید در دو طرف یکی باشد |
| A-11 | `upstream-registry/*` | بدون جابه‌جایی؛ افزودن `ADOPTED.md` | **فهرست کردن** تصمیم‌های پذیرش | شاهد می‌ماند؛ کد GPL هرگز وارد درخت نمی‌شود |

**نکتهٔ مهم:** A-02 و A-10 «کپی» نیستند؛ **تولید مصنوع** از منبع تایپ‌شده‌اند. اگر روزی تایپ عوض شود و اسکریپت اجرا نشود، قرارداد کهنه می‌شود — پس اجرای اسکریپت باید در CI باشد.

---

## ۴. فهرست B — پروژه‌های بالادستی و مقصدشان

### B-1. پذیرش به‌عنوان وابستگی/سرویس (مجوز آزاد)

| پروژه | مجوز | مقصد در پروژه | نقش |
|---|---|---|---|
| **Keycloak** | Apache-2.0 | `services/identity/adapters/keycloak/` + `infrastructure/identity/` | OIDC، نشست، MFA؛ خودمیزبان، بدون وابستگی ابری |
| **PostgreSQL + PostGIS + TimescaleDB** | PostgreSQL/BSD | `databases/relational`, `databases/geospatial`, `databases/time-series` | انبار اصلی و سری زمانی |
| **Titiler** | MIT | `integrations/geospatial/titiler/` | سرو COG/WMTS بدون ابر |
| **pgstac** | MIT | `databases/geospatial/stac/` | کاتالوگ STAC روی Postgres |
| **pystac / odc-stac** | Apache-2.0 | `engines/hydroma/remote-sensing/` | جست‌وجوی صحنه و بارگذاری |
| **MapServer** | MIT (OSGeo) | `integrations/geospatial/mapserver/` | WMS/WFS سنتی در صورت نیاز |
| **SeaweedFS** | Apache-2.0 | `infrastructure/storage/` | ذخیرهٔ رستر و فایل بزرگ |
| **Prometheus + OpenTelemetry Collector** | Apache-2.0 | `infrastructure/monitoring/` | متریک، تریس، SLO |
| **Temporal** (MIT) یا **Kestra** (Apache-2.0 OSS) | MIT / Apache | `services/workflow/adapters/` | گردش‌کار و تأیید انسان — **انتخاب با مالک (D-07)** |
| **MODFLOW 6 + FloPy** | CC0 / public domain | `engines/hydroma/groundwater/` | آب زیرزمینی |
| **AquaCrop-OSPy** | Apache-2.0 | `engines/hydroma/agriculture/` | پاسخ محصول به آب |
| **xclim + climate-indices** | Apache-2.0 / BSD | `engines/hydroma/climate/` | شاخص‌های اقلیمی |
| **Landlab** | MIT | `engines/hydroma/erosion/` | فرآیندهای سطح زمین |
| **pygeoprocessing + InVEST** | BSD / Apache-2.0 | `engines/hydroma/mrv/` | خدمات اکوسیستمی و کربن |
| **Wflow.jl** | MIT | `engines/hydroma/hydrology/` | باران–رواناب (اجرای Julia، جدا از سرویس TS) |

### B-2. فقط مرجع — کپی ممنوع (کپی‌لفت یا منبع‌در دسترس)

| پروژه | مجوز | چرا فقط مرجع | استفادهٔ مجاز |
|---|---|---|---|
| ERPNext | GPL-3.0 | کپی‌لفت قوی؛ وارد کردن یعنی GPL شدن سرویس | خواندن مدل حساب/دفتر کل برای طراحی |
| Dolibarr | GPL-3.0 | همان | الگوی فاکتور و تسویه |
| Directus | MSCL-1.0-GPL | «منبع‌در دسترس»، نه متن‌باز | مقایسهٔ CMS؛ استفاده نشد |
| farmOS | GPL-2.0 | کپی‌لفت | مدل دادهٔ مزرعه |
| QloApps | OSL-3.0 | کپی‌لفت نامتعارف | مرجع رزرو هتل |
| Grafana | AGPL-3.0 | افشای شبکه‌ای | فقط به‌عنوان سرویس جدا در صورت نیاز؛ هرگز لینک به کد |
| HydroMT-Wflow | GPL-3.0 | کپی‌لفت | مرجع پیکربندی مدل |
| PCSE | EUPL-1.1 | کپی‌لفت اروپایی | مرجع مدل محصول |
| SWAT+ | LGPL-2.1 | ضعیف اما نیازمند بازبینی حقوقی | مرجع مدل حوضه |
| OpenTripPlanner | LGPL-3.0 | ضعیف؛ JVM جدا | فقط در صورت نیاز مسیریابی، به‌صورت سرویس جدا |

### B-3. رد شده (بدون انتقال)

| پروژه | دلیل |
|---|---|
| WRF (آرشیو خالی)، WPS (بدون فایل مجوز) | غیرقابل استفاده / مجوز نامعلوم |
| OpenZeppelin Contracts | حوزهٔ بلاک‌چین؛ خارج از دامنهٔ این مرحله |
| Flowise / LangGraph / Agno / Node-RED | جایگزین‌های موتور عامل و گردش‌کار؛ افزودن‌شان هم‌زمان با Temporal/Kestra یعنی دو موتور موازی |
| Medusa / Spree | بک‌اند تجارت؛ با مدل بازارگاه موجود و تصمیم باز D-PROD-01 زود است |
| Novu | اعلان با مرز Enterprise؛ سرویس notification خودمان کوچک‌تر و شفاف‌تر است |
| Collect / Collect Earth / SEPAL / OpenForis Arena | ابزار گردآوری دادهٔ میدانی؛ فاز بعد، نه MVP |
| Superset / OpenSearch | تنها اگر read model واقعاً بزرگ شد (D-DB-01) |

---

## ۵. برنامهٔ اجرایی

### فاز ۰ — تثبیت تصمیم‌ها (۳ روز کاری)

- ADR برای: پشتهٔ بک‌اند (Fastify + Drizzle + Postgres)، ORM، شکل استقرار موتور، و بستن `D-04` و `D-DB-01`.
- ثبت `D-ARC-01` به‌صورت مکتوب: مونولیت ماژولار با مرز پکیج، استخراج فقط با نیاز اثبات‌شده.
- **پذیرش:** ۵ ADR ثبت‌شده؛ هیچ کدی نوشته نشده.

### فاز ۱ — قرارداد اول (۵ روز)

- `contracts/api/openapi.yaml` برای چهار دامنهٔ موجود در کلاینت: users، organizations، members، invitations.
- تولید JSON Schema از `domain-types` با `scripts/contracts/generate.mjs` (بدون وابستگی جدید؛ خودنویس در صورت نیاز).
- سرور Mock قرارداد (MSW یا Prism، هر دو MIT) تا فرانت‌اند بدون بک‌اند تست شود.
- **پذیرش:** `npm run contracts:check` در CI؛ `api-client` از OpenAPI تولید و تست‌های موجود سبز.

### فاز ۲ — اسکلت مونولیت و هویت (۱۰ روز)

- `services/api-gateway` + `identity` + `organization` + `user-management`.
- Migration اول: `organizations`, `users`, `memberships`, `sessions`, `audit_log` با ستون اجباری `organization_id`.
- اتصال به Keycloak به‌عنوان آداپتور؛ توکن در کوکی HttpOnly.
- Seed از A-08.
- **پذیرش:** تست نشت چندمستأجری (کاربر org A رکورد org B را نمی‌بیند)، تست audit برای هر نوشتن، `openapi` بدون شکست contract test.

### فاز ۳ — تجارت، انبار و مالی (۱۰ روز)

- `marketplace` + `inventory` (دفتر append-only) + `finance` (سند دوطرفه، بدون کیف پول).
- `tourism` با تقویم دسترس‌پذیری و رزرو.
- Seed از A-06 و A-07.
- **پذیرش:** سفارش → سند → تسویه در یک تست یکپارچه؛ ماندهٔ هر حساب با جمع سطرها برابر؛ هیچ مسیر پرداخت واقعی فعال نیست.

### فاز ۴ — موتور علمی (۱۰ روز)

- سرویس FastAPI با `/v1/models/water-balance` و پاکت provenance (واحد، نسخه، منبع، عدم‌قطعیت، وضعیت اعتبارسنجی).
- انتقال الگوریتم A-03 و تست‌هایش؛ سپس MODFLOW/FloPy فقط برای یک حوضهٔ نمونه.
- **پذیرش:** همان ورودی/خروجی قرارداد فعلی؛ اختلاف عددی با پیاده‌سازی TS زیر آستانهٔ اعلام‌شده؛ گزارش اعتبارسنجی «انجام‌نشده» صادقانه باقی بماند.

### فاز ۵ — MRV، پروژه، گزارش و فایل (۸ روز)

- `reporting` روی read model؛ ذخیرهٔ رستر در SeaweedFS + STAC (pgstac/titiler).
- workflow برای تأیید گزارش MRV.
- **پذیرش:** زنجیرهٔ شاهد (پروژه → اندازه‌گیری → گزارش → تأیید) قابل ردیابی؛ خروجی قابل دانلود با منشأ.

### فاز ۶ — سخت‌سازی (۵ روز)

- OTel + Prometheus + SLO؛ پشتیبان‌گیری و تست بازیابی؛ تست امنیت (IDOR، تزریق، نشت مستأجر)؛ تست بار روی مسیرهای داغ.
- **پذیرش:** بازیابی از پشتیبان در محیط تمیز؛ هیچ یافتهٔ High در تست امنیت؛ p95 مسیرهای خواندن زیر بودجهٔ اعلام‌شده.

**جمع تخمینی:** ۵۱ روز کاری معادل یک تیم دو نفره ≈ ۶ هفته تقویمی.

---

## ۶. ریسک‌ها و مهارها

| ریسک | اثر | مهار |
|---|---|---|
| ورود ناخواستهٔ کد GPL/AGPL (مخصوصاً Grafana و ERPNext) | آلودگی مجوز کل محصول | فهرست B-2 به‌عنوان «کپی ممنوع» در CI با اسکن مجوز؛ فقط آداپتور و سرویس جدا |
| قرارداد کهنه ماندن (A-02) | ناسازگاری فرانت و بک | اجرای تولید قرارداد در CI و شکست build در صورت diff |
| تصمیم دیرهنگام Identity (D-04) | دوباره‌نویسی نشست و مجوز | آداپتور از روز اول؛ سرویس به هیچ فراخوانی مستقیم Keycloak وابسته نباشد |
| مدل علمی بدون دادهٔ معتبر | ادعای علمی نادرست | پاکت provenance اجباری و وضعیت `NOT_VALIDATED` تا بازبینی |
| دو موتور گردش‌کار | پیچیدگی عملیاتی | فقط یکی (Temporal یا Kestra) پس از D-07 |
| دادهٔ نمایشی در محصول | تصمیم غلط بر پایهٔ دادهٔ جعلی | تفکیک `data/fixtures` از `databases/seeds` و برچسب `demo` در DB |

---

## ۷. دستور کار پیشنهادی برای شروع

```powershell
# فاز ۱ (قرارداد) — بدون نصب چیزی
node scripts/contracts/generate.mjs      # تولید JSON Schema از domain-types
npx @redocly/cli lint contracts/api/openapi.yaml

# فاز ۲ (اسکلت)
docker compose -f infrastructure/deployment/compose.dev.yml up -d postgres keycloak
npm run db:migrate --workspace @eco-nojin/api
npm run db:seed    --workspace @eco-nojin/api
npm run test:contract
```

**تعریف «شروع»:** فاز ۰ تمام نشده، هیچ خط کدی از فاز ۲ نوشته نمی‌شود. تجربهٔ این پروژه نشان داد که جلو افتادن کد از تصمیم، گران‌ترین بدهی را می‌سازد؛ بک‌اند جایی است که این اشتباه قابل جبران نیست.
