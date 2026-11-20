import {
  MATURITY_EVIDENCE_KINDS,
  MODEL_MATURITY,
  type MaturityEvidence,
  type MaturityEvidenceKind,
  type ModelMaturity,
  type ModelValidationMetadata,
} from "./maturity";
import {
  DEFAULT_PROVENANCE_REQUIREMENT,
  PROVENANCE_FIELDS,
  type ProvenanceField,
  type ProvenanceRecord,
  type ProvenanceRequirement,
} from "./provenance";

/**
 * The scientific model boundary.
 *
 * This file is pure TypeScript: no DOM, no network, no storage, no React. A
 * model is data (definition) plus an optional local executor. Remote models
 * (the future Python engine) are registered with `executionMode: "remote"` and
 * no local executor; the registry still exposes their contract and status.
 */
export const MODEL_DOMAINS = [
  "water",
  "hydrology",
  "groundwater",
  "soil",
  "erosion",
  "climate",
  "meteorology",
  "agriculture",
  "crop",
  "vegetation",
  "remote-sensing",
  "gis",
  "drought",
  "irrigation",
  "simulation",
  "scenarios",
  "mrv",
  "landscape",
] as const;

export type ModelDomain = (typeof MODEL_DOMAINS)[number];

export const MODEL_EXECUTION_MODES = ["local", "remote"] as const;
export type ModelExecutionMode = (typeof MODEL_EXECUTION_MODES)[number];

export const VALUE_KINDS = [
  "number",
  "quantity",
  "boolean",
  "string",
  "enum",
  "raster",
  "vector",
  "grid",
  "point",
  "polygon",
  "dataset",
] as const;

export type ValueType = (typeof VALUE_KINDS)[number];

/** A unit code is a UCUM-style code (for example `mm`, `m3`, `degC`). */
export type UnitCode = string;

export type Quantity = Readonly<{
  value: number;
  unit: UnitCode;
}>;

export type ValidRange = Readonly<{
  min?: number;
  max?: number;
}>;

export type ModelInputSpec = Readonly<{
  name: string;
  symbol?: string;
  kind: ValueType;
  unit?: UnitCode;
  required: boolean;
  description: string;
  validRange?: ValidRange;
}>;

export type ModelOutputSpec = Readonly<{
  name: string;
  symbol?: string;
  kind: ValueType;
  unit?: UnitCode;
  description: string;
}>;

export type ModelParameterSpec = Readonly<{
  name: string;
  kind: ValueType;
  unit?: UnitCode;
  default?: unknown;
  validRange?: ValidRange;
  description: string;
}>;

export type ScientificReference = Readonly<{
  citation: string;
  doi?: string;
  url?: string;
  license?: string;
}>;

export type ModelDefinition = Readonly<{
  id: string;
  version: string;
  domain: ModelDomain;
  title: string;
  executionMode: ModelExecutionMode;
  maturity: ModelMaturity;
  inputs: readonly ModelInputSpec[];
  outputs: readonly ModelOutputSpec[];
  parameters: readonly ModelParameterSpec[];
  units: readonly UnitCode[];
  assumptions: readonly string[];
  limitations: readonly string[];
  references: readonly ScientificReference[];
  validation: ModelValidationMetadata;
  provenance: ProvenanceRequirement;
}>;

export type ModelErrorCode =
  | "INVALID_DEFINITION"
  | "INVALID_INPUT"
  | "INVALID_PARAMETER"
  | "EXECUTION_NOT_AVAILABLE"
  | "UNSUPPORTED_UNIT"
  | "NUMERICAL_FAILURE";

export type ModelError = Readonly<{
  code: ModelErrorCode;
  field?: string;
  message: string;
}>;

export type ModelWarning = Readonly<{
  code: string;
  message: string;
  field?: string;
}>;

export type ModelRunContext = Readonly<{
  runId: string;
  requestedBy: string;
  tenantId?: string;
  seed?: string;
  environment?: string;
  requestedAt?: string;
}>;

export type ModelResult<TOutput> = Readonly<{
  modelId: string;
  modelVersion: string;
  status: "completed" | "failed";
  outputs?: TOutput;
  errors?: readonly ModelError[];
  warnings: readonly ModelWarning[];
  provenance: ProvenanceRecord;
  assumptions: readonly string[];
  limitations: readonly string[];
  references: readonly ScientificReference[];
  validation: ModelValidationMetadata;
}>;

export type ModelValidationResult<TInput> =
  | { ok: true; value: TInput }
  | { ok: false; errors: readonly ModelError[] };

export type ModelExecutor<TInput, TOutput> = (
  input: TInput,
  context: ModelRunContext,
) => ModelResult<TOutput>;

/**
 * A registered model. `validate` and `execute` are optional so a remote model
 * can be discovered without pretending that it runs in the browser.
 */
export type ScientificModel<TInput = unknown, TOutput = unknown> = {
  readonly definition: ModelDefinition;
  validate?: (input: unknown) => ModelValidationResult<TInput>;
  execute?: ModelExecutor<TInput, TOutput>;
};

export type ModelDefinitionValidation =
  | { ok: true; value: ModelDefinition }
  | { ok: false; errors: readonly ModelError[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSemver(value: unknown): value is string {
  return typeof value === "string" && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isEvidenceArray(value: unknown): value is MaturityEvidence[] {
  if (!Array.isArray(value)) return false;
  return value.every((entry) => {
    if (!isRecord(entry)) return false;
    return (
      typeof entry.kind === "string" &&
      MATURITY_EVIDENCE_KINDS.includes(entry.kind as MaturityEvidenceKind) &&
      (entry.status === "pass" || entry.status === "fail" || entry.status === "not_performed")
    );
  });
}

function isProvenanceRequirement(value: unknown): value is ProvenanceRequirement {
  if (!isRecord(value) || !Array.isArray(value.requiredFields)) return false;
  return value.requiredFields.every((field) => PROVENANCE_FIELDS.includes(field as ProvenanceField));
}

function isRange(value: unknown): value is ValidRange {
  if (!isRecord(value)) return false;
  const { min, max } = value;
  if (min !== undefined && (typeof min !== "number" || !Number.isFinite(min))) return false;
  if (max !== undefined && (typeof max !== "number" || !Number.isFinite(max))) return false;
  return min === undefined || max === undefined || min <= max;
}

function hasDuplicate(values: readonly { name: unknown }[]): boolean {
  const seen = new Set<string>();
  for (const entry of values) {
    if (!isNonEmptyString(entry.name)) continue;
    if (seen.has(entry.name)) return true;
    seen.add(entry.name);
  }
  return false;
}

/**
 * Runtime validation for a model definition. This is the gate that prevents a
 * malformed definition from entering the registry and later failing as an
 * opaque execution error.
 */
export function validateModelDefinition(input: unknown): ModelDefinitionValidation {
  if (!isRecord(input)) {
    return { ok: false, errors: [{ code: "INVALID_DEFINITION", message: "model definition must be an object" }] };
  }

  const errors: ModelError[] = [];

  if (!isNonEmptyString(input.id)) errors.push({ code: "INVALID_DEFINITION", field: "id", message: "id is required" });
  if (!isSemver(input.version)) {
    errors.push({ code: "INVALID_DEFINITION", field: "version", message: "version must be semver" });
  }
  if (!isNonEmptyString(input.domain) || !MODEL_DOMAINS.includes(input.domain as ModelDomain)) {
    errors.push({ code: "INVALID_DEFINITION", field: "domain", message: `domain must be one of ${MODEL_DOMAINS.join(", ")}` });
  }
  if (!isNonEmptyString(input.title)) {
    errors.push({ code: "INVALID_DEFINITION", field: "title", message: "title is required" });
  }
  if (!MODEL_EXECUTION_MODES.includes(input.executionMode as ModelExecutionMode)) {
    errors.push({ code: "INVALID_DEFINITION", field: "executionMode", message: "executionMode must be local or remote" });
  }
  if (!MODEL_MATURITY.includes(input.maturity as ModelMaturity)) {
    errors.push({ code: "INVALID_DEFINITION", field: "maturity", message: "maturity is not recognised" });
  }

  const inputs = Array.isArray(input.inputs) ? input.inputs : [];
  const outputs = Array.isArray(input.outputs) ? input.outputs : [];
  const parameters = Array.isArray(input.parameters) ? input.parameters : [];
  const units = Array.isArray(input.units) ? input.units : [];
  const assumptions = Array.isArray(input.assumptions) ? input.assumptions : [];
  const limitations = Array.isArray(input.limitations) ? input.limitations : [];
  const references = Array.isArray(input.references) ? input.references : [];

  if (inputs.length === 0) {
    errors.push({ code: "INVALID_DEFINITION", field: "inputs", message: "at least one input is required" });
  }
  if (outputs.length === 0) {
    errors.push({ code: "INVALID_DEFINITION", field: "outputs", message: "at least one output is required" });
  }
  if (!isStringArray(units) || units.length === 0) {
    errors.push({ code: "INVALID_DEFINITION", field: "units", message: "units must be a non-empty string array" });
  }
  if (!isStringArray(assumptions)) {
    errors.push({ code: "INVALID_DEFINITION", field: "assumptions", message: "assumptions must be a string array" });
  }
  if (!isStringArray(limitations)) {
    errors.push({ code: "INVALID_DEFINITION", field: "limitations", message: "limitations must be a string array" });
  }
  if (!Array.isArray(references) || references.some((entry) => !isRecord(entry) || !isNonEmptyString(entry.citation))) {
    errors.push({ code: "INVALID_DEFINITION", field: "references", message: "each reference needs a citation" });
  }

  if (!isRecord(input.validation)) {
    errors.push({ code: "INVALID_DEFINITION", field: "validation", message: "validation metadata is required" });
  } else {
    if (!MODEL_MATURITY.includes(input.validation.maturity as ModelMaturity)) {
      errors.push({ code: "INVALID_DEFINITION", field: "validation.maturity", message: "validation.maturity is not recognised" });
    }
    if (!isEvidenceArray(input.validation.evidence)) {
      errors.push({ code: "INVALID_DEFINITION", field: "validation.evidence", message: "validation.evidence must be an array" });
    }
    if (input.validation.maturity !== input.maturity) {
      errors.push({
        code: "INVALID_DEFINITION",
        field: "validation.maturity",
        message: "validation.maturity must match definition.maturity",
      });
    }
  }

  if (!isProvenanceRequirement(input.provenance)) {
    errors.push({ code: "INVALID_DEFINITION", field: "provenance", message: "provenance.requiredFields is invalid" });
  } else if (input.provenance.requiredFields.length === 0) {
    errors.push({
      code: "INVALID_DEFINITION",
      field: "provenance.requiredFields",
      message: "provenance must require at least one field",
    });
  }

  for (const [field, values] of [
    ["inputs", inputs],
    ["outputs", outputs],
    ["parameters", parameters],
  ] as const) {
    if (hasDuplicate(values)) {
      errors.push({ code: "INVALID_DEFINITION", field, message: `${field} names must be unique` });
    }
  }

  for (const spec of inputs) {
    if (!isRecord(spec) || !isNonEmptyString(spec.name) || !VALUE_KINDS.includes(spec.kind as ValueType)) {
      errors.push({ code: "INVALID_DEFINITION", field: "inputs", message: "each input needs a name and a valid kind" });
      continue;
    }
    if (typeof spec.required !== "boolean") {
      errors.push({ code: "INVALID_DEFINITION", field: "inputs", message: "input.required must be a boolean" });
    }
    if (!isNonEmptyString(spec.description)) {
      errors.push({ code: "INVALID_DEFINITION", field: "inputs", message: "input.description is required" });
    }
    if (spec.validRange !== undefined && !isRange(spec.validRange)) {
      errors.push({ code: "INVALID_DEFINITION", field: "inputs", message: "input.validRange is invalid" });
    }
  }

  for (const spec of outputs) {
    if (!isRecord(spec) || !isNonEmptyString(spec.name) || !VALUE_KINDS.includes(spec.kind as ValueType)) {
      errors.push({ code: "INVALID_DEFINITION", field: "outputs", message: "each output needs a name and a valid kind" });
    }
  }

  for (const spec of parameters) {
    if (!isRecord(spec) || !isNonEmptyString(spec.name) || !VALUE_KINDS.includes(spec.kind as ValueType)) {
      errors.push({ code: "INVALID_DEFINITION", field: "parameters", message: "each parameter needs a name and a valid kind" });
      continue;
    }
    if (spec.validRange !== undefined && !isRange(spec.validRange)) {
      errors.push({ code: "INVALID_DEFINITION", field: "parameters", message: "parameter.validRange is invalid" });
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: input as unknown as ModelDefinition };
}

export function isQuantity(value: unknown): value is Quantity {
  return (
    isRecord(value) &&
    typeof value.value === "number" &&
    Number.isFinite(value.value) &&
    typeof value.unit === "string" &&
    value.unit.length > 0
  );
}

/**
 * Generic input validation derived from the definition. It checks presence,
 * numeric finiteness, quantity units and declared ranges. Model-specific
 * scientific preconditions remain the model's responsibility.
 */
export function validateModelInput(
  definition: ModelDefinition,
  input: unknown,
): ModelValidationResult<Record<string, unknown>> {
  if (!isRecord(input)) {
    return { ok: false, errors: [{ code: "INVALID_INPUT", message: "input must be an object" }] };
  }

  const errors: ModelError[] = [];

  for (const spec of definition.inputs) {
    const value = input[spec.name];
    const missing = value === undefined || value === null;
    if (missing) {
      if (spec.required) {
        errors.push({ code: "INVALID_INPUT", field: spec.name, message: `${spec.name} is required` });
      }
      continue;
    }

    if (spec.kind === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        errors.push({ code: "INVALID_INPUT", field: spec.name, message: `${spec.name} must be a finite number` });
        continue;
      }
    }

    if (spec.kind === "quantity") {
      if (!isQuantity(value)) {
        errors.push({ code: "INVALID_INPUT", field: spec.name, message: `${spec.name} must be a quantity` });
        continue;
      }
      if (spec.unit && value.unit !== spec.unit) {
        errors.push({
          code: "UNSUPPORTED_UNIT",
          field: spec.name,
          message: `${spec.name} must use ${spec.unit}, received ${value.unit}`,
        });
        continue;
      }
    }

    const numeric = typeof value === "number" ? value : isQuantity(value) ? value.value : undefined;
    if (numeric !== undefined && spec.validRange) {
      if (spec.validRange.min !== undefined && numeric < spec.validRange.min) {
        errors.push({ code: "INVALID_INPUT", field: spec.name, message: `${spec.name} is below the valid minimum` });
      }
      if (spec.validRange.max !== undefined && numeric > spec.validRange.max) {
        errors.push({ code: "INVALID_INPUT", field: spec.name, message: `${spec.name} is above the valid maximum` });
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: input };
}

export function assertModelDefinition(input: unknown): asserts input is ModelDefinition {
  const result = validateModelDefinition(input);
  if (!result.ok) {
    const detail = result.errors.map((error) => `${error.field ?? "_"}: ${error.message}`).join("; ");
    throw new Error(`Invalid scientific model definition: ${detail}`);
  }
}

export { DEFAULT_PROVENANCE_REQUIREMENT, PROVENANCE_FIELDS };
export type { ProvenanceField, ProvenanceRecord, ProvenanceRequirement };
export type { MaturityEvidence, ModelMaturity, ModelValidationMetadata };