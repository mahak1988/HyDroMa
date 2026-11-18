/**
 * Identity and tenancy model.
 *
 * Deliberate separation (mirrors the architecture baseline):
 *   identity (who you are) ≠ organization (legal entity) ≠ membership (your role inside it).
 * A user may belong to several organizations; every domain record is scoped by organization.
 */

import type { OrganizationRole, PermissionKey } from "./permissions";

export type UserId = string;
export type OrganizationId = string;
export type MembershipId = string;
export type InvitationId = string;

export type UserStatus = "invited" | "active" | "suspended";

export type User = {
  id: UserId;
  email: string;
  name: string;
  phone: string | null;
  status: UserStatus;
  /** Preferred UI locale code (e.g. "fa"); null means "follow organization". */
  locale: string | null;
  createdAt: string;
  lastActiveAt: string | null;
};

export type OrganizationStatus = "active" | "suspended";
export type OrganizationKind = "platform" | "region" | "community" | "business" | "research";

export type Organization = {
  id: OrganizationId;
  name: string;
  /** URL-safe identifier, unique per deployment. */
  slug: string;
  /** ISO 3166-1 alpha-2; the platform is multi-country from day one. */
  country: string;
  kind: OrganizationKind;
  status: OrganizationStatus;
  createdAt: string;
};

export type MembershipStatus = "invited" | "active" | "suspended" | "removed";

export type Membership = {
  id: MembershipId;
  organizationId: OrganizationId;
  userId: UserId;
  role: OrganizationRole;
  status: MembershipStatus;
  joinedAt: string;
};

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type Invitation = {
  id: InvitationId;
  organizationId: OrganizationId;
  email: string;
  role: OrganizationRole;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
};

/** The tenant context sent with every request; the server re-derives and validates it. */
export type TenantContext = {
  organizationId: OrganizationId;
  userId: UserId;
  role: OrganizationRole;
  permissions: readonly PermissionKey[];
};

export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
  total: number;
};

export type {
  OrganizationRole,
  PermissionKey,
  RoleDefinition,
} from "./permissions";

export { PERMISSION_KEYS, ROLE_DEFINITIONS, ROLE_PERMISSIONS, hasPermission } from "./permissions";