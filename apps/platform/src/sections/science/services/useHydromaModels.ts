import { useEffect, useState } from "react";

import { HydromaClientError, createHydromaClient, type HydromaModel } from "./hydroma";

/** Base URL is configurable; defaults to a local loopback HyDroMA service. */
export const HYDROMA_BASE_URL = (import.meta.env.VITE_HYDROMA_BASE_URL as string | undefined) ?? "http://127.0.0.1:8000";

export type HydromaState =
  | { status: "loading" }
  | { status: "ready"; models: HydromaModel[]; source: string }
  | { status: "empty"; source: string }
  | { status: "unavailable"; reason: string }
  | { status: "error"; reason: string };

export function useHydromaModels(): HydromaState {
  const [state, setState] = useState<HydromaState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    const client = createHydromaClient({ baseUrl: HYDROMA_BASE_URL });
    client
      .models(controller.signal)
      .then((response) => {
        const source = `hydroma://${HYDROMA_BASE_URL}/v1/models`;
        setState(response.models.length > 0 ? { status: "ready", models: response.models, source } : { status: "empty", source });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const reason = error instanceof HydromaClientError ? error.reason : "error";
        const unavailable = reason === "unavailable" || reason === "network" || reason === "timeout" || reason === "aborted";
        setState(unavailable ? { status: "unavailable", reason } : { status: "error", reason: String(reason) });
      });
    return () => controller.abort();
  }, []);

  return state;
}