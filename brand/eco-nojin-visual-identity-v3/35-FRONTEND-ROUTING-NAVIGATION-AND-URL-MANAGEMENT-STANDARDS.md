# Frontend Routing, Navigation and URL Management Standards

**Document ID:** EN-FE-STD-035  
**Version:** 1.0.0  
**Status:** DRAFT — PROPOSED — NOT APPROVED  
**Classification:** Frontend Architecture / Navigation / Application Structure  
**Scope:** Eco Nojin Ecosystem — Eco Nojin, HyDroMA, Nojin Marketplace  
**Date:** 2026-11-18

---

## 1. Purpose

این سند استانداردهای پیشنهادی طراحی و مدیریت سیستم مسیریابی (Routing)، ناوبری (Navigation) و URL Management را در اکوسیستم Eco Nojin تعریف می‌کند.

هدف، ایجاد ساختاری یکپارچه، قابل توسعه، امن، قابل دسترس و قابل نگهداری برای دسترسی کاربران به صفحات، قابلیت‌ها و بخش‌های مختلف محصولات است.

این استاندارد باید موارد زیر را پوشش دهد:

- طراحی معماری مسیرهای فرانت‌اند
- تفکیک مسیرهای عمومی، خصوصی و مدیریتی
- مدیریت دسترسی کاربران و نقش‌ها
- سازمان‌دهی مسیرهای چندمحصولی
- حفظ وضعیت قابل اشتراک‌گذاری در URL
- پشتیبانی از Deep Linking
- مدیریت Navigation History
- جلوگیری از دسترسی غیرمجاز به صفحات
- مدیریت صفحات ناموجود و خطاهای مسیریابی
- پشتیبانی از RTL و LTR
- سازگاری با موبایل و نمایشگرهای مختلف
- حفظ قابلیت استفاده در اینترنت ضعیف
- مدیریت مسیرهای قدیمی و Redirectها
- کنترل سازگاری Routeها با API و Backend

این سند درباره ساختار ناوبری فرانت‌اند است و جایگزین کنترل دسترسی و مجوزدهی سمت سرور نمی‌شود.

---

## 2. Scope

این استاندارد تمام مسیرهای قابل دسترسی در رابط کاربری اکوسیستم را پوشش می‌دهد.

### 2.1. Product-Level Routing

سه حوزه اصلی محصول باید در معماری مسیریابی قابل تفکیک باشند:

**Eco Nojin**

- صفحات معرفی و هویت اکوسیستم
- معرفی خدمات و قابلیت‌ها
- صفحات محتوایی
- معرفی پروژه‌ها و مناطق
- صفحات عمومی
- ثبت‌نام و ورود
- پروفایل کاربران

**HyDroMA**

- داشبورد علمی
- مدیریت پروژه‌های علمی
- داده‌های آب و خاک
- داده‌های اقلیمی
- کشاورزی و پوشش گیاهی
- سنجش‌ازدور
- نقشه‌ها و تحلیل مکانی
- مدل‌سازی و شبیه‌سازی
- نتایج علمی
- MRV و گزارش‌های مرتبط

**Nojin Marketplace**

- بازارگاه
- دسته‌بندی محصولات
- صفحات محصول
- فروشگاه‌ها
- سبد خرید
- سفارش‌ها
- پرداخت
- کیف پول
- حسابداری
- گردشگری و خدمات محلی

این دسته‌بندی مفهومی است. مسیرهای واقعی باید پس از بررسی صفحات و قابلیت‌های موجود تعیین شوند.

### 2.2. User-Level Routing

مسیرهای زیر باید در طراحی لحاظ شوند:

- Guest Routes
- Authenticated User Routes
- Organization Routes
- Village and Nomadic Community Routes
- Seller Routes
- Scientific Researcher Routes
- Project Manager Routes
- Administrative Routes

### 2.3. Technical Routing

موارد زیر نیز در محدوده این سند هستند:

- Static Routes
- Dynamic Routes
- Nested Routes
- Protected Routes
- Lazy Routes
- Redirects
- Query Parameters
- URL State
- Route Metadata
- Navigation Guards
- Error Routes
- Fallback Routes

---

## 3. Core Routing Principles

### 3.1. Predictable Navigation

کاربر باید بتواند ساختار صفحات و مسیر حرکت میان آن‌ها را به‌سادگی درک کند.

### 3.2. Stable URL

URL باید تا حد امکان پایدار، معنادار و قابل اشتراک‌گذاری باشد.

### 3.3. Separation of Concerns

تعریف مسیر، کنترل دسترسی، دریافت داده و نمایش صفحه باید مسئولیت‌های مشخص و جداگانه داشته باشند.

### 3.4. Explicit Route Ownership

هر Route باید متعلق به یک محصول یا حوزه کاربردی مشخص باشد.

### 3.5. Least Privilege

دسترسی به مسیرهای خصوصی باید براساس هویت و مجوزهای معتبر کنترل شود.

### 3.6. Backend Authorization

محدود کردن دسترسی در فرانت‌اند صرفاً یک کنترل تجربه کاربری است. تصمیم نهایی مجوزدهی باید در Backend انجام شود.

### 3.7. Direct Navigation Support

صفحات معتبر باید در صورت مجاز بودن، از طریق ورود مستقیم URL نیز قابل دسترسی باشند.

### 3.8. Graceful Failure

نبود صفحه، انقضای نشست، خطای بارگذاری یا فقدان مجوز نباید باعث اختلال گسترده در برنامه شود.

---

## 4. Routing Architecture

### 4.1. Proposed Architecture

مدل مفهومی پیشنهادی:

```text
Application Shell
       |
       v
Route Registry
       |
       v
Route Resolution
       |
       +----------------------+
       |                      |
       v                      v
Public Routes           Protected Routes
                              |
                              v
                       Authentication
                              |
                              v
                       Authorization
                              |
                              v
                       Data Loading
                              |
                              v
                       Page Rendering
```

این مدل مفهومی است و انتخاب معماری نهایی باید با ساختار واقعی پروژه تطبیق داده شود.

### 4.2. Routing Responsibilities

| Component | Responsibility |
|---|---|
| Route Registry | تعریف مسیرها |
| Router | تطبیق URL با Route |
| Navigation Layer | مدیریت حرکت میان صفحات |
| Authentication Guard | بررسی وضعیت نشست |
| Authorization Guard | بررسی مجوز موردنیاز در UI |
| Data Loader | دریافت داده موردنیاز صفحه |
| Error Route | نمایش خطاهای مسیریابی |
| Layout | ساختار مشترک صفحات |

### 4.3. Centralized Route Definitions

مسیرهای اصلی باید در ساختاری قابل مدیریت تعریف شوند.

از پراکندگی مسیرهای تکراری و Hardcoded در کامپوننت‌های متعدد باید جلوگیری شود.

### 4.4. Route Metadata

برای هر Route، Metadata متناسب با نیاز می‌تواند تعریف شود:

- Route ID
- Product
- Page Title
- Layout
- Authentication Requirement
- Required Permission
- Breadcrumb Metadata
- Navigation Group
- Feature Flag
- SEO Metadata
- Analytics Category

Metadata نباید حاوی Secret یا اطلاعات حساس باشد.

### 4.5. Route Composition

مسیرهای مرتبط می‌توانند در قالب ساختارهای سلسله‌مراتبی تعریف شوند.

این ساختار باید از ایجاد وابستگی غیرضروری میان محصولات جلوگیری کند.

---

## 5. URL Design Standards

### 5.1. Readable URLs

URLها باید تا حد امکان کوتاه، معنادار و قابل فهم باشند.

نمونه مفهومی:

```text
/hydroma/dashboard
/hydroma/projects
/hydroma/projects/{projectId}
/hydroma/simulations/{simulationId}

/marketplace/products
/marketplace/products/{productSlug}
/marketplace/orders
/marketplace/orders/{orderId}

/tourism/destinations
/tourism/destinations/{destinationSlug}
```

این مسیرها صرفاً نمونه هستند و Route نهایی محسوب نمی‌شوند.

### 5.2. Naming Convention

پیشنهاد می‌شود:

- از نام‌گذاری یکدست استفاده شود.
- نام مسیرها با حروف کوچک باشد.
- از Kebab Case برای مسیرهای چندکلمه‌ای استفاده شود.
- از نام‌های مبهم و اختصارات غیرضروری اجتناب شود.
- شناسه‌های فنی از Slugهای عمومی تفکیک شوند.

### 5.3. Stable Identifiers

مسیرهایی که به منابع پایدار اشاره می‌کنند باید از شناسه‌های معتبر استفاده کنند.

تغییر عنوان یک محصول یا پروژه نباید بدون ضرورت URL اصلی آن را نامعتبر کند.

### 5.4. Slug and ID

در صفحات عمومی، Slug می‌تواند برای خوانایی و SEO استفاده شود.

در عملیات حساس یا منابع خصوصی، شناسه معتبر منبع باید در Backend بررسی شود.

### 5.5. Trailing Slash Policy

سیاست استفاده از Trailing Slash باید یکسان باشد.

نباید برای یک صفحه چند URL متعارض و بدون سیاست Canonical ایجاد شود.

### 5.6. URL Encoding

مقادیر فارسی، عربی و سایر نویسه‌های Unicode باید با Encoding معتبر منتقل شوند.

کاراکترهای رزروشده URL نباید به‌صورت ناامن وارد مسیر شوند.

---

## 6. Route Classification

Routeها باید براساس سطح دسترسی و ماهیت صفحه طبقه‌بندی شوند.

### 6.1. Public Routes

صفحات قابل مشاهده بدون ورود:

- Homepage
- Product Introduction
- Public Content
- Public Marketplace
- Public Tourism Pages
- Public Project Pages
- Legal and Policy Pages

### 6.2. Authentication Routes

صفحات مرتبط با هویت:

- Login
- Registration
- Password Recovery
- Account Verification
- Session Recovery
- Authentication Callback

### 6.3. Protected Routes

صفحات نیازمند نشست معتبر:

- User Dashboard
- Personal Profile
- Private Projects
- User Orders
- Wallet
- Private Scientific Data
- User Documents

### 6.4. Role-Specific Routes

صفحات مرتبط با نقش‌های کاربردی:

- Seller Dashboard
- Researcher Workspace
- Organization Workspace
- Project Management
- Community Management

### 6.5. Administrative Routes

مسیرهای مدیریتی باید به‌صورت جداگانه تعریف و محافظت شوند.

وجود مسیر مدیریتی در فرانت‌اند به معنی اعطای مجوز مدیریت نیست.

### 6.6. System Routes

صفحات سیستمی شامل:

- Not Found
- Access Denied
- Session Expired
- Service Unavailable
- Maintenance
- Unexpected Error

---

## 7. Authentication-Aware Routing

### 7.1. Authentication State

وضعیت احراز هویت باید از منبع معتبر و سازوکار امنیتی پروژه دریافت شود.

وضعیت‌های مفهومی:

- UNKNOWN
- AUTHENTICATING
- AUTHENTICATED
- UNAUTHENTICATED
- SESSION_EXPIRED
- AUTHENTICATION_FAILED

این وضعیت‌ها نمونه طراحی هستند و باید با معماری احراز هویت واقعی هماهنگ شوند.

### 7.2. Initial Authentication Check

در زمان بارگذاری اولیه برنامه، وضعیت نشست باید پیش از نمایش صفحات خصوصی تعیین شود.

نمایش موقت محتوای خصوصی پیش از تأیید نشست مجاز نیست.

### 7.3. Protected Route Behavior

اگر کاربر وارد نشده باشد:

1. دسترسی به صفحه خصوصی متوقف شود.
2. کاربر به مسیر ورود هدایت شود.
3. مقصد اولیه در صورت نیاز حفظ شود.
4. پس از ورود موفق، مقصد فقط پس از اعتبارسنجی مجدد قابل استفاده باشد.

### 7.4. Safe Return URL

پارامتر بازگشت پس از ورود نباید به یک URL خارجی نامعتبر هدایت کند.

مقصد بازگشت باید در برابر Open Redirect کنترل شود.

### 7.5. Session Expiration

در صورت انقضای نشست:

- عملیات جدید متوقف شود.
- اطلاعات خصوصی از UI محافظت شوند.
- وضعیت احراز هویت به‌روزرسانی شود.
- پیام قابل فهم نمایش داده شود.
- کاربر به مسیر مناسب هدایت شود.

### 7.6. Logout

پس از خروج:

- دسترسی به Routeهای خصوصی متوقف شود.
- Cache و State خصوصی متناسب با سیاست امنیتی پاک‌سازی شوند.
- مسیرهای خصوصی از History یا Back Navigation نباید موجب نمایش داده محرمانه شوند.
- وضعیت نشست از Backend یا سازوکار معتبر تأیید شود.

---

## 8. Authorization-Aware Navigation

### 8.1. Permission-Based UI

نمایش منوها و لینک‌ها می‌تواند بر اساس مجوزهای کاربر تنظیم شود.

### 8.2. Role and Permission Separation

نقش و مجوز مفاهیم متفاوتی هستند.

یک Role می‌تواند مجموعه‌ای از Permissionها را شامل شود؛ اما نباید فرض شود که تمام کاربران یک نقش، در تمام منابع دسترسی یکسان دارند.

### 8.3. Resource-Level Authorization

مجوز دسترسی به یک Route ممکن است به مالکیت یا عضویت در یک منبع وابسته باشد.

برای مثال:

- دسترسی به پروژه مشخص
- دسترسی به فروشگاه مشخص
- دسترسی به داده علمی مشخص
- دسترسی به محدوده جغرافیایی مشخص
- دسترسی به اسناد سازمانی مشخص

این مجوزها باید در Backend کنترل شوند.

### 8.4. Permission Change

در صورت تغییر مجوز کاربر، Navigation و Route Access باید به‌روزرسانی شوند.

### 8.5. Hidden Routes

مخفی کردن Route یا لینک در UI کنترل امنیتی محسوب نمی‌شود.

درخواست مستقیم به Endpoint مربوط باید در Backend مجدداً بررسی شود.

---

## 9. Navigation System

### 9.1. Navigation Types

ساختار ناوبری می‌تواند شامل موارد زیر باشد:

- Primary Navigation
- Secondary Navigation
- Sidebar Navigation
- Contextual Navigation
- Breadcrumb Navigation
- Tab Navigation
- Mobile Navigation
- Footer Navigation

### 9.2. Navigation Hierarchy

ساختار منو باید سلسله‌مراتب اطلاعاتی محصول را منعکس کند.

منوها نباید صرفاً براساس ساختار فنی Backend طراحی شوند.

### 9.3. Product-Level Navigation

هر محصول باید Navigation متناسب با هدف و مخاطب خود داشته باشد.

**Eco Nojin:**

- معرفی اکوسیستم
- حوزه‌های فعالیت
- راهکارها
- پروژه‌ها
- مناطق و جوامع
- درباره ما

**HyDroMA:**

- داشبورد علمی
- پروژه‌ها
- داده‌ها
- تحلیل‌ها
- شبیه‌سازی
- سنجش‌ازدور
- گزارش‌ها

**Nojin Marketplace:**

- بازارگاه
- دسته‌بندی‌ها
- فروشگاه‌ها
- گردشگری
- سفارش‌ها
- حساب کاربری

این موارد پیشنهاد اولیه هستند و نباید جایگزین بررسی ساختار واقعی محصولات شوند.

### 9.4. Active Navigation State

آیتم فعال منو باید با Route جاری هماهنگ باشد.

در مسیرهای تو‌در‌تو، سیاست تشخیص Active State باید مشخص باشد.

### 9.5. Navigation Depth

عمق منو باید محدود و قابل فهم باشد.

مسیرهای بسیار تو‌در‌تو باید از نظر تجربه کاربری بازبینی شوند.

### 9.6. Breadcrumbs

برای صفحات دارای سلسله‌مراتب محتوایی، Breadcrumb پیشنهاد می‌شود.

Breadcrumb باید:

- مسیر واقعی سلسله‌مراتب را نشان دهد.
- قابل استفاده با صفحه‌کلید باشد.
- نام‌های قابل فهم داشته باشد.
- وضعیت صفحه جاری را مشخص کند.
- در RTL و LTR صحیح نمایش داده شود.

---

## 10. Nested Routes and Layout Architecture

### 10.1. Shared Layouts

صفحات مرتبط می‌توانند Layout مشترک داشته باشند.

نمونه‌ها:

- Public Layout
- Authentication Layout
- Scientific Dashboard Layout
- Marketplace Layout
- Administration Layout

### 10.2. Layout Isolation

تغییر Layout یک محصول نباید بدون ضرورت به محصولات دیگر اثر بگذارد.

### 10.3. Nested Route Behavior

در Routeهای تو‌در‌تو باید مشخص باشد:

- کدام بخش ثابت باقی می‌ماند.
- کدام بخش تغییر می‌کند.
- کدام داده دوباره بارگذاری می‌شود.
- کدام State حفظ می‌شود.
- چه زمانی Scroll Position بازنشانی می‌شود.

### 10.4. Layout Loading

بارگذاری Layout باید در برابر خطاهای Route و API مقاوم باشد.

### 10.5. Shared Components

استفاده از Header، Sidebar، Breadcrumb و Navigation Components مشترک باید با رعایت مرزهای محصول انجام شود.

---

## 11. Query Parameters and URL State

### 11.1. General Principle

وضعیت‌هایی که باید قابل اشتراک‌گذاری، بازیابی یا Bookmark باشند، می‌توانند در URL ذخیره شوند.

### 11.2. Appropriate URL State

نمونه‌ها:

- Search Query
- Category Filter
- Sorting
- Pagination
- Selected Tab
- Date Range
- Map View
- Public Dashboard Filters
- Public Report Parameters

### 11.3. Sensitive Data Restrictions

موارد زیر نباید بدون ارزیابی امنیتی در URL قرار گیرند:

- Access Tokens
- Refresh Tokens
- Passwords
- Private Personal Data
- Financial Secrets
- Confidential Project Data
- Sensitive Coordinates
- Private File Identifiers

### 11.4. Query Validation

Query Parameters باید از نظر موارد زیر اعتبارسنجی شوند:

- Type
- Length
- Allowed Values
- Numeric Range
- Date Format
- Enumeration
- Encoding

### 11.5. Unknown Parameters

سیاست برخورد با پارامترهای ناشناخته باید مشخص باشد.

پارامتر نامعتبر نباید باعث Crash صفحه شود.

### 11.6. Canonical Query State

برای وضعیت‌های معادل باید URL استاندارد و قابل پیش‌بینی تعریف شود.

### 11.7. Browser History

تغییر Query State باید با انتخاب مناسب میان `pushState` و `replaceState` انجام شود.

هر تغییر کوچک در ورودی جست‌وجو نباید الزاماً یک History Entry مستقل ایجاد کند.

---

## 12. Deep Linking and Shareable Routes

### 12.1. Direct URL Access

صفحات معتبر باید در صورت مجاز بودن از طریق URL مستقیم قابل بارگذاری باشند.

### 12.2. Refresh Support

بارگذاری مجدد صفحه نباید به دلیل نبود مسیر در تنظیمات Server Hosting شکست بخورد.

پیکربندی سرور باید با مدل Client-Side Routing سازگار باشد.

### 12.3. Shareable Pages

صفحات عمومی می‌توانند قابلیت اشتراک‌گذاری داشته باشند.

### 12.4. Private Deep Links

لینک خصوصی باید پس از ورود، دسترسی را مجدداً اعتبارسنجی کند.

### 12.5. Resource Availability

اگر منبع حذف یا غیرفعال شده باشد، صفحه باید وضعیت مناسب را نمایش دهد.

### 12.6. Expiring Links

لینک‌های دارای اعتبار زمانی باید از نظر Expiration و Authorization بررسی شوند.

---

## 13. Route Loading and Lazy Loading

### 13.1. Route-Level Code Splitting

صفحات سنگین می‌توانند به‌صورت Lazy Loaded بارگذاری شوند.

### 13.2. Heavy Feature Routes

مواردی مانند:

- Scientific Maps
- 3D Visualization
- Advanced Charts
- Simulation Workspace
- Large Administrative Panels

باید از نظر بارگذاری تدریجی بررسی شوند.

### 13.3. Loading States

برای بارگذاری Route باید وضعیت مشخص وجود داشته باشد:

- Initial Loading
- Data Loading
- Partial Loading
- Failed Loading
- Ready

### 13.4. Loading Feedback

در زمان بارگذاری باید از نمایش صفحه خالی و نامفهوم اجتناب شود.

### 13.5. Lazy Loading Failure

در صورت شکست بارگذاری Chunk، برنامه باید مسیر بازیابی مشخص داشته باشد.

### 13.6. Route Prefetching

Prefetching فقط در صورت توجیه عملکردی و رعایت محدودیت شبکه پیشنهاد می‌شود.

---

## 14. Route Error Handling

### 14.1. Error Categories

خطاهای مسیریابی باید حداقل در دسته‌های زیر مدیریت شوند:

| Category | Description |
|---|---|
| Not Found | مسیر ناموجود |
| Access Denied | فقدان مجوز |
| Unauthenticated | نشست معتبر وجود ندارد |
| Resource Not Found | منبع موردنظر وجود ندارد |
| Resource Unavailable | منبع موقتاً در دسترس نیست |
| Route Load Failure | شکست بارگذاری Route |
| Chunk Load Failure | شکست بارگذاری فایل برنامه |
| Network Failure | مشکل ارتباط |
| Unexpected Error | خطای پیش‌بینی‌نشده |

### 14.2. Not Found Page

صفحه 404 باید:

- واضح باشد.
- مسیر بازگشت ارائه دهد.
- اطلاعات فنی غیرضروری نمایش ندهد.
- با زبان رابط هماهنگ باشد.
- در موبایل قابل استفاده باشد.

### 14.3. Access Denied Page

صفحه 403 باید میان نبود مجوز و نبود نشست تمایز قائل شود.

### 14.4. Service Unavailable

در صورت اختلال سرویس، باید پیام مناسب و در صورت امکان راه بازیابی ارائه شود.

### 14.5. Error Isolation

خطای یک Route نباید بدون ضرورت کل برنامه را از کار بیندازد.

---

## 15. Redirect and Legacy Route Management

### 15.1. Redirect Policy

Redirectها باید هدف مشخص داشته باشند.

### 15.2. Redirect Types

موارد قابل بررسی:

- Temporary Redirect
- Permanent Redirect
- Authentication Redirect
- Canonical Redirect
- Legacy Route Redirect

### 15.3. Redirect Loop Prevention

مسیرهای Redirect باید از نظر چرخه و مقصد نامعتبر بررسی شوند.

### 15.4. Legacy URLs

در زمان تغییر ساختار Routeها، مسیرهای قدیمی مهم باید در صورت نیاز به مسیرهای جدید هدایت شوند.

### 15.5. Redirect Security

مقصد Redirect باید اعتبارسنجی شود.

هدایت به URL خارجی غیرمجاز نباید امکان‌پذیر باشد.

---

## 16. Multi-Language and RTL/LTR Routing

### 16.1. Locale Strategy

در صورت پشتیبانی از چند زبان، سیاست Locale در URL باید مشخص باشد.

گزینه‌های قابل بررسی:

- Locale Prefix
- Domain-Based Locale
- Subdomain-Based Locale
- Locale Stored in User Preferences

### 16.2. Locale Persistence

تغییر زبان باید با حفظ صفحه جاری و در صورت امکان وضعیت قابل بازیابی آن انجام شود.

### 16.3. Translation-Safe Routes

نام Routeها نباید بدون سیاست مشخص با تغییر زبان تغییر کنند.

### 16.4. RTL/LTR Navigation

موارد زیر باید در هر دو جهت بررسی شوند:

- Sidebar Position
- Breadcrumb Order
- Back and Forward Controls
- Navigation Icons
- Nested Menu Expansion
- Keyboard Navigation
- Focus Order

### 16.5. Locale-Aware Parameters

تاریخ، اعداد و مقادیر محلی باید بدون تغییر معنای داده در URL مدیریت شوند.

### 16.6. Language Switch

تغییر زبان نباید کاربر را بدون ضرورت به صفحه اصلی منتقل کند.

---

## 17. Accessibility and Navigation

### 17.1. Semantic Navigation

ساختار ناوبری باید از عناصر معنایی HTML استفاده کند.

### 17.2. Keyboard Accessibility

تمام مسیرهای اصلی باید از طریق صفحه‌کلید قابل دسترسی باشند.

### 17.3. Focus Management

پس از تغییر Route، Focus باید به‌صورت منطقی مدیریت شود.

### 17.4. Screen Reader Support

عنوان صفحه و وضعیت Navigation باید برای Screen Reader قابل درک باشد.

### 17.5. Skip Links

برای صفحات دارای Navigation طولانی، Skip Link پیشنهاد می‌شود.

### 17.6. Active Route Announcement

تغییر صفحه باید در صورت نیاز برای فناوری‌های کمکی اعلام شود.

### 17.7. Reduced Motion

انیمیشن‌های انتقال میان صفحات باید با تنظیمات Reduced Motion سازگار باشند.

جزئیات کامل معیارهای دسترس‌پذیری در سند استاندارد Accessibility تعریف می‌شود.

---

## 18. SEO and Public Route Metadata

### 18.1. Public Page Metadata

صفحات عمومی باید Metadata مناسب داشته باشند:

- Page Title
- Meta Description
- Canonical URL
- Open Graph Metadata
- Language
- Robots Directives

### 18.2. Private Pages

صفحات خصوصی، مدیریتی و دارای اطلاعات شخصی نباید به‌صورت ناخواسته در موتورهای جست‌وجو ایندکس شوند.

### 18.3. Dynamic Metadata

Metadata صفحات پویا باید متناسب با محتوای واقعی صفحه تولید شود.

### 18.4. Canonical URLs

برای صفحات دارای URLهای معادل باید Canonical Policy تعریف شود.

### 18.5. Sitemap

Sitemap باید فقط مسیرهای عمومی و قابل ایندکس را شامل شود.

### 18.6. Rendering Strategy

نیاز به SSR، SSG یا CSR باید براساس ماهیت صفحه، SEO، عملکرد و معماری Backend بررسی شود.

هیچ مدل Rendering در این سند به‌عنوان انتخاب نهایی تصویب نمی‌شود.

---

## 19. Product-Specific Routing Requirements

### 19.1. Eco Nojin

مسیرهای عمومی و محتوایی باید:

- خوانا و قابل اشتراک‌گذاری باشند.
- از ساختار اطلاعاتی روشن پیروی کنند.
- Metadata مناسب داشته باشند.
- با چندزبانگی سازگار باشند.
- به صفحات محصولات دیگر ارتباط منطقی داشته باشند.

### 19.2. HyDroMA

مسیرهای علمی باید در صورت نیاز به محدوده داده و وضعیت پروژه متصل شوند.

نمونه اطلاعات موردنیاز:

- Project ID
- Dataset ID
- Model ID
- Simulation ID
- Spatial Scope
- Temporal Scope

داده‌های حساس نباید در Query String افشا شوند.

مسیر یک شبیه‌سازی باید به نتیجه واقعی و معتبر Backend متصل باشد.

### 19.3. Nojin Marketplace

مسیرهای بازارگاه باید برای محصولات و دسته‌بندی‌های عمومی قابل اشتراک‌گذاری باشند.

در مقابل، مسیرهای زیر باید محافظت شوند:

- User Orders
- Wallet
- Payment
- Seller Dashboard
- Financial Reports
- Private Inventory Operations

تغییر URL نباید موجب تغییر وضعیت مالی یا سفارش شود.

### 19.4. Tourism

صفحات عمومی گردشگری می‌توانند بر اساس مقصد، روستا، منطقه یا تجربه تعریف شوند.

اطلاعات خصوصی مدیریت مقصد و عملیات داخلی باید از صفحات عمومی جدا باشند.

---

## 20. Navigation Performance

### 20.1. Route Transition

تغییر صفحه باید بدون تأخیر غیرضروری انجام شود.

### 20.2. Navigation Feedback

در عملیات طولانی باید وضعیت بارگذاری یا انتقال مشخص باشد.

### 20.3. Route-Level Performance

شاخص‌های پیشنهادی:

- Route Transition Duration
- Route Load Failure Rate
- Chunk Load Failure Rate
- Navigation Interaction Latency
- Route-Level LCP
- Data Loading Duration

### 20.4. History Management

استفاده نادرست از Browser History نباید موجب بازگشت به وضعیت نامعتبر شود.

### 20.5. Scroll Restoration

سیاست Scroll Restoration باید برای هر نوع Navigation مشخص باشد.

### 20.6. Mobile Navigation

منوهای موبایل باید از نظر عملکرد، دسترس‌پذیری و مصرف منابع بررسی شوند.

---

## 21. Security Requirements

### 21.1. Route Security Boundary

Route Guard صرفاً لایه کنترل رابط کاربری است.

### 21.2. Open Redirect Prevention

مقصدهای Redirect باید اعتبارسنجی شوند.

### 21.3. Sensitive URL Data

قرار دادن داده محرمانه در Path یا Query ممنوع است، مگر آنکه طراحی امنیتی معتبر و تأییدشده‌ای وجود داشته باشد.

### 21.4. Browser History Exposure

اطلاعات حساس نباید از طریق History یا URLهای قابل مشاهده افشا شوند.

### 21.5. Authorization Revalidation

دسترسی به منابع خصوصی باید در Backend مجدداً بررسی شود.

### 21.6. Cache Isolation

Cache صفحات خصوصی باید با هویت کاربر و سیاست امنیتی هماهنگ باشد.

### 21.7. Referrer Policy

در صورت وجود اطلاعات حساس در URLهای مجاز، سیاست Referrer باید برای جلوگیری از افشای ناخواسته بررسی شود.

---

## 22. Testing and Quality Assurance

### 22.1. Route Unit Tests

موارد زیر باید آزمون شوند:

- Route Matching
- Dynamic Parameters
- Query Parsing
- Redirect Rules
- Route Metadata
- Navigation State

### 22.2. Authentication Tests

- Guest Access
- Authenticated Access
- Expired Session
- Logout
- Invalid Return URL
- Refresh Failure

### 22.3. Authorization Tests

- Role-Based Navigation
- Permission-Based Navigation
- Resource-Level Access
- Permission Revocation
- Direct URL Access

### 22.4. Navigation E2E Tests

سناریوهای اصلی کاربر باید از طریق رابط واقعی آزمون شوند.

### 22.5. Deep Linking Tests

- Direct URL Access
- Browser Refresh
- Shared Link
- Invalid Resource
- Expired Resource
- Unauthorized Resource

### 22.6. Internationalization Tests

- RTL Navigation
- LTR Navigation
- Language Switching
- Locale Persistence
- Encoded URLs

### 22.7. Error Route Tests

- 404
- 403
- 401
- Network Failure
- Chunk Failure
- Backend Unavailability

### 22.8. Browser Compatibility

مسیریابی باید در مرورگرهای هدف آزمون شود.

### 22.9. Accessibility Tests

آزمون‌های صفحه‌کلید، Focus، Screen Reader و Navigation Semantics باید انجام شوند.

---

## 23. Observability and Analytics

### 23.1. Navigation Events

در صورت مجاز بودن جمع‌آوری Telemetry، رویدادهای زیر قابل بررسی هستند:

- Page Viewed
- Route Changed
- Navigation Failed
- Route Access Denied
- Deep Link Opened
- Redirect Executed
- Chunk Load Failed

### 23.2. Privacy

ثبت URL کامل بدون بررسی مجاز نیست.

Query Parameters ممکن است حاوی داده حساس باشند.

### 23.3. Navigation Diagnostics

اطلاعات پیشنهادی:

- Route ID
- Product Context
- Navigation Type
- Load Duration
- Result Status
- Error Category

### 23.4. Analytics Separation

تحلیل رفتار کاربر باید از داده‌های عملیاتی و علمی محرمانه جدا باشد.

### 23.5. Failure Monitoring

نرخ خطاهای Route و شکست بارگذاری Chunk باید قابل پایش باشد.

---

## 24. Documentation and Governance

برای معماری مسیریابی باید مستندات زیر نگهداری شوند:

1. Route Registry
2. Route Hierarchy
3. Product Navigation Map
4. Authentication Route Matrix
5. Authorization Matrix
6. URL Naming Convention
7. Redirect Registry
8. Locale Routing Policy
9. Error Route Catalog
10. Deep Link Policy
11. Route Testing Evidence
12. Open Decisions Register

هر Route جدید یا تغییر مهم در مسیرهای موجود باید با ساختار مستندات هماهنگ باشد.

---

## 25. Risk Register

| ID | Risk | Impact | Proposed Mitigation |
|---|---|---|---|
| ROUTE-001 | Unauthorized Direct Route Access | Critical | Backend Authorization |
| ROUTE-002 | Open Redirect | High | Destination Validation |
| ROUTE-003 | Broken Deep Links | Medium/High | Direct URL Testing |
| ROUTE-004 | Route Naming Collision | Medium | Central Route Registry |
| ROUTE-005 | Stale Authentication State | High | Session Revalidation |
| ROUTE-006 | Cross-Product Navigation Coupling | Medium/High | Product Boundary Isolation |
| ROUTE-007 | Sensitive URL Exposure | High | URL Data Minimization |
| ROUTE-008 | Redirect Loop | Medium | Redirect Validation |
| ROUTE-009 | Incorrect Active Navigation State | Low/Medium | Route State Testing |
| ROUTE-010 | Chunk Loading Failure | Medium/High | Recovery Strategy |
| ROUTE-011 | Broken Browser History | Medium | History Behavior Testing |
| ROUTE-012 | RTL/LTR Navigation Defect | Medium | Bidirectional UI Testing |
| ROUTE-013 | Private Page Indexing | High | SEO and Robots Controls |
| ROUTE-014 | Stale Resource Route | Medium | Resource Availability Validation |
| ROUTE-015 | Incorrect Permission-Based UI | High | Permission State Synchronization |

---

## 26. Implementation Roadmap

### Phase 1 — Route Discovery

- استخراج Routeهای واقعی
- شناسایی صفحات موجود
- شناسایی مسیرهای بدون صفحه
- شناسایی Routeهای تکراری
- دسته‌بندی مسیرها بر اساس محصول

### Phase 2 — Route Inventory

- ایجاد Route Registry
- ثبت Route ID
- ثبت Layout
- ثبت وضعیت Authentication
- ثبت Permission Requirements
- ثبت Metadata

### Phase 3 — Navigation Architecture

- بررسی ساختار Navigation
- تفکیک منوهای محصولات
- تعیین ساختار Nested Routes
- تعیین Breadcrumbs
- تعیین Mobile Navigation

### Phase 4 — Security and Access

- بررسی Protected Routes
- بررسی Authorization
- کنترل Redirectها
- بررسی مسیرهای خصوصی
- بررسی دسترسی مستقیم URL

### Phase 5 — URL and State Management

- تعیین Naming Convention
- تعیین Query Parameter Policy
- بررسی Deep Linking
- تعیین Scroll Restoration
- تعیین Browser History Behavior

### Phase 6 — Validation

- اجرای Route Tests
- اجرای E2E Tests
- آزمون RTL/LTR
- آزمون دسترس‌پذیری
- آزمون خطاهای Navigation
- بررسی SEO مسیرهای عمومی

این مراحل پیشنهاد اجرایی هستند و به معنی مجوز تغییر Routeهای موجود یا اعمال تغییرات در Repository نیستند.

---

## 27. Open Decisions

| ID | Decision | Status |
|---|---|---|
| D-035-01 | انتخاب کتابخانه Routing | OPEN |
| D-035-02 | ساختار نهایی Route Registry | OPEN |
| D-035-03 | سیاست Prefix محصولات در URL | OPEN |
| D-035-04 | سیاست Locale در URL | OPEN |
| D-035-05 | ساختار Protected Routes | OPEN |
| D-035-06 | سیاست Route Metadata | OPEN |
| D-035-07 | ساختار Navigation مشترک و مستقل محصولات | OPEN |
| D-035-08 | سیاست Breadcrumb | OPEN |
| D-035-09 | سیاست Query Parameters | OPEN |
| D-035-10 | سیاست Deep Linking | OPEN |
| D-035-11 | سیاست Redirect و Legacy Routes | OPEN |
| D-035-12 | سیاست Scroll Restoration | OPEN |
| D-035-13 | سیاست Route-Level Code Splitting | OPEN |
| D-035-14 | انتخاب Rendering Strategy | OPEN |
| D-035-15 | سیاست SEO برای صفحات عمومی | OPEN |
| D-035-16 | سیاست Route Access Telemetry | OPEN |
| D-035-17 | ساختار Navigation موبایل | OPEN |
| D-035-18 | سیاست نمایش Routeهای مبتنی بر Permission | OPEN |

هیچ‌یک از تصمیمات فوق با انتشار این سند مصوب تلقی نمی‌شوند.

---

## 28. Acceptance Criteria

معماری مسیریابی زمانی قابل پذیرش است که:

- Routeهای موجود شناسایی و مستند شده باشند.
- مسیرهای هر محصول مرز مشخص داشته باشند.
- مسیرهای عمومی و خصوصی تفکیک شده باشند.
- Authentication و Authorization در UI به‌درستی مدیریت شوند.
- کنترل نهایی مجوزها در Backend انجام شود.
- Deep Linkها در سناریوهای مجاز کار کنند.
- Query Parameters اعتبارسنجی شوند.
- Redirectها در برابر مقصدهای نامعتبر محافظت شوند.
- Routeهای ناموجود و خطاها مدیریت شوند.
- Navigation با RTL و LTR سازگار باشد.
- صفحات خصوصی ناخواسته ایندکس نشوند.
- Browser History رفتار قابل پیش‌بینی داشته باشد.
- صفحات سنگین در صورت نیاز به‌صورت کنترل‌شده بارگذاری شوند.
- آزمون‌های Route و E2E شواهد معتبر داشته باشند.
- خطاهای امنیتی و دسترسی باز تعیین تکلیف شده باشند.

---

## 29. Definition of Done

این استاندارد زمانی در سطح اجرایی قابل پذیرش خواهد بود که:

1. Route Inventory معتبر وجود داشته باشد.
2. معماری مسیریابی با ساختار واقعی محصولات تطبیق داده شده باشد.
3. Navigation Map مستند شده باشد.
4. مسیرهای محافظت‌شده مشخص باشند.
5. کنترل‌های دسترسی سمت Backend تأیید شده باشند.
6. URL Convention تعریف شده باشد.
7. Deep Linking آزمون شده باشد.
8. Redirect Policy مشخص شده باشد.
9. Route Error Handling پیاده‌سازی و آزمون شده باشد.
10. RTL/LTR Navigation اعتبارسنجی شده باشد.
11. SEO مسیرهای عمومی بررسی شده باشد.
12. رفتار History و Scroll بررسی شده باشد.
13. آزمون‌های امنیتی و دسترس‌پذیری انجام شده باشند.
14. شواهد واقعی آزمون ثبت شده باشند.
15. تصمیمات باز موردنیاز تعیین تکلیف شده باشند.

**نکته:** وجود Route در کد یا نمایش موفق یک صفحه، به‌تنهایی اثبات‌کننده صحت معماری مسیریابی، امنیت دسترسی یا تکمیل قابلیت نیست.

---

## 30. Final Status

**Document Status:** DRAFT — PROPOSED — NOT APPROVED

**Approval Status:** NOT APPROVED

**Implementation Status:** NOT VERIFIED

**Architecture Decisions:** OPEN

این سند چارچوب پیشنهادی مسیریابی و ناوبری فرانت‌اند در اکوسیستم Eco Nojin را تعریف می‌کند.

اجرای آن مستلزم بررسی Routeهای واقعی، معماری فعلی محصولات، سیاست امنیتی و قراردادهای Backend است.

هیچ Route، Permission، Navigation Structure یا قابلیت جدیدی صرفاً به دلیل تعریف در این سند، مصوب یا فعال‌شده محسوب نمی‌شود.