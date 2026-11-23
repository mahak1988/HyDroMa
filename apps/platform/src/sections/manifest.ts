/**
 * Section manifest — the platform's area registry (Phase 2).
 *
 * The platform SPA renders the public core itself; every specialised area is
 * either `internal` (lazy module inside this SPA) or `external` (its own bundle
 * behind the unified host — the bridge while migration is in progress).
 * `docs/reports/برنامه-پلتفرم-یکپارچه-2026-11-23.md` owns the migration order.
 */
export type SectionId = "tourism" | "market" | "landscape" | "science" | "field" | "brand";

export type SectionDescriptor = {
  id: SectionId;
  /** i18n key for the short label (shared catalog). */
  labelKey: string;
  /** Public href on the unified host. */
  href: string;
  /** false = separate bundle behind the unified host (document navigation). */
  internal: boolean;
  /** Lazy loader for an internal section (own chunk). */
  loader?: () => Promise<unknown>;
  audience: string;
};

export const SECTIONS: SectionDescriptor[] = [
  {
    id: "landscape",
    labelKey: "apps.platform.short",
    href: "/landscape",
    internal: true,
    loader: () => import("./landscape/router"),
    audience: "landscape managers and operators",
  },
  {
    id: "market",
    labelKey: "apps.market.short",
    href: "/market",
    internal: true,
    loader: () => import("./market/app/router"),
    audience: "buyers and sellers",
  },
  {
    id: "tourism",
    labelKey: "apps.tourism.short",
    href: "/tourism",
    internal: true,
    loader: () => import("./tourism/app/router"),
    audience: "guests and hosts",
  },
  {
    id: "science",
    labelKey: "apps.science.short",
    href: "/science",
    internal: true,
    loader: () => import("./science/app/router"),
    audience: "scientists",
  },
  {
    id: "field",
    labelKey: "apps.field.short",
    href: "/landscape/field",
    internal: true,
    loader: () => import("./landscape/router"),
    audience: "field workers",
  },
  { id: "brand", labelKey: "apps.brand.short", href: "/brand/", internal: false, audience: "designers" },
];

/** Sections shown in the public header (brand sandbox stays off the main nav). */
export const NAV_SECTIONS = SECTIONS.filter((section) => section.id !== "brand");
