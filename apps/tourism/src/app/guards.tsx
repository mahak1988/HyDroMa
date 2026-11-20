import { RequireRole } from "@eco-nojin/auth-client";
import { useTourismSession } from "../session/TourismSession";

/**
 * Host-area gate.
 *
 * `/host` and `/bookings` are the supply side (draft listings, bookings,
 * payouts). They must never be reachable by an anonymous visitor, so a guest is
 * redirected to the sign-in page — the same contract as the marketplace's
 * `SellerRoute`. The demo session decides for now; the server remains the
 * authority and re-checks every call.
 */
export function HostRoute() {
  const { isHost } = useTourismSession();
  return <RequireRole allowed={isHost} redirectTo="/host/signin" />;
}