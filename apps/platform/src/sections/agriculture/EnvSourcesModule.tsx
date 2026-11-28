import { useState } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, Dialog, FormAlert, FormRow, Input, Select, useToast } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useCreateSource, useEnvSources } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };
const L = {
  eyebrow: { fa: "فهرست منابع محیطی", en: "Environmental source registry", ar: "سجل المصادر البيئية" },
  title: { fa: "منابع دادهٔ محیطی", en: "Environmental data sources", ar: "مصادر البيانات البيئية" },
  notice: { fa: "زیرساخت یکپارچه‌سازی — دریافت زنده و اجرای علمی مجاز نیست.", en: "ENVIRONMENTAL DATA INTEGRATION FOUNDATION — LIVE ACQUISITION AND SCIENTIFIC EXECUTION NOT AUTHORIZED", ar: "أساس تكامل البيانات — جمع البيانات الحية والتنفيذ العلمي غير مصرح" },
  add: { fa: "افزودن منبع", en: "Add source", ar: "إضافة مصدر" },
  name: { fa: "نام", en: "Name", ar: "الاسم" },
  category: { fa: "دسته", en: "Category", ar: "الفئة" },
  type: { fa: "نوع", en: "Type", ar: "النوع" },
  provider: { fa: "ارائه‌دهنده", en: "Provider", ar: "المزود" },
  status: { fa: "وضعیت", en: "Status", ar: "الحالة" },
  integration: { fa: "وضعیت یکپارچه‌سازی", en: "Integration", ar: "التكامل" },
  save: { fa: "ذخیره", en: "Save", ar: "حفظ" },
  cancel: { fa: "انصراف", en: "Cancel", ar: "إلغاء" },
  createTitle: { fa: "افزودن منبع", en: "Add source", ar: "إضافة مصدر" },
  nameRequired: { fa: "نام باید حداقل ۲ حرف باشد.", en: "Name must be at least 2 characters.", ar: "الاسم حرفان على الأقل." },
  created: { fa: "منبع افزوده شد.", en: "Source added.", ar: "تمت إضافة المصدر." },
  readOnly: { fa: "برای افزودن به نقش write نیاز دارید.", en: "A write role is required.", ar: "يلزم دور كتابة." },
  errorTitle: { fa: "خطا", en: "Error", ar: "خطأ" },
  none: { fa: "—", en: "—", ar: "—" },
};
const WRITE = new Set(["owner", "admin", "manager"]);
const CATS = ["weather", "satellite", "soil", "terrain", "water", "landcover", "other"];
const STATUS = ["CATALOGUED", "DOCUMENTED", "CONTRACT_DEFINED", "ADAPTER_IMPLEMENTED", "TESTED"];
const EMPTY = { name: "", category: "weather", sourceType: "api", provider: "", integrationStatus: "CATALOGUED" };

export function EnvSourcesModule() {
  const { locale } = useI18n();
  const l = (v: Loc) => tl(v, locale);
  const { role } = useRealSession();
  const canWrite = WRITE.has(role ?? "");
  const toast = useToast();
  const q = useEnvSources();
  const create = useCreateSource();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState<string | undefined>();
  const rows = (q.data?.items ?? []) as Array<Record<string, unknown>>;

  const submit = async () => {
    if (String(form.name).trim().length < 2) { setErr(l(L.nameRequired)); return; }
    setErr(undefined);
    try { await create.mutateAsync({ ...form, name: form.name.trim() }); toast.push({ title: l(L.created), tone: "success" }); setEditing(false); }
    catch (e) { toast.push({ title: e instanceof Error ? e.message : l(L.errorTitle), tone: "danger" }); }
  };

  return (
    <div className="pl-stack">
      <header className="pl-pageHead"><div><p className="pl-eyebrow">{l(L.eyebrow)}</p><h1>{l(L.title)}</h1></div>{canWrite ? <div className="pl-pageActions"><Button onClick={() => { setForm(EMPTY); setErr(undefined); setEditing(true); }}>{l(L.add)}</Button></div> : <Badge tone="neutral">{l(L.readOnly)}</Badge>}</header>
      <p className="pl-note">{l(L.notice)}</p>

      <ApiBoundary state={q}>
        {rows.length === 0 ? <ApiEmpty /> : (
          <Card><CardBody className="!p-0"><div className="pl-tableWrap"><table className="pl-table">
            <thead><tr><th>{l(L.name)}</th><th>{l(L.category)}</th><th>{l(L.provider)}</th><th>{l(L.integration)}</th></tr></thead>
            <tbody>{rows.map((s) => <tr key={String(s.id)}><td><span className="pl-rowTitle">{String(s.name)}</span></td><td>{String(s.category)}</td><td>{String(s.provider ?? l(L.none))}</td><td><Badge tone={String(s.integrationStatus) === "TESTED" ? "success" : "neutral"}>{String(s.integrationStatus)}</Badge></td></tr>)}</tbody>
          </table></div></CardBody></Card>
        )}
      </ApiBoundary>

      <Dialog open={editing} onClose={() => setEditing(false)} title={l(L.createTitle)} footer={<><Button variant="secondary" onClick={() => setEditing(false)}>{l(L.cancel)}</Button><Button onClick={() => void submit()} disabled={create.isPending}>{l(L.save)}</Button></>}>
        <div className="pl-stack">
          {err ? <FormAlert title={l(L.errorTitle)}>{err}</FormAlert> : null}
          <FormRow label={l(L.name)} field="src-name" required>{(p) => <Input {...p} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />}</FormRow>
          <FormRow label={l(L.category)} field="src-cat">{(p) => <Select {...p} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>{CATS.map((c) => <option key={c} value={c}>{c}</option>)}</Select>}</FormRow>
          <FormRow label={l(L.type)} field="src-type">{(p) => <Input {...p} value={form.sourceType} onChange={(e) => setForm((f) => ({ ...f, sourceType: e.target.value }))} />}</FormRow>
          <FormRow label={l(L.provider)} field="src-prov">{(p) => <Input {...p} value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} />}</FormRow>
          <FormRow label={l(L.integration)} field="src-int">{(p) => <Select {...p} value={form.integrationStatus} onChange={(e) => setForm((f) => ({ ...f, integrationStatus: e.target.value }))}>{STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</Select>}</FormRow>
        </div>
      </Dialog>
    </div>
  );
}