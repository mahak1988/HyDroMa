import type { PermissionMap } from "@eco-nojin/frontend-core";

/**
 * Phase 1 fixture data. Everything here is synthetic and clearly labelled in the UI.
 * No real account, organization, notification or metric is present.
 */
export const DemoFixtures = {
  version: "0.1.0",
  user: {
    name: "Nadia Rahimi",
    role: "Landscape manager",
  },
  notifications: [
    {
      id: "n-1",
      titleKey: "notifications.itemDeployed" as const,
      bodyKey: "notifications.itemDeployedBody" as const,
      time: "2026-11-18T09:12:00Z",
      read: false,
    },
    {
      id: "n-2",
      titleKey: "notifications.itemLocale" as const,
      bodyKey: "notifications.itemLocaleBody" as const,
      time: "2026-11-17T16:40:00Z",
      read: false,
    },
    {
      id: "n-3",
      titleKey: "notifications.itemDeployed" as const,
      bodyKey: "notifications.itemDeployedBody" as const,
      time: "2026-11-15T11:05:00Z",
      read: true,
    },
  ],
};

/**
 * Permission fixture. These values are presentation hints only — the backend
 * remains the authority. `console.export` is intentionally false to prove that
 * a gate hides an action without pretending to enforce anything.
 */
export const DEMO_PERMISSIONS: PermissionMap = {
  "console.view": true,
  "console.settings.manage": true,
  "console.export": false,
};