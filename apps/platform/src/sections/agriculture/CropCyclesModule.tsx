import { useMemo, useState } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, Dialog, FormAlert, FormRow, Input, useToast } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useCreateResource, useResourceList, useTransitionResource, type ResourceRecord } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };

const L = {
  eyebrow: { fa: "چرخهٔ کشت واقعی", en: "Real crop-cycle workflow", ar: "دورة محصول حقيقية" },
  title: { fa: "چرخهٔ محصول", en: "Crop cycles", ar: "دورات المحصول" },
  add: { fa: "افزودن چرخهٔ محصول", en: "Add crop cycle", ar: "إضافة دورة محصول" },
  crop: { fa: "محصول", en: "Crop", ar: "المحصول" },
  farm: { fa: "مزرعه", en: "Farm", ar: "المزرعة" },
  area: { fa: "مساحت (هکتار)", en: "Area (ha)", ar: "المساحة (هكتار)" },
  season: { fa: "فصل", en: "Season", ar: "الموسم" },
  status: { fa: "وضعیت", en: "Status", ar: "الحالة" },
  attainment: { fa: "تحقق عملکرد", en: "Yield attainment", ar: "تحقيق الإنتاجية" },
  expectedYield: { fa: "عملکرد مورد انتظار (kg)", en: "Expected yield (kg)", ar: "الإنتاجية المتوقعة (كغ)" },
  actualYield: { fa: "عملکرد واقعی (kg)", en: "Actual yield (kg)", ar: "الإنتاجية الفعلية (كغ)" },
  harvest: { fa: "ثبت برداشت", en: "Record harvest", ar: "تسجيل الحصاد" },
  advance: { fa: "مرحلهٔ بعد", en: "Next stage", ar: "المرحلة التالية" },
  farmNone: { fa: "بدون مزرعه", en: "No farm", ar: "بدون مزرعة" },
  cancel: { fa: "انصراف", en: "Cancel", ar: "إلغاء" },
  save: { fa: "ذخیره", en: "Save", ar: "حفظ" },
  confirm: { fa: "تأیید", en: "Confirm", ar: "تأكيد" },
  createTitle: { fa: "افزودن چرخهٔ محصول", en: "Add crop cycle", ar: "إضافة دورة محصول" },
  harvestTitle: { fa: "ثبت برداشت", en: "Record harvest", ar: "تسجيل الحصاد" },
  nameRequired: { fa: "نام محصول باید حداقل ۲ حرف باشد.", en: "Crop name must be at least 2 characters.", ar: "يجب أن يكون اسم المحصول حرفين على الأقل." },
  areaInvalid: { fa: "مساحت باید عددی مثبت باشد.", en: "Area must be a positive number.", ar: "يجب أن تكون المساحة رقماً موجباً." },
  seasonInvalid: { fa: "تاریخ پایان باید پس از تاریخ شروع باشد.", en: "The end date must be after the start date.", ar: "يجب أن يكون تاريخ النهاية بعد البداية." },
  farmRequired: { fa: "انتخاب مزرعه الزامی است.", en: "A farm is required.", ar: "المزرعة مطلوبة." },
  created: { fa: "چرخهٔ محصول افزوده شد.", en: "Crop cycle added.", ar: "تمت إضافة دورة المحصول." },
  advanced: { fa: "وضعیت چرخه به‌روزرسانی شد.", en: "Crop-cycle status updated.", ar: "تم تحديث حالة دورة المحصول." },
  harvested: { fa: "برداشت ثبت شد.", en: "Harvest recorded.", ar: "تم تسجيل الحصاد." },
  readOnly: { fa: "برای افزودن به نقش write نیاز دارید.", en: "A write role is required to add.", ar: "يلزم دور كتابة للإضافة." },
  errorTitle: { fa: "خطا", en: "Error", ar: "خطأ" },
};

const WRITE_ROLES = new Set(["owner", "admin", "manager"]);

// Client mirror of the backend crop-cycle state machine
// (services/api/src/server.mjs CROP_CYCLE_TRANSITIONS). Backend is authoritative.
const NEXT_STATUS: Record<string, string[]> = {
  planned: ["approved"],
  approved: ["planted", "planned"],
  planted: ["growing"],
  growing: ["harvested"],
  harvested: [],
};

const STATUS_TONE: Record<string, "success" | "info" | "neutral"> = {
  planned: "neutral",
  approved: "info",
  planted: "info",
  growing: "info",
  harvested: "success",
};

type CropForm = { crop: string; farmId: string; areaHa: string; seasonStart: string; seasonEnd: string; expectedYield: string };
const EMPTY: CropForm = { crop: "", farmId: "", areaHa: "", seasonStart: "", seasonEnd: "", expectedYield: "" };

/**
 * M05 Agriculture — crop-cycle operational workflow (Phase 3.62).
 * A real agronomic lifecycle, not generic CRUD: a crop cycle belongs to a farm,
 * covers a season window and area, and advances planned→approved→planted→growing→
 * harvested through the backend state machine. The backend validates the agronomy
 * (farm exists, area ≤ farm area, valid season) and derives yield attainment.
 * UI → api-client → /v1/resources/cropCycles → SQLite → response → query cache.
 */
export function CropCyclesModule() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const { role, activeOrganizationId } = useRealSession();
  const canWrite = WRITE_ROLES.has(role ?? "");
  const toast = useToast();

  const query = useResourceList("cropCycles");
  const farms = useResourceList("farms");
  const create = useCreateResource("cropCycles");
  const transition = useTransitionResource("cropCycles");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CropForm>(EMPTY);
  const [errors, setErrors] = useState<{ crop?: string; farmId?: string; areaHa?: string; season?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [harvesting, setHarvesting] = useState<ResourceRecord | null>(null);
  const [actualYield, setActualYield] = useState("");

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
    setEditing(true);
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (form.crop.trim().length < 2) next.crop = l(L.nameRequired);
    if (!form.farmId) next.farmId = l(L.farmRequired);
    const area = Number(form.areaHa);
    if (!Number.isFinite(area) || area <= 0) next.areaHa = l(L.areaInvalid);
    if (!form.seasonStart || !form.seasonEnd || Date.parse(form.seasonEnd) <= Date.parse(form.seasonStart)) {
      next.season = l(L.seasonInvalid);
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const payload = () => ({
    organizationId: activeOrganizationId,
    crop: form.crop.trim(),
    farmId: form.farmId,
    areaHa: Number(form.areaHa),
    seasonStart: form.seasonStart,
    seasonEnd: form.seasonEnd,
    ...(form.expectedYield.trim() !== "" ? { expectedYield: Number(form.expectedYield) } : {}),
  });

  const submit = async () => {
    if (!validate()) return;
    setServerError(null);
    try {
      await create.mutateAsync(payload());
      toast.push({ title: l(L.created), tone: "success" });
      setEditing(false);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : l(L.errorTitle));
    }
  };

  const advance = async (record: ResourceRecord, to: string) => {
    try {
      await transition.mutateAsync({ id: String(record.id), to });
      toast.push({ title: l(L.advanced), tone: "success" });
    } catch (error) {
      toast.push({ title: error instanceof Error ? error.message : l(L.errorTitle), tone: "danger" });
    }
  };

  const recordHarvest = async () => {
    if (!harvesting) return;
    try {
      await transition.mutateAsync({ id: String(harvesting.id), to: "harvested", actualYield: Number(actualYield) });
      toast.push({ title: l(L.harvested), tone: "success" });
      setHarvesting(null);
      setActualYield("");
    } catch (error) {
      toast.push({ title: error instanceof Error ? error.message : l(L.errorTitle), tone: "danger" });
    }
  };

  const busy = create.isPending || transition.isPending;

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
                      <th>{l(L.crop)}</th>
                      <th>{l(L.farm)}</th>
                      <th>{l(L.area)}</th>
                      <th>{l(L.season)}</th>
                      <th>{l(L.status)}</th>
                      <th>{l(L.attainment)}</th>
                      {canWrite ? <th><span className="sr-only">{l(L.advance)}</span></th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((record) => {
                      const status = String(record.status ?? "planned");
                      return (
                        <tr key={record.id}>
                          <td><span className="pl-rowTitle">{String(record.crop ?? record.id)}</span></td>
                          <td>{record.farmId ? farmName.get(String(record.farmId)) ?? String(record.farmId) : <span className="pl-muted">{l(L.farmNone)}</span>}</td>
                          <td>{record.areaHa == null ? "—" : String(record.areaHa)}</td>
                          <td>{record.seasonStart && record.seasonEnd ? `${record.seasonStart} → ${record.seasonEnd}` : "—"}</td>
                          <td><Badge tone={STATUS_TONE[status] ?? "neutral"}>{status}</Badge></td>
                          <td>{record.yieldAttainmentPct == null ? "—" : `${String(record.yieldAttainmentPct)}%`}</td>
                          {canWrite ? (
                            <td className="pl-actionsCell">
                              {status === "growing" ? (
                                <Button variant="secondary" size="sm" disabled={busy} onClick={() => setHarvesting(record)}>{l(L.harvest)}</Button>
                              ) : (
                                (NEXT_STATUS[status] ?? []).map((to) => (
                                  <Button key={to} variant="secondary" size="sm" disabled={busy} onClick={() => void advance(record, to)} aria-label={`${l(L.advance)}: ${to}`}>
                                    {l(L.advance)} → {to}
                                  </Button>
                                ))
                              )}
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </ApiBoundary>

      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        title={l(L.createTitle)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)}>{l(L.cancel)}</Button>
            <Button onClick={() => void submit()} disabled={busy}>{l(L.save)}</Button>
          </>
        }
      >
        <div className="pl-stack">
          {serverError ? <FormAlert title={l(L.errorTitle)}>{serverError}</FormAlert> : null}
          <FormRow label={l(L.crop)} field="crop-name" required error={errors.crop}>
            {(props) => <Input {...props} value={form.crop} onChange={(e) => setForm((f) => ({ ...f, crop: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.farm)} field="crop-farm" required error={errors.farmId}>
            {(props) => (
              <select {...props} value={form.farmId} onChange={(e) => setForm((f) => ({ ...f, farmId: e.target.value }))}>
                <option value="">{l(L.farmNone)}</option>
                {(farms.data?.items ?? []).map((f) => (
                  <option key={String(f.id)} value={String(f.id)}>{String(f.name ?? f.id)}</option>
                ))}
              </select>
            )}
          </FormRow>
          <FormRow label={l(L.area)} field="crop-area" required error={errors.areaHa}>
            {(props) => <Input {...props} inputMode="decimal" value={form.areaHa} onChange={(e) => setForm((f) => ({ ...f, areaHa: e.target.value }))} />}
          </FormRow>
          <FormRow label={`${l(L.season)} — ${l({ fa: "شروع", en: "start", ar: "البداية" })}`} field="crop-season-start" required>
            {(props) => <Input {...props} type="date" value={form.seasonStart} onChange={(e) => setForm((f) => ({ ...f, seasonStart: e.target.value }))} />}
          </FormRow>
          <FormRow label={`${l(L.season)} — ${l({ fa: "پایان", en: "end", ar: "النهاية" })}`} field="crop-season-end" required error={errors.season}>
            {(props) => <Input {...props} type="date" value={form.seasonEnd} onChange={(e) => setForm((f) => ({ ...f, seasonEnd: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.expectedYield)} field="crop-expected-yield">
            {(props) => <Input {...props} inputMode="decimal" value={form.expectedYield} onChange={(e) => setForm((f) => ({ ...f, expectedYield: e.target.value }))} />}
          </FormRow>
        </div>
      </Dialog>

      <Dialog
        open={harvesting !== null}
        onClose={() => setHarvesting(null)}
        title={l(L.harvestTitle)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setHarvesting(null)}>{l(L.cancel)}</Button>
            <Button onClick={() => void recordHarvest()} disabled={busy}>{l(L.confirm)}</Button>
          </>
        }
      >
        <div className="pl-stack">
          <FormRow label={l(L.actualYield)} field="crop-actual-yield" required>
            {(props) => <Input {...props} inputMode="decimal" value={actualYield} onChange={(e) => setActualYield(e.target.value)} />}
          </FormRow>
        </div>
      </Dialog>
    </div>
  );
}