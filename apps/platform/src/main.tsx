import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource-variable/manrope";
import "@fontsource-variable/lora";
import "@fontsource-variable/vazirmatn";
import "@fontsource-variable/source-serif-4";
import "@eco-nojin/design-system/tokens.css";
import "@eco-nojin/design-system/base.css";
import "./public.css";
import "./styles.css";
import { ThemeProvider } from "@eco-nojin/frontend-core/theme";
import { I18nProvider } from "@eco-nojin/i18n";
import { ToastProvider } from "@eco-nojin/ui";
import { RealSessionProvider } from "@eco-nojin/auth-client";
import { router } from "./app/router";
import { registerServiceWorker } from "./utils/serviceWorker";

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing");

const API_BASE: string = import.meta.env.VITE_API_URL ?? "/api";

// One shared query client for the whole workspace. Failed queries are surfaced
// (not retried into fake success); mutations are never auto-retried.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

// The unified platform: public core at the root, specialised sections behind
// it, one session for everything. The service worker comes from the portal
// heritage and keeps the public shell available offline.
registerServiceWorker();

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <RealSessionProvider baseUrl={API_BASE}>
              <RouterProvider router={router} />
            </RealSessionProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
