import { useI18n } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader } from "@eco-nojin/ui";
import type { ModuleCapability } from "../services/capabilities";
import { t as tl } from "../content/ui";

type Loc = { fa: string; en: string; ar: string };

const L = {
  eyebrow: { fa: "مرز قابلیت", en: "Capability boundary", ar: "حدّ القدرة" },
  blockedTitle: { fa: "این قابلیت هنوز به سرویس متصل نیست", en: "This capability is not connected yet", ar: "هذه القدرة غير متصلة بعد" },
  blockedBody: {
    fa: "ساختار کامل این بخش پیاده‌سازی شده است، اما عملیات واقعی آن به سرویسی نیاز دارد که در این نسخه وجود ندارد. هیچ داده یا نتیجه‌ای نمایش داده نمی‌شود که واقعی نباشد.",
    en: "The full interface for this section is implemented, but its real operation needs a service that does not exist in this release. No data or result is shown that is not real.",
    ar: "تم تنفيذ الواجهة الكاملة لهذا القسم، لكن عملياته الحقيقية تتطلب خدمة غير موجودة في هذا الإصدار. لا تُعرض أي بيانات أو نتائج غير حقيقية.",
  },
  missing: { fa: "وابستگی مورد نیاز", en: "Required dependency", ar: "التبعية المطلوبة" },
  api: { fa: "سطح API موجود", en: "Available API surface", ar: "واجهة API المتاحة" },
  status: { fa: "وضعیت", en: "Status", ar: "الحالة" },
};

const STATUS_LABEL: Record<string, Loc> = {
  BLOCKED_BY_BACKEND: { fa: "مسدود به‌دلیل نبود API", en: "Blocked by backend", ar: "محجوب بسبب الـ API" },
  BLOCKED_BY_OWNER_DECISION: { fa: "نیازمند تصمیم مالک", en: "Needs owner decision", ar: "بحاجة إلى قرار المالك" },
  BLOCKED_BY_EXTERNAL_DEPENDENCY: { fa: "نیازمند وابستگی خارجی", en: "Needs external dependency", ar: "بحاجة إلى تبعية خارجية" },
};

/**
 * Honest capability disclosure for a module whose real operation is not
 * available. It renders the module's complete frontend frame (title, status,
 * the exact missing capability and the available API surface) and explicitly
 * states that no fake data is shown. It never implies a successful operation.
 */
export function CapabilityBoundary({ module }: { module: ModuleCapability }) {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const statusLabel = STATUS_LABEL[module.status] ?? { fa: module.status, en: module.status, ar: module.status };

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div>
          <p className="pl-eyebrow">{l(L.eyebrow)}</p>
          <h1>{l(module.title)}</h1>
        </div>
        <div className="pl-pageActions">
          <Badge tone="warning" dot>
            {l(statusLabel)}
          </Badge>
        </div>
      </header>

      <Card>
        <CardHeader title={l(L.blockedTitle)} subtitle={`${module.code} · ${module.route}`} />
        <CardBody>
          <p className="pl-body">{l(L.blockedBody)}</p>

          {module.missing ? (
            <div className="mt-4">
              <p className="pl-kpiLabel">{l(L.missing)}</p>
              <p className="pl-body">{module.missing}</p>
            </div>
          ) : null}

          <div className="mt-4">
            <p className="pl-kpiLabel">{l(L.api)}</p>
            {module.api.length > 0 ? (
              <ul className="pl-numbered">
                {module.api.map((endpoint) => (
                  <li key={endpoint} className="font-mono text-xs">
                    {endpoint}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pl-muted">—</p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}