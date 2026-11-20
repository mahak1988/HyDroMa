import { createBrowserRouter } from "react-router-dom";
import { routerBasename } from "@eco-nojin/configuration";
import { MarketLayout } from "./MarketLayout";
import { SellerRoute } from "./guards";
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
 * Route registry. Two changes from the previous flat list:
 *  - `/seller` is wrapped in `SellerRoute`, so stock/finance/orders are gated;
 *  - `*` renders a real 404 instead of silently showing the home page.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <MarketLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "catalog", element: <CatalogPage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "stores", element: <StoresPage /> },
      { path: "p/:slug", element: <ProductPage /> },
      { path: "s/:slug", element: <SellerPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "orders", element: <OrdersPage /> },
      {
        element: <SellerRoute />,
        children: [{ path: "seller", element: <SellerDashboardPage /> }],
      },
      { path: "seller/signin", element: <SellerSignInPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
], { basename: routerBasename(import.meta.env.BASE_URL) });