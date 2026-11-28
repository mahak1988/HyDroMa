import { useMemo, useState } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, Dialog, FormAlert, FormRow, Input, useToast } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import {
  useChallengeParticipations,
  useChallenges,
  useCreateChallenge,
  useParticipateChallenge,
  useParticipationEvidence,
  useReviewParticipation,
  useRewardRules,
  useSubmitEvidence,
  useTransitionChallenge,
} from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };

const L = {
  eyebrow: { fa: "چالش‌ها و مشارکت", en: "Challenges & participation", ar: "التحديات والمشاركة" },
  title: { fa: "چالش‌ها", en: "Challenges", ar: "التحديات" },
  add: { fa: "افزودن چالش", en: "Add challenge", ar: "إضافة تحدٍ" },
  code: { fa: "کد", en: "Code", ar: "الرمز" },
  titleCol: { fa: "عنوان", en: "Title", ar: "العنوان" },
  status: { fa: "وضعیت", en: "Status", ar: "الحالة" },
  reward: { fa: "پاداش (اکوکوین)", en: "Reward (EcoCoin)", ar: "المكافأة (إيكو كوين)" },
  participants: { fa: "شرکت‌کنندگان", en: "Participants", ar: "المشاركون" },
  mine: { fa: "وضعیت من", en: "My status", ar: "حالتي" },
  join: { fa: "پیوستن", en: "Join", ar: "انضم" },
  advance: { fa: "مرحلهٔ بعد", en: "Next stage", ar: "المرحلة التالية" },
  verify: { fa: "تأیید مشارکت", en: "Verify", ar: "تحقّق" },
  noReward: { fa: "بدون پاداش", en: "No reward", ar: "بدون مكافأة" },
  none: { fa: "—", en: "—", ar: "—" },
  cancel: { fa: "انصراف", en: "Cancel", ar: "إلغاء" },
  save: { fa: "ذخیره", en: "Save", ar: "حفظ" },
  createTitle: { fa: "افزودن چالش", en: "Add challenge", ar: "إضافة تحدٍ" },
  description: { fa: "توضیحات", en: "Description", ar: "الوصف" },
  criteria: { fa: "معیار تکمیل", en: "Completion criteria", ar: "معايير الإكمال" },
  rewardRule: { fa: "قاعدهٔ پاداش", en: "Reward rule", ar: "قاعدة المكافأة" },
  maxParticipants: { fa: "سقف شرکت‌کنندگان", en: "Max participants", ar: "الحد الأقصى" },
  startAt: { fa: "شروع", en: "Start", ar: "البداية" },
  endAt: { fa: "پایان", en: "End", ar: "النهاية" },
  codeRequired: { fa: "کد باید حداقل ۲ حرف باشد.", en: "Code must be at least 2 characters.", ar: "يجب أن يكون الرمز حرفين على الأقل." },
  titleRequired: { fa: "عنوان باید حداقل ۲ حرف باشد.", en: "Title must be at least 2 characters.", ar: "يجب أن يكون العنوان حرفين على الأقل." },
  created: { fa: "چالش افزوده شد.", en: "Challenge added.", ar: "تمت إضافة التحدي." },
  joined: { fa: "به چالش پیوستید.", en: "You joined the challenge.", ar: "لقد انضممت إلى التحدي." },
  advanced: { fa: "وضعیت چالش به‌روزرسانی شد.", en: "Challenge status updated.", ar: "تم تحديث حالة التحدي." },
  verified: { fa: "مشارکت تأیید شد.", en: "Participation verified.", ar: "تم التحقق من المشاركة." },
  readOnly: { fa: "برای مدیریت به نقش write نیاز دارید.", en: "A write role is required to manage.", ar: "يلزم دور كتابة للإدارة." },
  errorTitle: { fa: "خطا", en: "Error", ar: "خطأ" },
  verifyTitle: { fa: "تأیید مشارکت‌ها", en: "Verify participations", ar: "التحقق من المشاركين" },
  noParticipations: { fa: "هنوز مشارکتی ثبت نشده است.", en: "No participations yet.", ar: "لا توجد مشاركات بعد." },
  verifyOne: { fa: "تأیید", en: "Verify", ar: "تحقّق" },
  rewardIssued: { fa: "پاداش ثبت شد", en: "Reward issued", ar: "تم منح المكافأة" },
  limitReached: { fa: "سقف پاداش پر شده", en: "Reward limit reached", ar: "بلغ حد المكافأة" },
  evidenceTitle: { fa: "ثبت مدرک", en: "Submit evidence", ar: "تقديم الدليل" },
  evidenceType: { fa: "نوع مدرک", en: "Evidence type", ar: "نوع الدليل" },
  source: { fa: "منبع", en: "Source", ar: "المصدر" },
  sourceType: { fa: "نوع منبع (اختیاری)", en: "Source type (optional)", ar: "نوع المصدر (اختياري)" },
  submitEvidence: { fa: "ثبت مدرک", en: "Submit evidence", ar: "تقديم الدليل" },
  submitted: { fa: "مدرک ثبت شد.", en: "Evidence submitted.", ar: "تم تقديم الدليل." },
  rejected: { fa: "رد شد", en: "Rejected", ar: "مرفوض" },
  reject: { fa: "رد", en: "Reject", ar: "رفض" },
  actions: { fa: "عملیات", en: "Actions", ar: "الإجراءات" },
};

const WRITE_ROLES = new Set(["owner", "admin", "manager"]);
const VERIFY_ROLES = new Set(["owner", "admin"]);

// Client mirror of the backend challenge state machine
// (services/api/src/server.mjs CHALLENGE_TRANSITIONS). Backend is authoritative.
const NEXT_STATUS: Record<string, string[]> = {
  draft: ["published"],
  published: ["closed"],
  closed: ["archived"],
  archived: [],
};

const STATUS_TONE: Record<string, "success" | "info" | "neutral" | "warning"> = {
  draft: "neutral",
  published: "success",
  closed: "warning",
  archived: "neutral",
};

type ChallengeForm = {
  code: string;
  title: string;
  description: string;
  completionCriteria: string;
  rewardRuleId: string;
  maxParticipants: string;
  startAt: string;
  endAt: string;
};
const EMPTY: ChallengeForm = { code: "", title: "", description: "", completionCriteria: "", rewardRuleId: "", maxParticipants: "", startAt: "", endAt: "" };

function EvidenceBlock({ challengeId, participationId }: { challengeId: string; participationId: string }) {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const q = useParticipationEvidence(challengeId, participationId);
  return (
    <ApiBoundary state={q}>
      {q.data ? (
        <div className="pl-defs">
          <div><dt>{l(L.evidenceType)}</dt><dd>{q.data.evidenceType}</dd></div>
          {q.data.sourceType ? <div><dt>{l(L.source)}</dt><dd>{q.data.sourceType} · {q.data.sourceId}</dd></div> : null}
          <div><dt>{l(L.description)}</dt><dd>{q.data.description}</dd></div>
        </div>
      ) : null}
    </ApiBoundary>
  );
}

function ReviewDialog({ challengeId, onClose }: { challengeId: string; onClose: () => void }) {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const toast = useToast();
  const query = useChallengeParticipations(challengeId);
  const review = useReviewParticipation(challengeId);
  const [busyId, setBusyId] = useState<string | null>(null);
  const rows = query.data?.items ?? [];

  const decide = async (participationId: string, decision: "approve" | "reject") => {
    setBusyId(participationId);
    try {
      const r = await review.mutateAsync({ participationId, decision });
      const msg = r.reward?.limitReached ? l(L.limitReached) : r.reward?.entry ? l(L.rewardIssued) : decision === "approve" ? l(L.verified) : l(L.rejected);
      toast.push({ title: msg, tone: decision === "approve" ? "success" : "info" });
    } catch (error) {
      toast.push({ title: error instanceof Error ? error.message : l(L.errorTitle), tone: "danger" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open onClose={onClose} title={l(L.verifyTitle)} footer={<Button variant="secondary" onClick={onClose}>{l(L.cancel)}</Button>}>
      <ApiBoundary state={query}>
        {rows.length === 0 ? <ApiEmpty /> : (
          <div className="pl-stack">
            {rows.map((row) => (
              <div key={row.id} className="pl-stack">
                <div className="pl-row">
                  <span className="pl-rowTitle">{row.userId}</span>
                  <Badge tone={row.status === "approved" || row.status === "verified" ? "success" : row.status === "rejected" ? "danger" : row.status === "submitted" ? "info" : "neutral"}>{row.status}</Badge>
                  {row.status === "submitted" ? (
                    <span className="pl-actionsCell">
                      <Button variant="primary" size="sm" disabled={busyId === row.id} onClick={() => void decide(row.id, "approve")}>{l(L.verifyOne)}</Button>
                      <Button variant="danger" size="sm" disabled={busyId === row.id} onClick={() => void decide(row.id, "reject")}>{l(L.reject)}</Button>
                    </span>
                  ) : null}
                </div>
                {row.status === "submitted" || row.status === "approved" || row.status === "rejected" ? <EvidenceBlock challengeId={challengeId} participationId={row.id} /> : null}
              </div>
            ))}
          </div>
        )}
      </ApiBoundary>
    </Dialog>
  );
}

function EvidenceDialog({ challengeId, onClose }: { challengeId: string; onClose: () => void }) {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const { user } = useRealSession();
  const toast = useToast();
  const query = useChallengeParticipations(challengeId);
  const submit = useSubmitEvidence(challengeId);
  const mine = (query.data?.items ?? []).filter((p) => p.userId === user?.id);
  const [form, setForm] = useState<{ evidenceType: string; sourceType: string; sourceId: string; description: string }>({ evidenceType: "note", sourceType: "", sourceId: "", description: "" });
  const [busyId, setBusyId] = useState<string | null>(null);

  const send = async (participationId: string) => {
    setBusyId(participationId);
    try {
      await submit.mutateAsync({ participationId, payload: { evidenceType: form.evidenceType, ...(form.sourceType ? { sourceType: form.sourceType, sourceId: form.sourceId } : {}), description: form.description } });
      toast.push({ title: l(L.submitted), tone: "success" });
      onClose();
    } catch (error) {
      toast.push({ title: error instanceof Error ? error.message : l(L.errorTitle), tone: "danger" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open onClose={onClose} title={l(L.evidenceTitle)} footer={<Button variant="secondary" onClick={onClose}>{l(L.cancel)}</Button>}>
      <ApiBoundary state={query}>
        {mine.length === 0 ? <ApiEmpty /> : (
          <div className="pl-stack">
            {mine.map((p) => (
              <div key={p.id} className="pl-stack">
                <Badge tone={p.status === "submitted" ? "info" : p.status === "approved" ? "success" : p.status === "rejected" ? "danger" : "neutral"}>{p.status}</Badge>
                {p.status === "joined" ? (
                  <>
                    <FormRow label={l(L.evidenceType)} field="ev-type">
                      {(props) => <Input {...props} value={form.evidenceType} onChange={(e) => setForm((f) => ({ ...f, evidenceType: e.target.value }))} />}
                    </FormRow>
                    <FormRow label={l(L.sourceType)} field="ev-src">
                      {(props) => <Input {...props} value={form.sourceType} onChange={(e) => setForm((f) => ({ ...f, sourceType: e.target.value }))} />}
                    </FormRow>
                    <FormRow label={l(L.description)} field="ev-desc">
                      {(props) => <Input {...props} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />}
                    </FormRow>
                    <Button disabled={busyId === p.id || form.description.trim().length < 2} onClick={() => void send(p.id)}>{l(L.submitEvidence)}</Button>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </ApiBoundary>
    </Dialog>
  );
}

/**
 * M11 Challenges — real challenge catalogue, lifecycle and verified participation
 * (Phase 3.64). A challenge is created `draft`, advances draft→published→closed→
 * archived through the backend state machine, and members join a published
 * challenge (duplicate/capacity enforced server-side). Rewards are issued only on
 * server-verified completion and are idempotent. UI → api-client → API → SQLite.
 */
export function ChallengesModule() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const { role, activeOrganizationId } = useRealSession();
  const canWrite = WRITE_ROLES.has(role ?? "");
  const canVerify = VERIFY_ROLES.has(role ?? "");
  const toast = useToast();

  const query = useChallenges();
  const rules = useRewardRules();
  const create = useCreateChallenge();
  const transition = useTransitionChallenge();
  const participate = useParticipateChallenge();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ChallengeForm>(EMPTY);
  const [errors, setErrors] = useState<{ code?: string; title?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [evidenceFor, setEvidenceFor] = useState<string | null>(null);

  const rows = useMemo(() => query.data?.items ?? [], [query.data]);
  const rewardAmount = useMemo(() => {
    const map = new Map<string, number>();
    for (const rule of rules.data?.items ?? []) map.set(rule.id, rule.ecoCoinAmount);
    return map;
  }, [rules.data]);

  const openCreate = () => {
    setForm(EMPTY);
    setErrors({});
    setServerError(null);
    setEditing(true);
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (form.code.trim().length < 2) next.code = l(L.codeRequired);
    if (form.title.trim().length < 2) next.title = l(L.titleRequired);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setServerError(null);
    try {
      await create.mutateAsync({
        organizationId: activeOrganizationId ?? undefined,
        code: form.code.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        completionCriteria: form.completionCriteria.trim(),
        rewardRuleId: form.rewardRuleId || null,
        maxParticipants: form.maxParticipants.trim() === "" ? null : Number(form.maxParticipants),
        startAt: form.startAt || null,
        endAt: form.endAt || null,
      });
      toast.push({ title: l(L.created), tone: "success" });
      setEditing(false);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : l(L.errorTitle));
    }
  };

  const advance = async (id: string, to: string) => {
    try {
      await transition.mutateAsync({ id, to });
      toast.push({ title: l(L.advanced), tone: "success" });
    } catch (error) {
      toast.push({ title: error instanceof Error ? error.message : l(L.errorTitle), tone: "danger" });
    }
  };

  const join = async (id: string) => {
    try {
      await participate.mutateAsync(id);
      toast.push({ title: l(L.joined), tone: "success" });
    } catch (error) {
      toast.push({ title: error instanceof Error ? error.message : l(L.errorTitle), tone: "danger" });
    }
  };

  const busy = create.isPending || transition.isPending || participate.isPending;

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
                      <th>{l(L.titleCol)}</th>
                      <th>{l(L.code)}</th>
                      <th>{l(L.status)}</th>
                      <th>{l(L.reward)}</th>
                      <th>{l(L.participants)}</th>
                      <th>{l(L.mine)}</th>
                      <th><span className="sr-only">{l(L.actions)}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const status = String(row.status ?? "draft");
                      const amount = row.rewardRuleId ? rewardAmount.get(row.rewardRuleId) : undefined;
                      const canJoin = status === "published" && !row.myParticipation;
                      return (
                        <tr key={row.id}>
                          <td><span className="pl-rowTitle">{row.title}</span></td>
                          <td><span className="font-mono text-xs">{row.code}</span></td>
                          <td><Badge tone={STATUS_TONE[status] ?? "neutral"}>{status}</Badge></td>
                          <td>{amount == null ? <span className="pl-muted">{l(L.noReward)}</span> : String(amount)}</td>
                          <td>{row.participantCount ?? 0}</td>
                          <td>{row.myParticipation ? <Badge tone="info">{row.myParticipation}</Badge> : <span className="pl-muted">{l(L.none)}</span>}</td>
                          <td className="pl-actionsCell">
                            {canJoin ? (
                              <Button variant="secondary" size="sm" disabled={busy} onClick={() => void join(row.id)}>{l(L.join)}</Button>
                            ) : null}
                              {row.myParticipation && ["joined", "submitted"].includes(String(row.myParticipation)) ? (
                                <Button variant="secondary" size="sm" onClick={() => setEvidenceFor(row.id)}>{l(L.submitEvidence)}</Button>
                              ) : null}
                              {canWrite
                                ? (NEXT_STATUS[status] ?? []).map((to) => (
                                    <Button key={to} variant="secondary" size="sm" disabled={busy} onClick={() => void advance(row.id, to)} aria-label={`${l(L.advance)}: ${to}`}>
                                      {l(L.advance)} → {to}
                                    </Button>
                                  ))
                                : null}
                              {canVerify ? (
                                <Button variant="ghost" size="sm" onClick={() => setVerifying(row.id)}>{l(L.verify)}</Button>
                              ) : null}
                            </td>
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
          <FormRow label={l(L.code)} field="chl-code" required error={errors.code}>
            {(props) => <Input {...props} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.titleCol)} field="chl-title" required error={errors.title}>
            {(props) => <Input {...props} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.description)} field="chl-desc">
            {(props) => <Input {...props} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.criteria)} field="chl-criteria">
            {(props) => <Input {...props} value={form.completionCriteria} onChange={(e) => setForm((f) => ({ ...f, completionCriteria: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.rewardRule)} field="chl-rule">
            {(props) => (
              <select {...props} value={form.rewardRuleId} onChange={(e) => setForm((f) => ({ ...f, rewardRuleId: e.target.value }))}>
                <option value="">{l(L.noReward)}</option>
                {(rules.data?.items ?? []).map((rule) => (
                  <option key={rule.id} value={rule.id}>{rule.title} ({rule.ecoCoinAmount})</option>
                ))}
              </select>
            )}
          </FormRow>
          <FormRow label={l(L.maxParticipants)} field="chl-max">
            {(props) => <Input {...props} inputMode="numeric" value={form.maxParticipants} onChange={(e) => setForm((f) => ({ ...f, maxParticipants: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.startAt)} field="chl-start">
            {(props) => <Input {...props} type="date" value={form.startAt} onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.endAt)} field="chl-end">
            {(props) => <Input {...props} type="date" value={form.endAt} onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))} />}
          </FormRow>
        </div>
      </Dialog>

      {verifying ? <ReviewDialog challengeId={verifying} onClose={() => setVerifying(null)} /> : null}
      {evidenceFor ? <EvidenceDialog challengeId={evidenceFor} onClose={() => setEvidenceFor(null)} /> : null}
    </div>
  );
}