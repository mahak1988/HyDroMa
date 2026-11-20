/**
 * Commerce contracts shared by the marketplace app (and later services).
 * Money is always minor units + ISO currency; floating point is never the source of truth.
 */

export type Money = {
  amountMinor: number;
  currency: string;
};

export type SellerKind =
  | "rural-producer"
  | "nomadic-community"
  | "cooperative"
  | "farm"
  | "workshop"
  | "local-business"
  | "equipment-supplier"
  | "service-provider"
  | "tourism-operator";

export type VerificationStatus = "verified" | "pending" | "unverified";

export type Seller = {
  id: string;
  slug: string;
  name: string;
  kind: SellerKind;
  country: string;
  region: string;
  summary: string;
  /** Optional translations; `summary` stays the English fallback. */
  summaryI18n?: { fa: string; ar: string };
  locale: string;
  verification: VerificationStatus;
  landscapeRef: string | null;
};

export type CategoryNode = {
  id: string;
  labelKey: string;
  parentId: string | null;
};

export type ProductUnit = "kg" | "piece" | "box" | "night" | "service" | "hectare";

export type Product = {
  id: string;
  slug: string;
  sellerId: string;
  categoryId: string;
  name: string;
  summary: string;
  description: string;
  price: Money;
  unit: ProductUnit;
  minOrder: number;
  stock: number;
  season: string | null;
  origin: string;
  shipping: string;
  /** Claims are shown with their verification state; never as certified facts. */
  claims: Array<{ label: string; status: VerificationStatus }>;
  artworkSeed: number;
};

export type CartLine = { productId: string; sellerId: string; quantity: number };

export type SellerOrder = {
  id: string;
  sellerId: string;
  lines: CartLine[];
  shippingOption: string;
  subtotal: Money;
  status: OrderStatus;
  createdAt: string;
  demo: true;
};

export type OrderStatus = "draft" | "placed" | "preparing" | "shipped" | "delivered" | "cancelled";

export type StockMovement = {
  id: string;
  productId: string;
  delta: number;
  reason: "intake" | "sale" | "adjustment";
  at: string;
};