import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { appPath } from "@eco-nojin/configuration";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, BarChart, Button, Card, CardBody, CardHeader, EmptyState, LineChart, ResourceForm } from "@eco-nojin/ui";
import { createApiClient } from "@eco-nojin/api-client";
import { Icon } from "@eco-nojin/icons";
import { FACT_LABELS, UNIT_LABELS, findAny, list, type Entity, type Fact, type StatusKey } from "../data/entities";
import { STATUS_TONE, SUGGESTIONS, UI, t } from "../content/ui";
import type { Loc, PageDef } from "../content/pages";

const DETAIL_BASE: Record<string, string> = {
  landscape: "/landscapes",
  projects: "/projects",
};

const ENTITY_FIELDS: Record<string, Array<{ key: string; label: string; type?: "text" | "number" | "textarea"; required?: boolean }>> = {
  village: [{ key: "name", label: "Name", required: true }, { key: "region", label: "Region" }],
  territory: [{ key: "name", label: "Name", required: true }, { key: "region", label: "Region" }],
  rangeland: [{ key: "name", label: "Name", required: true }, { key: "area", label: "Area (ha)", type: "number" }],
  farm: [{ key: "name", label: "Name", required: true }, { key: "owner", label: "Owner" }],
  resource: [{ key: "name", label: "Name", required: true }, { key: "type", label: "Type" }],
  stakeholder: [{ key: "name", label: "Name", required: true }, { key: "role", label: "Role" }],
  crop: [{ key: "name", label: "Name", required: true }, { key: "season", label: "Season" }],
  plan: [{ key: "name", label: "Name", required: true }, { key: "period", label: "Period" }],
  irrigation: [{ key: "name", label: "Name", required: true }, { key: "method", label: "Method" }],
  health: [{ key: "name", label: "Name", required: true }, { key: "status", label: "Status" }],
  input: [{ key: "name", label: "Name", required: true }, { key: "unit", label: "Unit" }],
  livestock: [{ key: "name", label: "Name", required: true }, { key: "count", label: "Count", type: "number" }],
  site: [{ key: "name", label: "Name", required: true }, { key: "area", label: "Area (ha)", type: "number" }],
  carbon: [{ key: "name", label: "Name", required: true }, { key: "amount", label: "Amount", type: "number" }],
  methodology: [{ key: "name", label: "Name", required: true }, { key: "version", label: "Version" }],
  report: [{ key: "name", label: "Name", required: true }, { key: "period", label: "Period" }],
  dataset: [{ key: "name", label: "Name", required: true }, { key: "source", label: "Source" }],
  project: [{ key: "name", label: "Name", required: true }, { key: "summary", label: "Summary", type: "textarea" }],
  task: [{ key: "name", label: "Name", required: true }, { key: "assignee", label: "Assignee" }],
  budget: [{ key: "name", label: "Name", required: true }, { key: "amount", label: "Amount", type: "number" }],
  article: [{ key: "name", label: "Name", required: true }, { key: "summary", label: "Summary", type: "textarea" }],
  research: [{ key: "name", label: "Name", required: true }, { key: "topic", label: "Topic" }],
  indigenous: [{ key: "name", label: "Name", required: true }, { key: "community", label: "Community" }],
  course: [{ key: "name", label: "Name", required: true }, { key: "duration", label: "Duration" }],
  contentItem: [{ key: "name", label: "Name", required: true }, { key: "type", label: "Type" }],
  account: [{ key: "name", label: "Name", required: true }, { key: "role", label: "Role" }],
  voucher: [{ key: "name", label: "Name", required: true }, { key: "amount", label: "Amount", type: "number" }],
  payment: [{ key: "name", label: "Name", required: true }, { key: "amount", label: "Amount", type: "number" }],
  wallet: [{ key: "name", label: "Name", required: true }, { key: "balance", label: "Balance", type: "number" }],
  settlement: [{ key: "name", label: "Name", required: true }, { key: "amount", label: "Amount", type: "number" }],
};

function useLoc() {
  const { locale, format } = useI18n();
  return {
    locale,
    l: (value: Loc) => t(value, locale),
    number: (value: string | number) => format.number(Number(value)),
    date: (value: string) => format.date(value),
    status: (status: StatusKey) => t(UI.status[status], locale),
  };
}

function factValue(fact: Fact, l: (value: Loc) => string, number: (value: string | number) => string): string {
  const [, value, unit] = fact;
  const rendered = number(value);
  return unit ? `${rendered} ${l(UNIT_LABELS[unit])}` : rendered;
}

function PageLead({ page }: { page: PageDef }) {
  const { l } = useLoc();
  return (
    <header className="pl-pageHead">
      <div>
        <p className="pl-eyebrow">{l(UI.demo)}</p>
        <h1>{l(page.title)}</h1>
        <p className="pl-lead">{l(page.lead)}</p>
      </div>
      <div className="pl-pageActions">
        <Button variant="secondary" size="sm">
          {l(UI.export)}
        </Button>
      </div>
    </header>
  );
}

/* --------------------------------- metrics -------------------------------- */

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="pl-kpi">
      <p className="pl-kpiLabel">{label}</p>
      <p className="pl-kpiValue">{value}</p>
      {hint ? <p className="pl-kpiHint">{hint}</p> : null}
    </div>
  );
}

function Dashboard({ page }: { page: PageDef }) {
  const { l, number, status } = useLoc();
  const entities = page.entity
    ? list(page.entity)
    : [...list("village"), ...list("project"), ...list("site"), ...list("service")];
  const attention = entities.filter((item) => ["watch", "degraded", "pending"].includes(item.status));
  const progressValues = entities
    .flatMap((item) => item.facts)
    .filter(([key]) => key === "progress")
    .map(([, value]) => Number(value));
  const averageProgress = progressValues.length
    ? `${number(Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length))}٪`
    : "—";
  const coverage = entities
    .flatMap((item) => item.facts)
    .filter(([key, , unit]) => key === "area" && unit === "ha")
    .reduce((sum, [, value]) => sum + Number(value), 0);

  return (
    <div className="pl-stack">
      <PageLead page={page} />

      <div className="pl-kpis">
        <Kpi label={l(UI.dashboard.records)} value={number(entities.length)} hint={page.entity ?? ""} />
        <Kpi label={l(UI.dashboard.attention)} value={number(attention.length)} hint={l(UI.status.watch)} />
        <Kpi label={l(UI.dashboard.progress)} value={averageProgress} hint={l(UI.status.active)} />
        <Kpi label={l(UI.dashboard.coverage)} value={`${number(coverage)} ${l(UNIT_LABELS.ha)}`} hint="HyDroMA" />
      </div>

      <div className="pl-twoCol">
        <Card>
          <CardHeader title={l(UI.dashboard.trend)} subtitle={l(UI.demoNote)} />
          <CardBody>
            <LineChart
              data={page.series ?? [20, 26, 24, 32, 36, 34, 41, 46]}
              unit="%"
              label={l(UI.dashboard.trend)}
              summary={`${l(UI.dashboard.trend)} · ${number(Math.min(...(page.series ?? [0])))} – ${number(Math.max(...(page.series ?? [0])))}`}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={l(UI.dashboard.alerts)} subtitle={`${attention.length} ${l(UI.count)}`} />
          <CardBody>
            {attention.length === 0 ? (
              <p className="pl-muted">{l(UI.dashboard.noAlerts)}</p>
            ) : (
              <ul className="pl-list">
                {attention.map((item) => (
                  <li key={item.id}>
                    <span className="pl-dot" aria-hidden="true" />
                    <span className="pl-listTitle">{item.name}</span>
                    <span className="pl-listMeta">{l(item.sub)}</span>
                    <Badge tone={STATUS_TONE[item.status]}>{status(item.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {page.section === "knowledge" ? (
        <Card>
          <CardHeader title={l({ fa: "پژوهشگران", en: "Researchers", ar: "الباحثون" })} subtitle={l(UI.demo)} />
          <CardBody>
            <ul className="pl-chips">
              {list("user").map((person) => (
                <li key={person.id}>
                  <Link className="pl-chip" to={`/knowledge/researchers/${person.id}`}>
                    {person.name} · {l(person.sub)}
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title={l(UI.dashboard.tasks)} />
        <CardBody>
          <ol className="pl-numbered">
            {SUGGESTIONS.map((suggestion) => (
              <li key={suggestion.en}>{l(suggestion)}</li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}

/* ---------------------------------- list ---------------------------------- */

function ListPage({ page }: { page: PageDef }) {
  const { l, number, status, locale, date: formatDate } = useLoc();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<string>("");

  const entities = page.entity ? list(page.entity) : [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entities.filter((item) => {
      const statusOk = state === "all" || item.status === state;
      if (!statusOk) return false;
      if (!needle) return true;
      return `${item.name} ${item.sub[locale === "fa" ? "fa" : locale === "ar" ? "ar" : "en"]}`.toLowerCase().includes(needle);
    });
  }, [entities, query, state, locale]);

  const base = DETAIL_BASE[page.section];

  return (
    <div className="pl-stack">
      <PageLead page={page} />

      <div className="pl-toolbar">
        <label className="pl-search">
          <Icon name="map" size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={l(UI.search)}
            aria-label={l(UI.search)}
          />
        </label>
        <select value={state} onChange={(event) => setState(event.target.value)} aria-label={l(UI.status.active)}>
          <option value="all">{l(UI.all)}</option>
          {Object.keys(UI.status).map((key) => (
            <option key={key} value={key}>
              {t(UI.status[key as StatusKey], locale)}
            </option>
          ))}
        </select>
        <span className="pl-count">
          {number(filtered.length)} / {number(entities.length)} {l(UI.count)}
        </span>
      </div>

      {page.entity && ENTITY_FIELDS[page.entity] ? (
        <div className="pl-toolbar">
          <Button variant="primary" size="sm" onClick={() => { setCreateOpen((v) => !v); setCreateStatus(""); }}>
            {createOpen ? "Close" : `Create ${page.entity}`}
          </Button>
        </div>
      ) : null}

      {page.entity && ENTITY_FIELDS[page.entity] && createOpen ? (
        <Card>
          <CardHeader title={`Create ${page.entity}`} />
          <CardBody>
            <ResourceForm
              fields={ENTITY_FIELDS[page.entity] ?? []}
              submitLabel="Create"
              loading={createStatus === "saving"}
              onSubmit={async (values) => {
                setCreateStatus("saving");
                try {
                  const api = createApiClient({ baseUrl: "/api" });
                  await api.resources.create(page.entity!, values);
                  setCreateStatus("saved");
                  setCreateOpen(false);
                } catch (e) {
                  setCreateStatus(`error: ${String(e)}`);
                }
              }}
              onCancel={() => setCreateOpen(false)}
            />
            {createStatus && createStatus !== "saving" ? <p className="text-xs text-fg-muted">{createStatus}</p> : null}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardBody className="!p-0">
          {filtered.length === 0 ? (
            <EmptyState title={l(UI.empty)} body={l(UI.search)} />
          ) : (
            <div className="pl-tableWrap">
              <table className="pl-table">
                <thead>
                  <tr>
                    <th>{l(UI.table.name)}</th>
                    <th>{l(UI.table.status)}</th>
                    <th>{l(UI.table.source)}</th>
                    <th aria-label={l(UI.open)} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="pl-rowTitle">{item.name}</span>
                        <span className="pl-rowSub">{l(item.sub)}</span>
                        <span className="pl-tags">
                          {item.tags.map((tag) => (
                            <span key={tag} className="pl-tag">
                              {tag}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td>
                        <Badge tone={STATUS_TONE[item.status]} dot>
                          {status(item.status)}
                        </Badge>
                        <span className="pl-factMini">
                          {item.facts.slice(0, 2).map((fact) => `${l(FACT_LABELS[fact[0]])}: ${factValue(fact, l, number)}`).join(" · ")}
                        </span>
                      </td>
                      <td>
                        <span className="pl-src">{item.source ?? "—"}</span>
                        <span className="pl-srcMeta">
                          {item.method ?? ""} {item.updated ? `· ${formatDate(item.updated)}` : ""}
                        </span>
                      </td>
                      <td className="pl-actionsCell">
                        {base ? (
                          <Link className="pl-link" to={`${base}/${item.id}`}>
                            {l(UI.open)} ←
                          </Link>
                        ) : (
                          <span className="pl-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/* --------------------------------- detail --------------------------------- */

const CONNECTED = ["hyDroMA", "agriculture", "mrv", "projects", "finance", "community"];

function DetailPage({ page }: { page: PageDef }) {
  const { id } = useParams();
  const { l, number, status } = useLoc();
  const entities = page.entity ? list(page.entity) : [];
  const entity: Entity | undefined = (id ? findAny(id) : undefined) ?? entities[0];

  if (!entity) return <EmptyState title={l(UI.empty)} />;

  const series = entity.series ?? [12, 18, 16, 24, 22, 28, 31, 34];

  return (
    <div className="pl-stack">
      <PageLead page={page} />

      <Card>
        <CardHeader
          title={entity.name}
          subtitle={`${l(entity.sub)} · ${entity.tags.join(" · ")}`}
          action={
            <Badge tone={STATUS_TONE[entity.status]} dot>
              {status(entity.status)}
            </Badge>
          }
        />
        <CardBody>
          <div className="pl-facts">
            {entity.facts.map((fact) => (
              <div key={`${fact[0]}-${fact[1]}`} className="pl-fact">
                <span className="pl-factLabel">{l(FACT_LABELS[fact[0]])}</span>
                <span className="pl-factValue">{factValue(fact, l, number)}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="pl-twoCol">
        <Card>
          <CardHeader title={l(UI.dashboard.trend)} subtitle={entity.method} />
          <CardBody>
            <LineChart
              data={series}
              unit=""
              label={entity.name}
              uncertaintyPct={8}
              summary={`${entity.name} · ${number(Math.min(...series))} – ${number(Math.max(...series))}`}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={l(UI.detail.provenance)} />
          <CardBody>
            <dl className="pl-defs">
              <div>
                <dt>{l(UI.detail.provenance)}</dt>
                <dd>{entity.source ?? "—"}</dd>
              </div>
              <div>
                <dt>{l(UI.report.method)}</dt>
                <dd>{entity.method ?? "—"}</dd>
              </div>
              <div>
                <dt>{l(UI.detail.related)}</dt>
                <dd>{entity.updated ?? "—"}</dd>
              </div>
              <div>
                <dt>{l(UI.report.uncertainty)}</dt>
                <dd>{entity.uncertainty ?? "—"}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title={l(UI.detail.related)} subtitle={l(UI.demoNote)} />
        <CardBody>
          <ul className="pl-chips">
            {CONNECTED.map((service) => (
              <li key={service} className="pl-chip">
                {service}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

/* --------------------------------- wizard --------------------------------- */

function WizardPage({ page }: { page: PageDef }) {
  const { l, number } = useLoc();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const steps = page.steps ?? [page.title];
  const entity = page.entity ? list(page.entity)[0] : undefined;

  return (
    <div className="pl-stack">
      <PageLead page={page} />

      <Card>
        <CardHeader
          title={`${l(UI.step)} ${step + 1} — ${l(steps[step] ?? steps[0]!)}`}
          subtitle={`${steps.length} ${l(UI.count)}`}
          action={<Badge tone="info">{l(UI.status.draft)}</Badge>}
        />
        <CardBody>
          <ol className="pl-steps" aria-label={l(page.title)}>
            {steps.map((label, index) => (
              <li key={label.en} className={index === step ? "is-current" : index < step ? "is-done" : ""}>
                <span>{index + 1}</span>
                {l(label)}
              </li>
            ))}
          </ol>

          <div className="pl-form">
            {(entity?.facts ?? []).slice(0, 4).map((fact) => (
              <label key={fact[0]} className="pl-field">
                <span>{l(FACT_LABELS[fact[0]])}</span>
                <input value={factValue(fact, l, number)} readOnly />
              </label>
            ))}
            <label className="pl-field pl-field--wide">
              <span>{l(UI.report.recommendation)}</span>
              <textarea rows={3} readOnly value={l(page.lead)} />
            </label>
          </div>

          <p className="pl-note">{l(UI.draftNote)}</p>
        </CardBody>
        <div className="pl-wizardBar">
          <Button variant="secondary" size="sm" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>
            {l(UI.back)}
          </Button>
          {step < steps.length - 1 ? (
            <Button size="sm" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}>
              {l(UI.next)}
            </Button>
          ) : (
            <Button size="sm" onClick={() => setDone(true)}>
              {l(UI.finish)}
            </Button>
          )}
        </div>
      </Card>

      {done ? (
        <div className="pl-toastOk" role="status">
          {l(UI.draftNote)}
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------------- report --------------------------------- */

function ReportPage({ page }: { page: PageDef }) {
  const { l, number } = useLoc();
  const entities = page.entity ? list(page.entity) : [];
  const entity = entities[0];

  return (
    <div className="pl-stack">
      <PageLead page={page} />

      <div className="pl-twoCol">
        <Card>
          <CardHeader title={l(UI.report.summary)} subtitle={l(UI.demo)} />
          <CardBody>
            <p className="pl-body">{l(page.lead)}</p>
            <div className="pl-facts">
              {(entity?.facts ?? []).map((fact) => (
                <div key={`${fact[0]}-${fact[1]}`} className="pl-fact">
                  <span className="pl-factLabel">{l(FACT_LABELS[fact[0]])}</span>
                  <span className="pl-factValue">{factValue(fact, l, number)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={l(UI.report.indicators)} subtitle={entity?.source ?? l(UI.demo)} />
          <CardBody>
            {page.chart === "bar" ? (
              <BarChart
                items={entities.slice(0, 5).map((item, index) => ({
                  label: item.name,
                  value: Number(item.facts[0]?.[1] ?? 0),
                  unit: item.facts[0]?.[2] ? l(UNIT_LABELS[item.facts[0]![2]!]) : "",
                  highlight: index === 0,
                }))}
                formatValue={(value) => number(value)}
              />
            ) : (
              <LineChart
                data={page.series ?? [20, 26, 31, 29, 36, 41, 44, 48]}
                unit=""
                label={l(page.title)}
                uncertaintyPct={12}
                summary={`${l(page.title)} · ${number(Math.min(...(page.series ?? [0])))} – ${number(Math.max(...(page.series ?? [0])))}`}
              />
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title={l(UI.report.method)} subtitle={entity?.method ?? l(UI.demoNote)} />
        <CardBody>
          <dl className="pl-defs pl-defs--3">
            <div>
              <dt>{l(UI.detail.provenance)}</dt>
              <dd>{entity?.source ?? "—"}</dd>
            </div>
            <div>
              <dt>{l(UI.report.method)}</dt>
              <dd>{entity?.method ?? "—"}</dd>
            </div>
            <div>
              <dt>{l(UI.report.uncertainty)}</dt>
              <dd>{entity?.uncertainty ? entity.uncertainty.replace(/\d+/gu, (digits) => number(digits)) : "—"}</dd>
            </div>
          </dl>
          <p className="pl-note">{l(UI.report.boundary)}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={l(UI.report.recommendation)} />
        <CardBody>
          <ol className="pl-numbered">
            {SUGGESTIONS.map((item) => (
              <li key={item.en}>{l(item)}</li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}

/* ----------------------------------- map ---------------------------------- */

function AtlasPage({ page }: { page: PageDef }) {
  const { l, number } = useLoc();
  const [layers, setLayers] = useState({ boundary: true, points: true, grid: true });

  const toggle = (key: keyof typeof layers) => setLayers((value) => ({ ...value, [key]: !value[key] }));

  return (
    <div className="pl-stack">
      <PageLead page={page} />

      <div className="pl-atlas">
        <Card className="pl-atlasMap">
          <CardBody className="!p-0">
            <svg viewBox="0 0 800 520" className="pl-svg" role="img" aria-label={l(page.title)}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0H0V40" fill="none" stroke="var(--border)" strokeWidth="0.6" />
                </pattern>
              </defs>
              <rect width="800" height="520" fill="url(#grid)" />
              {layers.boundary ? (
                <path
                  d="M180 90 L420 60 L610 140 L660 320 L520 450 L300 470 L150 360 Z"
                  fill="var(--primary)"
                  fillOpacity="0.08"
                  stroke="var(--primary)"
                  strokeWidth="2"
                />
              ) : null}
              {layers.grid
                ? Array.from({ length: 24 }, (_, index) => {
                    const x = 200 + (index % 6) * 62;
                    const y = 150 + Math.floor(index / 6) * 70;
                    return <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="var(--primary)" fillOpacity="0.35" />;
                  })
                : null}
              {layers.points
                ? [
                    [260, 180],
                    [420, 240],
                    [540, 300],
                    [360, 380],
                  ].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill="var(--danger)" />)
                : null}
              <text x="620" y="500" className="pl-svgText">
                {l(UI.map.scale)} {number(5)} {l(UNIT_LABELS.km)}
              </text>
            </svg>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={l(UI.map.layers)} subtitle={l(UI.demo)} />
          <CardBody>
            <ul className="pl-checks">
              {(["boundary", "points", "grid"] as const).map((key) => (
                <li key={key}>
                  <label>
                    <input type="checkbox" checked={layers[key]} onChange={() => toggle(key)} />
                    {l(UI.map[key])}
                  </label>
                </li>
              ))}
            </ul>
            <p className="pl-note">{l(UI.demoNote)}</p>
            <a className="pl-link" href={`${appPath("scientific-workspace")}map/`}>
              {l({ fa: "نقشهٔ تعاملی فضای علمی", en: "Interactive science map", ar: "خريطة المساحة العلمية" })} ←
            </a>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------- renderer -------------------------------- */

export function PageRenderer({ page }: { page: PageDef }) {
  switch (page.kind) {
    case "dashboard":
      return <Dashboard page={page} />;
    case "list":
      return <ListPage page={page} />;
    case "detail":
      return <DetailPage page={page} />;
    case "wizard":
      return <WizardPage page={page} />;
    case "report":
      return <ReportPage page={page} />;
    case "map":
      return <AtlasPage page={page} />;
    default:
      return <EmptyState title="—" />;
  }
}
