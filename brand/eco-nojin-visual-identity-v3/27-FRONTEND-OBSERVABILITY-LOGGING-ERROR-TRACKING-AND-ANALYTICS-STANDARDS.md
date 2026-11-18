# 27. Frontend Observability, Logging, Error Tracking and Analytics Standards

## Eco Nojin Ecosystem
### Application Observability, Telemetry, Error Management, User Experience Monitoring and Product Analytics

| مشخصه | مقدار |
|---|---|
| Document ID | EN-VIS-027 |
| Document Name | Frontend Observability, Logging, Error Tracking and Analytics Standards |
| Version | 1.0.0 |
| Status | DRAFT — PROPOSED — NOT APPROVED |
| Classification | Internal Technical Standard |
| Scope | Eco Nojin, HyDroMA, Nojin Marketplace |
| Document Owner | Eco Nojin |
| Approval Authority | Project Owner |
| Created | 2026-11-17 |

---

# 1. Purpose

این سند استانداردهای مشاهده‌پذیری (Observability)، ثبت رخدادها (Logging)، ردیابی خطاها (Error Tracking)، پایش تجربه واقعی کاربران (Real User Monitoring) و تحلیل رفتار محصول (Product Analytics) را در فرانت‌اند اکوسیستم Eco Nojin تعریف می‌کند.

هدف، ایجاد سازوکاری برای پاسخ‌گویی دقیق به پرسش‌های زیر است:

- آیا صفحات و قابلیت‌های سامانه درست کار می‌کنند؟
- کاربران در کدام بخش‌ها با خطا مواجه می‌شوند؟
- کدام درخواست‌های API با شکست مواجه می‌شوند؟
- آیا تجربه کاربران از نظر سرعت و پایداری مناسب است؟
- آیا یک انتشار جدید باعث Regression شده است؟
- آیا داده‌های علمی و مالی به‌درستی دریافت و نمایش داده می‌شوند؟
- کدام مسیرهای کاربری با مشکل مواجه هستند؟
- آیا اختلال محدود به یک مرورگر، دستگاه، زبان یا منطقه است؟
- آیا رخدادهای مهم قابل ردیابی و بازسازی هستند؟

این استاندارد سه محصول را پوشش می‌دهد:

1. **Eco Nojin:** پلتفرم اصلی، صفحات عمومی و تجربه یکپارچه اکوسیستم.
2. **HyDroMA:** رابط علمی، پایش، تحلیل، شبیه‌سازی و نمایش داده‌های مکانی.
3. **Nojin Marketplace:** بازارگاه، فروشگاه، سفارش‌ها و تعاملات اقتصادی.

## 1.1. اصل بنیادین

مشاهده‌پذیری به‌معنای جمع‌آوری حداکثری داده نیست.

هدف، جمع‌آوری حداقل داده لازم برای تشخیص مشکلات، حفظ کیفیت سرویس و بهبود تجربه کاربر است؛ بدون افشای اطلاعات شخصی، مالی، محرمانه یا حساس.

## 1.2. تفکیک مفاهیم

| مفهوم | هدف |
|---|---|
| Logging | ثبت رخدادهای مشخص |
| Error Tracking | شناسایی و تحلیل خطاها |
| Metrics | اندازه‌گیری شاخص‌های عددی |
| Tracing | دنبال کردن مسیر اجرای درخواست |
| RUM | پایش تجربه واقعی کاربران |
| Synthetic Monitoring | آزمون دوره‌ای مسیرهای مشخص |
| Product Analytics | تحلیل رفتار و تعامل کاربران |
| Audit Logging | ثبت اقدامات مهم و قابل ممیزی |

این مفاهیم مکمل یکدیگرند و جایگزین هم نیستند.

---

# 2. Observability Principles

## 2.1. Actionable Observability

هر داده ثبت‌شده باید هدف مشخصی داشته باشد.

نمونه اهداف:

- تشخیص خطا.
- اندازه‌گیری زمان پاسخ.
- شناسایی Regression.
- بررسی سلامت قابلیت.
- تشخیص اختلال در API.
- تحلیل مسیر کاربر.
- ارزیابی کیفیت تجربه.

جمع‌آوری داده بدون هدف عملیاتی یا محصولی مشخص توصیه نمی‌شود.

## 2.2. Privacy by Design

حریم خصوصی باید در طراحی Telemetry لحاظ شود.

موارد زیر نباید به‌صورت پیش‌فرض ثبت شوند:

- رمز عبور.
- Access Token.
- Refresh Token.
- Session Secret.
- شماره کارت بانکی.
- اطلاعات هویتی حساس.
- محتوای خصوصی کاربران.
- داده‌های محرمانه سازمانی.
- اطلاعات حساس مکانی.
- متن کامل درخواست‌ها و پاسخ‌های محرمانه API.

## 2.3. Data Minimization

هر رخداد باید حداقل فیلدهای ضروری را داشته باشد.

اگر هدف با شناسه ناشناس و کد خطا قابل دستیابی است، نباید اطلاعات هویتی کاربر ثبت شود.

## 2.4. Separation of Concerns

داده‌های زیر باید از یکدیگر تفکیک شوند:

- Operational Telemetry.
- Security Events.
- Scientific Provenance.
- Financial Audit Records.
- Product Analytics.
- User Support Diagnostics.

برای مثال، ثبت خطای نمایش یک نمودار نباید جایگزین ثبت منشأ علمی داده نمودار شود.

## 2.5. Trustworthy Measurement

شاخص‌ها باید تعریف و روش محاسبه مشخص داشته باشند.

برای هر Metric باید موارد زیر معلوم باشد:

- تعریف.
- واحد.
- محدوده.
- منبع.
- دوره اندازه‌گیری.
- روش تجمیع.
- محدودیت‌ها.

---

# 3. Observability Architecture

## 3.1. Logical Architecture

معماری پیشنهادی:

1. Frontend Instrumentation.
2. Event and Error Collection.
3. Privacy Filtering.
4. Transport Layer.
5. Telemetry Ingestion.
6. Processing and Aggregation.
7. Storage.
8. Visualization.
9. Alerting.
10. Incident Management.

این معماری مفهومی است و الزاماً به‌معنای استقرار سرویس‌های مستقل نیست.

## 3.2. Frontend Instrumentation

لایه Instrumentation می‌تواند موارد زیر را ثبت کند:

- JavaScript Errors.
- Unhandled Promise Rejections.
- Failed API Requests.
- Route Transitions.
- Performance Metrics.
- User Interaction Events.
- Resource Loading Failures.
- Application State Failures.

Instrumentation نباید موجب اختلال محسوس در عملکرد اصلی رابط شود.

## 3.3. Collection Gateway

در صورت استفاده از Gateway اختصاصی، باید مسئولیت‌های زیر مشخص باشند:

- اعتبارسنجی ساختار رخداد.
- محدودیت نرخ ارسال.
- حذف فیلدهای ممنوع.
- مدیریت درخواست‌های نامعتبر.
- جلوگیری از سوءاستفاده.
- اعمال سیاست نگهداری.
- ثبت وضعیت دریافت.

Gateway نباید به‌عنوان مرجع احراز هویت یا مجوزدهی عملیات اصلی سامانه تلقی شود.

## 3.4. Backend and Infrastructure Correlation

برای تشخیص مشکلات انتهابه‌انتها، در صورت پشتیبانی معماری، شناسه هم‌بستگی میان Frontend، API و Backend استفاده شود.

این شناسه باید:

- تصادفی یا غیرقابل حدس باشد.
- حاوی اطلاعات شخصی نباشد.
- به درخواست یا عملیات مشخص مرتبط باشد.
- در Logهای مرتبط قابل جست‌وجو باشد.

---

# 4. Event Taxonomy

## 4.1. Event Categories

رخدادها باید در دسته‌های مشخص سازمان‌دهی شوند.

| Category | Description |
|---|---|
| application | رخدادهای عمومی برنامه |
| navigation | تغییر مسیر و صفحه |
| interaction | تعامل کاربر |
| api | درخواست و پاسخ API |
| error | خطاهای نرم‌افزاری |
| performance | شاخص‌های عملکرد |
| authentication | رخدادهای مرتبط با نشست |
| accessibility | مشکلات و شاخص‌های دسترس‌پذیری |
| scientific | وضعیت قابلیت‌های علمی |
| marketplace | رخدادهای بازارگاه |
| financial | وضعیت تعاملات مالی |
| security | رخدادهای امنیتی قابل ثبت |
| deployment | رخدادهای نسخه و استقرار |

ثبت رخدادهای حساس امنیتی و مالی باید مطابق سیاست مستقل و کنترل‌شده انجام شود.

## 4.2. Event Naming

نام رخدادها باید:

- ثابت باشد.
- توصیفی باشد.
- از واژگان استاندارد استفاده کند.
- با تغییر متن رابط تغییر نکند.
- به زبان رابط وابسته نباشد.

نمونه:

- `page_view`
- `route_transition`
- `api_request_failed`
- `form_validation_failed`
- `simulation_started`
- `simulation_completed`
- `simulation_failed`
- `map_layer_loaded`
- `product_viewed`
- `checkout_started`

## 4.3. Event Schema

ساختار پیشنهادی:

```json
{
  "event_id": "random-event-id",
  "event_name": "api_request_failed",
  "event_version": 1,
  "timestamp": "2026-11-17T12:00:00Z",
  "product": "hydroma",
  "environment": "staging",
  "release": "1.0.0",
  "session_ref": "pseudonymous-session-reference",
  "correlation_id": "request-correlation-id",
  "attributes": {
    "service": "scientific-dashboard",
    "error_code": "API_TIMEOUT"
  }
}
```

این نمونه صرفاً ساختار پیشنهادی است.

هیچ شناسه یا مقدار نمونه‌ای نباید به‌عنوان شناسه واقعی کاربر یا نشست استفاده شود.

## 4.4. Event Versioning

در صورت تغییر ساختار رخداد:

- نسخه Schema مشخص شود.
- سازگاری با مصرف‌کنندگان قبلی بررسی شود.
- فیلدهای حذف‌شده مستند شوند.
- Migration یا Compatibility Strategy تعریف شود.

---

# 5. Logging Standards

## 5.1. Log Levels

سطوح پیشنهادی:

| Level | Meaning | Example |
|---|---|---|
| DEBUG | اطلاعات تشخیصی توسعه | وضعیت داخلی غیرحساس |
| INFO | رخداد عادی | بارگذاری موفق قابلیت |
| WARN | وضعیت غیرعادی قابل مدیریت | Retry یا داده ناقص |
| ERROR | خطای عملیاتی | شکست درخواست |
| FATAL | اختلال بحرانی | از کار افتادن قابلیت اصلی |

استفاده از سطح FATAL در Frontend باید محدود باشد و معنای آن دقیق تعریف شود.

## 5.2. Structured Logging

Logها در صورت امکان ساختاریافته باشند.

نمونه:

```json
{
  "timestamp": "2026-11-17T12:00:00Z",
  "level": "ERROR",
  "product": "hydroma",
  "component": "simulation-panel",
  "event": "simulation_result_load_failed",
  "error_code": "RESULT_FETCH_FAILED",
  "release": "1.0.0",
  "correlation_id": "correlation-reference"
}
```

## 5.3. Log Content Restrictions

موارد زیر نباید در Log ثبت شوند:

- Password.
- Token.
- Secret.
- Cookie Value.
- Authorization Header.
- اطلاعات کامل پرداخت.
- اطلاعات خصوصی فرم‌ها.
- داده شخصی غیرضروری.
- محتوای کامل فایل‌های بارگذاری‌شده.
- مختصات حساس اشخاص یا دارایی‌ها.

## 5.4. Development Logging

در Development می‌توان اطلاعات تشخیصی بیشتری ثبت کرد؛ اما این اطلاعات نیز باید از داده محرمانه پاک‌سازی شوند.

## 5.5. Production Logging

در Production:

- Logهای DEBUG باید غیرفعال یا به‌شدت محدود باشند.
- خطاها باید قابل طبقه‌بندی باشند.
- داده حساس نباید افشا شود.
- ارسال Log باید کنترل‌شده باشد.
- شکست Telemetry نباید باعث شکست برنامه شود.

---

# 6. Error Tracking

## 6.1. Error Categories

خطاها باید در گروه‌های زیر طبقه‌بندی شوند:

1. JavaScript Runtime Errors.
2. Unhandled Promise Rejections.
3. React Rendering Errors.
4. API Errors.
5. Authentication Errors.
6. Authorization Errors.
7. Resource Loading Errors.
8. Network Errors.
9. Data Parsing Errors.
10. State Management Errors.
11. Map and Visualization Errors.
12. Simulation Interface Errors.

## 6.2. Error Fingerprinting

برای جلوگیری از ایجاد گزارش‌های تکراری، خطاهای مشابه باید با روش مشخص گروه‌بندی شوند.

Fingerprint نباید شامل اطلاعات حساس کاربران باشد.

## 6.3. Error Context

اطلاعات زمینه‌ای مجاز می‌تواند شامل موارد زیر باشد:

- Product.
- Release.
- Environment.
- Route Template.
- Component Name.
- Error Code.
- Browser Family.
- Device Class.
- Correlation ID.

ثبت URL کامل باید با احتیاط انجام شود؛ زیرا Query Parameterها ممکن است حاوی اطلاعات حساس باشند.

## 6.4. Error Boundary

در رابط‌های React، Error Boundary باید برای محدوده‌های مناسب طراحی شود.

خطای یک بخش نباید بدون ضرورت کل برنامه را از کار بیندازد.

نمونه بخش‌های قابل تفکیک:

- Scientific Dashboard.
- Map Panel.
- Chart Panel.
- Marketplace Catalog.
- User Profile.
- Financial Summary.

## 6.5. Error Recovery

پس از وقوع خطا باید در صورت امکان:

- پیام قابل فهم نمایش داده شود.
- مسیر بازیابی ارائه شود.
- داده‌های کاربر حفظ شوند.
- Retry کنترل‌شده انجام شود.
- وضعیت نامطمئن مشخص شود.
- از نمایش موفقیت کاذب جلوگیری شود.

---

# 7. API Observability

## 7.1. Request Metrics

شاخص‌های پیشنهادی:

- Request Count.
- Success Rate.
- Failure Rate.
- Timeout Rate.
- Response Time.
- Retry Count.
- HTTP Status Distribution.

## 7.2. Request Correlation

در صورت پشتیبانی Backend، هر درخواست می‌تواند دارای شناسه هم‌بستگی باشد.

این شناسه باید در گزارش Frontend و Backend قابل تطبیق باشد.

## 7.3. Sensitive Request Data

ثبت Body کامل درخواست یا پاسخ به‌صورت پیش‌فرض ممنوع است.

به‌جای آن، موارد زیر ثبت شوند:

- Endpoint Template.
- HTTP Method.
- Status Code.
- Duration.
- Error Code.
- Correlation ID.

## 7.4. Retry Observability

Retry باید به‌عنوان رخداد مستقل قابل شناسایی باشد.

موارد:

- علت Retry.
- تعداد تلاش.
- نتیجه نهایی.
- مدت تأخیر.
- وضعیت درخواست اولیه.

---

# 8. Performance Observability

## 8.1. Core Web Vitals

شاخص‌های اصلی:

- Largest Contentful Paint (LCP)
- Interaction to Next Paint (INP)
- Cumulative Layout Shift (CLS)

اهداف پیشنهادی برای صدک ۷۵ تجربه واقعی کاربران:

| Metric | Good |
|---|---|
| LCP | ≤ 2.5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0.1 |

این اهداف باید براساس داده واقعی و شرایط کاربران ارزیابی شوند.

## 8.2. Additional Metrics

- First Contentful Paint.
- Time to First Byte.
- Long Tasks.
- JavaScript Execution Time.
- Route Transition Time.
- Resource Loading Time.
- API Latency.
- Memory Usage در صورت امکان و با محدودیت‌های مرورگر.

## 8.3. Product-Specific Performance

### Eco Nojin

- بارگذاری صفحه اصلی.
- بارگذاری محتوای عمومی.
- تغییر زبان.
- Navigation.

### HyDroMA

- زمان بارگذاری داشبورد.
- زمان آماده شدن نمودار.
- زمان بارگذاری لایه نقشه.
- زمان آماده شدن رابط شبیه‌سازی.
- زمان دریافت نتایج.

### Nojin Marketplace

- زمان نمایش فهرست محصولات.
- زمان جست‌وجو.
- زمان اعمال فیلتر.
- زمان بارگذاری جزئیات محصول.
- زمان پاسخ به عملیات سفارش.

## 8.4. Performance Segmentation

شاخص‌ها در صورت نیاز می‌توانند براساس این ابعاد تحلیل شوند:

- Product.
- Release.
- Browser Family.
- Device Class.
- Network Category.
- Page Template.
- Language.

تقسیم‌بندی نباید موجب شناسایی کاربران شود.

---

# 9. Real User Monitoring (RUM)

## 9.1. Purpose

RUM برای ارزیابی عملکرد و تجربه واقعی کاربران استفاده می‌شود.

## 9.2. Data Collection

داده‌های مجاز پیشنهادی:

- Page Load Metrics.
- Interaction Latency.
- Resource Failures.
- Route Transition Duration.
- Device Class.
- Browser Family.
- Network Category در صورت پشتیبانی.

## 9.3. Sampling

در سامانه‌های پرترافیک، Sampling می‌تواند برای کنترل حجم داده استفاده شود.

سیاست Sampling باید:

- مشخص باشد.
- قابل بازبینی باشد.
- در تحلیل شاخص‌ها لحاظ شود.
- باعث حذف نظام‌مند گروهی از کاربران نشود.

## 9.4. RUM Limitations

RUM تنها تجربه کاربرانی را نشان می‌دهد که Telemetry آن‌ها دریافت شده است.

بنابراین نتایج باید با توجه به Sampling، محدودیت مرورگر و شرایط شبکه تفسیر شوند.

---

# 10. Synthetic Monitoring

Synthetic Monitoring برای بررسی دوره‌ای مسیرهای مشخص استفاده می‌شود.

نمونه مسیرها:

- بارگذاری صفحه اصلی.
- دسترسی به صفحه ورود.
- باز شدن داشبورد عمومی.
- بارگذاری یک صفحه علمی.
- دسترسی به فهرست محصولات.
- بارگذاری یک صفحه محتوایی.

آزمون‌های Synthetic باید از حساب‌های آزمایشی و داده‌های کنترل‌شده استفاده کنند.

استفاده از عملیات واقعی مالی یا تغییر داده عملیاتی در این آزمون‌ها مجاز نیست، مگر با مجوز و محیط ایزوله.

---

# 11. Product Analytics

## 11.1. Purpose

Product Analytics برای فهم الگوهای استفاده و شناسایی نقاط اصطکاک در تجربه کاربر استفاده می‌شود.

هدف، بهبود محصول است؛ نه نظارت غیرضروری بر افراد.

## 11.2. Event Categories

### Eco Nojin

- `homepage_viewed`
- `language_changed`
- `content_viewed`
- `navigation_used`
- `registration_started`

### HyDroMA

- `dashboard_viewed`
- `scientific_layer_selected`
- `map_layer_selected`
- `simulation_started`
- `simulation_completed`
- `simulation_failed`
- `report_export_requested`

### Nojin Marketplace

- `marketplace_viewed`
- `product_viewed`
- `search_performed`
- `filter_applied`
- `cart_updated`
- `checkout_started`
- `order_submitted`

این رخدادها نمونه پیشنهادی‌اند و هنوز به‌عنوان Event Registry رسمی تصویب نشده‌اند.

## 11.3. Analytics Restrictions

موارد زیر نباید بدون ضرورت و مجوز مشخص در Product Analytics ثبت شوند:

- محتوای خصوصی کاربران.
- متن پیام‌ها.
- اطلاعات مالی جزئی.
- شناسه‌های هویتی.
- مختصات دقیق مکانی.
- اطلاعات شخصی در جست‌وجوها.
- داده‌های محرمانه سازمانی.

## 11.4. Consent and User Choice

در صورت نیاز به رضایت کاربر:

- هدف پردازش مشخص باشد.
- نوع داده مشخص باشد.
- گزینه‌های انتخاب روشن باشند.
- امکان تغییر انتخاب فراهم باشد.
- وضعیت رضایت قابل اثبات باشد.

الزامات قانونی مربوط به کاربران و حوزه‌های جغرافیایی مختلف باید جداگانه بررسی شوند.

## 11.5. Analytics and Operational Telemetry

این دو نباید بدون تفکیک با یکدیگر ادغام شوند.

برای مثال، ثبت یک خطای فنی ضروری برای امنیت یا پایداری الزاماً همان سیاست رضایت و پردازش Analytics رفتاری را ندارد؛ هر دو همچنان باید تابع الزامات حریم خصوصی باشند.

---

# 12. Scientific Observability for HyDroMA

## 12.1. Scientific Operation Events

رخدادهای علمی باید وضعیت عملیات را نشان دهند، نه اینکه صرفاً تعامل ظاهری کاربر را ثبت کنند.

نمونه:

- دریافت داده.
- آماده‌سازی ورودی.
- شروع اجرای مدل.
- پایان اجرای مدل.
- شکست محاسبات.
- دریافت نتیجه.
- تولید گزارش.

## 12.2. Model Execution Correlation

در صورت پشتیبانی Engine و Backend، هر اجرای مدل باید شناسه اجرای مستقل داشته باشد.

این شناسه می‌تواند برای اتصال موارد زیر استفاده شود:

- درخواست Frontend.
- درخواست Backend.
- اجرای Engine.
- خروجی مدل.
- گزارش اعتبارسنجی.

## 12.3. Scientific Provenance Separation

Observability جایگزین Provenance نیست.

اطلاعات علمی زیر باید در ساختار معتبر داده و نتایج نگهداری شوند:

- Data Source.
- Model Version.
- Algorithm Version.
- Input Dataset Version.
- Spatial Extent.
- Time Range.
- Units.
- Quality Flags.
- Uncertainty.
- Validation Status.

## 12.4. Scientific Error Classification

نمونه خطاها:

- `INPUT_DATA_MISSING`
- `INVALID_UNIT`
- `UNSUPPORTED_REGION`
- `MODEL_EXECUTION_FAILED`
- `RESULT_FETCH_FAILED`
- `INVALID_SPATIAL_REFERENCE`
- `DATA_QUALITY_WARNING`

کد خطا نباید جایگزین توضیح فنی و مستندات مدل شود.

## 12.5. No False Scientific Success

ثبت رخداد `simulation_completed` باید صرفاً پس از تأیید وضعیت موفق عملیات از منبع معتبر انجام شود.

نمایش یک انیمیشن پیشرفت یا پایان درخواست Frontend به‌تنهایی اثبات پایان موفق محاسبه نیست.

---

# 13. Financial and Marketplace Observability

## 13.1. Financial Event Boundaries

رخدادهای مالی باید با دقت و حداقل‌گرایی ثبت شوند.

نمونه وضعیت‌ها:

- عملیات آغاز شد.
- درخواست ارسال شد.
- عملیات در انتظار تأیید است.
- عملیات ناموفق شد.
- عملیات از Backend تأیید شد.

## 13.2. Transaction Correlation

در صورت نیاز، شناسه تراکنش یا شناسه مرجع غیرمحرمانه می‌تواند برای هم‌بستگی استفاده شود.

اطلاعات احراز هویت یا داده‌های پرداخت نباید در Telemetry ثبت شوند.

## 13.3. Financial Truth

Frontend نباید منبع حقیقت وضعیت مالی باشد.

وضعیت نهایی سفارش، پرداخت، کیف پول یا تراکنش باید از Backend معتبر دریافت شود.

## 13.4. Duplicate Events

برای جلوگیری از گزارش‌های گمراه‌کننده:

- رخدادهای تکراری قابل تشخیص باشند.
- شناسه رخداد یکتا باشد.
- Retry از عملیات جدید تفکیک شود.
- عملیات حساس با شناسه مرجع مناسب هم‌بسته شوند.

---

# 14. Alerting and Incident Detection

## 14.1. Alert Categories

- Availability Alerts.
- Error Rate Alerts.
- API Failure Alerts.
- Authentication Failure Alerts.
- Performance Regression Alerts.
- Scientific Workflow Failure Alerts.
- Marketplace Workflow Alerts.
- Security Alerts.

## 14.2. Alert Quality

هشدار باید:

- قابل اقدام باشد.
- مالک مشخص داشته باشد.
- شدت مشخص داشته باشد.
- آستانه تعریف‌شده داشته باشد.
- مسیر رسیدگی مشخص داشته باشد.

هشدارهای پرتکرار و بدون اقدام باید بازبینی شوند.

## 14.3. Severity

| Severity | Meaning |
|---|---|
| SEV-0 | بحران عملیاتی یا امنیتی بسیار جدی |
| SEV-1 | اختلال جدی در قابلیت حیاتی |
| SEV-2 | اختلال مهم با دامنه محدود |
| SEV-3 | مشکل کم‌اثر یا قابل مدیریت |
| SEV-4 | اطلاع‌رسانی یا هشدار غیراضطراری |

## 14.4. Alert Thresholds

آستانه‌ها باید پس از ایجاد Baseline واقعی تعیین شوند.

استفاده از اعداد تصادفی یا آستانه‌های بدون داده مرجع توصیه نمی‌شود.

---

# 15. Dashboard Standards

## 15.1. Operational Dashboard

داشبورد عملیاتی پیشنهادی:

- وضعیت نسخه جاری.
- سلامت صفحات.
- خطاهای JavaScript.
- نرخ شکست API.
- Performance Metrics.
- وضعیت سرویس‌های وابسته.
- هشدارهای فعال.
- رخدادهای اخیر.

## 15.2. Product Dashboard

داشبورد محصول می‌تواند شامل موارد زیر باشد:

- مسیرهای پرکاربرد.
- نقاط خروج از فرایند.
- نرخ تکمیل عملیات.
- خطاهای تجربه کاربری.
- استفاده از قابلیت‌ها.
- تفکیک محصول و نسخه.

## 15.3. Scientific Dashboard

داشبورد علمی HyDroMA باید علاوه بر وضعیت عملیاتی، شاخص‌های مرتبط با عملیات علمی را نمایش دهد.

نمونه:

- تعداد اجرای مدل.
- اجرای موفق.
- اجرای ناموفق.
- زمان اجرای مدل.
- وضعیت دریافت داده.
- هشدارهای کیفیت داده.
- نتایج نیازمند اعتبارسنجی.

تعداد اجرای موفق مدل به‌تنهایی نشان‌دهنده اعتبار علمی نتایج نیست.

## 15.4. Marketplace Dashboard

شاخص‌های پیشنهادی:

- مشاهده محصولات.
- جست‌وجوهای موفق.
- خطاهای جست‌وجو.
- وضعیت سبد خرید.
- تکمیل سفارش.
- خطاهای Checkout.
- وضعیت عملیات Backend.

شاخص‌های مالی باید با داده معتبر و مجوزهای دسترسی مناسب نمایش داده شوند.

---

# 16. Privacy, Security and Data Retention

## 16.1. Data Classification

داده‌های Telemetry باید طبقه‌بندی شوند:

| Classification | Example |
|---|---|
| Public | نسخه عمومی نرم‌افزار |
| Internal | کد خطای داخلی |
| Confidential | اطلاعات عملیاتی محدود |
| Sensitive | اطلاعات شخصی، مالی یا مکانی حساس |

## 16.2. Retention Policy

برای هر دسته داده باید مدت نگهداری مشخص شود.

مدت نگهداری باید براساس موارد زیر تعیین شود:

- هدف پردازش.
- نیاز عملیاتی.
- الزامات قانونی.
- هزینه ذخیره‌سازی.
- حساسیت داده.
- نیاز ممیزی.

## 16.3. Access Control

دسترسی به Telemetry باید مبتنی بر نقش باشد.

برای مثال:

- Developer: خطاهای فنی موردنیاز.
- Operations: شاخص‌های سلامت.
- Product Analyst: داده‌های تحلیلی مجاز.
- Security: رخدادهای امنیتی مجاز.
- Owner: گزارش‌های مدیریتی و وضعیت کلان.

## 16.4. Data Deletion

فرایند حذف یا ناشناس‌سازی داده‌های منقضی باید تعریف شود.

## 16.5. Cross-Border Data Processing

در صورت استفاده از سرویس‌های خارجی، محل پردازش و نگهداری داده باید بررسی شود.

ارسال Telemetry به سرویس خارجی بدون بررسی امنیت، حریم خصوصی و الزامات قانونی مجاز نیست.

---

# 17. Reliability of Telemetry

## 17.1. Non-Blocking Instrumentation

شکست ارسال Telemetry نباید عملکرد اصلی برنامه را مختل کند.

## 17.2. Queue and Retry

در صورت استفاده از صف یا Retry:

- حجم حافظه محدود باشد.
- تلاش مجدد کنترل شود.
- داده حساس ذخیره نشود.
- رخدادهای تکراری قابل تشخیص باشند.
- عملیات اصلی به Telemetry وابسته نشود.

## 17.3. Sampling and Loss

در صورت Sampling یا احتمال از دست رفتن رخداد:

- محدودیت مشخص باشد.
- روش محاسبه شاخص‌ها مستند باشد.
- داده‌های ناقص به‌عنوان داده کامل معرفی نشوند.

## 17.4. Clock and Timestamp

زمان رخدادها باید با استاندارد مشخص ثبت شود.

پیشنهاد:

- ذخیره Timestamp در UTC.
- تبدیل به منطقه زمانی فقط در لایه نمایش.
- نگهداری زمان سرور برای رخدادهای Backend.
- توجه به اختلاف ساعت Client و Server.

زمان Client به‌تنهایی مرجع قطعی ترتیب رخدادهای عملیاتی نیست.

---

# 18. Observability Testing

پیش از تأیید سامانه Telemetry باید موارد زیر آزمون شوند:

1. ثبت رخداد موفق.
2. ثبت خطای JavaScript.
3. ثبت خطای API.
4. ثبت شناسه نسخه.
5. ثبت شناسه هم‌بستگی.
6. حذف Token از Log.
7. حذف داده حساس از URL.
8. عدم اختلال برنامه هنگام شکست Telemetry.
9. عملکرد صحیح Sampling.
10. کنترل Retry.
11. کنترل دسترسی داشبوردها.
12. حذف داده‌های منقضی.
13. ثبت صحیح رخدادهای علمی.
14. ثبت صحیح وضعیت عملیات مالی.
15. عدم ارسال ناخواسته داده شخصی.

## 18.1. Privacy Regression

هر تغییر در Event Schema، Instrumentation یا ابزار Analytics باید از نظر نشت اطلاعات دوباره بررسی شود.

## 18.2. Telemetry Coverage

برای قابلیت‌های حیاتی باید مشخص باشد:

- کدام رخدادها ثبت می‌شوند.
- کدام خطاها قابل تشخیص‌اند.
- چه شاخص‌هایی وجود دارند.
- چه هشدارهایی تعریف شده‌اند.
- چه محدودیت‌هایی باقی مانده‌اند.

---

# 19. Tool Selection Principles

ابزارها باید براساس نیاز واقعی انتخاب شوند.

دسته‌های ابزار:

| Category | Purpose |
|---|---|
| Error Tracking | ثبت و گروه‌بندی خطا |
| RUM | پایش تجربه واقعی |
| Metrics | اندازه‌گیری شاخص‌ها |
| Logs | ذخیره رخدادها |
| Tracing | هم‌بستگی درخواست‌ها |
| Analytics | تحلیل رفتار محصول |
| Alerting | هشدار عملیاتی |
| Dashboard | نمایش وضعیت |

معیارهای انتخاب:

- متن‌باز بودن در صورت امکان.
- امکان Self-hosting.
- کنترل محل ذخیره داده.
- سازگاری با معماری.
- هزینه نگهداری.
- امنیت.
- مقیاس‌پذیری.
- کیفیت مستندات.
- قابلیت Export.
- قابلیت جایگزینی.

این سند هیچ محصول یا سرویس خاصی را انتخاب یا تصویب نمی‌کند.

---

# 20. Governance and Agent Restrictions

ایجنت توسعه می‌تواند:

- Event Schema پیشنهاد دهد.
- Instrumentation پیاده‌سازی کند.
- خطاها را دسته‌بندی کند.
- شاخص‌های عملکرد تعریف کند.
- Dashboard آزمایشی ایجاد کند.
- گزارش Telemetry تهیه کند.
- آزمون‌های حریم خصوصی اجرا کند.

اما بدون مجوز صریح مالک نباید:

- اطلاعات شخصی کاربران را جمع‌آوری کند.
- Telemetry را به سرویس خارجی متصل کند.
- داده کاربران را برای Analytics ارسال کند.
- سیاست Consent را تغییر دهد.
- Retention داده را تغییر دهد.
- داده عملیاتی را حذف کند.
- Logging محرمانه را فعال کند.
- اطلاعات مالی یا مکانی حساس را ثبت کند.
- ابزار پایش Production را فعال کند.
- دسترسی داشبوردهای عملیاتی را گسترش دهد.

## 20.1. Reporting Requirements

هر گزارش پیاده‌سازی باید تفکیک کند:

- طراحی شده.
- پیاده‌سازی شده.
- آزمون شده.
- اعتبارسنجی شده.
- فعال در محیط آزمایشی.
- فعال در Production.
- تأییدشده توسط مسئول مجاز.

وجود کد Instrumentation به‌معنای دریافت واقعی Telemetry نیست.

---

# 21. Acceptance Criteria

| ID | Acceptance Criterion | Evidence |
|---|---|---|
| OBS-001 | Event Taxonomy تعریف شده است | Event Registry |
| OBS-002 | Schema رخدادها مشخص است | Schema Documentation |
| OBS-003 | خطاهای حیاتی قابل شناسایی‌اند | Error Test |
| OBS-004 | اطلاعات حساس فیلتر می‌شوند | Privacy Test |
| OBS-005 | شناسه نسخه ثبت می‌شود | Event Evidence |
| OBS-006 | Correlation قابل ردیابی است | Integration Evidence |
| OBS-007 | شکست Telemetry برنامه را مختل نمی‌کند | Failure Test |
| OBS-008 | Performance Metrics تعریف شده‌اند | Metrics Report |
| OBS-009 | RUM با سیاست حریم خصوصی سازگار است | Privacy Review |
| OBS-010 | دسترسی داشبورد کنترل شده است | Access Review |
| OBS-011 | Retention Policy تعریف شده است | Data Policy |
| OBS-012 | رخدادهای علمی از Provenance جدا هستند | Architecture Review |
| OBS-013 | رخدادهای مالی داده محرمانه ندارند | Security Review |
| OBS-014 | هشدارهای حیاتی تعریف شده‌اند | Alert Configuration |
| OBS-015 | Telemetry Regression Test وجود دارد | Test Report |

---

# 22. Open Decisions

| ID | Decision | Status |
|---|---|---|
| OBS-D01 | معماری نهایی Observability | OPEN |
| OBS-D02 | انتخاب ابزار Error Tracking | OPEN |
| OBS-D03 | انتخاب ابزار RUM | OPEN |
| OBS-D04 | انتخاب ابزار Logging | OPEN |
| OBS-D05 | انتخاب ابزار Metrics | OPEN |
| OBS-D06 | انتخاب ابزار Tracing | OPEN |
| OBS-D07 | انتخاب ابزار Product Analytics | OPEN |
| OBS-D08 | Event Registry رسمی | OPEN |
| OBS-D09 | سیاست Sampling | OPEN |
| OBS-D10 | سیاست Consent | OPEN |
| OBS-D11 | محل نگهداری Telemetry | OPEN |
| OBS-D12 | مدت نگهداری داده | OPEN |
| OBS-D13 | نقش‌ها و دسترسی‌ها | OPEN |
| OBS-D14 | آستانه هشدارها | OPEN |
| OBS-D15 | سیاست ناشناس‌سازی | OPEN |
| OBS-D16 | سیاست پردازش برون‌مرزی | OPEN |
| OBS-D17 | مسئول پاسخ‌گویی رخدادها | OPEN |
| OBS-D18 | داشبوردهای رسمی هر محصول | OPEN |

---

# 23. Final Principles

1. مشاهده‌پذیری باید هدفمند باشد.
2. جمع‌آوری داده باید حداقلی و کنترل‌شده باشد.
3. هیچ Secret یا Token نباید در Log ثبت شود.
4. شکست Telemetry نباید برنامه اصلی را متوقف کند.
5. خطاها باید قابل طبقه‌بندی و پیگیری باشند.
6. شاخص‌ها باید تعریف و روش محاسبه مشخص داشته باشند.
7. داده علمی و Provenance باید مستقل از Operational Logs باشند.
8. وضعیت مالی باید از Backend معتبر دریافت شود.
9. Analytics نباید بدون سیاست حریم خصوصی فعال شود.
10. رخدادهای Frontend و Backend در صورت نیاز باید قابل هم‌بستگی باشند.
11. داده‌های Telemetry باید دارای سیاست نگهداری و دسترسی باشند.
12. فعال‌سازی ابزارهای Production نیازمند مجوز مشخص است.

---

# 24. Document Status

**Current Status: DRAFT — PROPOSED — NOT APPROVED**

این سند چارچوب پیشنهادی مشاهده‌پذیری، Logging، Error Tracking، RUM و Product Analytics را تعریف می‌کند.

این سند:

- ابزار خاصی را تصویب نمی‌کند.
- اتصال به سرویس خارجی را مجاز نمی‌کند.
- جمع‌آوری داده کاربران را فعال نمی‌کند.
- سیاست Consent را نهایی نمی‌کند.
- محل ذخیره Telemetry را تعیین نمی‌کند.
- صحت Telemetry فعلی را تأیید نمی‌کند.
- وجود Dashboard عملیاتی را اثبات نمی‌کند.
- مجوز فعال‌سازی پایش Production صادر نمی‌کند.

اجرای این استاندارد باید پس از بررسی معماری واقعی، ارزیابی حریم خصوصی، تعیین ابزارها، تعریف سیاست نگهداری داده و تأیید مالک انجام شود.

**End of Document 27**