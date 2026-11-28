/**
 * Eco Nojin API — HyDroMA EngineGateway (Phase 3.85).
 *
 * The gateway is the only backend boundary to the independent Python engine. It
 * speaks the engine's documented HTTP contract (POST /v1/runs, GET /v1/runs/:id)
 * and never imports engine internals. Only the existing irrigation model is
 * callable; model identity is fixed here, never inferred from user text.
 */
import { createHash } from "node:crypto";

export const IRRIGATION_MODEL = Object.freeze({
  id: "eco-nojin.hydroma.irrigation-schedule",
  version: "1.0.0",
});

export const IRRIGATION_UNITS = Object.freeze({
  taw_mm: "mm",
  raw_mm: "mm",
  net_irrigation_mm: "mm",
  gross_irrigation_mm: "mm",
  irrigation_recommended: "boolean",
  status: "string",
});

const DEFAULT_BASE_URL = "http://127.0.0.1:8001";
const ALLOWED_INPUT_KEYS = new Set([
  "layers",
  "p",
  "depletion_mm",
  "target_depletion_mm",
  "target_storage_mm",
  "application_efficiency",
]);

export const MAX_OUTPUT_BYTES = 256 * 1024;

export class GatewayError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "GatewayError";
    this.code = code;
  }
}

/** Reject unsafe engine endpoint configuration (credentials, non-HTTP, query). */
export function assertSafeGatewayUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new GatewayError("invalid_configuration", "engine URL is invalid");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new GatewayError("invalid_configuration", "engine URL must be http(s)");
  }
  if (url.username || url.password) {
    throw new GatewayError("invalid_configuration", "engine URL must not contain credentials");
  }
  if (url.search || url.hash) {
    throw new GatewayError("invalid_configuration", "engine URL must not contain a query or fragment");
  }
  return url.toString().replace(/\/$/u, "");
}

// Per-process concurrency guard (not distributed). Limits simultaneous gateway
// executions so a single API process cannot be overwhelmed.
let activeExecutions = 0;
export const executionCapacity = () => Math.max(1, Number(process.env.NOJIN_HYDROMA_MAX_CONCURRENT ?? 4));
export const activeExecutionCount = () => activeExecutions;
export function tryAcquireExecutionSlot() {
  if (activeExecutions >= executionCapacity()) return false;
  activeExecutions += 1;
  return true;
}
export function releaseExecutionSlot() {
  activeExecutions = Math.max(0, activeExecutions - 1);
}

const finite = (value) => typeof value === "number" && Number.isFinite(value);

/** Validate against the irrigation model contract before any engine call. */
export function validateIrrigationInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return ["input must be an object"];
  }
  const errors = [];
  for (const key of Object.keys(input)) {
    if (!ALLOWED_INPUT_KEYS.has(key)) errors.push(`unsupported parameter: ${key}`);
  }
  if (!Array.isArray(input.layers) || input.layers.length === 0) {
    errors.push("layers must be a non-empty array");
  } else {
    input.layers.forEach((layer, index) => {
      if (!layer || typeof layer !== "object") return errors.push(`layers[${index}] must be an object`);
      if (!finite(layer.thickness_mm) || layer.thickness_mm <= 0) errors.push(`layers[${index}].thickness_mm must be > 0`);
      if (!finite(layer.theta_fc) || layer.theta_fc < 0 || layer.theta_fc > 1) errors.push(`layers[${index}].theta_fc must be in [0,1]`);
      if (!finite(layer.theta_wp) || layer.theta_wp < 0 || layer.theta_wp > 1) errors.push(`layers[${index}].theta_wp must be in [0,1]`);
      if (finite(layer.theta_fc) && finite(layer.theta_wp) && layer.theta_wp >= layer.theta_fc) errors.push(`layers[${index}] requires theta_wp < theta_fc`);
    });
  }
  if (!finite(input.p) || input.p <= 0 || input.p > 1) errors.push("p must be in (0,1]");
  if (!finite(input.depletion_mm)) errors.push("depletion_mm must be a finite number");
  const hasTd = input.target_depletion_mm !== undefined;
  const hasTs = input.target_storage_mm !== undefined;
  if (hasTd && hasTs) errors.push("provide target_depletion_mm OR target_storage_mm, not both");
  if (hasTd && (!finite(input.target_depletion_mm) || input.target_depletion_mm < 0)) errors.push("target_depletion_mm must be >= 0");
  if (hasTs && (!finite(input.target_storage_mm) || input.target_storage_mm < 0)) errors.push("target_storage_mm must be >= 0");
  if (input.application_efficiency !== undefined && (!finite(input.application_efficiency) || input.application_efficiency <= 0 || input.application_efficiency > 1)) {
    errors.push("application_efficiency must be in (0,1]");
  }
  return errors;
}

function normalizeEngineRun(run) {
  if (!run || typeof run !== "object" || typeof run.status !== "string") {
    throw new GatewayError("invalid_output", "engine returned an invalid run payload");
  }
  if (run.status === "completed") {
    if (!run.result_json || typeof run.result_json !== "object") {
      throw new GatewayError("invalid_output", "engine completed without a structured result");
    }
    if (Buffer.byteLength(JSON.stringify(run.result_json), "utf8") > MAX_OUTPUT_BYTES) {
      throw new GatewayError("invalid_output", "engine output exceeds the allowed size");
    }
    return {
      engineRunId: run.run_id ?? null,
      status: "COMPLETED",
      output: run.result_json,
      provenance: run.provenance_json ?? null,
      units: IRRIGATION_UNITS,
      error: null,
      engineVersion: run.provenance_json?.code_version ?? null,
    };
  }
  if (run.status === "failed") {
    return {
      engineRunId: run.run_id ?? null,
      status: "FAILED",
      output: null,
      provenance: run.provenance_json ?? null,
      units: IRRIGATION_UNITS,
      error: run.error_json ?? { code: "ENGINE_FAILED", message: "engine reported failure" },
      engineVersion: run.provenance_json?.code_version ?? null,
    };
  }
  throw new GatewayError("engine_error", `engine returned unexpected status: ${run.status}`);
}

/**
 * Execute the irrigation model through the engine HTTP contract.
 * Bounded by an overall timeout; no arbitrary model, module or command is used.
 */
export async function executeIrrigation({
  input,
  runKey,
  correlationId,
  requestedBy = "api",
  tenantId = null,
  baseUrl = process.env.NOJIN_HYDROMA_URL ?? DEFAULT_BASE_URL,
  timeoutMs = Number(process.env.NOJIN_HYDROMA_TIMEOUT_MS ?? 10000),
  pollMs = Number(process.env.NOJIN_HYDROMA_POLL_MS ?? 100),
  fetchImpl = fetch,
}) {
  const errors = validateIrrigationInput(input);
  if (errors.length > 0) throw new GatewayError("invalid_input", errors[0]);
  baseUrl = assertSafeGatewayUrl(baseUrl);

  const controller = new AbortController();
  const deadline = Date.now() + timeoutMs;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const token = process.env.NOJIN_HYDROMA_TOKEN;
  const call = async (path, options = {}) => {
    const headers = { ...(token ? { "x-hydroma-token": token } : {}), ...(options.headers ?? {}) };
    const response = await fetchImpl(`${baseUrl}${path}`, { ...options, headers, signal: controller.signal });
    if (!response.ok) {
      throw new GatewayError("engine_error", `engine HTTP ${response.status}`);
    }
    return response.json();
  };

  try {
    const created = await call("/v1/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model_id: IRRIGATION_MODEL.id,
        model_version: IRRIGATION_MODEL.version,
        input,
        requested_by: requestedBy,
        tenant_id: tenantId,
      }),
    });
    const engineRunId = created?.run_id;
    if (!engineRunId) throw new GatewayError("invalid_output", "engine did not return a run id");

    while (Date.now() < deadline) {
      const run = await call(`/v1/runs/${encodeURIComponent(engineRunId)}`);
      if (run.status === "completed" || run.status === "failed") {
        if (!run.provenance_json && run.status === "completed") {
          // Provenance is required by the engine contract; absence is a limitation.
          run.provenance_json = {
            model_id: IRRIGATION_MODEL.id,
            model_version: IRRIGATION_MODEL.version,
            run_id: engineRunId,
            correlation_id: correlationId ?? null,
            input_hash: createHash("sha256").update(JSON.stringify(input)).digest("hex"),
            parameter_hash: null,
            environment: "unknown",
            executed_at: null,
            operator: requestedBy,
            result_hashes: {},
            validation_status: "NOT_VALIDATED",
            note: "engine provenance unavailable",
          };
        }
        return normalizeEngineRun(run);
      }
      if (run.status !== "queued" && run.status !== "running") {
        throw new GatewayError("engine_error", `unexpected engine status: ${run.status}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
    throw new GatewayError("timeout", "engine execution timed out");
  } catch (error) {
    if (error instanceof GatewayError) throw error;
    if (error?.name === "AbortError") throw new GatewayError("timeout", "engine execution timed out");
    throw new GatewayError("engine_unavailable", "engine is unreachable");
  } finally {
    clearTimeout(timer);
  }
}