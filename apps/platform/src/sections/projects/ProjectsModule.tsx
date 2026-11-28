import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, CardHeader, Dialog, FormAlert, FormRow, Input, Select, useToast } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useCreateResource, useDeleteResource, useResource, useResourceList, useTransitionResource, useUpdateResource, type ResourceRecord } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };

const L = {
  eyebrow: { fa: "دادهٔ واقعی از API", en: "Live data from the API", ar: "بيانات حية من الـ API" },
  title: { fa: "پروژه‌ها", en: "Projects", ar: "المشاريع" },
  add: { fa: "افزودن پروژه", en: "Add project", ar: "إضافة مشروع" },
  search: { fa: "جست‌وجو", en: "Search", ar: "بحث" },
  name: { fa: "نام", en: "Name", ar: "الاسم" },
  status: { fa: "وضعیت", en: "Status", ar: "الحالة" },
  description: { fa: "توضیحات", en: "Description", ar: "الوصف" },
  territory: { fa: "قلمرو مرتبط", en: "Territory", ar: "الإقليم المرتبط" },
  territoryNone: { fa: "بدون قلمرو", en: "No territory", ar: "بدون إقليم" },
  village: { fa: "روستای مرتبط", en: "Village", ar: "القرية المرتبطة" },
  villageNone: { fa: "بدون روستا", en: "No village", ar: "بدون قرية" },
  farm: { fa: "مزرعهٔ مرتبط", en: "Farm", ar: "المزرعة المرتبطة" },
  farmNone: { fa: "بدون مزرعه", en: "No farm", ar: "بدون مزرعة" },
  actions: { fa: "عملیات", en: "Actions", ar: "الإجراءات" },
  edit: { fa: "ویرایش", en: "Edit", ar: "تعديل" },
  delete: { fa: "حذف", en: "Delete", ar: "حذف" },
  createTitle: { fa: "افزودن پروژه", en: "Add project", ar: "إضافة مشروع" },
  editTitle: { fa: "ویرایش پروژه", en: "Edit project", ar: "تعديل المشروع" },
  deleteTitle: { fa: "حذف پروژه", en: "Delete project", ar: "حذف المشروع" },
  deleteBody: { fa: "این پروژه برای همیشه حذف می‌شود.", en: "This project will be permanently deleted.", ar: "سيتم حذف هذا المشروع نهائياً." },
  cancel: { fa: "انصراف", en: "Cancel", ar: "إلغاء" },
  save: { fa: "ذخیره", en: "Save", ar: "حفظ" },
  confirm: { fa: "تأیید", en: "Confirm", ar: "تأكيد" },
  nameRequired: { fa: "نام باید حداقل ۲ حرف باشد.", en: "Name must be at least 2 characters.", ar: "يجب أن يكون الاسم حرفين على الأقل." },
  created: { fa: "پروژه افزوده شد.", en: "Project added.", ar: "تمت إضافة المشروع." },
  updated: { fa: "پروژه به‌روزرسانی شد.", en: "Project updated.", ar: "تم تحديث المشروع." },
  deleted: { fa: "پروژه حذف شد.", en: "Project deleted.", ar: "تم حذف المشروع." },
  transition: { fa: "تغییر وضعیت", en: "Change status", ar: "تغيير الحالة" },
  transitioned: { fa: "وضعیت پروژه به‌روزرسانی شد.", en: "Project status updated.", ar: "تم تحديث حالة المشروع." },
  readOnly: { fa: "برای افزودن یا ویرایش به نقش write نیاز دارید.", en: "A write role is required to add or edit.", ar: "يلزم دور كتابة للإضافة أو التعديل." },
  errorTitle: { fa: "خطا", en: "Error", ar: "خطأ" },
  back: { fa: "بازگشت به فهرست", en: "Back to list", ar: "رجوع إلى القائمة" },
  details: { fa: "جزئیات پروژه", en: "Project details", ar: "تفاصيل المشروع" },
};

const WRITE_ROLES = new Set(["owner", "admin", "manager"]);

// Client mirror of the backend project status state machine
// (services/api/src/server.mjs PROJECT_TRANSITIONS). The backend is authoritative;
// these edges only drive which transition buttons are offered.
const NEXT_STATUS: Record<string, string[]> = {
  planned: ["active", "on_hold"],
  active: ["on_hold", "completed"],
  on_hold: ["planned", "active"],
  completed: [],
};

type ProjectForm = { name: string; description: string; territoryId: string; villageId: string; farmId: string };
const EMPTY: ProjectForm = { name: "", description: "", territoryId: "", villageId: "", farmId: "" };

function toForm(record: ResourceRecord): ProjectForm {
  return {
    name: String(record.name ?? ""),
    description: String(record.description ?? ""),
    territoryId: record.territoryId == null ? "" : String(record.territoryId),
    villageId: record.villageId == null ? "" : String(record.villageId),
    farmId: record.farmId == null ? "" : String(record.farmId),
  };
}

/**
 * M13 Projects — complete projects CRUD vertical slice.
 * UI → api-client → /v1/resources/projects → SQLite → response → query cache.
 * Write actions are permission-aware (owner/admin/manager); the backend enforces.
 */
export function ProjectsModule() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const { role, activeOrganizationId } = useRealSession();
  const canWrite = WRITE_ROLES.has(role ?? "");
  const toast = useToast();

  const [search, setSearch] = useState("");
  const query = useResourceList("projects", { search: search || undefined });
  const territories = useResourceList("landscapes");
  const villages = useResourceList("villages");
  const farms = useResourceList("farms");
  const create = useCreateResource("projects");
  const update = useUpdateResource("projects");
  const remove = useDeleteResource("projects");
  const transition = useTransitionResource("projects");

  const [editing, setEditing] = useState<ResourceRecord | "new" | null>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ResourceRecord | null>(null);

  const rows = useMemo(() => query.data?.items ?? [], [query.data]);
  const territoryName = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of territories.data?.items ?? []) map.set(String(t.id), String(t.name ?? t.id));
    return map;
  }, [territories.data]);
  const villageName = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of villages.data?.items ?? []) map.set(String(v.id), String(v.name ?? v.id));
    return map;
  }, [villages.data]);
  const farmName = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of farms.data?.items ?? []) map.set(String(f.id), String(f.name ?? f.id));
    return map;
  }, [farms.data]);

  const openCreate = () => {
    setForm(EMPTY);
    setNameError(undefined);
    setServerError(null);
    setEditing("new");
  };
  const openEdit = (record: ResourceRecord) => {
    setForm(toForm(record));
    setNameError(undefined);
    setServerError(null);
    setEditing(record);
  };

  const payload = () => {
    const body: Record<string, unknown> = { organizationId: activeOrganizationId, name: form.name.trim() };
    if (form.description.trim() !== "") body.description = form.description.trim();
    // Persisted relationship: a project references a territory by id (stored in the
    // project resource record via the existing generic-resource contract).
    body.territoryId = form.territoryId || null;
    body.villageId = form.villageId || null;
    body.farmId = form.farmId || null;
    return body;
  };

  const submit = async () => {
    if (form.name.trim().length < 2) {
      setNameError(l(L.nameRequired));
      return;
    }
    setNameError(undefined);
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
    } catch (error) {
      toast.push({ title: error instanceof Error ? error.message : l(L.errorTitle), tone: "danger" });
    } finally {
      setDeleting(null);
    }
  };

  const changeStatus = async (record: ResourceRecord, to: string) => {
    try {
      await transition.mutateAsync({ id: String(record.id), to });
      toast.push({ title: l(L.transitioned), tone: "success" });
    } catch (error) {
      toast.push({ title: error instanceof Error ? error.message : l(L.errorTitle), tone: "danger" });
    }
  };

  const busy = create.isPending || update.isPending || remove.isPending || transition.isPending;

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
                      <th>{l(L.status)}</th>
                      <th>{l(L.territory)}</th>
                      <th>{l(L.village)}</th>
                      <th>{l(L.farm)}</th>
                      <th>{l(L.description)}</th>
                      {canWrite ? <th><span className="sr-only">{l(L.actions)}</span></th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((record) => (
                      <tr key={record.id}>
                        <td><Link className="pl-link" to={`/platform/projects/${record.id}`}><span className="pl-rowTitle">{String(record.name ?? record.id)}</span></Link></td>
                        <td>{record.status ? <Badge tone={record.status === "completed" ? "success" : record.status === "active" ? "info" : "neutral"}>{String(record.status)}</Badge> : "—"}</td>
                        <td>
                          {record.territoryId ? (
                            <Link className="pl-link" to="/platform/territories">
                              {territoryName.get(String(record.territoryId)) ?? String(record.territoryId)}
                            </Link>
                          ) : (
                            <span className="pl-muted">{l(L.territoryNone)}</span>
                          )}
                        </td>
                        <td>
                          {record.villageId ? (
                            <Link className="pl-link" to="/platform/communities">
                              {villageName.get(String(record.villageId)) ?? String(record.villageId)}
                            </Link>
                          ) : (
                            <span className="pl-muted">{l(L.villageNone)}</span>
                          )}
                        </td>
                        <td>
                          {record.farmId ? (
                            <Link className="pl-link" to="/platform/agriculture">
                              {farmName.get(String(record.farmId)) ?? String(record.farmId)}
                            </Link>
                          ) : (
                            <span className="pl-muted">{l(L.farmNone)}</span>
                          )}
                        </td>
                        <td>{record.description ? String(record.description) : "—"}</td>
                        {canWrite ? (
                          <td className="pl-actionsCell">
                            {(NEXT_STATUS[String(record.status ?? "planned")] ?? []).map((to) => (
                              <Button
                                key={to}
                                variant="secondary"
                                size="sm"
                                disabled={busy}
                                onClick={() => void changeStatus(record, to)}
                                aria-label={`${l(L.transition)}: ${to}`}
                              >
                                {l(L.transition)} → {to}
                              </Button>
                            ))}
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
          {serverError ? <FormAlert title={l(L.errorTitle)}>{serverError}</FormAlert> : null}
          <FormRow label={l(L.name)} field="project-name" required error={nameError}>
            {(props) => <Input {...props} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.territory)} field="project-territory">
            {(props) => (
              <Select {...props} value={form.territoryId} onChange={(e) => setForm((f) => ({ ...f, territoryId: e.target.value }))}>
                <option value="">{l(L.territoryNone)}</option>
                {(territories.data?.items ?? []).map((t) => (
                  <option key={String(t.id)} value={String(t.id)}>
                    {String(t.name ?? t.id)}
                  </option>
                ))}
              </Select>
            )}
          </FormRow>
          <FormRow label={l(L.village)} field="project-village">
            {(props) => (
              <Select {...props} value={form.villageId} onChange={(e) => setForm((f) => ({ ...f, villageId: e.target.value }))}>
                <option value="">{l(L.villageNone)}</option>
                {(villages.data?.items ?? []).map((v) => (
                  <option key={String(v.id)} value={String(v.id)}>
                    {String(v.name ?? v.id)}
                  </option>
                ))}
              </Select>
            )}
          </FormRow>
          <FormRow label={l(L.farm)} field="project-farm">
            {(props) => (
              <Select {...props} value={form.farmId} onChange={(e) => setForm((f) => ({ ...f, farmId: e.target.value }))}>
                <option value="">{l(L.farmNone)}</option>
                {(farms.data?.items ?? []).map((f) => (
                  <option key={String(f.id)} value={String(f.id)}>
                    {String(f.name ?? f.id)}
                  </option>
                ))}
              </Select>
            )}
          </FormRow>
          <FormRow label={l(L.description)} field="project-description">
            {(props) => <Input {...props} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />}
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
/**
 * Deep-linkable project detail view (read-only). Resolves related territory,
 * village and farm names from the real API; editing/deletion stay in the list.
 */
export function ProjectDetail() {
  const { id } = useParams();
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const query = useResource("projects", id ?? "");
  const territories = useResourceList("landscapes");
  const villages = useResourceList("villages");
  const farms = useResourceList("farms");

  const nameOf = (list: { data?: { items: ResourceRecord[] } }, refId: unknown) => {
    if (refId == null) return null;
    const key = String(refId);
    const found = list.data?.items.find((item) => String(item.id) === key);
    return found ? String(found.name ?? key) : key;
  };

  const record = query.data;

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div>
          <p className="pl-eyebrow">{l(L.details)}</p>
          <h1>{record ? String(record.name ?? record.id ?? "") : l(L.title)}</h1>
        </div>
        <div className="pl-pageActions">
          <Link to="/platform/projects">
            <Button variant="secondary" size="sm">{l(L.back)}</Button>
          </Link>
        </div>
      </header>

      <ApiBoundary state={query}>
        {record ? (
          <Card>
            <CardHeader title={l(L.details)} subtitle={record.status ? String(record.status) : undefined} />
            <CardBody>
              <dl className="pl-defs">
                <div>
                  <dt>{l(L.status)}</dt>
                  <dd>{record.status ? <Badge tone={record.status === "completed" ? "success" : record.status === "active" ? "info" : "neutral"}>{String(record.status)}</Badge> : "—"}</dd>
                </div>
                <div>
                  <dt>{l(L.territory)}</dt>
                  <dd>{record.territoryId ? <Link className="pl-link" to="/platform/territories">{nameOf(territories, record.territoryId)}</Link> : <span className="pl-muted">{l(L.territoryNone)}</span>}</dd>
                </div>
                <div>
                  <dt>{l(L.village)}</dt>
                  <dd>{record.villageId ? <Link className="pl-link" to="/platform/communities">{nameOf(villages, record.villageId)}</Link> : <span className="pl-muted">{l(L.villageNone)}</span>}</dd>
                </div>
                <div>
                  <dt>{l(L.farm)}</dt>
                  <dd>{record.farmId ? <Link className="pl-link" to="/platform/agriculture">{nameOf(farms, record.farmId)}</Link> : <span className="pl-muted">{l(L.farmNone)}</span>}</dd>
                </div>
                <div>
                  <dt>{l(L.description)}</dt>
                  <dd>{record.description ? String(record.description) : "—"}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        ) : (
          <ApiEmpty />
        )}
      </ApiBoundary>
    </div>
  );
}
