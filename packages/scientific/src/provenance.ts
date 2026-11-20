import { MODEL_MATURITY, type ModelMaturity } from "./maturity";

/**
 * Provenance is the minimum chain that makes a scientific result reproducible.
 * The engine does not invent hashes here: producers (the future Python worker
 * and local adapters) fill these fields from real inputs, code and outputs.
 */
export const PROVENANCE_FIELDS = [
  "run_id",
  "model_id",
  "model_version",
  "code_version",
  "input_hashes",
  "parameter_hash",
  "environment",
  "executed_at",
  "operator",
  "result_hashes",
  "validation_status",
] as const;

export type ProvenanceField = (typeof PROVENANCE_FIELDS)[number];

export type ProvenanceRecord = Readonly<{
  runId: string;
  modelId: string;
  modelVersion: string;
  codeVersion: string;
  inputHashes: readonly string[];
  parameterHash: string;
  environment: string;
  executedAt: string;
  operator: string;
  resultHashes: readonly string[];
  validationStatus: ModelMaturity;
  seed?: string;
}>;

export type ProvenanceRequirement = Readonly<{
  requiredFields: readonly ProvenanceField[];
}>;

export const DEFAULT_PROVENANCE_REQUIREMENT: ProvenanceRequirement = Object.freeze({
  requiredFields: PROVENANCE_FIELDS,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export function isProvenanceRecord(value: unknown): value is ProvenanceRecord {
  if (!isRecord(value)) return false;

  return (
    isNonEmptyString(value.runId) &&
    isNonEmptyString(value.modelId) &&
    isNonEmptyString(value.modelVersion) &&
    isNonEmptyString(value.codeVersion) &&
    isStringArray(value.inputHashes) &&
    isNonEmptyString(value.parameterHash) &&
    isNonEmptyString(value.environment) &&
    isNonEmptyString(value.executedAt) &&
    isNonEmptyString(value.operator) &&
    isStringArray(value.resultHashes) &&
    typeof value.validationStatus === "string" &&
    MODEL_MATURITY.includes(value.validationStatus as ModelMaturity)
  );
}