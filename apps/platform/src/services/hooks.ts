/**
 * Shared query layer for the platform workspace (TanStack Query).
 *
 * Every hook is thin: it reads the authoritative API client from the real
 * session and exposes typed query/mutation results. There is NO fallback to
 * demo data â€” an unreachable backend surfaces as an error state the UI renders
 * honestly. Non-idempotent mutations are never auto-retried (the transport only
 * retries GET), matching the API client policy.
 */
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useRealSession } from "@eco-nojin/auth-client";
import type { ApiClient } from "@eco-nojin/api-client";
import type {
  AdjustmentRequest,
  Challenge,
  EcoCoinReconcile,
  EcoCoinSummary,
  HicStatus,
  HydromaRun,
  SoilProfile,
  SoilObservation,
  EnvParameter,
  EnvObservation,
  LedgerEntry,
  LedgerQuery,
  Participation,
  RewardRule,
  VerifyResult,
} from "@eco-nojin/api-client";
import type { ResourceType } from "./capabilities";

export type ResourceRecord = { id: string; type?: string; [key: string]: unknown };
export type ResourcePage = { items: ResourceRecord[]; nextCursor: string | null; total: number };

const STALE_MS = 30_000;

function useApi(): ApiClient {
  return useRealSession().api;
}

/** List a generic resource collection (landscapes, villages, projects, â€¦). */
export function useResourceList(
  type: ResourceType,
  query: { search?: string } = {},
): UseQueryResult<ResourcePage> {
  const api = useApi();
  return useQuery({
    queryKey: ["resources", type, query.search ?? ""],
    queryFn: ({ signal }) => api.resources.list(type, { search: query.search }, { signal }) as Promise<ResourcePage>,
    staleTime: STALE_MS,
  });
}

/** Fetch a single resource record by id. */
export function useResource(type: ResourceType, id: string): UseQueryResult<ResourceRecord> {
  const api = useApi();
  return useQuery({
    queryKey: ["resources", type, id],
    queryFn: ({ signal }) => api.resources.get(type, id, { signal }) as Promise<ResourceRecord>,
    staleTime: STALE_MS,
  });
}

/** Create a resource record (write role required by the backend). */
export function useCreateResource(type: ResourceType) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.resources.create(type, payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["resources", type] });
    },
  });
}

/** Update a resource record (PATCH; write role required). */
export function useUpdateResource(type: ResourceType) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) => api.resources.update(type, id, patch),
    onSuccess: (_data, { id }) => {
      void client.invalidateQueries({ queryKey: ["resources", type] });
      void client.invalidateQueries({ queryKey: ["resources", type, id] });
    },
  });
}

/** Delete a resource record (DELETE; owner/admin only, enforced by the backend). */
export function useDeleteResource(type: ResourceType) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.resources.remove(type, id),
    onSuccess: (_data, id) => {
      void client.invalidateQueries({ queryKey: ["resources", type] });
      void client.invalidateQueries({ queryKey: ["resources", type, id] });
    },
  });
}

/** Advance a resource through a backend-enforced status workflow (projects, crop cycles). */
export function useTransitionResource(type: ResourceType) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, to, ...extra }: { id: string; to: string; [key: string]: unknown }) =>
      api.resources.transition(type, id, to, extra),
    onSuccess: (_data, { id }) => {
      void client.invalidateQueries({ queryKey: ["resources", type] });
      void client.invalidateQueries({ queryKey: ["resources", type, id] });
    },
  });
}

export type CatalogProduct = {
  id: string;
  slug: string;
  sellerId: string | null;
  categoryId: string | null;
  name: string;
  price: { amountMinor: number; currency: string };
  unit: string;
  stock: number;
};
export type CatalogSeller = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  country: string;
  region: string | null;
  verification: string;
  summary: string | null;
};
export type CatalogCategory = { id: string; parentId: string | null; labelKey: string };
export type CatalogPage<T> = { items: T[]; nextCursor: string | null; total: number };

export function useProducts(): UseQueryResult<CatalogPage<CatalogProduct>> {
  const api = useApi();
  return useQuery({
    queryKey: ["catalog", "products"],
    queryFn: ({ signal }) => api.catalog.products({}, { signal }) as Promise<CatalogPage<CatalogProduct>>,
    staleTime: STALE_MS,
  });
}

export function useSellers(): UseQueryResult<CatalogPage<CatalogSeller>> {
  const api = useApi();
  return useQuery({
    queryKey: ["catalog", "sellers"],
    queryFn: ({ signal }) => api.catalog.sellers(undefined, { signal }) as Promise<CatalogPage<CatalogSeller>>,
    staleTime: STALE_MS,
  });
}

export function useCategories(): UseQueryResult<CatalogPage<CatalogCategory>> {
  const api = useApi();
  return useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: ({ signal }) => api.catalog.categories({ signal }) as Promise<CatalogPage<CatalogCategory>>,
    staleTime: STALE_MS,
  });
}

export type CreateProductInput = {
  name: string;
  priceMinor: number;
  currency?: string;
  unit?: string;
  stock?: number;
  sellerId?: string;
  categoryId?: string;
};

/** Create a catalog product (write role required by the backend). */
export function useCreateProduct() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductInput) => api.catalog.createProduct(payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["catalog", "products"] });
    },
  });
}

export function useNotifications(): UseQueryResult<{ items: Array<{ id: number; action: string; entity: string; entityId: string; at: string; unread: boolean }>; unread: number }> {
  const api = useApi();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: ({ signal }) => api.notifications.list({ signal }),
    staleTime: 15_000,
  });
}

export function useMarkNotificationsSeen() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.notifications.markSeen(),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useSoilProfiles(farmId?: string): UseQueryResult<{ items: SoilProfile[]; total: number }> {
  const api = useApi();
  const organizationId = useActiveOrg();
  return useQuery({
    queryKey: ["soil", "profiles", organizationId ?? "", farmId ?? ""],
    queryFn: ({ signal }) => api.soil.listProfiles(farmId ? { farmId } : undefined, { signal }),
    staleTime: STALE_MS,
  });
}

export function useCreateSoilProfile() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; layers: Array<Record<string, unknown>>; source?: string; farmId?: string; projectId?: string; notes?: string }) =>
      api.soil.createProfile(payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["soil", "profiles"] });
    },
  });
}

export function useSoilVersions(profileId: string): UseQueryResult<{ items: Array<{ id: string; profileId: string; version: number; layers: Array<Record<string, unknown>>; source: string; notes: string | null; createdAt: string }>; total: number }> {
  const api = useApi();
  return useQuery({
    queryKey: ["soil", "versions", profileId],
    queryFn: ({ signal }) => api.soil.listVersions(profileId, { signal }),
    enabled: Boolean(profileId),
    staleTime: STALE_MS,
  });
}

export function useSoilObservations(farmId?: string): UseQueryResult<{ items: SoilObservation[]; total: number }> {
  const api = useApi();
  const organizationId = useActiveOrg();
  return useQuery({
    queryKey: ["soil", "observations", organizationId ?? "", farmId ?? ""],
    queryFn: ({ signal }) => api.soil.listObservations(farmId ? { farmId } : undefined, { signal }),
    staleTime: STALE_MS,
  });
}

export function useCreateSoilObservation() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: { farmId?: string; projectId?: string; profileId?: string; observedAt: string; depthMm?: number; parameter: string; value: number; unit: string; source?: string; method?: string; instrument?: string; quality?: string; notes?: string }) =>
      api.soil.createObservation(payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["soil", "observations"] });
    },
  });
}

export function useUpdateSoilProfile() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { layers?: Array<Record<string, unknown>>; source?: string; notes?: string } }) => api.soil.updateProfile(id, payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["soil", "profiles"] });
      void client.invalidateQueries({ queryKey: ["soil", "versions"] });
    },
  });
}

export function useExecuteRun() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, modelInput }: { id: string; modelInput: Record<string, unknown> }) => api.hydroma.executeRun(id, modelInput),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["hydroma", "runs"] });
      void client.invalidateQueries({ queryKey: ["hydroma", "run"] });
    },
  });
}

export function useCreateDatasetRun() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: { runKey: string; modelId: string; modelVersion: string; input: Record<string, unknown>; datasetId?: string; farmId?: string; projectId?: string }) => api.hydroma.createRun(payload),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["hydroma", "runs"] }); },
  });
}

export function useDatasets(): UseQueryResult<{ items: Array<{ id: string; farmId: string | null; projectId: string | null; startDate: string; endDate: string; readiness: string; coverage: number; createdAt: string }>; total: number }> {
  const api = useApi();
  return useQuery({ queryKey: ["datasets"], queryFn: ({ signal }) => api.datasets.list({ signal }), staleTime: STALE_MS });
}

export function useAssembleDataset() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: { farmId?: string; projectId?: string; startDate: string; endDate: string; parameters: string[] }) => api.datasets.assemble(payload),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["datasets"] }); },
  });
}

export function useDatasetModelInput() {
  const api = useApi();
  return useMutation({ mutationFn: ({ id, modelId, modelVersion }: { id: string; modelId: string; modelVersion: string }) => api.datasets.modelInput(id, { modelId, modelVersion }) });
}

export function useEnvParameters(): UseQueryResult<{ items: EnvParameter[]; total: number }> {
  const api = useApi();
  return useQuery({ queryKey: ["env", "parameters"], queryFn: ({ signal }) => api.envData.listParameters({ signal }), staleTime: STALE_MS });
}

export function useEnvObservations(farmId?: string): UseQueryResult<{ items: EnvObservation[]; total: number }> {
  const api = useApi();
  const organizationId = useActiveOrg();
  return useQuery({
    queryKey: ["env", "observations", organizationId ?? "", farmId ?? ""],
    queryFn: ({ signal }) => api.envData.listObservations(farmId ? { farmId } : undefined, { signal }),
    staleTime: STALE_MS,
  });
}

export function useEnvImports(): UseQueryResult<{ items: Array<{ id: string; filename: string; source: string; status: string; total: number; imported: number; rejected: number; duplicates: number; createdAt: string }>; total: number }> {
  const api = useApi();
  return useQuery({ queryKey: ["env", "imports"], queryFn: ({ signal }) => api.envData.listImports({ signal }), staleTime: STALE_MS });
}

export function useImportEnvCsv() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: { csv: string; filename?: string; source?: string; farmId?: string; projectId?: string }) => api.envData.importCsv(payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["env", "observations"] });
      void client.invalidateQueries({ queryKey: ["env", "imports"] });
    },
  });
}

export function useHydromaRuns(limit = 20, farmId?: string): UseQueryResult<{ items: HydromaRun[]; total: number; nextCursor: string | null }> {
  const api = useApi();
  const organizationId = useActiveOrg();
  return useQuery({
    queryKey: ["hydroma", "runs", organizationId ?? "", limit, farmId ?? ""],
    queryFn: ({ signal }) => api.hydroma.listRuns({ limit: String(limit), ...(farmId ? { farmId } : {}) }, { signal }) as Promise<{ items: HydromaRun[]; total: number; nextCursor: string | null }>,
    staleTime: STALE_MS,
  });
}

export function useHydromaRun(id: string): UseQueryResult<{ run: HydromaRun }> {
  const api = useApi();
  return useQuery({
    queryKey: ["hydroma", "run", id],
    queryFn: ({ signal }) => api.hydroma.getRun(id, { signal }),
    enabled: Boolean(id),
    staleTime: STALE_MS,
  });
}

export function useCreateIrrigationRun() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: { runKey: string; input: Record<string, unknown>; farmId?: string; cropCycleId?: string; projectId?: string; soilProfileId?: string; soilProfileVersion?: number; correlationId?: string }) =>
      api.hydroma.createIrrigationRun(payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["hydroma", "runs"] });
    },
  });
}

export function useModels(): UseQueryResult<{ models: Array<{ id: string; version: string; title?: string; domain?: string; scientific_status?: string; maturity?: string }>; source?: string }> {
  const api = useApi();
  return useQuery({
    queryKey: ["models"],
    queryFn: ({ signal }) => api.models.list({ signal }),
    staleTime: STALE_MS,
  });
}

/* ---------------------- Phase 3.64 rewards & challenges ----------------- */

export type ChallengePage = { items: Challenge[]; nextCursor: string | null; total: number };
export type ParticipationPage = { items: Participation[]; nextCursor: string | null; total: number };
export type RewardRulePage = { items: RewardRule[]; nextCursor: string | null; total: number };
export type LedgerPage = { items: LedgerEntry[]; nextCursor: string | null; total: number };

/** Active organization from the session (the server re-validates it). */
function useActiveOrg(): string | undefined {
  return useRealSession().activeOrganizationId ?? undefined;
}

export function useChallenges(): UseQueryResult<ChallengePage> {
  const api = useApi();
  const organizationId = useActiveOrg();
  return useQuery({
    queryKey: ["challenges", organizationId ?? ""],
    queryFn: ({ signal }) => api.challenges.list(organizationId, { signal }) as Promise<ChallengePage>,
    staleTime: STALE_MS,
  });
}

export function useChallenge(id: string): UseQueryResult<Challenge> {
  const api = useApi();
  return useQuery({
    queryKey: ["challenges", id],
    queryFn: ({ signal }) => api.challenges.get(id, { signal }),
    staleTime: STALE_MS,
  });
}

export function useCreateChallenge() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof api.challenges.create>[0]) => api.challenges.create(payload),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["challenges"] }),
  });
}

export function useUpdateChallenge() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof api.challenges.update>[1] }) => api.challenges.update(id, patch),
    onSuccess: (_data, { id }) => {
      void client.invalidateQueries({ queryKey: ["challenges"] });
      void client.invalidateQueries({ queryKey: ["challenges", id] });
    },
  });
}

export function useTransitionChallenge() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, to }: { id: string; to: string }) => api.challenges.transition(id, to),
    onSuccess: (_data, { id }) => {
      void client.invalidateQueries({ queryKey: ["challenges"] });
      void client.invalidateQueries({ queryKey: ["challenges", id] });
    },
  });
}

export function useParticipateChallenge() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.challenges.participate(id),
    onSuccess: (_data, id) => {
      void client.invalidateQueries({ queryKey: ["challenges"] });
      void client.invalidateQueries({ queryKey: ["challenges", id] });
      void client.invalidateQueries({ queryKey: ["challenge-participations", id] });
    },
  });
}

export function useChallengeParticipations(id: string): UseQueryResult<ParticipationPage> {
  const api = useApi();
  return useQuery({
    queryKey: ["challenge-participations", id],
    queryFn: ({ signal }) => api.challenges.listParticipations(id, { signal }) as Promise<ParticipationPage>,
    staleTime: STALE_MS,
  });
}

export function useVerifyParticipation(challengeId: string) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ participationId, verification }: { participationId: string; verification?: string }) =>
      api.challenges.verify(challengeId, participationId, { verification }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["challenge-participations", challengeId] });
      void client.invalidateQueries({ queryKey: ["challenges"] });
      void client.invalidateQueries({ queryKey: ["ecocoin"] });
    },
  });
}

export function useRewardRules(): UseQueryResult<RewardRulePage> {
  const api = useApi();
  const organizationId = useActiveOrg();
  return useQuery({
    queryKey: ["reward-rules", organizationId ?? ""],
    queryFn: ({ signal }) => api.rewards.listRules(organizationId, { signal }) as Promise<RewardRulePage>,
    staleTime: STALE_MS,
  });
}

export function useCreateRewardRule() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof api.rewards.createRule>[0]) => api.rewards.createRule(payload),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["reward-rules"] }),
  });
}

export function useUpdateRewardRule() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof api.rewards.updateRule>[1] }) => api.rewards.updateRule(id, patch),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["reward-rules"] }),
  });
}

export type UserRow = { id: string; name: string; email: string; role?: string };

/** Organization member list (for admin assignment/adjustment dialogs). */
export function useUsers(): UseQueryResult<{ items: UserRow[]; nextCursor: string | null; total: number }> {
  const api = useApi();
  const organizationId = useActiveOrg();
  return useQuery({
    queryKey: ["users", organizationId ?? ""],
    queryFn: ({ signal }) => api.users.list({}, { signal }) as Promise<{ items: UserRow[]; nextCursor: string | null; total: number }>,
    staleTime: STALE_MS,
  });
}

export function useEcoCoinSummary(): UseQueryResult<EcoCoinSummary> {
  const api = useApi();
  return useQuery({
    queryKey: ["ecocoin", "summary"],
    queryFn: ({ signal }) => api.ecocoin.summary({ signal }),
    staleTime: 15_000,
  });
}

export function useEcoCoinLedger(filters: LedgerQuery = {}): UseQueryResult<LedgerPage> {
  const api = useApi();
  const organizationId = useActiveOrg();
  const query: LedgerQuery = { ...filters, organizationId: filters.organizationId ?? organizationId };
  return useQuery({
    queryKey: ["ecocoin", "ledger", query],
    queryFn: ({ signal }) => api.ecocoin.ledger(query, { signal }) as Promise<LedgerPage>,
    staleTime: STALE_MS,
  });
}

export function useEcoCoinReconcile(): UseQueryResult<EcoCoinReconcile> {
  const api = useApi();
  return useQuery({
    queryKey: ["ecocoin", "reconcile"],
    queryFn: ({ signal }) => api.ecocoin.reconcile({ signal }),
    staleTime: STALE_MS,
  });
}

export function useAdjustEcoCoin() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof api.ecocoin.adjust>[0]) => api.ecocoin.adjust(payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["ecocoin"] });
      void client.invalidateQueries({ queryKey: ["ecocoin", "ledger"] });
    },
  });
}

export type { Challenge, EcoCoinReconcile, EcoCoinSummary, LedgerEntry, Participation, RewardRule, VerifyResult };

export type AdjustmentRequestPage = { items: AdjustmentRequest[]; nextCursor: string | null; total: number };

/** Pending/approved/rejected manual EcoCoin correction requests (four-eyes). */
export function useAdjustmentRequests(): UseQueryResult<AdjustmentRequestPage> {
  const api = useApi();
  return useQuery({
    queryKey: ["ecocoin", "adjustment-requests"],
    queryFn: ({ signal }) => api.ecocoin.listAdjustmentRequests({ signal }) as Promise<AdjustmentRequestPage>,
    staleTime: STALE_MS,
  });
}

export function useApproveAdjustmentRequest() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.ecocoin.approveAdjustmentRequest(id, note),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["ecocoin", "adjustment-requests"] });
      void client.invalidateQueries({ queryKey: ["ecocoin"] });
    },
  });
}

export function useRejectAdjustmentRequest() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.ecocoin.rejectAdjustmentRequest(id, note),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["ecocoin", "adjustment-requests"] });
      void client.invalidateQueries({ queryKey: ["ecocoin"] });
    },
  });
}

export function useExecuteAdjustmentRequest() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.ecocoin.executeAdjustmentRequest(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["ecocoin", "adjustment-requests"] });
      void client.invalidateQueries({ queryKey: ["ecocoin"] });
    },
  });
}

export function useRequestAdjustment() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: { targetUserId: string; amount: number; entryType: "credit" | "debit"; reason: string }) =>
      api.ecocoin.requestAdjustment(payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["ecocoin", "adjustment-requests"] });
    },
  });
}

/** Submit structured evidence for the current user's participation. */
export function useSubmitEvidence(challengeId: string) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ participationId, payload }: { participationId: string; payload: { evidenceType: string; sourceType?: string; sourceId?: string; description: string } }) =>
      api.challenges.submitEvidence(challengeId, participationId, payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["challenges", challengeId] });
    },
  });
}

/** Reviewer approve/reject a submission (server issues reward idempotently on approve). */
export function useReviewParticipation(challengeId: string) {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ participationId, decision }: { participationId: string; decision: "approve" | "reject" }) =>
      api.challenges.review(challengeId, participationId, { decision }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["challenges", challengeId] });
      void client.invalidateQueries({ queryKey: ["ecocoin"] });
    },
  });
}

/** Fetch a participation's submitted evidence (for reviewer inspection). */
export function useParticipationEvidence(challengeId: string, participationId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["challenges", challengeId, "evidence", participationId],
    queryFn: ({ signal }) => api.challenges.getEvidence(challengeId, participationId, { signal }),
    staleTime: STALE_MS,
  });
}
/** List agricultural tasks (bounded; optional filters). */
export function useAgriTasks(query: Record<string, string> = {}) {
  const api = useApi();
  return useQuery({
    queryKey: ["agri", "tasks", query],
    queryFn: ({ signal }) => api.agri.tasks(query, { signal }),
    staleTime: STALE_MS,
  });
}

export function useCreateTask() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof api.agri.createTask>[0]) => api.agri.createTask(payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["agri"] });
    },
  });
}

export function useUpdateTask() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) => api.agri.updateTask(id, patch),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["agri"] });
    },
  });
}

export function useTransitionTask() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, to, completionNote }: { id: string; to: string; completionNote?: string }) => api.agri.transition(id, { to, completionNote }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["agri"] });
    },
  });
}

export function useTaskEvents(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["agri", "tasks", id, "events"],
    queryFn: ({ signal }) => api.agri.events(id, { signal }),
    staleTime: STALE_MS,
  });
}

export function useTask(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["agri", "tasks", id],
    queryFn: ({ signal }) => api.agri.getTask(id, { signal }),
    staleTime: STALE_MS,
  });
}

export function useOrgMembers(orgId?: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["members", orgId ?? "none"],
    queryFn: ({ signal }) => api.members.list(orgId ?? "", { signal }),
    enabled: !!orgId,
    staleTime: STALE_MS,
  });
}

export function useFarmTimeline(farmId: string, query: Record<string, string> = {}) {
  const api = useApi();
  return useQuery({
    queryKey: ["agri", "farms", farmId, "timeline", query],
    queryFn: ({ signal }) => api.agri.timeline(farmId, query, { signal }),
    staleTime: STALE_MS,
  });
}

export function useActivities(query: Record<string, string> = {}) {
  const api = useApi();
  return useQuery({ queryKey: ["community", "activities", query], queryFn: ({ signal }) => api.community.activities(query, { signal }), staleTime: STALE_MS });
}
export function useCreateActivity() {
  const api = useApi(); const client = useQueryClient();
  return useMutation({ mutationFn: (p: Record<string, unknown>) => api.community.createActivity(p), onSuccess: () => { void client.invalidateQueries({ queryKey: ["community"] }); } });
}
export function useTransitionActivity() {
  const api = useApi(); const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, to }: { id: string; to: string }) => api.community.transition(id, to), onSuccess: () => { void client.invalidateQueries({ queryKey: ["community"] }); } });
}
export function useParticipants(id: string) {
  const api = useApi();
  return useQuery({ queryKey: ["community", "activities", id, "participants"], queryFn: ({ signal }) => api.community.participants(id, { signal }), staleTime: STALE_MS });
}
export function useRegisterParticipant(id: string) {
  const api = useApi(); const client = useQueryClient();
  return useMutation({ mutationFn: () => api.community.register(id), onSuccess: () => { void client.invalidateQueries({ queryKey: ["community", "activities", id] }); } });
}
export function useParticipantOp(id: string) {
  const api = useApi(); const client = useQueryClient();
  return useMutation({ mutationFn: ({ userId, op }: { userId: string; op: "confirm" | "attend" | "cancel" }) => api.community.participantOp(id, userId, op), onSuccess: () => { void client.invalidateQueries({ queryKey: ["community", "activities", id] }); } });
}

export function useIntelligence() {
  const api = useApi();
  return useQuery({ queryKey: ["agri", "intelligence"], queryFn: ({ signal }) => api.agri.intelligence({ signal }), staleTime: STALE_MS });
}

export function useReadiness(farmId: string, cropCycleId?: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["hydroma", "readiness", farmId, cropCycleId ?? ""],
    queryFn: ({ signal }) => api.hydroma.readiness(farmId, cropCycleId, { signal }),
    enabled: !!farmId,
    staleTime: STALE_MS,
  });
}

export function useAssessments(farmId?: string) {
  const api = useApi();
  return useQuery({ queryKey: ["hydroma", "assessments", farmId ?? "all"], queryFn: ({ signal }) => api.hydroma.listAssessments(farmId, { signal }), staleTime: STALE_MS });
}
export function useCreateAssessment() {
  const api = useApi(); const client = useQueryClient();
  return useMutation({ mutationFn: (p: { farmId: string; cropCycleId?: string }) => api.hydroma.createAssessment(p), onSuccess: () => { void client.invalidateQueries({ queryKey: ["hydroma"] }); } });
}
export function useAssessment(id: string) {
  const api = useApi();
  return useQuery({ queryKey: ["hydroma", "assessments", id], queryFn: ({ signal }) => api.hydroma.getAssessment(id, { signal }), enabled: !!id, staleTime: STALE_MS });
}
export function useReviewAssessment() {
  const api = useApi(); const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, decision, note }: { id: string; decision: "acceptable" | "findings"; note?: string }) => api.hydroma.reviewAssessment(id, { decision, note }), onSuccess: () => { void client.invalidateQueries({ queryKey: ["hydroma"] }); } });
}
export function useReviews(id: string) {
  const api = useApi();
  return useQuery({ queryKey: ["hydroma", "assessments", id, "reviews"], queryFn: ({ signal }) => api.hydroma.reviews(id, { signal }), enabled: !!id, staleTime: STALE_MS });
}

export function useEnvSources(category?: string) {
  const api = useApi();
  return useQuery({ queryKey: ["env", "sources", category ?? "all"], queryFn: ({ signal }) => api.env.sources(category, { signal }), staleTime: STALE_MS });
}
export function useCreateSource() {
  const api = useApi(); const client = useQueryClient();
  return useMutation({ mutationFn: (p: Record<string, unknown>) => api.env.createSource(p), onSuccess: () => { void client.invalidateQueries({ queryKey: ["env"] }); } });
}

/* -------------------------------- HIC ---------------------------------- */

/** HIC status â€” read-only, inactive, non-financial foundation. */
export function useHicStatus() {
  const api = useApi();
  return useQuery({
    queryKey: ["hic", "status"],
    queryFn: ({ signal }) => api.hic.status({ signal }) as Promise<HicStatus>,
    staleTime: STALE_MS,
  });
}
