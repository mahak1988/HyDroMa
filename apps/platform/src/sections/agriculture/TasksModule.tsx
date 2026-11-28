import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, Dialog, FormAlert, FormRow, Input, Select, useToast } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useAgriTasks, useCreateTask, useOrgMembers, useResourceList, useTransitionTask } from "../../services/hooks";
import { t as tl } from "../../content/ui";
import type { AgriTask } from "@eco-nojin/api-client";

type Loc = { fa: string; en: string; ar: string };
const L = {
  eyebrow: { fa: "برنامه‌ریزی و اجرای کار", en: "Work planning & execution", ar: "التخطيط والتنفيذ" },
  title: { fa: "کارهای کشاورزی", en: "Agricultural tasks", ar: "المهام الزراعية" },
  add: { fa: "افزودن کار", en: "Add task", ar: "إضافة مهمة" },
  titleCol: { fa: "عنوان", en: "Title", ar: "العنوان" },
  status: { fa: "وضعیت", en: "Status", ar: "الحالة" },
  priority: { fa: "اولویت", en: "Priority", ar: "الأولوية" },
  farm: { fa: "مزرعه", en: "Farm", ar: "المزرعة" },
  due: { fa: "موعد", en: "Due", ar: "الاستحقاق" },
  category: { fa: "دسته", en: "Category", ar: "الفئة" },
  description: { fa: "توضیحات", en: "Description", ar: "الوصف" },
  assignee: { fa: "مسئول", en: "Assignee", ar: "المسؤول" },
  plannedStart: { fa: "شروع برنامه‌ریزی‌شده", en: "Planned start", ar: "البداية المخططة" },
  none: { fa: "—", en: "—", ar: "—" },
  cancel: { fa: "انصراف", en: "Cancel", ar: "إلغاء" },
  save: { fa: "ذخیره", en: "Save", ar: "حفظ" },
  createTitle: { fa: "افزودن کار", en: "Add task", ar: "إضافة مهمة" },
  titleRequired: { fa: "عنوان باید حداقل ۲ حرف باشد.", en: "Title must be at least 2 characters.", ar: "العنوان حرفان على الأقل." },
  farmRequired: { fa: "انتخاب مزرعه الزامی است.", en: "A farm is required.", ar: "المزرعة مطلوبة." },
  created: { fa: "کار افزوده شد.", en: "Task created.", ar: "تم إنشاء المهمة." },
  advanced: { fa: "وضعیت کار به‌روزرسانی شد.", en: "Task status updated.", ar: "تم تحديث حالة المهمة." },
  readOnly: { fa: "برای مدیریت به نقش write نیاز دارید.", en: "A write role is required.", ar: "يلزم دور كتابة." },
  errorTitle: { fa: "خطا", en: "Error", ar: "خطأ" },
  next: { fa: "مرحلهٔ بعد", en: "Next", ar: "التالي" },
  overdue: { fa: "عقب‌افتاده", en: "overdue", ar: "متأخر" },
  schedule: { fa: "برنامهٔ زمانی", en: "Schedule", ar: "الجدول" },
  all: { fa: "همه", en: "All", ar: "الكل" },
  mine: { fa: "کارهای من", en: "My tasks", ar: "مهامي" },
  unassigned: { fa: "بدون مسئول", en: "Unassigned", ar: "غير مسندة" },
};
const WRITE_ROLES = new Set(["owner", "admin", "manager"]);
const CATEGORIES = ["land_prep", "planting", "irrigation", "fertilization", "weed", "pest", "disease", "harvest", "maintenance", "inspection", "restoration", "livestock", "general"];
const PRIORITIES = ["low", "normal", "high", "urgent"];
const NEXT: Record<string, string[]> = { draft: ["planned", "cancelled"], planned: ["assigned", "in_progress", "cancelled"], assigned: ["in_progress", "cancelled"], in_progress: ["completed", "cancelled"], completed: ["verified"], verified: [], cancelled: [] };
const TONE: Record<string, "success" | "info" | "neutral" | "warning" | "danger"> = { draft: "neutral", planned: "info", assigned: "info", in_progress: "warning", completed: "success", verified: "success", cancelled: "danger" };
const EMPTY = { farmId: "", cropCycleId: "", title: "", category: "general", priority: "normal", assigneeId: "", plannedStart: "", dueAt: "", description: "" };

export function TasksModule() {
  const { locale } = useI18n();
  const l = (v: Loc) => tl(v, locale);
  const { role, activeOrganizationId } = useRealSession();
  const canWrite = WRITE_ROLES.has(role ?? "");
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [view, setView] = useState("all");
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (view === "mine") params.assigneeId = "__me__";
  if (view === "unassigned") params.assigneeId = "__none__";
  const query = useAgriTasks(params);
  const farms = useResourceList("farms");
  const members = useOrgMembers(activeOrganizationId ?? undefined);
  const create = useCreateTask();
  const transition = useTransitionTask();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState<{ title?: string; farmId?: string }>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const farmName = useMemo(() => { const m = new Map<string, string>(); for (const f of farms.data?.items ?? []) m.set(String(f.id), String(f.name ?? f.id)); return m; }, [farms.data]);
  const memberName = useMemo(() => { const m = new Map<string, string>(); for (const mem of members.data?.items ?? []) { const u = (mem as unknown as { user?: { name?: string; email?: string } }).user; m.set(String(mem.userId), String(u?.name ?? u?.email ?? mem.userId)); } return m; }, [members.data]);
  const rows = query.data?.items ?? [];

  const submit = async () => {
    const e: typeof err = {};
    if (!form.farmId) e.farmId = l(L.farmRequired);
    if (form.title.trim().length < 2) e.title = l(L.titleRequired);
    setErr(e);
    if (Object.keys(e).length) return;
    try {
      await create.mutateAsync({ farmId: form.farmId, cropCycleId: form.cropCycleId || null, title: form.title.trim(), category: form.category, priority: form.priority, assigneeId: form.assigneeId || null, plannedStart: form.plannedStart || null, dueAt: form.dueAt || null, description: form.description });
      toast.push({ title: l(L.created), tone: "success" });
      setEditing(false);
    } catch (ex) { toast.push({ title: ex instanceof Error ? ex.message : l(L.errorTitle), tone: "danger" }); }
  };
  const move = async (task: AgriTask, to: string) => {
    setBusyId(task.id);
    try { await transition.mutateAsync({ id: task.id, to }); toast.push({ title: l(L.advanced), tone: "success" }); }
    catch (ex) { toast.push({ title: ex instanceof Error ? ex.message : l(L.errorTitle), tone: "danger" }); }
    finally { setBusyId(null); }
  };

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div><p className="pl-eyebrow">{l(L.eyebrow)}</p><h1>{l(L.title)}</h1></div>
        {canWrite ? <div className="pl-pageActions"><Link to="/platform/tasks/schedule"><Button variant="secondary" size="sm">{l(L.schedule)}</Button></Link><Button onClick={() => { setForm(EMPTY); setErr({}); setEditing(true); }}>{l(L.add)}</Button></div> : <Badge tone="neutral">{l(L.readOnly)}</Badge>}
      </header>

      <div className="pl-toolbar">
        <div className="pl-chips">{([{ v: "all", lab: L.all }, { v: "mine", lab: L.mine }, { v: "unassigned", lab: L.unassigned }]).map(({ v, lab }) => <button key={v} type="button" className="pl-chip" aria-pressed={view === v} onClick={() => setView(v)}>{l(lab)}</button>)}</div>
        <label className="pl-search"><select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={l(L.status)}><option value="">{l(L.status)}</option>{["draft", "planned", "assigned", "in_progress", "completed", "verified", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
        <span className="pl-count">{query.data ? `${query.data.total}` : ""}</span>
      </div>

      <ApiBoundary state={query}>
        {rows.length === 0 ? <ApiEmpty /> : (
          <Card><CardBody className="!p-0"><div className="pl-tableWrap"><table className="pl-table">
            <thead><tr><th>{l(L.titleCol)}</th><th>{l(L.status)}</th><th>{l(L.priority)}</th><th>{l(L.farm)}</th><th>{l(L.assignee)}</th><th>{l(L.due)}</th>{canWrite ? <th><span className="sr-only">{l(L.next)}</span></th> : null}</tr></thead>
            <tbody>{rows.map((t) => (
              <tr key={t.id}>
                <td><Link className="pl-link" to={`/platform/tasks/${t.id}`}><span className="pl-rowTitle">{t.title}</span></Link><span className="pl-rowSub">{t.category}</span></td>
                <td><Badge tone={TONE[t.status] ?? "neutral"}>{t.status}</Badge></td>
                <td>{t.priority}</td>
                <td>{farmName.get(t.farmId) ?? t.farmId}</td>
                <td>{t.assigneeId ? memberName.get(t.assigneeId) ?? t.assigneeId : l(L.none)}</td>
                <td>{t.dueAt ?? l(L.none)}{t.dueAt && t.status !== "completed" && t.status !== "verified" && Date.parse(t.dueAt) < Date.now() ? <Badge tone="danger">{l(L.overdue)}</Badge> : null}</td>
                {canWrite ? <td className="pl-actionsCell">{(NEXT[t.status] ?? []).map((to) => <Button key={to} variant={to === "cancelled" ? "danger" : "secondary"} size="sm" disabled={busyId === t.id} onClick={() => void move(t, to)} aria-label={`${l(L.next)}: ${to}`}>{l(L.next)} → {to}</Button>)}</td> : null}
              </tr>
            ))}</tbody>
          </table></div></CardBody></Card>
        )}
      </ApiBoundary>

      <Dialog open={editing} onClose={() => setEditing(false)} title={l(L.createTitle)} footer={<><Button variant="secondary" onClick={() => setEditing(false)}>{l(L.cancel)}</Button><Button onClick={() => void submit()} disabled={create.isPending}>{l(L.save)}</Button></>}>
        <div className="pl-stack">
          {create.isError ? <FormAlert title={l(L.errorTitle)}>{(create.error as Error).message}</FormAlert> : null}
          <FormRow label={l(L.farm)} field="t-farm" required error={err.farmId}>{(p) => <Select {...p} value={form.farmId} onChange={(e) => setForm((f) => ({ ...f, farmId: e.target.value, cropCycleId: "" }))}><option value="">{l(L.none)}</option>{(farms.data?.items ?? []).map((f) => <option key={String(f.id)} value={String(f.id)}>{String(f.name ?? f.id)}</option>)}</Select>}</FormRow>
          <FormRow label={l(L.titleCol)} field="t-title" required error={err.title}>{(p) => <Input {...p} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />}</FormRow>
          <FormRow label={l(L.category)} field="t-cat">{(p) => <Select {...p} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select>}</FormRow>
          <FormRow label={l(L.priority)} field="t-pri">{(p) => <Select {...p} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>{PRIORITIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select>}</FormRow>
          <FormRow label={l(L.assignee)} field="t-assignee">{(p) => <Select {...p} value={form.assigneeId} onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}><option value="">{l(L.none)}</option>{(members.data?.items ?? []).map((m) => { const u = (m as unknown as { user?: { name?: string } }).user; return <option key={String(m.userId)} value={String(m.userId)}>{String(u?.name ?? m.userId)}</option>; })}</Select>}</FormRow>
          <FormRow label={l(L.plannedStart)} field="t-start">{(p) => <Input {...p} type="date" value={form.plannedStart} onChange={(e) => setForm((f) => ({ ...f, plannedStart: e.target.value }))} />}</FormRow>
          <FormRow label={l(L.due)} field="t-due">{(p) => <Input {...p} type="date" value={form.dueAt} onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))} />}</FormRow>
          <FormRow label={l(L.description)} field="t-desc">{(p) => <Input {...p} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />}</FormRow>
        </div>
      </Dialog>
    </div>
  );
}