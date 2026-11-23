/**
 * Base path for the field collection section, nested under the landscape
 * section of the unified platform SPA (`/landscape/field`).
 */
export const FIELD_BASE = "/landscape/field";

export function fieldPath(path: string): string {
  if (path === "/" || path === "") return FIELD_BASE;
  return `${FIELD_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}