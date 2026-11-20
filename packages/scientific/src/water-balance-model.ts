import {
  WATER_BALANCE_MODEL,
  computeWaterBalance,
  validateWaterBalanceInput,
  type WaterBalanceInput,
  type WaterBalanceResult,
  type WaterBalanceSuccess,
  type WaterBalanceFailure,
} from "./water-balance";
import { DEFAULT_PROVENANCE_REQUIREMENT, type ProvenanceRecord } from "./provenance";
import type {
  ModelDefinition,
  ModelError,
  ModelResult,
  ModelRunContext,
  ModelValidationResult,
  ModelWarning,
  ScientificModel,
} from "./model";
import { isQuantity } from "./model";

/**
 * Adapter from the existing water-balance implementation to the Phase 1 model
 * contract. It does not change the science: the same pure function and the
 * same validation remain the source of truth.
 *
 * Maturity is `tested`, not `validated`: the existing unit tests pass, but no
 * observational dataset or independent review has been performed. The model's
 * own `NOT_VALIDATED` state is preserved in `limitations`.
 */
export const WATER_BALANCE_DEFINITION: ModelDefinition = {
  id: WATER_BALANCE_MODEL.id,
  version: WATER_BALANCE_MODEL.version,
  domain: "water",
  title: "Root-zone water balance",
  executionMode: "local",
  maturity: "tested",
  inputs: [
    {
      name: "periodDays",
      symbol: "days",
      kind: "number",
      unit: "day",
      required: true,
      description: "Length of the balance period",
      validRange: { min: 1 },
    },
    {
      name: "precipitation",
      symbol: "P",
      kind: "quantity",
      unit: "mm",
      required: true,
      description: "Precipitation input over the period",
      validRange: { min: 0 },
    },
    {
      name: "irrigation",
      symbol: "I",
      kind: "quantity",
      unit: "mm",
      required: true,
      description: "Irrigation input over the period",
      validRange: { min: 0 },
    },
    {
      name: "runoff",
      symbol: "R",
      kind: "quantity",
      unit: "mm",
      required: true,
      description: "Surface runoff leaving the control volume",
      validRange: { min: 0 },
    },
    {
      name: "evapotranspiration",
      symbol: "ET",
      kind: "quantity",
      unit: "mm",
      required: true,
      description: "Actual evapotranspiration",
      validRange: { min: 0 },
    },
    {
      name: "deepPercolation",
      symbol: "DP",
      kind: "quantity",
      unit: "mm",
      required: false,
      description: "Deep percolation below the root zone (defaults to 0)",
      validRange: { min: 0 },
    },
    {
      name: "capillaryRise",
      symbol: "CR",
      kind: "quantity",
      unit: "mm",
      required: false,
      description: "Capillary rise into the root zone (defaults to 0)",
      validRange: { min: 0 },
    },
    {
      name: "areaHa",
      symbol: "A",
      kind: "quantity",
      unit: "ha",
      required: false,
      description: "Control-volume area; required to convert depth to volume",
      validRange: { min: 0 },
    },
    {
      name: "initialStorage",
      symbol: "S0",
      kind: "quantity",
      unit: "mm",
      required: false,
      description: "Initial root-zone storage",
      validRange: { min: 0 },
    },
    {
      name: "measuredStorageChange",
      symbol: "dS_obs",
      kind: "quantity",
      unit: "mm",
      required: false,
      description: "Observed storage change used for closure residual",
    },
  ],
  outputs: [
    {
      name: "storageChangeMm",
      symbol: "ΔS",
      kind: "quantity",
      unit: "mm",
      description: "Computed change in root-zone storage",
    },
    {
      name: "status",
      kind: "string",
      description: "surplus, deficit or balanced",
    },
    {
      name: "balanceCloses",
      kind: "boolean",
      description: "Whether the computed change matches the observed change within tolerance",
    },
    {
      name: "finalStorageMm",
      kind: "quantity",
      unit: "mm",
      description: "Final storage when initial storage is known; null when out of domain",
    },
    {
      name: "outOfDomain",
      kind: "boolean",
      description: "Whether the result is physically implausible for this model",
    },
    {
      name: "residualMm",
      kind: "quantity",
      unit: "mm",
      description: "Computed minus observed storage change when an observation is supplied",
    },
  ],
  parameters: [],
  units: ["mm", "day", "ha", "m3"],
  assumptions: [
    "One root-zone control volume",
    "Same period and area for all fluxes",
    "Actual evapotranspiration is supplied",
    "No lateral flow and no snow",
    "Storage refers to soil water only",
  ],
  limitations: [
    "NOT_VALIDATED: no observational dataset or independent review",
    "Single control volume",
    "Deep percolation and capillary rise are user supplied",
    "Fixed sign convention",
    "Not an official or measured result",
    "Provenance hashes are not yet computed by the local adapter",
  ],
  references: [
    {
      citation:
        "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). Crop evapotranspiration — FAO Irrigation and Drainage Paper 56.",
      doi: "10.1016/B978-0-444-81494-5.50000-6",
    },
    {
      citation: "Dingman, S.L. (2015). Physical Hydrology (3rd ed.). Waveland Press.",
    },
    {
      citation: "Hillel, D. (1998). Environmental Soil Physics. Academic Press.",
    },
    {
      citation: "WMO (2010). Guide to Hydrological Practices, Volume I (WMO-No. 168).",
    },
  ],
  validation: {
    maturity: "tested",
    evidence: [
      {
        kind: "implementation",
        status: "pass",
        reference: "packages/scientific/src/water-balance.ts",
        notes: "Pure TypeScript implementation with explicit sign convention.",
      },
      {
        kind: "unit_test",
        status: "pass",
        reference: "packages/scientific/tests/water-balance.test.ts",
        notes: "Software tests pass; scientific validation has not been performed.",
      },
      {
        kind: "unit_test",
        status: "pass",
        reference: "packages/scientific/tests/contracts.test.ts",
        notes: "Adapter contract, unit normalisation, registry and failure-path tests pass.",
      },
    ],
    notes: "Software-tested only. Not verified against independent calculations and not validated against observations.",
  },
  provenance: DEFAULT_PROVENANCE_REQUIREMENT,
};

export type WaterBalanceOutputs = {
  storageChangeMm: number;
  status: WaterBalanceSuccess["result"]["status"];
  balanceCloses: boolean | null;
  finalStorageMm: number | null;
  outOfDomain: boolean;
  residualMm: number | null;
  unit: "mm";
};

/**
 * Public input shape: numbers (legacy UI) or quantities with explicit units.
 * The adapter normalises both at the boundary.
 */
export type WaterBalanceContractInput = Readonly<Record<string, unknown>>;

function toModelError(error: WaterBalanceFailure["errors"][number]): ModelError {
  return {
    code: "INVALID_INPUT",
    field: error.field,
    message: `${error.symbol} ${error.code} (${String(error.value)} ${error.unit})`,
  };
}

function toModelWarning(warning: WaterBalanceSuccess["warnings"][number]): ModelWarning {
  return {
    code: warning.code,
    message: `${warning.code} (${warning.value} ${warning.unit})`,
  };
}

const WATER_BALANCE_UNITS: Readonly<Record<keyof WaterBalanceInput, string>> = {
  periodDays: "day",
  precipitation: "mm",
  irrigation: "mm",
  runoff: "mm",
  evapotranspiration: "mm",
  deepPercolation: "mm",
  capillaryRise: "mm",
  areaHa: "ha",
  initialStorage: "mm",
  measuredStorageChange: "mm",
};

/**
 * The public contract uses quantities; the existing pure model uses numbers in
 * mm/day/ha. Normalise here, at the boundary, and reject a unit mismatch rather
 * than silently converting.
 */
function normalize(input: Record<string, unknown>): ModelValidationResult<WaterBalanceInput> {
  const value: Record<string, unknown> = {};
  const errors: ModelError[] = [];

  for (const field of Object.keys(WATER_BALANCE_UNITS) as Array<keyof WaterBalanceInput>) {
    const raw = input[field];
    if (raw === undefined || raw === null || raw === "") continue;
    const expectedUnit = WATER_BALANCE_UNITS[field];

    if (typeof raw === "number") {
      value[field] = raw;
      continue;
    }
    if (isQuantity(raw)) {
      if (raw.unit !== expectedUnit) {
        errors.push({
          code: "UNSUPPORTED_UNIT",
          field,
          message: `${field} must use ${expectedUnit}, received ${raw.unit}`,
        });
        continue;
      }
      value[field] = raw.value;
      continue;
    }
    // Leave non-numeric values in place; the existing validator reports them.
    value[field] = raw;
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: value as WaterBalanceInput };
}

function toProvenance(context: ModelRunContext, resultHashes: readonly string[] = []): ProvenanceRecord {
  return {
    runId: context.runId,
    modelId: WATER_BALANCE_DEFINITION.id,
    modelVersion: WATER_BALANCE_DEFINITION.version,
    codeVersion: WATER_BALANCE_MODEL.version,
    inputHashes: [],
    parameterHash: "none",
    environment: context.environment ?? "local",
    executedAt: context.requestedAt ?? new Date().toISOString(),
    operator: context.requestedBy,
    resultHashes,
    validationStatus: WATER_BALANCE_DEFINITION.maturity,
    seed: context.seed,
  };
}

function validate(input: unknown): ModelValidationResult<WaterBalanceContractInput> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: [{ code: "INVALID_INPUT", message: "input must be an object" }] };
  }
  const normalized = normalize(input as Record<string, unknown>);
  if (!normalized.ok) return normalized;
  const result = validateWaterBalanceInput(normalized.value);
  if (!result.valid) {
    return { ok: false, errors: result.errors.map(toModelError) };
  }
  return { ok: true, value: normalized.value as WaterBalanceContractInput };
}

function execute(input: WaterBalanceContractInput, context: ModelRunContext): ModelResult<WaterBalanceOutputs> {
  const validation = validate(input);
  const base = {
    modelId: WATER_BALANCE_DEFINITION.id,
    modelVersion: WATER_BALANCE_DEFINITION.version,
    assumptions: WATER_BALANCE_DEFINITION.assumptions,
    limitations: WATER_BALANCE_DEFINITION.limitations,
    references: WATER_BALANCE_DEFINITION.references,
    validation: WATER_BALANCE_DEFINITION.validation,
  } as const;

  if (!validation.ok) {
    return {
      ...base,
      status: "failed",
      errors: validation.errors,
      warnings: [],
      provenance: toProvenance(context),
    };
  }

  const result: WaterBalanceResult = computeWaterBalance(validation.value as WaterBalanceInput);
  if (!result.ok) {
    return {
      ...base,
      status: "failed",
      errors: result.errors.map(toModelError),
      warnings: [],
      provenance: toProvenance(context),
    };
  }

  return {
    ...base,
    status: "completed",
    outputs: {
      storageChangeMm: result.result.storageChangeMm,
      status: result.result.status,
      balanceCloses: result.result.balanceCloses,
      finalStorageMm: result.result.finalStorageMm,
      outOfDomain: result.result.outOfDomain,
      residualMm: result.result.residualMm,
      unit: result.result.unit,
    },
    warnings: result.warnings.map(toModelWarning),
    provenance: toProvenance(context),
  };
}

export const waterBalanceModel: ScientificModel<WaterBalanceContractInput, WaterBalanceOutputs> = {
  definition: WATER_BALANCE_DEFINITION,
  validate,
  execute,
};