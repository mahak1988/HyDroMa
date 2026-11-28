/**
 * Resolves the HyDroMA engine base URL.
 *
 * The engine is reached through the unified host on the same origin under
 * `/hydroma-api` (dev, preview and production all proxy that prefix to the
 * engine). This keeps session cookies same-site and removes the absolute
 * `http://127.0.0.1:8000` default, which only worked on the developer's own
 * machine. An explicit `VITE_HYDROMA_BASE_URL` still overrides the default for
 * split deployments.
 */
export const HYDROMA_PROXY_PATH = "/hydroma-api";

export function resolveHydromaBaseUrl(envValue?: string | null): string {
  const trimmed = envValue?.trim();
  return trimmed ? trimmed : HYDROMA_PROXY_PATH;
}

export const HYDROMA_BASE_URL = resolveHydromaBaseUrl(
  import.meta.env.VITE_HYDROMA_BASE_URL as string | undefined,
);