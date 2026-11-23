import { createApiClient } from "@eco-nojin/api-client";
import type { IdentityRepository } from "./identity-repository";

const apiUrl: string = import.meta.env.VITE_API_URL ?? "/api";

/**
 * Data mode is always real: the console talks to the Eco Nojin API. The API
 * base comes from VITE_API_URL with the local dev server as default.
 */
export const DATA_MODE = "http" as const;

export const identityRepository: IdentityRepository = createHttpIdentityRepository(apiUrl);

function createHttpIdentityRepository(baseUrl: string): IdentityRepository {
  const api = createApiClient({
    baseUrl,
    getCsrfToken: () => sessionStorage.getItem("eco.csrf"),
  });

  return {
    listOrganizations: () => api.organizations.list(),
    getOrganization: (id) => api.organizations.get(id),
    createOrganization: (input) => api.organizations.create(input),
    updateOrganization: (id, input) => api.organizations.update(id, input),
    listMembers: (organizationId) => api.members.list(organizationId),
    inviteMember: (organizationId, input) => api.members.invite(organizationId, input),
    updateMemberRole: (organizationId, membershipId, role) =>
      api.members.updateRole(organizationId, membershipId, { role }),
    listUsers: async (organizationId, query) => {
      const page = await api.users.list(query);
      const members = await api.members.list(organizationId);
      const roles = new Map(members.items.map((member) => [member.userId, member.role]));
      return {
        ...page,
        items: page.items.flatMap((user) => {
          const role = roles.get(user.id);
          return role ? [{ ...user, role }] : [];
        }),
      };
    },
    getUser: async (organizationId, id) => {
      const user = await api.users.get(id);
      const members = await api.members.list(organizationId);
      const membership = members.items.find((member) => member.userId === id);
      if (!membership) throw new Error("not_found");
      return { ...user, role: membership.role };
    },
    createUser: async (_organizationId, input) => {
      const user = await api.users.create(input);
      return { ...user, role: input.role };
    },
    updateUser: async (_organizationId, id, input) => {
      const user = await api.users.update(id, input);
      return { ...user, role: input.role ?? "member" };
    },
    setUserStatus: async (_organizationId, id, status) => {
      const user = await api.users.update(id, { status });
      return { ...user, role: "member" };
    },
  };
}
