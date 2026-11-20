# ADR-0003 — Adopt Visual Identity v1.1 (Royal Aubergine) as the single token source

**Date:** 2026-11-20 · **Status:** accepted (owner-supplied specification)
**Supersedes:** the candidate "Territory Teal" palette in `brand.css` and the green-led product palette.

## Context

Two palettes were in circulation: the product tokens (`--green-700 #0f6b4f` as primary) and a
candidate brand palette (`#0B5563` teal) that no app used. The owner supplied the Visual Identity,
Experience & Design System v1.1, which fixes the identity: Royal Aubergine as the brand colour,
Burnt Terracotta as the warm accent, Antique Champagne as the premium detail, and warm neutral
surfaces. Green is explicitly demoted to a semantic/scientific colour.

## Decision

1. **One source of truth:** `packages/design-system/src/tokens.css`. Every app imports it; no
   component may hard-code a colour.
2. **Palette:** `#5A3D50` primary, `#9C4F3B` accent, `#8A6937` gold, `#2D2523` text,
   `#F7F2E9` canvas, `#FFFCF7` surface, `#665B55` secondary text, `#465365` scientific slate,
   `#87575B` cultural rose. Functional colours are independent of the brand hue.
3. **Service accents** (`--service-*`) identify a service without painting it.
4. **Light is the default; dark is tuned separately** (`#211D22` canvas, `#C59AAE` primary), never
   derived by inversion.
5. **Typography:** Manrope for Latin text, Vazirmatn for Persian/Arabic, Lora for public display
   headings, Nunito Sans for commerce surfaces, Source Serif 4 for reports. Sizes follow the
   specification's scale (12 → 64, hero clamp 52–64).
6. **Contrast is a test, not a promise:** `packages/design-system/tests/contrast.test.ts` parses the
   same tokens file and asserts WCAG 2.2 AA for both themes.

## Consequences

- Every app changed appearance at once, including the screenshots used for review.
- `brand.css` (the old A/B candidate system) is marked LEGACY and no longer imported; the brand app
  now reads the live tokens and compares light/dark instead of A/B.
- The design-system package gains its first test (contrast), so the token file can no longer drift
  silently below AA.
- Focus rings are 2px `--primary` with offset, ≥ 3:1 on both themes.

## Deviations (declared)

- **Persian display fonts (فرهنگ / شبنم) are not available as OFL packages.** Vazirmatn covers both
  roles; this is a visible deviation from the specification and must be revisited if licensed
  webfonts are supplied.
- **3D stacks (CesiumJS / Three.js) are not introduced.** The specification requires scientific 3D
  to be backed by validated data and measured performance; today there is no validated dataset, so
  the 2D map (MapLibre + deck.gl) remains the only spatial surface.
- **Service symbols** are not drawn yet; the icon package still carries the 30 domain glyphs.