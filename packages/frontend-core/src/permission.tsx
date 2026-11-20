import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { checkPermissions, requirementList, type RouteRequirement } from "@eco-nojin/domain-types";

/**
 * Permission-aware UI — a presentation contract, not a security control.
 *
 * The provider is fed by the application (Phase 1: an explicit local fixture).
 * Hiding a control never grants or denies access: the backend must re-check
 * every action. This module exists so screens can be written once and later fed
 * by real claims from the identity service.
 *
 * Two input shapes are accepted:
 *  - a boolean map (`{ "catalog:read": true }`) — the Phase 1 fixture shape;
 *  - a grant list (`["catalog:read", "orders:manage"]`) — the server claims shape,
 *    where `manage`/`write`/`*` expand to their implied operations.
 */
export type PermissionMap = Record<string, boolean>;
export type PermissionInput = PermissionMap | readonly string[];

type PermissionValue = {
  can: (permission: string) => boolean;
  canAll: (permissions: readonly string[]) => boolean;
  canAny: (permissions: readonly string[]) => boolean;
  canRequirement: (requirement: RouteRequirement | undefined) => boolean;
  permissions: PermissionMap;
  /** True while the real permission source has not been wired yet. */
  isFixture: boolean;
  /** Explicit fail-open switch (demo mode); never enable in production. */
  bypass: boolean;
};

const PermissionContext = createContext<PermissionValue | null>(null);

function normalize(input: PermissionInput): PermissionMap {
  if (Array.isArray(input)) {
    return Object.fromEntries((input as readonly string[]).map((permission) => [permission, true]));
  }
  return input as PermissionMap;
}

export function PermissionProvider({
  permissions,
  isFixture = true,
  bypass = false,
  children,
}: {
  permissions: PermissionInput;
  isFixture?: boolean;
  bypass?: boolean;
  children: ReactNode;
}) {
  const value = useMemo<PermissionValue>(() => {
    const map = normalize(permissions);
    const granted = Object.keys(map).filter((key) => map[key] === true);

    const can = (permission: string) => bypass || checkPermissions(granted, [permission]);
    return {
      can,
      canAll: (required) => bypass || checkPermissions(granted, [...required]),
      canAny: (required) => bypass || checkPermissions(granted, [...required], false),
      canRequirement: (requirement) => {
        if (bypass || requirement?.bypass) return true;
        const required = requirementList(requirement);
        if (required.length === 0) return true;
        return checkPermissions(granted, required, requirement?.requireAll ?? true);
      },
      permissions: map,
      isFixture,
      bypass,
    };
  }, [bypass, isFixture, permissions]);

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
  permissions,
  mode = "all",
  fallback = null,
  children,
}: {
  permission?: string;
  permissions?: readonly string[];
  mode?: "all" | "any";
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { can, canAll, canAny } = usePermissions();
  const allowed =
    permissions && permissions.length > 0
      ? mode === "any"
        ? canAny(permissions)
        : canAll(permissions)
      : permission
        ? can(permission)
        : true;
  return <>{allowed ? children : fallback}</>;
}

export type { PermissionValue, RouteRequirement };