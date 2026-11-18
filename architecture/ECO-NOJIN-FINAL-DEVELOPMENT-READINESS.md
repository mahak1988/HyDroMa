# ECO NOJIN — FINAL DEVELOPMENT READINESS
## تطبیق نهایی آمادگی توسعه با مجوزهای واقعی مالک

**Document ID:** ECO-NOJIN-FINAL-DEVELOPMENT-READINESS
**Version:** 1.0
**Date:** 2026-11-18
**Role:** Independent Principal Architect and Quality Authority
**Scope:** محدود به تطبیق `ECO-NOJIN-ARCHITECTURE-CORRECTION-AND-READINESS.md` با سوابق مجوز مالک. ممیزی مجدد کل معماری نیست.
**Mode:** READ-ONLY. هیچ کد، استاندارد، آرشیو یا مخزنی تغییر نکرد. هیچ Git operation انجام نشد. هیچ تصمیم OPEN بسته نشد.

**FINAL STATUS:** `READY_FOR_CONTROLLED_PREPARATION`

---

## 1. Executive Verdict

| پرسش | پاسخ |
|---|---|
| آیا مجوز مالک برای Git محلی وجود دارد؟ | **بله** — مالک صریحاً ایجاد مخزن محلی در `D:\Nojin` و ثبت Baseline اولیه را مجاز کرده است. |
| آیا G0 اجرا شده است؟ | **نه** — هیچ `.git` در درخت پروژه وجود ندارد؛ `git status` → `fatal: not a git repository`. |
| وضعیت صحیح A1 | **`AUTHORIZED_PENDING_VERIFICATION`** (مجوز صادر شده؛ اجرا اثبات نشده). |
| آیا کار مقدماتی می‌تواند شروع شود؟ | **بله** — کارهای مستقل و framework-neutral بدون انتظار برای تصمیم فریم‌ورک. |
| آیا PUB-01 می‌تواند شروع شود؟ | **نه** — تا اجرای G0 و تصمیم `B1` مالک. |
| آیا تصمیم فریم‌ورک اکنون قابل اتخاذ است؟ | بله از نظر شواهد، اما **فقط مالک** مجاز است؛ این گزارش انتخاب نمی‌کند. |

**سه تصحیح بنیادی نسبت به سند قبلی:**
1. `A1` «نیازمند مجوز» نیست؛ **مجوز دارد**. آنچه باقی است **اجرا و راستی‌آزمایی** است، نه اجازه.
2. `T-1` به‌اشتباه دو محیط را درهم آمیخته بود؛ اکنون **Python و Node کاملاً تفکیک** شده‌اند.
3. تناقض §5.4/§5.5 با **تفکیک سه‌سطحی** (شروع / پذیرش / انتشار) حل شد.

---

## 2. Verified Corrections

### 2.1 وضعیت شاهد (قابل بازتولید)

| شاهد | دستور | نتیجه |
|---|---|---|
| عدم وجود مخزن | `Test-Path D:\NOJIN\.git` | `False` |
| عدم وجود مخزن تودرتو | recursive `.git` (بدون node_modules) | **هیچ** |
| وضعیت Git | `git -C D:\NOJIN status` | `fatal: not a git repository` |
| `.git` داخل registry | recursive در `upstream-registry` | **0** |
| حجم آرشیوها | sum Length | **2,216.8 MB** |
| حجم registry | sum Length | **7,704.3 MB** |
| node_modules | شمارش پوشه | **246** |
| brand (بدون node_modules) | sum Length | **9.6 MB / 485 فایل** |
| فایل > 50MB (خارج از پوشه‌های حجیم) | فیلتر Length>50MB | **هیچ** |
| فایل‌های حساس در ریشه پروژه | الگوی `.env/*.pem/*.key/id_*` | **هیچ** در پروژه؛ فقط داخل `upstream-registry` (نمونه‌ها؛ هیچ secret واقعی: `erpnext` فقط `VITE_BASE_NAME`، `collect-earth` خودش اعلام می‌کند "Not a secret") |

### 2.2 G0 — تطبیق مجوز (Task 1)

| مورد | مقدار صحیح |
|---|---|
| مجوز مالک | **صادر شده** (ایجاد مخزن محلی + ثبت Baseline اولیه) |
| اجرا | **انجام نشده** (بدون `.git`) |
| وضعیت | **`AUTHORIZED_PENDING_VERIFICATION`** |
| تصحیح سند قبلی | در `...CORRECTION-AND-READINESS.md` §5.3/§6، `A1` زیر «Requires owner decision» آمده بود — **نادرست**؛ باید زیر «مجوزدار، در انتظار اجرا» باشد. |
| تفکیک لازم | «مجوز صادرشده» ≠ «اجرای موفق». تا وجود commit قابل مشاهده نباشد، G0 `PENDING` است. |

### 2.3 تفکیک Runtime (Task 2 — اصلاح T-1)

**اصلاح:** T-1 قبلی «provision Python venv» را در یک مسیر عمومی گذاشته بود و می‌توانست به‌اشتباه آزمون‌های JS را هم درگیر کند. تفکیک صحیح:

| محیط | دامنه | ابزار | وابستگی متقابل |
|---|---|---|---|
| **Gate-JS** | `geo-measure` و هر کد JS/TS | `node --test` (Node 26.13.0) | **هیچ وابستگی به Python** |
| **Gate-PY** | `titiler`، `xclim` و سرویس‌های علمی | `py -3 -m venv .venv-science` + pip | مستقل از Node |

قواعد الزامی:
1. Python venv **فقط** برای سرویس/کتابخانه پایتون؛ هرگز برای اجرای آزمون JS.
2. `geo-measure` صرفاً در Node اجرا می‌شود (۲۳/۲۳).
3. Smoke Testها **جدا و حداقلی**: `import titiler`, `import xclim` — نه نصب کامل پشته علمی (بدون GDAL کامل، بدون torch، بدون wflow/modflow runtime).
4. نسخه‌ها pin‌شده و قابل بازتولید (`requirements-smoke.txt` با نسخه دقیق).
5. شکست یک محیط، محیط دیگر را مسدود نمی‌کند.

**طبقه‌بندی صحیح:** `T-1a` (JS gate: بدون تغییر، همین حالا) · `T-1b` (Python smoke env: مستقل، همین حالا).

### 2.4 تناقض §5.4 / §5.5 (Task 3)

سند قبلی در §5.4 می‌گفت PUB-01 «مسدود» و در §5.5 می‌گفت «فقط A1+B1+B2+B5». تناقض ظاهری ناشی از **یکی‌انگاشتن سه سطح متفاوت** بود. تفکیک صحیح در §4.

### 2.5 دامنه Baseline اولیه (Task 4)

عبارت «first commit = design-system baseline» **محدودکننده و نادرست** بود. Baseline اولیه باید **وضعیت واقعی و مجاز پروژه در ریشه `D:\Nojin`** را ثبت کند، نه فقط Design System.

| شامل شود (دارایی پروژه) | حجم تقریبی |
|---|---|
| `AGENTS.md`, `*.md` ریشه (۵ تحویل + ۲ گزارش بازبینی/اصلاح) | < 0.1 MB |
| `architecture/**` | 1.0 MB |
| `brand/**` (بدون node_modules) | 9.6 MB |
| `experiments/**` | 1.7 MB |
| `UPSTREAM-INTEGRATION-STATUS.csv`، `.vscode/**`، `.kilo/**` (تنظیمات) | ~0.2 MB |
| **جمع قابل‌commit** | **≈ 12.6 MB** |

| باید حذف شود (`.gitignore`) | دلیل |
|---|---|
| `upstream-archives/**` (2,216.8 MB) | حجم + فایل‌های فشرده؛ يجب حفظ خارج از VCS |
| `upstream-registry/**` (7,704.3 MB) | کد ثالث + ۲۴۶ node_modules + `.env.example`؛ حفظ به‌عنوان نسخه مرجع جدا |
| `**/node_modules/**` | وابستگی بازتولیدشدنی |
| `firebase-debug.log` (0 B) | زباله ابزار |
| `*.env`, `.env*`, `*.pem`, `*.key` | جلوگیری از نشت |
| `dist/`, `build/`, `coverage/`, `.venv*` | خروجی/محیط |

نکات:
- مخزن تودرتو وجود ندارد (تأیید شد) → نیازی به submodule نیست.
- فایل >50MB در دامنه commit وجود ندارد → **LFS لازم نیست**.
- حذف registry/archives از commit به‌معنای **حذف فایل نیست**؛ فقط از نسخه‌بندی خارج می‌شود (قابل بازگشت).
- هیچ commit جدیدی در این مأموریت انجام نشد.

### 2.6 کیفیت تصمیم فریم‌ورک (Task 5 — فقط ممیزی)

| پرسش | پاسخ |
|---|---|
| امتیازها کمی‌اند یا قضاوت؟ | **قضاوت کارشناسی** (`EXPERT_JUDGEMENT`) با چند جزء `VERIFIED_FACT` (Angular 22 فعال؛ MapLibre v6 RTL بومی). هیچ‌کدام بنچمارک اندازه‌گیری‌شده نیست. |
| بیشترین عدم‌قطعیت | ① **Ecosystem breadth (وزن 13)** — تعریف‌نشده و اندازه‌گیری‌نشده؛ ② **R10 دسترسی توسعه‌دهنده/استخدام (10)** — بدون داده محلی؛ ③ **R9 سادگی استقرار (10)** — به ظرفیت ops مالک وابسته؛ ④ **Learning curve (6)** — تیم ناشناخته؛ ⑤ **R1 SEO برای SPA** — به فازبندی SEO عمومی بستگی دارد. |
| حساسیت | برتری Next.js تقریباً کاملاً از `R1(15)+Eco(13)` می‌آید. اگر SEO عمومی به فاز ۲ منتقل یا Ecosystem بازتعریف شود، **Angular 22 و Vite+React با آن هم‌تراز یا جلو می‌زنند**. |
| تفکیک سه‌گانه محصول لازم است؟ | **بله.** معیارها واقعاً متفاوت‌اند: Public Website (SEO/استاتیک)، HyDROMA Dashboard (اپ/ویژوال، SEO بی‌اهمیت)، Marketplace (SEO+تجارت+A11y). امتیاز واحد «کل اکوسیستم» سیگنال را مخدوش می‌کند. توصیه: ماتریس سه‌ستونی برای هر کاندید؛ ترکیب چندفریم‌ورکی مجاز اما هزینه ops را بالا می‌برد (وزن R9). |
| گزینه‌های اصلی همچنان؟ | **بله:** Next.js، Angular 22، Vite+React (React Router v7 عملاً گونه‌ای از همان است). |

**هیچ گزینه‌ای انتخاب یا توصیه قطعی نشد؛ تصمیم `B1` فقط با مالک است.**

---

## 3. Remaining Owner Decisions

| # | تصمیم | شناسه | وضعیت |
|---|---|---|---|
| 1 | فریم‌ورک/رندر/monorepo | `B1` / `AUDIT-MISS-01` | **OPEN** — تصمیم مالک |
| 2 | ماتریس اختیارات | `GOV-03` | **OPEN** |
| 3 | سیاست اختیار عامل | `GOV-08` | **OPEN** |
| 4 | IdP | `D-04` | OPEN |
| 5 | موتور گردش‌کار | `D-07` | OPEN |
| 6 | CRS پروژه | `B14` | OPEN |
| 7 | مدل‌های علمی فاز اول | `D-17` | OPEN |
| 8 | کربن خاک/RothC | `D-18` | OPEN |
| 9 | پذیرش مجوزهای copyleft | `D-19` | OPEN |
| 10 | DB/tenancy/topology/scenario | `D-01/02/03/13` | OPEN |
| 11 | حوزه قضایی/نگهداشت/پرداخت | `D-14/20/16` | OPEN |
| 12 | EcoCoin/HIC | `D-15` | OPEN (تعلیق) |
| 13 | هویت/رنگ/تایپ/لوگو | `ID-07`/`COLOR-01`/`TYPO-*` | OPEN |

**A1 دیگر در این فهرست نیست**: مجوز آن صادر شده و صرفاً نیازمند اجرا/راستی‌آزمایی است.

---

## 4. Corrected Dependency Matrix

### 4.1 سه سطح مستقل برای PUB-01

| سطح | نام | پیش‌نیازهای واقعی | چه چیزی را مجاز می‌کند |
|---|---|---|---|
| **L1** | شروع پیاده‌سازی | `A1` **اجراشده** (مخزن + baseline) + `B1` **تصمیم‌گرفته** (مالک) | نوشتن اولین کد صفحه |
| **L2** | تأیید Build و Acceptance | `B2` (SSOT توکن) + `B5` (گیت: typecheck+lint+unit+build) + معیارهای PUB-01 (۴ حالت، 375/768/1440، fa-RTL/en-LTR، کیبورد) | اعلام «آماده پذیرش» |
| **L3** | مجوز انتشار | تأیید کتبی انتشار توسط مالک — **جدا از L2** | انتشار عمومی |

اصل: **L1 ≠ L2 ≠ L3.** مجوز شروع، مجوز پذیرش نیست؛ پذیرش هم مجوز انتشار نیست.

### 4.2 ماتریس وابستگی

| کار | L1 | L2 | L3 | یادداشت |
|---|---|---|---|---|
| اصلاح اسناد F-01..F-06/N-01 | — | — | — | مستقل، همین حالا |
| Gate-JS (`geo-measure` 23/23) | — | — | — | مستقل از Python |
| Gate-PY (smoke: titiler/xclim) | — | — | — | مستقل از Node |
| B2 (SSOT توکن) | — | لازم (L2) | — | framework-neutral؛ می‌تواند موازی `B1` اجرا شود |
| MapLibre/Giro3D spike (vanilla) | — | — | — | framework-neutral |
| PySTAC smoke | — | — | — | فقط در محیط PY |
| **PUB-01 build** | `A1`✓ + `B1` | `B2`+`B5` | مالک | |
| Monorepo + B5 | `B1` | — | — | بعد از تصمیم فریم‌ورک |
| Keycloak production | — | — | — | `D-04` |
| Temporal | — | — | — | `D-07` |
| مالی / ECO-HIC / MRV issuance | — | — | مالک | مسدود |

### 4.3 گیت‌های وضعیت

| گیت | وضعیت | تبدیل‌شونده به |
|---|---|---|
| **G0** (مخزن Baseline) | `AUTHORIZED_PENDING_VERIFICATION` | `VERIFIED` پس از `git status` تمیز + ثبت hash |
| **G1** (`B1` فریم‌ورک) | `OPEN` | `DECIDED` فقط با ADR مالک |
| **G2** (B2 SSOT) | `OPEN` | `DONE` فنی |
| **G3** (B5 گیت) | `OPEN` | `GREEN` پس از build موفق |
| **G4** (PUB-01) | `BLOCKED` | آغاز پس از G0+G1 |

---

## 5. Final Execution Sequence

اصل: **حداکثر موازی‌سازی، حداقل وابستگی ساختگی.** هر ردیف فقط به پیش‌نیاز واقعی خود وابسته است.

### Wave A — همین حالا (مستقل، موازی)
| # | کار | وابستگی | خروجی |
|---|---|---|---|
| A1 | اصلاح اسناد F-01..F-06 + N-01 | — | ۴ سند اصلاح‌شده |
| A2 | تثبیت Gate-JS به‌عنوان regression baseline | — | `node --test` 23/23 |
| A3 | **T-1b**: ساخت `.venv-science` + smoke مستقل (`import titiler`, `import xclim`)، pin نسخه | — | `requirements-smoke.txt` |
| A4 | **B2**: SSOT توکن (CSS/JSON، framework-neutral) | — | تک‌منبع توکن، رفع N-02 |
| A5 | spike MapLibre/Giro3D به‌صورت vanilla (بدون فریم‌ورک) | — | نمونه رندر ۲بعدی/۳D |
| A6 | PySTAC round-trip smoke (داخل محیط PY) | A3 | نمونه STAC معتبر |
| A7 | تجمیع شواهد QA دیزاین‌سیستم در یک baseline | — | سند شواهد واحد |

### Wave B — اجرای مجوز موجود (G0)
| # | کار | وابستگی | خروجی |
|---|---|---|---|
| B1 | `git init` در `D:\Nojin` + `.gitignore` (§2.5) + Baseline commit | مجوز مالک (دارد) | commit hash؛ G0 → `VERIFIED` |

> این Wave فقط **اجرای مجوز موجود** است؛ درخواست مجوز جدید لازم نیست. در این مأموریت اجرا نشد.

### Wave C — تصمیم مالک (فقط مالک)
| # | کار | وابستگی |
|---|---|---|
| C1 | ADR فریم‌ورک/رندر/monorepo (`B1`) | شواهد Wave A + ماتریس سه‌محصولی |

### Wave D — بنیاد (پس از C1 + A4)
| # | کار | وابستگی |
|---|---|---|
| D1 | monorepo scaffold (`design-system`, `shared-ui`, `shared-contracts`) | C1 |
| D2 | **B5** گیت واحد: typecheck+lint+unit+build | C1, A2 |
| D3 | App shell توکن‌محور | D1, D2, A4 |

### Wave E — PUB-01
| # | کار | وابستگی |
|---|---|---|
| E1 | ساخت صفحه (L1) | G0✓ + C1 |
| E2 | پذیرش (L2): ۴ حالت/۳ breakpoint/RTL-LTR/کیبورد + گیت سبز | D2, A4 |
| E3 | انتشار (L3) | مجوز کتبی مالک |

### Wave F — یکپارچه‌سازی بالادست (خارج از مسیر PUB-01)
| # | کار | وابستگی |
|---|---|---|
| F1 | maplibre / giro3d / pystac پشت adapter | C1 (برای مصرف در UI) |
| F2 | titiler adapter | A3 |
| F3 | keycloak | `D-04` |

**مسیر بحرانی به اولین کد واقعی:** `G0` (مجوزدار) → `C1` (مالک). Wave A هیچ‌کدام را مسدود نمی‌کند و همین امروز اجرا می‌شود.

---

## 6. Acceptance Criteria

| مورد | معیار پذیرش |
|---|---|
| G0 | `.git` وجود دارد؛ `git status` تمیز؛ hash ثبت‌شده؛ هیچ آرشیو/secret/node_modules در commit نیست؛ `upstream-registry` و `upstream-archives` دست‌نخورده |
| Gate-JS | `node --test` در `geo-measure` = 23/23، بدون هرگونه وابستگی Python |
| Gate-PY | `.venv-science` ساخته‌شده؛ `import titiler` و `import xclim` موفق؛ نسخه‌ها pin‌شده؛ **بدون نصب کامل پشته علمی** |
| B2 | یک منبع توکن؛ حذف تکرار `tokens.css`/`themes.css`؛ تغییر توکن ⇒ تغییر ظاهر shell |
| B5 | یک دستور: typecheck+lint+unit+build؛ سبز روی نصب تمیز؛ شامل geo-measure |
| PUB-01 (L2) | ۴ حالت (Loading/Empty/Error/Success)؛ ۰ overflow در 375/768/1440؛ fa-RTL و en-LTR صحیح؛ همه عناصر تعاملی با کیبورد و focus آشکار |
| L3 | تأیید انتشار کتبی و جدا از پذیرش |

---

## 7. Explicitly Prohibited Actions

1. ایجاد Remote یا انجام هرگونه Deployment در این مرحله.
2. دست‌زدن به `D:\HyDroMA` و `D:\eco_nojin`.
3. تغییر آرشیوهای Upstream یا `upstream-registry`.
4. انجام هر Git operation در این مأموریت (فقط Wave B پس از تأیید، در مأموریت جدا).
5. انتخاب/تصویب فریم‌ورک توسط عامل.
6. بستن هر تصمیم `OPEN` یا تلقی آن به‌عنوان حل‌شده.
7. وابسته‌کردن آزمون‌های JS به Python venv یا برعکس.
8. نصب کامل پشته علمی یا وابستگی‌های سنگین در مرحله smoke.
9. commit کردن `upstream-archives`، `upstream-registry`، `node_modules` یا هر فایل حساس.
10. ساخت صفحه PUB-01 پیش از تحقق L1.
11. اعلام «انتشار» بر پایه «پذیرش».
12. ثبت G0 به‌عنوان اجراشده بدون شاهد commit.

---

## 8. Path to Next Status

| نقطه گذار | شرط | وضعیت هدف |
|---|---|---|
| اکنون | مجوز A1 موجود، اجرا اثبات‌نشده؛ Wave A قابل اجرا | **`READY_FOR_CONTROLLED_PREPARATION`** |
| پس از Wave A + G0 `VERIFIED` | شواهد محیط، گیت‌ها آماده، Baseline ثبت‌شده | `READY_FOR_FRAMEWORK_DECISION` |
| پس از ADR مالک (`B1`) | تصمیم ثبت‌شده | مجاز به Wave D/E |

**END OF FINAL DEVELOPMENT READINESS.**
