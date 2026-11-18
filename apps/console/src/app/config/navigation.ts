import type { LucideIcon } from "lucide-react";
import { Bell, Boxes, Home, Settings } from "lucide-react";
import type { TranslationKey } from "@eco-nojin/i18n";

export type NavItem = {
  to: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  /** Permission required to see the item (presentation only; server re-checks). */
  permission?: string;
  end?: boolean;
};

export type NavGroup = {
  labelKey: TranslationKey;
  items: NavItem[];
};

/**
 * Navigation is data. The sidebar, mobile drawer and command palette all read
 * this single registry, so adding a section never means editing components.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "nav.groupOverview",
    items: [{ to: "/", labelKey: "nav.home", icon: Home, end: true, permission: "console.view" }],
  },
  {
    labelKey: "nav.groupWorkspace",
    items: [
      { to: "/components", labelKey: "nav.components", icon: Boxes, permission: "console.view" },
      {
        to: "/notifications",
        labelKey: "nav.notifications",
        icon: Bell,
        permission: "console.view",
      },
      {
        to: "/settings",
        labelKey: "nav.settings",
        icon: Settings,
        permission: "console.settings.manage",
      },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

/** Breadcrumb metadata per route: [leaf, …ancestors]. */
export const ROUTE_BREADCRUMBS: Record<string, TranslationKey[]> = {
  "/": ["nav.home"],
  "/components": ["nav.components"],
  "/notifications": ["nav.notifications"],
  "/settings": ["nav.settings"],
};