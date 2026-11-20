import { StrictMode } from "react";
import { AppSwitcher } from "@eco-nojin/ui";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "@fontsource-variable/lora";
import "@fontsource-variable/vazirmatn";
import "@eco-nojin/design-system/tokens.css";
import "@eco-nojin/design-system/base.css";
import "./styles/index.css";
import { ThemeProvider } from "@eco-nojin/frontend-core/theme";
import { I18nProvider } from "@eco-nojin/i18n";
import { PortalApp } from "./app/PortalApp";
import { registerServiceWorker } from "./utils/serviceWorker";

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing");

registerServiceWorker();

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <>
        <PortalApp />
        <AppSwitcher current="portal" />
      </>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
);