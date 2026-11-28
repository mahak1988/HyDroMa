import { useMemo, useState } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, Dialog, FormAlert, FormRow, Input, Select, useToast } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useCreateResource, useDeleteResource, useResourceList, useUpdateResource, type ResourceRecord } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };

const L = {
  eyebrow: { fa: "دادهٔ عملیاتی واقعی", en: "Real operational data", ar: "بيانات تشغيلية حقيقية" },
  title: { fa: "عملیات آبیاری", en: "Irrigation operations", ar: "عمليات الري" },
  add: { fa: "افزودن رویداد", en: "Add event", ar: "إضافة حدث" },
  search: { fa: "جست‌وجو", en: "Search", ar: "بحث" },
  farm: { fa: "مزرعه", en: "Farm", ar: "المزرعة" },
  cropCycle: { fa: "دورهٔ کشت", en: "Crop cycle", ar: "دورة المحصول" },
  none: { fa: "—", en: "—", ar: "—" },
  date: { fa: "زمان وقوع", en: "Occurred at", ar: "وقت الحدوث" },
  quantity: { fa: "مقدار آب", en: "Water quantity", ar: "كمية المياه" },
  unit: { fa: "واحد", en: "Unit", ar: "الوحدة" },
  method: { fa: "روش", en: "Method", ar: "الطريقة" },
  notes: { fa: "یادداشت", en: "Notes", ar: "ملاحظات" },
  actions: { fa: "عملیات", en: "Actions", ar: "الإجراءات" },
  edit: { fa: "ویرایش", en: "Edit", ar: "تعديل" },
  delete: { fa: "حذف", en: "Delete", ar: "حذف" },
  createTitle: { fa: "ثبت آبیاری", en: "Record irrigation", ar: "تسجيل ري" },
  editTitle: { fa: "ویرایش آبیاری", en: "Edit irrigation", ar: "تعديل الري" },
  deleteTitle: { fa: "حذف آبیاری", en: "Delete irrigation", ar: "حذف الري" },
  deleteBody: { fa: "این رکورد برای همیشه حذف می‌شود.", en: "This record will be permanently deleted.", ar: "سيُحذف هذا السجل نهائياً." },
  cancel: { fa: "انصراف", en: "Cancel", ar: "إلغاء" },
  save: { fa: "ذخیره", en: "Save", ar: "حفظ" },
  confirm: { fa: "تأیید", en: "Confirm", ar: "تأكيد" },
  farmRequired: { fa: "انتخاب مزرعه الزامی است.", en: "A farm is required.", ar: "المزرعة مطلوبة." },
  quantityInvalid: { fa: "مقدار باید عددی مثبت باشد.", en: "Quantity must be a positive number.", ar: "يجب أن تكون الكمية رقماً موجباً." },
  created: { fa: "رکورد آبیاری ثبت شد.", en: "Irrigation recorded.", ar: "تم تسجيل الري." },
  updated: { fa: "رکورد به‌روزرسانی شد.", en: "Record updated.", ar: "تم التحديث." },
  deleted: { fa: "رکورد حذف شد.", en: "Record deleted.", ar: "تم الحذف." },
  readOnly: { fa: "برای ثبت به نقش write نیاز دارید.", en: "A write role is required to record.", ar: "يلزم دور كتابة للتسجيل." },
  errorTitle: { fa: "خطا", en: "Error", ar: "خطأ" },
  scientific: { fa: "این داده صرفاً رکورد عملیاتی است و خروجی علمی یا توصیهٔ آبیاری نیست.", en: "This is an operational record only — not a scientific output or irrigation recommendation.", ar: "هذا سجل تشغيلي فقط — وليس مخرجاً علمياً أو توصية ري." },
};

const WRITE_ROLES = new Set(["owner", "admin", "manager"]);
const UNITS = ["m3", "mm", "ha-mm"] as const;
const METHODS = ["surface", "sprinkler", "drip"] as const;

type Form = { farmId: string; cropCycleId: string; date: string; quantity: string; unit: string; method: string; notes: string };
const EMPTY: Form = { farmId: "", cropCycleId: "", date: "", quantity: "", unit: "mm", method: "drip", notes: "" };

function toForm(r: ResourceRecord): Form {
  return {
    farmId: r.farmId == null ? "" : String(r.farmId),
    cropCycleId: r.cropCycleId == null ? "" : String(r.cropCycleId),
    date: r.occurredAt == null ? "" : String(r.occurredAt),
    quantity: r.quantity == null ? "" : String(r.quantity),
    unit: String(r.unit ?? "mm"),
    method: String(r.method ?? "drip"),
    notes: String(r.notes ?? ""),
  };
}

/** M05 irrigation operations — persisted operational records linked to a farm (and optional crop cycle). */
export function IrrigationModule() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const { role, activeOrganizationId } = useRealSession();
  const canWrite = WRITE_ROLES.has(role ?? "");
  const toast = useToast();

  const [search, setSearch] = useState("");
  const query = useResourceList("irrigationEvents", { search: search || undefined });
  const farms = useResourceList("farms");
  const cropCycles = useResourceList("cropCycles");
  const create = useCreateResource("irrigationEvents");
  const update = useUpdateResource("irrigationEvents");
  const remove = useDeleteResource("irrigationEvents");

  const [editing, setEditing] = useState<ResourceRecord | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<{ farmId?: string; quantity?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ResourceRecord | null>(null);

  const rows = useMemo(() => query.data?.items ?? [], [query.data]);
  const farmName = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of farms.data?.items ?? []) m.set(String(f.id), String(f.name ?? f.id));
    return m;
  }, [farms.data]);

  const openCreate = () => { setForm(EMPTY); setErrors({}); setServerError(null); setEditing("new"); };
  const openEdit = (r: ResourceRecord) => { setForm(toForm(r)); setErrors({}); setServerError(null); setEditing(r); };

  const validate = () => {
    const next: { farmId?: string; quantity?: string } = {};
    if (!form.farmId) next.farmId = l(L.farmRequired);
    const q = Number(form.quantity);
    if (form.quantity.trim() === "" || !Number.isFinite(q) || q <= 0) next.quantity = l(L.quantityInvalid);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const payload = () => {
    const body: Record<string, unknown> = { organizationId: activeOrganizationId, farmId: form.farmId, quantity: Number(form.quantity), unit: form.unit, method: form.method };
    if (form.cropCycleId) body.cropCycleId = form.cropCycleId;
    if (form.date) body.occurredAt = form.date;
    if (form.notes.trim() !== "") body.notes = form.notes.trim();
    return body;
  };

  const submit = async () => {
    if (!validate()) return;
    setServerError(null);
    try {
      if (editing === "new") { await create.mutateAsync(payload()); toast.push({ title: l(L.created), tone: "success" }); }
      else if (editing) { await update.mutateAsync({ id: String(editing.id), patch: payload() }); toast.push({ title: l(L.updated), tone: "success" }); }
      setEditing(null);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : l(L.errorTitle));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try { await remove.mutateAsync(String(deleting.id)); toast.push({ title: l(L.deleted), tone: "success" }); }
    catch (e) { toast.push({ title: e instanceof Error ? e.message : l(L.errorTitle), tone: "danger" }); }
    finally { setDeleting(null); }
  };

  const busy = create.isPending || update.isPending || remove.isPending;

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div>
          <p className="pl-eyebrow">{l(L.eyebrow)}</p>
          <h1>{l(L.title)}</h1>
        </div>
        {canWrite ? <div className="pl-pageActions"><Button onClick={openCreate}>{l(L.add)}</Button></div> : <Badge tone="neutral">{l(L.readOnly)}</Badge>}
      </header>

      <div className="pl-toolbar">
        <label className="pl-search"><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={l(L.search)} aria-label={l(L.search)} /></label>
        <span className="pl-count">{query.data ? `${query.data.total}` : ""}</span>
      </div>

      <ApiBoundary state={query}>
        {rows.length === 0 ? <ApiEmpty /> : (
          <Card>
            <CardBody className="!p-0">
              <div className="pl-tableWrap">
                <table className="pl-table">
                  <thead><tr><th>{l(L.farm)}</th><th>{l(L.date)}</th><th>{l(L.quantity)}</th><th>{l(L.unit)}</th><th>{l(L.method)}</th>{canWrite ? <th><span className="sr-only">{l(L.actions)}</span></th> : null}</tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.farmId ? farmName.get(String(r.farmId)) ?? String(r.farmId) : "—"}</td>
                        <td>{r.occurredAt ? String(r.occurredAt) : "—"}</td>
                        <td>{r.quantity == null ? "—" : String(r.quantity)}</td>
                        <td>{r.unit ? String(r.unit) : "—"}</td>
                        <td>{r.method ? String(r.method) : "—"}</td>
                        {canWrite ? <td className="pl-actionsCell"><Button variant="ghost" size="sm" onClick={() => openEdit(r)}>{l(L.edit)}</Button><Button variant="danger" size="sm" onClick={() => setDeleting(r)}>{l(L.delete)}</Button></td> : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </ApiBoundary>

      <p className="pl-note">{l(L.scientific)}</p>

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? l(L.createTitle) : l(L.editTitle)} footer={<><Button variant="secondary" onClick={() => setEditing(null)}>{l(L.cancel)}</Button><Button onClick={() => void submit()} disabled={busy}>{l(L.save)}</Button></>}>
        <div className="pl-stack">
          {serverError ? <FormAlert title={l(L.errorTitle)}>{serverError}</FormAlert> : null}
          <FormRow label={l(L.farm)} field="irr-farm" required error={errors.farmId}>
            {(p) => <Select {...p} value={form.farmId} onChange={(e) => setForm((f) => ({ ...f, farmId: e.target.value }))}><option value="">{l(L.none)}</option>{(farms.data?.items ?? []).map((f) => <option key={String(f.id)} value={String(f.id)}>{String(f.name ?? f.id)}</option>)}</Select>}
          </FormRow>
          <FormRow label={l(L.cropCycle)} field="irr-cycle">
            {(p) => <Select {...p} value={form.cropCycleId} onChange={(e) => setForm((f) => ({ ...f, cropCycleId: e.target.value }))}><option value="">{l(L.none)}</option>{(cropCycles.data?.items ?? []).map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.name ?? c.id)}</option>)}</Select>}
          </FormRow>
          <FormRow label={l(L.date)} field="irr-occurred">{(p) => <Input {...p} type="datetime-local" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />}</FormRow>
          <FormRow label={l(L.quantity)} field="irr-quantity" error={errors.quantity}>{(p) => <Input {...p} inputMode="decimal" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />}</FormRow>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label={l(L.unit)} field="irr-unit">{(p) => <Select {...p} value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</Select>}</FormRow>
            <FormRow label={l(L.method)} field="irr-method">{(p) => <Select {...p} value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}>{METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</Select>}</FormRow>
          </div>
          <FormRow label={l(L.notes)} field="irr-notes">{(p) => <Input {...p} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />}</FormRow>
        </div>
      </Dialog>

      <Dialog open={deleting !== null} onClose={() => setDeleting(null)} title={l(L.deleteTitle)} footer={<><Button variant="secondary" onClick={() => setDeleting(null)}>{l(L.cancel)}</Button><Button variant="danger" onClick={() => void confirmDelete()} disabled={busy}>{l(L.confirm)}</Button></>}>
        <p className="pl-body">{l(L.deleteBody)}</p>
      </Dialog>
    </div>
  );
}