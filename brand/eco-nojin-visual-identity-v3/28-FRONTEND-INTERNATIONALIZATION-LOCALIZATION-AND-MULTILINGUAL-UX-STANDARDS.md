# 28. Frontend Internationalization, Localization and Multilingual UX Standards

## Eco Nojin Ecosystem
### Internationalization Architecture, Localization Engineering, RTL/LTR, Multilingual Content and Cross-Cultural User Experience

| مشخصه | مقدار |
|---|---|
| Document ID | EN-VIS-028 |
| Document Name | Frontend Internationalization, Localization and Multilingual UX Standards |
| Version | 1.0.0 |
| Status | DRAFT — PROPOSED — NOT APPROVED |
| Classification | Internal Technical Standard |
| Scope | Eco Nojin, HyDroMA, Nojin Marketplace |
| Document Owner | Eco Nojin |
| Approval Authority | Project Owner |
| Created | 2026-11-17 |

---

# 1. Purpose

این سند استانداردهای فنی و تجربه کاربری برای طراحی و پیاده‌سازی یک معماری چندزبانه در اکوسیستم Eco Nojin را تعریف می‌کند.

هدف، ایجاد زیرساختی است که سه محصول بتوانند با زبان‌ها، خط‌ها، تقویم‌ها، قالب‌های عددی، واحدها و قراردادهای فرهنگی متفاوت کار کنند؛ بدون اینکه منطق اصلی نرم‌افزار به زبان خاصی وابسته شود.

دامنه این سند شامل موارد زیر است:

- Internationalization (i18n).
- Localization (l10n).
- RTL/LTR Layout.
- Language and Locale Management.
- Multilingual Content.
- Translation Architecture.
- Number and Date Formatting.
- Calendar Systems.
- Currency and Measurement Formatting.
- Scientific Terminology Localization.
- Map and Chart Localization.
- Accessibility in Multilingual Interfaces.
- Localization Testing.
- Translation Governance.

## 1.1. تفاوت Internationalization و Localization

**Internationalization (i18n):**

طراحی نرم‌افزار به‌گونه‌ای که پشتیبانی از زبان‌ها و فرهنگ‌های مختلف بدون بازطراحی معماری امکان‌پذیر باشد.

**Localization (l10n):**

تطبیق رابط، محتوا، قالب‌ها و تجربه کاربری با زبان و تنظیمات منطقه‌ای مشخص.

این دو مفهوم باید در معماری از یکدیگر تفکیک شوند.

## 1.2. هدف محصولی

Eco Nojin باید از نظر معماری قابلیت توسعه بین‌المللی داشته باشد؛ اما پشتیبانی عملیاتی از هر زبان یا منطقه باید پس از بررسی ترجمه، محتوا، حقوق، واحدها و الزامات محلی تأیید شود.

چندزبانه بودن رابط به‌تنهایی به‌معنای آمادگی کامل برای ورود به بازار یک کشور نیست.

---

# 2. Core Internationalization Principles

## 2.1. Language Independence

منطق تجاری، علمی و مالی نباید به زبان رابط وابسته باشد.

نمونه نامناسب:

```javascript
if (language === "فارسی") {
  calculateWaterBalance();
}
```

نمونه مناسب:

```javascript
calculateWaterBalance();
```

زبان فقط در لایه Presentation و Localization اعمال می‌شود.

## 2.2. Locale Independence

محاسبات داخلی نباید به قالب نمایشی تاریخ، عدد یا واحد وابسته باشند.

برای مثال:

- تاریخ ذخیره‌شده با قالب نمایشی تاریخ متفاوت است.
- مقدار عددی با جداکننده هزارگان متفاوت است.
- مقدار پولی با نماد و قالب نمایشی متفاوت است.
- مقدار فیزیکی با نحوه نمایش آن متفاوت است.

## 2.3. Content Separation

متن رابط نباید به‌صورت پراکنده در کدهای Component نوشته شود.

متن‌ها باید در منابع ترجمه و Content Registry نگهداری شوند.

## 2.4. Logical Layout

چیدمان باید تا حد امکان از CSS Logical Properties استفاده کند.

به‌جای وابستگی به `left` و `right`، از مفاهیمی مانند موارد زیر استفاده شود:

- `margin-inline-start`
- `margin-inline-end`
- `padding-inline-start`
- `padding-inline-end`
- `inset-inline-start`
- `inset-inline-end`
- `border-inline-start`

## 2.5. Stable Technical Identifiers

شناسه‌های فنی، API Fields، Database Keys و Event Names نباید ترجمه شوند.

نمونه:

```text
water_balance
soil_moisture
carbon_stock
simulation_status
order_reference
```

این شناسه‌ها مستقل از زبان رابط باقی می‌مانند.

---

# 3. Language Strategy

## 3.1. Language Architecture

معماری باید امکان تعریف زبان‌های متعدد را داشته باشد.

زبان‌ها باید از طریق Registry مدیریت شوند، نه با شرط‌های پراکنده در Componentها.

نمونه ساختار پیشنهادی:

```json
{
  "supportedLocales": [
    {
      "locale": "fa-IR",
      "language": "fa",
      "direction": "rtl",
      "status": "candidate"
    },
    {
      "locale": "en",
      "language": "en",
      "direction": "ltr",
      "status": "candidate"
    }
  ],
  "defaultLocale": "fa-IR",
  "fallbackLocale": "en"
}
```

این نمونه، ساختار پیشنهادی است و زبان پیش‌فرض نهایی را تصویب نمی‌کند.

## 3.2. Initial Language Candidates

زبان‌های زیر می‌توانند در بررسی اولیه قرار گیرند:

| Language | Locale Candidate | Direction |
|---|---|---|
| Persian | fa-IR | RTL |
| English | en | LTR |
| Arabic | ar | RTL |
| Turkish | tr | LTR |
| Russian | ru | LTR |
| French | fr | LTR |
| Spanish | es | LTR |

این فهرست صرفاً مجموعه گزینه‌های اولیه است.

پشتیبانی از هر زبان به تأیید کیفیت ترجمه، منابع انسانی، نیاز بازار و الزامات محلی وابسته است.

## 3.3. Language Registry

برای هر زبان باید اطلاعات زیر مشخص باشد:

- Language Code.
- Locale Identifier.
- Text Direction.
- Display Name.
- Native Display Name.
- Font Configuration.
- Numbering System.
- Calendar Preference.
- Translation Status.
- Completion Percentage.
- Review Status.

## 3.4. Language Selection

انتخاب زبان می‌تواند از طریق موارد زیر انجام شود:

- انتخاب دستی کاربر.
- تنظیمات حساب کاربری.
- تنظیمات مرورگر، در صورت مجاز بودن.
- تنظیمات اولیه سیستم.

انتخاب خودکار زبان نباید مانع تغییر دستی آن شود.

## 3.5. Language Persistence

انتخاب زبان باید مطابق معماری احراز هویت و مدیریت تنظیمات ذخیره شود.

در صورت وجود حساب کاربری، ترجیح زبانی می‌تواند در پروفایل کاربر ذخیره شود.

برای کاربران مهمان، روش نگهداری باید با سیاست حریم خصوصی و معماری Storage سازگار باشد.

---

# 4. Translation Architecture

## 4.1. Translation Resource Structure

ساختار ترجمه باید ماژولار باشد.

ساختار پیشنهادی:

```text
locales/
  fa-IR/
    common.json
    navigation.json
    authentication.json
    dashboard.json
    scientific.json
    marketplace.json
    finance.json
    tourism.json
    errors.json
    accessibility.json

  en/
    common.json
    navigation.json
    authentication.json
    dashboard.json
    scientific.json
    marketplace.json
    finance.json
    tourism.json
    errors.json
    accessibility.json
```

این ساختار نمونه است و نباید بدون بررسی معماری واقعی پروژه به‌عنوان ساختار قطعی تحمیل شود.

## 4.2. Translation Keys

کلیدها باید:

- معنایی باشند.
- مستقل از متن ترجمه باشند.
- دارای Namespace باشند.
- قابل استفاده مجدد باشند.
- با تغییر ترجمه ثابت بمانند.

نمونه:

```json
{
  "navigation": {
    "dashboard": "داشبورد",
    "marketplace": "بازارگاه"
  },
  "scientific": {
    "waterBalance": "تراز آب",
    "soilMoisture": "رطوبت خاک"
  }
}
```

## 4.3. Avoid Positional Keys

ساختار نامناسب:

```json
{
  "text1": "داشبورد",
  "text2": "بازارگاه"
}
```

ساختار معنایی ترجیح دارد.

## 4.4. Missing Translation Handling

اگر ترجمه یک کلید موجود نباشد:

1. سیستم باید Locale Fallback مشخص داشته باشد.
2. خطای Missing Translation قابل شناسایی باشد.
3. در Development هشدار نمایش داده شود.
4. در Production از نمایش کلید خام به کاربر جلوگیری شود، مگر در شرایط تشخیصی کنترل‌شده.
5. وضعیت ترجمه ناقص در گزارش کیفیت ثبت شود.

## 4.5. Translation Interpolation

برای نمایش متغیرها از سازوکار امن Interpolation استفاده شود.

نمونه:

```text
سلام {name}
```

مقادیر متغیر نباید با Concatenation غیرقابل کنترل وارد متن شوند.

## 4.6. Pluralization

قواعد جمع و مفرد باید براساس قواعد زبان مقصد مدیریت شوند.

فرض یکسان بودن قواعد جمع در زبان‌ها مجاز نیست.

---

# 5. RTL and LTR Architecture

## 5.1. Direction Management

جهت رابط باید براساس Locale فعال تعیین شود.

نمونه:

```html
<html lang="fa-IR" dir="rtl">
```

برای زبان انگلیسی:

```html
<html lang="en" dir="ltr">
```

تغییر زبان باید Direction را نیز به‌صورت سازگار تغییر دهد.

## 5.2. CSS Logical Properties

استفاده از Logical Properties در طراحی جدید الزامی پیشنهادی است.

نمونه:

```css
.card {
  padding-inline: 1.25rem;
  margin-inline-start: 1rem;
  border-inline-start: 1px solid var(--border-color);
}
```

استفاده گسترده از `margin-left` و `margin-right` در Componentهای چندزبانه باید کاهش یابد.

## 5.3. Component Direction Awareness

Componentهای زیر باید RTL/LTR را به‌درستی پشتیبانی کنند:

- Navigation.
- Header.
- Sidebar.
- Breadcrumb.
- Form.
- Modal.
- Dropdown.
- Tabs.
- Table.
- Pagination.
- Tooltip.
- Notification.
- Card.
- Chart.
- Map Controls.

## 5.4. Directional Icons

آیکون‌هایی که جهت معنایی دارند باید براساس Direction بررسی شوند.

نمونه:

- Back.
- Forward.
- Previous.
- Next.
- Breadcrumb Arrow.
- Text Alignment.
- Directional Navigation.

اما آیکون‌هایی مانند موارد زیر نباید بدون دلیل معکوس شوند:

- Search.
- Settings.
- Location Marker.
- Calendar.
- Download.
- Scientific Symbols.

## 5.5. Bidirectional Text

متن‌هایی که شامل فارسی و انگلیسی، عدد، کد یا شناسه هستند باید با الگوریتم Unicode Bidirectional و در صورت نیاز با `dir="auto"` یا `<bdi>` مدیریت شوند.

نمونه:

```html
<p>
  شناسه مدل:
  <bdi>HYDROMA-MODEL-2026-001</bdi>
</p>
```

برای مقادیر فنی، شناسه‌ها، کدها و مسیر فایل‌ها نباید ترتیب بصری را صرفاً با افزودن فاصله یا کاراکترهای نامرئی اصلاح کرد.

## 5.6. Mixed Direction Forms

در فرم‌های RTL، ورودی‌های زیر ممکن است به LTR نیاز داشته باشند:

- Email.
- URL.
- IPv4 / IPv6.
- API Key.
- Technical Identifier.
- Decimal Number.
- Coordinate.
- Scientific Formula.

جهت هر فیلد باید براساس نوع داده تعیین شود، نه فقط جهت کلی صفحه.

---

# 6. Typography and Font Localization

## 6.1. Font Requirements

فونت‌ها باید برای زبان مقصد مناسب باشند.

معیارهای انتخاب:

- پوشش کامل حروف.
- پشتیبانی از اعداد.
- خوانایی در اندازه کوچک.
- وزن‌های مناسب.
- کیفیت نمایش در مرورگر.
- عملکرد مناسب در موبایل.
- مجوز استفاده و توزیع.
- حجم فایل.
- کیفیت نمایش علائم علمی.

## 6.2. Persian Font Evaluation

فونت‌های زیر برای بررسی و مقایسه پیشنهاد می‌شوند:

- فرهنگ.
- وزیر.
- وزیرمتن.
- شبنم.
- صمیم.
- گندم.

هیچ‌کدام در این سند به‌عنوان فونت نهایی تصویب نمی‌شوند.

## 6.3. Latin Font Evaluation

گزینه‌های اولیه:

- Manrope.
- DM Sans.
- Nunito Sans.
- Lora.
- Source Serif 4.
- Roboto.
- Open Sans.

انتخاب نهایی باید با هویت بصری و کاربرد هر محصول سازگار باشد.

## 6.4. Font Pairing

ترکیب فونت فارسی و لاتین باید از نظر موارد زیر ارزیابی شود:

- ارتفاع حروف.
- وزن بصری.
- فاصله خطوط.
- تناسب اندازه.
- خوانایی.
- شخصیت بصری.

فونت‌های سه محصول می‌توانند شخصیت مستقل داشته باشند، اما باید با خانواده بصری Eco Nojin سازگار باشند.

## 6.5. Font Fallback

برای هر زبان باید Fallback مناسب تعریف شود.

در صورت بارگذاری ناموفق فونت، متن نباید نامرئی یا غیرقابل خواندن شود.

## 6.6. Font Subsetting

در صورت امکان می‌توان از Font Subsetting استفاده کرد تا فقط Glyphهای موردنیاز بارگذاری شوند.

این اقدام باید پس از آزمون پوشش کامل حروف و علائم انجام شود.

---

# 7. Numbers, Numerals and Formatting

## 7.1. Internal Numeric Representation

مقادیر عددی باید مستقل از نحوه نمایش ذخیره و پردازش شوند.

برای مثال:

```text
Internal value: 1234567.89
```

نمایش می‌تواند براساس Locale تغییر کند.

## 7.2. Digit Systems

سیستم باید میان موارد زیر تفاوت قائل شود:

- Latin Digits: 0–9.
- Persian Digits: ۰–۹.
- Arabic-Indic Digits: ٠–٩.

نوع نمایش باید براساس Locale و نیاز محصول تعیین شود.

## 7.3. Number Formatting

قالب‌بندی اعداد باید از استانداردهای Locale-aware استفاده کند.

نمونه:

```javascript
const formatter = new Intl.NumberFormat("fa-IR");

formatter.format(1234567.89);
```

## 7.4. Decimal Integrity

تغییر شکل نمایشی عدد نباید مقدار واقعی را تغییر دهد.

در حوزه مالی، مقادیر پولی باید با قواعد دقیق محاسبات مالی و Decimal Handling مدیریت شوند.

## 7.5. Scientific Precision

در HyDroMA:

- دقت عددی باید از منطق علمی پیروی کند.
- تعداد ارقام نمایشی نباید به‌اشتباه دقت مدل را نشان دهد.
- مقدار گرد‌شده نباید جایگزین مقدار محاسباتی شود.
- Precision و Significant Figures باید از هم تفکیک شوند.

## 7.6. Numeric Input Parsing

ورودی عددی باید بتواند ارقام مجاز را مطابق سیاست محصول پردازش کند.

تبدیل ارقام فارسی، عربی و لاتین باید کنترل‌شده باشد.

ورودی نامعتبر نباید به مقدار صفر تبدیل شود.

---

# 8. Date, Time and Calendar Localization

## 8.1. Internal Date Representation

تاریخ و زمان باید با یک قرارداد داخلی پایدار مدیریت شوند.

پیشنهاد:

- Timestampهای زمانی در UTC ذخیره شوند.
- زمان محلی در لایه Presentation اعمال شود.
- Calendar System از Storage مستقل باشد.

## 8.2. Calendar Systems

سیستم ممکن است به تقویم‌های زیر نیاز داشته باشد:

- Gregorian.
- Persian.
- Islamic Hijri.

پشتیبانی از هر تقویم باید براساس نیاز محصول و صحت پیاده‌سازی بررسی شود.

## 8.3. Persian Calendar

برای کاربران فارسی‌زبان، نمایش تاریخ شمسی می‌تواند گزینه مهمی باشد.

نمونه:

```javascript
new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric"
});
```

این نمونه وابسته به پشتیبانی محیط اجرایی از Intl است و باید در مرورگرهای هدف آزمون شود.

## 8.4. Date Picker

Date Picker باید:

- تقویم انتخاب‌شده را مشخص کند.
- امکان تشخیص تاریخ معتبر را فراهم کند.
- تبدیل تاریخ را دقیق انجام دهد.
- در RTL و LTR درست نمایش داده شود.
- در ورودی و خروجی با قرارداد Backend سازگار باشد.

## 8.5. Time Zones

زمان رخدادهای علمی، مالی و عملیاتی باید با منطقه زمانی روشن نمایش داده شود.

برای عملیات زمان‌مند:

- Time Zone باید مشخص باشد.
- Timestamp خام نباید با زمان محلی اشتباه گرفته شود.
- تغییر ساعت تابستانی در مناطق مربوطه باید بررسی شود.

## 8.6. Date Ambiguity

نمایش تاریخ‌هایی مانند `03/04/2026` بدون مشخص بودن قالب منطقه‌ای توصیه نمی‌شود.

در موارد حساس، نام ماه یا قالب بدون ابهام استفاده شود.

---

# 9. Currency and Financial Localization

## 9.1. Currency Identity

نماد پول به‌تنهایی برای تعیین ارز کافی نیست.

کد استاندارد ارز باید مشخص باشد.

نمونه:

- IRR.
- USD.
- EUR.
- TRY.

## 9.2. Currency Formatting

نمایش ارز باید با Locale سازگار باشد.

نمونه:

```javascript
new Intl.NumberFormat("fa-IR", {
  style: "currency",
  currency: "IRR"
});
```

## 9.3. Financial Data Integrity

Localization نباید:

- مقدار ذخیره‌شده را تغییر دهد.
- واحد پول را حدس بزند.
- تبدیل ارز خودکار انجام دهد.
- گردکردن محاسباتی غیرمجاز ایجاد کند.
- واحدهای پولی متفاوت را با هم ادغام کند.

## 9.4. Exchange Rate Separation

نرخ تبدیل ارز باید از منبع معتبر دریافت شود.

قالب‌بندی ارز با تبدیل ارز متفاوت است.

---

# 10. Measurement Units and Scientific Localization

## 10.1. Unit Identity

واحدهای علمی باید مستقل از زبان رابط ذخیره شوند.

نمونه:

- m.
- km.
- mm.
- m³.
- ha.
- kg.
- °C.
- kPa.

## 10.2. Unit Display

نام یا نماد واحد می‌تواند براساس زبان و استاندارد علمی نمایش داده شود.

## 10.3. SI Compliance

در حوزه‌های علمی، رعایت قراردادهای استاندارد SI باید در اولویت باشد.

نماد واحد نباید به‌صورت دلخواه ترجمه یا تغییر داده شود.

## 10.4. Unit Conversion

تبدیل واحد باید در لایه علمی یا محاسباتی معتبر انجام شود، نه در منطق ترجمه رابط.

## 10.5. HyDroMA Scientific Terminology

واژگان تخصصی باید در یک واژه‌نامه کنترل‌شده نگهداری شوند.

نمونه:

| English Term | Persian Term |
|---|---|
| Soil Moisture | رطوبت خاک |
| Water Balance | تراز آب |
| Evapotranspiration | تبخیر و تعرق |
| Groundwater | آب زیرزمینی |
| Soil Organic Carbon | کربن آلی خاک |
| Vegetation Index | شاخص پوشش گیاهی |
| Uncertainty | عدم قطعیت |
| Spatial Resolution | قدرت تفکیک مکانی |
| Temporal Resolution | قدرت تفکیک زمانی |
| Runoff | رواناب |
| Infiltration | نفوذ |
| Soil Salinity | شوری خاک |

این جدول واژه‌نامه اولیه است و باید توسط متخصصان موضوعی بازبینی شود.

## 10.6. Scientific Notation

فرمول‌ها، نمادها و معادلات علمی نباید تحت تأثیر ترجمه یا RTL تغییر معنا دهند.

---

# 11. Content Localization

## 11.1. Content Separation

محتوای ثابت رابط باید از محتوای پویا و داده‌های Backend تفکیک شود.

## 11.2. Multilingual Content Model

برای محتوای چندزبانه می‌توان ساختاری مشابه زیر در نظر گرفت:

```json
{
  "content_id": "content-001",
  "translations": {
    "fa-IR": {
      "title": "مدیریت پایدار سرزمین",
      "description": "توضیحات فارسی"
    },
    "en": {
      "title": "Sustainable Landscape Management",
      "description": "English description"
    }
  }
}
```

این مدل صرفاً نمونه است و ساختار نهایی باید با مدل محتوای Backend سازگار باشد.

## 11.3. Translation Completeness

هر محتوای چندزبانه باید وضعیت ترجمه داشته باشد:

- NOT_TRANSLATED.
- TRANSLATION_IN_PROGRESS.
- TRANSLATED.
- REVIEW_PENDING.
- APPROVED.
- PUBLISHED.

## 11.4. Fallback Content

در صورت نبود ترجمه:

- زبان جایگزین باید مشخص باشد.
- محتوای جایگزین نباید به‌اشتباه محتوای ترجمه‌شده معرفی شود.
- زبان واقعی محتوا باید قابل تشخیص باشد.

## 11.5. Cultural Adaptation

Localization فقط ترجمه واژه‌ها نیست.

موارد زیر نیز باید بررسی شوند:

- مثال‌ها.
- قالب تاریخ.
- واحدهای رایج.
- تصاویر.
- رنگ‌ها.
- اصطلاحات محلی.
- شیوه خطاب.
- قراردادهای فرهنگی.

---

# 12. Search and Sorting Localization

## 12.1. Search

جست‌وجوی چندزبانه باید موارد زیر را بررسی کند:

- Unicode Normalization.
- تفاوت حروف عربی و فارسی.
- نیم‌فاصله.
- علائم نگارشی.
- ارقام فارسی و لاتین.
- تفاوت حروف بزرگ و کوچک در زبان‌های مربوط.
- ترتیب واژه‌ها.

## 12.2. Persian Text Normalization

در جست‌وجوی فارسی، تفاوت‌هایی مانند موارد زیر باید بررسی شوند:

- ي و ی.
- ك و ک.
- فاصله و نیم‌فاصله.
- اشکال مختلف اعداد.

Normalization باید در لایه مناسب انجام شود و نباید متن اصلی کاربر را بدون ضرورت تغییر دهد.

## 12.3. Sorting

مرتب‌سازی رشته‌ها باید با Collation مناسب زبان مقصد انجام شود.

استفاده از مرتب‌سازی ساده Unicode برای همه زبان‌ها کافی نیست.

---

# 13. Charts, Maps and Scientific Visualization

## 13.1. Chart Localization

نمودارها باید موارد زیر را پشتیبانی کنند:

- عنوان چندزبانه.
- محورهای چندزبانه.
- Tooltip.
- Legend.
- قالب عددی.
- واحد اندازه‌گیری.
- قالب تاریخ.
- جهت نوشتار مناسب.

## 13.2. Axis Direction

RTL بودن صفحه الزاماً به‌معنای معکوس شدن محورهای نمودار نیست.

جهت محور باید تابع معنای داده باشد.

برای مثال، محور زمان نباید صرفاً به‌دلیل RTL بودن رابط معکوس شود.

## 13.3. Scientific Symbols

نمادهای علمی و واحدها باید مطابق قراردادهای علمی نمایش داده شوند، حتی اگر متن اطراف آن‌ها RTL باشد.

## 13.4. Map Localization

نقشه‌ها باید در صورت نیاز موارد زیر را پشتیبانی کنند:

- نام مکان‌ها.
- زبان Labelها.
- جهت کنترل‌ها.
- قالب مختصات.
- واحد فاصله.
- مقیاس.
- Legend.

## 13.5. Coordinate Integrity

مختصات جغرافیایی نباید صرفاً برای زیبایی رابط تغییر ترتیب یا مقدار دهند.

ترتیب محورهای مختصات باید مطابق قرارداد فنی مشخص باشد.

## 13.6. Exported Reports

گزارش‌های PDF، CSV، Excel و سایر خروجی‌ها باید زبان و قالب منطقه‌ای مشخص داشته باشند.

خروجی داده خام باید از خروجی نمایشی تفکیک شود.

---

# 14. Accessibility and Multilingual UX

## 14.1. Language Metadata

زبان هر صفحه باید در HTML مشخص باشد.

## 14.2. Screen Readers

متن‌های جایگزین، Labelها و پیام‌های خطا باید به زبان مناسب ارائه شوند.

## 14.3. Direction-Aware Accessibility

ترتیب Focus و Navigation نباید صرفاً براساس جهت بصری تغییر کند.

## 14.4. Language Switching

تغییر زبان نباید باعث موارد زیر شود:

- از دست رفتن فرم.
- خروج ناخواسته کاربر.
- حذف داده واردشده.
- بازنشانی غیرضروری داشبورد.
- تغییر ناخواسته فیلترها.

## 14.5. WCAG

آزمون دسترس‌پذیری باید با توجه به WCAG 2.2 انجام شود.

---

# 15. Localization Architecture for Three Products

## 15.1. Eco Nojin

تمرکز:

- تجربه بین‌المللی.
- محتوای معرفی.
- صفحات عمومی.
- حساب کاربری.
- Navigation.
- محتوای روستایی و عشایری.
- گردشگری و فرهنگ.

## 15.2. HyDroMA

تمرکز:

- واژگان علمی دقیق.
- واحدها.
- فرمول‌ها.
- تقویم و زمان.
- نمودار و نقشه.
- گزارش‌های علمی.
- خروجی مدل.
- مستندات عدم قطعیت.

## 15.3. Nojin Marketplace

تمرکز:

- نام محصولات.
- دسته‌بندی‌ها.
- قیمت‌ها.
- سفارش‌ها.
- واحدهای فروش.
- اطلاعات فروشنده.
- پرداخت.
- فاکتور.
- قوانین و شرایط محلی.

## 15.4. Shared Infrastructure

سه محصول باید در صورت امکان از زیرساخت مشترک برای موارد زیر استفاده کنند:

- Locale Registry.
- Translation Standards.
- Number Formatting.
- Date Formatting.
- Direction Management.
- Font Loading Strategy.
- Localization Testing.

اما این اشتراک نباید باعث وابستگی شدید محصولات یا یکپارچگی اجباری در زمان اجرا شود.

---

# 16. Testing and Quality Assurance

## 16.1. Localization Test Matrix

حداقل ترکیب‌های زیر باید آزمون شوند:

| Test Area | RTL | LTR |
|---|---|---|
| Navigation | Required | Required |
| Forms | Required | Required |
| Tables | Required | Required |
| Dialogs | Required | Required |
| Charts | Required | Required |
| Maps | Required | Required |
| Date Picker | Required | Required |
| Currency | Required | Required |
| Search | Required | Required |
| Mobile Layout | Required | Required |

## 16.2. Translation Tests

- Missing Key Detection.
- Duplicate Key Detection.
- Unused Key Detection.
- Placeholder Consistency.
- Pluralization Tests.
- Translation Completeness.
- Terminology Consistency.

## 16.3. Visual Tests

- متن‌های طولانی.
- متن‌های کوتاه.
- متن ترکیبی فارسی و انگلیسی.
- اعداد بزرگ.
- تاریخ‌های مختلف.
- نام‌های طولانی.
- فرم‌های RTL/LTR.
- فونت‌های جایگزین.
- نمایش موبایل.

## 16.4. Numeric Tests

- تبدیل ارقام.
- نمایش اعشار.
- جداکننده هزارگان.
- اعداد منفی.
- اعداد بسیار بزرگ.
- مقادیر علمی.
- مقادیر مالی.
- مختصات.

## 16.5. Calendar Tests

- تاریخ شمسی.
- تاریخ میلادی.
- سال کبیسه.
- مرز سال.
- تبدیل تقویم.
- منطقه زمانی.
- تاریخ نامعتبر.

## 16.6. Browser Compatibility

رفتار Intl، Font Loading، Bidi و Date Picker باید در مرورگرهای هدف آزمون شود.

## 16.7. No Translation-Based Regression

تغییر زبان نباید باعث تغییر منطق محاسباتی، مالی یا علمی شود.

---

# 17. Translation Governance

## 17.1. Translation Roles

نقش‌های پیشنهادی:

- Translator.
- Technical Reviewer.
- Scientific Reviewer.
- Product Reviewer.
- Localization Manager.
- Final Approver.

## 17.2. Scientific Translation Review

ترجمه اصطلاحات HyDroMA باید توسط فرد آشنا با موضوع علمی بازبینی شود.

ترجمه روان اما نادرست علمی قابل قبول نیست.

## 17.3. Financial Translation Review

اصطلاحات مالی باید از نظر حقوقی و عملیاتی دقیق باشند.

## 17.4. Translation Versioning

ترجمه‌ها باید قابل نسخه‌بندی باشند.

هر تغییر مهم باید دارای:

- Translation Version.
- Change Reference.
- Reviewer.
- Approval Status.

## 17.5. Machine Translation

ترجمه ماشینی می‌تواند ابزار کمکی باشد، اما نباید بدون بازبینی در محتوای علمی، مالی، حقوقی و حساس منتشر شود.

---

# 18. Performance and Security

## 18.1. Translation Bundle Optimization

- بارگذاری ترجمه‌ها به‌صورت ماژولار.
- جلوگیری از بارگذاری همه زبان‌ها در شروع برنامه.
- Cache کنترل‌شده.
- جلوگیری از تکرار درخواست ترجمه.
- بررسی حجم Bundle.

## 18.2. Font Performance

- بارگذاری فونت‌های ضروری.
- استفاده از WOFF2 در صورت سازگاری.
- تعیین Font Display مناسب.
- بررسی Layout Shift.
- جلوگیری از دانلود وزن‌های غیرضروری.

## 18.3. Translation Security

ترجمه‌ها باید مانند سایر ورودی‌های قابل نمایش بررسی شوند.

قرار دادن HTML یا محتوای اجرایی در فایل ترجمه بدون کنترل امنیتی ممنوع است.

## 18.4. Locale Injection

مقادیر Locale ورودی باید اعتبارسنجی شوند.

Locale ناشناخته نباید موجب خطای برنامه یا دسترسی غیرمجاز شود.

---

# 19. Acceptance Criteria

| ID | Acceptance Criterion | Evidence |
|---|---|---|
| I18N-001 | Locale Registry تعریف شده است | Registry |
| I18N-002 | Language Switching کار می‌کند | E2E Test |
| I18N-003 | RTL/LTR صحیح است | Visual Test |
| I18N-004 | متن ترکیبی درست نمایش داده می‌شود | Bidi Test |
| I18N-005 | ترجمه‌های ناقص قابل شناسایی‌اند | Translation Audit |
| I18N-006 | قالب عددی Locale-aware است | Numeric Test |
| I18N-007 | تقویم‌ها درست نمایش داده می‌شوند | Calendar Test |
| I18N-008 | واحدهای علمی مستقل از ترجمه‌اند | Scientific Test |
| I18N-009 | داده مالی تغییر نمی‌کند | Financial Test |
| I18N-010 | نمودارها در RTL/LTR صحیح‌اند | Visualization Test |
| I18N-011 | نقشه‌ها با قرارداد مختصات سازگارند | Map Test |
| I18N-012 | فونت‌های انتخابی پوشش کامل دارند | Font Audit |
| I18N-013 | دسترس‌پذیری چندزبانه بررسی شده است | Accessibility Report |
| I18N-014 | زبان محتوا قابل تشخیص است | Content Test |
| I18N-015 | تغییر زبان داده فرم را از بین نمی‌برد | State Preservation Test |
| I18N-016 | تغییر زبان منطق علمی را تغییر نمی‌دهد | Regression Test |
| I18N-017 | Translation Bundle بهینه است | Build Analysis |

---

# 20. Open Decisions

| ID | Decision | Status |
|---|---|---|
| I18N-D01 | زبان پیش‌فرض Eco Nojin | OPEN |
| I18N-D02 | زبان‌های نسخه نخست | OPEN |
| I18N-D03 | Localeهای رسمی | OPEN |
| I18N-D04 | زبان پیش‌فرض HyDroMA | OPEN |
| I18N-D05 | زبان‌های بازارگاه | OPEN |
| I18N-D06 | ساختار نهایی Translation Registry | OPEN |
| I18N-D07 | کتابخانه i18n | OPEN |
| I18N-D08 | سیاست Fallback | OPEN |
| I18N-D09 | سیاست ارقام فارسی و لاتین | OPEN |
| I18N-D10 | سیاست تقویم شمسی و میلادی | OPEN |
| I18N-D11 | فونت نهایی فارسی | OPEN |
| I18N-D12 | فونت نهایی لاتین | OPEN |
| I18N-D13 | واژه‌نامه علمی رسمی | OPEN |
| I18N-D14 | سیاست ترجمه محتوای پویا | OPEN |
| I18N-D15 | سیاست محتوای چندزبانه | OPEN |
| I18N-D16 | سیاست جست‌وجوی چندزبانه | OPEN |
| I18N-D17 | سیاست Localization Testing | OPEN |
| I18N-D18 | سیاست انتشار زبان جدید | OPEN |

---

# 21. Final Principles

1. معماری باید مستقل از زبان باشد.
2. منطق علمی، مالی و تجاری نباید به زبان رابط وابسته شود.
3. RTL و LTR باید در سطح معماری طراحی شوند.
4. از CSS Logical Properties استفاده شود.
5. اعداد، تاریخ‌ها و ارزها باید Locale-aware باشند.
6. داده داخلی از قالب نمایشی تفکیک شود.
7. تقویم شمسی و میلادی باید با تبدیل معتبر مدیریت شوند.
8. واحدهای علمی نباید به‌صورت دلخواه ترجمه شوند.
9. نمودارها و نقشه‌ها باید از RTL/LTR پشتیبانی کنند.
10. ترجمه علمی باید بازبینی تخصصی شود.
11. تغییر زبان نباید موجب از دست رفتن داده کاربر شود.
12. زبان‌های جدید باید از مسیر Governance مشخص اضافه شوند.
13. هیچ ترجمه‌ای بدون بررسی کیفیت نباید به‌عنوان ترجمه تأییدشده معرفی شود.
14. آمادگی چندزبانه با آمادگی حقوقی و تجاری بین‌المللی یکسان نیست.

---

# 22. Document Status

**Current Status: DRAFT — PROPOSED — NOT APPROVED**

این سند چارچوب پیشنهادی بین‌المللی‌سازی و بومی‌سازی فرانت‌اند را تعریف می‌کند.

این سند:

- زبان پیش‌فرض را تعیین نمی‌کند.
- زبان‌های نسخه نخست را تصویب نمی‌کند.
- فونت نهایی را انتخاب نمی‌کند.
- کتابخانه i18n را انتخاب نمی‌کند.
- تقویم پیش‌فرض را تصویب نمی‌کند.
- ترجمه‌های موجود را تأیید نمی‌کند.
- پشتیبانی عملیاتی از بازارهای بین‌المللی را اثبات نمی‌کند.
- مجوز تغییر معماری فعلی را صادر نمی‌کند.

هرگونه پیاده‌سازی باید پس از بررسی معماری واقعی، ارزیابی کیفیت، آزمون چندزبانه و تأیید تصمیمات باز انجام شود.

**End of Document 28**