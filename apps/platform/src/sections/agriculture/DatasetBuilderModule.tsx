import { useState } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, CardHeader, FormRow, Input, useToast } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useAssembleDataset, useCreateDatasetRun, useDatasetModelInput, useDatasets, useExecuteRun, useResourceList } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };
const L = {
  eyebrow: { fa: "دادهٔ علمی", en: "Scientific data", ar: "البيانات العلمية" },
  title: { fa: "سازندهٔ مجموعه‌داده", en: "Dataset builder", ar: "منشئ المجموعة" },
  notice: { fa: "آمادگی فنی اعتبار علمی را اثبات نمی‌کند.", en: "Technical readiness is not scientific validation.", ar: "الجاهزية التقنية ليست تحققاً علمياً." },
  farm: { fa: "مزرعه", en: "Farm", ar: "المزرعة" },
  project: { fa: "پروژه", en: "Project", ar: "المشروع" },
  none: { fa: "بدون زمینه", en: "No context", ar: "بدون سياق" },
  start: { fa: "از تاریخ", en: "Start date", ar: "من تاريخ" },
  end: { fa: "تا تاریخ", en: "End date", ar: "إلى تاريخ" },
  parameters: { fa: "پارامترها (با کاما)", en: "Parameters (comma)", ar: "المعاملات (فواصل)" },
  assemble: { fa: "ساخت مجموعه", en: "Assemble", ar: "تجميع" },
  readiness: { fa: "آمادگی", en: "Readiness", ar: "الجاهزية" },
  coverage: { fa: "پوشش", en: "Coverage", ar: "التغطية" },
  missing: { fa: "ناقص", en: "Missing", ar: "مفقود" },
  model: { fa: "مدل", en: "Model", ar: "النموذج" },
  map: { fa: "نگاشت ورودی مدل", en: "Map model input", ar: "تعيين مدخلات النموذج" },
  createRun: { fa: "ایجاد اجرا از مجموعه", en: "Create run from dataset", ar: "إنشاء تشغيل من المجموعة" },
  run: { fa: "اجرا", en: "Run", ar: "التشغيل" },
  fingerprint: { fa: "اثر انگشت", en: "Fingerprint", ar: "البصمة" },
  execute: { fa: "اجرای مدل", en: "Execute model", ar: "تنفيذ النموذج" },
  history: { fa: "تاریخچه", en: "History", ar: "السجل" },
  noData: { fa: "داده‌ای نیست.", en: "No data.", ar: "لا بيانات." },
  noWrite: { fa: "برای ساخت به نقش write نیاز دارید.", en: "A write role is required.", ar: "يلزم دور كتابة." },
};

const tone = (r: string): "success" | "warning" | "danger" | "neutral" => (r === "READY_FOR_MAPPING" ? "success" : r === "READY_WITH_WARNINGS" ? "warning" : r === "BLOCKED" ? "danger" : "neutral");

export function DatasetBuilderModule() {
  const { locale } = useI18n();
  const l = (v: Loc) => tl(v, locale);
  const { role } = useRealSession();
  const canWrite = new Set(["owner", "admin", "manager"]).has(role ?? "");
  const toast = useToast();
  const farms = useResourceList("farms");
  const projects = useResourceList("projects");
  const datasets = useDatasets();
  const assemble = useAssembleDataset();
  const mapInput = useDatasetModelInput();
  const createRun = useCreateDatasetRun();
  const executeRun = useExecuteRun();
  const [modelInputText, setModelInputText] = useState('{"rn":20,"t":20,"u2":2,"ea":1.5}');
  const [execResult, setExecResult] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{ id: string; snapshotFingerprint: string | null; datasetRevision: number | null } | null>(null);
  const [farmId, setFarmId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [startDate, setStartDate] = useState("2026-11-01");
  const [endDate, setEndDate] = useState("2026-11-01");
  const [parameters, setParameters] = useState("air_temperature,relative_humidity,wind_speed,solar_radiation");
  const [modelId, setModelId] = useState("fao56_et0");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [modelInput, setModelInput] = useState<Record<string, unknown> | null>(null);

  const submit = async () => {
    try {
      const r = await assemble.mutateAsync({ farmId: farmId || undefined, projectId: projectId || undefined, startDate, endDate, parameters: parameters.split(",").map((p) => p.trim()).filter(Boolean) });
      setResult(r.dataset);
      setModelInput(null);
      toast.push({ title: l(L.assemble), tone: "success" });
    } catch (error) {
      toast.push({ title: error instanceof Error ? error.message : l(L.noData), tone: "danger" });
    }
  };

  return (
    <div className="pl-stack">
      <header className="pl-pageHead"><div><p className="pl-eyebrow">{l(L.eyebrow)}</p><h1>{l(L.title)}</h1></div></header>
      <p className="pl-note">{l(L.notice)}</p>

      <Card>
        <CardHeader title={l(L.parameters)} />
        <CardBody>
          <div className="pl-grid pl-grid-cols-2 gap-2">
            <FormRow label={l(L.farm)} field="ds-farm">{(p) => <select {...p} value={farmId} onChange={(e) => setFarmId(e.target.value)}><option value="">{l(L.none)}</option>{(farms.data?.items ?? []).map((f) => <option key={String(f.id)} value={String(f.id)}>{String(f.name ?? f.id)}</option>)}</select>}</FormRow>
            <FormRow label={l(L.project)} field="ds-project">{(p) => <select {...p} value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">{l(L.none)}</option>{(projects.data?.items ?? []).map((p2) => <option key={String(p2.id)} value={String(p2.id)}>{String(p2.name ?? p2.id)}</option>)}</select>}</FormRow>
            <FormRow label={l(L.start)} field="ds-start">{(p) => <Input {...p} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />}</FormRow>
            <FormRow label={l(L.end)} field="ds-end">{(p) => <Input {...p} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />}</FormRow>
            <FormRow label={l(L.parameters)} field="ds-params">{(p) => <Input {...p} value={parameters} onChange={(e) => setParameters(e.target.value)} />}</FormRow>
            <FormRow label={l(L.model)} field="ds-model">{(p) => <select {...p} value={modelId} onChange={(e) => setModelId(e.target.value)}><option value="fao56_et0">fao56_et0</option><option value="water_balance">water_balance</option></select>}</FormRow>
          </div>
          {canWrite ? <Button onClick={() => void submit()} disabled={assemble.isPending}>{l(L.assemble)}</Button> : <p className="pl-muted">{l(L.noWrite)}</p>}
          {result ? (
            <div className="mt-3">
              <p className="pl-small"><Badge tone={tone(String(result.readiness))}>{String(result.readiness)}</Badge> {l(L.coverage)}: {String(result.coverage)} · {l(L.missing)}: {JSON.stringify(result.missingParameters ?? result.missingDates ?? [])}</p>
              <Button size="sm" variant="secondary" onClick={async () => {
                try { const r = await mapInput.mutateAsync({ id: String(result.id ?? result.datasetId), modelId, modelVersion: "1.0.0" }); setModelInput(r.modelInput); } catch (e) { toast.push({ title: e instanceof Error ? e.message : l(L.noData), tone: "danger" }); }
              }}>{l(L.map)}</Button>
              <Button size="sm" variant="secondary" onClick={async () => {
                try {
                  const r = await createRun.mutateAsync({ runKey: `ds-run-${Date.now()}`, modelId, modelVersion: "1.0.0", input: {}, datasetId: String(result.id ?? result.datasetId), farmId: (result.farmId as string) ?? undefined });
                  setRunResult({ id: r.run.id, snapshotFingerprint: r.run.snapshotFingerprint, datasetRevision: r.run.datasetRevision });
                } catch (e) { toast.push({ title: e instanceof Error ? e.message : l(L.noData), tone: "danger" }); }
              }}>{l(L.createRun)}</Button>
              {runResult ? <p className="pl-small pl-muted mt-2">{l(L.run)}: {runResult.id} · rev {runResult.datasetRevision ?? "—"} · {l(L.fingerprint)}: {runResult.snapshotFingerprint ?? "—"}</p> : null}
              {runResult ? (
                <div className="mt-2">
                  <FormRow label="modelInput JSON" field="exec-input">{(p) => <textarea {...p} className="pl-input font-mono text-xs" rows={3} value={modelInputText} onChange={(e) => setModelInputText(e.target.value)} />}</FormRow>
                  <Button size="sm" onClick={async () => {
                    try {
                      const r = await executeRun.mutateAsync({ id: runResult.id, modelInput: JSON.parse(modelInputText) });
                      setExecResult(`${String(r.attempt.status)} · ${String(r.attempt.outputFingerprint ?? "")}`);
                    } catch (e) { toast.push({ title: e instanceof Error ? e.message : l(L.noData), tone: "danger" }); }
                  }}>{l(L.execute)}</Button>
                  {execResult ? <p className="pl-small pl-muted mt-2">{execResult}</p> : null}
                </div>
              ) : null}
              {modelInput ? <pre className="pl-pre mt-2">{JSON.stringify(modelInput, null, 2)}</pre> : null}
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={l(L.history)} />
        <CardBody>
          <ApiBoundary state={datasets}>
            {(datasets.data?.items.length ?? 0) === 0 ? <ApiEmpty /> : (
              <div className="pl-tableWrap"><table className="pl-table">
                <thead><tr><th>ID</th><th>{l(L.readiness)}</th><th>{l(L.coverage)}</th></tr></thead>
                <tbody>{datasets.data?.items.map((d) => <tr key={d.id}><td className="font-mono text-xs">{d.id}</td><td><Badge tone={tone(d.readiness)}>{d.readiness}</Badge></td><td>{d.coverage}</td></tr>)}</tbody>
              </table></div>
            )}
          </ApiBoundary>
        </CardBody>
      </Card>
    </div>
  );
}