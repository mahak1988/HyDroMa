# docs/blueprint/ — سند مادر اکو نوژین و نگاشت وضعیت قابلیت‌ها

**Status:** ACTIVE — منبع راهبردی اهداف و فلسفه اکو نوژین در مخزن
**Authority:** مالک پروژه (کشت و صنعت دشت امید نارون) — سند مادر با تاریخ ۲۰۲۶-۱۱-۲۸
**Decided:** ADR-0012 (docs/adr/ADR-0012-master-blueprint-and-repo-standardization.md)

این پوشه، سند مادر اکو نوژین (Master Blueprint v1.0) و نگاشت اهداف آن به وضعیت واقعی
مخزن را نگه می‌دارد. طبق بند ۶۹ سند مادر، هر قابلیت با چهار وضعیت مشخص می‌شود تا
هیچ هدف، تصمیم معماری یا قابلیت پیاده‌سازی‌شده‌ای با دیگری اشتباه نشود:

| وضعیت | معنا |
|---|---|
| `VISION` | هدف بلندمدت؛ هنوز طراحی مشخص ندارد |
| `DESIGNED` | طراحی و قرارداد مشخص دارد؛ پیاده‌سازی نشده |
| `IMPLEMENTED` | در مخزن پیاده‌سازی شده؛ اما شواهد عملکرد کامل ندارد |
| `VERIFIED` | شواهد قابل تکرار (آزمون، ممیزی، اعتبارسنجی مستقل) دارد |

این چهار وضعیت با بلوغ نرم‌افزاری مدل‌های علمی (STUB → IMPLEMENTED → TESTED → VERIFIED →
VALIDATED → PRODUCTION_APPROVED) و وضعیت اعتبار علمی (NOT_VALIDATED و ...) یکی نیستند؛
آن‌ها در سند مادر و در `docs/scientific-governance/` تعریف شده‌اند.

## محتوای این پوشه

| سند | نقش |
|---|---|
| `ECO-NOJIN-MASTER-BLUEPRINT-v1.0.md` | نسخه ساختاریافته سند مادر: فلسفه، چشم‌انداز، اهداف، معماری، قواعد غیرقابل نقض، نقشه راه، ریسک‌ها و اولویت‌ها |
| `GOALS-STATUS-MATRIX.md` | اهداف کلان G01–G16 و وضعیت هر یک در مخزن فعلی با شواهد |
| `ROADMAP-ALIGNMENT.md` | نقشه راه ۱۴ مرحله‌ای سند مادر، اولویت‌های ۱–۱۰ و Vertical Sliceهای ۱–۶ نگاشته‌شده به ساختار واقعی مخزن |

## سند مادر و اسناد رسمی ۲۳گانه

سند مادر پیشنهاد می‌دهد محتوای خود در نهایت به ۲۳ سند رسمی نسخه‌دار تفکیک شود
(Vision & Manifesto، Master Architecture، Domain Architecture، HyDroMA، EDI، Data، GIS، MRV،
Agriculture، Territory & Community، Projects، Marketplace، Tourism، AI & Agent، Identity &
Governance، Security، Infrastructure، UX & Design System، Internationalization، Roadmap،
Quality & Validation، Business Model، Ecosystem Governance).

تا زمان تفکیک کامل، اسناد موجود مخزن نقش موقت این حوزه‌ها را دارند:

| سند رسمی آینده | محل موقت فعلی در مخزن |
|---|---|
| Vision & Manifesto | `docs/blueprint/ECO-NOJIN-MASTER-BLUEPRINT-v1.0.md` |
| Master / Domain Architecture | `docs/architecture/` (معماری هدف، C4، مرزها، registries) + `architecture/` + `ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md` |
| HyDroMA Scientific Architecture | `engines/hydroma/README.md` + `docs/scientific-governance/` + `docs/architecture/hydroma/` |
| EDI Architecture | `services/edi/README.md` + `contracts/` |
| Identity, Governance, Security | `docs/security/` + `docs/data-governance/` + `AGENTS.md` + `docs/architecture/iam/` + `docs/architecture/security/` |
| UX & Design System | `brand/` + `packages/ui/` + `docs/architecture/` |
| Internationalization | `packages/i18n/` + ADR-0005 |
| Roadmap | `docs/blueprint/ROADMAP-ALIGNMENT.md` + `docs/architecture/architecture-roadmap.md` |
| Quality & Validation | `docs/scientific-governance/` + `.github/workflows/verify.yml` + `lab/` |
| بقیه حوزه‌ها (GIS، MRV، Projects، Marketplace، Tourism، AI، Infrastructure، Business) | مسیرهای بالقوه در `ROOT-STRUCTURE-MANIFEST.md` — وضعیت VISION/DESIGNED |

## قواعد به‌روزرسانی

- این پوشه حکم راهبردی دارد؛ مستندات فنی اجرایی در جای خود حفظ می‌شوند (ADR-0001: بدون نسخه دومِ از یک استاندارد).
- هر تغییر وضعیت قابلیت (VISION → DESIGNED → IMPLEMENTED → VERIFIED) باید با شاهد قابل تکرار در همین اسناد ثبت شود.
- فقط مالک پروژه می‌تواند وضعیت اهداف را تغییر دهد؛ ایجنت‌ها پیشنهاد ثبت می‌کنند، نه تغییر وضعیت.
