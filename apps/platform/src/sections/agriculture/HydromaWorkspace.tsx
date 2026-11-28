import { useMemo, useState, type ReactNode } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, CardHeader, FormRow, Input, Select, useToast } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useCreateIrrigationRun, useCreateSoilObservation, useCreateSoilProfile, useHydromaRun, useHydromaRuns, useResourceList, useSoilObservations, useSoilProfiles, useSoilVersions, useUpdateSoilProfile } from "../../services/hooks";
import type { HydromaRun } from "@eco-nojin/api-client";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };
const L = {
  eyebrow: { fa: "فضای علمی هیدروما", en: "HyDroMA scientific workspace", ar: "مساحة هايدروما العلمية" },
  title: { fa: "اجرای مدل آبیاری", en: "Irrigation model execution", ar: "تنفيذ نموذج الري" },
  notice: { fa: "خروجی این مدل علمی‌تأییدنشده است (NOT_VALIDATED) و توصیهٔ عملیاتی نیست.", en: "This model is NOT_VALIDATED and its output is not an operational recommendation.", ar: "هذا النموذج غير مُتحقق علمياً (NOT_VALIDATED) وليس توصية تشغيلية." },
  model: { fa: "مدل", en: "Model", ar: "النموذج" },
  version: { fa: "نسخه", en: "Version", ar: "الإصدار" },
  status: { fa: "وضعیت علمی", en: "Scientific status", ar: "الحالة العلمية" },
  layers: { fa: "لایه‌های خاک", en: "Soil layers", ar: "طبقات التربة" },
  thickness: { fa: "ضخامت (mm)", en: "Thickness (mm)", ar: "السماكة (مم)" },
  fc: { fa: "θfc (m³/m³)", en: "θfc (m³/m³)", ar: "θfc (م³/م³)" },
  wp: { fa: "θwp (m³/m³)", en: "θwp (m³/m³)", ar: "θwp (م³/م³)" },
  addLayer: { fa: "افزودن لایه", en: "Add layer", ar: "إضافة طبقة" },
  remove: { fa: "حذف", en: "Remove", ar: "إزالة" },
  p: { fa: "p (کسر تحلیل)", en: "p (depletion fraction)", ar: "p (كسر النضوب)" },
  depletion: { fa: "تحلیل فعلی (mm)", en: "Current depletion (mm)", ar: "النضوب الحالي (مم)" },
  target: { fa: "هدف (اختیاری)", en: "Target (optional)", ar: "الهدف (اختياري)" },
  targetNone: { fa: "بدون هدف", en: "No target", ar: "بدون هدف" },
  targetDepletion: { fa: "تحلیل هدف (mm)", en: "Target depletion (mm)", ar: "نضوب الهدف (مم)" },
  targetStorage: { fa: "ذخیره هدف (mm)", en: "Target storage (mm)", ar: "تخزين الهدف (مم)" },
  efficiency: { fa: "بازده کاربرد (اختیاری)", en: "Application efficiency (optional)", ar: "كفاءة التطبيق (اختياري)" },
  run: { fa: "اجرای مدل", en: "Run model", ar: "تشغيل النموذج" },
  running: { fa: "در حال اجرا…", en: "Running…", ar: "قيد التشغيل…" },
  noWrite: { fa: "برای اجرا به نقش write نیاز دارید.", en: "A write role is required to run the model.", ar: "يلزم دور كتابة للتشغيل." },
  history: { fa: "تاریخچه اجراها", en: "Run history", ar: "سجل التشغيل" },
  noHistory: { fa: "اجرایی ثبت نشده است.", en: "No runs recorded.", ar: "لا توجد عمليات." },
  result: { fa: "نتیجه", en: "Result", ar: "النتيجة" },
  outputs: { fa: "خروجی‌ها", en: "Outputs", ar: "المخرجات" },
  inputs: { fa: "ورودی‌ها", en: "Inputs", ar: "المدخلات" },
  provenance: { fa: "منشأ", en: "Provenance", ar: "المصدر" },
  engineRun: { fa: "شناسهٔ اجرای موتور", en: "Engine run ID", ar: "معرّف تشغيل المحرك" },
  correlation: { fa: "شناسهٔ همبستگی", en: "Correlation ID", ar: "معرّف الارتباط" },
  error: { fa: "خطا", en: "Error", ar: "خطأ" },
  reconciliation: { fa: "نیازمند مصالحه", en: "Reconciliation required", ar: "مطلوب تسوية" },
  invalid: { fa: "ورودی نامعتبر است.", en: "Invalid input.", ar: "مدخل غير صالح." },
  selectRun: { fa: "یک اجرا را برای مشاهده انتخاب کنید.", en: "Select a run to inspect.", ar: "اختر عملية للعرض." },
  duplicate: { fa: "اجرای تکراری (بدون اجرای مجدد)", en: "Duplicate (not re-executed)", ar: "مكرر (دون إعادة تنفيذ)" },
  attempts: { fa: "تعداد تلاش", en: "Attempts", ar: "المحاولات" },
  createdAt: { fa: "زمان ایجاد", en: "Created", ar: "الإنشاء" },
  completedAt: { fa: "زمان تکمیل", en: "Completed", ar: "الاكتمال" },
  notValidated: { fa: "تأییدنشده", en: "NOT_VALIDATED", ar: "غير مُتحقق" },
  reuse: { fa: "استفادهٔ مجدد از ورودی‌ها", en: "Reuse inputs", ar: "إعادة استخدام المدخلات" },
  summary: { fa: "خلاصهٔ نتیجه", en: "Result summary", ar: "ملخص النتيجة" },
  farm: { fa: "مزرعه (زمینه)", en: "Farm (context)", ar: "المزرعة (السياق)" },
  project: { fa: "پروژه (زمینه)", en: "Project (context)", ar: "المشروع (السياق)" },
  none: { fa: "بدون زمینه", en: "No context", ar: "بدون سياق" },
  soil: { fa: "پروفایل خاک", en: "Soil profile", ar: "ملف التربة" },
  soilSource: { fa: "منبع داده", en: "Data source", ar: "مصدر البيانات" },
  saveSoil: { fa: "ذخیرهٔ پروفایل خاک", en: "Save soil profile", ar: "حفظ ملف التربة" },
  soilName: { fa: "نام پروفایل", en: "Profile name", ar: "اسم الملف" },
  measured: { fa: "اندازه‌گیری‌شده", en: "Measured", ar: "مُقاس" },
  userEntered: { fa: "ورودی کاربر", en: "User-entered", ar: "مُدخل المستخدم" },
  estimated: { fa: "تخمینی", en: "Estimated", ar: "مُقدّر" },
  imported: { fa: "واردشده", en: "Imported", ar: "مُستورد" },
  derived: { fa: "مشتق", en: "Derived", ar: "مُشتق" },
  observations: { fa: "مشاهدات خاک", en: "Soil observations", ar: "ملاحظات التربة" },
  parameter: { fa: "پارامتر", en: "Parameter", ar: "المعامل" },
  value: { fa: "مقدار", en: "Value", ar: "القيمة" },
  unit: { fa: "واحد", en: "Unit", ar: "الوحدة" },
  observedAt: { fa: "زمان مشاهده", en: "Observed at", ar: "وقت الملاحظة" },
  addObservation: { fa: "افزودن مشاهده", en: "Add observation", ar: "إضافة ملاحظة" },
  noObservations: { fa: "مشاهده‌ای ثبت نشده است.", en: "No observations recorded.", ar: "لا ملاحظات." },
  fieldMeasurement: { fa: "اندازه‌گیری میدانی", en: "Field measurement", ar: "قياس ميداني" },
  labMeasurement: { fa: "اندازه‌گیری آزمایشگاهی", en: "Lab measurement", ar: "قياس مختبري" },
};

type Layer = { thickness: string; fc: string; wp: string };
const newLayer = (): Layer => ({ thickness: "300", fc: "0.3", wp: "0.15" });
const statusTone = (status: string): "success" | "warning" | "danger" | "neutral" =>
  status === "COMPLETED" ? "success" : status === "FAILED" ? "danger" : status === "RUNNING" ? "warning" : "neutral";

function TextField({ label, field, value, onChange, type }: { label: string; field: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <FormRow label={label} field={field}>
      {(props) => <Input {...props} type={type} value={value} onChange={(e) => onChange(e.target.value)} />}
    </FormRow>
  );
}

function SelectField({ label, field, value, onChange, children }: { label: string; field: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <FormRow label={label} field={field}>
      {(props) => <Select {...props} value={value} onChange={(e) => onChange(e.target.value)}>{children}</Select>}
    </FormRow>
  );
}

export function HydromaWorkspace() {
  const { locale } = useI18n();
  const l = (v: Loc) => tl(v, locale);
  const { role } = useRealSession();
  const canWrite = new Set(["owner", "admin", "manager"]).has(role ?? "");
  const toast = useToast();
  const create = useCreateIrrigationRun();
  const farms = useResourceList("farms");
  const projects = useResourceList("projects");
  const [farmId, setFarmId] = useState("");
  const [projectId, setProjectId] = useState("");
  const soils = useSoilProfiles(farmId || undefined);
  const createSoil = useCreateSoilProfile();
  const updateSoil = useUpdateSoilProfile();
  const createObs = useCreateSoilObservation();
  const observations = useSoilObservations(farmId || undefined);
  const [soilProfileId, setSoilProfileId] = useState("");
  const versions = useSoilVersions(soilProfileId);
  const [soilVersion, setSoilVersion] = useState("1");
  const [obsParameter, setObsParameter] = useState("theta_fc");
  const [obsValue, setObsValue] = useState("");
  const [obsUnit, setObsUnit] = useState("m3_per_m3");
  const [obsSource, setObsSource] = useState("field_measurement");
  const [soilName, setSoilName] = useState("");
  const [soilSource, setSoilSource] = useState("user_entered");
  const history = useHydromaRuns(20, farmId || undefined);
  const [layers, setLayers] = useState<Layer[]>([newLayer()]);
  const [p, setP] = useState("0.5");
  const [depletion, setDepletion] = useState("40");
  const [targetType, setTargetType] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [efficiency, setEfficiency] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<HydromaRun | null>(null);
  const detail = useHydromaRun(activeId ?? "");
  const run = detail.data?.run ?? lastRun;
  const runKey = useMemo(() => `ui-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`, []);

  const validate = (): string | null => {
    if (layers.length === 0) return "layers";
    for (const layer of layers) {
      const t = Number(layer.thickness), fc = Number(layer.fc), wp = Number(layer.wp);
      if (!Number.isFinite(t) || t <= 0) return "thickness";
      if (!Number.isFinite(fc) || fc < 0 || fc > 1) return "fc";
      if (!Number.isFinite(wp) || wp < 0 || wp > 1 || wp >= fc) return "wp";
    }
    if (!Number.isFinite(Number(p)) || Number(p) <= 0 || Number(p) > 1) return "p";
    if (!Number.isFinite(Number(depletion))) return "depletion";
    if (targetType && !Number.isFinite(Number(targetValue))) return "target";
    if (efficiency && (!Number.isFinite(Number(efficiency)) || Number(efficiency) <= 0 || Number(efficiency) > 1)) return "efficiency";
    return null;
  };

  const submit = async () => {
    const invalid = validate();
    if (invalid) {
      toast.push({ title: l(L.invalid), tone: "danger" });
      return;
    }
    const input: Record<string, unknown> = {
      layers: layers.map((layer) => ({ thickness_mm: Number(layer.thickness), theta_fc: Number(layer.fc), theta_wp: Number(layer.wp) })),
      p: Number(p),
      depletion_mm: Number(depletion),
    };
    if (targetType === "depletion") input.target_depletion_mm = Number(targetValue);
    if (targetType === "storage") input.target_storage_mm = Number(targetValue);
    if (efficiency) input.application_efficiency = Number(efficiency);
    try {
      const result = await create.mutateAsync({ runKey, input, farmId: farmId || undefined, projectId: projectId || undefined, soilProfileId: soilProfileId || undefined, soilProfileVersion: soilProfileId ? Number(soilVersion) : undefined });
      setLastRun(result.run);
      setActiveId(result.run.id);
      toast.push({ title: result.duplicate ? l(L.duplicate) : l(L.result), tone: "success" });
    } catch (error) {
      toast.push({ title: error instanceof Error ? error.message : l(L.error), tone: "danger" });
    }
  };

  const applySoil = (id: string) => {
    setSoilProfileId(id);
    const profile = soils.data?.items.find((p) => p.id === id);
    if (!profile) return;
    setSoilVersion(String(profile.version));
    setLayers(profile.layers.map((row) => ({ thickness: String(row.thickness_mm ?? ""), fc: String(row.theta_fc ?? ""), wp: String(row.theta_wp ?? "") })));
    setSoilSource(profile.source);
  };

  const saveSoil = async () => {
    if (!soilName.trim()) {
      toast.push({ title: l(L.soilName), tone: "danger" });
      return;
    }
    try {
      const payload = {
        layers: layers.map((layer) => ({ thickness_mm: Number(layer.thickness), theta_fc: Number(layer.fc), theta_wp: Number(layer.wp) })),
        source: soilSource,
      };
      if (soilProfileId) {
        await updateSoil.mutateAsync({ id: soilProfileId, payload });
      } else {
        await createSoil.mutateAsync({ name: soilName.trim(), ...payload, farmId: farmId || undefined, projectId: projectId || undefined });
      }
      setSoilName("");
      toast.push({ title: l(L.soil), tone: "success" });
    } catch (error) {
      toast.push({ title: error instanceof Error ? error.message : l(L.error), tone: "danger" });
    }
  };

  const addObservation = async () => {
    const value = Number(obsValue);
    if (!Number.isFinite(value) || !obsValue) {
      toast.push({ title: l(L.value), tone: "danger" });
      return;
    }
    try {
      await createObs.mutateAsync({ farmId: farmId || undefined, projectId: projectId || undefined, profileId: soilProfileId || undefined, observedAt: new Date().toISOString(), parameter: obsParameter, value, unit: obsUnit, source: obsSource });
      setObsValue("");
      toast.push({ title: l(L.observations), tone: "success" });
    } catch (error) {
      toast.push({ title: error instanceof Error ? error.message : l(L.error), tone: "danger" });
    }
  };

  const result = (run?.output?.result ?? null) as Record<string, unknown> | null;
  const provenance = run?.provenance ?? null;

  const reuse = () => {
    const input = run?.input as Record<string, unknown> | undefined;
    if (!input) return;
    const rows = (input.layers ?? []) as Array<Record<string, unknown>>;
    setLayers(rows.map((row) => ({ thickness: String(row.thickness_mm ?? ""), fc: String(row.theta_fc ?? ""), wp: String(row.theta_wp ?? "") })));
    setP(String(input.p ?? ""));
    setDepletion(String(input.depletion_mm ?? ""));
    setTargetType(input.target_depletion_mm != null ? "depletion" : input.target_storage_mm != null ? "storage" : "");
    setTargetValue(String(input.target_depletion_mm ?? input.target_storage_mm ?? ""));
    setEfficiency(input.application_efficiency != null ? String(input.application_efficiency) : "");
    setActiveId(null);
    setLastRun(null);
  };

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div>
          <p className="pl-eyebrow">{l(L.eyebrow)}</p>
          <h1>{l(L.title)}</h1>
        </div>
      </header>
      <p className="pl-note">{l(L.notice)}</p>

      <div className="pl-twoCol">
        <Card>
          <CardHeader title={l(L.model)} subtitle="eco-nojin.hydroma.irrigation-schedule · 1.0.0" />
          <CardBody>
            <dl className="pl-defs">
              <div><dt>{l(L.version)}</dt><dd>1.0.0</dd></div>
              <div><dt>{l(L.status)}</dt><dd><Badge tone="warning">{l(L.notValidated)}</Badge></dd></div>
            </dl>
            <div className="pl-grid pl-grid-cols-2 gap-2 mt-2">
              <SelectField label={l(L.farm)} field="ctx-farm" value={farmId} onChange={setFarmId}>
                <option value="">{l(L.none)}</option>
                {(farms.data?.items ?? []).map((f) => <option key={String(f.id)} value={String(f.id)}>{String(f.name ?? f.id)}</option>)}
              </SelectField>
              <SelectField label={l(L.project)} field="ctx-project" value={projectId} onChange={setProjectId}>
                <option value="">{l(L.none)}</option>
                {(projects.data?.items ?? []).map((p) => <option key={String(p.id)} value={String(p.id)}>{String(p.name ?? p.id)}</option>)}
              </SelectField>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={l(L.inputs)} />
          <CardBody>
            <div className="pl-grid pl-grid-cols-2 gap-2 mb-2">
              <SelectField label={l(L.soil)} field="soil" value={soilProfileId} onChange={applySoil}>
                <option value="">{l(L.none)}</option>
                {(soils.data?.items ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.source})</option>)}
              </SelectField>
              <SelectField label={l(L.version)} field="soil-ver" value={soilVersion} onChange={(v) => {
                setSoilVersion(v);
                const found = versions.data?.items.find((item) => String(item.version) === v);
                if (found) setLayers(found.layers.map((row) => ({ thickness: String(row.thickness_mm ?? ""), fc: String(row.theta_fc ?? ""), wp: String(row.theta_wp ?? "") })));
              }}>
                {(versions.data?.items ?? []).map((item) => <option key={item.version} value={String(item.version)}>v{item.version}</option>)}
              </SelectField>
              <SelectField label={l(L.soilSource)} field="soil-src" value={soilSource} onChange={setSoilSource}>
                <option value="measured">{l(L.measured)}</option>
                <option value="user_entered">{l(L.userEntered)}</option>
                <option value="estimated">{l(L.estimated)}</option>
                <option value="imported">{l(L.imported)}</option>
                <option value="derived">{l(L.derived)}</option>
              </SelectField>
              <TextField label={l(L.soilName)} field="soil-name" value={soilName} onChange={setSoilName} />
              <div className="flex items-end"><Button size="sm" variant="secondary" onClick={() => void saveSoil()}>{l(L.saveSoil)}</Button></div>
            </div>
            <div className="pl-grid pl-grid-cols-2 gap-2">
              {layers.map((layer, index) => (
                <div key={index} className="pl-grid pl-grid-cols-3 gap-2 md:pl-col-span-2">
                  <TextField label={`${l(L.thickness)} #${index + 1}`} field={`t-${index}`} value={layer.thickness} onChange={(v) => setLayers((rows) => rows.map((r, i) => (i === index ? { ...r, thickness: v } : r)))} />
                  <TextField label={`${l(L.fc)} #${index + 1}`} field={`fc-${index}`} value={layer.fc} onChange={(v) => setLayers((rows) => rows.map((r, i) => (i === index ? { ...r, fc: v } : r)))} />
                  <TextField label={`${l(L.wp)} #${index + 1}`} field={`wp-${index}`} value={layer.wp} onChange={(v) => setLayers((rows) => rows.map((r, i) => (i === index ? { ...r, wp: v } : r)))} />
                </div>
              ))}
            </div>
            <div className="pl-inlineActions mt-2">
              <Button size="sm" variant="secondary" onClick={() => setLayers((rows) => [...rows, newLayer()])}>{l(L.addLayer)}</Button>
              {layers.length > 1 ? <Button size="sm" variant="secondary" onClick={() => setLayers((rows) => rows.slice(0, -1))}>{l(L.remove)}</Button> : null}
            </div>
            <div className="pl-grid pl-grid-cols-2 gap-2 mt-2">
              <TextField label={l(L.p)} field="p" value={p} onChange={setP} />
              <TextField label={l(L.depletion)} field="dep" value={depletion} onChange={setDepletion} />
              <SelectField label={l(L.target)} field="tt" value={targetType} onChange={setTargetType}>
                <option value="">{l(L.targetNone)}</option>
                <option value="depletion">{l(L.targetDepletion)}</option>
                <option value="storage">{l(L.targetStorage)}</option>
              </SelectField>
              {targetType ? <TextField label={targetType === "depletion" ? l(L.targetDepletion) : l(L.targetStorage)} field="tv" value={targetValue} onChange={setTargetValue} /> : null}
              <TextField label={l(L.efficiency)} field="eff" value={efficiency} onChange={setEfficiency} />
            </div>
            {canWrite ? <div className="mt-3"><Button onClick={() => void submit()} disabled={create.isPending}>{create.isPending ? l(L.running) : l(L.run)}</Button></div> : <p className="pl-muted mt-2">{l(L.noWrite)}</p>}
          </CardBody>
        </Card>
      </div>

      {run ? (
        <Card>
          <CardHeader title={l(L.result)} subtitle={run.resultSummary ?? `${run.id} · ${run.status}`} />
          <CardBody>
            <div className="pl-inlineActions mb-2">
              <Badge tone={statusTone(run.status)}>{run.status}</Badge>
              {run.reconciliationRequired ? <Badge tone="warning">{l(L.reconciliation)}</Badge> : null}
              <Badge tone="neutral">{l(L.notValidated)}</Badge>
              <Button size="sm" variant="secondary" onClick={reuse}>{l(L.reuse)}</Button>
            </div>
            {run.error ? <p className="pl-note">{l(L.error)}: {run.error}</p> : null}
            {result ? (
              <div className="pl-tableWrap">
                <table className="pl-table">
                  <thead><tr><th>{l(L.outputs)}</th><th>{l(L.status)}</th></tr></thead>
                  <tbody>
                    {Object.entries(result).map(([key, value]) => (
                      <tr key={key}><td>{key}</td><td>{typeof value === "object" ? JSON.stringify(value) : String(value)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <dl className="pl-defs mt-2">
              <div><dt>{l(L.engineRun)}</dt><dd>{run.engineRunId ?? "—"}</dd></div>
              <div><dt>{l(L.farm)}</dt><dd>{run.farmId ?? "—"}</dd></div>
              <div><dt>{l(L.project)}</dt><dd>{run.projectId ?? "—"}</dd></div>
              <div><dt>{l(L.soil)}</dt><dd>{run.soilProfileId ?? "—"}</dd></div>
              <div><dt>{l(L.correlation)}</dt><dd>{run.correlationId ?? "—"}</dd></div>
              <div><dt>{l(L.attempts)}</dt><dd>{run.attempts}</dd></div>
              <div><dt>{l(L.createdAt)}</dt><dd>{run.createdAt}</dd></div>
              <div><dt>{l(L.completedAt)}</dt><dd>{run.completedAt ?? "—"}</dd></div>
            </dl>
            {provenance ? (
              <div className="mt-2">
                <h3 className="pl-h3">{l(L.provenance)}</h3>
                <pre className="pl-pre">{JSON.stringify(provenance, null, 2)}</pre>
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : (
        <p className="pl-muted">{l(L.selectRun)}</p>
      )}

      <Card>
        <CardHeader title={l(L.observations)} />
        <CardBody>
          <div className="pl-grid pl-grid-cols-2 gap-2 mb-2">
            <TextField label={l(L.parameter)} field="obs-p" value={obsParameter} onChange={setObsParameter} />
            <TextField label={l(L.value)} field="obs-v" value={obsValue} onChange={setObsValue} />
            <TextField label={l(L.unit)} field="obs-u" value={obsUnit} onChange={setObsUnit} />
            <SelectField label={l(L.soilSource)} field="obs-src" value={obsSource} onChange={setObsSource}>
              <option value="field_measurement">{l(L.fieldMeasurement)}</option>
              <option value="lab_measurement">{l(L.labMeasurement)}</option>
              <option value="user_entered">{l(L.userEntered)}</option>
              <option value="imported">{l(L.imported)}</option>
              <option value="estimated">{l(L.estimated)}</option>
              <option value="derived">{l(L.derived)}</option>
            </SelectField>
          </div>
          <div className="mb-2"><Button size="sm" variant="secondary" onClick={() => void addObservation()}>{l(L.addObservation)}</Button></div>
          <ApiBoundary state={observations}>
            {(observations.data?.items.length ?? 0) === 0 ? <ApiEmpty /> : (
              <div className="pl-tableWrap">
                <table className="pl-table">
                  <thead><tr><th>{l(L.parameter)}</th><th>{l(L.value)}</th><th>{l(L.unit)}</th><th>{l(L.soilSource)}</th><th>{l(L.observedAt)}</th></tr></thead>
                  <tbody>
                    {observations.data?.items.map((o) => (
                      <tr key={o.id}><td>{o.parameter}{o.depthMm != null ? ` @${o.depthMm}mm` : ""}</td><td>{o.value}</td><td>{o.unit}</td><td>{o.source}</td><td>{o.observedAt}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ApiBoundary>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={l(L.history)} />
        <CardBody>
          <ApiBoundary state={history}>
            {(history.data?.items.length ?? 0) === 0 ? (
              <ApiEmpty />
            ) : (
              <div className="pl-tableWrap">
                <table className="pl-table">
                  <thead><tr><th>Run</th><th>{l(L.model)}</th><th>{l(L.status)}</th><th>{l(L.createdAt)}</th></tr></thead>
                  <tbody>
                    {history.data?.items.map((item) => (
                      <tr key={item.id} onClick={() => setActiveId(item.id)} style={{ cursor: "pointer" }}>
                        <td className="font-mono text-xs">{item.id}</td>
                        <td>{item.modelId}</td>
                        <td><Badge tone={statusTone(item.status)}>{item.status}</Badge></td>
                        <td>{item.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ApiBoundary>
        </CardBody>
      </Card>
    </div>
  );
}