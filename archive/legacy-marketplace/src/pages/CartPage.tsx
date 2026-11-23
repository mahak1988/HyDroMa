import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Input } from "@eco-nojin/ui";
import { ProductArt } from "../components/Artwork";
import { formatMoney } from "../lib/money";
import { useCart } from "../store/cart";

export function CartPage() {
  const { t, tag } = useI18n();
  const { groups, totals, count, setQty, remove } = useCart();

  if (count === 0) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">{t("market.cartTitle")}</h1>
        <div className="mt-4">
          <EmptyState
            title={t("market.cartEmpty")}
            body={t("market.cartEmptyBody")}
            action={
              <Link to="/catalog" className="text-sm font-medium text-primary hover:underline">
                {t("market.navCatalog")}
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const currencies = Object.keys(totals);

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-fg">{t("market.cartTitle")}</h1>
      <p className="mt-1 text-xs text-fg-muted">{t("market.cartSubtitle")}</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.seller.id}>
              <CardHeader title={group.seller.name} subtitle={`${group.seller.country} · ${group.seller.region}`} />
              <CardBody className="space-y-3">
                {group.lines.map(({ product, quantity, lineTotalMinor }) => (
                  <div key={product.id} className="flex flex-wrap items-center gap-3">
                    <ProductArt seed={product.artworkSeed} className="h-14 w-20 rounded-md border border-border" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/p/${product.slug}`} className="text-sm font-medium text-fg hover:underline">
                        {product.name}
                      </Link>
                      <p className="text-2xs text-fg-subtle">
                        {formatMoney(product.price, tag)} / {product.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="sr-only" htmlFor={`qty-${product.id}`}>
                        {t("market.quantity")}
                      </label>
                      <Input
                        id={`qty-${product.id}`}
                        type="number"
                        min={product.minOrder}
                        max={product.stock}
                        value={quantity}
                        onChange={(event) => setQty(product, Number(event.target.value))}
                        className="w-20"
                      />
                      <span className="numeric w-24 text-end text-xs text-fg">
                        {formatMoney({ amountMinor: lineTotalMinor, currency: product.price.currency }, tag)}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => remove(product.id)} aria-label={`${t("market.remove")} ${product.name}`}>
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-2 text-xs">
                  <span className="text-fg-muted">{t("market.subtotal")}</span>
                  <span className="space-x-2">
                    {Object.entries(group.subtotalByCurrency).map(([currency, amount]) => (
                      <span key={currency} className="numeric font-medium text-fg">
                        {formatMoney({ amountMinor: amount, currency }, tag)}
                      </span>
                    ))}
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card className="h-fit">
          <CardHeader title={t("market.total")} />
          <CardBody className="space-y-3">
            <p className="text-2xs text-fg-subtle">{t("market.splitNote")}</p>
            <ul className="space-y-1 text-sm">
              {currencies.map((currency) => (
                <li key={currency} className="flex items-center justify-between gap-2">
                  <span className="text-fg-muted">{currency}</span>
                  <span className="numeric font-semibold text-fg">{formatMoney({ amountMinor: totals[currency] ?? 0, currency }, tag)}</span>
                </li>
              ))}
            </ul>
            {currencies.length > 1 ? <Badge tone="warning">{t("market.mixedCurrency")}</Badge> : null}
            <Link
              to="/checkout"
              className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg transition-colors hover:bg-primary-hover"
            >
              {t("market.checkout")}
            </Link>
            <p className="text-2xs text-fg-subtle">{t("market.paymentNotEnabled")}</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}