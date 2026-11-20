import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useDemoRole } from "@eco-nojin/auth-client";

/**
 * Demo session for the marketplace.
 *
 * There is no identity service yet, so the "viewer" is a fixture. What matters
 * is the shape: a role and a permission set that a real session will later
 * provide unchanged. `/seller` reads from here; the server will re-check.
 *
 * Storage and reload semantics live in `@eco-nojin/auth-client` — this file only
 * maps the shared primitive onto the marketplace vocabulary.
 */
export type MarketRole = "guest" | "buyer" | "seller";

type MarketSessionValue = {
  role: MarketRole;
  isSeller: boolean;
  displayName: string;
  /** Demo-only switch so a reviewer can see the gated state. */
  signInAsSeller: () => void;
  signOut: () => void;
};

const MarketSessionContext = createContext<MarketSessionValue | null>(null);

const ROLE_KEY = "eco.market.role";
const ROLES = ["guest", "buyer", "seller"] as const satisfies readonly MarketRole[];

const DISPLAY: Record<MarketRole, string> = {
  guest: "Guest",
  buyer: "Buyer demo account",
  seller: "Seller demo account",
};

export function MarketSessionProvider({ children }: { children: ReactNode }) {
  const { role, signIn, signOut } = useDemoRole<MarketRole>({ key: ROLE_KEY, allowed: ROLES, fallback: "guest" });

  const value = useMemo<MarketSessionValue>(
    () => ({
      role,
      isSeller: role === "seller",
      displayName: DISPLAY[role],
      signInAsSeller: () => signIn("seller"),
      signOut,
    }),
    [role, signIn, signOut],
  );

  return <MarketSessionContext.Provider value={value}>{children}</MarketSessionContext.Provider>;
}

export function useMarketSession(): MarketSessionValue {
  const value = useContext(MarketSessionContext);
  if (!value) throw new Error("useMarketSession must be used inside MarketSessionProvider");
  return value;
}