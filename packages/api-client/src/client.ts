import type {
  Invitation,
  Membership,
  Organization,
  Paginated,
  Product,
  Seller,
  User,
} from "@eco-nojin/domain-types";

/** Session payloads returned by the Eco Nojin auth endpoints. */
export type AuthMe = {
  user: User;
  memberships: Membership[];
  activeOrganizationId: string | null;
};
export type AuthResult = {
  user: User;
  organizations?: Organization[];
};
export type LoginInput = { email: string; password: string };
export type RegisterInput = {
  email: string;
  name: string;
  password: string;
  organizationName?: string;
  country?: string;
};
export type AcceptInviteInput = { token: string; password: string };
import type {
  InvitationCreateInput,
  MembershipRoleInput,
  OrganizationCreateInput,
  OrganizationUpdateInput,
  UserCreateInput,
  UserUpdateInput,
} from "@eco-nojin/validation";
import { toQuery, type ListQuery } from "./pagination";
import { createTransport, type TransportConfig } from "./transport";

export type ApiClientConfig = TransportConfig;

/**
 * Single typed client for the Eco Nojin contract surface.
 * Endpoints follow `contracts/api`; no component may call `fetch` directly.
 */
export function createApiClient(config: ApiClientConfig) {
  const transport = createTransport(config);

  return {
    auth: {
      me: (options?: { signal?: AbortSignal }) =>
        transport.request<AuthMe>({ path: "v1/auth/me", signal: options?.signal }),
      login: (payload: LoginInput) =>
        transport.request<AuthResult>({ method: "POST", path: "v1/auth/login", body: payload }),
      register: (payload: RegisterInput) =>
        transport.request<AuthResult>({ method: "POST", path: "v1/auth/register", body: payload }),
      logout: () => transport.request<{ ok: boolean }>({ method: "POST", path: "v1/auth/logout" }),
      acceptInvite: (payload: AcceptInviteInput) =>
        transport.request<AuthResult>({ method: "POST", path: "v1/auth/accept-invite", body: payload }),
    },
    users: {
      list: (query: ListQuery = {}, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<User>>({ path: "v1/users", query: toQuery(query), signal: options?.signal }),
      get: (id: string, options?: { signal?: AbortSignal }) =>
        transport.request<User>({ path: `v1/users/${encodeURIComponent(id)}`, signal: options?.signal }),
      create: (payload: UserCreateInput) =>
        transport.request<User>({ method: "POST", path: "v1/users", body: payload }),
      update: (id: string, payload: UserUpdateInput) =>
        transport.request<User>({
          method: "PATCH",
          path: `v1/users/${encodeURIComponent(id)}`,
          body: payload,
        }),
      deactivate: (id: string) =>
        transport.request<User>({
          method: "PATCH",
          path: `v1/users/${encodeURIComponent(id)}`,
          body: { status: "suspended" },
        }),
    },
    organizations: {
      list: (options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<Organization>>({ path: "v1/organizations", signal: options?.signal }),
      get: (id: string) =>
        transport.request<Organization>({ path: `v1/organizations/${encodeURIComponent(id)}` }),
      create: (payload: OrganizationCreateInput) =>
        transport.request<Organization>({ method: "POST", path: "v1/organizations", body: payload }),
      update: (id: string, payload: OrganizationUpdateInput) =>
        transport.request<Organization>({
          method: "PATCH",
          path: `v1/organizations/${encodeURIComponent(id)}`,
          body: payload,
        }),
    },
    members: {
      list: (organizationId: string, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<Membership>>({
          path: `v1/organizations/${encodeURIComponent(organizationId)}/members`,
          signal: options?.signal,
        }),
      invite: (organizationId: string, payload: InvitationCreateInput) =>
        transport.request<Invitation>({
          method: "POST",
          path: `v1/organizations/${encodeURIComponent(organizationId)}/invitations`,
          body: payload,
        }),
      updateRole: (organizationId: string, membershipId: string, payload: MembershipRoleInput) =>
        transport.request<Membership>({
          method: "PATCH",
          path: `v1/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(membershipId)}`,
          body: payload,
        }),
    },
    catalog: {
      categories: (options?: { signal?: AbortSignal }) =>
        transport.request<unknown>({ path: "v1/catalog/categories", signal: options?.signal }),
      sellers: (organizationId?: string, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<Seller>>({
          path: "v1/catalog/sellers",
          query: organizationId ? { organizationId } as Record<string, string> : undefined,
          signal: options?.signal,
        }),
      products: (query?: ListQuery, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<Product>>({
          path: "v1/catalog/products",
          query: toQuery(query ?? {}),
          signal: options?.signal,
        }),
      createProduct: (payload: unknown) =>
        transport.request<Product>({ method: "POST", path: "v1/catalog/products", body: payload }),
    },
    resources: {
      list: (type: string, query: ListQuery = {}, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<Record<string, unknown>>>({
          path: `v1/resources/${encodeURIComponent(type)}`,
          query: toQuery(query),
          signal: options?.signal,
        }),
      get: (type: string, id: string, options?: { signal?: AbortSignal }) =>
        transport.request<Record<string, unknown>>({
          path: `v1/resources/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
          signal: options?.signal,
        }),
      create: (type: string, payload: Record<string, unknown>) =>
        transport.request<Record<string, unknown>>({
          method: "POST",
          path: `v1/resources/${encodeURIComponent(type)}`,
          body: payload,
        }),
      update: (type: string, id: string, payload: Record<string, unknown>) =>
        transport.request<Record<string, unknown>>({
          method: "PATCH",
          path: `v1/resources/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
          body: payload,
        }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;