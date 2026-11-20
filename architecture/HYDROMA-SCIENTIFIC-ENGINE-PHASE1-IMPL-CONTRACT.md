# قرارداد پیاده‌سازی فاز ۱ — موتور علمی HyDroMA

- **Document ID:** HYDROMA-SCIENTIFIC-ENGINE-PHASE1-IMPL-CONTRACT
- **Version:** 0.1 (PROPOSED — Phase 1)
- **Date:** 2026-11-20
- **Status:** قرارداد پیاده‌سازی؛ **تصمیم‌های باز** در `ARCHITECTURE-DECISIONS-OPEN.md` ثبت شده‌اند و این سند جایگزین آن‌ها نیست.
- **Companion:** `HYDROMA-SCIENTIFIC-ENGINE-ARCHITECTURE.md` · `ECO-NOJIN-DATA-DOMAIN-MODEL.md` · `ECO-NOJIN-MASTER-ARCHITECTURE-V2.md`

> این سند معماری جدیدی ایجاد نمی‌کند. طراحی معماری موجود را به قراردادهای TypeScript قابل‌اجرا و
> مرزهای فاز ۲ متصل می‌کند. هیچ مدل علمی جدیدی در فاز ۱ پیاده‌سازی نشده است.

---

## ۰. هدف و محدوده

هدف فاز ۱: تثبیت **مرز موتور علمی**، **قرارداد مدل**، **رجیستری نسخه‌دار**، **قرارداد داده/مکان**،
**قرارداد شبیه‌سازی/Worker**، **معماری API/DB/Visualization/کیفیت** و **ارزیابی وابستگی/مجوز**.

خارج از محدوده فاز ۱:

- اجرای مدل علمی جدید (AquaCrop، SWAT+، MODFLOW، xclim، …)
- Python runtime، FastAPI، SQLite، Worker، Migration
- CesiumJS، Three.js، 3D
- اتصال Backend، Authentication، Deployment
- تغییر Design System یا صفحات Frontend

---

## ۱. ممیزی معماری موجود

| مؤلفه | وضعیت واقعی | شواهد | بلوغ نسبی |
|---|---|---|---|
| `packages/scientific` | Water Balance خالص + تست واحد | `src/water-balance.ts`، `tests/water-balance.test.ts` | `tested` (نرم‌افزاری)؛ `NOT_VALIDATED` علمی |
| قرارداد مدل جدید | پیاده‌سازی‌شده در فاز ۱ | `src/model.ts`، `src/maturity.ts` | `implemented` |
| رجیستری مدل | پیاده‌سازی‌شده در فاز ۱ | `src/registry.ts` | `implemented` |
| `packages/spatial` | MapLibre + deck.gl + Layer Registry + Engine Capabilities | `src/map.ts`، `layer.ts`، `engine.ts` | `implemented` (۲D)؛ بدون 3D |
| `packages/domain-types` | Identity/Commerce/Tourism/Registry/Money | `src/*` | `implemented` |
| `packages/api-client` | HTTP Client + Error Envelope + Pagination | `src/client.ts`، `errors.ts` | `implemented`؛ بدون Backend |
| `packages/validation` | Zod Schemas | `src/*` | `implemented` |
| `packages/utilities` | Date/Jalali/Text/Motion | `src/*` | `implemented` |
| Frontend | ۸ اپ، ۷۳ صفحه Platform، نقشه‌های ۲D | `apps/*` | Demo/Static؛ بدون Backend |
| مستندات معماری | سند طراحی HyDroMA + Data Domain Model | `architecture/HYDROMA-SCIENTIFIC-ENGINE-ARCHITECTURE.md` | DESIGN — NOT APPROVED |

**نتیجه:** زیرساخت Frontend و قراردادهای پایه وجود دارند؛ آنچه در فاز ۱ اضافه شد، **مرز قراردادی** است
که مانع اتصال UI به محاسبات علمی می‌شود. هیچ‌یک از موجودی‌های فعلی به‌عنوان `validated` یا `production_approved` معرفی نشد.

---

## ۲. مرز موتور علمی

موتور علمی **نباید** به موارد زیر وابسته باشد:

- React / DOM / `window`
- MapLibre / deck.gl / Cesium / Three.js
- Router / Session / Theme / i18n
- API Client / Fetch / Backend

قرارداد `packages/scientific` خالص است: no DOM, no network, no storage. مدل می‌تواند:

- `executionMode: "local"` + `execute` (برای مدل‌های TS/JS یا WASM)
- `executionMode: "remote"` بدون `execute` (برای مدل‌های Python که در فاز ۲ اجرا می‌شوند)

UI فقط `definition`، `validate` و `execute` را می‌بیند؛ نه internals.

---

## ۳. قرارداد مدل

### ۳.۱ فیلدهای `ModelDefinition`

| فیلد | الزام | توضیح |
|---|---|---|
| `id` | بله | شناسه پایدار مدل (مثلاً `eco-nojin.hydroma.water-balance`) |
| `version` | بله | Semver؛ تغییر breaking = نسخه جدید |
| `domain` | بله | یکی از `MODEL_DOMAINS` |
| `title` | بله | عنوان نمایشی |
| `executionMode` | بله | `local` یا `remote` |
| `maturity` | بله | چرخه عمر شواهدمحور |
| `inputs` / `outputs` / `parameters` | بله | نام، نوع، واحد، required، validRange |
| `units` | بله | فهرست واحدهای علمی (UCUM-style) |
| `assumptions` / `limitations` | بله | شفاف‌سازی دامنه اعتبار |
| `references` | بله | استناد علمی |
| `validation` | بله | بلوغ + شواهد |
| `provenance` | بله | فیلدهای اجباری provenance |

### ۳.۲ اجرا

```ts
type ScientificModel<TInput, TOutput> = {
  definition: ModelDefinition;
  validate?: (input: unknown) => ModelValidationResult<TInput>;
  execute?: (input: TInput, context: ModelRunContext) => ModelResult<TOutput>;
};
```

- `validate` اختیاری است تا مدل remote بدون runtime مرورگر هم ثبت شود.
- `execute` فقط برای مدل local است.
- `ModelResult` همیشه `modelId`, `modelVersion`, `provenance` و `validation` را برمی‌گرداند؛ خروجی عددی تنها نتیجه نیست.

### ۳.۳ Adapter موجود: Water Balance

`waterBalanceModel` یک **Adapter** روی همان `computeWaterBalance` موجود است، نه مدل جدید:

- `maturity: "tested"` با شواهد `implementation` و `unit_test`.
- `NOT_VALIDATED` علمی در `limitations` حفظ شده است.
- ورودی quantity می‌پذیرد و در مرز به mm/day/ha نرمال می‌شود؛ mismatch واحد = خطای سخت.
- محاسبات تغییر نکرده‌اند؛ همان تابع خالص و همان تست‌ها منبع حقیقت هستند.

---

## ۴. چرخه عمر و شواهد

```text
stub → implemented → tested → verified → validated → production_approved
```

| سطح | شواهد لازم | توضیح |
|---|---|---|
| `implemented` | `implementation: pass` | وجود پیاده‌سازی |
| `tested` | `unit_test: pass` | تست نرم‌افزاری |
| `verified` | `reference: pass` | مقایسه با مرجع/محاسبه مستقل |
| `validated` | `observational: pass` + `independent_review: pass` | داده مشاهده‌ای + بازبینی مستقل |
| `production_approved` | `owner_approval: pass` + `validated` | تأیید مالک برای کاربرد تعریف‌شده |

قواعد `checkPromotion`:

- پرش سطح ممنوع است.
- هر ارتقا یک سطح.
- `production_approved` فقط از `validated`.
- تست واحد هرگز به‌تنهایی `verified` یا `validated` را نمی‌دهد.

---

## ۵. رجیستری مدل

- کلید: `id@version`؛ **تغییرناپذیر**.
- ثبت نسخه تکراری = خطا.
- `list()` با فیلتر `domain`/`maturity`/`executionMode`.
- `versionsOf(id)` نسخه‌ها را مرتب می‌کند.
- رجیستری سراسری در فاز ۱ ایجاد نشد؛ مالک رجیستری، موتور فاز ۲ است.

---

## ۶. داده و مکان

### ۶.۱ داده

`DataArtifact` یک **مرجع** است، نه blob:

- `id`, `kind` (`raw|processed|model_ready|observation|simulation_result|reference`), `uri`, `mediaType`, `checksum`, `unit`, `spatial`, `temporal`, `license`, `quality`.

رستر/گرید بزرگ در فایل/آبجکت استور؛ متادیتا و checksum در DB.

### ۶.۲ مکان

`SpatialMetadata` شامل `crs`، `domain`، `extent`، `resolution`:

- `raster`, `vector`, `grid`, `h3`, `point`, `polygon`.
- H3 **الزامی نیست**؛ فقط زمانی که مدل/داده واقعاً H3 است.
- `packages/scientific` به `packages/spatial` وابسته نیست تا import MapLibre/DOM نداشته باشد.

---

## ۷. شبیه‌سازی و Worker

قراردادها:

- `SimulationRequest`: `modelId`, `modelVersion`, `inputs`, `parameters`, `spatial`, `temporal`, `requestedBy`.
- `JobRecord`: `pending|running|completed|failed|cancelled`, `attempts`, timestamps, `resultRef`, `provenanceRef`.
- `WorkerPort`: `claim()`, `run(job)`, `heartbeat?()`.
- `canTransition` فقط گذارهای مجاز را می‌پذیرد.

معماری فاز ۲ (بدون Docker):

- Worker یک **process محلی مستقل** از API است.
- وضعیت Job در SQLite persisted است.
- Retry محدود (پیشنهاد: ۳)؛ Cancellation فقط اگر واقعاً پیاده و تست شود.
- Redis/Celery/RabbitMQ/Kubernetes **ممنوع** تا اثبات نیاز و تأیید مالک.

---

## ۸. API (پیشنهادی — فاز ۲)

| Endpoint | خروجی |
|---|---|
| `GET /v1/health` | وضعیت |
| `GET /v1/models` | رجیستری |
| `POST /v1/runs` | ایجاد Job |
| `GET /v1/runs/{id}` | وضعیت |
| `GET /v1/runs/{id}/result` | نتیجه + provenance |
| `GET /v1/runs/{id}/provenance` | زنجیره |
| `GET /v1/datasets` | کاتالوگ داده |

- Versioning: `/v1`.
- Error Envelope با `packages/api-client/src/errors.ts` سازگار.
- API هرگز فیلد internal DB یا PII را افشا نمی‌کند.
- فاز ۱ هیچ API پیاده نکرد.

---

## ۹. DB (پیشنهادی — فاز ۲)

SQLite + SQLAlchemy؛ جداول حداقلی:

`model`, `model_version`, `dataset`, `dataset_version`, `run`, `run_input`, `run_output`, `job`, `job_event`, `provenance`, `validation_record`, `scenario`, `scenario_run`.

- آرایه/رستر بزرگ در SQLite ذخیره نمی‌شود.
- Migration با Alembic یا SQL معادل؛ قابل تکرار.
- چندمستأجری: `tenant_id` در جداول دامنه؛ RLS در SQLite با محدودیت، لایه دسترسی در API.
- فاز ۱ هیچ schema/migration ایجاد نکرد.

---

## ۱۰. Visualization

| ابزار | مسئولیت | فاز |
|---|---|---|
| MapLibre | نقشه ۲D، layer، popup، legend | موجود (۲D) |
| deck.gl | Hex/Grid/Volume، تجمیع داده | موجود (۲D) |
| CesiumJS | Globe/Terrain/3D جغرافیایی | بعد از تأیید معماری |
| Three.js | صحنه ۳D تخصصی (soil profile/plant) | فقط با نیاز مشخص |

- `packages/scientific` هیچ import از کتابخانه نقشه ندارد.
- نتیجه علمی باید `provenance` و `validationStatus` داشته باشد؛ لایه نقشه این‌ها را نقض نمی‌کند.
- 3D در فاز ۱ پیاده نشد.

---

## ۱۱. کیفیت و اعتبارسنجی

- `validateModelDefinition` دروازه زمان ثبت است.
- `validateModelInput` presence/finiteness/unit/range را بررسی می‌کند.
- `checkPromotion` از ارتقای خودکار جلوگیری می‌کند.
- تست مرجع (verification) و داده مشاهده‌ای (validation) در فاز ۳/۵/۸ اضافه می‌شوند.
- فاز ۱ هیچ مدل علمی را `verified` یا `validated` نکرد.

---

## ۱۲. وابستگی و مجوز

### ۱۲.۱ موجود (بدون نصب جدید)

| وابستگی | نقش | مجوز (نیازمند تأیید نهایی) |
|---|---|---|
| React / React DOM | UI | MIT |
| Vite | Build | MIT |
| MapLibre GL JS | نقشه ۲D | BSD-3-Clause |
| deck.gl | لایه مکانی | MIT |
| TanStack Query | State/Query | MIT |
| Zod | Validation | MIT |
| Vitest / Playwright | تست | MIT / Apache-2.0 |

### ۱۲.۲ پیشنهادی فاز ۲ (نصب‌نشده)

| کتابخانه | نقش | مجوز |
|---|---|---|
| NumPy / SciPy | محاسبات | BSD-3-Clause |
| pandas | جدول/سری | BSD-3-Clause |
| xarray / rioxarray | داده چندبعدی/رستر | Apache-2.0 |
| rasterio / GeoPandas / Shapely / PyProj | GIS | BSD-3-Clause / MIT |
| FastAPI / Pydantic | API | MIT |
| SQLAlchemy / Alembic | DB/Migration | MIT |
| SQLite | DB | Public Domain |
| pytest | تست | MIT |

**قاعده:** هیچ‌کدام در فاز ۱ نصب نشدند؛ مجوز و نسخه باید در زمان نصب و در `SBOM` ثبت شوند.

---

## ۱۳. ریسک‌های فاز ۱

| ریسک | احتمال | اثر | کاهش |
|---|---|---|---|
| Drift بین قرارداد TS و runtime Python | متوسط | بالا | قرارداد به‌عنوان مرجع؛ تست مشترک؛ تولید کد در فاز ۲ |
| ارتقای بلوغ بدون شواهد | متوسط | بالا | `checkPromotion` + بازبینی |
| SQLite هم‌زمانی/Concurrent write | متوسط | متوسط | WAL؛ صف‌نویسی؛ تست |
| Worker مستقل و چرخه عمر | متوسط | متوسط | Job persisted؛ timeout؛ retry محدود |
| خطای تبدیل واحد | متوسط | بالا | quantity در مرز؛ mismatch = خطا |
| Chunk Size نقشه (Phase 0) | بالا | متوسط | Lazy load؛ spatial aggregation |
| PWA/Responsive Platform/Home/Brand (Phase 0) | متوسط | پایین | تست بعدی؛ خارج از فاز ۱ |

---

## ۱۴. تصمیمات باز

ثبت‌شده در `ARCHITECTURE-DECISIONS-OPEN.md`:

- `D-HYDROMA-01` — مرز runtime (TS contracts اکنون، Python در فاز ۲)
- `D-HYDROMA-02` — Persistence (SQLite + file/object storage)
- `D-HYDROMA-03` — Worker (process محلی، بدون Broker)
- `D-HYDROMA-04` — شواهد بلوغ (بدون ارتقای خودکار)
- `D-HYDROMA-05` — Spatial (CRS صریح، H3 اختیاری)
- `D-HYDROMA-06` — Visualization (MapLibre/deck.gl اکنون؛ Cesium/Three بعد)

این تصمیمات **باز** هستند و فاز ۲ تا تأیید مالک اجرا نمی‌شود.

---

## ۱۵. پیاده‌سازی فاز ۱ و تست‌ها

فایل‌های جدید:

- `packages/scientific/src/maturity.ts`
- `packages/scientific/src/provenance.ts`
- `packages/scientific/src/model.ts`
- `packages/scientific/src/registry.ts`
- `packages/scientific/src/spatial.ts`
- `packages/scientific/src/data.ts`
- `packages/scientific/src/simulation.ts`
- `packages/scientific/src/water-balance-model.ts`
- `packages/scientific/tests/contracts.test.ts`

تست‌ها:

- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `node scripts/check-boundaries.mjs` — PASS (۲۸۸ فایل / ۲۱ واحد)
- `node scripts/check-tokens.mjs` — PASS (۱۶۱ فایل / ۹ هدف)
- `npx vitest run` — **۳۴۷ تست / ۳۴ فایل — PASS** (۲۲ تست جدید فاز ۱)

---

## ۱۶. غیرهدف‌ها

- هیچ مدل علمی جدید (ET0، SPI، SPEI، SCS-CN، RUSLE، AquaCrop، …) در فاز ۱ پیاده نشد.
- هیچ Python/Docker/DB/API/Worker/CDN/سرویس خارجی ایجاد نشد.
- هیچ صفحه یا کامپوننت Frontend تغییر نکرد.
- هیچ Design System بازطراحی نشد.
- هیچ Commit/Deployment/Remote تغییر نکرد.

**پایان سند — منتظر تصمیم مالک برای فاز ۲.**