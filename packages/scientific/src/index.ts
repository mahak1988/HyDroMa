/**
 * HyDroMA scientific core.
 *
 * Everything here is pure TypeScript: no DOM, no network, no storage. A model
 * must always return its identity, version, units, assumptions, limitations,
 * references and validation state — a number alone is not a scientific result.
 *
 * Phase 1 adds the engine boundary: model definition, maturity evidence,
 * versioned registry, data/spatial/simulation contracts and provenance. It does
 * not add a scientific model or a runtime worker; those belong to later phases.
 */
export {
  computeWaterBalance,
  validateWaterBalanceInput,
  WATER_BALANCE_MODEL,
  SIGN_CONVENTION,
  M3_PER_MM_HA,
} from "./water-balance";
export type {
  ErrorCode,
  NumericInput,
  ScientificState,
  ValidationError,
  Warning,
  WarningCode,
  WaterBalanceFailure,
  WaterBalanceInput,
  WaterBalanceModel,
  WaterBalanceResult,
  WaterBalanceSuccess,
} from "./water-balance";

export { WATER_BALANCE_DEFINITION, waterBalanceModel } from "./water-balance-model";
export type { WaterBalanceContractInput, WaterBalanceOutputs } from "./water-balance-model";

export {
  MATURITY_EVIDENCE_KINDS,
  MODEL_MATURITY,
  checkPromotion,
  maturityRank,
} from "./maturity";
export type {
  EvidenceStatus,
  MaturityEvidence,
  MaturityEvidenceKind,
  ModelMaturity,
  ModelValidationMetadata,
  PromotionCheck,
} from "./maturity";

export {
  DEFAULT_PROVENANCE_REQUIREMENT,
  PROVENANCE_FIELDS,
  isProvenanceRecord,
} from "./provenance";
export type {
  ProvenanceField,
  ProvenanceRecord,
  ProvenanceRequirement,
} from "./provenance";

export {
  MODEL_DOMAINS,
  MODEL_EXECUTION_MODES,
  VALUE_KINDS,
  assertModelDefinition,
  isQuantity,
  validateModelDefinition,
  validateModelInput,
} from "./model";
export type {
  ModelDefinition,
  ModelDefinitionValidation,
  ModelDomain,
  ModelError,
  ModelErrorCode,
  ModelExecutionMode,
  ModelExecutor,
  ModelInputSpec,
  ModelOutputSpec,
  ModelParameterSpec,
  ModelResult,
  ModelRunContext,
  ModelValidationResult,
  ModelWarning,
  Quantity,
  ScientificModel,
  ScientificReference,
  UnitCode,
  ValidRange,
  ValueType,
} from "./model";

export { createModelRegistry } from "./registry";
export type {
  ModelRegistry,
  ModelRegistryEntry,
  ModelRegistryFilter,
} from "./registry";

export { SPATIAL_DOMAIN_KINDS, isBbox, isSpatialMetadata } from "./spatial";
export type {
  Bbox,
  SpatialCrs,
  SpatialCrsKind,
  SpatialDomain,
  SpatialExtent,
  SpatialMetadata,
  SpatialResolution,
} from "./spatial";

export { DATA_KINDS, isDataArtifact } from "./data";
export type {
  DataArtifact,
  DataKind,
  DataQuality,
  TemporalRange,
} from "./data";

export { JOB_STATUSES, canTransition, isJobStatus } from "./simulation";
export type {
  JobRecord,
  JobStatus,
  SimulationRequest,
  WorkerPort,
} from "./simulation";