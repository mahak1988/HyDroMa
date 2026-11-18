# 26. Frontend Deployment, Environment and Release Management Standards

## Eco Nojin Ecosystem
### Environment Architecture, Build Governance, Deployment, Release and Rollback

| مشخصه | مقدار |
|---|---|
| Document ID | EN-VIS-026 |
| Document Name | Frontend Deployment, Environment and Release Management Standards |
| Version | 1.0.0 |
| Status | DRAFT — PROPOSED — NOT APPROVED |
| Classification | Internal Technical Standard |
| Scope | Eco Nojin, HyDroMA, Nojin Marketplace |
| Document Owner | Eco Nojin |
| Approval Authority | Project Owner |
| Created | 2026-11-17 |

---

# 1. Purpose

این سند استانداردهای محیط‌های اجرایی، ساخت نرم‌افزار، استقرار، انتشار نسخه و مدیریت بازگشت در لایه Frontend اکوسیستم Eco Nojin را تعریف می‌کند.

هدف، ایجاد فرایندی قابل کنترل، قابل بازتولید، امن و قابل ممیزی برای انتقال کد از محیط توسعه تا محیط عملیاتی است.

دامنه این سند سه محصول زیر را در بر می‌گیرد:

1. **Eco Nojin:** پلتفرم اصلی اکوسیستم و صفحات عمومی.
2. **HyDroMA:** موتور علمی و رابط‌های محاسباتی، پایش و شبیه‌سازی.
3. **Nojin Marketplace:** بازارگاه، فروشگاه و خدمات اقتصادی.

این استاندارد میان مفاهیم زیر تمایز قائل می‌شود:

- Development
- Build
- Test
- Validation
- Release
- Deployment
- Production Operation
- Rollback

موفقیت در یک مرحله به‌معنای موفقیت خودکار در مراحل بعدی نیست.

## 1.1. اهداف

- تعریف معماری محیط‌های اجرایی.
- جلوگیری از اختلاط تنظیمات توسعه و Production.
- ایجاد Buildهای قابل بازتولید.
- حفاظت از اطلاعات محرمانه.
- کنترل انتشار نسخه‌ها.
- کاهش ریسک Deployment.
- ایجاد قابلیت Rollback.
- مدیریت سازگاری Frontend و Backend.
- ثبت شواهد استقرار.
- کنترل تغییرات در محیط Production.
- تفکیک مجوز توسعه از مجوز انتشار.

---

# 2. Fundamental Deployment Principles

## 2.1. Environment Isolation

محیط‌های توسعه، آزمایش و Production باید از نظر تنظیمات، دسترسی و داده از یکدیگر تفکیک شوند.

## 2.2. Reproducible Builds

ساخت یک نسخه مشخص باید تا حد امکان با ورودی‌های یکسان، خروجی قابل بازتولید تولید کند.

## 2.3. Immutable Release Artifacts

پس از تأیید یک Build، فایل‌های خروجی همان نسخه نباید به‌صورت دستی تغییر کنند.

هر اصلاح باید با Build و شناسه نسخه جدید همراه باشد.

## 2.4. Least Privilege

دسترسی به محیط‌های عملیاتی باید به حداقل افراد و سرویس‌های ضروری محدود شود.

## 2.5. Controlled Deployment

هیچ استقرار Production نباید بدون کنترل‌های لازم، ثبت نسخه و مجوز معتبر انجام شود.

## 2.6. Evidence-Based Release

اعلام موفقیت Deployment باید بر شواهد واقعی متکی باشد، نه صرفاً پایان یافتن یک فرمان یا فرایند Build.

---

# 3. Deployment Architecture

## 3.1. Architectural Layers

معماری استقرار Frontend باید اجزای زیر را از یکدیگر تفکیک کند:

1. Source Repository
2. Dependency Management
3. Build Environment
4. Test Environment
5. Artifact Storage
6. Deployment Pipeline
7. Web Hosting Layer
8. CDN یا Reverse Proxy در صورت استفاده
9. Backend API
10. Monitoring and Logging

## 3.2. Deployment Responsibility

| Component | Responsibility |
|---|---|
| Source Repository | نگهداری نسخه‌های کد |
| Build System | تولید خروجی نرم‌افزار |
| Test Environment | اجرای آزمون‌ها |
| Artifact Storage | نگهداری خروجی نسخه‌ها |
| Deployment Pipeline | انتقال کنترل‌شده نسخه |
| Web Server | ارائه فایل‌های Frontend |
| Reverse Proxy | مسیریابی و کنترل ترافیک |
| Backend | پردازش درخواست‌ها و منطق اصلی |
| Monitoring | پایش وضعیت نسخه منتشرشده |

این تفکیک مفهومی است و الزاماً به‌معنای استفاده از سرویس یا سرور جداگانه برای هر جزء نیست.

---

# 4. Environment Architecture

## 4.1. Environment Types

محیط‌های پیشنهادی:

| Environment | Purpose | Data |
|---|---|---|
| Development | توسعه روزمره | Synthetic/Test |
| Local Integration | آزمون ارتباط اجزا | Synthetic/Test |
| CI | اجرای خودکار آزمون | Isolated Test Data |
| Staging | ارزیابی نسخه نزدیک به Production | Controlled Test Data |
| Production | استفاده عملیاتی | Authorized Real Data |

## 4.2. Development

محیط توسعه برای فعالیت روزمره برنامه‌نویسی است.

ویژگی‌ها:

- Hot Reload در صورت پشتیبانی.
- Debugging.
- Source Maps.
- Mock Services در صورت نیاز.
- داده آزمایشی.
- تنظیمات غیرعملیاتی.

استفاده از اطلاعات محرمانه Production در Development بدون مجوز و کنترل مناسب مجاز نیست.

## 4.3. Integration

محیط Integration برای بررسی ارتباط واقعی میان Frontend و سرویس‌های Backend استفاده می‌شود.

موارد:

- API Connectivity.
- Authentication.
- Authorization.
- Data Contract.
- Error Handling.
- Cross-Service Integration.

## 4.4. CI Environment

محیط CI باید تا حد امکان مستقل و تکرارپذیر باشد.

ویژگی‌ها:

- نصب وابستگی‌های قفل‌شده.
- اجرای آزمون‌ها.
- بررسی Build.
- تحلیل وابستگی‌ها.
- کنترل Secret.
- تولید گزارش.
- ثبت شناسه Commit.

## 4.5. Staging

Staging باید از نظر تنظیمات و رفتار تا حد امکان به Production نزدیک باشد.

هدف:

- ارزیابی Release Candidate.
- بررسی مسیرهای حیاتی.
- آزمون Integration.
- بررسی امنیت.
- بررسی عملکرد.
- بررسی رفتار واقعی رابط.

Staging نباید صرفاً یک نسخه نمایشی بدون اتصال معتبر به سرویس‌های موردنیاز باشد.

## 4.6. Production

Production محیط عملیاتی است.

الزامات:

- HTTPS.
- تنظیمات امن.
- دسترسی محدود.
- Build تأییدشده.
- پایش فعال.
- ثبت نسخه.
- برنامه Rollback.
- مدیریت رخداد.
- حفاظت از داده واقعی.

---

# 5. Environment Configuration

## 5.1. Configuration Separation

تنظیمات محیط‌ها باید از یکدیگر تفکیک شوند.

نمونه تنظیمات:

- API Base URL.
- Public Application URL.
- Authentication Endpoint.
- Public Map Configuration.
- Feature Flags.
- Public Analytics Configuration.
- Locale Defaults.

## 5.2. Environment Variables

متغیرهای محیطی باید به دو گروه تقسیم شوند:

### Public Configuration

تنظیماتی که افشای آن‌ها در Bundle فرانت‌اند ریسک محرمانگی ایجاد نمی‌کند.

### Private Configuration

اطلاعاتی که نباید در Browser یا Bundle قرار گیرند.

مواردی مانند:

- API Private Keys.
- Database Credentials.
- Signing Secrets.
- Internal Service Tokens.
- Private Certificates.

هیچ متغیر محرمانه‌ای نباید صرفاً به دلیل قرار گرفتن در فایل Environment امن تلقی شود.

در ابزارهای Build فرانت‌اند، متغیرهای دارای پیشوند عمومی معمولاً در خروجی قابل مشاهده‌اند.

## 5.3. Configuration Validation

در زمان Build یا Startup باید تنظیمات ضروری بررسی شوند.

در صورت نبود تنظیمات حیاتی:

- برنامه نباید به‌صورت ناقص و گمراه‌کننده اجرا شود.
- خطا باید واضح و قابل تشخیص باشد.
- مقدار محرمانه نباید در پیام خطا نمایش داده شود.

## 5.4. No Environment Leakage

موارد زیر باید کنترل شوند:

- API URL اشتباه.
- اتصال Staging به Production بدون مجوز.
- اتصال Production به Test Data.
- انتشار Debug Configuration.
- انتشار Source Maps ناخواسته.
- افشای Internal Endpoint.

---

# 6. Source Code and Version Control

## 6.1. Source of Truth

مخزن Git معتبر باید مرجع نسخه‌های کد باشد.

فایل‌های محلی و خروجی‌های Build به‌تنهایی مرجع نسخه رسمی نیستند.

## 6.2. Branch Governance

الگوی پیشنهادی:

- `main`: نسخه‌های پایدار.
- `develop`: یکپارچه‌سازی توسعه، در صورت نیاز.
- `feature/*`: توسعه قابلیت.
- `fix/*`: اصلاح خطا.
- `release/*`: آماده‌سازی نسخه.
- `hotfix/*`: اصلاح فوری نسخه عملیاتی.

این الگو پیشنهادی است و باید با ساختار واقعی مخزن تطبیق یابد.

## 6.3. Branch Protection

برای Branchهای حساس می‌توان کنترل‌های زیر را اعمال کرد:

- Pull Request.
- Code Review.
- Required Checks.
- منع Push مستقیم.
- محدودیت Force Push.
- کنترل Merge.
- ثبت تغییرات.

## 6.4. Commit Integrity

Commitها باید:

- قابل ردیابی باشند.
- پیام معنادار داشته باشند.
- به تغییر مشخص مرتبط باشند.
- فاقد فایل‌های محرمانه باشند.
- با وضعیت واقعی کد تطابق داشته باشند.

## 6.5. Repository Separation

اگر سه محصول در یک یا چند مخزن مستقل نگهداری شوند، مرز مسئولیت و نسخه آن‌ها باید روشن باشد.

هیچ‌یک از مخازن قدیمی یا جدید نباید بدون تصمیم مالک به‌عنوان مرجع جایگزین دیگری تلقی شود.

---

# 7. Build Management

## 7.1. Build Inputs

هر Build باید ورودی‌های قابل شناسایی داشته باشد:

- Source Commit.
- Dependency Lockfile.
- Build Configuration.
- Runtime Compatibility Target.
- Public Environment Configuration.
- Build Tool Version.
- Node.js Version یا Runtime مربوطه.
- Build Timestamp.

## 7.2. Lockfile

Lockfile باید در مخزن نگهداری شود.

نصب وابستگی‌ها باید از روش سازگار با Package Manager انتخاب‌شده انجام شود.

به‌روزرسانی ناخواسته وابستگی‌ها در زمان Build Production مجاز نیست.

## 7.3. Build Reproducibility

در صورت امکان:

- نسخه ابزارها ثابت باشد.
- وابستگی‌ها قفل شوند.
- تنظیمات Build ثبت شوند.
- خروجی قابل مقایسه باشد.
- تفاوت Buildها بررسی شود.

## 7.4. Build Artifact

خروجی Build باید دارای شناسه مشخص باشد.

اطلاعات پیشنهادی:

- Product Name.
- Version.
- Commit SHA.
- Build ID.
- Build Date.
- Environment.
- Dependency Snapshot.

## 7.5. Artifact Integrity

برای Artifactهای قابل انتشار می‌توان Hash مانند SHA-256 تولید و ثبت کرد.

هدف، تشخیص تغییرات ناخواسته در فایل‌های خروجی است.

## 7.6. Artifact Immutability

Artifact تأییدشده نباید پس از آزمون تغییر داده شود.

در صورت اصلاح:

1. تغییر در Source انجام شود.
2. آزمون‌ها مجدداً اجرا شوند.
3. Build جدید تولید شود.
4. نسخه جدید ارزیابی شود.
5. تأیید انتشار دریافت شود.

---

# 8. Deployment Strategies

## 8.1. Standard Deployment

نسخه جدید پس از بررسی و تأیید جایگزین نسخه جاری می‌شود.

این روش برای استقرارهای ساده مناسب است.

## 8.2. Blue-Green Deployment

در صورت پشتیبانی زیرساخت:

- دو محیط مستقل آماده می‌شوند.
- نسخه جدید در محیط غیرفعال مستقر می‌شود.
- آزمون انجام می‌شود.
- ترافیک پس از تأیید منتقل می‌شود.
- امکان بازگشت به محیط قبلی حفظ می‌شود.

## 8.3. Canary Deployment

در صورت پشتیبانی زیرساخت:

- نسخه جدید ابتدا برای بخش محدودی از ترافیک فعال می‌شود.
- شاخص‌های سلامت بررسی می‌شوند.
- در صورت موفقیت، دامنه انتشار افزایش می‌یابد.
- در صورت بروز مشکل، انتشار متوقف یا بازگردانده می‌شود.

## 8.4. Static Asset Deployment

برای Frontendهای Static:

- فایل‌ها باید نسخه‌دار باشند.
- Cache فایل‌های دارای Hash باید با سیاست مناسب تنظیم شود.
- HTML Entry Point نباید به‌صورت نامحدود Cache شود.
- فایل‌های قدیمی تا حد نیاز برای سازگاری نگهداری شوند.

انتخاب روش Deployment باید براساس زیرساخت واقعی و پیچیدگی پروژه انجام شود.

---

# 9. Frontend and Backend Compatibility

## 9.1. API Compatibility

نسخه Frontend و Backend باید از نظر قراردادهای API سازگار باشند.

تغییر API ممکن است باعث شکست نسخه قبلی Frontend شود.

## 9.2. Backward Compatibility

در صورت امکان، تغییرات API باید با نسخه‌های قبلی سازگار باشند.

برای تغییرات ناسازگار:

- نسخه API مشخص شود.
- وابستگی نسخه‌ها مستند شود.
- برنامه Migration تعریف شود.
- زمان حذف نسخه قدیمی مشخص شود.

## 9.3. Deployment Ordering

ترتیب انتشار Frontend و Backend باید براساس سازگاری آن‌ها تعیین شود.

در معماری‌هایی که Backend ابتدا باید قابلیت جدید را پشتیبانی کند، انتشار Frontend نباید پیش از آماده شدن Backend انجام شود.

## 9.4. Feature Flags

Feature Flag می‌تواند برای کنترل انتشار قابلیت‌ها استفاده شود.

اما:

- Feature Flag جایگزین Authorization نیست.
- قابلیت حساس نباید صرفاً با Flag سمت Client محافظت شود.
- وضعیت Flag باید از منبع قابل اعتماد دریافت شود.
- Flagهای منقضی باید حذف یا تعیین تکلیف شوند.

## 9.5. API Failure Strategy

در صورت ناسازگاری یا قطعی API:

- رابط باید وضعیت مناسب نمایش دهد.
- عملیات حساس نباید با داده قدیمی به‌صورت گمراه‌کننده ادامه یابد.
- Retry باید کنترل‌شده باشد.
- خطا ثبت شود.
- مسیر بازیابی مشخص باشد.

---

# 10. Release Management

## 10.1. Release Identity

هر نسخه منتشرشده باید شناسه مستقل داشته باشد.

الگوی پیشنهادی:

`MAJOR.MINOR.PATCH`

### MAJOR

تغییرات ناسازگار یا تغییرات اساسی معماری.

### MINOR

افزودن قابلیت سازگار با نسخه قبلی.

### PATCH

اصلاح خطا و تغییرات کوچک سازگار.

این الگو باید متناسب با سیاست نسخه‌بندی مخزن نهایی شود.

## 10.2. Release Candidate

نسخه نامزد انتشار باید:

- Build مشخص داشته باشد.
- Commit مشخص داشته باشد.
- آزمون‌های لازم را گذرانده باشد.
- خطاهای شناخته‌شده را ثبت کرده باشد.
- گزارش امنیتی داشته باشد.
- معیارهای پذیرش را رعایت کند.

## 10.3. Release Notes

هر نسخه باید Release Notes داشته باشد.

موارد:

- نسخه.
- تاریخ.
- قابلیت‌های جدید.
- اصلاحات.
- تغییرات ناسازگار.
- مشکلات شناخته‌شده.
- تغییرات امنیتی.
- تغییرات وابستگی.
- محدودیت‌های نسخه.

## 10.4. Release Approval

تأیید انتشار باید براساس نقش و اختیار مشخص انجام شود.

موارد زیر مستقل هستند:

- Technical Approval.
- Quality Approval.
- Security Approval.
- Owner Approval.

## 10.5. Release Freeze

در صورت نیاز می‌توان پیش از انتشار نهایی یک بازه Release Freeze تعریف کرد.

در این بازه فقط اصلاحات ضروری و تأییدشده مجاز خواهند بود.

---

# 11. Deployment Security

## 11.1. Deployment Credentials

اعتبارنامه‌های Deployment باید:

- محدود به حداقل دسترسی باشند.
- در مخزن ذخیره نشوند.
- به‌صورت امن مدیریت شوند.
- در صورت افشا قابل ابطال باشند.
- دوره‌ای بررسی شوند.

## 11.2. Deployment Permissions

دسترسی استقرار Production باید از دسترسی توسعه عادی جدا باشد.

## 11.3. Pipeline Security

Pipeline باید در برابر موارد زیر محافظت شود:

- Secret Exposure.
- Dependency Tampering.
- Unauthorized Deployment.
- Artifact Replacement.
- Malicious Build Scripts.
- Unsafe External Actions.

## 11.4. Build Isolation

در صورت امکان، Build در محیط محدود و مستقل اجرا شود.

## 11.5. Artifact Verification

پیش از Deployment باید شناسه و صحت Artifact بررسی شود.

## 11.6. Production Access

تغییر مستقیم فایل‌های Production بدون فرایند ثبت و کنترل مجاز نیست.

---

# 12. Rollback and Recovery

## 12.1. Rollback Objectives

Rollback برای بازگشت سریع به نسخه سالم در صورت بروز اختلال استفاده می‌شود.

## 12.2. Rollback Triggers

موارد زیر می‌توانند محرک Rollback باشند:

- خرابی مسیرهای حیاتی.
- شکست Authentication.
- خطای گسترده API Integration.
- آسیب‌پذیری امنیتی مهم.
- افزایش غیرعادی خطاها.
- Regression بحرانی.
- اختلال در عملیات مالی.
- نمایش نادرست داده علمی با پیامد عملیاتی.

## 12.3. Rollback Plan

برای هر انتشار باید موارد زیر مشخص باشد:

- نسخه قبلی پایدار.
- Artifact قبلی.
- مسئول اجرای Rollback.
- روش بازگشت.
- تأثیر بر Cache.
- تأثیر بر API Compatibility.
- روش بررسی سلامت پس از بازگشت.

## 12.4. Rollback Validation

پس از Rollback باید بررسی شود:

- صفحات حیاتی بارگذاری می‌شوند.
- Authentication کار می‌کند.
- APIها سازگار هستند.
- داده‌ها صحیح نمایش داده می‌شوند.
- عملیات حیاتی مختل نشده‌اند.

## 12.5. Frontend and Backend Rollback

Rollback فرانت‌اند لزوماً نیازمند Rollback هم‌زمان Backend نیست.

ابتدا باید سازگاری نسخه‌ها بررسی شود.

اگر تغییرات Backend ناسازگار باشند، برنامه بازگشت باید برای هر دو لایه تعریف شود.

## 12.6. Database Changes

این سند مجوز تغییر یا Rollback پایگاه داده نیست.

تغییرات Database و Migration باید تحت سیاست مستقل Backend و Database Management کنترل شوند.

---

# 13. Cache and CDN Management

## 13.1. Cache Strategy

سیاست Cache باید براساس نوع فایل تعیین شود.

| Asset Type | Proposed Policy |
|---|---|
| Hashed JS | Long-lived immutable |
| Hashed CSS | Long-lived immutable |
| HTML Entry | Revalidation or short cache |
| Public Images | Controlled cache |
| Sensitive API Data | No public cache |
| User-specific Content | Private cache policy |

## 13.2. Cache Invalidation

پس از انتشار نسخه جدید باید مشخص باشد:

- کدام فایل‌ها نسخه‌دار هستند.
- کدام Cacheها باید پاک شوند.
- چه زمانی Cache منقضی می‌شود.
- آیا نسخه قبلی هنوز قابل استفاده است.

## 13.3. Service Worker

در صورت استفاده از Service Worker:

- نسخه Cache مشخص باشد.
- به‌روزرسانی کنترل شود.
- داده حساس Cache نشود.
- نسخه قدیمی قابل شناسایی باشد.
- رفتار Offline آزمون شود.
- فرایند پاک‌سازی نسخه قبلی تعریف شود.

## 13.4. Stale Content

رابط نباید به‌گونه‌ای عمل کند که کاربر تصور کند داده قدیمی، داده زنده و معتبر است.

زمان آخرین به‌روزرسانی باید در بخش‌های لازم قابل تشخیص باشد.

---

# 14. Deployment Monitoring

## 14.1. Health Indicators

پس از انتشار باید شاخص‌های زیر بررسی شوند:

- Page Load Success.
- JavaScript Error Rate.
- API Failure Rate.
- Authentication Failure Rate.
- Route Failure.
- Core Web Vitals.
- Asset Loading Failure.
- Browser Compatibility Errors.

## 14.2. Product-Specific Monitoring

### Eco Nojin

- سلامت صفحات عمومی.
- بارگذاری محتوای چندزبانه.
- عملکرد Navigation.
- وضعیت فرم‌ها.

### HyDroMA

- سلامت داشبورد علمی.
- بارگذاری نمودارها.
- بارگذاری نقشه‌ها.
- نمایش نتایج شبیه‌سازی.
- سازگاری APIهای علمی.

### Nojin Marketplace

- بارگذاری محصولات.
- جست‌وجو و فیلتر.
- سبد خرید.
- وضعیت سفارش.
- وضعیت عملیات مالی.

## 14.3. Monitoring Privacy

پایش نباید اطلاعات حساس کاربران را افشا کند.

Logها و Telemetry باید با استاندارد امنیت و حریم خصوصی فایل ۲۴ سازگار باشند.

---

# 15. Release Communication

## 15.1. Internal Communication

پیش از انتشار باید تیم‌های مرتبط از موارد زیر مطلع شوند:

- نسخه.
- زمان انتشار.
- دامنه تغییرات.
- ریسک‌های شناخته‌شده.
- روش بازگشت.
- مسئول انتشار.

## 15.2. User Communication

در صورت تأثیر محسوس بر کاربران:

- تغییرات مهم اعلام شوند.
- محدودیت‌های شناخته‌شده توضیح داده شوند.
- تغییر مسیرها یا رفتارهای اصلی اطلاع‌رسانی شوند.
- از اعلام قابلیت‌های تأییدنشده خودداری شود.

---

# 16. Deployment Failure Management

در صورت شکست Deployment:

1. عملیات متوقف شود.
2. وضعیت نسخه جاری مشخص شود.
3. خطای Deployment ثبت شود.
4. Artifact بررسی شود.
5. تنظیمات محیط بررسی شوند.
6. سازگاری API بررسی شود.
7. تصمیم ادامه یا Rollback اتخاذ شود.
8. پس از اصلاح، آزمون‌ها تکرار شوند.
9. گزارش رخداد ثبت شود.

تلاش مجدد کورکورانه برای Deployment بدون شناسایی علت مجاز نیست.

---

# 17. Release Acceptance Criteria

| ID | Acceptance Criterion | Required Evidence |
|---|---|---|
| DEP-001 | محیط‌ها تفکیک شده‌اند | Environment Review |
| DEP-002 | تنظیمات محیط معتبرند | Configuration Validation |
| DEP-003 | Secret در Bundle وجود ندارد | Build Inspection |
| DEP-004 | Build قابل شناسایی است | Build Metadata |
| DEP-005 | Artifact معتبر است | Hash Verification |
| DEP-006 | آزمون‌های ضروری موفق‌اند | Test Report |
| DEP-007 | امنیت بررسی شده است | Security Report |
| DEP-008 | API Compatibility بررسی شده است | Integration Report |
| DEP-009 | نسخه Release مشخص است | Release Record |
| DEP-010 | Release Notes آماده است | Release Notes |
| DEP-011 | Rollback Plan موجود است | Rollback Record |
| DEP-012 | Cache Policy مشخص است | Configuration Review |
| DEP-013 | Monitoring آماده است | Monitoring Evidence |
| DEP-014 | دسترسی Deployment کنترل شده است | Access Review |
| DEP-015 | تأییدهای لازم ثبت شده‌اند | Approval Record |
| DEP-016 | پس از انتشار سلامت بررسی شده است | Post-Release Report |

---

# 18. Deployment Status Model

وضعیت‌های استاندارد:

| Status | Meaning |
|---|---|
| NOT_CONFIGURED | محیط هنوز تنظیم نشده است |
| CONFIGURED | تنظیمات آماده شده‌اند |
| BUILD_READY | امکان Build وجود دارد |
| BUILT | خروجی Build تولید شده است |
| TESTED | آزمون‌های لازم اجرا شده‌اند |
| VALIDATED | شواهد اعتبارسنجی کافی وجود دارد |
| APPROVED | مجوز انتشار صادر شده است |
| DEPLOYED | نسخه مستقر شده است |
| VERIFIED | سلامت نسخه پس از استقرار بررسی شده است |
| ROLLED_BACK | نسخه بازگردانده شده است |
| FAILED | عملیات با شکست مواجه شده است |

این وضعیت‌ها نباید با یکدیگر ادغام شوند.

برای مثال، BUILT به‌معنای TESTED نیست و DEPLOYED به‌معنای VERIFIED نیست.

---

# 19. Governance and Agent Restrictions

ایجنت توسعه می‌تواند:

- تنظیمات توسعه را بررسی کند.
- Build اجرا کند.
- آزمون‌ها را اجرا کند.
- Artifact تولید کند.
- گزارش Release آماده کند.
- مشکلات Deployment را تحلیل کند.
- برنامه Rollback پیشنهاد دهد.

اما بدون مجوز صریح مالک نباید:

- Production را Deploy کند.
- DNS را تغییر دهد.
- تنظیمات دامنه را تغییر دهد.
- Secretهای Production را تغییر دهد.
- محیط Production را حذف یا بازسازی کند.
- سرویس عملیاتی را متوقف کند.
- نسخه جاری را جایگزین کند.
- Cache عملیاتی را به‌صورت گسترده پاک کند.
- Migration پایگاه داده اجرا کند.
- مخزن یا Branch اصلی را تغییر دهد.

## 19.1. Preservation of Existing Projects

در صورت توسعه در مسیر `D:\Nojin`:

- مخازن `D:\HyDroMA` و `D:\eco_nojin` نباید بدون مجوز تغییر کنند.
- تنظیمات Git پروژه‌های قبلی نباید تغییر کنند.
- Remoteهای مخازن نباید خودکار جایگزین شوند.
- هیچ Deployment نباید به‌صورت ضمنی به پروژه‌های قدیمی متصل شود.

---

# 20. Open Decisions

موارد زیر نیازمند تصمیم مالک هستند:

| ID | Decision | Status |
|---|---|---|
| DEP-D01 | معماری نهایی محیط‌ها | OPEN |
| DEP-D02 | ساختار مخازن و Branchها | OPEN |
| DEP-D03 | روش Build رسمی | OPEN |
| DEP-D04 | روش نگهداری Artifactها | OPEN |
| DEP-D05 | روش استقرار Frontend | OPEN |
| DEP-D06 | استفاده از CDN یا Reverse Proxy | OPEN |
| DEP-D07 | سیاست رسمی نسخه‌بندی | OPEN |
| DEP-D08 | سیاست Release Approval | OPEN |
| DEP-D09 | روش Rollback | OPEN |
| DEP-D10 | سیاست Cache | OPEN |
| DEP-D11 | سیاست Service Worker | OPEN |
| DEP-D12 | معماری Feature Flags | OPEN |
| DEP-D13 | ابزار Monitoring | OPEN |
| DEP-D14 | سیاست نگهداری Build Artifact | OPEN |
| DEP-D15 | دسترسی Production | OPEN |
| DEP-D16 | ترتیب انتشار Frontend و Backend | OPEN |
| DEP-D17 | سیاست انتشار اضطراری | OPEN |
| DEP-D18 | سیاست Release Freeze | OPEN |

هیچ‌یک از این تصمیم‌ها صرفاً با انتشار این سند نهایی نمی‌شوند.

---

# 21. Final Deployment Principles

اصول غیرقابل چشم‌پوشی:

1. محیط توسعه با Production یکسان تلقی نمی‌شود.
2. Secret نباید در Bundle فرانت‌اند قرار گیرد.
3. Build تأییدشده نباید پس از آزمون تغییر کند.
4. هر نسخه باید شناسه و منشأ مشخص داشته باشد.
5. Artifact باید قابل ردیابی و بررسی باشد.
6. انتشار باید دارای مجوز و شواهد باشد.
7. Frontend و Backend باید از نظر قرارداد API سازگار باشند.
8. Rollback باید پیش از انتشار قابل برنامه‌ریزی باشد.
9. استقرار موفق به‌معنای سلامت عملیاتی نیست.
10. پایش پس از انتشار الزامی است.
11. هیچ تغییر Production بدون مجوز صریح انجام نمی‌شود.
12. تصمیمات مالی، زیرساختی و عملیاتی خارج از اختیار ایجنت هستند، مگر آنکه صریحاً مجاز شده باشند.

---

# 22. Document Status

**Current Status: DRAFT — PROPOSED — NOT APPROVED**

این سند چارچوب پیشنهادی مدیریت محیط، Build، Deployment و Release فرانت‌اند در Eco Nojin، HyDroMA و Nojin Marketplace است.

این سند:

- زیرساخت خاصی را تصویب نمی‌کند.
- سرویس Hosting یا CDN انتخاب نمی‌کند.
- روش Deployment را نهایی نمی‌کند.
- هیچ محیط Production ایجاد نمی‌کند.
- هیچ نسخه‌ای را منتشر نمی‌کند.
- مجوز تغییر DNS یا تنظیمات عملیاتی نمی‌دهد.
- صحت Deployment فعلی را تأیید نمی‌کند.
- جایگزین آزمون و اعتبارسنجی واقعی نیست.

اجرای آن باید پس از بررسی معماری واقعی، تعیین زیرساخت، ارزیابی ریسک، تعریف مسئولیت‌ها و تأیید مالک انجام شود.

**End of Document 26**