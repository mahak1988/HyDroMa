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