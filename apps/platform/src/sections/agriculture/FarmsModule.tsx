import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, CardHeader, Dialog, FormAlert, FormRow, Input, useToast } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useAgriTasks, useCreateResource, useDeleteResource, useFarmTimeline, useResource, useResourceList, useUpdateResource, type ResourceRecord } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };

const L = {
  eyebrow: { fa: "دادهٔ واقعی از API", en: "Live data from the API", ar: "بيانات حية من الـ API" },
  title: { fa: "مزارع", en: "Farms", ar: "المزارع" },
  add: { fa: "افزودن مزرعه", en: "Add farm", ar: "إضافة مزرعة" },
  search: { fa: "جست‌وجو", en: "Search", ar: "بحث" },
  name: { fa: "نام", en: "Name", ar: "الاسم" },
  area: { fa: "مساحت (هکتار)", en: "Area (ha)", ar: "المساحة (هكتار)" },
  notes: { fa: "یادداشت", en: "Notes", ar: "ملاحظات" },
  actions: { fa: "عملیات", en: "Actions", ar: "الإجراءات" },
  edit: { fa: "ویرایش", en: "Edit", ar: "تعديل" },
  delete: { fa: "حذف", en: "Delete", ar: "حذف" },
  createTitle: { fa: "افزودن مزرعه", en: "Add farm", ar: "إضافة مزرعة" },
  editTitle: { fa: "ویرایش مزرعه", en: "Edit farm", ar: "تعديل المزرعة" },
  deleteTitle: { fa: "حذف مزرعه", en: "Delete farm", ar: "حذف المزرعة" },
  deleteBody: { fa: "این مزرعه برای همیشه حذف می‌شود.", en: "This farm will be permanently deleted.", ar: "سيتم حذف هذه المزرعة نهائياً." },
  cancel: { fa: "انصراف", en: "Cancel", ar: "إلغاء" },
  save: { fa: "ذخیره", en: "Save", ar: "حفظ" },
  confirm: { fa: "تأیید", en: "Confirm", ar: "تأكيد" },
  nameRequired: { fa: "نام باید حداقل ۲ حرف باشد.", en: "Name must be at least 2 characters.", ar: "يجب أن يكون الاسم حرفين على الأقل." },
  areaInvalid: { fa: "مساحت باید عددی نامنفی باشد.", en: "Area must be a non-negative number.", ar: "يجب أن تكون المساحة رقماً غير سالب." },
  created: { fa: "مزرعه افزوده شد.", en: "Farm added.", ar: "تمت إضافة المزرعة." },
  updated: { fa: "مزرعه به‌روزرسانی شد.", en: "Farm updated.", ar: "تم تحديث المزرعة." },
  deleted: { fa: "مزرعه حذف شد.", en: "Farm deleted.", ar: "تم حذف المزرعة." },
  readOnly: { fa: "برای افزودن یا ویرایش به نقش write نیاز دارید.", en: "A write role is required to add or edit.", ar: "يلزم دور كتابة للإضافة أو التعديل." },
  errorTitle: { fa: "خطا", en: "Error", ar: "خطأ" },
  back: { fa: "بازگشت به فهرست", en: "Back to list", ar: "رجوع إلى القائمة" },
  details: { fa: "جزئیات مزرعه", en: "Farm details", ar: "تفاصيل المزرعة" },
  projects: { fa: "پروژه‌های مرتبط", en: "Related projects", ar: "المشاريع المرتبطة" },
noProjects: { fa: "پروژه‌ای به این مزرعه مرتبط نیست.", en: "No projects are linked to this farm.", ar: "لا توجد مشاريع مرتبطة بهذه المزرعة." },
  cycles: { fa: "دورهٔ کشت", en: "Crop cycles", ar: "دورات المحصول" },
  irrigation: { fa: "آبیاری", en: "Irrigation", ar: "الري" },
  observations: { fa: "مشاهدات میدانی", en: "Field observations", ar: "الملاحظات الميدانية" },
  timeline: { fa: "گزارش زمانی عملیات", en: "Operational timeline", ar: "الجدول الزمني التشغيلي" },
  summary: { fa: "خلاصهٔ عملیات", en: "Operational summary", ar: "الملخص التشغيلي" },
  activeCycles: { fa: "دورهٔ فعال", en: "Active cycles", ar: "دورات نشطة" },
  plannedCycles: { fa: "دورهٔ برنامه‌ریزی‌شده", en: "Planned cycles", ar: "دورات مخططة" },
  completedCycles: { fa: "دورهٔ تکمیل‌شده", en: "Completed cycles", ar: "دورات مكتملة" },
  irrigationCount: { fa: "رویداد آبیاری", en: "Irrigation events", ar: "أحداث الري" },
  obsCount: { fa: "مشاهده", en: "Observations", ar: "الملاحظات" },
  allTypes: { fa: "همه", en: "All", ar: "الكل" },
  recordCreated: { fa: "ثبت رکورد", en: "record created", ar: "إنشاء السجل" },
  noTimeline: { fa: "رویدادی برای این مزرعه ثبت نشده است.", en: "No operational events recorded for this farm.", ar: "لا توجد أحداث تشغيلية لهذه المزرعة." },
  operationalNote: { fa: "این خلاصه عملیاتی است و شاخص علمی نیست.", en: "This is an operational summary, not a scientific indicator.", ar: "هذا ملخص تشغيلي وليس مؤشراً علمياً." },
  tasks: { fa: "کارها", en: "Tasks", ar: "المهام" },
};

const WRITE_ROLES = new Set(["owner", "admin", "manager"]);

type FarmForm = { name: string; areaHa: string; notes: string };
const EMPTY: FarmForm = { name: "", areaHa: "", notes: "" };

function toForm(record: ResourceRecord): FarmForm {
  return {
    name: String(record.name ?? ""),
    areaHa: record.areaHa == null ? "" : String(record.areaHa),
    notes: String(record.notes ?? ""),
  };
}

/**
 * M05 Agriculture — complete farms CRUD vertical slice.
 * UI → api-client → /v1/resources/farms → SQLite → response → query cache.
 * Write actions are permission-aware (owner/admin/manager); the backend enforces.
 */
export function FarmsModule() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const { role, activeOrganizationId } = useRealSession();
  const canWrite = WRITE_ROLES.has(role ?? "");
  const toast = useToast();

  const [search, setSearch] = useState("");
  const query = useResourceList("farms", { search: search || undefined });
  const create = useCreateResource("farms");
  const update = useUpdateResource("farms");
  const remove = useDeleteResource("farms");

  const [editing, setEditing] = useState<ResourceRecord | "new" | null>(null);
  const [form, setForm] = useState<FarmForm>(EMPTY);
  const [errors, setErrors] = useState<{ name?: string; areaHa?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ResourceRecord | null>(null);

  const rows = useMemo(() => query.data?.items ?? [], [query.data]);

  const openCreate = () => {
    setForm(EMPTY);
    setErrors({});
    setServerError(null);
    setEditing("new");
  };
  const openEdit = (record: ResourceRecord) => {
    setForm(toForm(record));
    setErrors({});
    setServerError(null);
    setEditing(record);
  };

  const validate = (): boolean => {
    const next: { name?: string; areaHa?: string } = {};
    if (form.name.trim().length < 2) next.name = l(L.nameRequired);
    if (form.areaHa.trim() !== "") {
      const value = Number(form.areaHa);
      if (!Number.isFinite(value) || value < 0) next.areaHa = l(L.areaInvalid);
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const payload = () => {
    const body: Record<string, unknown> = { organizationId: activeOrganizationId, name: form.name.trim() };
    if (form.areaHa.trim() !== "") body.areaHa = Number(form.areaHa);
    if (form.notes.trim() !== "") body.notes = form.notes.trim();
    return body;
  };

  const submit = async () => {
    if (!validate()) return;
    setServerError(null);
    try {
      if (editing === "new") {
        await create.mutateAsync(payload());
        toast.push({ title: l(L.created), tone: "success" });
      } else if (editing) {
        await update.mutateAsync({ id: String(editing.id), patch: payload() });
        toast.push({ title: l(L.updated), tone: "success" });
      }
      setEditing(null);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : l(L.errorTitle));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(String(deleting.id));
      toast.push({ title: l(L.deleted), tone: "success" });
      setDeleting(null);
    } catch (error) {
      toast.push({ title: error instanceof Error ? error.message : "Error", tone: "danger" });
      setDeleting(null);
    }
  };

  const busy = create.isPending || update.isPending || remove.isPending;

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div>
          <p className="pl-eyebrow">{l(L.eyebrow)}</p>
          <h1>{l(L.title)}</h1>
        </div>
        {canWrite ? (
          <div className="pl-pageActions">
            <Button onClick={openCreate}>{l(L.add)}</Button>
          </div>
        ) : (
          <Badge tone="neutral">{l(L.readOnly)}</Badge>
        )}
      </header>

      <div className="pl-toolbar">
        <label className="pl-search">
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={l(L.search)} aria-label={l(L.search)} />
        </label>
        <span className="pl-count">{query.data ? `${query.data.total}` : ""}</span>
      </div>

      <ApiBoundary state={query}>
        {rows.length === 0 ? (
          <ApiEmpty />
        ) : (
          <Card>
            <CardBody className="!p-0">
              <div className="pl-tableWrap">
                <table className="pl-table">
                  <thead>
                    <tr>
                      <th>{l(L.name)}</th>
                      <th>{l(L.area)}</th>
                      <th>{l(L.notes)}</th>
                      {canWrite ? <th><span className="sr-only">{l(L.actions)}</span></th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((record) => (
                      <tr key={record.id}>
                        <td><Link className="pl-link" to={`/platform/agriculture/${record.id}`}><span className="pl-rowTitle">{String(record.name ?? record.id)}</span></Link></td>
                        <td>{record.areaHa == null ? "—" : String(record.areaHa)}</td>
                        <td>{record.notes ? String(record.notes) : "—"}</td>
                        {canWrite ? (
                          <td className="pl-actionsCell">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(record)}>{l(L.edit)}</Button>
                            <Button variant="danger" size="sm" onClick={() => setDeleting(record)}>{l(L.delete)}</Button>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </ApiBoundary>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? l(L.createTitle) : l(L.editTitle)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>{l(L.cancel)}</Button>
            <Button onClick={() => void submit()} disabled={busy}>{l(L.save)}</Button>
          </>
        }
      >
        <div className="pl-stack">
          {serverError ? <FormAlert title="Error">{serverError}</FormAlert> : null}
          <FormRow label={l(L.name)} field="farm-name" required error={errors.name}>
            {(props) => <Input {...props} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.area)} field="farm-area" error={errors.areaHa}>
            {(props) => (
              <Input {...props} inputMode="decimal" value={form.areaHa} onChange={(e) => setForm((f) => ({ ...f, areaHa: e.target.value }))} />
            )}
          </FormRow>
          <FormRow label={l(L.notes)} field="farm-notes">
            {(props) => <Input {...props} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />}
          </FormRow>
        </div>
      </Dialog>

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={l(L.deleteTitle)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>{l(L.cancel)}</Button>
            <Button variant="danger" onClick={() => void confirmDelete()} disabled={busy}>{l(L.confirm)}</Button>
          </>
        }
      >
        <p className="pl-body">{l(L.deleteBody)}</p>
      </Dialog>
    </div>
  );
}
export type TimelineEvent = { date: string; type: string; label: string; to: string; recordCreated: boolean };

/** Pure timeline builder (unit-tested). Uses the real event date when present. */
export function buildTimeline(
  farmId: string,
  sources: { cycles: ResourceRecord[]; irrigation: ResourceRecord[]; observations: ResourceRecord[]; projects: ResourceRecord[]; tasks?: ResourceRecord[] },
): TimelineEvent[] {
  const key = String(farmId);
  const own = (r: ResourceRecord, field: string) => r[field] != null && String(r[field]) === key;
  const ev: TimelineEvent[] = [];
  const push = (r: ResourceRecord, type: string, to: string, dateField: string, createdField: string) => {
    const raw = r[dateField] ?? r[createdField] ?? r.created_at ?? r.createdAt ?? "";
    const date = raw ? String(raw) : "";
    ev.push({ date, type, label: String(r.name ?? r.title ?? r.id), to, recordCreated: !r[dateField] });
  };
  for (const c of sources.cycles) if (own(c, "farmId")) push(c, "cropCycle", `/platform/agriculture/cycles`, "startDate", "created_at");
  for (const i of sources.irrigation) if (own(i, "farmId")) push(i, "irrigation", "/platform/irrigation", "occurredAt", "created_at");
  for (const o of sources.observations) if (own(o, "farmId")) push(o, "observation", "/platform/field", "observedAt", "created_at");
  for (const p of sources.projects) if (own(p, "farmId")) push(p, "project", `/platform/projects/${p.id}`, "startDate", "created_at");
  for (const tk of sources.tasks ?? []) if (own(tk, "farmId")) push(tk, "task", "/platform/tasks", "dueAt", "created_at");
  return ev.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/**
 * Farm Operations hub: identity + operational summary + linked records + a
 * chronological timeline aggregated from real persisted data. Read-only; editing
 * stays in the list. Frontend aggregation over existing list endpoints (no N+1).
 */
export function FarmDetail() {
  const { id } = useParams();
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const query = useResource("farms", id ?? "");
  const projects = useResourceList("projects");
  const cycles = useResourceList("cropCycles");
  const tasks = useAgriTasks(id ? { farmId: String(id) } : {});
  const timelineQuery = useFarmTimeline(id ?? "");
  const record = query.data;
  const [filter, setFilter] = useState<string>("all");

  const relatedProjects = useMemo(
    () => (projects.data?.items ?? []).filter((p) => record && p.farmId != null && String(p.farmId) === String(record.id)),
    [projects.data, record],
  );
  const timeline = useMemo(() => timelineQuery.data?.items ?? [], [timelineQuery.data]);
  const shown = filter === "all" ? timeline : timeline.filter((e) => e.type === filter);
  const cycleStatus = (c: ResourceRecord) => String(c.status ?? "");
  const summary = useMemo(() => {
    const cs = record ? (cycles.data?.items ?? []).filter((c) => c.farmId != null && String(c.farmId) === String(record.id)) : [];
    return {
      active: cs.filter((c) => cycleStatus(c) === "active").length,
      planned: cs.filter((c) => cycleStatus(c) === "planned").length,
      completed: cs.filter((c) => cycleStatus(c) === "completed").length,
      irrigation: timeline.filter((e) => e.type === "irrigation").length,
      observations: timeline.filter((e) => e.type === "observation").length,
    };
  }, [record, cycles.data, timeline]);

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div>
          <p className="pl-eyebrow">{l(L.details)}</p>
          <h1>{record ? String(record.name ?? record.id ?? "") : l(L.title)}</h1>
        </div>
        <div className="pl-pageActions">
          <Link to="/platform/agriculture"><Button variant="secondary" size="sm">{l(L.back)}</Button></Link>
        </div>
      </header>

      <ApiBoundary state={query}>
        {record ? (
          <>
            <Card>
              <CardHeader title={l(L.summary)} />
              <CardBody>
                <dl className="pl-defs">
                  <div><dt>{l(L.area)}</dt><dd>{record.areaHa == null ? "—" : String(record.areaHa)}</dd></div>
                  <div><dt>{l(L.activeCycles)}</dt><dd>{summary.active}</dd></div>
                  <div><dt>{l(L.plannedCycles)}</dt><dd>{summary.planned}</dd></div>
                  <div><dt>{l(L.completedCycles)}</dt><dd>{summary.completed}</dd></div>
                  <div><dt>{l(L.irrigationCount)}</dt><dd>{summary.irrigation}</dd></div>
                  <div><dt>{l(L.obsCount)}</dt><dd>{summary.observations}</dd></div>
                  <div><dt>{l(L.projects)}</dt><dd>{relatedProjects.length}</dd></div>
                  <div><dt>{l(L.tasks)}</dt><dd>{tasks.data?.total ?? 0}</dd></div>
                </dl>
                <p className="pl-note">{l(L.operationalNote)}</p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={l(L.projects)} subtitle={`${relatedProjects.length}`} />
              <CardBody>
                {relatedProjects.length === 0 ? (
                  <p className="pl-muted">{l(L.noProjects)}</p>
                ) : (
                  <ul className="pl-list">
                    {relatedProjects.map((p) => (
                      <li key={p.id}>
                        <Link className="pl-link" to={`/platform/projects/${p.id}`}>
                          {String(p.name ?? p.id)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={l(L.timeline)} subtitle={`${shown.length}`} />
              <CardBody>
                <div className="pl-chips">
                  {["all", "cropCycle", "irrigation", "observation", "project", "task"].map((t) => (
                    <button key={t} type="button" className="pl-chip" aria-pressed={filter === t} onClick={() => setFilter(t)}>
                      {t === "all" ? l(L.allTypes) : t}
                    </button>
                  ))}
                </div>
                <ApiBoundary state={timelineQuery}>
                  {shown.length === 0 ? (
                    <p className="pl-muted">{l(L.noTimeline)}</p>
                  ) : (
                    <ul className="pl-list">
                      {shown.map((e, idx) => (
                        <li key={`${e.type}-${e.to}-${idx}`}>
                          <span className="pl-listTitle">{e.label}</span>
                          <span className="pl-listMeta">{e.type} · {e.date || "—"}{e.recordCreated ? ` (${l(L.recordCreated)})` : ""}</span>
                          <Link className="pl-link" to={e.to}>{l(L.details)} ←</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </ApiBoundary>
              </CardBody>
            </Card>
          </>
        ) : (
          <ApiEmpty />
        )}
      </ApiBoundary>
    </div>
  );
}
