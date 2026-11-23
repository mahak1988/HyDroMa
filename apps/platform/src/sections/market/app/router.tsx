import { Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@eco-nojin/frontend-core";
import "../styles/index.css";
import { MarketLayout } from "./MarketLayout";
import { SellerRoute } from "./guards";
import { CartProvider } from "../store/cart";
import { MarketSessionProvider } from "../session/MarketSession";
import { HomePage } from "../pages/HomePage";
import { CatalogPage } from "../pages/CatalogPage";
import { CategoriesPage } from "../pages/CategoriesPage";
import { StoresPage } from "../pages/StoresPage";
import { ProductPage } from "../pages/ProductPage";
import { SellerPage } from "../pages/SellerPage";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { OrdersPage } from "../pages/OrdersPage";
import { SellerDashboardPage } from "../pages/SellerDashboardPage";
import { SellerSignInPage } from "../pages/SellerSignInPage";
import { NotFoundPage } from "../pages/NotFoundPage";

/**
 * Marketplace section router (lazy, internal to the platform SPA).
 *
 * The platform's `/market/*` route renders this module behind Suspense. The
 * section owns its TanStack Query client, cart store and market session — the
 * root `RealSessionProvider` is reused, never duplicated.
 */
export default function MarketSectionRouter() {
  return (
    <QueryClientProvider client={createQueryClient()}>
      <MarketSessionProvider>
        <CartProvider>
          <Routes>
            <Route element={<MarketLayout />}>
              <Route index element={<HomePage />} />
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="stores" element={<StoresPage />} />
              <Route path="p/:slug" element={<ProductPage />} />
              <Route path="s/:slug" element={<SellerPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route element={<SellerRoute />}>
                <Route path="seller" element={<SellerDashboardPage />} />
              </Route>
              <Route path="seller/signin" element={<SellerSignInPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </CartProvider>
      </MarketSessionProvider>
    </QueryClientProvider>
  );
}