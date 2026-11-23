import { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader, EmptyState } from "@eco-nojin/ui";
import { formatMoney } from "../lib/money";
import { PRODUCTS, sellerById } from "../data/catalog";
import { loadOrders } from "../store/orders";
import type { OrderStatus } from "@eco-nojin/domain-types";
import { marketPath } from "../lib/paths";

const statusTone: Record<OrderStatus, "neutral" | "primary" | "success" | "warning"> = {
  draft: "neutral",
  placed: "primary",
  preparing: "warning",
  shipped: "primary",
  delivered: "success",
  cancelled: "neutral",
};

export function OrdersPage() {
  const { t, tag, format } = useI18n();
  const [orders] = useState(loadOrders);

  if (orders.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">{t("market.ordersTitle")}</h1>
        <div className="mt-4">
          <EmptyState
            title={t("market.noOrders")}
            body={t("market.noOrdersBody")}
            action={<Link to={marketPath("/catalog")} className="text-sm font-medium text-primary hover:underline">{t("market.navCatalog")}</Link>}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-fg">{t("market.ordersTitle")}</h1>
      <p className="mt-1 text-xs text-fg-muted">{t("market.demoOrderNote")}</p>

      <div className="mt-4 space-y-3">
        {orders.map((order) => {
          const seller = sellerById(order.sellerId);
          return (
            <Card key={order.id}>
              <CardHeader
                title={`${t("market.orderNumber")} ${order.id.slice(-6)}`}
                subtitle={seller?.name ?? order.sellerId}
                action={
                  <div className="flex items-center gap-2">
                    <Badge tone={statusTone[order.status]}>{t(`market.orderStatus.${order.status}` as TranslationKey)}</Badge>
                    <Badge tone="warning">{t("market.demo")}</Badge>
                  </div>
                }
              />
              <CardBody className="space-y-2">
                <ul className="space-y-1 text-xs">
                  {order.lines.map((line) => {
                    const product = PRODUCTS.find((item) => item.id === line.productId);
                    return (
                      <li key={line.productId} className="flex justify-between gap-2">
                        <span className="text-fg">{product?.name ?? line.productId}</span>
                        <span className="numeric text-fg-muted">× {line.quantity}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-2xs text-fg-subtle">
                  <span>
                    {t("market.placedAt")}: {format.dateTime(order.createdAt)}
                  </span>
                  <span className="space-x-2">
                    <span>{t("market.total")}:</span>
                    <span className="numeric font-semibold text-fg">{formatMoney(order.subtotal, tag)}</span>
                  </span>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}