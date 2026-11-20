/**
 * Safe persistence for demo preferences.
 *
 * Only non-sensitive presentation state is stored (which demo role is active,
 * which tenant is selected). No token, no credential and no personal data ever
 * reaches localStorage — `AGENTS.md` forbids it and the server will own sessions.
 */

export function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked (private mode); the demo still works in memory.
  }
}

export function removeStored(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Reload after a demo role switch so every cached query is rebuilt. */
export function reloadPage(): void {
  if (typeof window !== "undefined") window.location.reload();
}