import { useState } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, CardHeader, FormRow, useToast } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useEnvImports, useEnvObservations, useEnvParameters, useImportEnvCsv, useResourceList } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };
const L = {
  eyebrow: { fa: "دادهٔ محیطی", en: "Environmental data", ar: "البيانات البيئية" },
  title: { fa: "ورود و کنترل کیفیت داده", en: "Ingestion & quality control", ar: "الإدخال ومراقبة الجودة" },
  notice: { fa: "کنترل کیفیت داده اعتبار علمی مدل را اثبات نمی‌کند.", en: "Data quality control does not imply scientific validation.", ar: "مراقبة الجودة لا تعني التحقق العلمي." },
  parameters: { fa: "کاتالوگ پارامترها", en: "Parameter catalogue", ar: "كتالوج المعاملات" },
  code: { fa: "کد", en: "Code", ar: "الرمز" },
  unit: { fa: "واحد", en: "Unit", ar: "الوحدة" },
  valueLabel: { fa: "مقدار", en: "Value", ar: "القيمة" },
  category: { fa: "دسته", en: "Category", ar: "الفئة" },
  csv: { fa: "CSV", en: "CSV", ar: "CSV" },
  import: { fa: "ورود داده", en: "Import", ar: "استيراد" },
  importing: { fa: "در حال ورود…", en: "Importing…", ar: "جارٍ الاستيراد…" },
  result: { fa: "نتیجهٔ ورود", en: "Import result", ar: "نتيجة الاستيراد" },
  imported: { fa: "واردشده", en: "Imported", ar: "مُستورد" },
  rejected: { fa: "ردشده", en: "Rejected", ar: "مرفوض" },
  duplicates: { fa: "تکراری", en: "Duplicates", ar: "مكرر" },
  observations: { fa: "مشاهدات محیطی", en: "Environmental observations", ar: "الملاحظات البيئية" },
  quality: { fa: "کیفیت", en: "Quality", ar: "الجودة" },
  observedAt: { fa: "زمان", en: "Observed at", ar: "الوقت" },
  imports: { fa: "تاریخچهٔ ورود", en: "Import history", ar: "سجل الاستيراد" },
  none: { fa: "داده‌ای ثبت نشده است.", en: "No data recorded.", ar: "لا بيانات." },
  farm: { fa: "مزرعه", en: "Farm", ar: "المزرعة" },
  noWrite: { fa: "برای ورود به نقش write نیاز دارید.", en: "A write role is required to import.", ar: "يلزم دور كتابة." },
  sample: { fa: "نمونه: parameter,unit,value,observed_at", en: "e.g. parameter,unit,value,observed_at", ar: "مثال: parameter,unit,value,observed_at" },
};

const qualityTone = (q: string): "success" | "warning" | "danger" | "neutral" => (q === "VALID" ? "success" : q === "WARNING" ? "warning" : q === "REJECTED" ? "danger" : "neutral");

export function EnvDataModule() {
  const { locale } = useI18n();
  const l = (v: Loc) => tl(v, locale);
  const { role } = useRealSession();
  const canWrite = new Set(["owner", "admin", "manager"]).has(role ?? "");
  const toast = useToast();
  const params = useEnvParameters();
  const observations = useEnvObservations();
  const imports = useEnvImports();
  const importCsv = useImportEnvCsv();
  const farms = useResourceList("farms");
  const [farmId, setFarmId] = useState("");
  const [csv, setCsv] = useState("parameter,unit,value,observed_at\nsoil_moisture,m3_per_m3,0.24,2026-11-27T00:00:00Z");
  const [result, setResult] = useState<{ imported: number; rejected: number; duplicates: number } | null>(null);

  const submit = async () => {
    try {
      const r = await importCsv.mutateAsync({ csv, farmId: farmId || undefined, source: "imported", filename: "paste.csv" });
      setResult(r.import);
      toast.push({ title: l(L.imported), tone: "success" });
    } catch (error) {
      toast.push({ title: error instanceof Error ? error.message : l(L.rejected), tone: "danger" });
    }
  };

  return (
    <div className="pl-stack">
      <header className="pl-pageHead"><div><p className="pl-eyebrow">{l(L.eyebrow)}</p><h1>{l(L.title)}</h1></div></header>
      <p className="pl-note">{l(L.notice)}</p>

      <div className="pl-twoCol">
        <Card>
          <CardHeader title={l(L.parameters)} />
          <CardBody>
            <ApiBoundary state={params}>
              {(params.data?.items.length ?? 0) === 0 ? <ApiEmpty /> : (
                <div className="pl-tableWrap"><table className="pl-table">
                  <thead><tr><th>{l(L.code)}</th><th>{l(L.category)}</th><th>{l(L.unit)}</th></tr></thead>
                  <tbody>{params.data?.items.map((p) => <tr key={p.code}><td>{p.code}</td><td>{p.category}</td><td>{p.canonicalUnit}</td></tr>)}</tbody>
                </table></div>
              )}
            </ApiBoundary>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={l(L.csv)} />
          <CardBody>
            <FormRow label={l(L.farm)} field="env-farm">{(p) => <select {...p} value={farmId} onChange={(e) => setFarmId(e.target.value)}><option value="">{l(L.none)}</option>{(farms.data?.items ?? []).map((f) => <option key={String(f.id)} value={String(f.id)}>{String(f.name ?? f.id)}</option>)}</select>}</FormRow>
            <FormRow label={l(L.csv)} field="env-csv" hint={l(L.sample)}>{(p) => <textarea {...p} className="pl-input font-mono text-xs" rows={8} value={csv} onChange={(e) => setCsv(e.target.value)} />}</FormRow>
            {canWrite ? <Button onClick={() => void submit()} disabled={importCsv.isPending}>{importCsv.isPending ? l(L.importing) : l(L.import)}</Button> : <p className="pl-muted">{l(L.noWrite)}</p>}
            {result ? <p className="pl-small pl-muted mt-2">{l(L.result)}: {l(L.imported)} {result.imported} · {l(L.rejected)} {result.rejected} · {l(L.duplicates)} {result.duplicates}</p> : null}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title={l(L.observations)} />
        <CardBody>
          <ApiBoundary state={observations}>
            {(observations.data?.items.length ?? 0) === 0 ? <ApiEmpty /> : (
              <div className="pl-tableWrap"><table className="pl-table">
                <thead><tr><th>{l(L.code)}</th><th>{l(L.valueLabel)}</th><th>{l(L.unit)}</th><th>{l(L.quality)}</th><th>{l(L.observedAt)}</th></tr></thead>
                <tbody>{observations.data?.items.map((o) => <tr key={o.id}><td>{o.parameter}</td><td>{o.value}</td><td>{o.unit}</td><td><Badge tone={qualityTone(o.quality)}>{o.quality}</Badge></td><td>{o.observedAt}</td></tr>)}</tbody>
              </table></div>
            )}
          </ApiBoundary>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={l(L.imports)} />
        <CardBody>
          <ApiBoundary state={imports}>
            {(imports.data?.items.length ?? 0) === 0 ? <ApiEmpty /> : (
              <div className="pl-tableWrap"><table className="pl-table">
                <thead><tr><th>{l(L.csv)}</th><th>{l(L.imported)}</th><th>{l(L.rejected)}</th><th>{l(L.duplicates)}</th><th>{l(L.observedAt)}</th></tr></thead>
                <tbody>{imports.data?.items.map((i) => <tr key={i.id}><td>{i.filename}</td><td>{i.imported}</td><td>{i.rejected}</td><td>{i.duplicates}</td><td>{i.createdAt}</td></tr>)}</tbody>
              </table></div>
            )}
          </ApiBoundary>
        </CardBody>
      </Card>
    </div>
  );
}