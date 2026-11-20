import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "@fontsource-variable/lora";
import "@fontsource-variable/vazirmatn";
import "@eco-nojin/design-system/tokens.css";
import "@eco-nojin/design-system/base.css";
import "./styles.css";
import { I18nProvider } from "@eco-nojin/i18n";
import { ThemeProvider } from "@eco-nojin/frontend-core/theme";
import { AppSwitcher } from "@eco-nojin/ui";
import { BrandApp } from "./BrandApp";

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing");

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <>
          <BrandApp />
          <AppSwitcher current="brand" />
        </>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
);