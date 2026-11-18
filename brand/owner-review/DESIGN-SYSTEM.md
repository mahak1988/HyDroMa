# ECO NOJIN — DESIGN SYSTEM
## Shared Design System for Eco Nojin, HyDroMA, and Nojin Marketplace

**Document ID:** ECO-NOJIN-DESIGN-SYSTEM
**Version:** 1.0 (DRAFT — NOT APPROVED)
**Date:** 2026-11-17
**Status:** DRAFT design system. Not final. Owner decision required.

---

## 1. PRINCIPLES

1. **One system, many surfaces** — all products share tokens; each keeps its own density/voice.
2. **RTL/LTR first-class** — every component is direction-agnostic.
3. **Accessible** — WCAG 2.2 AA target; colorblind-safe.
4. **Data-honest** — scientific visualizations always show validation state + provenance.
5. **Locale-aware** — numbers, dates, currency via locale.

---

## 2. DESIGN TOKENS

See `BRAND-TOKENS.json` for machine-readable tokens.

### 2.1 Color (summary)
| Role | Token | Hex |
|---|---|---|
| Primary | brand.primary | `#0B5563` |
| Secondary | brand.secondary | `#C9A227` |
| Accent | brand.accent | `#35C4D7` |
| HyDroMA | product.hydroma | `#2E3A87` |
| Marketplace | product.marketplace | `#E76F51` |
| Ink | neutral.ink | `#0F1E24` |
| Slate | neutral.slate | `#5A6B72` |
| Line | neutral.line | `#D5DDE0` |
| Cloud | neutral.cloud | `#F5F7F8` |
| Success | semantic.success | `#2E9E5B` |
| Warning | semantic.warning | `#D98A1F` |
| Danger | semantic.danger | `#D64545` |
| Info | semantic.info | `#2E6FD6` |

### 2.2 Typography
- **Fa:** Vazirmatn (OFL) · **En:** Inter (OFL) · **Mono:** JetBrains Mono (OFL).
- Scale: display 2.5/1.15/800 · h1 2/1.25/700 · h2 1.5/1.3/700 · h3 1.25/1.35/600 · body 1/1.65/400 · small .875/1.5/400 · caption .75/1.4/500.

### 2.3 Spacing
- 4px base unit: 0, 4, 8, 12, 16, 24, 32, 48, 64, 96.

### 2.4 Radius
- sm 4 · md 8 · lg 12 · xl 20 · pill 9999.

### 2.5 Shadow
- sm `0 1px 2px rgba(15,30,36,.06)` · md `0 4px 12px rgba(15,30,36,.10)` · lg `0 12px 32px rgba(15,30,36,.14)`.

### 2.6 Breakpoints
- mobile 480 · tablet 768 · desktop 1024 · wide 1440.

### 2.7 Grid
- 12 columns, 16px gutter, 1280px container.

---

## 3. COMPONENTS

### 3.1 Buttons
| Variant | Use | Style |
|---|---|---|
| Primary | Main action | bg `brand.primary`, white text |
| Secondary | Secondary action | bg white, border `brand.primary`, teal text |
| Ghost | Low emphasis | transparent, slate text |
| Danger | Destructive | bg `semantic.danger` |
| Sizes | sm/md/lg | 32/40/48px height |
- **RTL:** icon on the right in RTL (logical properties).

### 3.2 Forms
- Label above, help text below, error in `semantic.danger`.
- Inputs: 40px height, `neutral.line` border, focus ring `brand.accent`.
- Required indicator: `*` in `semantic.danger`.

### 3.3 Cards
- bg white, radius md, shadow sm, padding 16-24.
- Variants: default, scientific (with validation badge), commerce (with price).

### 3.4 Navigation
- **Top bar:** logo, global nav, user menu, locale switch.
- **Side nav:** section groups (from Sitemap 17 groups).
- **Tabs:** for within-page sections.
- **Breadcrumbs:** for deep pages.

### 3.5 Tables
- Sticky header, zebra optional, sortable, paginated.
- RTL-aware alignment (text-align: start).

### 3.6 Charts
- Use a colorblind-safe palette; consistent with brand.
- Always show units, legend, and (for scientific) validation state.

### 3.7 Maps
- MapLibre GL base; brand-styled controls; layer toggles.
- 2D + 3D terrain; DEM + GeoJSON layers.

### 3.8 Scientific Data Visualization
- **Validation badges:** Validated/Calibrated/Uncalibrated/Not Validated (see colors).
- **Provenance panel:** model, version, inputs, params, code hash.
- **No fabricated data:** DEMO labels for samples.

### 3.9 Dashboard Components
- KPI cards, charts, tables, map panels, activity feeds.

### 3.10 Modal & Dialog
- Focus trap, ESC close, `role="dialog"`, `aria-modal`.

### 3.11 Notifications
- Toast (transient), inline (persistent), severity colors.

### 3.12 Accessibility
- WCAG 2.2 AA; keyboard nav; screen-reader labels; contrast ≥4.5:1; focus visible; reduced-motion.

---

## 4. RTL/LTR

- Use CSS logical properties (`margin-inline-start`, `padding-inline`, `inset-inline`).
- `dir="rtl"` on `<html>` for Persian/Arabic; `dir="ltr"` for English.
- Icons: directional icons (chevrons) mirror automatically.
- Numbers/dates: locale-aware.

---

## 5. SECTIONS (UX differentiation)

| Section | Density | Voice | Key components |
|---|---|---|---|
| Public Website | Spacious | Editorial, warm | Hero, cards, imagery |
| HyDroMA | Dense, technical | Precise, data-first | Charts, provenance, model runs |
| Scientific Dashboard | Dense | Analytical | KPI, charts, map, tables |
| Admin Panel | Compact | Efficient | Tables, forms, filters |
| Marketplace | Warm, commercial | Friendly, transactional | Product cards, cart, checkout |
| Accounting | Compact, precise | Formal, numeric | Tables, ledgers, Decimal |
| Tourism | Warm, visual | Inspiring, local | Galleries, booking, maps |
| Geospatial/Satellite | Technical, map-first | Spatial, layered | Map, layer toggles, timeline |

All sections use the **same tokens** and **same components**, differing in density and emphasis.

---

## 6. IMPLEMENTATION NOTES

- Tokens as CSS custom properties + JSON (for design tools).
- Component library: framework-agnostic (Web Components or React).
- RTL tested via snapshot tests.
- Accessibility tested via axe.

---

## 7. STATUS

**DRAFT — NOT APPROVED.** No component is final. Owner decision required.

**END OF DESIGN SYSTEM.**