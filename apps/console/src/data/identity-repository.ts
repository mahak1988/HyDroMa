/**
 * Identity repository contract — the only data surface the console identity
 * features may use. Implementations: HTTP (the real Eco Nojin API).
 */
import type {
  Invitation,
  Membership,
  Organization,
  OrganizationRole,
  Paginated,
  User,
  UserStatus,
} from "@eco-nojin/domain-types";
import type {
  InvitationCreateInput,
  OrganizationCreateInput,
  OrganizationUpdateInput,
  UserCreateInput,
  UserUpdateInput,
} from "@eco-nojin/validation";

/** A user together with the role it holds in the requested organization. */
export type UserWithRole = User & { role: OrganizationRole };

export type IdentityRepository = {
  listOrganizations(): Promise<Paginated<Organization>>;
  getOrganization(id: string): Promise<Organization>;
  createOrganization(input: OrganizationCreateInput): Promise<Organization>;
  updateOrganization(id: string, input: OrganizationUpdateInput): Promise<Organization>;
  listMembers(organizationId: string): Promise<Paginated<Membership>>;
  inviteMember(organizationId: string, input: InvitationCreateInput): Promise<Invitation>;
  updateMemberRole(organizationId: string, membershipId: string, role: OrganizationRole): Promise<Membership>;
  listUsers(
    organizationId: string,
    query: { search?: string; role?: string; status?: string; limit?: number; cursor?: string },
  ): Promise<Paginated<UserWithRole>>;
  getUser(organizationId: string, id: string): Promise<UserWithRole>;
  createUser(organizationId: string, input: UserCreateInput): Promise<UserWithRole>;
  updateUser(organizationId: string, id: string, input: UserUpdateInput): Promise<UserWithRole>;
  setUserStatus(organizationId: string, id: string, status: UserStatus): Promise<UserWithRole>;
};
