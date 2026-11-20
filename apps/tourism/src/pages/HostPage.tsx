import { Link, useSearchParams } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Avatar, Badge, Button, Card, CardBody, CardHeader, EmptyState, Select, Table, TBody, Td, Th, THead, Tr } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { pick, targetName } from "../lib/text";
import { formatMoney } from "../lib/money";
import { HOSTS, destinationById, experienceById, hostBySellerId, stayById } from "../data/tourism";
import { bookingsForHost } from "../lib/host";
import { useBookings } from "../store/bookings";
import { PageHeader, SectionTitle } from "../components/Cards";
import { HostStudio } from "../components/HostStudio";

export function HostPage() {
  const c = useTourism();
  const { locale, tag } = useI18n();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("host") ?? HOSTS[0]?.sellerId ?? "";
  const host = hostBySellerId(selectedId) ?? HOSTS[0];
  const { bookings, cancel } = useBookings();
  const hostBookings = host ? bookingsForHost(bookings, host) : [];

  if (!host) {
    return (
      <div>
        <PageHeader title={c.host.title} subtitle={c.host.subtitle} />
        <div className="mt-5">
          <EmptyState title={c.host.title} body={c.host.demoNote} />
        </div>
      </div>
    );
  }

  const destinations = host.destinationIds.map(destinationById).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const stays = host.stayIds.map(stayById).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const experiences = host.experienceIds.map(experienceById).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const verificationLabel = host.verification === "verified" ? c.host.verified : host.verification === "pending" ? c.host.pending : c.host.unverified;
  const verificationTone = host.verification === "verified" ? "success" : host.verification === "pending" ? "warning" : "neutral";

  const kpis = [
    { label: c.host.kpiDestinations, value: destinations.length },
    { label: c.host.kpiStays, value: stays.length },
    { label: c.host.kpiExperiences, value: experiences.length },
    { label: c.host.kpiRequests, value: hostBookings.length },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={c.ui.brand}
        title={c.host.title}
        subtitle={c.host.subtitle}
        action={
          <div className="w-56">
            <label className="mb-1 block text-xs font-medium text-fg" htmlFor="host-select">{c.ui.host}</label>
            <Select
              id="host-select"
              value={selectedId}
              onChange={(event) => {
                const next = new URLSearchParams(params);
                next.set("host", event.target.value);
                setParams(next, { replace: true });
              }}
            >
              {HOSTS.map((item) => (
                <option key={item.sellerId} value={item.sellerId}>{pick(item.name, locale)}</option>
              ))}
            </Select>
          </div>
        }
      />

      <p className="mt-3 text-2xs text-fg-subtle">{c.host.demoNote}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardBody className="space-y-1">
              <p className="text-2xs uppercase tracking-wide text-fg-subtle">{kpi.label}</p>
              <p className="kpi-value text-2xl font-semibold text-fg">{kpi.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader title={c.host.listingsTitle} subtitle={c.host.profileTitle} />
            <CardBody className="space-y-4">
              <div>
                <SectionTitle title={c.host.kpiDestinations} />
                <ul className="grid gap-2 sm:grid-cols-2">
                  {destinations.map((destination) => (
                    <li key={destination.id}>
                      <Link to={`/destinations/${destination.slug}`} className="block rounded-md border border-border px-3 py-2 text-sm text-fg hover:border-primary/50">
                        {pick(destination.name, locale)}
                        <span className="block text-2xs text-fg-subtle">{c.destinations.kinds[destination.kind]} · {destination.region}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <SectionTitle title={c.host.kpiStays} />
                {stays.length === 0 ? (
                  <p className="text-xs text-fg-muted">—</p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {stays.map((stay) => (
                      <li key={stay.id}>
                        <Link to={`/stays/${stay.slug}`} className="block rounded-md border border-border px-3 py-2 text-sm text-fg hover:border-primary/50">
                          {pick(stay.name, locale)}
                          <span className="block text-2xs text-fg-subtle">{stay.capacity} {c.ui.guests} · {formatMoney(stay.price, tag)} / {c.ui.perNight}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <SectionTitle title={c.host.kpiExperiences} />
                {experiences.length === 0 ? (
                  <p className="text-xs text-fg-muted">—</p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {experiences.map((experience) => (
                      <li key={experience.id}>
                        <Link to={`/experiences/${experience.slug}`} className="block rounded-md border border-border px-3 py-2 text-sm text-fg hover:border-primary/50">
                          {pick(experience.title, locale)}
                          <span className="block text-2xs text-fg-subtle">{c.experiences.types[experience.type]} · {experience.durationHours} {c.experiences.hours}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardBody>
          </Card>

          <HostStudio host={host} />

          <Card>
            <CardHeader title={c.host.requestsTitle} subtitle={c.bookings.demoNote} />
            <CardBody className="p-0">
              {hostBookings.length === 0 ? (
                <div className="p-5">
                  <EmptyState title={c.host.emptyRequests} body={c.bookings.emptyBody} />
                </div>
              ) : (
                <div className="w-full max-w-full overflow-x-auto">
                <Table caption={c.host.requestsTitle}>
                  <THead>
                    <Tr>
                      <Th>{c.bookings.requestId}</Th>
                      <Th>{c.destinations.filterKind}</Th>
                      <Th>{c.bookings.dates}</Th>
                      <Th>{c.bookings.guests}</Th>
                      <Th>{c.bookings.quote}</Th>
                      <Th>{c.ui.status}</Th>
                      <Th>{c.bookings.cancel}</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {hostBookings.map((booking) => {
                      const target = booking.kind === "stay" ? stayById(booking.targetId) : experienceById(booking.targetId);
                      const name = target ? targetName(target, locale) : booking.targetId;
                      return (
                        <Tr key={booking.id}>
                          <Td><span className="text-fg">{name}</span><span className="block numeric text-2xs text-fg-subtle">{booking.id.slice(-8)}</span></Td>
                          <Td><Badge tone={booking.kind === "stay" ? "info" : "primary"}>{booking.kind === "stay" ? c.bookings.kinds.stay : c.bookings.kinds.experience}</Badge></Td>
                          <Td className="whitespace-nowrap text-2xs">{booking.startDate} â†’ {booking.endDate}</Td>
                          <Td className="numeric">{booking.guests}</Td>
                          <Td className="numeric">{formatMoney(booking.quote, tag)}</Td>
                          <Td><Badge tone="warning">{c.bookings.statuses[booking.status]}</Badge></Td>
                          <Td>
                            <Button variant="ghost" size="sm" onClick={() => cancel(booking.id)}>
                              {c.bookings.cancel}
                            </Button>
                          </Td>
                        </Tr>
                      );
                    })}
                  </TBody>
                </Table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader title={c.host.profileTitle} action={<Badge tone={verificationTone}>{verificationLabel}</Badge>} />
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar name={pick(host.name, locale)} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-fg">{pick(host.name, locale)}</p>
                  <p className="text-2xs text-fg-subtle">{c.host.since}: {host.since}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-fg-muted">{pick(host.bio, locale)}</p>
              <div>
                <p className="text-2xs uppercase tracking-wide text-fg-subtle">{c.host.languages}</p>
                <p className="text-xs text-fg">{host.languages.join(" · ")}</p>
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wide text-fg-subtle">{c.ui.status}</p>
                <p className="text-xs text-fg">{c.host.demoNote}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={c.host.localProducts} action={<Badge tone="neutral">{c.host.localProductsStatus}</Badge>} />
            <CardBody className="space-y-2">
              <p className="text-xs leading-relaxed text-fg-muted">{c.host.localProductsNote}</p>
              <div className="flex flex-wrap gap-1.5">
                {host.localProductRefs.length === 0 ? (
                  <span className="text-2xs text-fg-subtle">—</span>
                ) : (
                  host.localProductRefs.map((ref) => (
                    <span key={ref} className="rounded-pill bg-surface-2 px-2 py-0.5 text-2xs text-fg-muted">{ref}</span>
                  ))
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={c.host.performance} />
            <CardBody className="space-y-2 text-xs text-fg-muted">
              <p className="flex justify-between"><span>{c.host.kpiDestinations}</span><span className="numeric text-fg">{destinations.length}</span></p>
              <p className="flex justify-between"><span>{c.host.kpiStays}</span><span className="numeric text-fg">{stays.length}</span></p>
              <p className="flex justify-between"><span>{c.host.kpiExperiences}</span><span className="numeric text-fg">{experiences.length}</span></p>
              <p className="flex justify-between"><span>{c.host.kpiRequests}</span><span className="numeric text-fg">{hostBookings.length}</span></p>
              <p className="text-2xs text-fg-subtle">{c.host.demoNote}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={c.host.registerTitle} />
            <CardBody className="space-y-2">
              <p className="text-xs leading-relaxed text-fg-muted">{c.host.registerBody}</p>
              <Button variant="secondary" size="sm" disabled>{c.host.join}</Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}




