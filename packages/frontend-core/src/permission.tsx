import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

/**
 * Permission-aware UI — a presentation contract, not a security control.
 *
 * The provider is fed by the application (in Phase 1: an explicit local
 * fixture). Hiding a control never grants or denies access: the backend must
 * re-check every action. This module exists so screens can be written once and
 * later fed by real claims from the identity service.
 */
export type PermissionMap = Record<string, boolean>;

type PermissionValue = {
  can: (permission: string) => boolean;
  permissions: PermissionMap;
  /** True while the real permission source has not been wired yet. */
  isFixture: boolean;
};

const PermissionContext = createContext<PermissionValue | null>(null);

export function PermissionProvider({
  permissions,
  isFixture = true,
  children,
}: {
  permissions: PermissionMap;
  isFixture?: boolean;
  children: ReactNode;
}) {
  const value = useMemo<PermissionValue>(
    () => ({
      can: (permission: string) => permissions[permission] === true,
      permissions,
      isFixture,
    }),
    [isFixture, permissions],
  );
  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions(): PermissionValue {
  const value = useContext(PermissionContext);
  if (!value) throw new Error("usePermissions must be used inside PermissionProvider");
  return value;
}

/** Declarative gate. Renders `fallback` (or nothing) when the permission is absent. */
export function Can({
  permission,
  fallback = null,
  children,
}: {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { can } = usePermissions();
  return <>{can(permission) ? children : fallback}</>;
}