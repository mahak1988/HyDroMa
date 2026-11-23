/**
 * Base path for the science section inside the unified platform SPA.
 *
 * The section is mounted at `/science/*`; the legacy `/hydroma` entry redirects
 * here so existing public links keep working.
 */
export const SCIENCE_BASE = "/science";

export function sciencePath(path: string): string {
  if (path === "/" || path === "") return SCIENCE_BASE;
  return `${SCIENCE_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}