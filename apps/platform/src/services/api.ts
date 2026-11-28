/**
 * Shared API client factory for the platform workspace.
 *
 * A single configured client is created per session (the session provider owns
 * the authoritative instance). Pages must obtain the client from the session
 * (`useRealSession().api`) rather than constructing their own, so auth, timeout,
 * retry and error mapping stay consistent. This module only centralises the
 * base-URL resolution and the resource-type contract.
 */
import { createApiClient, type ApiClient } from "@eco-nojin/api-client";
import type { ResourceType } from "./capabilities";

/** Resolve the API base from the build environment (same-origin `/api` by default). */
export function resolveApiBase(env: ImportMetaEnv = import.meta.env): string {
  return env.VITE_API_URL ?? "/api";
}

/** Create a client with the shared defaults. Prefer the session's client in UI. */
export function createPlatformApiClient(baseUrl = resolveApiBase()): ApiClient {
  return createApiClient({ baseUrl, timeoutMs: 15_000, retry: { attempts: 2, baseDelayMs: 200 } });
}

/** Narrow a resource type to the generic resources endpoint contract. */
export function resourcePath(type: ResourceType): string {
  return `v1/resources/${type}`;
}