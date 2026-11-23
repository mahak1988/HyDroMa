import { RouterProvider } from "react-router-dom";
import { AppSwitcher } from "@eco-nojin/ui";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import "@fontsource-variable/manrope";
import "@fontsource-variable/vazirmatn";
import "@eco-nojin/design-system/tokens.css";
import "@eco-nojin/design-system/base.css";
import "./styles.css";
import { ThemeProvider } from "@eco-nojin/frontend-core/theme";
import { I18nProvider } from "@eco-nojin/i18n";
import { ToastProvider } from "@eco-nojin/ui";
import { router } from "./app/router";

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing");

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <>
            <RouterProvider router={router} />
            <AppSwitcher current="home" />
          </>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
);