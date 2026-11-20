import { StrictMode } from "react";
import { AppSwitcher } from "@eco-nojin/ui";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "@fontsource-variable/nunito-sans";
import "@fontsource-variable/vazirmatn";
import "@eco-nojin/design-system/tokens.css";
import "@eco-nojin/design-system/base.css";
import "./styles/index.css";
import { AppProviders, createQueryClient } from "@eco-nojin/frontend-core";
import { ToastProvider } from "@eco-nojin/ui";
import { CartProvider } from "./store/cart";
import { MarketSessionProvider } from "./session/MarketSession";
import { router } from "./app/router";

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing");

/**
 * Composition root. `AppProviders` gives theme, i18n and the query cache — the
 * catalog is now read through TanStack Query, so the provider is required.
 */
createRoot(container).render(
  <StrictMode>
    <AppProviders queryClient={createQueryClient()}>
      <ToastProvider>
        <MarketSessionProvider>
          <CartProvider>
            <>
              <RouterProvider router={router} />
              <AppSwitcher current="marketplace" />
            </>
          </CartProvider>
        </MarketSessionProvider>
      </ToastProvider>
    </AppProviders>
  </StrictMode>,
);