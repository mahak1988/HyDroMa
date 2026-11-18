# 22. FRONTEND SECURITY AND CLIENT-SIDE DATA PROTECTION STANDARDS

## Secure Frontend Architecture, Browser Security and User Data Protection

**Ecosystem:** Eco Nojin  
**Brands:** Eco Nojin / HyDroMA / Nojin Marketplace  
**Document ID:** EN-VI-022  
**Version:** 1.0.0  
**Status:** DRAFT — PROPOSED — NOT APPROVED  
**Classification:** Frontend Architecture / Application Security / Privacy  
**Security Scope:** Browser, Client Application, API Communication, User Interface  
**Approval Authority:** Project Owner  

---

# 1. PURPOSE

این سند چارچوب امنیتی لایه Frontend اکوسیستم Eco Nojin را تعریف می‌کند.

هدف آن کاهش ریسک‌های امنیتی ناشی از طراحی، توسعه و اجرای رابط کاربری و ایجاد مرز روشن میان مسئولیت‌های امنیتی Frontend، Backend، زیرساخت و سرویس‌های شخص ثالث است.

این استاندارد برای سه محصول زیر تدوین شده است:

1. Eco Nojin
2. HyDroMA
3. Nojin Marketplace

امنیت Frontend فقط به پنهان کردن اطلاعات یا اعتبارسنجی فرم‌ها محدود نیست. رابط کاربری در معرض حملات مرورگری، دست‌کاری ورودی‌ها، سرقت نشست، اجرای کد مخرب، نشت داده و سوءاستفاده از API قرار دارد.

## 1.1. Security Objectives

اهداف اصلی:

- حفاظت از هویت کاربران.
- حفاظت از نشست‌های احراز هویت.
- جلوگیری از افشای اطلاعات حساس.
- کاهش سطح حمله مرورگر.
- ارتباط امن با API.
- جلوگیری از XSS و سایر حملات سمت کاربر.
- مدیریت ایمن فایل‌ها و محتوای بارگذاری‌شده.
- حفاظت از داده‌های مالی و علمی.
- مدیریت ایمن خطاها.
- کاهش وابستگی به کد و سرویس‌های شخص ثالث پرریسک.
- ایجاد قابلیت ممیزی و ردیابی رخدادهای امنیتی.

## 1.2. Security Boundary

Frontend یک محیط قابل اعتماد برای نگهداری اسرار محسوب نمی‌شود.

تمام کدهای سمت مرورگر و داده‌های قابل مشاهده یا تغییر توسط کاربر باید بالقوه در معرض دست‌کاری فرض شوند.

بنابراین:

- هیچ Secret واقعی نباید در کد Frontend قرار گیرد.
- اعتبارسنجی سمت کاربر جایگزین اعتبارسنجی سمت سرور نیست.
- کنترل دسترسی صرفاً در رابط کاربری کافی نیست.
- پنهان کردن یک دکمه، مجوز دسترسی ایجاد نمی‌کند.
- داده‌های دریافت‌شده از API باید متناسب با نوع و منبع آن‌ها بررسی شوند.

---

# 2. SECURITY REFERENCE FRAMEWORK

چارچوب‌های مرجع پیشنهادی:

| Reference | Scope |
|---|---|
| OWASP ASVS | الزامات امنیتی برنامه‌های وب |
| OWASP Top 10 | ریسک‌های متداول امنیت وب |
| OWASP Cheat Sheet Series | راهنمای پیاده‌سازی کنترل‌های امنیتی |
| OWASP API Security Top 10 | امنیت API |
| OWASP WSTG | روش آزمون امنیت وب |
| NIST Cybersecurity Framework | مدیریت ریسک امنیت سایبری |
| NIST SP 800-63 | هویت دیجیتال و احراز هویت |
| RFC 6265 | مدیریت Cookie |
| RFC 9110 | مفاهیم HTTP |
| W3C CSP | سیاست امنیت محتوای وب |
| WCAG 2.2 | دسترس‌پذیری رابط |

## 2.1. Applicable Security Level

سطح امنیتی نهایی باید پس از ارزیابی ریسک محصولات تعیین شود.

به‌صورت پیشنهادی:

- ASVS برای استخراج الزامات قابل آزمون.
- OWASP Top 10 برای شناسایی ریسک‌ها.
- OWASP API Security برای مرز ارتباط Frontend و Backend.
- NIST برای حاکمیت و مدیریت ریسک.

این سند به‌تنهایی گواهی امنیتی یا انطباق با هیچ‌یک از چارچوب‌های فوق ایجاد نمی‌کند.

---

# 3. FRONTEND SECURITY ARCHITECTURE

معماری امنیتی باید مبتنی بر اصل دفاع چندلایه باشد.

## 3.1. Security Layers

| Layer | Responsibility |
|---|---|
| Browser Layer | محدودسازی رفتارهای ناامن مرورگر |
| UI Layer | جلوگیری از تعاملات گمراه‌کننده و نشت اطلاعات |
| Application Layer | مدیریت نشست، مجوز و وضعیت کاربر |
| API Layer | کنترل دسترسی و اعتبارسنجی سمت سرور |
| Infrastructure Layer | TLS، WAF، Network Security |
| Monitoring Layer | ثبت و تحلیل رخدادهای امنیتی |

## 3.2. Trust Boundaries

مرزهای اعتماد باید مشخص باشند:

- Browser ↔ Frontend Application
- Frontend ↔ API Gateway
- API Gateway ↔ Backend Services
- Frontend ↔ Third-Party Services
- Browser ↔ External Identity Provider
- Client ↔ File Storage
- Client ↔ Mapping and Satellite Providers

هر داده‌ای که از یک مرز اعتماد عبور می‌کند باید مطابق مدل تهدید بررسی شود.

## 3.3. Zero Trust Principle

رابط کاربری نباید بر اساس موقعیت شبکه یا سابقه تعامل، به‌صورت خودکار به یک درخواست اعتماد کند.

تمام عملیات حساس باید در سمت سرور مجدداً احراز هویت و مجوزدهی شوند.

---

# 4. AUTHENTICATION SECURITY

احراز هویت باید در مرز Backend یا سرویس هویت معتبر کنترل شود.

Frontend فقط مسئول اجرای امن جریان ورود و ارائه وضعیت قابل فهم به کاربر است.

## 4.1. Authentication Requirements

- ارتباط احراز هویت باید از طریق HTTPS انجام شود.
- رمز عبور نباید در Local Storage ذخیره شود.
- رمز عبور نباید در URL قرار گیرد.
- اطلاعات احراز هویت نباید در Logهای عمومی ثبت شوند.
- خطاهای ورود نباید اطلاعات حساس افشا کنند.
- فرآیند خروج باید وضعیت نشست را به‌درستی پاک‌سازی کند.
- صفحات حساس باید وضعیت اعتبار نشست را بررسی کنند.

## 4.2. Authentication Methods

روش‌های قابل بررسی:

- Password Authentication
- Multi-Factor Authentication
- Passkeys
- WebAuthn
- External Identity Provider

انتخاب روش نهایی به معماری Identity Provider و تصمیمات امنیتی پروژه وابسته است.

## 4.3. Multi-Factor Authentication

رابط کاربری MFA باید:

- مرحله فعلی را مشخص کند.
- روش احراز هویت را به‌وضوح توضیح دهد.
- خطاهای قابل اصلاح را اعلام کند.
- از ارسال تکراری درخواست جلوگیری کند.
- امکان استفاده از فناوری‌های کمکی را حفظ کند.
- وضعیت انقضای کد را اعلام کند.

## 4.4. Passkeys and WebAuthn

در صورت استفاده از Passkeys:

- دامنه مجاز باید به‌درستی تنظیم شود.
- Challenge باید سمت سرور تولید و اعتبارسنجی شود.
- پاسخ WebAuthn باید در Backend بررسی شود.
- خطاهای مرورگر باید بدون افشای جزئیات حساس نمایش داده شوند.

Frontend به‌تنهایی قادر به اثبات صحت احراز هویت نیست.

---

# 5. SESSION MANAGEMENT

مدیریت نشست یکی از مهم‌ترین بخش‌های امنیت Frontend است.

## 5.1. Session Principles

- نشست باید دارای چرخه عمر مشخص باشد.
- انقضای نشست باید سمت سرور اعمال شود.
- خروج کاربر باید نشست سمت سرور را نیز باطل کند.
- نشست‌های حساس باید امکان ابطال داشته باشند.
- نشست نباید صرفاً با حذف اطلاعات محلی معتبر تلقی شود.

## 5.2. Cookie Security

در صورت استفاده از Cookie برای نشست:

ویژگی‌های زیر باید بررسی شوند:

| Attribute | Purpose |
|---|---|
| HttpOnly | جلوگیری از دسترسی مستقیم JavaScript |
| Secure | ارسال Cookie فقط روی ارتباط امن |
| SameSite | کاهش ریسک برخی درخواست‌های Cross-Site |
| Path | محدودسازی مسیر ارسال |
| Domain | محدودسازی دامنه |
| Max-Age / Expires | تعیین طول عمر |

تنظیمات نهایی باید با معماری احراز هویت و نیازهای Cross-Origin سازگار باشند.

## 5.3. Token Storage

هیچ روش ذخیره‌سازی Token در مرورگر کاملاً مصون از حمله نیست.

سیاست پیشنهادی:

1. از نگهداری Tokenهای حساس و بلندمدت در Local Storage اجتناب شود.
2. در صورت امکان، معماری نشست مبتنی بر Cookie امن و HttpOnly بررسی شود.
3. در معماری Token-based، مدت اعتبار و چرخه Refresh دقیقاً طراحی شود.
4. Token در URL، Query String یا Log قرار نگیرد.
5. دسترسی به Token در کد به حداقل برسد.
6. اطلاعات حساس در IndexedDB یا Cache بدون ارزیابی امنیتی ذخیره نشوند.

استفاده از Cookie HttpOnly نیز به‌تنهایی خطر CSRF را برطرف نمی‌کند.

## 5.4. Logout

عملیات Logout باید:

- درخواست ابطال نشست را به Backend ارسال کند.
- اطلاعات نشست محلی را پاک‌سازی کند.
- وضعیت رابط را به حالت ناشناس بازگرداند.
- داده‌های حساس موقت را پاک کند.
- دسترسی به صفحات محافظت‌شده را متوقف کند.

## 5.5. Session Expiration

در زمان انقضای نشست:

- پیام روشن نمایش داده شود.
- کاربر به مسیر مناسب هدایت شود.
- داده‌های فرم تا حد امکان حفظ شوند.
- عملیات حساس بدون احراز مجدد ادامه پیدا نکند.

---

# 6. AUTHORIZATION AND ACCESS CONTROL

مجوزدهی باید سمت سرور انجام شود.

## 6.1. Frontend Authorization

Frontend می‌تواند بر اساس مجوزهای دریافتی:

- منوها را نمایش دهد.
- دکمه‌ها را فعال یا غیرفعال کند.
- صفحات را محدود کند.
- عملیات غیرمجاز را از دید کاربر پنهان کند.

اما این اقدامات صرفاً کنترل تجربه کاربری هستند.

## 6.2. Backend Enforcement

Backend باید برای هر درخواست:

- هویت درخواست‌کننده را بررسی کند.
- مجوز عملیات را بررسی کند.
- مالکیت منابع را بررسی کند.
- محدوده دسترسی را کنترل کند.
- از دسترسی مستقیم به منابع دیگران جلوگیری کند.

## 6.3. Role-Based Access Control

در صورت استفاده از RBAC:

- نقش‌ها باید در Backend تعریف شوند.
- مجوزها باید مستقل از نام نقش قابل مدیریت باشند.
- تغییر نقش باید در سرور اعمال شود.
- نقش‌های ذخیره‌شده در مرورگر قابل اعتماد نیستند.

## 6.4. Resource-Level Authorization

دسترسی به موارد زیر باید در سطح منبع کنترل شود:

- پروژه‌ها.
- مزارع.
- روستاها.
- مراتع.
- گزارش‌ها.
- سفارش‌ها.
- حساب‌های مالی.
- کیف پول‌ها.
- داده‌های مکانی.
- خروجی‌های شبیه‌سازی.

شناخت یک شناسه معتبر نباید برای دسترسی به منبع کافی باشد.

## 6.5. Tenant Isolation

در صورت پشتیبانی از چند سازمان یا چند مستأجر:

- شناسه Tenant نباید تنها از Client پذیرفته شود.
- Backend باید عضویت و محدوده دسترسی را بررسی کند.
- داده‌های Tenantها باید از هم جدا باشند.
- تغییر Tenant باید دارای کنترل امنیتی باشد.

---

# 7. CROSS-SITE SCRIPTING (XSS)

XSS یکی از ریسک‌های اصلی برنامه‌های تحت وب است.

## 7.1. XSS Prevention

- از درج مستقیم HTML کنترل‌نشده اجتناب شود.
- داده‌های غیرقابل اعتماد نباید به‌عنوان کد اجرا شوند.
- خروجی متناسب با Context کدگذاری شود.
- استفاده از DOM APIهای امن ترجیح داده شود.
- HTML تولیدشده توسط کاربر باید Sanitization شود.
- سیاست CSP مناسب تعریف شود.

## 7.2. Dangerous Patterns

موارد زیر باید با دقت بررسی شوند:

- `innerHTML`
- `outerHTML`
- `document.write`
- `eval`
- `new Function`
- اجرای Script از محتوای دریافتی
- Dynamic Script Injection

وجود این موارد لزوماً به معنی آسیب‌پذیری قطعی نیست، اما باید برای هر کاربرد، بررسی امنیتی مستند وجود داشته باشد.

## 7.3. Rich Text

در صورت پشتیبانی از ویرایشگر متن:

- HTML مجاز باید محدود باشد.
- Attributeهای خطرناک حذف شوند.
- URLهای نامعتبر مسدود شوند.
- Event Handlerهای HTML حذف شوند.
- محتوا پیش از نمایش پاک‌سازی شود.
- کتابخانه Sanitization باید به‌روز و ارزیابی‌شده باشد.

## 7.4. Content Security Policy

CSP باید با معماری واقعی برنامه تنظیم شود.

سیاست پیشنهادی اولیه برای بررسی:

- محدودسازی `default-src`
- محدودسازی `script-src`
- محدودسازی `object-src`
- تعریف `base-uri`
- تعریف `frame-ancestors`
- کنترل `connect-src`
- کنترل `img-src`
- کنترل `font-src`

استفاده از Nonce یا Hash برای Scriptهای مجاز باید بررسی شود.

استفاده گسترده از `unsafe-inline` یا `unsafe-eval` بدون توجیه امنیتی پذیرفته نیست.

CSP باید ابتدا در حالت Report-Only آزموده شود و پس از رفع ناسازگاری‌ها به سیاست اجرایی تبدیل شود.

---

# 8. CROSS-SITE REQUEST FORGERY (CSRF)

در معماری‌های مبتنی بر Cookie، خطر CSRF باید بررسی شود.

## 8.1. Required Controls

- SameSite مناسب.
- CSRF Token برای عملیات لازم.
- اعتبارسنجی Origin و Referer در Backend.
- استفاده صحیح از HTTP Methodها.
- جلوگیری از تغییر وضعیت با GET.
- بررسی درخواست‌های Cross-Origin.

## 8.2. Important Rule

CORS جایگزین CSRF Protection نیست.

محدودسازی دسترسی مرورگر از طریق CORS به‌تنهایی از ارسال تمام درخواست‌های ناخواسته جلوگیری نمی‌کند.

## 8.3. Sensitive Operations

عملیات زیر باید محافظت ویژه داشته باشند:

- تغییر اطلاعات حساب.
- تغییر رمز عبور.
- تغییر اطلاعات بانکی.
- ثبت پرداخت.
- انتقال وجه.
- تغییر مالکیت.
- حذف داده.
- تغییر مجوزها.

---

# 9. CROSS-ORIGIN RESOURCE SHARING (CORS)

سیاست CORS باید در Backend یا Gateway مدیریت شود.

## 9.1. CORS Requirements

- Originهای مجاز باید صریح باشند.
- Wildcard برای Originهای حساس پذیرفته نیست.
- Credentials فقط برای Originهای مورد اعتماد فعال شوند.
- Methodها محدود شوند.
- Headerهای مجاز مشخص شوند.
- Preflight درست مدیریت شود.

## 9.2. Environment Separation

محیط‌های زیر باید از نظر Origin و تنظیمات تفکیک شوند:

- Development
- Testing
- Staging
- Production

فعال بودن Origin توسعه در Production مجاز نیست، مگر با دلیل و تصویب مستند.

---

# 10. API COMMUNICATION SECURITY

تمام ارتباطات Frontend و Backend باید بر اساس قرارداد API و سیاست امنیتی مشخص انجام شوند.

## 10.1. Transport Security

- HTTPS الزامی است.
- گواهی TLS باید معتبر باشد.
- Mixed Content نباید وجود داشته باشد.
- ارتباط با APIهای خارجی باید ارزیابی شود.
- Redirectهای ناامن باید کنترل شوند.

## 10.2. API Request Controls

- Base URL باید از تنظیمات معتبر محیطی دریافت شود.
- Token نباید در Query String قرار گیرد.
- Timeout باید مشخص باشد.
- Retry باید برای عملیات مناسب طراحی شود.
- درخواست‌های حساس باید از تکرار ناخواسته محافظت شوند.
- خطاهای API باید به شکل امن مدیریت شوند.

## 10.3. Idempotency

برای عملیات حساس مالی و ثبت سفارش، پشتیبانی از Idempotency باید در Backend طراحی شود.

Frontend باید در صورت پشتیبانی API، کلید Idempotency مناسب را ارسال کند.

تولید کلید در Client به‌تنهایی تضمین جلوگیری از تراکنش تکراری نیست.

## 10.4. API Response Validation

داده دریافتی باید در برابر موارد زیر بررسی شود:

- ساختار مورد انتظار.
- نوع داده.
- محدوده مقدار.
- واحد اندازه‌گیری.
- وضعیت پاسخ.
- نسخه قرارداد.
- کامل بودن داده.

## 10.5. Error Handling

پیام خطای Backend نباید بدون بررسی به کاربر نمایش داده شود.

اطلاعات داخلی مانند موارد زیر نباید افشا شوند:

- Stack Trace.
- مسیر فایل سرور.
- اطلاعات پایگاه داده.
- Secret.
- جزئیات زیرساخت.
- Queryهای داخلی.
- Tokenها.

---

# 11. CLIENT-SIDE DATA PROTECTION

## 11.1. Sensitive Data Classification

داده‌ها باید از نظر حساسیت دسته‌بندی شوند.

| Class | Examples | Frontend Policy |
|---|---|---|
| Public | محتوای عمومی | نمایش مجاز |
| Internal | اطلاعات داخلی پروژه | دسترسی محدود |
| Confidential | اطلاعات کاربران و سازمان | کنترل دسترسی |
| Restricted | رمز، Token، اطلاعات حساس مالی | حداقل دسترسی و نگهداری |

این طبقه‌بندی پیشنهادی است و باید با سیاست رسمی طبقه‌بندی اطلاعات سازمان تطبیق داده شود.

## 11.2. Data Minimization

Frontend نباید داده‌ای بیش از نیاز واقعی رابط دریافت یا نگهداری کند.

## 11.3. Browser Storage

استفاده از Storageها باید بر اساس حساسیت داده بررسی شود.

| Storage | Security Consideration |
|---|---|
| Local Storage | در معرض دسترسی JavaScript |
| Session Storage | در معرض دسترسی JavaScript |
| IndexedDB | در معرض دسترسی کد همان Origin |
| Cookies | وابسته به Attributeها و سیاست نشست |
| Cache Storage | نیازمند سیاست حذف و کنترل داده |
| Memory State | موقت‌تر، اما همچنان در معرض XSS |

## 11.4. Prohibited Storage

موارد زیر نباید در Storage عمومی مرورگر نگهداری شوند:

- Password.
- Private API Key.
- Database Credentials.
- Long-Lived Secret Token.
- Private Signing Key.
- اطلاعات حساس احراز هویت.

## 11.5. Data Cleanup

هنگام Logout یا پایان دسترسی:

- داده‌های حساس موقت پاک شوند.
- Cacheهای وابسته به کاربر بررسی شوند.
- داده‌های کاربر قبلی در نشست بعدی نمایش داده نشوند.
- درخواست‌های در حال اجرا در صورت لزوم لغو شوند.

---

# 12. FINANCIAL SECURITY — NOJIN MARKETPLACE

اطلاعات مالی باید با سخت‌گیری بیشتری مدیریت شوند.

## 12.1. Financial Data Rules

- مبلغ مالی در Client مرجع نهایی نیست.
- محاسبه نهایی قیمت باید سمت سرور تأیید شود.
- مبلغ ارسالی از Client قابل اعتماد نیست.
- موجودی کیف پول باید از منبع معتبر دریافت شود.
- وضعیت پرداخت باید سمت سرور تأیید شود.
- نتیجه پرداخت نباید فقط بر اساس Redirect مرورگر تعیین شود.

## 12.2. Decimal Precision

برای مقادیر مالی:

- نمایش باید با واحد پول مشخص همراه باشد.
- دقت اعشار باید با قرارداد مالی تطبیق داشته باشد.
- تبدیل واحد باید کنترل شود.
- محاسبات حساس باید در Backend انجام شوند.
- استفاده از Floating Point برای محاسبات مالی مرجع مجاز نیست.

## 12.3. Payment Flow

فرآیند پرداخت باید:

1. درخواست پرداخت ایجاد کند.
2. مبلغ و سفارش در Backend ثبت شوند.
3. کاربر به درگاه معتبر هدایت شود.
4. نتیجه پرداخت از مسیر معتبر سمت سرور تأیید شود.
5. وضعیت سفارش به‌روزرسانی شود.
6. نتیجه نهایی به Frontend ارسال شود.

بازگشت کاربر از درگاه، به‌تنهایی اثبات پرداخت موفق نیست.

## 12.4. Wallet Security

نمایش کیف پول باید از داده معتبر Backend استفاده کند.

Frontend نباید امکان تغییر مستقیم موجودی را فراهم کند.

---

# 13. SCIENTIFIC DATA SECURITY — HYDROMA

داده‌های علمی ممکن است ارزش عملیاتی، اقتصادی و حقوقی داشته باشند.

## 13.1. Scientific Data Classification

نمونه داده‌های نیازمند کنترل:

- مختصات دقیق منابع آب.
- داده‌های مالکیت زمین.
- اطلاعات چاه‌ها.
- داده‌های کشاورزی اختصاصی.
- داده‌های عملکرد تولید.
- داده‌های پروژه‌های احیای سرزمین.
- داده‌های قراردادی MRV.
- داده‌های مربوط به کربن.
- گزارش‌های داخلی سازمان.

## 13.2. Provenance Integrity

Frontend نباید منشأ داده را به‌صورت غیرمستند تغییر دهد.

اطلاعات زیر باید از Backend معتبر دریافت شوند:

- Data Source.
- Timestamp.
- Model Version.
- Dataset Version.
- Calculation Method.
- Validation Status.
- Provenance Identifier.

## 13.3. Model Execution

در زمان اجرای مدل:

- ورودی‌ها باید اعتبارسنجی شوند.
- شناسه اجرای مدل باید از Backend دریافت شود.
- وضعیت اجرای مدل باید از منبع معتبر دریافت شود.
- خروجی باید به اجرای واقعی متصل باشد.
- داده نمونه نباید به‌عنوان نتیجه واقعی نمایش داده شود.

## 13.4. Scientific Export

خروجی گزارش‌های علمی باید شامل اطلاعات مجاز و قابل ردیابی باشد.

داده‌های حساس مکانی نباید بدون مجوز در فایل‌های عمومی قرار گیرند.

---

# 14. FILE UPLOAD AND DOWNLOAD SECURITY

## 14.1. Upload Validation

Frontend می‌تواند کنترل‌های اولیه انجام دهد:

- نوع فایل.
- حجم فایل.
- پسوند.
- نام فایل.
- محدودیت تعداد فایل.

اما اعتبارسنجی نهایی باید سمت سرور انجام شود.

## 14.2. File Type

اعتماد صرف به MIME Type یا پسوند فایل مجاز نیست.

Backend باید نوع واقعی فایل را بررسی کند.

## 14.3. File Name

نام فایل باید:

- پاک‌سازی شود.
- از Path Traversal جلوگیری کند.
- در Storage به شکل امن مدیریت شود.
- در نمایش HTML Escape شود.

## 14.4. File Download

دانلود فایل باید:

- مجوز دسترسی داشته باشد.
- از URLهای عمومی غیرضروری اجتناب کند.
- در صورت نیاز از URL امضاشده با عمر محدود استفاده کند.
- از افشای شناسه‌های حساس جلوگیری کند.

## 14.5. Dangerous File Types

فایل‌های اجرایی و محتوای فعال باید با سیاست سخت‌گیرانه بررسی شوند.

نمایش مستقیم HTML یا SVG غیرقابل اعتماد در Origin اصلی برنامه مجاز نیست، مگر با کنترل امنیتی مستند و کافی.

---

# 15. THIRD-PARTY DEPENDENCY SECURITY

Frontend به کتابخانه‌ها و سرویس‌های بیرونی وابسته است.

هر وابستگی می‌تواند سطح حمله برنامه را افزایش دهد.

## 15.1. Dependency Requirements

- وابستگی‌ها باید ثبت شوند.
- نسخه‌ها باید قابل ردیابی باشند.
- آسیب‌پذیری‌ها باید بررسی شوند.
- وابستگی‌های بلااستفاده حذف شوند.
- بسته‌های ناشناخته و بدون نگهداری فعال ارزیابی شوند.
- نصب وابستگی باید از منبع معتبر انجام شود.

## 15.2. Supply Chain Security

موارد پیشنهادی:

- Lockfile.
- Dependency Audit.
- Software Composition Analysis.
- SBOM.
- بررسی مجوزها.
- بررسی Integrity.
- کنترل تغییرات نسخه.

## 15.3. Third-Party Scripts

افزودن Script خارجی باید نیازمند بررسی باشد.

موارد ممنوع بدون تأیید:

- Scriptهای ناشناس.
- ابزارهای Tracking غیرضروری.
- کتابخانه‌های بارگذاری‌شده از CDN نامعتبر.
- کدهای تبلیغاتی غیرمجاز.
- Scriptهای دارای دسترسی گسترده به DOM.

## 15.4. Subresource Integrity

در صورت استفاده از منابع ثابت خارجی، استفاده از SRI باید بررسی شود.

---

# 16. FRONTEND CONFIGURATION SECURITY

## 16.1. Environment Variables

متغیرهایی که در Build فرانت‌اند قرار می‌گیرند، محرمانه محسوب نمی‌شوند.

هر مقداری که در Bundle نهایی قرار گیرد، بالقوه برای کاربر قابل مشاهده است.

## 16.2. Public Configuration

موارد مجاز:

- Public API Base URL.
- Public Feature Flags.
- Public Map Configuration.
- Public Client Identifiers.

موارد غیرمجاز:

- Secret Key.
- Private API Key.
- Database Password.
- Signing Secret.
- Private Service Credential.

## 16.3. Feature Flags

Feature Flag در Frontend کنترل امنیتی نیست.

Backend باید مجوز عملیات را مستقل بررسی کند.

---

# 17. BROWSER SECURITY HEADERS

Headerهای امنیتی باید در سطح Server یا Reverse Proxy تنظیم شوند.

| Header | Purpose |
|---|---|
| Content-Security-Policy | محدودسازی منابع و اجرای محتوا |
| Strict-Transport-Security | الزام ارتباط امن |
| X-Content-Type-Options | جلوگیری از MIME Sniffing |
| Referrer-Policy | محدودسازی ارسال Referrer |
| Permissions-Policy | محدودسازی قابلیت‌های مرورگر |
| Cross-Origin-Opener-Policy | جداسازی Context مرورگر |
| Cross-Origin-Resource-Policy | محدودسازی دریافت منابع |
| X-Frame-Options | کنترل نمایش در Frameهای خارجی، به‌عنوان راهکار سازگاری |

## 17.1. HSTS

HSTS باید پس از تأیید کامل HTTPS و معماری دامنه فعال شود.

تنظیمات شامل Subdomainها یا Preload نباید بدون ارزیابی اثرات اجرایی فعال شوند.

## 17.2. Clickjacking Protection

سیاست Frame باید با نیازهای واقعی محصول سازگار باشد.

اگر Embedding مجاز لازم است، دامنه‌های مجاز باید دقیقاً مشخص شوند.

## 17.3. Permissions Policy

دسترسی به قابلیت‌هایی مانند موارد زیر باید محدود شود:

- Camera.
- Microphone.
- Geolocation.
- Payment.
- USB.
- Clipboard.

قابلیت غیرضروری نباید بدون دلیل فعال باشد.

---

# 18. PRIVACY AND USER CONSENT

حفاظت از داده‌های کاربر باید از مرحله طراحی لحاظ شود.

## 18.1. Privacy by Design

- جمع‌آوری حداقل داده.
- هدف مشخص برای پردازش.
- محدودیت نگهداری.
- کنترل دسترسی.
- شفافیت درباره استفاده از داده.
- امکان اصلاح اطلاعات.
- امکان حذف مطابق سیاست معتبر.
- جلوگیری از استفاده ثانویه بدون مجوز مناسب.

## 18.2. Consent Management

در صورت نیاز به رضایت کاربر:

- هدف رضایت مشخص باشد.
- گزینه‌ها قابل فهم باشند.
- انتخاب کاربر ثبت شود.
- امکان تغییر انتخاب فراهم باشد.
- رضایت غیرضروری به استفاده از سرویس تحمیل نشود.

## 18.3. Analytics

اطلاعات تحلیل رفتار نباید شامل داده‌های حساس غیرضروری باشد.

موارد زیر نباید بدون ضرورت و مجوز وارد Analytics شوند:

- Password.
- Token.
- اطلاعات بانکی.
- داده‌های شخصی حساس.
- مختصات دقیق خصوصی.
- متن محرمانه فرم‌ها.

## 18.4. Session Replay

ابزارهای Session Replay باید از نظر نشت داده بررسی شوند.

فیلدهای حساس باید Mask یا Exclude شوند.

---

# 19. LOGGING AND CLIENT-SIDE MONITORING

ثبت رخدادها باید به‌گونه‌ای انجام شود که اطلاعات حساس افشا نشوند.

## 19.1. Client Logging

ثبت موارد زیر در Log عمومی مرورگر ممنوع است:

- Password.
- Access Token.
- Refresh Token.
- API Secret.
- اطلاعات مالی حساس.
- اطلاعات محرمانه کاربر.

## 19.2. Error Reporting

گزارش خطا باید شامل اطلاعات ضروری برای رفع مشکل باشد، نه کل داده‌های نشست یا فرم.

## 19.3. Security Events

نمونه رخدادهای قابل ثبت در Backend:

- ورود ناموفق.
- خروج از حساب.
- انقضای نشست.
- تغییر مجوز.
- تلاش برای دسترسی غیرمجاز.
- تغییر اطلاعات حساس.
- درخواست مشکوک.
- تغییر اطلاعات مالی.

ثبت و نگهداری این رخدادها باید با سیاست حریم خصوصی و امنیت سازمان سازگار باشد.

## 19.4. Correlation IDs

در صورت پشتیبانی Backend، شناسه همبستگی درخواست می‌تواند برای پیگیری خطا استفاده شود.

این شناسه نباید حاوی اطلاعات شخصی یا Secret باشد.

---

# 20. ERROR AND EXCEPTION SECURITY

## 20.1. Safe Error Messages

پیام خطا باید:

- برای کاربر قابل فهم باشد.
- اطلاعات حساس را افشا نکند.
- اقدام اصلاحی مناسب را توضیح دهد.
- در صورت نیاز شناسه پیگیری ارائه کند.

## 20.2. Development vs Production

در محیط Production:

- Stack Trace نباید به کاربر نمایش داده شود.
- Debug Panel نباید فعال باشد.
- Source Map عمومی باید از نظر افشای اطلاعات بررسی شود.
- پیام‌های داخلی توسعه نباید نمایش داده شوند.

## 20.3. Error Boundaries

در برنامه‌های React، Error Boundary می‌تواند از فروپاشی کامل رابط جلوگیری کند.

اما Error Boundary جایگزین مدیریت خطا در Backend یا امنیت API نیست.

---

# 21. FRONTEND ROUTING SECURITY

## 21.1. Protected Routes

مسیرهای محافظت‌شده باید وضعیت نشست و مجوز را بررسی کنند.

اما کنترل اصلی باید در Backend باشد.

## 21.2. Open Redirect

مسیرهای Redirect باید اعتبارسنجی شوند.

Redirect به URL خارجی نباید صرفاً از Query Parameter دریافت‌شده بدون بررسی استفاده کند.

## 21.3. Deep Links

لینک‌های عمیق باید:

- از نظر دسترسی بررسی شوند.
- داده حساس در URL نداشته باشند.
- پس از احراز هویت مجدداً اعتبارسنجی شوند.

## 21.4. URL Hygiene

قرار دادن موارد زیر در URL ممنوع است:

- Password.
- Session Token.
- Refresh Token.
- Private Key.
- اطلاعات مالی محرمانه.

---

# 22. SECURE STATE MANAGEMENT

وضعیت برنامه باید با توجه به حساسیت داده مدیریت شود.

## 22.1. State Separation

تفکیک پیشنهادی:

- Public UI State.
- User Session State.
- Server State.
- Sensitive Temporary State.
- Persistent Preferences.

## 22.2. State Protection

- داده حساس نباید بی‌دلیل در State عمومی قرار گیرد.
- داده سرور باید در محدوده مناسب نگهداری شود.
- Cache باید با تغییر کاربر پاک‌سازی یا تفکیک شود.
- تغییر Role باید وضعیت رابط را به‌روزرسانی کند.
- داده‌های قدیمی نباید به کاربر جدید نمایش داده شوند.

## 22.3. Race Conditions

در عملیات حساس باید از وضعیت‌های ناسازگار جلوگیری شود.

نمونه:

- خروج کاربر هنگام اجرای درخواست.
- تغییر حساب در حین دریافت داده.
- اجرای هم‌زمان درخواست پرداخت.
- بارگذاری داده Tenant قبلی پس از تغییر Tenant.

---

# 23. WEB WORKER, SERVICE WORKER AND CACHE SECURITY

در صورت استفاده از Service Worker یا Web Worker:

- دامنه Scope باید محدود باشد.
- فایل‌های Cache شده باید طبقه‌بندی شوند.
- اطلاعات حساس نباید در Cache عمومی ذخیره شوند.
- تغییر کاربر باید Cache مرتبط را مدیریت کند.
- پیام‌های Worker باید اعتبارسنجی شوند.
- Service Worker باید در برابر نسخه‌های قدیمی و ناسازگار مدیریت شود.

## 23.1. Cache Policy

سیاست Cache باید برای هر نوع داده تعیین شود.

| Data Type | Suggested Policy |
|---|---|
| Public Static Assets | Cache قابل استفاده |
| Public Documentation | Cache محدود |
| User Profile | نیازمند کنترل |
| Financial Data | Cache حساس و محدود |
| Authentication Data | عدم ذخیره در Cache عمومی |
| Private Scientific Data | کنترل دقیق و مجوزمحور |

سیاست نهایی باید با Headerهای HTTP و معماری سرویس هماهنگ باشد.

---

# 24. SECURITY FOR MAPS AND EXTERNAL DATA PROVIDERS

در Eco Nojin و HyDroMA، استفاده از سرویس‌های نقشه و داده خارجی باید کنترل شود.

## 24.1. Map API Keys

- کلیدهای عمومی مرورگر باید محدودیت دامنه داشته باشند.
- کلیدهای خصوصی نباید در Frontend قرار گیرند.
- سهمیه مصرف باید کنترل شود.
- امکان چرخش کلید بررسی شود.

## 24.2. External Data Sources

- منبع داده باید معتبر باشد.
- داده ورودی باید اعتبارسنجی شود.
- پاسخ خارجی نباید مستقیماً به‌عنوان HTML اجرا شود.
- اطلاعات حساس نباید به سرویس خارجی ارسال شوند مگر با مجوز و نیاز مشخص.

## 24.3. Geolocation

در صورت استفاده از موقعیت مکانی:

- مجوز کاربر باید رعایت شود.
- هدف جمع‌آوری مشخص باشد.
- دقت مکانی متناسب با نیاز باشد.
- ذخیره موقعیت دقیق محدود شود.
- امکان استفاده از روش جایگزین بررسی شود.

---

# 25. SECURITY FOR USER-GENERATED CONTENT

محتوای تولیدشده توسط کاربران ممکن است در معرض حملات باشد.

نمونه:

- نام محصولات.
- توضیحات کالا.
- دیدگاه‌ها.
- تصاویر.
- اسناد.
- پیام‌ها.
- معرفی مناطق.
- محتوای گردشگری.

## 25.1. Content Handling

- ورودی‌ها باید اعتبارسنجی شوند.
- خروجی باید متناسب با Context Escape شود.
- HTML باید در صورت نیاز Sanitization شود.
- URLهای مشکوک باید کنترل شوند.
- محتوای فایل‌ها باید بررسی شود.
- نمایش محتوای ناشناس باید با سیاست امن انجام شود.

## 25.2. Link Safety

لینک‌های خارجی باید:

- از نظر مقصد بررسی شوند.
- رفتار باز شدن مشخص داشته باشند.
- در صورت استفاده از Tab جدید، محافظت لازم داشته باشند.
- متن لینک گمراه‌کننده نداشته باشند.

---

# 26. SECURITY TESTING STRATEGY

آزمون امنیت باید در چرخه توسعه انجام شود.

## 26.1. Static Analysis

ابزارهای قابل بررسی:

- ESLint Security Rules.
- Semgrep.
- CodeQL.
- Dependency Audit.

## 26.2. Dependency Scanning

بررسی موارد زیر:

- CVE.
- نسخه آسیب‌پذیر.
- وابستگی غیرمستقیم.
- مجوز نرم‌افزار.
- وضعیت نگهداری بسته.

## 26.3. Dynamic Testing

آزمون‌های پیشنهادی:

- XSS.
- CSRF.
- CORS Misconfiguration.
- Authentication Bypass.
- Authorization Bypass.
- Open Redirect.
- Clickjacking.
- Session Management.
- File Upload.
- Cache Leakage.
- API Abuse.

## 26.4. Browser Testing

آزمون باید روی مرورگرهای پشتیبانی‌شده انجام شود.

## 26.5. Security Regression

پس از اصلاح نقص امنیتی، آزمون مربوط باید مجدداً اجرا شود.

---

# 27. SECURITY TEST ENVIRONMENTS

محیط‌ها باید تفکیک شوند:

| Environment | Purpose |
|---|---|
| Development | توسعه |
| Test | آزمون خودکار |
| Staging | آزمون یکپارچه |
| Production | سرویس واقعی |

الزامات:

- داده واقعی حساس در Development استفاده نشود، مگر با مجوز و کنترل.
- Secretها بین محیط‌ها مشترک نباشند.
- حساب‌های آزمایشی از حساب‌های واقعی جدا باشند.
- دسترسی محیط Production محدود باشد.
- Debug در Production غیرفعال باشد.

---

# 28. SECURITY INCIDENT RESPONSE

برای رخدادهای امنیتی Frontend باید فرآیند پاسخ وجود داشته باشد.

## 28.1. Incident Examples

- نشت Token.
- XSS فعال.
- انتشار Secret.
- افشای داده کاربر.
- دسترسی غیرمجاز.
- بارگذاری فایل مخرب.
- دست‌کاری جریان پرداخت.
- نشت Cache بین کاربران.

## 28.2. Response Steps

1. شناسایی رخداد.
2. ثبت زمان و محدوده.
3. محدودسازی اثر.
4. ابطال نشست یا Secret در صورت نیاز.
5. بررسی دامنه آسیب.
6. اصلاح علت اصلی.
7. آزمون مجدد.
8. ثبت گزارش.
9. بررسی اقدامات پیشگیرانه.

## 28.3. Incident Authority

ابطال Secretها، توقف سرویس، محدودسازی دسترسی و سایر اقدامات عملیاتی باید مطابق اختیارهای رسمی سازمان انجام شوند.

این سند به‌تنهایی مجوز اجرای چنین اقداماتی را صادر نمی‌کند.

---

# 29. FRONTEND SECURITY ACCEPTANCE CHECKLIST

| ID | Requirement | Status |
|---|---|---|
| SEC-001 | عدم وجود Secret در Bundle | OPEN |
| SEC-002 | مدیریت امن نشست | OPEN |
| SEC-003 | سیاست Cookie | OPEN |
| SEC-004 | محافظت XSS | OPEN |
| SEC-005 | محافظت CSRF | OPEN |
| SEC-006 | پیکربندی CORS | OPEN |
| SEC-007 | کنترل دسترسی Backend | OPEN |
| SEC-008 | حفاظت داده حساس | OPEN |
| SEC-009 | سیاست امنیت فایل | OPEN |
| SEC-010 | امنیت وابستگی‌ها | OPEN |
| SEC-011 | CSP | OPEN |
| SEC-012 | Security Headers | OPEN |
| SEC-013 | کنترل خطا و Log | OPEN |
| SEC-014 | امنیت Cache | OPEN |
| SEC-015 | حفاظت از جریان مالی | OPEN |
| SEC-016 | حفاظت داده علمی | OPEN |
| SEC-017 | Open Redirect Protection | OPEN |
| SEC-018 | Dependency Scanning | OPEN |
| SEC-019 | Security Regression Tests | OPEN |
| SEC-020 | Incident Response Procedure | OPEN |

---

# 30. SECURITY DEFECT SEVERITY

| Severity | Definition | Release Implication |
|---|---|---|
| Critical | امکان نفوذ یا افشای گسترده اطلاعات | توقف انتشار مؤثر |
| High | امکان دسترسی غیرمجاز یا آسیب جدی | نیازمند رفع پیش از انتشار |
| Medium | ضعف امنیتی محدود با اثر قابل توجه | نیازمند ارزیابی و تعیین تکلیف |
| Low | ضعف محدود با اثر پایین | ثبت و برنامه اصلاح |

تعیین شدت نهایی باید بر اساس شواهد، قابلیت بهره‌برداری و اثر واقعی انجام شود.

---

# 31. SECURITY EVIDENCE AND TRACEABILITY

برای هر کنترل امنیتی باید شواهد قابل بازبینی ثبت شود.

فیلدهای ضروری:

- Control ID
- Requirement
- Implementation Location
- Threat Addressed
- Test Method
- Test Result
- Evidence Reference
- Defect ID
- Commit Reference
- Reviewer
- Approval Status

## 31.1. Evidence Rules

موارد زیر به‌تنهایی اثبات امنیت نیستند:

- وجود یک کتابخانه امنیتی.
- وجود یک Middleware.
- وجود ProtectedRoute.
- وجود CSP در فایل تنظیمات.
- وجود Cookie با نام مشخص.
- موفقیت Build.
- موفقیت آزمون Unit.

کنترل امنیتی باید در محیط مناسب و با آزمون مرتبط اعتبارسنجی شود.

---

# 32. IMPLEMENTATION STATUS MODEL

وضعیت هر کنترل باید یکی از مقادیر زیر باشد:

| Status | Meaning |
|---|---|
| NOT_STARTED | بررسی آغاز نشده |
| DESIGNED | طراحی امنیتی انجام شده |
| IMPLEMENTED | کنترل در کد پیاده‌سازی شده |
| TESTED | آزمون انجام شده |
| VALIDATED | شواهد بررسی و تأیید شده |
| FAILED | کنترل آزمون را رد کرده |
| BLOCKED | مانع مشخص وجود دارد |
| EXEMPTED | استثنای مصوب و مستند |

هیچ کنترل امنیتی نباید بدون مدرک از NOT_STARTED به VALIDATED منتقل شود.

---

# 33. OPEN DECISIONS

| ID | Decision | Status |
|---|---|---|
| SEC-D01 | معماری نهایی Session Management | OPEN |
| SEC-D02 | سیاست رسمی Token Storage | OPEN |
| SEC-D03 | معماری Identity Provider | OPEN |
| SEC-D04 | سیاست CSP نهایی | OPEN |
| SEC-D05 | سیاست CORS نهایی | OPEN |
| SEC-D06 | طبقه‌بندی رسمی داده | OPEN |
| SEC-D07 | سیاست Cache داده حساس | OPEN |
| SEC-D08 | ابزار اصلی SAST | OPEN |
| SEC-D09 | ابزار اصلی Dependency Scanning | OPEN |
| SEC-D10 | سیاست SBOM | OPEN |
| SEC-D11 | سیاست Security Incident Response | OPEN |
| SEC-D12 | مسئول رسمی Security Review | OPEN |

این تصمیمات باید با معماری Backend، زیرساخت، امنیت سازمان و الزامات حقوقی تطبیق داده شوند.

---

# 34. FINAL ACCEPTANCE CRITERIA

این سند زمانی آماده تبدیل شدن به استاندارد اجرایی خواهد بود که:

1. معماری امنیتی Frontend با Backend تطبیق داده شود.
2. مرزهای اعتماد مشخص شوند.
3. مدل تهدید تدوین شود.
4. سیاست احراز هویت و نشست تصویب شود.
5. سیاست ذخیره‌سازی داده مشخص شود.
6. الزامات CSP و Security Headers تعیین شوند.
7. کنترل‌های امنیت API مشخص شوند.
8. جریان‌های مالی و علمی بررسی شوند.
9. ابزارهای آزمون انتخاب شوند.
10. آزمون‌های امنیتی واقعی انجام شوند.
11. نقص‌ها ثبت و تعیین تکلیف شوند.
12. شواهد فنی قابل بازبینی تولید شوند.

---

# 35. IMPORTANT SECURITY DISTINCTIONS

موارد زیر نباید با یکدیگر اشتباه گرفته شوند:

| Concept | Meaning |
|---|---|
| Authentication | تشخیص هویت |
| Authorization | کنترل مجوز |
| UI Protection | محدودسازی تعامل در رابط |
| Backend Enforcement | اعمال کنترل واقعی دسترسی |
| Encryption | حفاظت رمزنگاری‌شده از داده |
| Obfuscation | دشوارسازی خواندن کد |
| Validation | بررسی صحت داده |
| Sanitization | پاک‌سازی محتوای خطرناک |
| Security Testing | آزمون کنترل‌ها |
| Security Validation | تأیید شواهد امنیتی |

پنهان‌سازی کد، Minification یا Obfuscation جایگزین کنترل امنیتی نیست.

---

# 36. DOCUMENT STATUS

**Current Status:** DRAFT — PROPOSED — NOT APPROVED

**Approval:** NOT GRANTED

**Implementation Authorization:** NOT GRANTED BY THIS DOCUMENT

**Security Audit Status:** NOT ESTABLISHED

**Security Validation:** NOT ESTABLISHED

**Owner Decision:** REQUIRED

این سند چارچوب پیشنهادی امنیت Frontend برای اکوسیستم Eco Nojin است.

هیچ کنترل امنیتی صرفاً با تعریف در این سند، پیاده‌سازی‌شده یا تأییدشده تلقی نمی‌شود.

تمام کنترل‌ها باید با معماری واقعی محصول تطبیق داده شوند، پیاده‌سازی شوند، آزمون شوند و شواهد معتبر داشته باشند.

---

**END OF DOCUMENT 22**