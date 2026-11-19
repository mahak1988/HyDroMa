import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LayoutGrid, Rows3 } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { Badge, Button, Card, CardBody, EmptyState, Field, Input, Select } from "@eco-nojin/ui";
import { PriceTag, ProductCard, StockBadge } from "../components/ProductCard";
import { COUNTRIES, LEAF_CATEGORIES, PRODUCTS, SELLERS } from "../data/catalog";
import { filterProducts, type CatalogFilters } from "../lib/filter";

function num(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function CatalogPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const view = params.get("view") === "list" ? "list" : "grid";

  const filters: CatalogFilters = {
    q: params.get("q") ?? undefined,
    category: params.get("category") ?? undefined,
    seller: params.get("seller") ?? undefined,
    country: params.get("country") ?? undefined,
    currency: params.get("currency") ?? undefined,
    min: num(params.get("min")),
    max: num(params.get("max")),
    inStock: params.get("inStock") === "1",
    sort: (params.get("sort") as CatalogFilters["sort"]) ?? "default",
  };

  const results = useMemo(() => filterProducts(PRODUCTS, filters), [params]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-fg">{t("market.catalogTitle")}</h1>
          <p className="mt-1 text-xs text-fg-muted">{t("market.catalogSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xs text-fg-subtle">
            {results.length} {t("market.results")}
          </span>
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={view === "grid"}
            aria-label={t("market.grid")}
            onClick={() => update("view", "grid")}
          >
            <LayoutGrid className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={view === "list"}
            aria-label={t("market.list")}
            onClick={() => update("view", "list")}
          >
            <Rows3 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t("market.search")} htmlFor="cat-q">
            <Input id="cat-q" type="search" value={filters.q ?? ""} onChange={(event) => update("q", event.target.value)} placeholder={t("market.searchPlaceholder")} />
          </Field>
          <Field label={t("market.category")} htmlFor="cat-category">
            <Select id="cat-category" value={filters.category ?? ""} onChange={(event) => update("category", event.target.value)}>
              <option value="">{t("market.clear")}</option>
              {LEAF_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {t(category.labelKey as TranslationKey)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("market.seller")} htmlFor="cat-seller">
            <Select id="cat-seller" value={filters.seller ?? ""} onChange={(event) => update("seller", event.target.value)}>
              <option value="">{t("market.clear")}</option>
              {SELLERS.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("market.country")} htmlFor="cat-country">
            <Select id="cat-country" value={filters.country ?? ""} onChange={(event) => update("country", event.target.value)}>
              <option value="">{t("market.clear")}</option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t("market.priceRange")} htmlFor="cat-currency">
            <div className="flex gap-2">
              <Select id="cat-currency" aria-label="Currency" value={filters.currency ?? ""} onChange={(event) => update("currency", event.target.value)}>
                <option value="">IRR / EUR</option>
                <option value="IRR">IRR</option>
                <option value="EUR">EUR</option>
              </Select>
              <Input aria-label="Minimum price" type="number" min={0} value={params.get("min") ?? ""} onChange={(event) => update("min", event.target.value)} placeholder="min" />
              <Input aria-label="Maximum price" type="number" min={0} value={params.get("max") ?? ""} onChange={(event) => update("max", event.target.value)} placeholder="max" />
            </div>
          </Field>

          <Field label={t("market.sort")} htmlFor="cat-sort">
            <Select id="cat-sort" value={filters.sort ?? "default"} onChange={(event) => update("sort", event.target.value === "default" ? "" : event.target.value)}>
              <option value="default">{t("market.sortNewest")}</option>
              <option value="price-asc">{t("market.sortPriceLow")}</option>
              <option value="price-desc">{t("market.sortPriceHigh")}</option>
            </Select>
          </Field>

          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-xs text-fg">
              <input
                type="checkbox"
                className="size-4 rounded border-border-strong accent-primary"
                checked={Boolean(filters.inStock)}
                onChange={(event) => update("inStock", event.target.checked ? "1" : "")}
              />
              {t("market.availability")}
            </label>
            <Button variant="ghost" size="sm" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
              {t("market.clear")}
            </Button>
          </div>

          {filters.currency ? (
            <p className="self-end text-2xs text-fg-subtle lg:col-span-1">
              {t("market.priceRange")}: {filters.currency}
            </p>
          ) : (
            <p className="self-end text-2xs text-fg-subtle lg:col-span-1">{t("market.mixedCurrency")}</p>
          )}
        </CardBody>
      </Card>

      {results.length === 0 ? (
        <EmptyState title={t("market.empty")} body={t("market.emptyBody")} />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {results.map((product) => (
            <li key={product.id}>
              <Card>
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/p/${product.slug}`} className="text-sm font-semibold text-fg hover:underline">
                      {product.name}
                    </Link>
                    <p className="text-2xs text-fg-muted">{product.summary}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">{product.unit}</Badge>
                    <PriceTag product={product} />
                    <StockBadge product={product} />
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}