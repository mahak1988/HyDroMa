import { useI18n } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader } from "@eco-nojin/ui";
import { useHicStatus } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };

const L = {
  eyebrow: { fa: "واجهة HIC", en: "HIC — controlled foundation", ar: "واجهة HIC" },
  title: { fa: "حالة HIC", en: "HIC status", ar: "حالة HIC" },
  subtitle: { fa: "مفهوم منفصل وغير مالي — غير مفعّل", en: "Separate, non-financial concept — inactive", ar: "مفهوم منفصل وغير مالي — غير مفعّل" },
  inactiveNotice: {
    fa: "HIC غير مفعّل. الإصدار والنقل والتحويل والعمليات المالية غير مرخصة.",
    en: "HIC IS INACTIVE. ISSUANCE, TRANSFER, CONVERSION AND FINANCIAL OPERATIONS ARE NOT AUTHORIZED.",
    ar: "HIC غير مفعّل. الإصدار والنقل والتحويل والعمليات المالية غير مرخصة.",
  },
  definition: { fa: "التعريف", en: "Definition", ar: "التعريف" },
  definitionText: {
    fa: "HIC مفهوم ecosytem متحكم به ومُرتبط بـ Eco Nojin و HyDroMA. هو أداة منفصلة عن EcoCoin وليس له قيمة نقدية ولا تمثيل بلوكشين ولا تحويل خارجي ولا قابلية للاسترداد.",
    en: "HIC is a controlled, non-financial ecosystem concept associated with Eco Nojin and HyDroMA. It is a separate instrument from EcoCoin and has no monetary value, no blockchain representation, no external transfer, and no redeemability.",
    ar: "HIC مفهوم ecosytem متحكم به ومُرتبط بـ Eco Nojin و HyDroMA. هو أداة منفصلة عن EcoCoin وليس له قيمة نقدية ولا تمثيل بلوكشين ولا تحويل خارجي ولا قابلية للاسترداد.",
  },
  status: { fa: "الحالة", en: "Status", ar: "الحالة" },
  inactive: { fa: "غير مفعّل", en: "INACTIVE", ar: "غير مفعّل" },
  notIssuable: { fa: "غير قابل للإصدار", en: "NOT ISSUABLE", ar: "غير قابل للإصدار" },
  notTransferable: { fa: "غير قابل للنقل", en: "NOT TRANSFERABLE", ar: "غير قابل للنقل" },
  notConvertible: { fa: "غير قابل للتحويل", en: "NOT CONVERTIBLE", ar: "غير قابل للتحويل" },
  notFinancial: { fa: "ليست مالية", en: "NOT FINANCIAL", ar: "ليست مالية" },
  governance: { fa: "الحكم", en: "Governance", ar: "الحكم" },
  governanceValue: { fa: "يحتاج قرار المالك", en: "OWNER DECISION REQUIRED", ar: "يحتاج قرار المالك" },
  relatedEntities: { fa: "الكيانات ذات الصلة", en: "Related entities", ar: "الكيانات ذات الصلة" },
  futureRequirements: { fa: "متطلبات التفعيل المستقبلية", en: "Future activation requirements", ar: "متطلبات التفعيل المستقبلية" },
  auditNote: { fa: "ملاحظة التدقيق", en: "Audit note", ar: "ملاحظة التدقيق" },
  readAt: { fa: "وقت القراءة", en: "Read at", ar: "وقت القراءة" },
  version: { fa: "الإصدار", en: "Version", ar: "الإصدار" },
  orgId: { fa: "الم组织", en: "Organization", ar: "الم组织" },
};

export function HICModule() {
  const { locale } = useI18n();
  const l = (v: Loc) => tl(v, locale);
  const q = useHicStatus();

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div>
          <p className="pl-eyebrow">{l(L.eyebrow)}</p>
          <h1>{l(L.title)}</h1>
          <p className="pl-muted">{l(L.subtitle)}</p>
        </div>
      </header>

      <Card>
        <CardBody className="p-4">
          <div className="pl-callout pl-callout-danger" role="alert" aria-live="polite">
            <Badge tone="danger">{l(L.inactive)}</Badge>
            <p className="pl-body">{l(L.inactiveNotice)}</p>
          </div>

          <Card>
            <CardHeader title={l(L.definition)} />
            <CardBody className="pt-0">
              <p className="pl-body">{l(L.definitionText)}</p>
            </CardBody>
          </Card>

          <div className="mt-4">
            <h3 className="pl-sectionTitle">{l(L.status)}</h3>
            <div className="pl-grid pl-grid-cols-2 md:pl-grid-cols-4 gap-2">
              <div className="pl-statusCard">
                <span className="pl-label">{l(L.status)}</span>
                <Badge tone="danger">{l(L.inactive)}</Badge>
              </div>
              <div className="pl-statusCard">
                <span className="pl-label">{l(L.notIssuable)}</span>
                <Badge tone="neutral">{String(q.data?.issuable ?? false)}</Badge>
              </div>
              <div className="pl-statusCard">
                <span className="pl-label">{l(L.notTransferable)}</span>
                <Badge tone="neutral">{String(q.data?.transferable ?? false)}</Badge>
              </div>
              <div className="pl-statusCard">
                <span className="pl-label">{l(L.notConvertible)}</span>
                <Badge tone="neutral">{String(q.data?.convertible ?? false)}</Badge>
              </div>
              <div className="pl-statusCard">
                <span className="pl-label">{l(L.notFinancial)}</span>
                <Badge tone="neutral">{String(q.data?.financial ?? false)}</Badge>
              </div>
              <div className="pl-statusCard">
                <span className="pl-label">{l(L.governance)}</span>
                <Badge tone="neutral">{l(L.governanceValue)}</Badge>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="pl-sectionTitle">{l(L.relatedEntities)}</h3>
            <p className="pl-muted">{String(q.data?.relatedEntities?.join(", ") ?? "eco-nojin · hydroma")}</p>
          </div>

          <div className="mt-4">
            <h3 className="pl-sectionTitle">{l(L.futureRequirements)}</h3>
            <ul className="pl-list">
              {(q.data?.futureActivationRequirements ?? [
                "Owner decision on HIC definition and semantics (D-15)",
                "Commercial model and budget approval (D-24, D-25)",
                "Legal/jurisdiction review (D-14)",
                "Explicit governance activation separate from this mission",
              ]).map((req) => (
                <li key={req} className="pl-listItem">{req}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <h3 className="pl-sectionTitle">{l(L.auditNote)}</h3>
            <p className="pl-muted pl-small">{String(q.data?.auditNote ?? "HIC remains inactive. No issuance, transfer, conversion or financial operation has occurred or is possible through this endpoint.")}</p>
          </div>

          <div className="mt-4 pl-meta">
            <dl className="pl-defs">
              <div><dt>{l(L.version)}</dt><dd>{String(q.data?.version ?? "0.1.0")}</dd></div>
              <div><dt>{l(L.orgId)}</dt><dd>{String(q.data?.organizationId ?? "—")}</dd></div>
              <div><dt>{l(L.readAt)}</dt><dd>{String(q.data?.readAt ?? "—")}</dd></div>
            </dl>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}