# Frontend API Integration, Data Contracts and Error Handling Standards

**Document ID:** EN-FE-STD-034  
**Version:** 1.0.0  
**Status:** DRAFT — PROPOSED — NOT APPROVED  
**Classification:** Frontend Architecture / API Integration / Data Integrity  
**Scope:** Eco Nojin Ecosystem — Eco Nojin, HyDroMA, Nojin Marketplace  
**Date:** 2026-11-18

---

## 1. Purpose

این سند استانداردهای پیشنهادی ارتباط فرانت‌اند با سرویس‌های Backend، مدیریت قراردادهای API، انتقال داده، اعتبارسنجی پاسخ‌ها، مدیریت خطا و حفظ یکپارچگی داده را تعریف می‌کند.

هدف آن ایجاد یک الگوی ارتباطی پایدار، امن، قابل آزمون و قابل نگهداری میان رابط کاربری و سرویس‌های مختلف اکوسیستم Eco Nojin است.

این استاندارد باید از مشکلات زیر جلوگیری کند:

- وابستگی مستقیم صفحات به جزئیات پیاده‌سازی API
- تکرار منطق درخواست‌های HTTP در کامپوننت‌ها
- تفسیر نادرست پاسخ‌های Backend
- نمایش موفقیت کاذب در عملیات مالی و علمی
- مدیریت ناقص خطاهای شبکه و سرور
- ارسال داده‌های ناسازگار یا ناقص
- استفاده از داده‌های قدیمی بدون اطلاع کاربر
- ناسازگاری میان نسخه‌های فرانت‌اند و Backend
- نشت اطلاعات حساس در Log یا پیام خطا
- مدیریت نامعتبر درخواست‌های هم‌زمان
- اختلال در تجربه کاربر هنگام قطع یا ضعف اینترنت

این سند مکمل استانداردهای مدیریت State، امنیت، آزمون، Observability، دسترس‌پذیری و مدیریت وابستگی‌ها است.

---

## 2. Scope

این استاندارد تمام ارتباطات فرانت‌اند با سرویس‌های داخلی و خارجی را پوشش می‌دهد.

### 2.1. Internal API Integration

شامل ارتباط با:

- Authentication Services
- User and Profile Services
- Scientific Engine Services
- Water and Soil Services
- Climate Services
- Agricultural Services
- Remote Sensing Services
- GIS and Spatial Services
- Simulation Services
- MRV Services
- Marketplace Services
- Product and Inventory Services
- Order Services
- Financial Services
- Wallet Services
- Tourism Services
- Notification Services
- Administrative Services
- Content Management Services

### 2.2. External API Integration

شامل ارتباط با:

- Weather Providers
- Satellite Data Providers
- Map Services
- Geospatial Data Providers
- Payment Gateways
- Identity Providers
- Notification Providers
- Analytics Services
- External Scientific Data Sources

### 2.3. Communication Types

این سند ارتباطات زیر را در بر می‌گیرد:

- REST APIs
- GraphQL APIs
- WebSocket Connections
- Server-Sent Events
- File Upload and Download
- Streaming Responses
- Asynchronous Job APIs
- Webhook-Related Client Workflows

انتخاب پروتکل نهایی باید براساس نیاز واقعی هر قابلیت انجام شود.

---

## 3. Core Architectural Principles

### 3.1. API Abstraction

کامپوننت‌های رابط کاربری نباید مستقیماً مسئول ساخت و مدیریت جزئیات ارتباط HTTP باشند.

ارتباط با Backend باید از یک لایه مشخص Data Access عبور کند.

### 3.2. Single Source of Truth

Backend مرجع حقیقت داده‌های پایدار و عملیاتی است.

موارد زیر نباید صرفاً بر اساس State محلی فرانت‌اند معتبر تلقی شوند:

- User Permissions
- Account Balances
- Wallet Balances
- Orders
- Payments
- Inventory
- Financial Transactions
- Official Scientific Results
- Model Execution Status
- MRV Verification Status

### 3.3. Contract-Driven Integration

فرانت‌اند و Backend باید بر اساس قراردادهای مشخص و قابل نسخه‌بندی با یکدیگر ارتباط برقرار کنند.

### 3.4. Explicit Data Validation

داده دریافتی از API نباید بدون بررسی ساختار و نوع داده، به‌عنوان داده معتبر استفاده شود.

### 3.5. Predictable Error Handling

تمام خطاهای قابل انتظار باید مسیر مدیریت مشخص داشته باشند.

### 3.6. Fail Safely

در شرایط خطا، برنامه نباید نتیجه نامعتبر را به‌عنوان نتیجه موفق نمایش دهد.

### 3.7. Product Boundary Preservation

یکپارچه‌سازی نباید مرزهای منطقی محصولات Eco Nojin، HyDroMA و Nojin Marketplace را از بین ببرد.

---

## 4. Frontend API Architecture

### 4.1. Proposed Layered Model

معماری پیشنهادی ارتباط با API:

```text
Presentation Layer
       |
       v
Feature / Application Layer
       |
       v
Domain Services
       |
       v
API Client / Data Access Layer
       |
       v
Transport Adapter
       |
       v
Backend API Gateway / Services
```

این مدل مفهومی است و انتخاب ساختار نهایی پروژه نیازمند بررسی معماری موجود است.

### 4.2. Layer Responsibilities

| Layer | Responsibility |
|---|---|
| Presentation | نمایش داده و تعامل کاربر |
| Feature | اجرای سناریوهای کاربردی |
| Domain Services | قواعد و منطق دامنه در محدوده مجاز فرانت‌اند |
| Data Access | دریافت، ارسال و تبدیل داده |
| API Client | مدیریت درخواست‌ها و پاسخ‌ها |
| Transport Adapter | ارتباط با پروتکل انتقال |
| Backend | منطق اصلی، مجوزدهی و مرجع حقیقت |

### 4.3. Separation of Concerns

موارد زیر باید از کامپوننت‌های نمایشی جدا باشند:

- Base URL
- Authentication Handling
- Request Headers
- Serialization
- Response Parsing
- Error Normalization
- Retry Logic
- Timeout Policy
- Cancellation
- Request Correlation
- Contract Validation

### 4.4. Centralized API Configuration

تنظیمات API باید در یک محل کنترل‌شده نگهداری شوند.

موارد پیشنهادی:

- API Base URL
- Environment Configuration
- Request Timeout
- Default Headers
- Locale Configuration
- API Version
- Error Handling Policy
- Retry Policy

اطلاعات محرمانه نباید در تنظیمات عمومی فرانت‌اند قرار گیرند.

---

## 5. API Contract Standards

### 5.1. Contract Definition

هر Endpoint باید قرارداد مشخصی داشته باشد.

حداقل اطلاعات:

| Field | Description |
|---|---|
| Endpoint | مسیر API |
| HTTP Method | نوع درخواست |
| Purpose | هدف عملیاتی |
| Authentication | نیاز به احراز هویت |
| Authorization | الزامات مجوز |
| Request Schema | ساختار ورودی |
| Response Schema | ساختار خروجی |
| Error Responses | خطاهای قابل انتظار |
| Pagination | سیاست صفحه‌بندی |
| Rate Limit | محدودیت درخواست |
| Version | نسخه قرارداد |
| Deprecation | وضعیت بازنشستگی |

### 5.2. OpenAPI

استفاده از OpenAPI برای مستندسازی قراردادهای REST قابل بررسی است.

قرارداد API باید تا حد امکان منبع مشترک و قابل تطبیق میان Backend، فرانت‌اند و آزمون‌ها باشد.

### 5.3. Schema Validation

ساختار درخواست و پاسخ باید با Schema تعریف‌شده تطبیق داشته باشد.

ابزارهایی مانند Zod، Valibot، Ajv یا ابزارهای دیگر می‌توانند ارزیابی شوند؛ هیچ‌کدام در این سند انتخاب نهایی نیستند.

### 5.4. Type Safety

استفاده از TypeScript برای تعریف نوع داده‌های API پیشنهاد می‌شود.

با این حال، TypeScript به‌تنهایی داده دریافتی در Runtime را اعتبارسنجی نمی‌کند.

### 5.5. Contract Drift

تغییر Backend نباید بدون بررسی سازگاری باعث شکست خاموش فرانت‌اند شود.

تغییرات قرارداد باید قابل شناسایی و آزمون باشند.

---

## 6. Request Standards

### 6.1. Request Construction

درخواست‌های API باید از الگوی مشخص و یکسان پیروی کنند.

موارد مهم:

- HTTP Method صحیح
- URL معتبر
- Query Parameters
- Request Headers
- Content Type
- Request Body
- Authentication Context
- Correlation ID
- Timeout

### 6.2. HTTP Method Semantics

| Method | Intended Use |
|---|---|
| GET | دریافت داده |
| POST | ایجاد منبع یا اجرای عملیات |
| PUT | جایگزینی منبع |
| PATCH | تغییر جزئی منبع |
| DELETE | حذف منبع |

استفاده از Method باید با قرارداد واقعی Backend سازگار باشد.

### 6.3. Idempotency

عملیات غیرقابل تکرار یا دارای اثر مالی باید در صورت نیاز از سازوکار Idempotency پشتیبانی کنند.

برای مثال:

- ایجاد سفارش
- ثبت پرداخت
- ایجاد تراکنش
- ثبت درخواست برداشت
- ارسال عملیات حساس

فرانت‌اند نباید با تکرار یک درخواست نامطمئن باعث ایجاد عملیات تکراری شود.

### 6.4. Request Timeout

برای درخواست‌ها باید Timeout متناسب با نوع عملیات تعریف شود.

| Operation | Timeout Consideration |
|---|---|
| Read API | کوتاه و متناسب با تجربه کاربر |
| Authentication | متناسب با پاسخ سرویس هویت |
| File Upload | وابسته به اندازه و شبکه |
| Scientific Job Submission | تفکیک پذیرش درخواست از اجرای محاسبات |
| Long-running Simulation | استفاده از Job Lifecycle به‌جای اتصال HTTP طولانی |
| Financial Operation | کنترل دقیق وضعیت و نتیجه نهایی |

اعداد زمانی باید با اندازه‌گیری واقعی تعیین شوند.

### 6.5. Request Cancellation

در صورت خروج کاربر از صفحه یا تغییر نیاز داده، درخواست‌های غیرضروری باید در صورت امکان لغو شوند.

لغو درخواست در سمت مرورگر لزوماً به معنی لغو عملیات در Backend نیست.

برای عملیات حساس باید وضعیت سرور به‌صورت مستقل بررسی شود.

---

## 7. Response Standards

### 7.1. Response Parsing

پاسخ API باید قبل از مصرف توسط UI بررسی شود.

موارد مهم:

- HTTP Status
- Content Type
- JSON Validity
- Schema Compatibility
- Required Fields
- Nullability
- Data Types
- Error Payload

### 7.2. Response Envelope

در صورت استفاده از Envelope استاندارد، ساختار آن باید در سطح Backend و Frontend هماهنگ باشد.

نمونه مفهومی:

```json
{
  "data": {},
  "meta": {
    "request_id": "example-request-id",
    "timestamp": "2026-11-18T00:00:00Z"
  }
}
```

این نمونه قرارداد مصوب نیست و نباید بدون تطبیق با API واقعی به‌عنوان الزام اجرایی استفاده شود.

### 7.3. Empty Responses

فرانت‌اند باید پاسخ‌های خالی را به‌درستی مدیریت کند.

موارد زیر یکسان نیستند:

- Empty Array
- Null
- Missing Field
- HTTP 204
- Empty Object
- Not Found

### 7.4. Data Normalization

در صورت نیاز، داده دریافتی باید در لایه Data Access به ساختار مناسب دامنه تبدیل شود.

این تبدیل نباید معنای علمی، مالی یا عملیاتی داده را تغییر دهد.

### 7.5. Unknown Fields

فرانت‌اند باید در برابر اضافه شدن فیلدهای غیرمنتظره مقاوم باشد، مگر آنکه قرارداد صراحتاً Strict Validation را الزام کرده باشد.

---

## 8. Error Handling Architecture

### 8.1. Error Categories

خطاها باید حداقل در دسته‌های زیر تفکیک شوند:

| Category | Description |
|---|---|
| Network Error | عدم برقراری ارتباط |
| Timeout | پایان مهلت درخواست |
| Authentication Error | مشکل احراز هویت |
| Authorization Error | فقدان مجوز |
| Validation Error | داده ورودی نامعتبر |
| Not Found | منبع یافت نشد |
| Conflict | تعارض وضعیت |
| Rate Limit | عبور از محدودیت درخواست |
| Server Error | خطای سمت سرور |
| Contract Error | ناسازگاری ساختار پاسخ |
| Business Rule Error | نقض قواعد کسب‌وکار |
| Unknown Error | خطای ناشناخته |

### 8.2. Error Normalization

خطاهای دریافتی از سرویس‌های مختلف باید به ساختار داخلی قابل پیش‌بینی تبدیل شوند.

نمونه مفهومی:

```typescript
type ApiError = {
  category:
    | "network"
    | "timeout"
    | "authentication"
    | "authorization"
    | "validation"
    | "not_found"
    | "conflict"
    | "rate_limit"
    | "server"
    | "contract"
    | "business"
    | "unknown";

  status?: number;
  code?: string;
  message: string;
  requestId?: string;
  retryable: boolean;
};
```

این ساختار صرفاً نمونه طراحی است و قرارداد نهایی محسوب نمی‌شود.

### 8.3. Error Boundary

خطاهای ارتباطی API باید از خطاهای Rendering و خطاهای برنامه تفکیک شوند.

Error Boundary جایگزین مدیریت خطای API نیست.

### 8.4. User-Facing Messages

پیام خطا باید:

- قابل فهم باشد.
- اقدام بعدی را در صورت امکان مشخص کند.
- اطلاعات داخلی سیستم را افشا نکند.
- از نمایش Stack Trace خودداری کند.
- متناسب با زبان و Locale کاربر باشد.
- میان خطای موقت و خطای دائمی تمایز قائل شود.

### 8.5. Technical Error Details

جزئیات فنی باید در مسیر کنترل‌شده ثبت شوند.

اطلاعاتی مانند موارد زیر نباید در پیام عمومی به کاربر نمایش داده شوند:

- Database Query
- Internal Server Path
- Stack Trace
- Secret
- Access Token
- Internal Hostname
- Sensitive Payload

---

## 9. Retry and Recovery Policies

### 9.1. Retry Eligibility

Retry فقط برای درخواست‌هایی مجاز است که تکرار آن‌ها از نظر فنی و عملیاتی امن باشد.

### 9.2. Retry Matrix

| Situation | Retry Policy |
|---|---|
| Temporary Network Failure | مشروط به نوع عملیات |
| Timeout | ابتدا تعیین وضعیت عملیات |
| HTTP 429 | رعایت Retry-After در صورت وجود |
| HTTP 502 | امکان Retry کنترل‌شده |
| HTTP 503 | امکان Retry کنترل‌شده |
| HTTP 504 | بررسی وضعیت عملیات پیش از تکرار |
| HTTP 400 | معمولاً بدون Retry |
| HTTP 401 | اجرای مسیر کنترل‌شده احراز هویت |
| HTTP 403 | بدون Retry خودکار |
| HTTP 409 | نیازمند بررسی تعارض |
| Validation Failure | بدون Retry خودکار |

### 9.3. Exponential Backoff

برای درخواست‌های قابل تکرار، استفاده از Exponential Backoff و Jitter قابل بررسی است.

تکرارهای نامحدود ممنوع است.

### 9.4. Retry Budget

برای جلوگیری از تشدید اختلال، باید سقف تعداد و مدت Retry مشخص شود.

### 9.5. Circuit Breaker

برای ارتباطات پرتکرار با سرویس‌های خارجی، استفاده از الگوی Circuit Breaker می‌تواند در معماری مناسب بررسی شود.

### 9.6. Manual Recovery

در شرایطی که نتیجه عملیات نامشخص است، رابط کاربری باید مسیر بررسی وضعیت را فراهم کند؛ نه اینکه صرفاً عملیات را دوباره اجرا کند.

---

## 10. Authentication and Authorization Integration

### 10.1. Authentication Context

درخواست‌های محافظت‌شده باید با سازوکار احراز هویت معتبر ارسال شوند.

فرانت‌اند نباید منطق اعتبارسنجی نهایی هویت را جایگزین Backend کند.

### 10.2. Token Handling

نحوه نگهداری و ارسال Token باید تابع معماری امنیتی مصوب باشد.

ذخیره‌سازی Token در Local Storage نباید به‌عنوان پیش‌فرض امن فرض شود.

### 10.3. Refresh Flow

چرخه تمدید نشست باید:

- از درخواست‌های هم‌زمان کنترل‌شده پشتیبانی کند.
- از Refresh Loop جلوگیری کند.
- در برابر Race Condition مقاوم باشد.
- پس از شکست، وضعیت نشست را صحیح مدیریت کند.
- داده خصوصی کاربر را در Logout پاک‌سازی کند.

### 10.4. Authorization

مخفی کردن یک دکمه یا Route در فرانت‌اند، کنترل دسترسی واقعی محسوب نمی‌شود.

Backend باید تمام مجوزهای حساس را مستقل اعتبارسنجی کند.

### 10.5. Permission Changes

در صورت تغییر مجوز کاربر، فرانت‌اند باید وضعیت دسترسی و داده‌های وابسته را به‌روزرسانی کند.

---

## 11. Pagination, Filtering and Sorting

### 11.1. Pagination

APIهای دارای داده حجیم باید از الگوی صفحه‌بندی مشخص پشتیبانی کنند.

گزینه‌های قابل بررسی:

- Offset Pagination
- Cursor Pagination
- Keyset Pagination

### 11.2. Pagination Metadata

اطلاعات پیشنهادی:

- Current Cursor
- Next Cursor
- Previous Cursor
- Page Size
- Total Count، در صورت پشتیبانی
- Has More

### 11.3. Filtering

فیلترها باید با قرارداد Backend هماهنگ باشند.

فرانت‌اند نباید بدون اطلاع، فیلتر محلی را جایگزین فیلتر سروری کند.

### 11.4. Sorting

ترتیب داده باید مشخص باشد.

در داده‌های مالی، زمانی و علمی، Sorting باید بر اساس مقدار واقعی و نوع داده انجام شود، نه صرفاً رشته نمایشی.

---

## 12. File Upload and Download

### 12.1. Upload Validation

پیش از ارسال فایل، بررسی‌های سمت کاربر می‌توانند شامل موارد زیر باشند:

- File Size
- File Extension
- MIME Type
- Expected Format
- Upload Progress

این بررسی‌ها جایگزین اعتبارسنجی امنیتی سمت سرور نیستند.

### 12.2. Upload Security

فایل‌های بارگذاری‌شده باید در Backend از نظر نوع واقعی، محتوای مخرب و مجوز دسترسی بررسی شوند.

### 12.3. Large Files

برای فایل‌های حجیم باید روش مناسب انتقال انتخاب شود.

موارد قابل بررسی:

- Chunked Upload
- Resumable Upload
- Multipart Upload
- Upload Session
- Upload Progress
- Retry per Chunk

### 12.4. Download

دانلود فایل‌های حساس باید با کنترل دسترسی سمت سرور انجام شود.

فرانت‌اند نباید URLهای خصوصی یا Tokenهای حساس را در Log ثبت کند.

### 12.5. File Integrity

برای فایل‌های علمی، مکانی و گزارش‌های مهم، بررسی Integrity و Metadata قابل بررسی است.

---

## 13. Long-Running and Asynchronous Operations

### 13.1. General Principle

عملیات طولانی نباید الزاماً به یک درخواست HTTP طولانی و مسدودکننده وابسته باشند.

### 13.2. Job Lifecycle

الگوی پیشنهادی:

```text
SUBMITTED
    |
    v
ACCEPTED
    |
    v
QUEUED
    |
    v
RUNNING
    |
    +------> FAILED
    |
    +------> CANCEL_REQUESTED
    |              |
    |              v
    |          CANCELLED
    |
    v
COMPLETED
```

وضعیت‌ها باید از Backend دریافت شوند.

### 13.3. Job Submission

پاسخ موفق به ارسال درخواست فقط به معنی پذیرش درخواست است.

به معنی تکمیل محاسبات یا تولید نتیجه معتبر نیست.

### 13.4. Polling

در صورت استفاده از Polling باید:

- فاصله درخواست‌ها کنترل شود.
- Polling در صورت عدم نیاز متوقف شود.
- وضعیت نهایی تشخیص داده شود.
- تعداد درخواست‌ها محدود باشد.
- خطاهای موقت مدیریت شوند.

### 13.5. WebSocket and SSE

استفاده از WebSocket یا Server-Sent Events باید با توجه به نیاز ارتباطی و زیرساخت بررسی شود.

### 13.6. Result Validation

نتیجه عملیات طولانی باید پیش از نمایش نهایی اعتبارسنجی شود.

---

## 14. Scientific API Integration — HyDroMA

ارتباط با موتور علمی HyDroMA نیازمند کنترل‌های ویژه است.

### 14.1. Scientific Data Contract

هر خروجی علمی باید در صورت ارتباط با آن، اطلاعات زیر را حفظ کند:

- Model ID
- Model Version
- Dataset ID
- Dataset Version
- Input Parameters
- Input Units
- Output Units
- Spatial Scope
- Temporal Scope
- Execution Timestamp
- Execution Status
- Quality Indicators
- Provenance Metadata

### 14.2. Unit Integrity

واحدهای فیزیکی نباید در مسیر انتقال یا نمایش به‌صورت ضمنی تغییر کنند.

فرانت‌اند باید واحد دریافتی را حفظ و به‌درستی نمایش دهد.

### 14.3. Numerical Precision

مقادیر علمی نباید بدون سیاست مشخص گرد شوند.

Precision موردنیاز باید با ماهیت متغیر و کاربرد علمی آن سازگار باشد.

### 14.4. Scientific Result Status

حداقل باید میان وضعیت‌های زیر تمایز وجود داشته باشد:

- Request Accepted
- Computation Running
- Computation Completed
- Validation Pending
- Validated
- Rejected
- Failed

این وضعیت‌ها باید در قرارداد Backend تعریف و تأیید شوند.

### 14.5. Provenance Preservation

فرانت‌اند نباید منشأ داده، نسخه مدل یا محدوده مکانی و زمانی را حذف کند.

### 14.6. Remote Sensing Integration

در ارتباط با داده‌های سنجش‌ازدور باید اطلاعاتی مانند موارد زیر، در صورت ارائه توسط سرویس، حفظ شوند:

- Satellite Platform
- Sensor
- Acquisition Date
- Processing Level
- Spatial Resolution
- Cloud Cover
- Dataset Version
- Processing Provenance

### 14.7. Scientific Failure

در صورت شکست پردازش، نمایش داده ناقص به‌عنوان خروجی معتبر ممنوع است.

---

## 15. Financial API Integration — Nojin Marketplace

ارتباطات مالی به کنترل‌های سخت‌گیرانه‌تری نیاز دارند.

### 15.1. Financial Source of Truth

Backend تنها مرجع تأیید وضعیت مالی است.

### 15.2. Decimal Integrity

مقادیر مالی نباید با محاسبات Floating Point غیرقابل کنترل تغییر کنند.

فرمت انتقال باید با قرارداد مالی Backend سازگار باشد.

استفاده از Decimal در مدل‌سازی مالی الزامی پیشنهادی است.

### 15.3. Transaction Lifecycle

رابط کاربری باید وضعیت‌های مختلف تراکنش را از Backend دریافت کند.

نمونه مفهومی:

```text
CREATED
   |
   v
PENDING
   |
   +------> FAILED
   |
   +------> EXPIRED
   |
   v
CONFIRMED
```

این چرخه صرفاً نمونه است و وضعیت‌های واقعی باید از قرارداد سرویس مالی استخراج شوند.

### 15.4. Payment Confirmation

نمایش پیام پرداخت موفق فقط پس از دریافت تأیید معتبر از Backend مجاز است.

بازگشت کاربر از درگاه پرداخت به‌تنهایی اثبات پرداخت نیست.

### 15.5. Duplicate Prevention

برای عملیات مالی باید از سازوکار جلوگیری از تراکنش تکراری استفاده شود.

### 15.6. Unknown Transaction State

اگر ارتباط قطع شود و نتیجه تراکنش نامشخص بماند:

- عملیات نباید موفق فرض شود.
- درخواست تکراری نباید کورکورانه ارسال شود.
- وضعیت باید از Backend استعلام شود.
- پیام مناسب به کاربر نمایش داده شود.

### 15.7. Financial Display

فرانت‌اند باید Currency، Precision، Locale و Formatting را مطابق قرارداد مالی نمایش دهد.

---

## 16. Marketplace and Inventory Integration

### 16.1. Product Data

اطلاعات محصول باید از API معتبر دریافت شود.

### 16.2. Inventory Consistency

موجودی نمایش‌داده‌شده ممکن است در زمان خرید تغییر کرده باشد.

تأیید نهایی موجودی باید در Backend انجام شود.

### 16.3. Order State

وضعیت سفارش نباید صرفاً از روی اقدامات محلی کاربر تعیین شود.

### 16.4. Price Changes

در صورت تغییر قیمت میان مشاهده محصول و ثبت سفارش، Backend باید وضعیت نهایی را تعیین کند.

فرانت‌اند باید تغییرات را شفاف به کاربر اطلاع دهد.

### 16.5. Cart Synchronization

در صورت استفاده از سبد خرید هم‌زمان در چند دستگاه، سازوکار همگام‌سازی و مدیریت تعارض باید مشخص باشد.

---

## 17. Offline and Low-Connectivity API Behavior

### 17.1. Connectivity Awareness

فرانت‌اند باید وضعیت ارتباط شبکه را تا حد امکان تشخیص دهد.

### 17.2. Offline Read Experience

داده‌های عمومی و غیرحساس می‌توانند در صورت وجود سیاست Cache معتبر، به‌صورت آفلاین نمایش داده شوند.

### 17.3. Offline Mutations

عملیات حساس نباید صرفاً با موفقیت محلی، قطعی تلقی شوند.

### 17.4. Pending Operations

در صورت پشتیبانی از عملیات معوق، هر عملیات باید وضعیت مشخص داشته باشد:

- Pending
- Syncing
- Succeeded
- Failed
- Conflict

### 17.5. Conflict Resolution

تعارض داده باید بر اساس سیاست Backend و ماهیت دامنه حل شود.

### 17.6. Financial Restrictions

پرداخت، انتقال وجه، برداشت و عملیات مالی مشابه نباید در حالت آفلاین به‌عنوان عملیات نهایی تأیید شوند.

### 17.7. Scientific Restrictions

داده Cacheشده علمی باید تاریخ، نسخه و وضعیت اعتبار خود را حفظ کند.

---

## 18. API Versioning and Compatibility

### 18.1. Versioning Strategy

روش نسخه‌بندی API باید در سطح Backend تعریف و مستند شود.

گزینه‌های قابل بررسی:

- URL Versioning
- Header Versioning
- Media Type Versioning
- Compatibility-Based Evolution

### 18.2. Backward Compatibility

تغییرات سازگار باید تا حد امکان بدون شکستن مصرف‌کنندگان موجود انجام شوند.

### 18.3. Breaking Changes

موارد زیر می‌توانند Breaking Change محسوب شوند:

- حذف Field
- تغییر Type
- تغییر Meaning
- تغییر Required Status
- تغییر Authentication Requirement
- تغییر Error Semantics
- تغییر Pagination Behavior

### 18.4. Deprecation

APIهای در حال بازنشستگی باید:

- وضعیت مشخص داشته باشند.
- زمان‌بندی مهاجرت داشته باشند.
- جایگزین معرفی کنند.
- مصرف‌کنندگان آن‌ها شناسایی شوند.

### 18.5. Frontend-Backend Compatibility

نسخه فرانت‌اند نباید بدون بررسی سازگاری با نسخه Backend منتشر شود.

### 18.6. Contract Testing

برای Endpointهای مهم، Contract Tests پیشنهاد می‌شود.

---

## 19. Rate Limiting and Request Efficiency

### 19.1. Rate Limit Awareness

فرانت‌اند باید پاسخ‌های محدودیت درخواست را به‌درستی مدیریت کند.

### 19.2. Request Deduplication

درخواست‌های تکراری و هم‌زمان برای داده یکسان باید در صورت امکان کنترل شوند.

### 19.3. Debouncing and Throttling

برای جست‌وجو، فیلتر و تعاملات پرتکرار می‌توان از Debounce و Throttle استفاده کرد.

### 19.4. Batching

در صورت پشتیبانی Backend، Batching می‌تواند تعداد درخواست‌ها را کاهش دهد.

### 19.5. Avoid Overfetching

فرانت‌اند باید فقط داده موردنیاز سناریوی فعلی را دریافت کند.

### 19.6. Avoid Underfetching

ساختار API باید از ایجاد تعداد زیاد درخواست‌های کوچک و غیرضروری جلوگیری کند.

---

## 20. Privacy and Data Protection

### 20.1. Data Minimization

فقط داده ضروری باید ارسال و دریافت شود.

### 20.2. Sensitive Data

داده‌های زیر باید با کنترل ویژه مدیریت شوند:

- Authentication Tokens
- Personal Information
- Financial Information
- Location Data
- Scientific Project Data
- Private Files
- User Credentials

### 20.3. Logging Restrictions

ثبت کامل Request یا Response در Log بدون فیلترسازی مجاز فرض نمی‌شود.

### 20.4. Error Privacy

پیام خطا نباید داده خصوصی یا جزئیات داخلی سرویس را افشا کند.

### 20.5. Cross-User Isolation

Cache و State نباید موجب نمایش داده یک کاربر به کاربر دیگر شوند.

### 20.6. External APIs

ارسال داده به سرویس‌های خارجی باید با سیاست حریم خصوصی و مجوزهای مربوط سازگار باشد.

---

## 21. Testing and Validation

### 21.1. API Unit Tests

آزمون مواردی مانند:

- Request Construction
- Response Parsing
- Error Normalization
- Data Transformation
- Retry Rules

### 21.2. Contract Tests

بررسی انطباق درخواست و پاسخ با قرارداد API.

### 21.3. Integration Tests

بررسی ارتباط واقعی یا کنترل‌شده فرانت‌اند با Backend.

### 21.4. E2E Tests

آزمون سناریوهای کامل کاربر.

### 21.5. Failure Tests

موارد ضروری:

- Network Disconnection
- Timeout
- Invalid JSON
- Missing Fields
- Unexpected Data Types
- HTTP 401
- HTTP 403
- HTTP 404
- HTTP 409
- HTTP 429
- HTTP 500
- HTTP 502
- HTTP 503
- HTTP 504

### 21.6. Domain-Specific Tests

برای HyDroMA:

- Unit Integrity
- Model Version Preservation
- Scientific Result Status
- Provenance Integrity
- Spatial and Temporal Metadata

برای Nojin Marketplace:

- Decimal Integrity
- Duplicate Transaction Prevention
- Payment Status
- Order State
- Inventory Conflict

### 21.7. Mocking Policy

Mockها باید از قرارداد واقعی API پیروی کنند.

Mock موفقیت‌آمیز نباید جایگزین آزمون یکپارچگی واقعی شود.

---

## 22. Observability and Diagnostics

### 22.1. Request Correlation

در صورت پشتیبانی Backend، هر درخواست باید شناسه قابل ردیابی داشته باشد.

### 22.2. Error Context

اطلاعات پیشنهادی برای ثبت کنترل‌شده:

- Request ID
- Endpoint
- HTTP Method
- Status Code
- Duration
- Error Category
- Product Context
- Environment
- Timestamp

### 22.3. Sensitive Data Exclusion

اطلاعات محرمانه نباید در Telemetry ثبت شوند.

### 22.4. API Performance

شاخص‌های پیشنهادی:

- Request Duration
- Error Rate
- Timeout Rate
- Retry Rate
- Rate Limit Frequency
- Payload Size
- Endpoint Availability

### 22.5. User Impact

خطاها باید از نظر تأثیر بر سناریوی کاربر نیز ارزیابی شوند.

یک خطای API کم‌تکرار ممکن است در عملیات حساس اثر بسیار بالایی داشته باشد.

---

## 23. Documentation Requirements

برای هر گروه API باید مستندات زیر در دسترس باشد:

1. Endpoint Inventory
2. API Contract
3. Authentication Requirements
4. Request and Response Examples
5. Error Code Catalog
6. Pagination Rules
7. Rate Limit Policy
8. Versioning Policy
9. Deprecation Policy
10. Domain-Specific Constraints
11. Integration Test Evidence
12. Known Limitations

مستندات باید با نسخه واقعی Backend هماهنگ باشند.

---

## 24. Risk Register

| ID | Risk | Impact | Proposed Mitigation |
|---|---|---|---|
| API-001 | Contract Drift | High | Contract Testing |
| API-002 | Invalid Response Consumption | High | Runtime Validation |
| API-003 | Duplicate Operations | Critical | Idempotency Controls |
| API-004 | False Financial Success | Critical | Backend Confirmation |
| API-005 | Scientific Provenance Loss | High | Metadata Preservation |
| API-006 | Token Exposure | Critical | Secure Authentication Architecture |
| API-007 | Infinite Retry Loop | Medium/High | Bounded Retry |
| API-008 | Stale Data | Medium/High | Cache Invalidation |
| API-009 | Cross-User Data Leakage | Critical | User-Scoped Data Isolation |
| API-010 | Long-Running Request Failure | High | Asynchronous Job Model |
| API-011 | Backend Version Incompatibility | High | Compatibility Validation |
| API-012 | Sensitive Error Disclosure | High | Error Sanitization |
| API-013 | Uncontrolled External API Dependency | High | External Service Governance |
| API-014 | Offline Mutation Conflict | High | Explicit Sync and Conflict Policy |
| API-015 | Inaccurate Financial Precision | Critical | Decimal-Based Contracts |
| API-016 | Excessive API Requests | Medium | Deduplication and Request Budget |

---

## 25. Implementation Roadmap

### Phase 1 — API Discovery

- استخراج Endpointهای واقعی
- شناسایی سرویس‌های Backend
- دسته‌بندی APIها بر اساس دامنه
- شناسایی قراردادهای موجود
- شناسایی ارتباطات بدون قرارداد

### Phase 2 — Contract Baseline

- ثبت Endpoint Inventory
- بررسی OpenAPI در صورت وجود
- ثبت Request و Response Schema
- ثبت Error Codes
- شناسایی ناسازگاری‌های قرارداد

### Phase 3 — Integration Architecture

- تعریف API Client
- تعریف Data Access Layer
- تعریف Error Normalization
- تعریف Request Lifecycle
- تعریف Authentication Integration
- تعریف Retry and Cancellation Policy

### Phase 4 — Domain Validation

- بررسی APIهای علمی HyDroMA
- بررسی APIهای مالی Marketplace
- بررسی APIهای کاربری و مدیریتی
- اعتبارسنجی قراردادهای حساس

### Phase 5 — Testing and Observability

- Contract Tests
- Integration Tests
- Failure Tests
- E2E Tests
- Request Correlation
- API Performance Monitoring

### Phase 6 — Release Readiness

- بررسی سازگاری نسخه‌ها
- بررسی خطاهای باز
- بررسی عملیات حساس
- بررسی شواهد آزمون
- تأیید نهایی مالک

این Roadmap پیشنهاد اجرایی است و شروع عملیات آن نیازمند بررسی Repository و تأیید محدوده کار خواهد بود.

---

## 26. Open Decisions

| ID | Decision | Status |
|---|---|---|
| D-034-01 | معماری نهایی API Client | OPEN |
| D-034-02 | ساختار Data Access Layer | OPEN |
| D-034-03 | قرارداد استاندارد Response | OPEN |
| D-034-04 | قالب Error Response | OPEN |
| D-034-05 | روش Runtime Schema Validation | OPEN |
| D-034-06 | ابزار تولید Type از API Contract | OPEN |
| D-034-07 | سیاست API Versioning | OPEN |
| D-034-08 | سیاست Retry و Timeout | OPEN |
| D-034-09 | سیاست Idempotency برای عملیات حساس | OPEN |
| D-034-10 | روش مدیریت Refresh Token | OPEN |
| D-034-11 | الگوی Job Lifecycle برای محاسبات علمی | OPEN |
| D-034-12 | سیاست Polling، SSE و WebSocket | OPEN |
| D-034-13 | استاندارد Pagination | OPEN |
| D-034-14 | سیاست API Rate Limiting | OPEN |
| D-034-15 | سیاست Contract Testing | OPEN |
| D-034-16 | استاندارد Correlation ID | OPEN |
| D-034-17 | قرارداد مالی Decimal و Currency | OPEN |
| D-034-18 | قرارداد Metadata علمی و Provenance | OPEN |
| D-034-19 | سیاست Offline Mutation | OPEN |
| D-034-20 | سیاست سازگاری نسخه Frontend و Backend | OPEN |

هیچ‌یک از تصمیمات فوق با انتشار این سند مصوب تلقی نمی‌شوند.

---

## 27. Definition of Done

این استاندارد زمانی در سطح اجرایی قابل پذیرش است که:

- Endpointهای واقعی شناسایی شده باشند.
- قراردادهای API مستند باشند.
- ساختار درخواست و پاسخ قابل اعتبارسنجی باشد.
- Data Access Layer از UI جدا شده باشد.
- خطاها ساختار استاندارد داشته باشند.
- عملیات حساس دارای کنترل تکرار باشند.
- Authentication و Authorization به‌درستی مدیریت شوند.
- داده‌های علمی و مالی یکپارچگی خود را حفظ کنند.
- درخواست‌های طولانی چرخه عمر مشخص داشته باشند.
- خطاهای شبکه و سرور آزمون شده باشند.
- سازگاری نسخه Frontend و Backend بررسی شده باشد.
- اطلاعات حساس در Log و Telemetry افشا نشوند.
- شواهد آزمون و اعتبارسنجی ثبت شده باشند.
- تصمیمات باز موردنیاز توسط مالک تعیین تکلیف شده باشند.

**توجه:** موفقیت درخواست HTTP یا Build فرانت‌اند به‌تنهایی اثبات‌کننده صحت داده، اعتبار نتیجه علمی یا موفقیت عملیات مالی نیست.

---

## 28. Final Status

**Document Status:** DRAFT — PROPOSED — NOT APPROVED

**Approval Status:** NOT APPROVED

**Implementation Status:** NOT VERIFIED

**Architecture Decisions:** OPEN

این سند چارچوب پیشنهادی یکپارچه‌سازی API در اکوسیستم Eco Nojin را تعریف می‌کند.

هرگونه پیاده‌سازی باید پس از بررسی قراردادهای واقعی Backend، وضعیت Repository، معماری امنیتی و تصمیمات باز انجام شود.

هیچ Endpoint، قابلیت مالی، عملیات علمی، سازوکار احراز هویت یا سرویس خارجی صرفاً به دلیل تعریف در این سند، فعال یا تأییدشده محسوب نمی‌شود.