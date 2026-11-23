import { keepPreviousData, queryKeysFactory, useQuery } from "@eco-nojin/frontend-core";
import type { Product, Seller } from "@eco-nojin/domain-types";
import { PRODUCTS, SELLERS, productBySlug, sellerBySlug } from "../../data/catalog";
import { filterProducts, type CatalogFilters } from "../../lib/filter";

/**
 * Marketplace query keys + read hooks.
 *
 * The catalog is static fixture data today, but it is read *through* TanStack
 * Query so that when an API exists only the query functions change: every
 * screen keeps caching, deduplication, `keepPreviousData` and invalidation.
 */
export const marketKeys = {
  products: queryKeysFactory("products"),
  sellers: queryKeysFactory("sellers"),
  categories: queryKeysFactory("categories"),
};

export type ProductListArgs = {
  filters: CatalogFilters;
};

export function useProducts({ filters }: ProductListArgs) {
  return useQuery({
    queryKey: marketKeys.products.list(filters),
    queryFn: () => filterProducts(PRODUCTS, filters) as Product[],
    placeholderData: keepPreviousData,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: marketKeys.products.detail(slug),
    queryFn: () => productBySlug(slug) ?? null,
    enabled: Boolean(slug),
  });
}

export function useSeller(slug: string) {
  return useQuery({
    queryKey: marketKeys.sellers.detail(slug),
    queryFn: () => sellerBySlug(slug) ?? null,
    enabled: Boolean(slug),
  });
}

export function useSellers() {
  return useQuery({
    queryKey: marketKeys.sellers.lists(),
    queryFn: () => SELLERS as Seller[],
  });
}