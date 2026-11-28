# نگاشت نقشه راه اکو نوژین به وضعیت واقعی مخزن

**Status:** ACTIVE — نسخه دوم، بروزرسانی‌شده پس از موج پیاده‌سازی ۲۰۲۶-۱۱-۲۸ (کامیت 01782c1f روی main)
**تاریخ:** 2026-11-28
**مرجع:** `ECO-NOJIN-MASTER-BLUEPRINT-v1.0.md` (بخش‌های ۲۴، ۲۹، ۳۰) و وضعیت مخزن روی main

این سند، ۱۴ مرحله نقشه راه کلان سند مادر، اولویت‌های راهبردی ۱–۱۰ و شش Vertical Slice را
به اجزای واقعی موجود در مخزن نگاشت می‌کند. وضعیت‌ها: `DONE` / `PARTIAL` / `DESIGNED` /
`NOT STARTED` — با شاهد. این جدول ادعای عملکرد نیست؛ فهرست واقعیت‌هاست.

## ۰. بروزرسانی مهم ۲۰۲۶-۱۱-۲۸

موج پیاده‌سازی ۲۰۲۶-۱۱-۲۸ (کامیت 01782c1f روی main توسط عامل توسعه) بخش عمده‌ای از
مراحل ۲ تا ۷ را جلو برد: ماژول‌های بخش‌های کشاورزی/جوامع/سرزمین/پروژه‌ها/پاداش در پلتفرم،
EngineGateway و اجرای واقعی موتور در services/api، حدود ۳۰ ماژول علمی جدید + بسته `connect`
(ADR-0011) در موتور HyDroMA، سرویس مستقل `services/edi` با قرارداد Canonical v1،
زیرساخت معیار علمی `lab/` با بازبینی مستقل، سه قرارداد پورت در `contracts/`، مجموعه کامل
اسناد معماری در `docs/architecture/` و حدود ۵۰ گزارش فاز در `docs/reports/`. جداول زیر
بر اساس این وضعیت بروزرسانی شده‌اند.

## ۱. نقشه راه ۱۴ مرحله‌ای

| مرحله | وضعیت | شاهد و یادداشت |
|---|---|---|
| ۰ — بنیان و شناخت | DONE | فلسفه/معماری/اصول در سند مادر و `docs/architecture/`، `AGENTS.md`، ADR-0001..0012، ساختار مخزن، Design System (`brand/`، `packages/ui`، گیت توکن‌ها) |
| ۱ — Frontend Foundation | DONE | Unified platform SPA (ADR-0010): هسته عمومی `/` + workspace `/platform` + بخش‌های lazy، RTL واقعی، ۱۵ زبان با محتوای کامل، گیت a11y و بودجه bundle؛ PWA پایه (manifest، sw) |
| ۲ — Scientific Foundation | DONE (سطح موتور) | `engines/hydroma` (Python، هسته بدون وابستگی): ET0 با دو روش (FAO-56، Hargreaves)، آب خاک، تراز آب، آب محصول(+زنجیره)، آبیاری، GDD، رشد محصول، خشکسالی×۳، آب زیرزمینی، هیدرولوژی سطحی، حوزه آبخیز، فیزیک خاک، کربن، شاخص‌های SDG و …؛ Model Registry و بلوغ؛ Dataset Assembly و Execution Manifest؛ TS parity در `packages/scientific`. اعتبارسنجی علمی انجام نشده (`NOT_VALIDATED`) |
| ۳ — Backend & Operational Foundation | PARTIAL | `services/api`: auth (scrypt + session + توکن دعوت)، RBAC ۵ نقشه، Audit Log، چندمستأجری با آزمون اختصاصی `tenant-isolation`، rate-limit، resources، runs، hic-status؛ `node:sqlite` با `db.mjs` گسترش‌یافته؛ ماژول‌های جدید `engine-gateway`، `engine-execution`، `science`، `stac`، `transparency`. سرور همچنان یک فایل `server.mjs` بزرگ است — بازآرایی Modular Monolith معلق است |
| ۴ — Vertical Integration | PARTIAL (پیشرفت بزرگ) | بخش‌های پلتفرم به API واقعی وصل‌اند (آزمون‌های `integration/live-api`، `relationship*`، e2e هر بخش)؛ EngineGateway واقعی با اجرای موتور (آزمون `engine-real`)؛ provenance و manifest قطعی در اجرا؛ `CapabilityBoundary` و `capabilities.ts` مرز قابلیت‌ها را در UI اعمال می‌کنند |
| ۵ — Data & Environmental Integration (EDI) | PARTIAL (پیشرفت بزرگ) | سرویس مستقل `services/edi` (قرارداد Canonical v1 با schema JSON، provenance، کیفیت، storage: sqlite/parquet/atomic/manifest/recovery، سیاست امنیتی، آزمون‌ها)؛ بسته `connect` موتور با سه connector مرجع (CHIRPS، ERA5، Sentinel-2)، cache با SHA-256، acquisition با محافظت SSRF، STAC discovery؛ اجرای زنده منابع واقعی opt-in است |
| ۶ — Agricultural Operations | PARTIAL (پیشرفت بزرگ) | مزرعه، چرخه کشت، وظایف با زمان‌بندی/اجرا، آبیاری، مشاهده میدانی، هوش عملیاتی، آمادگی — در پلتفرم و API با آزمون‌های e2e/واحد/یکپارچگی؛ بانک اطلاعاتی خاک با نسخه‌بندی (`soil-versioning`) |
| ۷ — Territories & Communities | PARTIAL (پیشرفت بزرگ) | ماژول‌های `TerritoriesModule`، `VillagesModule`، `CommunityWorkspace`، `ProjectsModule` + روابط village↔project، farm↔project با آزمون‌های رابطه؛ Registry کامل و پویا باقی مانده |
| ۸ — Marketplace | PARTIAL (نمایشی) | صفحه `MarketplacePage` در بخش‌های API-محور؛ سفارش/انبار/FEFO واقعی ندارند؛ پرداخت ممنوع در این مرحله |
| ۹ — Tourism | PARTIAL (نمایشی) | بخش `tourism` با محتوای عمومی ۱۵ زبانه؛ رزرو و مدیریت ظرفیت واقعی ندارد |
| ۱۰ — MRV | DESIGNED (لایه شفافیت پیاده شده) | شفافیت رمزنگارانه و یکپارچگی اجرا (`transparency.mjs`، `execution_manifest`) پیاده شده؛ Baseline/Indicator/Evidence/Verification مستقل پیاده‌سازی نشده؛ Carbon فقط مفهوم |
| ۱۱ — AI & Automation | DESIGNED | `engines/ai-workforce`: ۶ نقش حکمرانی‌شده فقط مستندات؛ `IntelligenceModule` قاعده‌محور است نه عامل AI؛ هیچ runtime یا اتصال ابزار |
| ۱۲ — Internationalization | DONE (پیش از برنامه) | ۱۵ زبان با محتوای کامل منتشر شده؛ کاتالوگ‌ها در موج جدید بروزرسانی شدند؛ پاریتی مستمر است |
| ۱۳ — Scaling | NOT STARTED | بسته به بار واقعی؛ rate-limit پایه پیاده شده اما هیچ آزمون ظرفیت انجام نشده |
| ۱۴ — Ecosystem Network | NOT STARTED | چشم‌انداز بلندمدت |

## ۲. اولویت‌های راهبردی سند مادر → اقدام مشخص در مخزن

| اولویت | اقدام مشخص بعدی در مخزن |
|---|---|
| ۱ — تثبیت معماری | بازآرایی `services/api/src/server.mjs` (پس از موج جدید بسیار بزرگ‌تر شده) به ماژول‌های Domain بدون تغییر رفتار (refactor با گیت‌های موجود)؛ افزودن گیت‌های `check:arch`/`test:arch` به steps فایل verify.yml؛ تثبیت قراردادها در `contracts/` |
| ۲ — Vertical Slice واقعی | تکمیل شواهد سرتاسری Slice ۱: مسیر Organization→Territory→Farm→Observation→Dataset→Run→Report با provenance کامل و تکرارپذیری مستند — اجزای فنی عمدتاً وجود دارند؛ نیاز به مستندسازی مسیر و اجرای شاهد |
| ۳ — EDI | فعال‌سازی opt-in یک منبع واقعی (CHIRPS یا ERA5) از طریق `connect` با ثبت provenance و آزمون یکپارچگی با داده واقعی؛ اتصال خروجی EDI به Dataset Builder |
| ۴ — عملیات کشاورزی | تثبیت و عمق‌دادن ماژول‌های موجود (موج ۲۰۲۶-۱۱-۲۸)؛ حذف داده نمایشی از مسیرهای عملیاتی |
| ۵ — Projects & Territories | تعمیق Territory Registry (هویت دیجیتال کامل سرزمین: جغرافیا، منابع، پایش) بر پایه ماژول موجود |
| ۶ — MRV | تعریف اولین شاخص قابل اندازه‌گیری برای یک پروژه واقعی مالک (کشت و صنعت دشت امید نارون) + Evidence Registry حداقلی بر بستر لایه شفافیت موجود |
| ۷ — Marketplace | پس از تثبیت ۱–۶؛ فعلاً فقط بهبودهای نمایشی و i18n |
| ۸ — Tourism | پس از تثبیت ظرفیت واقعی سرزمین؛ فعلاً ثابت |
| ۹ — AI | هیچ اقدامی بدون تصمیم مالک؛ آماده‌سازی فقط مستنداتی |
| ۱۰ — مقیاس‌پذیری | پس از استقرار و بار واقعی |

## ۳. شش Vertical Slice سند مادر → اجزای موجود و حلقه‌های گمشده

| Slice | اجزای موجود در مخزن | حلقه‌های گمشده (کار آینده) |
|---|---|---|
| ۱. Scientific Agriculture | Organization/Territory/Farm/Observation (پلتفرم+API)، DatasetBuilder، EngineGateway واقعی، `/v1/runs`، بخش science، آزمون‌های یکپارچگی live-api و relationship | مستندسازی مسیر سرتاسری با یک اجرای شاهد تکرارپذیر؛ Report سرتاسری با provenance کامل؛ داده واقعی مالک |
| ۲. Agricultural Operations | بخش field + ماژول‌های Farms/CropCycles/Tasks/Irrigation/FieldObservations با آزمون‌ها | همگام‌سازی کامل با داده واقعی مالک؛ گزارش‌های عملیات |
| ۳. Restoration Project | `ProjectsModule` + روابط farm↔project، village↔project | مدل داده Baseline/Indicators و Monitoring برای احیا |
| ۴. Local Economy | صفحه `MarketplacePage` و بخش market | Producer/Product/Inventory/Order واقعی (پس از مجوز مالی مالک) |
| ۵. Sustainable Tourism | بخش tourism | Destination/Booking واقعی و مدیریت ظرفیت |
| ۶. MRV | لایه شفافیت + Audit Log | Baseline، Indicator، Monitoring Plan، Evidence، Verification مستقل |

## ۴. برنامه اجرایی ثبت‌شده (Execution Tracks)

مسیرهای اجرایی ماده‌ای که از این نگاشت نتیجه می‌شوند، به‌صورت Issue در همین مخزن ثبت شده‌اند
و هر Issue به هدف‌های G01–G16 و اولویت‌های بالا ارجاع می‌دهد. فهرست Issueها با برچسب
`blueprint-track` قابل پیگیری است. هر تغییر وضعیت در جداول بالا باید با شاهد قابل تکرار و
با مجوز مالک انجام شود.
