import type { SiteContent } from "./types";
import { ar } from "./ar";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fa } from "./fa";
import { fr } from "./fr";
import { hi } from "./hi";
import { id } from "./id";
import { it } from "./it";
import { ja } from "./ja";
import { ko } from "./ko";
import { pt } from "./pt";
import { ru } from "./ru";
import { tr } from "./tr";
import { zh } from "./zh";

export const CONTENT: Record<string, SiteContent> = { fa, en, ar, es, fr, de, pt, ru, zh, ja, ko, tr, it, hi, id };

export function contentFor(locale: string): SiteContent {
  return CONTENT[locale] ?? en;
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