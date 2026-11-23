import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BedDouble, CalendarDays, FlaskConical, Landmark, Map, Sprout, Store, Tent, Trees, Users } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Button, Card, CardBody, Input } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { pick } from "../lib/text";
import { DESTINATIONS, EVENTS, EXPERIENCES, HOSTS, NOMADIC_COMMUNITIES, STAYS } from "../data/tourism";
import { DestinationCard, EventCard, ExperienceCard, SectionTitle, StayCard, TextLink } from "../components/Cards";
import { SceneArt } from "../components/SceneArt";
import { tourismPath } from "../lib/paths";

const THEMES = [
  { key: "rural", labelKey: "ruralTitle", to: "/destinations?kind=village", icon: Landmark },
  { key: "nomadic", labelKey: "nomadicTitle", to: "/nomadic", icon: Tent },
  { key: "nature", labelKey: "natureTitle", to: "/destinations?kind=natural-area", icon: Trees },
  { key: "agri", labelKey: "agriTitle", to: "/experiences?type=agri", icon: Sprout },
  { key: "cultural", labelKey: "culturalTitle", to: "/destinations?kind=cultural-area", icon: Landmark },
  { key: "stays", labelKey: "staysTitle", to: "/stays", icon: BedDouble },
  { key: "science", labelKey: "scienceTitle", to: "/experiences?type=scientific", icon: FlaskConical },
  { key: "events", labelKey: "eventsTitle", to: "/events", icon: CalendarDays },
] as const;

export function HomePage() {
  const { locale } = useI18n();
  const c = useTourism();
  const navigate = useNavigate();
  const featured = DESTINATIONS.slice(0, 6);
  const stays = STAYS.slice(0, 3);
  const experiences = EXPERIENCES.slice(0, 3);
  const events = EVENTS.slice(0, 3);
  const hosts = HOSTS.slice(0, 3);

  return (
    <div>
      <section className="tourism-hero overflow-hidden rounded-xl border border-border px-5 py-10 sm:px-10 sm:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div className="min-w-0">
            <p className="inline-flex rounded-pill border border-primary/25 bg-primary-soft px-3 py-1 text-2xs font-medium uppercase tracking-wide text-primary-soft-fg">
              {c.home.eyebrow}
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{c.home.title}</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-fg-muted">{c.home.lead}</p>
            <form
              className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                const value = new FormData(event.currentTarget).get("q");
                navigate(tourismPath(`/destinations?q=${encodeURIComponent(String(value ?? ""))}`));
              }}
            >
              <label className="sr-only" htmlFor="hero-search">
                {c.home.searchTitle}
              </label>
              <Input id="hero-search" name="q" type="search" placeholder={c.ui.searchPlaceholder} />
              <Button type="submit" variant="primary" icon={<ArrowRight className="size-4 rtl-flip" aria-hidden="true" />}>
                {c.home.explore}
              </Button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge tone="warning">{c.ui.demo}</Badge>
              <span className="text-2xs text-fg-subtle">{c.ui.demoNote}</span>
            </div>
          </div>
          <div aria-hidden="true" className="hidden justify-self-end lg:block">
            <SceneArt seed={101} variant="nature" className="w-[28rem] rounded-xl border border-border shadow-e3" label={c.home.title} />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle title={c.home.searchTitle} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {THEMES.map((theme) => (
            <Link
              key={theme.key}
              to={theme.to}
              className="group flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-3 text-sm text-fg-muted transition-colors hover:border-primary/50 hover:text-fg"
            >
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-soft-fg">
                <theme.icon className="size-4" />
              </span>
              <span className="min-w-0 truncate">{c.home[theme.labelKey]}</span>
            </Link>
          ))}
        </div>
        <p className="mt-2 text-2xs text-fg-subtle">{c.home.searchBody}</p>
      </section>

      <section className="mt-9">
        <SectionTitle title={c.home.destinationsTitle} action={<TextLink to={tourismPath("/destinations")}>{c.ui.view}</TextLink>} />
        <p className="mb-3 max-w-2xl text-xs text-fg-muted">{c.home.destinationsBody}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((destination) => (
            <DestinationCard key={destination.id} destination={destination} />
          ))}
        </div>
      </section>

      <section className="mt-9">
        <SectionTitle title={c.home.nomadicTitle} action={<TextLink to={tourismPath("/nomadic")}>{c.ui.view}</TextLink>} />
        <p className="mb-3 max-w-2xl text-xs text-fg-muted">{c.home.nomadicBody}</p>
        <Card>
          <CardBody className="grid items-center gap-4 sm:grid-cols-[1fr_14rem]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="warning">{c.destinations.kinds["nomadic-territory"]}</Badge>
                <Badge tone="success">{c.nomadic.consentGranted}</Badge>
              </div>
              <h3 className="mt-2 text-base font-semibold text-fg">{pick(NOMADIC_COMMUNITIES[0]!.name, locale)}</h3>
              <p className="mt-1 text-xs text-fg-muted">{pick(NOMADIC_COMMUNITIES[0]!.summary, locale)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => navigate(tourismPath("/nomadic/taleghan-migration"))}>
                  {c.nomadic.openDetail}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate(tourismPath("/map"))}>
                  {c.ui.map}
                </Button>
              </div>
            </div>
            <SceneArt seed={21} variant="nomadic" className="h-36 w-full rounded-lg" label={pick(NOMADIC_COMMUNITIES[0]!.name, locale)} />
          </CardBody>
        </Card>
      </section>

      <section className="mt-9">
        <SectionTitle title={c.stays.title} action={<TextLink to={tourismPath("/stays")}>{c.ui.view}</TextLink>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stays.map((stay) => (
            <StayCard key={stay.id} stay={stay} />
          ))}
        </div>
      </section>

      <section className="mt-9">
        <SectionTitle title={c.experiences.title} action={<TextLink to={tourismPath("/experiences")}>{c.ui.view}</TextLink>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
          ))}
        </div>
      </section>

      <section className="mt-9">
        <SectionTitle title={c.home.eventsTitle} action={<TextLink to={tourismPath("/events")}>{c.ui.view}</TextLink>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      <section className="mt-9">
        <SectionTitle title={c.home.hostsTitle} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hosts.map((host) => (
            <Card key={host.sellerId}>
              <CardBody className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Link to={tourismPath(`/host?host=${host.sellerId}`)} className="inline-flex items-center gap-2 text-sm font-semibold text-fg hover:underline">
                    <Users className="size-4 text-fg-subtle" aria-hidden="true" />
                    {pick(host.name, locale)}
                  </Link>
                  <Badge tone={host.verification === "verified" ? "success" : host.verification === "pending" ? "warning" : "neutral"}>
                    {host.verification === "verified" ? c.host.verified : host.verification === "pending" ? c.host.pending : c.host.unverified}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-2xs text-fg-muted">{pick(host.bio, locale)}</p>
                <p className="text-2xs text-fg-subtle">{c.host.since}: {host.since} · {host.languages.join(", ")}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-9 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardBody className="space-y-2">
            <h2 className="text-sm font-semibold text-fg">{c.home.mapTitle}</h2>
            <p className="text-xs text-fg-muted">{c.home.mapBody}</p>
            <Button variant="secondary" size="sm" icon={<Map className="size-4" aria-hidden="true" />} onClick={() => navigate(tourismPath("/map"))}>
              {c.ui.map}
            </Button>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-fg">{c.marketplace.title}</h2>
              <Badge tone="neutral">{c.marketplace.status}</Badge>
            </div>
            <p className="text-xs text-fg-muted">{c.marketplace.body}</p>
            <span className="inline-flex items-center gap-1 text-2xs text-fg-subtle">
              <Store className="size-3.5" aria-hidden="true" />
              {c.marketplace.link}
            </span>
          </CardBody>
        </Card>
      </section>

      <section className="mt-9">
        <Card className="tourism-hero">
          <CardBody className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-fg">{c.home.hostCtaTitle}</h2>
              <p className="mt-1 max-w-2xl text-xs text-fg-muted">{c.home.hostCtaBody}</p>
            </div>
            <Button variant="primary" onClick={() => navigate(tourismPath("/host"))} icon={<ArrowRight className="size-4 rtl-flip" aria-hidden="true" />}>
              {c.home.hostCtaAction}
            </Button>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

