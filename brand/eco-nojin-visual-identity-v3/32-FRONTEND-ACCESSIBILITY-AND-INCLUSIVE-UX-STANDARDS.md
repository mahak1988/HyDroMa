# Frontend Accessibility and Inclusive UX Standards

## 1. Document Control

| Attribute | Value |
|---|---|
| Document ID | EN-FE-STD-032 |
| Document Number | 32 |
| Document Name | Frontend Accessibility and Inclusive UX Standards |
| Ecosystem | Eco Nojin |
| Products | Eco Nojin, HyDroMA, Nojin Marketplace |
| Document Category | Frontend Engineering and UX Standards |
| Version | 1.0.0 |
| Status | DRAFT — PROPOSED — NOT APPROVED |
| Date | 2026-11-17 |
| Primary Reference | WCAG 2.2 |
| Target Conformance | WCAG 2.2 Level AA — Proposed |
| Approval Authority | Project Owner |

### 1.1. Status Notice

این سند چارچوب پیشنهادی دسترس‌پذیری و طراحی فراگیر در اکوسیستم Eco Nojin است.

هدف آن فراهم کردن امکان استفاده مؤثر از محصولات برای کاربران با توانایی‌ها، شرایط جسمی، شناختی، حسی، زبانی، فرهنگی و محدودیت‌های متفاوت است.

هدف‌گذاری WCAG 2.2 Level AA یک پیشنهاد است و تا زمان بررسی و تصویب رسمی، تعهد انطباق حقوقی یا فنی محسوب نمی‌شود.

هیچ ابزار، کتابخانه، الگوی طراحی یا روش آزمونی در این سند به‌عنوان انتخاب نهایی تصویب نشده است.

### 1.2. Normative Language

- **MUST:** الزام ضروری.
- **MUST NOT:** رفتار ممنوع.
- **SHOULD:** توصیه قوی.
- **SHOULD NOT:** رفتار نامطلوب.
- **MAY:** گزینه مجاز.
- **PROPOSED:** پیشنهاد نیازمند بررسی و تصویب.

---

# 2. Purpose and Objectives

هدف این سند ایجاد استانداردی برای طراحی و پیاده‌سازی رابط‌های کاربری قابل دسترس، فراگیر و قابل استفاده در شرایط متنوع است.

اهداف:

1. کاهش موانع استفاده از محصولات.
2. پشتیبانی از کاربران دارای محدودیت بینایی، شنوایی، حرکتی و شناختی.
3. پشتیبانی از صفحه‌خوان‌ها و فناوری‌های کمکی.
4. پشتیبانی کامل از تعامل با صفحه‌کلید.
5. ایجاد تجربه قابل استفاده برای کاربران موبایل و دسکتاپ.
6. پشتیبانی از زبان فارسی و ساختار RTL.
7. فراهم کردن تجربه مناسب برای زبان‌های LTR.
8. کاهش پیچیدگی شناختی رابط‌ها.
9. افزایش وضوح داده‌های علمی و نمودارها.
10. ایجاد دسترسی مناسب به نقشه‌ها و نمایشگرهای پیچیده.
11. طراحی فرآیندهای مالی قابل فهم و کم‌خطا.
12. پشتیبانی از اینترنت ضعیف و دستگاه‌های محدود.
13. ایجاد فرآیند ارزیابی و آزمون دسترس‌پذیری.
14. جلوگیری از وابستگی تجربه کاربر به رنگ، صدا یا حرکت به‌تنهایی.

---

# 3. Scope

این استاندارد برای تمام رابط‌های کاربری اکوسیستم کاربرد دارد.

## 3.1. Eco Nojin

- صفحات عمومی
- صفحات معرفی اکوسیستم
- داشبوردها
- پروفایل کاربران
- اطلاعات روستاها
- اطلاعات جوامع محلی و عشایری
- محتوای چندرسانه‌ای
- فرم‌ها
- پنل‌های مدیریتی
- صفحات راهنما و آموزش

## 3.2. HyDroMA

- داشبورد علمی
- داده‌های آب و خاک
- داده‌های اقلیمی
- سنجش‌ازدور
- نقشه‌ها
- نمودارها
- شبیه‌سازی
- نمایش نتایج مدل‌ها
- گزارش‌های علمی
- MRV
- نمایش داده‌های سه‌بعدی
- کنترل‌های تخصصی تحلیل

## 3.3. Nojin Marketplace

- جست‌وجوی محصولات
- فهرست محصولات
- جزئیات محصول
- سبد خرید
- ثبت سفارش
- فرم‌های فروشندگان
- پرداخت
- کیف پول
- گزارش‌های مالی
- حسابداری
- پنل فروشنده

## 3.4. Responsive Scope

تمام اندازه‌های صفحه و شرایط استفاده باید بررسی شوند:

- موبایل کوچک
- موبایل بزرگ
- تبلت
- لپ‌تاپ
- دسکتاپ
- نمایشگرهای بزرگ
- صفحه‌نمایش لمسی
- دستگاه‌های دارای صفحه‌کلید
- دستگاه‌های دارای فناوری کمکی

---

# 4. Accessibility Principles

## 4.1. Perceivable

اطلاعات و اجزای رابط باید به شیوه‌ای قابل درک برای کاربران ارائه شوند.

نمونه:

- متن جایگزین برای تصاویر
- برچسب برای کنترل‌ها
- کنتراست مناسب
- زیرنویس برای محتوای صوتی و تصویری
- ساختار معنایی صحیح

## 4.2. Operable

اجزای رابط باید قابل استفاده و کنترل باشند.

نمونه:

- دسترسی با صفحه‌کلید
- مدیریت Focus
- عدم وابستگی به تعامل مبتنی بر Hover
- زمان کافی برای عملیات
- کنترل حرکت و انیمیشن

## 4.3. Understandable

رفتار رابط باید قابل پیش‌بینی و فهم باشد.

نمونه:

- زبان مشخص
- پیام خطای واضح
- راهنمای فرم‌ها
- ساختار قابل پیش‌بینی
- فرآیندهای ساده و سازگار

## 4.4. Robust

رابط باید با فناوری‌های کمکی و ابزارهای مختلف سازگار باشد.

نمونه:

- HTML معنایی
- ARIA صحیح
- سازگاری با صفحه‌خوان
- ساختار DOM قابل پیش‌بینی
- تعامل پایدار

## 4.5. Inclusive Design

طراحی باید شرایط واقعی کاربران را در نظر بگیرد، نه صرفاً کاربران ایده‌آل با دستگاه قدرتمند، اینترنت سریع و توانایی‌های یکسان.

---

# 5. Accessibility Conformance Target

## 5.1. WCAG 2.2

هدف پیشنهادی، انطباق با WCAG 2.2 سطح AA است.

چهار اصل اصلی:

- Perceivable
- Operable
- Understandable
- Robust

## 5.2. Conformance Scope

ارزیابی باید تمام اجزای قابل استفاده را پوشش دهد:

- صفحات عمومی
- صفحات محافظت‌شده
- فرم‌ها
- پنل‌ها
- Dialogها
- منوها
- نمودارها
- نقشه‌ها
- فرآیندهای پرداخت
- محتوای چندرسانه‌ای
- خطاها و وضعیت‌های استثنایی

## 5.3. No Partial Claim

عبور یک صفحه یا یک ابزار خودکار به‌معنای انطباق کل محصول نیست.

هر ادعای انطباق باید دارای دامنه، نسخه، روش آزمون و شواهد مشخص باشد.

---

# 6. Semantic HTML

## 6.1. Native HTML First

تا حد امکان باید از عناصر معنایی HTML استفاده شود.

نمونه:

| Purpose | Preferred Element |
|---|---|
| Main Navigation | nav |
| Main Content | main |
| Page Header | header |
| Page Footer | footer |
| Independent Content | article |
| Grouped Content | section |
| Action | button |
| Navigation | a |
| Form | form |
| Input Label | label |
| Table | table |

## 6.2. Avoid Generic Controls

استفاده از عناصر عمومی مانند `div` یا `span` برای ساخت کنترل‌های تعاملی باید محدود شود.

اگر عنصر سفارشی ضروری است، باید تمام رفتارهای دسترس‌پذیری آن پیاده‌سازی شوند.

## 6.3. Heading Hierarchy

ساختار Heading باید منطقی باشد.

نمونه:

```html
<h1>داشبورد علمی</h1>

<section>
  <h2>وضعیت منابع آب</h2>

  <section>
    <h3>آب سطحی</h3>
  </section>
</section>
```

سطح Heading نباید صرفاً بر اساس اندازه ظاهری انتخاب شود.

## 6.4. Landmarks

صفحات باید از Landmarkهای معنایی مناسب استفاده کنند.

در صفحات پیچیده، Landmarkها باید به‌گونه‌ای نام‌گذاری شوند که کاربران صفحه‌خوان بتوانند بخش‌های مختلف را تشخیص دهند.

---

# 7. Keyboard Accessibility

## 7.1. Full Keyboard Support

تمام قابلیت‌های اصلی باید با صفحه‌کلید قابل استفاده باشند.

کلیدهای متداول:

- Tab
- Shift + Tab
- Enter
- Space
- Escape
- Arrow Keys
- Home
- End

## 7.2. Focus Visibility

Focus باید در تمام عناصر تعاملی قابل مشاهده باشد.

حذف Outline بدون جایگزین مناسب ممنوع است.

## 7.3. Focus Order

ترتیب Focus باید با ترتیب منطقی محتوا و جریان کار سازگار باشد.

## 7.4. No Keyboard Trap

کاربر نباید در Modal، منو، نمودار یا کنترل سفارشی گرفتار شود.

## 7.5. Focus Management

پس از عملیات مهم، Focus باید به مکان منطقی منتقل شود.

نمونه:

- باز شدن Dialog
- بسته شدن Dialog
- ارسال فرم
- نمایش خطا
- تغییر صفحه
- حذف یک عنصر
- تکمیل فرآیند سفارش

## 7.6. Skip Navigation

برای صفحات دارای Navigation تکرارشونده، امکان عبور سریع از بخش‌های تکراری SHOULD فراهم شود.

---

# 8. Screen Reader Compatibility

## 8.1. Accessible Names

تمام کنترل‌های تعاملی باید نام قابل تشخیص داشته باشند.

## 8.2. Accessible Description

در صورت نیاز، توضیحات تکمیلی باید به کنترل متصل شوند.

## 8.3. ARIA Usage

ARIA باید برای تکمیل معنای عناصر و کنترل‌های سفارشی استفاده شود، نه جایگزین بی‌دلیل HTML معنایی.

## 8.4. Common ARIA Attributes

نمونه‌های قابل استفاده:

- aria-label
- aria-labelledby
- aria-describedby
- aria-expanded
- aria-controls
- aria-current
- aria-live
- aria-invalid
- aria-required
- aria-hidden

هر Attribute باید با توجه به نقش واقعی عنصر استفاده شود.

## 8.5. Dynamic Updates

تغییرات مهم رابط باید برای فناوری‌های کمکی قابل تشخیص باشند.

نمونه:

- تکمیل بارگذاری
- ثبت موفق فرم
- نمایش خطا
- تغییر وضعیت سفارش
- پایان پردازش علمی
- تغییر نتیجه جست‌وجو

## 8.6. Live Regions

استفاده از `aria-live` باید محدود و هدفمند باشد.

اعلان‌های بیش از حد می‌توانند تجربه صفحه‌خوان را مختل کنند.

---

# 9. Color, Contrast and Visual Accessibility

## 9.1. Color Contrast

هدف پیشنهادی مطابق WCAG 2.2 AA:

| Element | Minimum Contrast Ratio |
|---|---:|
| Normal Text | 4.5:1 |
| Large Text | 3:1 |
| UI Components | 3:1 |
| Meaningful Graphical Objects | 3:1 |

موارد استثنا باید مطابق معیارهای WCAG بررسی شوند.

## 9.2. Color Is Not the Only Signal

اطلاعات نباید فقط با رنگ منتقل شوند.

نمونه نامناسب:

- قرمز = خطا
- سبز = موفقیت

الگوی مطلوب:

- رنگ
- متن
- آیکون یا شکل مناسب
- وضعیت قابل تشخیص برای فناوری کمکی

## 9.3. Brand Palette Compatibility

پالت رنگ برند Eco Nojin باید از نظر کنتراست و دسترس‌پذیری ارزیابی شود.

زیبایی بصری نباید به قیمت کاهش خوانایی تمام شود.

## 9.4. Warm Color Palette

در استفاده از رنگ‌های گرم و پاییزی:

- متن‌های اصلی باید کنتراست کافی داشته باشند.
- رنگ‌های روشن برای متن کوچک روی زمینه روشن استفاده نشوند.
- رنگ طلایی برای متن‌های کم‌حجم فقط پس از آزمون کنتراست استفاده شود.
- رنگ‌های نزدیک به هم برای وضعیت‌های متفاوت کافی نیستند.

## 9.5. Focus Contrast

نشانگر Focus باید از زمینه و عناصر مجاور قابل تشخیص باشد.

---

# 10. Typography and Readability

## 10.1. Font Readability

فونت باید خوانا، دارای پوشش نویسه مناسب و سازگار با زبان باشد.

فونت‌های فارسی مورد بررسی در پروژه:

- فرهنگ
- وزیر
- وزیرمتن
- شبنم
- صمیم
- گندم

این فونت‌ها گزینه‌های بررسی هستند و هیچ‌کدام در این سند نهایی نشده‌اند.

## 10.2. Font Size

اندازه متن باید برای خواندن در شرایط مختلف مناسب باشد.

## 10.3. Line Height

فاصله خطوط باید به‌اندازه کافی باشد.

## 10.4. Text Spacing

کاربر باید بتواند در صورت نیاز فاصله حروف، کلمات، خطوط و پاراگراف‌ها را افزایش دهد، بدون اینکه محتوا یا عملکرد از بین برود.

## 10.5. Long Text

متن‌های علمی، مالی و آموزشی باید دارای:

- تیترهای روشن
- پاراگراف‌های کوتاه
- جدول‌های قابل خواندن
- فاصله مناسب
- تفکیک بصری
- توضیح اصطلاحات تخصصی

باشند.

---

# 11. Persian, RTL and Multilingual Accessibility

## 11.1. Language Declaration

زبان اصلی صفحه باید در HTML مشخص باشد.

نمونه:

```html
<html lang="fa" dir="rtl">
```

## 11.2. RTL Layout

جهت متن و چیدمان باید به‌درستی مدیریت شود.

استفاده از CSS Logical Properties ترجیح داده می‌شود.

## 11.3. Mixed Direction Content

در متن‌های ترکیبی فارسی و لاتین:

- کدها باید جهت مناسب داشته باشند.
- شناسه‌ها نباید جابه‌جا نمایش داده شوند.
- اعداد و واحدها باید خوانا باشند.
- URLها باید رفتار قابل پیش‌بینی داشته باشند.

## 11.4. Bidi Isolation

برای محتوای دارای جهت متفاوت، استفاده از `bdi` یا روش مناسب دیگر قابل بررسی است.

## 11.5. Accessible Number Presentation

اعداد فارسی و لاتین باید در چارچوب سیاست Localization پروژه نمایش داده شوند.

تبدیل خودکار اعداد نباید موجب تغییر شناسه‌ها، کدها یا داده‌های علمی شود.

## 11.6. Calendar Accessibility

تقویم‌ها باید:

- نام روزها داشته باشند.
- ماه و سال را اعلام کنند.
- امکان حرکت با صفحه‌کلید داشته باشند.
- تاریخ انتخاب‌شده را مشخص کنند.
- وضعیت روزهای غیرفعال را توضیح دهند.
- با صفحه‌خوان سازگار باشند.

## 11.7. Language Switching

تغییر زبان باید:

- واضح باشد.
- با صفحه‌کلید قابل استفاده باشد.
- زبان جدید را اعلام کند.
- وضعیت مسیر فعلی را تا حد امکان حفظ کند.
- باعث گم شدن ناخواسته کاربر نشود.

---

# 12. Responsive and Reflow Accessibility

## 12.1. Reflow

محتوا باید در اندازه‌های مختلف صفحه قابل استفاده باشد.

## 12.2. Zoom

صفحات باید در بزرگ‌نمایی‌های موردنیاز WCAG بدون از دست رفتن محتوا یا عملکرد قابل استفاده باشند.

## 12.3. Text Resize

افزایش اندازه متن نباید موجب حذف کنترل‌ها یا هم‌پوشانی جدی محتوا شود.

## 12.4. Responsive Tables

جدول‌های بزرگ باید روش مناسب نمایش در صفحه کوچک داشته باشند.

## 12.5. Horizontal Scrolling

اسکرول افقی برای محتوایی که ذاتاً دوبعدی است، مانند برخی جداول و نقشه‌ها، ممکن است ضروری باشد.

اما نباید به‌صورت غیرضروری به کل صفحه تحمیل شود.

## 12.6. Touch Targets

هدف پیشنهادی WCAG 2.2 AA برای اندازه هدف تعاملی، حداقل 24×24 CSS Pixels است؛ با توجه به استثناها و شرایط معیار مربوط.

برای تجربه بهتر موبایل، اندازه بزرگ‌تر در صورت امکان توصیه می‌شود.

---

# 13. Forms and Input Accessibility

## 13.1. Form Labels

هر ورودی باید Label مشخص داشته باشد.

Placeholder جایگزین Label نیست.

## 13.2. Required Fields

فیلدهای الزامی باید به‌صورت واضح معرفی شوند.

## 13.3. Input Instructions

در صورت نیاز، راهنمای ورود داده باید پیش از ارسال قابل مشاهده باشد.

## 13.4. Error Identification

خطا باید:

- قابل تشخیص باشد.
- به فیلد مرتبط شود.
- فقط با رنگ نشان داده نشود.
- توضیح قابل فهم داشته باشد.
- برای صفحه‌خوان قابل اعلام باشد.

## 13.5. Error Summary

در فرم‌های پیچیده، نمایش خلاصه خطاها در ابتدای فرم قابل بررسی است.

## 13.6. Input Assistance

در صورت امکان:

- AutoComplete مناسب استفاده شود.
- الگوی ورودی توضیح داده شود.
- محدودیت مقدار مشخص باشد.
- از ورود مجدد اطلاعات غیرضروری جلوگیری شود.

## 13.7. Financial Forms

فرم‌های مالی باید:

- واحد پول را مشخص کنند.
- مقدار واردشده را واضح نمایش دهند.
- خطای مبلغ را دقیق مشخص کنند.
- پیش از عملیات حساس خلاصه قابل بررسی ارائه دهند.
- وضعیت عملیات را بدون ابهام نمایش دهند.

---

# 14. Accessible Navigation

## 14.1. Navigation Consistency

منوهای اصلی باید در صفحات مختلف رفتار قابل پیش‌بینی داشته باشند.

## 14.2. Current Location

صفحه یا مسیر فعلی باید به‌صورت قابل تشخیص اعلام شود.

## 14.3. Breadcrumbs

در مسیرهای پیچیده، Breadcrumb قابل بررسی است.

## 14.4. Mobile Navigation

منوی موبایل باید:

- با صفحه‌کلید قابل استفاده باشد.
- وضعیت باز و بسته را اعلام کند.
- Focus را مدیریت کند.
- با لمس قابل استفاده باشد.
- امکان خروج روشن داشته باشد.

## 14.5. Search Accessibility

جست‌وجو باید دارای:

- Label
- وضعیت Loading
- تعداد یا وضعیت نتایج
- پیام نبود نتیجه
- خطاهای قابل فهم
- امکان استفاده با صفحه‌کلید

باشد.

---

# 15. Dialogs, Modals and Popovers

## 15.1. Dialog Requirements

Dialog باید:

- نام قابل تشخیص داشته باشد.
- Focus را به‌درستی مدیریت کند.
- امکان بستن داشته باشد.
- با صفحه‌کلید قابل استفاده باشد.
- پس از بسته شدن Focus را بازگرداند.
- محتوای اصلی را به‌درستی مدیریت کند.

## 15.2. Destructive Actions

برای عملیات حساس، توضیح پیامدها باید روشن باشد.

## 15.3. Confirmation Dialog

تأیید نباید مبهم باشد.

نمونه:

- حذف محصول
- لغو سفارش
- حذف فایل
- تغییر تنظیمات
- تأیید عملیات مدیریتی

## 15.4. Popovers

Popovers باید از نظر Focus، Keyboard Navigation و صفحه‌خوان بررسی شوند.

---

# 16. Motion, Animation and Interaction

## 16.1. Motion Sensitivity

برخی کاربران به حرکت، انیمیشن و افکت‌های بصری حساس هستند.

## 16.2. Reduced Motion

در صورت درخواست سیستم‌عامل یا مرورگر، انیمیشن‌های غیرضروری باید کاهش یابند.

استفاده از `prefers-reduced-motion` توصیه می‌شود.

## 16.3. Auto-Playing Content

محتوای متحرک یا صوتی خودکار باید کنترل‌پذیر باشد.

## 16.4. Flashing Content

محتوای چشمک‌زن خطرناک یا آزاردهنده نباید استفاده شود.

## 16.5. Animation Purpose

انیمیشن باید به فهم وضعیت یا جریان کار کمک کند، نه اینکه مانع استفاده شود.

---

# 17. Audio and Video Accessibility

## 17.1. Captions

ویدئوهای دارای گفتار باید زیرنویس مناسب داشته باشند.

## 17.2. Transcripts

برای محتوای صوتی، متن جایگزین یا Transcript قابل ارائه باشد.

## 17.3. Audio Description

برای محتوای تصویری مهم که بدون توضیح صوتی قابل درک نیست، Audio Description باید بررسی شود.

## 17.4. Media Controls

کنترل‌های پخش، توقف، صدا و زیرنویس باید قابل استفاده باشند.

## 17.5. Automatic Playback

پخش خودکار صدا نباید تجربه کاربر را مختل کند.

---

# 18. Accessible Charts and Scientific Visualizations

این بخش برای HyDroMA اهمیت ویژه دارد.

## 18.1. Chart Semantics

هر نمودار باید دارای:

- عنوان
- توضیح
- محورهای مشخص
- واحدها
- Legend
- محدوده زمانی
- توضیح داده
- وضعیت اعتبار داده

باشد.

## 18.2. Color Independence

دسته‌های نمودار نباید فقط با رنگ متمایز شوند.

استفاده از الگو، شکل، برچسب یا نشانه مناسب باید بررسی شود.

## 18.3. Text Alternative

برای نمودارهای پیچیده، خلاصه متنی یا جدول داده باید فراهم شود.

## 18.4. Keyboard Interaction

در صورت تعاملی بودن نمودار:

- نقاط داده باید قابل دسترسی باشند.
- حرکت بین داده‌ها باید قابل کنترل باشد.
- Focus باید قابل مشاهده باشد.
- Tooltip باید اطلاعات ضروری را منتقل کند.

## 18.5. Scientific Units

واحدهای علمی باید در عنوان محور، Legend یا توضیح مشخص باشند.

## 18.6. Data Status

وضعیت داده باید به‌صورت متنی مشخص شود:

- Observed
- Estimated
- Simulated
- Missing
- Invalid
- Validated

معنای واقعی وضعیت‌ها باید مطابق قرارداد علمی پروژه باشد.

## 18.7. Dense Data

برای نمودارهای دارای داده فراوان، امکان خلاصه‌سازی و دسترسی مرحله‌ای باید بررسی شود.

## 18.8. Alternative Representation

نمودار نباید تنها راه دسترسی به داده باشد.

در صورت امکان، جدول یا خلاصه متنی نیز ارائه شود.

---

# 19. Accessible Maps and Geospatial Interfaces

## 19.1. Map Accessibility

نقشه‌های تعاملی ذاتاً پیچیده هستند و نباید تنها راه دسترسی به اطلاعات مکانی باشند.

## 19.2. Alternative Data Access

در کنار نقشه، در صورت امکان ارائه شود:

- جدول اطلاعات
- فهرست عوارض
- جست‌وجوی مکانی
- خلاصه متنی
- اطلاعات محدوده انتخاب‌شده

## 19.3. Keyboard Navigation

کنترل‌های اصلی نقشه باید با صفحه‌کلید قابل استفاده باشند.

## 19.4. Screen Reader Support

اطلاعات ضروری عوارض باید در قالب قابل خواندن ارائه شوند.

## 19.5. Map Controls

کنترل‌های زیر باید دارای Label باشند:

- Zoom In
- Zoom Out
- Reset View
- Layer Selection
- Basemap Selection
- Search
- Location Selection

## 19.6. Coordinate Accessibility

مختصات باید با ترتیب، واحد و قالب روشن نمایش داده شوند.

## 19.7. Spatial Selection

انتخاب محدوده مکانی نباید تنها به Drag با ماوس وابسته باشد.

در صورت امکان، ورودی جایگزین فراهم شود.

## 19.8. 3D Maps

نمایش سه‌بعدی باید دارای مسیر جایگزین دوبعدی یا متنی برای اطلاعات ضروری باشد.

---

# 20. Accessible Data Tables

## 20.1. Table Structure

جدول‌ها باید دارای Headerهای معنایی باشند.

## 20.2. Captions

برای جدول‌های مهم، عنوان یا توضیح قابل تشخیص ارائه شود.

## 20.3. Complex Tables

در جدول‌های پیچیده، ارتباط Header و Cell باید روشن باشد.

## 20.4. Sorting

وضعیت مرتب‌سازی باید برای فناوری کمکی قابل تشخیص باشد.

## 20.5. Pagination

کنترل صفحات باید دارای نام و وضعیت قابل فهم باشد.

## 20.6. Responsive Tables

در موبایل، ساختار جدول نباید اطلاعات را غیرقابل دسترس کند.

---

# 21. Accessible Financial and Marketplace Workflows

## 21.1. Product Discovery

کاربر باید بتواند محصولات را با صفحه‌کلید و صفحه‌خوان جست‌وجو و مرور کند.

## 21.2. Product Details

اطلاعات ضروری باید بدون اتکا به تصویر قابل دریافت باشند.

## 21.3. Cart

تغییر تعداد، حذف محصول و مشاهده مبلغ باید قابل دسترس باشد.

## 21.4. Checkout

مراحل خرید باید روشن، قابل پیش‌بینی و دارای امکان بازبینی باشند.

## 21.5. Payment Status

وضعیت‌های زیر باید از یکدیگر قابل تشخیص باشند:

- Pending
- Processing
- Successful
- Failed
- Cancelled

معنای نهایی این وضعیت‌ها تابع قرارداد Backend است.

## 21.6. Error Recovery

در صورت خطا در پرداخت یا سفارش:

- پیام واضح ارائه شود.
- کاربر از وضعیت نامشخص آگاه شود.
- از ارسال تکراری ناخواسته جلوگیری شود.
- مسیر پیگیری مشخص باشد.

## 21.7. Financial Tables

اعداد مالی باید با واحد پول، قالب مناسب و خوانایی کافی نمایش داده شوند.

---

# 22. Accessible Scientific Forms and Workflows

## 22.1. Model Input Forms

فرم ورودی مدل باید:

- نام پارامتر
- توضیح
- واحد
- محدوده مجاز
- مقدار فعلی
- خطای اعتبارسنجی

را به‌صورت قابل دسترس نمایش دهد.

## 22.2. Simulation Progress

پیشرفت شبیه‌سازی باید به‌صورت متنی و قابل تشخیص اعلام شود.

## 22.3. Long-Running Jobs

کاربر باید بتواند وضعیت پردازش را بدون وابستگی به انیمیشن یا رنگ درک کند.

## 22.4. Scientific Result

نتیجه نهایی باید همراه با اطلاعات معنایی و توضیح وضعیت اعتبار ارائه شود.

## 22.5. Complex Controls

کنترل‌های تخصصی علمی باید جایگزین‌های ساده‌تر یا راهنمای روشن داشته باشند.

---

# 23. Cognitive Accessibility

## 23.1. Cognitive Load

رابط نباید اطلاعات غیرضروری و تصمیم‌های هم‌زمان بیش از حد به کاربر تحمیل کند.

## 23.2. Consistency

رفتار کنترل‌های مشابه باید تا حد امکان یکسان باشد.

## 23.3. Plain Language

پیام‌های عمومی باید ساده و مستقیم باشند.

## 23.4. Technical Language

اصطلاحات تخصصی HyDroMA باید در صورت نیاز توضیح داده شوند.

## 23.5. Step-by-Step Workflows

فرآیندهای پیچیده باید به مراحل قابل فهم تقسیم شوند.

## 23.6. Error Prevention

در عملیات حساس باید امکان بازبینی و اصلاح خطا فراهم شود.

## 23.7. Memory Burden

کاربر نباید مجبور باشد اطلاعات غیرضروری را از یک مرحله به مرحله دیگر به خاطر بسپارد.

---

# 24. Low Bandwidth and Device Accessibility

## 24.1. Network Conditions

دسترس‌پذیری فقط به توانایی جسمی محدود نیست؛ شرایط اتصال و امکانات دستگاه نیز اهمیت دارند.

## 24.2. Low-Bandwidth Design

- محتوای ضروری اولویت داشته باشد.
- تصاویر حجیم غیرضروری بارگذاری نشوند.
- رابط در زمان تأخیر قابل استفاده بماند.
- وضعیت بارگذاری مشخص باشد.
- خطای شبکه قابل فهم باشد.

## 24.3. Low-End Devices

کامپوننت‌های سنگین باید متناسب با توان دستگاه مدیریت شوند.

## 24.4. Offline Clarity

داده Cache شده باید با وضعیت Offline یا قدیمی مشخص شود.

## 24.5. Reduced Data Mode

در صورت نیاز، امکان کاهش مصرف داده قابل بررسی است.

---

# 25. Accessibility in Authentication

## 25.1. Login Form

فرم ورود باید دارای:

- Labelهای مشخص
- پیام خطای قابل فهم
- مدیریت Focus
- سازگاری صفحه‌خوان
- امکان استفاده با صفحه‌کلید

باشد.

## 25.2. Authentication Assistance

محدودیت‌های امنیتی نباید بی‌دلیل مانع استفاده کاربران دارای معلولیت شوند.

## 25.3. CAPTCHA

در صورت استفاده از CAPTCHA، روش جایگزین دسترس‌پذیر باید بررسی شود.

## 25.4. MFA

فرآیند MFA باید برای کاربران دارای محدودیت‌های مختلف قابل استفاده باشد.

## 25.5. Timeout

در صورت وجود محدودیت زمانی، اطلاع‌رسانی و تمدید مناسب باید بررسی شود.

---

# 26. Accessibility Testing Strategy

## 26.1. Testing Layers

آزمون دسترس‌پذیری باید چندلایه باشد:

1. Automated Testing
2. Manual Keyboard Testing
3. Screen Reader Testing
4. Visual Contrast Testing
5. Responsive Testing
6. Cognitive Usability Review
7. Assistive Technology Testing
8. User Testing

## 26.2. Automated Tools

ابزارهای قابل بررسی:

- axe-core
- Lighthouse
- WAVE
- Accessibility Insights
- Playwright Accessibility Testing
- Storybook Accessibility Addons

این ابزارها گزینه‌های پیشنهادی هستند و هیچ‌کدام انتخاب قطعی نیستند.

## 26.3. Manual Testing

آزمون دستی باید شامل موارد زیر باشد:

- حرکت کامل با Tab
- استفاده از Enter و Space
- بررسی Focus
- بررسی Dialog
- بررسی فرم
- بررسی خطاها
- بررسی صفحه‌خوان
- بررسی Zoom
- بررسی RTL
- بررسی Responsive Layout

## 26.4. Assistive Technologies

در صورت امکان، سازگاری با ابزارهای زیر بررسی شود:

- NVDA
- JAWS
- VoiceOver
- TalkBack
- Browser Zoom
- High Contrast Modes
- Keyboard-Only Navigation

## 26.5. Automated Test Limitations

عبور از آزمون خودکار به‌معنای دسترس‌پذیری کامل نیست.

بخش مهمی از معیارهای WCAG نیازمند ارزیابی انسانی و بررسی تجربه واقعی کاربر است.

---

# 27. Accessibility Defect Management

## 27.1. Severity

طبقه‌بندی پیشنهادی:

| Severity | Description |
|---|---|
| Critical | مانع استفاده از قابلیت اصلی |
| High | مانع جدی برای گروهی از کاربران |
| Medium | دشواری قابل توجه اما دارای راه جایگزین |
| Low | مشکل محدود و قابل اصلاح |
| Informational | پیشنهاد بهبود |

## 27.2. Defect Record

هر مشکل باید شامل موارد زیر باشد:

- Defect ID
- Page / Component
- WCAG Criterion
- User Impact
- Assistive Technology
- Reproduction Steps
- Expected Behavior
- Actual Behavior
- Severity
- Evidence
- Remediation
- Retest Result

## 27.3. Release Gate

مشکلات Critical و High باید پیش از پذیرش نهایی قابلیت تعیین تکلیف شوند.

استثناها نیازمند ثبت ریسک و تأیید مسئول مجاز هستند.

---

# 28. Design System Accessibility Requirements

## 28.1. Accessible Components

کامپوننت‌های پایه باید از ابتدا با دسترس‌پذیری طراحی شوند.

نمونه:

- Button
- Input
- Select
- Checkbox
- Radio
- Switch
- Dialog
- Dropdown
- Tabs
- Tooltip
- Table
- Pagination
- Accordion
- Navigation
- Date Picker

## 28.2. Component Documentation

برای هر کامپوننت مهم باید موارد زیر مشخص باشند:

- Semantic Role
- Keyboard Behavior
- Focus Behavior
- Accessible Name
- Accessible Description
- Error State
- Disabled State
- Loading State
- Screen Reader Behavior

## 28.3. Component-Level Testing

کامپوننت‌های پایه باید آزمون دسترس‌پذیری مستقل داشته باشند.

## 28.4. Design Tokens

توکن‌های رنگ، فاصله، اندازه، Focus و Typography باید قابلیت پشتیبانی از دسترس‌پذیری داشته باشند.

## 28.5. No Accessibility Regression

تغییر Design System نباید بدون آزمون باعث کاهش دسترس‌پذیری صفحات شود.

---

# 29. Accessibility Governance

## 29.1. Ownership

مسئولیت‌های پیشنهادی:

| Role | Responsibility |
|---|---|
| Product Owner | تعیین اولویت دسترس‌پذیری |
| UX Designer | طراحی فراگیر |
| Frontend Developer | پیاده‌سازی صحیح |
| QA Engineer | آزمون |
| Accessibility Reviewer | بررسی تخصصی |
| Project Owner | تصویب سیاست نهایی |

## 29.2. Design Review

طرح صفحات مهم باید پیش از پیاده‌سازی از نظر دسترس‌پذیری بررسی شود.

## 29.3. Development Review

کد کامپوننت‌های تعاملی باید از نظر Semantic HTML، Keyboard و ARIA بازبینی شود.

## 29.4. Release Review

پیش از انتشار، آزمون دسترس‌پذیری باید در فرآیند QA قرار گیرد.

## 29.5. Continuous Improvement

دسترس‌پذیری باید در چرخه نگهداری و توسعه مداوم بررسی شود.

---

# 30. Accessibility Acceptance Criteria

معیارهای پیشنهادی:

| ID | Acceptance Criterion | Required Evidence |
|---|---|---|
| A11Y-001 | ساختار HTML معنایی باشد | Code Review |
| A11Y-002 | Heading Hierarchy منطقی باشد | Accessibility Audit |
| A11Y-003 | تمام کنترل‌ها نام قابل تشخیص داشته باشند | Screen Reader Test |
| A11Y-004 | عملکرد اصلی با صفحه‌کلید ممکن باشد | Keyboard Test |
| A11Y-005 | Focus قابل مشاهده باشد | Visual Test |
| A11Y-006 | Keyboard Trap وجود نداشته باشد | Manual Test |
| A11Y-007 | ترتیب Focus منطقی باشد | Keyboard Test |
| A11Y-008 | کنتراست متن مطابق هدف AA باشد | Contrast Report |
| A11Y-009 | رنگ تنها نشانه انتقال اطلاعات نباشد | Visual Review |
| A11Y-010 | تصاویر معنادار دارای Text Alternative باشند | Content Audit |
| A11Y-011 | فرم‌ها Label صحیح داشته باشند | Form Test |
| A11Y-012 | خطاها قابل تشخیص و مرتبط با فیلد باشند | Form Test |
| A11Y-013 | تغییرات پویا قابل اعلام باشند | Screen Reader Test |
| A11Y-014 | Dialogها Focus را مدیریت کنند | Interaction Test |
| A11Y-015 | Zoom باعث از دست رفتن عملکرد نشود | Zoom Test |
| A11Y-016 | صفحات در اندازه کوچک قابل استفاده باشند | Responsive Test |
| A11Y-017 | زبان و جهت صفحه مشخص باشند | DOM Inspection |
| A11Y-018 | RTL و LTR درست نمایش داده شوند | Localization Test |
| A11Y-019 | نمودارها جایگزین متنی داشته باشند | Chart Audit |
| A11Y-020 | نقشه‌ها مسیر دسترسی جایگزین داشته باشند | Map Accessibility Test |
| A11Y-021 | جداول دارای ساختار معنایی باشند | Table Audit |
| A11Y-022 | فرآیند پرداخت قابل استفاده باشد | Marketplace UX Test |
| A11Y-023 | وضعیت شبیه‌سازی متنی و قابل تشخیص باشد | HyDroMA Test |
| A11Y-024 | Reduced Motion رعایت شود | Motion Test |
| A11Y-025 | محتوای ویدئویی زیرنویس مناسب داشته باشد | Media Review |
| A11Y-026 | صفحه‌خوان‌های منتخب بررسی شوند | Assistive Technology Test |
| A11Y-027 | ابزارهای خودکار اجرا شوند | Automated Test Report |
| A11Y-028 | Defectهای Critical تعیین تکلیف شوند | Defect Register |
| A11Y-029 | کامپوننت‌های پایه آزمون شوند | Component Test Report |
| A11Y-030 | ادعای انطباق دارای شواهد باشد | Accessibility Audit |

## 30.1. Acceptance Rule

انطباق دسترس‌پذیری فقط با مجموعه‌ای از آزمون‌های خودکار، دستی، فناوری‌های کمکی و بررسی تجربه کاربر قابل ارزیابی است.

عبور از یک ابزار یا یک صفحه، معادل انطباق کامل محصول نیست.

---

# 31. Risk Register

| Risk ID | Risk | Impact | Proposed Control |
|---|---|---|---|
| A11Y-R01 | Missing Semantic HTML | اختلال صفحه‌خوان | Semantic Review |
| A11Y-R02 | Keyboard Inaccessibility | عدم امکان استفاده | Keyboard Testing |
| A11Y-R03 | Poor Contrast | کاهش خوانایی | Contrast Audit |
| A11Y-R04 | Color-Only Indicators | سوءبرداشت وضعیت | Redundant Signals |
| A11Y-R05 | Inaccessible Charts | عدم دسترسی به داده علمی | Text Alternatives |
| A11Y-R06 | Inaccessible Maps | محدودیت تحلیل مکانی | Alternative Data Views |
| A11Y-R07 | Complex Financial Forms | افزایش خطای کاربر | Form Simplification |
| A11Y-R08 | RTL/LTR Issues | اختلال خوانایی | Bidi Testing |
| A11Y-R09 | Excessive Motion | ناراحتی کاربران | Reduced Motion |
| A11Y-R10 | Poor Screen Reader Support | حذف اطلاعات مهم | Assistive Testing |
| A11Y-R11 | Unclear Error Messages | ناتوانی در اصلاح خطا | Error Design |
| A11Y-R12 | Small Touch Targets | دشواری تعامل موبایل | Touch Target Review |
| A11Y-R13 | Inaccessible Authentication | محدودیت ورود | Accessible Auth |
| A11Y-R14 | Accessibility Regression | کاهش کیفیت در نسخه‌های بعدی | CI and Regression Testing |

---

# 32. Open Decisions

| Decision ID | Decision | Status |
|---|---|---|
| A11Y-D01 | تصویب WCAG 2.2 AA به‌عنوان هدف رسمی | OPEN |
| A11Y-D02 | انتخاب ابزار آزمون خودکار | OPEN |
| A11Y-D03 | تعیین مرورگرهای هدف | OPEN |
| A11Y-D04 | تعیین فناوری‌های کمکی هدف | OPEN |
| A11Y-D05 | انتخاب استاندارد مستندسازی کامپوننت‌ها | OPEN |
| A11Y-D06 | تعیین مسئول رسمی Accessibility Review | OPEN |
| A11Y-D07 | تعیین فرآیند ارزیابی دوره‌ای | OPEN |
| A11Y-D08 | تعیین سیاست دسترس‌پذیری نقشه‌ها | OPEN |
| A11Y-D09 | تعیین سیاست دسترس‌پذیری نمودارها | OPEN |
| A11Y-D10 | تعیین سیاست زیرنویس و محتوای چندرسانه‌ای | OPEN |
| A11Y-D11 | تعیین سیاست اندازه Touch Target | OPEN |
| A11Y-D12 | تعیین زبان‌ها و فناوری‌های کمکی هدف | OPEN |
| A11Y-D13 | تعیین سطح آزمون دستی | OPEN |
| A11Y-D14 | تعیین فرآیند پذیرش استثناهای دسترس‌پذیری | OPEN |
| A11Y-D15 | تعیین سیاست ارزیابی کاربران واقعی | OPEN |

---

# 33. Implementation Restrictions

تا زمان تصویب سیاست دسترس‌پذیری:

1. هیچ کامپوننت تعاملی بدون بررسی Keyboard منتشر نشود.
2. هیچ اطلاعات مهمی صرفاً با رنگ نمایش داده نشود.
3. هیچ نمودار مهمی بدون مسیر جایگزین دسترسی به داده طراحی نشود.
4. هیچ نقشه‌ای تنها راه دسترسی به اطلاعات مکانی باشد.
5. هیچ فرم مهمی بدون Label و مدیریت خطا منتشر نشود.
6. هیچ Dialog بدون مدیریت Focus پیاده‌سازی نشود.
7. هیچ انیمیشن غیرضروری بدون بررسی Reduced Motion استفاده نشود.
8. هیچ فونتی صرفاً بر اساس زیبایی بصری انتخاب نشود.
9. هیچ ادعای WCAG Compliance بدون شواهد مطرح نشود.
10. هیچ مشکل Critical دسترس‌پذیری بدون تعیین تکلیف پذیرفته نشود.

---

# 34. Definition of Done

این استاندارد زمانی در سطح اجرایی قابل پذیرش است که:

- هدف دسترس‌پذیری تصویب شده باشد.
- ساختار معنایی صفحات بررسی شده باشد.
- تعامل صفحه‌کلید آزموده شده باشد.
- صفحه‌خوان‌های منتخب بررسی شده باشند.
- کنتراست رنگ ارزیابی شده باشد.
- فرم‌ها و پیام‌های خطا بررسی شده باشند.
- RTL و LTR آزموده شده باشند.
- نمودارها و نقشه‌ها دارای مسیرهای دسترسی مناسب باشند.
- صفحات مالی و علمی بررسی شده باشند.
- Responsive و Zoom آزموده شده باشند.
- انیمیشن‌ها از نظر Reduced Motion بررسی شده باشند.
- آزمون‌های خودکار و دستی اجرا شده باشند.
- Defectهای مهم تعیین تکلیف شده باشند.
- شواهد آزمون ثبت شده باشند.
- تأیید مسئول مجاز اخذ شده باشد.

---

# 35. References and Standards

مراجع پیشنهادی:

1. W3C — Web Content Accessibility Guidelines (WCAG) 2.2
2. W3C — Web Accessibility Initiative (WAI)
3. W3C — Accessible Rich Internet Applications (WAI-ARIA)
4. W3C — ARIA Authoring Practices Guide
5. W3C — Understanding WCAG 2.2
6. W3C — Techniques for WCAG 2.2
7. W3C — Web Accessibility Tutorials
8. W3C — Accessible Name and Description Computation
9. MDN — Accessibility Documentation
10. Section 508 Standards — Reference for applicable accessibility requirements

استفاده از این منابع به‌معنای تأیید حقوقی یا فنی انطباق پروژه با آن‌ها نیست.

---

# 36. Final Governance Statement

دسترس‌پذیری یک ویژگی تزئینی یا مرحله پایانی طراحی نیست؛ بخشی از کیفیت معماری، تجربه کاربری و مهندسی فرانت‌اند است.

در اکوسیستم Eco Nojin، کاربران ممکن است با دستگاه‌ها، زبان‌ها، توانایی‌ها و شرایط ارتباطی متفاوت از محصولات استفاده کنند.

بنابراین طراحی باید به‌گونه‌ای باشد که دسترسی به اطلاعات علمی، خدمات اقتصادی، امکانات اجتماعی و فرآیندهای مدیریتی به یک نوع تعامل یا یک شرایط خاص محدود نشود.

**Accessibility Principle:**

Every essential function and information must have an accessible path of interaction or an appropriate alternative representation.

**Document Status: DRAFT — PROPOSED — NOT APPROVED**

**Approval Authority: Project Owner**

**End of Document**