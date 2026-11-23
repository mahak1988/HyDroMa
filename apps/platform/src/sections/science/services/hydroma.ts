/**
 * HyDroMA scientific service client (optional, read-only).
 *
 * Reuses the shared `@eco-nojin/api-client` transport (timeout, abort, structured
 * errors) and adds a typed, runtime-validated adapter for the HyDroMA engine API
 * (`GET /health`, `GET /v1/models`). The base URL is configurable (env) and
 * defaults to a local loopback service; there is NO hardcoded production endpoint.
 *
 * This adapter NEVER falls back to demo data: if the service is unreachable or
 * returns an invalid payload it raises `HydromaClientError` so the UI can show an
 * explicit "service unavailable" state. It does not duplicate any scientific
 * equation - the authoritative implementation is the Python engine.
 */
import { ApiError, createTransport } from "@eco-nojin/api-client";

export type HydromaModel = {
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

export type HydromaModelsResponse = { models: HydromaModel[] };
export type HydromaHealth = { status: string; service?: string; version?: string };

export type HydromaFailure = "unavailable" | "network" | "timeout" | "aborted" | "invalid_response";

export class HydromaClientError extends Error {
  readonly reason: HydromaFailure;
  constructor(reason: HydromaFailure, message: string) {
    super(message);
    this.name = "HydromaClientError";
    this.reason = reason;
  }
}

function validateHealth(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return "health: not an object";
  const status = (data as Record<string, unknown>).status;
  if (typeof status !== "string" || status === "") return "health: missing status";
  return null;
}

function validateModels(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return "models: not an object";
  const models = (data as Record<string, unknown>).models;
  if (!Array.isArray(models)) return "models: 'models' is not an array";
  for (let i = 0; i < models.length; i += 1) {
    const m = models[i] as Record<string, unknown> | null;
    if (typeof m !== "object" || m === null) return `models[${i}]: not an object`;
    if (typeof m.id !== "string" || m.id === "") return `models[${i}]: missing id`;
    if (typeof m.version !== "string" || m.version === "") return `models[${i}]: missing version`;
  }
  return null;
}

export type HydromaClient = {
  health: (signal?: AbortSignal) => Promise<HydromaHealth>;
  models: (signal?: AbortSignal) => Promise<HydromaModelsResponse>;
};

export type HydromaClientOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export function createHydromaClient(options: HydromaClientOptions): HydromaClient {
  const transport = createTransport({
    baseUrl: options.baseUrl,
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs ?? 8000,
    retry: { attempts: 0, baseDelayMs: 0 },
  });

  async function get<T>(path: string, validate: (data: unknown) => string | null, signal?: AbortSignal): Promise<T> {
    let data: unknown;
    try {
      data = await transport.request<unknown>({ method: "GET", path, signal });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "timeout") throw new HydromaClientError("timeout", "HyDroMA service timed out");
        if (error.code === "aborted") throw new HydromaClientError("aborted", "request aborted");
        if (error.status === 0 || error.code === "network") throw new HydromaClientError("network", "HyDroMA service unreachable");
        throw new HydromaClientError("unavailable", `HyDroMA service error (${error.status})`);
      }
      throw error;
    }
    const problem = validate(data);
    if (problem) throw new HydromaClientError("invalid_response", problem);
    return data as T;
  }

  return {
    health: (signal) => get<HydromaHealth>("/health", validateHealth, signal),
    models: (signal) => get<HydromaModelsResponse>("/v1/models", validateModels, signal),
  };
}