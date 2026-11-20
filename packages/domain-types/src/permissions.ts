/**
 * Organization-scoped role and permission matrix.
 *
 * This is the *shared contract* used by the UI and (later) the backend. The UI uses it to avoid
 * offering actions the server will reject; the server remains the authority.
 */

export const PERMISSION_KEYS = [
  "org.read",
  "org.update",
  "org.members.read",
  "org.members.invite",
  "org.members.manage",
  "org.roles.manage",
  "users.read",
  "users.write",
  "users.deactivate",
  "billing.read",
  "billing.manage",
  "catalog.read",
  "catalog.write",
  "orders.read",
  "orders.manage",
  "landscape.read",
  "landscape.write",
  "hydroma.run",
  "reports.read",
  "audit.read",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type OrganizationRole = "owner" | "admin" | "manager" | "member" | "viewer";

export type RoleDefinition = {
  key: OrganizationRole;
  /** Translation key for the UI; catalogs live in @eco-nojin/i18n. */
  labelKey: string;
  /** Global role is granted by the platform, not by an organization owner. */
  scope: "organization" | "platform";
};

export const ROLE_DEFINITIONS: readonly RoleDefinition[] = [
  { key: "owner", labelKey: "roles.owner", scope: "organization" },
  { key: "admin", labelKey: "roles.admin", scope: "organization" },
  { key: "manager", labelKey: "roles.manager", scope: "organization" },
  { key: "member", labelKey: "roles.member", scope: "organization" },
  { key: "viewer", labelKey: "roles.viewer", scope: "organization" },
] as const;

const READ_ONLY: PermissionKey[] = [
  "org.read",
  "org.members.read",
  "users.read",
  "catalog.read",
  "orders.read",
  "landscape.read",
  "reports.read",
];

export const ROLE_PERMISSIONS: Readonly<Record<OrganizationRole, readonly PermissionKey[]>> = {
  owner: [...PERMISSION_KEYS],
  admin: [
    "org.read",
    "org.update",
    "org.members.read",
    "org.members.invite",
    "org.members.manage",
    "org.roles.manage",
    "users.read",
    "users.write",
    "users.deactivate",
    "billing.read",
    "catalog.read",
    "catalog.write",
    "orders.read",
    "orders.manage",
    "landscape.read",
    "landscape.write",
    "hydroma.run",
    "reports.read",
    "audit.read",
  ],
  manager: [
    ...READ_ONLY,
    "org.members.invite",
    "users.write",
    "catalog.write",
    "orders.manage",
    "landscape.write",
    "hydroma.run",
  ],
  member: [...READ_ONLY],
  viewer: ["org.read", "org.members.read", "users.read", "catalog.read", "reports.read"],
};

export function hasPermission(role: OrganizationRole, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/* -------------------------------------------------------------------------- */
/* resource:operation algebra                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A permission string is `resource:operation` (for example `catalog:read`).
 * `*` is the universal grant; `<resource>:*` grants every known operation on
 * that resource. This mirrors the server model so the UI can pre-filter menus
 * and route guards without pretending to enforce anything.
 */
export const PERMISSION_WILDCARD = "*";

export type ParsedPermission = {
  resource: string;
  operation: string;
};

/** Operations implied by a broader grant (e.g. `manage` implies `delete`). */
const OPERATION_IMPLICATIONS: Readonly<Record<string, readonly string[]>> = {
  [PERMISSION_WILDCARD]: ["read", "create", "update", "delete"],
  manage: ["read", "create", "update", "delete"],
  write: ["read", "create", "update"],
};

export function parsePermission(permission: string): ParsedPermission | null {
  const separator = permission.indexOf(":");
  if (separator <= 0 || separator === permission.length - 1) return null;
  return { resource: permission.slice(0, separator), operation: permission.slice(separator + 1) };
}

export function buildPermission(resource: string, operation: string): string {
  return `${resource}:${operation}`;
}

/** Expand a single grant into the concrete permissions it implies. */
export function expandPermission(permission: string): string[] {
  if (permission === PERMISSION_WILDCARD) return [PERMISSION_WILDCARD];
  const parsed = parsePermission(permission);
  if (!parsed) return [permission];
  const implied = OPERATION_IMPLICATIONS[parsed.operation];
  if (!implied) return [permission];
  return implied.map((operation) => buildPermission(parsed.resource, operation));
}

export function isPermissionGranted(granted: readonly string[], required: string): boolean {
  if (granted.includes(PERMISSION_WILDCARD)) return true;
  const target = expandPermission(required);
  return granted.some((permission) => {
    if (permission === PERMISSION_WILDCARD) return true;
    const expanded = expandPermission(permission);
    return target.every((item) => expanded.includes(item) || expanded.includes(PERMISSION_WILDCARD));
  });
}

/** `requireAll` (default) mirrors the server: every required permission must hold. */
export function checkPermissions(
  granted: readonly string[],
  required: readonly string[],
  requireAll = true,
): boolean {
  if (required.length === 0) return true;
  const results = required.map((permission) => isPermissionGranted(granted, permission));
  return requireAll ? results.every(Boolean) : results.some(Boolean);
}

/** Grants for a role, expressed as `resource:operation` strings. */
export function permissionsForRole(role: OrganizationRole): string[] {
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

export type RouteRequirement = {
  permissions?: string | string[];
  requireAll?: boolean;
  redirectTo?: string;
  /** Fixture/demo mode may bypass gating; it never grants server-side access. */
  bypass?: boolean;
  labelKey?: string;
};

export function requirementList(requirement: RouteRequirement | undefined): string[] {
  if (!requirement?.permissions) return [];
  return Array.isArray(requirement.permissions) ? requirement.permissions : [requirement.permissions];
}