import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./layouts/AppShell";
import { RouteErrorPage } from "./RouteErrorPage";

/**
 * Route registry. Every page is lazy so the shell stays small and future apps
 * can be split by feature without touching this file's consumers.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <div className="p-6" />,
    children: [
      {
        index: true,
        lazy: async () => {
          const module = await import("../pages/HomePage");
          return { Component: module.HomePage };
        },
      },
      {
        path: "components",
        lazy: async () => {
          const module = await import("../pages/ComponentsPage");
          return { Component: module.ComponentsPage };
        },
      },
      {
        path: "notifications",
        lazy: async () => {
          const module = await import("../pages/NotificationsPage");
          return { Component: module.NotificationsPage };
        },
      },
      {
        path: "settings",
        lazy: async () => {
          const module = await import("../pages/SettingsPage");
          return { Component: module.SettingsPage };
        },
      },
      {
        path: "*",
        lazy: async () => {
          const module = await import("../pages/NotFoundPage");
          return { Component: module.NotFoundPage };
        },
      },
    ],
  },
]);