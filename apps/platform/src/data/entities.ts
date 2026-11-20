/**
 * Demo fixtures for the platform workspace.
 *
 * Every record carries the fields the platform requires of real data: a place,
 * a period, a source, a method and an uncertainty. Numbers are stored as
 * strings and formatted through the i18n formatter, so Persian pages never show
 * Latin digits (the defect found in the visual review).
 */
export type Loc = { fa: string; en: string; ar: string };

export type StatusKey = "active" | "watch" | "degraded" | "planned" | "done" | "pending" | "verified" | "draft";

export type UnitKey =
  | "ha"
  | "km2"
  | "people"
  | "households"
  | "head"
  | "mm"
  | "m3"
  | "pct"
  | "toman"
  | "day"
  | "ton"
  | "tco2"
  | "km"
  | "count";

export type FactKey =
  | "area"
  | "population"
  | "households"
  | "elevation"
  | "rainfall"
  | "waterUse"
  | "soilOrganic"
  | "ndvi"
  | "erosion"
  | "livestock"
  | "yield"
  | "irrigationNeed"
  | "carbonStock"
  | "emission"
  | "budget"
  | "progress"
  | "members"
  | "balance"
  | "duration"
  | "records"
  | "coverage"
  | "accuracy"
  | "period"
  | "uncertainty"
  | "beneficiaries"
  | "areaRestored"
  | "income"
  | "cost"
  | "species"
  | "jobs"
  | "courses"
  | "learners"
  | "articles"
  | "version"
  | "uptime"
  | "latency"
  | "files";

export const FACT_LABELS: Record<FactKey, Loc> = {
  area: { fa: "مساحت", en: "Area", ar: "المساحة" },
  population: { fa: "جمعیت", en: "Population", ar: "السكان" },
  households: { fa: "خانوار", en: "Households", ar: "الأسر" },
  elevation: { fa: "ارتفاع", en: "Elevation", ar: "الارتفاع" },
  rainfall: { fa: "بارش سالانه", en: "Annual rainfall", ar: "الهطول السنوي" },
  waterUse: { fa: "مصرف آب", en: "Water use", ar: "استهلاك المياه" },
  soilOrganic: { fa: "کربن آلی خاک", en: "Soil organic carbon", ar: "الكربون العضوي للتربة" },
  ndvi: { fa: "شاخص پوشش گیاهی", en: "NDVI", ar: "مؤشر الغطاء النباتي" },
  erosion: { fa: "فرسایش", en: "Erosion", ar: "التعرية" },
  livestock: { fa: "دام", en: "Livestock", ar: "المواشي" },
  yield: { fa: "عملکرد", en: "Yield", ar: "الإنتاجية" },
  irrigationNeed: { fa: "نیاز آبی", en: "Irrigation need", ar: "احتياج الري" },
  carbonStock: { fa: "ذخیره کربن", en: "Carbon stock", ar: "مخزون الكربون" },
  emission: { fa: "کاهش انتشار", en: "Avoided emissions", ar: "خفض الانبعاثات" },
  budget: { fa: "بودجه", en: "Budget", ar: "الميزانية" },
  progress: { fa: "پیشرفت", en: "Progress", ar: "التقدم" },
  members: { fa: "اعضا", en: "Members", ar: "الأعضاء" },
  balance: { fa: "مانده", en: "Balance", ar: "الرصيد" },
  duration: { fa: "مدت", en: "Duration", ar: "المدة" },
  records: { fa: "رکورد", en: "Records", ar: "السجلات" },
  coverage: { fa: "پوشش", en: "Coverage", ar: "التغطية" },
  accuracy: { fa: "دقت", en: "Accuracy", ar: "الدقة" },
  period: { fa: "دوره", en: "Period", ar: "الفترة" },
  uncertainty: { fa: "عدم‌قطعیت", en: "Uncertainty", ar: "عدم اليقين" },
  beneficiaries: { fa: "بهره‌برداران", en: "Beneficiaries", ar: "المستفيدون" },
  areaRestored: { fa: "سطح احیا", en: "Restored area", ar: "المساحة المستعادة" },
  income: { fa: "درآمد", en: "Income", ar: "الإيراد" },
  cost: { fa: "هزینه", en: "Cost", ar: "التكلفة" },
  species: { fa: "گونه", en: "Species", ar: "الأنواع" },
  jobs: { fa: "اشتغال", en: "Jobs", ar: "الوظائف" },
  courses: { fa: "دوره", en: "Courses", ar: "الدورات" },
  learners: { fa: "فراگیر", en: "Learners", ar: "المتعلمون" },
  articles: { fa: "مقاله", en: "Articles", ar: "المقالات" },
  version: { fa: "نسخه", en: "Version", ar: "الإصدار" },
  uptime: { fa: "دسترس‌پذیری", en: "Uptime", ar: "التوافر" },
  latency: { fa: "تأخیر", en: "Latency", ar: "الكمون" },
  files: { fa: "فایل", en: "Files", ar: "الملفات" },
};

export const UNIT_LABELS: Record<UnitKey, Loc> = {
  ha: { fa: "هکتار", en: "ha", ar: "هكتار" },
  km2: { fa: "کیلومترمربع", en: "km²", ar: "كم²" },
  people: { fa: "نفر", en: "people", ar: "شخص" },
  households: { fa: "خانوار", en: "households", ar: "أسرة" },
  head: { fa: "رأس", en: "head", ar: "رأس" },
  mm: { fa: "میلی‌متر", en: "mm", ar: "مم" },
  m3: { fa: "مترمکعب", en: "m³", ar: "م³" },
  pct: { fa: "درصد", en: "%", ar: "٪" },
  toman: { fa: "تومان", en: "toman", ar: "تومان" },
  day: { fa: "روز", en: "days", ar: "يوم" },
  ton: { fa: "تن", en: "t", ar: "طن" },
  tco2: { fa: "تن CO₂e", en: "t CO₂e", ar: "طن CO₂e" },
  km: { fa: "کیلومتر", en: "km", ar: "كم" },
  count: { fa: "مورد", en: "records", ar: "سجل" },
};

export type Fact = [key: FactKey, value: string, unit?: UnitKey];

export type Entity = {
  id: string;
  name: string;
  sub: Loc;
  status: StatusKey;
  tags: string[];
  facts: Fact[];
  series?: number[];
  source?: string;
  method?: string;
  updated?: string;
  uncertainty?: string;
};

const SUB = {
  village: { fa: "روستا", en: "Village", ar: "قرية" },
  territory: { fa: "قلمرو عشایری", en: "Nomadic territory", ar: "إقليم رعوي" },
  rangeland: { fa: "مرتع", en: "Rangeland", ar: "مرعى" },
  farm: { fa: "مزرعه", en: "Farm", ar: "مزرعة" },
  resource: { fa: "منبع طبیعی", en: "Natural resource", ar: "مورد طبيعي" },
  stakeholder: { fa: "ذی‌نفع", en: "Stakeholder", ar: "صاحب مصلحة" },
  crop: { fa: "محصول", en: "Crop", ar: "محصول" },
  plan: { fa: "برنامه کشت", en: "Cropping plan", ar: "خطة الزراعة" },
  irrigation: { fa: "دستور آبیاری", en: "Irrigation order", ar: "أمر الري" },
  health: { fa: "پایش سلامت", en: "Crop health", ar: "صحة المحصول" },
  input: { fa: "نهاده", en: "Input", ar: "مدخل" },
  livestock: { fa: "دامداری", en: "Livestock", ar: "الثروة الحيوانية" },
  site: { fa: "سایت پایش", en: "Monitoring site", ar: "موقع رصد" },
  carbon: { fa: "سایت کربن", en: "Carbon site", ar: "موقع الكربون" },
  methodology: { fa: "روش‌شناسی", en: "Methodology", ar: "المنهجية" },
  report: { fa: "گزارش", en: "Report", ar: "تقرير" },
  dataset: { fa: "مجموعه داده", en: "Dataset", ar: "مجموعة بيانات" },
  project: { fa: "پروژه", en: "Project", ar: "مشروع" },
  task: { fa: "وظیفه", en: "Task", ar: "مهمة" },
  budget: { fa: "بودجه", en: "Budget line", ar: "بند الميزانية" },
  article: { fa: "مقاله", en: "Article", ar: "مقالة" },
  research: { fa: "پژوهش", en: "Research", ar: "بحث" },
  indigenous: { fa: "دانش بومی", en: "Indigenous knowledge", ar: "معرفة محلية" },
  course: { fa: "دوره", en: "Course", ar: "دورة" },
  content: { fa: "محتوا", en: "Content", ar: "محتوى" },
  account: { fa: "حساب", en: "Account", ar: "حساب" },
  voucher: { fa: "سند", en: "Voucher", ar: "قيد" },
  payment: { fa: "پرداخت", en: "Payment", ar: "دفعة" },
  wallet: { fa: "کیف پول", en: "Wallet", ar: "محفظة" },
  settlement: { fa: "تسویه", en: "Settlement", ar: "تسوية" },
  notification: { fa: "اعلان", en: "Notification", ar: "إشعار" },
  message: { fa: "پیام", en: "Message", ar: "رسالة" },
  group: { fa: "گروه", en: "Group", ar: "مجموعة" },
  activity: { fa: "فعالیت", en: "Activity", ar: "نشاط" },
  user: { fa: "کاربر", en: "User", ar: "مستخدم" },
  organization: { fa: "سازمان", en: "Organization", ar: "منظمة" },
  service: { fa: "سرویس", en: "Service", ar: "خدمة" },
  audit: { fa: "رویداد", en: "Audit event", ar: "حدث تدقيق" },
} satisfies Record<string, Loc>;

const P = (source: string, method: string, updated: string, uncertainty?: string) => ({ source, method, updated, uncertainty });

export const ENTITIES = {
  village: [
    {
      id: "kondor",
      name: "کندر",
      sub: SUB.village,
      status: "active",
      tags: ["کوهستانی", "باغداری"],
      facts: [["population", "412", "people"], ["households", "128", "households"], ["area", "1850", "ha"], ["rainfall", "310", "mm"]],
      series: [38, 41, 43, 45, 44, 47, 49, 48],
      ...P("سرشماری محلی ۱۴۰۴", "مصاحبه خانوار + سنجش میدانی", "2026-10-12", "±6%"),
    },
    {
      id: "taleghan",
      name: "طالقان",
      sub: SUB.village,
      status: "active",
      tags: ["مرتعی", "دامداری"],
      facts: [["population", "680", "people"], ["households", "190", "households"], ["area", "2400", "ha"], ["livestock", "5400", "head"]],
      series: [42, 40, 41, 39, 38, 40, 41, 42],
      ...P("دفتر امور عشایر", "ثبت رسمی + پایش مرتع", "2026-09-30", "±9%"),
    },
    {
      id: "zagros",
      name: "زاگرس مرکزی",
      sub: SUB.village,
      status: "watch",
      tags: ["کشاورزی", "دیم"],
      facts: [["population", "295", "people"], ["households", "84", "households"], ["area", "1320", "ha"], ["rainfall", "420", "mm"]],
      series: [31, 33, 30, 28, 29, 27, 26, 28],
      ...P("ایستگاه هواشناسی منطقه", "سری زمانی ۱۰ ساله", "2026-11-01", "±11%"),
    },
  ],
  territory: [
    {
      id: "taleghan-migration",
      name: "قلمرو کوچ طالقان",
      sub: SUB.territory,
      status: "active",
      tags: ["ییلاق/قشلاق", "مسیر کوچ"],
      facts: [["area", "18400", "ha"], ["households", "96", "households"], ["livestock", "12800", "head"], ["duration", "120", "day"]],
      ...P("مصاحبه با شورای عشایری", "نقشه‌برداری مشارکتی", "2026-08-18", "±14%"),
    },
    {
      id: "zagros-migration",
      name: "قلمرو کوچ زاگرس",
      sub: SUB.territory,
      status: "watch",
      tags: ["مسیر در معرض خطر"],
      facts: [["area", "9600", "ha"], ["households", "54", "households"], ["livestock", "6100", "head"], ["duration", "95", "day"]],
      ...P("شورای عشایری زاگرس", "ثبت میدانی", "2026-07-02", "±18%"),
    },
  ],
  rangeland: [
    {
      id: "taleghan-rangeland",
      name: "مرتع طالقان",
      sub: SUB.rangeland,
      status: "watch",
      tags: ["گرادیان چرا", "ظرفیت"],
      facts: [["area", "5200", "ha"], ["ndvi", "0.31"], ["erosion", "12", "ton"], ["livestock", "5400", "head"]],
      series: [0.34, 0.33, 0.31, 0.3, 0.29, 0.3, 0.31, 0.31],
      ...P("Sentinel-2 L2A", "NDVI میانگین فصلی", "2026-10-28", "±12%"),
    },
    {
      id: "karkas-rangeland",
      name: "مرتع کرکس",
      sub: SUB.rangeland,
      status: "degraded",
      tags: ["فرسایش", "احیای اولویت‌دار"],
      facts: [["area", "3100", "ha"], ["ndvi", "0.22"], ["erosion", "28", "ton"], ["livestock", "2100", "head"]],
      series: [0.3, 0.28, 0.26, 0.25, 0.23, 0.22, 0.22, 0.22],
      ...P("Sentinel-2 L2A", "روند ۵ ساله NDVI", "2026-10-28", "±15%"),
    },
  ],
  farm: [
    {
      id: "kondor-terraces",
      name: "تراس‌های کندر",
      sub: SUB.farm,
      status: "active",
      tags: ["باغ", "آبیاری قطره‌ای"],
      facts: [["area", "12.5", "ha"], ["waterUse", "6800", "m3"], ["yield", "4.2", "ton"]],
      ...P("ثبت کشاورز", "پایش مزرعه", "2026-10-20", "±8%"),
    },
    {
      id: "zagros-wheat-farm",
      name: "مزرعه گندم زاگرس",
      sub: SUB.farm,
      status: "active",
      tags: ["دیم", "گندم"],
      facts: [["area", "46", "ha"], ["waterUse", "0", "m3"], ["yield", "1.9", "ton"], ["soilOrganic", "0.9", "pct"]],
      ...P("ثبت کشاورز", "پایش مزرعه", "2026-09-14", "±12%"),
    },
  ],
  resource: [
    {
      id: "karaj-aquifer",
      name: "سفره آب زیرزمینی کرج",
      sub: SUB.resource,
      status: "degraded",
      tags: ["افت سطح", "ممنوعیت برداشت"],
      facts: [["area", "4200", "km2"], ["waterUse", "18.4", "m3"], ["rainfall", "280", "mm"]],
      ...P("پیزومترهای منطقه", "میانگین ۱۲ ماه", "2026-10-05", "±10%"),
    },
    {
      id: "kondor-spring",
      name: "چشمه کندر",
      sub: SUB.resource,
      status: "watch",
      tags: ["آب شرب", "کیفیت"],
      facts: [["waterUse", "0.42", "m3"], ["rainfall", "310", "mm"]],
      ...P("آزمایشگاه آب منطقه‌ای", "نمونه‌برداری فصلی", "2026-09-22", "±7%"),
    },
  ],
  stakeholder: [
    {
      id: "shora-kondor",
      name: "شورای روستای کندر",
      sub: SUB.stakeholder,
      status: "active",
      tags: ["جامعه محلی", "تصمیم‌گیر"],
      facts: [["members", "7"], ["households", "128", "households"]],
      ...P("صورت‌جلسه شورا", "ثبت رسمی", "2026-10-01"),
    },
    {
      id: "coop-taleghan",
      name: "تعاونی عشایری طالقان",
      sub: SUB.stakeholder,
      status: "active",
      tags: ["بهره‌بردار", "دام"],
      facts: [["members", "96"], ["livestock", "12800", "head"]],
      ...P("ثبت تعاونی", "اسناد رسمی", "2026-08-18"),
    },
    {
      id: "watershed-office",
      name: "اداره منابع طبیعی",
      sub: SUB.stakeholder,
      status: "active",
      tags: ["ناظر", "مجوز"],
      facts: [["members", "12"]],
      ...P("ساختار سازمانی", "سند رسمی", "2026-01-10"),
    },
  ],
  crop: [
    {
      id: "saffron",
      name: "زعفران",
      sub: SUB.crop,
      status: "active",
      tags: ["کشت کم‌آب", "ارزش بالا"],
      facts: [["area", "8", "ha"], ["irrigationNeed", "420", "mm"], ["yield", "0.006", "ton"]],
      ...P("الگوی کشت منطقه", "آزمایش مزرعه", "2026-06-30", "±9%"),
    },
    {
      id: "wheat-dry",
      name: "گندم دیم",
      sub: SUB.crop,
      status: "watch",
      tags: ["دیم", "ریسک اقلیمی"],
      facts: [["area", "46", "ha"], ["irrigationNeed", "0", "mm"], ["yield", "1.9", "ton"]],
      ...P("آمار جهاد کشاورزی", "سری ۵ ساله", "2026-09-14", "±14%"),
    },
    {
      id: "walnut",
      name: "گردو",
      sub: SUB.crop,
      status: "active",
      tags: ["باغ", "دیربازده"],
      facts: [["area", "22", "ha"], ["irrigationNeed", "780", "mm"], ["yield", "3.1", "ton"]],
      ...P("ثبت باغدار", "پایش باغ", "2026-10-02", "±10%"),
    },
  ],
  plan: [
    {
      id: "plan-1405",
      name: "برنامه کشت ۱۴۰۵",
      sub: SUB.plan,
      status: "draft",
      tags: ["تقویم", "تخصیص آب"],
      facts: [["area", "86", "ha"], ["waterUse", "12400", "m3"], ["duration", "365", "day"]],
      ...P("دفتر کشاورزی", "بهینه‌سازی با نیاز آبی", "2026-11-02", "±12%"),
    },
    {
      id: "plan-rotation",
      name: "تناوب سه‌ساله",
      sub: SUB.plan,
      status: "planned",
      tags: ["خاک", "کاهش فرسایش"],
      facts: [["area", "54", "ha"], ["duration", "1095", "day"]],
      ...P("کمیته فنی", "پیشنهاد مدل", "2026-10-11", "±15%"),
    },
  ],
  irrigation: [
    {
      id: "irr-kondor-1",
      name: "دستور آبیاری تراس ۳",
      sub: SUB.irrigation,
      status: "pending",
      tags: ["قطره‌ای", "هفتگی"],
      facts: [["irrigationNeed", "34", "mm"], ["duration", "7", "day"], ["waterUse", "410", "m3"]],
      ...P("HyDroMA water balance", "نیاز خالص آبیاری", "2026-11-10", "±18%"),
    },
    {
      id: "irr-zagros-2",
      name: "دستور آبیاری مزرعه زاگرس",
      sub: SUB.irrigation,
      status: "done",
      tags: ["دیم", "بدون آبیاری"],
      facts: [["irrigationNeed", "0", "mm"], ["duration", "10", "day"]],
      ...P("HyDroMA water balance", "بارش مؤثر", "2026-11-08", "±20%"),
    },
  ],
  health: [
    {
      id: "health-kondor",
      name: "پایش سلامت باغ کندر",
      sub: SUB.health,
      status: "active",
      tags: ["NDVI", "تنش آبی"],
      facts: [["ndvi", "0.46"], ["area", "12.5", "ha"]],
      series: [0.52, 0.5, 0.49, 0.47, 0.46, 0.45, 0.46, 0.46],
      ...P("Sentinel-2 L2A", "NDVI هفتگی", "2026-11-01", "±11%"),
    },
    {
      id: "health-wheat",
      name: "پایش سلامت گندم زاگرس",
      sub: SUB.health,
      status: "watch",
      tags: ["تنش خشکی"],
      facts: [["ndvi", "0.28"], ["area", "46", "ha"]],
      series: [0.42, 0.38, 0.34, 0.31, 0.29, 0.28, 0.28, 0.28],
      ...P("Sentinel-2 L2A", "NDVI هفتگی", "2026-11-01", "±13%"),
    },
  ],
  input: [
    {
      id: "seed-wheat",
      name: "بذر گندم دیم",
      sub: SUB.input,
      status: "active",
      tags: ["بذر", "گواهی‌شده"],
      facts: [["records", "46", "count"], ["cost", "18", "toman"]],
      ...P("انبار تعاونی", "موجودی ثبت‌شده", "2026-10-01"),
    },
    {
      id: "fert-compost",
      name: "کمپوست دامی",
      sub: SUB.input,
      status: "pending",
      tags: ["کود آلی"],
      facts: [["records", "12", "ton"], ["cost", "9", "toman"]],
      ...P("انبار تعاونی", "موجودی ثبت‌شده", "2026-10-14"),
    },
  ],
  livestock: [
    {
      id: "herd-taleghan",
      name: "گله طالقان",
      sub: SUB.livestock,
      status: "active",
      tags: ["گوسفند", "کوچ"],
      facts: [["livestock", "980", "head"], ["area", "5200", "ha"]],
      ...P("دفتر دامداری", "سرشماری دام", "2026-09-01", "±7%"),
    },
    {
      id: "herd-zagros",
      name: "گله زاگرس",
      sub: SUB.livestock,
      status: "watch",
      tags: ["بز", "ظرفیت مرتع"],
      facts: [["livestock", "420", "head"], ["area", "3100", "ha"]],
      ...P("دفتر دامداری", "سرشماری دام", "2026-09-01", "±9%"),
    },
  ],
  site: [
    {
      id: "mrv-karkas",
      name: "سایت احیای کرکس",
      sub: SUB.site,
      status: "degraded",
      tags: ["تخریب", "اولویت"],
      facts: [["area", "3100", "ha"], ["ndvi", "0.22"], ["erosion", "28", "ton"]],
      series: [0.3, 0.28, 0.26, 0.25, 0.23, 0.22, 0.22, 0.22],
      ...P("Sentinel-2", "روند NDVI", "2026-10-28", "±15%"),
    },
    {
      id: "mrv-kondor",
      name: "سایت احیای کندر",
      sub: SUB.site,
      status: "active",
      tags: ["احیای موفق"],
      facts: [["area", "620", "ha"], ["ndvi", "0.41"], ["areaRestored", "180", "ha"]],
      series: [0.28, 0.3, 0.33, 0.36, 0.38, 0.4, 0.41, 0.41],
      ...P("Sentinel-2", "روند NDVI", "2026-10-28", "±10%"),
    },
  ],
  carbon: [
    {
      id: "carbon-karkas",
      name: "کربن مرتع کرکس",
      sub: SUB.carbon,
      status: "draft",
      tags: ["خاک", "پوشش گیاهی"],
      facts: [["carbonStock", "18400", "tco2"], ["area", "3100", "ha"], ["uncertainty", "22", "pct"]],
      ...P("IPCC 2006 + اندازه‌گیری میدانی", "روش Tier 2", "2026-10-30", "±22%"),
    },
    {
      id: "carbon-kondor",
      name: "کربن باغ کندر",
      sub: SUB.carbon,
      status: "verified",
      tags: ["بیومس", "باغ"],
      facts: [["carbonStock", "2400", "tco2"], ["area", "1850", "ha"], ["uncertainty", "12", "pct"]],
      ...P("اندازه‌گیری درخت", "روش آلوومتریک", "2026-09-18", "±12%"),
    },
  ],
  methodology: [
    {
      id: "meth-soil",
      name: "روش کربن خاک",
      sub: SUB.methodology,
      status: "verified",
      tags: ["Tier 2", "نمونه‌برداری"],
      facts: [["version", "2.1"], ["coverage", "3100", "ha"], ["accuracy", "88", "pct"]],
      ...P("IPCC 2006", "نمونه‌برداری تصادفی طبقه‌بندی‌شده", "2026-06-01"),
    },
    {
      id: "meth-ndvi",
      name: "روش پایش پوشش گیاهی",
      sub: SUB.methodology,
      status: "active",
      tags: ["سنجش از دور"],
      facts: [["version", "1.4"], ["coverage", "18400", "ha"], ["accuracy", "91", "pct"]],
      ...P("Sentinel-2 L2A", "NDVI + اصلاح ابری", "2026-05-12"),
    },
  ],
  report: [
    {
      id: "rep-mrv-1405",
      name: "گزارش MRV ۱۴۰۵",
      sub: SUB.report,
      status: "draft",
      tags: ["سالانه"],
      facts: [["period", "1405"], ["records", "124", "count"], ["coverage", "6200", "ha"]],
      ...P("سامانه MRV", "تجمیع سایت‌ها", "2026-11-05", "±14%"),
    },
    {
      id: "rep-water-1404",
      name: "گزارش تراز آب ۱۴۰۴",
      sub: SUB.report,
      status: "verified",
      tags: ["علمی"],
      facts: [["period", "1404"], ["records", "88", "count"], ["coverage", "4200", "km2"]],
      ...P("HyDroMA", "بیلان آب سالانه", "2026-03-20", "±11%"),
    },
    {
      id: "rep-finance-q3",
      name: "گزارش مالی سه‌ماهه",
      sub: SUB.report,
      status: "done",
      tags: ["مالی"],
      facts: [["period", "1405-Q3"], ["records", "312", "count"], ["balance", "1840", "toman"]],
      ...P("دفتر کل", "صورت‌های مالی", "2026-10-31"),
    },
  ],
  dataset: [
    {
      id: "ds-sentinel",
      name: "Sentinel-2 L2A",
      sub: SUB.dataset,
      status: "active",
      tags: ["ماهواره", "۱۰ متر"],
      facts: [["records", "1840", "count"], ["coverage", "18400", "ha"], ["period", "2019-2026"]],
      series: [12, 18, 22, 26, 31, 34, 38, 41],
      ...P("Copernicus", "پردازش ابری", "2026-11-01", "±5%"),
    },
    {
      id: "ds-stations",
      name: "ایستگاه‌های زمینی",
      sub: SUB.dataset,
      status: "active",
      tags: ["زمینی", "روزانه"],
      facts: [["records", "14", "count"], ["coverage", "4200", "km2"], ["period", "2018-2026"]],
      ...P("سازمان هواشناسی", "کیفیت‌سنجی", "2026-11-01", "±8%"),
    },
  ],
  project: [
    {
      id: "prj-karkas",
      name: "احیای مرتع کرکس",
      sub: SUB.project,
      status: "active",
      tags: ["احیای مرتع", "قرضه"],
      facts: [["areaRestored", "3100", "ha"], ["budget", "4200", "toman"], ["progress", "38", "pct"], ["beneficiaries", "96", "people"]],
      series: [8, 14, 19, 24, 29, 33, 36, 38],
      ...P("سامانه پروژه‌ها", "گزارش پیشرفت", "2026-11-08", "±9%"),
    },
    {
      id: "prj-kondor",
      name: "باغ‌های پایدار کندر",
      sub: SUB.project,
      status: "done",
      tags: ["باغ", "آبیاری"],
      facts: [["areaRestored", "180", "ha"], ["budget", "2600", "toman"], ["progress", "100", "pct"], ["beneficiaries", "128", "people"]],
      series: [20, 40, 55, 70, 82, 92, 98, 100],
      ...P("سامانه پروژه‌ها", "گزارش پایانی", "2026-09-30", "±6%"),
    },
    {
      id: "prj-taleghan",
      name: "مدیریت چرای طالقان",
      sub: SUB.project,
      status: "planned",
      tags: ["مرتع", "مشارکتی"],
      facts: [["areaRestored", "5200", "ha"], ["budget", "3100", "toman"], ["progress", "4", "pct"], ["beneficiaries", "96", "people"]],
      ...P("سامانه پروژه‌ها", "برنامه اولیه", "2026-10-20", "±15%"),
    },
  ],
  task: [
    {
      id: "task-seed",
      name: "تأمین بذر بومی",
      sub: SUB.task,
      status: "active",
      tags: ["تدارکات"],
      facts: [["progress", "60", "pct"], ["duration", "14", "day"]],
      ...P("برنامه عملیاتی", "پیشرفت ثبت‌شده", "2026-11-09"),
    },
    {
      id: "task-fence",
      name: "حصارکشی منطقه قرق",
      sub: SUB.task,
      status: "pending",
      tags: ["عملیات میدانی"],
      facts: [["progress", "0", "pct"], ["duration", "21", "day"]],
      ...P("برنامه عملیاتی", "پیشرفت ثبت‌شده", "2026-11-01"),
    },
    {
      id: "task-survey",
      name: "نقشه‌برداری مشارکتی",
      sub: SUB.task,
      status: "done",
      tags: ["مطالعات"],
      facts: [["progress", "100", "pct"], ["duration", "9", "day"]],
      ...P("برنامه عملیاتی", "پیشرفت ثبت‌شده", "2026-10-12"),
    },
  ],
  budget: [
    {
      id: "bud-operations",
      name: "عملیات میدانی",
      sub: SUB.budget,
      status: "active",
      tags: ["سرفصل"],
      facts: [["budget", "1800", "toman"], ["cost", "920", "toman"], ["progress", "51", "pct"]],
      ...P("سامانه مالی", "تعهد و پرداخت", "2026-11-05"),
    },
    {
      id: "bud-equipment",
      name: "تجهیزات پایش",
      sub: SUB.budget,
      status: "active",
      tags: ["سرفصل"],
      facts: [["budget", "900", "toman"], ["cost", "640", "toman"], ["progress", "71", "pct"]],
      ...P("سامانه مالی", "تعهد و پرداخت", "2026-11-05"),
    },
    {
      id: "bud-training",
      name: "آموزش جامعه محلی",
      sub: SUB.budget,
      status: "pending",
      tags: ["سرفصل"],
      facts: [["budget", "300", "toman"], ["cost", "0", "toman"], ["progress", "0", "pct"]],
      ...P("سامانه مالی", "تعهد و پرداخت", "2026-10-30"),
    },
  ],
  article: [
    {
      id: "art-ndvi",
      name: "پایش NDVI در مراتع نیمه‌خشک",
      sub: SUB.article,
      status: "verified",
      tags: ["داوری‌شده", "سنجش از دور"],
      facts: [["articles", "1", "count"], ["period", "2025"]],
      ...P("مجله سنجش از دور", "داوری همتا", "2026-02-11"),
    },
    {
      id: "art-water",
      name: "بیلان آب در حوضه‌های کوهستانی",
      sub: SUB.article,
      status: "draft",
      tags: ["پیش‌چاپ"],
      facts: [["articles", "1", "count"], ["period", "2026"]],
      ...P("پیش‌چاپ", "بازبینی داخلی", "2026-10-01"),
    },
  ],
  research: [
    {
      id: "res-karkas",
      name: "اثربخشی قرق بر احیای مرتع",
      sub: SUB.research,
      status: "active",
      tags: ["۵ ساله", "مشارکتی"],
      facts: [["duration", "1825", "day"], ["coverage", "3100", "ha"], ["beneficiaries", "96", "people"]],
      ...P("پروتکل پژوهش", "طرح آزمایشی", "2026-04-01", "±12%"),
    },
    {
      id: "res-carbon",
      name: "پتانسیل ترسیب کربن خاک",
      sub: SUB.research,
      status: "planned",
      tags: ["کربن", "خاک"],
      facts: [["duration", "1095", "day"], ["coverage", "6200", "ha"]],
      ...P("پروتکل پژوهش", "نمونه‌برداری", "2026-09-01", "±20%"),
    },
  ],
  indigenous: [
    {
      id: "ind-water",
      name: "آب‌بندی سنتی کندر",
      sub: SUB.indigenous,
      status: "verified",
      tags: ["دانش بومی", "آب"],
      facts: [["records", "12", "count"], ["period", "1404"]],
      ...P("مصاحبه با سه بهره‌بردار", "ثبت با رضایت", "2026-06-15"),
    },
    {
      id: "ind-grazing",
      name: "تقویم چرای سنتی",
      sub: SUB.indigenous,
      status: "active",
      tags: ["مرتع", "عشایری"],
      facts: [["records", "8", "count"], ["period", "1405"]],
      ...P("شورای عشایری", "ثبت مشارکتی", "2026-08-20"),
    },
  ],
  course: [
    {
      id: "course-mrv",
      name: "مبانی MRV",
      sub: SUB.course,
      status: "active",
      tags: ["آموزشی", "آنلاین"],
      facts: [["courses", "1", "count"], ["learners", "124", "people"], ["duration", "6", "day"]],
      ...P("دانش‌یار", "دوره خودآموز", "2026-10-01"),
    },
    {
      id: "course-irrigation",
      name: "آبیاری کارآمد",
      sub: SUB.course,
      status: "planned",
      tags: ["کشاورزی"],
      facts: [["courses", "1", "count"], ["learners", "0", "people"], ["duration", "4", "day"]],
      ...P("دانش‌یار", "دوره در برنامه", "2026-11-01"),
    },
  ],
  contentItem: [
    {
      id: "content-guide",
      name: "راهنمای برنامه کشت",
      sub: SUB.content,
      status: "active",
      tags: ["راهنما", "PDF"],
      facts: [["files", "1", "count"], ["period", "1405"]],
      ...P("دانش‌یار", "تولید داخلی", "2026-09-10"),
    },
    {
      id: "content-video",
      name: "فیلم آموزشی پایش مرتع",
      sub: SUB.content,
      status: "draft",
      tags: ["ویدئو"],
      facts: [["files", "1", "count"], ["duration", "1", "day"]],
      ...P("دانش‌یار", "تولید داخلی", "2026-10-22"),
    },
  ],
  account: [
    {
      id: "acc-cash",
      name: "صندوق نقدی",
      sub: SUB.account,
      status: "active",
      tags: ["دارایی"],
      facts: [["balance", "1840", "toman"], ["records", "312", "count"]],
      ...P("دفتر کل", "حسابداری دوطرفه", "2026-11-10"),
    },
    {
      id: "acc-projects",
      name: "حساب پروژه‌ها",
      sub: SUB.account,
      status: "active",
      tags: ["تعهد"],
      facts: [["balance", "4200", "toman"], ["records", "96", "count"]],
      ...P("دفتر کل", "حسابداری دوطرفه", "2026-11-10"),
    },
    {
      id: "acc-sellers",
      name: "حساب فروشندگان",
      sub: SUB.account,
      status: "watch",
      tags: ["تسویه"],
      facts: [["balance", "760", "toman"], ["records", "48", "count"]],
      ...P("دفتر کل", "حسابداری دوطرفه", "2026-11-09"),
    },
  ],
  voucher: [
    {
      id: "vch-1042",
      name: "سند خرید تجهیزات",
      sub: SUB.voucher,
      status: "done",
      tags: ["بدهکار/بستانکار"],
      facts: [["cost", "640", "toman"], ["records", "4", "count"]],
      ...P("اسناد مالی", "ثبت دستی + پیوست", "2026-11-04"),
    },
    {
      id: "vch-1043",
      name: "سند درآمد فروش",
      sub: SUB.voucher,
      status: "pending",
      tags: ["درآمد"],
      facts: [["income", "210", "toman"], ["records", "3", "count"]],
      ...P("فروش بازارگاه", "تولید خودکار", "2026-11-08"),
    },
  ],
  payment: [
    {
      id: "pay-2201",
      name: "پرداخت به تعاونی",
      sub: SUB.payment,
      status: "done",
      tags: ["حواله"],
      facts: [["cost", "320", "toman"], ["period", "1405-Q3"]],
      ...P("درگاه بانکی", "تأیید تراکنش", "2026-10-20"),
    },
    {
      id: "pay-2202",
      name: "پرداخت خدمات پایش",
      sub: SUB.payment,
      status: "pending",
      tags: ["در انتظار تأیید"],
      facts: [["cost", "85", "toman"], ["period", "1405-Q4"]],
      ...P("درگاه بانکی", "در انتظار", "2026-11-06"),
    },
  ],
  wallet: [
    {
      id: "wal-kondor",
      name: "کیف پول روستای کندر",
      sub: SUB.wallet,
      status: "active",
      tags: ["جامعه"],
      facts: [["balance", "240", "toman"], ["records", "18", "count"]],
      ...P("کیف پول", "مجوز خزانه", "2026-11-10"),
    },
    {
      id: "wal-seller",
      name: "کیف پول فروشنده",
      sub: SUB.wallet,
      status: "active",
      tags: ["فروشنده"],
      facts: [["balance", "96", "toman"], ["records", "22", "count"]],
      ...P("کیف پول", "مجوز خزانه", "2026-11-10"),
    },
  ],
  settlement: [
    {
      id: "set-1405-10",
      name: "تسویه مهر ۱۴۰۵",
      sub: SUB.settlement,
      status: "done",
      tags: ["فروشندگان"],
      facts: [["balance", "410", "toman"], ["records", "12", "count"]],
      ...P("سامانه تسویه", "دوره ماهانه", "2026-10-31"),
    },
    {
      id: "set-1405-11",
      name: "تسویه آبان ۱۴۰۵",
      sub: SUB.settlement,
      status: "pending",
      tags: ["در انتظار"],
      facts: [["balance", "188", "toman"], ["records", "7", "count"]],
      ...P("سامانه تسویه", "دوره ماهانه", "2026-11-10"),
    },
  ],
  notification: [
    {
      id: "ntf-1",
      name: "هشدار تنش آبی در زاگرس",
      sub: SUB.notification,
      status: "watch",
      tags: ["علمی", "فوری"],
      facts: [["period", "1405-08-26"]],
      ...P("HyDroMA", "آستانه NDVI", "2026-11-17"),
    },
    {
      id: "ntf-2",
      name: "تأیید گزارش MRV",
      sub: SUB.notification,
      status: "done",
      tags: ["گزارش"],
      facts: [["period", "1405-08-24"]],
      ...P("سامانه MRV", "گردش‌کار تأیید", "2026-11-15"),
    },
  ],
  message: [
    {
      id: "msg-1",
      name: "هماهنگی بازدید میدانی",
      sub: SUB.message,
      status: "active",
      tags: ["گروه منظر"],
      facts: [["records", "6", "count"]],
      ...P("پیام‌ها", "گفت‌وگوی داخلی", "2026-11-18"),
    },
    {
      id: "msg-2",
      name: "درخواست عضویت در گروه",
      sub: SUB.message,
      status: "pending",
      tags: ["درخواست"],
      facts: [["records", "1", "count"]],
      ...P("پیام‌ها", "درخواست کاربر", "2026-11-17"),
    },
  ],
  group: [
    {
      id: "grp-kondor",
      name: "گروه مدیریت منظر کندر",
      sub: SUB.group,
      status: "active",
      tags: ["مشارکتی"],
      facts: [["members", "18"], ["records", "42", "count"]],
      ...P("سامانه گروه‌ها", "ثبت عضویت", "2026-11-01"),
    },
    {
      id: "grp-karkas",
      name: "کارگروه احیای کرکس",
      sub: SUB.group,
      status: "active",
      tags: ["پروژه"],
      facts: [["members", "9"], ["records", "27", "count"]],
      ...P("سامانه گروه‌ها", "ثبت عضویت", "2026-10-22"),
    },
  ],
  activity: [
    {
      id: "act-1",
      name: "تصویب برنامه احیا",
      sub: SUB.activity,
      status: "done",
      tags: ["تصمیم"],
      facts: [["period", "1405-08-20"]],
      ...P("گروه منظر کرکس", "صورت‌جلسه", "2026-11-11"),
    },
    {
      id: "act-2",
      name: "درخواست بازدید فنی",
      sub: SUB.activity,
      status: "pending",
      tags: ["درخواست"],
      facts: [["period", "1405-08-25"]],
      ...P("گروه منظر کندر", "درخواست کاربر", "2026-11-16"),
    },
  ],
  user: [
    {
      id: "usr-nadia",
      name: "نادیا رحیمی",
      sub: SUB.user,
      status: "active",
      tags: ["مدیر منظر", "کارشناس"],
      facts: [["records", "24", "count"]],
      ...P("هویت", "ثبت سازمانی", "2026-10-01"),
    },
    {
      id: "usr-omid",
      name: "امید کریمی",
      sub: SUB.user,
      status: "active",
      tags: ["پژوهشگر"],
      facts: [["records", "12", "count"]],
      ...P("هویت", "ثبت سازمانی", "2026-09-12"),
    },
    {
      id: "usr-sara",
      name: "سارا احمدی",
      sub: SUB.user,
      status: "pending",
      tags: ["فروشنده"],
      facts: [["records", "3", "count"]],
      ...P("هویت", "در انتظار تأیید", "2026-11-02"),
    },
  ],
  organization: [
    {
      id: "org-karaj",
      name: "شورای آبخیز کرج",
      sub: SUB.organization,
      status: "active",
      tags: ["منظر", "حوضه"],
      facts: [["members", "12"], ["coverage", "4200", "km2"]],
      ...P("ثبت سازمان", "سند رسمی", "2026-02-11"),
    },
    {
      id: "org-kondor",
      name: "تعاونی کندر",
      sub: SUB.organization,
      status: "active",
      tags: ["تعاونی"],
      facts: [["members", "128"], ["coverage", "1850", "ha"]],
      ...P("ثبت سازمان", "سند رسمی", "2026-01-20"),
    },
  ],
  service: [
    {
      id: "svc-hydroma",
      name: "HyDroMA",
      sub: SUB.service,
      status: "active",
      tags: ["علمی"],
      facts: [["uptime", "99.4", "pct"], ["latency", "180"], ["version", "1.1"]],
      ...P("پایش سرویس", "سلامت‌سنجی", "2026-11-19"),
    },
    {
      id: "svc-market",
      name: "بازارگاه",
      sub: SUB.service,
      status: "active",
      tags: ["تجاری"],
      facts: [["uptime", "99.8", "pct"], ["latency", "120"], ["version", "0.9"]],
      ...P("پایش سرویس", "سلامت‌سنجی", "2026-11-19"),
    },
    {
      id: "svc-mrv",
      name: "MRV",
      sub: SUB.service,
      status: "watch",
      tags: ["علمی"],
      facts: [["uptime", "97.2", "pct"], ["latency", "340"], ["version", "0.7"]],
      ...P("پایش سرویس", "سلامت‌سنجی", "2026-11-19"),
    },
  ],
  audit: [
    {
      id: "aud-1",
      name: "تغییر نقش کاربر",
      sub: SUB.audit,
      status: "done",
      tags: ["امنیتی"],
      facts: [["period", "1405-08-26"]],
      ...P("گزارش ممیزی", "ثبت رویداد", "2026-11-17"),
    },
    {
      id: "aud-2",
      name: "انتشار گزارش MRV",
      sub: SUB.audit,
      status: "done",
      tags: ["محتوا"],
      facts: [["period", "1405-08-24"]],
      ...P("گزارش ممیزی", "ثبت رویداد", "2026-11-15"),
    },
  ],
} satisfies Record<string, Entity[]>;

export type EntityKey = keyof typeof ENTITIES;

export function list(key: EntityKey): Entity[] {
  return ENTITIES[key] as Entity[];
}

export function find(key: EntityKey, id: string): Entity | undefined {
  return list(key).find((item) => item.id === id);
}

/** Look an id up across every collection (used by register pages). */
export function findAny(id: string): Entity | undefined {
  for (const items of Object.values(ENTITIES)) {
    const match = (items as Entity[]).find((item) => item.id === id);
    if (match) return match;
  }
  return undefined;
}
