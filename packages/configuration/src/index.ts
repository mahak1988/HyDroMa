/**
 * The app registry.
 *
 * One list drives four consumers: the unified dev server, the production host,
 * the unified home page and the in-app switcher. Adding an app here must be the
 * only change needed to make it reachable from every surface.
 */
import registry from "../apps.json";

export type AppId = "home" | "portal" | "console" | "scientific-workspace" | "marketplace" | "tourism" | "brand" | "platform" | "field-collection";

export type AppDescriptor = {
  /** Directory name under apps/ and the stable identifier everywhere else. */
  id: AppId;
  /** Public path prefix served by the unified host (`/` for the home page). */
  path: string;
  /** Internal dev port; never exposed to users. */
  devPort: number;
  audience: string;
  titleKey: string;
  bodyKey: string;
  accent: string;
};

export const APPS = registry as AppDescriptor[];

/** Apps reachable from the switcher and the home page (everything but home). */
export const PRODUCT_APPS: AppDescriptor[] = APPS.filter((app) => app.id !== "home");

export function appById(id: AppId): AppDescriptor {
  const app = APPS.find((candidate) => candidate.id === id);
  if (!app) throw new Error(`Unknown app: ${id}`);
  return app;
}

/** Public path for an app, always with a trailing slash. */
export function appPath(id: AppId): string {
  const { path } = appById(id);
  return path.endsWith("/") ? path : `${path}/`;
}

/** The single user-facing port; every app is reachable through it. */
export const UNIFIED_PORT = 5180;

/**
 * React Router basename for the current build. Vite sets BASE_URL from the
 * APP_BASE env var (`/console/` in the unified build, `/` standalone).
 */
export function routerBasename(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/u, "");
  return trimmed === "" ? "/" : trimmed;
}

export function isUnified(baseUrl: string): boolean {
  return baseUrl !== "/";
}