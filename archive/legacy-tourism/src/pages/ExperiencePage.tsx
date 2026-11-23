import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, Clock, Footprints, MapPin, Users } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { pick } from "../lib/text";
import { formatMoney } from "../lib/money";
import { destinationById, experienceBySlug, hostBySellerId } from "../data/tourism";
import { BulletList, PageHeader, SectionTitle } from "../components/Cards";
import { SceneArt } from "../components/SceneArt";

export function ExperiencePage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale, tag } = useI18n();
  const c = useTourism();
  const navigate = useNavigate();
  const experience = slug ? experienceBySlug(slug) : undefined;

  if (!experience) {
    return (
      <div>
        <PageHeader title={c.ui.notFoundTitle} subtitle={c.ui.notFoundBody} />
        <div className="mt-5">
          <EmptyState title={c.ui.notFoundTitle} body={c.ui.notFoundBody} action={<Link to="/experiences" className="text-sm font-medium text-primary hover:underline">{c.experiences.title}</Link>} />
        </div>
      </div>
    );
  }

  const destinations = experience.destinationRefs.map(destinationById).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const host = experience.hostId ? hostBySellerId(experience.hostId) : undefined;
  const closed = experience.bookingStatus === "closed";

  return (
    <div>
      <Link to="/experiences" className="inline-flex items-center gap-1 text-2xs font-medium text-fg-muted hover:text-fg">
        <ArrowLeft className="size-3.5 rtl-flip" aria-hidden="true" />
        {c.experiences.title}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone="primary">{c.experiences.types[experience.type]}</Badge>
        <Badge tone={closed ? "neutral" : experience.bookingStatus === "open" ? "success" : "warning"}>
          {closed ? c.experiences.bookingClosed : c.experiences.bookingRequest}
        </Badge>
        <Badge tone="warning">{c.ui.demo}</Badge>
      </div>
      <div className="mt-2">
        <PageHeader title={pick(experience.title, locale)} subtitle={pick(experience.summary, locale)} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="min-w-0">
          <SceneArt seed={experience.artworkSeed} variant="nature" className="h-64 w-full rounded-xl border border-border" label={pick(experience.title, locale)} />
          <p className="mt-4 text-sm leading-relaxed text-fg-muted">{pick(experience.description, locale)}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardBody className="space-y-1">
                <p className="text-2xs uppercase tracking-wide text-fg-subtle">{c.experiences.duration}</p>
                <p className="inline-flex items-center gap-1 text-sm font-medium text-fg"><Clock className="size-4" aria-hidden="true" />{experience.durationHours} {c.experiences.hours}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="space-y-1">
                <p className="text-2xs uppercase tracking-wide text-fg-subtle">{c.experiences.difficulty}</p>
                <p className="inline-flex items-center gap-1 text-sm font-medium text-fg"><Footprints className="size-4" aria-hidden="true" />{c.experiences.difficulties[experience.difficulty]}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="space-y-1">
                <p className="text-2xs uppercase tracking-wide text-fg-subtle">{c.experiences.capacity}</p>
                <p className="inline-flex items-center gap-1 text-sm font-medium text-fg"><Users className="size-4" aria-hidden="true" />{experience.capacity} {c.ui.guests}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="space-y-1">
                <p className="text-2xs uppercase tracking-wide text-fg-subtle">{c.experiences.season}</p>
                <p className="inline-flex items-center gap-1 text-sm font-medium text-fg"><CalendarClock className="size-4" aria-hidden="true" />{experience.season ?? "—"}</p>
              </CardBody>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader title={c.experiences.requirementsTitle} />
              <CardBody><BulletList items={experience.requirements} tone="primary" /></CardBody>
            </Card>
            <Card>
              <CardHeader title={c.experiences.equipmentTitle} />
              <CardBody><BulletList items={experience.equipment} /></CardBody>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader title={c.experiences.safetyTitle} />
            <CardBody><BulletList items={experience.safety} tone="primary" /></CardBody>
          </Card>

          <section className="mt-6">
            <SectionTitle title={c.experiences.destinationsTitle} />
            <div className="grid gap-3 sm:grid-cols-2">
              {destinations.map((destination) => (
                <Link key={destination.id} to={`/destinations/${destination.slug}`} className="rounded-md border border-border bg-surface px-3 py-2 transition-colors hover:border-primary/50">
                  <p className="inline-flex items-center gap-1 text-sm font-medium text-fg"><MapPin className="size-3.5" aria-hidden="true" />{pick(destination.name, locale)}</p>
                  <p className="mt-0.5 line-clamp-1 text-2xs text-fg-muted">{pick(destination.summary, locale)}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <Card className="h-fit">
            <CardHeader title={c.experiences.price} action={<Badge tone="warning">{c.ui.demo}</Badge>} />
            <CardBody className="space-y-3">
              <p className="text-xl font-semibold text-fg">
                {formatMoney(experience.price, tag)} <span className="text-xs font-normal text-fg-subtle">/ {c.ui.perPerson}</span>
              </p>
              {closed ? (
                <Button variant="secondary" className="w-full" disabled>{c.experiences.bookingClosed}</Button>
              ) : (
                <Button variant="primary" className="w-full" onClick={() => navigate(`/book/experience/${experience.slug}`)}>
                  {c.experiences.request}
                </Button>
              )}
              <p className="text-2xs text-fg-subtle">{c.ui.paymentNotEnabled}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={c.ui.host} />
            <CardBody>
              {host ? (
                <div className="space-y-1">
                  <Link to={`/host?host=${host.sellerId}`} className="text-sm font-semibold text-fg hover:underline">{pick(host.name, locale)}</Link>
                  <p className="text-2xs text-fg-muted">{pick(host.bio, locale)}</p>
                </div>
              ) : (
                <p className="text-xs text-fg-muted">—</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={c.marketplace.title} action={<Badge tone="neutral">{c.marketplace.status}</Badge>} />
            <CardBody><p className="text-xs leading-relaxed text-fg-muted">{c.marketplace.body}</p></CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}