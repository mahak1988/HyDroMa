import type { ReactNode } from "react";
import { Navigate, Outlet, useMatches } from "react-router-dom";
import { PermissionGate } from "@eco-nojin/frontend-core";
import { requirementList, type RouteRequirement } from "@eco-nojin/domain-types";

/**
 * Route-level permission enforcement shared by every app.
 *
 * `handle: { permissions, requireAll?, redirectTo?, bypass? }` on a route is the
 * single declaration. Requirements are collected from **every** match in the
 * chain and united, so a nested route can only narrow access — never widen it by
 * declaring a weaker permission than its parent.
 *
 * Denial is fail-closed: unresolved grants render the fallback, not the page.
 * The server remains the authority; this only avoids offering a dead action.
 */
export function readRequirements(matches: Array<{ handle?: unknown }>): RouteRequirement[] {
  const found: RouteRequirement[] = [];
  for (const match of matches) {
    const handle = match.handle as RouteRequirement | undefined;
    if (handle && (handle.permissions || handle.bypass)) found.push(handle);
  }
  return found;
}

export function RoutePermissionGuard({ children, fallback }: { children?: ReactNode; fallback?: ReactNode }) {
  const matches = useMatches();
  const requirements = readRequirements(matches);

  const permissions = requirements.flatMap((requirement) => requirementList(requirement));
  const bypass = requirements.some((requirement) => requirement.bypass === true);
  const redirectTo = requirements.find((requirement) => requirement.redirectTo)?.redirectTo;
  const requireAll = requirements.some((requirement) => requirement.requireAll === true);

  return (
    <PermissionGate
      requirement={{ permissions, bypass: bypass || undefined, redirectTo, requireAll: requireAll || undefined }}
      fallback={redirectTo ? <Navigate to={redirectTo} replace /> : (fallback ?? <AccessDenied />)}
    >
      {children ?? <Outlet />}
    </PermissionGate>
  );
}

export function AccessDenied() {
  return (
    <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-6 text-center text-sm text-danger-soft-fg">
      <p className="font-medium">403</p>
      <p className="mt-1 text-2xs">You do not have access to this section.</p>
    </div>
  );
}

/**
 * Gate for a single authenticated area (seller studio, host studio).
 * A demo role decides today; a real session will provide the same boolean.
 */
export function RequireRole({ allowed, redirectTo }: { allowed: boolean; redirectTo: string }) {
  if (!allowed) return <Navigate to={redirectTo} replace />;
  return <Outlet />;
}