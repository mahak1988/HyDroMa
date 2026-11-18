# 23. FRONTEND PERFORMANCE OPTIMIZATION AND MONITORING STANDARDS

## Web Performance, Runtime Efficiency, Network Optimization and Observability

**Ecosystem:** Eco Nojin  
**Brands:** Eco Nojin / HyDroMA / Nojin Marketplace  
**Document ID:** EN-VI-023  
**Version:** 1.0.0  
**Status:** DRAFT — PROPOSED — NOT APPROVED  
**Classification:** Frontend Architecture / Performance Engineering / Observability  
**Target Platforms:** Desktop / Tablet / Mobile  
**Approval Authority:** Project Owner

---

# 1. PURPOSE

این سند استانداردهای عملکرد، بهینه‌سازی و پایش Frontend را برای اکوسیستم Eco Nojin تعریف می‌کند.

هدف، ایجاد رابطی سریع، پایدار، کم‌مصرف و قابل استفاده در شرایط متنوع سخت‌افزاری و شبکه‌ای است.

این استاندارد برای سه محصول با ماهیت متفاوت تدوین شده است:

1. **Eco Nojin:** تجربه عمومی، معرفی اکوسیستم، محتوا و دسترسی به خدمات.
2. **HyDroMA:** داشبورد علمی، داده‌های مکانی، نمودارها، تحلیل‌ها و شبیه‌سازی.
3. **Nojin Marketplace:** جست‌وجو، فهرست محصولات، صفحات فروشندگان، سفارش و فرآیندهای مالی.

بهینه‌سازی باید در سطح معماری، کد، شبکه، رندرینگ، داده، دارایی‌های بصری و تجربه کاربری انجام شود.

## 1.1. Primary Objectives

- کاهش زمان بارگذاری صفحات.
- بهبود پاسخ‌گویی تعاملات.
- کاهش مصرف CPU و Memory.
- کاهش حجم انتقال داده.
- جلوگیری از رندرهای غیرضروری.
- بهینه‌سازی تصاویر و فونت‌ها.
- کنترل بارگذاری کتابخانه‌های سنگین.
- بهبود عملکرد نقشه‌ها و نمودارها.
- افزایش پایداری در شبکه‌های ضعیف.
- ایجاد قابلیت اندازه‌گیری و پایش عملکرد.
- جلوگیری از افت عملکرد در توسعه‌های آینده.

## 1.2. Fundamental Principle

عملکرد خوب باید اندازه‌گیری شود، نه اینکه صرفاً از روی ظاهر یا احساس سرعت قضاوت شود.

هیچ ادعایی مانند Fast، Optimized، Lightweight یا High Performance بدون معیار و شواهد آزمون معتبر نیست.

---

# 2. PERFORMANCE ENGINEERING PRINCIPLES

## 2.1. Performance by Design

عملکرد باید از مرحله طراحی معماری و تجربه کاربری در نظر گرفته شود.

## 2.2. Measure Before Optimize

پیش از بهینه‌سازی باید وضعیت پایه اندازه‌گیری شود.

## 2.3. User-Centric Performance

سرعت دریافت محتوای اصلی و امکان تعامل کاربر مهم‌تر از صرفاً کاهش حجم Bundle است.

## 2.4. Progressive Loading

محتوای ضروری باید زودتر از قابلیت‌های سنگین و غیرضروری در دسترس قرار گیرد.

## 2.5. Resource Awareness

مصرف منابع باید با توجه به موارد زیر کنترل شود:

- قدرت پردازنده.
- حافظه دستگاه.
- اندازه نمایشگر.
- سرعت شبکه.
- نوع اتصال.
- وضعیت باتری.
- قابلیت‌های مرورگر.

## 2.6. Graceful Degradation

در شرایط محدود، قابلیت‌های غیرضروری باید کاهش یابند، اما عملکردهای حیاتی محصول حفظ شوند.

---

# 3. PERFORMANCE REFERENCE STANDARDS

مراجع پیشنهادی:

| Reference | Purpose |
|---|---|
| Core Web Vitals | سنجش تجربه واقعی کاربر |
| Lighthouse | ارزیابی عملکرد و کیفیت صفحه |
| PageSpeed Insights | تحلیل عملکرد صفحات |
| Chrome DevTools | تحلیل Runtime و Network |
| Web Vitals Library | اندازه‌گیری شاخص‌های عملکرد |
| Navigation Timing API | اندازه‌گیری چرخه بارگذاری |
| Resource Timing API | تحلیل منابع شبکه |
| Performance API | تحلیل عملکرد مرورگر |
| W3C Performance Timeline | استاندارد زمان‌بندی عملکرد |
| HTTP Caching Standards | مدیریت Cache |
| Web Performance Working Group | مراجع فنی عملکرد وب |

این سند جایگزین مستندات رسمی ابزارها و استانداردها نیست.

---

# 4. CORE WEB VITALS

سه شاخص اصلی تجربه بارگذاری و تعامل باید اندازه‌گیری شوند.

## 4.1. Largest Contentful Paint (LCP)

LCP زمان نمایش بزرگ‌ترین عنصر محتوایی قابل مشاهده در Viewport را اندازه‌گیری می‌کند.

اهداف:

| Rating | LCP |
|---|---:|
| Good | ≤ 2.5 seconds |
| Needs Improvement | > 2.5s to 4.0s |
| Poor | > 4.0 seconds |

هدف پیشنهادی:

**LCP ≤ 2.5s at the 75th percentile**

## 4.2. Interaction to Next Paint (INP)

INP پاسخ‌گویی تعاملات کاربر را اندازه‌گیری می‌کند.

| Rating | INP |
|---|---:|
| Good | ≤ 200 ms |
| Needs Improvement | > 200ms to 500ms |
| Poor | > 500ms |

هدف پیشنهادی:

**INP ≤ 200ms at the 75th percentile**

## 4.3. Cumulative Layout Shift (CLS)

CLS میزان جابه‌جایی غیرمنتظره عناصر صفحه را اندازه‌گیری می‌کند.

| Rating | CLS |
|---|---:|
| Good | ≤ 0.1 |
| Needs Improvement | > 0.1 to 0.25 |
| Poor | > 0.25 |

هدف پیشنهادی:

**CLS ≤ 0.1 at the 75th percentile**

## 4.4. Measurement Scope

شاخص‌های فوق باید:

- برای هر برند جداگانه بررسی شوند.
- در سطح Page Template اندازه‌گیری شوند.
- با نوع دستگاه تفکیک شوند.
- با شرایط شبکه مقایسه شوند.
- بر اساس داده واقعی کاربران در صورت امکان تحلیل شوند.

امتیاز Lighthouse به‌تنهایی جایگزین اندازه‌گیری Core Web Vitals در محیط واقعی نیست.

---

# 5. PERFORMANCE BUDGETS

Performance Budget سقف منابع مجاز برای صفحات و قابلیت‌ها را مشخص می‌کند.

مقادیر زیر پیشنهاد اولیه هستند و تا پیش از اندازه‌گیری و تأیید مالک، الزام قطعی محسوب نمی‌شوند.

## 5.1. Initial Budget Proposal

| Resource | Proposed Budget |
|---|---:|
| Initial JavaScript Transfer | ≤ 250 KB |
| Initial CSS Transfer | ≤ 100 KB |
| Critical Fonts | ≤ 150 KB |
| Initial Image Transfer | ≤ 400 KB |
| Initial Page Transfer | ≤ 1 MB |
| Main Thread Long Tasks | Minimize; investigate > 50 ms |
| Initial Third-Party Scripts | Minimize |
| Unused JavaScript | Minimize and monitor |

اعداد فوق باید بر اساس نوع صفحه، فشرده‌سازی، تعداد منابع و شرایط شبکه بازنگری شوند.

## 5.2. Page Categories

بودجه عملکرد باید برای گروه‌های مختلف صفحه جداگانه تعریف شود:

| Category | Performance Priority |
|---|---|
| Public Landing Pages | Very High |
| Content Pages | High |
| Authentication | High |
| Scientific Dashboard | High |
| Interactive Maps | Controlled Heavy Workload |
| Simulation Pages | Controlled Heavy Workload |
| Marketplace Listings | Very High |
| Product Detail | High |
| Financial Pages | Very High |
| Admin Panels | High |

## 5.3. Budget Enforcement

در CI باید امکان بررسی موارد زیر فراهم شود:

- Bundle Size.
- Chunk Size.
- Asset Size.
- Dependency Growth.
- CSS Growth.
- Unused Code.
- Build Output.

عبور از بودجه باید گزارش شود و در موارد تعیین‌شده مانع انتشار شود.

---

# 6. FRONTEND BUNDLE OPTIMIZATION

## 6.1. Bundle Analysis

باید ابزار تحلیل Bundle برای شناسایی موارد زیر استفاده شود:

- وابستگی‌های بزرگ.
- کتابخانه‌های تکراری.
- کدهای بلااستفاده.
- Chunkهای سنگین.
- واردسازی غیرضروری.
- وابستگی‌های زنجیره‌ای.

## 6.2. Tree Shaking

استفاده از Tree Shaking باید با توجه به قابلیت واقعی Build Tool بررسی شود.

## 6.3. Code Splitting

تقسیم کد باید بر اساس:

- مسیرها.
- قابلیت‌ها.
- بخش‌های سنگین.
- جریان‌های مستقل.
- نیاز واقعی کاربر.

انجام شود.

## 6.4. Lazy Loading

قابلیت‌های غیرضروری در بارگذاری اولیه باید به تعویق بیفتند.

نمونه:

- ویرایشگرهای پیشرفته.
- ابزارهای گزارش‌گیری سنگین.
- ماژول‌های سه‌بعدی.
- نقشه‌های تخصصی.
- تحلیل‌های پیچیده.
- پنل‌های مدیریتی کم‌استفاده.

Lazy Loading نباید باعث تأخیر ناموجه در عملکرد اصلی صفحه شود.

## 6.5. Dynamic Imports

در صورت پشتیبانی معماری:

```javascript
const ScientificMap = lazy(
  () => import("./ScientificMap")
);
```

استفاده از Dynamic Import باید همراه با مدیریت Loading و Error باشد.

## 6.6. Dependency Control

افزودن هر وابستگی جدید باید از نظر:

- حجم.
- مصرف Runtime.
- نگهداری.
- مجوز.
- امنیت.
- قابلیت جایگزینی.

بررسی شود.

---

# 7. RENDERING STRATEGY

روش رندرینگ باید متناسب با ماهیت صفحه انتخاب شود.

## 7.1. Rendering Options

| Strategy | Suitable Use |
|---|---|
| CSR | برنامه‌های تعاملی |
| SSR | صفحات دارای نیاز به رندر سمت سرور |
| SSG | محتوای عمومی نسبتاً ثابت |
| ISR | صفحات قابل بازتولید دوره‌ای، در صورت پشتیبانی |
| Hybrid Rendering | ترکیب نیازهای متفاوت |

هیچ روش رندرینگی برای تمام صفحات اکوسیستم به‌صورت پیش‌فرض مناسب نیست.

## 7.2. Public Pages

برای صفحات عمومی Eco Nojin:

- محتوای اصلی باید سریع قابل دریافت باشد.
- SEO باید در نظر گرفته شود.
- تصاویر Hero باید بهینه باشند.
- JavaScript غیرضروری محدود شود.
- رندر سمت سرور یا تولید استاتیک بر اساس معماری بررسی شود.

## 7.3. Scientific Dashboard

برای داشبورد HyDroMA:

- بارگذاری مرحله‌ای داده‌ها.
- جداسازی محاسبات سنگین.
- نمایش وضعیت پردازش.
- جلوگیری از بارگذاری هم‌زمان غیرضروری.
- کنترل رندر نمودارها.
- محدودسازی تعداد نقاط داده قابل نمایش.

## 7.4. Marketplace

برای Nojin Marketplace:

- نمایش سریع فهرست اولیه محصولات.
- بارگذاری تدریجی تصاویر.
- Pagination یا Virtualization در فهرست‌های بزرگ.
- جلوگیری از دریافت همه محصولات در یک درخواست.
- Cache مناسب برای محتوای عمومی.

---

# 8. REACT PERFORMANCE STANDARDS

در صورت استفاده از React، موارد زیر باید بررسی شوند.

## 8.1. Component Rendering

- کامپوننت‌ها باید مسئولیت مشخص داشته باشند.
- State باید تا حد امکان نزدیک به محل استفاده باشد.
- تغییر State غیرضروری محدود شود.
- از Prop Drilling غیرضروری جلوگیری شود.
- کامپوننت‌های بزرگ در صورت نیاز تفکیک شوند.

## 8.2. Memoization

استفاده از موارد زیر باید بر اساس اندازه‌گیری باشد:

- React.memo
- useMemo
- useCallback

استفاده بیش از حد از Memoization می‌تواند پیچیدگی و مصرف حافظه را افزایش دهد.

## 8.3. List Rendering

در فهرست‌های بزرگ:

- Key پایدار استفاده شود.
- از Index به‌عنوان Key در فهرست‌های متغیر اجتناب شود.
- Virtualization بررسی شود.
- تعداد عناصر DOM کنترل شود.

## 8.4. State Management

- Stateهای مستقل از هم تفکیک شوند.
- تغییر State سراسری محدود شود.
- Server State از UI State جدا باشد.
- داده‌های قدیمی و غیرضروری پاک‌سازی شوند.
- درخواست‌های تکراری کنترل شوند.

## 8.5. Avoid Unnecessary Effects

استفاده از Effect نباید برای محاسباتی باشد که می‌توانند مستقیماً از State و Props به دست آیند.

## 8.6. React Strict Mode

رفتار توسعه و Production باید از هم تفکیک شود.

اجرای دوباره برخی عملیات در محیط توسعه نباید به‌عنوان عملکرد Production تلقی شود.

---

# 9. IMAGE OPTIMIZATION

تصاویر می‌توانند سهم قابل توجهی از حجم انتقال داده را تشکیل دهند.

## 9.1. Format Selection

فرمت‌های قابل بررسی:

- AVIF
- WebP
- JPEG
- PNG
- SVG

انتخاب باید بر اساس سازگاری مرورگر، نوع تصویر و کیفیت مورد نیاز انجام شود.

## 9.2. Responsive Images

برای تصاویر با اندازه‌های مختلف:

- `srcset`
- `sizes`
- `picture`

بررسی شوند.

## 9.3. Lazy Loading

تصاویر خارج از Viewport می‌توانند به‌صورت Lazy Load بارگذاری شوند.

تصویر اصلی LCP نباید بدون بررسی با Lazy Loading به تأخیر بیفتد.

## 9.4. Dimensions

ابعاد تصویر باید مشخص باشند تا از Layout Shift جلوگیری شود.

## 9.5. Image Quality

فشرده‌سازی نباید اطلاعات علمی، مکانی یا جزئیات ضروری تصویر را تخریب کند.

## 9.6. Scientific Images

در تصاویر سنجش‌ازدور و خروجی‌های علمی:

- وضوح داده باید حفظ شود.
- روش تبدیل تصویر مستند باشد.
- نسخه اصلی در صورت نیاز قابل بازیابی باشد.
- تصویر نمایشی از داده اصلی متمایز باشد.

---

# 10. FONT PERFORMANCE

فونت‌ها باید از نظر سرعت بارگذاری و حجم کنترل شوند.

## 10.1. Font Strategy

- فقط وزن‌های مورد نیاز بارگذاری شوند.
- فایل‌های فونت غیرضروری حذف شوند.
- فرمت‌های مناسب مرورگر انتخاب شوند.
- Subsetting در صورت امکان بررسی شود.
- Font Loading Strategy مشخص باشد.

## 10.2. Font Display

استفاده از `font-display` باید با توجه به تجربه خوانایی و جلوگیری از Flash of Invisible Text بررسی شود.

نمونه:

```css
@font-face {
  font-family: "Vazirmatn";
  src: url("/fonts/vazirmatn.woff2") format("woff2");
  font-display: swap;
}
```

## 10.3. Font Preloading

Preload فقط برای فونت‌های واقعاً حیاتی استفاده شود.

بارگذاری بیش از حد فونت‌ها می‌تواند عملکرد را کاهش دهد.

## 10.4. Multilingual Fonts

فونت فارسی و لاتین باید با توجه به:

- حجم فایل.
- پوشش Glyph.
- کیفیت نمایش.
- مجوز.
- تعداد وزن‌ها.

بهینه شوند.

---

# 11. CSS AND STYLING PERFORMANCE

## 11.1. CSS Optimization

- CSS بلااستفاده حذف شود.
- Selectorهای پیچیده غیرضروری محدود شوند.
- فایل‌های تکراری حذف شوند.
- Critical CSS در صورت نیاز بررسی شود.
- حجم CSS اولیه کنترل شود.

## 11.2. Layout Performance

از ایجاد Layout Thrashing جلوگیری شود.

ترکیب مکرر خواندن و نوشتن Layout Properties باید بررسی شود.

## 11.3. Animation Performance

برای Animationهای ضروری، استفاده مناسب از `transform` و `opacity` ترجیح داده می‌شود.

استفاده گسترده از `will-change` بدون نیاز واقعی توصیه نمی‌شود.

## 11.4. CSS Containment

در بخش‌های مستقل و سنگین، استفاده از CSS Containment می‌تواند بررسی شود.

---

# 12. NETWORK PERFORMANCE

## 12.1. Request Optimization

- تعداد درخواست‌ها کنترل شود.
- درخواست‌های تکراری حذف شوند.
- منابع غیرضروری بارگذاری نشوند.
- درخواست‌های وابسته به هم بی‌دلیل زنجیره‌ای نشوند.
- درخواست‌های موازی کنترل شوند.

## 12.2. Compression

فشرده‌سازی مناسب منابع متنی باید در Server یا CDN پشتیبانی شود.

## 12.3. HTTP Protocol

پشتیبانی از HTTP/2 یا HTTP/3 باید بر اساس زیرساخت و سازگاری بررسی شود.

## 12.4. DNS and Connection

در صورت نیاز، موارد زیر بررسی شوند:

- DNS Prefetch.
- Preconnect.
- Resource Hints.

استفاده بی‌رویه از Resource Hints می‌تواند باعث مصرف منابع غیرضروری شود.

## 12.5. Request Cancellation

در درخواست‌های غیرضروری یا تغییر مسیر:

- درخواست‌های قدیمی لغو شوند.
- پاسخ‌های منقضی نادیده گرفته شوند.
- Race Condition کنترل شود.

## 12.6. Retry Strategy

Retry باید:

- محدود باشد.
- Backoff داشته باشد.
- برای عملیات غیرقابل تکرار استفاده نشود، مگر با کنترل Idempotency.
- از ایجاد بار اضافی روی Backend جلوگیری کند.

---

# 13. API DATA PERFORMANCE

## 13.1. Pagination

دریافت مجموعه‌های بزرگ داده باید صفحه‌بندی شود.

## 13.2. Cursor Pagination

برای داده‌های بزرگ و متغیر، Cursor Pagination می‌تواند بررسی شود.

## 13.3. Filtering and Sorting

در صورت حجم زیاد داده، عملیات Filter و Sort باید در سمت سرور انجام شوند.

## 13.4. Payload Optimization

پاسخ API باید فقط شامل داده‌های لازم برای همان صفحه یا قابلیت باشد.

## 13.5. Data Compression

فشرده‌سازی پاسخ‌های متنی باید بررسی شود.

## 13.6. Data Freshness

هر داده باید با توجه به ماهیت خود سیاست Freshness داشته باشد.

داده علمی، داده مالی و محتوای عمومی نباید الزاماً سیاست Cache یکسان داشته باشند.

---

# 14. DASHBOARD PERFORMANCE — HYDROMA

داشبوردهای علمی معمولاً از پرهزینه‌ترین بخش‌های Frontend هستند.

## 14.1. Dashboard Loading Strategy

پیشنهاد:

1. نمایش ساختار صفحه.
2. نمایش وضعیت بارگذاری.
3. دریافت شاخص‌های اصلی.
4. دریافت داده‌های ثانویه.
5. بارگذاری نمودارها.
6. بارگذاری نقشه‌های تخصصی در صورت نیاز.
7. فعال‌سازی قابلیت‌های تحلیلی سنگین.

## 14.2. Independent Widgets

Widgetهای داشبورد باید تا حد امکان مستقل باشند.

خطای یک Widget نباید کل داشبورد را از کار بیندازد.

## 14.3. Data Refresh

به‌روزرسانی داده باید:

- دوره مشخص داشته باشد.
- قابل کنترل باشد.
- از درخواست تکراری جلوگیری کند.
- وضعیت آخرین دریافت را نشان دهد.
- داده قدیمی را از داده جدید متمایز کند.

## 14.4. Large Dataset Handling

برای داده‌های بزرگ:

- Aggregation سمت سرور.
- Sampling کنترل‌شده.
- Pagination.
- Virtualization.
- Incremental Loading.

بررسی شوند.

Sampling نباید باعث گمراهی علمی شود. روش نمونه‌برداری باید در صورت تأثیر بر تفسیر نتایج مشخص باشد.

---

# 15. CHART PERFORMANCE

## 15.1. Rendering Strategy

کتابخانه نمودار باید بر اساس نیاز واقعی انتخاب شود.

معیارها:

- حجم Bundle.
- تعداد نقاط داده.
- عملکرد در موبایل.
- پشتیبانی RTL.
- دسترس‌پذیری.
- قابلیت Export.
- مصرف حافظه.
- قابلیت تعامل.

## 15.2. Large Series

در نمودارهای دارای نقاط بسیار زیاد:

- Data Decimation.
- Aggregation.
- Viewport-Based Rendering.
- WebGL در صورت نیاز.
- Canvas در صورت مناسب بودن.

بررسی شوند.

## 15.3. Avoid Excessive Updates

به‌روزرسانی کل نمودار برای تغییر کوچک داده باید تا حد امکان جلوگیری شود.

## 15.4. Scientific Integrity

بهینه‌سازی نمودار نباید باعث تغییر بی‌اطلاع مقادیر، مقیاس یا تفسیر داده شود.

---

# 16. MAP PERFORMANCE

نقشه‌ها می‌توانند مصرف CPU، GPU و حافظه بالایی داشته باشند.

## 16.1. Initial Map Loading

- نقشه در زمان نیاز بارگذاری شود.
- لایه‌های غیرضروری به تعویق بیفتند.
- محدوده اولیه مناسب انتخاب شود.
- تعداد Markerها کنترل شود.

## 16.2. Vector and Raster Data

استفاده از Tile، Vector Data و Raster Data باید متناسب با حجم و وضوح مورد نیاز انجام شود.

## 16.3. Clustering

در نمایش تعداد زیاد Marker، Clustering بررسی شود.

## 16.4. Viewport Loading

داده‌های خارج از محدوده دید کاربر نباید بدون ضرورت دریافت یا پردازش شوند.

## 16.5. WebGL

در صورت استفاده از WebGL:

- قابلیت سخت‌افزار بررسی شود.
- مصرف حافظه GPU کنترل شود.
- خطاهای Context مدیریت شوند.
- جایگزین مناسب برای دستگاه‌های ناسازگار فراهم شود.

---

# 17. SCIENTIFIC SIMULATION PERFORMANCE

شبیه‌سازی‌های HyDroMA ممکن است محاسبات سنگین داشته باشند.

## 17.1. Compute Separation

محاسبات سنگین نباید بدون ارزیابی روی Main Thread اجرا شوند.

گزینه‌های قابل بررسی:

- Backend Execution.
- Web Workers.
- WebAssembly.
- GPU Computing.
- WebGL.
- WebGPU.

انتخاب فناوری باید بر اساس نوع مدل، اندازه داده، دقت علمی، سخت‌افزار هدف و محدودیت مرورگر انجام شود.

## 17.2. Web Workers

برای محاسبات مستقل و مناسب، Web Worker قابل بررسی است.

## 17.3. Simulation Progress

رابط باید وضعیت اجرای مدل را نشان دهد:

- Queued.
- Running.
- Processing.
- Completed.
- Failed.
- Cancelled.

## 17.4. Long-Running Tasks

در پردازش‌های طولانی:

- امکان لغو در صورت پشتیبانی وجود داشته باشد.
- وضعیت اجرای کار حفظ شود.
- ارتباط با Backend از دست نرود.
- نتیجه نهایی از منبع معتبر دریافت شود.

## 17.5. Numerical Accuracy

بهینه‌سازی محاسبات نباید دقت علمی را بدون اعلام تغییر دهد.

هرگونه کاهش دقت، Sampling یا Approximation باید مستند باشد.

---

# 18. THREE-DIMENSIONAL AND GPU PERFORMANCE

در صورت استفاده از محیط‌های سه‌بعدی:

## 18.1. Resource Management

- تعداد Polygonها کنترل شود.
- Textureها بهینه شوند.
- مدل‌ها به‌صورت مرحله‌ای بارگذاری شوند.
- منابع GPU آزاد شوند.
- تعداد اشیای هم‌زمان محدود شود.

## 18.2. Level of Detail

LOD باید برای مدل‌های پیچیده بررسی شود.

## 18.3. Device Capability

در دستگاه‌های ضعیف:

- کیفیت نمایش کاهش یابد.
- تعداد لایه‌ها محدود شود.
- مدل سه‌بعدی با نسخه دوبعدی یا ساده‌تر جایگزین شود.

## 18.4. GPU Fallback

اگر WebGL یا WebGPU در دسترس نباشد، مسیر جایگزین مناسب باید ارائه شود.

---

# 19. MARKETPLACE PERFORMANCE

## 19.1. Product Listing

- دریافت صفحه‌ای محصولات.
- بارگذاری تدریجی تصاویر.
- Cache محتوای عمومی.
- جلوگیری از درخواست تکراری.
- حفظ وضعیت فیلترها در صورت نیاز.

## 19.2. Search

جست‌وجو باید:

- Debounce مناسب داشته باشد.
- درخواست‌های قدیمی را لغو کند.
- نتیجه خالی را مدیریت کند.
- از ارسال درخواست برای هر تغییر کاراکتر بدون کنترل جلوگیری کند.

## 19.3. Product Details

محتوای اصلی محصول باید زودتر از محتوای ثانویه نمایش داده شود.

## 19.4. Checkout

در جریان خرید، سرعت نباید به قیمت کاهش امنیت یا صحت تراکنش تمام شود.

---

# 20. FINANCIAL PERFORMANCE AND RELIABILITY

صفحات مالی باید علاوه بر سرعت، پایداری و صحت داده را حفظ کنند.

الزامات:

- جلوگیری از درخواست‌های تکراری.
- نمایش وضعیت واقعی عملیات.
- عدم استفاده از داده قدیمی به‌عنوان موجودی قطعی.
- مدیریت Timeout.
- مدیریت Retry با Idempotency.
- جلوگیری از ارسال چندباره فرم پرداخت.
- نمایش زمان آخرین به‌روزرسانی داده.

عملکرد بالا نباید موجب نمایش نتیجه مالی تأییدنشده شود.

---

# 21. LOW-BANDWIDTH OPTIMIZATION

این بخش برای کاربران روستایی و عشایری اهمیت ویژه دارد.

## 21.1. Network-Aware Experience

در صورت امکان، رفتار صفحه باید با وضعیت شبکه سازگار شود.

## 21.2. Low-Bandwidth Mode

قابلیت پیشنهادی:

- کاهش کیفیت تصاویر.
- حذف Animationهای غیرضروری.
- تأخیر در بارگذاری نقشه.
- کاهش Refreshهای خودکار.
- بارگذاری محدود نمودارها.
- ارائه نسخه سبک صفحات.

## 21.3. Save Data

در صورت امکان، ترجیح کاربر برای کاهش مصرف داده باید در نظر گرفته شود.

## 21.4. Offline Support

در صورت طراحی قابلیت Offline:

- داده‌های ضروری مشخص شوند.
- Cache محدود و کنترل‌شده باشد.
- وضعیت همگام‌سازی نمایش داده شود.
- داده قدیمی مشخص باشد.
- تعارض داده‌ها مدیریت شود.

وجود Cache به‌تنهایی به معنی پشتیبانی کامل Offline نیست.

---

# 22. MOBILE PERFORMANCE

## 22.1. Mobile First Performance

صفحات باید با محدودیت‌های زیر آزموده شوند:

- پردازنده ضعیف.
- حافظه محدود.
- اینترنت ناپایدار.
- نمایشگر کوچک.
- مصرف باتری.
- محدودیت فضای ذخیره‌سازی.

## 22.2. Mobile Rendering

- DOM غیرضروری محدود شود.
- Animationهای سنگین کاهش یابند.
- نقشه‌های سنگین به تعویق بیفتند.
- نمودارها متناسب با اندازه نمایشگر ساده شوند.
- فرم‌ها سبک و سریع باشند.

## 22.3. Touch Interaction

تعاملات لمسی باید بدون تأخیر محسوس و با اندازه مناسب اجرا شوند.

---

# 23. ACCESSIBILITY AND PERFORMANCE

عملکرد و دسترس‌پذیری باید هم‌زمان رعایت شوند.

موارد ضروری:

- بارگذاری فونت نباید خوانایی را مختل کند.
- Lazy Loading نباید باعث گم شدن Focus شود.
- Skeleton نباید محتوای ضروری را از فناوری کمکی پنهان کند.
- تغییرات Layout نباید باعث جابه‌جایی Focus شوند.
- نمودارهای سبک‌شده باید جایگزین داده قابل دسترس داشته باشند.
- Reduced Motion باید رعایت شود.

هیچ بهینه‌سازی نباید دسترس‌پذیری را بدون بررسی تضعیف کند.

---

# 24. MEMORY MANAGEMENT

## 24.1. Memory Leak Prevention

موارد زیر باید کنترل شوند:

- Event Listenerهای پاک‌سازی‌نشده.
- Timerهای فعال پس از خروج از صفحه.
- Subscriptionهای بدون Unsubscribe.
- Referenceهای غیرضروری.
- داده‌های حجیم در State.
- Textureهای آزادنشده.
- Workerهای بلااستفاده.

## 24.2. Resource Cleanup

هنگام Unmount یا تغییر مسیر:

- درخواست‌های غیرضروری لغو شوند.
- Event Listenerها حذف شوند.
- Timerها متوقف شوند.
- Workerها خاتمه یابند.
- منابع GPU آزاد شوند.

## 24.3. Long Session Testing

داشبوردهای علمی باید در نشست‌های طولانی نیز از نظر رشد غیرعادی حافظه آزموده شوند.

---

# 25. CACHING STRATEGY

## 25.1. Cache Categories

| Data | Suggested Strategy |
|---|---|
| Static Assets | Long-lived Cache with versioning |
| Public Content | Revalidation-based |
| Product Listings | Controlled Cache |
| User Profile | Private Cache |
| Financial Data | Strict freshness controls |
| Scientific Data | Source-dependent freshness |
| Authentication | No public shared cache |

## 25.2. Cache Invalidation

سیاست حذف یا به‌روزرسانی Cache باید مشخص باشد.

## 25.3. Cache Versioning

برای دارایی‌های ثابت از نام‌گذاری نسخه‌دار یا Content Hash استفاده شود.

## 25.4. User Isolation

Cache نباید باعث نمایش داده یک کاربر به کاربر دیگر شود.

---

# 26. PERFORMANCE MONITORING

عملکرد باید در دو سطح پایش شود:

1. Laboratory Performance.
2. Real User Monitoring.

## 26.1. Laboratory Testing

آزمون کنترل‌شده با محیط مشخص.

موارد:

- Lighthouse.
- Chrome DevTools.
- WebPageTest.
- Playwright.
- Bundle Analyzer.

## 26.2. Real User Monitoring

اندازه‌گیری تجربه واقعی کاربران در محیط Production، در صورت تصویب و پیاده‌سازی زیرساخت مناسب.

شاخص‌ها:

- LCP.
- INP.
- CLS.
- Navigation Timing.
- Resource Timing.
- JavaScript Errors.
- API Latency.
- Device Class.
- Network Category.

## 26.3. Privacy Requirements

RUM باید با سیاست حریم خصوصی سازگار باشد.

داده‌های شخصی، مالی و علمی حساس نباید بدون ضرورت وارد ابزارهای پایش شوند.

---

# 27. PERFORMANCE OBSERVABILITY

پایش عملکرد باید به تحلیل علت مشکلات کمک کند.

## 27.1. Frontend Metrics

- Page Load Time.
- Route Transition Time.
- API Request Duration.
- Long Task Count.
- JavaScript Error Rate.
- Bundle Size.
- Memory Usage.
- Image Load Time.
- Chart Render Time.
- Map Initialization Time.

## 27.2. Correlation

در صورت پشتیبانی زیرساخت:

- Trace ID.
- Request ID.
- Page Route.
- Release Version.
- Build Identifier.

برای ارتباط خطاهای Frontend با درخواست‌های Backend استفاده شوند.

هیچ شناسه‌ای نباید حاوی اطلاعات حساس باشد.

## 27.3. Performance Dashboards

داشبورد پایش باید بتواند عملکرد را بر اساس موارد زیر تفکیک کند:

- برند.
- صفحه.
- دستگاه.
- مرورگر.
- نسخه انتشار.
- نوع شبکه.
- منطقه جغرافیایی در سطح مجاز و غیرشخصی.

---

# 28. PERFORMANCE REGRESSION CONTROL

عملکرد باید در طول توسعه حفظ شود.

## 28.1. Regression Examples

- افزایش ناگهانی حجم Bundle.
- افزایش LCP.
- افزایش INP.
- افزایش CLS.
- افزایش تعداد درخواست‌ها.
- افزایش Memory Usage.
- افزایش زمان رندر نقشه.
- افزایش زمان رندر نمودار.

## 28.2. CI Performance Checks

موارد قابل بررسی در CI:

- Build Size.
- Chunk Size.
- Dependency Changes.
- Lighthouse CI.
- Route Performance.
- Asset Budget.

## 28.3. Regression Policy

هر افت عملکرد باید:

- ثبت شود.
- با Baseline مقایسه شود.
- علت‌یابی شود.
- شدت آن مشخص شود.
- تصمیم اصلاح یا پذیرش آن ثبت شود.

---

# 29. TESTING MATRIX

آزمون عملکرد باید با ترکیب‌های متنوع انجام شود.

| Dimension | Test Cases |
|---|---|
| Device | Low / Mid / High |
| Network | Fast / Moderate / Slow |
| Browser | Supported Browsers |
| Viewport | Mobile / Tablet / Desktop |
| Data Size | Small / Medium / Large |
| Session | Short / Long |
| User State | Anonymous / Authenticated |
| Feature | Public / Scientific / Marketplace / Financial |

## 29.1. Critical Workflows

حداقل جریان‌های زیر باید آزموده شوند:

1. ورود کاربر.
2. باز کردن داشبورد علمی.
3. مشاهده شاخص آب.
4. مشاهده شاخص خاک.
5. باز کردن نقشه.
6. اجرای شبیه‌سازی.
7. مشاهده گزارش.
8. جست‌وجوی محصول.
9. مشاهده صفحه محصول.
10. ثبت سفارش.
11. مشاهده وضعیت پرداخت.
12. باز کردن پنل مدیریتی.

---

# 30. PERFORMANCE ACCEPTANCE CRITERIA

معیارهای پذیرش نهایی باید بر اساس Baseline واقعی تعیین شوند.

پیشنهاد اولیه:

| Metric | Proposed Target |
|---|---|
| LCP | ≤ 2.5s at p75 |
| INP | ≤ 200ms at p75 |
| CLS | ≤ 0.1 at p75 |
| Initial JS Transfer | ≤ 250 KB |
| Initial CSS Transfer | ≤ 100 KB |
| Initial Page Transfer | ≤ 1 MB |
| Critical API Requests | Measured and Budgeted |
| Long Tasks | Investigated |
| Memory Growth | No Uncontrolled Growth |
| Performance Regression | Tracked and Reviewed |

این اهداف برای تمام صفحات به‌صورت یکسان قابل اعمال نیستند. صفحات دارای نقشه، مدل سه‌بعدی و شبیه‌سازی باید بودجه مستقل داشته باشند.

---

# 31. PERFORMANCE DEFECT MANAGEMENT

## 31.1. Severity

| Level | Definition |
|---|---|
| Critical | مانع استفاده از عملکرد حیاتی |
| High | افت شدید تجربه کاربر |
| Medium | افت قابل توجه در برخی شرایط |
| Low | اثر محدود و قابل کنترل |

## 31.2. Required Defect Fields

- Performance Issue ID
- Page or Feature
- Metric
- Baseline
- Actual Result
- Device
- Network
- Reproduction Steps
- Root Cause
- Proposed Fix
- Retest Result
- Evidence

---

# 32. IMPLEMENTATION WORKFLOW

## Phase 1 — Baseline

- اندازه‌گیری صفحات موجود.
- تحلیل Bundle.
- ثبت Core Web Vitals.
- بررسی API Latency.
- ثبت مصرف منابع.

## Phase 2 — Architecture Review

- بررسی Rendering Strategy.
- بررسی Dependencyها.
- بررسی State Management.
- بررسی Data Loading.
- بررسی Cache.

## Phase 3 — Optimization

- Code Splitting.
- Lazy Loading.
- Image Optimization.
- Font Optimization.
- Request Optimization.
- Rendering Optimization.

## Phase 4 — Specialized Features

- Chart Optimization.
- Map Optimization.
- Simulation Optimization.
- Three-Dimensional Rendering.

## Phase 5 — Validation

- آزمون Laboratory.
- آزمون شبکه ضعیف.
- آزمون دستگاه ضعیف.
- آزمون نشست طولانی.
- آزمون Regression.

## Phase 6 — Release Review

- بررسی Budget.
- بررسی Core Web Vitals.
- بررسی نقص‌های باز.
- ثبت شواهد.
- تأیید مسئول مجاز.

---

# 33. GOVERNANCE AND OWNERSHIP

| Role | Responsibility |
|---|---|
| Project Owner | تصویب اهداف عملکرد |
| Frontend Architect | معماری عملکرد |
| Frontend Engineer | پیاده‌سازی بهینه‌سازی |
| Backend Engineer | بهینه‌سازی API |
| DevOps Engineer | CDN، Compression و زیرساخت |
| QA Engineer | آزمون عملکرد |
| Performance Reviewer | بررسی نتایج و Regression |

## 33.1. Agent Restrictions

ایجنت‌های توسعه مجاز نیستند:

- شاخص‌های آزمون‌نشده را موفق اعلام کنند.
- داده نمونه را به‌عنوان RUM واقعی معرفی کنند.
- برای کاهش حجم، دقت علمی را بی‌اطلاع تغییر دهند.
- Cache داده حساس را بدون بررسی فعال کنند.
- کتابخانه سنگین جدید بدون تحلیل اضافه کنند.
- عملکرد صفحات را با یک امتیاز Lighthouse خلاصه کنند.
- بهینه‌سازی را بدون آزمون Regression تأیید کنند.

---

# 34. OPEN DECISIONS

| ID | Decision | Status |
|---|---|---|
| PERF-D01 | Performance Budget نهایی | OPEN |
| PERF-D02 | ابزار RUM | OPEN |
| PERF-D03 | ابزار Lighthouse CI | OPEN |
| PERF-D04 | سیاست CDN | OPEN |
| PERF-D05 | سیاست Cache | OPEN |
| PERF-D06 | معیار دستگاه‌های ضعیف | OPEN |
| PERF-D07 | ابزار تحلیل Bundle | OPEN |
| PERF-D08 | سیاست Performance Regression | OPEN |
| PERF-D09 | روش پایش نقشه‌ها | OPEN |
| PERF-D10 | روش پایش شبیه‌سازی | OPEN |
| PERF-D11 | سیاست جمع‌آوری داده عملکرد | OPEN |
| PERF-D12 | اهداف عملکرد صفحات تخصصی | OPEN |

---

# 35. IMPORTANT DISTINCTIONS

موارد زیر باید از هم تفکیک شوند:

| Concept | Meaning |
|---|---|
| Laboratory Performance | عملکرد در آزمون کنترل‌شده |
| Real User Performance | عملکرد واقعی کاربران |
| Bundle Optimization | کاهش حجم کد |
| Runtime Optimization | بهبود اجرای برنامه |
| Network Optimization | بهبود انتقال داده |
| Rendering Optimization | بهبود نمایش محتوا |
| Memory Optimization | کنترل مصرف حافظه |
| Performance Validation | تأیید با شواهد آزمون |

کاهش حجم Bundle لزوماً به معنی بهبود تجربه واقعی کاربر نیست.

---

# 36. FINAL ACCEPTANCE CRITERIA

این سند زمانی آماده تبدیل شدن به استاندارد اجرایی خواهد بود که:

1. Baseline واقعی ثبت شده باشد.
2. Performance Budget تصویب شده باشد.
3. ابزارهای اندازه‌گیری انتخاب شده باشند.
4. معیارهای صفحات مختلف تفکیک شده باشند.
5. صفحات عمومی آزموده شده باشند.
6. داشبوردهای علمی آزموده شده باشند.
7. نقشه‌ها و شبیه‌سازی‌ها آزموده شده باشند.
8. جریان‌های Marketplace و مالی آزموده شده باشند.
9. شرایط اینترنت ضعیف بررسی شده باشد.
10. Regression Tests تعریف شده باشند.
11. شواهد عملکرد ثبت شده باشند.
12. تصمیمات باز تعیین تکلیف شده باشند.

---

# 37. DOCUMENT STATUS

**Current Status:** DRAFT — PROPOSED — NOT APPROVED

**Approval:** NOT GRANTED

**Implementation Authorization:** NOT GRANTED BY THIS DOCUMENT

**Performance Baseline:** NOT ESTABLISHED

**Performance Validation:** NOT ESTABLISHED

**Owner Decision:** REQUIRED

این سند چارچوب پیشنهادی عملکرد و پایش Frontend برای Eco Nojin، HyDroMA و Nojin Marketplace است.

هیچ شاخص عملکردی، هدف عددی یا قابلیت بهینه‌سازی صرفاً با درج در این سند تأییدشده تلقی نمی‌شود.

تمام اهداف باید با اندازه‌گیری واقعی، آزمون در شرایط متنوع و بررسی شواهد فنی اعتبارسنجی شوند.

---

**END OF DOCUMENT 23**