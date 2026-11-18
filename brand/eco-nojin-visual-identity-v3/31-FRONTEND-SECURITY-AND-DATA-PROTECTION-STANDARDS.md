# Frontend Security and Data Protection Standards

## 1. Document Control

| Attribute | Value |
|---|---|
| Document ID | EN-FE-STD-031 |
| Document Number | 31 |
| Document Name | Frontend Security and Data Protection Standards |
| Ecosystem | Eco Nojin |
| Products | Eco Nojin, HyDroMA, Nojin Marketplace |
| Document Category | Frontend Engineering and Security |
| Version | 1.0.0 |
| Status | DRAFT — PROPOSED — NOT APPROVED |
| Date | 2026-11-17 |
| Approval Authority | Project Owner |
| Security Ownership | To Be Defined |

### 1.1. Status Notice

این سند چارچوب پیشنهادی امنیت فرانت‌اند و حفاظت از داده‌ها در اکوسیستم Eco Nojin است.

این سند به‌معنای تأیید امنیت فعلی هیچ‌یک از مخازن، سرویس‌ها، زیرساخت‌ها یا قابلیت‌های پروژه نیست.

هیچ فناوری، سیاست نگهداری داده، روش احراز هویت، ابزار امنیتی یا معماری پیشنهادی در این سند به‌عنوان تصمیم نهایی تلقی نمی‌شود.

پیاده‌سازی باید پس از بررسی معماری واقعی، مدل تهدید، الزامات حقوقی و تصمیم مالک پروژه انجام شود.

### 1.2. Normative Language

- **MUST:** الزام ضروری.
- **MUST NOT:** رفتار ممنوع.
- **SHOULD:** توصیه قوی.
- **SHOULD NOT:** رفتار نامطلوب.
- **MAY:** گزینه مجاز.
- **PROPOSED:** پیشنهاد نیازمند بررسی و تصویب.

---

# 2. Purpose

هدف این استاندارد ایجاد چارچوبی برای کاهش ریسک‌های امنیتی در لایه Frontend و حفاظت از داده‌های کاربران و اطلاعات عملیاتی اکوسیستم است.

اهداف:

1. کاهش سطح حمله Frontend.
2. حفاظت از اطلاعات احراز هویت.
3. جلوگیری از افشای اطلاعات حساس.
4. مدیریت امن Session و Authentication.
5. رعایت مرز میان Frontend و Backend در کنترل دسترسی.
6. جلوگیری از آسیب‌پذیری‌های رایج مرورگر.
7. کنترل امنیت ارتباطات API.
8. حفاظت از داده‌های علمی HyDroMA.
9. حفاظت از داده‌های مالی Nojin Marketplace.
10. حفاظت از اطلاعات کاربران و جوامع محلی.
11. کنترل ریسک کتابخانه‌ها و وابستگی‌های نرم‌افزاری.
12. ایجاد قابلیت ممیزی و پاسخ‌گویی به رخدادهای امنیتی.

---

# 3. Scope

این استاندارد برای تمام اجزای Frontend اکوسیستم کاربرد دارد.

## 3.1. Eco Nojin

دامنه‌های امنیتی:

- ثبت‌نام و ورود
- پروفایل کاربران
- مدیریت نقش‌ها
- داشبوردها
- اطلاعات روستاها
- اطلاعات جوامع محلی و عشایری
- اطلاعات پروژه‌ها
- محتوا و رسانه
- ارتباط با HyDroMA
- ارتباط با Nojin Marketplace
- پنل مدیریت
- سرویس‌های عمومی و اختصاصی

## 3.2. HyDroMA

دامنه‌های امنیتی:

- داده‌های آب
- داده‌های خاک
- داده‌های اقلیمی
- داده‌های پوشش گیاهی
- داده‌های ماهواره‌ای
- داده‌های مکانی
- ورودی مدل‌های علمی
- خروجی شبیه‌سازی
- گزارش‌های علمی
- داده‌های MRV
- اطلاعات مرتبط با کربن
- Model Provenance
- نسخه داده‌ها و مدل‌ها
- اطلاعات پروژه‌های علمی

## 3.3. Nojin Marketplace

دامنه‌های امنیتی:

- حساب فروشندگان
- اطلاعات محصولات
- سفارش‌ها
- پرداخت‌ها
- کیف پول
- حسابداری
- تراکنش‌ها
- موجودی
- تسویه
- اسناد تجاری
- گزارش‌های مالی

## 3.4. Security Boundary

این سند امنیت Frontend را پوشش می‌دهد؛ اما امنیت کل سامانه صرفاً با ایمن‌سازی Frontend تأمین نمی‌شود.

مسئولیت‌های Backend، Database، Infrastructure، API Gateway، شبکه و سرویس‌های خارجی باید در اسناد تخصصی مربوط تعیین شوند.

---

# 4. Security Principles

## 4.1. Defense in Depth

امنیت باید در چند لایه مستقل اعمال شود.

```text
User Browser
     |
     v
Frontend Security
     |
     v
Secure Transport
     |
     v
API Gateway
     |
     v
Backend Authentication
     |
     v
Backend Authorization
     |
     v
Domain Validation
     |
     v
Database / Services
```

امنیت Frontend نباید جایگزین کنترل‌های امنیتی Backend شود.

## 4.2. Zero Trust

هیچ داده‌ای صرفاً به‌دلیل دریافت از مرورگر، Cache، Local Storage یا یک سرویس خارجی قابل اعتماد تلقی نمی‌شود.

تمام ورودی‌های حساس باید اعتبارسنجی شوند.

## 4.3. Least Privilege

کاربر، کامپوننت و سرویس باید فقط به حداقل منابع و عملیات موردنیاز دسترسی داشته باشند.

## 4.4. Secure by Default

در صورت نامشخص بودن وضعیت امنیتی، رفتار پیش‌فرض باید محدودکننده باشد.

نمونه:

- عدم نمایش اطلاعات خصوصی
- عدم فعال‌سازی عملیات حساس
- عدم پذیرش داده نامعتبر
- عدم اعتماد به مجوز ذخیره‌شده در مرورگر
- عدم اجرای محتوای ناشناخته

## 4.5. Fail Securely

در زمان بروز خطا:

- اطلاعات محرمانه افشا نشوند.
- مجوزها به‌صورت پیش‌فرض اعطا نشوند.
- عملیات مالی موفق تلقی نشوند.
- نتیجه علمی نامعتبر نمایش داده نشود.
- سیستم وارد وضعیت دسترسی نامحدود نشود.

## 4.6. Data Minimization

فقط اطلاعات موردنیاز برای عملکرد قابلیت باید دریافت، پردازش و نگهداری شوند.

---

# 5. Threat Modeling

## 5.1. Threat Modeling Requirement

پیش از پیاده‌سازی قابلیت‌های حساس، مدل تهدید باید تهیه یا به‌روزرسانی شود.

مدل تهدید باید شامل موارد زیر باشد:

- Assets
- Threat Actors
- Entry Points
- Trust Boundaries
- Attack Scenarios
- Impact
- Likelihood
- Existing Controls
- Residual Risk
- Mitigation
- Owner

## 5.2. Security Assets

دارایی‌های مهم اکوسیستم:

| Asset | Security Importance |
|---|---|
| User Credentials | بسیار بالا |
| Session Tokens | بسیار بالا |
| Personal Data | بالا |
| Financial Records | بسیار بالا |
| Wallet Information | بسیار بالا |
| Payment Status | بسیار بالا |
| Scientific Inputs | بالا |
| Scientific Results | بالا |
| Geospatial Data | متناسب با حساسیت |
| Village and Community Data | متناسب با حساسیت |
| Carbon/MRV Records | بالا |
| Administrative Access | بسیار بالا |
| API Credentials | بسیار بالا |
| Source Maps | متناسب با محتوای افشاشده |

## 5.3. Threat Actors

تهدیدها ممکن است از سوی این گروه‌ها ایجاد شوند:

- مهاجم خارجی
- کاربر مخرب
- حساب کاربری تسخیرشده
- افزونه مرورگر مخرب
- وابستگی نرم‌افزاری آسیب‌پذیر
- سرویس خارجی آلوده
- کاربر دارای مجوز بیش از حد
- عامل داخلی
- اسکریپت یا محتوای تزریق‌شده

## 5.4. Threat Categories

مدل تهدید باید دست‌کم این موارد را پوشش دهد:

- Spoofing
- Tampering
- Repudiation
- Information Disclosure
- Denial of Service
- Elevation of Privilege

استفاده از STRIDE به‌عنوان یکی از روش‌های مدل‌سازی تهدید قابل بررسی است.

## 5.5. Attack Surface Inventory

سطح حمله باید مستند شود:

- Public Pages
- Authentication Pages
- Protected Routes
- Admin Panels
- API Calls
- File Upload
- File Download
- Rich Text Rendering
- External Links
- Third-Party Scripts
- Web Workers
- WebSocket Connections
- Browser Storage
- Service Workers
- Embedded Maps and Visualizations

---

# 6. Authentication Security

## 6.1. Authentication Authority

Backend مرجع نهایی تشخیص هویت کاربر است.

Frontend نباید هویت کاربر را صرفاً بر اساس داده‌های محلی معتبر تلقی کند.

## 6.2. Supported Authentication Models

گزینه‌های قابل بررسی:

- Secure Cookie-Based Session
- Token-Based Authentication
- OAuth 2.0
- OpenID Connect
- Multi-Factor Authentication
- Passkeys / WebAuthn

هیچ‌یک از این روش‌ها بدون بررسی معماری واقعی تصویب نمی‌شوند.

## 6.3. Credential Handling

موارد زیر الزامی هستند:

- Password نباید در Log ذخیره شود.
- Password نباید در URL قرار گیرد.
- Token نباید در URL قرار گیرد.
- Credential نباید در Analytics ثبت شود.
- Secret نباید در Source Code عمومی قرار گیرد.
- داده احراز هویت نباید در پیام خطای کاربر نمایش داده شود.
- Credential نباید به سرویس شخص ثالث غیرمجاز ارسال شود.

## 6.4. Password Security

Frontend می‌تواند کنترل‌های اولیه کیفیت رمز عبور را انجام دهد.

اما:

- سیاست اصلی Password در Backend اعمال می‌شود.
- Password نباید در Frontend Hash شده و به‌عنوان جایگزین پروتکل امن ارسال شود.
- Password نباید در State ماندگار شود.
- پس از پایان فرآیند، مقدار Password باید از فرم پاک شود.
- نمایش یا پنهان‌سازی Password نباید باعث ثبت آن در Log شود.

## 6.5. Multi-Factor Authentication

در صورت فعال بودن MFA:

- وضعیت Challenge باید روشن باشد.
- کدهای تأیید نباید ذخیره شوند.
- عملیات حساس نباید قبل از تکمیل Challenge تأیید شوند.
- خطاهای MFA نباید جزئیات غیرضروری افشا کنند.
- محدودیت تلاش باید در Backend اعمال شود.

## 6.6. Passkeys

در صورت استفاده از Passkeys:

- تعامل با WebAuthn باید با Backend هماهنگ باشد.
- Challenge باید از مرجع معتبر دریافت شود.
- Origin و RP ID باید صحیح باشند.
- Frontend نباید نتیجه محلی را به‌تنهایی تأیید نهایی تلقی کند.

---

# 7. Session and Token Security

## 7.1. Session Lifecycle

چرخه عمر Session باید مشخص باشد:

- Creation
- Validation
- Renewal
- Expiration
- Revocation
- Logout
- Recovery

## 7.2. Secure Cookie Considerations

در صورت استفاده از Cookie برای Session:

- Secure
- HttpOnly
- SameSite
- Path
- Domain
- Expiration

باید بر اساس مدل تهدید و معماری واقعی تنظیم شوند.

## 7.3. Browser Storage

ذخیره Token یا Session Secret در Local Storage یا Session Storage نباید بدون ارزیابی امنیتی پذیرفته شود.

داده‌های زیر نباید بدون ضرورت و کنترل مناسب در Browser Storage ذخیره شوند:

- Access Token
- Refresh Token
- Password
- Payment Credentials
- Private Keys
- Administrative Secrets

## 7.4. Logout

در زمان Logout:

1. Session باید طبق قرارداد Backend باطل شود.
2. داده خصوصی محلی پاک یا غیرقابل دسترس شود.
3. Cacheهای خصوصی کنترل شوند.
4. درخواست‌های حساس در حال اجرا مدیریت شوند.
5. دسترسی به صفحات محافظت‌شده متوقف شود.
6. اطلاعات کاربر قبلی به کاربر بعدی نمایش داده نشود.

## 7.5. Session Fixation and Hijacking

Frontend باید در هماهنگی با Backend و سیاست امنیتی، در برابر ریسک‌های Session Fixation و Session Hijacking محافظت شود.

کنترل‌های اصلی باید در Backend و لایه Session اعمال شوند.

---

# 8. Authorization and Access Control

## 8.1. Backend Enforcement

کنترل دسترسی واقعی باید در Backend اجرا شود.

مخفی کردن دکمه یا صفحه در Frontend کنترل امنیتی محسوب نمی‌شود.

## 8.2. Frontend Permission Rendering

Frontend MAY بر اساس مجوزهای دریافت‌شده، تجربه کاربری را تنظیم کند.

نمونه:

- نمایش یا پنهان‌سازی منو
- نمایش عملیات مجاز
- محدود کردن مسیرهای رابط کاربری
- نمایش پیام عدم دسترسی

اما هیچ‌یک از این موارد جایگزین کنترل دسترسی Backend نیست.

## 8.3. Role and Permission Model

مدل مجوزها باید بر اساس قرارداد واقعی Backend تعریف شود.

مفاهیم قابل بررسی:

- Role-Based Access Control
- Attribute-Based Access Control
- Resource-Level Authorization
- Tenant-Level Isolation
- Ownership-Based Access

انتخاب مدل نهایی نیازمند بررسی ساختار کاربران و سازمان‌ها است.

## 8.4. Privilege Escalation

Frontend نباید امکان تغییر قابل‌اعتماد موارد زیر را صرفاً با دست‌کاری State مرورگر فراهم کند:

- Role
- Permission
- User ID
- Organization ID
- Ownership
- Admin Flag
- Financial Authority

Backend باید این مقادیر را مستقل بررسی کند.

## 8.5. Protected Routes

Route Guard صرفاً یک کنترل تجربه کاربری است.

درخواست مستقیم به Endpoint باید حتی در صورت دور زدن Route Guard نیز در Backend کنترل شود.

---

# 9. Browser Security

## 9.1. Cross-Site Scripting (XSS)

XSS یکی از تهدیدهای اصلی برنامه‌های وب است.

Frontend MUST:

- داده‌های غیرقابل اعتماد را به‌عنوان HTML اجرایی تلقی نکند.
- از روش‌های امن Rendering استفاده کند.
- از تزریق مستقیم HTML بدون Sanitization معتبر خودداری کند.
- داده‌های خارجی را پیش از نمایش متناسب با Context پردازش کند.
- از اجرای Scriptهای غیرضروری جلوگیری کند.

## 9.2. Dangerous Rendering

استفاده از قابلیت‌هایی مانند `dangerouslySetInnerHTML` باید محدود و تحت بازبینی امنیتی باشد.

در صورت نیاز:

- Sanitization معتبر اعمال شود.
- محدوده Tagهای مجاز تعریف شود.
- Attributeهای خطرناک حذف شوند.
- URLهای ناامن کنترل شوند.
- سیاست امنیتی مستند شود.

## 9.3. Cross-Site Request Forgery (CSRF)

در معماری‌های Cookie-Based، ریسک CSRF باید بررسی شود.

کنترل‌های احتمالی:

- SameSite Cookie
- CSRF Token
- Origin Validation
- Referer Validation
- محدودیت Methodها

سیاست نهایی باید با Backend هماهنگ باشد.

## 9.4. Clickjacking

سیاست جلوگیری از Clickjacking باید در Headerهای امنیتی Backend یا لایه وب اعمال شود.

گزینه‌های قابل بررسی:

- Content-Security-Policy frame-ancestors
- X-Frame-Options

## 9.5. Open Redirect

Frontend و Backend باید از Redirect به مقصدهای غیرقابل اعتماد جلوگیری کنند.

Redirect URL نباید بدون اعتبارسنجی از ورودی کاربر پذیرفته شود.

## 9.6. URL Security

اطلاعات حساس نباید در Query String یا Fragment قرار گیرند.

URLها ممکن است در History، Log، Analytics و Referrer افشا شوند.

---

# 10. Content Security Policy

## 10.1. CSP Purpose

Content Security Policy یکی از لایه‌های دفاعی در برابر XSS و بارگذاری منابع غیرمجاز است.

## 10.2. Policy Considerations

سیاست CSP باید با معماری واقعی سازگار باشد.

موارد قابل کنترل:

- default-src
- script-src
- style-src
- img-src
- font-src
- connect-src
- frame-src
- object-src
- base-uri
- form-action
- frame-ancestors

## 10.3. Nonce and Hash

در صورت نیاز به Scriptهای مجاز:

- Nonce یا Hash معتبر قابل بررسی است.
- استفاده غیرضروری از `unsafe-inline` باید اجتناب شود.
- استفاده غیرضروری از `unsafe-eval` ممنوع یا محدود شود.

## 10.4. CSP Rollout

پیشنهاد می‌شود استقرار CSP به‌صورت مرحله‌ای انجام شود:

1. بررسی منابع واقعی
2. اجرای Report-Only
3. تحلیل Violationها
4. اصلاح وابستگی‌ها
5. اعمال Enforcement
6. پایش مداوم

CSP بدون آزمون نباید باعث از کار افتادن قابلیت‌های ضروری شود.

---

# 11. Secure API Communication

## 11.1. HTTPS

تمام ارتباطات حساس باید از HTTPS استفاده کنند.

ارسال اطلاعات محرمانه از طریق HTTP غیرامن ممنوع است.

## 11.2. API Trust Boundary

پاسخ API باید به‌عنوان داده خارجی اعتبارسنجی شود.

موارد زیر قابل اعتماد فرض نمی‌شوند:

- Response Body
- Error Message
- Redirect
- File URL
- Metadata
- User Role
- Financial Status
- Scientific Status

## 11.3. CORS

CORS باید بر اساس Originهای مشخص و مجاز تنظیم شود.

استفاده از Wildcard در ترکیب با Credentialهای حساس مجاز نیست.

## 11.4. API Secrets

Secretهای مربوط به سرویس‌های خارجی نباید در کد Frontend قرار گیرند.

اگر یک کلید برای استفاده عمومی طراحی شده باشد، باید محدودیت‌ها و Scope آن مشخص باشد.

کلیدهای دارای دسترسی مدیریتی یا محرمانه باید در Backend نگهداری شوند.

## 11.5. Request Tampering

Backend باید ورودی‌های حساس را مستقل اعتبارسنجی کند.

تغییر مقادیر زیر در مرورگر نباید باعث عبور از کنترل‌های امنیتی شود:

- Price
- Amount
- Quantity
- Role
- Ownership
- Permission
- Model Parameters
- Resource Identifier

---

# 12. Data Classification

## 12.1. Classification Model

پیشنهاد می‌شود داده‌های اکوسیستم بر اساس حساسیت طبقه‌بندی شوند.

| Level | Classification | Description |
|---|---|---|
| L0 | Public | اطلاعات عمومی و منتشرشده |
| L1 | Internal | اطلاعات داخلی غیرحساس |
| L2 | Confidential | اطلاعات محرمانه |
| L3 | Restricted | اطلاعات بسیار حساس و دارای ریسک بالا |

این طبقه‌بندی پیشنهادی است و باید با سیاست داده پروژه هماهنگ شود.

## 12.2. Data Examples

| Data | Suggested Classification |
|---|---|
| Public Product Information | L0 |
| Public Ecosystem Content | L0 |
| Internal Operational Reports | L1 |
| User Profile Details | L2 |
| Private Project Data | L2 |
| Financial Records | L3 |
| Authentication Secrets | L3 |
| Administrative Credentials | L3 |
| Sensitive Scientific Data | L2 or L3 |
| Restricted Geospatial Data | L3 |
| Private Community Information | L2 or L3 |

طبقه‌بندی نهایی باید بر اساس ماهیت داده، رضایت کاربران، الزامات قراردادی و مقررات قابل اعمال تعیین شود.

## 12.3. Data Handling

برای هر سطح باید مشخص شود:

- چه کسی دسترسی دارد؟
- داده کجا ذخیره می‌شود؟
- چه مدت نگهداری می‌شود؟
- آیا Cache مجاز است؟
- آیا Export مجاز است؟
- آیا اشتراک‌گذاری مجاز است؟
- آیا ثبت در Telemetry مجاز است؟
- چه سیاستی برای حذف داده وجود دارد؟

---

# 13. Personal Data Protection

## 13.1. Data Minimization

Frontend باید فقط اطلاعات ضروری را دریافت کند.

دریافت اطلاعات اضافی صرفاً برای راحتی احتمالی توسعه‌دهنده مجاز نیست.

## 13.2. Purpose Limitation

داده شخصی باید فقط برای هدف تعریف‌شده استفاده شود.

استفاده ثانویه نیازمند بررسی سیاست داده و مجوز مربوط است.

## 13.3. Sensitive Personal Information

داده‌های حساس باید با کنترل‌های سخت‌گیرانه‌تری مدیریت شوند.

نمونه‌ها:

- اطلاعات هویتی
- اطلاعات تماس خصوصی
- اطلاعات مالی
- موقعیت مکانی حساس
- اطلاعات سلامت
- اطلاعات خانوادگی
- اطلاعات مرتبط با افراد آسیب‌پذیر

## 13.4. Consent

در مواردی که جمع‌آوری یا پردازش داده نیازمند رضایت است:

- هدف باید روشن باشد.
- دامنه رضایت مشخص باشد.
- لغو رضایت در صورت الزام قابل مدیریت باشد.
- رضایت نباید با گزینه‌های گمراه‌کننده اخذ شود.
- ثبت رضایت باید مطابق سیاست Backend انجام شود.

## 13.5. Data Retention

Frontend نباید مستقلاً سیاست نگهداری داده تعیین کند.

مدت نگهداری باید در سطح سیاست داده و Backend مشخص شود.

## 13.6. Data Export

خروجی گرفتن از اطلاعات کاربران باید:

- بر اساس مجوز انجام شود.
- دامنه داده مشخص داشته باشد.
- از افشای داده اشخاص دیگر جلوگیری کند.
- قابل ردیابی باشد.
- مطابق سیاست امنیتی باشد.

---

# 14. Financial Data Security

## 14.1. Financial Data Classification

داده‌های مالی باید در سطح محرمانگی بالا مدیریت شوند.

نمونه‌ها:

- موجودی کیف پول
- تراکنش‌ها
- پرداخت‌ها
- اطلاعات تسویه
- صورتحساب‌ها
- اسناد حسابداری
- اطلاعات فروشندگان
- اطلاعات پرداخت

## 14.2. Financial Authority

Frontend مرجع نهایی وضعیت مالی نیست.

تمام عملیات مالی باید در Backend اعتبارسنجی و ثبت شوند.

## 14.3. Amount Integrity

Frontend MUST:

- مقدار مبلغ را با واحد پول مشخص نمایش دهد.
- از تبدیل ناخواسته Decimal به Floating Point جلوگیری کند.
- مقادیر نمایشی را از مقادیر مرجع تفکیک کند.
- از پذیرش مبلغ دست‌کاری‌شده به‌عنوان مبلغ معتبر جلوگیری کند.
- وضعیت Pending را با Success اشتباه نگیرد.

## 14.4. Payment Security

موارد زیر ممنوع هستند:

- تأیید پرداخت صرفاً بر اساس Redirect
- تأیید پرداخت بر اساس پیام مرورگر
- تغییر وضعیت پرداخت در State محلی به‌عنوان حقیقت
- ثبت موفقیت پیش از تأیید Backend
- نمایش تراکنش تأییدنشده به‌عنوان تراکنش قطعی

## 14.5. Financial Logs

اطلاعات حساس مالی نباید بدون ضرورت و مجوز در Log ثبت شوند.

---

# 15. Scientific and Geospatial Data Security

## 15.1. Scientific Data Integrity

داده علمی باید از نظر منشأ، نسخه، واحد و محدوده قابل ردیابی باشد.

Frontend نباید داده‌ای را که اعتبار آن مشخص نیست به‌عنوان داده معتبر نمایش دهد.

## 15.2. Model Input Protection

ورودی مدل‌های علمی باید:

- از نظر نوع داده بررسی شود.
- محدودیت مقادیر داشته باشد.
- واحد مشخص داشته باشد.
- محدوده مکانی و زمانی داشته باشد.
- در Backend اعتبارسنجی شود.

## 15.3. Model Execution Authorization

اجرای مدل‌های حساس باید بر اساس مجوز Backend کنترل شود.

Frontend نباید با تغییر پارامترهای محلی، محدودیت‌های دسترسی یا هزینه را دور بزند.

## 15.4. Scientific Result Protection

نتایج علمی ممکن است شامل اطلاعات محرمانه پروژه‌ها یا داده‌های حساس مکانی باشند.

دسترسی به آن‌ها باید بر اساس مالکیت، مجوز و سطح طبقه‌بندی داده کنترل شود.

## 15.5. Geospatial Privacy

مختصات جغرافیایی ممکن است اطلاعات حساسی درباره اشخاص، املاک، منابع طبیعی یا زیرساخت‌ها آشکار کنند.

انتشار عمومی مختصات دقیق نباید بدون بررسی مجوز و حساسیت داده انجام شود.

## 15.6. MRV and Carbon Provenance

اطلاعات MRV و کربن باید از نظر منشأ و وضعیت اعتبار قابل ردیابی باشند.

Frontend نباید:

- داده برآوردی را به‌عنوان داده تأییدشده معرفی کند.
- اعتبار داخلی را معادل تأیید رسمی بداند.
- اطلاعات Registry را بدون مرجع معتبر تولید کند.
- زنجیره Provenance را حذف یا مخدوش کند.

---

# 16. Community and Rural Data Protection

## 16.1. Scope

اطلاعات روستاها، جوامع محلی و گروه‌های عشایری ممکن است شامل داده‌های حساس اجتماعی، اقتصادی و مکانی باشند.

## 16.2. Protection Requirements

- اطلاعات خصوصی افراد بدون مجوز منتشر نشود.
- موقعیت دقیق منابع حساس عمومی نشود.
- اطلاعات اقتصادی خصوصی در صفحات عمومی نمایش داده نشود.
- دسترسی مدیران و کاربران محدود و قابل ردیابی باشد.
- داده‌های جمع‌آوری‌شده از جوامع دارای منشأ و هدف مشخص باشند.
- داده‌های فردی با آمار تجمیعی اشتباه نشوند.

## 16.3. Public Dashboard

داشبورد عمومی باید فقط داده‌هایی را نمایش دهد که انتشار آن‌ها مجاز است.

تجمیع یا ناشناس‌سازی داده باید با ارزیابی خطر بازشناسایی انجام شود.

---

# 17. File Upload Security

## 17.1. File Validation

اعتبارسنجی Frontend صرفاً یک کنترل اولیه است.

Backend باید اعتبار واقعی فایل را بررسی کند.

## 17.2. File Risks

ریسک‌های مهم:

- Malicious Scripts
- Executable Files
- Polyglot Files
- Oversized Files
- Malicious Documents
- Embedded Payloads
- Archive Bombs
- Misleading File Extensions

## 17.3. Frontend Controls

Frontend SHOULD:

- محدودیت حجم را نمایش دهد.
- پسوندهای مجاز را بررسی کند.
- تعداد فایل‌ها را محدود کند.
- نام فایل را به‌صورت امن نمایش دهد.
- خطاهای بارگذاری را کنترل کند.
- محتوای فایل را خودکار اجرا نکند.

## 17.4. Download Protection

فایل‌های دریافتی از منابع غیرقابل اعتماد نباید بدون کنترل اجرا شوند.

نام فایل نباید به‌صورت مستقیم برای ساخت مسیر فایل محلی استفاده شود.

## 17.5. File Preview

پیش‌نمایش فایل باید با توجه به نوع فایل و سطح اعتماد طراحی شود.

نمایش HTML یا SVG ناشناخته ممکن است سطح حمله ایجاد کند.

---

# 18. Third-Party Dependencies and Supply Chain Security

## 18.1. Dependency Inventory

وابستگی‌های Frontend باید قابل شناسایی باشند.

اطلاعات موردنیاز:

- Package Name
- Version
- License
- Source Repository
- Maintenance Status
- Security Advisories
- Transitive Dependencies
- Purpose
- Owner

## 18.2. Dependency Risk

ریسک‌های زیر باید بررسی شوند:

- Vulnerable Dependency
- Abandoned Package
- Typosquatting
- Malicious Package
- Dependency Confusion
- Compromised Maintainer
- Uncontrolled Update
- License Incompatibility

## 18.3. Lockfile

Lockfile باید در فرآیند کنترل نسخه نگهداری شود.

به‌روزرسانی وابستگی‌ها باید کنترل‌شده باشد.

## 18.4. Automated Scanning

ابزارهای بررسی وابستگی قابل ارزیابی هستند.

نمونه‌ها:

- npm audit
- OSV Scanner
- Dependabot
- Renovate
- Snyk

این ابزارها گزینه‌های پیشنهادی هستند، نه انتخاب قطعی.

## 18.5. Dependency Approval

وابستگی جدید باید از نظر موارد زیر بررسی شود:

- ضرورت فنی
- امنیت
- اندازه Bundle
- نگهداری
- مجوز نرم‌افزاری
- وابستگی‌های غیرضروری
- ریسک زنجیره تأمین

## 18.6. Third-Party Scripts

اسکریپت‌های خارجی باید حداقل و کنترل‌شده باشند.

موارد مهم:

- منبع بارگذاری
- سطح دسترسی
- داده قابل مشاهده
- امکان تغییر کد
- سیاست CSP
- ضرورت کسب‌وکار

---

# 19. Build and Deployment Security

## 19.1. Environment Separation

محیط‌های توسعه، آزمون، Staging و Production باید از یکدیگر تفکیک شوند.

## 19.2. Secret Management

Secretها نباید در موارد زیر قرار گیرند:

- Source Code
- Public Repository
- Frontend Bundle
- Public Environment Variables
- Browser Storage
- Source Maps Publicly Accessible

## 19.3. Environment Variables

هر متغیری که در زمان Build وارد Bundle عمومی شود باید قابل مشاهده توسط کاربران فرض شود.

قرار دادن Secret در متغیرهای Frontend ممنوع است.

## 19.4. Source Maps

Source Mapهای Production باید بر اساس سیاست انتشار و نیاز عملیاتی محافظت شوند.

## 19.5. Build Integrity

Artifactهای انتشار باید قابل ردیابی باشند.

در صورت امکان:

- Build Metadata
- Version
- Commit Reference
- Artifact Hash
- Dependency Manifest

ثبت شوند.

## 19.6. Deployment Authorization

استقرار Production و تغییر تنظیمات امنیتی حساس باید مطابق فرآیند تأیید مالک پروژه انجام شود.

---

# 20. Browser Storage and Caching Security

## 20.1. Storage Classification

| Storage | Security Consideration |
|---|---|
| Local Storage | قابل دسترسی توسط JavaScript |
| Session Storage | قابل دسترسی توسط JavaScript |
| Cookies | وابسته به Flags و سیاست مرورگر |
| IndexedDB | قابل دسترسی توسط JavaScript |
| Cache Storage | نیازمند کنترل داده و Scope |
| Memory State | موقت، اما قابل دسترسی در زمان اجرای برنامه |

هیچ‌یک از این مکانیزم‌ها به‌تنهایی تضمین‌کننده محرمانگی نیستند.

## 20.2. Sensitive Cache

داده‌های خصوصی باید با سیاست Cache مناسب مدیریت شوند.

## 20.3. Cache Isolation

Cache نباید میان کاربران یا نشست‌های مختلف نشت کند.

## 20.4. Logout Cache Cleanup

در زمان خروج کاربر، داده‌های خصوصی باید از دسترس نشست بعدی خارج شوند.

## 20.5. HTTP Cache

برای پاسخ‌های حساس، سیاست Cache باید در Backend و Headerهای HTTP مشخص شود.

استفاده از Cache عمومی برای داده‌های خصوصی ممنوع است.

---

# 21. Service Worker and PWA Security

در صورت استفاده از Service Worker یا قابلیت‌های PWA:

- Scope باید محدود باشد.
- فایل‌های Cache شده باید کنترل شوند.
- نسخه‌های قدیمی باید مدیریت شوند.
- داده حساس نباید بدون ضرورت Cache شود.
- Update Flow باید قابل اعتماد باشد.
- پیام‌های بین صفحه و Service Worker باید اعتبارسنجی شوند.
- Service Worker نباید به‌عنوان مرجع احراز هویت استفاده شود.

استفاده از PWA نیازمند بررسی مستقل امنیتی است.

---

# 22. Security for Maps, Charts and 3D Components

## 22.1. External Map Services

سرویس‌های نقشه خارجی باید از نظر موارد زیر بررسی شوند:

- Data Exposure
- API Key Restrictions
- Origin Restrictions
- Location Privacy
- Third-Party Tracking
- Availability
- License

## 22.2. Scientific Visualizations

داده‌های ورودی نمودارها و نمایشگرهای علمی باید اعتبارسنجی شوند.

محتوای غیرقابل اعتماد نباید به‌صورت HTML یا Script اجرا شود.

## 22.3. WebGL and 3D

استفاده از WebGL و محتوای سه‌بعدی باید از نظر منابع مصرفی، ورودی‌ها و وابستگی‌های خارجی بررسی شود.

داده‌های غیرمعتبر نباید به‌گونه‌ای پردازش شوند که باعث اختلال گسترده مرورگر شوند.

## 22.4. Geospatial Rendering

نمایش داده‌های مکانی خصوصی باید مطابق سطح دسترسی و طبقه‌بندی داده انجام شود.

---

# 23. Administrative Interface Security

## 23.1. Admin Surface

پنل مدیریت دارای سطح ریسک بالاتری است.

## 23.2. Administrative Requirements

- احراز هویت معتبر
- کنترل دسترسی در Backend
- محدودیت دسترسی به منابع حساس
- مدیریت Session سخت‌گیرانه
- ثبت رویدادهای مدیریتی
- تأیید عملیات حساس
- کنترل Export
- کنترل تغییرات Role
- مدیریت دسترسی اضطراری

## 23.3. Dangerous Operations

عملیات زیر باید کنترل ویژه داشته باشند:

- حذف کاربران
- تغییر نقش‌ها
- تغییر تنظیمات مالی
- تغییر تنظیمات امنیتی
- حذف داده
- تغییر اطلاعات علمی مرجع
- تغییر وضعیت اعتبار
- انتشار داده حساس

## 23.4. Confirmation

عملیات مخرب یا برگشت‌ناپذیر باید دارای تأیید مناسب باشند.

تأیید ظاهری Frontend جایگزین Authorization یا ثبت Audit در Backend نیست.

---

# 24. Error Handling and Information Disclosure

## 24.1. Error Disclosure

پیام‌های خطا نباید اطلاعات زیر را افشا کنند:

- Stack Trace
- Database Query
- Internal File Path
- Secret
- Token
- Internal Network Address
- Server Configuration
- Sensitive User Data

## 24.2. User-Facing Error

پیام خطا باید:

- قابل فهم باشد.
- اطلاعات محرمانه نداشته باشد.
- اقدام بعدی را در صورت امکان مشخص کند.
- شناسه پیگیری داشته باشد، اگر موجود است.

## 24.3. Security Errors

خطاهای امنیتی باید در Backend ثبت و بررسی شوند.

Frontend باید رفتار امن و محدودکننده داشته باشد.

---

# 25. Logging, Monitoring and Auditability

## 25.1. Security Events

رویدادهای قابل بررسی:

- Authentication Failure
- Session Expiration
- Unauthorized Access Attempt
- Permission Denial
- Suspicious Request Pattern
- File Upload Failure
- Sensitive Export
- Administrative Operation
- Security Policy Violation

## 25.2. Sensitive Logging Prohibition

موارد زیر نباید در Log ثبت شوند:

- Password
- Access Token
- Refresh Token
- Session Secret
- Private Keys
- Full Payment Credentials
- Sensitive Personal Data
- Unnecessary Location Data

## 25.3. Audit Trail

عملیات حساس باید در Backend دارای Audit Trail باشند.

Frontend نباید Audit Trail را به‌صورت مستقل و قابل دست‌کاری تولید کند.

## 25.4. Monitoring

شاخص‌های امنیتی باید در صورت امکان پایش شوند:

- Authentication Failure Rate
- Authorization Failure Rate
- Suspicious Request Rate
- Dependency Vulnerability Count
- CSP Violation Count
- Security Error Rate
- Sensitive Export Events

---

# 26. Security Testing

## 26.1. Security Test Categories

آزمون امنیت باید شامل موارد زیر باشد:

- Static Analysis
- Dependency Scanning
- Secret Scanning
- Dynamic Testing
- Authentication Testing
- Authorization Testing
- XSS Testing
- CSRF Testing
- CSP Testing
- File Upload Testing
- Storage Inspection
- API Security Testing
- Browser Compatibility Security Testing

## 26.2. Security Test Tools

ابزارهای قابل بررسی:

- OWASP ZAP
- Burp Suite
- Semgrep
- ESLint Security Plugins
- npm audit
- OSV Scanner
- Trivy
- Playwright Security-Oriented Tests

انتخاب ابزار باید بر اساس نیاز، مجوز استفاده، هزینه، دقت و محدودیت‌های محیط انجام شود.

## 26.3. OWASP References

مراجع پیشنهادی:

- OWASP Top 10
- OWASP Application Security Verification Standard
- OWASP Cheat Sheet Series
- OWASP Web Security Testing Guide

استفاده از این منابع باید متناسب با نسخه جاری و دامنه کاربرد انجام شود.

## 26.4. Security Test Evidence

هر آزمون امنیتی باید دارای شواهد باشد:

- Test ID
- Scope
- Environment
- Tool and Version
- Test Scenario
- Expected Result
- Actual Result
- Finding
- Severity
- Evidence
- Remediation Status

## 26.5. False Positives

یافته‌های ابزارهای خودکار باید توسط متخصص بررسی شوند.

خروجی Scanner به‌تنهایی اثبات‌کننده آسیب‌پذیری یا امنیت کامل نیست.

---

# 27. Vulnerability Severity and Remediation

## 27.1. Severity Classification

طبقه‌بندی پیشنهادی:

| Severity | Description | Expected Handling |
|---|---|---|
| Critical | امکان تسلط گسترده یا افشای شدید | توقف انتشار و رسیدگی فوری |
| High | آسیب‌پذیری با اثر جدی | رفع پیش از انتشار قابلیت |
| Medium | ریسک قابل توجه با شرایط مشخص | برنامه رفع کنترل‌شده |
| Low | اثر محدود | اصلاح در چرخه نگهداری |
| Informational | توصیه یا بهبود | بررسی و ثبت |

## 27.2. Remediation Workflow

```text
Detection
   |
   v
Triage
   |
   v
Severity Assessment
   |
   v
Owner Assignment
   |
   v
Remediation
   |
   v
Retesting
   |
   v
Verification
   |
   v
Closure
```

## 27.3. Security Exception

هر استثنای امنیتی باید شامل موارد زیر باشد:

- دلیل
- دامنه
- ریسک
- مدت اعتبار
- کنترل جبرانی
- مسئول
- تأییدکننده

استثناهای بدون زمان انقضا و مالک مشخص توصیه نمی‌شوند.

---

# 28. Security Incident Response

## 28.1. Incident Types

نمونه رخدادها:

- Credential Exposure
- Account Compromise
- Data Leakage
- XSS Exploitation
- Malicious Dependency
- Unauthorized Financial Operation
- Unauthorized Scientific Data Access
- Admin Account Compromise
- Session Hijacking
- Sensitive File Exposure

## 28.2. Incident Lifecycle

1. Detection
2. Reporting
3. Classification
4. Containment
5. Investigation
6. Eradication
7. Recovery
8. Verification
9. Post-Incident Review

## 28.3. Containment

در صورت رخداد جدی، اقدامات احتمالی:

- غیرفعال‌سازی قابلیت آسیب‌دیده
- مسدود کردن Endpoint
- ابطال Session
- لغو Credential
- توقف انتشار
- محدود کردن دسترسی
- حفظ شواهد
- اطلاع‌رسانی به مسئول مربوط

## 28.4. Incident Authority

اقدامات عملیاتی حساس باید مطابق اختیارهای تعریف‌شده و با مجوز مسئول مربوط انجام شوند.

این سند به‌تنهایی مجوز تغییر زیرساخت یا ابطال Credentialهای عملیاتی نیست.

---

# 29. Product-Specific Security Requirements

## 29.1. Eco Nojin

اولویت‌ها:

- حفاظت از هویت کاربران
- کنترل دسترسی به اطلاعات جوامع محلی
- حفاظت از داده‌های روستاها
- کنترل دسترسی به پنل مدیریت
- جلوگیری از افشای داده خصوصی
- حفاظت از حساب‌های سازمانی
- کنترل انتشار اطلاعات عمومی

## 29.2. HyDroMA

اولویت‌ها:

- حفاظت از داده‌های علمی محرمانه
- کنترل دسترسی به مدل‌ها
- حفاظت از ورودی و خروجی شبیه‌سازی
- حفظ Model Provenance
- کنترل دسترسی مکانی
- جلوگیری از دست‌کاری نتایج
- تفکیک داده برآوردی و تأییدشده
- حفاظت از داده‌های MRV

## 29.3. Nojin Marketplace

اولویت‌ها:

- حفاظت از حساب فروشندگان
- حفاظت از اطلاعات سفارش
- حفاظت از داده مالی
- جلوگیری از دست‌کاری قیمت
- جلوگیری از جعل وضعیت پرداخت
- کنترل دسترسی به کیف پول
- کنترل تراکنش‌های تکراری
- حفاظت از اسناد تجاری

---

# 30. Security Acceptance Criteria

معیارهای زیر پیشنهادی هستند.

| ID | Acceptance Criterion | Required Evidence |
|---|---|---|
| SEC-001 | مدل تهدید برای قابلیت‌های حساس تهیه شده باشد | Threat Model |
| SEC-002 | اطلاعات احراز هویت افشا نشوند | Security Review |
| SEC-003 | Credential در URL قرار نگیرد | Code Inspection |
| SEC-004 | Session Lifecycle مشخص باشد | Architecture Review |
| SEC-005 | Logout داده خصوصی را پاک یا غیرقابل دسترس کند | Session Test |
| SEC-006 | Authorization در Backend اعمال شود | Backend Evidence |
| SEC-007 | Route Guard به‌عنوان کنترل امنیتی نهایی استفاده نشود | Code Review |
| SEC-008 | XSS Controls بررسی شده باشند | Security Test |
| SEC-009 | CSRF Risk ارزیابی شده باشد | Security Review |
| SEC-010 | CSP متناسب با معماری بررسی شده باشد | CSP Test |
| SEC-011 | Redirect مقصد غیرمجاز نداشته باشد | Security Test |
| SEC-012 | ارتباطات حساس از HTTPS استفاده کنند | Transport Review |
| SEC-013 | Secret در Bundle عمومی وجود نداشته باشد | Secret Scan |
| SEC-014 | داده‌های شخصی طبقه‌بندی شده باشند | Data Inventory |
| SEC-015 | داده حساس غیرضروری دریافت نشود | Data Flow Review |
| SEC-016 | داده مالی از دست‌کاری Frontend محافظت شود | Financial Security Test |
| SEC-017 | نتیجه علمی دارای منشأ و وضعیت مشخص باشد | Scientific Review |
| SEC-018 | فایل‌ها از نظر امنیتی کنترل شوند | Upload Security Test |
| SEC-019 | وابستگی‌ها بررسی امنیتی شوند | Dependency Report |
| SEC-020 | محیط‌ها از یکدیگر تفکیک شوند | Configuration Audit |
| SEC-021 | Cache داده خصوصی کنترل شود | Cache Security Test |
| SEC-022 | خطاها اطلاعات داخلی افشا نکنند | Error Disclosure Test |
| SEC-023 | Logها فاقد Secret باشند | Log Inspection |
| SEC-024 | رخدادهای حساس قابل ردیابی باشند | Audit Evidence |
| SEC-025 | آسیب‌پذیری‌های بحرانی تعیین تکلیف شوند | Security Report |
| SEC-026 | رخداد امنیتی دارای فرآیند پاسخ‌گویی باشد | Incident Plan |
| SEC-027 | دسترسی پنل مدیریت محدود باشد | Authorization Test |
| SEC-028 | داده مکانی حساس کنترل شود | Geospatial Review |
| SEC-029 | سرویس‌های خارجی ارزیابی شوند | Third-Party Review |
| SEC-030 | استثناهای امنیتی دارای مجوز و زمان انقضا باشند | Exception Register |

## 30.1. Acceptance Rule

هیچ قابلیت امنیتی صرفاً بر اساس وجود کد یا تنظیمات پذیرفته نمی‌شود.

پذیرش نیازمند آزمون، شواهد و بررسی متناسب با ریسک است.

---

# 31. Security Risks Register

| Risk ID | Risk | Potential Impact | Proposed Control |
|---|---|---|---|
| SEC-R01 | XSS | سرقت نشست یا اجرای کد | Safe Rendering and CSP |
| SEC-R02 | CSRF | عملیات غیرمجاز | CSRF Protection |
| SEC-R03 | Token Leakage | تسخیر حساب | Credential Protection |
| SEC-R04 | Broken Authorization | افشای داده | Backend Authorization |
| SEC-R05 | Sensitive Data Exposure | نقض حریم خصوصی | Data Minimization |
| SEC-R06 | Malicious Dependency | اجرای کد مخرب | Supply Chain Security |
| SEC-R07 | Financial Tampering | خسارت مالی | Backend Validation |
| SEC-R08 | Scientific Data Tampering | نتیجه علمی نادرست | Provenance and Validation |
| SEC-R09 | Geospatial Disclosure | افشای موقعیت حساس | Access and Privacy Controls |
| SEC-R10 | Unsafe File Upload | اجرای محتوای مخرب | Server-Side File Validation |
| SEC-R11 | Insecure Cache | نشت اطلاعات | Cache Isolation |
| SEC-R12 | Admin Compromise | کنترل غیرمجاز سیستم | Strong Admin Controls |
| SEC-R13 | Open Redirect | فیشینگ | Redirect Validation |
| SEC-R14 | Excessive Third-Party Scripts | افزایش سطح حمله | Script Governance |
| SEC-R15 | Insecure Source Maps | افشای اطلاعات داخلی | Source Map Protection |
| SEC-R16 | Session Hijacking | تسخیر نشست | Session Security |

---

# 32. Open Decisions

هیچ‌یک از تصمیمات زیر با این سند نهایی نمی‌شوند.

| Decision ID | Decision | Status |
|---|---|---|
| SEC-D01 | مدل نهایی Authentication | OPEN |
| SEC-D02 | سیاست نگهداری Session | OPEN |
| SEC-D03 | روش مدیریت Credential | OPEN |
| SEC-D04 | سیاست MFA | OPEN |
| SEC-D05 | سیاست Passkeys | OPEN |
| SEC-D06 | مدل Authorization | OPEN |
| SEC-D07 | سیاست طبقه‌بندی داده | OPEN |
| SEC-D08 | سیاست Consent | OPEN |
| SEC-D09 | سیاست Data Retention | OPEN |
| SEC-D10 | سیاست CSP | OPEN |
| SEC-D11 | سیاست CSRF | OPEN |
| SEC-D12 | سیاست Security Headers | OPEN |
| SEC-D13 | ابزار Dependency Scanning | OPEN |
| SEC-D14 | ابزار Security Testing | OPEN |
| SEC-D15 | سیاست Source Maps | OPEN |
| SEC-D16 | سیاست Third-Party Scripts | OPEN |
| SEC-D17 | سیاست Browser Storage | OPEN |
| SEC-D18 | سیاست Cache داده حساس | OPEN |
| SEC-D19 | سیاست Security Logging | OPEN |
| SEC-D20 | سیاست Incident Response | OPEN |
| SEC-D21 | سیاست Geospatial Privacy | OPEN |
| SEC-D22 | سیاست حفاظت از داده جوامع محلی | OPEN |
| SEC-D23 | سیاست امنیت فایل‌ها | OPEN |
| SEC-D24 | سیاست امنیت پنل مدیریت | OPEN |
| SEC-D25 | مسئولیت رسمی Security Ownership | OPEN |
| SEC-D26 | سیاست امنیت Production Deployment | OPEN |

---

# 33. Implementation Restrictions

تا زمان بررسی و تصویب معماری امنیتی:

1. هیچ روش احراز هویت جدید بدون بررسی انتخاب نشود.
2. هیچ Secret در Frontend قرار نگیرد.
3. هیچ داده حساس بدون طبقه‌بندی ذخیره نشود.
4. هیچ کنترل دسترسی صرفاً در Frontend اجرا و معتبر تلقی نشود.
5. هیچ Endpoint حساس بدون کنترل Backend مصرف نشود.
6. هیچ داده مالی بر اساس State محلی قطعی تلقی نشود.
7. هیچ نتیجه علمی بدون کنترل منشأ و اعتبار نمایش داده نشود.
8. هیچ اسکریپت خارجی بدون بررسی امنیتی اضافه نشود.
9. هیچ وابستگی جدید بدون بررسی امنیت و مجوز نرم‌افزاری وارد نشود.
10. هیچ تغییر امنیتی Production بدون مجوز انجام نشود.
11. هیچ داده حساس در Log یا Analytics ثبت نشود.
12. هیچ فایل غیرقابل اعتماد بدون کنترل امنیتی پردازش نشود.
13. هیچ آسیب‌پذیری Critical بدون تعیین تکلیف رها نشود.
14. هیچ ادعای انطباق کامل امنیتی بدون شواهد مستقل مطرح نشود.

---

# 34. Definition of Done

این استاندارد زمانی در سطح اجرایی قابل پذیرش است که:

- دارایی‌های اطلاعاتی شناسایی شده باشند.
- طبقه‌بندی داده‌ها تعریف شده باشد.
- مدل تهدید تهیه شده باشد.
- مرزهای اعتماد مشخص شده باشند.
- Authentication و Authorization بررسی شده باشند.
- Session Lifecycle مشخص شده باشد.
- Browser Security ارزیابی شده باشد.
- API Security بررسی شده باشد.
- داده‌های شخصی و مالی حفاظت شده باشند.
- داده‌های علمی و مکانی کنترل شده باشند.
- وابستگی‌های نرم‌افزاری ارزیابی شده باشند.
- فرآیند امنیت فایل‌ها مشخص شده باشد.
- Security Testing اجرا شده باشد.
- آسیب‌پذیری‌های مهم تعیین تکلیف شده باشند.
- شواهد امنیتی ثبت شده باشند.
- استثناهای امنیتی مستند شده باشند.
- تأیید نهایی مسئول مجاز اخذ شده باشد.

---

# 35. References and Standards

مراجع زیر برای بررسی و تکمیل این استاندارد پیشنهاد می‌شوند:

1. OWASP Top 10 — Web Application Security Risks
2. OWASP Application Security Verification Standard (ASVS)
3. OWASP Cheat Sheet Series
4. OWASP Web Security Testing Guide
5. OWASP Software Component Verification Standard (SCVS)
6. NIST Cybersecurity Framework
7. NIST Secure Software Development Framework (SSDF)
8. W3C Web Authentication (WebAuthn)
9. W3C Content Security Policy
10. MDN Web Security Documentation
11. RFC 6265 — HTTP State Management Mechanism
12. RFC 9110 — HTTP Semantics

مراجع باید از نسخه‌های معتبر و به‌روز بررسی شوند. ذکر یک استاندارد در این فهرست به‌معنای انطباق تأییدشده پروژه با آن نیست.

---

# 36. Final Governance Statement

امنیت Frontend بخشی از امنیت کل اکوسیستم است، نه جایگزین امنیت Backend و زیرساخت.

در Eco Nojin، اطلاعات هویتی، مالی، علمی، مکانی و اجتماعی ممکن است دارای حساسیت و پیامدهای متفاوت باشند. بنابراین امنیت باید بر اساس طبقه‌بندی داده، مدل تهدید، حداقل دسترسی و اعتبارسنجی مستقل طراحی شود.

هیچ قابلیت حساس نباید صرفاً به دلیل وجود رابط کاربری، نمایش پیام موفقیت یا عبور از آزمون‌های سطحی، امن تلقی شود.

**Security Principle:**

Security must be demonstrated through implementation, testing, evidence, and independent verification.

**Document Status: DRAFT — PROPOSED — NOT APPROVED**

**Approval Authority: Project Owner**

**End of Document**