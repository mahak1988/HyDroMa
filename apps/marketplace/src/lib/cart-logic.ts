import type { CartLine, Product, Seller } from "@eco-nojin/domain-types";

export type CartGroup = {
  seller: Seller;
  lines: Array<{ product: Product; quantity: number; lineTotalMinor: number }>;
  subtotalByCurrency: Record<string, number>;
};

/** Quantity is clamped to [minOrder, stock]; stock changes cannot create impossible carts. */
export function clampQuantity(product: Product, quantity: number): number {
  const minimum = Math.max(1, product.minOrder);
  const maximum = Math.max(minimum, product.stock);
  return Math.min(maximum, Math.max(minimum, Math.round(quantity)));
}

export function addLine(
  state: CartLine[],
  product: Product,
  quantity: number,
): CartLine[] {
  if (product.stock <= 0) return state;
  const next = clampQuantity(product, quantity);
  const existing = state.find((line) => line.productId === product.id);
  if (existing) {
    return state.map((line) =>
      line.productId === product.id ? { ...line, quantity: clampQuantity(product, line.quantity + next) } : line,
    );
  }
  return [...state, { productId: product.id, sellerId: product.sellerId, quantity: next }];
}

export function setQuantity(state: CartLine[], product: Product, quantity: number): CartLine[] {
  return state.map((line) =>
    line.productId === product.id ? { ...line, quantity: clampQuantity(product, quantity) } : line,
  );
}

export function removeLine(state: CartLine[], productId: string): CartLine[] {
  return state.filter((line) => line.productId !== productId);
}

/** One cart → one order per seller. This is the core multi-seller rule. */
export function groupBySeller(state: CartLine[], products: Product[], sellers: Seller[]): CartGroup[] {
  const groups = new Map<string, CartGroup>();
  for (const line of state) {
    const product = products.find((item) => item.id === line.productId);
    const seller = sellers.find((item) => item.id === line.sellerId);
    if (!product || !seller) continue;
    const group = groups.get(seller.id) ?? { seller, lines: [], subtotalByCurrency: {} };
    const lineTotalMinor = product.price.amountMinor * line.quantity;
    group.lines.push({ product, quantity: line.quantity, lineTotalMinor });
    group.subtotalByCurrency[product.price.currency] =
      (group.subtotalByCurrency[product.price.currency] ?? 0) + lineTotalMinor;
    groups.set(seller.id, group);
  }
  return [...groups.values()];
}

export function totalsByCurrency(groups: CartGroup[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const group of groups) {
    for (const [currency, amount] of Object.entries(group.subtotalByCurrency)) {
      totals[currency] = (totals[currency] ?? 0) + amount;
    }
  }
  return totals;
}

export function cartCount(state: CartLine[]): number {
  return state.reduce((sum, line) => sum + line.quantity, 0);
}