import { useI18n } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader, EmptyState, Table, TBody, Td, Th, THead, Tr } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { pick } from "../lib/text";
import { EVENTS } from "../data/tourism";
import { EventCard, PageHeader } from "../components/Cards";

export function EventsPage() {
  const c = useTourism();
  const { locale, format } = useI18n();
  const sorted = [...EVENTS].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return (
    <div>
      <PageHeader eyebrow={c.ui.brand} title={c.events.title} subtitle={c.events.subtitle} />

      <p className="mt-3 text-2xs text-fg-subtle">{c.events.calendarNote}</p>

      {sorted.length === 0 ? (
        <div className="mt-5">
          <EmptyState title={c.events.empty} body={c.events.emptyBody} />
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader title={c.events.calendarTitle} subtitle={`${sorted.length} ${c.ui.results}`} />
            <CardBody className="p-0">
              <Table caption={c.events.calendarTitle}>
                <THead>
                  <Tr>
                    <Th>{c.events.date}</Th>
                    <Th>{c.events.title}</Th>
                    <Th>{c.destinations.filterKind}</Th>
                    <Th>{c.events.location}</Th>
                    <Th>{c.events.capacity}</Th>
                    <Th>{c.events.registration}</Th>
                  </Tr>
                </THead>
                <TBody>
                  {sorted.map((event) => (
                    <Tr key={event.id}>
                      <Td className="whitespace-nowrap">
                        <span className="text-fg">{format.date(event.startsAt)}</span>
                        <span className="block text-2xs text-fg-subtle">{event.timezone}</span>
                      </Td>
                      <Td>
                        <span className="font-medium text-fg">{pick(event.title, locale)}</span>
                        <span className="block text-2xs text-fg-muted">{pick(event.summary, locale)}</span>
                      </Td>
                      <Td>
                        <Badge tone="primary">{c.events.types[event.type]}</Badge>
                      </Td>
                      <Td>{event.location}</Td>
                      <Td className="numeric">{event.capacity}</Td>
                      <Td>
                        <Badge tone={event.registration === "open" ? "success" : event.registration === "waitlist" ? "warning" : "neutral"}>
                          {c.events.registrationStatuses[event.registration]}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}