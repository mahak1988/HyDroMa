import type { DataArtifact, TemporalRange } from "./data";
import type { SpatialMetadata } from "./spatial";

/**
 * Simulation and worker contracts.
 *
 * Phase 1 defines the contracts only. A worker is an independent local process
 * in Phase 2; no queue broker, Docker or external service is implied here.
 */
export const JOB_STATUSES = ["pending", "running", "completed", "failed", "cancelled"] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export type SimulationRequest = Readonly<{
  id: string;
  modelId: string;
  modelVersion: string;
  scenarioId?: string;
  inputs: readonly DataArtifact[];
  parameters: Readonly<Record<string, unknown>>;
  spatial?: SpatialMetadata;
  temporal?: TemporalRange;
  requestedBy: string;
  priority?: number;
}>;

export type JobRecord = Readonly<{
  id: string;
  requestId: string;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  resultRef?: string;
  provenanceRef?: string;
}>;

/**
 * Minimal worker port. `claim` must be safe to call concurrently; `run` must
 * persist status transitions through the job store, not only in memory.
 */
export type WorkerPort = Readonly<{
  claim(): Promise<JobRecord | undefined>;
  run(job: JobRecord): Promise<JobRecord>;
  heartbeat?(jobId: string): Promise<void>;
}>;

const TRANSITIONS: Readonly<Record<JobStatus, readonly JobStatus[]>> = {
  pending: ["running", "cancelled"],
  running: ["completed", "failed", "cancelled"],
  completed: [],
  failed: ["pending"],
  cancelled: [],
};

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === "string" && JOB_STATUSES.includes(value as JobStatus);
}