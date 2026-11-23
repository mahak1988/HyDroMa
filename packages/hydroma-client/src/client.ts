import { createTransport, type TransportConfig } from "@eco-nojin/api-client";

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

export type HydromaHealth = { status: string; service?: string; version?: string };

export type HydromaRun = {
  id: string;
  status: string;
  result?: unknown;
  provenance?: unknown;
  error?: string;
};

export type HydromaClientConfig = TransportConfig;

export function createHydromaClient(config: HydromaClientConfig) {
  const transport = createTransport(config);
  return {
    health: (signal?: AbortSignal) => transport.request<HydromaHealth>({ path: "health", signal }),
    models: (signal?: AbortSignal) => transport.request<{ models: HydromaModel[] }>({ path: "v1/models", signal }),
    createRun: (modelId: string, inputs: unknown) =>
      transport.request<HydromaRun>({ method: "POST", path: "v1/runs", body: { model: modelId, inputs } }),
    getRun: (id: string, signal?: AbortSignal) =>
      transport.request<HydromaRun>({ path: `v1/runs/${encodeURIComponent(id)}`, signal }),
    provenance: (id: string, signal?: AbortSignal) =>
      transport.request<unknown>({ path: `v1/runs/${encodeURIComponent(id)}/provenance`, signal }),
  };
}

export type HydromaClient = ReturnType<typeof createHydromaClient>;