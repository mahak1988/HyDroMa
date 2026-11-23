import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Store } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { Badge, Button, Card, CardBody, Input } from "@eco-nojin/ui";
import { ProductArt } from "../components/Artwork";
import { ProductCard, VerificationBadge } from "../components/ProductCard";
import { featuredProducts, featuredSellers, LEAF_CATEGORIES } from "../data/catalog";
import { kindLabelKey } from "../lib/labels";

export function HomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div>
      <section className="market-hero overflow-hidden rounded-xl border border-border px-5 py-10 sm:px-10 sm:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="min-w-0">
            <p className="inline-flex rounded-pill border border-warning/30 bg-warning-soft px-3 py-1 text-2xs font-medium uppercase tracking-wide text-warning-soft-fg">
              {t("market.homeEyebrow")}
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{t("market.homeTitle")}</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-fg-muted">{t("market.homeLead")}</p>
            <form
              className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                const value = new FormData(event.currentTarget).get("q");
                navigate(`/catalog?q=${encodeURIComponent(String(value ?? ""))}`);
              }}
            >
              <label className="sr-only" htmlFor="hero-search">
                {t("market.search")}
              </label>
              <Input id="hero-search" name="q" type="search" placeholder={t("market.searchPlaceholder")} />
              <Button type="submit" variant="primary" icon={<ArrowRight className="size-4 rtl-flip" aria-hidden="true" />}>
                {t("market.navCatalog")}
              </Button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge tone="warning">{t("market.demo")}</Badge>
              <span className="text-2xs text-fg-subtle">{t("market.localNote")}</span>
            </div>
          </div>
          <div aria-hidden="true" className="hidden justify-self-end lg:block">
            <ProductArt seed={7} className="w-[26rem] rounded-xl border border-border shadow-e3" />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-fg">{t("market.categoriesTitle")}</h2>
          <Link to="/catalog" className="text-2xs font-medium text-primary hover:underline">
            {t("market.navCatalog")}
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {LEAF_CATEGORIES.map((category) => (
            <li key={category.id}>
              <Link
                to={`/catalog?category=${category.id}`}
                className="block rounded-md border border-border bg-surface px-3 py-2.5 text-xs text-fg-muted transition-colors hover:border-primary/50 hover:text-fg"
              >
                {t(category.labelKey as TranslationKey)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-fg">{t("market.featured")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-fg">{t("market.featuredSellers")}</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {featuredSellers.map((seller) => (
            <li key={seller.id}>
              <Card>
                <CardBody className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/s/${seller.slug}`} className="flex items-center gap-2 text-sm font-semibold text-fg hover:underline">
                      <Store className="size-4 text-fg-subtle" aria-hidden="true" />
                      {seller.name}
                    </Link>
                    <VerificationBadge status={seller.verification} />
                  </div>
                  <p className="text-2xs text-fg-muted">{seller.summary}</p>
                  <p className="text-2xs text-fg-subtle">
                    {seller.country} · {seller.region} · {t(kindLabelKey(seller.kind))}
                  </p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardBody className="space-y-2">
            <h2 className="text-sm font-semibold text-fg">{t("market.cooperation")}</h2>
            <p className="text-xs text-fg-muted">{t("market.cooperationBody")}</p>
            <Link to="/catalog?category=partnership-offers" className="inline-flex text-2xs font-medium text-primary hover:underline">
              {t("market.navCatalog")}
            </Link>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-2">
            <h2 className="text-sm font-semibold text-fg">{t("market.joinSeller")}</h2>
            <p className="text-xs text-fg-muted">{t("market.joinSellerBody")}</p>
            <Link to="/seller" className="inline-flex text-2xs font-medium text-primary hover:underline">
              {t("market.navSeller")}
            </Link>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}