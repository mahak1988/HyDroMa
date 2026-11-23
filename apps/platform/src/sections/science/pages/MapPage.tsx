import { useMemo, useState } from "react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader, Checkbox } from "@eco-nojin/ui";
import { PageLead } from "../components/Cards";
import { ScienceMap, type MapLayers, type SelectedFeature } from "../components/ScienceMap";
import { useWorkspace } from "../app/WorkspaceContext";

const LAYER_META = [
  { id: "boundary", labelKey: "hydro.map.studyArea", source: "study-area demo polygon", quality: "hydro.qualityGood" },
  { id: "stations", labelKey: "hydro.water.precipitation", source: "14 demo monitoring stations", quality: "hydro.qualityMedium" },
  { id: "vegetation", labelKey: "hydro.vegetation.ndvi", source: "Sentinel-2-like demo grid", quality: "hydro.qualityMedium" },
] as const;

export function MapPage() {
  const { t } = useI18n();
  const { area } = useWorkspace();
  const [layers, setLayers] = useState<MapLayers>({ stations: true, vegetation: true, boundary: true });
  const [selected, setSelected] = useState<SelectedFeature>(null);
  const onSelect = useMemo(() => (feature: SelectedFeature) => setSelected(feature), []);

  return (
    <div>
      <PageLead
        title={t("hydro.map.title")}
        subtitle={t("hydro.map.subtitle")}
        aside={<Badge tone="warning">{t("hydro.statusDemo")}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Card>
          <CardBody className="p-3">
            <ScienceMap area={area} layers={layers} onSelect={onSelect} className="h-[520px] w-full overflow-hidden rounded-md" />
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title={t("hydro.map.layersTitle")} subtitle={t(area.nameKey as TranslationKey)} />
            <CardBody className="space-y-2.5">
              <Checkbox
                label={t("hydro.map.studyArea")}
                checked={layers.boundary}
                onChange={(event) => setLayers((current) => ({ ...current, boundary: event.target.checked }))}
              />
              <Checkbox
                label={t("hydro.water.precipitation")}
                checked={layers.stations}
                onChange={(event) => setLayers((current) => ({ ...current, stations: event.target.checked }))}
              />
              <Checkbox
                label={t("hydro.vegetation.ndvi")}
                checked={layers.vegetation}
                onChange={(event) => setLayers((current) => ({ ...current, vegetation: event.target.checked }))}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t("hydro.map.featureInfo")} subtitle={t("hydro.map.legend")} />
            <CardBody className="space-y-2 text-xs">
              {selected ? (
                <>
                  <p className="font-medium text-fg">{selected.label}</p>
                  <p className="text-fg-muted">{selected.value}</p>
                </>
              ) : (
                <p className="text-2xs text-fg-subtle">{t("hydro.map.noSelection")}</p>
              )}
              <ul className="mt-2 space-y-1 text-2xs text-fg-muted">
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-2 rounded-full bg-info" /> {t("hydro.map.studyArea")}
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-2 rounded-full bg-primary" /> NDVI density
                </li>
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t("hydro.map.quality")} />
            <CardBody>
              <ul className="space-y-2 text-2xs">
                {LAYER_META.map((layer) => (
                  <li key={layer.id} className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block text-fg">{t(layer.labelKey as TranslationKey)}</span>
                      <span className="block text-fg-subtle">{layer.source}</span>
                    </span>
                    <Badge tone="neutral">{t(layer.quality as TranslationKey)}</Badge>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}