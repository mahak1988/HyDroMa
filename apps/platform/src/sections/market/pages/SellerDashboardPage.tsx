import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Select, Table, TBody, Td, Th, THead, Tr, useToast } from "@eco-nojin/ui";
import { formatMoney } from "../lib/money";
import { PRODUCTS, SELLERS, productsBySeller, sellerById } from "../data/catalog";
import { loadOrders } from "../store/orders";
import { marketPath } from "../lib/paths";

type Movement = { id: string; productId: string; delta: number; at: string };

export function SellerDashboardPage() {
  const { t, tag, format } = useI18n();
  const { push } = useToast();
  const [sellerId, setSellerId] = useState(SELLERS[0]?.id ?? "");
  const seller = sellerById(sellerId);
  const products = productsBySeller(sellerId);

  const [stock, setStock] = useState<Record<string, number>>(() =>
    Object.fromEntries(PRODUCTS.map((product) => [product.id, product.stock])),
  );
  const [movements, setMovements] = useState<Movement[]>([]);
  const orders = useMemo(() => loadOrders().filter((order) => order.sellerId === sellerId), [sellerId, movements]);

  const adjust = (productId: string, delta: number) => {
    setStock((current) => ({ ...current, [productId]: Math.max(0, (current[productId] ?? 0) + delta) }));
    setMovements((current) => [{ id: `mv-${Date.now()}-${productId}`, productId, delta, at: new Date().toISOString() }, ...current].slice(0, 12));
    push({ tone: "info", title: t("market.stockNote") });
  };

  const gross = orders.reduce((sum, order) => sum + order.subtotal.amountMinor, 0);
  const currency = orders[0]?.subtotal.currency ?? "IRR";
  const lowStock = products.filter((product) => (stock[product.id] ?? 0) <= 5).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-fg">{t("market.dashboardTitle")}</h1>
          <p className="mt-1 text-xs text-fg-muted">{t("market.dashboardSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select aria-label={t("market.seller")} value={sellerId} onChange={(event) => setSellerId(event.target.value)} className="w-56">
            {SELLERS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Badge tone="warning">{t("market.demo")}</Badge>
        </div>
      </div>

      <Alert tone="warning" title={t("market.dashboardSubtitle")}>
        {t("market.stockNote")}
      </Alert>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t("market.kpiRevenue"), value: formatMoney({ amountMinor: gross, currency }, tag) },
          { label: t("market.kpiOrders"), value: String(orders.length) },
          { label: t("market.kpiProducts"), value: String(products.length) },
          { label: t("market.kpiLowStock"), value: String(lowStock) },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardBody>
              <p className="text-2xs text-fg-muted">{kpi.label}</p>
              <p className="kpi-value mt-1 text-xl font-semibold text-fg">{kpi.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="min-w-0">
          <CardHeader title={t("market.productsTitle")} subtitle={seller?.name} />
          <CardBody>
            <Table caption={t("market.productsTitle")}>
              <THead>
                <tr>
                  <Th>{t("market.navCatalog")}</Th>
                  <Th>{t("market.priceRange")}</Th>
                  <Th>{t("market.stock")}</Th>
                  <Th>{t("market.stockTitle")}</Th>
                </tr>
              </THead>
              <TBody>
                {products.map((product) => (
                  <Tr key={product.id}>
                    <Td>
                      <Link to={marketPath(`/p/${product.slug}`)} className="text-fg hover:underline">
                        {product.name}
                      </Link>
                    </Td>
                    <Td className="numeric text-fg-muted">{formatMoney(product.price, tag)}</Td>
                    <Td className="numeric">{stock[product.id] ?? 0}</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" aria-label={`${t("market.adjust")} − ${product.name}`} onClick={() => adjust(product.id, -1)}>
                          <Minus className="size-3.5" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label={`${t("market.intake")} + ${product.name}`} onClick={() => adjust(product.id, +1)}>
                          <Plus className="size-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title={t("market.financeTitle")} action={<Badge tone="danger">{t("market.settlementNotConnected")}</Badge>} />
            <CardBody className="space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-fg-muted">{t("market.financeGross")}</span>
                <span className="numeric text-fg">{formatMoney({ amountMinor: gross, currency }, tag)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-fg-muted">{t("market.financeFees")}</span>
                <span className="text-fg-subtle">—</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-fg-muted">{t("market.financeSettlement")}</span>
                <Badge tone="danger">{t("market.settlementNotConnected")}</Badge>
              </div>
              <p className="text-2xs text-fg-subtle">{t("market.paymentNotEnabled")}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t("market.stockTitle")} />
            <CardBody>
              {movements.length === 0 ? (
                <p className="text-2xs text-fg-subtle">{t("market.stockNote")}</p>
              ) : (
                <ul className="space-y-1.5 text-2xs">
                  {movements.slice(0, 6).map((movement) => (
                    <li key={movement.id} className="flex justify-between gap-2">
                      <span className="text-fg">{PRODUCTS.find((item) => item.id === movement.productId)?.name ?? movement.productId}</span>
                      <span className={movement.delta >= 0 ? "numeric text-success" : "numeric text-danger"}>
                        {movement.delta >= 0 ? "+" : ""}
                        {movement.delta}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t("market.messagesTitle")} />
            <CardBody>
              <p className="text-2xs text-fg-subtle">{t("market.messagesEmpty")}</p>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader title={t("market.sellerOrdersTitle")} subtitle={t("market.demoOrderNote")} />
          <CardBody>
            {orders.length === 0 ? (
              <p className="text-2xs text-fg-subtle">{t("market.noOrdersBody")}</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {orders.map((order) => (
                  <li key={order.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="numeric text-fg-subtle">{order.id.slice(-6)}</span>
                    <span className="text-fg">{format.dateTime(order.createdAt)}</span>
                    <span className="numeric text-fg">{formatMoney(order.subtotal, tag)}</span>
                    <Badge tone="primary">{t(`market.orderStatus.${order.status}` as TranslationKey)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}