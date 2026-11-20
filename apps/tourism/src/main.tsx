import { StrictMode } from "react";
import { AppSwitcher } from "@eco-nojin/ui";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "@fontsource-variable/nunito-sans";
import "@fontsource-variable/vazirmatn";
import "@fontsource-variable/lora";
import "@eco-nojin/design-system/tokens.css";
import "@eco-nojin/design-system/base.css";
import "./styles/index.css";
import { ThemeProvider } from "@eco-nojin/frontend-core/theme";
import { I18nProvider } from "@eco-nojin/i18n";
import { ToastProvider } from "@eco-nojin/ui";
import { BookingProvider } from "./store/bookings";
import { TourismSessionProvider } from "./session/TourismSession";
import { router } from "./app/router";

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing");

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <TourismSessionProvider>
            <BookingProvider>
              <>
                <RouterProvider router={router} />
                <AppSwitcher current="tourism" />
              </>
            </BookingProvider>
          </TourismSessionProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
);