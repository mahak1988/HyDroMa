import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PermissionProvider } from "@eco-nojin/frontend-core";
import type { PermissionMap } from "@eco-nojin/frontend-core";
import { ROLE_PERMISSIONS } from "@eco-nojin/domain-types";
import type { Organization, OrganizationRole, User } from "@eco-nojin/domain-types";
import { demoMemberships, demoUser } from "../data/mock-backend";
import { DATA_MODE } from "../data";

const ORG_KEY = "eco.console.org";

type SessionValue = {
  user: User;
  memberships: Array<{ organization: Organization; membership: { role: OrganizationRole } }>;
  activeOrg: Organization;
  role: OrganizationRole;
  setActiveOrg: (organizationId: string) => void;
  dataMode: "demo" | "http";
};

const SessionContext = createContext<SessionValue | null>(null);

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const memberships = useMemo(() => demoMemberships(), []);
  const user = useMemo(() => demoUser(), []);
  const fallbackOrg = memberships[0];
  const [activeId, setActiveId] = useState(() => {
    try {
      return window.localStorage.getItem(ORG_KEY) ?? fallbackOrg?.organization.id ?? "";
    } catch {
      return fallbackOrg?.organization.id ?? "";
    }
  });
  const active = memberships.find((item) => item.organization.id === activeId) ?? fallbackOrg;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!active) return;
    try {
      window.localStorage.setItem(ORG_KEY, active.organization.id);
    } catch {
      // preference persistence is best effort
    }
    void queryClient.invalidateQueries();
  }, [active, queryClient]);

  if (!active) throw new Error("Demo session has no organization membership");

  const permissions = useMemo<PermissionMap>(
    () => Object.fromEntries(ROLE_PERMISSIONS[active.membership.role].map((key) => [key, true])),
    [active],
  );

  const value = useMemo<SessionValue>(
    () => ({
      user,
      memberships,
      activeOrg: active.organization,
      role: active.membership.role,
      setActiveOrg: setActiveId,
      dataMode: DATA_MODE,
    }),
    [active, memberships, user],
  );

  return (
    <PermissionProvider permissions={permissions} isFixture>
      <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
    </PermissionProvider>
  );
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside DemoSessionProvider");
  return value;
}