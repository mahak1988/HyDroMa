# نقشهٔ صفحات پلتفرم — پیاده‌سازی فرانت‌اند

**تاریخ:** ۲۰۲۶-۱۱-۲۰ · **مرجع:** سند جامع HyDroMA (بخش هفتم: نقشهٔ ۱۲۰ صفحه‌ای)
**هدف این سند:** نشان دادن این‌که هر صفحهٔ سند، در کدام اپ و روی کدام مسیر پیاده شده است.

---

## ۱. جمع‌بندی

| سرویس | صفحه در سند | پیاده‌شده | محل |
|---|---:|---:|---|
| ۱. پورتال عمومی | ۱۲ | **۱۲** | `apps/portal` — `/portal/*` |
| ۲. فضای علمی HyDROMA | ۹ | **۹** | `apps/scientific-workspace` — `/science/*` |
| ۳. مدیریت منظر | ۱۶ | **۱۶** | `apps/platform` — `/platform/landscapes/*` |
| ۴. کشاورزی هوشمند | ۱۰ | **۱۰** | `apps/platform` — `/platform/agriculture/*` |
| ۵. محیط‌زیست و MRV | ۸ | **۸** | `apps/platform` — `/platform/mrv/*` |
| ۶. مدیریت پروژه‌ها | ۱۰ | **۱۰** | `apps/platform` — `/platform/projects/*` |
| ۷. بازارگاه نوژین | ۱۲ | **۱۲** | `apps/marketplace` (+ `/categories` و `/stores`) |
| ۸. گردشگری | ۱۰ | **۱۰** | `apps/tourism` (+ `/tours`) |
| ۹. دانش‌یار | ۸ | **۸** | `apps/platform` — `/platform/knowledge/*` |
| ۱۰. مالی و حسابداری | ۸ | **۸** | `apps/platform` — `/platform/finance/*` |
| ۱۱. هویت و کاربران | ۵ | **۵** | `apps/console` (`/profile`, `/security`) + ورود در `apps/portal` |
| ۱۲. حاکمیت | ۸ | **۸** | `apps/platform` — `/platform/governance/*` |
| ۱۳. ارتباطات | ۴ | **۴** | `apps/platform` — `/platform/community/*` |
| **جمع** | **۱۲۰** | **۱۲۰** | |

به‌علاوه: `apps/home` (نقطهٔ ورود) و `apps/brand` (سیستم طراحی) بیرون از این شمارش‌اند و
`/platform/` یک «مرکز فرمان» اضافه دارد که در سند به‌صورت صفحهٔ مستقل شمرده نشده است.

---

## ۲. اپ جدید: `apps/platform`

یک اپ (پورت ۵۱۸۳، مسیر `/platform/`) که هفت سرویس را در یک فضای کاری با ناوبری گروه‌بندی‌شده جمع می‌کند:
منظر، کشاورزی، MRV، پروژه‌ها، دانش‌یار، مالی، ارتباطات و حاکمیت.

**معماری صفحات:** به‌جای ۷۲ صفحهٔ دست‌ساز، شش الگوی مشترک + یک رجیستری داده‌محور:

| الگو | تعداد | کار |
|---|---:|---|
| `dashboard` | ۸ | KPI، روند، هشدار، اقدام پیشنهادی |
| `list` | ۳۰ | جست‌وجو، فیلتر وضعیت، جدول با منشأ و روش |
| `detail` | ۳ | شناسنامهٔ منظر/پروژه/پژوهشگر با منشأ، عدم‌قطعیت و سرویس‌های متصل |
| `wizard` | ۵ | برنامهٔ مدیریت، کشت، طراحی پروژه، عملیات، تنظیمات |
| `report` | ۹ | خلاصه، شاخص، روش، عدم‌قطعیت، اقدام |
| `map` | ۱ | اطلس با لایه‌های قابل کنترل |

سند خودش می‌گوید «صفحات جزئیاتی می‌توانند از یک قالب مشترک استفاده کنند»؛ این پیاده‌سازی همان را
جدی گرفته است: یک رندر برای هر الگو، و هر صفحه فقط `title`، `lead`، `entity` و در صورت نیاز
`series` و `steps` خود را تعریف می‌کند (`src/content/pages.ts`).

**داده:** ۳۹ مجموعهٔ نمایشی (`src/data/entities.ts`) با ۱۰۰+ رکورد؛ هر رکورد `source`, `method`,
`updated` و در موارد لازم `uncertainty` دارد — همان قاعده‌ای که `AGENTS.md` الزام می‌کند.
اعداد از `format.number` عبور می‌کنند، بنابراین در فارسی با ارقام فارسی نمایش داده می‌شوند.

**۳ زبان:** عنوان و توضیح هر صفحه در `fa/en/ar` نوشته شده؛ زبان از `I18nProvider` می‌آید و
جهت صفحه با تغییر زبان عوض می‌شود.

---

## ۳. فهرست مسیرهای اپ platform (۷۳)

### مرکز فرمان
`/platform/`

### مدیریت منظر (۱۶)
`/landscapes` · `/landscapes/atlas` · `/landscapes/villages` · `/landscapes/nomadic-territories`
`/landscapes/rangelands` · `/landscapes/farms` · `/landscapes/natural-resources` · `/landscapes/:id`
`/landscapes/assessment` · `/landscapes/management-plan` · `/landscapes/restoration-projects`
`/landscapes/management-group` · `/landscapes/stakeholders` · `/landscapes/economy`
`/landscapes/monitoring` · `/landscapes/reports`

### کشاورزی (۱۰)
`/agriculture` · `/agriculture/farms` · `/agriculture/crops` · `/agriculture/planning`
`/agriculture/irrigation` · `/agriculture/health` · `/agriculture/inputs` · `/agriculture/livestock`
`/agriculture/performance` · `/agriculture/reports`

### محیط‌زیست و MRV (۸)
`/mrv` · `/mrv/land-degradation` · `/mrv/restoration` · `/mrv/carbon` · `/mrv/methodologies`
`/mrv/reports` · `/mrv/verification` · `/mrv/provenance`

### پروژه‌ها (۱۰)
`/projects` · `/projects/list` · `/projects/:id` · `/projects/design` · `/projects/operations`
`/projects/tasks` · `/projects/budget` · `/projects/monitoring` · `/projects/results` · `/projects/reports`

### دانش‌یار (۸)
`/knowledge` · `/knowledge/library` · `/knowledge/research` · `/knowledge/indigenous-knowledge`
`/knowledge/courses` · `/knowledge/content` · `/knowledge/community` · `/knowledge/researchers/:id`

### مالی (۸)
`/finance` · `/finance/accounts` · `/finance/entries` · `/finance/income-expense`
`/finance/payments` · `/finance/wallet` · `/finance/settlements` · `/finance/reports`

### ارتباطات (۴)
`/community/notifications` · `/community/messages` · `/community/groups` · `/community/activities`

### حاکمیت (۸)
`/governance` · `/governance/users` · `/governance/organizations` · `/governance/services`
`/governance/content` · `/governance/data` · `/governance/audit` · `/governance/settings`

---

## ۴. صفحات تکمیلی (تکمیل‌شده)

| صفحه | سرویس | مسیر | یادداشت |
|---|---|---|---|
| دسته‌بندی محصولات | بازارگاه | `/market/categories` | از همان `CATEGORIES` فیلتر کاتالوگ ساخته می‌شود؛ شمارش محصول از داده |
| فروشگاه‌ها | بازارگاه | `/market/stores` | خلاصهٔ فروشندگان به fa/ar ترجمه شد (`summaryI18n` در قرارداد Seller) |
| تورها | گردشگری | `/tourism/tours` | مدت، ظرفیت، سختی و قیمت از تجربه‌ها؛ لینک به مسیر رزرو |
| پروفایل کاربر | هویت | `/console/profile` | نقش‌ها، عضویت‌ها و تاریخ جلالی |
| امنیت حساب | هویت | `/console/security` | نشست‌ها و سوابق؛ همهٔ عملیات با توضیح غیرفعال |

هر پنج صفحه در ناوبری همان اپ ثبت شده‌اند و از هاست یکپارچه سرو می‌شوند.

## ۵. اجرا و بررسی

```bash
npm run dev            # http://localhost:5180 → /platform/
npm run build:all      # ۸ اپ
npm run verify         # typecheck + lint + مرزها + توکن‌ها + تست + build
```

گاردهای معماری: ۲۱ واحد، ۲۷۰ فایل، صفر تخلف. گارد توکن: ۹ هدف، ۱۵۶ فایل، صفر تخلف.
