# Logo Audit — 9 SVG Wordmarks

**Date:** 2026-11-17. **No logo selected. DRAFT — NOT APPROVED.**

## Per-file findings

| File | Brand | Structure | Symbol? | Font-dependent? | Font(s) | Small-size (32px) | Light bg | Dark bg | Technical |
|---|---|---|---|---|---|---|---|---|---|
| eco-nojin-option-01.svg | Eco Nojin | Text | No | Yes | Fraunces 600/500 + Manrope 600 | legible (ink 0.023) | PASS (#FBF7F0) | not designed | PASS |
| eco-nojin-option-02.svg | Eco Nojin | Text + accent bar | No | Yes | Manrope 800/600 | legible (0.062) | PASS (#FFFDFC) | not designed | PASS |
| eco-nojin-option-03.svg | Eco Nojin | Text (stacked) | No | Yes | Fraunces 600/500 + Manrope 600 | light (0.010) | PASS | not designed | PASS |
| hydroma-option-01.svg | HyDroMA | Text | No | Yes | Manrope 750 + IBM Plex Mono 600 | legible (0.045) | PASS (#F3F8F7) | not designed | PASS |
| hydroma-option-02.svg | HyDroMA | Text + underline | No | Yes | DM Sans 700 + IBM Plex Mono 500 | legible (0.066) | PASS (#FFFDFC) | not designed | PASS |
| hydroma-option-03.svg | HyDroMA | Text (weight contrast) | No | Yes | Manrope 800/400 + IBM Plex Mono 600 | legible (0.063) | PASS | not designed | PASS |
| marketplace-option-01.svg | Marketplace | Text | No | Yes | DM Sans 750/500 | light (0.011) | PASS (#FFF8F2) | not designed | PASS |
| marketplace-option-02.svg | Marketplace | Text + accent bar | No | Yes | Manrope 800/600 | legible (0.079) | PASS (#FFFDFC) | not designed | PASS |
| marketplace-option-03.svg | Marketplace | Text (mixed) | No | Yes | Fraunces 600 + DM Sans 500 + Manrope 600 | light (0.010) | PASS (#FFF8F2) | not designed | PASS |

## Key findings

1. **All 9 are pure typographic wordmarks** — every file is composed of <text> elements. **None contains a <path>**, and **none contains an independent symbol / <image> / <use>**. This matches the owner's preference (typographic, no pictorial symbol).
2. **All 9 are font-dependent.** Proof: blocking the webfonts changes logo text widths by up to **16.5%** (e.g. marketplace-option-03 "Nojin" -16.5%, marketplace-option-02 "Nojin Marketplace" -11.5%, eco-nojin-option-01 "Eco" -15.8%). If the fonts are not installed/loaded, the logos reflow and misalign.
3. **Dark-context usage:** each SVG paints a light <rect> background, so on a dark surface the logo shows a light box — not a transparent/knockout version. Dark-background variants do not exist.
4. **Small-size legibility:** all render at 32px height. The serif "stacked"/"mixed" options (eco-03, marketplace-01/03) are visually lightest (ink ratio ~0.010) — thin strokes may weaken at very small sizes.

## Text to Path conversion (feasibility proof, QA only)

- Tool: fontTools (instancer + SVGPathPen). Originals untouched; test outputs in logo-tests/:
  - *.outlined.svg — text converted to vector paths
  - *.compare.png — side-by-side original vs outlined
- **Feasibility: CONFIRMED.** Outline text widths match browser rendering to **±1px** for Fraunces, Manrope, DM Sans, IBM Plex Mono after instancing wght and opsz=font-size. Ink-coverage delta vs original is ≤0.03 (most ≤0.01), i.e. visually equivalent.
- Font-dependency report and dimension/weight comparison: this file + validation/verify_widths.py output.

## Recommendation (not a decision)

- Owner must choose one option per brand. This audit does not select.
- If a font-independent asset is required, the outlined versions demonstrate it is achievable without changing the reference letterforms.