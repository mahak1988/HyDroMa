import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader } from "@eco-nojin/ui";
import { PRODUCTS, SELLERS } from "../data/catalog";
import { marketPath } from "../lib/paths";

const COPY = {
  title: { fa: "فروشگاه‌ها و تولیدکنندگان", en: "Stores and producers", ar: "المتاجر والمنتجون" },
  subtitle: {
    fa: "هر فروشنده یک پروندهٔ مستقل دارد و به منظر یا جامعهٔ محلی خود ارجاع می‌دهد.",
    en: "Each seller has its own record and references its landscape or community.",
    ar: "لكل بائع سجل مستقل يشير إلى منظره أو مجتمعه المحلي.",
  },
  products: { fa: "محصول", en: "products", ar: "منتج" },
  verified: { fa: "تأییدشده", en: "Verified", ar: "موثّق" },
  pending: { fa: "در انتظار تأیید", en: "Pending", ar: "قيد التحقق" },
  open: { fa: "مشاهدهٔ فروشگاه", en: "Open store", ar: "فتح المتجر" },
  region: { fa: "منطقه", en: "Region", ar: "المنطقة" },
} as const;

const pick = (locale: string, value: { fa: string; en: string; ar: string }): string =>
  locale === "fa" ? value.fa : locale === "ar" ? value.ar : value.en;

const KIND: Record<string, { fa: string; en: string; ar: string }> = {
  "rural-producer": { fa: "تولیدکنندهٔ روستایی", en: "Rural producer", ar: "منتج ريفي" },
  "nomadic-community": { fa: "جامعهٔ عشایری", en: "Nomadic community", ar: "مجتمع رعوي" },
  cooperative: { fa: "تعاونی", en: "Cooperative", ar: "تعاونية" },
  farm: { fa: "مزرعه", en: "Farm", ar: "مزرعة" },
  workshop: { fa: "کارگاه", en: "Workshop", ar: "ورشة" },
  service: { fa: "خدمات", en: "Service provider", ar: "مقدم خدمة" },
  "local-business": { fa: "کسب‌وکار محلی", en: "Local business", ar: "عمل محلي" },
  "equipment-supplier": { fa: "تأمین تجهیزات", en: "Equipment supplier", ar: "مورد معدات" },
  "service-provider": { fa: "ارائه‌دهندهٔ خدمات", en: "Service provider", ar: "مقدم خدمات" },
  "tourism-operator": { fa: "گردشگری", en: "Tourism operator", ar: "مشغل سياحي" },
};

/** Marketplace page #5: the seller directory. */
export function StoresPage() {
  const { locale, format } = useI18n();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-fg">{pick(locale, COPY.title)}</h1>
        <p className="mt-1 max-w-2xl text-sm text-fg-muted">{pick(locale, COPY.subtitle)}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SELLERS.map((seller) => {
          const count = PRODUCTS.filter((product) => product.sellerId === seller.id).length;
          const kind = KIND[seller.kind] ?? { fa: seller.kind, en: seller.kind, ar: seller.kind };
          const summary = pick(locale, {
            fa: seller.summaryI18n?.fa ?? seller.summary,
            en: seller.summary,
            ar: seller.summaryI18n?.ar ?? seller.summary,
          });
          return (
            <Card key={seller.id}>
              <CardHeader
                title={seller.name}
                subtitle={`${pick(locale, kind)} · ${pick(locale, COPY.region)}: ${seller.region}`}
                action={
                  <Badge tone={seller.verification === "verified" ? "success" : "warning"} dot>
                    {seller.verification === "verified" ? pick(locale, COPY.verified) : pick(locale, COPY.pending)}
                  </Badge>
                }
              />
              <CardBody className="space-y-3">
                <p className="text-xs leading-relaxed text-fg-muted">{summary}</p>
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="neutral">
                    {format.number(count)} {pick(locale, COPY.products)}
                  </Badge>
                  <Link to={marketPath(`/s/${seller.slug}`)} className="text-2xs font-semibold text-primary hover:underline">
                    {pick(locale, COPY.open)} ←
                  </Link>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
