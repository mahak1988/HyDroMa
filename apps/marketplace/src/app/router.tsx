import { createBrowserRouter } from "react-router-dom";
import { MarketLayout } from "./MarketLayout";
import { HomePage } from "../pages/HomePage";
import { CatalogPage } from "../pages/CatalogPage";
import { ProductPage } from "../pages/ProductPage";
import { SellerPage } from "../pages/SellerPage";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { OrdersPage } from "../pages/OrdersPage";
import { SellerDashboardPage } from "../pages/SellerDashboardPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MarketLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "catalog", element: <CatalogPage /> },
      { path: "p/:slug", element: <ProductPage /> },
      { path: "s/:slug", element: <SellerPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "seller", element: <SellerDashboardPage /> },
      { path: "*", element: <HomePage /> },
    ],
  },
]);