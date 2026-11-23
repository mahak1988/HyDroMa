import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { Alert, Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, useToast } from "@eco-nojin/ui";
import { ProductArt } from "../components/Artwork";
import { PriceTag, ProductCard, StockBadge, VerificationBadge } from "../components/ProductCard";
import { PRODUCTS, categoryById, productBySlug, sellerById } from "../data/catalog";
import { useCart } from "../store/cart";
import { clampQuantity } from "../lib/cart-logic";
import { marketPath } from "../lib/paths";

export function ProductPage() {
  const { slug = "" } = useParams();
  const { t } = useI18n();
  const { add } = useCart();
  const { push } = useToast();
  const product = productBySlug(slug);
  const [quantity, setQuantity] = useState(product?.minOrder ?? 1);

  if (!product) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">{t("market.empty")}</h1>
        <div className="mt-4">
          <EmptyState
            title={t("market.emptyBody")}
            action={<Link to={marketPath("/catalog")} className="text-sm font-medium text-primary hover:underline">{t("market.navCatalog")}</Link>}
          />
        </div>
      </div>
    );
  }

  const seller = sellerById(product.sellerId);
  const category = categoryById(product.categoryId);
  const related = PRODUCTS.filter((item) => item.categoryId === product.categoryId && item.id !== product.id).slice(0, 3);
  const maxQuantity = Math.max(product.minOrder, product.stock);

  return (
    <div>
      <Link to={marketPath("/catalog")} className="inline-flex items-center gap-1.5 text-2xs text-fg-muted hover:text-fg">
        <ArrowLeft className="size-3.5 rtl-flip" aria-hidden="true" />
        {t("market.navCatalog")}
      </Link>

      <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <ProductArt seed={product.artworkSeed} className="w-full rounded-xl border border-border shadow-e2" />
          <div className="mt-3 grid grid-cols-3 gap-2" aria-hidden="true">
            {[1, 2, 3].map((offset) => (
              <ProductArt key={offset} seed={product.artworkSeed + offset} className="h-20 w-full rounded-md border border-border" />
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{category ? t(category.labelKey as TranslationKey) : product.categoryId}</Badge>
            <StockBadge product={product} />
            <Badge tone="warning">{t("market.demo")}</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">{product.name}</h1>
          <p className="mt-1 text-sm text-fg-muted">{product.summary}</p>
          <div className="mt-3 flex items-baseline gap-2">
            <PriceTag product={product} />
            <span className="text-2xs text-fg-subtle">
              {t("market.minOrder")}: {product.minOrder}
            </span>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-fg-muted">{product.description}</p>

          <dl className="mt-4 grid gap-2 text-2xs sm:grid-cols-2">
            <div className="flex justify-between gap-2 rounded-md bg-surface-2 px-3 py-2">
              <dt className="text-fg-subtle">{t("market.stock")}</dt>
              <dd className="numeric text-fg">{product.stock}</dd>
            </div>
            <div className="flex justify-between gap-2 rounded-md bg-surface-2 px-3 py-2">
              <dt className="text-fg-subtle">{t("market.unit")}</dt>
              <dd className="text-fg">{product.unit}</dd>
            </div>
            <div className="flex justify-between gap-2 rounded-md bg-surface-2 px-3 py-2">
              <dt className="text-fg-subtle">{t("market.country")}</dt>
              <dd className="text-fg" dir="ltr">{product.origin}</dd>
            </div>
            <div className="flex justify-between gap-2 rounded-md bg-surface-2 px-3 py-2">
              <dt className="text-fg-subtle">{t("market.shipping")}</dt>
              <dd className="text-fg">{product.shipping}</dd>
            </div>
            {product.season ? (
              <div className="flex justify-between gap-2 rounded-md bg-surface-2 px-3 py-2">
                <dt className="text-fg-subtle">{t("market.availability")}</dt>
                <dd className="text-fg">{product.season}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Field label={t("market.quantity")} htmlFor="product-qty">
              <Input
                id="product-qty"
                type="number"
                min={product.minOrder}
                max={maxQuantity}
                value={quantity}
                onChange={(event) => setQuantity(clampQuantity(product, Number(event.target.value)))}
                className="w-24"
              />
            </Field>
            <Button
              variant="primary"
              disabled={product.stock <= 0}
              onClick={() => {
                add(product, quantity);
                push({ tone: "success", title: t("market.added") });
              }}
            >
              {t("market.addToCart")}
            </Button>
            <Link to={marketPath("/cart")} className="text-xs font-medium text-primary hover:underline">
              {t("market.navCart")}
            </Link>
          </div>

          {product.claims.length ? (
            <div className="mt-5">
              <h2 className="text-2xs font-medium uppercase tracking-wide text-fg-subtle">{t("market.claims" as TranslationKey)}</h2>
              <ul className="mt-2 space-y-1.5">
                {product.claims.map((claim) => (
                  <li key={claim.label} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-fg">{claim.label}</span>
                    <VerificationBadge status={claim.status} />
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-2xs text-fg-subtle">{t("market.localNote")}</p>
            </div>
          ) : null}
        </div>
      </div>

      {seller ? (
        <Card className="mt-6">
          <CardHeader title={t("market.seller")} subtitle={`${seller.country} · ${seller.region}`} action={<VerificationBadge status={seller.verification} />} />
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <Link to={marketPath(`/s/${seller.slug}`)} className="text-sm font-semibold text-fg hover:underline">
                {seller.name}
              </Link>
              <p className="text-2xs text-fg-muted">{seller.summary}</p>
            </div>
            <Link to={marketPath("/cart")} className="inline-flex h-9 items-center rounded-md border border-border-strong bg-surface px-3 text-sm text-fg hover:bg-surface-2">
              {t("market.navCart")}
            </Link>
          </CardBody>
        </Card>
      ) : null}

      {related.length ? (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-fg">{t("market.featured")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6">
        <Alert tone="info" title={t("market.demo")}>
          {t("market.placeOrderNote")}
        </Alert>
      </div>
    </div>
  );
}