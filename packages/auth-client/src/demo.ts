import { useMemo } from "react";
import { readStored, reloadPage, removeStored, writeStored } from "./storage";

/**
 * A demo role held in localStorage.
 *
 * This exists because no identity provider is connected yet (owner decision
 * D-04). Its shape is the contract a real session will satisfy later: a role
 * string, a sign-in action and a sign-out action. Consumers never read storage
 * directly, so replacing the source is a one-file change.
 */
export type DemoRoleState<T extends string> = {
  role: T;
  signIn: (role: T) => void;
  signOut: () => void;
};

function parseRole<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const stored = readStored(key);
  return allowed.includes(stored as T) ? (stored as T) : fallback;
}

export function useDemoRole<T extends string>(options: {
  key: string;
  allowed: readonly T[];
  fallback: T;
}): DemoRoleState<T> {
  const { key, allowed, fallback } = options;

  return useMemo<DemoRoleState<T>>(
    () => ({
      role: parseRole(key, allowed, fallback),
      signIn: (role: T) => {
        if (!allowed.includes(role)) return;
        writeStored(key, role);
        reloadPage();
      },
      signOut: () => {
        removeStored(key);
        reloadPage();
      },
    }),
    // The role is read once per document; switching reloads the page on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
}

/** Boolean variant for a single gated area (host studio, seller dashboard). */
export function useDemoFlag(options: { key: string }): {
  enabled: boolean;
  enable: () => void;
  disable: () => void;
} {
  const { key } = options;
  return useMemo(
    () => ({
      enabled: readStored(key) === "1",
      enable: () => {
        writeStored(key, "1");
        reloadPage();
      },
      disable: () => {
        removeStored(key);
        reloadPage();
      },
    }),
    [key],
  );
}