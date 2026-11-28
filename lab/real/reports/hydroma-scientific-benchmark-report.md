# HyDroMA Scientific Benchmark Report

- Generated: 2026-11-27T18:32:16.005454+00:00
- Data: Open-Meteo (CC BY 4.0) (real)
- Classification: REAL_WORLD_BENCHMARK_LAB_IMPLEMENTED_WITH_LIMITATIONS

> **SUPERSEDED (REAL.2 retraction):** Finding **F5** (`neg_rad → SCIENTIFIC_CONSTRAINT_VIOLATION`) and the `neg_rad` stress expectation `reject` in this REAL.1 report are **WITHDRAWN**. Negative net radiation (Rn) is physically valid (nocturnal longwave dominance; FAO-56 Eq. 6 accepts it), so the engine returning a value is correct. See `phase-real-2-scientific-remediation-report.md` (Retractions) and `stress.py` (`neg_rad` now `expect:"valid"`). Original content below is preserved for history.

## 1. Model inventory
- `eco-nojin.hydroma.fao56-et0` — meteorological — fao56_et0.py — maturity tested
- `eco-nojin.hydroma.hargreaves-et0` — meteorological — hargreaves_et0.py — maturity tested
- `eco-nojin.hydroma.water-balance` — water-resources — water_balance.py — maturity tested
- `eco-nojin.hydroma.soil-water-storage` — water-resources — soil_water.py — maturity tested
- `eco-nojin.hydroma.fao56-crop-etc` — agricultural — crop_etc.py — maturity tested
- `eco-nojin.hydroma.irrigation-schedule` — water-resources — irrigation.py — maturity tested
- `eco-nojin.hydroma.drought-wmo` — agroclimatic — drought_wmo.py — maturity tested
- `eco-nojin.hydroma.agroclimate` — agroclimatic — agroclimate.py — maturity tested
- `eco-nojin.hydroma.model-evaluation` — evaluation — evaluation.py — maturity tested

## 2. Dataset quality
- ok=True n=365 errors=0 warnings=0

## 3. Reference cross-check (FAO-56 vs independent reimplementation)
- NSE=1.0 RMSE=0.0001 MAE=0.0001 Bias=-0.0

## 4. Stress tests
- high_temp: expect=valid -> VALID_RESULT (ok=True)
- low_temp: expect=valid -> VALID_RESULT (ok=True)
- zero_wind: expect=valid -> VALID_RESULT (ok=True)
- high_wind: expect=valid -> VALID_RESULT (ok=True)
- zero_rad: expect=valid -> VALID_RESULT (ok=True)
- high_rad: expect=valid -> VALID_RESULT (ok=True)
- missing_ea: expect=reject -> EXPECTED_REJECTION (ok=False)
- nan_temp: expect=reject -> EXPECTED_REJECTION (ok=False)
- neg_rad: expect=reject -> SCIENTIFIC_CONSTRAINT_VIOLATION (ok=True)
- inf_wind: expect=reject -> EXPECTED_REJECTION (ok=False)

## 5. Sensitivity (OAT on FAO-56 ET0)
- t Δ1: out=4.6499 rel=4.796%
- t Δ2: out=4.86 rel=9.531%
- t Δ-1: out=4.2218 rel=-4.852%
- t Δ-2: out=4.0043 rel=-9.754%
- u2 Δ0.2: out=4.5706 rel=3.009%
- u2 Δ0.4: out=4.6996 rel=5.916%
- u2 Δ-0.2: out=4.2987 rel=-3.119%
- u2 Δ-0.4: out=4.1552 rel=-6.353%
- rn Δ1: out=4.666 rel=5.159%
- rn Δ2: out=4.895 rel=10.32%
- rn Δ-1: out=4.2081 rel=-5.161%
- rn Δ-2: out=3.9791 rel=-10.322%
- ea Δ0.1: out=4.2766 rel=-3.617%
- ea Δ-0.1: out=4.5975 rel=3.615%

## 6. Cross-model consistency
- et0_to_crop_etc: CONSISTENT
- precip_to_mass_balance: CONSISTENT
- soil_to_irrigation_monotonic: INCONCLUSIVE

## 7. Defect register
- [P2] F1 (STATISTICAL_METHOD_ERROR) eco-nojin.hydroma.drought-wmo: SPEI via gamma fit is undefined for negative water-balance values
- [P2] F2 (STATISTICAL_METHOD_ERROR) eco-nojin.hydroma.drought-wmo: 1-year record is an insufficient climatological baseline for SPI/SPEI
- [P3] F3 (UNIT_ERROR) eco-nojin.hydroma.fao56-et0: Open-Meteo wind is km/h at 10 m; must convert to m/s at 2 m
- [P3] F4 (SCIENTIFIC_VALIDATION_GAP) eco-nojin.hydroma.hargreaves-et0: Hargreaves vs FAO-56 agreement is not validation
- [P2] F5 (INPUT_VALIDATION_FAILURE) eco-nojin.hydroma.fao56-et0: FAO-56 returns a number for physically invalid inputs (should reject)

## 8. Model assessment
- eco-nojin.hydroma.fao56-et0: BENCHMARKED_WITH_LIMITATIONS
- eco-nojin.hydroma.hargreaves-et0: BENCHMARKED_WITH_LIMITATIONS
- eco-nojin.hydroma.drought-wmo: BENCHMARKED_WITH_LIMITATIONS
- eco-nojin.hydroma.water-balance: BENCHMARKED_WITH_LIMITATIONS
- eco-nojin.hydroma.fao56-crop-etc: BENCHMARKED_WITH_LIMITATIONS
- eco-nojin.hydroma.soil-water-storage: NOT_YET_BENCHMARKED
- eco-nojin.hydroma.irrigation-schedule: NOT_YET_BENCHMARKED
- eco-nojin.hydroma.agroclimate: NOT_YET_BENCHMARKED

## 9. Limitations
- Reference is an independent reimplementation, not authoritative published vectors.
- Reanalysis data are not independent ground truth.
- 1-year record insufficient for operational SPI/SPEI baseline.
- SPEI undefined for negative water-balance series (gamma fit).
- Wind unit/height conversion applied (Open-Meteo km/h at 10 m).

## 10. Independent review
- NOT_RUN — external reviewer (Nemotron 3 Ultra) unavailable in this environment; self-assessment only, not independent.