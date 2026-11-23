import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Alert, Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Select, useToast } from "@eco-nojin/ui";
import { formatMoney } from "../lib/money";
import { useCart } from "../store/cart";
import { loadOrders, ordersFromGroups, saveOrders } from "../store/orders";
import { marketPath } from "../lib/paths";

const SHIPPING = [
  { id: "standard", labelKey: "market.shippingDemo" },
  { id: "pickup", labelKey: "market.shippingDemo" },
] as const;

export function CheckoutPage() {
  const { t, tag } = useI18n();
  const { groups, count, clear } = useCart();
  const navigate = useNavigate();
  const { push } = useToast();
  const [shipping, setShipping] = useState("standard");

  if (count === 0) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">{t("market.checkoutTitle")}</h1>
        <div className="mt-4">
          <EmptyState
            title={t("market.cartEmpty")}
            body={t("market.cartEmptyBody")}
            action={<Link to={marketPath("/catalog")} className="text-sm font-medium text-primary hover:underline">{t("market.navCatalog")}</Link>}
          />
        </div>
      </div>
    );
  }

  const place = () => {
    const orders = ordersFromGroups(groups, shipping);
    saveOrders([...loadOrders(), ...orders]);
    clear();
    push({ tone: "success", title: t("market.orderPlaced") });
    navigate(marketPath("/orders"));
  };

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-fg">{t("market.checkoutTitle")}</h1>
      <p className="mt-1 text-xs text-fg-muted">{t("market.checkoutSubtitle")}</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.seller.id}>
              <CardHeader title={group.seller.name} subtitle={`${group.lines.length} ${t("market.items")}`} />
              <CardBody className="space-y-3">
                <ul className="space-y-1.5 text-xs">
                  {group.lines.map(({ product, quantity, lineTotalMinor }) => (
                    <li key={product.id} className="flex justify-between gap-2">
                      <span className="text-fg">
                        {product.name} × <span className="numeric">{quantity}</span>
                      </span>
                      <span className="numeric text-fg-muted">
                        {formatMoney({ amountMinor: lineTotalMinor, currency: product.price.currency }, tag)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
                  <Field label={t("market.shippingOption")} htmlFor={`ship-${group.seller.id}`}>
                    <Select id={`ship-${group.seller.id}`} value={shipping} onChange={(event) => setShipping(event.target.value)}>
                      {SHIPPING.map((option) => (
                        <option key={option.id} value={option.id}>
                          {t(option.labelKey)} · {option.id}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div className="ms-auto text-end">
                    <p className="text-2xs text-fg-subtle">{t("market.subtotal")}</p>
                    <p className="space-x-2 text-sm font-semibold">
                      {Object.entries(group.subtotalByCurrency).map(([currency, amount]) => (
                        <span key={currency} className="numeric text-fg">
                          {formatMoney({ amountMinor: amount, currency }, tag)}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card className="h-fit">
          <CardHeader title={t("market.placeOrder")} action={<Badge tone="warning">{t("market.demo")}</Badge>} />
          <CardBody className="space-y-3">
            <Alert tone="warning" title={t("market.demo")}>
              {t("market.paymentNotEnabled")}
            </Alert>
            <p className="text-2xs text-fg-subtle">{t("market.placeOrderNote")}</p>
            <Button variant="primary" className="w-full" onClick={place}>
              {t("market.placeOrder")}
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}