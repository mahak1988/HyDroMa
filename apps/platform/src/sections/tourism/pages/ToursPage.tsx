import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { EXPERIENCES } from "../data/tourism";
import { formatMoney } from "../lib/money";
import { PageHeader } from "../components/Cards";
import { tourismPath } from "../lib/paths";

const COPY = {
  title: { fa: "تورهای راهنمادار", en: "Guided tours", ar: "جولات مرشدة" },
  subtitle: {
    fa: "تورها همان تجربه‌های جامعه‌محور هستند، با راهنمای محلی، ظرفیت مشخص و تقویم واقعی.",
    en: "Tours are the community-led experiences with a local guide, stated capacity and a real calendar.",
    ar: "الجولات هي التجارب المجتمعية مع مرشد محلي وسعة محددة وتقويم فعلي.",
  },
  duration: { fa: "مدت", en: "Duration", ar: "المدة" },
  hours: { fa: "ساعت", en: "hours", ar: "ساعة" },
  capacity: { fa: "ظرفیت", en: "Capacity", ar: "السعة" },
  people: { fa: "نفر", en: "people", ar: "أشخاص" },
  price: { fa: "قیمت هر نفر", en: "Price per person", ar: "السعر للشخص" },
  book: { fa: "درخواست رزرو", en: "Request booking", ar: "طلب الحجز" },
  request: { fa: "رزرو با درخواست", en: "Booking by request", ar: "حجز بالطلب" },
  difficulty: { fa: "سختی", en: "Difficulty", ar: "الصعوبة" },
  easy: { fa: "آسان", en: "Easy", ar: "سهل" },
  moderate: { fa: "متوسط", en: "Moderate", ar: "متوسط" },
  hard: { fa: "سخت", en: "Demanding", ar: "صعب" },
  demo: { fa: "داده نمایشی", en: "Demo data", ar: "بيانات عرض" },
  demoNote: {
    fa: "همهٔ تورها دادهٔ نمایشی‌اند؛ ظرفیت و قیمت با تأیید میزبان نهایی می‌شود.",
    en: "All tours are demo data; capacity and price are confirmed by the host.",
    ar: "كل الجولات بيانات عرض؛ تؤكد السعة والسعر من المضيف.",
  },
} as const;

const pick = (locale: string, value: { fa: string; en: string; ar: string }): string =>
  locale === "fa" ? value.fa : locale === "ar" ? value.ar : value.en;

const DIFFICULTY_TONE = { easy: "success", moderate: "warning", hard: "danger" } as const;

/** Tourism page #5 of the 120-page map: guided tours. */
export function ToursPage() {
  const c = useTourism();
  const { locale, format } = useI18n();

  return (
    <div>
      <PageHeader
        eyebrow={c.ui.brand}
        title={pick(locale, COPY.title)}
        subtitle={pick(locale, COPY.subtitle)}
      />

      <div className="mt-4 space-y-3">
        {EXPERIENCES.map((tour) => {
          const difficulty = (tour.difficulty ?? "easy") as keyof typeof DIFFICULTY_TONE;
          return (
            <Card key={tour.id}>
              <CardHeader
                title={pick(locale, tour.title)}
                subtitle={pick(locale, tour.summary)}
                action={<Badge tone="warning" dot>{pick(locale, COPY.demo)}</Badge>}
              />
              <CardBody className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                  <div>
                    <dt className="text-2xs text-fg-subtle">{pick(locale, COPY.duration)}</dt>
                    <dd className="font-medium text-fg">
                      {format.number(tour.durationHours)} {pick(locale, COPY.hours)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs text-fg-subtle">{pick(locale, COPY.capacity)}</dt>
                    <dd className="font-medium text-fg">
                      {format.number(tour.capacity)} {pick(locale, COPY.people)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs text-fg-subtle">{pick(locale, COPY.difficulty)}</dt>
                    <dd>
                      <Badge tone={DIFFICULTY_TONE[difficulty] ?? "neutral"}>
                        {pick(locale, COPY[difficulty] ?? COPY.easy)}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs text-fg-subtle">{pick(locale, COPY.price)}</dt>
                    <dd className="font-medium text-fg" dir="auto">
                      {formatMoney(tour.price, locale)}
                    </dd>
                  </div>
                </dl>

                <Link
                  to={tourismPath(`/book/experience/${tour.slug}`)}
                  className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-fg hover:bg-primary-hover"
                >
                  {pick(locale, COPY.book)} ←
                </Link>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <p className="mt-4 text-2xs text-fg-subtle">{pick(locale, COPY.demoNote)}</p>
    </div>
  );
}
