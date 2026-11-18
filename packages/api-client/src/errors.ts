/** Error envelope shared by every Eco Nojin service (contracts/api). */

export type ErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation_failed"
  | "rate_limited"
  | "unavailable"
  | "timeout"
  | "aborted"
  | "network"
  | "unknown";

export type ErrorEnvelope = {
  error: {
    code: string;
    message_key: string;
    message?: string;
    details?: Array<{ field?: string; issue: string }>;
    correlation_id?: string;
    retryable?: boolean;
  };
};

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly messageKey: string;
  readonly details: Array<{ field?: string; issue: string }>;
  readonly correlationId: string | null;
  readonly retryable: boolean;

  constructor(input: {
    code: ErrorCode;
    status: number;
    messageKey: string;
    message?: string;
    details?: Array<{ field?: string; issue: string }>;
    correlationId?: string | null;
    retryable?: boolean;
  }) {
    super(input.message ?? input.messageKey);
    this.name = "ApiError";
    this.code = input.code;
    this.status = input.status;
    this.messageKey = input.messageKey;
    this.details = input.details ?? [];
    this.correlationId = input.correlationId ?? null;
    this.retryable = input.retryable ?? false;
  }

  /** Field errors keyed by field name, ready for a form. */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const detail of this.details) {
      if (detail.field) out[detail.field] = detail.issue;
    }
    return out;
  }
}

const STATUS_CODES: Record<number, ErrorCode> = {
  401: "unauthenticated",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  422: "validation_failed",
  429: "rate_limited",
  503: "unavailable",
};

export function statusToCode(status: number): ErrorCode {
  return STATUS_CODES[status] ?? (status >= 500 ? "unavailable" : "unknown");
}