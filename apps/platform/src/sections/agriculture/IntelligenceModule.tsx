import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader } from "@eco-nojin/ui";
import { ApiBoundary } from "../../components/ApiState";
import { useIntelligence } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };
const L = {
  eyebrow: { fa: "هوش عملیات کشاورزی", en: "Agricultural operations intelligence", ar: "ذكاء العمليات الزراعية" },
  title: { fa: "نمای عملیات", en: "Operations overview", ar: "نظرة العمليات" },
  overview: { fa: "نمای کلی", en: "Overview", ar: "نظرة عامة" },
  priorities: { fa: "اولویت‌های عملیاتی", en: "Operational priorities", ar: "الأولويات التشغيلية" },
  recent: { fa: "فعالیت اخیر", en: "Recent activity", ar: "النشاط الأخير" },
  operational: { fa: "این شاخص‌ها عملیاتی‌اند و ارزیابی علمی نیستند.", en: "These are operational indicators, not scientific assessments.", ar: "هذه مؤشرات تشغيلية وليست تقييمات علمية." },
  farms: { fa: "مزارع", en: "Farms", ar: "المزارع" },
  activeCycles: { fa: "دورهٔ فعال", en: "Active cycles", ar: "دورات نشطة" },
  openTasks: { fa: "کارهای باز", en: "Open tasks", ar: "مهام مفتوحة" },
  overdue: { fa: "عقب‌افتاده", en: "Overdue", ar: "متأخرة" },
  dueSoon: { fa: "نزدیک", en: "Due soon", ar: "قريبة" },
  inProgress: { fa: "در حال اجرا", en: "In progress", ar: "قيد التنفيذ" },
  completed: { fa: "تکمیل‌شده", en: "Completed", ar: "مكتملة" },
  unassigned: { fa: "بدون مسئول", en: "Unassigned", ar: "غير مسندة" },
  irrigation: { fa: "آبیاری اخیر", en: "Recent irrigation", ar: "ري حديث" },
  observations: { fa: "مشاهده اخیر", en: "Recent observations", ar: "ملاحظات حديثة" },
  reason_overdue: { fa: "عقب‌افتاده", en: "overdue", ar: "متأخر" },
  reason_due_soon: { fa: "نزدیک", en: "due soon", ar: "قريب" },
  reason_unassigned: { fa: "بدون مسئول", en: "unassigned", ar: "غير مسند" },
};
const TONE: Record<string, "danger" | "warning" | "neutral"> = { high: "danger", medium: "warning", low: "neutral" };
const REASON: Record<string, Loc> = { overdue: L.reason_overdue, due_soon: L.reason_due_soon, unassigned: L.reason_unassigned };

export function IntelligenceModule() {
  const { locale } = useI18n();
  const l = (v: Loc) => tl(v, locale);
  const q = useIntelligence();
  const m = q.data?.metrics ?? {};
  const kpis: [Loc, number | undefined][] = [
    [L.farms, m.farms], [L.activeCycles, m.activeCropCycles], [L.openTasks, m.openTasks], [L.inProgress, m.inProgressTasks],
    [L.overdue, m.overdueTasks], [L.dueSoon, m.dueSoonTasks], [L.completed, m.completedTasks], [L.unassigned, m.unassignedTasks],
    [L.irrigation, m.recentIrrigation], [L.observations, m.recentObservations],
  ];
  return (
    <div className="pl-stack">
      <header className="pl-pageHead"><div><p className="pl-eyebrow">{l(L.eyebrow)}</p><h1>{l(L.title)}</h1></div></header>
      <ApiBoundary state={q}>
        <Card><CardHeader title={l(L.overview)} /><CardBody><div className="pl-kpis">{kpis.map(([lab, val], i) => <div key={i} className="pl-kpi"><span className="pl-kpiLabel">{l(lab)}</span><span className="pl-kpiValue">{val ?? "—"}</span></div>)}</div><p className="pl-note">{l(L.operational)}</p></CardBody></Card>

        <Card><CardHeader title={l(L.priorities)} subtitle={`${q.data?.priorities.length ?? 0}`} /><CardBody>
          {(q.data?.priorities.length ?? 0) === 0 ? <p className="pl-muted">—</p> : <ul className="pl-list">{q.data!.priorities.map((p, i) => <li key={i}><span className="pl-listTitle">{p.label}</span><span className="pl-listMeta">{l(REASON[p.reason] ?? L.reason_unassigned)}{p.date ? ` · ${p.date}` : ""}</span><Badge tone={TONE[p.severity] ?? "neutral"}>{p.severity}</Badge><Link className="pl-link" to={p.to}>{l(L.title)} ←</Link></li>)}</ul>}
        </CardBody></Card>

        <Card><CardHeader title={l(L.recent)} /><CardBody>
          {(q.data?.recent.length ?? 0) === 0 ? <p className="pl-muted">—</p> : <ul className="pl-list">{q.data!.recent.map((e, i) => <li key={i}><span className="pl-listTitle">{e.label}</span><span className="pl-listMeta">{e.type} · {e.date || "—"}{e.recordCreated ? " (record)" : ""}</span><Link className="pl-link" to={e.to}>←</Link></li>)}</ul>}
        </CardBody></Card>
      </ApiBoundary>
    </div>
  );
}