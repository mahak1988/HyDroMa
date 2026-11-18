import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@eco-nojin/api-client";
import type { UserStatus } from "@eco-nojin/domain-types";
import { identityRepository } from "../../data";
import { useSession } from "../../session/DemoSession";

export type UserQuery = {
  search?: string;
  role?: string;
  status?: UserStatus | "";
  limit?: number;
  cursor?: string;
};

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: () => identityRepository.listOrganizations(),
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: ["organization", id],
    queryFn: () => identityRepository.getOrganization(id),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useMembers(organizationId: string) {
  return useQuery({
    queryKey: ["members", organizationId],
    queryFn: () => identityRepository.listMembers(organizationId),
    enabled: Boolean(organizationId),
  });
}

export function useUsers(query: UserQuery) {
  const { activeOrg } = useSession();
  return useQuery({
    queryKey: ["users", activeOrg.id, query],
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
    queryKey: ["user", activeOrg.id, id],
    queryFn: () => identityRepository.getUser(activeOrg.id, id),
    enabled: Boolean(id),
    retry: false,
  });
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