import { Link, useParams } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, CardHeader } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useOrgMembers, useResourceList, useTask, useTaskEvents, useTransitionTask } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };
const L = {
  eyebrow: { fa: "جزئیات کار", en: "Task detail", ar: "تفاصيل المهمة" },
  back: { fa: "بازگشت", en: "Back", ar: "رجوع" },
  status: { fa: "وضعیت", en: "Status", ar: "الحالة" },
  priority: { fa: "اولویت", en: "Priority", ar: "الأولوية" },
  category: { fa: "دسته", en: "Category", ar: "الفئة" },
  farm: { fa: "مزرعه", en: "Farm", ar: "المزرعة" },
  cropCycle: { fa: "دورهٔ کشت", en: "Crop cycle", ar: "دورة المحصول" },
  project: { fa: "پروژه", en: "Project", ar: "المشروع" },
  assignee: { fa: "مسئول", en: "Assignee", ar: "المسؤول" },
  creator: { fa: "ایجادکننده", en: "Creator", ar: "المنشئ" },
  plannedStart: { fa: "شروع", en: "Planned start", ar: "البداية" },
  due: { fa: "موعد", en: "Due", ar: "الاستحقاق" },
  description: { fa: "توضیحات", en: "Description", ar: "الوصف" },
  completion: { fa: "تکمیل", en: "Completion", ar: "الإكمال" },
  verification: { fa: "راستی‌آزمایی", en: "Verification", ar: "التحقق" },
  history: { fa: "تاریخچه", en: "History", ar: "السجل" },
  next: { fa: "مرحلهٔ بعد", en: "Next", ar: "التالي" },
  none: { fa: "—", en: "—", ar: "—" },
  readOnly: { fa: "برای تغییر وضعیت به نقش write نیاز دارید.", en: "A write role is required to change status.", ar: "يلزم دور كتابة." },
};
const WRITE = new Set(["owner", "admin", "manager"]);
const NEXT: Record<string, string[]> = { draft: ["planned", "cancelled"], planned: ["assigned", "in_progress", "cancelled"], assigned: ["in_progress", "cancelled"], in_progress: ["completed", "cancelled"], completed: ["verified"], verified: [], cancelled: [] };
const TONE: Record<string, "success" | "info" | "neutral" | "warning" | "danger"> = { draft: "neutral", planned: "info", assigned: "info", in_progress: "warning", completed: "success", verified: "success", cancelled: "danger" };

export function TaskDetail() {
  const { id } = useParams();
  const { locale } = useI18n();
  const l = (v: Loc) => tl(v, locale);
  const { role, activeOrganizationId } = useRealSession();
  const canWrite = WRITE.has(role ?? "");
  const q = useTask(id ?? "");
  const events = useTaskEvents(id ?? "");
  const farms = useResourceList("farms");
  const members = useOrgMembers(activeOrganizationId ?? undefined);
  const transition = useTransitionTask();
  const t = q.data;
  const assigneeName = (uid: string | null) => { if (!uid) return null; const m = members.data?.items.find((x) => String(x.userId) === String(uid)); const u = (m as unknown as { user?: { name?: string } } | undefined)?.user; return u?.name ?? uid; };
  const farmName = (fid: string) => { const f = farms.data?.items.find((x) => String(x.id) === String(fid)); return f ? String(f.name ?? fid) : fid; };

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div><p className="pl-eyebrow">{l(L.eyebrow)}</p><h1>{t ? t.title : l(L.eyebrow)}</h1></div>
        <div className="pl-pageActions"><Link to="/platform/tasks"><Button variant="secondary" size="sm">{l(L.back)}</Button></Link></div>
      </header>

      <ApiBoundary state={q}>
        {t ? (
          <>
            <Card>
              <CardHeader title={t.title} subtitle={t.category} />
              <CardBody>
                <dl className="pl-defs">
                  <div><dt>{l(L.status)}</dt><dd><Badge tone={TONE[t.status] ?? "neutral"}>{t.status}</Badge></dd></div>
                  <div><dt>{l(L.priority)}</dt><dd>{t.priority}</dd></div>
                  <div><dt>{l(L.farm)}</dt><dd><Link className="pl-link" to={`/platform/agriculture/${t.farmId}`}>{farmName(t.farmId)}</Link></dd></div>
                  {t.cropCycleId ? <div><dt>{l(L.cropCycle)}</dt><dd>{t.cropCycleId}</dd></div> : null}
                  {t.projectId ? <div><dt>{l(L.project)}</dt><dd><Link className="pl-link" to={`/platform/projects/${t.projectId}`}>{t.projectId}</Link></dd></div> : null}
                  <div><dt>{l(L.assignee)}</dt><dd>{t.assigneeId ? assigneeName(t.assigneeId) : l(L.none)}</dd></div>
                  <div><dt>{l(L.creator)}</dt><dd>{t.createdBy}</dd></div>
                  <div><dt>{l(L.plannedStart)}</dt><dd>{t.plannedStart ?? l(L.none)}</dd></div>
                  <div><dt>{l(L.due)}</dt><dd>{t.dueAt ?? l(L.none)}</dd></div>
                  {t.completedAt ? <div><dt>{l(L.completion)}</dt><dd>{t.completedAt} · {t.completedBy ?? ""}</dd></div> : null}
                  {t.verifiedAt ? <div><dt>{l(L.verification)}</dt><dd>{t.verifiedAt} · {t.verifiedBy ?? ""}</dd></div> : null}
                  <div><dt>{l(L.description)}</dt><dd>{t.description || l(L.none)}</dd></div>
                </dl>
                {canWrite ? (
                  <div className="pl-actionsCell mt-3">
                    {(NEXT[t.status] ?? []).map((to) => (
                      <Button key={to} variant={to === "cancelled" ? "danger" : "secondary"} size="sm" onClick={() => transition.mutate({ id: t.id, to })} aria-label={`${l(L.next)}: ${to}`}>{l(L.next)} → {to}</Button>
                    ))}
                  </div>
                ) : <Badge tone="neutral">{l(L.readOnly)}</Badge>}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={l(L.history)} />
              <CardBody>
                <ApiBoundary state={events}>
                  {(events.data?.items.length ?? 0) === 0 ? <ApiEmpty /> : (
                    <ul className="pl-list">
                      {events.data!.items.map((e) => (
                        <li key={e.id}><span className="pl-listTitle">{e.type}</span><span className="pl-listMeta">{e.at}{e.actorId ? ` · ${e.actorId}` : ""}</span></li>
                      ))}
                    </ul>
                  )}
                </ApiBoundary>
              </CardBody>
            </Card>
          </>
        ) : <ApiEmpty />}
      </ApiBoundary>
    </div>
  );
}