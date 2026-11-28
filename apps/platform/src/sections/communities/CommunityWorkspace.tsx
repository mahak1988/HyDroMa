import { useState } from "react";
import { useParams } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, CardHeader, Dialog, FormAlert, FormRow, Input, Select, useToast } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useActivities, useCreateActivity, useParticipantOp, useParticipants, useRegisterParticipant, useResource, useTransitionActivity } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };
const L = {
  eyebrow: { fa: "فضای جامعه", en: "Community workspace", ar: "مساحة المجتمع" },
  activities: { fa: "فعالیت‌ها", en: "Activities", ar: "الأنشطة" },
  add: { fa: "افزودن فعالیت", en: "Add activity", ar: "إضافة نشاط" },
  title: { fa: "عنوان", en: "Title", ar: "العنوان" },
  category: { fa: "دسته", en: "Category", ar: "الفئة" },
  status: { fa: "وضعیت", en: "Status", ar: "الحالة" },
  start: { fa: "شروع", en: "Start", ar: "البداية" },
  capacity: { fa: "ظرفیت", en: "Capacity", ar: "السعة" },
  participants: { fa: "شرکت‌کنندگان", en: "Participants", ar: "المشاركون" },
  register: { fa: "ثبت‌نام من", en: "Register me", ar: "سجّلني" },
  confirm: { fa: "تأیید", en: "Confirm", ar: "تأكيد" },
  attend: { fa: "حضور", en: "Attend", ar: "حضور" },
  cancel: { fa: "انصراف", en: "Cancel", ar: "إلغاء" },
  save: { fa: "ذخیره", en: "Save", ar: "حفظ" },
  next: { fa: "مرحلهٔ بعد", en: "Next", ar: "التالي" },
  none: { fa: "—", en: "—", ar: "—" },
  readOnly: { fa: "برای مدیریت به نقش write نیاز دارید.", en: "A write role is required.", ar: "يلزم دور كتابة." },
  errorTitle: { fa: "خطا", en: "Error", ar: "خطأ" },
  created: { fa: "فعالیت افزوده شد.", en: "Activity created.", ar: "تم إنشاء النشاط." },
  titleRequired: { fa: "عنوان باید حداقل ۲ حرف باشد.", en: "Title must be at least 2 characters.", ar: "العنوان حرفان على الأقل." },
  cancelBtn: { fa: "بستن", en: "Close", ar: "إغلاق" },
};
const WRITE = new Set(["owner", "admin", "manager"]);
const CATS = ["restoration", "agriculture", "water", "rangeland", "community", "education", "ecotourism", "environment", "other"];
const NEXT: Record<string, string[]> = { draft: ["published", "cancelled"], published: ["in_progress", "cancelled"], in_progress: ["completed", "cancelled"], completed: [], cancelled: [] };
const TONE: Record<string, "success" | "info" | "neutral" | "warning" | "danger"> = { draft: "neutral", published: "info", in_progress: "warning", completed: "success", cancelled: "danger" };
const EMPTY = { title: "", category: "community", plannedStart: "", capacity: "" };

export function CommunityWorkspace() {
  const { id } = useParams();
  const { locale } = useI18n();
  const l = (v: Loc) => tl(v, locale);
  const { role } = useRealSession();
  const canWrite = WRITE.has(role ?? "");
  const toast = useToast();
  const community = useResource("villages", id ?? "");
  const [status, setStatus] = useState("");
  const acts = useActivities(id ? { communityId: String(id), ...(status ? { status } : {}) } : {});
  const create = useCreateActivity();
  const transition = useTransitionActivity();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState<string | undefined>();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div><p className="pl-eyebrow">{l(L.eyebrow)}</p><h1>{community.data ? String(community.data.name ?? id) : l(L.eyebrow)}</h1></div>
        {canWrite ? <div className="pl-pageActions"><Button onClick={() => { setForm(EMPTY); setErr(undefined); setEditing(true); }}>{l(L.add)}</Button></div> : <Badge tone="neutral">{l(L.readOnly)}</Badge>}
      </header>

      <div className="pl-toolbar"><label className="pl-search"><select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={l(L.status)}><option value="">{l(L.status)}</option>{["draft", "published", "in_progress", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}</select></label><span className="pl-count">{acts.data?.total ?? ""}</span></div>

      <ApiBoundary state={acts}>
        {(acts.data?.items.length ?? 0) === 0 ? <ApiEmpty /> : (
          <div className="pl-stack">
            {acts.data!.items.map((a) => (
              <Card key={a.id}>
                <CardHeader title={a.title} subtitle={`${a.category} · ${a.plannedStart ?? l(L.none)}`} />
                <CardBody>
                  <div className="pl-row">
                    <Badge tone={TONE[a.status] ?? "neutral"}>{a.status}</Badge>
                    {canWrite ? (NEXT[a.status] ?? []).map((to) => <Button key={to} variant={to === "cancelled" ? "danger" : "secondary"} size="sm" onClick={() => transition.mutate({ id: a.id, to })} aria-label={`${l(L.next)}: ${to}`}>{l(L.next)} → {to}</Button>) : null}
                    <Button variant="ghost" size="sm" onClick={() => setOpen(open === a.id ? null : a.id)}>{l(L.participants)}</Button>
                  </div>
                  {open === a.id ? <Participants id={a.id} canWrite={canWrite} /> : null}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </ApiBoundary>

      <Dialog open={editing} onClose={() => setEditing(false)} title={l(L.add)} footer={<><Button variant="secondary" onClick={() => setEditing(false)}>{l(L.cancel)}</Button><Button onClick={async () => { if (form.title.trim().length < 2) { setErr(l(L.titleRequired)); return; } setErr(undefined); try { await create.mutateAsync({ communityId: String(id), title: form.title.trim(), category: form.category, plannedStart: form.plannedStart || null, capacity: form.capacity ? Number(form.capacity) : null }); toast.push({ title: l(L.created), tone: "success" }); setEditing(false); } catch (e) { toast.push({ title: e instanceof Error ? e.message : l(L.errorTitle), tone: "danger" }); } }} disabled={create.isPending}>{l(L.save)}</Button></>}>
        <div className="pl-stack">
          {err ? <FormAlert title={l(L.errorTitle)}>{err}</FormAlert> : null}
          <FormRow label={l(L.title)} field="act-title" required>{(p) => <Input {...p} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />}</FormRow>
          <FormRow label={l(L.category)} field="act-cat">{(p) => <Select {...p} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>{CATS.map((c) => <option key={c} value={c}>{c}</option>)}</Select>}</FormRow>
          <FormRow label={l(L.start)} field="act-start">{(p) => <Input {...p} type="date" value={form.plannedStart} onChange={(e) => setForm((f) => ({ ...f, plannedStart: e.target.value }))} />}</FormRow>
          <FormRow label={l(L.capacity)} field="act-cap">{(p) => <Input {...p} inputMode="numeric" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />}</FormRow>
        </div>
      </Dialog>
    </div>
  );
}

function Participants({ id, canWrite }: { id: string; canWrite: boolean }) {
  const { locale } = useI18n();
  const l = (v: Loc) => tl(v, locale);
  const q = useParticipants(id);
  const register = useRegisterParticipant(id);
  const op = useParticipantOp(id);
  const { user } = useRealSession();
  return (
    <div className="pl-stack mt-3">
      <ApiBoundary state={q}>
        {(q.data?.items.length ?? 0) === 0 ? <p className="pl-muted">{l(L.none)}</p> : (
          <ul className="pl-list">
            {q.data!.items.map((p) => (
              <li key={p.id}>
                <span className="pl-listTitle">{p.userId === user?.id ? l(L.register) : p.userId}</span>
                <Badge tone={p.status === "attended" ? "success" : p.status === "confirmed" ? "info" : "neutral"}>{p.status}</Badge>
                {canWrite && p.status === "registered" ? <Button size="sm" onClick={() => op.mutate({ userId: p.userId, op: "confirm" })}>{l(L.confirm)}</Button> : null}
                {canWrite && p.status === "confirmed" ? <Button size="sm" onClick={() => op.mutate({ userId: p.userId, op: "attend" })}>{l(L.attend)}</Button> : null}
                {canWrite && ["registered", "confirmed"].includes(p.status) ? <Button variant="danger" size="sm" onClick={() => op.mutate({ userId: p.userId, op: "cancel" })}>{l(L.cancel)}</Button> : null}
              </li>
            ))}
          </ul>
        )}
      </ApiBoundary>
      <Button variant="secondary" size="sm" onClick={() => register.mutate()}>{l(L.register)}</Button>
    </div>
  );
}