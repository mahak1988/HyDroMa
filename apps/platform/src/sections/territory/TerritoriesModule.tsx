import { useMemo, useState } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, Dialog, FormAlert, FormRow, Input, useToast } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useCreateResource, useDeleteResource, useResourceList, useUpdateResource, type ResourceRecord } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };

const L = {
  eyebrow: { fa: "دادهٔ واقعی از API", en: "Live data from the API", ar: "بيانات حية من الـ API" },
  title: { fa: "قلمروها و منظرها", en: "Territories & Landscape", ar: "الأقاليم والمنظر" },
  add: { fa: "افزودن قلمرو", en: "Add territory", ar: "إضافة إقليم" },
  search: { fa: "جست‌وجو", en: "Search", ar: "بحث" },
  name: { fa: "نام", en: "Name", ar: "الاسم" },
  region: { fa: "منطقه", en: "Region", ar: "المنطقة" },
  country: { fa: "کشور", en: "Country", ar: "البلد" },
  area: { fa: "مساحت (هکتار)", en: "Area (ha)", ar: "المساحة (هكتار)" },
  description: { fa: "توضیحات", en: "Description", ar: "الوصف" },
  actions: { fa: "عملیات", en: "Actions", ar: "الإجراءات" },
  edit: { fa: "ویرایش", en: "Edit", ar: "تعديل" },
  delete: { fa: "حذف", en: "Delete", ar: "حذف" },
  createTitle: { fa: "افزودن قلمرو", en: "Add territory", ar: "إضافة إقليم" },
  editTitle: { fa: "ویرایش قلمرو", en: "Edit territory", ar: "تعديل الإقليم" },
  deleteTitle: { fa: "حذف قلمرو", en: "Delete territory", ar: "حذف الإقليم" },
  deleteBody: { fa: "این قلمرو برای همیشه حذف می‌شود.", en: "This territory will be permanently deleted.", ar: "سيتم حذف هذا الإقليم نهائياً." },
  cancel: { fa: "انصراف", en: "Cancel", ar: "إلغاء" },
  save: { fa: "ذخیره", en: "Save", ar: "حفظ" },
  confirm: { fa: "تأیید", en: "Confirm", ar: "تأكيد" },
  nameRequired: { fa: "نام باید حداقل ۲ حرف باشد.", en: "Name must be at least 2 characters.", ar: "يجب أن يكون الاسم حرفين على الأقل." },
  areaInvalid: { fa: "مساحت باید عددی نامنفی باشد.", en: "Area must be a non-negative number.", ar: "يجب أن تكون المساحة رقماً غير سالب." },
  created: { fa: "قلمرو افزوده شد.", en: "Territory added.", ar: "تمت إضافة الإقليم." },
  updated: { fa: "قلمرو به‌روزرسانی شد.", en: "Territory updated.", ar: "تم تحديث الإقليم." },
  deleted: { fa: "قلمرو حذف شد.", en: "Territory deleted.", ar: "تم حذف الإقليم." },
  readOnly: { fa: "برای افزودن یا ویرایش به نقش write نیاز دارید.", en: "A write role is required to add or edit.", ar: "يلزم دور كتابة للإضافة أو التعديل." },
  errorTitle: { fa: "خطا", en: "Error", ar: "خطأ" },
  noGeometry: { fa: "مرزها و هندسهٔ جغرافیایی در این نسخه پشتیبانی نمی‌شود.", en: "Geometry and GIS boundaries are not supported in this release.", ar: "لا يتم دعم الحدود والهندسة الجغرافية في هذا الإصدار." },
};

const WRITE_ROLES = new Set(["owner", "admin", "manager"]);

type TerritoryForm = { name: string; region: string; country: string; areaHa: string; description: string };
const EMPTY: TerritoryForm = { name: "", region: "", country: "", areaHa: "", description: "" };

function toForm(record: ResourceRecord): TerritoryForm {
  return {
    name: String(record.name ?? ""),
    region: String(record.region ?? ""),
    country: String(record.country ?? ""),
    areaHa: record.areaHa == null ? "" : String(record.areaHa),
    description: String(record.description ?? ""),
  };
}

/**
 * M01 Territories & Landscape — complete territory CRUD vertical slice.
 * UI → api-client → /v1/resources/landscapes → SQLite → response → query cache.
 * Only contract-supported fields; no geometry/GIS is simulated.
 */
export function TerritoriesModule() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const { role, activeOrganizationId } = useRealSession();
  const canWrite = WRITE_ROLES.has(role ?? "");
  const toast = useToast();

  const [search, setSearch] = useState("");
  const query = useResourceList("landscapes", { search: search || undefined });
  const create = useCreateResource("landscapes");
  const update = useUpdateResource("landscapes");
  const remove = useDeleteResource("landscapes");

  const [editing, setEditing] = useState<ResourceRecord | "new" | null>(null);
  const [form, setForm] = useState<TerritoryForm>(EMPTY);
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
    if (form.region.trim() !== "") body.region = form.region.trim();
    if (form.country.trim() !== "") body.country = form.country.trim();
    if (form.areaHa.trim() !== "") body.areaHa = Number(form.areaHa);
    if (form.description.trim() !== "") body.description = form.description.trim();
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
                      <th>{l(L.country)}</th>
                      <th>{l(L.area)}</th>
                      {canWrite ? <th><span className="sr-only">{l(L.actions)}</span></th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((record) => (
                      <tr key={record.id}>
                        <td><span className="pl-rowTitle">{String(record.name ?? record.id)}</span></td>
                        <td>{record.region ? String(record.region) : "—"}</td>
                        <td>{record.country ? String(record.country) : "—"}</td>
                        <td>{record.areaHa == null ? "—" : String(record.areaHa)}</td>
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

      <p className="pl-note">{l(L.noGeometry)}</p>

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
          <FormRow label={l(L.name)} field="territory-name" required error={errors.name}>
            {(props) => <Input {...props} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.region)} field="territory-region">
            {(props) => <Input {...props} value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.country)} field="territory-country">
            {(props) => <Input {...props} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.area)} field="territory-area" error={errors.areaHa}>
            {(props) => <Input {...props} inputMode="decimal" value={form.areaHa} onChange={(e) => setForm((f) => ({ ...f, areaHa: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.description)} field="territory-description">
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