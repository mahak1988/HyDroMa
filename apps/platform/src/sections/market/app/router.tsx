import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@eco-nojin/frontend-core";
import "../styles/index.css";
import { MarketLayout } from "./MarketLayout";
import { SellerRoute } from "./guards";
import { CartProvider } from "../store/cart";
import { MarketSessionProvider } from "../session/MarketSession";

function page(loader: () => Promise<unknown>) {
  return lazy(async () => {
    const module = (await loader()) as Record<string, unknown>;
    return { default: module[Object.keys(module)[0]!] as React.ComponentType };
  });
}

const HomePage = page(() => import("../pages/HomePage"));
const CatalogPage = page(() => import("../pages/CatalogPage"));
const CategoriesPage = page(() => import("../pages/CategoriesPage"));
const StoresPage = page(() => import("../pages/StoresPage"));
const ProductPage = page(() => import("../pages/ProductPage"));
const SellerPage = page(() => import("../pages/SellerPage"));
const CartPage = page(() => import("../pages/CartPage"));
const CheckoutPage = page(() => import("../pages/CheckoutPage"));
const OrdersPage = page(() => import("../pages/OrdersPage"));
const SellerDashboardPage = page(() => import("../pages/SellerDashboardPage"));
const SellerSignInPage = page(() => import("../pages/SellerSignInPage"));
const NotFoundPage = page(() => import("../pages/NotFoundPage"));

function Loading() {
  return (
    <div role="status" aria-live="polite" className="p-6 text-sm text-fg-muted">
      …
    </div>
  );
}

/**
 * Marketplace section router (lazy, internal to the platform SPA).
 *
 * The platform's `/market/*` route renders this module behind Suspense. Pages
 * are lazy chunks of their own so the section entry stays small; the section
 * owns its TanStack Query client, cart store and market session — the root
 * `RealSessionProvider` is reused, never duplicated.
 */
export default function MarketSectionRouter() {
  const load = (Page: React.ComponentType) => (
    <Suspense fallback={<Loading />}>
      <Page />
    </Suspense>
  );

  return (
    <QueryClientProvider client={createQueryClient()}>
      <MarketSessionProvider>
        <CartProvider>
          <Routes>
            <Route element={<MarketLayout />}>
              <Route index element={load(HomePage)} />
              <Route path="catalog" element={load(CatalogPage)} />
              <Route path="categories" element={load(CategoriesPage)} />
              <Route path="stores" element={load(StoresPage)} />
              <Route path="p/:slug" element={load(ProductPage)} />
              <Route path="s/:slug" element={load(SellerPage)} />
              <Route path="cart" element={load(CartPage)} />
              <Route path="checkout" element={load(CheckoutPage)} />
              <Route path="orders" element={load(OrdersPage)} />
              <Route element={<SellerRoute />}>
                <Route path="seller" element={load(SellerDashboardPage)} />
              </Route>
              <Route path="seller/signin" element={load(SellerSignInPage)} />
              <Route path="*" element={load(NotFoundPage)} />
            </Route>
          </Routes>
        </CartProvider>
      </MarketSessionProvider>
    </QueryClientProvider>
  );
}