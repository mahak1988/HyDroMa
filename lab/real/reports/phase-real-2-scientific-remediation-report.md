# Phase REAL.2 — Scientific Remediation Report

- Generated: 2026-11-27T23:31:25.640697+00:00
- Classification: SCIENTIFIC_LAB_REMEDIATION_COMPLETED_WITH_EVIDENCE
- Data: Open-Meteo (CC BY 4.0) (real), wind=wind_speed_10m_mean

## Data provenance & uncertainty
- Provider: Open-Meteo — Historical Weather API (archive-api.open-meteo.com/v1/archive)
- Data type: reanalysis_model_based (observational ground truth: False)
- Location: {'latitude': 35.7, 'longitude': 51.4}  Period: {'start': '2023-01-01', 'end': '2023-12-31'}
- Fetched: 2026-11-27T22:32:13.756943+00:00  fingerprint=6d5fc9db636f3b10
- License: CC BY 4.0  Citation: Open-Meteo (CC BY 4.0), https://open-meteo.com/
- Numeric uncertainty: UNKNOWN (not provided by source)
  - data_uncertainty: UNKNOWN
  - parameter_uncertainty: UNKNOWN
  - model_structure_uncertainty: UNKNOWN
  - climatic_sampling_uncertainty: HIGH (1-year record; INSUFFICIENT_CLIMATOLOGICAL_BASELINE)

## Independence
- COMPUTATIONALLY_INDEPENDENT imports=['__future__', 'math'] hydroma_imported=False
- Reference: independent_reimplementation_not_authoritative vreal2-1.0.0

## Reference cross-check (FAO-56)
- NSE=1.0 RMSE=0.0001 MAE=0.0001 Bias=-0.0

## SPI / water-balance anomaly
- SPI: gamma-fit SPI baseline=INSUFFICIENT_CLIMATOLOGICAL_BASELINE min=-0.9674
- WB anomaly (Z-score, not SPEI): standardized climatic water-balance anomaly (Z-score; NOT conventional SPEI) baseline=INSUFFICIENT_CLIMATOLOGICAL_BASELINE min=-1.4659

## Stress
- high_temp: VALID_RESULT
- low_temp: VALID_RESULT
- zero_wind: VALID_RESULT
- high_wind: VALID_RESULT
- zero_rad: VALID_RESULT
- high_rad: VALID_RESULT
- neg_rad: VALID_RESULT
- missing_ea: EXPECTED_REJECTION
- nan_temp: EXPECTED_REJECTION
- inf_wind: EXPECTED_REJECTION

## Consistency
- et0_to_crop_etc: CONSISTENT
- precip_to_mass_balance: CONSISTENT
- soil_to_irrigation_monotonic: INCONCLUSIVE

## Findings
- [P2] F1 STATISTICAL_METHOD_ERROR eco-nojin.hydroma.drought-wmo: Engine SPEI uses gamma on P-PET; undefined for negative balance (lab uses Z-score water-balance anomaly)
- [P2] F2 STATISTICAL_METHOD_ERROR eco-nojin.hydroma.drought-wmo: 1-year record is INSUFFICIENT_CLIMATOLOGICAL_BASELINE for SPI/SPEI
- [P3] F3 UNIT_ERROR eco-nojin.hydroma.fao56-et0: Wind must be mean (not max), converted km/h->m/s and 10 m->2 m
- [P3] F4 SCIENTIFIC_VALIDATION_GAP eco-nojin.hydroma.hargreaves-et0: Hargreaves vs FAO-56 agreement is not validation

## Retractions
- F5: previous neg_rad 'violation' was a LAB error: negative NET radiation (Rn) is physically valid; expectation corrected to VALID_RESULT.

## Evidence classification
- software: SOFTWARE_VERIFIED
- numerical: NUMERICALLY_REPRODUCED
- computational_independence: COMPUTATIONALLY_INDEPENDENT
- scientific_support: NOT_VALIDATED
- scientific_validation: NOT_VALIDATED
- field_validation: NOT_VALIDATED

## Limitations
- Reference is an independent reimplementation, not authoritative published vectors.
- Reanalysis data are not independent ground truth.
- 1-year record insufficient for operational SPI/SPEI baseline.
- Engine SPEI (gamma) undefined for negative balance; lab computes a Z-score standardized water-balance anomaly (NOT conventional SPEI).
- Wind: mean variable + km/h->m/s + 10 m->2 m conversion applied.

## Independent review
- NOT_RUN — Nemotron 3 Ultra unavailable; self-assessment only.

## Scientific status
- scientific_status: NOT_VALIDATED (NOT scientific validation)
  - SOFTWARE_VERIFIED: software behaves per spec; NOT scientific validation
  - NUMERICALLY_REPRODUCED: two code paths agree numerically; NOT predictive accuracy
  - COMPUTATIONALLY_INDEPENDENT: reference imports no engine code; NOT third-party review
  - STRESS_VIOLATIONS_0: no stress expectation broken; NOT model correctness
  - NSE_1_0: code-agreement in the cross-check; NOT forecast skill
  - NOT_VALIDATED: no independent, fit-for-use scientific/field validation evidence

## NOT validated
- No HyDroMA model is scientifically validated by this laboratory.