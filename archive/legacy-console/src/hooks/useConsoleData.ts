/**
 * Real console data hooks.
 *
 * Every query talks to the Eco Nojin API through the session's typed client;
 * there is no fixture fallback. Health comes from the API's /health endpoint,
 * notifications from the audit-derived /v1/notifications endpoint.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "../session/Session";

export type NotificationItem = {
  id: number;
  organizationId: string | null;
  actorId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  at: string;
  unread: boolean;
};

export type NotificationsPayload = { items: NotificationItem[]; unread: number };

export type HealthPayload = { status: string; service: string; version: string };

export const API_BASE: string = import.meta.env.VITE_API_URL ?? "/api";

export function useNotifications() {
  const { status } = useSession();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<NotificationsPayload> => {
      const response = await fetch(`${API_BASE}/v1/notifications`, { credentials: "include", signal });
      if (!response.ok) throw new Error(`notifications ${response.status}`);
      return (await response.json()) as NotificationsPayload;
    },
    enabled: status === "authenticated",
  });

  const markAllSeen = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/v1/notifications/seen`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error(`seen ${response.status}`);
      return (await response.json()) as { ok: boolean; unread: number };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return { ...query, markAllSeen };
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<HealthPayload> => {
      const response = await fetch(`${API_BASE}/health`, { signal });
      if (!response.ok) throw new Error(`health ${response.status}`);
      return (await response.json()) as HealthPayload;
    },
    staleTime: 30_000,
    retry: 1,
  });
}
