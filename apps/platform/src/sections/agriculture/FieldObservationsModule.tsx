import { useMemo, useState } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, Dialog, FormAlert, FormRow, Input, useToast } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useCreateResource, useDeleteResource, useResourceList, useUpdateResource, type ResourceRecord } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };

const L = {
  eyebrow: { fa: "مشاهدات میدانی ثبت‌شده", en: "Recorded field observations", ar: "ملاحظات حقلية مسجلة" },
  title: { fa: "مشاهدات میدانی", en: "Field observations", ar: "الملاحظات الحقلية" },
  add: { fa: "افزودن مشاهده", en: "Add observation", ar: "إضافة ملاحظة" },
  farm: { fa: "مزرعه", en: "Farm", ar: "المزرعة" },
  cropCycle: { fa: "چرخهٔ محصول", en: "Crop cycle", ar: "دورة المحصول" },
  category: { fa: "دسته", en: "Category", ar: "الفئة" },
  severity: { fa: "شدت", en: "Severity", ar: "الشدة" },
  observer: { fa: "مشاهِد", en: "Observer", ar: "المراقب" },
  observedAt: { fa: "تاریخ/زمان مشاهده", en: "Observed date/time", ar: "تاريخ/وقت الملاحظة" },
  description: { fa: "شرح", en: "Description", ar: "الوصف" },
  notes: { fa: "یادداشت", en: "Notes", ar: "ملاحظات" },
  actions: { fa: "عملیات", en: "Actions", ar: "الإجراءات" },
  edit: { fa: "ویرایش", en: "Edit", ar: "تعديل" },
  delete: { fa: "حذف", en: "Delete", ar: "حذف" },
  cancel: { fa: "انصراف", en: "Cancel", ar: "إلغاء" },
  save: { fa: "ذخیره", en: "Save", ar: "حفظ" },
  confirm: { fa: "تأیید", en: "Confirm", ar: "تأكيد" },
  createTitle: { fa: "افزودن مشاهدهٔ میدانی", en: "Add field observation", ar: "إضافة ملاحظة حقلية" },
  editTitle: { fa: "ویرایش مشاهده", en: "Edit observation", ar: "تعديل الملاحظة" },
  deleteTitle: { fa: "حذف مشاهده", en: "Delete observation", ar: "حذف الملاحظة" },
  deleteBody: { fa: "این مشاهده برای همیشه حذف می‌شود.", en: "This observation will be permanently deleted.", ar: "سيتم حذف هذه الملاحظة نهائياً." },
  farmRequired: { fa: "انتخاب مزرعه الزامی است.", en: "A farm is required.", ar: "المزرعة مطلوبة." },
  observerRequired: { fa: "نام مشاهده‌گر الزامی است.", en: "An observer is required.", ar: "المراقب مطلوب." },
  descriptionRequired: { fa: "شرح باید حداقل ۲ حرف باشد.", en: "Description must be at least 2 characters.", ar: "يجب أن يكون الوصف حرفين على الأقل." },
  datetimeInvalid: { fa: "تاریخ/زمان نامعتبر است.", en: "A valid date/time is required.", ar: "التاريخ/الوقت غير صالح." },
  noCycle: { fa: "بدون چرخهٔ محصول", en: "No crop cycle", ar: "بدون دورة محصول" },
  created: { fa: "مشاهده افزوده شد.", en: "Observation added.", ar: "تمت إضافة الملاحظة." },
  updated: { fa: "مشاهده به‌روزرسانی شد.", en: "Observation updated.", ar: "تم تحديث الملاحظة." },
  deleted: { fa: "مشاهده حذف شد.", en: "Observation deleted.", ar: "تم حذف الملاحظة." },
  readOnly: { fa: "برای افزودن یا ویرایش به نقش write نیاز دارید.", en: "A write role is required to add or edit.", ar: "يلزم دور كتابة للإضافة أو التعديل." },
  errorTitle: { fa: "خطا", en: "Error", ar: "خطأ" },
  observation: { fa: "ثبت شرایط میدانی — نه نتیجهٔ علمی یا تشخیص", en: "Record of field conditions — not a scientific conclusion or diagnosis", ar: "سجل ظروف حقلية — ليس نتيجة علمية أو تشخيصاً" },
};

const WRITE_ROLES = new Set(["owner", "admin", "manager"]);
const CATEGORIES = ["soil", "water", "crop_health", "pest", "weed", "disease", "growth", "other"];
const SEVERITIES = ["none", "low", "moderate", "high", "critical"];
const SEVERITY_TONE: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  none: "neutral",
  low: "info",
  moderate: "warning",
  high: "danger",
  critical: "danger",
};

type ObsForm = { farmId: string; cropCycleId: string; category: string; severity: string; observer: string; observedAt: string; description: string; notes: string };
const EMPTY: ObsForm = { farmId: "", cropCycleId: "", category: "crop_health", severity: "none", observer: "", observedAt: "", description: "", notes: "" };

function toForm(record: ResourceRecord): ObsForm {
  return {
    farmId: record.farmId == null ? "" : String(record.farmId),
    cropCycleId: record.cropCycleId == null ? "" : String(record.cropCycleId),
    category: String(record.category ?? "other"),
    severity: String(record.severity ?? "none"),
    observer: String(record.observer ?? ""),
    observedAt: record.observedAt == null ? "" : String(record.observedAt).slice(0, 16),
    description: String(record.description ?? ""),
    notes: String(record.notes ?? ""),
  };
}

/**
 * Field observations — recorded agronomic field conditions linked to a Farm and
 * (optionally) a Crop Cycle. This is an observation record, NOT a verified
 * scientific conclusion: no diagnosis, no recommendation, no model. UI → api-client
 * → /v1/resources/fieldObservations → SQLite → response → query cache. Write actions
 * are permission-aware; the backend enforces tenancy, RBAC and validation.
 */
export function FieldObservationsModule() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const { role, activeOrganizationId } = useRealSession();
  const canWrite = WRITE_ROLES.has(role ?? "");
  const toast = useToast();

  const query = useResourceList("fieldObservations");
  const farms = useResourceList("farms");
  const cycles = useResourceList("cropCycles");
  const create = useCreateResource("fieldObservations");
  const update = useUpdateResource("fieldObservations");
  const remove = useDeleteResource("fieldObservations");

  const [editing, setEditing] = useState<ResourceRecord | "new" | null>(null);
  const [form, setForm] = useState<ObsForm>(EMPTY);
  const [errors, setErrors] = useState<{ farmId?: string; observer?: string; description?: string; observedAt?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ResourceRecord | null>(null);

  const rows = useMemo(() => query.data?.items ?? [], [query.data]);
  const farmName = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of farms.data?.items ?? []) map.set(String(f.id), String(f.name ?? f.id));
    return map;
  }, [farms.data]);

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
    const next: typeof errors = {};
    if (!form.farmId) next.farmId = l(L.farmRequired);
    if (form.observer.trim().length < 2) next.observer = l(L.observerRequired);
    if (form.description.trim().length < 2) next.description = l(L.descriptionRequired);
    if (!form.observedAt || Number.isNaN(Date.parse(form.observedAt))) next.observedAt = l(L.datetimeInvalid);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const payload = () => {
    const body: Record<string, unknown> = {
      organizationId: activeOrganizationId,
      farmId: form.farmId,
      category: form.category,
      severity: form.severity,
      observer: form.observer.trim(),
      observedAt: form.observedAt,
      description: form.description.trim(),
    };
    if (form.cropCycleId) body.cropCycleId = form.cropCycleId;
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

      <p className="pl-muted">{l(L.observation)}</p>

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
                      <th>{l(L.observedAt)}</th>
                      <th>{l(L.farm)}</th>
                      <th>{l(L.category)}</th>
                      <th>{l(L.severity)}</th>
                      <th>{l(L.observer)}</th>
                      <th>{l(L.description)}</th>
                      {canWrite ? <th><span className="sr-only">{l(L.actions)}</span></th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((record) => (
                      <tr key={record.id}>
                        <td>{record.observedAt ? String(record.observedAt).replace("T", " ") : "—"}</td>
                        <td>{record.farmId ? farmName.get(String(record.farmId)) ?? String(record.farmId) : "—"}</td>
                        <td>{record.category ? String(record.category) : "—"}</td>
                        <td><Badge tone={SEVERITY_TONE[String(record.severity ?? "none")] ?? "neutral"}>{String(record.severity ?? "none")}</Badge></td>
                        <td>{record.observer ? String(record.observer) : "—"}</td>
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
          <FormRow label={l(L.farm)} field="obs-farm" required error={errors.farmId}>
            {(props) => (
              <select {...props} value={form.farmId} onChange={(e) => setForm((f) => ({ ...f, farmId: e.target.value }))}>
                <option value="">{l(L.farmRequired)}</option>
                {(farms.data?.items ?? []).map((f) => (
                  <option key={String(f.id)} value={String(f.id)}>{String(f.name ?? f.id)}</option>
                ))}
              </select>
            )}
          </FormRow>
          <FormRow label={l(L.cropCycle)} field="obs-cycle">
            {(props) => (
              <select {...props} value={form.cropCycleId} onChange={(e) => setForm((f) => ({ ...f, cropCycleId: e.target.value }))}>
                <option value="">{l(L.noCycle)}</option>
                {(cycles.data?.items ?? []).map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>{`${String(c.crop ?? c.id)} (${String(c.seasonStart ?? "")})`}</option>
                ))}
              </select>
            )}
          </FormRow>
          <FormRow label={l(L.category)} field="obs-category">
            {(props) => (
              <select {...props} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </FormRow>
          <FormRow label={l(L.severity)} field="obs-severity">
            {(props) => (
              <select {...props} value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}>
                {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </FormRow>
          <FormRow label={l(L.observer)} field="obs-observer" required error={errors.observer}>
            {(props) => <Input {...props} value={form.observer} onChange={(e) => setForm((f) => ({ ...f, observer: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.observedAt)} field="obs-observed" required error={errors.observedAt}>
            {(props) => <Input {...props} type="datetime-local" value={form.observedAt} onChange={(e) => setForm((f) => ({ ...f, observedAt: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.description)} field="obs-description" required error={errors.description}>
            {(props) => <Input {...props} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.notes)} field="obs-notes">
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