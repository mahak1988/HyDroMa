# Frontend Third-Party Dependency and Supply Chain Governance Standards

**Document ID:** EN-FE-STD-033  
**Version:** 1.0.0  
**Status:** DRAFT — PROPOSED — NOT APPROVED  
**Classification:** Technical Architecture / Software Supply Chain / Security Governance  
**Scope:** Eco Nojin Ecosystem — Eco Nojin, HyDroMA, Nojin Marketplace  
**Date:** 2026-11-18

---

## 1. Purpose

این سند چارچوب پیشنهادی حاکمیت، ارزیابی، انتخاب، نصب، نگهداری، به‌روزرسانی و حذف وابستگی‌های نرم‌افزاری فرانت‌اند را تعریف می‌کند.

هدف، کاهش ریسک‌های ناشی از وابستگی به کتابخانه‌ها، بسته‌های ثالث، ابزارهای Build، افزونه‌ها، اسکریپت‌های خارجی و زنجیره تأمین نرم‌افزار است.

این استاندارد باید کمک کند تا:

- وابستگی‌های غیرضروری و تکراری کاهش یابند.
- منشأ و اعتبار بسته‌های نرم‌افزاری قابل ردیابی باشد.
- آسیب‌پذیری‌های شناخته‌شده به‌موقع شناسایی و مدیریت شوند.
- مجوزهای نرم‌افزارهای متن‌باز و تجاری رعایت شوند.
- نصب و Build پروژه تا حد امکان قابل بازتولید باشد.
- از ورود بسته‌های مخرب، آلوده یا دست‌کاری‌شده جلوگیری شود.
- به‌روزرسانی وابستگی‌ها بدون تخریب قابلیت‌های موجود انجام شود.
- زنجیره تأمین نرم‌افزار از توسعه تا انتشار قابل ممیزی باشد.

این سند به‌تنهایی جایگزین سیاست جامع امنیت، مدیریت اسرار، امنیت Backend یا امنیت زیرساخت نیست؛ بلکه استاندارد مکمل آن‌هاست.

---

## 2. Scope

این استاندارد تمام وابستگی‌های مرتبط با توسعه، Build، آزمون و اجرای فرانت‌اند را پوشش می‌دهد.

### 2.1. Runtime Dependencies

بسته‌هایی که مستقیماً در محیط مرورگر اجرا می‌شوند، از جمله:

- UI Component Libraries
- State Management Libraries
- Routing Libraries
- Form Libraries
- Data Fetching Libraries
- Charting Libraries
- Mapping Libraries
- Scientific Visualization Libraries
- Animation Libraries
- Internationalization Libraries
- Authentication Client Libraries
- Date and Time Libraries
- Utility Libraries

### 2.2. Development Dependencies

بسته‌هایی که برای توسعه یا کنترل کیفیت استفاده می‌شوند:

- Build Tools
- Bundlers
- Compilers
- TypeScript Tooling
- Linters
- Formatters
- Test Frameworks
- Browser Automation Tools
- Visual Regression Tools
- Accessibility Testing Tools
- Code Generators
- Documentation Tooling

### 2.3. Transitive Dependencies

وابستگی‌هایی که به‌صورت غیرمستقیم توسط بسته‌های دیگر وارد پروژه می‌شوند.

این دسته باید در ارزیابی ریسک لحاظ شود؛ زیرا یک کتابخانه ظاهراً معتبر ممکن است زنجیره‌ای از وابستگی‌های کم‌اعتبار یا آسیب‌پذیر را وارد پروژه کند.

### 2.4. External Runtime Resources

منابع خارجی که در زمان اجرای برنامه بارگذاری می‌شوند:

- Third-Party JavaScript
- External Fonts
- CDN Resources
- Analytics Scripts
- Map Tile Providers
- External APIs
- Embedded Widgets
- External Media Libraries

این منابع از نظر فنی ممکن است وابستگی Package Manager نباشند، اما از نظر زنجیره تأمین و امنیت اجرا باید ارزیابی شوند.

---

## 3. Governance Principles

اصول زیر به‌عنوان مبنای پیشنهادی مدیریت وابستگی‌ها تعریف می‌شوند.

### 3.1. Minimum Dependency Principle

هر وابستگی باید توجیه فنی مشخص داشته باشد.

افزودن بسته صرفاً به دلیل محبوبیت، سهولت یا استفاده در یک نمونه نمایشی کافی نیست.

### 3.2. Prefer Native Capabilities

در صورت کفایت قابلیت‌های استاندارد مرورگر، JavaScript، TypeScript و CSS، استفاده از کتابخانه خارجی باید توجیه شود.

### 3.3. Explicit Dependency Ownership

هر وابستگی باید مالک فنی یا مسئول نگهداری مشخص داشته باشد.

### 3.4. Reproducible Installation

نصب وابستگی‌ها باید با استفاده از فایل قفل و نسخه‌های کنترل‌شده قابل بازتولید باشد.

### 3.5. No Blind Updates

به‌روزرسانی خودکار و بدون بررسی نباید به انتشار مستقیم در محیط عملیاتی منجر شود.

### 3.6. Provenance Awareness

منشأ بسته، ناشر، مخزن اصلی، نسخه، تاریخ انتشار و وضعیت نگهداری باید تا حد امکان قابل بررسی باشند.

### 3.7. Security by Default

وابستگی‌ها باید از نظر آسیب‌پذیری، رفتار زمان نصب، مجوزهای اجرا و دسترسی به منابع حساس بررسی شوند.

### 3.8. Evidence-Based Acceptance

وجود یک بسته در فایل Manifest به معنی تأیید فنی یا امنیتی آن نیست.

---

## 4. Dependency Selection and Evaluation

پیش از افزودن هر وابستگی جدید، باید ارزیابی فنی متناسب با میزان ریسک انجام شود.

### 4.1. Required Evaluation Criteria

| معیار | توضیح |
|---|---|
| Functional Fit | انطباق با نیاز واقعی |
| Maintenance | وضعیت نگهداری و فعالیت پروژه |
| Security | سابقه و وضعیت آسیب‌پذیری |
| License | سازگاری مجوز با کاربرد موردنظر |
| Provenance | اعتبار ناشر و منشأ بسته |
| Compatibility | سازگاری با معماری موجود |
| Performance | اثر بر حجم Bundle و Runtime |
| Accessibility | پشتیبانی از دسترس‌پذیری |
| RTL/LTR | سازگاری با رابط‌های چندجهته |
| Documentation | کیفیت مستندات |
| Community | وضعیت اکوسیستم و پشتیبانی |
| Portability | امکان جایگزینی یا حذف |
| Transitive Risk | تعداد و ریسک وابستگی‌های غیرمستقیم |
| Long-Term Cost | هزینه نگهداری در بلندمدت |

### 4.2. Dependency Risk Classification

وابستگی‌ها باید بر اساس اثر احتمالی خرابی یا سوءاستفاده طبقه‌بندی شوند.

| سطح | تعریف | نمونه |
|---|---|---|
| Critical | دسترسی یا اثرگذاری بر امنیت، احراز هویت یا داده حساس | Authentication Client |
| High | اثرگذاری بر عملیات اصلی یا داده‌های مهم | Financial UI, Scientific Data Client |
| Medium | اثرگذاری بر قابلیت‌های عمومی | UI Components, Charts |
| Low | قابلیت‌های غیرحیاتی | Decorative Utilities |

این طبقه‌بندی پیشنهادی است و باید در ارزیابی واقعی هر بسته اعمال شود.

### 4.3. Dependency Decision Record

برای وابستگی‌های مهم، ثبت تصمیم فنی پیشنهاد می‌شود.

حداقل اطلاعات:

- Package Name
- Package Registry
- Official Repository
- Selected Version
- Intended Purpose
- Runtime or Development Classification
- License
- Maintainer Information
- Security Review
- Known Limitations
- Alternatives Considered
- Transitive Dependency Assessment
- Approval Status
- Review Date
- Responsible Owner

---

## 5. Package Registry and Provenance

### 5.1. Registry Governance

استفاده از Package Registry باید تحت سیاست مشخص انجام شود.

موارد قابل بررسی:

- اعتبار Registry
- مالکیت و مدیریت دامنه
- روش انتشار بسته‌ها
- پشتیبانی از امضای بسته یا Provenance
- سیاست حذف و انتشار مجدد نسخه‌ها
- امنیت ارتباطات
- قابلیت ثبت و ممیزی دریافت بسته‌ها

### 5.2. Official Package Identification

برای هر بسته مهم باید ارتباط میان نام Package و مخزن رسمی آن بررسی شود.

نباید صرفاً بر اساس شباهت نام یا تعداد دانلود، رسمی بودن یک بسته را فرض کرد.

### 5.3. Typosquatting Protection

پیش از نصب بسته باید موارد زیر بررسی شوند:

- نام‌های مشابه بسته‌های معتبر
- تفاوت‌های جزئی در حروف
- نام‌های جعلی با پسوند یا پیشوند غیرمعمول
- ناشر ناشناس
- مخزن فاقد ارتباط معتبر با پروژه اصلی
- بسته‌هایی که تازه ایجاد شده‌اند و ادعای جایگزینی یک ابزار شناخته‌شده را دارند

### 5.4. Package Identity

در پروژه‌های حساس، Package Identity باید فراتر از نام بسته بررسی شود.

اطلاعات پیشنهادی:

- Package Name
- Version
- Registry
- Publisher
- Repository URL
- Integrity Hash
- Release Timestamp
- Provenance Attestation، در صورت وجود

---

## 6. Version and Lockfile Governance

### 6.1. Lockfile Requirement

وجود یک Lockfile معتبر برای پروژه الزامی پیشنهادی است.

فایل قفل باید:

- در Version Control نگهداری شود.
- با Package Manager انتخاب‌شده سازگار باشد.
- در CI مورد استفاده قرار گیرد.
- بدون تغییرات غیرضروری حفظ شود.
- هنگام تغییر وابستگی‌ها بازبینی شود.

### 6.2. Package Manager Selection

انتخاب میان npm، pnpm، Yarn یا ابزارهای دیگر هنوز نیازمند تصمیم معماری است.

پس از انتخاب، استفاده هم‌زمان از چند Package Manager برای یک پروژه نباید بدون دلیل فنی و تصمیم ثبت‌شده انجام شود.

### 6.3. Version Pinning

برای وابستگی‌های حساس، سیاست نسخه‌گذاری باید مشخص باشد.

موارد قابل کنترل:

- Exact Version
- Semver Range
- Lockfile Resolution
- Peer Dependency Compatibility
- Transitive Version Resolution

صرف استفاده از Semver به معنی تضمین امنیت یا سازگاری نیست.

### 6.4. Lockfile Integrity

هر تغییر در Lockfile باید بررسی شود.

موارد مشکوک:

- تغییر گسترده نسخه‌های غیرمرتبط
- حذف یا جایگزینی غیرمنتظره بسته‌ها
- تغییر Registry
- تغییر Integrity Hash
- اضافه شدن بسته‌های جدید و ناشناس
- تغییر غیرمنتظره در Dependency Tree

### 6.5. Reproducible Installation

فرایند CI باید از روش نصب وابستگی‌ها با رعایت Lockfile استفاده کند.

در صورت استفاده از npm، دستور `npm ci` می‌تواند گزینه‌ای برای نصب قابل بازتولید باشد؛ انتخاب نهایی باید متناسب با Package Manager مصوب انجام شود.

---

## 7. Dependency Lifecycle Management

هر وابستگی باید چرخه عمر مشخصی داشته باشد.

### 7.1. Lifecycle States

```text
PROPOSED
   |
   v
EVALUATED
   |
   v
APPROVED
   |
   v
INSTALLED
   |
   v
MONITORED
   |
   +------> UPDATE_REQUIRED
   |             |
   |             v
   |          TESTED
   |             |
   |             v
   |          ACCEPTED
   |
   +------> DEPRECATED
   |
   +------> REMOVAL_PROPOSED
                  |
                  v
              REMOVED
```

این وضعیت‌ها پیشنهادی هستند و باید با فرایند واقعی مدیریت تغییرات هماهنگ شوند.

### 7.2. Adding Dependencies

هر تغییر وابستگی باید شامل موارد زیر باشد:

1. نیاز فنی مشخص
2. ارزیابی گزینه‌های جایگزین
3. بررسی مجوز
4. بررسی امنیت
5. بررسی اثر بر Bundle
6. بررسی سازگاری
7. آزمون قابلیت مرتبط
8. ثبت تغییر در Version Control

### 7.3. Updating Dependencies

به‌روزرسانی باید مرحله‌ای انجام شود.

ترتیب پیشنهادی:

1. شناسایی نسخه فعلی و نسخه هدف
2. بررسی Release Notes
3. بررسی Breaking Changes
4. بررسی Security Advisories
5. بررسی Peer Dependencies
6. اعمال تغییر در محیط توسعه
7. اجرای Unit و Integration Tests
8. اجرای E2E Tests متناسب با ریسک
9. بررسی Bundle و Performance
10. ثبت نتیجه و پذیرش تغییر

### 7.4. Removing Dependencies

حذف وابستگی باید با بررسی موارد زیر انجام شود:

- کدهای مصرف‌کننده
- وابستگی‌های غیرمستقیم
- Importهای پویا
- تنظیمات Build
- آزمون‌ها
- مستندات
- Lockfile
- تغییرات Bundle

پس از حذف باید اطمینان حاصل شود که قابلیت موردنظر به‌صورت ناخواسته از دست نرفته است.

---

## 8. Vulnerability Management

### 8.1. Vulnerability Detection

پیشنهاد می‌شود از ترکیبی از روش‌های زیر استفاده شود:

- Package Manager Audit
- Software Composition Analysis
- Security Advisory Feeds
- Dependency Scanning
- Repository Security Alerts
- SBOM Analysis
- Manual Security Review

هیچ ابزار واحدی پوشش کامل آسیب‌پذیری‌ها را تضمین نمی‌کند.

### 8.2. Severity Classification

طبقه‌بندی آسیب‌پذیری‌ها باید بر اساس CVSS و تحلیل اثر واقعی در معماری پروژه انجام شود.

| Severity | CVSS Base Score | اقدام پیشنهادی |
|---|---:|---|
| Critical | 9.0–10.0 | بررسی فوری و مهار ریسک |
| High | 7.0–8.9 | اولویت بسیار بالا |
| Medium | 4.0–6.9 | برنامه اصلاح زمان‌بندی‌شده |
| Low | 0.1–3.9 | ثبت و بررسی متناسب با ریسک |

CVSS به‌تنهایی برای تعیین اولویت نهایی کافی نیست.

مواردی مانند Exploitability، Exposure، Runtime Reachability و اثر بر داده‌های حساس نیز باید بررسی شوند.

### 8.3. Proposed Remediation Targets

اهداف زمانی زیر صرفاً پیشنهاد اولیه هستند:

| Severity | هدف بررسی اولیه | هدف اصلاح پیشنهادی |
|---|---:|---:|
| Critical | حداکثر 24 ساعت | حداکثر 72 ساعت |
| High | حداکثر 3 روز | حداکثر 7 روز |
| Medium | حداکثر 7 روز | حداکثر 30 روز |
| Low | حداکثر 30 روز | در چرخه نگهداری برنامه‌ریزی‌شده |

این زمان‌ها SLA مصوب نیستند و باید با ظرفیت تیم، نوع محصول و شدت واقعی مواجهه تطبیق داده شوند.

### 8.4. Vulnerability Exception

در صورت عدم امکان اصلاح فوری، ثبت استثنا باید شامل موارد زیر باشد:

- Vulnerability Identifier
- Affected Package
- Affected Version
- Exploitability Assessment
- Exposure Analysis
- Business Impact
- Temporary Mitigation
- Responsible Owner
- Expiration Date
- Approval Status

استثنای امنیتی نباید به‌صورت نامحدود معتبر بماند.

---

## 9. Software Bill of Materials (SBOM)

### 9.1. Purpose

برای نسخه‌های مهم محصول، تولید SBOM پیشنهاد می‌شود تا ترکیب وابستگی‌های نرم‌افزاری قابل شناسایی و ممیزی باشد.

SBOM باید در حد امکان شامل موارد زیر باشد:

- Component Name
- Version
- Supplier
- Package Identifier
- Dependency Relationships
- License
- Hash
- External References
- Build Context

### 9.2. Recommended Formats

دو قالب شناخته‌شده برای بررسی:

- SPDX
- CycloneDX

هیچ‌یک در این سند به‌عنوان قالب نهایی انتخاب نشده‌اند.

### 9.3. SBOM Lifecycle

SBOM باید با Artifact مشخصی مرتبط باشد.

هر SBOM باید بتواند به موارد زیر متصل شود:

- Product
- Release Version
- Build Identifier
- Artifact Hash
- Build Timestamp
- Source Revision

SBOM قدیمی نباید به‌عنوان فهرست وابستگی‌های نسخه جدید استفاده شود.

### 9.4. SBOM Limitations

SBOM به‌تنهایی اثبات‌کننده موارد زیر نیست:

- امن بودن نرم‌افزار
- نبود آسیب‌پذیری
- معتبر بودن ناشر
- نبود کد مخرب
- سلامت کامل زنجیره Build

SBOM ابزار شفافیت و تحلیل ترکیب نرم‌افزار است، نه گواهی امنیت.

---

## 10. License Compliance

### 10.1. License Inventory

مجوز تمام وابستگی‌های مستقیم و غیرمستقیم باید تا حد امکان شناسایی شود.

### 10.2. License Categories

طبقه‌بندی اولیه:

| دسته | نمونه‌ها | ملاحظه |
|---|---|---|
| Permissive | MIT, BSD, Apache-2.0 | بررسی شروط و Attribution |
| Weak Copyleft | MPL-2.0, LGPL | بررسی نحوه استفاده و توزیع |
| Strong Copyleft | GPL, AGPL | بررسی حقوقی دقیق |
| Commercial | Proprietary Licenses | بررسی قرارداد و مجوز استفاده |
| Unknown | NOASSERTION یا نامشخص | نیازمند بررسی بیشتر |

این جدول تفسیر حقوقی مجوزها نیست.

### 10.3. License Review

پیش از استفاده تجاری یا انتشار محصول باید موارد زیر بررسی شوند:

- مجاز بودن استفاده تجاری
- شروط توزیع
- الزامات ارائه متن مجوز
- الزامات Attribution
- الزامات انتشار تغییرات
- محدودیت‌های استفاده از Trademark
- شرایط Patent Grant
- تعهدات مربوط به Source Code

### 10.4. Unknown and Incompatible Licenses

وابستگی با مجوز نامشخص یا ناسازگار نباید بدون بررسی حقوقی وارد نسخه انتشار شود.

### 10.5. Attribution

در صورت نیاز، اطلاعات مجوز و Attribution باید در بخش مناسب محصول یا مستندات رسمی درج شوند.

---

## 11. Install Scripts and Build-Time Execution

### 11.1. Installation Script Risk

برخی بسته‌ها هنگام نصب یا Build اسکریپت اجرا می‌کنند.

این اسکریپت‌ها می‌توانند به فایل‌ها، متغیرهای محیطی، شبکه یا منابع سیستم دسترسی داشته باشند.

### 11.2. Required Controls

کنترل‌های پیشنهادی:

- بررسی Lifecycle Scripts
- محدود کردن دسترسی CI
- جلوگیری از قرار گرفتن Secrets غیرضروری در محیط نصب
- بررسی بسته‌های دارای رفتار نصب غیرعادی
- ثبت تغییرات وابستگی‌ها
- محدود کردن دسترسی شبکه در مراحل حساس
- بررسی Scriptهای Build قبل از اجرای آن‌ها در محیط حساس

### 11.3. Script Execution Policy

اجرای اسکریپت‌های نصب نباید به‌صورت کورکورانه مجاز فرض شود.

در صورت استفاده از ابزارهایی که امکان محدودسازی Scriptها را فراهم می‌کنند، سیاست باید به‌صورت مستند و سازگار با نیاز Build تعریف شود.

### 11.4. Build Isolation

محیط Build باید:

- حداقل دسترسی لازم را داشته باشد.
- به Secrets غیرضروری دسترسی نداشته باشد.
- از محیط عملیاتی جدا باشد.
- امکان ثبت رخدادهای مهم را فراهم کند.
- در صورت امکان از Network Access محدودشده استفاده کند.

---

## 12. Frontend Third-Party Runtime Scripts

### 12.1. General Policy

هر اسکریپت ثالث که در مرورگر کاربر اجرا می‌شود باید از نظر امنیت، حریم خصوصی، عملکرد و قابلیت اطمینان ارزیابی شود.

### 12.2. Evaluation Requirements

موارد قابل بررسی:

- مالک و ناشر اسکریپت
- هدف استفاده
- منابعی که به آن دسترسی دارد
- داده‌هایی که جمع‌آوری می‌کند
- رفتار در صورت قطع ارتباط
- تأثیر بر Performance
- سیاست Retention
- سیاست انتقال داده
- امکان غیرفعال‌سازی
- سازگاری با Content Security Policy

### 12.3. Subresource Integrity

در مواردی که منابع خارجی ثابت و قابل Hash هستند، استفاده از Subresource Integrity می‌تواند برای کنترل یکپارچگی منبع بررسی شود.

SRI جایگزین ارزیابی امنیتی منبع خارجی نیست.

### 12.4. Content Security Policy Coordination

سیاست CSP باید در سند امنیت فرانت‌اند تعریف شود.

این سند صرفاً الزام می‌کند که هر وابستگی خارجی از نظر نیازهای CSP بررسی شود.

افزودن دامنه‌های خارجی به CSP نباید بدون ارزیابی امنیتی انجام شود.

### 12.5. Third-Party Failure

خرابی سرویس خارجی نباید بدون ضرورت باعث از کار افتادن کل برنامه شود.

برای سرویس‌های غیرحیاتی باید رفتار جایگزین تعریف شود.

---

## 13. Dependency Management Across Eco Nojin Products

مدیریت وابستگی‌ها باید با ماهیت متفاوت محصولات اکوسیستم هماهنگ باشد.

### 13.1. Eco Nojin

وابستگی‌های مربوط به:

- Public Website
- Brand and Content Experience
- Internationalization
- Navigation
- User Experience
- Shared UI Components

باید با توجه به عملکرد، دسترس‌پذیری، امنیت و پایداری ارزیابی شوند.

### 13.2. HyDroMA

وابستگی‌های علمی و محاسباتی باید علاوه بر معیارهای عمومی، از نظر موارد زیر بررسی شوند:

- Numerical Accuracy
- Scientific Data Compatibility
- Unit Handling
- Spatial Data Integrity
- Temporal Data Integrity
- Model Version Compatibility
- Rendering Precision
- Dataset Provenance
- Memory and GPU Usage

کتابخانه نمودار یا Visualization نباید به‌تنهایی مرجع صحت محاسبات علمی تلقی شود.

خروجی علمی باید از موتور محاسباتی معتبر و قابل ردیابی دریافت شود.

### 13.3. Nojin Marketplace

وابستگی‌های مرتبط با عملیات اقتصادی باید با حساسیت بیشتر بررسی شوند:

- Financial Forms
- Currency Formatting
- Decimal Handling
- Order State
- Payment UI
- Wallet Display
- Accounting Interfaces
- Inventory
- Transaction History

کتابخانه فرانت‌اند نباید مرجع حقیقت موجودی، پرداخت، سفارش یا مانده حساب باشد.

محاسبات مالی حساس باید در Backend انجام شوند و فرانت‌اند صرفاً نمایش و تعامل کنترل‌شده را بر عهده داشته باشد.

### 13.4. Shared Dependencies

استفاده مشترک از یک وابستگی در چند محصول باید با بررسی موارد زیر انجام شود:

- Version Compatibility
- Shared Maintenance Ownership
- Security Exposure
- Bundle Impact
- Release Coupling
- Upgrade Compatibility

اشتراک وابستگی نباید باعث وابستگی اجباری و ناخواسته میان محصولات مستقل شود.

---

## 14. Dependency Update Strategy

### 14.1. Update Categories

| نوع به‌روزرسانی | توضیح | سطح بررسی |
|---|---|---|
| Security Patch | اصلاح آسیب‌پذیری | متناسب با شدت و اثر |
| Patch | رفع اشکال | آزمون Regression |
| Minor | قابلیت جدید سازگار | آزمون سازگاری |
| Major | تغییر ناسازگار احتمالی | بررسی کامل‌تر |

### 14.2. Update Channels

به‌روزرسانی‌ها می‌توانند در دسته‌های زیر مدیریت شوند:

- Critical Security Updates
- Routine Maintenance Updates
- Planned Major Updates
- Deferred Updates
- Emergency Updates

### 14.3. Automated Update Tools

ابزارهایی مانند Dependabot و Renovate می‌توانند برای شناسایی نسخه‌های جدید و ایجاد Pull Request بررسی شوند.

انتخاب و فعال‌سازی آن‌ها نیازمند ارزیابی سیاست Repository و ظرفیت نگهداری است.

### 14.4. Update Acceptance

هیچ به‌روزرسانی مهمی صرفاً به دلیل موفقیت Build پذیرفته نمی‌شود.

معیارهای پذیرش باید متناسب با نوع وابستگی شامل موارد زیر باشند:

- Build Validation
- Type Checking
- Unit Tests
- Integration Tests
- E2E Tests
- Security Scanning
- Bundle Analysis
- Runtime Validation
- Regression Review

---

## 15. Dependency Observability and Inventory

### 15.1. Dependency Inventory

پیشنهاد می‌شود فهرست متمرکز وابستگی‌ها نگهداری شود.

حداقل فیلدها:

| Field | Description |
|---|---|
| Package | نام بسته |
| Version | نسخه مورد استفاده |
| Product | محصول مصرف‌کننده |
| Type | Runtime / Development |
| Owner | مسئول فنی |
| License | نوع مجوز |
| Risk | سطح ریسک |
| Repository | مخزن اصلی |
| Last Reviewed | تاریخ آخرین بررسی |
| Status | وضعیت استفاده |

### 15.2. Monitoring

موارد زیر باید به‌صورت دوره‌ای بررسی شوند:

- Security Advisories
- Package Deprecation
- Maintainer Changes
- Repository Archival
- License Changes
- Registry Changes
- Breaking Releases
- Malicious Package Reports

### 15.3. Dependency Health

شاخص‌های پیشنهادی:

- Total Direct Dependencies
- Total Transitive Dependencies
- Critical Vulnerability Count
- High Vulnerability Count
- Unmaintained Dependency Count
- Unknown License Count
- Outdated Dependency Count
- Unused Dependency Count
- Runtime Bundle Contribution

تعداد کمتر وابستگی لزوماً به معنی امنیت بیشتر نیست؛ کیفیت، منشأ و سطح دسترسی نیز اهمیت دارند.

---

## 16. CI/CD Supply Chain Controls

### 16.1. CI Installation Controls

در CI باید:

- Lockfile معتبر بررسی شود.
- نسخه ابزارهای Build کنترل شود.
- وابستگی‌ها از Registry مجاز دریافت شوند.
- آسیب‌پذیری‌ها بررسی شوند.
- تغییرات غیرمنتظره Dependency Tree شناسایی شوند.
- دسترسی Build به Secrets محدود شود.

### 16.2. Build Provenance

برای Artifactهای مهم، اطلاعات منشأ Build باید قابل ثبت باشد.

اطلاعات پیشنهادی:

- Source Commit
- Build Workflow
- Build Environment
- Toolchain Versions
- Dependency Lockfile Hash
- Artifact Hash
- Build Timestamp
- SBOM Reference
- Approval Reference

### 16.3. Artifact Integrity

Artifact منتشرشده باید با Artifact آزموده‌شده یکسان باشد.

هرگونه تغییر پس از آزمون باید موجب ارزیابی مجدد شود.

### 16.4. Supply Chain Attestation

استفاده از استانداردها و ابزارهای Provenance Attestation مانند SLSA و Sigstore می‌تواند در مراحل بعدی بررسی شود.

این سند استفاده از هیچ ابزار مشخصی را تصویب نمی‌کند.

---

## 17. Open-Source Governance

### 17.1. FOSS Preference

در صورت برابری مناسب فنی و امنیتی، گزینه‌های متن‌باز قابل بررسی هستند.

با این حال، متن‌باز بودن به معنی امنیت، کیفیت یا پایداری تضمین‌شده نیست.

### 17.2. Project Health

برای بسته‌های مهم، وضعیت پروژه باید بررسی شود:

- Release Frequency
- Maintainer Activity
- Issue Resolution
- Security Response
- Documentation
- Community Health
- Governance Model
- Project Sustainability

### 17.3. Forking and Internal Maintenance

Fork کردن یک کتابخانه باید فقط در صورت وجود دلیل فنی مشخص انجام شود.

هزینه نگهداری Fork باید پیش از تصمیم ارزیابی شود.

### 17.4. Abandoned Dependencies

در صورت توقف نگهداری یک وابستگی، باید یکی از مسیرهای زیر بررسی شود:

- جایگزینی
- مهاجرت
- Fork کنترل‌شده
- محدودسازی کاربرد
- حذف

---

## 18. Dependency Performance Governance

### 18.1. Bundle Impact

هر وابستگی Runtime باید از نظر اثر بر حجم JavaScript و زمان اجرای مرورگر بررسی شود.

### 18.2. Tree Shaking

در صورت پشتیبانی، باید از Importهای هدفمند و Tree Shaking استفاده شود.

### 18.3. Dynamic Loading

کتابخانه‌های سنگین مانند نقشه، نمودارهای پیچیده و Visualization سه‌بعدی باید در صورت تناسب با معماری به‌صورت Lazy Loaded بررسی شوند.

### 18.4. Runtime Resource Consumption

برای وابستگی‌های سنگین باید موارد زیر بررسی شوند:

- CPU Usage
- Memory Usage
- GPU Usage
- Main Thread Blocking
- Network Transfer
- Startup Cost
- Interaction Latency

### 18.5. Performance Regression

به‌روزرسانی یک وابستگی نباید بدون بررسی اثر آن بر Performance پذیرفته شود.

---

## 19. Dependency Security Exceptions

استثناهای مربوط به وابستگی‌ها باید محدود، مستند و زمان‌دار باشند.

موارد قابل استثنا:

- Vulnerability Fix Deferred
- License Review Pending
- Temporary Legacy Dependency
- Unavailable Alternative
- Compatibility Constraint
- Emergency Operational Requirement

هر استثنا باید شامل:

- Reason
- Risk Assessment
- Compensating Controls
- Owner
- Approval
- Expiration
- Review Date

باشد.

استثنا نباید به مسیر دائمی دور زدن کنترل‌های امنیتی تبدیل شود.

---

## 20. Roles and Responsibilities

| نقش | مسئولیت پیشنهادی |
|---|---|
| Product Owner | تأیید ریسک‌های محصولی و تصمیمات مالکیتی |
| Frontend Architect | ارزیابی معماری و سازگاری |
| Frontend Developer | بررسی و نگهداری وابستگی‌های مصرفی |
| Security Reviewer | بررسی ریسک‌های امنیتی |
| DevOps / Build Engineer | کنترل زنجیره Build و CI |
| Legal Reviewer | بررسی موارد حقوقی و مجوزها |
| QA Engineer | اعتبارسنجی تغییرات و Regression |

این جدول نقش‌های پیشنهادی را تعریف می‌کند و به معنی تعیین ساختار سازمانی نهایی نیست.

---

## 21. Acceptance Criteria

یک وابستگی مهم زمانی می‌تواند برای استفاده پذیرفته شود که معیارهای متناسب با ریسک آن بررسی شده باشند.

### 21.1. Selection Acceptance

- نیاز واقعی ثبت شده باشد.
- گزینه‌های جایگزین بررسی شده باشند.
- منشأ بسته مشخص باشد.
- نسخه انتخاب‌شده مشخص باشد.
- مجوز بررسی شده باشد.
- ریسک وابستگی‌های غیرمستقیم ارزیابی شده باشد.

### 21.2. Security Acceptance

- آسیب‌پذیری‌های شناخته‌شده بررسی شده باشند.
- رفتار اسکریپت‌های نصب بررسی شده باشد.
- سطح دسترسی موردنیاز مشخص باشد.
- ریسک Runtime ارزیابی شده باشد.
- استثناهای امنیتی ثبت شده باشند.

### 21.3. Engineering Acceptance

- Lockfile به‌روز و معتبر باشد.
- Build موفق باشد.
- آزمون‌های متناسب اجرا شده باشند.
- سازگاری با معماری بررسی شده باشد.
- اثر Performance ارزیابی شده باشد.

### 21.4. Release Acceptance

- Artifact با نسخه وابستگی‌های آزموده‌شده ساخته شده باشد.
- اطلاعات Build قابل ردیابی باشد.
- تغییرات وابستگی‌ها مستند شده باشند.
- SBOM در صورت الزام انتشار تولید شده باشد.
- مجوزهای لازم بررسی شده باشند.

---

## 22. Risk Register

| ID | Risk | Impact | Proposed Mitigation |
|---|---|---|---|
| DEP-001 | Malicious Package | Critical | Provenance Review |
| DEP-002 | Typosquatting | High | Package Identity Verification |
| DEP-003 | Vulnerable Dependency | High | Continuous Scanning |
| DEP-004 | Unmaintained Package | Medium/High | Lifecycle Monitoring |
| DEP-005 | License Incompatibility | High | License Review |
| DEP-006 | Lockfile Manipulation | High | Integrity Validation |
| DEP-007 | Install Script Abuse | Critical | Script Review and CI Isolation |
| DEP-008 | Transitive Dependency Risk | High | Dependency Tree Analysis |
| DEP-009 | Third-Party Runtime Compromise | High | Runtime Script Governance |
| DEP-010 | Build Environment Compromise | Critical | Build Isolation |
| DEP-011 | Dependency Update Regression | Medium/High | Automated and Manual Testing |
| DEP-012 | Excessive Dependency Growth | Medium | Dependency Budget |
| DEP-013 | Unverified Build Artifact | Critical | Artifact Integrity and Provenance |
| DEP-014 | Unknown License | Medium/High | License Identification and Review |

---

## 23. Required Evidence

برای اثبات اجرای این استاندارد، شواهد زیر می‌توانند موردنیاز باشند:

1. Dependency Inventory
2. Package Manager and Version Record
3. Lockfile
4. Dependency Decision Records
5. Security Audit Results
6. License Inventory
7. SBOM
8. Dependency Update History
9. CI Installation Configuration
10. Build Provenance Records
11. Artifact Integrity Records
12. Exception Register
13. Dependency Removal Records

وجود این اسناد به‌تنهایی به معنی اجرای موفق کنترل‌ها نیست؛ شواهد باید با وضعیت واقعی Repository و Build تطبیق داده شوند.

---

## 24. Implementation Roadmap

### Phase 1 — Discovery

- استخراج تمام وابستگی‌های مستقیم و غیرمستقیم
- شناسایی Package Manager
- بررسی Lockfile
- دسته‌بندی Runtime و Development Dependencies
- شناسایی وابستگی‌های بدون استفاده

### Phase 2 — Baseline

- ایجاد Dependency Inventory
- ثبت وضعیت مجوزها
- اجرای بررسی آسیب‌پذیری
- بررسی Package Provenance
- تعیین وابستگی‌های پرریسک

### Phase 3 — Governance

- تعریف فرایند افزودن وابستگی
- تعریف فرایند به‌روزرسانی
- تعریف سیاست استثنا
- تعیین مسئولیت‌ها
- ایجاد چرخه بازبینی دوره‌ای

### Phase 4 — CI Integration

- اعتبارسنجی Lockfile
- کنترل نصب وابستگی‌ها
- اجرای Security Scanning
- بررسی License
- ثبت Build Metadata

### Phase 5 — Supply Chain Assurance

- تولید SBOM
- ثبت Artifact Hash
- ارزیابی Provenance Attestation
- کنترل Build Isolation
- بازبینی دوره‌ای زنجیره تأمین

اجرای هر مرحله نیازمند بررسی وضعیت واقعی پروژه و تأیید تغییرات مربوط به آن است.

---

## 25. Open Decisions

موارد زیر هنوز نیازمند تصمیم و تأیید مالک پروژه هستند:

| ID | Decision | Status |
|---|---|---|
| D-033-01 | انتخاب Package Manager | OPEN |
| D-033-02 | سیاست دقیق Version Pinning | OPEN |
| D-033-03 | Registry مجاز و سیاست استفاده از آن | OPEN |
| D-033-04 | قالب SBOM | OPEN |
| D-033-05 | ابزار Software Composition Analysis | OPEN |
| D-033-06 | ابزار License Compliance | OPEN |
| D-033-07 | سیاست اجرای Install Scripts | OPEN |
| D-033-08 | ابزار Dependency Update Automation | OPEN |
| D-033-09 | دوره بازبینی امنیتی وابستگی‌ها | OPEN |
| D-033-10 | SLA اصلاح آسیب‌پذیری‌ها | OPEN |
| D-033-11 | الزام SBOM برای انتشارهای مختلف | OPEN |
| D-033-12 | سطح استفاده از Provenance Attestation | OPEN |
| D-033-13 | سیاست استفاده از External Runtime Scripts | OPEN |
| D-033-14 | سیاست مدیریت Forkهای داخلی | OPEN |
| D-033-15 | مسئولیت رسمی Dependency Governance | OPEN |

هیچ‌یک از تصمیمات بالا با انتشار این سند مصوب تلقی نمی‌شوند.

---

## 26. Definition of Done

این استاندارد زمانی در سطح اجرایی قابل پذیرش خواهد بود که:

- تمام وابستگی‌های پروژه شناسایی شده باشند.
- Inventory معتبر وجود داشته باشد.
- Package Manager و Lockfile بررسی شده باشند.
- فرایند افزودن وابستگی تعریف شده باشد.
- فرایند به‌روزرسانی و حذف مشخص شده باشد.
- آسیب‌پذیری‌ها قابل شناسایی و پیگیری باشند.
- وضعیت مجوزها بررسی شده باشد.
- وابستگی‌های حساس دارای مالک مشخص باشند.
- کنترل‌های CI متناسب با ریسک اجرا شوند.
- Build Provenance و Artifact Integrity قابل ردیابی باشند.
- استثناها مستند و زمان‌دار باشند.
- آزمون‌های پذیرش با شواهد واقعی تکمیل شده باشند.
- تصمیمات مالکیتی لازم ثبت شده باشند.

**نکته مهم:** تکمیل سند، ایجاد Inventory یا موفقیت یک اسکن امنیتی به‌تنهایی به معنی انطباق کامل پروژه با این استاندارد نیست.

---

## 27. Final Status

**Document Status:** DRAFT — PROPOSED — NOT APPROVED

**Approval Status:** NOT APPROVED

**Implementation Status:** NOT VERIFIED

**Architecture Decisions:** OPEN

این سند چارچوب پیشنهادی مدیریت وابستگی‌ها و زنجیره تأمین نرم‌افزار فرانت‌اند در اکوسیستم Eco Nojin است.

تا پیش از بررسی وضعیت واقعی پروژه، تصمیمات باز و تأیید مالک، هیچ ابزار، سیاست، Package Manager یا فرایند اجرایی در این سند نباید مصوب یا فعال‌شده تلقی شود.