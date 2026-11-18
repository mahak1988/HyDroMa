import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/vazirmatn";
import "@eco-nojin/design-system/tokens.css";
import "@eco-nojin/design-system/base.css";
import "./styles/index.css";
import { ThemeProvider } from "@eco-nojin/frontend-core/theme";
import { I18nProvider } from "@eco-nojin/i18n";
import { PortalApp } from "./app/PortalApp";

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing");

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <PortalApp />
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
);