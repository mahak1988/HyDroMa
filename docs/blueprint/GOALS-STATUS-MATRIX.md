# ماتریس وضعیت اهداف کلان (G01–G16)

**Status:** ACTIVE — نسخه اول پس از ثبت سند مادر (ADR-0011)
**تاریخ:** 2026-11-28
**مرجع:** `ECO-NOJIN-MASTER-BLUEPRINT-v1.0.md` بخش سوم (اهداف) و بخش بیست‌وپنجم (وضعیت واقعی)
**مقیاس وضعیت:** `VISION` / `DESIGNED` / `IMPLEMENTED` / `VERIFIED` (تعریف در README همین پوشه)

> این ماتریس بر اساس مطالعه ساختار فعلی مخزن (شاخه main، کامیت a310306) نوشته شده است.
> ادعای هر وضعیت باید با ستون «شاهد» قابل بازرسی باشد؛ وضعیت VERIFIED فقط برای مواردی که
> شاهد مستقل قابل تکرار دارند استفاده شده است. هیچ مدل علمی در این مخزن اعتبارسنجی علمی
> شده نیست؛ وضعیت علمی همه مدل‌ها `NOT_VALIDATED` است و با وضعیت نرم‌افزاری قابلیت‌ها اشتباه
> گرفته نمی‌شود.

| کد | هدف | وضعیت | شاهد در مخزن | یادداشت |
|---|---|---|---|---|
| G01 | شناخت سرزمین | IMPLEMENTED (بخشی) | `packages/spatial`، ماژول `stac.py` در `engines/hydroma`، بخش نقشه در `apps/platform` (MapLibre/deck.gl)، `/v1/resources` در `services/api` | Territory Registry یکپارچه با هویت دیجیتال کامل سرزمین هنوز وجود ندارد؛ GIS دوبعدی است |
| G02 | مدیریت منابع طبیعی | IMPLEMENTED (بخشی) | مدل‌های `soil_water` و Daily Soil Water در `engines/hydroma` + پکیج پاریتی `packages/scientific` | مدل‌ها Implemented/Tested نرم‌افزاری؛ از نظر علمی `NOT_VALIDATED` |
| G03 | احیای اکوسیستم | DESIGNED | ساختار پروژه‌ها در سند مادر؛ مفهوم Restoration Project در Vertical Slice شماره ۳ | هیچ ماژول احیای عملیاتی وجود ندارد؛ نیازمند پروژه واقعی اول |
| G04 | توسعه کشاورزی | IMPLEMENTED (بخشی) | بخش `landscape/field` در `apps/platform` با همگام‌سازی واقعی به `/v1/resources/surveys`، آزمون‌های e2e و a11y مربوطه | عملیات مزرعه/کشت/خاک از اپ legacy آرشیو‌شده به پلتفرم یکپارچه کامل منتقل نشده |
| G05 | مدیریت هوشمند آب | IMPLEMENTED (بخشی) | `fao56_et0.py` (FAO-56 Ch.4)، Water Balance، Crop Water، Irrigation Model در `engines/hydroma`؛ `packages/hydroma-client` | اعتبارسنجی علمی برای کاربرد مشخص انجام نشده؛ صدور برنامه آبیاری قطعی ممنوع (اصل سند مادر §۱۱) |
| G06 | تقویت جوامع محلی | DESIGNED | مرزهای Domain جوامع/روستاها در `services/` و `ROOT-STRUCTURE-MANIFEST.md` | Village/Community Registry پیاده‌سازی نشده؛ مشارکت فعلی محدود به جمع‌آوری میدانی است |
| G07 | توسعه اقتصاد محلی | IMPLEMENTED (نمایشی) | بخش `market` در `apps/platform` (lazy section)، ساختار بازارگاه در سند مادر §۲۲ | داده نمایشی (Demo)؛ وضعیت عملیاتی کامل (سفارش، پرداخت، لجستیک) تأیید نشده و پرداخت در این مرحله ممنوع است (AGENTS.md) |
| G08 | توسعه گردشگری پایدار | IMPLEMENTED (نمایشی) | بخش `tourism` در `apps/platform`، محتوای عمومی ۱۵ زبانه | مدیریت ظرفیت اکولوژیکی و رزرو واقعی پیاده‌سازی نشده |
| G09 | توسعه دانش | IMPLEMENTED (بخشی) | بخش `/science` در پلتفرم، `GET /v1/runs` با persistence سازمان‌محور، Model Registry و بلوغ در `engines/hydroma` | برنامه اعتبارسنجی علمی مدل‌ها در فاز DESIGNED؛ xclim به‌عنوان ADR پیش‌نویس |
| G10 | پایش و ارزیابی | DESIGNED | مرزهای MRV در مخزن؛ Audit Log در `services/api` (پایش عملیات سیستمی) | نظام MRV (Baseline، Indicator، Evidence، Verification) پیاده‌سازی نشده |
| G11 | توسعه هوش مصنوعی | DESIGNED | `engines/ai-workforce` (۶ نقش حکمرانی‌شده، فقط مستندات) | هیچ Agent عملیاتی متصل به ابزار وجود ندارد؛ اتصال AI به ابزار مالی ممنوع (AGENTS.md) |
| G12 | ایجاد اقتصاد مشارکتی | DESIGNED | فندیشن HIC: `GET /v1/hic/status` با وضعیت INACTIVE و آزمون‌های عدم-صادراتی | EcoCoin/HIC مفهوم برنامه‌ریزی‌شده‌اند؛ فعال‌سازی هر نظام مالی نیازمند تصمیم و مجوز مالک |
| G13 | ایجاد شبکه بین‌المللی | VISION | سند مادر §۶۸ | هیچ زیرساخت شبکه چندسرزمینی وجود ندارد |
| G14 | توسعه فناوری باز | VERIFIED (ویژگی بنیادی) | `package.json` (pnpm workspace، Node 22+، TypeScript، React 19، Vite، Tailwind)، Python در `engines/hydroma`، استانداردهای FAO-56/STAC، بدون وابستگی به سرویس تجاری اجباری | ویژگی قابل بازرسی از ساختار مخزن؛ هیچ فناوری انحصاری الزامی وجود ندارد |
| G15 | کاهش هزینه عملیاتی | IMPLEMENTED (بخشی) | SQLite (node:sqlite) بدون سرویس مستقل، تک‌پورت 5180، Modular Monolith، فلسفه Free Tier | PostgreSQL/PostGIS فقط پس از شواهد واقعی (سند مادر §۳۴) |
| G16 | ایجاد ارزش پایدار | VISION | سند مادر (Manifesto، §۶۴–۶۸) | هدف تجمیعی؛ به‌تدریج از طریق G01–G10 محقق می‌شود |

## قابلیت‌های VERIFIED در سطح مهندسی (نه علمی)

| قابلیت | شاهد قابل تکرار |
|---|---|
| گیت‌های کیفیت: typecheck، oxlint، مرزهای معماری، توکن‌های طراحی، سازگاری apps.json، تست‌های واحد، تست‌های API، build همه اپ‌ها، بودجه bundle | `.github/workflows/verify.yml` روی هر push به main و هر PR اجرا می‌شود |
| مجموعه رگرسیون Python موتور HyDroMA | job دوم verify.yml: `pip install -e "engines/hydroma[api,test]"` + `pytest engines/hydroma/tests` |
| دسترس‌پذیری (a11y) با axe | گیت a11y در تست‌های Playwright پلتفرم |

## قابلیت‌هایی که VERIFIED نیستند و نباید VERIFIED معرفی شوند

- هیچ مدل علمی HyDroMA: همه `NOT_VALIDATED` (حتی FAO-56 ET0 که IMPLEMENTED و TESTED نرم‌افزاری است؛ اعتبار برای کاربرد مشخص نیازمند داده میدانی مستقل است).
- هیچ قابلیت مالی: پرداخت، کیف پول، توکن و معامله وجود ندارد و در این مرحله ممنوع است.
- مقیاس‌پذیری و ۱۰هزار کاربر: هیچ آزمون بار واقعی انجام نشده.
- امنیت: ممیزی امنیتی کامل مستقل انجام نشده؛ گیت‌های فعلی تست عملکردی‌اند، نه ممیزی امنیتی.

## قواعد تغییر وضعیت

- فقط مالک پروژه وضعیت را از IMPLEMENTED به VERIFIED ارتقا می‌دهد، پس از بررسی شاهد قابل تکرار.
- ارتقای علمی مدل‌ها فقط از مسیر `docs/scientific-governance/` و نردبان STUB→…→PRODUCTION_APPROVED انجام می‌شود، نه از این ماتریس.
- هر تغییر وضعیت باید با کامیت مستند و ارجاع به شاهد جدید همراه باشد.
