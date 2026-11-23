/**
 * Base path for the marketplace section inside the unified platform SPA.
 *
 * The section is mounted at `/market/*`; every in-section link goes through this
 * helper so the router keeps the prefix (the browser router basename is applied
 * on top of it).
 */
export const MARKET_BASE = "/market";

export function marketPath(path: string): string {
  if (path === "/" || path === "") return MARKET_BASE;
  return `${MARKET_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}