# نگاشت نقشه راه اکو نوژین به وضعیت واقعی مخزن

**Status:** ACTIVE — نسخه اول پس از ثبت سند مادر (ADR-0011)
**تاریخ:** 2026-11-28
**مرجع:** `ECO-NOJIN-MASTER-BLUEPRINT-v1.0.md` (بخش‌های ۲۴، ۲۹، ۳۰) و وضعیت مخزن در شاخه main (a310306)

این سند، ۱۴ مرحله نقشه راه کلان سند مادر، اولویت‌های راهبردی ۱–۱۰ و شش Vertical Slice را
به اجزای واقعی موجود در مخزن نگاشت می‌کند. وضعیت‌ها: `DONE` / `PARTIAL` / `DESIGNED` /
`NOT STARTED` — با شاهد. این جدول ادعای عملکرد نیست؛ فهرست واقعیت‌هاست.

## ۱. نقشه راه ۱۴ مرحله‌ای

| مرحله | وضعیت | شاهد و یادداشت |
|---|---|---|
| ۰ — بنیان و شناخت | DONE | فلسفه/معماری/اصول در سند مادر و `architecture/`، `AGENTS.md`، ADR-0001..0010، ساختار مخزن، Design System (`brand/`، `packages/ui`، گیت توکن‌ها) |
| ۱ — Frontend Foundation | DONE | Unified platform SPA (ADR-0010): هسته عمومی `/` + workspace `/platform` + بخش‌های lazy (tourism، market، landscape/admin، landscape/field، science)، RTL واقعی، ۱۵ زبان با محتوای کامل (fa/en/ar + ۱۲ زبان دیگر)، گیت a11y و بودجه bundle (۹۰۰KB/۷۰۰KB) |
| ۲ — Scientific Foundation | DONE (سطح موتور) | `engines/hydroma` (Python): FAO-56 ET0، Soil Water، Water Balance، Crop Water(+Chain)، Irrigation، STAC، units، provenance، verification، maturity/checkPromotion؛ پاریتی TypeScript در `packages/scientific`؛ Scientific Run persistence از طریق `/v1/runs`. اعتبارسنجی علمی انجام نشده (`NOT_VALIDATED`) |
| ۳ — Backend & Operational Foundation | PARTIAL | `services/api`: auth واقعی (scrypt + session cookie + توکن دعوت یک‌بارمصرف)، سازمان‌ها، RBAC ۵ نقشه، Audit Log، چندمستأجری سازمان‌محور، `/v1/resources`، `/v1/runs`، `/v1/hic/status`؛ node:sqlite بدون فریم‌ورک Migration؛ بازآرایی Modular Monolith (`server.mjs` تک‌فایلی) انجام نشده |
| ۴ — Vertical Integration | PARTIAL | یکپارچگی واقعی session پلتفرم↔API (پروفایل/امنیت/مدیریت)، همگام‌سازی واقعی میدانی به `/v1/resources/surveys`، `GET /v1/runs` در بخش science؛ اما EngineGateway به‌عنوان مرز سرویس API↔HyDroMA هنوز پیاده‌سازی نشده (موتور از طریق پاریتی TS و دستی اجرا می‌شود) |
| ۵ — Data & Environmental Integration (EDI) | DESIGNED | قراردادهای علمی و مناطق داده در `data/` و `contracts/`؛ ماژول STAC در موتور؛ هیچ منبع خارجی واقعی (هواشناسی/ماهواره) یکپارچه نشده |
| ۶ — Agricultural Operations | PARTIAL | جمع‌آوری میدانی با همگام‌سازی واقعی؛ مازاد عملیات (Crop Cycle، Inventory، منابع) در `archive/legacy-*` و نیازمند مهاجرت طراحی‌شده به پلتفرم یکپارچه |
| ۷ — Territories & Communities | DESIGNED (بخشاً) | بخش landscape برای مدیریت سرزمین؛ Village/Community Registry پیاده‌سازی نشده |
| ۸ — Marketplace | PARTIAL (نمایشی) | بخش `market` در پلتفرم با داده نمایشی؛ سفارش/انبار/FEFO واقعی ندارند؛ پرداخت ممنوع در این مرحله |
| ۹ — Tourism | PARTIAL (نمایشی) | بخش `tourism` در پلتفرم با محتوای عمومی ۱۵ زبانه؛ رزرو و مدیریت ظرفیت واقعی ندارد |
| ۱۰ — MRV | DESIGNED | مرزهای MRV ثبت شده؛ Baseline/Indicator/Evidence/Verification پیاده‌سازی نشده؛ Carbon صرفاً مفهوم |
| ۱۱ — AI & Automation | DESIGNED | `engines/ai-workforce`: ۶ نقش حکمرانی‌شده فقط مستندات؛ هیچ runtime یا اتصال ابزار |
| ۱۲ — Internationalization | DONE (پیش از برنامه) | ۱۵ زبان با محتوای کامل منتشر شده (هدف سند مادر: تدریجی تا ۱۵ زبان)؛ پاریتی ترجمه‌ها و حفظ اصطلاحات علمی مستمر است |
| ۱۳ — Scaling | NOT STARTED | بسته به بار واقعی؛ هیچ آزمون ظرفیت انجام نشده |
| ۱۴ — Ecosystem Network | NOT STARTED | چشم‌انداز بلندمدت |

## ۲. اولویت‌های راهبردی سند مادر → اقدام مشخص در مخزن

| اولویت | اقدام مشخص بعدی در مخزن |
|---|---|
| ۱ — تثبیت معماری | بازآرایی `services/api/src/server.mjs` به ماژول‌های Domain بدون تغییر رفتار (رفactor با گیت‌های موجود)، تثبیت قراردادها در `contracts/`، مستند EngineGateway |
| ۲ — Vertical Slice واقعی | اجرای Slice شماره ۱ (کشاورزی علمی) با داده آزمون مشخص از `data/` تا گزارش — شامل اجرای واقعی مدل موتور و ثبت Run با provenance کامل |
| ۳ — EDI | یک Adapter واقعی برای یک منبع هواشناسی آزاد با قرارداد Canonical و ثبت provenance؛ بدون وابستگی به سرویس تجاری |
| ۴ — عملیات کشاورزی | مهاجرت قابلیت‌های مزرعه/کشت/خاک از `archive/legacy-field-collection` به بخش‌های پلتفرم طبق ADR-0010 |
| ۵ — Projects & Territories | طراحی و پیاده‌سازی Territory Registry حداقلی (شناسه، جغرافیا، سازمان، پروژه) با آزمون چندمستأجری |
| ۶ — MRV | تعریف اولین شاخص قابل اندازه‌گیری برای یک پروژه واقعی مالک (کشت و صنعت دشت امید نارون) + Evidence Registry حداقلی |
| ۷ — Marketplace | پس از تثبیت ۱–۶؛ فعلاً فقط بهبودهای نمایشی و i18n |
| ۸ — Tourism | پس از تثبیت ظرفیت واقعی سرزمین؛ فعلاً ثابت |
| ۹ — AI | هیچ اقدامی بدون تصمیم مالک؛ آماده‌سازی فقط مستنداتی |
| ۱۰ — مقیاس‌پذیری | پس از استقرار و بار واقعی |

## ۳. شش Vertical Slice سند مادر → اجزای موجود و حلقه‌های گمشده

| Slice | اجزای موجود در مخزن | حلقه‌های گمشده (کار آینده) |
|---|---|---|
| ۱. Scientific Agriculture | Organization/Territory (API)، Observation (field sync)، HyDroMA (موتور)، `/v1/runs`، بخش science | اتصال خودکار Observation→Run، اجرای موتور از طریق EngineGateway، Report سرتاسری با provenance |
| ۲. Agricultural Operations | بخش field، قرارداد surveys | Crop Cycle، Tasks، منابع در پلتفرم یکپارچه |
| ۳. Restoration Project | مفهوم Project در سند مادر | مدل داده Project، Baseline، Indicators |
| ۴. Local Economy | بخش market | Producer/Product/Inventory/Order واقعی (پس از مجوز مالی) |
| ۵. Sustainable Tourism | بخش tourism | Destination/Booking واقعی و مدیریت ظرفیت |
| ۶. MRV | Audit Log (سیستمی) | Baseline، Indicator، Monitoring Plan، Evidence، Verification مستقل |

## ۴. برنامه اجرایی ثبت‌شده (Execution Tracks)

مسیرهای اجرایی ماده‌ای که از این نگاشت نتیجه می‌شوند، به‌صورت Issue در همین مخزن ثبت شده‌اند
و هر Issue به هدف‌های G01–G16 و اولویت‌های بالا ارجاع می‌دهد. فهرست Issueها از تگ‌های
`blueprint-track` قابل پیگیری است. هر تغییر وضعیت در جداول بالا باید با شاهد قابل تکرار و
با مجوز مالک انجام شود.
