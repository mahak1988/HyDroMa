import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, ResourceForm, Table, TBody, Td, Th, THead, Tr } from "@eco-nojin/ui";
import { createApiClient } from "@eco-nojin/api-client";
import { useTourism } from "../content";
import { pick } from "../lib/text";
import { formatMoney } from "../lib/money";
import { destinationById, hostBySellerId, stayBySlug } from "../data/tourism";
import { availableOn } from "../lib/availability";
import { BulletList, PageHeader } from "../components/Cards";
import { SceneArt } from "../components/SceneArt";
import { tourismPath } from "../lib/paths";

export function StayPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale, tag } = useI18n();
  const navigate = useNavigate();
  const c = useTourism();
  const stay = slug ? stayBySlug(slug) : undefined;

  if (!stay) {
    return (
      <div>
        <PageHeader title={c.ui.notFoundTitle} subtitle={c.ui.notFoundBody} />
        <div className="mt-5">
          <EmptyState title={c.ui.notFoundTitle} body={c.ui.notFoundBody} action={<Link to={tourismPath("/stays")} className="text-sm font-medium text-primary hover:underline">{c.stays.title}</Link>} />
        </div>
      </div>
    );
  }

  const destination = stay.destinationRef ? destinationById(stay.destinationRef) : undefined;
  const host = stay.hostId ? hostBySellerId(stay.hostId) : undefined;
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryStatus, setInquiryStatus] = useState<string>("");

  return (
    <div>
      <Link to={tourismPath("/stays")} className="inline-flex items-center gap-1 text-2xs font-medium text-fg-muted hover:text-fg">
        <ArrowLeft className="size-3.5 rtl-flip" aria-hidden="true" />
        {c.stays.title}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone="info">{c.stays.kinds[stay.kind]}</Badge>
        <Badge tone="warning">{c.ui.demo}</Badge>
        {stay.landscapeRef ? <Badge tone="neutral">{c.destination.landscapeTitle}: {stay.landscapeRef}</Badge> : null}
        {destination ? (
          <Link to={tourismPath(`/destinations/${destination.slug}`)} className="text-2xs font-medium text-primary hover:underline">
            {pick(destination.name, locale)}
          </Link>
        ) : null}
      </div>
      <div className="mt-2">
        <PageHeader title={pick(stay.name, locale)} subtitle={pick(stay.summary, locale)} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="min-w-0">
          <SceneArt seed={stay.artworkSeed} variant="stay" className="h-64 w-full rounded-xl border border-border" label={pick(stay.name, locale)} />
          <p className="mt-4 text-sm leading-relaxed text-fg-muted">{pick(stay.description, locale)}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Card>
              <CardBody className="space-y-1">
                <p className="text-2xs uppercase tracking-wide text-fg-subtle">{c.stays.capacity}</p>
                <p className="inline-flex items-center gap-1 text-sm font-medium text-fg"><Users className="size-4" aria-hidden="true" />{stay.capacity} {c.ui.guests}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="space-y-1">
                <p className="text-2xs uppercase tracking-wide text-fg-subtle">{c.stays.perNight}</p>
                <p className="text-sm font-medium text-fg">{formatMoney(stay.price, tag)}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="space-y-1">
                <p className="text-2xs uppercase tracking-wide text-fg-subtle">{c.destination.accessTitle}</p>
                <p className="inline-flex items-center gap-1 text-xs text-fg-muted"><MapPin className="size-3.5" aria-hidden="true" />{stay.region} · {stay.country}</p>
              </CardBody>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader title={c.stays.roomTypes} />
            <CardBody className="p-0">
              <Table caption={c.stays.roomTypes}>
                <THead>
                  <Tr>
                    <Th>{c.stays.roomTypes}</Th>
                    <Th>{c.stays.capacity}</Th>
                    <Th>{c.stays.units}</Th>
                    <Th>{c.stays.perNight}</Th>
                  </Tr>
                </THead>
                <TBody>
                  {stay.rooms.map((room) => (
                    <Tr key={room.id}>
                      <Td>{room.name}</Td>
                      <Td className="numeric">{room.capacity}</Td>
                      <Td className="numeric">{room.units}</Td>
                      <Td className="numeric">{formatMoney(room.price, tag)}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </CardBody>
          </Card>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader title={c.stays.amenitiesTitle} />
              <CardBody><BulletList items={stay.amenities} /></CardBody>
            </Card>
            <Card>
              <CardHeader title={c.stays.rulesTitle} />
              <CardBody><BulletList items={stay.houseRules} tone="primary" /></CardBody>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader title={c.stays.calendarTitle} subtitle={c.stays.calendarNote} />
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {stay.calendar.map((day) => {
                  const available = availableOn(stay, day.date);
                  const soldOut = available <= 0;
                  return (
                    <div key={day.date} className={`rounded-md border px-2.5 py-2 ${soldOut ? "border-border bg-surface-2/60" : "border-border bg-surface"}`}>
                      <p className="inline-flex items-center gap-1 text-2xs text-fg-subtle"><CalendarDays className="size-3" aria-hidden="true" />{day.date.slice(5)}</p>
                      <p className={`mt-0.5 text-xs font-medium ${soldOut ? "text-danger" : "text-success"}`}>
                        {soldOut ? c.stays.soldOut : `${available} ${c.stays.available.toLowerCase()}`}
                      </p>
                      <p className="text-2xs text-fg-subtle">{day.booked}/{day.total}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="h-fit">
            <CardHeader title={c.stays.request} action={<Badge tone="warning">{c.ui.demo}</Badge>} />
            <CardBody className="space-y-3">
              <p className="text-xs leading-relaxed text-fg-muted">{c.stays.calendarNote}</p>
              <Button variant="primary" className="w-full" onClick={() => navigate(tourismPath(`/book/stay/${stay.slug}`))}>
                {c.stays.request}
              </Button>
              <p className="text-2xs text-fg-subtle">{c.ui.paymentNotEnabled}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Send inquiry" />
            <CardBody className="space-y-3">
              {!inquiryOpen ? (
                <Button variant="secondary" className="w-full" onClick={() => setInquiryOpen(true)}>
                  Send inquiry
                </Button>
              ) : (
                <ResourceForm
                  fields={[
                    { key: "name", label: "Name", required: true },
                    { key: "email", label: "Email", required: true },
                    { key: "message", label: "Message", type: "textarea", required: true },
                  ]}
                  submitLabel="Send"
                  loading={inquiryStatus === "sending"}
                  onSubmit={async (values) => {
                    setInquiryStatus("sending");
                    try {
                      const api = createApiClient({ baseUrl: "/api" });
                      await api.resources.create("inquiries", { ...values, staySlug: stay.slug });
                      setInquiryStatus("sent");
                      setInquiryOpen(false);
                    } catch (e) {
                      setInquiryStatus(`error: ${String(e)}`);
                    }
                  }}
                  onCancel={() => setInquiryOpen(false)}
                />
              )}
              {inquiryStatus && inquiryStatus !== "sending" ? <p className="text-xs text-fg-muted">{inquiryStatus}</p> : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={c.stays.cancellation} />
            <CardBody><p className="text-xs leading-relaxed text-fg-muted">{stay.cancellation}</p></CardBody>
          </Card>

          <Card>
            <CardHeader title={c.stays.servicesTitle} />
            <CardBody><BulletList items={stay.services} /></CardBody>
          </Card>

          <Card>
            <CardHeader title={c.stays.host} />
            <CardBody>
              {host ? (
                <div className="space-y-1">
                  <Link to={tourismPath(`/host?host=${host.sellerId}`)} className="text-sm font-semibold text-fg hover:underline">{pick(host.name, locale)}</Link>
                  <p className="text-2xs text-fg-muted">{pick(host.bio, locale)}</p>
                </div>
              ) : (
                <p className="text-xs text-fg-muted">—</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

