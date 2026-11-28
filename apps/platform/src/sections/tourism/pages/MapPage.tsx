import { useState } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { Card, CardBody, CardHeader, Field, Input, Select } from "@eco-nojin/ui";
import type { DestinationKind, ExperienceType } from "@eco-nojin/domain-types";
import { useTourism } from "../content";
import { ALL_EXPERIENCE_TYPES, ALL_KINDS } from "../data/tourism";
import { PageHeader } from "../components/Cards";
import { LazyTourismMap } from "../components/LazyTourismMap";

export function MapPage() {
  const c = useTourism();
  const { locale, tag } = useI18n();
  const [asOf, setAsOf] = useState("2026-06-15");
  const [kind, setKind] = useState<DestinationKind | "">("");
  const [type, setType] = useState<ExperienceType | "">("");

  return (
    <div>
      <PageHeader eyebrow={c.ui.brand} title={c.map.title} subtitle={c.map.subtitle} action={<span className="text-2xs text-fg-subtle">{locale.toUpperCase()} · {tag}</span>} />

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_18rem]">
        <LazyTourismMap asOf={asOf} destinationKind={kind} experienceType={type} />

        <div className="space-y-4">
          <Card>
            <CardHeader title={c.map.asOf} />
            <CardBody className="space-y-3">
              <Field label={c.ui.date} htmlFor="map-asof" hint={c.nomadic.asOfHint}>
                <Input id="map-asof" type="date" value={asOf} onChange={(event) => setAsOf(event.target.value || "2026-06-15")} />
              </Field>
              <Field label={c.map.filterKind} htmlFor="map-kind">
                <Select id="map-kind" value={kind} onChange={(event) => setKind(event.target.value as DestinationKind | "")}>
                  <option value="">{c.ui.all}</option>
                  {ALL_KINDS.map((item) => (
                    <option key={item} value={item}>{c.destinations.kinds[item]}</option>
                  ))}
                </Select>
              </Field>
              <Field label={c.map.filterType} htmlFor="map-type">
                <Select id="map-type" value={type} onChange={(event) => setType(event.target.value as ExperienceType | "")}>
                  <option value="">{c.ui.all}</option>
                  {ALL_EXPERIENCE_TYPES.map((item) => (
                    <option key={item} value={item}>{c.experiences.types[item]}</option>
                  ))}
                </Select>
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={c.map.legend} />
            <CardBody className="space-y-2 text-xs text-fg-muted">
              <p className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />{c.map.destinations}</p>
              <p className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-info" aria-hidden="true" />{c.map.stays}</p>
              <p className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-warning" aria-hidden="true" />{c.map.experiences}</p>
              <p className="flex items-center gap-2"><span className="h-0.5 w-4 bg-warning" aria-hidden="true" />{c.map.routes}</p>
              <p className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-success" aria-hidden="true" />{c.map.camps}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={c.nomadic.consentTitle} />
            <CardBody>
              <p className="text-xs leading-relaxed text-fg-muted">{c.map.reviewHidden}</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
