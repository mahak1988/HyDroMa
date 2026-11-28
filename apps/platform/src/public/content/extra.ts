import type { PageContent } from "./types";

/**
 * Additional public pages that are not part of the core `SiteContent.pages`
 * record. They are kept in a separate module so the fifteen locale catalogs do
 * not all have to be edited at once; `fa`, `en` and `ar` are authored here and
 * every other locale falls back to English, matching the existing catalog
 * behaviour for incomplete locales.
 *
 * Legal pages are explicitly marked as drafts that require owner/legal review.
 */
export type ExtraPageKey =
  | "vision"
  | "impact"
  | "projects"
  | "marketplace"
  | "accessibility"
  | "privacy"
  | "terms";

const en: Record<ExtraPageKey, PageContent> = {
  vision: {
    eyebrow: "Vision",
    title: "Restoration that is measured, governed and shared.",
    description: "The long-term direction of Eco Nojin: landscapes whose value is visible, auditable and returned to the people who steward them.",
    lead: "Eco Nojin exists to make dryland restoration a durable economic and ecological process rather than a sequence of disconnected projects.",
    blocks: [
      {
        kind: "paragraph",
        title: "The change we are working toward",
        body: "A landscape where scientific evidence, customary governance and local livelihoods are recorded in the same system — so a decision made in a village council can be traced to a measurement, a budget and an outcome.",
      },
      {
        kind: "features",
        title: "Three commitments",
        items: [
          { title: "Evidence with provenance", body: "Every number carries its model version, its input data and its uncertainty. Nothing is presented as validated without evidence.", icon: "shield" },
          { title: "Communities as first-class entities", body: "Villages and nomadic communities are modelled directly, not reduced to a generic beneficiary record.", icon: "users" },
          { title: "Value that returns", body: "Market access, tourism and restoration finance are designed so revenue reaches the stewards of the land.", icon: "sprout" },
        ],
      },
      { kind: "bullets", title: "What this is not", items: ["Not a carbon-credit issuance platform", "Not a cryptocurrency or token product", "Not a replacement for legal land-tenure records", "Not a claim of scientific validation"] },
      { kind: "cta", title: "Read the ecosystem model", body: "See how the layers fit together.", action: "Explore the ecosystem", to: "/ecosystem" },
    ],
  },
  impact: {
    eyebrow: "Impact",
    title: "How impact is defined and measured.",
    description: "Our measurement principles, the indicators we track and the safeguards that keep claims honest.",
    lead: "We do not publish headline impact numbers that cannot be reproduced. This page explains the method, not a marketing result.",
    blocks: [
      {
        kind: "paragraph",
        title: "Measurement before claims",
        body: "Impact is reported only when it is derived from a recorded baseline, a defined intervention and a stated uncertainty. Where those do not exist, the result is marked as not measured rather than estimated for presentation.",
      },
      {
        kind: "features",
        title: "What we track",
        items: [
          { title: "Water balance", body: "Precipitation, evapotranspiration, runoff, recharge and storage change, each with units and period.", icon: "water" },
          { title: "Soil condition", body: "Organic carbon, salinity, texture and erosion risk where sampling exists.", icon: "soil" },
          { title: "Vegetation", body: "Seasonal indices and land-cover change from reproducible remote-sensing series.", icon: "satellite" },
          { title: "Livelihoods", body: "Market access, tourism income and restoration activity, reported by the owning organization.", icon: "store" },
        ],
      },
      { kind: "bullets", title: "Safeguards", items: ["No modelled value is labelled as an observed measurement", "No project outcome is inferred from a dashboard", "Sensitive community data is not published", "Uncertainty is reported alongside every indicator"] },
      { kind: "cta", title: "See the scientific engine", body: "HyDroMA documents how each indicator is produced.", action: "Open HyDroMA", to: "/hydroma" },
    ],
  },
  projects: {
    eyebrow: "Projects",
    title: "Restoration projects as accountable records.",
    description: "How projects are structured, what they contain and how they connect to landscapes, communities and evidence.",
    lead: "A project in Eco Nojin is a record with a baseline, interventions, milestones, budget lines and monitoring evidence — not a slide in a report.",
    blocks: [
      {
        kind: "features",
        title: "What a project record holds",
        items: [
          { title: "Baseline", body: "The starting condition with its data source, date and uncertainty.", icon: "chart" },
          { title: "Interventions", body: "Activities, locations, responsible parties and planned timing.", icon: "sprout" },
          { title: "Milestones", body: " verifiable checkpoints with evidence attached, not self-declared completion.", icon: "shield" },
          { title: "Monitoring", body: "Indicator series linked to HyDroMA results and field observations.", icon: "satellite" },
        ],
      },
      { kind: "bullets", title: "Related records", items: ["Landscape and territory boundaries", "Community and stakeholder participation", "Budget and finance lines where authorized", "MRV evidence and reports"] },
      { kind: "paragraph", title: "No fabricated progress", body: "This public page does not list live projects because no production project data is connected yet. The workspace module renders registry content only; operational data requires an authorized backend." },
      { kind: "cta", title: "Open the workspace", body: "Project management lives in the platform workspace.", action: "Go to the platform", to: "/platform/projects" },
    ],
  },
  marketplace: {
    eyebrow: "Marketplace",
    title: "A marketplace grounded in real records.",
    description: "How the Eco Nojin marketplace connects producers, sellers and buyers without pretending a transaction happened.",
    lead: "The marketplace renders the real product, seller and category catalog from the API. Orders, payments and settlement are not implemented in this release and are never simulated.",
    blocks: [
      {
        kind: "paragraph",
        title: "Real catalog, honest boundaries",
        body: "Products, sellers and categories come from the live catalog endpoints. When the catalog is empty, the page says so; it never shows invented listings to look complete.",
      },
      {
        kind: "features",
        title: "What works today",
        items: [
          { title: "Product catalog", body: "Real products with price, unit and stock, scoped to your organization.", icon: "store" },
          { title: "Sellers", body: "Verified seller records with their kind and region.", icon: "users" },
          { title: "Categories", body: "The shared category tree used across the marketplace.", icon: "compass" },
        ],
      },
      { kind: "bullets", title: "Not in this release", items: ["No checkout or payment", "No order lifecycle", "No settlement or wallet movement", "No fabricated transactions"] },
      { kind: "cta", title: "Open the workspace marketplace", body: "Browse the live catalog inside the platform.", action: "Go to the platform", to: "/platform/marketplace" },
    ],
  },
  accessibility: {
    eyebrow: "Accessibility",
    title: "Accessibility statement (draft).",
    description: "Our target, what has been tested and how to report a barrier.",
    lead: "This statement is a draft prepared by the engineering team. It has not been reviewed by a legal or accessibility authority.",
    blocks: [
      {
        kind: "paragraph",
        title: "Target",
        body: "Eco Nojin aims to meet WCAG 2.2 AA across its public pages and workspace, including keyboard navigation, screen-reader semantics, contrast and RTL/LTR layout.",
      },
      {
        kind: "features",
        title: "What has been checked",
        items: [
          { title: "Automated accessibility tests", body: "axe-core scans run across public, admin, market, tourism and science routes in light and dark themes.", icon: "shield" },
          { title: "RTL and localization", body: "Persian and Arabic render right-to-left from the first paint; English renders left-to-right.", icon: "globe" },
          { title: "Keyboard and semantics", body: "Shared shells provide skip links, landmarks and labelled controls.", icon: "compass" },
        ],
      },
      { kind: "bullets", title: "Known limitations", items: ["Automated scans do not prove full WCAG conformance", "Map canvas content has a text alternative but is not fully audited", "Manual screen-reader testing is ongoing"] },
      { kind: "cta", title: "Report a barrier", body: "Tell us which page and assistive technology you used.", action: "Contact us", to: "/contact" },
    ],
  },
  privacy: {
    eyebrow: "Privacy",
    title: "Privacy notice (draft).",
    description: "What this deployment stores, what it does not, and how to make a request.",
    lead: "This is a draft notice for the current preview deployment. It requires review by the data controller before production use.",
    blocks: [
      {
        kind: "paragraph",
        title: "Data minimization",
        body: "The preview stores the account details you submit, the organization you create or join, and the records you explicitly save. It does not include advertising trackers or third-party analytics.",
      },
      {
        kind: "features",
        title: "What is stored",
        items: [
          { title: "Account data", body: "Name, email and a password hash. Passwords are never stored in plain text.", icon: "shield" },
          { title: "Session cookie", body: "A session cookie keeps you signed in. It is not used to track you across other sites.", icon: "globe" },
          { title: "Content you create", body: "Projects, observations and other records you choose to save in the workspace.", icon: "chart" },
        ],
      },
      { kind: "bullets", title: "Your choices", items: ["You can request export or deletion of your account data", "Sensitive community data should not be entered into the preview", "Operational retention rules are defined by the deploying organization"] },
      { kind: "cta", title: "Ask a privacy question", body: "Contact the team with your request.", action: "Contact us", to: "/contact" },
    ],
  },
  terms: {
    eyebrow: "Terms",
    title: "Terms of use (draft).",
    description: "The conditions for using this preview, including the scientific and financial disclaimers.",
    lead: "This is a draft terms document. It is not legal advice and must be reviewed before production use.",
    blocks: [
      {
        kind: "paragraph",
        title: "Preview status",
        body: "This deployment is a functional preview provided for evaluation. It may change, and it is not offered with a service-level guarantee.",
      },
      {
        kind: "features",
        title: "Important disclaimers",
        items: [
          { title: "Scientific outputs", body: "Model results are marked NOT_VALIDATED unless validation evidence exists. They are not certified measurements.", icon: "shield" },
          { title: "No financial service", body: "The platform does not execute payments, issue carbon credits, mint tokens or provide investment advice.", icon: "store" },
          { title: "No legal land record", body: "Recording a boundary or a right does not create or prove a legal entitlement.", icon: "map" },
        ],
      },
      { kind: "bullets", title: "Acceptable use", items: ["Do not enter secrets or sensitive personal data into the preview", "Do not attempt to access another organization's data", "Do not present preview output as a certified result"] },
      { kind: "cta", title: "Questions about these terms", body: "Contact the team before relying on the platform.", action: "Contact us", to: "/contact" },
    ],
  },
};

const fa: Record<ExtraPageKey, PageContent> = {
  vision: {
    eyebrow: "چشمانداز",
    title: "احیاگری که اندازهگیری، مدیریت و به اشتراک گذاشته میشود.",
    description: "مسیر بلندمدت اکونوژین: سرزمینهایی که ارزش آنها قابل مشاهده، قابل حسابرسی و بازگشتپذیر به مردمی است که از آن مراقبت میکنند.",
    lead: "اکونوژین برای این وجود دارد که احیای سرزمینهای خشک به یک فرآیند اقتصادی و زیستمحیطی پایدار تبدیل شود، نه مجموعهای از پروژههای پراکنده.",
    blocks: [
      { kind: "paragraph", title: "تغییری که به دنبال آن هستیم", body: "سرزمینی که در آن شواهد علمی، حکمرانی بومی و معیشت محلی در یک سامانه ثبت میشود — بهطوری که تصمیمی در شورای روستا به یک اندازهگیری، یک بودجه و یک نتیجه قابل ردیابی باشد." },
      {
        kind: "features",
        title: "سه تعهد",
        items: [
          { title: "شواهد با منشأ", body: "هر عدد نسخه مدل، داده ورودی و عدم قطعیت خود را همراه دارد. بدون شاهد، هیچ چیز «معتبر» معرفی نمیشود.", icon: "shield" },
          { title: "جامعه بهعنوان موجودیت اصلی", body: "روستاها و جوامع کوچرو مستقیماً مدل میشوند، نه بهعنوان یک رکورد عمومی «ذینفع».", icon: "users" },
          { title: "ارزش بازگشتپذیر", body: "دسترسی به بازار، گردشگری و تأمین مالی احیا بهگونهای طراحی میشود که درآمد به مراقبان زمین برسد.", icon: "sprout" },
        ],
      },
      { kind: "bullets", title: "این چه چیزی نیست", items: ["پلتفرم صدور اعتبار کربن نیست", "محصول رمزارز یا توکن نیست", "جایگزین اسناد قانونی مالکیت زمین نیست", "ادعای اعتبارسنجی علمی نیست"] },
      { kind: "cta", title: "مدل زیستبوم را بخوانید", body: "ببینید لایهها چگونه به هم متصل میشوند.", action: "کاوش زیستبوم", to: "/ecosystem" },
    ],
  },
  impact: {
    eyebrow: "تأثیر",
    title: "تأثیر چگونه تعریف و اندازهگیری میشود.",
    description: "اصول اندازهگیری ما، شاخصهایی که ردیابی میکنیم و محافظهایی که ادعاها را صادق نگه میدارند.",
    lead: "ما اعداد تأثیر کلیشهای که قابل بازتولید نباشند منتشر نمیکنیم. این صفحه روش را توضیح میدهد، نه یک نتیجه تبلیغاتی.",
    blocks: [
      { kind: "paragraph", title: "اندازهگیری پیش از ادعا", body: "تأثیر تنها زمانی گزارش میشود که از یک خط پایه ثبتشده، یک مداخله تعریفشده و عدم قطعیت مشخص مشتق شده باشد. در غیر این صورت، نتیجه «اندازهگیرینشده» علامت میخورد، نه اینکه برای ارائه تخمین زده شود." },
      {
        kind: "features",
        title: "آنچه ردیابی میکنیم",
        items: [
          { title: "تراز آب", body: "بارش، تعرق و تعرق، رواناب، تغذیه و تغییر ذخیره، هر یک با واحد و دوره.", icon: "water" },
          { title: "وضعیت خاک", body: "کربن آلی، شوری، بافت و خطر فرسایش در صورت وجود نمونهبرداری.", icon: "soil" },
          { title: "پوشش گیاهی", body: "شاخصهای فصلی و تغییر کاربری زمین از سریهای سنجش از دور قابل بازتولید.", icon: "satellite" },
          { title: "معیشت", body: "دسترسی به بازار، درآمد گردشگری و فعالیت احیا، گزارششده توسط سازمان مالک.", icon: "store" },
        ],
      },
      { kind: "bullets", title: "محافظها", items: ["هیچ مقدار مدلسازیشده بهعنوان اندازهگیری مشاهدهشده برچسب نمیخورد", "هیچ نتیجه پروژه از داشبورد استنتاج نمیشود", "داده حساس جامعه منتشر نمیشود", "عدم قطعیت در کنار هر شاخص گزارش میشود"] },
      { kind: "cta", title: "موتور علمی را ببینید", body: "هیودروما مستند میکند هر شاخص چگونه تولید میشود.", action: "باز کردن هیودروما", to: "/hydroma" },
    ],
  },
  projects: {
    eyebrow: "پروژهها",
    title: "پروژههای احیا بهعنوان رکوردهای پاسخگو.",
    description: "ساختار پروژهها، محتویات آنها و اتصالشان به سرزمین، جامعه و شواهد.",
    lead: "پروژه در اکونوژین یک رکورد با خط پایه، مداخلات، نقاط عطف، ردیفهای بودجه و شواهد پایش است — نه یک اسلاید در گزارش.",
    blocks: [
      {
        kind: "features",
        title: "رکورد پروژه چه دارد",
        items: [
          { title: "خط پایه", body: "وضعیت شروع با منبع داده، تاریخ و عدم قطعیت.", icon: "chart" },
          { title: "مداخلات", body: "فعالیتها، مکانها، طرفهای مسئول و زمانبندی برنامه.", icon: "sprout" },
          { title: "نقاط عطف", body: "بازبینیهای قابل بررسی با شواهد پیوست، نه تکمیل خوداظهاری.", icon: "shield" },
          { title: "پایش", body: "سری شاخصها متصل به نتایج هیودروما و مشاهدات میدانی.", icon: "satellite" },
        ],
      },
      { kind: "bullets", title: "رکوردهای مرتبط", items: ["مرزهای سرزمین و قلمرو", "مشارکت جامعه و ذینفعان", "ردیفهای بودجه و مالی در صورت مجوز", "شواهد و گزارشهای MRV"] },
      { kind: "paragraph", title: "بدون پیشرفت ساختگی", body: "این صفحه عمومی پروژههای زنده را فهرست نمیکند، چون هنوز داده پروژه عملیاتی متصل نشده است. ماژول فضای کاری تنها محتوای رجیستری را نمایش میدهد؛ داده عملیاتی به بکاند مجاز نیاز دارد." },
      { kind: "cta", title: "باز کردن فضای کاری", body: "مدیریت پروژه در فضای کاری پلتفرم قرار دارد.", action: "رفتن به پلتفرم", to: "/platform/projects" },
    ],
  },
  marketplace: {
    eyebrow: "بازارگاه",
    title: "بازارگاهی مبتنی بر رکوردهای واقعی.",
    description: "چگونگی اتصال تولیدکنندگان، فروشندگان و خریداران در بازارگاه اکونوژین، بدون وانمود کردن به انجام تراکنش.",
    lead: "بازارگاه کاتالوگ واقعی محصول، فروشنده و دستهبندی را از API نمایش میدهد. سفارش، پرداخت و تسویه در این نسخه پیادهسازی نشده و هرگز شبیهسازی نمیشوند.",
    blocks: [
      { kind: "paragraph", title: "کاتالوگ واقعی، مرزهای صادق", body: "محصولات، فروشندگان و دستهها از نقاط پایانی واقعی کاتالوگ میآیند. اگر کاتالوگ خالی باشد، صفحه همان را میگوید و هرگز برای کامل جلوه دادن، فهرست ساختگی نشان نمیدهد." },
      {
        kind: "features",
        title: "آنچه امروز کار میکند",
        items: [
          { title: "کاتالوگ محصولات", body: "محصولات واقعی با قیمت، واحد و موجودی، در محدودهٔ سازمان شما.", icon: "store" },
          { title: "فروشندگان", body: "رکوردهای فروشندهٔ تأییدشده با نوع و منطقهٔ آنها.", icon: "users" },
          { title: "دستهبندیها", body: "درخت دستهبندی مشترک در سراسر بازارگاه.", icon: "compass" },
        ],
      },
      { kind: "bullets", title: "در این نسخه نیست", items: ["بدون پرداخت یا تسویه", "بدون چرخهٔ سفارش", "بدون تسویه یا حرکت کیف پول", "بدون تراکنش ساختگی"] },
      { kind: "cta", title: "باز کردن بازارگاه فضای کاری", body: "کاوش کاتالوگ زنده درون پلتفرم.", action: "رفتن به پلتفرم", to: "/platform/marketplace" },
    ],
  },
  accessibility: {
    eyebrow: "دسترسپذیری",
    title: "بیانیه دسترسپذیری (پیشنویس).",
    description: "هدف ما، آنچه آزمایش شده و نحوه گزارش یک مانع.",
    lead: "این بیانیه یک پیشنویس تهیهشده توسط تیم مهندسی است و توسط مرجع حقوقی یا دسترسپذیری بازبینی نشده است.",
    blocks: [
      { kind: "paragraph", title: "هدف", body: "اکونوژین در پی دستیابی به WCAG 2.2 AA در صفحات عمومی و فضای کاری است، از جمله ناوبری با صفحهکلید، معناشناسی صفحهخوان، کنتراست و چیدمان راستبهچپ/چپبهراست." },
      {
        kind: "features",
        title: "آنچه بررسی شده",
        items: [
          { title: "آزمونهای خودکار دسترسپذیری", body: "اسکنهای axe-core روی مسیرهای عمومی، مدیریتی، بازار، گردشگری و علم در تم روشن و تاریک اجرا میشود.", icon: "shield" },
          { title: "راستبهچپ و بومیسازی", body: "فارسی و عربی از همان رندر اول راستبهچپ نمایش داده میشوند؛ انگلیسی چپبهراست.", icon: "globe" },
          { title: "صفحهکلید و معنا", body: "پوستههای مشترک دارای لینک پرش، نشانگرهای ناحیهای و کنترلهای برچسبدار هستند.", icon: "compass" },
        ],
      },
      { kind: "bullets", title: "محدودیتهای شناختهشده", items: ["اسکن خودکار اثبات کامل انطباق WCAG نیست", "محتوای بوم نقشه جایگزین متنی دارد اما بهطور کامل حسابرسی نشده", "آزمون دستی صفحهخوان در حال انجام است"] },
      { kind: "cta", title: "گزارش یک مانع", body: "بگویید کدام صفحه و کدام فناوری کمکی را استفاده کردهاید.", action: "تماس با ما", to: "/contact" },
    ],
  },
  privacy: {
    eyebrow: "حریم خصوصی",
    title: "اطلاعیه حریم خصوصی (پیشنویس).",
    description: "این استقرار چه چیزی ذخیره میکند، چه چیزی را نه، و چگونه درخواست دهید.",
    lead: "این یک پیشنویس برای استقرار پیشنمایش فعلی است و پیش از استفاده عملیاتی باید توسط کنترلکننده داده بازبینی شود.",
    blocks: [
      { kind: "paragraph", title: "کمنداده", body: "پیشنمایش جزئیات حسابی که ارسال میکنید، سازمانی که میسازید یا به آن میپیوندید، و رکوردهایی را که صریحاً ذخیره میکنید نگه میدارد. ردیاب تبلیغاتی یا تحلیل شخص ثالث ندارد." },
      {
        kind: "features",
        title: "آنچه ذخیره میشود",
        items: [
          { title: "داده حساب", body: "نام، ایمیل و هش گذرواژه. گذرواژه هرگز بهصورت متن ساده ذخیره نمیشود.", icon: "shield" },
          { title: "کوکی نشست", body: "یک کوکی نشست شما را وارد نگه میدارد و برای ردیابی شما در سایتهای دیگر استفاده نمیشود.", icon: "globe" },
          { title: "محتوای شما", body: "پروژهها، مشاهدات و رکوردهایی که در فضای کاری ذخیره میکنید.", icon: "chart" },
        ],
      },
      { kind: "bullets", title: "انتخابهای شما", items: ["میتوانید صدور یا حذف داده حساب خود را درخواست کنید", "داده حساس جامعه را در پیشنمایش وارد نکنید", "قواعد نگهداشت عملیاتی توسط سازمان استقرارکننده تعیین میشود"] },
      { kind: "cta", title: "پرسش حریم خصوصی", body: "با درخواست خود با تیم تماس بگیرید.", action: "تماس با ما", to: "/contact" },
    ],
  },
  terms: {
    eyebrow: "شرایط",
    title: "شرایط استفاده (پیشنویس).",
    description: "شرایط استفاده از این پیشنمایش، از جمله سلب مسئولیت علمی و مالی.",
    lead: "این یک سند شرایط پیشنویس است. توصیه حقوقی نیست و باید پیش از استفاده عملیاتی بازبینی شود.",
    blocks: [
      { kind: "paragraph", title: "وضعیت پیشنمایش", body: "این استقرار یک پیشنمایش کاربردی برای ارزیابی است. ممکن است تغییر کند و با تضمین سطح سرویس ارائه نمیشود." },
      {
        kind: "features",
        title: "سلب مسئولیت مهم",
        items: [
          { title: "خروجیهای علمی", body: "نتایج مدل تا زمان وجود شاهد اعتبارسنجی NOT_VALIDATED علامت میخورند و اندازهگیری معتبر نیستند.", icon: "shield" },
          { title: "بدون سرویس مالی", body: "پلتفرم پرداخت انجام نمیدهد، اعتبار کربن صادر نمیکند، توکن نمیسازد و توصیه سرمایهگذاری نمیدهد.", icon: "store" },
          { title: "بدون رکورد قانونی زمین", body: "ثبت یک مرز یا حق، ایجاد یا اثبات حق قانونی نمیکند.", icon: "map" },
        ],
      },
      { kind: "bullets", title: "استفاده مجاز", items: ["رمزها یا داده شخصی حساس را در پیشنمایش وارد نکنید", "به داده سازمان دیگر دسترسی پیدا نکنید", "خروجی پیشنمایش را بهعنوان نتیجه معتبر معرفی نکنید"] },
      { kind: "cta", title: "پرسش درباره این شرایط", body: "پیش از اتکا به پلتفرم با تیم تماس بگیرید.", action: "تماس با ما", to: "/contact" },
    ],
  },
};

const ar: Record<ExtraPageKey, PageContent> = {
  vision: {
    eyebrow: "الرؤية",
    title: "استعادة تُقاس وتُدار وتُتقاسم.",
    description: "الاتجاه طويل المدى لإيكو نوجين: أراضٍ تُرى قيمتها ويمكن التحقق منها وتعود إلى القائمين على رعايتها.",
    lead: "يهدف إيكو نوجين إلى جعل استعادة الأراضي الجافة عملية اقتصادية وبيئية مستدامة لا سلسلة مشاريع منفصلة.",
    blocks: [
      { kind: "paragraph", title: "التغيير الذي نسعى إليه", body: "أرض تُسجَّل فيها الأدلة العلمية والحوكمة المحلية وسبل العيش في نظام واحد، بحيث يمكن تتبع قرار في مجلس قرية إلى قياس وميزانية ونتيجة." },
      {
        kind: "features",
        title: "ثلاثة التزامات",
        items: [
          { title: "أدلة بمصدرها", body: "كل رقم يحمل إصدار النموذج وبياناته وعدم اليقين. لا شيء يُعرض على أنه مُتحقَّق دون دليل.", icon: "shield" },
          { title: "المجتمع ككيان أساسي", body: "القرى والجماعات الرعوية تُنمذج مباشرة لا كسجل مستفيد عام.", icon: "users" },
          { title: "قيمة تعود", body: "الوصول إلى السوق والسياحة وتمويل الاستعادة مصممة لتصل الإيرادات إلى القائمين على الأرض.", icon: "sprout" },
        ],
      },
      { kind: "bullets", title: "ما ليس هذا", items: ["ليس منصة لإصدار أرصدة الكربون", "ليس منتج عملات مشفرة أو رموز", "ليس بديلاً عن السجلات القانونية للأراضي", "ليس ادعاءً بالتحقق العلمي"] },
      { kind: "cta", title: "اقرأ نموذج المنظومة", body: "انظر كيف تتصل الطبقات.", action: "استكشف المنظومة", to: "/ecosystem" },
    ],
  },
  impact: {
    eyebrow: "الأثر",
    title: "كيف يُعرَّف الأثر ويُقاس.",
    description: "مبادئ القياس لدينا والمؤشرات التي نتتبعها والضوابط التي تحفظ صدق الادعاءات.",
    lead: "لا ننشر أرقام أثر عامة لا يمكن إعادة إنتاجها. تشرح هذه الصفحة المنهجية لا نتيجة تسويقية.",
    blocks: [
      { kind: "paragraph", title: "القياس قبل الادعاء", body: "يُبلَّغ الأثر فقط عند اشتقاقه من خط أساس مسجل وتدخل محدد وعدم يقين معلن. وإلا تُوسم النتيجة كغير مقاسة بدلاً من تقديرها لأغراض العرض." },
      {
        kind: "features",
        title: "ما نتتبع",
        items: [
          { title: "توازن المياه", body: "الأمطار والنتح والتدفق والتغذية وتغير المخزون، لكل منها وحدة وفترة.", icon: "water" },
          { title: "حالة التربة", body: "الكربون العضوي والملوحة والقوام وخطر الانجراف حيث توجد عينات.", icon: "soil" },
          { title: "الغطاء النباتي", body: "مؤشرات موسمية وتغير استخدام الأراضي من سلاسل استشعار عن بعد قابلة لإعادة الإنتاج.", icon: "satellite" },
          { title: "سبل العيش", body: "الوصول إلى السوق ودخل السياحة ونشاط الاستعادة، تُبلّغها المؤسسة المالكة.", icon: "store" },
        ],
      },
      { kind: "bullets", title: "الضوابط", items: ["لا تُصنف قيمة منمذجة على أنها قياس ملاحظ", "لا تُستنتج نتيجة مشروع من لوحة معلومات", "لا تُنشر بيانات المجتمع الحساسة", "يُبلَّغ عدم اليقين مع كل مؤشر"] },
      { kind: "cta", title: "شاهد المحرك العلمي", body: "يوثق هيودروما كيفية إنتاج كل مؤشر.", action: "افتح هيودروما", to: "/hydroma" },
    ],
  },
  projects: {
    eyebrow: "المشاريع",
    title: "مشاريع الاستعادة كسجلات خاضعة للمساءلة.",
    description: "كيف تُهيكل المشاريع وما تحتويه وكيف تتصل بالأراضي والمجتمعات والأدلة.",
    lead: "المشروع في إيكو نوجين سجل له خط أساس وتدخلات ومعالم وبنود ميزانية وأدلة مراقبة، لا شريحة في تقرير.",
    blocks: [
      {
        kind: "features",
        title: "ما يحويه سجل المشروع",
        items: [
          { title: "خط الأساس", body: "الحالة الابتدائية مع مصدر البيانات والتاريخ وعدم اليقين.", icon: "chart" },
          { title: "التدخلات", body: "الأنشطة والمواقع والأطراف المسؤولة والتوقيت المخطط.", icon: "sprout" },
          { title: "المعالم", body: "نقاط تحقق قابلة للمراجعة مع أدلة مرفقة، لا إكمال معلن ذاتياً.", icon: "shield" },
          { title: "المراقبة", body: "سلاسل المؤشرات المرتبطة بنتائج هيودروما وملاحظات ميدانية.", icon: "satellite" },
        ],
      },
      { kind: "bullets", title: "السجلات المرتبطة", items: ["حدود الأرض والنطاق", "مشاركة المجتمع وأصحاب المصلحة", "بنود الميزانية والمالية عند التفويض", "أدلة وتقارير التحقق"] },
      { kind: "paragraph", title: "لا تقدم مصطنع", body: "لا تسرد هذه الصفحة العامة مشاريع حية لأنه لا توجد بيانات مشروع تشغيلية متصلة بعد. يعرض وحدة مساحة العمل محتوى السجل فقط؛ البيانات التشغيلية تتطلب خلفية مصرح بها." },
      { kind: "cta", title: "افتح مساحة العمل", body: "إدارة المشاريع في مساحة عمل المنصة.", action: "اذهب إلى المنصة", to: "/platform/projects" },
    ],
  },
  marketplace: {
    eyebrow: "السوق",
    title: "سوق قائم على سجلات حقيقية.",
    description: "كيف يربط سوق إيكو نوجين المنتجين والبائعين والمشترين دون ادعاء حدوث معاملة.",
    lead: "يعرض السوق كتالوج المنتجات والبائعين والفئات الحقيقي من الـ API. لا تُنفَّذ الطلبات أو المدفوعات أو التسوية في هذا الإصدار ولا تُحاكى أبداً.",
    blocks: [
      { kind: "paragraph", title: "كتالوج حقيقي وحدود صادقة", body: "تأتي المنتجات والبائعون والفئات من نقاط نهاية الكتالوج الحقيقية. عندما يكون الكتالوج فارغاً تقول الصفحة ذلك ولا تعرض قوائم مُختلقة لتبدو مكتملة." },
      {
        kind: "features",
        title: "ما يعمل اليوم",
        items: [
          { title: "كتالوج المنتجات", body: "منتجات حقيقية بالسعر والوحدة والمخزون ضمن مؤسستك.", icon: "store" },
          { title: "البائعون", body: "سجلات بائعين موثقة بنوعها ومنطقتها.", icon: "users" },
          { title: "الفئات", body: "شجرة الفئات المشتركة في كل أنحاء السوق.", icon: "compass" },
        ],
      },
      { kind: "bullets", title: "ليس في هذا الإصدار", items: ["لا دفع أو تسوية", "لا دورة حياة للطلب", "لا تسوية أو حركة محفظة", "لا معاملات مُختلقة"] },
      { kind: "cta", title: "افتح سوق مساحة العمل", body: "تصفح الكتالوج الحي داخل المنصة.", action: "اذهب إلى المنصة", to: "/platform/marketplace" },
    ],
  },
  accessibility: {
    eyebrow: "إمكانية الوصول",
    title: "بيان إمكانية الوصول (مسودة).",
    description: "هدفنا وما تم اختباره وكيفية الإبلاغ عن حاجز.",
    lead: "هذا البيان مسودة أعدها فريق الهندسة ولم يراجعه مرجع قانوني أو مختص بإمكانية الوصول.",
    blocks: [
      { kind: "paragraph", title: "الهدف", body: "يسعى إيكو نوجين للوصول إلى WCAG 2.2 AA في صفحاته العامة ومساحة العمل، بما في ذلك التنقل بلوحة المفاتيح ودلالات قارئ الشاشة والتباين وتخطيط RTL/LTR." },
      {
        kind: "features",
        title: "ما تم فحصه",
        items: [
          { title: "اختبارات إمكانية الوصول الآلية", body: "تعمل فحوص axe-core على مسارات الجمهور والإدارة والسوق والسياحة والعلوم في السمتين الفاتح والداكن.", icon: "shield" },
          { title: "RTL والتوطين", body: "الفارسية والعربية تُعرض من اليمين إلى اليسار منذ الرسم الأول؛ الإنجليزية من اليسار إلى اليمين.", icon: "globe" },
          { title: "لوحة المفاتيح والدلالات", body: "توفر الأصداف المشتركة روابط تخطٍ ومعالم منطقة وعناصر تحكم موسومة.", icon: "compass" },
        ],
      },
      { kind: "bullets", title: "القيود المعروفة", items: ["الفحص الآلي لا يثبت الامتثال الكامل لـ WCAG", "محتوى لوحة الخريطة له بديل نصي لكنه لم يُدقَّق بالكامل", "اختبار قارئ الشاشة اليدوي جارٍ"] },
      { kind: "cta", title: "الإبلاغ عن حاجز", body: "أخبرنا بالصفحة وتقنية المساعدة التي استخدمتها.", action: "اتصل بنا", to: "/contact" },
    ],
  },
  privacy: {
    eyebrow: "الخصوصية",
    title: "إشعار الخصوصية (مسودة).",
    description: "ما يخزنه هذا النشر وما لا يخزنه وكيفية تقديم طلب.",
    lead: "هذه مسودة إشعار للنشر التجريبي الحالي وتتطلب مراجعة من متحكم البيانات قبل الاستخدام الإنتاجي.",
    blocks: [
      { kind: "paragraph", title: "تقليل البيانات", body: "يحتفظ العرض التجريبي بتفاصيل الحساب التي ترسلها والمؤسسة التي تنشئها أو تنضم إليها والسجلات التي تحفظها صراحة. لا يتضمن أدوات تتبع إعلانية أو تحليلات طرف ثالث." },
      {
        kind: "features",
        title: "ما يتم تخزينه",
        items: [
          { title: "بيانات الحساب", body: "الاسم والبريد الإلكتروني وتجزئة كلمة المرور. لا تُخزن كلمات المرور كنص صريح.", icon: "shield" },
          { title: "ملف تعريف الجلسة", body: "ملف تعريف ارتباط يبقيك مسجلاً ولا يُستخدم لتتبعك عبر مواقع أخرى.", icon: "globe" },
          { title: "المحتوى الذي تنشئه", body: "المشاريع والملاحظات والسجلات الأخرى التي تختار حفظها في مساحة العمل.", icon: "chart" },
        ],
      },
      { kind: "bullets", title: "خياراتك", items: ["يمكنك طلب تصدير أو حذف بيانات حسابك", "لا تُدخل بيانات مجتمع حساسة في العرض التجريبي", "تحدد مؤسسة النشر قواعد الاحتفاظ التشغيلية"] },
      { kind: "cta", title: "اسأل عن الخصوصية", body: "تواصل مع الفريق بطلبك.", action: "اتصل بنا", to: "/contact" },
    ],
  },
  terms: {
    eyebrow: "الشروط",
    title: "شروط الاستخدام (مسودة).",
    description: "شروط استخدام هذا العرض التجريبي بما في ذلك إخلاء المسؤولية العلمية والمالية.",
    lead: "هذه مسودة وثيقة شروط وليست مشورة قانونية ويجب مراجعتها قبل الاستخدام الإنتاجي.",
    blocks: [
      { kind: "paragraph", title: "حالة العرض التجريبي", body: "هذا النشر عرض تجريبي وظيفي للتقييم. قد يتغير ولا يُقدم مع ضمان مستوى خدمة." },
      {
        kind: "features",
        title: "إخلاء مسؤولية مهم",
        items: [
          { title: "المخرجات العلمية", body: "تُوسم نتائج النماذج كـ NOT_VALIDATED ما لم توجد أدلة تحقق وليست قياسات معتمدة.", icon: "shield" },
          { title: "لا خدمة مالية", body: "لا تنفذ المنصة مدفوعات ولا تصدر أرصدة كربون ولا تسك عملات ولا تقدم توصيات استثمارية.", icon: "store" },
          { title: "لا سجل قانوني للأراضي", body: "تسجيل حد أو حق لا ينشئ ولا يثبت استحقاقاً قانونياً.", icon: "map" },
        ],
      },
      { kind: "bullets", title: "الاستخدام المقبول", items: ["لا تُدخل أسراراً أو بيانات شخصية حساسة في العرض التجريبي", "لا تحاول الوصول إلى بيانات مؤسسة أخرى", "لا تقدم مخرجات العرض التجريبي كنتيجة معتمدة"] },
      { kind: "cta", title: "أسئلة حول هذه الشروط", body: "تواصل مع الفريق قبل الاعتماد على المنصة.", action: "اتصل بنا", to: "/contact" },
    ],
  },
};

export const EXTRA_PAGES: Record<"fa" | "en" | "ar", Record<ExtraPageKey, PageContent>> = { fa, en, ar };

export function getExtraPage(locale: string, key: ExtraPageKey): PageContent {
  if (locale === "fa") return fa[key];
  if (locale === "ar") return ar[key];
  return en[key];
}