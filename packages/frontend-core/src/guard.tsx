import type { ReactNode } from "react";
import { usePermissions } from "./permission";
import type { RouteRequirement } from "@eco-nojin/domain-types";

/**
 * Route-level permission gate.
 *
 * Deliberately free of any router import: the app decides what "denied" means
 * (redirect, 403 page, inline notice) and passes it in. This keeps
 * `frontend-core` usable from every surface, including non-router apps.
 *
 * Denial behaviour is fail-closed: `canRequirement` returns false while grants
 * are unresolved, so a protected route renders `fallback` rather than its
 * children. `allow` can only *restrict* further; it never grants access on its
 * own. This comment previously claimed "fail-open while loading", which was the
 * opposite of the implemented (and required) behaviour.
 */
export function PermissionGate({
  requirement,
  allow = true,
  fallback = null,
  children,
}: {
  requirement?: RouteRequirement;
  allow?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { canRequirement } = usePermissions();
  const permitted = allow && canRequirement(requirement);
  return <>{permitted ? children : fallback}</>;
}

/** Non-rendering variant for imperative checks inside handlers/loaders. */
export function useRouteAccess() {
  const { canRequirement, can, canAll, canAny } = usePermissions();
  return { canRequirement, can, canAll, canAny };
}