# DESIGN SYSTEM BASELINE

**Document ID:** DESIGN-SYSTEM-BASELINE
**Formalization baseline:** eco-nojin-design-system-formalization-v1
**Baseline generated:** 2026-11-17T16:37:38Z
**Status:** **DRAFT — NOT APPROVED**

> Because all eight Owner decisions (D-01..D-08) are currently **OPEN**, this baseline is explicitly a **DRAFT**. No color path, logo, or font is recorded here as chosen. This file documents the *current technical state* and the *decision slots*, not a finalized identity.

---

## 1. Brand family architecture

The ecosystem has three brands. This structure is the reference architecture; its formal approval is D-08 (currently OPEN).

| Brand | Role | Visual personality | Independent logo options |
|---|---|---|---|
| **Eco Nojin** | Mother brand | Scientific, international, territorial, economic | 3 (option 01/02/03) |
| **HyDroMA** | Scientific engine | Specialized, technological, computational | 3 (option 01/02/03) |
| **Nojin Marketplace** | Marketplace | Commercial, human, livelihood-oriented | 3 (option 01/02/03) |

- All three logo sets are pure typographic wordmarks (no pictorial symbol, no `<path>`).
- Shared family traits: bold weights, negative tracking on the wordmark, English + sometimes Persian taglines, shared gold/territorial palette accents.
- Distinct traits per brand documented in the Owner Visual Decision Studio (section "Brand Family").

---

## 2. Color path (Owner decision D-04 — currently OPEN)

**No color path is recorded as chosen.** Both independent paths exist and are fully implemented in QA; the Owner must choose one (or keep OPEN).

| Path | Name | Primary | Status |
|---|---|---|---|
| A | Territory Teal / Scientific | `#0B5563` | AVAILABLE — not chosen |
| B | Warm / Royal Deep Blue | `#173B63` | AVAILABLE — not chosen |

- Reference palette values are **unchanged**.
- Contrast-safe variants (e.g. `--brand-secondary-text`) are **derived tokens only**, used for text/buttons; they are distinguishable from the reference palette and do not replace it.
- QA measured contrast on both paths (see §7). Choosing a path does **not** replace WCAG/accessibility approval (D-04 rule 7).

---

## 3. Logos (Owner decisions D-01, D-02, D-03 — all currently OPEN)

**No logo is recorded as chosen.**

| Brand | Decision | Options |
|---|---|---|
| Eco Nojin | D-01 — OPEN | 01 Fraunces Editorial / 02 Manrope Modern / 03 Fraunces Stacked |
| HyDroMA | D-02 — OPEN | 01 Manrope Tight / 02 DM Sans Clean / 03 Manrope Weight Contrast |
| Marketplace | D-03 — OPEN | 01 DM Sans Mixed / 02 Manrope Friendly / 03 Fraunces Mixed |

- Original SVGs are unchanged; outlined (path) test copies exist only in the QA `logo-tests/` folder for feasibility review, not for selection.

---

## 4. Fonts (Owner decisions D-05, D-06, D-07 — all currently OPEN)

**No font is recorded as chosen.**

| Role | Decision | Bundled available choices | Referenced-but-not-bundled |
|---|---|---|---|
| Persian / Arabic | D-05 — OPEN | Vazirmatn, Estedad | — |
| Latin | D-06 — OPEN | Manrope, DM Sans | **Inter** (`REFERENCED_NOT_BUNDLED`) |
| Data & code | D-07 — OPEN | IBM Plex Mono | **JetBrains Mono** (`REFERENCED_NOT_BUNDLED`) |

- 6 families, 36 unique WOFF2 files, 112 font faces load without error (QA-verified).
- All six families are variable/static OFL fonts; the license **text file is missing from the repo** (`LICENSE_FILE_MISSING`, see T-01).
- Inter and JetBrains Mono are referenced in CSS (`--font-en`, `--font-mono`) but are **not bundled**; they are shown as `REFERENCED_NOT_BUNDLED` and are not valid "available" choices until the Owner decides (see T-02).

---

## 5. RTL / LTR status

- Direction switching works: fa (rtl), ar (rtl), en (ltr) — `html[dir]` + `lang` update correctly.
- Uses CSS Logical Properties (margin-inline, padding-inline, inset-inline) throughout.
- 0 horizontal overflow at 320–1920px in all three locales (QA-verified).
- Only 3 locales are implemented; a full 15-language claim is **not** made.

---

## 6. Typography principles

- Persian body/UI: Vazirmatn (bundled). Display serif option: Fraunces.
- Latin UI/heading: Manrope or DM Sans (bundled). Display serif: Fraunces.
- Data/mono: IBM Plex Mono (bundled).
- Scale: display 2.5rem / h1 2rem / h2 1.5rem / h3 1.25rem / body 1rem (1.65) / small 0.875rem / caption 0.75rem.
- Weights: bold-heavy for headings; variable fonts instanced per weight (no faux-bold).

---

## 7. Accessibility principles & QA status

- **Contrast:** QA measured 400 samples across both themes and all sections. After corrections: 104 → **2** fails. The 2 residual are the **reference danger-red palette chip** (`#D64545`, 4.38:1) — a palette reference swatch, not UI; palette value intentionally unchanged. Evidence: QA `reports/accessibility-test.md`.
- **Keyboard:** PASS (logical order, visible focus, skip link, no trap, arrow-key tabs, 0 unlabeled inputs). Evidence: QA `reports/keyboard-screenreader-test.md`.
- **Screen Reader:** **NOT_TESTED** (no SR tool available). Static ARIA review only; **not** equivalent to a screen-reader test. No full WCAG conformance claim is made. Evidence: QA `reports/keyboard-screenreader-test.md`.
- **Scientific UI:** 4 concepts kept distinct (Calibration, Validation, Input Quality, Reproducibility); no default VALIDATED; DEMO data labeled; provenance absence explicit. Evidence: QA `reports/scientific-ui-audit.md`.

---

## 8. QA status (inherited)

- QA overall: **QA_ACCEPTED_WITH_CORRECTIONS** (technical build sound after fixes; **not** visual-identity approval, **not** production approval).
- File integrity: 59 files in design-system-v2, 36 unique woff2, 9 SVG, 0 external deps.
- Functional tests: 0 console errors, 0 page errors, 0 failed requests.

---

## 9. Constraints & unresolved items

- **DRAFT — NOT APPROVED** until the Owner decides D-01..D-08.
- **D-08 (brand family approval)** is blocked by D-01..D-07 (all OPEN).
- Open technical items that affect finalization: **T-01** font license files missing; **T-02** Inter/JetBrains Mono not bundled; **T-03** Screen Reader not tested; **T-04** provenance fields incomplete (Dataset ID, Parameter Set, Spatial/Temporal Extent, Unit System). Details in `TECHNICAL-OPEN-ITEMS.md`.
- Reference folders (design-system-v2, -qa, owner-review-v1) are **read-only** and unchanged.

---

## 10. Finalization gate

This baseline becomes a formal Design System baseline only after:
1. Owner decides D-01..D-07, then D-08.
2. T-01..T-04 are resolved or explicitly accepted as open.
3. Owner gives final approval.

Until then, the status remains **DRAFT — NOT APPROVED**.