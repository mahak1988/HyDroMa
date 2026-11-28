import { useMemo, useState } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, CardHeader, Dialog, FormAlert, FormRow, Input, useToast } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import {
  useAdjustEcoCoin,
  useAdjustmentRequests,
  useApproveAdjustmentRequest,
  useCreateRewardRule,
  useEcoCoinLedger,
  useEcoCoinReconcile,
  useEcoCoinSummary,
  useExecuteAdjustmentRequest,
  useRejectAdjustmentRequest,
  useRewardRules,
  useUsers,
} from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };

const L = {
  eyebrow: { fa: "اکوکوین و پاداش", en: "EcoCoin & rewards", ar: "إيكو كوين والمكافآت" },
  title: { fa: "اکوکوین", en: "EcoCoin", ar: "إيكو كوين" },
  balance: { fa: "مانده", en: "Balance", ar: "الرصيد" },
  credits: { fa: "مجموع اعتبار", en: "Total credits", ar: "إجمالي الأرصدة" },
  debits: { fa: "مجموع بدهکار", en: "Total debits", ar: "إجمالي المدين" },
  entries: { fa: "تعداد رویداد", en: "Entries", ar: "عدد القيود" },
  notTradable: {
    fa: "اکوکوین یک واحد داخلی، غیرقابل‌معامله و بدون ارزش پولی است. هیچ بلاک‌چین یا انتقال خارجی وجود ندارد.",
    en: "EcoCoin is an internal, non-tradable unit with no monetary value. No blockchain or external transfer exists.",
    ar: "إيكو كوين وحدة داخلية غير قابلة للتداول وبلا قيمة نقدية. لا توجد بلوكشين أو تحويل خارجي.",
  },
  rules: { fa: "قواعد پاداش", en: "Reward rules", ar: "قواعد المكافأة" },
  ledger: { fa: "دفتر رویدادها", en: "Ledger", ar: "سجل القيود" },
  addRule: { fa: "افزودن قاعده", en: "Add rule", ar: "إضافة قاعدة" },
  code: { fa: "کد", en: "Code", ar: "الرمز" },
  titleCol: { fa: "عنوان", en: "Title", ar: "العنوان" },
  amount: { fa: "مقدار (اکوکوین)", en: "Amount (EcoCoin)", ar: "المقدار (إيكو كوين)" },
  limit: { fa: "سقف هر کاربر", en: "Per-user limit", ar: "حد المستخدم" },
  status: { fa: "وضعیت", en: "Status", ar: "الحالة" },
  source: { fa: "منشأ", en: "Source", ar: "المصدر" },
  reason: { fa: "دلیل", en: "Reason", ar: "السبب" },
  user: { fa: "کاربر", en: "User", ar: "المستخدم" },
  time: { fa: "زمان", en: "Time", ar: "الوقت" },
  cancel: { fa: "انصراف", en: "Cancel", ar: "إلغاء" },
  save: { fa: "ذخیره", en: "Save", ar: "حفظ" },
  ruleTitle: { fa: "افزودن قاعدهٔ پاداش", en: "Add reward rule", ar: "إضافة قاعدة مكافأة" },
  created: { fa: "قاعده افزوده شد.", en: "Reward rule added.", ar: "تمت إضافة القاعدة." },
  errorTitle: { fa: "خطا", en: "Error", ar: "خطأ" },
  codeRequired: { fa: "کد باید حداقل ۲ حرف باشد.", en: "Code must be at least 2 characters.", ar: "يجب أن يكون الرمز حرفين على الأقل." },
  titleRequired: { fa: "عنوان باید حداقل ۲ حرف باشد.", en: "Title must be at least 2 characters.", ar: "يجب أن يكون العنوان حرفين على الأقل." },
  amountInvalid: { fa: "مقدار باید عدد صحیح نامنفی باشد.", en: "Amount must be a non-negative integer.", ar: "يجب أن يكون المقدار عدداً صحيحاً غير سالب." },
  adminTools: { fa: "ابزار مدیریتی", en: "Administrative tools", ar: "أدوات إدارية" },
  adjust: { fa: "ثبت اصلاحیه", en: "Post adjustment", ar: "تسجيل تسوية" },
  entryType: { fa: "نوع", en: "Type", ar: "النوع" },
  credit: { fa: "اعتبار", en: "Credit", ar: "رصيد" },
  debit: { fa: "بدهکار", en: "Debit", ar: "مدين" },
  reconcile: { fa: "بازبینی دفتر", en: "Reconcile", ar: "تسوية السجل" },
  requests: { fa: "درخواست‌های پاداش", en: "Reward requests", ar: "طلبات المكافآت" },
  pending: { fa: "در انتظار", en: "Pending", ar: "قيد الانتظار" },
  approved: { fa: "تأییدشده", en: "Approved", ar: "موافق عليه" },
  rejected: { fa: "ردشده", en: "Rejected", ar: "مرفوض" },
  executed: { fa: "اجرا‌شده", en: "Executed", ar: "منفذ" },
  approve: { fa: "تأیید", en: "Approve", ar: "موافقة" },
  reject: { fa: "رد", en: "Reject", ar: "رفض" },
  execute: { fa: "اجرا", en: "Execute", ar: "تنفيذ" },
  noRequests: { fa: "درخواستی ثبت نشده است.", en: "No correction requests recorded.", ar: "لا توجد طلبات تصحيح." },
  done: { fa: "انجام شد.", en: "Done.", ar: "تم." },
  target: { fa: "کاربر هدف", en: "Target user", ar: "المستخدم المستهدف" },
  requestedBy: { fa: "درخواست‌کننده", en: "Requested by", ar: "مقدم الطلب" },
  filter: { fa: "فیلتر", en: "Filter", ar: "تصفية" },
  all: { fa: "همه", en: "All", ar: "الكل" },
  reset: { fa: "بازنشانی", en: "Reset", ar: "إعادة تعيين" },
  next: { fa: "بعدی", en: "Next", ar: "التالي" },
  prev: { fa: "قبلی", en: "Previous", ar: "السابق" },
  page: { fa: "صفحه", en: "Page", ar: "صفحة" },
  of: { fa: "از", en: "of", ar: "من" },
  entriesLabel: { fa: "رکورد", en: "entries", ar: "سجل" },
  sortNewest: { fa: "جدیدترین", en: "Newest first", ar: "الأحدث" },
  sortOldest: { fa: "قدیمی‌ترین", en: "Oldest first", ar: "الأقدم" },
  challengeCol: { fa: "چالش", en: "Challenge", ar: "التحدي" },
  dateFrom: { fa: "از تاریخ", en: "From date", ar: "من تاريخ" },
  dateTo: { fa: "تا تاریخ", en: "To date", ar: "إلى تاريخ" },
  reconcileTitle: { fa: "نتیجهٔ بازبینی", en: "Reconciliation result", ar: "نتيجة التسوية" },
  totalBalance: { fa: "ماندهٔ کل", en: "Total balance", ar: "الرصيد الإجمالي" },
  members: { fa: "کاربران", en: "Members", ar: "الأعضاء" },
  anomalies: { fa: "ناهنجاری‌ها", en: "Anomalies", ar: "الحالات الشاذة" },
  none: { fa: "هیچ", en: "None", ar: "لا شيء" },
  adjusted: { fa: "اصلاحیه ثبت شد.", en: "Adjustment posted.", ar: "تم تسجيل التسوية." },
  reasonRequired: { fa: "دلیل الزامی است.", en: "A reason is required.", ar: "السبب مطلوب." },
  readOnly: { fa: "برای مشاهدهٔ دفتر به نقش write نیاز دارید.", en: "A write role is required to view the ledger.", ar: "يلزم دور كتابة لعرض السجل." },
};

const WRITE_ROLES = new Set(["owner", "admin", "manager"]);
const ADMIN_ROLES = new Set(["owner", "admin"]);

type RuleForm = { code: string; title: string; ecoCoinAmount: string; issuanceLimit: string };
const EMPTY_RULE: RuleForm = { code: "", title: "", ecoCoinAmount: "", issuanceLimit: "" };

type LedgerFilters = { entryType: string; from: string; to: string; source: string; challengeId: string; sort: "asc" | "desc" };
const EMPTY_FILTERS: LedgerFilters = { entryType: "", from: "", to: "", source: "", challengeId: "", sort: "desc" };
const LEDGER_PAGE_SIZE = 25;

function RulesAndLedger() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const { activeOrganizationId } = useRealSession();
  const toast = useToast();
  const rules = useRewardRules();
  const [filters, setFilters] = useState<LedgerFilters>(EMPTY_FILTERS);
  const [cursorStack, setCursorStack] = useState<string[]>([""]);
  const cursor = cursorStack[cursorStack.length - 1] ?? "";
  const ledger = useEcoCoinLedger({
    entryType: filters.entryType || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    source: filters.source || undefined,
    challengeId: filters.challengeId || undefined,
    sort: filters.sort,
    limit: LEDGER_PAGE_SIZE,
    cursor: cursor || undefined,
  });
  const createRule = useCreateRewardRule();

  const updateFilter = (patch: Partial<LedgerFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setCursorStack([""]);
  };
  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setCursorStack([""]);
  };
  const goNext = () => {
    const next = ledger.data?.nextCursor;
    if (next) setCursorStack((stack) => [...stack, next]);
  };
  const goPrev = () => setCursorStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<RuleForm>(EMPTY_RULE);
  const [errors, setErrors] = useState<{ code?: string; title?: string; amount?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const ruleRows = useMemo(() => rules.data?.items ?? [], [rules.data]);
  const ledgerRows = useMemo(() => ledger.data?.items ?? [], [ledger.data]);

  const submit = async () => {
    const next: typeof errors = {};
    if (form.code.trim().length < 2) next.code = l(L.codeRequired);
    if (form.title.trim().length < 2) next.title = l(L.titleRequired);
    const amount = form.ecoCoinAmount.trim() === "" ? 0 : Number(form.ecoCoinAmount);
    if (!Number.isSafeInteger(amount) || amount < 0) next.amount = l(L.amountInvalid);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setServerError(null);
    try {
      await createRule.mutateAsync({
        organizationId: activeOrganizationId ?? undefined,
        code: form.code.trim(),
        title: form.title.trim(),
        ecoCoinAmount: amount,
        issuanceLimit: form.issuanceLimit.trim() === "" ? null : Number(form.issuanceLimit),
      });
      toast.push({ title: l(L.created), tone: "success" });
      setEditing(false);
      setForm(EMPTY_RULE);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : l(L.errorTitle));
    }
  };

  return (
    <div className="pl-stack">
      <Card>
        <CardHeader
          title={l(L.rules)}
          action={<Button size="sm" onClick={() => { setForm(EMPTY_RULE); setErrors({}); setServerError(null); setEditing(true); }}>{l(L.addRule)}</Button>}
        />
        <CardBody>
          <ApiBoundary state={rules}>
            {ruleRows.length === 0 ? (
              <ApiEmpty />
            ) : (
              <div className="pl-tableWrap">
                <table className="pl-table">
                  <thead>
                    <tr>
                      <th>{l(L.code)}</th>
                      <th>{l(L.titleCol)}</th>
                      <th>{l(L.amount)}</th>
                      <th>{l(L.limit)}</th>
                      <th>{l(L.status)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ruleRows.map((rule) => (
                      <tr key={rule.id}>
                        <td><span className="font-mono text-xs">{rule.code}</span></td>
                        <td>{rule.title}</td>
                        <td>{rule.ecoCoinAmount}</td>
                        <td>{rule.issuanceLimit ?? "—"}</td>
                        <td><Badge tone={rule.status === "active" ? "success" : "neutral"}>{rule.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ApiBoundary>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={l(L.ledger)} subtitle={l(L.notTradable)} />
        <CardBody>
          <div className="pl-grid pl-grid-cols-2 md:pl-grid-cols-3 gap-2 mb-3">
            <label className="pl-field">
              <span>{l(L.entryType)}</span>
              <select aria-label={l(L.entryType)} value={filters.entryType} onChange={(e) => updateFilter({ entryType: e.target.value })}>
                <option value="">{l(L.all)}</option>
                <option value="credit">{l(L.credit)}</option>
                <option value="debit">{l(L.debit)}</option>
              </select>
            </label>
            <label className="pl-field">
              <span>{l(L.source)}</span>
              <Input value={filters.source} onChange={(e) => updateFilter({ source: e.target.value })} />
            </label>
            <label className="pl-field">
              <span>{l(L.challengeCol)}</span>
              <Input value={filters.challengeId} onChange={(e) => updateFilter({ challengeId: e.target.value })} />
            </label>
            <label className="pl-field">
              <span>{l(L.dateFrom)}</span>
              <Input type="date" value={filters.from} onChange={(e) => updateFilter({ from: e.target.value })} />
            </label>
            <label className="pl-field">
              <span>{l(L.dateTo)}</span>
              <Input type="date" value={filters.to} onChange={(e) => updateFilter({ to: e.target.value })} />
            </label>
            <label className="pl-field">
              <span>{l(L.filter)}</span>
              <select aria-label={l(L.filter)} value={filters.sort} onChange={(e) => updateFilter({ sort: e.target.value as "asc" | "desc" })}>
                <option value="desc">{l(L.sortNewest)}</option>
                <option value="asc">{l(L.sortOldest)}</option>
              </select>
            </label>
          </div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="pl-small pl-muted">
              {l(L.entriesLabel)}: {ledger.data?.total ?? 0}
            </span>
            <Button size="sm" variant="secondary" onClick={resetFilters}>{l(L.reset)}</Button>
          </div>
          <ApiBoundary state={ledger}>
            {ledgerRows.length === 0 ? (
              <ApiEmpty />
            ) : (
              <div className="pl-tableWrap">
                <table className="pl-table">
                  <thead>
                    <tr>
                      <th>{l(L.time)}</th>
                      <th>{l(L.user)}</th>
                      <th>{l(L.entryType)}</th>
                      <th>{l(L.amount)}</th>
                      <th>{l(L.source)}</th>
                      <th>{l(L.challengeCol)}</th>
                      <th>{l(L.reason)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerRows.map((entry) => (
                      <tr key={entry.id}>
                        <td className="font-mono text-xs">{entry.at}</td>
                        <td className="font-mono text-xs">{entry.userId}</td>
                        <td><Badge tone={entry.entryType === "credit" ? "success" : "warning"}>{entry.entryType}</Badge></td>
                        <td>{entry.amount}</td>
                        <td>{entry.source}</td>
                        <td className="font-mono text-xs">{entry.challengeId ?? "—"}</td>
                        <td>{entry.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {ledgerRows.length > 0 ? (
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="pl-small pl-muted">
                  {l(L.page)} {cursorStack.length} {l(L.of)} {Math.max(1, Math.ceil((ledger.data?.total ?? 0) / LEDGER_PAGE_SIZE))}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={cursorStack.length <= 1} onClick={goPrev}>{l(L.prev)}</Button>
                  <Button size="sm" variant="secondary" disabled={!ledger.data?.nextCursor} onClick={goNext}>{l(L.next)}</Button>
                </div>
              </div>
            ) : null}
          </ApiBoundary>
        </CardBody>
      </Card>

      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        title={l(L.ruleTitle)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)}>{l(L.cancel)}</Button>
            <Button onClick={() => void submit()} disabled={createRule.isPending}>{l(L.save)}</Button>
          </>
        }
      >
        <div className="pl-stack">
          {serverError ? <FormAlert title={l(L.errorTitle)}>{serverError}</FormAlert> : null}
          <FormRow label={l(L.code)} field="rule-code" required error={errors.code}>
            {(props) => <Input {...props} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.titleCol)} field="rule-title" required error={errors.title}>
            {(props) => <Input {...props} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.amount)} field="rule-amount" error={errors.amount}>
            {(props) => <Input {...props} inputMode="numeric" value={form.ecoCoinAmount} onChange={(e) => setForm((f) => ({ ...f, ecoCoinAmount: e.target.value }))} />}
          </FormRow>
          <FormRow label={l(L.limit)} field="rule-limit">
            {(props) => <Input {...props} inputMode="numeric" value={form.issuanceLimit} onChange={(e) => setForm((f) => ({ ...f, issuanceLimit: e.target.value }))} />}
          </FormRow>
        </div>
      </Dialog>
    </div>
  );
}

function AdminTools() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const toast = useToast();
  const users = useUsers();
  const adjust = useAdjustEcoCoin();
  const reconcile = useEcoCoinReconcile();

  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [entryType, setEntryType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showRecon, setShowRecon] = useState(false);

  const submit = async () => {
    setError(null);
    const value = Number(amount);
    if (!Number.isSafeInteger(value) || value <= 0) return setError(l(L.amountInvalid));
    if (!userId) return setError(l(L.user));
    if (reason.trim().length < 2) return setError(l(L.reasonRequired));
    try {
      await adjust.mutateAsync({ userId, amount: value, entryType, reason: reason.trim() });
      toast.push({ title: l(L.adjusted), tone: "success" });
      setOpen(false);
      setUserId("");
      setAmount("");
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : l(L.errorTitle));
    }
  };

  const recon = reconcile.data;

  return (
    <Card>
      <CardHeader
        title={l(L.adminTools)}
        action={
          <div className="pl-inlineActions">
            <Button size="sm" variant="secondary" onClick={() => setShowRecon((v) => !v)}>{l(L.reconcile)}</Button>
            <Button size="sm" onClick={() => setOpen(true)}>{l(L.adjust)}</Button>
          </div>
        }
      />
      <CardBody>
        {showRecon ? (
          <ApiBoundary state={reconcile}>
            {recon ? (
              <div className="pl-stack">
                <p className="pl-kpiLabel">{l(L.reconcileTitle)}</p>
                <div className="pl-kpis">
                  <div><span className="pl-kpiValue">{recon.totalBalance}</span><span className="pl-kpiLabel">{l(L.totalBalance)}</span></div>
                  <div><span className="pl-kpiValue">{recon.entryCount}</span><span className="pl-kpiLabel">{l(L.entries)}</span></div>
                  <div><span className="pl-kpiValue">{recon.memberCount}</span><span className="pl-kpiLabel">{l(L.members)}</span></div>
                  <div><span className="pl-kpiValue">{recon.anomalies.length}</span><span className="pl-kpiLabel">{l(L.anomalies)}</span></div>
                </div>
                {recon.anomalies.length > 0 ? <p className="pl-body">{recon.anomalies.join(", ")}</p> : <p className="pl-muted">{l(L.none)}</p>}
              </div>
            ) : null}
          </ApiBoundary>
        ) : (
          <p className="pl-muted">{l(L.notTradable)}</p>
        )}
      </CardBody>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={l(L.adjust)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>{l(L.cancel)}</Button>
            <Button onClick={() => void submit()} disabled={adjust.isPending}>{l(L.save)}</Button>
          </>
        }
      >
        <div className="pl-stack">
          {error ? <FormAlert title={l(L.errorTitle)}>{error}</FormAlert> : null}
          <FormRow label={l(L.user)} field="adj-user" required>
            {(props) => (
              <select {...props} value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">—</option>
                {(users.data?.items ?? []).map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            )}
          </FormRow>
          <FormRow label={l(L.entryType)} field="adj-type" required>
            {(props) => (
              <select {...props} value={entryType} onChange={(e) => setEntryType(e.target.value as "credit" | "debit")}>
                <option value="credit">{l(L.credit)}</option>
                <option value="debit">{l(L.debit)}</option>
              </select>
            )}
          </FormRow>
          <FormRow label={l(L.amount)} field="adj-amount" required>
            {(props) => <Input {...props} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />}
          </FormRow>
          <FormRow label={l(L.reason)} field="adj-reason" required>
            {(props) => <Input {...props} value={reason} onChange={(e) => setReason(e.target.value)} />}
          </FormRow>
        </div>
      </Dialog>
    </Card>
  );
}

/**
 * Four-eyes manual EcoCoin correction requests (REQUESTED → APPROVED → EXECUTED,
 * or REQUESTED → REJECTED). Write roles may request; owner/admin decide and
 * execute. The server freezes amount/user/type/reason and blocks self-approval.
 */
function RewardRequests() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const { role } = useRealSession();
  const isAdmin = ADMIN_ROLES.has(role ?? "");
  const toast = useToast();
  const requests = useAdjustmentRequests();
  const approve = useApproveAdjustmentRequest();
  const reject = useRejectAdjustmentRequest();
  const execute = useExecuteAdjustmentRequest();

  const rows = requests.data?.items ?? [];
  const statusLabel: Record<string, Loc> = {
    requested: L.pending,
    approved: L.approved,
    rejected: L.rejected,
    executed: L.executed,
  };
  const tone = (status: string): "success" | "warning" | "danger" | "neutral" =>
    status === "approved" || status === "executed" ? "success" : status === "rejected" ? "danger" : "warning";

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      toast.push({ title: l(L.done), tone: "success" });
    } catch (error) {
      toast.push({ title: error instanceof Error ? error.message : l(L.errorTitle), tone: "danger" });
    }
  };

  return (
    <Card>
      <CardHeader title={l(L.requests)} />
      <CardBody>
        <ApiBoundary state={requests}>
          {rows.length === 0 ? (
            <ApiEmpty />
          ) : (
            <div className="pl-tableWrap">
              <table className="pl-table">
                <thead>
                  <tr>
                    <th>{l(L.status)}</th>
                    <th>{l(L.entryType)}</th>
                    <th>{l(L.amount)}</th>
                    <th>{l(L.target)}</th>
                    <th>{l(L.reason)}</th>
                    <th>{l(L.requestedBy)}</th>
                    {isAdmin ? <th>{l(L.adminTools)}</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((request) => (
                    <tr key={request.id}>
                      <td><Badge tone={tone(request.status)}>{l(statusLabel[request.status] ?? L.pending)}</Badge></td>
                      <td>{request.entryType}</td>
                      <td>{request.amount}</td>
                      <td className="font-mono text-xs">{request.targetUserId}</td>
                      <td>{request.reason}</td>
                      <td className="font-mono text-xs">{request.requestedBy}</td>
                      {isAdmin ? (
                        <td>
                          <div className="pl-inlineActions">
                            {request.status === "requested" ? (
                              <>
                                <Button size="sm" onClick={() => void run(() => approve.mutateAsync({ id: request.id }))}>{l(L.approve)}</Button>
                                <Button size="sm" variant="secondary" onClick={() => void run(() => reject.mutateAsync({ id: request.id }))}>{l(L.reject)}</Button>
                              </>
                            ) : null}
                            {request.status === "approved" ? (
                              <Button size="sm" onClick={() => void run(() => execute.mutateAsync(request.id))}>{l(L.execute)}</Button>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ApiBoundary>
      </CardBody>
    </Card>
  );
}

/**
 * M10 EcoCoin — internal, non-tradable reward accounting (Phase 3.64).
 * Shows the caller's reconstructible balance/summary, and (for write roles) the
 * reward rules and the append-only ledger; owner/admin additionally get the
 * compensating-adjustment and reconciliation tools. EcoCoin has no monetary
 * value, no blockchain and no external transfer. UI → api-client → API → SQLite.
 */
export function RewardsModule() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const { role } = useRealSession();
  const canWrite = WRITE_ROLES.has(role ?? "");
  const isAdmin = ADMIN_ROLES.has(role ?? "");

  const summary = useEcoCoinSummary();
  const data = summary.data;

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div>
          <p className="pl-eyebrow">{l(L.eyebrow)}</p>
          <h1>{l(L.title)}</h1>
        </div>
      </header>

      <ApiBoundary state={summary}>
        <div className="pl-kpis">
          <div><span className="pl-kpiValue">{data?.balance ?? 0}</span><span className="pl-kpiLabel">{l(L.balance)}</span></div>
          <div><span className="pl-kpiValue">{data?.totalCredits ?? 0}</span><span className="pl-kpiLabel">{l(L.credits)}</span></div>
          <div><span className="pl-kpiValue">{data?.totalDebits ?? 0}</span><span className="pl-kpiLabel">{l(L.debits)}</span></div>
          <div><span className="pl-kpiValue">{data?.entryCount ?? 0}</span><span className="pl-kpiLabel">{l(L.entries)}</span></div>
        </div>
      </ApiBoundary>

      <p className="pl-muted">{l(L.notTradable)}</p>

      {canWrite ? <RulesAndLedger /> : <Badge tone="neutral">{l(L.readOnly)}</Badge>}
      {canWrite ? <RewardRequests /> : null}
      {isAdmin ? <AdminTools /> : null}
    </div>
  );
}