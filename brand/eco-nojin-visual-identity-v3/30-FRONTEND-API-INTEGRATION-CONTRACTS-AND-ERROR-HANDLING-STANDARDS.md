# Frontend API Integration, Contracts and Error Handling Standards

## 1. Document Control

| Attribute | Value |
|---|---|
| Document ID | EN-FE-STD-030 |
| Document Number | 30 |
| Document Name | Frontend API Integration, Contracts and Error Handling Standards |
| Ecosystem | Eco Nojin |
| Products | Eco Nojin, HyDroMA, Nojin Marketplace |
| Document Category | Frontend Engineering Standards |
| Version | 1.0.0 |
| Status | DRAFT — PROPOSED — NOT APPROVED |
| Date | 2026-11-17 |
| Scope | Frontend-to-Backend integration |
| Approval Authority | Project Owner |

### 1.1. Status Notice

این سند یک استاندارد پیشنهادی برای طراحی، پیاده‌سازی، آزمون و نگهداری ارتباط میان Frontend و Backend در اکوسیستم Eco Nojin است.

هیچ‌یک از فناوری‌ها، پروتکل‌ها، ساختارهای داده، قراردادهای API یا سیاست‌های اجرایی مطرح‌شده در این سند به‌معنای انتخاب یا تصویب قطعی آن‌ها نیست.

انتخاب نهایی باید پس از بررسی Backend واقعی، قراردادهای موجود، نیازهای عملیاتی، محدودیت‌های زیرساختی و تصمیم مالک پروژه انجام شود.

### 1.2. Normative Language

واژه‌های زیر در این سند معنای مشخص دارند:

- **MUST:** الزام ضروری برای انطباق با استاندارد.
- **MUST NOT:** رفتار ممنوع.
- **SHOULD:** توصیه قوی؛ انحراف از آن نیازمند دلیل فنی مستند است.
- **SHOULD NOT:** رفتار نامطلوب مگر با توجیه فنی.
- **MAY:** گزینه مجاز و وابسته به نیاز پروژه.
- **PROPOSED:** پیشنهاد نیازمند بررسی و تصویب.

---

# 2. Purpose and Objectives

هدف این سند ایجاد چارچوبی یکپارچه برای ارتباط قابل اعتماد، امن، قابل آزمون و قابل نگهداری میان رابط‌های کاربری و سرویس‌های Backend است.

این استاندارد باید از ایجاد ارتباطات پراکنده، قراردادهای ناسازگار، مدیریت نامنظم خطاها و وابستگی مستقیم صفحات به جزئیات پیاده‌سازی Backend جلوگیری کند.

اهداف اصلی:

1. ایجاد مرز مشخص میان UI و Backend.
2. تعریف اصول قراردادهای API.
3. جلوگیری از ناسازگاری مدل‌های داده.
4. ایجاد الگوی استاندارد برای ارسال درخواست و دریافت پاسخ.
5. مدیریت یکپارچه خطاهای ارتباطی و تجاری.
6. حفاظت از اطلاعات احراز هویت و داده‌های حساس.
7. پشتیبانی از ارتباطات قابل اعتماد در شبکه‌های ناپایدار.
8. تضمین سازگاری نسخه‌های Frontend و Backend.
9. فراهم کردن امکان Contract Testing.
10. حفظ قابلیت ردیابی درخواست‌ها و خطاها.
11. جلوگیری از تأیید کاذب عملیات مالی و علمی.
12. ایجاد قابلیت توسعه مستقل سرویس‌ها بدون تخریب مصرف‌کنندگان API.

---

# 3. Scope

این استاندارد برای تمام بخش‌های Frontend اکوسیستم کاربرد دارد.

## 3.1. Eco Nojin

دامنه‌های احتمالی:

- حساب کاربری و پروفایل
- ثبت‌نام و ورود
- مدیریت نقش‌ها و دسترسی‌ها
- داشبورد عمومی
- اطلاعات روستاها و مناطق
- اطلاعات جوامع محلی و عشایری
- محتوای عمومی
- خدمات اکوسیستم
- اطلاعات محیط‌زیستی
- گزارش‌های عمومی
- ارتباط با سرویس‌های HyDroMA
- دسترسی به Nojin Marketplace

## 3.2. HyDroMA

دامنه‌های احتمالی:

- مدیریت پروژه‌های علمی
- اطلاعات آب
- اطلاعات خاک
- داده‌های اقلیمی
- داده‌های پوشش گیاهی
- سنجش‌ازدور
- اطلاعات ماهواره‌ای
- مدل‌های علمی
- شبیه‌سازی
- تحلیل و پردازش داده
- خروجی‌های محاسباتی
- گزارش‌های علمی
- پایش و ارزیابی
- MRV
- داده‌های مرتبط با کربن
- Provenance و نسخه‌بندی نتایج

## 3.3. Nojin Marketplace

دامنه‌های احتمالی:

- فروشندگان
- محصولات
- دسته‌بندی‌ها
- جست‌وجو
- موجودی
- سبد خرید
- سفارش
- پرداخت
- کیف پول
- حسابداری
- تسویه
- گردش مالی
- گزارش‌های تجاری

## 3.4. Out of Scope

این سند جایگزین اسناد تخصصی زیر نیست:

- استاندارد امنیت و حریم خصوصی فرانت‌اند
- استاندارد مدیریت State و Cache
- استاندارد Observability
- استاندارد آزمون و تضمین کیفیت
- استاندارد Deployment
- استاندارد طراحی Backend
- استاندارد محاسبات علمی HyDroMA
- استاندارد حسابداری و مالی
- سیاست‌های حقوقی و انطباق مقرراتی

در صورت وجود تعارض، سند تخصصی مصوب و تصمیم رسمی مالک پروژه مرجع خواهد بود.

---

# 4. Core Architectural Principles

## 4.1. Backend as the Authority

Backend مرجع نهایی حقیقت برای داده‌ها و عملیات دامنه‌ای است.

Frontend نباید به‌صورت مستقل و بدون تأیید Backend موارد زیر را قطعی تلقی کند:

- هویت کاربر
- نقش و مجوز کاربر
- وضعیت سفارش
- وضعیت پرداخت
- موجودی قطعی
- مانده کیف پول
- تراکنش مالی
- نتیجه نهایی شبیه‌سازی
- اعتبار خروجی علمی
- وضعیت اعتبار کربن
- تأیید یک رویداد عملیاتی

## 4.2. API Boundary

تمام ارتباطات Frontend با Backend باید از مرزهای مشخص و قابل کنترل عبور کنند.

صفحات و کامپوننت‌ها نباید مستقیماً در نقاط مختلف برنامه درخواست‌های HTTP مستقل و فاقد الگوی مشترک ایجاد کنند.

ساختار پیشنهادی:

```text
Presentation Layer
        |
        v
Application / Feature Layer
        |
        v
Domain Service Layer
        |
        v
API Client / Transport Layer
        |
        v
Backend API
        |
        v
Backend Services
        |
        v
Database / External Services
```

این ساختار یک مدل مفهومی است و الزاماً به‌معنای انتخاب معماری نرم‌افزاری خاص نیست.

## 4.3. Separation of Concerns

مسئولیت‌ها باید تفکیک شوند:

| Layer | Responsibility |
|---|---|
| UI | نمایش اطلاعات و دریافت تعامل کاربر |
| Feature | اجرای جریان کاری یک قابلیت |
| Domain Service | مدیریت عملیات دامنه‌ای |
| API Client | ارتباط و انتقال داده |
| Contract Layer | تعریف و اعتبارسنجی ساختار داده |
| Backend | اجرای منطق مرجع و کنترل صحت عملیات |

## 4.4. Explicit Contracts

هیچ API نباید صرفاً بر اساس حدس توسعه‌دهنده یا شکل فعلی یک پاسخ JSON پیاده‌سازی شود.

هر API مورد استفاده باید دارای قرارداد قابل شناسایی باشد.

حداقل اطلاعات قرارداد:

- Endpoint
- HTTP Method
- Request Schema
- Response Schema
- Authentication Requirements
- Authorization Requirements
- Error Responses
- Pagination Rules
- Version Compatibility
- Data Constraints
- Operational Expectations

## 4.5. No Silent Assumptions

در صورت نامشخص بودن قرارداد:

1. قرارداد باید از Backend واقعی استخراج شود.
2. در صورت نبود مستندات، پیاده‌سازی Backend بررسی شود.
3. ابهام باید ثبت شود.
4. فرضیه نباید به‌عنوان واقعیت وارد کد شود.
5. قرارداد جدید باید با مسئول Backend هماهنگ شود.

---

# 5. API Integration Architecture

## 5.1. Centralized API Client

یک لایه ارتباطی مشترک SHOULD وجود داشته باشد.

وظایف پیشنهادی:

- Base URL Management
- HTTP Request Construction
- Response Handling
- Timeout Management
- Authentication Integration
- Correlation ID Propagation
- Error Normalization
- Cancellation Support
- Content-Type Handling
- Request Serialization
- Response Deserialization

این لایه نباید شامل منطق تجاری اختصاصی محصولات باشد.

## 5.2. Domain-Specific API Services

سرویس‌های دامنه‌ای باید ارتباطات مربوط به هر قابلیت را سازمان‌دهی کنند.

نمونه مفهومی:

```text
src/
  api/
    client/
      http-client
      error-normalizer
      request-context

  features/
    authentication/
      services/

    hydroma/
      services/
        water
        soil
        climate
        remote-sensing
        simulation
        mrv

    marketplace/
      services/
        products
        inventory
        cart
        orders
        payments

    ecosystem/
      services/
        villages
        communities
        projects
```

این ساختار پیشنهادی است و با معماری واقعی پروژه باید تطبیق داده شود.

## 5.3. No Direct API Calls in Presentation Components

در حالت معمول:

```typescript
// Avoid

function ProductPage() {
  fetch("/api/products");
}
```

الگوی مطلوب:

```typescript
// Conceptual example

function ProductPage() {
  const products = useProducts();
}
```

جزئیات واقعی باید متناسب با ابزار مدیریت داده و State مصوب پروژه تعیین شود.

استثناهای محدود باید مستند باشند.

## 5.4. Transport Independence

منطق دامنه‌ای نباید به یک کتابخانه HTTP خاص وابسته شود.

لایه ارتباطی باید امکان جایگزینی ابزار انتقال را بدون بازنویسی گسترده منطق تجاری فراهم کند.

---

# 6. API Contract Standards

## 6.1. Contract Definition

قرارداد API باید نماینده رفتار واقعی Backend باشد.

قرارداد باید موارد زیر را مشخص کند:

| Category | Required Information |
|---|---|
| Identity | API identifier |
| Endpoint | Path |
| Method | GET, POST, PUT, PATCH, DELETE |
| Input | Request schema |
| Output | Response schema |
| Authentication | Required or not |
| Authorization | Required permission |
| Validation | Constraints |
| Errors | Possible error codes |
| Pagination | Strategy and metadata |
| Version | Compatibility rules |
| Deprecation | Lifecycle information |

## 6.2. OpenAPI

استفاده از OpenAPI به‌عنوان یکی از گزینه‌های پیشنهادی برای مستندسازی API قابل بررسی است.

مزایای احتمالی:

- مستندسازی استاندارد
- تولید Type Definitions
- Contract Validation
- تولید Mock
- تسهیل Integration Testing
- کاهش اختلاف Frontend و Backend

اما:

- وجود فایل OpenAPI به‌تنهایی صحت قرارداد را ثابت نمی‌کند.
- تعداد Routeها معادل کامل بودن API نیست.
- مستندات قدیمی ممکن است با Backend واقعی مغایرت داشته باشند.
- تولید Type از OpenAPI تضمین‌کننده صحت منطق تجاری نیست.

**اصل الزامی:** قرارداد مستندشده باید با پیاده‌سازی واقعی Backend تطبیق داده شود.

## 6.3. Schema Validation

ساختار ورودی و خروجی باید در مرز ارتباطی قابل اعتبارسنجی باشد.

اعتبارسنجی باید موارد زیر را پوشش دهد:

- Required Fields
- Optional Fields
- Nullable Fields
- Primitive Types
- Enum Values
- Numeric Constraints
- String Constraints
- Date and Time Formats
- Nested Objects
- Array Constraints
- Unknown Fields Policy

نباید فرض شود که داده دریافتی از شبکه صرفاً به‌دلیل وجود TypeScript Type معتبر است.

TypeScript به‌تنهایی داده Runtime را اعتبارسنجی نمی‌کند.

## 6.4. Runtime Validation

برای داده‌های حساس یا قراردادهای خارجی، اعتبارسنجی Runtime SHOULD انجام شود.

موارد اولویت‌دار:

- اطلاعات کاربری
- مجوزها
- تراکنش‌ها
- سفارش‌ها
- پرداخت‌ها
- نتایج مدل‌های علمی
- داده‌های ورودی شبیه‌سازی
- فایل‌های بارگذاری‌شده
- پاسخ سرویس‌های خارجی

ابزارهایی مانند Zod، Valibot یا JSON Schema Validator صرفاً گزینه‌های قابل بررسی هستند و هیچ‌کدام در این سند انتخاب نشده‌اند.

## 6.5. Contract Drift

Contract Drift زمانی رخ می‌دهد که قرارداد Frontend و Backend از یکدیگر فاصله بگیرند.

نمونه‌ها:

- تغییر نام فیلد
- تغییر نوع داده
- تغییر معنای یک فیلد
- تغییر Status Code
- حذف Endpoint
- تغییر ساختار Error
- تغییر رفتار Pagination
- تغییر واحد اندازه‌گیری

کنترل پیشنهادی:

1. نسخه قرارداد ثبت شود.
2. تغییرات Breaking مشخص شوند.
3. آزمون سازگاری اجرا شود.
4. مصرف‌کنندگان API شناسایی شوند.
5. مهاجرت کنترل‌شده انجام شود.

---

# 7. HTTP and Transport Standards

## 7.1. HTTP Methods

استفاده از HTTP Methods باید با معنای استاندارد آن‌ها سازگار باشد.

| Method | Intended Use |
|---|---|
| GET | دریافت داده |
| POST | ایجاد منبع یا اجرای عملیات |
| PUT | جایگزینی کامل منبع |
| PATCH | تغییر جزئی منبع |
| DELETE | حذف منبع |

نباید از GET برای اجرای عملیات دارای اثر جانبی استفاده شود.

## 7.2. HTTP Status Codes

کدهای وضعیت باید معنای واقعی عملیات را منعکس کنند.

| Status | Meaning | Frontend Handling |
|---|---|---|
| 200 | OK | پردازش پاسخ |
| 201 | Created | نمایش نتیجه ایجاد |
| 202 | Accepted | عملیات پذیرفته شده، هنوز نهایی نیست |
| 204 | No Content | موفقیت بدون بدنه |
| 400 | Bad Request | خطای درخواست |
| 401 | Unauthorized | نیاز به احراز هویت |
| 403 | Forbidden | عدم مجوز |
| 404 | Not Found | منبع یافت نشد |
| 409 | Conflict | تعارض وضعیت |
| 410 | Gone | منبع حذف یا منسوخ شده |
| 413 | Payload Too Large | حجم بیش از حد |
| 415 | Unsupported Media Type | نوع رسانه نامعتبر |
| 422 | Unprocessable Content | خطای اعتبارسنجی یا معنایی |
| 429 | Too Many Requests | محدودیت نرخ درخواست |
| 500 | Internal Server Error | خطای داخلی |
| 502 | Bad Gateway | خطای Gateway |
| 503 | Service Unavailable | سرویس موقتاً در دسترس نیست |
| 504 | Gateway Timeout | پایان مهلت Gateway |

این جدول یک راهنمای عمومی است. قرارداد واقعی هر Endpoint باید مشخص کند چه Status Codeهایی ممکن هستند.

Frontend نباید تمام خطاهای HTTP را به یک پیام عمومی تبدیل کند.

## 7.3. Content Types

نوع محتوای درخواست و پاسخ باید صریح باشد.

نمونه‌های متداول:

```http
Content-Type: application/json
Accept: application/json
```

برای بارگذاری فایل، نوع محتوای مناسب و سازگار با قرارداد Endpoint باید استفاده شود.

Frontend نباید فرض کند تمام پاسخ‌های Backend JSON هستند.

## 7.4. Response Body Handling

لایه ارتباطی باید این موارد را به‌درستی مدیریت کند:

- پاسخ دارای JSON
- پاسخ بدون بدنه
- پاسخ متنی
- پاسخ فایل
- پاسخ Streaming
- پاسخ ناقص
- پاسخ غیرقابل‌خواندن
- پاسخ دارای Content-Type غیرمنتظره

خطای Parsing نباید به‌اشتباه به‌عنوان خطای تجاری گزارش شود.

---

# 8. Request and Response Structure

## 8.1. Consistent Response Contract

در صورت امکان، قرارداد پاسخ‌ها باید در سطح API یکپارچه باشد.

یک نمونه مفهومی:

```json
{
  "data": {
    "id": "example-id"
  },
  "meta": {
    "request_id": "request-id"
  }
}
```

این نمونه الزام‌آور نیست.

در صورتی که Backend ساختار متفاوتی دارد، Frontend باید با قرارداد واقعی سازگار شود.

نباید صرفاً برای یکسان‌سازی ظاهری، ساختار Backend تغییر داده شود.

## 8.2. Request Metadata

اطلاعات کمکی احتمالی:

- Request ID
- Correlation ID
- Client Application Version
- API Version
- Locale
- Timezone
- Trace Context

این اطلاعات باید تنها در صورت نیاز و با قرارداد مشخص ارسال شوند.

اطلاعات زیر نباید در Metadata قرار گیرند:

- Password
- Access Token
- Refresh Token
- اطلاعات مالی محرمانه
- داده‌های حساس شخصی
- کلیدهای محرمانه
- اطلاعات غیرضروری شناسایی کاربر

## 8.3. Field Semantics

معنای فیلدها باید مستقل از نام آن‌ها مشخص باشد.

برای مثال:

```json
{
  "amount": 1000,
  "currency": "IRR"
}
```

نباید صرفاً از نام `amount` واحد یا دقت عددی را استنباط کرد.

واحد پول، دقت، قواعد گرد کردن و محدودیت‌ها باید در قرارداد مشخص باشند.

همین قاعده برای داده‌های علمی نیز الزامی است.

---

# 9. Authentication and Authorization Integration

## 9.1. Authentication Boundary

Frontend باید با سازوکار احراز هویت واقعی Backend هماهنگ باشد.

نوع سازوکار ممکن است شامل موارد زیر باشد:

- Session-based Authentication
- Token-based Authentication
- Secure Cookie
- OAuth 2.0
- OpenID Connect
- سایر روش‌های مورد تأیید معماری امنیتی

هیچ‌یک از این گزینه‌ها در این سند به‌عنوان انتخاب نهایی تعیین نمی‌شوند.

## 9.2. Token Handling

قواعد زیر الزامی هستند:

1. رمز عبور نباید در Log ثبت شود.
2. Token نباید در URL قرار گیرد.
3. Token نباید در Error Message نمایش داده شود.
4. Token نباید وارد Analytics شود.
5. اطلاعات احراز هویت نباید در Source Map عمومی افشا شود.
6. Token نباید در گزارش خطای Frontend ذخیره شود.
7. محل نگهداری Credential باید با سند امنیتی پروژه تعیین شود.

انتخاب Local Storage، Session Storage، Cookie یا هر روش دیگر باید پس از ارزیابی امنیتی انجام شود.

## 9.3. Authorization

Frontend می‌تواند برای تجربه کاربری، عناصر را بر اساس مجوزها نمایش دهد یا پنهان کند.

اما:

**کنترل دسترسی واقعی باید در Backend اعمال شود.**

موارد زیر ممنوع است:

- اتکا به مخفی کردن دکمه برای حفاظت از Endpoint
- اعتماد به Role ذخیره‌شده در State مرورگر
- اعتماد به داده قابل‌تغییر توسط کاربر
- فرض مجاز بودن عملیات بر اساس URL
- استفاده از شناسه منبع بدون بررسی مالکیت در Backend

## 9.4. Session Expiration

در صورت انقضای Session:

- وضعیت احراز هویت باید به‌روزرسانی شود.
- داده خصوصی نباید به کاربر بعدی نمایش داده شود.
- درخواست‌های وابسته به Session باید متوقف یا کنترل شوند.
- کاربر باید پیام روشن دریافت کند.
- جریان ورود مجدد باید با سیاست امنیتی هماهنگ باشد.

درخواست‌های هم‌زمان نباید باعث ایجاد چرخه نامحدود Refresh شوند.

---

# 10. Timeout, Retry and Cancellation

## 10.1. Timeout

تمام درخواست‌های شبکه باید سیاست Timeout مشخص داشته باشند.

Timeout باید متناسب با نوع عملیات تعیین شود.

نمونه دسته‌بندی:

| Request Category | Expected Behavior |
|---|---|
| Read API | زمان پاسخ کوتاه |
| Search API | زمان پاسخ کنترل‌شده |
| Upload | وابسته به اندازه و شبکه |
| Simulation Submission | ارسال کنترل‌شده |
| Long-running Job | استفاده از الگوی Job |
| Report Generation | وابسته به حجم پردازش |

اعداد دقیق Timeout باید پس از اندازه‌گیری عملکرد Backend و شرایط شبکه تعیین شوند.

## 10.2. Retry

Retry باید کنترل‌شده و محدود باشد.

اصول:

- فقط خطاهای موقت واجد شرایط Retry هستند.
- Retry باید محدودیت تعداد داشته باشد.
- Backoff باید اعمال شود.
- درخواست‌های تکراری نباید اثر جانبی ناخواسته ایجاد کنند.
- Retry باید با Rate Limit هماهنگ باشد.
- Cancellation باید پشتیبانی شود.

## 10.3. Retry Classification

| Failure | Retry Policy |
|---|---|
| Temporary Network Failure | MAY retry |
| Connection Reset | MAY retry |
| 429 | Respect Retry-After |
| 502 | MAY retry |
| 503 | MAY retry |
| 504 | MAY retry |
| 400 | MUST NOT automatically retry |
| 401 | Follow authentication policy |
| 403 | MUST NOT automatically retry |
| 404 | Normally no retry |
| 409 | Requires domain-specific handling |
| Validation Error | MUST NOT retry automatically |

## 10.4. Exponential Backoff

در صورت استفاده از Retry، افزایش فاصله زمانی بین درخواست‌ها SHOULD اعمال شود.

مدل مفهومی:

```text
delay = min(max_delay, base_delay * 2^attempt)
```

استفاده از Jitter برای کاهش هم‌زمانی درخواست‌های مجدد قابل بررسی است.

اعداد واقعی باید با سیاست Backend و زیرساخت هماهنگ شوند.

## 10.5. Cancellation

درخواست‌هایی که دیگر موردنیاز نیستند باید در صورت امکان لغو شوند.

نمونه‌ها:

- تغییر سریع عبارت جست‌وجو
- خروج از صفحه
- تغییر محدوده نقشه
- تغییر پارامترهای نمودار
- لغو فرآیند بارگذاری
- پایان Session

Cancellation در Frontend لزوماً به‌معنای توقف پردازش Backend نیست.

برای توقف واقعی Job باید قرارداد اختصاصی Backend وجود داشته باشد.

---

# 11. Idempotency and Duplicate Operations

## 11.1. Principle

در عملیات دارای اثر جانبی، تکرار درخواست نباید باعث ایجاد اثر ناخواسته شود.

موارد حساس:

- ایجاد سفارش
- ثبت پرداخت
- انتقال وجه
- ثبت تراکنش
- برداشت از کیف پول
- ثبت درخواست شبیه‌سازی
- ایجاد Job پردازشی
- ثبت عملیات دارای هزینه

## 11.2. Idempotency Key

برای عملیات مناسب، استفاده از Idempotency Key در Backend قابل بررسی است.

نمونه مفهومی:

```http
Idempotency-Key: unique-operation-id
```

Frontend نباید فرض کند ارسال این Header به‌تنهایی عملیات را Idempotent می‌کند.

Backend باید رفتار کلید، مدت اعتبار، محدوده یکتایی و پاسخ درخواست تکراری را تعریف و پیاده‌سازی کند.

## 11.3. Duplicate Submission Protection

Frontend SHOULD از ارسال ناخواسته چندباره درخواست جلوگیری کند.

روش‌های احتمالی:

- غیرفعال کردن کنترل ثبت در زمان ارسال
- مدیریت وضعیت Pending
- حفظ شناسه عملیات
- جلوگیری از کلیک تکراری
- نمایش وضعیت پردازش

این کنترل‌ها جایگزین Idempotency در Backend نیستند.

---

# 12. Error Taxonomy and Normalization

## 12.1. Error Categories

خطاها باید بر اساس منشأ و معنای آن‌ها طبقه‌بندی شوند.

| Category | Description |
|---|---|
| Network Error | مشکل ارتباط شبکه |
| Timeout Error | پایان مهلت درخواست |
| Authentication Error | مشکل احراز هویت |
| Authorization Error | نبود مجوز |
| Validation Error | داده ورودی نامعتبر |
| Business Rule Error | نقض قانون تجاری |
| Conflict Error | تعارض وضعیت |
| Not Found Error | منبع یافت نشد |
| Rate Limit Error | محدودیت نرخ |
| Server Error | خطای Backend |
| Parsing Error | مشکل پردازش پاسخ |
| Contract Error | ناسازگاری قرارداد |
| Cancellation Error | درخواست لغوشده |
| Unknown Error | خطای ناشناخته |

## 12.2. Normalized Error Model

Frontend SHOULD خطاهای دریافت‌شده را به یک مدل داخلی قابل‌استفاده تبدیل کند.

نمونه مفهومی:

```typescript
type ApiError = {
  category:
    | "network"
    | "timeout"
    | "authentication"
    | "authorization"
    | "validation"
    | "business"
    | "conflict"
    | "rate_limit"
    | "server"
    | "contract"
    | "cancelled"
    | "unknown";

  code?: string;
  message: string;
  status?: number;
  requestId?: string;
  retryable: boolean;
  fieldErrors?: Record<string, string[]>;
};
```

این مدل نمونه است و قرارداد نهایی باید با نیازهای واقعی هماهنگ شود.

## 12.3. Error Message Separation

سه سطح پیام باید از یکدیگر جدا باشند:

1. پیام فنی برای توسعه‌دهنده و سیستم پایش.
2. پیام عملیاتی برای پشتیبانی و مدیر سیستم.
3. پیام قابل‌فهم برای کاربر نهایی.

پیام داخلی Backend نباید بدون بررسی به کاربر نمایش داده شود.

## 12.4. Error Mapping

نمونه سیاست نمایش:

| Error | User Experience |
|---|---|
| Network Failure | اعلام قطع ارتباط و امکان تلاش مجدد |
| Timeout | اعلام طولانی شدن پاسخ |
| 401 | درخواست ورود مجدد |
| 403 | اعلام عدم دسترسی |
| 404 | اعلام نبود منبع |
| 409 | اعلام تعارض و نیاز به به‌روزرسانی |
| 422 | نمایش خطاهای فیلدها |
| 429 | اعلام محدودیت موقت |
| 500 | پیام عمومی و شناسه پیگیری |
| Contract Error | عدم نمایش داده نامعتبر و ثبت خطا |

## 12.5. Field-Level Errors

خطاهای اعتبارسنجی باید در صورت وجود قرارداد مشخص به فیلد مربوط متصل شوند.

Frontend نباید برای یک خطای واحد، پیام‌های متناقض در چند بخش نمایش دهد.

## 12.6. Unknown Errors

خطای ناشناخته باید:

- ثبت شود.
- شناسه پیگیری داشته باشد، در صورت امکان.
- بدون افشای جزئیات حساس به کاربر نمایش داده شود.
- باعث توقف کنترل‌نشده برنامه نشود.

---

# 13. Pagination, Filtering and Sorting

## 13.1. Pagination

روش Pagination باید برای هر Endpoint مشخص باشد.

روش‌های قابل بررسی:

- Offset-based Pagination
- Page-based Pagination
- Cursor-based Pagination

انتخاب روش باید بر اساس اندازه داده، ترتیب‌پذیری، نیاز به صفحات پایدار و عملکرد Backend انجام شود.

## 13.2. Pagination Metadata

نمونه مفهومی:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 120,
    "total_pages": 6
  }
}
```

این ساختار نمونه است و قرارداد قطعی محسوب نمی‌شود.

## 13.3. Filtering

فیلترها باید:

- دارای نام مشخص باشند.
- نوع داده مشخص داشته باشند.
- محدودیت معتبر داشته باشند.
- از نظر امنیتی در Backend اعتبارسنجی شوند.
- با Pagination سازگار باشند.

## 13.4. Sorting

ترتیب داده باید صریح باشد.

Frontend نباید فرض کند ترتیب پیش‌فرض Backend همیشه ثابت است.

برای داده‌های حساس به زمان، مبلغ یا وضعیت عملیاتی، معیار مرتب‌سازی باید روشن باشد.

## 13.5. Large Data Sets

برای داده‌های حجیم:

- از دریافت غیرضروری تمام داده‌ها جلوگیری شود.
- فیلتر و صفحه‌بندی سمت Backend ترجیح داده شود.
- تعداد درخواست‌ها کنترل شود.
- حجم پاسخ محدود باشد.
- عملیات Export از APIهای مخصوص استفاده کند.

---

# 14. API Versioning and Compatibility

## 14.1. Versioning

سیاست نسخه‌بندی باید در سطح API مشخص شود.

روش‌های قابل بررسی:

- URL Versioning
- Header Versioning
- Media Type Versioning
- Versionless Backward-Compatible Evolution

هیچ روشی در این سند تصویب نمی‌شود.

## 14.2. Breaking Changes

موارد زیر ممکن است Breaking Change محسوب شوند:

- حذف Endpoint
- حذف فیلد الزامی
- تغییر نوع داده
- تغییر معنای فیلد
- تغییر واحد اندازه‌گیری
- تغییر ساختار پاسخ
- تغییر معنای Status Code
- تغییر رفتار احراز هویت
- تغییر قواعد Pagination

## 14.3. Deprecation

برای APIهای منسوخ‌شونده باید:

1. وضعیت Deprecation مشخص شود.
2. مصرف‌کنندگان شناسایی شوند.
3. جایگزین معرفی شود.
4. زمان‌بندی مهاجرت تعیین شود.
5. سازگاری نسخه‌های قبلی ارزیابی شود.
6. حذف نهایی با مجوز و برنامه مشخص انجام شود.

## 14.4. Frontend Compatibility

Frontend باید در برابر تغییرات غیرشکننده و توسعه تدریجی Backend مقاوم باشد.

با این حال، پذیرش بی‌قیدوشرط هر فیلد ناشناخته یا داده ناسازگار مجاز نیست.

سیاست Unknown Fields باید برای هر قرارداد مشخص شود.

---

# 15. Long-Running Operations

## 15.1. Problem Definition

برخی عملیات ممکن است زمان بیشتری از یک درخواست معمول HTTP نیاز داشته باشند.

نمونه‌ها:

- شبیه‌سازی‌های علمی HyDroMA
- پردازش داده‌های ماهواره‌ای
- تحلیل حجم زیاد داده
- تولید گزارش‌های پیچیده
- پردازش فایل‌های بزرگ
- محاسبات MRV

## 15.2. Asynchronous Job Pattern

در صورت نیاز، عملیات طولانی می‌تواند با الگوی Job مدیریت شود.

جریان مفهومی:

```text
Frontend
   |
   | Submit Request
   v
Backend
   |
   | Create Job
   v
Job Identifier
   |
   v
Frontend receives job_id
   |
   v
Status Monitoring
   |
   v
Completed / Failed / Cancelled
   |
   v
Retrieve Result
```

این الگو نیازمند قرارداد واقعی Backend است.

## 15.3. Job States

وضعیت‌های احتمالی:

- QUEUED
- ACCEPTED
- RUNNING
- COMPLETED
- FAILED
- CANCELLED
- EXPIRED

این فهرست پیشنهادی است.

معنای دقیق وضعیت‌ها، انتقال مجاز و نهایی بودن آن‌ها باید توسط Backend تعریف شود.

## 15.4. Polling

در صورت استفاده از Polling:

- فاصله درخواست‌ها باید کنترل شود.
- Polling پس از وضعیت نهایی متوقف شود.
- در زمان خروج از صفحه مدیریت شود.
- درخواست‌های هم‌زمان تکراری ایجاد نشوند.
- محدودیت نرخ Backend رعایت شود.

## 15.5. SSE and WebSocket

در صورت نیاز به به‌روزرسانی بلادرنگ، گزینه‌های زیر قابل بررسی هستند:

- Server-Sent Events
- WebSocket
- Polling

انتخاب باید بر اساس نیاز واقعی، پیچیدگی زیرساخت، مقیاس، امنیت و قابلیت بازیابی ارتباط انجام شود.

استفاده از WebSocket یا SSE صرفاً به‌دلیل جذابیت فنی توصیه نمی‌شود.

## 15.6. Job Completion Integrity

پذیرفته شدن درخواست ایجاد Job به‌معنای تکمیل عملیات نیست.

همچنین:

- RUNNING به‌معنای موفقیت نیست.
- COMPLETED به‌تنهایی اعتبار علمی نتیجه را ثابت نمی‌کند.
- دریافت فایل خروجی به‌تنهایی اعتبارسنجی نتیجه نیست.

اعتبار نتیجه باید از طریق قرارداد اختصاصی دامنه بررسی شود.

---

# 16. HyDroMA Scientific API Requirements

این بخش برای جلوگیری از اشتباه میان داده دریافتی، نتیجه محاسباتی و خروجی علمی معتبر تدوین شده است.

## 16.1. Scientific Data Contract

داده‌های علمی باید همراه با اطلاعات معنایی لازم منتقل شوند.

اطلاعات موردنیاز بر حسب نوع داده:

- Variable Name
- Variable Definition
- Value
- Unit
- Spatial Scope
- Temporal Scope
- Dataset Identifier
- Dataset Version
- Model Identifier
- Model Version
- Input Version
- Configuration Version
- Processing Timestamp
- Provenance Metadata
- Quality Indicators

تمام فیلدها برای تمام Endpointها الزامی نیستند؛ قرارداد هر دامنه باید موارد موردنیاز را تعیین کند.

## 16.2. Units

واحد اندازه‌گیری باید صریح باشد.

نمونه:

```json
{
  "parameter": "precipitation",
  "value": 245.6,
  "unit": "mm",
  "period": "annual"
}
```

Frontend نباید واحد را از نام متغیر، متن صفحه یا حدس توسعه‌دهنده استخراج کند.

## 16.3. Numeric Precision

داده‌های علمی ممکن است به دقت عددی مشخص نیاز داشته باشند.

Frontend نباید:

- دقت علمی را بدون مجوز کاهش دهد.
- مقدار خام را با مقدار نمایشی اشتباه بگیرد.
- داده علمی را به‌صورت ناخواسته گرد کند.
- مقادیر Null را به صفر تبدیل کند.
- مقدار نامعتبر را معتبر نمایش دهد.

مقدار نمایشی باید از مقدار خام قابل تفکیک باشد.

## 16.4. Null and Missing Data

موارد زیر نباید معادل یکدیگر تلقی شوند:

- صفر
- Null
- داده مفقود
- داده نامعتبر
- داده برآوردی
- داده جایگزین‌شده
- داده خارج از محدوده اعتبار

قرارداد باید معنای هر وضعیت را مشخص کند.

## 16.5. Scientific Model Execution

Frontend باید میان این وضعیت‌ها تفاوت قائل شود:

1. درخواست محاسبه ثبت شده است.
2. پردازش آغاز شده است.
3. پردازش در حال انجام است.
4. پردازش با خطا مواجه شده است.
5. پردازش پایان یافته است.
6. نتیجه دریافت شده است.
7. نتیجه از نظر قرارداد و کیفیت داده بررسی شده است.
8. نتیجه برای استفاده موردنظر تأیید شده است.

این مراحل نباید به یک وضعیت ساده Success تقلیل یابند.

## 16.6. Model Provenance

نتیجه علمی باید تا حد امکان به موارد زیر متصل باشد:

- Model ID
- Model Version
- Dataset Version
- Input Parameters
- Input Dataset
- Spatial Extent
- Temporal Extent
- Unit System
- Execution Timestamp
- Processing Environment
- Validation Status

## 16.7. MRV and Carbon Data

در ارتباط با داده‌های MRV و کربن:

- نتیجه داخلی HyDroMA نباید خودکار اعتبار رسمی پیدا کند.
- برآورد داخلی نباید با Credit صادرشده برابر تلقی شود.
- وضعیت Registry باید از مرجع مربوط دریافت شود.
- منبع داده و زنجیره Provenance باید قابل ردیابی باشد.
- Frontend نباید وضعیت اعتبار رسمی را مستقلاً تولید کند.

## 16.8. Map and Geospatial APIs

قراردادهای مکانی باید موارد زیر را مشخص کنند:

- Coordinate Reference System
- Coordinate Order
- Geometry Type
- Bounding Box
- Spatial Resolution
- Spatial Extent
- NoData Semantics
- Coordinate Precision
- Time Dimension
- Data Version

Frontend نباید ترتیب طول و عرض جغرافیایی را حدس بزند.

---

# 17. Nojin Marketplace API Requirements

## 17.1. Product API

قرارداد محصول باید بر اساس نیاز شامل موارد زیر باشد:

- Product ID
- Product Name
- Description
- Category
- Price
- Currency
- Availability
- Seller ID
- Media
- Product Status
- Version or Updated Timestamp

## 17.2. Inventory API

موجودی قابل نمایش باید با وضعیت مرجع Backend سازگار باشد.

Frontend نباید صرفاً بر اساس داده Cache شده، موجودی قطعی اعلام کند.

## 17.3. Cart API

موارد مهم:

- Product Identifier
- Quantity
- Price Snapshot
- Availability
- Validation Result
- Cart Version

قیمت نهایی باید طبق قرارداد Backend تعیین شود.

## 17.4. Order API

Frontend باید وضعیت‌های سفارش را مطابق قرارداد Backend نمایش دهد.

نمونه وضعیت‌های احتمالی:

- DRAFT
- PENDING
- CONFIRMED
- PROCESSING
- SHIPPED
- DELIVERED
- CANCELLED
- REFUNDED

این فهرست نمونه است و وضعیت واقعی باید از Backend استخراج شود.

## 17.5. Payment API

پرداخت نیازمند کنترل ویژه است.

Frontend نباید:

- پرداخت را صرفاً بر اساس کلیک کاربر موفق اعلام کند.
- پاسخ Redirect را معادل تأیید قطعی پرداخت بداند.
- نتیجه پرداخت را از Query Parameter بدون تأیید Backend بپذیرد.
- مبلغ را بدون اعتبارسنجی Backend نهایی کند.
- درخواست پرداخت را بدون کنترل تکرار ارسال کند.

مرجع نهایی وضعیت پرداخت باید Backend و سازوکار معتبر تأیید پرداخت باشد.

## 17.6. Financial Data Integrity

برای داده‌های مالی:

- مبلغ باید دارای واحد پول مشخص باشد.
- قواعد Decimal باید حفظ شوند.
- تبدیل ناخواسته Decimal به Floating Point ممنوع است.
- اعداد نمایشی نباید جایگزین مقادیر مرجع شوند.
- محاسبه قطعی مالی باید در Backend انجام شود.
- Frontend نباید مانده مالی را به‌عنوان حقیقت مستقل نگهداری کند.

## 17.7. Wallet and Ledger

داده‌های کیف پول و دفتر مالی باید از APIهای مرجع دریافت شوند.

تغییر ظاهری مقدار در UI به‌معنای ثبت تراکنش نیست.

هر عملیات مالی باید شناسه و وضعیت قابل پیگیری داشته باشد.

---

# 18. File Upload and Download

## 18.1. Upload Requirements

بارگذاری فایل باید بر اساس قرارداد مشخص انجام شود.

موارد ضروری:

- Allowed File Types
- Maximum File Size
- File Count Limit
- Upload Endpoint
- Authentication Requirements
- Upload Response
- Validation Errors
- Processing Status
- Cancellation Policy

## 18.2. Frontend Validation

Frontend SHOULD پیش از ارسال، کنترل‌های اولیه را انجام دهد:

- پسوند فایل
- اندازه فایل
- تعداد فایل‌ها
- انتخاب فایل معتبر
- وجود فایل
- محدودیت‌های UX

اما اعتبارسنجی امنیتی و محتوایی واقعی باید در Backend انجام شود.

پسوند فایل به‌تنهایی نشان‌دهنده نوع واقعی فایل نیست.

## 18.3. Upload Progress

در صورت پشتیبانی ابزار انتقال:

- درصد پیشرفت نمایش داده شود.
- وضعیت Pending مشخص باشد.
- خطا قابل تشخیص باشد.
- امکان لغو در صورت پشتیبانی وجود داشته باشد.
- ارسال مجدد بدون بررسی وضعیت قبلی انجام نشود.

## 18.4. Download Requirements

برای دانلود:

- Content-Type بررسی شود.
- نام فایل از منبع معتبر دریافت شود.
- نوع محتوای مورد انتظار کنترل شود.
- فایل غیرقابل اعتماد به‌صورت ناامن اجرا نشود.
- دسترسی به فایل در Backend کنترل شود.

## 18.5. Large File Handling

برای فایل‌های بزرگ، گزینه‌های زیر قابل بررسی هستند:

- Chunked Upload
- Resumable Upload
- Signed URL
- Streaming Download
- Background Processing

هرکدام نیازمند طراحی و قرارداد مشخص هستند.

---

# 19. Rate Limiting and Resource Protection

## 19.1. Rate Limit Handling

در صورت دریافت 429:

- Frontend باید وضعیت محدودیت را تشخیص دهد.
- در صورت وجود Retry-After باید آن را رعایت کند.
- درخواست‌های جدید غیرضروری متوقف شوند.
- کاربر از محدودیت موقت مطلع شود.
- Retry نامحدود ممنوع است.

## 19.2. Request Deduplication

در درخواست‌های خواندنی مشابه، در صورت سازگاری با رفتار API، Deduplication قابل بررسی است.

درخواست‌های دارای اثر جانبی نباید بدون سیاست صریح با یکدیگر ادغام شوند.

## 19.3. Request Volume

Frontend باید از الگوهای زیر جلوگیری کند:

- درخواست در هر Render
- Polling بدون محدودیت
- جست‌وجوی بدون Debounce
- درخواست تکراری در تغییرات سریع
- بارگذاری تمام داده‌های حجیم
- درخواست هم‌زمان غیرضروری به Endpointهای یکسان

---

# 20. Network Resilience and Offline Behavior

## 20.1. Network Awareness

Frontend باید وضعیت‌های زیر را از یکدیگر تفکیک کند:

- Online
- Offline
- Network Unstable
- Backend Unavailable
- Request Timeout
- Partial Service Failure

تشخیص Online در مرورگر تضمین نمی‌کند که Backend قابل دسترسی است.

## 20.2. Offline Behavior

در حالت Offline:

- داده Cache شده فقط با برچسب وضعیت مشخص نمایش داده شود.
- داده قدیمی نباید به‌عنوان داده زنده معرفی شود.
- عملیات غیرقابل انجام باید غیرفعال یا متوقف شوند.
- عملیات حساس نباید به‌صورت موفقیت قطعی نمایش داده شوند.
- وضعیت Sync باید روشن باشد.

## 20.3. Offline Financial Operations

در حالت Offline:

- پرداخت قطعی نباید تأیید شود.
- انتقال وجه نباید موفق اعلام شود.
- سفارش نباید بدون تأیید Backend نهایی تلقی شود.
- موجودی مالی نباید به‌صورت قطعی تغییر کند.

## 20.4. Offline Scientific Operations

در صورت وجود محاسبات محلی:

- نتیجه باید از نتیجه Backend تفکیک شود.
- نسخه مدل مشخص باشد.
- نسخه داده مشخص باشد.
- محدودیت‌های محاسباتی ثبت شوند.
- وضعیت اعتبار نتیجه روشن باشد.

---

# 21. Correlation IDs and Request Traceability

## 21.1. Request Identification

در صورت پشتیبانی Backend، هر درخواست باید دارای شناسه قابل ردیابی باشد.

نمونه:

```http
X-Request-ID: unique-request-id
```

نام Header باید مطابق قرارداد واقعی تعیین شود.

## 21.2. Correlation

برای جریان‌های چندمرحله‌ای، امکان ارتباط میان درخواست‌ها باید فراهم باشد.

نمونه:

```text
User Action
    |
    v
Frontend Request
    |
    v
API Gateway
    |
    v
Backend Service
    |
    v
Worker / External Service
```

شناسه مشترک می‌تواند پیگیری عملیات را تسهیل کند.

## 21.3. User-Facing Reference

در خطاهای مهم، در صورت وجود شناسه معتبر، نمایش Reference ID به کاربر مفید است.

این شناسه نباید حاوی اطلاعات محرمانه باشد.

## 21.4. Trace Context

استفاده از استانداردهای Distributed Tracing مانند W3C Trace Context قابل بررسی است.

انتخاب و پیاده‌سازی باید با زیرساخت Observability پروژه هماهنگ باشد.

---

# 22. API Security Requirements

این بخش اصول پایه امنیت ارتباط را تعیین می‌کند و جایگزین سند تخصصی امنیت نیست.

## 22.1. Transport Security

ارتباطات حساس باید از کانال امن استفاده کنند.

## 22.2. CORS

CORS باید در Backend و Gateway بر اساس Originهای مجاز تنظیم شود.

استفاده از تنظیمات باز و غیرضروری ممنوع است.

## 22.3. CSRF

در صورت استفاده از Cookie-based Authentication، نیاز به محافظت CSRF باید بررسی و اعمال شود.

## 22.4. XSS

داده دریافتی از API نباید بدون کنترل به‌عنوان HTML قابل اجرا وارد DOM شود.

## 22.5. SSRF Awareness

Frontend نباید به‌تنهایی مسئول حفاظت در برابر SSRF تلقی شود.

Endpointهایی که URL خارجی دریافت می‌کنند باید در Backend کنترل شوند.

## 22.6. Sensitive Data

موارد زیر نباید وارد Log یا Telemetry شوند:

- Password
- Access Token
- Refresh Token
- Session Secret
- اطلاعات بانکی حساس
- داده‌های شخصی غیرضروری
- داده‌های محرمانه علمی
- کلیدهای خصوصی

## 22.7. Authorization Enforcement

تمام Endpointهای حساس باید در Backend مجوز دسترسی را بررسی کنند.

---

# 23. API Mocking and Development Environment

## 23.1. Mock Usage

Mock API می‌تواند برای توسعه و آزمون استفاده شود.

اما Mock نباید به‌عنوان شاهد صحت Backend تلقی شود.

## 23.2. Mock Contract

Mock باید با قرارداد واقعی API سازگار باشد.

Mockهای مستقل و بدون ارتباط با Contract ممکن است باعث ایجاد Frontend ناسازگار شوند.

## 23.3. Mock Data Classification

داده Mock باید به‌وضوح مشخص باشد.

داده آزمایشی نباید در محیط عملیاتی به‌عنوان داده واقعی نمایش داده شود.

## 23.4. Environment Isolation

محیط‌های زیر باید از یکدیگر تفکیک شوند:

- Local Development
- Automated Testing
- Integration Testing
- Staging
- Production

Base URL و تنظیمات محیط باید از Configuration کنترل‌شده دریافت شوند.

اطلاعات محرمانه نباید در Bundle عمومی Frontend قرار گیرند.

---

# 24. Testing and Contract Verification

## 24.1. Contract Testing

قرارداد API باید در آزمون‌های خودکار قابل بررسی باشد.

آزمون‌ها باید در صورت امکان موارد زیر را پوشش دهند:

- Endpoint Availability
- Request Schema
- Response Schema
- Required Fields
- Status Codes
- Error Structures
- Authentication Requirements
- Authorization Behavior
- Pagination
- Version Compatibility

## 24.2. Integration Testing

Integration Testing باید ارتباط واقعی Frontend و Backend را در محیط کنترل‌شده بررسی کند.

موارد مهم:

- درخواست موفق
- پاسخ نامعتبر
- خطای احراز هویت
- عدم دسترسی
- Timeout
- Network Failure
- Rate Limiting
- تغییر قرارداد
- پاسخ ناقص
- درخواست تکراری
- لغو درخواست

## 24.3. Domain-Specific Testing

### HyDroMA

- واحدهای اندازه‌گیری
- مقادیر Null
- دقت عددی
- Provenance
- نسخه مدل
- نسخه داده
- محدوده مکانی
- محدوده زمانی
- وضعیت Job
- اعتبارسنجی نتیجه

### Nojin Marketplace

- قیمت
- موجودی
- سفارش
- پرداخت
- کیف پول
- Decimal Integrity
- Duplicate Submission
- وضعیت تراکنش

### Eco Nojin

- ثبت‌نام
- احراز هویت
- مجوزها
- پروفایل
- داده‌های روستاها
- ارتباط میان محصولات
- دسترسی کاربران

## 24.4. Failure Injection

در محیط آزمون باید سناریوهای شکست شبیه‌سازی شوند:

- قطع شبکه
- تأخیر زیاد
- پاسخ 500
- پاسخ 503
- پاسخ نامعتبر
- قطع اتصال هنگام ارسال
- قطع اتصال هنگام دریافت
- تغییر Session
- پایان Job
- پاسخ تکراری

## 24.5. Evidence Requirements

گزارش آزمون باید شامل موارد زیر باشد:

- Test ID
- Contract Version
- Environment
- Endpoint
- Input
- Expected Result
- Actual Result
- Execution Time
- Pass/Fail
- Evidence
- Defect Reference

موفقیت یک Mock Test به‌تنهایی معادل موفقیت Integration Test نیست.

---

# 25. Observability and Error Reporting

## 25.1. API Metrics

شاخص‌های قابل پایش:

- Request Count
- Error Rate
- Response Time
- Timeout Rate
- Retry Count
- Rate Limit Count
- Endpoint Availability
- Contract Failure Count

## 25.2. Frontend Error Tracking

خطاهای زیر باید در صورت نیاز قابل شناسایی باشند:

- Request Failure
- Response Parsing Failure
- Contract Validation Failure
- Authentication Failure
- Timeout
- Cancellation
- Unexpected Response
- Duplicate Submission

## 25.3. Error Context

Context ثبت خطا باید حداقل و هدفمند باشد.

موارد مجاز احتمالی:

- Endpoint Identifier
- HTTP Method
- Status Code
- Request ID
- Application Version
- Environment
- Timestamp
- Error Category

اطلاعات حساس نباید ثبت شوند.

## 25.4. Performance Monitoring

زمان پاسخ باید از دید کاربر نیز بررسی شود.

درخواست‌های زیر باید اولویت پایش داشته باشند:

- Dashboard Data
- Scientific Results
- Map Data
- Marketplace Search
- Product Details
- Orders
- Payment Status
- Financial Summary

---

# 26. API Lifecycle and Change Management

## 26.1. API Change Workflow

فرآیند پیشنهادی:

```text
Change Proposal
      |
      v
Contract Review
      |
      v
Breaking Change Analysis
      |
      v
Backend Implementation
      |
      v
Contract Tests
      |
      v
Frontend Integration
      |
      v
Integration Validation
      |
      v
Release Approval
      |
      v
Deployment
      |
      v
Monitoring
```

## 26.2. Change Classification

هر تغییر باید یکی از دسته‌های زیر را داشته باشد:

- Non-Breaking
- Potentially Breaking
- Breaking
- Security Critical
- Data Integrity Critical
- Operational Critical

## 26.3. Ownership

مسئولیت‌ها باید مشخص باشند:

| Role | Responsibility |
|---|---|
| Backend Owner | صحت پیاده‌سازی API |
| Frontend Owner | صحت مصرف API |
| Security Reviewer | بررسی امنیتی |
| QA | آزمون قرارداد و Integration |
| Product Owner | تعیین نیاز و تأیید رفتار محصول |
| Project Owner | تصمیم درباره تغییرات حساس |

## 26.4. Documentation

هر API عملیاتی باید مستندات قابل نگهداری داشته باشد.

مستندات باید با نسخه واقعی Backend هماهنگ باشند.

---

# 27. Recommended Implementation Workflow

اجرای این استاندارد باید مرحله‌ای باشد.

## Phase 1 — Discovery

- استخراج فهرست APIهای واقعی
- شناسایی Backend Services
- بررسی مستندات موجود
- بررسی Endpointهای مصرف‌شده توسط Frontend
- شناسایی APIهای تکراری
- شناسایی قراردادهای ناقص
- بررسی Authentication و Authorization

خروجی:

API Inventory

## Phase 2 — Contract Audit

- تطبیق OpenAPI با Backend
- بررسی Request Schema
- بررسی Response Schema
- بررسی Error Responses
- بررسی Status Codes
- بررسی Versioning
- شناسایی Contract Drift

خروجی:

API Contract Audit

## Phase 3 — Integration Architecture

- تعیین API Boundary
- طراحی API Client
- طراحی Error Normalization
- تعیین Service Boundaries
- تعیین Runtime Validation Strategy
- تعیین Cancellation Policy
- تعیین Retry Policy

خروجی:

Approved Integration Architecture Proposal

## Phase 4 — Implementation

- ایجاد یا اصلاح API Client
- پیاده‌سازی Service Layer
- اتصال صفحات
- پیاده‌سازی Error Handling
- پیاده‌سازی Loading States
- پیاده‌سازی Request Cancellation
- اتصال Authentication
- اتصال Correlation IDs

خروجی:

Implemented API Integration

## Phase 5 — Verification

- Unit Testing
- Contract Testing
- Integration Testing
- Failure Testing
- Security Review
- Performance Testing
- Domain-Specific Validation

خروجی:

API Integration Validation Report

## Phase 6 — Acceptance

- بررسی شواهد
- رفع Defectها
- تأیید سازگاری
- ثبت محدودیت‌ها
- ثبت تصمیمات باز
- تأیید مالک پروژه

خروجی:

API Integration Acceptance Record

---

# 28. Acceptance Criteria

این معیارها پیشنهادی هستند و باید پیش از استفاده اجرایی بررسی شوند.

| ID | Acceptance Criterion | Required Evidence |
|---|---|---|
| API-001 | مرز ارتباطی Frontend و Backend مشخص باشد | Architecture Review |
| API-002 | درخواست‌های API دارای الگوی مدیریت‌شده باشند | Code Inspection |
| API-003 | قرارداد Endpointهای مصرف‌شده مشخص باشد | API Inventory |
| API-004 | Request Schema بررسی شود | Contract Tests |
| API-005 | Response Schema بررسی شود | Runtime/Contract Tests |
| API-006 | HTTP Status Codes صحیح مدیریت شوند | Integration Tests |
| API-007 | Error Normalization وجود داشته باشد | Unit Tests |
| API-008 | خطاهای Network و Timeout تفکیک شوند | Failure Tests |
| API-009 | Retry محدود و کنترل‌شده باشد | Test Evidence |
| API-010 | Cancellation در عملیات مناسب پشتیبانی شود | Integration Tests |
| API-011 | عملیات حساس در برابر تکرار کنترل شوند | Idempotency Evidence |
| API-012 | Authentication مطابق قرارداد واقعی باشد | Security Review |
| API-013 | Authorization در Backend اعمال شود | Backend Evidence |
| API-014 | Token و Secret افشا نشوند | Security Review |
| API-015 | Pagination و Filtering مطابق قرارداد باشند | Contract Tests |
| API-016 | تغییرات Breaking شناسایی شوند | Compatibility Tests |
| API-017 | Long-running Jobs وضعیت شفاف داشته باشند | Job Lifecycle Tests |
| API-018 | داده‌های علمی دارای Unit و Provenance مناسب باشند | Scientific Validation |
| API-019 | وضعیت پرداخت فقط از مرجع معتبر دریافت شود | Financial Integration Tests |
| API-020 | Decimal Integrity حفظ شود | Financial Tests |
| API-021 | Upload و Download اعتبارسنجی شوند | File Handling Tests |
| API-022 | Rate Limit مدیریت شود | 429 Scenario Test |
| API-023 | Request ID قابل ردیابی باشد | Observability Evidence |
| API-024 | خطاهای قرارداد قابل شناسایی باشند | Contract Failure Test |
| API-025 | Mock با قرارداد واقعی هماهنگ باشد | Mock Validation |
| API-026 | محیط‌های توسعه و عملیاتی تفکیک شوند | Configuration Audit |
| API-027 | Offline Behavior شفاف باشد | Offline Test |
| API-028 | هیچ عملیات مالی Offline قطعی اعلام نشود | Financial Offline Test |
| API-029 | API Documentation قابل ردیابی باشد | Documentation Review |
| API-030 | تغییرات حساس بدون تأیید انجام نشوند | Change Approval Record |

## 28.1. Acceptance Rule

وجود کد، فایل، مستندات یا Endpoint به‌تنهایی اثبات‌کننده تکمیل قابلیت نیست.

برای پذیرش هر معیار باید شواهد مناسب وجود داشته باشد.

وضعیت‌های پیشنهادی:

- NOT_STARTED
- SPECIFIED
- IMPLEMENTED
- TESTED
- VALIDATED
- ACCEPTED
- BLOCKED
- REJECTED

---

# 29. Risks and Failure Scenarios

| Risk ID | Risk | Impact | Mitigation |
|---|---|---|---|
| API-R01 | Contract Drift | اختلال در مصرف API | Contract Testing |
| API-R02 | Incorrect Type Assumptions | خطای داده | Runtime Validation |
| API-R03 | Duplicate Financial Requests | خسارت مالی | Idempotency |
| API-R04 | Unauthorized Access | افشای داده | Backend Authorization |
| API-R05 | Token Exposure | آسیب امنیتی | Secure Credential Handling |
| API-R06 | Infinite Retry | فشار به Backend | Bounded Retry |
| API-R07 | Stale Data | تصمیم نادرست کاربر | Freshness Metadata |
| API-R08 | Invalid Scientific Units | نتیجه علمی اشتباه | Unit Validation |
| API-R09 | False Simulation Success | گزارش علمی نامعتبر | Job and Result Validation |
| API-R10 | False Payment Success | اختلاف مالی | Backend Confirmation |
| API-R11 | API Version Mismatch | اختلال انتشار | Compatibility Management |
| API-R12 | Excessive Polling | افزایش بار زیرساخت | Polling Control |
| API-R13 | Incomplete Error Mapping | تجربه کاربری نامناسب | Error Taxonomy |
| API-R14 | Mock/Backend Mismatch | خطای Integration | Contract-Based Mocking |
| API-R15 | Network Instability | عملیات ناقص | Resilience Strategy |
| API-R16 | Sensitive Logging | نقض حریم خصوصی | Data Minimization |

---

# 30. Open Decisions

هیچ‌یک از موارد زیر در این سند تصویب نشده‌اند.

| Decision ID | Decision | Status |
|---|---|---|
| API-D01 | انتخاب ساختار نهایی API Client | OPEN |
| API-D02 | تعیین استاندارد مستندسازی API | OPEN |
| API-D03 | تعیین سیاست تولید Type از Contract | OPEN |
| API-D04 | انتخاب Runtime Schema Validator | OPEN |
| API-D05 | تعیین ساختار Response Envelope | OPEN |
| API-D06 | تعیین استاندارد Error Envelope | OPEN |
| API-D07 | تعیین سیاست API Versioning | OPEN |
| API-D08 | تعیین سیاست Timeout بر اساس نوع عملیات | OPEN |
| API-D09 | تعیین سیاست Retry و Backoff | OPEN |
| API-D10 | تعیین سیاست Idempotency | OPEN |
| API-D11 | تعیین سیاست Long-running Job | OPEN |
| API-D12 | انتخاب Polling یا SSE یا WebSocket در موارد لازم | OPEN |
| API-D13 | تعیین استاندارد Correlation ID | OPEN |
| API-D14 | تعیین سیاست Pagination | OPEN |
| API-D15 | تعیین سیاست Upload و Download | OPEN |
| API-D16 | تعیین ابزار Contract Testing | OPEN |
| API-D17 | تعیین راهبرد Mocking | OPEN |
| API-D18 | تعیین سیاست API Deprecation | OPEN |
| API-D19 | تعیین سیاست مدیریت APIهای خارجی | OPEN |
| API-D20 | تعیین سیاست Offline API Integration | OPEN |
| API-D21 | تعیین ساختار APIهای علمی HyDroMA | OPEN |
| API-D22 | تعیین ساختار APIهای مالی Marketplace | OPEN |
| API-D23 | تعیین سیاست سازگاری Frontend و Backend | OPEN |
| API-D24 | تعیین مالکیت و مسئولیت نگهداری قراردادها | OPEN |

---

# 31. Implementation Restrictions

تا زمان بررسی و تصویب معماری واقعی:

1. هیچ کتابخانه API Client به‌عنوان ابزار قطعی انتخاب نشود.
2. هیچ پروتکل ارتباطی جدید بدون بررسی نیاز اضافه نشود.
3. هیچ API فرضی به‌عنوان API عملیاتی معرفی نشود.
4. هیچ قرارداد جدیدی بدون بررسی Backend ساخته نشود.
5. هیچ تغییر Breaking در Backend بدون کنترل وابستگی‌ها انجام نشود.
6. هیچ عملیات مالی با موفقیت ظاهری در Frontend تأیید نشود.
7. هیچ نتیجه علمی بدون وضعیت اعتبار مناسب معتبر اعلام نشود.
8. هیچ Token یا Secret در کد عمومی قرار نگیرد.
9. هیچ Mock به‌عنوان شواهد عملکرد واقعی Backend پذیرفته نشود.
10. هیچ تغییر معماری یا عملیاتی حساس بدون مجوز مالک انجام نشود.

---

# 32. Definition of Done

این استاندارد زمانی در سطح اجرایی قابل پذیرش است که:

- قرارداد APIهای موردنیاز استخراج شده باشد.
- قراردادها با Backend واقعی تطبیق داده شده باشند.
- مرزهای ارتباطی مشخص شده باشند.
- مدیریت خطا یکپارچه شده باشد.
- رفتار Timeout و Retry بررسی شده باشد.
- امنیت ارتباط ارزیابی شده باشد.
- آزمون‌های Contract و Integration اجرا شده باشند.
- عملیات حساس مالی و علمی اعتبارسنجی شده باشند.
- خطاهای مهم قابل ردیابی باشند.
- مستندات با نسخه واقعی API هماهنگ باشند.
- Defectهای بحرانی رفع شده باشند.
- شواهد پذیرش ثبت شده باشند.
- تصمیمات باز مشخص باشند.
- تأیید نهایی مالک پروژه اخذ شده باشد.

---

# 33. Final Governance Statement

این سند چارچوب پیشنهادی یکپارچه‌سازی Frontend و Backend در اکوسیستم Eco Nojin است.

هدف آن ایجاد ارتباطی قابل اعتماد، امن، قابل آزمون و قابل نگهداری میان محصولات Eco Nojin، HyDroMA و Nojin Marketplace است.

**اصل بنیادین این استاندارد:**

Frontend مصرف‌کننده قراردادهای Backend است؛ نه مرجع مستقل حقیقت برای داده‌های علمی، مالی، هویتی یا عملیاتی.

هر قابلیت باید بر اساس قرارداد واقعی، پیاده‌سازی واقعی، آزمون معتبر و شواهد قابل بررسی ارزیابی شود.

هیچ قابلیت صرفاً به‌دلیل وجود رابط کاربری، تعریف Type، فایل مستندات، Mock یا پاسخ ظاهراً موفق API تکمیل‌شده محسوب نمی‌شود.

**Document Status: DRAFT — PROPOSED — NOT APPROVED**

**Approval Authority: Project Owner**

**End of Document**