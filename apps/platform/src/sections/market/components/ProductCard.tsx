import { Link } from "react-router-dom";
import { Badge, Button, Card, CardBody, useToast } from "@eco-nojin/ui";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import type { Product, VerificationStatus } from "@eco-nojin/domain-types";
import { ProductArt } from "./Artwork";
import { formatMoney } from "../lib/money";
import { useCart } from "../store/cart";
import { sellerById } from "../data/catalog";
import { marketPath } from "../lib/paths";

const verificationTone = { verified: "success", pending: "warning", unverified: "danger" } as const;
const verificationKey = {
  verified: "market.sellerVerified",
  pending: "market.sellerPending",
  unverified: "market.sellerUnverified",
} as const;

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const { t } = useI18n();
  return (
    <Badge tone={verificationTone[status]} dot>
      {t(verificationKey[status] as TranslationKey)}
    </Badge>
  );
}

export function PriceTag({ product }: { product: Product }) {
  const { tag } = useI18n();
  return (
    <span className="numeric font-semibold text-fg">
      {formatMoney(product.price, tag)}
      <span className="text-2xs font-normal text-fg-subtle"> / {product.unit}</span>
    </span>
  );
}

export function StockBadge({ product }: { product: Product }) {
  const { t } = useI18n();
  if (product.stock <= 0) return <Badge tone="danger">{t("market.outOfStock")}</Badge>;
  if (product.stock <= 5) return <Badge tone="warning">{t("market.lowStock")}</Badge>;
  return <Badge tone="success">{t("market.inStock")}</Badge>;
}

export function ProductCard({ product }: { product: Product }) {
  const { t } = useI18n();
  const { add } = useCart();
  const { push } = useToast();
  const seller = sellerById(product.sellerId);

  return (
    <Card className="product-card overflow-hidden">
      <Link to={marketPath(`/p/${product.slug}`)} className="block overflow-hidden">
        <ProductArt seed={product.artworkSeed} className="h-40 w-full" />
      </Link>
      <CardBody className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Link to={marketPath(`/p/${product.slug}`)} className="text-sm font-semibold text-fg hover:underline">
            {product.name}
          </Link>
          <StockBadge product={product} />
        </div>
        <p className="text-2xs text-fg-muted">{product.summary}</p>
        {seller ? (
          <Link to={marketPath(`/s/${seller.slug}`)} className="block text-2xs text-primary hover:underline">
            {seller.name}
          </Link>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <PriceTag product={product} />
          <Button
            size="sm"
            variant="primary"
            disabled={product.stock <= 0}
            onClick={() => {
              add(product);
              push({ tone: "success", title: t("market.added") });
            }}
          >
            {t("market.addToCart")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}