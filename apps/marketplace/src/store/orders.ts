import type { SellerOrder } from "@eco-nojin/domain-types";
import type { CartGroup } from "../lib/cart-logic";

const KEY = "eco.market.orders";

export function loadOrders(): SellerOrder[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as SellerOrder[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrders(orders: SellerOrder[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(orders));
  } catch {
    // storage may be blocked; orders remain in memory for the session
  }
}

/** One cart group becomes one seller order; every order is explicitly marked `demo: true`. */
export function ordersFromGroups(groups: CartGroup[], shippingOption: string): SellerOrder[] {
  return groups.map((group, index) => {
    const subtotal = Object.entries(group.subtotalByCurrency).map(([currency, amount]) => ({ amountMinor: amount, currency }));
    return {
      id: `ord-${Date.now()}-${index + 1}`,
      sellerId: group.seller.id,
      lines: group.lines.map((line) => ({ productId: line.product.id, sellerId: group.seller.id, quantity: line.quantity })),
      shippingOption,
      subtotal: subtotal[0] ?? { amountMinor: 0, currency: "IRR" },
      status: "placed",
      createdAt: new Date().toISOString(),
      demo: true,
    };
  });
}