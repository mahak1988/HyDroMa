# 29. Frontend State Management, Data Flow and Caching Architecture Standards

## Eco Nojin Ecosystem
### State Architecture, Data Flow, Server State, Client State, Cache Management and Asynchronous Operations

| مشخصه | مقدار |
|---|---|
| Document ID | EN-VIS-029 |
| Document Name | Frontend State Management, Data Flow and Caching Architecture Standards |
| Version | 1.0.0 |
| Status | DRAFT — PROPOSED — NOT APPROVED |
| Classification | Internal Technical Standard |
| Scope | Eco Nojin, HyDroMA, Nojin Marketplace |
| Document Owner | Eco Nojin |
| Approval Authority | Project Owner |
| Created | 2026-11-17 |

---

# 1. Purpose

این سند استانداردهای معماری مدیریت وضعیت، جریان داده و کش در فرانت‌اند اکوسیستم Eco Nojin را تعریف می‌کند.

هدف، ایجاد معماری قابل پیش‌بینی، قابل آزمون، مقیاس‌پذیر و امن برای مدیریت وضعیت در سه محصول است:

1. **Eco Nojin:** پلتفرم اصلی، تجربه عمومی، پروفایل، محتوای اکوسیستم و Navigation.
2. **HyDroMA:** داشبورد علمی، داده‌های مکانی، نمودارها، شبیه‌سازی‌ها و نتایج محاسباتی.
3. **Nojin Marketplace:** محصولات، جست‌وجو، سبد خرید، سفارش‌ها و تعاملات اقتصادی.

این استاندارد موضوعات زیر را پوشش می‌دهد:

- State Management Architecture.
- Client State.
- Server State.
- URL State.
- Form State.
- Authentication State.
- Application State.
- Domain State.
- Data Flow.
- Asynchronous Operations.
- Cache Architecture.
- Cache Invalidation.
- Optimistic Updates.
- Race Conditions.
- Concurrent Requests.
- Offline and Low-Connectivity Behavior.
- Data Consistency.
- State Persistence.
- Testing and Validation.

## 1.1. اصل بنیادین

هر داده باید منبع حقیقت مشخص داشته باشد.

فرانت‌اند نباید بدون تعریف مالکیت داده، نسخه مستقل و متعارضی از اطلاعات سرور، اطلاعات مالی یا نتایج علمی ایجاد کند.

## 1.2. اهداف معماری

- جلوگیری از Duplicate State.
- کاهش درخواست‌های غیرضروری.
- جلوگیری از نمایش داده منقضی.
- تفکیک وضعیت موقت از داده پایدار.
- مدیریت صحیح درخواست‌های هم‌زمان.
- جلوگیری از Race Condition.
- حفظ سازگاری داده‌ها.
- کنترل مصرف حافظه.
- پشتیبانی از اینترنت ناپایدار.
- امکان آزمون مستقل هر لایه.

---

# 2. State Management Principles

## 2.1. Single Source of Truth

هر نوع داده باید مالک مشخص داشته باشد.

برای مثال:

| Data Type | Source of Truth |
|---|---|
| User Account | Backend |
| Permissions | Backend |
| Product Catalog | Backend |
| Order Status | Backend |
| Wallet Balance | Backend |
| Scientific Results | Validated Backend/Engine Result |
| Temporary Form Input | Frontend Form State |
| Open Modal | Frontend UI State |
| Selected Tab | URL or UI State |
| Search Query | URL or UI State |

منبع حقیقت نباید با محل نمایش داده اشتباه گرفته شود.

## 2.2. State Ownership

هر State باید مالک، دامنه و چرخه عمر مشخص داشته باشد.

از نگهداری یک داده واحد در چند Context، Store یا Component بدون دلیل معماری جلوگیری شود.

## 2.3. Separation of State Types

وضعیت‌های زیر باید از یکدیگر تفکیک شوند:

- Local Component State.
- Shared UI State.
- Server State.
- URL State.
- Form State.
- Authentication State.
- Persistent Preferences.
- Domain-Specific State.
- Temporary Computational State.

## 2.4. Predictable State Transitions

تغییر وضعیت باید قابل ردیابی و آزمون باشد.

تغییرات غیرقابل پیش‌بینی ناشی از Mutation مستقیم داده‌های مشترک ممنوع است.

## 2.5. Minimal Global State

هر داده‌ای نباید وارد Global Store شود.

وضعیت‌هایی که فقط در یک Component استفاده می‌شوند باید تا حد امکان محلی باقی بمانند.

---

# 3. State Classification

## 3.1. Local UI State

نمونه‌ها:

- باز یا بسته بودن Modal.
- وضعیت Accordion.
- انتخاب موقت یک Tab.
- نمایش Tooltip.
- وضعیت یک منوی بازشونده.

این داده‌ها معمولاً به Global Store نیاز ندارند.

## 3.2. Shared UI State

نمونه‌ها:

- وضعیت Sidebar.
- تنظیمات مشترک Dashboard.
- وضعیت انتخاب یک پنل.
- تنظیمات نمایش مشترک چند Component.

این داده‌ها می‌توانند در Context یا Store مدیریت شوند، مشروط به اینکه دامنه استفاده مشخص باشد.

## 3.3. Server State

داده‌هایی که از Backend دریافت می‌شوند:

- پروفایل.
- اطلاعات حساب.
- محصولات.
- سفارش‌ها.
- وضعیت پرداخت.
- داده‌های علمی.
- اطلاعات داشبورد.
- نتایج API.

Server State باید از UI State تفکیک شود.

## 3.4. URL State

موارد مناسب برای URL:

- فیلترهای قابل اشتراک‌گذاری.
- صفحه‌بندی.
- Search Query.
- شناسه منبع یا محدوده نمایشی.
- Tabهای مهم و قابل Bookmark.

اطلاعات محرمانه یا داده‌های شخصی نباید در URL قرار گیرند.

## 3.5. Form State

وضعیت فرم‌ها باید شامل موارد زیر باشد:

- مقدار ورودی.
- خطای اعتبارسنجی.
- وضعیت Dirty.
- وضعیت Touched.
- وضعیت Submit.
- وضعیت ذخیره‌سازی.
- پیام موفقیت یا شکست.

## 3.6. Authentication State

وضعیت احراز هویت باید از وضعیت عمومی UI تفکیک شود.

Frontend State به‌تنهایی مرجع مجوز دسترسی نیست.

مجوزهای نهایی باید در Backend بررسی شوند.

## 3.7. Persistent State

فقط داده‌هایی باید پایدار شوند که حفظ آن‌ها ارزش مشخصی دارد.

نمونه:

- زبان انتخابی.
- ترجیحات نمایشی.
- تنظیمات غیرحساس.
- برخی فیلترهای کاربر.

ذخیره Token، Secret و اطلاعات حساس در Storage عمومی مرورگر نباید براساس این سند مجاز تلقی شود.

---

# 4. State Architecture

## 4.1. Logical Layers

معماری پیشنهادی:

```text
Presentation Layer
       |
Component State
       |
Feature State
       |
Application State
       |
Data Access Layer
       |
Server State / Cache
       |
API Client
       |
Backend Services
```

این ساختار یک مدل مفهومی است؛ پیاده‌سازی نهایی باید با معماری واقعی پروژه سازگار باشد.

## 4.2. Component Layer

مسئولیت:

- نمایش داده.
- دریافت تعامل کاربر.
- نگهداری وضعیت محلی.
- ارسال Action به لایه مناسب.

Component نباید مسئول اجرای مستقیم منطق پیچیده تجاری یا علمی باشد.

## 4.3. Feature Layer

هر Feature می‌تواند State، Hook، Service و Validation مستقل داشته باشد.

نمونه:

```text
features/
  authentication/
  dashboard/
  scientific/
  marketplace/
  finance/
  tourism/
```

## 4.4. Application Layer

مسئول مدیریت وضعیت‌های مشترک سطح برنامه است.

نمونه:

- Locale.
- Theme.
- Navigation Preferences.
- Global Notifications.
- Application Configuration.

## 4.5. Data Access Layer

این لایه مسئول:

- API Communication.
- Response Parsing.
- Error Mapping.
- Request Cancellation.
- Data Normalization.
- Cache Integration.

Componentها نباید در سراسر برنامه درخواست‌های API را با منطق تکراری مدیریت کنند.

---

# 5. Data Flow Architecture

## 5.1. Standard Data Flow

جریان داده پیشنهادی:

1. User Interaction.
2. Component Event.
3. Feature Action.
4. Validation.
5. Data Access Layer.
6. API Request.
7. Backend Processing.
8. API Response.
9. Response Validation.
10. Server State Update.
11. UI Re-render.

## 5.2. Unidirectional Data Flow

در صورت استفاده از معماری مبتنی بر Store، جریان داده یک‌طرفه ترجیح داده می‌شود.

```text
Action
  |
State Transition
  |
New State
  |
UI Update
```

## 5.3. No Hidden Mutation

تغییر وضعیت مشترک نباید از طریق Mutation پنهان و خارج از مسیر تعریف‌شده انجام شود.

## 5.4. Response Validation

داده دریافتی از API باید در مرز Data Access از نظر ساختار و نوع بررسی شود.

TypeScript Types به‌تنهایی تضمین نمی‌کنند که داده دریافتی از Backend در Runtime معتبر باشد.

## 5.5. Data Normalization

برای موجودیت‌هایی که در چند بخش استفاده می‌شوند، Normalization می‌تواند از تکثیر داده جلوگیری کند.

نمونه:

```text
productsById
ordersById
usersById
```

استفاده از Normalization باید براساس پیچیدگی واقعی داده باشد؛ نه به‌عنوان الزام غیرضروری برای همه پاسخ‌های API.

---

# 6. Server State Management

## 6.1. Server State Characteristics

Server State دارای ویژگی‌های زیر است:

- منبع خارجی دارد.
- ممکن است توسط کاربران دیگر تغییر کند.
- ممکن است منقضی شود.
- ممکن است در درخواست‌های مختلف متفاوت باشد.
- نیازمند مدیریت Loading و Error است.
- ممکن است نیازمند Refresh یا Invalidation باشد.

## 6.2. Query Lifecycle

هر Query باید وضعیت مشخص داشته باشد:

- IDLE.
- LOADING.
- SUCCESS.
- ERROR.
- STALE.
- REFETCHING.

این وضعیت‌ها مفهومی هستند و لزوماً نباید به همین نام در Library انتخابی پیاده‌سازی شوند.

## 6.3. Query Keys

شناسه Query باید شامل پارامترهایی باشد که نتیجه درخواست را تغییر می‌دهند.

نمونه:

```text
dashboard-summary:region-001
products:category-12:page-2
soil-data:region-001:2026-11
```

کلید Query نباید شامل Secret یا Token باشد.

## 6.4. Query Deduplication

درخواست‌های تکراری یکسان می‌توانند در صورت سازگاری با سیاست تازگی داده ادغام شوند.

## 6.5. Request Cancellation

در تغییر مسیر یا تغییر پارامترهای Query، درخواست‌های غیرضروری باید در صورت امکان لغو شوند.

## 6.6. Stale Data

داده منقضی باید به‌درستی شناسایی شود.

نمایش داده قدیمی بدون نشان دادن وضعیت تازگی، در بخش‌های حساس قابل قبول نیست.

---

# 7. Cache Architecture

## 7.1. Cache Categories

کش می‌تواند در لایه‌های مختلف وجود داشته باشد:

| Cache Layer | Scope |
|---|---|
| Component Memory | Local UI |
| Application Memory | Runtime |
| Server State Cache | API Data |
| Browser HTTP Cache | HTTP Resources |
| CDN Cache | Static and Public Assets |
| Service Worker Cache | Selected Offline Resources |
| Persistent Local Cache | Explicitly Approved Data |

وجود چند لایه Cache باید با سیاست روشن مدیریت شود.

## 7.2. Cache Ownership

برای هر Cache باید مشخص شود:

- چه داده‌ای ذخیره می‌شود؟
- مالک آن کدام لایه است؟
- چه زمانی معتبر است؟
- چه زمانی منقضی می‌شود؟
- چگونه حذف می‌شود؟
- آیا داده حساس است؟
- آیا Offline Access مجاز است؟

## 7.3. Cache Key Design

Cache Key باید:

- یکتا باشد.
- شامل ابعاد مؤثر بر نتیجه باشد.
- از برخورد نام‌ها جلوگیری کند.
- فاقد Token و Secret باشد.

## 7.4. Cache Invalidation

کش باید پس از تغییر داده مرتبط به‌درستی باطل شود.

نمونه:

| Operation | Cache Invalidation |
|---|---|
| Update Profile | Profile Cache |
| Update Product | Product Detail and Relevant Lists |
| Submit Order | Cart and Relevant Order Data |
| Update Preferences | Preference Cache |
| Change Scientific Inputs | Affected Simulation Result Cache |

## 7.5. Time-Based Expiration

TTL باید براساس ماهیت داده تعیین شود.

TTL یکسان برای همه داده‌ها مناسب نیست.

نمونه دسته‌بندی:

| Data Category | Freshness Requirement |
|---|---|
| Static Assets | Long-lived with versioning |
| Public Content | Controlled |
| Product Catalog | Moderate |
| User Profile | Short or invalidated on update |
| Wallet Balance | Strict |
| Order Status | Strict |
| Scientific Results | Version-dependent |
| Weather Data | Source and timestamp dependent |

این جدول دسته‌بندی مفهومی است و TTL عددی تعیین نمی‌کند.

## 7.6. Cache-Control

سیاست Cache-Control باید با حساسیت داده و معماری Backend سازگار باشد.

اطلاعات خصوصی یا مالی نباید صرفاً به‌دلیل بهبود سرعت، در Cache عمومی ذخیره شوند.

## 7.7. Cache Stampede

در صورت انقضای هم‌زمان تعداد زیادی Cache Entry، از ایجاد بار غیرضروری روی Backend جلوگیری شود.

راهکارهای احتمالی:

- Request Deduplication.
- Controlled Refresh.
- Staggered Expiration.
- Background Revalidation.

انتخاب راهکار به معماری واقعی وابسته است.

---

# 8. Optimistic and Pessimistic Updates

## 8.1. Optimistic Updates

در Optimistic Update، رابط قبل از تأیید نهایی Backend تغییر می‌کند.

موارد مناسب احتمالی:

- تغییر ترجیح نمایشی.
- باز یا بسته کردن آیتم‌های UI.
- برخی عملیات غیرحساس سبد خرید.

## 8.2. Pessimistic Updates

در Pessimistic Update، رابط پس از دریافت تأیید معتبر از Backend تغییر قطعی می‌کند.

این روش برای عملیات حساس ترجیح دارد.

## 8.3. Restricted Operations

برای موارد زیر، نمایش موفقیت قطعی پیش از تأیید Backend ممنوع است:

- پرداخت.
- انتقال وجه.
- تغییر موجودی کیف پول.
- ثبت سفارش نهایی.
- صدور اعتبار.
- عملیات مالی.
- تغییر وضعیت تراکنش.
- انتشار داده علمی معتبر.

## 8.4. Rollback

در صورت شکست Optimistic Update:

- State باید بازیابی شود.
- پیام مناسب نمایش داده شود.
- وضعیت واقعی از Backend دریافت شود.
- داده متناقض باقی نماند.

---

# 9. Asynchronous Operations and Concurrency

## 9.1. Request Lifecycle

هر درخواست باید وضعیت مشخص داشته باشد.

## 9.2. Race Conditions

نمونه مشکل:

1. کاربر جست‌وجوی A را وارد می‌کند.
2. درخواست A ارسال می‌شود.
3. کاربر جست‌وجوی B را وارد می‌کند.
4. درخواست B ارسال می‌شود.
5. پاسخ B زودتر می‌رسد.
6. پاسخ A دیرتر می‌رسد.

در این وضعیت، پاسخ قدیمی نباید نتیجه جدید را بازنویسی کند.

## 9.3. Concurrency Controls

راهکارهای احتمالی:

- AbortController.
- Request Sequence ID.
- Query Cancellation.
- Latest Request Wins.
- Request Deduplication.

انتخاب راهکار باید متناسب با نوع عملیات باشد.

## 9.4. Idempotency

برای عملیات حساس، سیاست Idempotency باید در Backend تعریف شود.

Frontend می‌تواند شناسه درخواست مناسب را در چارچوب قرارداد API ارسال کند؛ اما تضمین Idempotency مسئولیت Backend است.

## 9.5. Duplicate Submission

برای جلوگیری از ارسال تکراری:

- وضعیت Submit مدیریت شود.
- دکمه در شرایط مناسب غیرفعال شود.
- نتیجه درخواست پیگیری شود.
- در صورت Timeout، عملیات نامشخص تلقی شود؛ نه الزاماً ناموفق.

---

# 10. State Persistence

## 10.1. Persistence Categories

داده‌های قابل نگهداری باید به دسته‌های مشخص تقسیم شوند:

- Session State.
- User Preferences.
- Draft Form Data.
- URL State.
- Offline Data.
- Temporary Runtime State.

## 10.2. Storage Selection

انتخاب Storage باید براساس ماهیت داده انجام شود.

| Storage | Typical Use |
|---|---|
| React State | Temporary Component State |
| Context | Limited Shared UI State |
| URL | Shareable Navigation State |
| Session Storage | Short-lived Non-sensitive State |
| Local Storage | Non-sensitive Preferences |
| IndexedDB | Structured Offline Data |
| Backend | Authoritative Persistent Data |

این جدول توصیه معماری است، نه مجوز ذخیره همه انواع داده در همه Storageها.

## 10.3. Sensitive Data

ذخیره اطلاعات محرمانه در Storage مرورگر باید براساس مدل تهدید و سیاست امنیتی بررسی شود.

هیچ داده حساسی نباید صرفاً به دلیل سهولت توسعه در Local Storage ذخیره شود.

## 10.4. Hydration

در بارگذاری اولیه برنامه:

- State پایدار بازیابی شود.
- داده‌های قدیمی اعتبارسنجی شوند.
- Version Schema بررسی شود.
- داده ناسازگار به‌صورت کنترل‌شده کنار گذاشته شود.
- UI تا تکمیل وضعیت ضروری، اطلاعات متناقض نشان ندهد.

---

# 11. Offline and Low-Connectivity State

## 11.1. Network State

وضعیت شبکه می‌تواند شامل موارد زیر باشد:

- ONLINE.
- OFFLINE.
- DEGRADED.
- RECONNECTING.

این وضعیت‌ها باید براساس شواهد واقعی تفسیر شوند.

## 11.2. Offline Capabilities

قابلیت‌های Offline باید برای هر محصول جداگانه تعیین شوند.

### Eco Nojin

- نمایش برخی محتوای عمومی Cache شده.
- حفظ برخی تنظیمات غیرحساس.
- نمایش وضعیت اتصال.

### HyDroMA

- نمایش داده‌های علمی قبلاً دریافت‌شده، با برچسب زمان و منبع.
- اجرای محاسبات محلی فقط برای مدل‌هایی که واقعاً پیاده‌سازی و اعتبارسنجی شده‌اند.
- تفکیک نتایج Offline از نتایج Backend.

### Nojin Marketplace

- مشاهده اطلاعات Cache شده با اعلام زمان آخرین به‌روزرسانی.
- نگهداری موقت برخی ورودی‌های غیرحساس.
- عدم تأیید سفارش یا پرداخت بدون پاسخ معتبر Backend.

## 11.3. Offline Queue

اگر عملیات در حالت Offline ذخیره شوند:

- وضعیت Pending مشخص باشد.
- عملیات حساس بدون مجوز و طراحی اختصاصی صف‌بندی نشوند.
- ترتیب اجرا مشخص باشد.
- Retry کنترل شود.
- Duplicate Submission جلوگیری شود.
- نتیجه نهایی از Backend تأیید شود.

## 11.4. Reconnection

پس از بازگشت اتصال:

- داده‌های حساس Refresh شوند.
- تغییرات احتمالی Backend بررسی شوند.
- عملیات Pending اعتبارسنجی شوند.
- تعارض داده مشخص شود.

---

# 12. Data Consistency and Conflict Resolution

## 12.1. Consistency Levels

همه داده‌ها الزاماً به سطح یکسانی از تازگی نیاز ندارند.

برای هر Domain باید نیاز Consistency مشخص شود.

## 12.2. Versioning

در صورت پشتیبانی Backend، Version یا ETag می‌تواند برای تشخیص تغییر داده استفاده شود.

## 12.3. Conflict Detection

اگر داده محلی و سرور متفاوت باشند:

- اختلاف باید شناسایی شود.
- سیاست حل تعارض مشخص باشد.
- داده معتبر نباید بدون دلیل بازنویسی شود.

## 12.4. Conflict Resolution Strategies

گزینه‌های ممکن:

- Server Wins.
- Client Wins.
- Last Write Wins.
- Manual Conflict Resolution.
- Domain-Specific Resolution.

هیچ‌یک نباید بدون بررسی Domain به‌صورت سراسری انتخاب شود.

## 12.5. Financial Consistency

در حوزه مالی، Backend مرجع حقیقت است.

Frontend نباید با استفاده از Cache یا State محلی، موجودی یا وضعیت تراکنش را قطعی اعلام کند.

## 12.6. Scientific Consistency

در HyDroMA، داده علمی باید همراه با شناسه نسخه، زمان، منبع و وضعیت اعتبارسنجی مدیریت شود.

نتایج متعلق به ورودی یا نسخه مدل قدیمی نباید بدون هشدار به ورودی یا نسخه جدید نسبت داده شوند.

---

# 13. Product-Specific State Architecture

## 13.1. Eco Nojin

Stateهای اصلی پیشنهادی:

- Locale State.
- Navigation State.
- User Profile State.
- Public Content State.
- User Preferences.
- Notification State.
- Tourism Content State.

اصول:

- محتوای عمومی از تنظیمات شخصی تفکیک شود.
- Navigation State در صورت نیاز با URL هماهنگ باشد.
- داده پروفایل از Backend دریافت شود.
- ترجیحات غیرحساس به‌صورت کنترل‌شده نگهداری شوند.

## 13.2. HyDroMA

Stateهای اصلی پیشنهادی:

- Scientific Dashboard State.
- Region Selection State.
- Map Layer State.
- Time Range State.
- Model Configuration State.
- Simulation Execution State.
- Scientific Result State.
- Visualization State.
- Data Provenance State.

### Scientific Input State

ورودی‌های علمی باید دارای مشخصات روشن باشند:

- Parameter ID.
- Value.
- Unit.
- Validation Status.
- Source.
- Timestamp.
- Model Compatibility.

### Simulation State Machine

وضعیت اجرای شبیه‌سازی می‌تواند شامل موارد زیر باشد:

```text
IDLE
  |
CONFIGURING
  |
VALIDATING_INPUT
  |
READY
  |
SUBMITTED
  |
RUNNING
  |
COMPLETED
```

مسیرهای جایگزین:

```text
VALIDATION_FAILED
EXECUTION_FAILED
CANCELLED
TIMEOUT
RESULT_PENDING
```

این وضعیت‌ها باید با قرارداد واقعی Engine و Backend تطبیق داده شوند.

### Scientific Result Cache

کش نتایج علمی باید با موارد زیر مرتبط باشد:

- Model Version.
- Input Version.
- Dataset Version.
- Spatial Scope.
- Temporal Scope.
- Unit System.
- Calculation Configuration.

اگر هر یک از ورودی‌های مؤثر تغییر کند، نتیجه قبلی نباید بدون بررسی به‌عنوان نتیجه جدید نمایش داده شود.

## 13.3. Nojin Marketplace

Stateهای اصلی پیشنهادی:

- Product Catalog State.
- Search State.
- Filter State.
- Cart State.
- Checkout State.
- Order State.
- Seller State.
- Inventory Display State.

### Cart State

سبد خرید می‌تواند در رابط وضعیت موقت داشته باشد؛ اما قیمت، موجودی و امکان ثبت سفارش باید از Backend معتبر شوند.

### Order State

وضعیت سفارش باید از منبع معتبر دریافت شود.

نمایش سفارش ثبت‌شده بدون تأیید Backend مجاز نیست.

### Inventory State

موجودی نمایش‌داده‌شده ممکن است با موجودی واقعی تغییر کند.

قبل از نهایی کردن سفارش، موجودی باید مجدداً بررسی شود.

---

# 14. State Management Technology Evaluation

## 14.1. Selection Criteria

انتخاب ابزار باید براساس معیارهای زیر انجام شود:

- سازگاری با React.
- پیچیدگی معماری.
- قابلیت آزمون.
- Performance.
- Type Safety.
- DevTools.
- Server State Support.
- Persistence Support.
- Bundle Size.
- Maintenance Cost.
- Community and Documentation.
- Migration Complexity.

## 14.2. Technology Categories

| Category | Example Technologies |
|---|---|
| Local State | React useState |
| Shared UI State | React Context |
| Global Client State | Zustand, Redux Toolkit |
| Server State | TanStack Query, RTK Query |
| Form State | React Hook Form |
| URL State | React Router Search Params |
| Schema Validation | Zod |

این فهرست برای ارزیابی است و هیچ ابزار خاصی را تصویب نمی‌کند.

## 14.3. Avoid Tool Duplication

استفاده هم‌زمان از چند ابزار با مسئولیت یکسان باید توجیه معماری داشته باشد.

برای مثال، مدیریت یک Server State در چند Store مستقل می‌تواند باعث ناسازگاری شود.

## 14.4. Technology Decision

انتخاب ابزار باید پس از بررسی Stack واقعی پروژه و اجرای Prototype محدود انجام شود.

---

# 15. Performance and Memory Management

## 15.1. State Granularity

تغییر یک State نباید بدون ضرورت باعث Render گسترده کل برنامه شود.

## 15.2. Selective Subscription

در Storeهای اشتراکی باید فقط بخش موردنیاز State خوانده شود.

## 15.3. Derived State

داده‌های قابل محاسبه نباید بدون ضرورت به‌صورت State مستقل ذخیره شوند.

## 15.4. Large Data Sets

برای داده‌های حجیم:

- Pagination.
- Virtualization.
- Incremental Loading.
- Data Windowing.
- Controlled Retention.

باید بررسی شوند.

## 15.5. Memory Cleanup

موارد زیر باید پس از پایان استفاده پاک‌سازی شوند:

- Event Listeners.
- Timers.
- Subscriptions.
- Temporary Results.
- Large Visualization Data.
- Abandoned Requests.
- Unused Cache Entries.

## 15.6. Cache Size

Cache باید محدودیت حجم و سیاست حذف داشته باشد.

کش نامحدود قابل قبول نیست.

---

# 16. Security and Privacy

## 16.1. State Exposure

داده‌های حساس نباید بدون ضرورت در Global Store یا ابزارهای Debugging قابل مشاهده باشند.

## 16.2. DevTools

استفاده از DevTools در محیط Production باید با سیاست امنیتی مشخص انجام شود.

## 16.3. Cross-User State Leakage

پس از Logout یا تغییر حساب کاربری:

- Cacheهای وابسته به حساب قبلی بررسی شوند.
- State خصوصی پاک‌سازی شود.
- درخواست‌های قبلی مدیریت شوند.
- داده کاربر قبلی به کاربر جدید نمایش داده نشود.

## 16.4. Tenant Isolation

در صورت وجود چند سازمان، روستا، پروژه یا فضای کاری:

- State باید محدوده Tenant مشخص داشته باشد.
- Cache Keyها باید از تداخل جلوگیری کنند.
- تغییر Tenant باید داده‌های قبلی را به‌درستی بی‌اعتبار کند.
- مجوزهای واقعی در Backend بررسی شوند.

## 16.5. Persistence Security

ذخیره State حساس در Local Storage، Session Storage یا IndexedDB بدون ارزیابی امنیتی مجاز تلقی نمی‌شود.

---

# 17. Testing and Validation

## 17.1. Unit Testing

آزمون موارد زیر:

- State Transitions.
- Reducers.
- Selectors.
- Cache Key Generation.
- Invalidation Logic.
- Data Transformation.
- Error Mapping.

## 17.2. Integration Testing

- API to Cache.
- Cache to UI.
- State Persistence.
- Query Invalidation.
- Request Cancellation.
- Authentication State.
- Logout Cleanup.

## 17.3. Concurrency Testing

- Race Conditions.
- Duplicate Requests.
- Repeated Submission.
- Out-of-Order Responses.
- Retry Behavior.
- Cancellation.

## 17.4. Offline Testing

- قطع شبکه.
- اتصال ناپایدار.
- بازگشت اتصال.
- داده منقضی.
- عملیات Pending.
- تعارض داده.

## 17.5. Financial State Testing

- جلوگیری از نمایش موجودی ساختگی.
- جلوگیری از تأیید پرداخت محلی.
- جلوگیری از سفارش تکراری.
- مدیریت Timeout.
- دریافت وضعیت نهایی از Backend.

## 17.6. Scientific State Testing

- تغییر ورودی مدل.
- تغییر نسخه مدل.
- تغییر Dataset.
- تغییر واحد.
- نتیجه منقضی.
- شکست محاسبه.
- دریافت دیرهنگام نتیجه.
- نمایش Provenance.

## 17.7. Acceptance Test

هیچ قابلیت مدیریت وضعیت نباید صرفاً به‌دلیل اجرای موفق UI تأیید شود.

شواهد آزمون باید شامل رفتار واقعی Data Flow و Backend Integration باشد.

---

# 18. Observability and Debugging

مدیریت State باید با استاندارد مشاهده‌پذیری فایل شماره ۲۷ سازگار باشد.

موارد قابل ثبت:

- Query Failure.
- Cache Hit/Miss.
- Cache Invalidation.
- Request Cancellation.
- State Transition Failure.
- Data Version Mismatch.
- Offline Transition.
- Reconnection.
- Stale Data Detection.

اطلاعات حساس State نباید در Log ثبت شود.

---

# 19. Implementation Governance

## 19.1. Implementation Requirements

پیش از پیاده‌سازی هر State Domain باید مشخص شود:

1. مالک داده چیست؟
2. منبع حقیقت کجاست؟
3. چه کسی اجازه تغییر دارد؟
4. چرخه عمر داده چیست؟
5. آیا داده قابل ذخیره‌سازی است؟
6. آیا Cache مجاز است؟
7. سیاست تازگی چیست؟
8. چه زمانی Invalidation لازم است؟
9. آیا داده حساس است؟
10. چگونه آزمون می‌شود؟

## 19.2. Agent Restrictions

ایجنت توسعه نباید بدون مجوز:

- State Management Library را در کل پروژه تعویض کند.
- Server State را به Global Store منتقل کند.
- سیاست Cache داده مالی را تغییر دهد.
- Token را در Storage جدید ذخیره کند.
- Offline Transaction ایجاد کند.
- منطق Optimistic مالی فعال کند.
- سیاست Data Consistency را تغییر دهد.
- Cache مشترک میان کاربران ایجاد کند.
- نتیجه علمی قدیمی را به‌عنوان نتیجه معتبر جدید نمایش دهد.
- داده‌های موجود را برای ساده‌سازی معماری حذف کند.

## 19.3. Migration Governance

هر تغییر معماری State باید شامل موارد زیر باشد:

- Current Architecture.
- Proposed Architecture.
- Migration Scope.
- Compatibility Analysis.
- Regression Tests.
- Rollback Strategy.
- Acceptance Evidence.

---

# 20. Acceptance Criteria

| ID | Acceptance Criterion | Evidence |
|---|---|---|
| STATE-001 | انواع State طبقه‌بندی شده‌اند | Architecture Review |
| STATE-002 | مالک هر داده مشخص است | Data Ownership Matrix |
| STATE-003 | Source of Truth تعریف شده است | Domain Documentation |
| STATE-004 | Server State از UI State جداست | Code Review |
| STATE-005 | Query Keys پایدارند | Unit Tests |
| STATE-006 | Cache Invalidation آزمون شده است | Integration Tests |
| STATE-007 | Race Condition کنترل شده است | Concurrency Tests |
| STATE-008 | Request Cancellation کار می‌کند | Integration Evidence |
| STATE-009 | Optimistic Update محدود و کنترل‌شده است | Domain Review |
| STATE-010 | عملیات مالی به Backend وابسته است | Financial Tests |
| STATE-011 | داده علمی دارای Version Context است | Scientific Tests |
| STATE-012 | Logout داده خصوصی را پاک‌سازی می‌کند | Security Tests |
| STATE-013 | Cache بین کاربران نشت نمی‌کند | Isolation Tests |
| STATE-014 | Offline State شفاف است | Offline Tests |
| STATE-015 | Cache دارای محدودیت است | Performance Evidence |
| STATE-016 | Persistence دارای سیاست مشخص است | Storage Review |
| STATE-017 | State Transitions قابل آزمون‌اند | Unit Tests |
| STATE-018 | ابزار انتخابی با معماری سازگار است | Technology Review |

---

# 21. Open Decisions

| ID | Decision | Status |
|---|---|---|
| STATE-D01 | معماری نهایی Global State | OPEN |
| STATE-D02 | ابزار Client State | OPEN |
| STATE-D03 | ابزار Server State | OPEN |
| STATE-D04 | ابزار Form State | OPEN |
| STATE-D05 | سیاست Query Key | OPEN |
| STATE-D06 | سیاست Cache TTL | OPEN |
| STATE-D07 | سیاست Cache Invalidation | OPEN |
| STATE-D08 | سیاست Optimistic Update | OPEN |
| STATE-D09 | سیاست Persistent State | OPEN |
| STATE-D10 | سیاست Offline Data | OPEN |
| STATE-D11 | سیاست Offline Queue | OPEN |
| STATE-D12 | سیاست Scientific Result Cache | OPEN |
| STATE-D13 | سیاست Financial State | OPEN |
| STATE-D14 | سیاست Tenant Isolation | OPEN |
| STATE-D15 | سیاست Data Normalization | OPEN |
| STATE-D16 | سیاست State Migration | OPEN |
| STATE-D17 | محدودیت حجم Cache | OPEN |
| STATE-D18 | معماری مشترک سه محصول | OPEN |

---

# 22. Final Principles

1. هر داده باید مالک مشخص داشته باشد.
2. Source of Truth باید صریح باشد.
3. Server State و Client State نباید بدون دلیل ادغام شوند.
4. Global State باید حداقلی باشد.
5. Cache باید دارای مالک، چرخه عمر و سیاست Invalidation باشد.
6. داده منقضی نباید به‌عنوان داده تازه معرفی شود.
7. درخواست‌های هم‌زمان باید در برابر Race Condition محافظت شوند.
8. شکست Telemetry یا Cache نباید موجب جعل موفقیت عملیات شود.
9. عملیات مالی باید از Backend معتبر تأیید شوند.
10. نتایج علمی باید به نسخه مدل و ورودی‌های معتبر متصل باشند.
11. Offline Mode باید محدودیت‌های واقعی خود را شفاف نمایش دهد.
12. تغییر حساب کاربری باید State و Cache خصوصی را پاک‌سازی کند.
13. هیچ ابزار مدیریت وضعیت بدون ارزیابی معماری انتخاب نشود.
14. پیاده‌سازی باید با آزمون و شواهد معتبر تأیید شود.

---

# 23. Document Status

**Current Status: DRAFT — PROPOSED — NOT APPROVED**

این سند چارچوب پیشنهادی مدیریت وضعیت، جریان داده و کش در فرانت‌اند Eco Nojin را تعریف می‌کند.

این سند:

- کتابخانه مدیریت State را انتخاب نمی‌کند.
- معماری موجود را تأیید نمی‌کند.
- سیاست TTL را نهایی نمی‌کند.
- Offline Mode را فعال نمی‌کند.
- عملیات مالی Offline را مجاز نمی‌کند.
- تغییر معماری Backend را تصویب نمی‌کند.
- مجوز Migration سراسری صادر نمی‌کند.
- صحت پیاده‌سازی فعلی را اثبات نمی‌کند.

هرگونه پیاده‌سازی باید پس از بررسی معماری واقعی، تعیین مالکیت داده، ارزیابی امنیت و اجرای آزمون‌های لازم انجام شود.

**End of Document 29**