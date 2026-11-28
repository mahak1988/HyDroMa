/**
 * Eco Nojin custom scientific engine (local, deterministic).
 *
 * This is project-specific orchestration code: it runs registered scientific
 * models and attaches provenance. It does not perform scientific validation.
 * All outputs are marked NOT_VALIDATED until observational evidence exists.
 */
import { gddModel } from "./gdd-model";
import { computeHargreavesEt0, HARGREAVES_MODEL, type HargreavesInput } from "./hargreaves-et0";
import type { ModelRunContext } from "./model";
import type { ProvenanceRecord } from "./provenance";

export interface EngineResult<TOutput> {
  modelId: string;
  modelVersion: string;
  status: "completed" | "failed";
  outputs: TOutput | null;
  provenance: ProvenanceRecord;
  scientificStatus: "NOT_VALIDATED";
}

function baseProvenance(ctx: ModelRunContext, modelId: string, version: string): ProvenanceRecord {
  return {
    runId: ctx.runId,
    modelId,
    modelVersion: version,
    codeVersion: "1.0.0",
    inputHashes: [],
    parameterHash: `${modelId}@${version}`,
    environment: ctx.environment ?? "local",
    executedAt: ctx.requestedAt ?? new Date().toISOString(),
    operator: ctx.requestedBy,
    resultHashes: [],
    validationStatus: "tested",
  };
}

export function runGdd(input: unknown, ctx: ModelRunContext): EngineResult<unknown> {
  const checked = gddModel.validate?.(input);
  if (!checked || !checked.ok) {
    return {
      modelId: gddModel.definition.id,
      modelVersion: gddModel.definition.version,
      status: "failed",
      outputs: null,
      provenance: baseProvenance(ctx, gddModel.definition.id, gddModel.definition.version),
      scientificStatus: "NOT_VALIDATED",
    };
  }
  const result = gddModel.execute!(checked.value, ctx);
  return {
    modelId: result.modelId,
    modelVersion: result.modelVersion,
    status: result.status,
    outputs: result.outputs ?? null,
    provenance: result.provenance,
    scientificStatus: "NOT_VALIDATED",
  };
}

export function runHargreavesEt0(input: unknown, ctx: ModelRunContext): EngineResult<unknown> {
  const v = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const parsed: HargreavesInput = { tMax: Number(v.tMax), tMin: Number(v.tMin), ra: Number(v.ra) };
  const valid =
    [parsed.tMax, parsed.tMin, parsed.ra].every((n) => Number.isFinite(n)) &&
    parsed.tMin <= parsed.tMax &&
    parsed.ra >= 0;
  if (!valid) {
    return {
      modelId: HARGREAVES_MODEL.id,
      modelVersion: HARGREAVES_MODEL.version,
      status: "failed",
      outputs: null,
      provenance: baseProvenance(ctx, HARGREAVES_MODEL.id, HARGREAVES_MODEL.version),
      scientificStatus: "NOT_VALIDATED",
    };
  }
  const out = computeHargreavesEt0(parsed);
  return {
    modelId: HARGREAVES_MODEL.id,
    modelVersion: HARGREAVES_MODEL.version,
    status: "completed",
    outputs: out,
    provenance: baseProvenance(ctx, HARGREAVES_MODEL.id, HARGREAVES_MODEL.version),
    scientificStatus: "NOT_VALIDATED",
  };
}