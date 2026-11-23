/**
 * Tiny, dependency-free helpers for demo data persisted in localStorage.
 *
 * Storage is user-controlled and may be blocked or corrupt, so every read is
 * guarded and every write is best-effort. No secrets are ever stored here.
 */
export function readPersisted<T>(key: string, parse: (raw: unknown) => T): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writePersisted(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be blocked; the demo still works for the current session.
  }
}

export function removePersisted(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Best effort.
  }
}