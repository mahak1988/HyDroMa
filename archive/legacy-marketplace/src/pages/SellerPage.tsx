import { Link, useParams } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { kindLabelKey } from "../lib/labels";
import { Badge, Card, CardBody, EmptyState } from "@eco-nojin/ui";
import { ProductCard, VerificationBadge } from "../components/ProductCard";
import { sellerBySlug, productsBySeller } from "../data/catalog";

export function SellerPage() {
  const { slug = "" } = useParams();
  const { t } = useI18n();
  const seller = sellerBySlug(slug);

  if (!seller) {
    return (
      <EmptyState
        title={t("market.empty")}
        body={t("market.emptyBody")}
        action={<Link to="/catalog" className="text-sm font-medium text-primary hover:underline">{t("market.navCatalog")}</Link>}
      />
    );
  }

  const products = productsBySeller(seller.id);

  return (
    <div>
      <Card>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-fg">{seller.name}</h1>
              <p className="mt-1 text-xs text-fg-muted">{seller.summary}</p>
            </div>
            <VerificationBadge status={seller.verification} />
          </div>
          <div className="flex flex-wrap gap-2 text-2xs">
            <Badge tone="neutral">{t("market.sellerKinds")}: {t(kindLabelKey(seller.kind))}</Badge>
            <Badge tone="neutral">{seller.country} · {seller.region}</Badge>
            {seller.landscapeRef ? (
              <Badge tone="primary">
                {t("market.sellerLandscape")}: <span dir="ltr">{seller.landscapeRef}</span>
              </Badge>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-semibold text-fg">{t("market.sellerProducts")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}