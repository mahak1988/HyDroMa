# TECHNICAL OPEN ITEMS

**Document ID:** TECHNICAL-OPEN-ITEMS
**Formalization baseline:** eco-nojin-design-system-formalization-v1
**Generated:** 2026-11-17T16:37:38Z

These are technical items inherited from the QA audit. They are **not** visual-identity decisions and do **not** get resolved by the agent. They remain open until the Owner acts or a technical owner resolves them.

---

## T-01 — Font licensing

- **Status:** OPEN — `LICENSE_FILE_MISSING`
- **Description:** 6 font families (Vazirmatn, Estedad, Fraunces, Manrope, DM Sans, IBM Plex Mono) are bundled (36 unique WOFF2, 112 faces load). Each font embeds an OFL license URL in its name table, but **no LICENSE/OFL/COPYING file exists in the repository** (0 files).
- **Impact:** The fonts are SIL OFL 1.1 (permissive), but the repo ships no license text. This is a documentation/compliance gap before external distribution.
- **Evidence:** QA `reports/font-license-audit.md`; QA `validation/test-evidence.json` (`font_license_files_in_repo: 0`). Embedded URLs: IBM Plex Mono/Fraunces/Vazirmatn → scripts.sil.org/OFL; Estedad/Manrope → openfontlicense.org; DM Sans → scripts.sil.org/OFL.
- **Required action (Owner / technical owner):** add the OFL 1.1 text and/or each font's OFL file alongside `assets/fonts/`; re-verify. Until then, **no commercial-license claim** is made.

---

## T-02 — Inter / JetBrains Mono referenced but not bundled

- **Status:** OPEN — `REFERENCED_NOT_BUNDLED`
- **Description:** `--font-en` = `'Inter', ...` and `--font-mono` = `'JetBrains Mono', ...` are referenced in `tokens.css` / `themes.css`, but neither font is present in the bundle. They render via fallback (Segoe UI / system-ui, and Consolas / monospace).
- **Impact:** Any UI that relies on Inter/JetBrains Mono renders in a fallback; visual consistency is not guaranteed. These are **not** valid "available" choices for D-06 / D-07 until resolved.
- **Evidence:** QA `reports/font-license-audit.md`; QA `reports/independent-audit.md` (referenced-but-absent finding).
- **Required action (Owner):** either (a) add Inter/JetBrains Mono files with a verified license, or (b) change the tokens to the bundled families (Manrope/DM Sans, IBM Plex Mono). Not decided by the agent.

---

## T-03 — Screen Reader

- **Status:** OPEN — `NOT_TESTED`
- **Description:** No real screen-reader test (NVDA/JAWS/VoiceOver/TalkBack) has been performed. Only a static ARIA/structure review exists.
- **Impact:** No screen-reader conformance claim can be made. ARIA code review is **not** equivalent to a screen-reader test.
- **Evidence:** QA `reports/keyboard-screenreader-test.md`; QA `validation/test-evidence.json` (`screen_reader.status: NOT_TESTED`).
- **Required action:** run a real screen-reader pass before claiming WCAG SR conformance. Static review found: landmarks, labels, tab roles present; alerts lack `role="alert"`/`aria-live` (recommended follow-up).

---

## T-04 — Scientific Provenance gaps

- **Status:** OPEN — incomplete
- **Description:** The provenance record shows 7 fields (model_id, model_version, code_hash, input_dataset_hash, executed_at, validation_ref, uncertainty). The following required fields are **absent** from the demo record (not fabricated):
  - Dataset ID
  - Parameter Set
  - Spatial Extent
  - Temporal Extent
  - Unit System
- **Impact:** The provenance record is incomplete relative to the full field list. Missing values are shown as absent/NOT_AVAILABLE — nothing is invented.
- **Evidence:** QA `reports/scientific-ui-audit.md`; QA `reports/final-qa-report.md` (provenance-field completeness gap).
- **Required action:** add the missing provenance fields (with real data) or document why they are intentionally omitted.

---

## Cross-references (for traceability)

| Item | QA evidence file | Notes |
|---|---|---|
| T-01 | reports/font-license-audit.md | 0 license files; OFL URLs embedded |
| T-02 | reports/font-license-audit.md, independent-audit.md | Inter/JetBrains absent |
| T-03 | reports/keyboard-screenreader-test.md | NOT_TESTED |
| T-04 | reports/scientific-ui-audit.md | 5 provenance fields absent |

All evidence lives in the **read-only** QA folder `D:\Nojin\brand\eco-nojin-design-system-v2-qa`.