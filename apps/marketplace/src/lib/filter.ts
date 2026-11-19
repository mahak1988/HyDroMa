import type { Product } from "@eco-nojin/domain-types";
import { sellerById } from "../data/catalog";

export type CatalogFilters = {
  q?: string;
  category?: string;
  seller?: string;
  country?: string;
  currency?: string;
  min?: number;
  max?: number;
  inStock?: boolean;
  sort?: "default" | "price-asc" | "price-desc";
};

export function filterProducts(products: Product[], filters: CatalogFilters): Product[] {
  const needle = filters.q?.trim().toLowerCase();
  let result = products.filter((product) => {
    if (filters.category && product.categoryId !== filters.category) return false;
    if (filters.seller && product.sellerId !== filters.seller) return false;
    if (filters.country) {
      const seller = sellerById(product.sellerId);
      if (seller?.country !== filters.country) return false;
    }
    if (filters.currency && product.price.currency !== filters.currency) return false;
    if (filters.inStock && product.stock <= 0) return false;
    if (filters.min !== undefined && product.price.amountMinor < filters.min) return false;
    if (filters.max !== undefined && product.price.amountMinor > filters.max) return false;
    if (needle) {
      const seller = sellerById(product.sellerId);
      const haystack = `${product.name} ${product.summary} ${seller?.name ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  if (filters.sort === "price-asc") result = [...result].sort((a, b) => a.price.amountMinor - b.price.amountMinor);
  if (filters.sort === "price-desc") result = [...result].sort((a, b) => b.price.amountMinor - a.price.amountMinor);
  return result;
}