import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { getLocale } from "@eco-nojin/i18n";
import { Alert, Badge, Button, Card, CardBody, CardHeader, DatePicker, EmptyState, Field, Input, useToast } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { pick, targetName } from "../lib/text";
import { formatMoney } from "../lib/money";
import { addDays, addDaysSafe, isValidIsoDate } from "../lib/time";
import { experienceBySlug, stayBySlug } from "../data/tourism";
import { makeBooking, validateExperienceRequest, validateStayRequest } from "../lib/booking";
import { useBookings } from "../store/bookings";
import { PageHeader } from "../components/Cards";
import { SceneArt } from "../components/SceneArt";
import { tourismPath } from "../lib/paths";

/**
 * The route reuses this component when only `kind`/`slug` change. Keying the
 * form on the target guarantees a clean remount: no stale success screen,
 * dates, guests or quote from the previous destination.
 */
export function BookPage() {
  const { kind, slug } = useParams<{ kind: string; slug: string }>();
  return <BookPageForm key={`${kind ?? ""}:${slug ?? ""}`} kind={kind} slug={slug} />;
}

function BookPageForm({ kind, slug }: { kind?: string; slug?: string }) {
  const { locale, tag } = useI18n();
  const calendar = getLocale(locale)?.calendar;
  const c = useTourism();
  const { add } = useBookings();
  const { push } = useToast();
  const navigate = useNavigate();

  const stay = kind === "stay" && slug ? stayBySlug(slug) : undefined;
  const experience = kind === "experience" && slug ? experienceBySlug(slug) : undefined;
  const target = stay ?? experience;

  const initialStart = stay?.calendar[0]?.date ?? "2026-06-15";
  const [done, setDone] = useState(false);
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(addDaysSafe(initialStart, 1));
  const [guests, setGuests] = useState(2);

  if (!target || (!stay && !experience)) {
    return (
      <div>
        <PageHeader title={c.ui.notFoundTitle} subtitle={c.ui.notFoundBody} />
        <div className="mt-5">
          <EmptyState title={c.ui.notFoundTitle} body={c.ui.notFoundBody} action={<Link to={tourismPath("/")} className="text-sm font-medium text-primary hover:underline">{c.ui.backHome}</Link>} />
        </div>
      </div>
    );
  }

  const startValid = isValidIsoDate(start);
  const minEnd = startValid ? addDays(start, 1) : undefined;

  const result = stay
    ? validateStayRequest(stay, start, end, guests)
    : experience
      ? startValid
        ? validateExperienceRequest(experience, guests)
        : { ok: false as const, reason: "invalid-dates" as const }
      : { ok: false as const, reason: "too-many-guests" as const };

  const errorText = result.ok
    ? null
    : result.reason === "invalid-dates"
      ? c.book.invalidDates
      : result.reason === "too-many-guests"
        ? c.book.tooManyGuests
        : result.reason === "closed"
          ? c.experiences.bookingClosed
          : c.book.noAvailability;

  const submit = () => {
    if (!result.ok) return;
    const booking = stay
      ? makeBooking("stay", stay.id, start, end, guests, result.quote)
      : makeBooking("experience", experience!.id, start, start, guests, result.quote);
    add(booking);
    push({ tone: "success", title: c.book.success });
    setDone(true);
  };

  if (done) {
    return (
      <div>
        <PageHeader title={c.book.success} subtitle={c.book.successBody} />
        <Card className="mt-5">
          <CardBody className="space-y-3">
            <Alert tone="success" title={c.book.success}>{c.book.successBody}</Alert>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => navigate(tourismPath("/bookings"))}>{c.book.viewBookings}</Button>
              <Button variant="secondary" onClick={() => { setDone(false); }}>{c.book.request}</Button>
            </div>
            <p className="text-2xs text-fg-subtle">{c.ui.bookingDemoNote}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link to={stay ? `/stays/${stay.slug}` : `/experiences/${experience!.slug}`} className="inline-flex items-center gap-1 text-2xs font-medium text-fg-muted hover:text-fg">
        {c.ui.back}
      </Link>

      <div className="mt-3">
        <PageHeader
          eyebrow={stay ? c.book.stayLabel : c.book.experienceLabel}
          title={targetName(target, locale)}
          subtitle={c.book.subtitle}
          action={<Badge tone="warning">{c.ui.demo}</Badge>}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <SceneArt seed={target.artworkSeed} variant={stay ? "stay" : "nature"} className="h-56 w-full rounded-xl border border-border" label={targetName(target, locale)} />
          <p className="text-sm leading-relaxed text-fg-muted">{pick(target.summary, locale)}</p>

          <Card>
            <CardHeader title={c.book.request} subtitle={c.book.requestNote} />
            <CardBody className="space-y-3">
              {stay ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={c.ui.startDate} htmlFor="book-start" hint={c.book.perNight}>
                    <DatePicker
                      id="book-start"
                      value={start}
                      locale={tag}
                      calendar={calendar}
                      min={undefined}
                      max={end || undefined}
                      onChange={(value) => {
                        setStart(value);
                        // Never run date math on an empty or partial input.
                        if (isValidIsoDate(value) && value >= end) setEnd(addDays(value, 1));
                      }}
                    />
                  </Field>
                  <Field label={c.ui.endDate} htmlFor="book-end">
                    <DatePicker
                      id="book-end"
                      value={end}
                      locale={tag}
                      calendar={calendar}
                      min={minEnd}
                      onChange={setEnd}
                    />
                  </Field>
                </div>
              ) : (
                <Field label={c.ui.date} htmlFor="book-date">
                  <DatePicker
                    id="book-date"
                    value={start}
                    locale={tag}
                    calendar={calendar}
                    onChange={setStart}
                  />
                </Field>
              )}

              <Field label={c.ui.guests} htmlFor="book-guests" hint={`${c.experiences.capacity}: ${stay ? stay.capacity : experience!.capacity}`}>
                <Input
                  id="book-guests"
                  type="number"
                  min={1}
                  max={stay ? stay.capacity : experience!.capacity}
                  value={guests}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setGuests(Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 1);
                  }}
                />
              </Field>

              {errorText ? <Alert tone="warning" title={c.book.demo}>{errorText}</Alert> : null}

              <Button variant="primary" className="w-full" disabled={!result.ok} onClick={submit}>
                {c.book.request}
              </Button>
              <p className="text-2xs text-fg-subtle">{c.ui.bookingDemoNote}</p>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="h-fit">
            <CardHeader title={c.book.quote} />
            <CardBody className="space-y-2">
              {result.ok ? (
                <>
                  <ul className="space-y-1 text-xs">
                    {result.quote.breakdown.map((line) => (
                      <li key={line.label} className="flex justify-between gap-2 text-fg-muted">
                        <span>{line.label}</span>
                        <span className="numeric text-fg">{formatMoney({ amountMinor: line.amountMinor, currency: result.quote.currency }, tag)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
                    <span className="text-fg-muted">{c.book.total}</span>
                    <span className="numeric font-semibold text-fg">{formatMoney({ amountMinor: result.quote.amountMinor, currency: result.quote.currency }, tag)}</span>
                  </div>
                  <p className="text-2xs text-fg-subtle">{c.ui.paymentNotEnabled}</p>
                </>
              ) : (
                <p className="text-xs text-fg-muted">{errorText}</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={c.ui.host} />
            <CardBody>
              <p className="text-xs leading-relaxed text-fg-muted">{c.book.requestNote}</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}