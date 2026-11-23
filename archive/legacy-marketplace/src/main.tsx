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
import { RealSessionProvider } from "@eco-nojin/auth-client";
import { CartProvider } from "./store/cart";
import { MarketSessionProvider } from "./session/MarketSession";
import { router } from "./app/router";

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing");

const API_BASE: string = import.meta.env.VITE_API_URL ?? "/api";

/**
 * Composition root. The session is real: `RealSessionProvider` talks to the Eco
 * Nojin API and every role decision derives from it.
 */
createRoot(container).render(
  <StrictMode>
    <AppProviders queryClient={createQueryClient()}>
      <ToastProvider>
        <RealSessionProvider baseUrl={API_BASE}>
          <MarketSessionProvider>
            <CartProvider>
              <>
                <RouterProvider router={router} />
                <AppSwitcher current="marketplace" />
              </>
            </CartProvider>
          </MarketSessionProvider>
        </RealSessionProvider>
      </ToastProvider>
    </AppProviders>
  </StrictMode>,
);
