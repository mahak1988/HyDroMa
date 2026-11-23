import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CartLine, Product } from "@eco-nojin/domain-types";
import { PRODUCTS, SELLERS } from "../data/catalog";
import { addLine, cartCount, groupBySeller, removeLine, setQuantity, totalsByCurrency } from "../lib/cart-logic";

const KEY = "eco.market.cart";

type CartValue = {
  lines: CartLine[];
  groups: ReturnType<typeof groupBySeller>;
  totals: Record<string, number>;
  count: number;
  add: (product: Product, quantity?: number) => void;
  setQty: (product: Product, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

function load(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    return Array.isArray(parsed) ? parsed.filter((line) => PRODUCTS.some((p) => p.id === line.productId)) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      // storage may be blocked; cart still works for the session
    }
  }, [lines]);

  const add = useCallback((product: Product, quantity = product.minOrder) => {
    setLines((current) => addLine(current, product, quantity));
  }, []);

  const setQty = useCallback((product: Product, quantity: number) => {
    setLines((current) => setQuantity(current, product, quantity));
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((current) => removeLine(current, productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(() => {
    const groups = groupBySeller(lines, PRODUCTS, SELLERS);
    return { lines, groups, totals: totalsByCurrency(groups), count: cartCount(lines), add, setQty, remove, clear };
  }, [add, clear, lines, remove, setQty]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}