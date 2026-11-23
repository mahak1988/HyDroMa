/**
 * Base path for the administration section, nested under the landscape
 * section of the unified platform SPA (`/landscape/admin`).
 */
export const ADMIN_BASE = "/landscape/admin";

export function adminPath(path: string): string {
  if (path === "/" || path === "") return ADMIN_BASE;
  return `${ADMIN_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}