import { computeGdd, type GddInput, type GddResult } from "./growing-degree-days";
import { DEFAULT_PROVENANCE_REQUIREMENT } from "./provenance";
import type {
  ModelDefinition,
  ModelResult,
  ModelRunContext,
  ModelValidationResult,
  ScientificModel,
} from "./model";

export const GDD_DEFINITION: ModelDefinition = {
  id: "eco-nojin.gdd",
  version: "1.0.0",
  domain: "agriculture",
  title: "Growing Degree Days",
  executionMode: "local",
  maturity: "tested",
  inputs: [
    { name: "tMax", symbol: "Tmax", kind: "quantity", unit: "degC", required: true, description: "Daily maximum temperature" },
    { name: "tMin", symbol: "Tmin", kind: "quantity", unit: "degC", required: true, description: "Daily minimum temperature" },
    { name: "tBase", symbol: "Tbase", kind: "quantity", unit: "degC", required: true, description: "Base temperature" },
    { name: "tCap", symbol: "Tcap", kind: "quantity", unit: "degC", required: false, description: "Optional upper cap" },
  ],
  outputs: [
    { name: "gdd", symbol: "GDD", kind: "quantity", unit: "degree-day", description: "Accumulated growing degree days" },
    { name: "dailyMean", kind: "quantity", unit: "degC", description: "Capped daily mean temperature" },
    { name: "capped", kind: "boolean", description: "Whether the upper cap was applied" },
  ],
  parameters: [],
  units: ["degC", "degree-day"],
  assumptions: ["Daily mean is (Tmax + Tmin) / 2", "No upper cap unless tCap is provided"],
  limitations: ["NOT_VALIDATED: not calibrated against observations", "Not an operational recommendation"],
  references: [],
  validation: {
    maturity: "tested",
    evidence: [{ kind: "unit_test", status: "pass", reference: "packages/scientific/tests/growing-degree-days.test.ts" }],
  },
  provenance: DEFAULT_PROVENANCE_REQUIREMENT,
};

function validate(input: unknown): ModelValidationResult<GddInput> {
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: [{ code: "INVALID_INPUT", message: "input must be an object" }] };
  }
  const v = input as Record<string, unknown>;
  const tMax = Number(v.tMax);
  const tMin = Number(v.tMin);
  const tBase = Number(v.tBase);
  if (![tMax, tMin, tBase].every((n) => Number.isFinite(n))) {
    return { ok: false, errors: [{ code: "INVALID_INPUT", message: "tMax, tMin and tBase must be finite" }] };
  }
  if (tMin > tMax) {
    return { ok: false, errors: [{ code: "INVALID_INPUT", field: "tMin", message: "tMin must be <= tMax" }] };
  }
  const tCap = v.tCap == null ? undefined : Number(v.tCap);
  if (tCap != null && !Number.isFinite(tCap)) {
    return { ok: false, errors: [{ code: "INVALID_INPUT", field: "tCap", message: "tCap must be finite" }] };
  }
  return { ok: true, value: { tMax, tMin, tBase, tCap } };
}

function execute(input: GddInput, context: ModelRunContext): ModelResult<GddResult> {
  const result = computeGdd(input);
  return {
    modelId: GDD_DEFINITION.id,
    modelVersion: GDD_DEFINITION.version,
    status: "completed",
    outputs: result,
    warnings: [],
    provenance: {
      runId: context.runId,
      modelId: GDD_DEFINITION.id,
      modelVersion: GDD_DEFINITION.version,
      codeVersion: "1.0.0",
      inputHashes: [],
      parameterHash: "gdd-v1",
      environment: context.environment ?? "local",
      executedAt: context.requestedAt ?? new Date().toISOString(),
      operator: context.requestedBy,
      resultHashes: [],
      validationStatus: "tested",
    },
    assumptions: GDD_DEFINITION.assumptions,
    limitations: GDD_DEFINITION.limitations,
    references: GDD_DEFINITION.references,
    validation: GDD_DEFINITION.validation,
  };
}

export const gddModel: ScientificModel<GddInput, GddResult> = {
  definition: GDD_DEFINITION,
  validate,
  execute,
};