import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader } from "@eco-nojin/ui";
import {
  useActivities,
  useAgriTasks,
  useAssessments,
  useChallenges,
  useEcoCoinSummary,
  useIntelligence,
  useModels,
  useResourceList,
} from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };

const L = {
  eyebrow: { fa: "دادهٔ واقعی از API", en: "Live data from the API", ar: "بيانات حية من الـ API" },
  title: { fa: "مرکز فرمان", en: "Command centre", ar: "مركز القيادة" },
  subtitle: {
    fa: "نمای یکپارچهٔ عملیات — هر عدد از API واقعی می‌آید و در نبود داده، خالی می‌ماند.",
    en: "One operational view — every number comes from the real API and stays empty when data is absent.",
    ar: "نظرة موحدة للعمليات — كل رقم يأتي من الـ API الحقيقي ويبقى فارغاً عند غياب البيانات.",
  },
  farms: { fa: "مزرعه‌های فعال", en: "Active farms", ar: "المزارع النشطة" },
  cycles: { fa: "چرخه‌های محصول", en: "Crop cycles", ar: "دورات المحاصيل" },
  openTasks: { fa: "وظایف باز", en: "Open tasks", ar: "المهام المفتوحة" },
  published: { fa: "چالش‌های منتشرشده", en: "Published challenges", ar: "التحديات المنشورة" },
  balance: { fa: "موجودی EcoCoin", en: "EcoCoin balance", ar: "رصيد EcoCoin" },
  activities: { fa: "فعالیت‌های اجتماعی", en: "Community activities", ar: "الأنشطة المجتمعية" },
  assessments: { fa: "ارزیابی‌های آمادگی", en: "Readiness assessments", ar: "تقييمات الجاهزية" },
  models: { fa: "مدل‌های علمی", en: "Scientific models", ar: "النماذج العلمية" },
  priorities: { fa: "اولویت‌های عملیاتی", en: "Operational priorities", ar: "أولويات العمليات" },
  noPriorities: { fa: "اولویت فعالی ثبت نشده است.", en: "No operational priorities recorded.", ar: "لا توجد أولويات مسجلة." },
  shortcuts: { fa: "دسترسی سریع", en: "Workspace shortcuts", ar: "اختصارات مساحة العمل" },
  empty: {
    fa: "هنوز دادهٔ عملیاتی ثبت نشده است. مقادیر خالی به‌معنای نبود رکورد است، نه عدد ساختگی.",
    en: "No operational data recorded yet. Empty values mean no records, not fabricated numbers.",
    ar: "لا توجد بيانات عملياتية بعد. القيم الفارغة تعني عدم وجود سجلات، لا أرقاماً مُصطنعة.",
  },
  agriculture: { fa: "کشاورزی", en: "Agriculture", ar: "الزراعة" },
  challenges: { fa: "چالش‌ها", en: "Challenges", ar: "التحديات" },
  ecocoin: { fa: "EcoCoin", en: "EcoCoin", ar: "EcoCoin" },
  hydroma: { fa: "HyDroMA", en: "HyDroMA", ar: "HyDroMA" },
  hic: { fa: "HIC", en: "HIC", ar: "HIC" },
};

type MetricState = { isPending?: boolean; isError?: boolean };

function Metric({ label, value, state }: { label: string; value: number | undefined; state: MetricState }) {
  const shown = state.isPending || state.isError || value === undefined ? "—" : String(value);
  return (
    <div className="pl-kpi">
      <p className="pl-kpiLabel">{label}</p>
      <p className="pl-kpiValue">{shown}</p>
    </div>
  );
}

/**
 * Real operational command centre. Every KPI is derived from an existing API
 * hook; nothing is fabricated and absent data renders as an honest empty value.
 */
export function OverviewModule() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);

  const farms = useResourceList("farms");
  const cycles = useResourceList("cropCycles");
  const tasks = useAgriTasks();
  const challenges = useChallenges();
  const eco = useEcoCoinSummary();
  const activities = useActivities();
  const assessments = useAssessments();
  const models = useModels();
  const intel = useIntelligence();

  const taskRows = (tasks.data?.items ?? []) as Array<{ status?: string }>;
  const openTasks = taskRows.filter((task) => !["completed", "verified", "cancelled"].includes(task.status ?? "")).length;
  const published = (challenges.data?.items ?? []).filter((challenge) => challenge.status === "published").length;
  const priorities = intel.data?.priorities ?? [];
  const hasAny =
    (farms.data?.items.length ?? 0) > 0 ||
    (cycles.data?.items.length ?? 0) > 0 ||
    taskRows.length > 0 ||
    (challenges.data?.items.length ?? 0) > 0 ||
    (activities.data?.items.length ?? 0) > 0;

  const shortcuts: Array<{ to: string; label: Loc }> = [
    { to: "/platform/agriculture", label: L.agriculture },
    { to: "/platform/challenges", label: L.challenges },
    { to: "/platform/ecocoin", label: L.ecocoin },
    { to: "/platform/hydroma", label: L.hydroma },
    { to: "/platform/hic", label: L.hic },
  ];

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div>
          <p className="pl-eyebrow">{l(L.eyebrow)}</p>
          <h1>{l(L.title)}</h1>
          <p className="pl-muted">{l(L.subtitle)}</p>
        </div>
      </header>

      <div className="pl-kpis">
        <Metric label={l(L.farms)} value={farms.data?.items.length} state={farms} />
        <Metric label={l(L.cycles)} value={cycles.data?.items.length} state={cycles} />
        <Metric label={l(L.openTasks)} value={tasks.data ? openTasks : undefined} state={tasks} />
        <Metric label={l(L.published)} value={challenges.data ? published : undefined} state={challenges} />
        <Metric label={l(L.balance)} value={eco.data?.balance} state={eco} />
        <Metric label={l(L.activities)} value={activities.data?.items.length} state={activities} />
        <Metric label={l(L.assessments)} value={assessments.data?.items.length} state={assessments} />
        <Metric label={l(L.models)} value={models.data?.models.length} state={models} />
      </div>

      {!hasAny && !farms.isPending && !tasks.isPending && !challenges.isPending ? (
        <p className="pl-note">{l(L.empty)}</p>
      ) : null}

      <div className="pl-twoCol">
        <Card>
          <CardHeader title={l(L.priorities)} />
          <CardBody>
            {priorities.length === 0 ? (
              <p className="pl-muted">{l(L.noPriorities)}</p>
            ) : (
              <ul className="pl-list">
                {priorities.map((item) => (
                  <li key={`${item.reason}-${item.date ?? ""}`}>
                    <span className="pl-listTitle">{item.label}</span>
                    <span className="pl-listMeta">{item.reason}</span>
                    <Badge tone={item.severity === "high" ? "danger" : item.severity === "medium" ? "warning" : "neutral"}>
                      {item.severity}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={l(L.shortcuts)} />
          <CardBody>
            <ul className="pl-chips">
              {shortcuts.map((shortcut) => (
                <li key={shortcut.to}>
                  <Link className="pl-chip" to={shortcut.to}>{l(shortcut.label)}</Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}