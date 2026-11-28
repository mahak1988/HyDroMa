# Independent Scientific Review: HyDroMA Real-World Benchmark & Scientific Challenge Laboratory

**Reviewer:** Nemotron 3 Ultra  
**Project:** Eco Nojin / HyDroMA  
**Review Date:** 2026-11-28  
**Review Scope:** `lab/real/` and `engines/hydroma/`

---

## 1. Executive Summary

This review independently assesses the HyDroMA real-world benchmark laboratory (`lab/real/`) against its stated objective: *reliably detecting genuine scientific, numerical, analytical, physical, data-quality, and software defects in HyDroMA models*.

**Final Classification:** `INDEPENDENT_REVIEW_PARTIALLY_CONFIRMED`

The laboratory demonstrates a **genuinely independent architecture** with clear separation of concerns (acquisition → normalization → quality → benchmark → stress → sensitivity → consistency → diagnostics → regression → reports). It correctly identifies several real limitations in the engine (F1, F2, F3, F4 are confirmed). However, **Finding F5 (neg_rad) is NOT CONFIRMED** — the laboratory's test expectation is scientifically incorrect. The FAO-56 reference comparison (NSE=1.0, RMSE=0.0001) reflects numerical agreement between two implementations sharing helper functions, not independent scientific validation. The SPI/SPEI methodology has documented statistical limitations that the laboratory correctly identifies but the engine does not yet remediate.

**Key Conclusion:** The laboratory is a valuable *software verification* tool that can detect coding errors and document known limitations. It is **not** a scientific validation framework. Its findings should be classified as `SOFTWARE_VERIFIED` or `NUMERICALLY_REPRODUCED`, not `SCIENTIFICALLY_VALIDATED`.

---

## 2. Review Methodology

- **Source inspection:** Read all files under `lab/real/` (13 Python modules + 2 reports) and relevant engine files under `engines/hydroma/hydroma/` (fao56_et0.py, drought_wmo.py, hargreaves_et0.py, water_balance.py, crop_etc.py, irrigation.py, normalize.py, evaluation.py) plus test vectors.
- **No execution:** No code was executed; all analysis is from static inspection of source, data, and reported outputs.
- **Evidence-based:** Every claim references specific file paths and line numbers.
- **Classification discipline:** Findings classified per the required taxonomy (`CONFIRMED`, `PARTIALLY_CONFIRMED`, `NOT_CONFIRMED`, `REQUIRES_FURTHER_INVESTIGATION`; `SOFTWARE_VERIFIED`, `NUMERICALLY_REPRODUCED`, `SCIENTIFICALLY_SUPPORTED`, `SCIENTIFICALLY_VALIDATED`).

---

## 3. Actual Files Inspected

### Laboratory (`lab/real/`)
| File | Purpose |
|------|---------|
| `benchmark.py` | Deterministic benchmark runner with SHA-256 fingerprints |
| `references.py` | Independent FAO-56/Hargreaves reimplementations (stdlib) |
| `stress.py` | 10 adversarial stress cases with expected behaviours |
| `sensitivity.py` | One-at-a-time (OAT) sensitivity analysis |
| `consistency.py` | Cross-model physical consistency checks |
| `diagnostics.py` | Defect register (Finding dataclass + Register) |
| `regression.py` | Documented regression cases |
| `report.py` | Markdown/JSON report builder |
| `run_real.py` | Main orchestrator: quality → reference → stress → sensitivity → consistency → register → regression → reports |
| `acquire.py` | Open-Meteo historical weather fetch + cache (CC BY 4.0) |
| `datasets.py` | Benchmark catalogue with cache fingerprinting |
| `normalize.py` | Unit normalization helpers (wind, radiation, vapour pressure) |
| `quality.py` | Dataset quality validation (no silent repair) |
| `reports/hydroma-scientific-benchmark-results.json` | Full machine-readable results |
| `reports/hydroma-scientific-benchmark-report.md` | Human-readable summary |

### Engine (`engines/hydroma/hydroma/`)
| File | Model |
|------|-------|
| `fao56_et0.py` | FAO-56 Penman-Monteith ET0 |
| `drought_wmo.py` | Gamma-fit SPI, Z-index, simplified scPDSI |
| `hargreaves_et0.py` | Hargreaves-Samani ET0 |
| `water_balance.py` | Root-zone water balance |
| `crop_etc.py` | FAO-56 single Kc crop ET (ETc = Kc × ET0) |
| `irrigation.py` | FAO-56 depletion-based irrigation scheduling |
| `normalize.py` | (Engine copy — shared units/quantity handling) |
| `evaluation.py` | Model-evaluation framework (metrics, dataset contracts) |

### Test Vectors
- `engines/hydroma/tests/vectors/fao56_et0_vectors.json` — 10 hand-derived FAO-56 reference cases with tolerances

---

## 4. Laboratory Architecture Assessment

### 4.1 Separation of Concerns
The laboratory **genuinely separates** all required stages:
- **Data acquisition** (`acquire.py`): Open-Meteo fetch with metadata, cache-only fallback
- **Data normalization** (`normalize.py`): Explicit wind km/h→m/s, 10m→2m, radiation helpers
- **Quality control** (`quality.py`): Validates daily arrays, checks finite/range/duplicate dates, no silent repair
- **Dataset management** (`datasets.py`): Catalogue with SHA-256 fingerprint of request metadata
- **Reference implementations** (`references.py`): Separate stdlib-only FAO-56/Hargreaves
- **Benchmark execution** (`benchmark.py`): Fingerprinted, timed, deterministic runner
- **Stress testing** (`stress.py`): 10 declared cases with expected behaviour
- **Sensitivity analysis** (`sensitivity.py`): OAT with relative change reporting
- **Cross-model consistency** (`consistency.py`): 3 explicit physical checks
- **Diagnostics** (`diagnostics.py`): Structured Finding/Register with categories/severities
- **Regression testing** (`regression.py`): Documented cases for confirmed findings
- **Report generation** (`report.py`, `run_real.py`): JSON + Markdown with full provenance

### 4.2 Maintainability & Reproducibility
- **Maintainable:** Each module is small (<100 lines), single-responsibility, stdlib-only.
- **Reproducible:** Cache fingerprints bind data to exact request metadata; synthetic fallback is explicit.
- **Extensible:** New stress cases, sensitivity parameters, consistency checks, or benchmarks can be added without architectural changes.
- **Isolated from production:** `sys.path` insertion in `run_real.py` imports engine but laboratory code lives entirely outside `engines/`.

### 4.3 Bias Assessment
| Bias Type | Assessment |
|-----------|------------|
| **Dependency** | None — stdlib only, no engine internals used in references |
| **Environmental** | None — deterministic, no network in core logic |
| **Numerical** | **Present:** Reference shares `normalize.py` helpers (saturation_vapour_pressure, slope_vapour_pressure_curve, extraterrestrial_radiation) with benchmark — see §5 |
| **Implementation** | **Present:** Reference uses same FAO-56 equation structure; identical coding errors could produce artificial agreement |

**Verdict:** Architecture is **sound for software verification**; numerical bias in reference comparison limits scientific validation claims.

---

## 5. FAO-56 Reference Independence Assessment

### 5.1 Claimed Results
- NSE = 1.0
- RMSE = 0.0001
- MAE = 0.0001
- Bias = -0.0
- KGE = 1.0

### 5.2 Independence Analysis

**Shared Code (Evidence):**
- `references.py:13-17` imports from `normalize`:
  ```python
  from normalize import (
      saturation_vapour_pressure,
      slope_vapour_pressure_curve,
      extraterrestrial_radiation,
  )
  ```
- `run_real.py:86-93` uses the **same** `normalize` functions to prepare inputs for *both* the engine and the reference:
  ```python
  ea = saturation_vapour_pressure(daily["temperature_2m_min"][i])
  rn = net_radiation_fao56(...)
  u2 = wind_at_2m_from_10m(wind_kmh_to_ms(...))
  t = (tmax + tmin) / 2.0
  hyd = compute_fao56_et0({"rn": round(rn,3), "t": round(t,2), "u2": round(u2,3), "ea": round(ea,4), "z": 0.0})
  ref = fao56_reference(rn, t, u2, ea, 0.0)
  ```

**Identical Computation Path:**
Both engine and reference receive **identical pre-rounded inputs** (rn, t, u2, ea) computed by shared helpers. The only difference is the Penman-Monteith arithmetic (engine: lines 186-193; reference: lines 25-33). Since inputs are identical, agreement is **mathematically guaranteed** to floating-point precision.

**Published Test Vectors?**
- `fao56_et0_vectors.json` provides 10 hand-derived cases (tolerance 0.01 ET0, 0.001 intermediates).
- The benchmark **does not use these vectors** for the NSE=1.0 claim; it uses the 365-day Tehran series with shared-input comparison.

### 5.3 Assessment

| Criterion | Verdict |
|-----------|---------|
| Genuinely independent implementation? | **NO** — shares input-preparation helpers |
| Shared functions/formulas/constants? | **YES** — `normalize.py` helpers for es, delta, Ra, Rn |
| Identical implementation errors could produce artificial agreement? | **YES** — any error in shared helpers affects both identically |
| Numerical comparison meaningful? | **NO** — it verifies arithmetic consistency, not correctness |
| Rounding/precision appropriate? | Rounding to 3-4 decimals before comparison inflates agreement |
| Valid input data? | Yes (Tehran 2023), but reanalysis not ground truth |
| Same FAO-56 formulation? | Yes, both implement Eq. 6 |
| Independent published test vectors available? | **YES** (the 10 vectors in `fao56_et0_vectors.json`) but **NOT USED** for the headline NSE/RMSE |

### 5.4 Classification
- **Reference Independence:** `NOT_CONFIRMED` (shared helpers invalidate independence)
- **NSE=1.0/RMSE=0.0001 Claim:** `NUMERICALLY_REPRODUCED` (trivial consequence of shared inputs)
- **Scientific Validation:** `NOT_CONFIRMED` — this is software arithmetic verification only

---

## 6. `neg_rad` Finding (F5) Review

### 6.1 Laboratory Claim
- **Stress case:** `{"id": "neg_rad", "input": {"rn": -5, "t": 20, "u2": 2, "ea": 1.0}, "expect": "reject"}`
- **Result:** `SCIENTIFIC_CONSTRAINT_VIOLATION` (engine returned ok=True, et0=1.0025)
- **Finding F5:** "FAO-56 returns a number for physically invalid inputs (should reject)"

### 6.2 Scientific Analysis

**FAO-56 Equation (Allen et al. 1998, Ch. 4 Eq. 6):**
```
ET0 = [0.408·Δ·(Rn - G) + γ·(900/(T+273))·u2·(es - ea)] / [Δ + γ·(1 + 0.34·u2)]
```

**Variables:**
- `Rn` = net radiation at crop surface [MJ m⁻² day⁻¹]
- `G` = soil heat flux [MJ m⁻² day⁻¹] (≈0 for daily step)
- `Δ` = slope of saturation vapour pressure curve [kPa °C⁻¹] (>0 for T > -237.3°C)
- `γ` = psychrometric constant [kPa °C⁻¹] (>0)
- `u2` = wind speed at 2m [m s⁻¹] (≥0)
- `es - ea` = vapour pressure deficit [kPa] (can be negative if ea > es)

**Physical Reality of Negative Rn:**
- `Rn = Rns - Rnl` (net shortwave - net longwave)
- `Rns = (1 - α)·Rs` (always ≥0 since Rs ≥0, α=0.23)
- `Rnl` = net longwave radiation (always ≥0, emitted by surface/atmosphere)
- **Rn CAN be negative** when longwave loss exceeds shortwave gain (clear nights, high humidity, low solar elevation). This is **physically valid** and common in arid/semi-arid climates.
- FAO-56 **does not require rejection** of negative Rn. Equation 6 handles it mathematically; negative ET0 indicates net condensation (dew/frost), a real physical process.

**Engine Behavior (fao56_et0.py:190-201):**
```python
numerator = 0.408 * delta * (rn - g) + gamma * (900.0 / (T + 273.0)) * u2 * (es - ea)
denominator = delta + gamma * (1.0 + 0.34 * u2)
et0 = numerator / denominator
...
if et0 < 0:
    warnings.append({"code": "NEGATIVE_ET0", "message": "negative ET0 indicates condensation"})
```
- Engine **correctly computes** negative ET0 when Rn is negative and vapour pressure deficit is small.
- Engine **issues a warning** (`NEGATIVE_ET0`) — this is appropriate scientific communication.
- Engine **does not reject** — this is **correct** per FAO-56.

**Stress Test Expectation is Wrong:**
- The test declares `expect: "reject"` for `rn: -5`.
- This expectation **contradicts FAO-56 physics**.
- Negative Rn is not "physically invalid" — it is a normal nocturnal condition.

### 6.3 Verdict

| Aspect | Assessment |
|--------|------------|
| Which variable is negative? | `rn` (net radiation), input directly |
| Physically invalid? | **NO** — negative net radiation is physically valid (nocturnal longwave dominance) |
| FAO-56 requires rejection? | **NO** — Eq. 6 accepts negative Rn; negative ET0 = condensation |
| Engine violates contract? | **NO** — engine correctly implements FAO-56 |
| Laboratory test expectation wrong? | **YES** — `expect: "reject"` is scientifically incorrect |
| Defect disposition | **WITHDRAWN** — Finding F5 is invalid; the engine behavior is correct |

**Classification:** `NOT_CONFIRMED` (Finding F5 withdrawn)

---

## 7. SPI/SPEI Methodology Review (F1, F2)

### 7.1 Finding F1: SPEI via Gamma Fit on Negative Water-Balance Values

**Engine Code (drought_wmo.py:136-147, 150-203):**
- `validate_spi_gamma_input` rejects any negative value in the series (line 144: `float(v) < 0` → `INVALID_PRECIP`).
- `compute_spi_gamma` fits gamma to **nonzero precipitation only** (line 160: `nonzero = [v for v in series if v > 0.0]`).
- The gamma distribution is **defined only for x > 0**. It cannot model negative values.

**SPEI Standard (Vicente-Serrano et al. 2010, WMO 2012):**
- SPEI = SPI applied to **climatic water balance (D = P - PET)**.
- D **can be negative** (when PET > P).
- The standard SPEI uses a **three-parameter log-logistic distribution** (or Pearson Type III) that handles negative values, **not the two-parameter gamma**.
- Using gamma for D with negatives is **methodologically incorrect**.

**Laboratory Finding:** Correctly identifies this as `STATISTICAL_METHOD_ERROR` (P2).

**Engine Status:** The engine **rejects negative inputs** (validation fails) rather than fitting an inappropriate distribution. This is a **safe failure mode** but limits applicability.

**Verdict:** `CONFIRMED` — `SOFTWARE_VERIFIED` (engine correctly rejects, but cannot compute SPEI for negative balances)

### 7.2 Finding F2: 1-Year Record Insufficient for SPI/SPEI Baseline

**Engine Code:** No minimum record length enforced. `compute_spi_gamma` accepts any series with `len >= 2` (line 140).

**WMO Standard (WMO-No.1090, 2012):**
- SPI requires **≥30 years** of monthly data for stable gamma parameter estimation.
- 12 months (1 year) is **grossly insufficient** — parameter estimates will be highly uncertain, zero-frequency adjustment unreliable.

**Laboratory Finding:** Correctly identifies this as `STATISTICAL_METHOD_ERROR` (P2) with evidence `{"baseline_years": 1}`.

**Verdict:** `CONFIRMED` — `SCIENTIFICALLY_SUPPORTED` (WMO guideline explicitly requires ≥30 years)

### 7.3 Additional SPI/SPEI Methodology Issues (Not in Defect Register)

| Issue | Engine Status | Assessment |
|-------|---------------|------------|
| **Seasonal standardization** | Not implemented (LIMITATIONS: "no_seasonal_grouping") | SPI should be computed per calendar month/season |
| **Accumulation scales** | Single-scale only (no 1/3/6/12/24-month SPI) | Major limitation for operational use |
| **Zero precipitation handling** | Correct (q = zero fraction, H(x) = q + (1-q)P) | `SOFTWARE_VERIFIED` |
| **Parameter estimation** | Method of moments (Thom approx.) | Standard but less robust than MLE |
| **Missing data handling** | Rejects non-finite (no gap-filling) | Safe but limits real-world use |
| **Distribution fitting diagnostics** | None (no goodness-of-fit test) | Should report fit quality |

**Recommendation:** The laboratory should add stress cases for:
- Series with negative D values (expect rejection — current behavior is correct)
- Series < 30 years (expect warning about baseline insufficiency)
- Seasonal vs. annual computation comparison

---

## 8. Wind Conversion Review (F3)

### 8.1 Laboratory Claim
- Open-Meteo provides `wind_speed_10m_max` in **km/h at 10 m**.
- FAO-56 requires **m/s at 2 m**.
- Conversion applied: `wind_kmh_to_ms` (÷3.6) → `wind_at_2m_from_10m` (log profile).

### 8.2 Code Inspection

**normalize.py:18-31:**
```python
def wind_kmh_to_ms(u_kmh: float) -> float:
    return float(u_kmh) / 3.6

def wind_at_2m_from_10m(u10_ms: float) -> float:
    if u10_ms < 0:
        raise ValueError("wind speed must be >= 0")
    factor = 4.87 / math.log(67.8 * 10.0 - 5.42)
    return u10_ms * factor
```

**FAO-56 Eq. 47 (Allen et al. 1998):**
```
u2 = u_z * (4.87 / ln(67.8·z - 5.42))
```
where z = measurement height [m]. For z=10: factor = 4.87 / ln(678 - 5.42) = 4.87 / ln(672.58) ≈ 4.87 / 6.511 ≈ **0.748**.

**Open-Meteo Documentation:**
- `wind_speed_10m_max`: "Maximum wind speed at 10 meters above ground" in **km/h** (default) or m/s (if `wind_speed_unit=ms`).
- The lab fetches default (km/h).

**Conversion Correctness:**
1. km/h → m/s: ÷3.6 ✓
2. 10m → 2m: FAO-56 log profile with roughness length for grass (z₀=0.03m, d=0) ✓
3. Factor calculation: `4.87 / math.log(67.8 * 10.0 - 5.42)` = `4.87 / math.log(672.58)` ✓

**Issue Identified:** The lab uses `wind_speed_10m_max` (daily **maximum** wind speed). FAO-56 ET0 requires **mean daily wind speed at 2m (u2)**. Using daily maximum overestimates u2 and thus ET0.

**Evidence:** Open-Meteo also offers `wind_speed_10m_mean` (mean daily wind speed). The lab should use mean, not max.

### 8.3 Verdict
- **Unit conversion (km/h → m/s):** `CONFIRMED` — `SOFTWARE_VERIFIED`
- **Height adjustment (10m → 2m):** `CONFIRMED` — `SOFTWARE_VERIFIED` (formula correct)
- **Variable semantics (max vs. mean):** `PARTIALLY_CONFIRMED` — **laboratory uses wrong variable** (max instead of mean), introducing systematic positive bias in ET0
- **Finding F3 classification:** `PARTIALLY_CONFIRMED` — the conversion logic is correct but applied to the wrong source variable

**Recommendation:** Change `acquire.py` and `quality.py` to fetch/use `wind_speed_10m_mean` instead of `wind_speed_10m_max`.

---

## 9. Sensitivity Analysis Review

### 9.1 Implementation (sensitivity.py)
- Pure OAT: varies one parameter at a time, others fixed at baseline.
- Baseline: `{"rn": 10.0, "t": 20.0, "u2": 2.0, "ea": 1.0}` → ET0 ≈ 4.44 mm/day
- Perturbations: t ±1,±2°C; u2 ±0.2,±0.4 m/s; rn ±1,±2 MJ/m²/day; ea ±0.1 kPa

### 9.2 Results Verification (from report)
| Param | Δ | Output | Rel % | Manual Check |
|-------|---|--------|-------|--------------|
| t | +2 | 4.86 | +9.53% | ✓ Plausible (Δ-es dominates) |
| t | -2 | 4.00 | -9.75% | ✓ Plausible |
| rn | +2 | 4.895 | +10.32% | ✓ Linear in numerator |
| rn | -2 | 3.979 | -10.32% | ✓ Symmetric |
| u2 | +0.4 | 4.700 | +5.92% | ✓ Sublinear |
| ea | +0.1 | 4.277 | -3.62% | ✓ Reduces VPD |

**Numerical Reproduction:** The ~9.5% response to +2°C is **correctly calculated** for the given baseline.

### 9.3 Scientific Assessment

| Criterion | Assessment |
|-----------|------------|
| Perturbation sizes appropriate? | **YES** — ±2°C, ±0.4 m/s, ±2 MJ/m²/day are within plausible daily variability |
| Physical bounds respected? | **YES** — all perturbed inputs remain physically valid (t > -237, u2 ≥ 0, rn ≥ 0, ea ≥ 0) |
| Reproducible? | **YES** — deterministic OAT, fixed baseline |
| Nonlinear behavior identified? | **PARTIAL** — asymmetric t response (+9.53% vs -9.75%) detected; u2 sublinear |
| Interaction effects? | **IGNORED** — OAT cannot detect interactions (e.g., t×u2, rn×ea) |
| Baseline dependence? | **YES** — sensitivities change with baseline (not explored) |
| Discontinuity detection? | **NO** — smooth equation, no discontinuities expected |

### 9.4 OAT Sufficiency
For FAO-56 ET0 (smooth, monotonic in each variable), OAT is **adequate for local sensitivity**. Global methods (Sobol, Morris) would be valuable for:
- Nonlinear models (crop growth, soil water)
- High-dimensional parameter spaces
- Interaction quantification

**Verdict:** `CONFIRMED` — `NUMERICALLY_REPRODUCED` for the tested model. OAT is sufficient for ET0; laboratory should document its limitation for non-additive models.

---

## 10. Cross-Model Consistency Review

### 10.1 Checks Implemented (consistency.py)

| Check | Logic | Result |
|-------|-------|--------|
| `et0_to_crop_etc` | `etc = kc * et0` with kc=0.8, et0=5.0 → 4.0 | `CONSISTENT` |
| `precip_to_mass_balance` | `storageChange = P + I - ET - R - DP` with P=10, I=0, ET=4, R=0, DP=0 → 6 | `CONSISTENT` |
| `soil_to_irrigation_monotonic` | Higher depletion → higher irrigation demand | `INCONCLUSIVE` |

### 10.2 `soil_to_irrigation_monotonic` Investigation

**Code (consistency.py:51-61):**
```python
lo = compute_irrigation_schedule({"layers": _LAYERS, "p": 0.55, "depletion_mm": 10.0})
hi = compute_irrigation_schedule({"layers": _LAYERS, "p": 0.55, "depletion_mm": 90.0})
a = lo["result"].get("irrigationRequirementMm", lo["result"].get("netIrrigationMm"))
b = hi["result"].get("irrigationRequirementMm", hi["result"].get("netIrrigationMm"))
```

**Engine Output Keys (irrigation.py:178-193):**
- `net_irrigation_mm` (not `irrigationRequirementMm` or `netIrrigationMm`)
- `gross_irrigation_mm`

**Root Cause:** **Output-schema mismatch** — consistency check looks for keys that don't exist in the engine output. The engine returns `net_irrigation_mm`.

**Additional Issue:** With `_LAYERS` (300mm, θfc=0.28, θwp=0.12):
- TAW = (0.28-0.12)×300 = 48 mm
- RAW = 0.55×48 = 26.4 mm
- For depletion=10mm (< RAW): target_depletion = RAW = 26.4 → deficit = 10-26.4 = -16.4 → net_irrigation = max(0, -16.4) = 0
- For depletion=90mm (> TAW): status = "below_wilting_point", target_depletion = RAW = 26.4 → deficit = 90-26.4 = 63.6 → net_irrigation = 63.6

**Expected:** Monotonic (0 → 63.6). **Actual:** INCONCLUSIVE due to key mismatch.

### 10.3 Verdict
- `et0_to_crop_etc`: `CONFIRMED` — `SOFTWARE_VERIFIED`
- `precip_to_mass_balance`: `CONFIRMED` — `SOFTWARE_VERIFIED`
- `soil_to_irrigation_monotonic`: `NOT_CONFIRMED` — **test implementation defect** (wrong output keys), not scientific inconsistency
- **Recommendation:** Implement explicit model-contract schemas with unit-aware cross-model diagnostics (engine already has `*_CONTRACT` objects — laboratory should use them).

---

## 11. Stress Test Review

### 11.1 Case-by-Case Assessment

| ID | Input | Expect | Result | Scientific Justification |
|----|-------|--------|--------|-------------------------|
| `high_temp` | t=60°C | valid | VALID_RESULT | Extreme but finite; FAO-56 computes (es huge) → ET0=12.1. Physically implausible but mathematically valid. |
| `low_temp` | t=-50°C | valid | VALID_RESULT | t > -237.3; FAO-56 computes ET0=-0.2 (negative = condensation). **Correct**. |
| `zero_wind` | u2=0 | valid | VALID_RESULT | Valid; reduces to radiation term only. ET0=2.78. **Correct**. |
| `high_wind` | u2=50 | valid | VALID_RESULT | u2>3 triggers HIGH_WIND warning; ET0=10.6. Accuracy decreases per FAO-56. **Correct**. |
| `zero_rad` | rn=0 | valid | VALID_RESULT | Nighttime condition; ET0=2.15 (aerodynamic term only). **Correct**. |
| `high_rad` | rn=50 | valid | VALID_RESULT | High but plausible; ET0=13.6. **Correct**. |
| `missing_ea` | ea omitted | reject | EXPECTED_REJECTION | Required field. **Correct**. |
| `nan_temp` | t=NaN | reject | EXPECTED_REJECTION | Non-finite. **Correct**. |
| `neg_rad` | rn=-5 | reject | **SCIENTIFIC_CONSTRAINT_VIOLATION** | **INCORRECT EXPECTATION** — negative Rn is physically valid (§6). |
| `inf_wind` | u2=Inf | reject | EXPECTED_REJECTION | Non-finite. **Correct**. |

### 11.2 Discriminative Power
- **Detects actual defects:** Missing fields, non-finite inputs, negative u2/ea (engine correctly rejects).
- **Fails to detect:** Negative Rn (flagged as violation but is valid), extreme but finite inputs (accepted with warnings).
- **Missing categories:**
  - `ea > es` (condensation) — engine warns but accepts ✓ (tested in vectors)
  - `t ≤ -237.3` (singularity) — engine rejects ✓ (tested in vectors)
  - `z < 0` — engine rejects ✓ (tested in vectors)
  - `rn >> rso` (radiation > clear-sky) — not tested
  - Temporal inconsistency (tmin > tmax) — not in ET0 stress (validated in quality.py)

### 11.3 Verdict
**Stress tests are well-designed but one expectation (neg_rad) is scientifically wrong.** The suite detects input validation defects effectively. Priority for expansion: add `rn > rso`, multi-variable edge cases.

---

## 12. Data Quality and Reproducibility

### 12.1 Dataset Metadata (tehran_23adf0a080946962.json)
```json
{
  "meta": {
    "source": "Open-Meteo Historical Weather API",
    "license": "CC BY 4.0",
    "location": {"latitude": 35.7, "longitude": 51.4},
    "period": {"start": "2023-01-01", "end": "2023-12-31"},
    "variables": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum", "shortwave_radiation_sum", "wind_speed_10m_max"],
    "fetched_at": "2026-11-27T18:29:35.589460+00:00",
    "fingerprint": "23adf0a080946962"
  }
}
```

### 12.2 Quality Validation (quality.py results)
- `ok=True, n=365, errors=0, warnings=0`
- All required variables present, lengths match, dates increasing, all values finite and in range.

### 12.3 Reproducibility Assessment

| Aspect | Status |
|--------|--------|
| **Cache identity** | SHA-256 of request metadata (source, lat, lon, start, end, vars, schema) — **strong** |
| **Data source provenance** | Open-Meteo URL, license, fetch timestamp recorded — **good** |
| **Unit normalization** | Explicit in `normalize.py` (km/h→m/s, 10m→2m) — **explicit** |
| **Date alignment** | Daily UTC, no gaps (quality checks) — **verified** |
| **Missing data handling** | Quality check rejects non-finite; no interpolation — **explicit** |
| **Reference period** | Single year (2023) — **insufficient for climatology** |
| **Data type distinction** | **Reanalysis** (ERA5-based) — documented in limitations, not ground truth |

### 12.4 Critical Gap
The laboratory **adequately distinguishes reanalysis from ground observations** in limitations but **uses reanalysis as benchmark input without independent validation data**. This is acceptable for software verification but not for scientific validation.

**Verdict:** `CONFIRMED` — `SOFTWARE_VERIFIED` for data pipeline reproducibility; `NOT_CONFIRMED` for scientific representativeness.

---

## 13. Defect Register Reassessment

| Finding | ID | Category | Severity | Status | Evidence | Engine Defective? | Lab Defective? | Action |
|---------|----|----------|----------|--------|----------|-------------------|----------------|--------|
| SPEI gamma on negative balance | F1 | STATISTICAL_METHOD_ERROR | P2 | **CONFIRMED** | Engine rejects negatives (safe); cannot compute SPEI for D=P-PET | NO (safe failure) | NO | Document limitation; consider log-logistic for SPEI |
| 1-year SPI/SPEI baseline | F2 | STATISTICAL_METHOD_ERROR | P2 | **CONFIRMED** | WMO requires ≥30 years; engine accepts any length | YES (no warning) | NO | Add baseline-length warning |
| Wind conversion | F3 | UNIT_ERROR | P3 | **PARTIALLY_CONFIRMED** | km/h→m/s and 10m→2m correct; but uses `wind_speed_10m_max` not `mean` | YES (systematic bias) | YES (uses max) | Switch to mean wind variable |
| Hargreaves vs FAO-56 not validation | F4 | SCIENTIFIC_VALIDATION_GAP | P3 | **CONFIRMED** | NSE=1.0 from shared helpers; agreement ≠ validation | NO | NO (correctly documented) | No code change; classification correct |
| Negative radiation rejection | F5 | INPUT_VALIDATION_FAILURE | P2 | **NOT_CONFIRMED (WITHDRAWN)** | Negative Rn is physically valid; engine correctly computes + warns | **NO** | **YES (wrong expectation)** | **Remove F5; update stress expectation to "valid"** |

---

## 14. Laboratory Capability Assessment

| Capability | Demonstrated? | Evidence |
|------------|---------------|----------|
| Unit errors | **YES** | F3 detected (wind km/h/height); quality.py validates units |
| Formula errors | **PARTIAL** | Reference cross-check catches arithmetic divergence (but shares helpers) |
| Physical constraint violations | **PARTIAL** | F5 false positive; engine warnings for ea>es, high wind, negative ET0 work |
| Numerical instability | **NO** | No stress cases for singularity (t→-237), overflow, catastrophic cancellation |
| Invalid input acceptance | **YES** | Missing fields, non-finite, negative u2/ea correctly rejected |
| Temporal alignment errors | **YES** | quality.py checks date ordering, duplicates, gaps |
| Statistical method errors | **YES** | F1, F2 correctly identified |
| Parameter sensitivity risks | **YES** | OAT sensitivity quantified for ET0 |
| Data provenance gaps | **YES** | Cache fingerprinting, fetch metadata, license recorded |
| Reproducibility failures | **NO** | Cache fingerprint + synthetic fallback ensures reproducibility |
| Cross-model inconsistencies | **PARTIAL** | 2/3 checks pass; 1 failed due to test bug (key mismatch) |
| Performance limitations | **NO** | Runtime measured but no thresholds/alerts |
| Scientific validation gaps | **YES** | F4 correctly identifies agreement ≠ validation; all models NOT_VALIDATED |

**Summary:** The laboratory **demonstrates software verification capabilities** (unit, formula, input validation, statistical method, provenance, sensitivity). It **does not yet demonstrate** numerical instability detection, performance limits, or scientific validation. Cross-model consistency has a test bug.

---

## 15. Confirmed Findings

| ID | Title | Classification | Evidence Strength |
|----|-------|----------------|-------------------|
| F1 | SPEI gamma undefined for negative water balance | `CONFIRMED` / `SOFTWARE_VERIFIED` | Engine validation rejects negatives; gamma mathematically invalid for x≤0 |
| F2 | 1-year record insufficient for SPI/SPEI | `CONFIRMED` / `SCIENTIFICALLY_SUPPORTED` | WMO-No.1090 explicitly requires ≥30 years |
| F3 | Wind conversion (unit + height) | `PARTIALLY_CONFIRMED` / `SOFTWARE_VERIFIED` | Conversion formulas correct; **source variable wrong (max vs mean)** |
| F4 | Hargreaves-FAO agreement not validation | `CONFIRMED` / `SCIENTIFICALLY_SUPPORTED` | NSE=1.0 from shared-input comparison; epistemic distinction correct |

---

## 16. Withdrawn or Downgraded Findings

| ID | Original | Revised | Reason |
|----|----------|---------|--------|
| F5 | `INPUT_VALIDATION_FAILURE` (P2) | **WITHDRAWN** | Negative net radiation is physically valid (nocturnal longwave dominance); FAO-56 Eq. 6 accepts it; engine correctly computes ET0 and warns `NEGATIVE_ET0`. Laboratory expectation `reject` is scientifically wrong. |

---

## 17. Missing Evidence

1. **Independent published FAO-56 test vectors** — Available in `fao56_et0_vectors.json` but **not used** for headline reference comparison.
2. **SPEI log-logistic implementation** — Engine only has gamma-fit SPI; true SPEI requires signed distribution.
3. **Seasonal/multi-scale SPI** — Not implemented; single-scale annual only.
4. **Numerical stability stress cases** — No tests for t→-237.3, extreme rn, overflow.
5. **Cross-model contract validation** — Engine has `*_CONTRACT` objects; laboratory doesn't use them for schema-aware checks.
6. **Ground-truth validation data** — No independent lysimeter/eddy-covariance ET0 measurements for scientific validation.
7. **Wind variable correction** — `wind_speed_10m_mean` not used; `wind_speed_10m_max` introduces bias.

---

## 18. Recommended Next Stage

### Immediate (Code Fixes)
1. **Fix F5:** Update `stress.py` line 25: `"expect": "valid"` for `neg_rad`. Remove F5 from defect register.
2. **Fix wind variable:** Update `acquire.py` `_VARS` and `quality.py` to use `wind_speed_10m_mean` instead of `wind_speed_10m_max`.
3. **Fix cross-model key mismatch:** Update `consistency.py` to use `net_irrigation_mm` (engine output key).

### Short-term (Laboratory Enhancements)
4. **Use published vectors:** Run `fao56_et0_vectors.json` through `benchmark.py` and report separate NSE/RMSE.
5. **Add numerical stability stress:** t=-237.3+ε, rn=1e6, u2=1e3, ea=100.
6. **Implement contract-aware consistency:** Use `*_CONTRACT.outputs` to resolve output keys dynamically.
7. **Add SPEI log-logistic option** or document gamma-only limitation more prominently.

### Medium-term (Scientific Rigor)
8. **Acquire independent validation data:** Lysimeter/eddy-covariance ET0 for Tehran or other benchmarks.
9. **Implement seasonal/multi-scale SPI** per WMO guide.
10. **Global sensitivity analysis** (Morris/Sobol) for non-additive models (crop, soil water).

---

## 19. Final Classification

**`INDEPENDENT_REVIEW_PARTIALLY_CONFIRMED`**

### Rationale
- **Confirmed:** Laboratory architecture is sound, separation of concerns genuine, stdlib-only, reproducible.
- **Confirmed:** F1, F2, F4 are valid findings with strong evidence.
- **Partially Confirmed:** F3 identifies real unit/height issue but misses the max-vs-mean variable error.
- **Not Confirmed (Withdrawn):** F5 is based on a scientifically incorrect expectation; the engine behavior is correct per FAO-56.
- **Not Scientific Validation:** The NSE=1.0/RMSE=0.0001 claim reflects shared-helper arithmetic consistency, not independent scientific validation. All models remain `NOT_VALIDATED` — correctly labeled by the engine.

The laboratory is a **valuable software verification tool** that can detect coding errors, document limitations, and prevent regressions. It should not be presented as a scientific validation framework. Its findings should be classified as `SOFTWARE_VERIFIED` or `NUMERICALLY_REPRODUCED`, never `SCIENTIFICALLY_VALIDATED` without independent observational evidence.

---

## 20. Reviewer Statement

This review was conducted **read-only** with no modifications to engine, laboratory, tests, data, or repository state. All assessments are based on static source inspection and scientific reasoning. The review rejects the laboratory's conclusion on F5 and the scientific interpretation of the NSE=1.0 reference comparison, while confirming the value of the laboratory's architecture and its other findings.

**Nemotron 3 Ultra**  
Independent Scientific Reviewer  
2026-11-28