import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "../src/client";
import { ApiError } from "../src/errors";

const base = "https://api.test/";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api client transport", () => {
  it("parses a successful list response", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      jsonResponse(200, { items: [{ id: "u1" }], nextCursor: null, total: 1 }),
    );
    const api = createApiClient({ baseUrl: base, fetchImpl: fetchImpl as unknown as typeof fetch });
    const page = await api.users.list({ limit: 20, search: "sara" });
    expect(page.total).toBe(1);
    const calledUrl = String(fetchImpl.mock.calls[0]?.[0]);
    expect(calledUrl).toContain("/v1/users");
    expect(calledUrl).toContain("limit=20");
    expect(calledUrl).toContain("search=sara");
  });

  it("maps an error envelope to ApiError with field errors", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      jsonResponse(422, {
        error: {
          code: "validation_failed",
          message_key: "errors.validation",
          details: [{ field: "email", issue: "email.invalid" }],
          correlation_id: "corr-1",
        },
      }),
    );
    const api = createApiClient({ baseUrl: base, fetchImpl: fetchImpl as unknown as typeof fetch });
    await expect(api.users.create({ name: "A B", email: "x@y.zz", role: "member" })).rejects.toMatchObject({
      code: "validation_failed",
      status: 422,
      correlationId: "corr-1",
    });
    const error = await api.users
      .create({ name: "A B", email: "x@y.zz", role: "member" })
      .catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).fieldErrors()).toEqual({ email: "email.invalid" });
  });

  it("retries GET on 503 and then succeeds", async () => {
    let calls = 0;
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => {
      calls += 1;
      if (calls === 1) return jsonResponse(503, { error: { code: "unavailable", message_key: "errors.unavailable" } });
      return jsonResponse(200, { items: [], nextCursor: null, total: 0 });
    });
    const api = createApiClient({
      baseUrl: base,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      retry: { attempts: 2, baseDelayMs: 1 },
      sleep: async () => undefined,
    });
    await expect(api.organizations.list()).resolves.toMatchObject({ total: 0 });
    expect(calls).toBe(2);
  });

  it("never retries mutations", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      jsonResponse(503, { error: { code: "unavailable", message_key: "errors.unavailable" } }),
    );
    const api = createApiClient({
      baseUrl: base,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      retry: { attempts: 2, baseDelayMs: 1 },
      sleep: async () => undefined,
    });
    await expect(
      api.organizations.create({ name: "Org", slug: "org", country: "IR" }),
    ).rejects.toMatchObject({ status: 503 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("adds CSRF and tenant headers for mutations", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => jsonResponse(200, { id: "o1" }));
    const api = createApiClient({
      baseUrl: base,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getCsrfToken: () => "csrf-123",
      getOrganizationId: () => "org-7",
    });
    await api.organizations.update("o1", { name: "New" });
    const init = (fetchImpl.mock.calls[0]?.[1] ?? {}) as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["X-CSRF-Token"]).toBe("csrf-123");
    expect(headers["X-Organization-Id"]).toBe("org-7");
    expect(init.credentials).toBe("include");
  });

  it("maps an external abort to the aborted code", async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    const api = createApiClient({ baseUrl: base, fetchImpl: fetchImpl as unknown as typeof fetch });
    const pending = api.users.list({}, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: "aborted" });
  });
  it("maps timeouts to timeout code", async () => {
    const fetchImpl = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("timeout", "AbortError")),
          );
        }),
    );
    const api = createApiClient({
      baseUrl: base,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      timeoutMs: 5,
    });
    await expect(api.users.get("u1")).rejects.toMatchObject({ code: "timeout" });
  });
});