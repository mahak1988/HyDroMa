import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Button, Card, CardBody, CardHeader } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useModels } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };

const L = {
  eyebrow: { fa: "دادهٔ واقعی از API", en: "Live data from the API", ar: "بيانات حية من الـ API" },
  title: { fa: "مدل‌های علمی", en: "Scientific models", ar: "النماذج العلمية" },
  version: { fa: "نسخه", en: "Version", ar: "الإصدار" },
  domain: { fa: "دامنه", en: "Domain", ar: "المجال" },
  status: { fa: "وضعیت علمی", en: "Scientific status", ar: "الحالة العلمية" },
  boundary: {
    fa: "این فهرست رجیستری مدل‌ها را از API نشان می‌دهد. اجرا و اعتبارسنجی علمی مدل بر عهدهٔ موتور مستقل هایدراماست و این صفحه هیچ نتیجهٔ علمی تولید نمی‌کند.",
    en: "This list shows the model registry from the API. Execution and scientific validation belong to the independent HyDroMA engine; this page produces no scientific result.",
    ar: "تعرض هذه القائمة سجل النماذج من الـ API. التنفيذ والتحقق العلمي مسؤولية محرك هايدروما المستقل؛ ولا تُنتج هذه الصفحة أي نتيجة علمية.",
  },
  irrigation: { fa: "اجرای مدل آبیاری", en: "Run irrigation model", ar: "تشغيل نموذج الري" },
  environment: { fa: "دادهٔ محیطی", en: "Environmental data", ar: "البيانات البيئية" },
  datasets: { fa: "مجموعه‌داده علمی", en: "Scientific datasets", ar: "المجموعات العلمية" },
};

function statusTone(status?: string): "success" | "warning" | "neutral" {
  if (status === "validated") return "success";
  if (status === "not_validated") return "warning";
  return "neutral";
}

/** Real model registry from the API (no scientific results are fabricated). */
export function ModelsPage() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const query = useModels();

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div>
          <p className="pl-eyebrow">{l(L.eyebrow)}</p>
          <h1>{l(L.title)}</h1>
        </div>
        <Link to="/platform/hydroma/irrigation"><Button>{l(L.irrigation)}</Button></Link>
        <Link to="/platform/hydroma/environment"><Button variant="secondary">{l(L.environment)}</Button></Link>
        <Link to="/platform/hydroma/datasets"><Button variant="secondary">{l(L.datasets)}</Button></Link>
      </header>

      <ApiBoundary state={query}>
        {(query.data?.models.length ?? 0) === 0 ? (
          <ApiEmpty />
        ) : (
          <Card>
            <CardHeader title={l(L.title)} subtitle={query.data?.source} />
            <CardBody className="!p-0">
              <div className="pl-tableWrap">
                <table className="pl-table">
                  <thead>
                    <tr>
                      <th>{l(L.title)}</th>
                      <th>{l(L.version)}</th>
                      <th>{l(L.domain)}</th>
                      <th>{l(L.status)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data!.models.map((model) => (
                      <tr key={model.id}>
                        <td>
                          <span className="pl-rowTitle">{model.title ?? model.id}</span>
                          <span className="pl-rowSub">{model.id}</span>
                        </td>
                        <td>{model.version}</td>
                        <td>{model.domain ?? "—"}</td>
                        <td>
                          <Badge tone={statusTone(model.scientific_status)}>{model.scientific_status ?? "—"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </ApiBoundary>

      <p className="pl-note">{l(L.boundary)}</p>
    </div>
  );
}