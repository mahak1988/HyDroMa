import { ApiError } from "@eco-nojin/api-client";
import type {
  Invitation,
  Membership,
  Organization,
  OrganizationRole,
  Paginated,
  PermissionKey,
  User,
  UserStatus,
} from "@eco-nojin/domain-types";
import { ROLE_PERMISSIONS } from "@eco-nojin/domain-types";
import type {
  InvitationCreateInput,
  OrganizationCreateInput,
  OrganizationUpdateInput,
  UserCreateInput,
  UserUpdateInput,
} from "@eco-nojin/validation";

/**
 * In-memory demo backend for the identity slice.
 *
 * It exists to exercise the UI end-to-end before a real API is available. It is
 * explicitly labelled as demo data in the UI, enforces the same tenancy and
 * permission rules the server will enforce, and is swapped for the HTTP client
 * by setting VITE_API_URL (see `data/index.ts`).
 */

export type UserWithRole = User & { role: OrganizationRole };

export type IdentityRepository = {
  listOrganizations(): Promise<Paginated<Organization>>;
  getOrganization(id: string): Promise<Organization>;
  createOrganization(input: OrganizationCreateInput): Promise<Organization>;
  updateOrganization(id: string, input: OrganizationUpdateInput): Promise<Organization>;
  listMembers(organizationId: string): Promise<Paginated<Membership>>;
  inviteMember(organizationId: string, input: InvitationCreateInput): Promise<Invitation>;
  updateMemberRole(organizationId: string, membershipId: string, role: OrganizationRole): Promise<Membership>;
  listUsers(organizationId: string, query: { search?: string; role?: string; status?: string; limit?: number; cursor?: string }): Promise<Paginated<UserWithRole>>;
  getUser(organizationId: string, id: string): Promise<UserWithRole>;
  createUser(organizationId: string, input: UserCreateInput): Promise<UserWithRole>;
  updateUser(organizationId: string, id: string, input: UserUpdateInput): Promise<UserWithRole>;
  setUserStatus(organizationId: string, id: string, status: UserStatus): Promise<UserWithRole>;
};

/** The demo account used by the shell; its memberships drive tenancy and permissions. */
export const DEMO_USER_ID = "usr-nadia";

const now = "2026-11-18T08:00:00.000Z";

const ORGANIZATIONS: Organization[] = [
  {
    id: "org-karaj",
    name: "Karaj Watershed Council",
    slug: "karaj-watershed",
    country: "IR",
    kind: "community",
    status: "active",
    createdAt: "2025-02-11T09:00:00.000Z",
  },
  {
    id: "org-hidden",
    name: "Restricted Reserve",
    slug: "restricted-reserve",
    country: "IR",
    kind: "region",
    status: "active",
    createdAt: "2025-08-01T09:00:00.000Z",
  },
  {
    id: "org-zagros",
    name: "Zagros Field Institute",
    slug: "zagros-institute",
    country: "IR",
    kind: "research",
    status: "active",
    createdAt: "2025-05-20T09:00:00.000Z",
  },
];

const USERS: User[] = [
  { id: DEMO_USER_ID, email: "nadia.rahimi@ecnojin.demo", name: "Nadia Rahimi", phone: "+98 912 111 2233", status: "active", locale: "fa", createdAt: "2025-02-11T09:05:00.000Z", lastActiveAt: now },
  { id: "usr-omid", email: "omid.karimi@ecnojin.demo", name: "Omid Karimi", phone: null, status: "active", locale: "fa", createdAt: "2025-02-14T10:00:00.000Z", lastActiveAt: now },
  { id: "usr-sara", email: "sara.ahmadi@ecnojin.demo", name: "Sara Ahmadi", phone: "+98 912 333 4455", status: "active", locale: "en", createdAt: "2025-03-02T10:00:00.000Z", lastActiveAt: now },
  { id: "usr-reza", email: "reza.nasser@ecnojin.demo", name: "Reza Nasser", phone: null, status: "invited", locale: null, createdAt: "2025-06-01T10:00:00.000Z", lastActiveAt: null },
  { id: "usr-leila", email: "leila.haddad@ecnojin.demo", name: "Leila Haddad", phone: null, status: "suspended", locale: "ar", createdAt: "2025-04-19T10:00:00.000Z", lastActiveAt: "2026-09-30T12:00:00.000Z" },
  { id: "usr-mina", email: "mina.torabi@ecnojin.demo", name: "Mina Torabi", phone: null, status: "active", locale: "fa", createdAt: "2025-07-08T10:00:00.000Z", lastActiveAt: now },
];

const MEMBERSHIPS: Membership[] = [
  { id: "mem-1", organizationId: "org-karaj", userId: DEMO_USER_ID, role: "admin", status: "active", joinedAt: "2025-02-11T09:05:00.000Z" },
  { id: "mem-2", organizationId: "org-zagros", userId: DEMO_USER_ID, role: "viewer", status: "active", joinedAt: "2025-06-02T09:00:00.000Z" },
  { id: "mem-3", organizationId: "org-karaj", userId: "usr-omid", role: "manager", status: "active", joinedAt: "2025-02-14T10:05:00.000Z" },
  { id: "mem-4", organizationId: "org-karaj", userId: "usr-sara", role: "member", status: "active", joinedAt: "2025-03-02T10:05:00.000Z" },
  { id: "mem-5", organizationId: "org-karaj", userId: "usr-reza", role: "viewer", status: "invited", joinedAt: "2025-06-01T10:05:00.000Z" },
  { id: "mem-6", organizationId: "org-karaj", userId: "usr-leila", role: "member", status: "suspended", joinedAt: "2025-04-19T10:05:00.000Z" },
  { id: "mem-7", organizationId: "org-zagros", userId: "usr-mina", role: "owner", status: "active", joinedAt: "2025-07-08T10:05:00.000Z" },
];

const state = {
  organizations: [...ORGANIZATIONS],
  users: [...USERS],
  memberships: [...MEMBERSHIPS],
  invitations: [] as Invitation[],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const latency = () => sleep(120 + Math.floor(Math.random() * 180));

function notFound(): ApiError {
  return new ApiError({ code: "not_found", status: 404, messageKey: "errorCodes.notFound" });
}

function forbidden(): ApiError {
  return new ApiError({ code: "forbidden", status: 403, messageKey: "errorCodes.forbidden" });
}

function conflict(messageKey: string, field?: string): ApiError {
  return new ApiError({
    code: "conflict",
    status: 409,
    messageKey,
    details: field ? [{ field, issue: messageKey }] : [],
  });
}

/** The server derives the tenant from the session; the demo mirrors that rule. */
function membershipOf(organizationId: string, userId = DEMO_USER_ID): Membership {
  const membership = state.memberships.find(
    (item) => item.organizationId === organizationId && item.userId === userId && item.status !== "removed",
  );
  if (!membership) throw notFound();
  return membership;
}

function requirePermission(organizationId: string, permission: PermissionKey): Membership {
  const membership = membershipOf(organizationId);
  const allowed = ROLE_PERMISSIONS[membership.role] as readonly string[];
  if (!allowed.includes(permission)) throw forbidden();
  return membership;
}

function withRole(membership: Membership): UserWithRole {
  const user = state.users.find((item) => item.id === membership.userId);
  if (!user) throw notFound();
  return { ...user, role: membership.role };
}

function paginate<T>(items: T[], limit = 20, cursor?: string): Paginated<T> {
  const offset = cursor ? Number.parseInt(cursor, 10) || 0 : 0;
  const slice = items.slice(offset, offset + limit);
  const next = offset + limit < items.length ? String(offset + limit) : null;
  return { items: slice, nextCursor: next, total: items.length };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const mockIdentityRepository: IdentityRepository = {
  async listOrganizations() {
    await latency();
    const allowed = new Set(
      state.memberships.filter((m) => m.userId === DEMO_USER_ID && m.status !== "removed").map((m) => m.organizationId),
    );
    return paginate(state.organizations.filter((org) => allowed.has(org.id)));
  },

  async getOrganization(id) {
    await latency();
    membershipOf(id);
    const org = state.organizations.find((item) => item.id === id);
    if (!org) throw notFound();
    return org;
  },

  async createOrganization(input) {
    await latency();
    if (state.organizations.some((org) => org.slug === input.slug)) {
      throw conflict("validation.duplicateSlug", "slug");
    }
    const org: Organization = {
      id: `org-${slugify(input.slug)}-${state.organizations.length + 1}`,
      name: input.name,
      slug: input.slug,
      country: input.country,
      kind: input.kind ?? "community",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    state.organizations.push(org);
    state.memberships.push({
      id: `mem-new-${state.memberships.length + 1}`,
      organizationId: org.id,
      userId: DEMO_USER_ID,
      role: "owner",
      status: "active",
      joinedAt: new Date().toISOString(),
    });
    return org;
  },

  async updateOrganization(id, input) {
    await latency();
    requirePermission(id, "org.update");
    const org = state.organizations.find((item) => item.id === id);
    if (!org) throw notFound();
    if (input.slug && input.slug !== org.slug && state.organizations.some((item) => item.slug === input.slug)) {
      throw conflict("validation.duplicateSlug", "slug");
    }
    Object.assign(org, input);
    return org;
  },

  async listMembers(organizationId) {
    await latency();
    membershipOf(organizationId);
    return paginate(state.memberships.filter((item) => item.organizationId === organizationId));
  },

  async inviteMember(organizationId, input) {
    await latency();
    requirePermission(organizationId, "org.members.invite");
    const exists = state.users.some((user) => user.email === input.email);
    const pending = state.invitations.some(
      (invite) => invite.organizationId === organizationId && invite.email === input.email && invite.status === "pending",
    );
    if (exists || pending) throw conflict("validation.duplicateEmail", "email");
    const invitation: Invitation = {
      id: `inv-${state.invitations.length + 1}`,
      organizationId,
      email: input.email,
      role: input.role,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    };
    state.invitations.push(invitation);
    return invitation;
  },

  async updateMemberRole(organizationId, membershipId, role) {
    await latency();
    requirePermission(organizationId, "org.roles.manage");
    const membership = state.memberships.find(
      (item) => item.id === membershipId && item.organizationId === organizationId,
    );
    if (!membership) throw notFound();
    if (membership.role === "owner" && role !== "owner") {
      const owners = state.memberships.filter(
        (item) => item.organizationId === organizationId && item.role === "owner",
      );
      if (owners.length <= 1) throw conflict("validation.lastOwner", "role");
    }
    membership.role = role;
    return membership;
  },

  async listUsers(organizationId, query) {
    await latency();
    membershipOf(organizationId);
    const members = state.memberships.filter((item) => item.organizationId === organizationId);
    let users = members.map(withRole);
    if (query.search) {
      const needle = query.search.toLowerCase();
      users = users.filter(
        (user) => user.name.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle),
      );
    }
    if (query.role) users = users.filter((user) => user.role === query.role);
    if (query.status) users = users.filter((user) => user.status === query.status);
    users.sort((a, b) => a.name.localeCompare(b.name));
    return paginate(users, query.limit ?? 20, query.cursor);
  },

  async getUser(organizationId, id) {
    await latency();
    const membership = state.memberships.find(
      (item) => item.organizationId === organizationId && item.userId === id && item.status !== "removed",
    );
    if (!membership) throw notFound();
    return withRole(membership);
  },

  async createUser(organizationId, input) {
    await latency();
    requirePermission(organizationId, "org.members.invite");
    if (state.users.some((user) => user.email === input.email)) {
      throw conflict("validation.duplicateEmail", "email");
    }
    const user: User = {
      id: `usr-${state.users.length + 1}`,
      email: input.email,
      name: input.name,
      phone: input.phone ?? null,
      status: "invited",
      locale: input.locale ?? null,
      createdAt: new Date().toISOString(),
      lastActiveAt: null,
    };
    state.users.push(user);
    const membership: Membership = {
      id: `mem-${state.memberships.length + 1}`,
      organizationId,
      userId: user.id,
      role: input.role,
      status: "invited",
      joinedAt: new Date().toISOString(),
    };
    state.memberships.push(membership);
    return withRole(membership);
  },

  async updateUser(organizationId, id, input) {
    await latency();
    requirePermission(organizationId, "users.write");
    const membership = state.memberships.find((item) => item.organizationId === organizationId && item.userId === id);
    if (!membership) throw notFound();
    const user = state.users.find((item) => item.id === id);
    if (!user) throw notFound();
    if (input.email && input.email !== user.email && state.users.some((item) => item.email === input.email)) {
      throw conflict("validation.duplicateEmail", "email");
    }
    if (input.name !== undefined) user.name = input.name;
    if (input.email !== undefined) user.email = input.email;
    if (input.phone !== undefined) user.phone = input.phone ?? null;
    if (input.role !== undefined) membership.role = input.role;
    if (input.status !== undefined) user.status = input.status;
    return withRole(membership);
  },

  async setUserStatus(organizationId, id, status) {
    await latency();
    requirePermission(organizationId, "users.deactivate");
    const user = state.users.find((item) => item.id === id);
    const membership = state.memberships.find(
      (item) => item.organizationId === organizationId && item.userId === id,
    );
    if (!user || !membership) throw notFound();
    if (id === DEMO_USER_ID && status !== "active") {
      throw conflict("errorCodes.forbidden");
    }
    user.status = status;
    membership.status = status === "active" ? "active" : status;
    return withRole(membership);
  },
};

/** Memberships of the demo account, used to build the session synchronously. */
export const demoMemberships = (): Array<{ organization: Organization; membership: Membership }> =>
  state.memberships
    .filter((item) => item.userId === DEMO_USER_ID && item.status === "active")
    .map((membership) => {
      const organization = state.organizations.find((org) => org.id === membership.organizationId);
      if (!organization) throw notFound();
      return { organization, membership };
    });

export const demoUser = (): User => {
  const user = state.users.find((item) => item.id === DEMO_USER_ID);
  if (!user) throw notFound();
  return user;
};

/** Test-only reset hook (not used by the UI). */
export function resetMockState(): void {
  state.organizations = [...ORGANIZATIONS];
  state.users = [...USERS];
  state.memberships = [...MEMBERSHIPS];
  state.invitations = [];
}