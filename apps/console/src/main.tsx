import { StrictMode } from "react";
import { AppSwitcher } from "@eco-nojin/ui";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "@fontsource-variable/manrope";
import "@fontsource-variable/vazirmatn";
import "@eco-nojin/design-system/tokens.css";
import "@eco-nojin/design-system/base.css";
import "./styles/index.css";
import { router } from "./app/router";
import { AppProviders, createQueryClient } from "@eco-nojin/frontend-core";
import { ShellErrorBoundary } from "./app/ShellErrorBoundary";
import { DemoSessionProvider } from "./session/DemoSession";

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing");

const queryClient = createQueryClient();

createRoot(container).render(
  <StrictMode>
    <AppProviders queryClient={queryClient}>
      <DemoSessionProvider>
        <ShellErrorBoundary>
          <>
          <RouterProvider router={router} />
          <AppSwitcher current="console" />
        </>
        </ShellErrorBoundary>
      </DemoSessionProvider>
    </AppProviders>
  </StrictMode>,
);