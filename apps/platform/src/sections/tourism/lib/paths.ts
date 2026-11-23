/**
 * Base path for the tourism section inside the unified platform SPA.
 *
 * The section is mounted at `/tourism/*`; every link inside it must go through
 * this helper so the router keeps the section prefix (the browser router's
 * basename is applied on top of it).
 */
export const TOURISM_BASE = "/tourism";

export function tourismPath(path: string): string {
  if (path === "/" || path === "") return TOURISM_BASE;
  return `${TOURISM_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
