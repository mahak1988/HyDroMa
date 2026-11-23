import { Link } from "react-router-dom";
import { ArrowRight, BedDouble, CalendarDays, Clock, Footprints, MapPin, Users } from "lucide-react";
import type { Destination, Experience, Stay, TourismEvent } from "@eco-nojin/domain-types";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Card, CardBody } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { pick } from "../lib/text";
import { formatMoney } from "../lib/money";
import { SceneArt } from "./SceneArt";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-2xs font-medium uppercase tracking-wide text-primary">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      {action}
    </div>
  );
}

export function BulletList({ items, tone = "neutral" }: { items: string[]; tone?: "neutral" | "primary" }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1.5 text-sm text-fg-muted">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden="true" className={`mt-1.5 size-1.5 shrink-0 rounded-full ${tone === "primary" ? "bg-primary" : "bg-border-strong"}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function DestinationCard({ destination }: { destination: Destination }) {
  const { locale } = useI18n();
  const c = useTourism();
  return (
    <Card as="article" className="tourism-card h-full">
      <Link to={`/destinations/${destination.slug}`} className="block focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
        <SceneArt seed={destination.artworkSeed} className="h-40 w-full rounded-t-lg object-cover" label={pick(destination.name, locale)} />
        <CardBody className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-fg">{pick(destination.name, locale)}</h3>
            <Badge tone="primary">{c.destinations.kinds[destination.kind]}</Badge>
          </div>
          <p className="line-clamp-2 text-xs text-fg-muted">{pick(destination.summary, locale)}</p>
          <p className="flex items-center gap-1 text-2xs text-fg-subtle">
            <MapPin className="size-3.5" aria-hidden="true" />
            {destination.region} · {destination.country}
          </p>
          {destination.landscapeRef ? <p className="text-2xs text-fg-subtle">{c.destination.landscapeTitle}: {destination.landscapeRef}</p> : null}
        </CardBody>
      </Link>
    </Card>
  );
}

export function StayCard({ stay }: { stay: Stay }) {
  const { locale, tag } = useI18n();
  const c = useTourism();
  return (
    <Card as="article" className="tourism-card h-full">
      <Link to={`/stays/${stay.slug}`} className="block focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
        <SceneArt seed={stay.artworkSeed} variant="stay" className="h-40 w-full rounded-t-lg" label={pick(stay.name, locale)} />
        <CardBody className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-fg">{pick(stay.name, locale)}</h3>
            <Badge tone="info">{c.stays.kinds[stay.kind]}</Badge>
          </div>
          <p className="line-clamp-2 text-xs text-fg-muted">{pick(stay.summary, locale)}</p>
          <div className="flex flex-wrap items-center gap-3 text-2xs text-fg-subtle">
            <span className="inline-flex items-center gap-1"><Users className="size-3.5" aria-hidden="true" />{stay.capacity} {c.ui.guests}</span>
            <span className="inline-flex items-center gap-1"><BedDouble className="size-3.5" aria-hidden="true" />{stay.rooms.length} {c.stays.roomTypes}</span>
          </div>
          <p className="text-xs font-medium text-fg">
            {formatMoney(stay.price, tag)} <span className="font-normal text-fg-subtle">/ {c.ui.perNight}</span>
          </p>
        </CardBody>
      </Link>
    </Card>
  );
}

export function ExperienceCard({ experience }: { experience: Experience }) {
  const { locale, tag } = useI18n();
  const c = useTourism();
  const statusTone = experience.bookingStatus === "open" ? "success" : experience.bookingStatus === "request" ? "warning" : "neutral";
  return (
    <Card as="article" className="tourism-card h-full">
      <Link to={`/experiences/${experience.slug}`} className="block focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
        <SceneArt seed={experience.artworkSeed} variant="nature" className="h-40 w-full rounded-t-lg" label={pick(experience.title, locale)} />
        <CardBody className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-fg">{pick(experience.title, locale)}</h3>
            <Badge tone={statusTone}>
              {experience.bookingStatus === "open" ? c.experiences.bookingRequest : experience.bookingStatus === "request" ? c.experiences.bookingRequest : c.experiences.bookingClosed}
            </Badge>
          </div>
          <p className="line-clamp-2 text-xs text-fg-muted">{pick(experience.summary, locale)}</p>
          <div className="flex flex-wrap items-center gap-3 text-2xs text-fg-subtle">
            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden="true" />{experience.durationHours} {c.experiences.hours}</span>
            <span className="inline-flex items-center gap-1"><Users className="size-3.5" aria-hidden="true" />{experience.capacity} {c.ui.guests}</span>
            <span className="inline-flex items-center gap-1"><Footprints className="size-3.5" aria-hidden="true" />{c.experiences.difficulties[experience.difficulty]}</span>
          </div>
          <p className="text-xs font-medium text-fg">
            {formatMoney(experience.price, tag)} <span className="font-normal text-fg-subtle">/ {c.ui.perPerson}</span>
          </p>
        </CardBody>
      </Link>
    </Card>
  );
}

export function EventCard({ event }: { event: TourismEvent }) {
  const { locale } = useI18n();
  const c = useTourism();
  return (
    <Card as="article" className="h-full">
      <CardBody className="flex h-full flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-fg">{pick(event.title, locale)}</h3>
          <Badge tone={event.registration === "open" ? "success" : event.registration === "waitlist" ? "warning" : "neutral"}>
            {c.events.registrationStatuses[event.registration]}
          </Badge>
        </div>
        <p className="text-xs text-fg-muted">{pick(event.summary, locale)}</p>
        <div className="mt-auto space-y-1 text-2xs text-fg-subtle">
          <p className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden="true" />{new Date(event.startsAt).toISOString().slice(0, 10)} · {event.timezone}</p>
          <p className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden="true" />{event.location}</p>
          <p>{c.events.capacity}: {event.capacity}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export function TextLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-2xs font-medium text-primary hover:underline">
      {children}
      <ArrowRight className="size-3.5 rtl-flip" aria-hidden="true" />
    </Link>
  );
}