import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeWaterBalance,
  validateWaterBalanceInput,
  WATER_BALANCE_MODEL,
  M3_PER_MM_HA,
} from '../src/js/engines/water-balance.js';

const base = {
  periodDays: 30,
  precipitation: 100,
  irrigation: 50,
  runoff: 10,
  evapotranspiration: 120,
  deepPercolation: 5,
};

test('water balance closes with the defined sign convention', () => {
  const r = computeWaterBalance(base);
  assert.equal(r.ok, true);
  // ΔS = 100 + 50 + 0 − 120 − 10 − 5 = 15
  assert.equal(r.result.storageChangeMm, 15);
  assert.equal(r.components.inflow, 150);
  assert.equal(r.components.outflow, 135);
  assert.equal(r.result.status, 'surplus');
});

test('storage decreases (deficit) when outflow exceeds inflow', () => {
  const r = computeWaterBalance({ ...base, evapotranspiration: 200 });
  assert.equal(r.result.storageChangeMm, -65);
  assert.equal(r.result.status, 'deficit');
  assert.ok(r.warnings.some((w) => w.code === 'ET_GT_INFLOW'));
});

test('optional fluxes default to zero', () => {
  const r = computeWaterBalance({ periodDays: 10, precipitation: 30, irrigation: 0, runoff: 0, evapotranspiration: 30 });
  assert.equal(r.ok, true);
  assert.equal(r.components.DP, 0);
  assert.equal(r.components.CR, 0);
  assert.equal(r.result.storageChangeMm, 0);
  assert.equal(r.result.status, 'balanced');
});

test('capillary rise is an inflow (adds to storage)', () => {
  const without = computeWaterBalance(base).result.storageChangeMm;
  const withCR = computeWaterBalance({ ...base, capillaryRise: 12 }).result.storageChangeMm;
  assert.equal(withCR - without, 12);
});

test('depth converts to volume using area (1 mm over 1 ha = 10 m3)', () => {
  assert.equal(M3_PER_MM_HA, 10);
  const r = computeWaterBalance({ ...base, areaHa: 10 });
  assert.equal(r.result.storageChangeMm, 15);
  assert.equal(r.result.storageChangeM3, 1500); // 15 mm * 10 ha * 10
  assert.equal(r.result.inflowM3, 1500 * 10);
});

test('runoff coefficient is R/P when P > 0, else null', () => {
  const r = computeWaterBalance({ ...base, precipitation: 100, runoff: 25 });
  assert.equal(r.result.runoffCoefficient, 0.25);
  const noRain = computeWaterBalance({ periodDays: 5, precipitation: 0, irrigation: 40, runoff: 0, evapotranspiration: 30 });
  assert.equal(noRain.result.runoffCoefficient, null);
});

test('measured storage change yields a closure residual', () => {
  const closes = computeWaterBalance({ ...base, measuredStorageChange: 15 });
  assert.equal(closes.result.residualMm, 0);
  assert.equal(closes.result.balanceCloses, true);

  const mismatch = computeWaterBalance({ ...base, measuredStorageChange: 40 });
  assert.equal(mismatch.result.residualMm, -25);
  assert.equal(mismatch.result.balanceCloses, false);
  assert.ok(mismatch.warnings.some((w) => w.code === 'CLOSURE_MISMATCH'));
});

test('negative measured storage change is allowed (drying)', () => {
  const r = computeWaterBalance({ ...base, measuredStorageChange: -65 });
  assert.equal(r.ok, true);
  assert.equal(r.result.residualMm, 80); // 15 − (−65)
});

test('invalid inputs are rejected with coded errors', () => {
  const cases = [
    { input: { ...base, precipitation: -5 }, code: 'NEGATIVE', field: 'precipitation' },
    { input: { ...base, evapotranspiration: 'abc' }, code: 'NOT_FINITE', field: 'evapotranspiration' },
    { input: { ...base, runoff: undefined }, code: 'MISSING', field: 'runoff' },
    { input: { ...base, periodDays: 0 }, code: 'PERIOD_INVALID', field: 'periodDays' },
    { input: { ...base, periodDays: 12.5 }, code: 'PERIOD_INVALID', field: 'periodDays' },
    { input: { ...base, areaHa: -2 }, code: 'AREA_INVALID', field: 'areaHa' },
    { input: { ...base, initialStorage: -1 }, code: 'STORAGE_INVALID', field: 'initialStorage' },
  ];
  for (const c of cases) {
    const v = validateWaterBalanceInput(c.input);
    assert.equal(v.valid, false, `expected invalid for ${c.field}`);
    assert.ok(v.errors.some((e) => e.code === c.code && e.field === c.field), `missing ${c.code}/${c.field}`);
    const r = computeWaterBalance(c.input);
    assert.equal(r.ok, false);
    assert.ok(Array.isArray(r.errors) && r.errors.length > 0);
  }
});

test('rejects physically implausible runoff greater than all inflow', () => {
  const r = computeWaterBalance({ ...base, runoff: 300 });
  assert.ok(r.warnings.some((w) => w.code === 'RUNOFF_GT_INPUT'));
});

test('negative final storage is flagged and not served as a valid value', () => {
  const r = computeWaterBalance({ ...base, evapotranspiration: 220, initialStorage: 5 });
  assert.equal(r.result.finalStorageMm, null); // never serve a negative storage
  assert.equal(r.result.outOfDomain, true);
  assert.ok(r.warnings.some((w) => w.code === 'NEGATIVE_STORAGE'));
});

test('computation is deterministic', () => {
  const a = computeWaterBalance(base);
  const b = computeWaterBalance(base);
  assert.deepEqual(a, b);
  assert.equal('computedAt' in a, false); // no timestamps → deterministic
});

test('model reports its identity, scientific state and references', () => {
  const r = computeWaterBalance(base);
  assert.equal(r.model.state, 'NOT_VALIDATED');
  assert.equal(r.model.id, 'eco-nojin.hydroma.water-balance');
  assert.ok(r.references.length >= 3);
  assert.ok(r.assumptions.length >= 3);
  assert.ok(r.limitations.length >= 3);
  assert.equal(WATER_BALANCE_MODEL.units.depth, 'mm');
});

test('equation exposes formula, substitution and units', () => {
  const r = computeWaterBalance(base);
  assert.match(r.equation.formulaDisplay, /ΔS = P \+ I \+ CR/);
  assert.match(r.equation.substitution, /mm$/);
  assert.equal(r.result.unit, 'mm');
});