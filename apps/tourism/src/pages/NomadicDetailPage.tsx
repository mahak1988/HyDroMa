import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, MapPin, ShieldAlert, ShieldCheck } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader, EmptyState, Field, Input } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { pick } from "../lib/text";
import { communityBySlug } from "../data/tourism";
import { activeOverlaps, isPublicGeometry, isSeasonActive } from "../lib/time";
import { BulletList, PageHeader, SectionTitle } from "../components/Cards";
import { LazyTourismMap } from "../components/LazyTourismMap";

const DEFAULT_AS_OF = "2026-06-15";

function validityLabel(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  return `${start} â†’ ${end}`;
}

export function NomadicDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale } = useI18n();
  const c = useTourism();
  const community = slug ? communityBySlug(slug) : undefined;
  const [asOf, setAsOf] = useState(DEFAULT_AS_OF);

  if (!community) {
    return (
      <div>
        <PageHeader title={c.ui.notFoundTitle} subtitle={c.ui.notFoundBody} />
        <div className="mt-5">
          <EmptyState title={c.ui.notFoundTitle} body={c.ui.notFoundBody} action={<Link to="/nomadic" className="text-sm font-medium text-primary hover:underline">{c.nomadic.title}</Link>} />
        </div>
      </div>
    );
  }

  const published = community.consent.published;
  const publicZones = community.zones.filter((zone) => isPublicGeometry(zone.sensitivity));
  const publicRoutes = community.routes.filter((route) => isPublicGeometry(route.sensitivity));
  const publicCamps = community.camps.filter((camp) => isPublicGeometry(camp.sensitivity));
  const overlaps = activeOverlaps(publicZones, asOf);

  return (
    <div>
      <Link to="/nomadic" className="inline-flex items-center gap-1 text-2xs font-medium text-fg-muted hover:text-fg">
        <ArrowLeft className="size-3.5 rtl-flip" aria-hidden="true" />
        {c.nomadic.title}
      </Link>

      <div className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">{c.destinations.kinds["nomadic-territory"]}</Badge>
          <Badge tone={published ? "success" : "danger"}>
            {published ? (
              <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3" aria-hidden="true" />{c.nomadic.consentGranted}</span>
            ) : (
              <span className="inline-flex items-center gap-1"><ShieldAlert className="size-3" aria-hidden="true" />{c.nomadic.consentWithheld}</span>
            )}
          </Badge>
          {community.landscapeRef ? <Badge tone="neutral">{c.destination.landscapeTitle}: {community.landscapeRef}</Badge> : null}
        </div>
        <div className="mt-2">
          <PageHeader title={pick(community.name, locale)} subtitle={pick(community.summary, locale)} />
        </div>
      </div>

      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-fg-muted">{pick(community.description, locale)}</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Card>
          <CardHeader title={c.nomadic.lifestyleTitle} />
          <CardBody>
            <BulletList items={community.lifestyle} tone="primary" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={c.nomadic.consentTitle} />
          <CardBody className="space-y-2">
            <p className="text-xs leading-relaxed text-fg-muted">{pick(community.consent.note, locale)}</p>
            <p className="text-2xs text-fg-subtle">{c.nomadic.sensitiveNote}</p>
            {!published ? <Badge tone="danger">{c.nomadic.notPublished}</Badge> : null}
          </CardBody>
        </Card>
      </div>

      {!published ? (
        <div className="mt-5 rounded-lg border border-danger/30 bg-danger-soft p-4 text-danger-soft-fg">
          <p className="flex items-center gap-2 text-sm font-medium">
            <ShieldAlert className="size-4" aria-hidden="true" />
            {c.nomadic.consentWithheld}
          </p>
          <p className="mt-1 text-xs leading-relaxed">{c.nomadic.sensitiveNote}</p>
        </div>
      ) : (
        <>
          <section className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionTitle title={c.nomadic.zonesTitle} />
              <div className="w-full sm:w-56">
                <Field label={c.nomadic.asOf} htmlFor="nomadic-asof" hint={c.nomadic.asOfHint}>
                  <Input id="nomadic-asof" type="date" value={asOf} onChange={(event) => setAsOf(event.target.value || DEFAULT_AS_OF)} />
                </Field>
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {community.zones.map((zone) => {
                const active = isSeasonActive(asOf, zone);
                const visible = isPublicGeometry(zone.sensitivity);
                return (
                  <Card key={zone.id} as="article">
                    <CardBody className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-fg">{pick(zone.name, locale)}</h3>
                        <div className="flex flex-wrap justify-end gap-1">
                          <Badge tone="primary">{c.nomadic.zoneKinds[zone.kind]}</Badge>
                          <Badge tone={active ? "success" : "neutral"}>{active ? c.stays.available : "—"}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-2xs">
                        <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-fg-muted">
                          {c.nomadic.access}: {c.nomadic.accessLevels[zone.access]}
                        </span>
                        <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-fg-muted">
                          {c.nomadic.sensitivity}: {c.nomadic.sensitivityLevels[zone.sensitivity]}
                        </span>
                        {zone.capacity !== null ? (
                          <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-fg-muted">{c.nomadic.capacity}: {zone.capacity}</span>
                        ) : null}
                      </div>
                      <p className="inline-flex items-center gap-1 text-2xs text-fg-subtle">
                        <CalendarClock className="size-3.5" aria-hidden="true" />
                        {c.nomadic.validity}: {validityLabel(zone.validity?.from ?? null, zone.validity?.to ?? null)}
                      </p>
                      {zone.months ? <p className="text-2xs text-fg-subtle">{c.nomadic.months}: {zone.months.join(", ")}</p> : null}
                      {zone.note ? <p className="text-2xs text-fg-muted">{pick(zone.note, locale)}</p> : null}
                      {!visible ? (
                        <p className="rounded-md bg-danger-soft px-2 py-1 text-2xs text-danger-soft-fg">{c.nomadic.notPublished}</p>
                      ) : null}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </section>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title={c.nomadic.routesTitle} />
              <CardBody>
                {publicRoutes.length === 0 ? (
                  <p className="text-xs text-fg-muted">{c.nomadic.notPublished}</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {publicRoutes.map((route) => {
                      const active = isSeasonActive(asOf, route);
                      return (
                        <li key={route.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                          <span className="text-fg">{pick(route.name, locale)}</span>
                          <span className="flex flex-wrap gap-1.5 text-2xs">
                            <Badge tone={active ? "success" : "neutral"}>{active ? c.stays.available : "—"}</Badge>
                            <Badge tone="neutral">{c.nomadic.accessLevels[route.access]}</Badge>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={c.nomadic.campsTitle} />
              <CardBody>
                {publicCamps.length === 0 ? (
                  <p className="text-xs text-fg-muted">{c.nomadic.notPublished}</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {publicCamps.map((camp) => {
                      const active = isSeasonActive(asOf, camp);
                      return (
                        <li key={camp.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                          <span className="text-fg">{pick(camp.name, locale)}</span>
                          <span className="flex flex-wrap gap-1.5 text-2xs">
                            <Badge tone={active ? "success" : "neutral"}>{active ? c.stays.available : "—"}</Badge>
                            <Badge tone="neutral">{c.nomadic.accessLevels[camp.access]}</Badge>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader title={c.nomadic.overlapTitle} subtitle={c.nomadic.overlapBody} />
            <CardBody>
              {overlaps.length === 0 ? (
                <p className="text-xs text-fg-muted">{c.nomadic.overlapNone}</p>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {overlaps.map((pair) => (
                    <li key={`${pair.a.id}-${pair.b.id}`} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
                      {c.nomadic.overlapSome} {pick(pair.a.name, locale)} + {pick(pair.b.name, locale)}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <section className="mt-6">
            <SectionTitle title={c.map.title} />
            <LazyTourismMap asOf={asOf} />
          </section>
        </>
      )}

      <Card className="mt-6">
        <CardHeader title={c.nomadic.visit} />
        <CardBody>
          <p className="inline-flex items-center gap-1 text-xs text-fg-muted">
            <MapPin className="size-3.5" aria-hidden="true" />
            {community.region} · {community.country}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}


