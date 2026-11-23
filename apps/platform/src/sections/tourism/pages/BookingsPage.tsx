import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Alert, Badge, Button, Card, CardBody, CardHeader, EmptyState } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { targetName } from "../lib/text";
import { formatMoney } from "../lib/money";
import { experienceById, stayById } from "../data/tourism";
import { useBookings } from "../store/bookings";
import { PageHeader } from "../components/Cards";
import { tourismPath } from "../lib/paths";

export function BookingsPage() {
  const c = useTourism();
  const { locale, tag } = useI18n();
  const { bookings, cancel } = useBookings();

  return (
    <div>
      <PageHeader eyebrow={c.ui.brand} title={c.bookings.title} subtitle={c.bookings.subtitle} action={<Badge tone="warning">{c.ui.demo}</Badge>} />

      <Alert tone="warning" title={c.ui.demo} >{c.bookings.demoNote}</Alert>

      {bookings.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title={c.bookings.empty}
            body={c.bookings.emptyBody}
            action={<Link to={tourismPath("/stays")} className="text-sm font-medium text-primary hover:underline">{c.stays.title}</Link>}
          />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {bookings.map((booking) => {
            const target = booking.kind === "stay" ? stayById(booking.targetId) : experienceById(booking.targetId);
            const name = target ? targetName(target, locale) : booking.targetId;
            const to = target ? (booking.kind === "stay" ? `/stays/${target.slug}` : `/experiences/${target.slug}`) : "/";
            return (
              <Card key={booking.id}>
                <CardHeader
                  title={name}
                  subtitle={`${c.bookings.requestId} ${booking.id.slice(-8)}`}
                  action={<Badge tone="warning">{c.bookings.statuses[booking.status]}</Badge>}
                />
                <CardBody className="space-y-2">
                  <div className="flex flex-wrap gap-2 text-2xs">
                    <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-fg-muted">{booking.kind === "stay" ? c.bookings.kinds.stay : c.bookings.kinds.experience}</span>
                    <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-fg-muted">{c.bookings.dates}: {booking.startDate}{booking.kind === "stay" ? ` â†’ ${booking.endDate}` : ""}</span>
                    <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-fg-muted">{c.bookings.guests}: {booking.guests}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                    <span className="text-xs text-fg-muted">
                      {c.bookings.quote}: <span className="numeric font-semibold text-fg">{formatMoney(booking.quote, tag)}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Link to={to} className="text-2xs font-medium text-primary hover:underline">{c.ui.view}</Link>
                      <Button variant="ghost" size="sm" onClick={() => cancel(booking.id)}>{c.bookings.cancel}</Button>
                    </div>
                  </div>
                  <p className="text-2xs text-fg-subtle">{c.bookings.cancelNote}</p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

