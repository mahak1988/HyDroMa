import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Button, Card, CardBody } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useAgriTasks } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };
const L = {
  eyebrow: { fa: "برنامهٔ زمانی", en: "Schedule", ar: "الجدول" },
  title: { fa: "برنامهٔ کارها", en: "Task schedule", ar: "جدول المهام" },
  prev: { fa: "ماه قبل", en: "Prev", ar: "السابق" },
  next: { fa: "ماه بعد", en: "Next", ar: "التالي" },
  planned: { fa: "شروع", en: "start", ar: "بداية" },
  due: { fa: "موعد", en: "due", ar: "استحقاق" },
  overdue: { fa: "عقب‌افتاده", en: "overdue", ar: "متأخر" },
  none: { fa: "کاری در این ماه نیست.", en: "No tasks this month.", ar: "لا مهام هذا الشهر." },
};

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Lightweight month schedule from real task records (no extra dependency). */
export function TaskSchedule() {
  const { locale } = useI18n();
  const l = (v: Loc) => tl(v, locale);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const q = useAgriTasks({ startFrom: iso(new Date(month.getFullYear(), month.getMonth(), 1)), startTo: iso(new Date(month.getFullYear(), month.getMonth() + 1, 0)) });

  const byDate = useMemo(() => {
    const m = new Map<string, { id: string; title: string; kind: string; overdue: boolean }[]>();
    for (const t of q.data?.items ?? []) {
      const overdue = !!t.dueAt && t.status !== "completed" && t.status !== "verified" && t.status !== "cancelled" && Date.parse(t.dueAt) < Date.now();
      if (t.plannedStart) m.set(t.plannedStart, [...(m.get(t.plannedStart) ?? []), { id: t.id, title: t.title, kind: "planned", overdue: false }]);
      if (t.dueAt) m.set(t.dueAt, [...(m.get(t.dueAt) ?? []), { id: t.id, title: t.title, kind: "due", overdue }]);
    }
    return m;
  }, [q.data]);

  const year = month.getFullYear();
  const mo = month.getMonth();
  const first = new Date(year, mo, 1).getDay();
  const days = new Date(year, mo + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const monthLabel = month.toLocaleDateString(locale === "fa" ? "fa-IR" : locale === "ar" ? "ar" : "en", { year: "numeric", month: "long" });
  const today = iso(new Date());

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div><p className="pl-eyebrow">{l(L.eyebrow)}</p><h1>{l(L.title)}</h1></div>
        <div className="pl-pageActions">
          <Button variant="secondary" size="sm" onClick={() => setMonth(new Date(year, mo - 1, 1))}>{l(L.prev)}</Button>
          <span className="pl-count">{monthLabel}</span>
          <Button variant="secondary" size="sm" onClick={() => setMonth(new Date(year, mo + 1, 1))}>{l(L.next)}</Button>
        </div>
      </header>

      <ApiBoundary state={q}>
        <Card><CardBody className="!p-0"><div className="pl-tableWrap"><table className="pl-table"><tbody>
          <tr>
            {cells.map((day, i) => {
              const key = day ? iso(new Date(year, mo, day)) : `e${i}`;
              const items = day ? byDate.get(key) ?? [] : [];
              return (
                <td key={key} className="pl-calCell" style={{ verticalAlign: "top", width: "14%" }}>
                  {day ? <><span className={key === today ? "pl-calToday" : "pl-calDay"}>{day}</span>{items.map((it, j) => (
                    <Link key={j} className="pl-calItem" to={`/platform/tasks/${it.id}`}><Badge tone={it.overdue ? "danger" : it.kind === "due" ? "warning" : "info"}>{it.kind === "due" ? l(L.due) : l(L.planned)}</Badge> {it.title}</Link>
                  ))}</> : null}
                </td>
              );
            })}
          </tr>
        </tbody></table></div>{q.data && q.data.total === 0 ? <div className="p-4"><ApiEmpty /></div> : null}</CardBody></Card>
      </ApiBoundary>
    </div>
  );
}