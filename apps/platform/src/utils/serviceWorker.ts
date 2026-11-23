/**
 * Service-worker registration for the public site.
 *
 * Registration is explicit (not injected by a plugin) so the portal builds with
 * zero new dependencies and the SW can be audited in one file. The SW itself
 * never caches `/api/`, so enabling it cannot serve stale money or identity data.
 */
export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;

  // Register under the build base so the scope never covers another app.
  const base = import.meta.env.BASE_URL;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      // Offline support is a progressive enhancement; failure is non-fatal.
    });
  });
}