import type { LocaleCode, SiteContent } from "./types";
import { ar } from "./ar";
import { en } from "./en";
import { fa } from "./fa";

export const CONTENT: Record<LocaleCode, SiteContent> = { fa, en, ar };

export function contentFor(locale: string): SiteContent {
  return CONTENT[locale as LocaleCode] ?? en;
}

export const ROUTES = [
  { path: "/", key: "home" },
  { path: "/ecosystem", key: "ecosystem" },
  { path: "/hydroma", key: "hydroma" },
  { path: "/landscape", key: "landscape" },
  { path: "/marketplace", key: "marketplace" },
  { path: "/tourism", key: "tourism" },
  { path: "/mrv", key: "mrv" },
  { path: "/knowledge", key: "knowledge" },
  { path: "/about", key: "about" },
  { path: "/contact", key: "contact" },
  { path: "/partner", key: "partner" },
  { path: "/login", key: "login" },
] as const;

export type RouteKey = (typeof ROUTES)[number]["key"];
export type { Block, IconName, PageContent, PageKey, SiteContent } from "./types";