/**
 * Eco Nojin custom scientific engine (backend, fixture/local).
 * Deterministic, no external services. NOT_VALIDATED.
 */

function provenance(runId, modelId, version, requestedBy) {
  return {
    runId,
    modelId,
    modelVersion: version,
    codeVersion: "1.0.0",
    inputHashes: [],
    parameterHash: `${modelId}@${version}`,
    environment: "local",
    executedAt: new Date().toISOString(),
    operator: requestedBy || "local",
    resultHashes: [],
    validationStatus: "tested",
  };
}

export function runGdd(input, ctx = {}) {
  const tMax = Number(input?.tMax);
  const tMin = Number(input?.tMin);
  const tBase = Number(input?.tBase);
  const tCap = input?.tCap == null ? undefined : Number(input.tCap);
  const valid =
    [tMax, tMin, tBase].every((n) => Number.isFinite(n)) &&
    tMin <= tMax &&
    (tCap === undefined || Number.isFinite(tCap));
  const modelId = "eco-nojin.gdd";
  const version = "1.0.0";
  if (!valid) {
    return { modelId, modelVersion: version, status: "failed", outputs: null, provenance: provenance(ctx.runId, modelId, version, ctx.requestedBy), scientificStatus: "NOT_VALIDATED" };
  }
  let max = tMax;
  let capped = false;
  if (tCap !== undefined && max > tCap) { max = tCap; capped = true; }
  const dailyMean = (max + tMin) / 2;
  const gdd = Math.max(0, dailyMean - tBase);
  return { modelId, modelVersion: version, status: "completed", outputs: { gdd, dailyMean, capped }, provenance: provenance(ctx.runId, modelId, version, ctx.requestedBy), scientificStatus: "NOT_VALIDATED" };
}

export function runHargreavesEt0(input, ctx = {}) {
  const tMax = Number(input?.tMax);
  const tMin = Number(input?.tMin);
  const ra = Number(input?.ra);
  const valid = [tMax, tMin, ra].every((n) => Number.isFinite(n)) && tMin <= tMax && ra >= 0;
  const modelId = "eco-nojin.hargreaves-et0";
  const version = "1.0.0";
  if (!valid) {
    return { modelId, modelVersion: version, status: "failed", outputs: null, provenance: provenance(ctx.runId, modelId, version, ctx.requestedBy), scientificStatus: "NOT_VALIDATED" };
  }
  const tMean = (tMax + tMin) / 2;
  const et0 = Math.max(0, 0.0023 * (tMean + 17.8) * Math.sqrt(Math.max(0, tMax - tMin)) * 0.408 * ra);
  return { modelId, modelVersion: version, status: "completed", outputs: { et0, tMean }, provenance: provenance(ctx.runId, modelId, version, ctx.requestedBy), scientificStatus: "NOT_VALIDATED" };
}