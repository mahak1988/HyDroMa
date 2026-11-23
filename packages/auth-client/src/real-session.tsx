/**
 * Real session primitives.
 *
 * State machine: loading -> unauthenticated | authenticated.
 * The API (cookie session) is the single authority; this module only mirrors it.
 * No fixture data and no localStorage role switching — a signed-out user is a
 * signed-out user.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createApiClient, type ApiClient, type LoginInput, type RegisterInput } from "@eco-nojin/api-client";
import type { Membership, Organization, User } from "@eco-nojin/domain-types";

export type SessionStatus = "loading" | "unauthenticated" | "authenticated";

export type RealSessionValue = {
  status: SessionStatus;
  user: User | null;
  memberships: Membership[];
  activeOrganizationId: string | null;
  activeOrganization: Organization | null;
  role: Membership["role"] | null;
  api: ApiClient;
  refresh: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  acceptInvite: (input: { token: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  setActiveOrganization: (organizationId: string) => void;
};

const SessionContext = createContext<RealSessionValue | null>(null);

export function RealSessionProvider({
  baseUrl,
  children,
  onUnauthorized,
}: {
  baseUrl: string;
  children: ReactNode;
  onUnauthorized?: () => void;
}) {
  const api = useMemo(() => createApiClient({ baseUrl }), [baseUrl]);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);

  const refresh = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setUser(me.user);
      setMemberships(me.memberships);
      const stored = readStoredOrg();
      const valid = me.memberships.find((m) => m.organizationId === stored)?.organizationId;
      setActiveOrganizationId(valid ?? me.activeOrganizationId ?? me.memberships[0]?.organizationId ?? null);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setMemberships([]);
      setActiveOrganizationId(null);
      setStatus("unauthenticated");
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    if (!activeOrganizationId || status !== "authenticated") {
      setActiveOrganization(null);
      return;
    }
    api.organizations
      .get(activeOrganizationId)
      .then((organization) => {
        if (!cancelled) setActiveOrganization(organization);
      })
      .catch(() => {
        if (!cancelled) setActiveOrganization(null);
      });
    return () => {
      cancelled = true;
    };
  }, [api, activeOrganizationId, status]);

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await api.auth.login(input);
      setUser(result.user);
      setStatus("authenticated");
      await refresh();
    },
    [api, refresh],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      await api.auth.register(input);
      await refresh();
    },
    [api, refresh],
  );

  const acceptInvite = useCallback(
    async (input: { token: string; password: string }) => {
      await api.auth.acceptInvite(input);
      await refresh();
    },
    [api, refresh],
  );

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
    setMemberships([]);
    setActiveOrganizationId(null);
    setStatus("unauthenticated");
    onUnauthorized?.();
  }, [api, onUnauthorized]);

  const value = useMemo<RealSessionValue>(() => {
    const active = memberships.find((m) => m.organizationId === activeOrganizationId) ?? null;
    return {
      status,
      user,
      memberships,
      activeOrganizationId,
      activeOrganization,
      role: active?.role ?? null,
      api,
      refresh,
      login,
      register,
      acceptInvite,
      logout,
      setActiveOrganization: (organizationId: string) => {
        setActiveOrganizationId(organizationId);
        try {
          window.localStorage.setItem(ORG_KEY, organizationId);
        } catch {
          // best effort
        }
      },
    };
  }, [status, user, memberships, activeOrganizationId, activeOrganization, api, refresh, login, register, acceptInvite, logout]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

const ORG_KEY = "eco.console.org";

function readStoredOrg(): string | null {
  try {
    return window.localStorage.getItem(ORG_KEY);
  } catch {
    return null;
  }
}

export function useRealSession(): RealSessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useRealSession must be used inside RealSessionProvider");
  return value;
}
