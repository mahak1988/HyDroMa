import { RequireRole } from "@eco-nojin/auth-client";
import { useTourismSession } from "../session/TourismSession";
import { tourismPath } from "../lib/paths";

/**
 * Host-area gate.
 *
 * `/host` and `/bookings` are the supply side (draft listings, bookings,
 * payouts). They must never be reachable by an anonymous visitor, so a guest is
 * redirected to the section's sign-in page. The real session decides; the server
 * remains the authority and re-checks every call.
 */
export function HostRoute() {
  const { isHost } = useTourismSession();
  return <RequireRole allowed={isHost} redirectTo={tourismPath("/host/signin")} />;
}
