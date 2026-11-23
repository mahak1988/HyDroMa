
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, MapPin } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader, Panel } from "@eco-nojin/ui";
import { IndicatorCard, PageLead } from "../components/Cards";

import { MiniMap } from "../components/MiniMap";
import { useWorkspace } from "../app/WorkspaceContext";
import { ALERTS, INDICATORS, indicatorById } from "../data/indicators";
import { sciencePath } from "../lib/paths";

const KPI_IDS = ["precipitation", "soilMoisture", "et", "ndvi", "salinity", "erosion"];

const severityTone = { high: "danger", medium: "warning", low: "info" } as const;

export function DashboardPage() {
  const { t } = useI18n();
  const { area } = useWorkspace();


  const kpis = KPI_IDS.map(indicatorById).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const quality = {
    good: INDICATORS.filter((item) => item.quality === "good").length,
    medium: INDICATORS.filter((item) => item.quality === "medium").length,
    low: INDICATORS.filter((item) => item.quality === "low").length,
  };

  return (
    <div>
      <PageLead
        title={t("hydro.dashboard.title")}
        subtitle={`${t("hydro.dashboard.subtitle")} · ${t(area.nameKey as TranslationKey)}`}
        aside={<Badge tone="warning">{t("hydro.statusDemo")}</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((indicator) => (
          <IndicatorCard key={indicator.id} indicator={indicator} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel
          title={t("hydro.dashboard.alerts")}
          subtitle={t("hydro.dashboard.coverage")}
          action={<AlertTriangle className="size-4 text-warning" aria-hidden="true" />}
        >
          <ul className="space-y-2.5">
            {ALERTS.map((alert) => (
              <li key={alert.id} className="flex items-start gap-2 text-xs text-fg-muted">
                <Badge tone={severityTone[alert.severity]} dot>
                  {alert.severity}
                </Badge>
                <span>{t(alert.labelKey as TranslationKey)}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Card>
          <CardHeader title={t("hydro.quality")} subtitle={t("hydro.dashboard.indicatorsTitle")} />
          <CardBody className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              {(["good", "medium", "low"] as const).map((level) => (
                <div key={level} className="rounded-md bg-surface-2 p-2">
                  <p className="kpi-value text-lg font-semibold text-fg">{quality[level]}</p>
                  <p className="text-2xs text-fg-subtle">{t(`hydro.quality${level[0]?.toUpperCase()}${level.slice(1)}` as TranslationKey)}</p>
                </div>
              ))}
            </div>
            <p className="text-2xs leading-relaxed text-fg-subtle">
              {t("hydro.dashboard.latestRuns")}: <span className="text-fg-muted">{t("hydro.dashboard.runsEmpty")}</span>
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={t("hydro.map.title")}
            subtitle={t(area.nameKey as TranslationKey)}
            action={
              <Link to={sciencePath("/map")} className="inline-flex items-center gap-1 text-2xs font-medium text-primary hover:underline">
                {t("hydro.dashboard.openMap")}
                <ArrowRight className="size-3 rtl-flip" aria-hidden="true" />
              </Link>
            }
          />
          <CardBody className="space-y-2">
            <MiniMap className="h-[190px] w-full overflow-hidden rounded-md" />
            <p className="flex items-center gap-1 text-2xs text-fg-subtle">
              <MapPin className="size-3" aria-hidden="true" />
              {area.areaHa.toLocaleString()} ha · {t("hydro.statusDemo")}
            </p>
          </CardBody>
        </Card>
      </div>

    </div>
  );
}