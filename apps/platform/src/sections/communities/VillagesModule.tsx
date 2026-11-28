import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, Dialog, FormAlert, FormRow, Input, useToast } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useCreateResource, useDeleteResource, useResourceList, useUpdateResource, type ResourceRecord } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };

const L = {
  eyebrow: { fa: "دادهٔ واقعی از API", en: "Live data from the API", ar: "بيانات حية من الـ API" },
  title: { fa: "روستاها و جوامع", en: "Villages & Communities", ar: "القرى والمجتمعات" },
  add: { fa: "افزودن روستا", en: "Add village", ar: "إضافة قرية" },
  search: { fa: "جست‌وجو", en: "Search", ar: "بحث" },
  name: { fa: "نام", en: "Name", ar: "الاسم" },
  region: { fa: "منطقه", en: "Region", ar: "المنطقة" },
  description: { fa: "توضیحات", en: "Description", ar: "الوصف" },
  actions: { fa: "عملیات", en: "Actions", ar: "الإجراءات" },
  edit: { fa: "ویرایش", en: "Edit", ar: "تعديل" },
  delete: { fa: "حذف", en: "Delete", ar: "حذف" },
  createTitle: { fa: "افزودن روستا", en: "Add village", ar: "إضافة قرية" },
  editTitle: { fa: "ویرایش روستا", en: "Edit village", ar: "تعديل القرية" },
  deleteTitle: { fa: "حذف روستا", en: "Delete village", ar: "حذف القرية" },
  deleteBody: { fa: "این روستا برای همیشه حذف می‌شود.", en: "This village will be permanently deleted.", ar: "سيتم حذف هذه القرية نهائياً." },
  cancel: { fa: "انصراف", en: "Cancel", ar: "إلغاء" },
  save: { fa: "ذخیره", en: "Save", ar: "حفظ" },
  confirm: { fa: "تأیید", en: "Confirm", ar: "تأكيد" },
  nameRequired: { fa: "نام باید حداقل ۲ حرف باشد.", en: "Name must be at least 2 characters.", ar: "يجب أن يكون الاسم حرفين على الأقل." },
  created: { fa: "روستا افزوده شد.", en: "Village added.", ar: "تمت إضافة القرية." },
  updated: { fa: "روستا به‌روزرسانی شد.", en: "Village updated.", ar: "تم تحديث القرية." },
  deleted: { fa: "روستا حذف شد.", en: "Village deleted.", ar: "تم حذف القرية." },
  readOnly: { fa: "برای افزودن یا ویرایش به نقش write نیاز دارید.", en: "A write role is required to add or edit.", ar: "يلزم دور كتابة للإضافة أو التعديل." },
  errorTitle: { fa: "خطا", en: "Error", ar: "خطأ" },
  privacy: { fa: "این بخش فقط رکورد روستا را مدیریت می‌کند و شامل مشارکت، حکومت محلی یا رضایت نیست. دادهٔ جمعیتی یا شخصی جمع‌آوری نمی‌شود.", en: "This manages village records only — not participation, local governance or consent. No demographic or personal data is collected.", ar: "تدير هذه الصفحة سجلات القرى فقط — لا المشاركة أو الحكم المحلي أو الموافقة. لا تُجمع بيانات سكانية أو شخصية." },
};

const WRITE_ROLES = new Set(["owner", "admin", "manager"]);

type VillageForm = { name: string; region: string; description: string };
const EMPTY: VillageForm = { name: "", region: "", description: "" };

function toForm(record: ResourceRecord): VillageForm {
  return {
    name: String(record.name ?? ""),
    region: String(record.region ?? ""),
    description: String(record.description ?? ""),
  };
}

/**
 * M02 Villages & Communities — data-minimized village record CRUD.
 * UI → api-client → /v1/resources/villages → SQLite → response → query cache.
 * No demographic/personal/governance data; no participation/consent claims.
 */
export function VillagesModule() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const { role, activeOrganizationId } = useRealSession();
  const canWrite = WRITE_ROLES.has(role ?? "");
  const toast = useToast();

  const [search, setSearch] = useState("");
  const query = useResourceList("villages", { search: search || undefined });
  const create = useCreateResource("villages");
  const update = useUpdateResource("villages");
  const remove = useDeleteResource("villages");

  const [editing, setEditing] = useState<ResourceRecord | "new" | null>(null);
  const [form, setForm] = useState<VillageForm>(EMPTY);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ResourceRecord | null>(null);

  const rows = useMemo(() => query.data?.items ?? [], [query.data]);

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
    if (form.region.trim() !== "") body.region = form.region.trim();
    if (form.description.trim() !== "") body.description = form.description.trim();
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
                      <th>{l(L.region)}</th>
                      <th>{l(L.description)}</th>
                      {canWrite ? <th><span className="sr-only">{l(L.actions)}</span></th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((record) => (
                      <tr key={record.id}>
                        <td><Link className="pl-link" to={`/platform/communities/${record.id}`}><span className="pl-rowTitle">{String(record.name ?? record.id)}</span></Link></td>
                        <td>{record.region ? String(record.region) : "—"}</td>
                        <td>{record.description ? String(record.description) : "—"}</td>
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

      <p className="pl-note">{l(L.privacy)}</p>

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
          <FormRow label={l(L.name)} field="village-name" required error={nameError}>
            {(props) => <Input {...props} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.region)} field="village-region">
            {(props) => <Input {...props} value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.description)} field="village-description">
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