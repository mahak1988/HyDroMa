import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeWaterBalance,
  validateWaterBalanceInput,
  WATER_BALANCE_MODEL,
  M3_PER_MM_HA,
} from '../src/js/engines/water-balance.js';

// ---------------------------------------------------------------------------
// Independent reference formulation (NOT the engine's own algebra).
// FAO-56 (Allen et al., 1998) soil-water balance in depletion form:
//     ΔDr = ET + DP − (P − RO) − I − CR
//     ΔS  = −ΔDr
// This is algebraically equivalent to ΔS = P + I + CR − ET − R − DP but is
// derived independently here to cross-check the engine.
// ---------------------------------------------------------------------------
function referenceStorageChange({ precipitation, irrigation, evapotranspiration, runoff, deepPercolation = 0, capillaryRise = 0 }) {
  const deltaDr = evapotranspiration + deepPercolation - (precipitation - runoff) - irrigation - capillaryRise;
  return -deltaDr;
}

const REFERENCE_CASES = [
  {
    id: 'A-deficit',
    source: 'FAO-56 soil water balance, depletion form — independent re-derivation',
    inputs: { periodDays: 20, precipitation: 90, irrigation: 60, runoff: 12, evapotranspiration: 170, deepPercolation: 8, capillaryRise: 0 },
    expected: -40,
  },
  {
    id: 'B-deficit-capillary',
    source: 'FAO-56 soil water balance, depletion form — independent re-derivation',
    inputs: { periodDays: 30, precipitation: 140, irrigation: 0, runoff: 25, evapotranspiration: 95, deepPercolation: 45, capillaryRise: 10 },
    expected: -15,
  },
  {
    id: 'C-surplus',
    source: 'FAO-56 soil water balance, depletion form — independent re-derivation',
    inputs: { periodDays: 15, precipitation: 200, irrigation: 120, runoff: 35, evapotranspiration: 210, deepPercolation: 55, capillaryRise: 5 },
    expected: 25,
  },
  {
    id: 'D-conservation-zero',
    source: 'Conservation identity: inflow = outflow ⇒ ΔS = 0',
    inputs: { periodDays: 10, precipitation: 100, irrigation: 50, runoff: 20, evapotranspiration: 120, deepPercolation: 10, capillaryRise: 0 },
    expected: 0,
  },
];

test('reference cases reproduce (independent depletion-form cross-check + recorded difference)', () => {
  for (const c of REFERENCE_CASES) {
    const ref = referenceStorageChange(c.inputs);
    assert.ok(Math.abs(ref - c.expected) < 1e-9, `${c.id}: reference disagreed with recorded expected`);

    const r = computeWaterBalance(c.inputs);
    assert.equal(r.ok, true, `${c.id} failed to compute`);
    const diff = Math.abs(r.result.storageChangeMm - c.expected);
    // difference is recorded here (diff variable) and asserted to be negligible
    assert.ok(diff < 1e-9, `${c.id}: engine=${r.result.storageChangeMm} expected=${c.expected} diff=${diff}`);
  }
});

test('engine ΔS equals the independent reference across a parameter sweep', () => {
  const grid = [0, 5, 50, 120, 300];
  for (const P of grid) {
    for (const I of grid) {
      for (const ET of grid) {
        for (const R of [0, 10, 60]) {
          const inp = { periodDays: 30, precipitation: P, irrigation: I, runoff: R, evapotranspiration: ET, deepPercolation: 0, capillaryRise: 0 };
          const ref = referenceStorageChange(inp);
          const r = computeWaterBalance(inp);
          assert.ok(Math.abs(r.result.storageChangeMm - ref) < 1e-6, `P=${P} I=${I} ET=${ET} R=${R}`);
        }
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Depth -> volume conversion, several independent cases.
// 1 mm over 1 ha = 10 m³  (1 mm = 0.001 m; 1 ha = 10 000 m²).
// ---------------------------------------------------------------------------
test('M3_PER_MM_HA constant is the standard factor', () => {
  assert.equal(M3_PER_MM_HA, 10);
});

const VOLUME_CASES = [
  { name: '1mm over 1ha', inputs: { periodDays: 10, precipitation: 1, irrigation: 0, runoff: 0, evapotranspiration: 0, areaHa: 1 }, expectedDS: 1, expectedM3: 10 },
  { name: '1mm over 100ha', inputs: { periodDays: 10, precipitation: 1, irrigation: 0, runoff: 0, evapotranspiration: 0, areaHa: 100 }, expectedDS: 1, expectedM3: 1000 },
  { name: '35.5mm over 12.5ha', inputs: { periodDays: 45, precipitation: 35.5, irrigation: 0, runoff: 0, evapotranspiration: 0, areaHa: 12.5 }, expectedDS: 35.5, expectedM3: 4437.5 },
  { name: '0mm over 50ha', inputs: { periodDays: 5, precipitation: 0, irrigation: 0, runoff: 0, evapotranspiration: 0, areaHa: 50 }, expectedDS: 0, expectedM3: 0 },
  { name: 'deficit -40mm over 25ha', inputs: { periodDays: 30, precipitation: 0, irrigation: 0, runoff: 0, evapotranspiration: 40, areaHa: 25 }, expectedDS: -40, expectedM3: -10000 },
];

test('depth to volume conversion is correct in independent cases', () => {
  for (const c of VOLUME_CASES) {
    const r = computeWaterBalance(c.inputs);
    assert.equal(r.result.storageChangeMm, c.expectedDS, c.name);
    assert.equal(r.result.storageChangeM3, c.expectedM3, c.name);
  }
});

// ---------------------------------------------------------------------------
// Missing vs zero; optional defaults.
// ---------------------------------------------------------------------------
test('required field: missing is an error, zero is valid', () => {
  const missing = computeWaterBalance({ periodDays: 30, precipitation: 100, irrigation: 50, runoff: 10 }); // ET missing
  assert.equal(missing.ok, false);
  assert.ok(missing.errors.some((e) => e.field === 'evapotranspiration' && e.code === 'MISSING'));
  assert.equal('result' in missing, false);

  const zero = computeWaterBalance({ periodDays: 30, precipitation: 0, irrigation: 0, runoff: 0, evapotranspiration: 0 });
  assert.equal(zero.ok, true);
  assert.equal(zero.result.storageChangeMm, 0);
});

test('optional flux: omitted is defaulted and flagged; explicit zero is not', () => {
  const omitted = computeWaterBalance({ periodDays: 10, precipitation: 50, irrigation: 0, runoff: 0, evapotranspiration: 20 });
  assert.deepEqual([...omitted.defaultsApplied].sort(), ['capillaryRise', 'deepPercolation']);
  assert.equal(omitted.inputsProvided.deepPercolation, false);

  const explicit = computeWaterBalance({ periodDays: 10, precipitation: 50, irrigation: 0, runoff: 0, evapotranspiration: 20, deepPercolation: 0, capillaryRise: 0 });
  assert.deepEqual(explicit.defaultsApplied, []);
  assert.equal(explicit.inputsProvided.deepPercolation, true);
  assert.equal(explicit.result.storageChangeMm, omitted.result.storageChangeMm);
});

test('incomplete input never yields a valid-looking result', () => {
  for (const inp of [{}, { precipitation: 100 }, { periodDays: 30, precipitation: 100, runoff: 0, evapotranspiration: 10 }]) {
    const r = computeWaterBalance(inp);
    assert.equal(r.ok, false);
    assert.equal('result' in r, false);
    assert.ok(r.errors.length > 0);
  }
});

// ---------------------------------------------------------------------------
// Closure residual definition and tolerance.
// ---------------------------------------------------------------------------
test('closure residual is signed as ΔS_computed − ΔS_observed', () => {
  const same = { periodDays: 30, precipitation: 110, irrigation: 50, runoff: 10, evapotranspiration: 120, deepPercolation: 5 };
  const base = computeWaterBalance(same);
  assert.equal(base.result.storageChangeMm, 25);

  const far = computeWaterBalance({ ...same, measuredStorageChange: 10 });
  assert.equal(far.result.residualDefinition, 'deltaS_computed_minus_deltaS_observed');
  assert.equal(far.result.residualMm, 15); // 25 − 10
  assert.equal(far.result.balanceCloses, false);
  assert.ok(far.warnings.some((w) => w.code === 'CLOSURE_MISMATCH'));

  const near = computeWaterBalance({ ...same, measuredStorageChange: 23 });
  assert.equal(near.result.residualMm, 2);
  assert.equal(near.result.balanceCloses, true);
});

// ---------------------------------------------------------------------------
// Units / period consistency.
// ---------------------------------------------------------------------------
test('period must be a positive integer; depths may be decimal', () => {
  for (const p of [0, -1, 1.5, '2.5', 'x', undefined]) {
    const r = computeWaterBalance({ periodDays: p, precipitation: 10, irrigation: 0, runoff: 0, evapotranspiration: 5 });
    assert.equal(r.ok, false, `period ${String(p)} should be rejected`);
    assert.ok(r.errors.some((e) => e.code === 'PERIOD_INVALID'));
  }
  const ok = computeWaterBalance({ periodDays: 7, precipitation: 0.5, irrigation: 0.25, runoff: 0, evapotranspiration: 0.75 });
  assert.equal(ok.ok, true);
  assert.equal(ok.result.storageChangeMm, 0);
  assert.equal(ok.result.unit, 'mm');
});

test('area must be a positive number when provided', () => {
  const r = computeWaterBalance({ periodDays: 10, precipitation: 10, irrigation: 0, runoff: 0, evapotranspiration: 5, areaHa: 0 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.code === 'AREA_INVALID'));
});

// ---------------------------------------------------------------------------
// Boundaries, decimals, large magnitudes.
// ---------------------------------------------------------------------------
test('all-zero inputs balance to zero', () => {
  const r = computeWaterBalance({ periodDays: 1, precipitation: 0, irrigation: 0, runoff: 0, evapotranspiration: 0 });
  assert.equal(r.result.storageChangeMm, 0);
  assert.equal(r.result.status, 'balanced');
  assert.equal(r.result.runoffCoefficient, null);
  assert.equal(r.result.inflowMm, 0);
  assert.equal(r.result.outflowMm, 0);
});

test('decimal inputs do not produce spurious surplus/deficit', () => {
  const r = computeWaterBalance({ periodDays: 3, precipitation: 0.1, irrigation: 0.2, runoff: 0, evapotranspiration: 0.3 });
  assert.equal(r.result.storageChangeMm, 0);
  assert.equal(r.result.status, 'balanced');
});

test('large magnitudes remain finite and consistent', () => {
  const r = computeWaterBalance({ periodDays: 365, precipitation: 1e5, irrigation: 5e4, runoff: 2e4, evapotranspiration: 1.2e5, deepPercolation: 1e4 });
  assert.equal(r.result.storageChangeMm, 0);
  assert.ok(Number.isFinite(r.result.storageChangeMm));
});

// ---------------------------------------------------------------------------
// Final storage validity (never serve a negative storage as valid).
// ---------------------------------------------------------------------------
test('final storage is numeric within range, and null when out of domain', () => {
  const okCase = computeWaterBalance({ periodDays: 10, precipitation: 60, irrigation: 20, runoff: 5, evapotranspiration: 40, initialStorage: 100 });
  assert.equal(okCase.result.finalStorageMm, 135); // 100 + 35
  assert.equal(okCase.result.outOfDomain, false);

  const bad = computeWaterBalance({ periodDays: 10, precipitation: 0, irrigation: 0, runoff: 0, evapotranspiration: 60, initialStorage: 10 });
  assert.equal(bad.result.storageChangeMm, -60);
  assert.equal(bad.result.finalStorageMm, null);
  assert.equal(bad.result.outOfDomain, true);
  assert.ok(bad.warnings.some((w) => w.code === 'NEGATIVE_STORAGE'));
});

// ---------------------------------------------------------------------------
// Scientific record and validation status.
// ---------------------------------------------------------------------------
test('scientific record: identity, version, equation, units, NOT_VALIDATED', () => {
  const r = computeWaterBalance({ periodDays: 30, precipitation: 100, irrigation: 0, runoff: 10, evapotranspiration: 60 });
  assert.equal(WATER_BALANCE_MODEL.id, 'eco-nojin.hydroma.water-balance');
  assert.equal(WATER_BALANCE_MODEL.version, '1.1.0');
  assert.equal(WATER_BALANCE_MODEL.equation, 'deltaS = P + I + CR - ET - R - DP');
  assert.equal(WATER_BALANCE_MODEL.units.depth, 'mm');
  assert.equal(WATER_BALANCE_MODEL.units.volume, 'm3');
  assert.equal(r.model.state, 'NOT_VALIDATED');
  assert.equal(r.model.validation.status, 'NOT_VALIDATED');
  assert.equal(r.model.validation.scientificValidation, 'not_performed');
  assert.equal(r.model.validation.softwareTests, 'unit_tests_passing');
  assert.ok(r.model.validation.requires.length >= 4);
  assert.match(r.model.validation.note, /not equivalent/i);
  assert.ok(r.references.length >= 4);
  assert.ok(r.assumptions.length >= 3);
  assert.ok(r.limitations.length >= 3);
});

test('engine is deterministic and does not depend on the DOM', () => {
  const i = { periodDays: 30, precipitation: 100, irrigation: 50, runoff: 10, evapotranspiration: 120, deepPercolation: 5 };
  assert.deepEqual(computeWaterBalance(i), computeWaterBalance(i));
  assert.equal(typeof globalThis.document, 'undefined');
});