import { useMemo, useState } from "react";
import { Satellite } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Field, Input, Panel } from "@eco-nojin/ui";
import { PageLead } from "../components/Cards";

import { ScienceMap, type MapLayers, type SelectedFeature } from "../components/ScienceMap";
import { useWorkspace } from "../app/WorkspaceContext";

export function RemoteSensingPage() {
  const { t } = useI18n();
  const { area } = useWorkspace();
  const [selected, setSelected] = useState<SelectedFeature>(null);
  const layers = useMemo<MapLayers>(() => ({ stations: false, vegetation: true, boundary: true }), []);
  const onSelect = useMemo(() => (feature: SelectedFeature) => setSelected(feature), []);

  return (
    <div>
      <PageLead
        title={t("hydro.remote.title")}
        subtitle={t("hydro.remote.subtitle")}
        aside={<Badge tone="danger">{t("hydro.statusNotConnected")}</Badge>}
      />

      <Alert tone="warning" title={t("hydro.remote.noDataTitle")}>
        {t("hydro.remote.noDataBody")}
      </Alert>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Panel title={t("hydro.map.title")} subtitle={t(area.nameKey as TranslationKey)}>
          <ScienceMap area={area} layers={layers} onSelect={onSelect} className="h-[440px] w-full overflow-hidden rounded-md" />
          <p className="mt-2 text-2xs text-fg-subtle">{t("hydro.disclaimerBody")}</p>
        </Panel>

        <div className="space-y-4">
          <Card>
            <CardHeader title={t("hydro.remote.compare")} subtitle={t("hydro.statusNotConnected")} />
            <CardBody className="space-y-3">
              <Field label={t("hydro.remote.compare")} htmlFor="rs-from">
                <Input id="rs-from" type="date" defaultValue="2026-09-01" disabled />
              </Field>
              <Field label={t("hydro.remote.compare")} htmlFor="rs-to">
                <Input id="rs-to" type="date" defaultValue="2026-10-01" disabled />
              </Field>
              <Button variant="secondary" disabled aria-disabled="true" icon={<Satellite className="size-4" aria-hidden="true" />}>
                {t("hydro.remote.change")}
              </Button>
              <p className="text-2xs text-fg-subtle">{t("hydro.remote.noDataBody")}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t("hydro.map.featureInfo")} subtitle={t("hydro.remote.legend")} />
            <CardBody>
              {selected ? (
                <dl className="space-y-1 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-fg-muted">{selected.label}</dt>
                    <dd className="text-fg">{selected.value}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-2xs text-fg-subtle">{t("hydro.map.noSelection")}</p>
              )}
              <ul className="mt-3 space-y-1.5 text-2xs text-fg-muted">
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-2 rounded-full bg-success" /> 0.20 – 0.30
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-2 rounded-full bg-success/60" /> 0.30 – 0.45
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-2 rounded-full bg-primary" /> 0.45 – 0.65
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}