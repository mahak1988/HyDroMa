import type { Loc } from "./pages";

export const t = (value: Loc, locale: string): string =>
  locale === "fa" ? value.fa : locale === "ar" ? value.ar : value.en;

/**
 * Centralized labels for demo entity form fields.
 *
 * Unknown keys deliberately fall back to the raw machine key: a missing
 * translation must never be replaced by a misleading label.
 */
export const FIELD_LABELS: Record<string, Loc> = {
  name: { fa: "نام", en: "Name", ar: "الاسم" },
  region: { fa: "منطقه", en: "Region", ar: "المنطقة" },
  area: { fa: "مساحت (هکتار)", en: "Area (ha)", ar: "المساحة (هكتار)" },
  owner: { fa: "مالک", en: "Owner", ar: "المالك" },
  type: { fa: "نوع", en: "Type", ar: "النوع" },
  role: { fa: "نقش", en: "Role", ar: "الدور" },
  season: { fa: "فصل", en: "Season", ar: "الموسم" },
  period: { fa: "دوره", en: "Period", ar: "الفترة" },
  method: { fa: "روش", en: "Method", ar: "الطريقة" },
  status: { fa: "وضعیت", en: "Status", ar: "الحالة" },
  unit: { fa: "واحد", en: "Unit", ar: "الوحدة" },
  count: { fa: "تعداد", en: "Count", ar: "العدد" },
  amount: { fa: "مبلغ", en: "Amount", ar: "المبلغ" },
  version: { fa: "نسخه", en: "Version", ar: "الإصدار" },
  source: { fa: "منبع", en: "Source", ar: "المصدر" },
  summary: { fa: "خلاصه", en: "Summary", ar: "الملخص" },
  assignee: { fa: "مسئول", en: "Assignee", ar: "المسؤول" },
  topic: { fa: "موضوع", en: "Topic", ar: "الموضوع" },
  community: { fa: "جامعه", en: "Community", ar: "المجتمع" },
  duration: { fa: "مدت", en: "Duration", ar: "المدة" },
  balance: { fa: "موجودی", en: "Balance", ar: "الرصيد" },
};

export function fieldLabel(key: string, locale: string): string {
  const label = FIELD_LABELS[key];
  return label ? t(label, locale) : key;
}

export const UI = {
  skip: { fa: "پرش به محتوای اصلی", en: "Skip to main content", ar: "الانتقال إلى المحتوى" },
  menu: { fa: "منو", en: "Menu", ar: "القائمة" },
  search: { fa: "جست‌وجو در این بخش", en: "Search this section", ar: "البحث في هذا القسم" },
  theme: { fa: "پوسته", en: "Theme", ar: "السمة" },
  language: { fa: "زبان", en: "Language", ar: "اللغة" },
  breadcrumb: { fa: "مسیر", en: "Breadcrumb", ar: "المسار" },
  demo: { fa: "داده نمایشی", en: "Demo data", ar: "بيانات عرض" },
  demoNote: {
    fa: "همهٔ مقادیر این محیط نمایشی‌اند؛ هیچ نتیجه علمی اعتبارسنجی نشده و به سرویس واقعی وصل نیست.",
    en: "Every value here is demo data; nothing is scientifically validated or connected to a live service.",
    ar: "كل القيم هنا بيانات عرض؛ لا شيء معتمد علمياً أو متصل بخدمة حية.",
  },
  sections: { fa: "بخش‌ها", en: "Sections", ar: "الأقسام" },
  open: { fa: "باز کردن", en: "Open", ar: "فتح" },
  export: { fa: "خروجی", en: "Export", ar: "تصدير" },
  filter: { fa: "فیلتر", en: "Filter", ar: "تصفية" },
  all: { fa: "همه", en: "All", ar: "الكل" },
  count: { fa: "مورد", en: "records", ar: "سجل" },
  empty: { fa: "موردی برای نمایش نیست.", en: "Nothing to show.", ar: "لا يوجد شيء للعرض." },
  step: { fa: "گام", en: "Step", ar: "خطوة" },
  next: { fa: "گام بعد", en: "Next step", ar: "الخطوة التالية" },
  back: { fa: "بازگشت", en: "Back", ar: "رجوع" },
  finish: { fa: "ثبت و پایان", en: "Submit", ar: "إرسال" },
  close: { fa: "بستن", en: "Close", ar: "إغلاق" },
  create: { fa: "ایجاد", en: "Create", ar: "إنشاء" },
  saving: { fa: "در حال ذخیره…", en: "Saving…", ar: "جارٍ الحفظ…" },
  saved: { fa: "ذخیره شد (نمایشی)", en: "Saved (demo)", ar: "تم الحفظ (عرض)" },
  error: { fa: "خطا", en: "Error", ar: "خطأ" },
  demoBanner: { fa: "محیط نمایشی", en: "Demo environment", ar: "بيئة عرض" },
  demoBannerBody: {
    fa: "این صفحه فقط دادهٔ نمایشی محلی دارد؛ هیچ رکوردی در سازمان ذخیره نمی‌شود و نتیجهٔ عملیاتی نیست.",
    en: "This page contains local demo data only. Nothing is persisted to the organization and nothing here is operational.",
    ar: "تحتوي هذه الصفحة على بيانات عرض محلية فقط؛ لا يُحفظ أي سجل في المؤسسة ولا شيء هنا تشغيلي.",
  },
  demoOpen: { fa: "مشاهدهٔ صفحهٔ نمایشی", en: "Open demo page", ar: "فتح صفحة العرض" },
  draftNote: {
    fa: "پیش‌نویس — تا تأیید نهایی ثبت نمی‌شود.",
    en: "Draft — not saved until final approval.",
    ar: "مسودة — لا تُحفظ قبل الاعتماد النهائي.",
  },
  dashboard: {
    records: { fa: "رکورد فعال", en: "Active records", ar: "سجلات نشطة" },
    attention: { fa: "نیازمند توجه", en: "Needs attention", ar: "بحاجة إلى انتباه" },
    progress: { fa: "میانگین پیشرفت", en: "Average progress", ar: "متوسط التقدم" },
    coverage: { fa: "پوشش مکانی", en: "Spatial coverage", ar: "التغطية المكانية" },
    trend: { fa: "روند شاخص کلیدی", en: "Key indicator trend", ar: "اتجاه المؤشر الرئيسي" },
    alerts: { fa: "هشدارها", en: "Alerts", ar: "التنبيهات" },
    tasks: { fa: "کارهای پیشنهادی", en: "Suggested actions", ar: "إجراءات مقترحة" },
    noAlerts: { fa: "هشدار فعالی نیست.", en: "No active alerts.", ar: "لا تنبيهات نشطة." },
  },
  report: {
    summary: { fa: "خلاصه", en: "Summary", ar: "الملخص" },
    indicators: { fa: "شاخص‌ها", en: "Indicators", ar: "المؤشرات" },
    method: { fa: "روش و منبع", en: "Method and source", ar: "المنهجية والمصدر" },
    uncertainty: { fa: "عدم‌قطعیت", en: "Uncertainty", ar: "عدم اليقين" },
    recommendation: { fa: "اقدام پیشنهادی", en: "Recommended action", ar: "الإجراء المقترح" },
    boundary: {
      fa: "این گزارش یک محاسبهٔ داخلی است و اعتبار رسمی کربن یا گواهی محیط‌زیستی ایجاد نمی‌کند.",
      en: "This report is an internal calculation; it creates no official carbon credit or environmental certificate.",
      ar: "هذا التقرير حساب داخلي ولا ينشئ رصيداً كربونياً رسمياً أو شهادة بيئية.",
    },
  },
  table: {
    name: { fa: "نام و مشخصات", en: "Name and details", ar: "الاسم والبيانات" },
    status: { fa: "وضعیت", en: "Status", ar: "الحالة" },
    source: { fa: "منشأ و روش", en: "Source and method", ar: "المصدر والمنهجية" },
  },
  detail: {
    facts: { fa: "مشخصات", en: "Facts", ar: "البيانات" },
    provenance: { fa: "منشأ و روش", en: "Provenance", ar: "المصدر والمنهجية" },
    related: { fa: "سرویس‌های متصل", en: "Connected services", ar: "الخدمات المرتبطة" },
    note: { fa: "یادداشت", en: "Note", ar: "ملاحظة" },
  },
  map: {
    layers: { fa: "لایه‌ها", en: "Layers", ar: "الطبقات" },
    boundary: { fa: "محدوده", en: "Boundary", ar: "الحدود" },
    points: { fa: "نقاط پایش", en: "Monitoring points", ar: "نقاط الرصد" },
    grid: { fa: "شبکهٔ تحلیل", en: "Analysis grid", ar: "شبكة التحليل" },
    scale: { fa: "مقیاس", en: "Scale", ar: "المقياس" },
  },
  status: {
    active: { fa: "فعال", en: "Active", ar: "نشط" },
    watch: { fa: "نیازمند توجه", en: "Watch", ar: "للمراقبة" },
    degraded: { fa: "تخریب‌شده", en: "Degraded", ar: "متدهور" },
    planned: { fa: "برنامه‌ریزی‌شده", en: "Planned", ar: "مخطط" },
    done: { fa: "انجام‌شده", en: "Done", ar: "منجز" },
    pending: { fa: "در انتظار", en: "Pending", ar: "قيد الانتظار" },
    verified: { fa: "تأییدشده", en: "Verified", ar: "معتمد" },
    draft: { fa: "پیش‌نویس", en: "Draft", ar: "مسودة" },
  },
} satisfies Record<string, unknown>;

export const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  active: "success",
  done: "success",
  verified: "success",
  watch: "warning",
  pending: "warning",
  planned: "info",
  draft: "neutral",
  degraded: "danger",
};

export const SUGGESTIONS: Loc[] = [
  {
    fa: "بازبینی عدم‌قطعیت سایت‌های با خطای بیش از ۱۵٪",
    en: "Review sites whose uncertainty exceeds 15%",
    ar: "مراجعة المواقع التي يتجاوز عدم يقينها 15٪",
  },
  {
    fa: "تکمیل منشأ داده برای گزارش‌های پیش‌نویس",
    en: "Complete provenance for draft reports",
    ar: "استكمال مصدر البيانات للتقارير المسودة",
  },
  {
    fa: "تأیید درخواست‌های عضویت گروه مدیریت منظر",
    en: "Approve pending landscape group requests",
    ar: "اعتماد طلبات الانضمام إلى مجموعة المنظر",
  },
];
