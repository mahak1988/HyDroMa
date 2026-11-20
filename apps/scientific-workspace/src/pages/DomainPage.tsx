import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { Badge, BarChart, Card, CardBody, LineChart, Panel } from "@eco-nojin/ui";
import { PageLead, IndicatorCard } from "../components/Cards";
import { WaterBalanceCard } from "../components/WaterBalanceCard";

import { useWorkspace } from "../app/WorkspaceContext";
import { byDomain, type Domain } from "../data/indicators";

const CONFIG: Record<Domain, { titleKey: string; subtitleKey: string; chartId: string }> = {
  water: { titleKey: "hydro.water.title", subtitleKey: "hydro.water.subtitle", chartId: "precipitation" },
  soil: { titleKey: "hydro.soil.title", subtitleKey: "hydro.soil.subtitle", chartId: "soilOrganic" },
  climate: { titleKey: "hydro.climate.title", subtitleKey: "hydro.climate.subtitle", chartId: "temperature" },
  vegetation: { titleKey: "hydro.vegetation.title", subtitleKey: "hydro.vegetation.subtitle", chartId: "ndvi" },
};

export function DomainPage({ domain }: { domain: Domain }) {
  const { t } = useI18n();
  const { area } = useWorkspace();
  const config = CONFIG[domain];
  const indicators = byDomain(domain);
  const chart = indicators.find((item) => item.id === config.chartId) ?? indicators[0];

  return (
    <div>
      <PageLead
        title={t(config.titleKey as TranslationKey)}
        subtitle={t(config.subtitleKey as TranslationKey)}
        aside={<Badge tone="warning">{t("hydro.statusDemo")}</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {indicators.map((indicator) => (
          <IndicatorCard key={indicator.id} indicator={indicator} />
        ))}
      </div>

      {chart ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Panel
            title={t(chart.labelKey as TranslationKey)}
            subtitle={`${t("hydro.updated")}: ${chart.updatedAt.slice(0, 10)} · ±${chart.uncertaintyPct}%`}
            action={<Badge tone="neutral">{area.areaHa.toLocaleString()} ha</Badge>}
          >
            <LineChart
              data={chart.series}
              unit={t(`hydro.units.${chart.unit}` as TranslationKey)}
              uncertaintyPct={chart.uncertaintyPct}
              label={t(chart.labelKey as TranslationKey)}
            />
            <p className="mt-2 text-2xs text-fg-subtle">
              {t("hydro.model")}: {chart.model.id} v{chart.model.version} · {t("hydro.source")}: {chart.source}
            </p>
          </Panel>

          <Panel title={t("hydro.dashboard.indicatorsTitle")} subtitle={t("hydro.disclaimerTitle")}>
            <BarChart
              items={indicators.slice(0, 6).map((item) => ({
                label: t(item.labelKey as TranslationKey),
                value: item.value,
                unit: t(`hydro.units.${item.unit}` as TranslationKey),
                highlight: item.id === chart.id,
              }))}
            />
          </Panel>
        </div>
      ) : null}

      <Card className="mt-4">
        <CardBody className="text-2xs text-fg-subtle">
          {t("hydro.disclaimerBody")}
        </CardBody>
      </Card>
      {domain === "water" ? <WaterBalanceCard /> : null}
    </div>
  );
}