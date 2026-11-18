import { Badge, Card, CardBody } from "@eco-nojin/ui";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { Sparkline } from "./Charts";
import type { Indicator } from "../data/indicators";

const qualityTone = { good: "success", medium: "warning", low: "danger" } as const;

export function IndicatorCard({ indicator }: { indicator: Indicator }) {
  const { t } = useI18n();
  return (
    <Card className="min-w-0">
      <CardBody className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-2xs font-medium text-fg-muted">{t(indicator.labelKey as TranslationKey)}</p>
          <Badge tone="neutral">{t(`hydro.units.${indicator.unit}` as TranslationKey)}</Badge>
        </div>
        <div className="flex items-end justify-between gap-2">
          <p className="kpi-value text-2xl font-semibold text-fg">
            {indicator.value.toLocaleString(undefined, { minimumFractionDigits: indicator.decimals, maximumFractionDigits: indicator.decimals })}
          </p>
          <Sparkline data={indicator.series} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={qualityTone[indicator.quality]} dot>
            {t(`hydro.quality${indicator.quality[0]?.toUpperCase()}${indicator.quality.slice(1)}` as TranslationKey)}
          </Badge>
          <span className="text-2xs text-fg-subtle">
            ±{indicator.uncertaintyPct}% · {indicator.source}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

export function PageLead({ title, subtitle, aside }: { title: string; subtitle: string; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
        <p className="mt-1 max-w-2xl text-xs text-fg-muted">{subtitle}</p>
      </div>
      {aside}
    </div>
  );
}