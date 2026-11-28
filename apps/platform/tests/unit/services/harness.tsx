import { vi } from "vitest";
import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@eco-nojin/i18n";
import { ToastProvider } from "@eco-nojin/ui";
import { MemoryRouter } from "react-router-dom";

/**
 * Test-only harness for the platform API-backed pages.
 *
 * It NEVER touches the network: `useRealSession().api` is replaced with an
 * in-memory fake whose methods are vi.fn() the test controls. This verifies
 * request formation, response mapping and every UI state (loading/empty/error/
 * success) in isolation. It does not enter production runtime.
 */
export function makeApi() {
  return {
    auth: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn(), acceptInvite: vi.fn() },
    users: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), deactivate: vi.fn() },
    organizations: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn() },
    members: { list: vi.fn(), invite: vi.fn(), updateRole: vi.fn() },
    catalog: { categories: vi.fn(), sellers: vi.fn(), products: vi.fn(), createProduct: vi.fn() },
    resources: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), transition: vi.fn() },
    notifications: { list: vi.fn(), markSeen: vi.fn() },
    models: { list: vi.fn() },
        hydroma: { readiness: vi.fn(), listAssessments: vi.fn(), createIrrigationRun: vi.fn(), createRun: vi.fn(), executeRun: vi.fn(), listRuns: vi.fn(), getRun: vi.fn() },
        soil: { listProfiles: vi.fn(), createProfile: vi.fn(), getProfile: vi.fn(), updateProfile: vi.fn(), listVersions: vi.fn(), listObservations: vi.fn(), createObservation: vi.fn() },
        envData: { listParameters: vi.fn(), listObservations: vi.fn(), createObservation: vi.fn(), importCsv: vi.fn(), listImports: vi.fn() },
        datasets: { assemble: vi.fn(), list: vi.fn(), get: vi.fn(), modelInput: vi.fn() },
    env: { sources: vi.fn(), createSource: vi.fn(), updateSource: vi.fn() },
    agri: { tasks: vi.fn(), getTask: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), transition: vi.fn(), events: vi.fn(), timeline: vi.fn(), intelligence: vi.fn() },
    community: { activities: vi.fn(), getActivity: vi.fn(), createActivity: vi.fn(), updateActivity: vi.fn(), transition: vi.fn(), participants: vi.fn(), register: vi.fn(), participantOp: vi.fn(), events: vi.fn() },
    rewards: { listRules: vi.fn(), createRule: vi.fn(), updateRule: vi.fn() },
    challenges: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), transition: vi.fn(), participate: vi.fn(), listParticipations: vi.fn(), verify: vi.fn() },
        ecocoin: { ledger: vi.fn(), summary: vi.fn(), balance: vi.fn(), reconcile: vi.fn(), adjust: vi.fn(), listAdjustmentRequests: vi.fn(), requestAdjustment: vi.fn(), approveAdjustmentRequest: vi.fn(), rejectAdjustmentRequest: vi.fn(), executeAdjustmentRequest: vi.fn() },
  };
}

export type FakeApi = ReturnType<typeof makeApi>;

const { activeRef } = vi.hoisted(() => ({ activeRef: { current: null as unknown, role: "owner" as string } }));

export function setActiveApi(api: FakeApi | null): void {
  activeRef.current = api;
}

export function setActiveRole(role: string): void {
  activeRef.role = role;
}

vi.mock("@eco-nojin/auth-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@eco-nojin/auth-client")>();
  return {
    ...actual,
    useRealSession: () => {
      if (!activeRef.current) throw new Error("setActiveApi must be called before render");
      return {
        status: "authenticated",
        user: { id: "usr-test", email: "test@e2e.nojin.local", name: "Test", status: "active" },
        memberships: [],
        activeOrganizationId: "org-test",
        activeOrganization: null,
        role: activeRef.role,
        api: activeRef.current,
        refresh: async () => undefined,
        login: async () => undefined,
        register: async () => undefined,
        acceptInvite: async () => undefined,
        logout: async () => undefined,
        setActiveOrganization: () => undefined,
      };
    },
  };
});

export function renderWithProviders(ui: ReactElement, route = "/") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </ToastProvider>
      </I18nProvider>
    </QueryClientProvider>,
  );
}