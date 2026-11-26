import type {
  Invitation,
  Membership,
  Organization,
  Paginated,
  Product,
  Seller,
  User,
} from "@eco-nojin/domain-types";

/** Session payloads returned by the Eco Nojin auth endpoints. */
export type AuthMe = {
  user: User;
  memberships: Membership[];
  activeOrganizationId: string | null;
};
export type AuthResult = {
  user: User;
  organizations?: Organization[];
};
export type LoginInput = { email: string; password: string };
export type RegisterInput = {
  email: string;
  name: string;
  password: string;
  organizationName?: string;
  country?: string;
};
export type AcceptInviteInput = { token: string; password: string };
import type {
  InvitationCreateInput,
  MembershipRoleInput,
  OrganizationCreateInput,
  OrganizationUpdateInput,
  UserCreateInput,
  UserUpdateInput,
} from "@eco-nojin/validation";
import { toQuery, type ListQuery } from "./pagination";
import { createTransport, type TransportConfig } from "./transport";

/** Notification row derived from the audit log (GET /v1/notifications). */
export type NotificationItem = {
  id: number;
  organizationId: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  at: string;
  unread: boolean;
};
export type NotificationList = { items: NotificationItem[]; unread: number };

/** HIC status (GET /v1/hic/status). Controlled, inactive, non-financial. */
export type HicStatus = {
  id: string;
  version: string;
  definition: string;
  status: string;
  issuable: boolean;
  transferable: boolean;
  convertible: boolean;
  financial: boolean;
  governanceStatus: string;
  eligibilityPolicy: string | null;
  approvedActivity: string | null;
  relatedEntities: string[];
  futureActivationRequirements: string[];
  auditNote: string;
  organizationId: string;
  readAt: string;
};
export type ModelSummary = {
  id: string;
  version: string;
  domain?: string;
  title?: string;
  maturity?: string;
  scientific_status?: string;
  units?: string[];
  inputs?: unknown[];
  outputs?: unknown[];
};
export type ModelList = { models: ModelSummary[]; source?: string };

/** Reward rule (Phase 3.64): configurable EcoCoin reward definition. */
export type RewardRule = {
  id: string;
  code: string;
  title: string;
  description: string;
  ecoCoinAmount: number;
  issuanceLimit: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};
export type RewardRuleCreateInput = {
  organizationId?: string;
  code: string;
  title: string;
  description?: string;
  ecoCoinAmount?: number;
  issuanceLimit?: number | null;
};
export type RewardRuleUpdateInput = {
  title?: string;
  description?: string;
  ecoCoinAmount?: number;
  issuanceLimit?: number | null;
  status?: string;
};

/** Challenge (Phase 3.64): catalogue entry with a server-owned lifecycle. */
export type Challenge = {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  eligibility: string;
  completionCriteria: string;
  verificationMethod: string;
  rewardRuleId: string | null;
  startAt: string | null;
  endAt: string | null;
  maxParticipants: number | null;
  createdAt: string;
  updatedAt: string;
  participantCount?: number;
  myParticipation?: string | null;
};
export type ChallengeCreateInput = {
  organizationId?: string;
  code: string;
  title: string;
  description?: string;
  eligibility?: string;
  completionCriteria?: string;
  verificationMethod?: string;
  rewardRuleId?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  maxParticipants?: number | null;
};
export type ChallengeUpdateInput = {
  title?: string;
  description?: string;
  eligibility?: string;
  completionCriteria?: string;
  rewardRuleId?: string | null;
};

/** Challenge participation record. */
export type Participation = {
  id: string;
  challengeId: string;
  userId: string;
  status: string;
  verification: string | null;
  rewardIssued: boolean;
  joinedAt: string;
  completedAt: string | null;
  verifiedAt: string | null;
};
export type VerifyResult = {
  participation: Participation;
  reward: { entry: LedgerEntry | null; duplicate: boolean; limitReached?: boolean } | null;
  duplicate?: boolean;
};

/** Structured challenge evidence (source reference, no file storage). */
export type Evidence = {
  id: string;
  challengeId: string;
  participationId: string;
  userId: string;
  evidenceType: string;
  sourceType: string | null;
  sourceId: string | null;
  description: string;
  status: string;
  createdAt: string;
};

/** Agricultural task (operational work record). */
export type AgriTask = {
  id: string;
  orgId: string;
  farmId: string;
  cropCycleId: string | null;
  projectId: string | null;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigneeId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  plannedStart: string | null;
  dueAt: string | null;
  completedAt: string | null;
  completedBy: string | null;
  completionNote: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  cancelledAt: string | null;
};
export type AgriTaskEvent = { id: string; type: string; actorId: string | null; at: string; detail: Record<string, unknown> | null };
export type AgriTaskCreateInput = {
  farmId: string;
  cropCycleId?: string | null;
  projectId?: string | null;
  title: string;
  description?: string;
  category: string;
  priority?: string;
  assigneeId?: string | null;
  plannedStart?: string | null;
  dueAt?: string | null;
};

/** Community activity (operational community event). */
export type Activity = {
  id: string; orgId: string; communityId: string; title: string; description: string;
  category: string; status: string; priority: string; plannedStart: string | null; plannedEnd: string | null;
  actualStart: string | null; completedAt: string | null; cancelledAt: string | null; location: string | null;
  organizerId: string | null; createdBy: string; createdAt: string; updatedAt: string; capacity: number | null;
};
export type Participant = { id: string; activityId: string; userId: string; status: string; registeredAt: string; confirmedAt: string | null; attendedAt: string | null };
export type ActivityEvent = { id: string; type: string; actorId: string | null; at: string; detail: Record<string, unknown> | null };

/** Immutable EcoCoin ledger entry. */
export type LedgerEntry = {
  id: string;
  userId: string;
  entryType: string;
  amount: number;
  reason: string;
  source: string;
  reference: string;
  challengeId: string | null;
  participationId: string | null;
  rewardRuleId: string | null;
  at: string;
};
export type EcoCoinSummary = {
  balance: number;
  totalCredits: number;
  totalDebits: number;
  entryCount: number;
  bySource: Record<string, number>;
};
export type EcoCoinReconcile = {
  totalBalance: number;
  entryCount: number;
  memberCount: number;
  balances: Array<{ userId: string; balance: number; entries: number }>;
  anomalies: string[];
};
export type EcoCoinAdjustmentInput = {
  userId: string;
  amount: number;
  entryType: "credit" | "debit";
  reason: string;
};

export type AdjustmentRequest = {
  id: string;
  orgId: string;
  requestedBy: string;
  targetUserId: string;
  entryType: string;
  amount: number;
  reason: string;
  status: string;
  approverId: string | null;
  decisionNote: string | null;
  decidedAt: string | null;
  executedAt: string | null;
  executionReference: string | null;
  createdAt: string;
};

export type ApiClientConfig = TransportConfig;

/**
 * Single typed client for the Eco Nojin contract surface.
 * Endpoints follow `contracts/api`; no component may call `fetch` directly.
 */
export function createApiClient(config: ApiClientConfig) {
  const transport = createTransport(config);

  return {
    auth: {
      me: (options?: { signal?: AbortSignal }) =>
        transport.request<AuthMe>({ path: "v1/auth/me", signal: options?.signal }),
      login: (payload: LoginInput) =>
        transport.request<AuthResult>({ method: "POST", path: "v1/auth/login", body: payload }),
      register: (payload: RegisterInput) =>
        transport.request<AuthResult>({ method: "POST", path: "v1/auth/register", body: payload }),
      logout: () => transport.request<{ ok: boolean }>({ method: "POST", path: "v1/auth/logout" }),
      acceptInvite: (payload: AcceptInviteInput) =>
        transport.request<AuthResult>({ method: "POST", path: "v1/auth/accept-invite", body: payload }),
    },
    users: {
      list: (query: ListQuery = {}, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<User>>({ path: "v1/users", query: toQuery(query), signal: options?.signal }),
      get: (id: string, options?: { signal?: AbortSignal }) =>
        transport.request<User>({ path: `v1/users/${encodeURIComponent(id)}`, signal: options?.signal }),
      create: (payload: UserCreateInput) =>
        transport.request<User>({ method: "POST", path: "v1/users", body: payload }),
      update: (id: string, payload: UserUpdateInput) =>
        transport.request<User>({
          method: "PATCH",
          path: `v1/users/${encodeURIComponent(id)}`,
          body: payload,
        }),
      deactivate: (id: string) =>
        transport.request<User>({
          method: "PATCH",
          path: `v1/users/${encodeURIComponent(id)}`,
          body: { status: "suspended" },
        }),
    },
    organizations: {
      list: (options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<Organization>>({ path: "v1/organizations", signal: options?.signal }),
      get: (id: string) =>
        transport.request<Organization>({ path: `v1/organizations/${encodeURIComponent(id)}` }),
      create: (payload: OrganizationCreateInput) =>
        transport.request<Organization>({ method: "POST", path: "v1/organizations", body: payload }),
      update: (id: string, payload: OrganizationUpdateInput) =>
        transport.request<Organization>({
          method: "PATCH",
          path: `v1/organizations/${encodeURIComponent(id)}`,
          body: payload,
        }),
    },
    members: {
      list: (organizationId: string, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<Membership>>({
          path: `v1/organizations/${encodeURIComponent(organizationId)}/members`,
          signal: options?.signal,
        }),
      invite: (organizationId: string, payload: InvitationCreateInput) =>
        transport.request<Invitation>({
          method: "POST",
          path: `v1/organizations/${encodeURIComponent(organizationId)}/invitations`,
          body: payload,
        }),
      updateRole: (organizationId: string, membershipId: string, payload: MembershipRoleInput) =>
        transport.request<Membership>({
          method: "PATCH",
          path: `v1/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(membershipId)}`,
          body: payload,
        }),
    },
    catalog: {
      categories: (options?: { signal?: AbortSignal }) =>
        transport.request<unknown>({ path: "v1/catalog/categories", signal: options?.signal }),
      sellers: (organizationId?: string, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<Seller>>({
          path: "v1/catalog/sellers",
          query: organizationId ? { organizationId } as Record<string, string> : undefined,
          signal: options?.signal,
        }),
      products: (query?: ListQuery, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<Product>>({
          path: "v1/catalog/products",
          query: toQuery(query ?? {}),
          signal: options?.signal,
        }),
      createProduct: (payload: unknown) =>
        transport.request<Product>({ method: "POST", path: "v1/catalog/products", body: payload }),
    },
    resources: {
      list: (type: string, query: ListQuery = {}, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<Record<string, unknown>>>({
          path: `v1/resources/${encodeURIComponent(type)}`,
          query: toQuery(query),
          signal: options?.signal,
        }),
      get: (type: string, id: string, options?: { signal?: AbortSignal }) =>
        transport.request<Record<string, unknown>>({
          path: `v1/resources/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
          signal: options?.signal,
        }),
      create: (type: string, payload: Record<string, unknown>) =>
        transport.request<Record<string, unknown>>({
          method: "POST",
          path: `v1/resources/${encodeURIComponent(type)}`,
          body: payload,
        }),
      update: (type: string, id: string, payload: Record<string, unknown>) =>
        transport.request<Record<string, unknown>>({
          method: "PATCH",
          path: `v1/resources/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
          body: payload,
        }),
      remove: (type: string, id: string) =>
        transport.request<{ ok: boolean }>({
          method: "DELETE",
          path: `v1/resources/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
        }),
      transition: (type: string, id: string, to: string, extra?: Record<string, unknown>) =>
        transport.request<Record<string, unknown>>({
          method: "POST",
          path: `v1/resources/${encodeURIComponent(type)}/${encodeURIComponent(id)}/transition`,
          body: extra ? { to, ...extra } : { to },
        }),
    },
    notifications: {
      list: (options?: { signal?: AbortSignal }) =>
        transport.request<NotificationList>({ path: "v1/notifications", signal: options?.signal }),
      markSeen: () =>
        transport.request<{ ok: boolean; unread: number }>({ method: "POST", path: "v1/notifications/seen" }),
    },
    hic: {
      status: (options?: { signal?: AbortSignal }) =>
        transport.request<HicStatus>({ path: "v1/hic/status", signal: options?.signal }),
    },
    models: {
      list: (options?: { signal?: AbortSignal }) =>
        transport.request<ModelList>({ path: "v1/models", signal: options?.signal }),
    },
    rewards: {
      listRules: (organizationId?: string, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<RewardRule>>({
          path: "v1/rewards/rules",
          query: organizationId ? ({ organizationId } as Record<string, string>) : undefined,
          signal: options?.signal,
        }),
      createRule: (payload: RewardRuleCreateInput) =>
        transport.request<RewardRule>({ method: "POST", path: "v1/rewards/rules", body: payload }),
      updateRule: (id: string, payload: RewardRuleUpdateInput) =>
        transport.request<RewardRule>({
          method: "PATCH",
          path: `v1/rewards/rules/${encodeURIComponent(id)}`,
          body: payload,
        }),
    },
    challenges: {
      list: (organizationId?: string, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<Challenge>>({
          path: "v1/challenges",
          query: organizationId ? ({ organizationId } as Record<string, string>) : undefined,
          signal: options?.signal,
        }),
      get: (id: string, options?: { signal?: AbortSignal }) =>
        transport.request<Challenge>({ path: `v1/challenges/${encodeURIComponent(id)}`, signal: options?.signal }),
      create: (payload: ChallengeCreateInput) =>
        transport.request<Challenge>({ method: "POST", path: "v1/challenges", body: payload }),
      update: (id: string, payload: ChallengeUpdateInput) =>
        transport.request<Challenge>({
          method: "PATCH",
          path: `v1/challenges/${encodeURIComponent(id)}`,
          body: payload,
        }),
      transition: (id: string, to: string) =>
        transport.request<Challenge>({
          method: "POST",
          path: `v1/challenges/${encodeURIComponent(id)}/transition`,
          body: { to },
        }),
      participate: (id: string) =>
        transport.request<Participation>({
          method: "POST",
          path: `v1/challenges/${encodeURIComponent(id)}/participate`,
        }),
      listParticipations: (id: string, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<Participation>>({
          path: `v1/challenges/${encodeURIComponent(id)}/participations`,
          signal: options?.signal,
        }),
      verify: (id: string, participationId: string, payload: { verification?: string } = {}) =>
        transport.request<VerifyResult>({
          method: "POST",
          path: `v1/challenges/${encodeURIComponent(id)}/participations/${encodeURIComponent(participationId)}/verify`,
          body: payload,
        }),
      submitEvidence: (id: string, participationId: string, payload: { evidenceType: string; sourceType?: string; sourceId?: string; description: string }) =>
        transport.request<Evidence>({
          method: "POST",
          path: `v1/challenges/${encodeURIComponent(id)}/participations/${encodeURIComponent(participationId)}/evidence`,
          body: payload,
        }),
      getEvidence: (id: string, participationId: string, options?: { signal?: AbortSignal }) =>
        transport.request<Evidence>({
          path: `v1/challenges/${encodeURIComponent(id)}/participations/${encodeURIComponent(participationId)}/evidence`,
          signal: options?.signal,
        }),
      review: (id: string, participationId: string, payload: { decision: "approve" | "reject" }) =>
        transport.request<VerifyResult>({
          method: "POST",
          path: `v1/challenges/${encodeURIComponent(id)}/participations/${encodeURIComponent(participationId)}/review`,
          body: payload,
        }),
    },
    env: {
      sources: (category?: string, options?: { signal?: AbortSignal }) =>
        transport.request<{ items: Array<Record<string, unknown>>; total: number }>({ path: "v1/env/sources", query: category ? { category } : undefined, signal: options?.signal }),
      createSource: (payload: Record<string, unknown>) =>
        transport.request<Record<string, unknown>>({ method: "POST", path: "v1/env/sources", body: payload }),
      updateSource: (id: string, payload: Record<string, unknown>) =>
        transport.request<Record<string, unknown>>({ method: "PATCH", path: `v1/env/sources/${encodeURIComponent(id)}`, body: payload }),
    },
    hydroma: {
      readiness: (farmId: string, cropCycleId?: string, options?: { signal?: AbortSignal }) =>
        transport.request<{ contractId: string; contractVersion: string; model: string; state: string; required: string[]; available: string[]; missing: string[]; invalid: string[]; unitMismatches: unknown[]; temporalIssues: unknown[]; spatialIssues: unknown[]; provenanceDeficiencies: unknown[]; sources: Array<{ type: string; id: string; created_at: string }>; assessedAt: string; provenance?: string; spatial?: string; findings?: Array<{ id: string; category: string; severity: string; source: string; field: string; reason: string; expected: string; actual: string; rulesVersion: string }> }>({ path: "v1/hydroma/readiness", query: { farmId, ...(cropCycleId ? { cropCycleId } : {}) }, signal: options?.signal }),
      createAssessment: (payload: { farmId: string; cropCycleId?: string }) =>
        transport.request<{ id: string; state: string; reviewState: string; fingerprint: string }>({ method: "POST", path: "v1/hydroma/readiness/assessments", body: payload }),
      listAssessments: (farmId?: string, options?: { signal?: AbortSignal }) =>
        transport.request<{ items: Array<{ id: string; farmId: string; state: string; reviewState: string; createdAt: string; fingerprint: string }>; total: number }>({ path: "v1/hydroma/readiness/assessments", query: farmId ? { farmId } : undefined, signal: options?.signal }),
      getAssessment: (id: string, options?: { signal?: AbortSignal }) =>
        transport.request<{ id: string; state: string; reviewState: string; currentness: string; fingerprint: string }>({ path: `v1/hydroma/readiness/assessments/${encodeURIComponent(id)}`, signal: options?.signal }),
      reviewAssessment: (id: string, payload: { decision: "acceptable" | "findings"; note?: string }) =>
        transport.request<{ id: string; reviewState: string; state: string }>({ method: "POST", path: `v1/hydroma/readiness/assessments/${encodeURIComponent(id)}/review`, body: payload }),
      reviews: (id: string, options?: { signal?: AbortSignal }) =>
        transport.request<{ items: Array<{ id: string; decision: string; note: string | null; actorId: string | null; at: string }> }>({ path: `v1/hydroma/readiness/assessments/${encodeURIComponent(id)}/reviews`, signal: options?.signal }),
    },
    community: {
      activities: (query?: Record<string, string>, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<Activity>>({ path: "v1/community/activities", query, signal: options?.signal }),
      getActivity: (id: string, options?: { signal?: AbortSignal }) =>
        transport.request<Activity>({ path: `v1/community/activities/${encodeURIComponent(id)}`, signal: options?.signal }),
      createActivity: (payload: Record<string, unknown>) =>
        transport.request<Activity>({ method: "POST", path: "v1/community/activities", body: payload }),
      updateActivity: (id: string, payload: Record<string, unknown>) =>
        transport.request<Activity>({ method: "PATCH", path: `v1/community/activities/${encodeURIComponent(id)}`, body: payload }),
      transition: (id: string, to: string) =>
        transport.request<Activity>({ method: "POST", path: `v1/community/activities/${encodeURIComponent(id)}/transition`, body: { to } }),
      participants: (id: string, options?: { signal?: AbortSignal }) =>
        transport.request<{ items: Participant[]; total: number }>({ path: `v1/community/activities/${encodeURIComponent(id)}/participants`, signal: options?.signal }),
      register: (id: string, userId?: string) =>
        transport.request<Participant>({ method: "POST", path: `v1/community/activities/${encodeURIComponent(id)}/participants`, body: userId ? { userId } : {} }),
      participantOp: (id: string, userId: string, op: "confirm" | "attend" | "cancel") =>
        transport.request<Participant>({ method: "POST", path: `v1/community/activities/${encodeURIComponent(id)}/participants/${encodeURIComponent(userId)}/${op}` }),
      events: (id: string, options?: { signal?: AbortSignal }) =>
        transport.request<{ items: ActivityEvent[] }>({ path: `v1/community/activities/${encodeURIComponent(id)}/events`, signal: options?.signal }),
    },
    agri: {
      tasks: (query?: Record<string, string>, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<AgriTask>>({ path: "v1/agri/tasks", query, signal: options?.signal }),
      getTask: (id: string, options?: { signal?: AbortSignal }) =>
        transport.request<AgriTask>({ path: `v1/agri/tasks/${encodeURIComponent(id)}`, signal: options?.signal }),
      createTask: (payload: AgriTaskCreateInput) =>
        transport.request<AgriTask>({ method: "POST", path: "v1/agri/tasks", body: payload }),
      updateTask: (id: string, payload: Record<string, unknown>) =>
        transport.request<AgriTask>({ method: "PATCH", path: `v1/agri/tasks/${encodeURIComponent(id)}`, body: payload }),
      transition: (id: string, payload: { to: string; completionNote?: string }) =>
        transport.request<AgriTask>({ method: "POST", path: `v1/agri/tasks/${encodeURIComponent(id)}/transition`, body: payload }),
      events: (id: string, options?: { signal?: AbortSignal }) =>
        transport.request<{ items: AgriTaskEvent[] }>({ path: `v1/agri/tasks/${encodeURIComponent(id)}/events`, signal: options?.signal }),
      timeline: (farmId: string, query?: Record<string, string>, options?: { signal?: AbortSignal }) =>
        transport.request<{ items: Array<{ date: string; type: string; label: string; to: string; recordCreated: boolean }>; total: number; nextCursor: string | null }>({ path: `v1/agri/farms/${encodeURIComponent(farmId)}/timeline`, query, signal: options?.signal }),
      intelligence: (options?: { signal?: AbortSignal }) =>
        transport.request<{ metrics: Record<string, number>; priorities: Array<{ reason: string; severity: string; label: string; date: string | null; to: string }>; recent: Array<{ date: string; type: string; label: string; to: string; recordCreated: boolean }> }>({ path: "v1/agri/intelligence", signal: options?.signal }),
    },
    ecocoin: {
      ledger: (organizationId?: string, options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<LedgerEntry>>({
          path: "v1/ecocoin/ledger",
          query: organizationId ? ({ organizationId } as Record<string, string>) : undefined,
          signal: options?.signal,
        }),
      summary: (options?: { signal?: AbortSignal }) =>
        transport.request<EcoCoinSummary>({ path: "v1/ecocoin/summary", signal: options?.signal }),
      balance: (userId?: string, options?: { signal?: AbortSignal }) =>
        transport.request<{ userId: string; balance: number }>({
          path: "v1/ecocoin/balance",
          query: userId ? ({ userId } as Record<string, string>) : undefined,
          signal: options?.signal,
        }),
      reconcile: (options?: { signal?: AbortSignal }) =>
        transport.request<EcoCoinReconcile>({ path: "v1/ecocoin/reconcile", signal: options?.signal }),
      adjust: (payload: EcoCoinAdjustmentInput) =>
        transport.request<{ entry: LedgerEntry; duplicate: boolean }>({
          method: "POST",
          path: "v1/ecocoin/adjustments",
          body: payload,
        }),
      requestAdjustment: (payload: { targetUserId: string; amount: number; entryType: "credit" | "debit"; reason: string }) =>
        transport.request<AdjustmentRequest>({
          method: "POST",
          path: "v1/ecocoin/adjustment-requests",
          body: payload,
        }),
      listAdjustmentRequests: (options?: { signal?: AbortSignal }) =>
        transport.request<Paginated<AdjustmentRequest>>({
          path: "v1/ecocoin/adjustment-requests",
          signal: options?.signal,
        }),
      approveAdjustmentRequest: (id: string, note?: string) =>
        transport.request<AdjustmentRequest>({
          method: "POST",
          path: `v1/ecocoin/adjustment-requests/${encodeURIComponent(id)}/approve`,
          body: { note },
        }),
      rejectAdjustmentRequest: (id: string, note?: string) =>
        transport.request<AdjustmentRequest>({
          method: "POST",
          path: `v1/ecocoin/adjustment-requests/${encodeURIComponent(id)}/reject`,
          body: { note },
        }),
      executeAdjustmentRequest: (id: string) =>
        transport.request<{ request: AdjustmentRequest; entry: LedgerEntry; duplicate: boolean }>({
          method: "POST",
          path: `v1/ecocoin/adjustment-requests/${encodeURIComponent(id)}/execute`,
        }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;