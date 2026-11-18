import type {
  Invitation,
  Membership,
  Organization,
  Paginated,
  User,
} from "@eco-nojin/domain-types";
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
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;