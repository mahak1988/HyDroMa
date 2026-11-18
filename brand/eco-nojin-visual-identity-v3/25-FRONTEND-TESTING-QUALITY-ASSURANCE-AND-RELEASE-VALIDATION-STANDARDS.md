# 25. Frontend Testing, Quality Assurance and Release Validation Standards

## Eco Nojin Ecosystem
### Frontend Testing Strategy, Quality Engineering, Verification and Release Governance

| مشخصه | مقدار |
|---|---|
| Document ID | EN-VIS-025 |
| Document Name | Frontend Testing, Quality Assurance and Release Validation Standards |
| Version | 1.0.0 |
| Status | DRAFT — PROPOSED — NOT APPROVED |
| Classification | Internal Technical Standard |
| Scope | Eco Nojin, HyDroMA, Nojin Marketplace |
| Document Owner | Eco Nojin |
| Approval Authority | Project Owner |
| Created | 2026-11-17 |

---

# 1. Purpose

این سند چارچوب جامع آزمون و تضمین کیفیت فرانت‌اند اکوسیستم Eco Nojin را تعریف می‌کند.

هدف، ایجاد فرایندی قابل اندازه‌گیری، تکرارپذیر و مبتنی بر شواهد برای اطمینان از صحت عملکرد، پایداری، امنیت، دسترس‌پذیری و کیفیت تجربه کاربری است.

سه محصول زیر در دامنه این استاندارد قرار دارند:

1. **Eco Nojin:** پلتفرم اصلی و تجربه عمومی اکوسیستم.
2. **HyDroMA:** موتور علمی، محاسباتی، پایش و شبیه‌سازی.
3. **Nojin Marketplace:** بازارگاه محصولات، خدمات و فعالیت‌های اقتصادی.

این استاندارد صرفاً درباره اجرای چند تست نرم‌افزاری نیست. کیفیت فرانت‌اند باید در تمام مراحل طراحی، توسعه، یکپارچه‌سازی، آزمون، اعتبارسنجی و انتشار کنترل شود.

## 1.1. اهداف اصلی

- تعریف استراتژی آزمون چندلایه.
- جلوگیری از انتشار قابلیت‌های ناقص یا غیرقابل اعتماد.
- شناسایی خطاهای عملکردی پیش از انتشار.
- اعتبارسنجی ارتباط Frontend و Backend.
- بررسی صحت نمایش داده‌های علمی و مالی.
- کنترل تجربه کاربری در دستگاه‌ها و مرورگرهای مختلف.
- ارزیابی دسترس‌پذیری.
- بررسی امنیت در سطح رابط و تعاملات.
- جلوگیری از بازگشت خطاهای اصلاح‌شده.
- ایجاد شواهد قابل ممیزی برای پذیرش نسخه‌ها.
- تفکیک پیاده‌سازی از آزمون، اعتبارسنجی و تأیید نهایی.

## 1.2. اصل بنیادین کیفیت

وجود یک صفحه، کامپوننت، Route یا فایل کد به‌معنای تکمیل قابلیت نیست.

همچنین:

- Build موفق به‌معنای صحت عملکرد نیست.
- تست واحد موفق به‌معنای صحت یکپارچگی نیست.
- اجرای موفق E2E به‌معنای اعتبار علمی داده نیست.
- نمایش صحیح رابط به‌معنای امنیت آن نیست.
- نبود خطای ظاهری به‌معنای نبود خطای منطقی نیست.
- گزارش سبز یک ابزار خودکار به‌تنهایی مجوز انتشار نیست.

هر قابلیت باید براساس معیارهای پذیرش مشخص و شواهد قابل بررسی ارزیابی شود.

---

# 2. Quality Engineering Principles

## 2.1. Quality by Design

کیفیت باید از مرحله طراحی در نظر گرفته شود، نه اینکه صرفاً در پایان توسعه بررسی شود.

هر قابلیت باید پیش از پیاده‌سازی دارای موارد زیر باشد:

- تعریف نیازمندی.
- مشخصات رفتاری.
- ورودی‌ها و خروجی‌ها.
- وضعیت‌های قابل انتظار.
- خطاهای احتمالی.
- الزامات امنیتی.
- الزامات دسترس‌پذیری.
- معیارهای پذیرش.
- برنامه آزمون.

## 2.2. Risk-Based Testing

همه قابلیت‌ها از نظر ریسک یکسان نیستند.

اولویت آزمون باید براساس سه عامل تعیین شود:

1. احتمال وقوع خطا.
2. شدت پیامد خطا.
3. میزان مواجهه کاربران و سامانه با آن قابلیت.

برای مثال، آزمون محاسبات مالی، احراز هویت و خروجی مدل علمی باید از اولویت بالاتری نسبت به یک انیمیشن تزئینی برخوردار باشد.

## 2.3. Test Independence

آزمون نباید صرفاً براساس همان فرضیات و منطق پیاده‌سازی انجام شود.

در قابلیت‌های حساس، انتظار می‌رود موارد زیر مستقل بررسی شوند:

- فرمول‌ها.
- محاسبات.
- تبدیل واحدها.
- مجوزهای دسترسی.
- وضعیت تراکنش‌ها.
- نتایج شبیه‌سازی.
- داده‌های خروجی API.

## 2.4. Reproducibility

نتایج آزمون باید قابل بازتولید باشند.

هر آزمون مهم باید تا حد امکان شامل موارد زیر باشد:

- نسخه کد.
- محیط اجرا.
- داده ورودی.
- تنظیمات.
- زمان اجرا.
- نتیجه.
- شواهد.
- شناسه آزمون.

---

# 3. Quality Dimensions

کیفیت فرانت‌اند باید در ابعاد زیر ارزیابی شود:

| حوزه | موضوع ارزیابی |
|---|---|
| Functional Quality | صحت رفتار و عملکرد |
| Visual Quality | صحت نمایش و هویت بصری |
| Usability | سهولت استفاده |
| Accessibility | دسترس‌پذیری |
| Performance | سرعت و مصرف منابع |
| Security | امنیت رابط و تعاملات |
| Reliability | پایداری و تحمل خطا |
| Compatibility | سازگاری مرورگر و دستگاه |
| Data Integrity | صحت انتقال و نمایش داده |
| Maintainability | قابلیت نگهداری کد |
| Localization | صحت چندزبانه و RTL/LTR |
| Observability | قابلیت پایش و عیب‌یابی |

هیچ‌یک از این ابعاد نباید صرفاً با یک معیار منفرد تأیید شود.

---

# 4. Testing Pyramid

استراتژی آزمون پیشنهادی بر پایه هرم آزمون طراحی می‌شود.

## 4.1. Unit Tests

آزمون کوچک‌ترین واحدهای مستقل:

- توابع.
- Hooks.
- Utilityها.
- Formatters.
- Validators.
- State Reducers.
- محاسبات رابط.
- تبدیل واحدها.
- منطق نمایش وضعیت‌ها.

این آزمون‌ها باید سریع، مستقل و قابل تکرار باشند.

## 4.2. Component Tests

آزمون رفتار کامپوننت‌ها:

- Rendering.
- Props.
- State.
- User Interaction.
- Validation.
- Error Handling.
- Loading States.
- Accessibility Attributes.

## 4.3. Integration Tests

آزمون تعامل میان اجزای مختلف:

- Component و API Client.
- Form و Validation.
- Authentication و Protected Routes.
- Dashboard و Data Services.
- State Management و Server State.
- Navigation و Permission.
- Chart و Data Transformation.

## 4.4. End-to-End Tests

آزمون مسیرهای واقعی کاربر در محیط نزدیک به Production.

نمونه:

1. ورود کاربر.
2. مشاهده داشبورد.
3. انتخاب یک پروژه.
4. مشاهده داده‌ها.
5. اجرای عملیات مجاز.
6. دریافت نتیجه.
7. خروج امن.

## 4.5. Manual Exploratory Testing

آزمون اکتشافی انسانی برای کشف مشکلاتی که به‌سادگی در آزمون خودکار پوشش داده نمی‌شوند.

موارد:

- رفتارهای غیرمنتظره.
- ابهام در تعاملات.
- تجربه کاربران تازه‌وارد.
- خطاهای ترکیبی.
- مشکلات نمایش.
- خطاهای چندزبانه.
- مشکلات دستگاه‌های واقعی.

## 4.6. Test Distribution

هرم آزمون یک راهنمای معماری است، نه سهمیه عددی اجباری.

توزیع آزمون باید متناسب با پیچیدگی، ریسک و ماهیت محصول تعیین شود.

---

# 5. Test Planning and Test Cases

## 5.1. Test Case Structure

هر Test Case باید حداقل شامل موارد زیر باشد:

| Field | Description |
|---|---|
| Test ID | شناسه یکتا |
| Feature | قابلیت مورد آزمون |
| Objective | هدف آزمون |
| Preconditions | پیش‌شرط‌ها |
| Test Data | داده آزمایشی |
| Steps | مراحل اجرا |
| Expected Result | نتیجه مورد انتظار |
| Actual Result | نتیجه واقعی |
| Status | وضعیت |
| Evidence | شواهد |
| Environment | محیط اجرا |
| Version | نسخه نرم‌افزار |

## 5.2. Test Case Status

وضعیت‌های استاندارد:

- NOT_RUN
- PASS
- FAIL
- BLOCKED
- SKIPPED
- NEEDS_REVIEW
- NOT_APPLICABLE

تغییر وضعیت به PASS باید مبتنی بر نتیجه واقعی آزمون باشد.

## 5.3. Test Data

داده‌های آزمون باید:

- کنترل‌شده باشند.
- قابل بازتولید باشند.
- با داده واقعی کاربران اشتباه نشوند.
- در صورت امکان مصنوعی باشند.
- دارای محدوده و ساختار مشخص باشند.
- برای آزمون‌های حساس از داده‌های ناشناس‌سازی‌شده استفاده کنند.

داده محرمانه Production نباید بدون مجوز و کنترل مناسب وارد محیط آزمون شود.

---

# 6. Functional Testing Standards

## 6.1. Page-Level Testing

هر صفحه باید از نظر موارد زیر آزمون شود:

- بارگذاری صحیح.
- عنوان و ساختار صفحه.
- نمایش محتوای مورد انتظار.
- صحت Navigation.
- رفتار دکمه‌ها.
- وضعیت Loading.
- وضعیت Empty.
- وضعیت Error.
- وضعیت Success.
- رفتار Responsive.
- دسترسی مناسب.
- مدیریت خطاهای API.

## 6.2. Route Testing

تمام Routeهای تعریف‌شده باید بررسی شوند.

موارد آزمون:

- Route عمومی.
- Route محافظت‌شده.
- Route نامعتبر.
- Route با پارامتر.
- Route با Query Parameter.
- Route با دسترسی محدود.
- Redirect.
- Refresh مستقیم صفحه.

## 6.3. Navigation Testing

موارد زیر باید آزمون شوند:

- منوی اصلی.
- منوی کاربری.
- Breadcrumb.
- Tab Navigation.
- Sidebar.
- Mobile Navigation.
- لینک‌های داخلی.
- لینک‌های خارجی.
- Back و Forward مرورگر.

## 6.4. Form Testing

هر فرم باید از نظر موارد زیر بررسی شود:

- فیلدهای الزامی.
- اعتبارسنجی ورودی.
- پیام خطا.
- پیام موفقیت.
- محدودیت طول.
- نوع داده.
- وضعیت ارسال.
- جلوگیری از ارسال تکراری.
- رفتار شبکه ضعیف.
- حفظ داده در صورت خطای قابل بازیابی.
- مدیریت Submit ناموفق.

## 6.5. State Testing

تمام وضعیت‌های مهم UI باید آزمون شوند:

- Initial.
- Loading.
- Success.
- Empty.
- Error.
- Partial Data.
- Offline.
- Unauthorized.
- Forbidden.
- Expired Session.
- Processing.
- Cancelled.

وجود یک وضعیت در کد بدون آزمون رفتاری کافی نیست.

---

# 7. API Integration Testing

## 7.1. API Contract

Frontend باید مطابق قرارداد API پیاده‌سازی و آزمون شود.

موارد ضروری:

- HTTP Method.
- Endpoint.
- Request Schema.
- Response Schema.
- Status Codes.
- Error Contract.
- Authentication.
- Authorization.
- Pagination.
- Filtering.
- Sorting.
- Timeout.
- Retry Policy.

## 7.2. Contract Testing

در صورت امکان، آزمون قرارداد باید از ناسازگاری Frontend و Backend جلوگیری کند.

تغییرات API باید از نظر تأثیر بر صفحات و کامپوننت‌های وابسته بررسی شوند.

## 7.3. Error Scenario Testing

سناریوهای زیر باید آزمون شوند:

- 400 Bad Request.
- 401 Unauthorized.
- 403 Forbidden.
- 404 Not Found.
- 409 Conflict.
- 422 Validation Error.
- 429 Too Many Requests.
- 500 Internal Server Error.
- 502 Bad Gateway.
- 503 Service Unavailable.
- Network Timeout.
- Connection Failure.

رفتار رابط باید متناسب با نوع خطا باشد.

## 7.4. Mocking Policy

Mock API برای آزمون رابط و رفتارهای مستقل مفید است.

اما:

- Mock جایگزین آزمون Integration نیست.
- Mock نباید به‌عنوان اثبات اتصال واقعی معرفی شود.
- داده Mock باید از داده واقعی قابل تشخیص باشد.
- آزمون نهایی باید با سرویس واقعی یا محیط Integration انجام شود.

---

# 8. Authentication and Authorization Testing

آزمون‌های امنیتی و عملکردی احراز هویت باید شامل موارد زیر باشند:

1. ورود موفق.
2. ورود ناموفق.
3. خروج.
4. انقضای نشست.
5. تمدید نشست.
6. بازیابی حساب.
7. ورود مجدد.
8. دسترسی به Route محافظت‌شده.
9. دسترسی غیرمجاز.
10. تغییر نقش.
11. تغییر وضعیت حساب.
12. تلاش برای دسترسی به داده کاربر دیگر.

## 8.1. Security Boundary

آزمون Frontend نباید تنها به مخفی بودن دکمه یا Route اکتفا کند.

در آزمون Integration و Security باید بررسی شود که Backend درخواست غیرمجاز را نیز رد می‌کند.

## 8.2. Session Regression

هر تغییر در Authentication باید آزمون Regression برای موارد زیر داشته باشد:

- Protected Routes.
- Refresh.
- Logout.
- Session Expiration.
- Multiple Tabs.
- Unauthorized API Responses.

---

# 9. Scientific and Numerical Validation Testing

این بخش برای HyDroMA اهمیت ویژه دارد.

## 9.1. Separation of Responsibilities

باید میان سه نوع آزمون تفاوت قائل شد:

| نوع آزمون | مسئولیت |
|---|---|
| Frontend Display Testing | صحت نمایش داده |
| Integration Testing | صحت انتقال و دریافت داده |
| Scientific Validation | اعتبار علمی مدل و نتایج |

قبولی در آزمون نمایش داده، اعتبار علمی مدل را اثبات نمی‌کند.

## 9.2. Unit Conversion Testing

تبدیل واحدها باید با آزمون‌های مستقل بررسی شود.

نمونه واحدهای مورد بررسی:

- m³
- L
- mm
- ha
- km²
- °C
- K
- kg
- t
- kg/ha
- mm/day
- m³/day

موارد آزمون:

- صحت تبدیل.
- دقت عددی.
- جلوگیری از تبدیل اشتباه.
- مدیریت مقدار Null.
- مدیریت مقدار نامعتبر.
- نمایش واحد صحیح.
- حفظ دقت در تبدیل رفت‌وبرگشتی، در حدود تلرانس تعریف‌شده.

## 9.3. Numerical Precision

اعداد علمی نباید بدون سیاست مشخص گرد شوند.

برای هر خروجی باید مشخص باشد:

- دقت محاسباتی.
- دقت نمایشی.
- واحد.
- روش گرد کردن.
- تلرانس قابل قبول.

## 9.4. Scientific Formula Testing

اگر فرمولی در Frontend برای نمایش یا محاسبه استفاده می‌شود:

- فرمول باید مستند باشد.
- ورودی و خروجی مشخص باشد.
- مقادیر مرزی آزمون شوند.
- نتایج با مرجع مستقل مقایسه شوند.
- خطاهای عددی بررسی شوند.

محاسبات علمی مرجع باید در لایه علمی معتبر و تحت کنترل Backend یا Engine انجام شوند؛ مگر آنکه معماری مصوب خلاف آن را مشخص کند.

## 9.5. Missing and Uncertain Data

موارد زیر باید آزمون شوند:

- داده مفقود.
- داده ناقص.
- داده با کیفیت پایین.
- داده تخمینی.
- داده دارای عدم قطعیت.
- داده خارج از محدوده.
- داده قدیمی.
- داده با منبع نامشخص.

Frontend نباید مقدار مفقود را به‌صورت صفر یا مقدار قطعی نمایش دهد، مگر اینکه قرارداد علمی داده چنین معنایی را صریحاً تعریف کرده باشد.

## 9.6. Scientific Provenance Testing

در صورت نمایش منشأ داده باید موارد زیر بررسی شوند:

- منبع داده.
- زمان دریافت.
- نسخه مدل.
- نسخه الگوریتم.
- واحد.
- محدوده مکانی.
- دوره زمانی.
- وضعیت اعتبارسنجی.
- وضعیت عدم قطعیت.

---

# 10. Data Visualization Testing

نمودارها، نقشه‌ها و داشبوردها باید از نظر صحت داده و نمایش آزمون شوند.

## 10.1. Chart Testing

موارد:

- تطابق داده نمودار با API.
- ترتیب زمانی.
- برچسب محورها.
- واحدها.
- Legend.
- Tooltip.
- فیلترها.
- Zoom.
- Empty State.
- Error State.
- داده‌های منفی.
- مقادیر Null.
- داده‌های پرت.
- تغییر اندازه صفحه.

## 10.2. Map Testing

موارد:

- نمایش محدوده مکانی صحیح.
- صحت مختصات.
- Projection.
- Zoom.
- Pan.
- Layer Visibility.
- Legend.
- Feature Selection.
- Filtering.
- داده‌های خارج از محدوده.
- مدیریت خطای Tile Provider.
- مدیریت شبکه ضعیف.

## 10.3. Data Integrity

تغییرات ظاهری نمودار نباید باعث تغییر معنای داده شوند.

برای نمونه:

- محور عمودی نباید به‌شکل گمراه‌کننده تنظیم شود.
- واحد نباید حذف شود.
- داده تخمینی نباید قطعی نمایش داده شود.
- تفاوت دوره‌های زمانی نباید پنهان شود.

---

# 11. Marketplace and Financial Testing

## 11.1. Marketplace

سناریوهای آزمون:

- مشاهده محصول.
- جست‌وجو.
- فیلتر.
- مرتب‌سازی.
- مشاهده جزئیات.
- افزودن به سبد.
- تغییر تعداد.
- حذف محصول.
- ثبت سفارش.
- مشاهده وضعیت سفارش.
- مدیریت محصول فروشنده.

## 11.2. Financial Operations

عملیات مالی باید آزمون‌های سخت‌گیرانه‌تری داشته باشند.

موارد:

- صحت نمایش مبلغ.
- صحت واحد پول.
- جداکننده هزارگان.
- اعشار.
- گرد کردن.
- وضعیت تراکنش.
- جلوگیری از Submit تکراری.
- Timeout.
- Retry.
- وضعیت Pending.
- وضعیت Failed.
- وضعیت Confirmed.
- سازگاری با نتیجه Backend.

## 11.3. Decimal Integrity

در نمایش و انتقال داده‌های مالی باید از تبدیل‌های ناسازگار و خطاهای Floating Point جلوگیری شود.

در صورت استفاده از نوع Decimal در قرارداد Backend، Frontend باید روش انتقال و نمایش سازگار و آزموده‌شده‌ای داشته باشد.

نمایش عددی نباید موجب تغییر مقدار واقعی تراکنش شود.

## 11.4. Financial Acceptance

موفقیت عملیات مالی فقط زمانی تأیید می‌شود که نتیجه معتبر از Backend دریافت شده باشد.

نمایش پیام Success در Client به‌تنهایی شواهد کافی نیست.

---

# 12. Visual Regression Testing

## 12.1. Purpose

Visual Regression برای شناسایی تغییرات ناخواسته رابط کاربری استفاده می‌شود.

## 12.2. Test Coverage

تصاویر مرجع باید برای صفحات مهم و وضعیت‌های کلیدی تعریف شوند:

- صفحه اصلی.
- صفحات عمومی.
- داشبوردها.
- فرم‌ها.
- جداول.
- نمودارها.
- نقشه‌ها.
- صفحات بازارگاه.
- صفحات مالی.
- صفحات احراز هویت.

## 12.3. Screenshot Conditions

برای مقایسه معتبر:

- Viewport ثابت باشد.
- Browser مشخص باشد.
- Fontها بارگذاری شده باشند.
- داده آزمایشی ثابت باشد.
- زمان و انیمیشن کنترل شوند.
- وضعیت شبکه مشخص باشد.

## 12.4. Baseline Governance

تصویر مرجع باید نسخه و تاریخ مشخص داشته باشد.

تغییر تصویر مرجع نباید صرفاً برای سبز شدن آزمون انجام شود.

تغییر Baseline باید پس از بررسی علت و تأیید مسئول مربوطه انجام شود.

---

# 13. Responsive and Cross-Device Testing

آزمون باید حداقل شامل گروه‌های زیر باشد:

| Device Class | Test Focus |
|---|---|
| Desktop | Layout and interaction |
| Laptop | Responsive layout |
| Tablet | Navigation and touch |
| Mobile | Small-screen usability |
| Low-end Mobile | Performance and memory |
| Large Display | Wide-screen behavior |

موارد بررسی:

- Breakpointها.
- Navigation.
- Overflow.
- Typography.
- Touch Targets.
- Modal.
- Tables.
- Charts.
- Maps.
- Forms.
- Orientation.
- Keyboard.
- Zoom.

Breakpointهای پیشنهادی فایل ۲۰ باید با آزمون واقعی تأیید شوند و تا پیش از آن معیار قطعی محسوب نمی‌شوند.

---

# 14. Browser Compatibility Testing

مرورگرهای هدف باید براساس جامعه کاربران و امکانات موردنیاز انتخاب شوند.

موارد آزمون:

- Rendering.
- CSS Compatibility.
- JavaScript Compatibility.
- Font Loading.
- Form Controls.
- Storage.
- Cookies.
- WebSocket.
- Web APIs.
- Keyboard Navigation.
- File Upload.
- Download.
- Responsive Layout.

پشتیبانی از یک مرورگر نباید صرفاً براساس امکان باز شدن صفحه اعلام شود.

برای هر مرورگر باید قابلیت‌های حیاتی جداگانه آزمون شوند.

---

# 15. RTL, LTR and Localization Testing

## 15.1. Language Testing

زبان‌های فعال باید جداگانه بررسی شوند.

## 15.2. RTL Testing

موارد:

- جهت متن.
- ترتیب اجزای رابط.
- Alignment.
- Icons.
- Forms.
- Tables.
- Charts.
- Navigation.
- Modal.
- Breadcrumb.
- Pagination.

## 15.3. Mixed Direction

متن ترکیبی فارسی، انگلیسی، عدد، URL و شناسه باید آزمون شود.

## 15.4. Date and Number Testing

موارد:

- تاریخ شمسی.
- تاریخ میلادی.
- منطقه زمانی.
- اعداد فارسی.
- اعداد لاتین.
- جداکننده اعشار.
- جداکننده هزارگان.
- واحدهای علمی.
- ارز.

تغییر زبان رابط نباید مقدار واقعی داده را تغییر دهد.

---

# 16. Accessibility Testing

آزمون دسترس‌پذیری باید با توجه به WCAG 2.2 و الگوهای مناسب WAI-ARIA انجام شود.

موارد اصلی:

- Keyboard Navigation.
- Focus Visibility.
- Semantic HTML.
- Screen Reader.
- Contrast.
- Form Labels.
- Error Messages.
- Dialog Behavior.
- Heading Structure.
- Alternative Text.
- Reduced Motion.
- Zoom and Reflow.
- Touch Target.
- Data Table Accessibility.
- Chart Accessibility.

## 16.1. Automated Accessibility Testing

ابزارهای خودکار می‌توانند بخشی از خطاها را شناسایی کنند.

اما نتیجه موفق آزمون خودکار، انطباق کامل با WCAG را اثبات نمی‌کند.

## 16.2. Manual Accessibility Testing

آزمون دستی باید شامل موارد زیر باشد:

- استفاده صرفاً با Keyboard.
- بررسی Screen Reader.
- بزرگ‌نمایی.
- بررسی Focus.
- بررسی فرم‌های خطادار.
- بررسی نمودارهای پیچیده.
- بررسی رابط فارسی و انگلیسی.

---

# 17. Performance and Reliability Testing

## 17.1. Performance Tests

موارد:

- Initial Load.
- Route Transition.
- API Response Handling.
- Rendering.
- Large Lists.
- Chart Rendering.
- Map Rendering.
- Image Loading.
- Font Loading.
- Memory Usage.
- CPU Usage.

## 17.2. Core Web Vitals

اهداف پیشنهادی:

| Metric | Proposed Target |
|---|---|
| LCP | ≤ 2.5 seconds |
| INP | ≤ 200 milliseconds |
| CLS | ≤ 0.1 |

این اعداد باید در شرایط واقعی و با داده میدانی ارزیابی شوند.

## 17.3. Network Testing

سناریوها:

- Fast Network.
- Slow Network.
- High Latency.
- Packet Loss.
- Intermittent Connection.
- Offline.
- Reconnection.

## 17.4. Long-Running Tests

برای قابلیت‌های طولانی‌مدت:

- Memory Leak.
- Repeated Navigation.
- Repeated API Calls.
- Background Processing.
- WebSocket Stability.
- Large Dataset Rendering.

---

# 18. Security Testing

آزمون امنیتی فرانت‌اند باید با الزامات فایل ۲۴ هماهنگ باشد.

موارد:

- XSS.
- CSRF.
- CORS.
- Authentication.
- Authorization.
- Session Management.
- Sensitive Storage.
- Open Redirect.
- Clickjacking.
- File Upload.
- Dependency Vulnerabilities.
- Secret Exposure.
- Cache Leakage.
- Error Leakage.

## 18.1. Security Test Independence

آزمون‌های امنیتی مهم نباید صرفاً از روی کد یا توضیحات توسعه‌دهنده تأیید شوند.

برای قابلیت‌های حساس، شواهد آزمون مستقل و قابل بازبینی لازم است.

---

# 19. Automated Testing Infrastructure

## 19.1. Tool Selection Principles

ابزارهای آزمون باید براساس موارد زیر انتخاب شوند:

- سازگاری با معماری.
- متن‌باز بودن در صورت امکان.
- پایداری.
- مستندات.
- قابلیت اجرا در محیط محلی.
- قابلیت یکپارچگی با CI.
- هزینه نگهداری.
- قابلیت گزارش‌گیری.

هیچ ابزار خاصی صرفاً با این سند تصویب نمی‌شود.

## 19.2. Tool Categories

| Category | Purpose |
|---|---|
| Unit Testing | آزمون توابع و منطق |
| Component Testing | آزمون کامپوننت |
| Browser Automation | آزمون مسیر کاربر |
| Accessibility Testing | بررسی دسترس‌پذیری |
| Visual Regression | مقایسه بصری |
| Static Analysis | تحلیل ایستای کد |
| Dependency Scanning | بررسی وابستگی‌ها |
| Performance Testing | آزمون عملکرد |
| API Contract Testing | آزمون قرارداد API |

## 19.3. Test Isolation

آزمون‌ها باید تا حد امکان مستقل باشند.

یک آزمون نباید برای موفقیت به اجرای تصادفی آزمون دیگری وابسته باشد.

## 19.4. Deterministic Tests

آزمون‌های غیرقطعی باید شناسایی و اصلاح شوند.

موارد احتمالی:

- Race Conditions.
- Timing Dependencies.
- Random Data.
- External Services.
- Timezone.
- Locale.
- Animation.
- Network Instability.

---

# 20. Continuous Integration Quality Gates

در صورت استفاده از CI، مراحل پیشنهادی عبارت‌اند از:

1. Source Validation.
2. Dependency Installation.
3. Lint.
4. Type Checking.
5. Unit Tests.
6. Component Tests.
7. Integration Tests.
8. Build.
9. Bundle Analysis.
10. Security Scanning.
11. Accessibility Checks.
12. E2E Tests.
13. Artifact Validation.

## 20.1. Blocking Conditions

موارد زیر باید در صورت تأیید سیاست پروژه مانع انتشار شوند:

- Build Failure.
- Type Errors بحرانی.
- Test Failure در مسیرهای حیاتی.
- آسیب‌پذیری CRITICAL.
- Secret Exposure.
- شکست Authentication.
- شکست Authorization.
- خطای مالی تأییدشده.
- خطای جدی در نمایش داده علمی.
- Regression بحرانی.

## 20.2. Non-Blocking Findings

برخی یافته‌ها ممکن است با ثبت ریسک و برنامه اصلاح پذیرفته شوند.

نمونه:

- خطای بصری کم‌اهمیت.
- هشدار غیرحیاتی.
- محدودیت سازگاری در مرورگر خارج از دامنه پشتیبانی.

پذیرش این موارد باید مستند باشد.

---

# 21. Defect Management

## 21.1. Defect Classification

| Severity | Definition |
|---|---|
| S0 — Critical | خطر امنیتی یا خرابی اساسی عملیات |
| S1 — High | اختلال جدی در قابلیت حیاتی |
| S2 — Medium | اختلال قابل توجه با راه‌حل جایگزین |
| S3 — Low | مشکل محدود یا ظاهری |
| S4 — Cosmetic | ایراد جزئی بصری |

## 21.2. Defect Record

هر نقص باید دارای موارد زیر باشد:

- Defect ID.
- Title.
- Description.
- Severity.
- Affected Feature.
- Environment.
- Reproduction Steps.
- Expected Result.
- Actual Result.
- Evidence.
- Root Cause.
- Fix Reference.
- Regression Test.
- Resolution Status.

## 21.3. Defect Lifecycle

گردش کار پیشنهادی:

`OPEN → TRIAGED → IN_PROGRESS → FIXED → RETESTED → CLOSED`

در صورت شکست آزمون مجدد:

`RETESTED → REOPENED`

## 21.4. Root Cause Analysis

برای خطاهای S0 و S1 باید علت ریشه‌ای بررسی و ثبت شود.

اصلاح ظاهری بدون شناسایی علت اصلی برای این دسته کافی نیست.

---

# 22. Regression Testing

هر تغییر باید از نظر اثر بر قابلیت‌های وابسته بررسی شود.

Regression Suite باید حداقل شامل موارد زیر باشد:

- Authentication.
- Authorization.
- Navigation.
- Core Pages.
- Forms.
- API Integration.
- Scientific Data Display.
- Financial Operations.
- Marketplace Workflows.
- Responsive Layout.
- RTL/LTR.
- Accessibility.
- Security.
- Performance.

تغییر یک کامپوننت مشترک می‌تواند چندین صفحه و محصول را تحت تأثیر قرار دهد.

بنابراین Regression باید براساس Dependency Map انجام شود.

---

# 23. Test Coverage and Quality Metrics

## 23.1. Coverage Metrics

شاخص‌های پیشنهادی:

| Metric | Purpose |
|---|---|
| Unit Test Coverage | پوشش منطق مستقل |
| Component Coverage | پوشش کامپوننت‌ها |
| Route Coverage | پوشش مسیرها |
| Critical Flow Coverage | پوشش مسیرهای حیاتی |
| API Contract Coverage | پوشش قراردادها |
| Accessibility Coverage | پوشش کنترل‌های دسترس‌پذیری |
| Regression Coverage | پوشش خطاهای پیشین |

## 23.2. Coverage Limitations

Coverage بالا به‌تنهایی نشان‌دهنده کیفیت آزمون نیست.

یک تست می‌تواند خطوط زیادی را اجرا کند، اما رفتارهای مهم را اعتبارسنجی نکند.

## 23.3. Quality Metrics

شاخص‌های مدیریتی پیشنهادی:

- Test Pass Rate.
- Defect Density.
- Defect Escape Rate.
- Regression Failure Rate.
- Mean Time to Detect.
- Mean Time to Resolve.
- Critical Flow Success Rate.
- Accessibility Defect Count.
- Performance Regression Count.

برای هر شاخص باید روش محاسبه و محدوده اندازه‌گیری مشخص باشد.

---

# 24. Release Validation

## 24.1. Release Candidate

نسخه Release Candidate باید دارای شناسه و نسخه مشخص باشد.

موارد موردنیاز:

- Source Commit.
- Build Identifier.
- Environment.
- Dependency Snapshot.
- Test Results.
- Security Findings.
- Known Defects.
- Release Notes.

## 24.2. Pre-Release Checklist

پیش از انتشار باید موارد زیر بررسی شوند:

- [ ] Build موفق.
- [ ] آزمون واحد موفق.
- [ ] آزمون کامپوننت موفق.
- [ ] آزمون Integration موفق.
- [ ] آزمون مسیرهای حیاتی موفق.
- [ ] آزمون Authentication موفق.
- [ ] آزمون Authorization موفق.
- [ ] آزمون امنیتی انجام شده.
- [ ] آزمون دسترس‌پذیری انجام شده.
- [ ] آزمون Responsive انجام شده.
- [ ] آزمون RTL/LTR انجام شده.
- [ ] آزمون Performance انجام شده.
- [ ] Regression انجام شده.
- [ ] خطاهای باز بررسی شده‌اند.
- [ ] شواهد آزمون ثبت شده‌اند.
- [ ] تأیید انتشار اخذ شده است.

## 24.3. Release Approval

تأیید فنی، تأیید امنیتی و تأیید مالک باید از هم تفکیک شوند.

قبولی آزمون فنی به‌تنهایی مجوز انتشار Production نیست.

## 24.4. Rollback Readiness

پیش از انتشار باید امکان بازگشت به نسخه پایدار قبلی بررسی شود.

در صورت تغییرات ناسازگار API یا داده، برنامه بازگشت باید متناسب با معماری تعریف شود.

---

# 25. Post-Release Validation

پس از انتشار باید موارد زیر بررسی شوند:

- سلامت بارگذاری صفحات.
- خطاهای JavaScript.
- وضعیت API.
- خطاهای Authentication.
- وضعیت مسیرهای حیاتی.
- شاخص‌های Performance.
- خطاهای کاربران.
- مشکلات دستگاه و مرورگر.
- گزارش‌های امنیتی.
- رفتار قابلیت‌های مالی و علمی.

انتشار موفق به‌معنای پایان تضمین کیفیت نیست.

پایش پس از انتشار بخشی از چرخه کیفیت است.

---

# 26. Evidence and Auditability

## 26.1. Evidence Types

شواهد قابل قبول می‌توانند شامل موارد زیر باشند:

- Test Report.
- Screenshot.
- Video Recording.
- Browser Console Output.
- Network Trace.
- API Response.
- CI Log.
- Accessibility Report.
- Performance Report.
- Security Report.
- Build Artifact.
- Commit Reference.

## 26.2. Evidence Integrity

شواهد باید به نسخه مشخصی از نرم‌افزار مرتبط باشند.

گزارش آزمونی که نسخه یا محیط آن مشخص نیست، برای تأیید نهایی کافی نیست.

## 26.3. Evidence Storage

محل نگهداری شواهد باید:

- مشخص باشد.
- دسترسی کنترل‌شده داشته باشد.
- قابل جست‌وجو باشد.
- با نسخه نرم‌افزار مرتبط باشد.
- اطلاعات حساس را افشا نکند.

---

# 27. Feature Completion Model

هر قابلیت باید از مراحل زیر عبور کند:

| Stage | Status | Meaning |
|---|---|---|
| 1 | SPECIFIED | نیازمندی و رفتار تعریف شده |
| 2 | IMPLEMENTED | کد قابلیت پیاده‌سازی شده |
| 3 | UNIT_TESTED | آزمون واحد انجام شده |
| 4 | INTEGRATION_TESTED | یکپارچگی بررسی شده |
| 5 | E2E_TESTED | مسیر کاربر آزمون شده |
| 6 | SECURITY_REVIEWED | بررسی امنیتی انجام شده |
| 7 | ACCESSIBILITY_REVIEWED | دسترس‌پذیری بررسی شده |
| 8 | VALIDATED | شواهد کافی برای اعتبارسنجی وجود دارد |
| 9 | ACCEPTED | مسئول مجاز قابلیت را پذیرفته است |
| 10 | RELEASED | نسخه منتشر شده است |

تمام مراحل برای همه قابلیت‌ها الزاماً یکسان نیستند؛ اما حذف هر مرحله باید براساس ریسک و با ثبت دلیل انجام شود.

## 27.1. Important Distinction

این وضعیت‌ها معادل یکدیگر نیستند:

- Implemented ≠ Tested
- Tested ≠ Validated
- Validated ≠ Accepted
- Accepted ≠ Released

هیچ گزارش فنی نباید این وضعیت‌ها را با هم ادغام کند.

---

# 28. Governance and Agent Execution Rules

## 28.1. Agent Responsibilities

ایجنت توسعه می‌تواند:

- Test Case ایجاد کند.
- آزمون بنویسد.
- آزمون اجرا کند.
- خطاها را گزارش کند.
- نقص‌ها را اصلاح کند.
- Regression اجرا کند.
- شواهد جمع‌آوری کند.
- گزارش وضعیت تولید کند.

## 28.2. Agent Restrictions

ایجنت نباید:

- تست ناموفق را بدون دلیل حذف کند.
- آزمون را صرفاً برای سبز شدن CI تضعیف کند.
- داده آزمایشی را به‌جای داده واقعی معرفی کند.
- Mock را به‌عنوان اتصال واقعی معرفی کند.
- Coverage را با آزمون‌های بی‌معنا افزایش دهد.
- خطای باز را بدون اصلاح یا ثبت ریسک ببندد.
- نتیجه علمی را بدون مرجع معتبر تأیید کند.
- مجوز انتشار Production را برای خود صادر کند.
- شواهد آزمون را دست‌کاری کند.

## 28.3. Test Change Governance

هر تغییر در موارد زیر باید قابل ردیابی باشد:

- Test Case.
- Test Data.
- Expected Result.
- Baseline Screenshot.
- Test Configuration.
- Quality Gate.

---

# 29. Open Decisions

تصمیمات زیر هنوز نیازمند بررسی و تصویب هستند:

| ID | Decision | Status |
|---|---|---|
| QA-D01 | انتخاب ابزار Unit Testing | OPEN |
| QA-D02 | انتخاب ابزار Component Testing | OPEN |
| QA-D03 | انتخاب ابزار E2E | OPEN |
| QA-D04 | انتخاب ابزار Visual Regression | OPEN |
| QA-D05 | انتخاب ابزار Accessibility Testing | OPEN |
| QA-D06 | انتخاب ابزار Performance Testing | OPEN |
| QA-D07 | انتخاب ابزار SAST و SCA | OPEN |
| QA-D08 | ساختار Test Environment | OPEN |
| QA-D09 | سیاست مدیریت Test Data | OPEN |
| QA-D10 | میزان پوشش آزمون مورد انتظار | OPEN |
| QA-D11 | تعریف Critical User Journeys | OPEN |
| QA-D12 | سیاست Regression Suite | OPEN |
| QA-D13 | سیاست Release Candidate | OPEN |
| QA-D14 | سیاست نگهداری Test Evidence | OPEN |
| QA-D15 | معیارهای رسمی Release Approval | OPEN |
| QA-D16 | مرورگرها و دستگاه‌های رسمی پشتیبانی‌شده | OPEN |
| QA-D17 | مسئولیت نهایی تأیید کیفیت | OPEN |

هیچ ابزار، آستانه یا سیاستی صرفاً با انتشار این سند تصویب نمی‌شود.

---

# 30. Final Quality Principles

اصول بنیادین این استاندارد:

1. کیفیت باید از مرحله طراحی آغاز شود.
2. آزمون باید متناسب با ریسک قابلیت باشد.
3. آزمون خودکار و دستی مکمل یکدیگر هستند.
4. Mock جایگزین آزمون واقعی Integration نیست.
5. صحت نمایش داده با اعتبار علمی داده متفاوت است.
6. صحت رابط مالی با صحت تراکنش مالی متفاوت است.
7. امنیت باید مستقل از ظاهر رابط بررسی شود.
8. آزمون دسترس‌پذیری نباید صرفاً به ابزار خودکار محدود شود.
9. هر خطای مهم باید دارای شواهد و مسیر پیگیری باشد.
10. Regression باید بخشی از هر تغییر مهم باشد.
11. انتشار باید دارای معیار پذیرش و تأیید مشخص باشد.
12. هیچ قابلیت بدون شواهد کافی نباید Validated معرفی شود.

---

# 31. Document Status

**Current Status: DRAFT — PROPOSED — NOT APPROVED**

این سند چارچوب پیشنهادی آزمون و تضمین کیفیت فرانت‌اند در Eco Nojin، HyDroMA و Nojin Marketplace است.

این سند:

- ابزار آزمون خاصی را تصویب نمی‌کند.
- پوشش آزمون فعلی پروژه را تأیید نمی‌کند.
- کیفیت صفحات موجود را تضمین نمی‌کند.
- صحت علمی مدل‌ها را اثبات نمی‌کند.
- امنیت سامانه را تأیید نمی‌کند.
- مجوز انتشار Production صادر نمی‌کند.
- جایگزین آزمون و اعتبارسنجی واقعی نیست.

اجرای این استاندارد باید پس از بررسی معماری واقعی، انتخاب ابزارها، تعیین محیط‌های آزمون، تعریف مسیرهای حیاتی و تأیید مالک انجام شود.

**End of Document 25**