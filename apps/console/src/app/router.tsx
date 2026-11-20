import { createBrowserRouter } from "react-router-dom";
import { routerBasename } from "@eco-nojin/configuration";
import type { RouteRequirement } from "@eco-nojin/domain-types";
import { AppShell } from "./layouts/AppShell";
import { RouteErrorPage } from "./RouteErrorPage";

/**
 * Route registry. Every page is lazy so the shell stays small and future apps
 * can be split by feature without touching this file's consumers.
 *
 * Each route carries `handle.permissions` — a declarative requirement that
 * `RoutePermissionGuard` enforces. Nav and route can no longer drift apart: the
 * same requirement drives both.
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
        handle: { labelKey: "nav.components" } satisfies RouteRequirement,
        lazy: async () => {
          const module = await import("../pages/ComponentsPage");
          return { Component: module.ComponentsPage };
        },
      },
      {
        path: "organizations",
        handle: { permissions: "org.read" } satisfies RouteRequirement,
        lazy: async () => {
          const module = await import("../features/identity/OrganizationsPage");
          return { Component: module.OrganizationsPage };
        },
      },
      {
        path: "organizations/:id",
        handle: { permissions: "org.read" } satisfies RouteRequirement,
        lazy: async () => {
          const module = await import("../features/identity/OrganizationDetailPage");
          return { Component: module.OrganizationDetailPage };
        },
      },
      {
        path: "users",
        handle: { permissions: "users.read" } satisfies RouteRequirement,
        lazy: async () => {
          const module = await import("../features/identity/UsersPage");
          return { Component: module.UsersPage };
        },
      },
      {
        path: "users/:id",
        handle: { permissions: "users.read" } satisfies RouteRequirement,
        lazy: async () => {
          const module = await import("../features/identity/UserDetailPage");
          return { Component: module.UserDetailPage };
        },
      },
      {
        path: "notifications",
        handle: { labelKey: "nav.notifications" } satisfies RouteRequirement,
        lazy: async () => {
          const module = await import("../pages/NotificationsPage");
          return { Component: module.NotificationsPage };
        },
      },
      {
        path: "profile",
        handle: { labelKey: "common.profile" } satisfies RouteRequirement,
        lazy: async () => {
          const module = await import("../pages/ProfilePage");
          return { Component: module.ProfilePage };
        },
      },
      {
        path: "security",
        handle: { labelKey: "nav.security" } satisfies RouteRequirement,
        lazy: async () => {
          const module = await import("../pages/SecurityPage");
          return { Component: module.SecurityPage };
        },
      },
      {
        path: "settings",
        handle: { permissions: "org.update", redirectTo: "/" } satisfies RouteRequirement,
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
], { basename: routerBasename(import.meta.env.BASE_URL) });