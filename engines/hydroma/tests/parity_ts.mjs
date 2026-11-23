// Cross-language parity harness: runs the ACTUAL TypeScript water balance model
// over shared vectors and prints projected results as JSON to stdout.
// Usage: node parity_ts.mjs <vectors.json>
import { readFileSync } from "node:fs";
import { computeWaterBalance } from "../../../packages/scientific/src/water-balance.ts";

const file = process.argv[2];
const data = JSON.parse(readFileSync(file, "utf8"));

const uniqSorted = (arr) => [...new Set(arr)].sort();

function project(r) {
  if (!r.ok) {
    return {
      ok: false, status: null, storageChangeMm: null, storageChangeM3: null,
      inflowMm: null, outflowMm: null, residualMm: null, balanceCloses: null,
      finalStorageMm: null, outOfDomain: null, warnings: [],
      errors: uniqSorted(r.errors.map((e) => e.code)),
    };
  }
  const x = r.result;
  return {
    ok: true, status: x.status, storageChangeMm: x.storageChangeMm,
    storageChangeM3: x.storageChangeM3, inflowMm: x.inflowMm, outflowMm: x.outflowMm,
    residualMm: x.residualMm, balanceCloses: x.balanceCloses,
    finalStorageMm: x.finalStorageMm, outOfDomain: x.outOfDomain,
    warnings: uniqSorted(r.warnings.map((w) => w.code)), errors: [],
  };
}

const out = data.vectors.map((v) => ({ id: v.id, ...project(computeWaterBalance(v.input)) }));
process.stdout.write(JSON.stringify(out));