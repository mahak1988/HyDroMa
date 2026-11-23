import { ApiError, statusToCode, type ErrorEnvelope } from "./errors";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type RequestOptions = {
  method?: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

export type TransportConfig = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  getCsrfToken?: () => string | null;
  /** Sent as a hint only; the server derives and validates the tenant from the session. */
  getOrganizationId?: () => string | null;
  onUnauthorized?: () => void;
  retry?: { attempts: number; baseDelayMs: number };
  sleep?: (ms: number) => Promise<void>;
};

const MUTATIONS: HttpMethod[] = ["POST", "PATCH", "DELETE"];
const RETRYABLE_STATUS = new Set([429, 503]);

export type Transport = {
  request: <T>(options: RequestOptions) => Promise<T>;
};

export function createTransport(config: TransportConfig): Transport {
  const fetchImpl = config.fetchImpl ?? fetch;
  const timeoutMs = config.timeoutMs ?? 15_000;
  const attempts = config.retry?.attempts ?? 2;
  const baseDelay = config.retry?.baseDelayMs ?? 200;
  const sleep = config.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  function buildUrl(path: string, query?: RequestOptions["query"]): string {
    // A relative base ("/api") is resolved against the current origin — the
    // unified host proxies that path to the real API service, so the session
    // cookie stays same-site in every environment.
    const rawBase = config.baseUrl.startsWith("/")
      ? `${window.location.origin}${config.baseUrl}`
      : config.baseUrl;
    const url = new URL(path, rawBase.endsWith("/") ? rawBase : `${rawBase}/`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  async function toApiError(response: Response, method: HttpMethod): Promise<ApiError> {
    const code = statusToCode(response.status);
    let envelope: ErrorEnvelope | null = null;
    try {
      envelope = (await response.json()) as ErrorEnvelope;
    } catch {
      envelope = null;
    }
    const error = envelope?.error;
    return new ApiError({
      code,
      status: response.status,
      messageKey: error?.message_key ?? `errors.${code}`,
      message: error?.message,
      details: error?.details,
      correlationId: error?.correlation_id ?? null,
      retryable: error?.retryable ?? (method !== "GET" && RETRYABLE_STATUS.has(response.status) ? false : RETRYABLE_STATUS.has(response.status)),
    });
  }

  async function once<T>(options: RequestOptions): Promise<T> {
    const method = options.method ?? "GET";
    const controller = new AbortController();
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    const onExternalAbort = () => controller.abort();
    options.signal?.addEventListener("abort", onExternalAbort);

    const headers: Record<string, string> = { Accept: "application/json", ...options.headers };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    if (MUTATIONS.includes(method)) {
      const csrf = config.getCsrfToken?.();
      if (csrf) headers["X-CSRF-Token"] = csrf;
    }
    const organizationId = config.getOrganizationId?.();
    if (organizationId) headers["X-Organization-Id"] = organizationId;

    try {
      const response = await fetchImpl(buildUrl(options.path, options.query), {
        method,
        headers,
        credentials: "include",
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });

      if (response.status === 401) config.onUnauthorized?.();
      if (!response.ok) throw await toApiError(response, method);
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    } catch (cause) {
      if (cause instanceof ApiError) throw cause;
      if (controller.signal.aborted) {
        throw new ApiError({
          code: timedOut ? "timeout" : "aborted",
          status: 0,
          messageKey: timedOut ? "errors.timeout" : "errors.aborted",
          retryable: false,
        });
      }
      throw new ApiError({
        code: "network",
        status: 0,
        messageKey: "errors.network",
        message: cause instanceof Error ? cause.message : undefined,
        retryable: true,
      });
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onExternalAbort);
    }
  }

  return {
    async request<T>(options: RequestOptions): Promise<T> {
      const method = options.method ?? "GET";
      let lastError: ApiError | null = null;

      for (let attempt = 0; attempt <= attempts; attempt += 1) {
        try {
          return await once<T>(options);
        } catch (error) {
          if (!(error instanceof ApiError)) throw error;
          lastError = error;
          const canRetry = method === "GET" && (error.retryable || error.code === "network");
          if (!canRetry || attempt === attempts) break;
          await sleep(baseDelay * 2 ** attempt);
        }
      }
      throw lastError ?? new ApiError({ code: "unknown", status: 0, messageKey: "errors.unknown" });
    },
  };
}