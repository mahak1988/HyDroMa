import { useMemo } from "react";
import { useRealSession } from "@eco-nojin/auth-client";
import type { RealSessionValue } from "@eco-nojin/auth-client";

/**
 * Real session for the tourism surface.
 *
 * `isHost` is derived from the live API session: a signed-in user whose active
 * organization is registered as a host business. There is no local flag and no
 * provider of its own — the platform root owns the session, the section reads it.
 */
type TourismSessionValue = {
  isHost: boolean;
  displayName: string;
  session: RealSessionValue;
  signOut: () => void;
};

export function useTourismSession(): TourismSessionValue {
  const session = useRealSession();

  return useMemo<TourismSessionValue>(
    () => ({
      isHost: session.status === "authenticated" && session.activeOrganization?.kind === "business",
      displayName: session.user?.name ?? "Guest",
      session,
      signOut: () => {
        void session.logout();
      },
    }),
    [session],
  );
}
