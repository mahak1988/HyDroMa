import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROVENANCE_REQUIREMENT,
  MODEL_MATURITY,
  assertModelDefinition,
  canTransition,
  checkPromotion,
  createModelRegistry,
  isBbox,
  isDataArtifact,
  isJobStatus,
  isProvenanceRecord,
  isQuantity,
  isSpatialMetadata,
  maturityRank,
  validateModelDefinition,
  validateModelInput,
  WATER_BALANCE_DEFINITION,
  waterBalanceModel,
  type MaturityEvidence,
  type ModelDefinition,
  type ProvenanceRecord,
  type ScientificModel,
} from "../src";

const definition: ModelDefinition = {
  id: "test.example.water-balance",
  version: "1.0.0",
  domain: "water",
  title: "Example water balance",
  executionMode: "local",
  maturity: "stub",
  inputs: [
    {
      name: "precipitation",
      kind: "quantity",
      unit: "mm",
      required: true,
      description: "Precipitation over the period",
      validRange: { min: 0 },
    },
  ],
  outputs: [
    {
      name: "storageChange",
      kind: "quantity",
      unit: "mm",
      description: "Change in root-zone storage",
    },
  ],
  parameters: [],
  units: ["mm"],
  assumptions: ["One control volume"],
  limitations: ["Not validated"],
  references: [{ citation: "Example reference" }],
  validation: { maturity: "stub", evidence: [] },
  provenance: DEFAULT_PROVENANCE_REQUIREMENT,
};

const model: ScientificModel<Record<string, unknown>, { storageChange: number }> = {
  definition,
  validate: (input) => validateModelInput(definition, input),
  execute: (input, context) => ({
    modelId: definition.id,
    modelVersion: definition.version,
    status: "completed",
    outputs: { storageChange: isQuantity(input.precipitation) ? input.precipitation.value : 0 },
    warnings: [],
    provenance: {
      runId: context.runId,
      modelId: definition.id,
      modelVersion: definition.version,
      codeVersion: "test",
      inputHashes: [],
      parameterHash: "test",
      environment: "test",
      executedAt: new Date(0).toISOString(),
      operator: context.requestedBy,
      resultHashes: [],
      validationStatus: definition.maturity,
    },
    assumptions: definition.assumptions,
    limitations: definition.limitations,
    references: definition.references,
    validation: definition.validation,
  }),
};

function evidence(kind: MaturityEvidence["kind"], status: MaturityEvidence["status"] = "pass"): MaturityEvidence {
  return { kind, status };
}

describe("model maturity", () => {
  it("does not allow skipping a level", () => {
    expect(checkPromotion("stub", "tested", [evidence("implementation"), evidence("unit_test")])).toEqual({
      ok: false,
      reason: "maturity must advance one level at a time",
    });
  });

  it("requires implementation evidence for implemented", () => {
    expect(checkPromotion("stub", "implemented", []).ok).toBe(false);
    expect(checkPromotion("stub", "implemented", [evidence("implementation")])).toEqual({
      ok: true,
      maturity: "implemented",
    });
  });

  it("requires the evidence for each level", () => {
    expect(checkPromotion("implemented", "tested", []).ok).toBe(false);
    expect(checkPromotion("implemented", "tested", [evidence("unit_test")]).ok).toBe(true);
    expect(checkPromotion("tested", "verified", [evidence("unit_test")]).ok).toBe(false);
    expect(checkPromotion("tested", "verified", [evidence("reference")]).ok).toBe(true);
    expect(checkPromotion("verified", "validated", [evidence("reference")]).ok).toBe(false);
    expect(
      checkPromotion("verified", "validated", [evidence("observational"), evidence("independent_review")]).ok,
    ).toBe(true);
  });

  it("never approves production without owner approval", () => {
    expect(checkPromotion("validated", "production_approved", []).ok).toBe(false);
    expect(
      checkPromotion("validated", "production_approved", [evidence("owner_approval", "not_performed")]).ok,
    ).toBe(false);
    expect(checkPromotion("validated", "production_approved", [evidence("owner_approval")])).toEqual({
      ok: true,
      maturity: "production_approved",
    });
  });

  it("orders maturity deterministically", () => {
    expect(MODEL_MATURITY.map((level) => maturityRank(level))).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe("model definition contract", () => {
  it("accepts a valid definition", () => {
    const result = validateModelDefinition(definition);
    expect(result.ok).toBe(true);
    expect(() => assertModelDefinition(definition)).not.toThrow();
  });

  it("rejects duplicate input names", () => {
    const invalid: ModelDefinition = {
      ...definition,
      inputs: [definition.inputs[0]!, definition.inputs[0]!],
    };
    expect(validateModelDefinition(invalid).ok).toBe(false);
    expect(() => assertModelDefinition(invalid)).toThrow(/unique/);
  });

  it("rejects a non-semver version", () => {
    expect(validateModelDefinition({ ...definition, version: "1.0" }).ok).toBe(false);
  });

  it("rejects a maturity mismatch between definition and validation", () => {
    const invalid: ModelDefinition = {
      ...definition,
      validation: { maturity: "tested", evidence: [evidence("unit_test")] },
    };
    expect(validateModelDefinition(invalid).ok).toBe(false);
  });

  it("rejects an empty provenance requirement", () => {
    const invalid: ModelDefinition = {
      ...definition,
      provenance: { requiredFields: [] },
    };
    expect(validateModelDefinition(invalid).ok).toBe(false);
  });

  it("validates generic inputs and units", () => {
    expect(validateModelInput(definition, { precipitation: { value: 12, unit: "mm" } }).ok).toBe(true);
    expect(validateModelInput(definition, {}).ok).toBe(false);
    expect(validateModelInput(definition, { precipitation: { value: 12, unit: "m" } }).ok).toBe(false);
    expect(validateModelInput(definition, { precipitation: { value: -1, unit: "mm" } }).ok).toBe(false);
    expect(isQuantity({ value: 1, unit: "mm" })).toBe(true);
    expect(isQuantity({ value: 1 })).toBe(false);
  });
});

describe("model registry", () => {
  it("registers and retrieves the latest version", () => {
    const registry = createModelRegistry();
    registry.register(model);
    registry.register({ ...model, definition: { ...definition, version: "1.0.1" } });

    expect(registry.size()).toBe(2);
    expect(registry.has("test.example.water-balance")).toBe(true);
    expect(registry.get("test.example.water-balance")?.definition.version).toBe("1.0.1");
    expect(registry.get("test.example.water-balance", "1.0.0")?.definition.version).toBe("1.0.0");
    expect(registry.versionsOf("test.example.water-balance")).toEqual(["1.0.0", "1.0.1"]);
  });

  it("rejects duplicate versions and invalid definitions", () => {
    const registry = createModelRegistry();
    registry.register(model);
    expect(() => registry.register(model)).toThrow(/duplicate model version/);
    expect(() =>
      registry.register({ definition: { ...definition, version: "2.0.0", inputs: [] } }),
    ).toThrow(/Invalid scientific model definition/);
  });

  it("supports remote models without a local executor", () => {
    const registry = createModelRegistry();
    const remote: ScientificModel = {
      definition: { ...definition, id: "test.remote", executionMode: "remote", version: "1.0.0" },
    };
    registry.register(remote);
    expect(registry.get("test.remote")?.model.execute).toBeUndefined();
    expect(registry.list({ executionMode: "remote" })).toHaveLength(1);
  });

  it("filters by domain and maturity", () => {
    const registry = createModelRegistry();
    registry.register(model);
    registry.register({
      ...model,
      definition: {
        ...definition,
        id: "test.other",
        domain: "soil",
        maturity: "tested",
        validation: {
          maturity: "tested",
          evidence: [evidence("implementation"), evidence("unit_test")],
        },
      },
    });
    expect(registry.list({ domain: "water" })).toHaveLength(1);
    expect(registry.list({ maturity: "tested" })).toHaveLength(1);
    expect(registry.ids()).toEqual(["test.example.water-balance", "test.other"]);
  });
});

describe("water balance adapter", () => {
  const input = {
    periodDays: 30,
    precipitation: { value: 100, unit: "mm" },
    irrigation: { value: 50, unit: "mm" },
    runoff: { value: 10, unit: "mm" },
    evapotranspiration: { value: 120, unit: "mm" },
    deepPercolation: { value: 5, unit: "mm" },
  };
  const context = { runId: "run-1", requestedBy: "tester", requestedAt: new Date(0).toISOString() };

  it("exposes a valid, software-tested definition", () => {
    expect(validateModelDefinition(WATER_BALANCE_DEFINITION).ok).toBe(true);
    expect(WATER_BALANCE_DEFINITION.maturity).toBe("tested");
    expect(WATER_BALANCE_DEFINITION.validation.evidence.some((entry) => entry.kind === "unit_test" && entry.status === "pass")).toBe(true);
  });

  it("normalises quantities and computes the same result as the pure model", () => {
    const validation = waterBalanceModel.validate?.(input);
    expect(validation?.ok).toBe(true);
    if (!waterBalanceModel.execute) throw new Error("expected a local executor");
    const result = waterBalanceModel.execute(input, context);
    expect(result.status).toBe("completed");
    expect(result.outputs?.storageChangeMm).toBe(15);
    expect(result.provenance.validationStatus).toBe("tested");
    expect(result.provenance.modelVersion).toBe(WATER_BALANCE_DEFINITION.version);
  });

  it("rejects invalid and unit-mismatched input", () => {
    if (!waterBalanceModel.execute) throw new Error("expected a local executor");
    const empty = waterBalanceModel.execute({}, context);
    expect(empty.status).toBe("failed");
    const wrongUnit = waterBalanceModel.execute(
      { ...input, precipitation: { value: 100, unit: "m" } },
      context,
    );
    expect(wrongUnit.status).toBe("failed");
    expect(wrongUnit.errors?.some((error) => error.code === "UNSUPPORTED_UNIT")).toBe(true);
  });

  it("can be registered in the model registry", () => {
    const registry = createModelRegistry();
    registry.register(waterBalanceModel);
    expect(registry.get(WATER_BALANCE_DEFINITION.id)?.definition.version).toBe(WATER_BALANCE_DEFINITION.version);
  });
});
describe("provenance and data contracts", () => {
  const provenance: ProvenanceRecord = {
    runId: "run-1",
    modelId: definition.id,
    modelVersion: definition.version,
    codeVersion: "test",
    inputHashes: ["sha256:abc"],
    parameterHash: "sha256:def",
    environment: "test",
    executedAt: new Date(0).toISOString(),
    operator: "tester",
    resultHashes: ["sha256:123"],
    validationStatus: "stub",
  };

  it("accepts a complete provenance record", () => {
    expect(isProvenanceRecord(provenance)).toBe(true);
    expect(isProvenanceRecord({ ...provenance, resultHashes: "not-an-array" })).toBe(false);
    expect(isProvenanceRecord({ ...provenance, validationStatus: "bogus" })).toBe(false);
  });

  it("validates data artifacts and spatial metadata", () => {
    expect(
      isDataArtifact({
        id: "dataset-1",
        kind: "model_ready",
        uri: "file:///data/precipitation.tif",
        mediaType: "image/tiff",
      }),
    ).toBe(true);
    expect(isDataArtifact({ id: "dataset-1", kind: "unknown", uri: "x", mediaType: "x" })).toBe(false);
    expect(isSpatialMetadata({ crs: "EPSG:4326", domain: { kind: "h3", resolution: 7 } })).toBe(true);
    expect(isSpatialMetadata({ crs: "EPSG:4326", domain: { kind: "h3", resolution: "7" } })).toBe(false);
    expect(isSpatialMetadata({ crs: "EPSG:4326", domain: { kind: "unknown" } })).toBe(false);
    expect(isBbox([1, 2, 3])).toBe(false);
    expect(isBbox([1, 2, 3, 4])).toBe(true);
  });

  it("defines job transitions and status guards", () => {
    expect(isJobStatus("running")).toBe(true);
    expect(isJobStatus("unknown")).toBe(false);
    expect(canTransition("pending", "running")).toBe(true);
    expect(canTransition("running", "completed")).toBe(true);
    expect(canTransition("running", "pending")).toBe(false);
    expect(canTransition("failed", "pending")).toBe(true);
    expect(canTransition("completed", "running")).toBe(false);
  });
});