import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRealSession } from "@eco-nojin/auth-client";
import { createApiClient } from "@eco-nojin/api-client";
import type { RealSessionValue } from "@eco-nojin/auth-client";
import { marketPath } from "../lib/paths";

/**
 * Real session for the marketplace.
 *
 * Roles are derived from the live API session, not from local storage:
 *   signed out            -> guest
 *   signed in             -> buyer
 *   signed in + the active
 *   organization is a registered
 *   seller                -> seller
 * The server re-checks everything; this mapping only chooses what to render.
 */
export type MarketRole = "guest" | "buyer" | "seller";

type MarketSessionValue = {
  role: MarketRole;
  isSeller: boolean;
  displayName: string;
  session: RealSessionValue;
  openSignIn: () => void;
  signOut: () => void;
};

const MarketSessionContext = createContext<MarketSessionValue | null>(null);

export function MarketSessionProvider({ children }: { children: ReactNode }) {
  const session = useRealSession();
  const [isRegisteredSeller, setIsRegisteredSeller] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (session.status !== "authenticated" || !session.activeOrganizationId) {
      setIsRegisteredSeller(false);
      return;
    }
    // A seller is an organization that has a seller record in the marketplace.
    const organizationId = session.activeOrganizationId;
    const api = createApiClient({ baseUrl: API_BASE });
    api.catalog.sellers(organizationId ?? undefined)
      .then((payload) => {
        if (!cancelled) setIsRegisteredSeller((payload.items ?? []).length > 0);
      })
      .catch(() => {
        if (!cancelled) setIsRegisteredSeller(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session.status, session.activeOrganizationId, session]);

  const role: MarketRole =
    session.status !== "authenticated" ? "guest" : isRegisteredSeller ? "seller" : "buyer";

  const value = useMemo<MarketSessionValue>(
    () => ({
      role,
      isSeller: role === "seller",
      displayName: session.user?.name ?? "Guest",
      session,
      openSignIn: () => {
        window.location.assign(marketPath("/seller/signin"));
      },
      signOut: () => {
        void session.logout();
      },
    }),
    [role, session],
  );

  return <MarketSessionContext.Provider value={value}>{children}</MarketSessionContext.Provider>;
}

export function useMarketSession(): MarketSessionValue {
  const value = useContext(MarketSessionContext);
  if (!value) throw new Error("useMarketSession must be used inside MarketSessionProvider");
  return value;
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
