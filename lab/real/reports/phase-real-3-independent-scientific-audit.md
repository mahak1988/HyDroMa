# Phase REAL.3 — Independent Scientific Audit of REAL.2

- **Reviewer:** Resident agent (acting reviewer). External *Nemotron 3 Ultra* review is **NOT** independently available; a pre-existing `nemotron-independent-scientific-review.md` (from an earlier attempt, REAL.1 state) is referenced but does not cover REAL.2.
- **Scope:** `lab/real/` + read-only engine contracts. **No files modified** except this report.
- **Baseline:** HEAD `a310306`, branch `main` (unchanged). No Git/engine/data mutations performed.

## 1. Executive verdict

REAL.2's core claims are **largely supported with material findings**. Import/code independence of the reference is now real; wind handling is corrected; the F5 radiation error is withdrawn; the climatological baseline is flagged. However, three issues prevent full confirmation: (1) the "independent reference" is a same-author reimplementation, so `NSE=1.0` proves coding equivalence, **not** scientific correctness; (2) the lab's "SPEI" is a **Z-score standardization**, not conventional (log-logistic) SPEI, and is mislabeled; (3) the F5 withdrawal was **not propagated** to the earlier REAL.1 report, leaving contradictory evidence.

**Classification:** `INDEPENDENT_REVIEW_PARTIALLY_CONFIRMED`.

## 2. Source files inspected
`references.py`, `independence.py`, `spi_spei.py`, `run_real.py`, `stress.py`, `normalize.py`, `acquire.py`, `datasets.py`, `quality.py`, `tests/test_remediation.py`, `tests/test_benchmark.py`, reports (`phase-real-2-*`, `hydroma-scientific-benchmark-report.md`, `nemotron-independent-scientific-review.md`).

## 3. Reference independence (Workstream A)
- `references.py` imports **only `math`** (verified, lines 16–18); no hydroma/normalize import. `independence.py` AST audit → `COMPUTATIONALLY_INDEPENDENT`.
- **Distinction:** import independence ✔, code independence ✔ (separate pathway), **methodological/scientific independence ✘** — it is an independent *reimplementation by the same author*, not a third-party or authoritative published vector.
- `NSE=1.0, RMSE=0.0001` demonstrates the two code paths implement the **same equations identically** (arithmetic equivalence). It does **not** demonstrate either is scientifically correct, nor validate HyDroMA. The REAL.2 report states this correctly.
- **Finding:** `COMPUTATIONALLY_INDEPENDENT` is justified; any claim of scientific/reference independence is **NOT_CONFIRMED**.

## 4. SPI (Workstream B)
- Gamma fit to positive precipitation with zero-frequency `q` (lines ~80–96); zero mass handled via `q`. This is a reasonable Thom-style SPI.
- **Limitations (not defects):** no seasonal grouping; 1-year baseline; single accumulation period. Baseline correctly flagged `INSUFFICIENT_CLIMATOLOGICAL_BASELINE`.
- **Verdict:** `PARTIALLY_CONFIRMED` (method reasonable, climatology insufficient, correctly labeled).

## 5. SPEI (Workstream C) — high priority
- `spei()` computes `Z = (X - mean)/std` (line 110) — a **normal-standardized water-balance anomaly**, defined for negatives (fixes the gamma-domain problem).
- **This is NOT conventional SPEI** (which uses a log-logistic probability distribution + probability-weighted moments). Labeling it "SPEI" **misrepresents** it.
- **Finding (CONFIRMED):** must be renamed (e.g. `standardized_water_balance_anomaly`) or explicitly qualified as exploratory; conventional log-logistic SPEI is not implemented. No engine change; lab documentation change only (not performed — read-only).

## 6. Baseline (Workstream D)
- 30-year threshold enforced via `_baseline`; 1-year → `INSUFFICIENT_CLIMATOLOGICAL_BASELINE` (lines ~86–92). WMO-No.1090 is SPI-specific; applying the same 30y to SPEI is reasonable but should be cited per-index. **CONFIRMED with minor caveat.**

## 7. Wind (Workstream E)
- `acquire.py` requests `wind_speed_10m_mean` (+max); `run_real._prepare` applies `wind_at_2m_from_10m(wind_kmh_to_ms(...))` **exactly once** (line 80). Units (km/h) and height (10 m) recorded in cache meta. **CONFIRMED remediated.** (Open-Meteo archive wind default is km/h; mean values ~8 plausible.)

## 6/8. Radiation (Workstream F)
- `stress.py` `neg_rad` now `expect:"valid"`; `run_real` retractions record F5 withdrawal; phase-real-2 report shows `neg_rad: VALID_RESULT`.
- **Inconsistency (PARTIALLY_CONFIRMED):** the earlier `hydroma-scientific-benchmark-report.md` still shows `neg_rad -> SCIENTIFIC_CONSTRAINT_VIOLATION` and `F5 (P2)`. Withdrawal not propagated → contradictory evidence across reports.

## 9. Data provenance (Workstream G)
- Open-Meteo (CC BY 4.0), coords/period/variables/fingerprint cached; quality validated; labeled reanalysis/model-derived (not ground truth). **CONFIRMED.**

## 10. Test quality (Workstream H)
- 18 tests, deterministic/offline. Strong: independence AST, SPEI sign, neg_rad valid, baseline. Weak: `test_reference_version` (string prefix), SPEI test checks sign only (could pass despite wrong distribution), no test that the reference is *scientifically* independent. **PARTIALLY_CONFIRMED.**

## 11. Defect register
| ID | Category | Sev | Status | Note |
|----|----------|-----|--------|------|
| F1 | Engine SPEI gamma domain | P2 | **CONFIRMED** | engine `compute_spi_gamma` undefined/raises on negative balance |
| F2 | Insufficient baseline (1y) | P2 | **CONFIRMED** | correctly flagged |
| F3 | Wind unit/variable | P3 | **CONFIRMED (remediated)** | mean + conversion applied |
| F4 | Validation evidence gap | P3 | **CONFIRMED** | agreement ≠ validation |
| F5 | neg_rad rejection | — | **WITHDRAWN** | lab error; Rn negative valid; not propagated to REAL.1 report |

## 12. Evidence classification
- Reference: `COMPUTATIONALLY_INDEPENDENT` (import+code); **not** scientifically independent.
- Results: `SOFTWARE_VERIFIED`, `NUMERICALLY_REPRODUCED`.
- `SCIENTIFICALLY_SUPPORTED` / `SCIENTIFICALLY_VALIDATED` / `FIELD_VALIDATED`: **NOT_ESTABLISHED** for every HyDroMA model.

## 13. Confirmed vs unconfirmed
- Confirmed: independence (import/code), wind fix, baseline flag, F1–F4, F5 withdrawal (in REAL.2).
- Unconfirmed/partial: scientific independence of reference; SPEI as conventional SPEI; F5 propagation to REAL.1; test strength.

## 14. Limitations
Same-author reference; reanalysis ≠ observations; 1-year record; SPEI is Z-score; contradictory REAL.1 report.

## 15. Engine remediation candidates (documented, NOT executed)
- F1: engine SPEI should use a signed distribution (log-logistic/normal) for negative water balance. **Demonstrably present** (`drought_wmo.compute_spi_gamma`). No change made.

## 16. Recommended next steps
Rename/clarify SPEI; propagate F5 withdrawal to REAL.1 report or mark it superseded; add a third-party/authoritative FAO-56 vector; strengthen SPEI tests (distribution correctness); obtain true external Nemotron review.

## 17. Scientific validation status
**No HyDroMA model is scientifically validated.** This audit is a read-only computational/methodological review; it does not constitute scientific or field validation.

**Final classification:** `INDEPENDENT_REVIEW_PARTIALLY_CONFIRMED`.

## 18. Post-audit resolution (REAL.2 follow-up)
The three open items above have been addressed in the lab (read-only w.r.t. the engine; all models remain `NOT_VALIDATED`):
- **F5 propagation (REAL-F03):** `hydroma-scientific-benchmark-report.md` and `hydroma-scientific-benchmark-results.json` now carry an explicit `SUPERSEDED`/retraction banner and a `retractions` record; original content preserved for history. Contradiction closed.
- **SPEI mislabel (REAL-F01):** `spi_spei.py` now labels the output `standardized climatic water-balance anomaly (Z-score; NOT conventional SPEI)`; `run_real.py` reports it under `standardized_water_balance_anomaly`. Conventional (log-logistic) SPEI is still NOT implemented.
- **Test strength (REAL-F04):** added SPI zero-frequency, SPEI Z-score numeric-vector, and authoritative FAO-56 vector tests in `tests/test_remediation.py`.
Still open: genuine third-party review (REAL-F06) and scientific/field validation of any model.