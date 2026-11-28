import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Button, Card, CardBody, CardHeader } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useResource, useResourceList, type ResourceRecord } from "../../services/hooks";
import type { ResourceType } from "../../services/capabilities";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };

const RESOURCE_LABEL: Record<ResourceType, Loc> = {
  landscapes: { fa: "منظرها", en: "Landscapes", ar: "المناظر" },
  villages: { fa: "روستاها", en: "Villages", ar: "القرى" },
  projects: { fa: "پروژه‌ها", en: "Projects", ar: "المشاريع" },
  farms: { fa: "مزارع", en: "Farms", ar: "المزارع" },
  sites: { fa: "سایت‌های پایش", en: "Monitoring sites", ar: "مواقع الرصد" },
  reports: { fa: "گزارش‌ها", en: "Reports", ar: "التقارير" },
  courses: { fa: "دوره‌ها", en: "Courses", ar: "الدورات" },
  articles: { fa: "مقالات", en: "Articles", ar: "المقالات" },
  surveys: { fa: "پیمایش‌ها", en: "Surveys", ar: "المسوحات" },
  runs: { fa: "اجراها", en: "Runs", ar: "العمليات" },
  cropCycles: { fa: "چرخه‌های محصول", en: "Crop cycles", ar: "دورات المحصول" },
  irrigationEvents: { fa: "رویدادهای آبیاری", en: "Irrigation events", ar: "أحداث الري" },
  fieldObservations: { fa: "مشاهدات میدانی", en: "Field observations", ar: "الملاحظات الحقلية" },
};

const L = {
  search: { fa: "جست‌وجو", en: "Search", ar: "بحث" },
  name: { fa: "نام", en: "Name", ar: "الاسم" },
  open: { fa: "باز کردن", en: "Open", ar: "فتح" },
  count: { fa: "مورد", en: "records", ar: "سجل" },
  live: { fa: "دادهٔ واقعی از API", en: "Live data from the API", ar: "بيانات حية من الـ API" },
  back: { fa: "بازگشت", en: "Back", ar: "رجوع" },
  notFound: { fa: "مورد یافت نشد", en: "Record not found", ar: "لم يُعثر على السجل" },
  fields: { fa: "فیلدها", en: "Fields", ar: "الحقول" },
};

function recordName(record: ResourceRecord): string {
  const name = record.name ?? record.title ?? record.id;
  return typeof name === "string" ? name : String(name);
}

function recordSummary(record: ResourceRecord): string {
  const summary = record.summary ?? record.description ?? record.region ?? "";
  if (typeof summary === "string" && summary) return summary;
  return record.type ? String(record.type) : "";
}

/** Real, API-backed list page for a generic resource collection. */
export function ResourceListPage({ type }: { type: ResourceType }) {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const [search, setSearch] = useState("");
  const query = useResourceList(type, { search: search || undefined });
  const title = l(RESOURCE_LABEL[type]);

  const rows = useMemo(() => query.data?.items ?? [], [query.data]);

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div>
          <p className="pl-eyebrow">{l(L.live)}</p>
          <h1>{title}</h1>
        </div>
      </header>

      <div className="pl-toolbar">
        <label className="pl-search">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={l(L.search)}
            aria-label={l(L.search)}
          />
        </label>
        <span className="pl-count">
          {query.data ? `${query.data.total} ${l(L.count)}` : ""}
        </span>
      </div>

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
                      <th>{l(L.name)}</th>
                      <th>
                        <span className="sr-only">{l(L.open)}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <span className="pl-rowTitle">{recordName(record)}</span>
                          <span className="pl-rowSub">{recordSummary(record)}</span>
                        </td>
                        <td className="pl-actionsCell">
                          <Link className="pl-link" to={`/platform/${type}/${record.id}`}>
                            {l(L.open)} ←
                          </Link>
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
    </div>
  );
}

/** Real, API-backed detail page for a single resource record. */
export function ResourceDetailPage({ type }: { type: ResourceType }) {
  const { id } = useParams();
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const query = useResource(type, id ?? "");
  const title = l(RESOURCE_LABEL[type]);

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div>
          <p className="pl-eyebrow">{l(L.live)}</p>
          <h1>{query.data ? recordName(query.data) : title}</h1>
        </div>
        <div className="pl-pageActions">
          <Link to={`/platform/${type}`}>
            <Button variant="secondary" size="sm">
              {l(L.back)}
            </Button>
          </Link>
        </div>
      </header>

      <ApiBoundary state={query}>
        {query.data ? (
          <Card>
            <CardHeader title={l(L.fields)} subtitle={query.data.type ? String(query.data.type) : type} />
            <CardBody>
              <dl className="pl-defs">
                {Object.entries(query.data)
                  .filter(([key]) => key !== "id" && key !== "type")
                  .map(([key, value]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
                    </div>
                  ))}
              </dl>
            </CardBody>
          </Card>
        ) : (
          <Badge tone="danger">{l(L.notFound)}</Badge>
        )}
      </ApiBoundary>
    </div>
  );
}