import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PermissionProvider } from "@eco-nojin/frontend-core";
import type { PermissionMap } from "@eco-nojin/frontend-core";
import { RealSessionProvider, useRealSession, AuthPanel, type RealSessionValue, type AuthPanelLabels } from "@eco-nojin/auth-client";
import { ROLE_PERMISSIONS } from "@eco-nojin/domain-types";
import type { Organization, OrganizationRole, User } from "@eco-nojin/domain-types";
import type { ApiClient } from "@eco-nojin/api-client";
import type { Membership } from "@eco-nojin/domain-types";
import { useI18n } from "@eco-nojin/i18n";

/**
 * Console session — real only.
 *
 * The session state comes from the Eco Nojin API (`/v1/auth/me`); there are no
 * fixtures and no local role switching. Roles map directly to permissions via
 * ROLE_PERMISSIONS, and the server re-checks every request.
 */

const API_BASE: string = import.meta.env.VITE_API_URL ?? "/api";

type SessionValue = {
  user: User;
  memberships: Array<{ organization: Organization; membership: { role: OrganizationRole } }>;
  activeOrg: Organization;
  role: OrganizationRole;
  setActiveOrg: (organizationId: string) => void;
  status: "loading" | "unauthenticated" | "authenticated";
  logout: () => Promise<void>;
  api: ApiClient;
};

const SessionContext = createContext<SessionValue | null>(null);

function ConsoleSessionInner({ children }: { children: ReactNode }) {
  const session = useRealSession();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const activeId = session.activeOrganizationId ?? session.memberships[0]?.organizationId ?? null;
  const activeMembership = session.memberships.find((m) => m.organizationId === activeId) ?? null;

  const value = useMemo<SessionValue | null>(() => {
    if (session.status !== "authenticated" || !session.user || !activeMembership || !session.activeOrganization) {
      return null;
    }
    return {
      user: session.user,
      memberships: session.memberships.map((membership) => {
        // `/v1/auth/me` embeds the organization summary per membership; the
        // active one is fetched in full by RealSessionProvider.
        const withOrg = membership as Membership & { organization?: { id: string; name: string; slug: string } };
        const summary = withOrg.organization;
        const organization: Organization =
          session.activeOrganization?.id === membership.organizationId && session.activeOrganization
            ? session.activeOrganization
            : {
                id: membership.organizationId,
                name: summary?.name ?? membership.organizationId,
                slug: summary?.slug ?? membership.organizationId,
                country: "IR",
                kind: "community",
                status: "active",
                createdAt: membership.joinedAt,
              };
        return { organization, membership: { role: membership.role } };
      }),
      activeOrg: session.activeOrganization,
      role: activeMembership.role,
      setActiveOrg: (organizationId: string) => {
        session.setActiveOrganization(organizationId);
        void queryClient.invalidateQueries();
      },
      status: session.status,
      logout: session.logout,
      api: session.api,
    };
  }, [session, activeMembership, queryClient]);

  const permissions = useMemo<PermissionMap>(
    () => Object.fromEntries((ROLE_PERMISSIONS[activeMembership?.role ?? "viewer"] ?? []).map((key) => [key, true])),
    [activeMembership],
  );

  // The workspace renders only once the session is fully resolved. Pages read
  // useSession() without null-checks, so a half-ready session must never reach
  // them: loading shows a pending state, unauthenticated shows the auth panel.
  if (session.status !== "authenticated" || !value) {
    return (
      <SessionContext.Provider value={null}>
        <PermissionProvider permissions={permissions}>
          <div
            role={session.status === "loading" ? "status" : undefined}
            className="flex min-h-screen items-center justify-center p-6"
          >
            {session.status === "loading" ? (
              <p className="text-sm opacity-80">…</p>
            ) : (
              <AuthPanel labels={authLabels(t)} />
            )}
          </div>
        </PermissionProvider>
      </SessionContext.Provider>
    );
  }

  return (
    <SessionContext.Provider value={value}>
      <PermissionProvider permissions={permissions}>{children}</PermissionProvider>
    </SessionContext.Provider>
  );
}

/**
 * Labels for the unauthenticated panel, mapped from the shared catalog.
 */
function authLabels(t: (key: Parameters<ReturnType<typeof useI18n>["t"]>[0]) => string): AuthPanelLabels {
  return {
    loginTitle: t("auth.loginTitle"),
    registerTitle: t("auth.registerTitle"),
    inviteTitle: t("auth.inviteTitle"),
    email: t("auth.email"),
    password: t("auth.password"),
    name: t("auth.name"),
    organizationName: t("auth.organizationName"),
    organizationOptional: t("auth.organizationOptional"),
    inviteToken: t("auth.inviteToken"),
    submitLogin: t("auth.submitLogin"),
    submitRegister: t("auth.submitRegister"),
    submitInvite: t("auth.submitInvite"),
    switchToRegister: t("auth.switchToRegister"),
    switchToLogin: t("auth.switchToLogin"),
    switchToInvite: t("auth.switchToInvite"),
    submitting: t("auth.submitting"),
    passwordHint: t("auth.passwordHint"),
    modeLogin: t("auth.modeLogin"),
    modeRegister: t("auth.modeRegister"),
    modeInvite: t("auth.modeInvite"),
  };
}

export function ConsoleSessionProvider({
  children,
  embedded = false,
}: {
  children: ReactNode;
  /** Reuse an existing root RealSessionProvider instead of creating one. */
  embedded?: boolean;
}) {
  if (embedded) {
    return <ConsoleSessionInner>{children}</ConsoleSessionInner>;
  }
  return (
    <RealSessionProvider baseUrl={API_BASE}>
      <ConsoleSessionInner>{children}</ConsoleSessionInner>
    </RealSessionProvider>
  );
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside ConsoleSessionProvider and an authenticated session");
  return value;
}

export function useSessionOrNull(): SessionValue | null {
  return useContext(SessionContext);
}

export { API_BASE };
export type { RealSessionValue };
