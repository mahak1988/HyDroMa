# HyDroMA Lab — External Review Package (REAL.1 → REAL.4)

- **Status:** `PENDING_EXTERNAL_REVIEW`
- **Prepared by:** Eco Nojin resident agent (lab author). **NOT** a third-party review.
- **Repository scope:** `lab/real/` only. Engine (`engines/hydroma/`) unchanged.
- **Purpose:** give an independent reviewer everything needed to verify the lab's
  claims and, crucially, to confirm what the lab does **not** claim.

> The lab is a *software verification / numerical-reproducibility* harness. It is
> **not** a scientific-validation framework. Every HyDroMA model remains
> `NOT_VALIDATED`.

---

## 1. Reports to review (REAL.1 → REAL.4)

| Phase | File | Role |
|---|---|---|
| REAL.1 | `hydroma-scientific-benchmark-report.md` / `-results.json` | Original benchmark (F5 later **withdrawn**; see banner) |
| REAL.1 (ext.) | `nemotron-independent-scientific-review.md` | External review of REAL.1 (withdrew F5) |
| REAL.2 | `phase-real-2-scientific-remediation-report.md` / `-results.json` | Remediation + retractions + provenance + status |
| REAL.3 | `phase-real-3-independent-scientific-audit.md` | Resident self-audit (not third-party) |
| REAL.4 | `phase-real-4-provenance-and-scientific-status-report.md` | Provenance, uncertainty, status integrity |
| REAL.4 | `EXTERNAL-REVIEW-PACKAGE.md` | This package |

## 2. Corrections & retractions

- **F5 (neg_rad) — WITHDRAWN:** negative net radiation (Rn) is physically valid
  (nocturnal longwave dominance; FAO-56 Eq. 6 accepts it). REAL.1 artifacts carry a
  `SUPERSEDED` banner + `retractions` record; `stress.py` expects `valid`.
- **SPEI mislabel — CORRECTED:** the lab's index is a Z-score standardized
  water-balance anomaly, **not** conventional (log-logistic) SPEI. Renamed in code,
  comments, and reports; function name `spei` kept only for API back-compat.
- **F1–F4 — CONFIRMED** (engine SPEI gamma domain; 1-year baseline; wind unit/variable;
  agreement ≠ validation). Documented, not fixed in the engine (out of scope).

## 3. Computational methods & scientific references

- **FAO-56 Penman-Monteith ET0** — Allen et al. 1998, Irrigation & Drainage Paper 56.
- **Hargreaves–Samani (1985)** ET0.
- **SPI** — gamma fit with Thom (1966) zero-frequency correction; WMO-No.1090 (≥30-yr baseline).
- **Standardized water-balance anomaly** — Z-score `(X-mean)/std`; **not** SPEI.
- **Wind** — km/h → m/s, 10 m → 2 m (FAO-56 log law, z0=0.03 m).
- Independent reference: `references.py` (imports only `math`; `COMPUTATIONALLY_INDEPENDENT`).

## 4. Data used & limitations

- **Source:** Open-Meteo Historical Weather API (`archive-api.open-meteo.com/v1/archive`),
  **CC BY 4.0**.
- **Location / period:** Tehran (35.7, 51.4), 2023-01-01 → 2023-12-31 (365 days).
- **Data type:** **reanalysis / model-based** (ERA5-based). **NOT** observational ground truth.
- **Numeric uncertainty:** **UNKNOWN** (not provided by source; not fabricated).
- **Key limitation:** 1-year record = `INSUFFICIENT_CLIMATOLOGICAL_BASELINE`.
- Full machine-readable provenance: `phase-real-2-results.json` → `data_provenance`.

## 5. Numerical tests & reference vectors

- Authoritative FAO-56 vectors: `engines/hydroma/tests/vectors/fao56_et0_vectors.json`
  (hand-derived, tolerance 0.01 ET0), exercised by `tests/test_remediation.py`.
- Test suite (offline, deterministic): `tests/test_remediation.py`,
  `tests/test_benchmark.py`, `tests/test_provenance_status.py` (24 tests).
- Note: `pytest` is not installed in this environment; tests were run with an
  equivalent no-pytest runner. This is a stated limitation, not a pytest claim.

## 6. Open questions for the reviewer

1. Is the FAO-56 reference truly independent, or only same-author reimplementation?
2. Is the Z-score anomaly acceptable as an *exploratory* index (clearly not SPEI)?
3. Are the FAO-56 vectors authoritative enough for a numerical (not scientific) check?
4. Does the 1-year baseline limitation invalidate any conclusion drawn here?

## 7. Claims that REQUIRE independent verification (do not take on trust)

- `NSE = 1.0` / `RMSE ≈ 0.0001` → **numerical code agreement only**, not predictive skill.
- `COMPUTATIONALLY_INDEPENDENT` → **not** third-party/scientific independence.
- `STRESS_VIOLATIONS = 0` → **not** model correctness.
- Any model behaviour on real operational data → **unverified**.

## 8. What the reviewer must NOT conclude

- That any HyDroMA model is `VALIDATED` / `SCIENTIFICALLY_VALIDATED` / `FIELD_VALIDATED`.
- That Open-Meteo reanalysis is ground truth.
- That this package constitutes a third-party review (it is `PENDING_EXTERNAL_REVIEW`).