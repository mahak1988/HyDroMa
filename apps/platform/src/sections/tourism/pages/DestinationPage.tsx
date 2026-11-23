import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader, EmptyState } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { pick } from "../lib/text";
import { destinationBySlug, experienceById, hostBySellerId, stayById } from "../data/tourism";
import { BulletList, ExperienceCard, PageHeader, SectionTitle, StayCard } from "../components/Cards";
import { SceneArt } from "../components/SceneArt";
import { LazyTourismMap } from "../components/LazyTourismMap";
import { tourismPath } from "../lib/paths";

const DEFAULT_AS_OF = "2026-06-15";

export function DestinationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale } = useI18n();
  const c = useTourism();
  const destination = slug ? destinationBySlug(slug) : undefined;

  if (!destination) {
    return (
      <div>
        <PageHeader title={c.ui.notFoundTitle} subtitle={c.ui.notFoundBody} />
        <div className="mt-5">
          <EmptyState title={c.ui.notFoundTitle} body={c.ui.notFoundBody} action={<Link to={tourismPath("/destinations")} className="text-sm font-medium text-primary hover:underline">{c.destinations.title}</Link>} />
        </div>
      </div>
    );
  }

  const experiences = destination.experienceIds.map(experienceById).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const stays = destination.stayIds.map(stayById).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const hosts = destination.hostIds.map(hostBySellerId).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div>
      <Link to={tourismPath("/destinations")} className="inline-flex items-center gap-1 text-2xs font-medium text-fg-muted hover:text-fg">
        <ArrowLeft className="size-3.5 rtl-flip" aria-hidden="true" />
        {c.destinations.title}
      </Link>

      <div className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">{c.destinations.kinds[destination.kind]}</Badge>
          <Badge tone="warning">{c.ui.demo}</Badge>
          {destination.landscapeRef ? <Badge tone="neutral">{c.destination.landscapeTitle}: {destination.landscapeRef}</Badge> : null}
        </div>
        <div className="mt-2">
          <PageHeader title={pick(destination.name, locale)} subtitle={pick(destination.summary, locale)} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <div className="min-w-0">
          <SceneArt seed={destination.artworkSeed} className="h-64 w-full rounded-xl border border-border" label={pick(destination.name, locale)} />
          <p className="mt-4 text-sm leading-relaxed text-fg-muted">{pick(destination.description, locale)}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Card>
              <CardBody className="space-y-1.5">
                <p className="text-2xs uppercase tracking-wide text-fg-subtle">{c.destination.seasonTitle}</p>
                <p className="text-sm text-fg">{destination.bestSeason ? pick(destination.bestSeason, locale) : "—"}</p>
                <p className="inline-flex items-center gap-1 text-2xs text-fg-subtle"><MapPin className="size-3.5" aria-hidden="true" />{destination.region} · {destination.country}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="space-y-1.5">
                <p className="text-2xs uppercase tracking-wide text-fg-subtle">{c.destination.communityTitle}</p>
                <p className="text-xs leading-relaxed text-fg-muted">{pick(destination.community, locale)}</p>
              </CardBody>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title={c.destination.mapTitle} subtitle={`${destination.center[1].toFixed(3)}, ${destination.center[0].toFixed(3)}`} />
            <div className="p-2">
              <LazyTourismMap asOf={DEFAULT_AS_OF} className="h-[300px] w-full" />
            </div>
          </Card>
          <Card>
            <CardHeader title={c.destination.accessTitle} />
            <CardBody>
              <p className="text-xs leading-relaxed text-fg-muted">{destination.access}</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={c.destination.warningsTitle} />
            <CardBody>
              {destination.warnings.length === 0 ? <p className="text-xs text-fg-muted">{c.destination.noWarnings}</p> : <BulletList items={destination.warnings} tone="primary" />}
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title={c.destination.naturalTitle} />
          <CardBody>
            <BulletList items={destination.naturalFeatures} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={c.destination.culturalTitle} />
          <CardBody>
            <BulletList items={destination.culturalFeatures} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={c.destination.facilitiesTitle} />
          <CardBody>
            <BulletList items={destination.facilities} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={c.marketplace.title} action={<Badge tone="neutral">{c.marketplace.status}</Badge>} />
          <CardBody className="space-y-2">
            <p className="text-xs leading-relaxed text-fg-muted">{c.marketplace.body}</p>
          </CardBody>
        </Card>
      </div>

      <section className="mt-8">
        <SectionTitle title={c.destination.experiencesTitle} />
        {experiences.length === 0 ? (
          <p className="text-xs text-fg-muted">{c.destination.noExperiences}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {experiences.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title={c.destination.staysTitle} />
        {stays.length === 0 ? (
          <p className="text-xs text-fg-muted">{c.destination.noStays}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stays.map((stay) => (
              <StayCard key={stay.id} stay={stay} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <SectionTitle title={c.destination.hostsTitle} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hosts.map((host) => (
            <Card key={host.sellerId}>
              <CardBody className="space-y-1.5">
                <Link to={tourismPath(`/host?host=${host.sellerId}`)} className="text-sm font-semibold text-fg hover:underline">
                  {pick(host.name, locale)}
                </Link>
                <p className="text-2xs text-fg-muted">{pick(host.bio, locale)}</p>
                <Badge tone={host.verification === "verified" ? "success" : host.verification === "pending" ? "warning" : "neutral"}>
                  {host.verification === "verified" ? c.host.verified : host.verification === "pending" ? c.host.pending : c.host.unverified}
                </Badge>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
