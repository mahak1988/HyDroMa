import { useState } from "react";
import { GitCompare } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { Alert, Badge, BarChart, Card, CardBody, CardHeader, Panel, Select, TBody, THead, Table, Td, Th, Tr } from "@eco-nojin/ui";
import { PageLead } from "../components/Cards";

import { DATA_UPDATED_AT, SCENARIOS, SCENARIO_LABELS, STUDY_AREAS } from "../data/indicators";
import { useWorkspace } from "../app/WorkspaceContext";

export function ScenariosPage() {
  const { t, locale, format } = useI18n();
  const { area } = useWorkspace();
  const [selectedId, setSelectedId] = useState<string>("ndvi");
  const [base, alternative] = SCENARIOS;
  const selected = SCENARIO_LABELS.find((row) => row.id === selectedId) ?? SCENARIO_LABELS[3]!;
  const baseValue = base.values[selected.id as keyof typeof base.values];
  const altValue = alternative.values[selected.id as keyof typeof alternative.values];
  const baseLabel = t(base.labelKey as TranslationKey);
  const altLabel = t(alternative.labelKey as TranslationKey);

  return (
    <div>
      <PageLead
        title={t("hydro.simulation.title")}
        subtitle={t("hydro.simulation.subtitle")}
        aside={<Badge tone="warning">{t("hydro.statusDemo")}</Badge>}
      />

      <Alert tone="warning" title={t("hydro.simulation.notConnectedTitle")}>
        {t("hydro.simulation.notConnectedBody")}
      </Alert>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {SCENARIOS.map((scenario) => (
          <Card key={scenario.id}>
            <CardHeader
              title={t(scenario.labelKey as TranslationKey)}
              subtitle={`${t("hydro.dashboard.landscape")}: ${t(area.nameKey as TranslationKey)}`}
              action={<Badge tone={scenario.id === "baseline" ? "neutral" : "success"}>{t("hydro.statusDemo")}</Badge>}
            />
            <CardBody className="space-y-2">
              <dl className="space-y-1.5 text-xs">
                {SCENARIO_LABELS.map((row) => (
                  <div key={row.id} className="flex items-baseline justify-between gap-2">
                    <dt className="text-fg-muted">{t(row.labelKey as TranslationKey)}</dt>
                    <dd className="numeric text-fg">
                      {scenario.values[row.id as keyof typeof scenario.values].toLocaleString(locale)}{" "}
                      <span className="text-2xs text-fg-subtle">{row.unit}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Panel
          title={t("hydro.simulation.results")}
          subtitle={t("hydro.simulation.disclaimer")}
          action={<GitCompare className="size-4 text-primary" aria-hidden="true" />}
        >
          <div className="space-y-4">
            <div className="max-w-xs">
              <label className="mb-1 block text-xs font-medium text-fg" htmlFor="scenario-indicator">
                {t("hydro.simulation.outputs")}
              </label>
              <Select
                id="scenario-indicator"
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                aria-label={t("hydro.simulation.outputs")}
              >
                {SCENARIO_LABELS.map((row) => (
                  <option key={row.id} value={row.id}>
                    {t(row.labelKey as TranslationKey)} ({row.unit})
                  </option>
                ))}
              </Select>
            </div>

            <BarChart
              items={[
                { label: baseLabel, value: baseValue, unit: selected.unit },
                { label: altLabel, value: altValue, unit: selected.unit, highlight: true },
              ]}
            />

            <p className="text-2xs text-fg-subtle">
              {t("hydro.updated")}: {format.dateTime(DATA_UPDATED_AT)}
            </p>
          </div>
        </Panel>

        <Card className="h-fit">
          <CardHeader title={t("hydro.simulation.uncertainty")} subtitle={t("hydro.simulation.assumptions")} />
          <CardBody className="space-y-2 text-xs text-fg-muted">
            <p>{t("hydro.simulation.uncertaintyBody")}</p>
            <p className="text-2xs text-fg-subtle">{t("hydro.simulation.disclaimer")}</p>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title={t("hydro.simulation.results")}
          subtitle={`${t("hydro.simulation.base")} · ${t("hydro.simulation.alternative")}`}
          action={<Badge tone="warning">{t("hydro.statusDemo")}</Badge>}
        />
        <CardBody className="p-0">
          <Table caption={t("hydro.simulation.results")}>
            <THead>
              <Tr>
                <Th>{t("hydro.simulation.outputs")}</Th>
                <Th>{baseLabel}</Th>
                <Th>{altLabel}</Th>
                <Th>{t("hydro.simulation.delta")}</Th>
              </Tr>
            </THead>
            <TBody>
              {SCENARIO_LABELS.map((row) => {
                const baseRow = base.values[row.id as keyof typeof base.values];
                const altRow = alternative.values[row.id as keyof typeof alternative.values];
                const delta = ((altRow - baseRow) / baseRow) * 100;
                return (
                  <Tr key={row.id}>
                    <Td className="text-fg">{t(row.labelKey as TranslationKey)}</Td>
                    <Td className="numeric">
                      {baseRow.toLocaleString(locale)} <span className="text-2xs text-fg-subtle">{row.unit}</span>
                    </Td>
                    <Td className="numeric">
                      {altRow.toLocaleString(locale)} <span className="text-2xs text-fg-subtle">{row.unit}</span>
                    </Td>
                    <Td className={delta >= 0 ? "numeric text-success" : "numeric text-danger"}>
                      {delta >= 0 ? "+" : ""}
                      {delta.toFixed(1)} %
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </CardBody>
      </Card>

      <p className="mt-3 text-2xs text-fg-subtle">
        {t("hydro.statusDemo")} · {STUDY_AREAS.length} {t("hydro.dashboard.landscape")}
      </p>
    </div>
  );
}