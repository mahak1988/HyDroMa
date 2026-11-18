# 06 — DESIGN SYSTEM ARCHITECTURE
## معماری سیستم طراحی اکوسیستم Eco Nojin

**Project:** Eco Nojin Visual Identity v3  
**Related Brands:** Eco Nojin / HyDroMA / Nojin Marketplace  
**Version:** 1.0  
**Date:** 2026-11-17  
**Status:** PROPOSED — NOT APPROVED  
**Decision Authority:** Project Owner

---

# 1. هدف سند

این سند معماری کلان Design System اکوسیستم Eco Nojin را تعریف می‌کند.

هدف، ایجاد یک سیستم طراحی واحد است که بتواند سه برند را با شخصیت‌های مستقل اما با ساختار فنی مشترک پشتیبانی کند.

سیستم طراحی باید:

- منسجم باشد.
- توسعه‌پذیر باشد.
- قابل نگهداری باشد.
- از تکرار غیرضروری جلوگیری کند.
- از فارسی و انگلیسی پشتیبانی کند.
- با رابط‌های RTL و LTR سازگار باشد.
- در وب‌سایت و اپلیکیشن قابل استفاده باشد.
- برای داشبوردهای علمی و داده‌محور مناسب باشد.
- از دسترس‌پذیری پشتیبانی کند.
- امکان تغییر هویت بصری بدون بازنویسی کامپوننت‌ها را فراهم کند.

این سند معماری پیشنهادی است و به‌معنای تأیید یا مجوز پیاده‌سازی نهایی نیست.

---

# 2. اصول معماری

## 2.1 Single Source of Truth

تمام مقادیر طراحی باید از یک منبع معتبر و مشخص دریافت شوند.

مواردی مانند:

- رنگ‌ها
- فونت‌ها
- اندازه متن
- فاصله‌ها
- شعاع گوشه‌ها
- سایه‌ها
- لایه‌بندی
- اندازه آیکون‌ها
- نقاط شکست واکنش‌گرا
- انیمیشن‌ها

نباید در بخش‌های مختلف محصول به‌صورت مستقل و ناسازگار تعریف شوند.

## 2.2 Separation of Concerns

سیستم طراحی باید میان سه سطح تمایز ایجاد کند:

1. مقادیر پایه طراحی
2. توکن‌های معنایی
3. توکن‌ها و الگوهای اختصاصی کامپوننت‌ها

تغییر یک رنگ پایه نباید مستلزم اصلاح دستی تمام کامپوننت‌ها باشد.

## 2.3 Brand Independence

سه برند باید بتوانند از یک زیرساخت مشترک استفاده کنند، بدون آنکه هویت آن‌ها به یکدیگر وابسته شود.

## 2.4 Accessibility by Design

دسترس‌پذیری باید در ساختار اصلی سیستم طراحی لحاظ شود، نه اینکه پس از پیاده‌سازی به‌عنوان اصلاح جانبی اضافه شود.

## 2.5 Progressive Validation

هر قابلیت باید با وضعیت مشخص مدیریت شود:

- Proposed
- Designed
- Implemented
- Tested
- Validated
- Approved

وجود یک توکن یا کامپوننت در فایل‌ها به معنی تأیید عملکرد آن نیست.

---

# 3. معماری لایه‌ای Design System

ساختار پیشنهادی شامل هفت لایه است.

| لایه | نام | مسئولیت |
|---|---|---|
| L1 | Foundations | اصول و مقادیر پایه |
| L2 | Design Tokens | توکن‌های طراحی |
| L3 | Brand Themes | هویت اختصاصی سه برند |
| L4 | Components | کامپوننت‌های رابط |
| L5 | Patterns | الگوهای ترکیبی |
| L6 | Templates | قالب صفحات |
| L7 | Guidelines | قواعد استفاده و نگهداری |

## 3.1 Foundations

شامل:

- اصول طراحی
- رنگ
- تایپوگرافی
- فاصله‌گذاری
- Grid
- Border Radius
- Shadows
- Elevation
- Iconography
- Motion
- Accessibility

## 3.2 Design Tokens

مقادیر Foundations به توکن‌های ساختاریافته تبدیل می‌شوند.

## 3.3 Brand Themes

سه تم مستقل:

- Eco Nojin Theme
- HyDroMA Theme
- Nojin Marketplace Theme

## 3.4 Components

کامپوننت‌های قابل استفاده مجدد مانند:

- Button
- Input
- Select
- Card
- Badge
- Alert
- Dialog
- Table
- Tabs
- Navigation
- Tooltip

## 3.5 Patterns

الگوهای ترکیبی مانند:

- Dashboard Header
- Search and Filter Bar
- Data Summary
- Product Card
- Scientific Metric Card
- User Profile Panel

## 3.6 Templates

قالب‌های صفحات اصلی:

- Public Landing Page
- Scientific Dashboard
- Marketplace Home
- Product Detail
- Tourism Detail
- Financial Dashboard
- Admin Panel

## 3.7 Guidelines

شامل قواعد:

- انتخاب کامپوننت
- استفاده از رنگ
- تایپوگرافی
- دسترس‌پذیری
- RTL/LTR
- توسعه و نگهداری
- نسخه‌بندی

---

# 4. معماری Design Tokens

توکن‌ها باید در سه سطح تعریف شوند.

## 4.1 Primitive Tokens

مقادیر خام طراحی.

مثال:

`palette.sovereign.cobalt.500`

`palette.terra.emerald.600`

`spacing.4`

`radius.md`

`font.size.lg`

این توکن‌ها نباید مستقیماً در تمام کامپوننت‌ها استفاده شوند.

## 4.2 Semantic Tokens

توکن‌های دارای نقش معنایی.

مثال:

`color.text.primary`

`color.background.page`

`color.action.primary`

`color.border.default`

`spacing.component.gap`

`typography.heading.primary`

این سطح باید رابط میان مقادیر خام و کامپوننت‌ها باشد.

## 4.3 Component Tokens

توکن‌های اختصاصی کامپوننت‌ها.

مثال:

`button.primary.background`

`button.primary.foreground`

`card.background`

`input.border.focus`

`navigation.item.active`

کامپوننت‌ها باید تا حد امکان از این لایه استفاده کنند.

---

# 5. معماری تم سه برند

هر برند باید یک Theme مستقل داشته باشد.

## 5.1 Eco Nojin Theme

مسئولیت:

- وب‌سایت اصلی
- صفحات معرفی
- صفحات عمومی
- اسناد رسمی
- ارتباطات سازمانی

ویژگی‌ها:

- اعتبار
- قدرت
- سرزندگی
- گرما
- آینده‌نگری

## 5.2 HyDroMA Theme

مسئولیت:

- داشبورد علمی
- نقشه‌ها
- مدل‌سازی
- شبیه‌سازی
- تحلیل داده
- ابزارهای تصمیم‌سازی

ویژگی‌ها:

- دقت
- نظم
- وضوح
- تمرکز
- اعتماد علمی

## 5.3 Nojin Marketplace Theme

مسئولیت:

- بازارگاه
- فروشگاه
- محصولات
- سفارش
- گردشگری
- خدمات اقتصادی

ویژگی‌ها:

- گرما
- جذابیت
- صمیمیت
- اعتماد
- دسترس‌پذیری

## 5.4 قواعد اشتراک

سه Theme باید در موارد زیر مشترک باشند:

- ساختار توکن‌ها
- مقیاس فاصله‌گذاری
- قواعد تایپوگرافی
- اصول دسترس‌پذیری
- معماری کامپوننت‌ها
- رفتار تعاملی
- قراردادهای فنی

اما مقادیر رنگ و برخی جزئیات ظاهری می‌توانند مستقل باشند.

---

# 6. معماری تایپوگرافی

سیستم تایپوگرافی باید از سند شماره ۰۲ پیروی کند.

## 6.1 نقش‌های تایپوگرافی

- Brand Display
- Display
- Heading
- Interface
- Body
- Editorial
- Data
- Technical

## 6.2 توکن‌های پیشنهادی

`font.family.brand`

`font.family.display`

`font.family.interface`

`font.family.editorial`

`font.family.data`

`font.size.xs`

`font.size.sm`

`font.size.md`

`font.size.lg`

`font.weight.regular`

`font.weight.medium`

`font.weight.semibold`

`font.weight.bold`

`line-height.body`

`line-height.heading`

## 6.3 قواعد

- فونت لوگوتایپ مستقل از فونت رابط کاربری انتخاب می‌شود.
- فارسی و لاتین باید به‌صورت مستقل آزمون شوند.
- اعداد علمی و مالی باید خوانا باشند.
- واحدهای اندازه‌گیری نباید از مقدار عددی جدا شوند.
- متن‌های ترکیبی فارسی و لاتین باید از نظر BiDi بررسی شوند.
- هیچ فونتی بدون تأیید مجوز وارد نسخه انتشار نشود.

---

# 7. معماری رنگ

سیستم رنگ باید از سند شماره ۰۳ پیروی کند.

## 7.1 دسته‌بندی

- Brand Colors
- Neutral Colors
- Semantic Colors
- Data Visualization Colors
- Map Colors
- Surface Colors
- Interactive Colors

## 7.2 قواعد

- رنگ خام از رنگ معنایی مستقل باشد.
- رنگ‌های وضعیت با رنگ برند اشتباه نشوند.
- نمودارها نظام رنگی مستقل داشته باشند.
- رنگ نقشه تابع معنای داده باشد.
- رنگ‌های CTA در هر Theme قابل کنترل باشند.
- کنتراست ترکیب‌های واقعی آزمون شود.

## 7.3 وضعیت

تا زمان انتخاب و تأیید مالک، هیچ مقدار رنگی نهایی محسوب نمی‌شود.

---

# 8. مقیاس فاصله‌گذاری

مقیاس فاصله‌گذاری باید منظم و قابل توسعه باشد.

پیشنهاد اولیه بر مبنای واحد پایه 4px:

| Token | مقدار |
|---|---:|
| `space.0` | 0px |
| `space.1` | 4px |
| `space.2` | 8px |
| `space.3` | 12px |
| `space.4` | 16px |
| `space.5` | 20px |
| `space.6` | 24px |
| `space.8` | 32px |
| `space.10` | 40px |
| `space.12` | 48px |
| `space.16` | 64px |
| `space.20` | 80px |
| `space.24` | 96px |

این مقیاس پیشنهادی است و پس از آزمون در صفحات واقعی قابل اصلاح خواهد بود.

---

# 9. Grid و Layout

سیستم Layout باید برای صفحات عمومی و داشبوردهای تخصصی انعطاف‌پذیر باشد.

## 9.1 Grid پیشنهادی

| نوع نمایشگر | ستون |
|---|---:|
| Mobile | 4 |
| Tablet | 8 |
| Desktop | 12 |
| Wide Desktop | 12 |

## 9.2 قواعد

- Grid باید Responsive باشد.
- عرض محتوای متنی محدود شود.
- داشبورد علمی امکان استفاده از فضای گسترده داشته باشد.
- صفحات عمومی از تراکم بیش از حد پرهیز کنند.
- Sidebar در حالت RTL و LTR رفتار صحیح داشته باشد.
- Layout نباید به جهت متن وابستگی سخت‌کدشده داشته باشد.

## 9.3 Breakpoints

مقادیر پیشنهادی برای بررسی:

- `bp.sm = 640px`
- `bp.md = 768px`
- `bp.lg = 1024px`
- `bp.xl = 1280px`
- `bp.2xl = 1536px`

این مقادیر باید با رفتار واقعی محتوا اعتبارسنجی شوند.

---

# 10. Border Radius و Elevation

## 10.1 Border Radius

| Token | مقدار پیشنهادی |
|---|---:|
| `radius.none` | 0px |
| `radius.xs` | 4px |
| `radius.sm` | 6px |
| `radius.md` | 10px |
| `radius.lg` | 14px |
| `radius.xl` | 20px |
| `radius.2xl` | 28px |
| `radius.full` | 9999px |

## 10.2 Elevation

لایه‌بندی باید با استفاده از سایه‌های ملایم و مرزبندی مناسب انجام شود.

سطوح:

- Base
- Raised
- Floating
- Overlay
- Modal

سایه‌ها نباید جایگزین مرزهای ضروری شوند.

---

# 11. معماری کامپوننت‌ها

کامپوننت‌ها باید به دسته‌های مشخص تقسیم شوند.

## 11.1 Foundations Components

- Typography
- Icon
- Divider
- Surface
- Container

## 11.2 Form Components

- Input
- Textarea
- Select
- Checkbox
- Radio
- Switch
- Date Picker
- File Upload

## 11.3 Navigation Components

- Header
- Sidebar
- Navigation Menu
- Breadcrumb
- Tabs
- Pagination

## 11.4 Feedback Components

- Alert
- Toast
- Badge
- Progress
- Skeleton
- Empty State
- Error State

## 11.5 Data Components

- Data Table
- Metric Card
- Chart Container
- Legend
- Data Tooltip
- Filter Bar

## 11.6 Business Components

- Product Card
- Price Display
- Cart Summary
- Order Status
- Seller Profile
- Payment Summary

## 11.7 Scientific Components

- Scientific Metric
- Map Layer Control
- Time Series Panel
- Scenario Selector
- Simulation Status
- Model Provenance
- Uncertainty Indicator
- Data Source Indicator

---

# 12. قرارداد ساخت کامپوننت

هر کامپوننت باید دارای مشخصات مستند باشد.

| ویژگی | توضیح |
|---|---|
| Name | نام کامپوننت |
| Purpose | هدف |
| Variants | انواع |
| Props | ورودی‌ها |
| States | وضعیت‌ها |
| Tokens | توکن‌های مصرفی |
| Accessibility | الزامات دسترس‌پذیری |
| RTL/LTR | رفتار جهت |
| Responsive | رفتار نمایشگر |
| Tests | آزمون‌های لازم |
| Status | وضعیت تکمیل |

## 12.1 وضعیت کامپوننت

- Draft
- Implemented
- Tested
- Validated
- Approved
- Deprecated

## 12.2 محدودیت

کامپوننتی که فقط ظاهر آن ساخته شده، نباید به‌عنوان کامپوننت آماده تولید معرفی شود.

رفتار، دسترس‌پذیری، حالت‌های خطا و آزمون‌ها نیز باید بررسی شوند.

---

# 13. معماری RTL و LTR

پشتیبانی چندزبانه باید از سطح معماری لحاظ شود.

## 13.1 الزامات

- استفاده از `dir` مناسب
- استفاده از CSS Logical Properties
- پرهیز از وابستگی غیرضروری به `left` و `right`
- مدیریت متن ترکیبی فارسی و لاتین
- مدیریت اعداد و واحدها
- بررسی ترتیب آیکون‌ها
- کنترل ترتیب Navigation
- آزمون فرم‌ها و جداول در هر دو جهت

## 13.2 قرارداد

کامپوننت نباید برای کارکرد صحیح در RTL نیازمند بازنویسی مستقل باشد.

---

# 14. معماری دسترس‌پذیری

هدف طراحی:

**WCAG 2.2 AA**

موارد الزامی:

- کنتراست متن
- کنتراست اجزای رابط
- Focus Visible
- Keyboard Navigation
- Semantic HTML
- Label مناسب
- Error Identification
- Accessible Names
- Reduced Motion
- پشتیبانی از فناوری‌های کمکی

## 14.1 معیارهای اصلی

| معیار | هدف |
|---|---|
| متن عادی | حداقل 4.5:1 |
| متن بزرگ | حداقل 3:1 |
| اجزای ضروری رابط | حداقل 3:1 |
| ناوبری با صفحه‌کلید | پشتیبانی کامل |
| Focus | قابل مشاهده |
| رنگ | تنها حامل اطلاعات نباشد |

---

# 15. معماری Motion

حرکت باید به‌صورت توکن مدیریت شود.

نمونه:

`motion.duration.fast`

`motion.duration.normal`

`motion.duration.slow`

`motion.easing.standard`

`motion.easing.emphasized`

قواعد:

- انیمیشن غیرضروری ممنوع است.
- رفتار Reduced Motion پشتیبانی شود.
- حرکت نباید باعث تأخیر در دسترسی به محتوا شود.
- وضعیت واقعی عملیات باید از انیمیشن مستقل باشد.

---

# 16. ساختار پیشنهادی فایل‌های Design System

ساختار پیشنهادی برای نسخه آینده:

```text
design-system/
│
├── foundations/
│   ├── principles.md
│   ├── typography.md
│   ├── color.md
│   ├── spacing.md
│   ├── layout.md
│   ├── elevation.md
│   ├── motion.md
│   └── accessibility.md
│
├── tokens/
│   ├── primitives/
│   ├── semantic/
│   ├── components/
│   └── token-schema.json
│
├── themes/
│   ├── eco-nojin/
│   ├── hydroma/
│   └── marketplace/
│
├── components/
│   ├── foundations/
│   ├── forms/
│   ├── navigation/
│   ├── feedback/
│   ├── data/
│   ├── business/
│   └── scientific/
│
├── patterns/
│   ├── dashboard/
│   ├── marketplace/
│   ├── scientific/
│   └── public-web/
│
├── templates/
│   ├── landing/
│   ├── dashboard/
│   ├── marketplace/
│   ├── tourism/
│   └── admin/
│
└── documentation/
    ├── usage-guidelines.md
    ├── contribution-guidelines.md
    └── changelog.md
```

این ساختار صرفاً معماری پیشنهادی است و مجوز ایجاد یا تغییر پوشه‌ها در مخزن پروژه محسوب نمی‌شود.

---

# 17. نسخه‌بندی و مدیریت تغییرات

Design System باید نسخه‌بندی مشخص داشته باشد.

پیشنهاد:

- Major: تغییرات ناسازگار
- Minor: قابلیت‌های جدید سازگار
- Patch: اصلاحات کوچک

هر تغییر باید شامل موارد زیر باشد:

- شناسه تغییر
- دلیل تغییر
- فایل‌های تحت تأثیر
- کامپوننت‌های متأثر
- وضعیت آزمون
- وضعیت تأیید مالک

هیچ تغییر اساسی نباید بدون ثبت و تأیید انجام شود.

---

# 18. معیارهای کیفیت

معیارهای کیفیت سیستم طراحی:

| حوزه | معیار |
|---|---|
| Consistency | یکنواختی در سه برند |
| Reusability | قابلیت استفاده مجدد |
| Accessibility | انطباق با WCAG |
| Localization | پشتیبانی فارسی و انگلیسی |
| Maintainability | سهولت نگهداری |
| Scalability | قابلیت توسعه |
| Performance | سربار پایین |
| Traceability | قابلیت ردیابی تغییرات |
| Documentation | مستندات معتبر |
| Testability | امکان آزمون مستقل |

---

# 19. تصمیم‌های باز مالک

| شناسه | تصمیم | وضعیت |
|---|---|---|
| DS-01 | تأیید معماری هفت‌لایه | OPEN |
| DS-02 | تأیید ساختار سه‌سطحی توکن‌ها | OPEN |
| DS-03 | تأیید معماری سه Theme | OPEN |
| DS-04 | تأیید مقیاس فاصله‌گذاری | OPEN |
| DS-05 | تأیید Grid | OPEN |
| DS-06 | تأیید Breakpoints | OPEN |
| DS-07 | تأیید Border Radius | OPEN |
| DS-08 | تأیید معماری کامپوننت‌ها | OPEN |
| DS-09 | تأیید قرارداد ساخت کامپوننت | OPEN |
| DS-10 | تأیید ساختار پوشه‌ها | OPEN |
| DS-11 | تأیید نسخه‌بندی | OPEN |
| DS-12 | تأیید سیاست RTL/LTR | OPEN |
| DS-13 | تأیید معیارهای دسترس‌پذیری | OPEN |

---

# 20. موارد ممنوع

تا زمان تأیید مالک:

1. هیچ Theme نهایی تلقی نشود.
2. هیچ رنگی بدون تأیید از سند ۰۳ تثبیت نشود.
3. هیچ فونتی بدون تأیید از سند ۰۲ انتخاب نشود.
4. هیچ کامپوننتی به‌عنوان نسخه نهایی معرفی نشود.
5. هیچ فایل Design System قبلی بازنویسی نشود.
6. هیچ ساختار پوشه‌ای در مخزن اصلی بدون مجوز ایجاد نشود.
7. هیچ تغییر ناسازگاری بدون نسخه‌بندی انجام نشود.
8. هیچ قابلیت صرفاً ظاهری به‌عنوان قابلیت آزموده‌شده معرفی نشود.

---

# 21. معیار پذیرش سند

این سند زمانی از نظر محتوایی کامل است که:

- معماری کلان Design System مشخص باشد.
- لایه‌های طراحی تعریف شده باشند.
- معماری توکن‌ها روشن باشد.
- تمایز سه برند مشخص شده باشد.
- معماری کامپوننت‌ها تعریف شده باشد.
- قراردادهای RTL/LTR مشخص باشند.
- الزامات دسترس‌پذیری ثبت شده باشند.
- ساختار پیشنهادی فایل‌ها ارائه شده باشد.
- قواعد نسخه‌بندی و مدیریت تغییر مشخص باشند.
- تصمیم‌های باز مالک ثبت شده باشند.

---

# 22. وضعیت نهایی

**Document Status:** PROPOSED — NOT APPROVED

**Architecture:** Proposed

**Tokens:** Not Final

**Brand Themes:** Not Final

**Components:** Not Implemented

**Accessibility Validation:** Not Performed

**Owner Approval:** PENDING

**Implementation Authorization:** NOT GRANTED

این سند معماری پیشنهادی سیستم طراحی را تعریف می‌کند. هیچ بخش آن به‌تنهایی مجوز تغییر فایل‌های موجود یا شروع پیاده‌سازی نهایی نیست.