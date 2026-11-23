import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@eco-nojin/api-client";
import { queryKeysFactory, withScope } from "@eco-nojin/frontend-core";
import type { UserStatus } from "@eco-nojin/domain-types";
import { identityRepository } from "../../data";
import { useSession } from "../../session/Session";

export type UserQuery = {
  search?: string;
  role?: string;
  status?: UserStatus | "";
  limit?: number;
  cursor?: string;
};

/**
 * Query keys for the identity slice.
 *
 * Every key is scoped by the active organization, so switching tenant in the
 * org switcher changes the key and the cache cannot serve one tenant's rows to
 * another. Mutations invalidate `lists()`; detail screens invalidate `detail(id)`.
 */
export const identityKeys = {
  organizations: queryKeysFactory("organizations"),
  users: queryKeysFactory("users"),
  members: queryKeysFactory("members"),
};

export function useOrganizations() {
  return useQuery({
    queryKey: withScope("platform", identityKeys.organizations.lists()),
    queryFn: () => identityRepository.listOrganizations(),
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: withScope("platform", identityKeys.organizations.detail(id)),
    queryFn: () => identityRepository.getOrganization(id),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useMembers(organizationId: string) {
  return useQuery({
    queryKey: withScope(organizationId, identityKeys.members.list({ organizationId })),
    queryFn: () => identityRepository.listMembers(organizationId),
    enabled: Boolean(organizationId),
  });
}

export function useUsers(query: UserQuery) {
  const { activeOrg } = useSession();
  return useQuery({
    queryKey: withScope(activeOrg.id, identityKeys.users.list(query)),
    queryFn: () =>
      identityRepository.listUsers(activeOrg.id, {
        search: query.search,
        role: query.role,
        status: query.status,
        limit: query.limit,
        cursor: query.cursor,
      }),
    placeholderData: (previous) => previous,
  });
}

export function useUser(id: string) {
  const { activeOrg } = useSession();
  return useQuery({
    queryKey: withScope(activeOrg.id, identityKeys.users.detail(id, { organizationId: activeOrg.id })),
    queryFn: () => identityRepository.getUser(activeOrg.id, id),
    enabled: Boolean(id),
    retry: false,
  });
}

/** Invalidate every users list (and optionally one detail) for the active org. */
export function userInvalidationKeys(organizationId: string, id?: string) {
  const scoped = (key: readonly unknown[]) => withScope(organizationId, key);
  return id === undefined
    ? [scoped(identityKeys.users.lists())]
    : [scoped(identityKeys.users.lists()), scoped(identityKeys.users.detail(id))];
}

/** Maps ApiError.messageKey to a translation key the catalogs actually contain. */
export function isKnownMessageKey(key: string): boolean {
  return key.startsWith("validation.") || key.startsWith("errorCodes.");
}

export function apiErrorMessage(error: unknown, translate: (key: string) => string): string {
  if (error instanceof ApiError && isKnownMessageKey(error.messageKey)) {
    return translate(error.messageKey);
  }
  return translate("errorCodes.generic");
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.code === "not_found";
}