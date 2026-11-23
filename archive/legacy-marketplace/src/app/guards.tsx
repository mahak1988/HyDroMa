import { RequireRole } from "@eco-nojin/auth-client";
import { useMarketSession } from "../session/MarketSession";

/**
 * Route gate for the seller area.
 *
 * `/seller` is not public: it shows stock, finance and orders. Until an identity
 * service exists, the demo session decides; the server remains the authority and
 * will re-check every call. The redirect + Outlet mechanics live in
 * `@eco-nojin/auth-client` so every app gates the same way.
 */
export function SellerRoute() {
  const { isSeller } = useMarketSession();
  return <RequireRole allowed={isSeller} redirectTo="/seller/signin" />;
}