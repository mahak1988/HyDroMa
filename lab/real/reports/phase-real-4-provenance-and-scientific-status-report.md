# Phase REAL.4 — Data Provenance, Uncertainty & Scientific Status Integrity

- **Classification:** `SCIENTIFIC_EVIDENCE_AND_STATUS_HARDENING`
- **Scope:** `lab/real/` only. Engine (`engines/hydroma/`), `services/`, `apps/`, DB,
  API and frontend **untouched**.
- **Final classification:** `REAL_4_COMPLETED`
- **Scientific status of every HyDroMA model:** `NOT_VALIDATED` (unchanged).

> This phase hardens evidence and status. It is **not** scientific validation of any
> HyDroMA model, and completion of REAL.4 must not be read as scientific success.

---

## 1. Objectives & outcome

| ID | Objective | Status |
|---|---|---|
| REAL-F05 | Data provenance & uncertainty, traceable in JSON + MD | **COMPLETED** |
| REAL-F07 | Enforce/verify `NOT_VALIDATED` across outputs | **COMPLETED** |
| SPEI consistency | Docstring/comment aligned with Z-score reality (API kept) | **COMPLETED** |
| REAL-F06 | External-review readiness package (review not claimed) | **COMPLETED — `PENDING_EXTERNAL_REVIEW`** |

## 2. Files: initial → final status

| File | Initial (pre-REAL.4) | Final (post-REAL.4) | Action |
|---|---|---|---|
| `provenance.py` | — | Source-of-truth provenance + uncertainty + status | **CREATED** |
| `run_real.py` | REAL.2 producer (no provenance/status) | Adds `data_provenance`, `scientific_status`, `status_legend`; MD sections | **MODIFIED** (additive) |
| `spi_spei.py` | Z-score labelled "…SPEI", `# normal-standardized` | Docstring states *not conventional SPEI*; comment fixed | **MODIFIED** (docs/comments only) |
| `tests/test_provenance_status.py` | — | 7 provenance/status tests | **CREATED** |
| `reports/phase-real-2-results.json` | REAL.2 output | Regenerated + `data_provenance`/`scientific_status`/`status_legend` | **MODIFIED** (regenerated, additive) |
| `reports/phase-real-2-scientific-remediation-report.md` | REAL.2 report | + Data provenance & Scientific status sections | **MODIFIED** (regenerated, additive) |
| `reports/EXTERNAL-REVIEW-PACKAGE.md` | — | Independent review package | **CREATED** |
| `reports/phase-real-4-...-report.md` | — | This report | **CREATED** |

- **Created:** `provenance.py`, `tests/test_provenance_status.py`, `reports/EXTERNAL-REVIEW-PACKAGE.md`, this report.
- **Modified:** `run_real.py`, `spi_spei.py`, `reports/phase-real-2-results.json`, `reports/phase-real-2-scientific-remediation-report.md`.
- **Deleted:** none. No historical file rewritten without preserved provenance (REAL.1 untouched; REAL.2 regenerated additively).
- **Data cache:** `lab/real/data/*.json` **not modified** by the run (cache hit; mtime unchanged).

## 3. REAL-F05 — Provenance & uncertainty (what was done)

`provenance.py` is the single source of truth; `run_real.py` merges it with the actual
cache metadata into `data_provenance` (JSON) and a Markdown section. Recorded per source:

- Provider **Open-Meteo**, product **Historical Weather API** (`archive-api.open-meteo.com/v1/archive`).
- Variables + units: `temperature_2m_max/min` (°C), `precipitation_sum` (mm),
  `shortwave_radiation_sum` (MJ·m⁻²·day⁻¹), `wind_speed_10m_mean/max` (km/h @ 10 m).
- Location (35.7, 51.4), period 2023-01-01→2023-12-31, daily, CC BY 4.0, citation.
- `fetched_at` and cache `fingerprint` from the real cache file.
- **Data type:** `reanalysis_model_based`; `is_observational_ground_truth = false`.
- **Numeric uncertainty:** `UNKNOWN` (source provides none; **not fabricated**).
- **Uncertainty taxonomy:** data / parameter / model-structure / climatic-sampling —
  all `UNKNOWN` except climatic-sampling = `HIGH` (1-year record).

Explicit statement: the Open-Meteo data is **reanalysis/model-based, not ground truth**,
and the synthetic offline fallback is labelled `synthetic_offline_fallback`.

## 4. REAL-F07 — Scientific status integrity (what was done)

- Added canonical top-level `scientific_status: NOT_VALIDATED` and a `status_legend`
  clarifying that `SOFTWARE_VERIFIED`, `NUMERICALLY_REPRODUCED`,
  `COMPUTATIONALLY_INDEPENDENT`, `STRESS_VIOLATIONS=0`, `NSE=1.0` are **not** scientific
  validation.
- `evidence.scientific_support / scientific_validation / field_validation` set to `NOT_VALIDATED`
  (origin: no independent, fit-for-use validation evidence exists — not a cosmetic change).
- Verified no output uses `VALIDATED` / `SCIENTIFICALLY_VALIDATED` / `FIELD_VALIDATED`.
- F5 retraction preserved (`retractions` contains F5; REAL.1 banner intact).

## 5. Tests & verification (real results)

- **Method:** `pytest` is **not installed** in this environment. Tests were run with an
  equivalent offline **no-pytest runner** (`python` importing each `test_*` function).
  This is stated as a limitation; **no pytest run is claimed**.
- **Result:** `TOTAL=24 PASSED=24 FAILED=0`
  - `test_remediation.py` (11), `test_benchmark.py` (6), `test_provenance_status.py` (7).
- New provenance/status tests assert: provenance present; **no fabricated uncertainty number**;
  reanalysis/synthetic **not** ground truth; `NOT_VALIDATED` persists; anomaly name kept;
  F5 retraction preserved; results JSON carries provenance + `NOT_VALIDATED`.
- `run_real.py` executed cleanly: `Data real n=365`, `Stress violations=0`, `retractions=1`,
  `NSE=1.0` (numerical agreement only).
- All `reports/*.json` parse as valid JSON.

## 6. F05 / F06 / F07 status

- **REAL-F05:** COMPLETED.
- **REAL-F06:** package ready; external review **not** performed → `PENDING_EXTERNAL_REVIEW`.
- **REAL-F07:** COMPLETED (enforced + verified; nothing upgraded).

## 7. Limitations & unresolved findings

- `pytest` unavailable → no-pytest runner used (stated).
- External/third-party review still **pending** (REAL-F06).
- Scientific independence of the reference is **unproven** (same-author reimplementation).
- 1-year record = `INSUFFICIENT_CLIMATOLOGICAL_BASELINE`; reanalysis ≠ observations.
- Numeric uncertainty **UNKNOWN** (not fabricated).
- Conventional (log-logistic) SPEI **not** implemented (out of scope).

## 8. Engine integrity confirmation

**No file under `engines/hydroma/` was created, modified, or deleted** at the source
level (`.py`/`.toml`/`.md`): verified — no engine source file has a modification time
within the run window. The only engine-directory side effect is interpreter bytecode
caches (`engines/hydroma/hydroma/__pycache__/*.pyc`, gitignored), regenerated because
the lab's FAO-56 cross-check and stress tests import engine modules by design; these are
build artifacts, not source changes. No change was made outside `lab/real/`. No Git
operation was performed. All HyDroMA models remain `NOT_VALIDATED`.

**Final classification:** `REAL_4_COMPLETED` (F05 + F07 done; F06 readiness delivered;
external review pending by design).