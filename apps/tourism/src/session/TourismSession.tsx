import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useDemoFlag } from "@eco-nojin/auth-client";

/**
 * Demo session for the tourism surface.
 *
 * Supply-side screens (host studio, bookings, payouts) are gated on `isHost`.
 * With no identity service the flag is a local fixture; when OIDC lands only
 * the source of this value changes, not its consumers.
 */
type TourismSessionValue = {
  isHost: boolean;
  displayName: string;
  signInAsHost: () => void;
  signOut: () => void;
};

const TourismSessionContext = createContext<TourismSessionValue | null>(null);

const ROLE_KEY = "eco.tourism.host";

export function TourismSessionProvider({ children }: { children: ReactNode }) {
  const { enabled, enable, disable } = useDemoFlag({ key: ROLE_KEY });

  const value = useMemo<TourismSessionValue>(
    () => ({
      isHost: enabled,
      displayName: enabled ? "Host demo account" : "Guest",
      signInAsHost: enable,
      signOut: disable,
    }),
    [enabled, enable, disable],
  );

  return <TourismSessionContext.Provider value={value}>{children}</TourismSessionContext.Provider>;
}

export function useTourismSession(): TourismSessionValue {
  const value = useContext(TourismSessionContext);
  if (!value) throw new Error("useTourismSession must be used inside TourismSessionProvider");
  return value;
}