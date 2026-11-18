# Scientific UI Audit

**Date:** 2026-11-17.

## Four concepts kept distinct

| Concept | Displayed as | Distinct? |
|---|---|---|
| Calibration | "تنظیم پارامترها با مشاهدات. Calibrated != Validated." | YES |
| Validation | "اعتبارسنجی مستقل در محدوده کاربرد. تعمیم به همه مناطق را اثبات نمي‌کند." | YES |
| Input Data Quality | "کیفیت داده ورودی != اعتبار مدل." | YES |
| Reproducibility | "سابقه اجرا != بازتولیدپذیری کامل." | YES |

No concept is shown as a synonym of another. The UI explicitly states Calibrated != Validated and Input Quality != Model Validity.

## Default states

- No scientific status is shown as VALIDATED by default. Metric cards show a mix: VALIDATED, CALIBRATED, UNCALIBRATED.
- **Demo data labeled:** marketplace products carry "(DEMO)" and a note that all products are demo / not real data.

## Provenance record

Fields present: model_id, model_version, code_hash, input_dataset_hash, executed_at, validation_ref, uncertainty.

Missing values are explicitly shown as **NOT_AVAILABLE / NOT_GENERATED** — **no fabricated hashes or fake execution timestamps** were added. This satisfies the "absence must be displayed explicitly" requirement.

### Gap vs the full required field list

The mission's provenance checklist includes: Model ID, Model Version, Code Version, Dataset ID, Dataset Hash, Parameter Set, Execution Timestamp, Spatial Extent, Temporal Extent, Unit System, Validation Reference, Uncertainty.

The demo record shows 7 of these (model_id, model_version, code_hash ~= Code Version, input_dataset_hash ~= Dataset Hash, executed_at ~= Execution Timestamp, validation_ref, uncertainty). **Not shown as explicit fields:** Dataset ID, Parameter Set, Spatial Extent, Temporal Extent, Unit System. These are **not fabricated** — they are simply absent from the demo record. Flagged as a completeness gap for the owner (not silently invented).

## MRV boundary

"نتایج HyDroMA مي‌توانند ورودی MRV باشند، اما VALIDATED به معنی تأیید رسمی اعتبار کربن نيست." — present and correct. VALIDATED is not misrepresented as carbon-credit certification.

## Verdict

Scientific UI **PASS** with a documented provenance-field completeness gap (missing fields shown as absent, none fabricated).