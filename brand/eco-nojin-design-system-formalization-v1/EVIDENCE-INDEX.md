# EVIDENCE INDEX

**Document ID:** EVIDENCE-INDEX
**Formalization baseline:** eco-nojin-design-system-formalization-v1
**Generated:** 2026-11-17T16:37:38Z

All evidence below is in the **read-only** reference folders. This index maps each decision / technical status to the exact evidence used. Nothing here is fabricated; every status is traceable to a QA report or a measured artifact.

---

## 1. Reference folders (read-only, unchanged)

| Path | Role | Files (baseline) |
|---|---|---|
| `D:\Nojin\brand\eco-nojin-design-system-v2` | Original Design System (v2) | 59 |
| `D:\Nojin\brand\eco-nojin-design-system-v2-qa` | Independent QA copy (approved corrections) | 136 (excl. node_modules, _backup, _dev) |
| `D:\Nojin\brand\eco-nojin-owner-review-v1` | Owner Visual Decision Studio | 68 |
| `D:\Nojin\brand\eco-nojin-design-system-formalization-v1` | This formalization output | 6 (this set) |

Reference folder integrity was verified by baseline hashing before writing outputs (see `FINAL-STATUS.md` §Integrity).

---

## 2. QA reports used as evidence

All under `eco-nojin-design-system-v2-qa\reports\`:

| Report | Used for |
|---|---|
| `independent-audit.md` | File counts, structure, external deps |
| `logo-audit.md` | 9 logos, typographic-only, font dependence, outlined feasibility |
| `font-license-audit.md` | 6 families, 36 files, Inter/JetBrains absent, 0 license files |
| `responsive-test.md` | 0 overflow 320–1920px, both locales |
| `accessibility-test.md` | 400 contrast samples, 104→2 fails, palette chip note |
| `keyboard-screenreader-test.md` | Keyboard PASS, Screen Reader NOT_TESTED, static ARIA |
| `scientific-ui-audit.md` | 4 distinct concepts, DEMO labels, provenance gaps |
| `final-qa-report.md` | QA_ACCEPTED_WITH_CORRECTIONS, DRAFT status, summary table |

Machine-readable evidence: `eco-nojin-design-system-v2-qa\validation\test-evidence.json` (plus `audit-raw.json`, `deep-audit.json`, `contrast-results.json`).

---

## 3. Decision → evidence map

| Decision | Status | Evidence |
|---|---|---|
| D-01 Eco Nojin logo | OPEN | QA logo-audit.md (9 wordmarks, options 01–03); Owner Studio logo gallery |
| D-02 HyDroMA logo | OPEN | QA logo-audit.md; Owner Studio |
| D-03 Marketplace logo | OPEN | QA logo-audit.md; Owner Studio |
| D-04 Color path | OPEN | QA accessibility-test.md (both themes measured); themes.css in QA |
| D-05 Persian font | OPEN | QA font-license-audit.md (Vazirmatn, Estedad bundled) |
| D-06 Latin font | OPEN | QA font-license-audit.md (Manrope, DM Sans bundled; Inter NOT bundled) |
| D-07 Data/code font | OPEN | QA font-license-audit.md (IBM Plex Mono bundled; JetBrains NOT bundled) |
| D-08 Brand family | OPEN | Owner Studio "Brand Family"; QA brand section; blocked by D-01..D-07 |

---

## 4. Technical status → evidence map

| Item | Status | Evidence |
|---|---|---|
| Font license | LICENSE_FILE_MISSING | QA font-license-audit.md; test-evidence.json (`font_license_files_in_repo: 0`) |
| Inter / JetBrains Mono | REFERENCED_NOT_BUNDLED | QA font-license-audit.md; independent-audit.md |
| Screen reader | NOT_TESTED | QA keyboard-screenreader-test.md; test-evidence.json |
| Contrast | 104→2 (palette chip) | QA accessibility-test.md; deep-audit.json |
| Responsive | 0 overflow 320–1920 | QA responsive-test.md |
| Scientific provenance | 5 fields absent | QA scientific-ui-audit.md |

---

## 5. Owner Visual Decision Studio (decision aid)

`eco-nojin-owner-review-v1\index.html` — presents all 9 logos (8 real-context mockups each), both color paths, 6 fonts, real UI preview with A/B toggle, and the D-01..D-08 register (localStorage only). Used by the Owner to make decisions; **not** an authority that selects anything.

---

## 6. Verification method note

- File counts and hashes were recomputed directly from the filesystem (not copied from prior reports).
- Contrast values are from live-DOM measurement in Chromium (QA `deep-audit.js` → `deep-audit.json`), not guessed.
- Font loading was verified by forcing all 112 faces to load (0 errors).
- Logo font-dependence was measured by blocking webfonts (up to 16.5% reflow).