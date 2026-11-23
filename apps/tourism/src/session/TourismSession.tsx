import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useRealSession } from "@eco-nojin/auth-client";
import type { RealSessionValue } from "@eco-nojin/auth-client";

/**
 * Real session for the tourism surface.
 *
 * `isHost` is derived from the live API session: a signed-in user whose active
 * organization is registered as a host business. There is no local flag — a
 * guest sees the guest view until the API says otherwise.
 */
type TourismSessionValue = {
  isHost: boolean;
  displayName: string;
  session: RealSessionValue;
  signOut: () => void;
};

const TourismSessionContext = createContext<TourismSessionValue | null>(null);

export function TourismSessionProvider({ children }: { children: ReactNode }) {
  const session = useRealSession();

  const isHost = session.status === "authenticated" && session.activeOrganization?.kind === "business";

  const value = useMemo<TourismSessionValue>(
    () => ({
      isHost,
      displayName: session.user?.name ?? "Guest",
      session,
      signOut: () => {
        void session.logout();
      },
    }),
    [isHost, session],
  );

  return <TourismSessionContext.Provider value={value}>{children}</TourismSessionContext.Provider>;
}

export function useTourismSession(): TourismSessionValue {
  const value = useContext(TourismSessionContext);
  if (!value) throw new Error("useTourismSession must be used inside TourismSessionProvider");
  return value;
}
