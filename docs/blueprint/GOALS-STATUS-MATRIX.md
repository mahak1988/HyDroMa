# ماتریس وضعیت اهداف کلان (G01–G16)

**Status:** ACTIVE — نسخه سوم، بروزرسانی‌شده پس از موج توسعه موتورها ۲۰۲۶-۱۱-۲۹ (لایه حکمرانی ai-workforce طبق ADR-0013؛ نسخه دوم پس از موج پیاده‌سازی ۲۰۲۶-۱۱-۲۸ روی کامیت 01782c1f)
**تاریخ:** 2026-11-29
**مرجع:** `ECO-NOJIN-MASTER-BLUEPRINT-v1.0.md` بخش سوم (اهداف) و بخش بیست‌وپنجم (وضعیت واقعی)
**مقیاس وضعیت:** `VISION` / `DESIGNED` / `IMPLEMENTED` / `VERIFIED` (تعریف در README همین پوشه)

> این ماتریس بر اساس مطالعه ساختار مخزن نوشته شده است؛ نسخه اول با شاخه main در کامیت a310306
> هماهنگ بود، نسخه دوم موج پیاده‌سازی ۲۰۲۶-۱۱-۲۸ (کامیت 01782c1f: بخش‌های کشاورزی، جوامع،
> سرزمین، پروژه‌ها و پاداش در پلتفرم؛ EngineGateway و اجرای موتور در services/api؛ ~۳۰ ماژول
> جدید در موتور HyDroMA؛ سرویس EDI؛ زیرساخت آزمون lab/) را لحاظ کرد و این نسخه، موج توسعه
> موتورها ۲۰۲۶-۱۱-۲۹ (پیاده‌سازی و آزمون لایه حکمرانی ai-workforce طبق ADR-0013) را نیز
> اضافه می‌کند. ادعای هر وضعیت باید با ستون «شاهد» قابل بازرسی باشد. هیچ مدل علمی در این
> مخزن اعتبارسنجی علمی‌شده نیست؛ وضعیت علمی همه مدل‌ها `NOT_VALIDATED` است و با وضعیت
> نرم‌افزاری قابلیت‌ها اشتباه گرفته نمی‌شود. هیچ عامل هوشمندی در این مرحله به ابزار یا
> ارائه‌دهنده LLM متصل نیست؛ صفحه اجرای ai-workforce `NOT_ACTIVE` است.

| کد | هدف | وضعیت | شاهد در مخزن | یادداشت |
|---|---|---|---|---|
| G01 | شناخت سرزمین | IMPLEMENTED (بخشی) | بخش `territory` در `apps/platform` (`TerritoriesModule.tsx`)، آزمون‌های `tests/territories.spec.ts`، `packages/spatial/adapters/map-adapter.ts`، قرارداد `contracts/map-adapter.md` و `stac-search-port.md`، `packages/api-client/adapters/stac-search-port.ts` | Territory Registry یکپارچه با هویت دیجیتال کامل سرزمین هنوز وجود ندارد؛ GIS دوبعدی است |
| G02 | مدیریت منابع طبیعی | IMPLEMENTED (بخشی) | ماژول‌های موتور: `soil_water`، `groundwater`، `groundwater_spatial`، `surface_hydrology`، `watershed`، `soil_physics`، `rosetta`، `drought`/`drought_composite`/`drought_wmo`، `remote_sensing` + آزمون‌های هر ماژول در `engines/hydroma/tests/` | همه Implemented/Tested نرم‌افزاری؛ از نظر علمی `NOT_VALIDATED` |
| G03 | احیای اکوسیستم | DESIGNED | مفهوم Restoration Project در سند مادر (Vertical Slice ۳)؛ ماژول‌های `carbon` و `sdg_indicators` موتور مرتبط‌اند اما Workflow احیایی وجود ندارد | نیازمند اولین پروژه واقعی مالک |
| G04 | توسعه کشاورزی | IMPLEMENTED (بخشی) | بخش `agriculture` در پلتفرم: `FarmsModule`، `CropCyclesModule`، `TasksModule`/`TaskSchedule`/`TaskDetail`، `FieldObservationsModule`، `IntelligenceModule`، `ReadinessModule`، `OverviewModule`؛ آزمون‌های API: `agri-tasks`، `soil-versioning`، `soil-context`؛ e2e: `farms`، `farm-detail`، `farm-hub`، `farm-project`، `tasks` | عملیات مزرعه/کشت/خاک اکنون در پلتفرم یکپارچه است؛ پیوند کامل با موتور علمی از مسیر EngineGateway در حال تکمیل |
| G05 | مدیریت هوشمند آب | IMPLEMENTED (بخشی) | دو روش ET0 در موتور (`fao56_et0` + `hargreaves_et0`)، `IrrigationModule` در پلتفرم + آزمون `integration/irrigation.test.ts`، `IrrigationModel`، `Crop Water(+Chain)`، `water_footprint`، `water_productivity`، EngineGateway و `engine-execution` در `services/api` با آزمون‌های `engine-gateway`، `engine-execution`، `engine-real` | اعتبارسنجی علمی برای کاربرد مشخص انجام نشده؛ صدور برنامه آبیاری قطعی ممنوع (اصل سند مادر §۱۱) |
| G06 | تقویت جوامع محلی | IMPLEMENTED (بخشی) | بخش `communities` در پلتفرم (`VillagesModule`، `CommunityWorkspace`)، آزمون‌های `community-activities`، e2e: `communities`، `villages`، `village-project`، آزمون واحد `relationship-village` | Village/Community Registry حداقلی وجود دارد؛ پویایی مشارکت واقعی نیازمند داده و کاربر واقعی |
| G07 | توسعه اقتصاد محلی | IMPLEMENTED (نمایشی) | صفحه `MarketplacePage` در `sections/api-pages`، بخش `market` با تفکیک lazy، بودجه bundle | داده نمایشی؛ سفارش/انبار/FEFO واقعی و پرداخت وجود ندارد و در این مرحله ممنوع است (AGENTS.md) |
| G08 | توسعه گردشگری پایدار | IMPLEMENTED (نمایشی) | بخش `tourism` در پلتفرم با محتوای عمومی ۱۵ زبانه | مدیریت ظرفیت اکولوژیکی و رزرو واقعی پیاده‌سازی نشده |
| G09 | توسعه دانش | IMPLEMENTED (بخشی) | بخش `/science` + `HydromaWorkspace` و `DatasetBuilderModule`، `Model Registry` و بلوغ در موتور، `science.mjs` و `runs` با آزمون‌های `runs`/`runs-hardening`/`runs-integrity`، dataset→run binding (`dataset_assembly`، `dataset-api`)، زیرساخت معیار علمی `lab/` (شامل گزارش بازبینی مستقل) | برنامه اعتبارسنجی علمی آغاز شده (lab/) اما تا اعلام مالک، وضعیت علمی همه مدل‌ها `NOT_VALIDATED` باقی می‌ماند |
| G10 | پایش و ارزیابی | IMPLEMENTED (بخشی) | لایه شفافیت و یکپارچگی: `transparency.mjs` + آزمون `transparency` + گزارش `stage-3-cryptographic-transparency`، `execution_manifest` و `exec_worker` با آزمون امنیتی `exec-worker-security`، Audit Log در services/api | نظام کامل MRV (Baseline، Indicator، Evidence، Verification مستقل) هنوز پیاده‌سازی نشده — DESIGNED |
| G11 | توسعه هوش مصنوعی | IMPLEMENTED (لایه حکمرانی) — اجرای عامل NOT_ACTIVE | بسته `engines/ai-workforce/ai_workforce` (registry نسخه‌دار با نسخه‌های تغییرناپذیر، جدول دسترسی ۶ نقش fail-closed، audit زنجیره‌هاش‌دار SHA-256 با راستی‌آزمایی دستکاری، policy حدود اقدام + ممنوعیت دائمی ابزار مالی، gateway قرارداد redaction/حساب‌بندی توکن/رد کلید ارائه‌دهنده، runtime اتصال همه تصمیم‌ها به زنجیره audit) + ۹۹ آزمون pytest در `engines/ai-workforce/tests/` (شامل `test_boundaries.py`: فقط-کتابخانه-استاندارد و رد الگوهای ابزار مالی)؛ ADR-0013 | صفحه اجرا `NOT_ACTIVE` است: هیچ عامل به ابزار یا LLM متصل نیست و `execute_tool` به‌صورت ساختاریافته رد می‌شود (`AGENT_EXECUTION_NOT_ACTIVE`)؛ اتصال AI به ابزار مالی ممنوع (AGENTS.md)؛ فعال‌سازی صفحه اجرا نیازمند تصمیم مالک و ADR جدید؛ `IntelligenceModule` پلتفرم همچنان هوش عملیاتی قاعده‌محور است |
| G12 | ایجاد اقتصاد مشارکتی | IMPLEMENTED (کنترل‌شده، غیرمالی) | بخش `rewards` در پلتفرم (`RewardsModule`، `ChallengesModule`)، دفتر EcoCoin با آزمون‌های `ecocoin-ledger` (یکپارچگی + کنترل تأیید) و e2e `challenge-workflow`، گزارش‌های `phase-3.64/65/66/67` | همه امتیازها نمایشی و غیرقابل تبدیل به دارایی مالی هستند؛ HIC همچنان `INACTIVE`؛ هر عملیات مالی نیازمند تصمیم و مجوز مستقل مالک |
| G13 | ایجاد شبکه بین‌المللی | VISION | سند مادر §۶۸ | هیچ زیرساخت شبکه چندسرزمینی وجود ندارد |
| G14 | توسعه فناوری باز | VERIFIED (ویژگی بنیادی) | `package.json` (pnpm workspace، Node 22+، TypeScript، React 19، Vite، Tailwind)، Python خالص در `engines/hydroma` با `dependencies = []` و بسته اختیاری `connect` (ADR-0011)، Python خالص در `engines/ai-workforce` با `dependencies = []` (ADR-0013)، استانداردهای FAO-56/Hargreaves/STAC، بدون وابستگی اجباری به سرویس تجاری | ویژگی قابل بازرسی از ساختار مخزن؛ هیچ فناوری انحصاری الزامی وجود ندارد |
| G15 | کاهش هزینه عملیاتی | IMPLEMENTED (بخشی) | SQLite (node:sqlite) بدون سرویس مستقل، تک‌پورت 5180، Modular Monolith، فلسفه Free Tier، connect‌های رایگان (CHIRPS/ERA5/Sentinel-2 در `free_sources`) | PostgreSQL/PostGIS فقط پس از شواهد واقعی (سند مادر §۳۴) |
| G16 | ایجاد ارزش پایدار | VISION | سند مادر (Manifesto، §۶۴–۶۸) | هدف تجمیعی؛ به‌تدریج از طریق G01–G10 محقق می‌شود |

## قابلیت‌های VERIFIED در سطح مهندسی (نه علمی)

| قابلیت | شاهد قابل تکرار |
|---|---|
| گیت‌های CI: typecheck، oxlint، مرزهای معماری، توکن‌های طراحی، سازگاری apps.json، تست‌های واحد، تست‌های API (اکنون کل پوشه شامل امنیت، rate-limit، tenant-isolation، cookie، cors)، build همه اپ‌ها | `.github/workflows/verify.yml` روی هر push به main و هر PR |
| مجموعه رگرسیون Python موتور HyDroMA (شامل آزمون‌های `connect` با transport جعلی آفلاین و مرزهای هسته) | job دوم verify.yml: `pip install -e "engines/hydroma[api,test]"` + `pytest engines/hydroma/tests` |
| مجموعه آزمون لایه حکمرانی ai-workforce (۹۹ آزمون pytest، اجرای محلی ۲۰۲۶-۱۱-۲۹ پیش از push؛ هنوز job اختصاصی CI ندارد — پیگیری در `blueprint-track`) | `pytest engines/ai-workforce/tests` با Python ≥ 3.11 و بدون وابستگی ثالث |
| دسترس‌پذیری (a11y) با axe و پوشش e2e بخش‌های جدید | گیت a11y و مجموعه e2e پلتفرم در CI/محلی |
| گیت‌های معماری و توکن در زنجیره محلی verify (شامل `check:arch` و `test:arch`) | `package.json` → `pnpm run verify`؛ این دو گیت هنوز به steps فایل verify.yml اضافه نشده‌اند |

## قابلیت‌هایی که VERIFIED نیستند و نباید VERIFIED معرفی شوند

- هیچ مدل علمی HyDroMA: همه `NOT_VALIDATED` — برنامه معیار علمی در `lab/` آغاز شده است اما ارتقای نردبان علمی فقط با تصمیم مالک و از مسیر `docs/scientific-governance/` انجام می‌شود.
- هیچ عامل هوشمند عملیاتی: لایه حکمرانی ai-workforce پیاده‌سازی و آزمون شده اما صفحه اجرا `NOT_ACTIVE` است و هیچ عامل به ابزار یا LLM متصل نیست؛ فعال‌سازی نیازمند تصمیم مالک و ADR جدید است.
- عملیات مالی واقعی: پاداش/EcoCoin لایه نمایشی با دفتر کنترل‌شده است؛ پرداخت، کیف پول، توکن قابل معامله و فعال‌سازی HIC وجود ندارد و ممنوع است.
- مقیاس‌پذیری و ۱۰هزار کاربر: هیچ آزمون بار واقعی انجام نشده (فقط آزمون‌های rate-limit واحد).
- ممیزی امنیتی کامل مستقل: آزمون‌های امنیتی و tenant-isolation وجود دارند اما ممیزی کامل انجام نشده است.

## قواعد تغییر وضعیت

- فقط مالک پروژه وضعیت را از IMPLEMENTED به VERIFIED ارتقا می‌دهد، پس از بررسی شاهد قابل تکرار.
- ارتقای علمی مدل‌ها فقط از مسیر `docs/scientific-governance/` و نردبان STUB→…→PRODUCTION_APPROVED انجام می‌شود، نه از این ماتریس.
- هر تغییر وضعیت باید با کامیت مستند و ارجاع به شاهد جدید همراه باشد.
