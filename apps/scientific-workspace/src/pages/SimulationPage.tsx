import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Table, TBody, Td, Th, THead, Tr } from "@eco-nojin/ui";
import { PageLead } from "../components/Cards";
import { Panel } from "../components/Charts";
import { SCENARIOS, SCENARIO_LABELS } from "../data/indicators";
import { useWorkspace } from "../app/WorkspaceContext";

const INPUTS = [
  { labelKey: "hydro.simulation.inputPrecip", value: "−8 %" },
  { labelKey: "hydro.simulation.inputIrrigation", value: "62 % → 74 %" },
  { labelKey: "hydro.simulation.inputArea", value: "1,250 ha" },
  { labelKey: "hydro.simulation.inputPeriod", value: "2026 – 2031" },
] as const;

const ASSUMPTIONS = [
  "hydro.simulation.assumptionLandUse",
  "hydro.simulation.assumptionSoil",
  "hydro.simulation.assumptionClimate",
  "hydro.simulation.assumptionUncertainty",
] as const;

export function SimulationPage() {
  const { t } = useI18n();
  const { area } = useWorkspace();
  const [showResults, setShowResults] = useState(false);
  const [base, alternative] = SCENARIOS;

  return (
    <div>
      <PageLead
        title={t("hydro.simulation.title")}
        subtitle={t("hydro.simulation.subtitle")}
        aside={<Badge tone="danger">{t("hydro.statusNotConnected")}</Badge>}
      />

      <Alert tone="warning" title={t("hydro.simulation.notConnectedTitle")}>
        {t("hydro.simulation.notConnectedBody")}
      </Alert>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title={t("hydro.simulation.inputs")} subtitle={t(area.nameKey as TranslationKey)}>
          <dl className="space-y-2 text-xs">
            {INPUTS.map((item) => (
              <div key={item.labelKey} className="flex items-start justify-between gap-2">
                <dt className="text-fg-muted">{t(item.labelKey)}</dt>
                <dd className="text-fg">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title={t("hydro.simulation.assumptions")} subtitle={t("hydro.disclaimerTitle")}>
          <ul className="space-y-2 text-xs text-fg-muted">
            {ASSUMPTIONS.map((key) => (
              <li key={key} className="flex gap-2">
                <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={t("hydro.simulation.uncertainty")} subtitle={t("hydro.simulation.disclaimer")}>
          <p className="text-xs text-fg-muted">{t("hydro.simulation.uncertaintyBody")}</p>
          <div className="mt-3">
            <Button
              variant="primary"
              icon={<FlaskConical className="size-4" aria-hidden="true" />}
              onClick={() => setShowResults((value) => !value)}
            >
              {t("hydro.simulation.runDemo")}
            </Button>
          </div>
        </Panel>
      </div>

      <Card className="mt-4">
        <CardHeader
          title={t("hydro.simulation.results")}
          subtitle={showResults ? t("hydro.simulation.disclaimer") : t("hydro.simulation.notConnectedBody")}
          action={<Badge tone={showResults ? "warning" : "neutral"}>{showResults ? t("hydro.statusDemo") : t("hydro.statusNotConnected")}</Badge>}
        />
        <CardBody>
          {showResults ? (
            <Table caption={t("hydro.simulation.results")}>
              <THead>
                <tr>
                  <Th>{t("hydro.simulation.outputs")}</Th>
                  <Th>{t("hydro.simulation.base")}</Th>
                  <Th>{t("hydro.simulation.alternative")}</Th>
                  <Th>{t("hydro.simulation.delta")}</Th>
                </tr>
              </THead>
              <TBody>
                {SCENARIO_LABELS.map((row) => {
                  const baseValue = base.values[row.id as keyof typeof base.values];
                  const altValue = alternative.values[row.id as keyof typeof alternative.values];
                  const delta = ((altValue - baseValue) / baseValue) * 100;
                  return (
                    <Tr key={row.id}>
                      <Td className="text-fg">{t(row.labelKey as TranslationKey)}</Td>
                      <Td className="numeric">
                        {baseValue} <span className="text-2xs text-fg-subtle">{row.unit}</span>
                      </Td>
                      <Td className="numeric">
                        {altValue} <span className="text-2xs text-fg-subtle">{row.unit}</span>
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
          ) : (
            <p className="text-xs text-fg-muted">{t("hydro.simulation.notConnectedBody")}</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}