# Eco Nojin Design System — Tokens & Conventions

**Status:** implemented (Phase 2.1 frontend) · **Canonical source:** `packages/design-system/src/tokens.css`

This document describes the **actual** implemented system. It is the reference for FE‑3+; it is not a proposal.

## 1. Canonical source of truth
- **`packages/design-system/src/tokens.css`** is the single canonical token source (Visual Identity v1.1 — Royal Aubergine / Burnt Terracotta / Antique Champagne).
- Consumed by every app via `import "@eco-nojin/design-system/tokens.css"` + `@import "@eco-nojin/design-system/tailwind.css"` + `import "@eco-nojin/design-system/base.css"`.
- **Legacy / candidate (NOT canonical):** `brand.css`, `brand/tokens.css`, `brand/tokens.json` — a "Path A: Territory Teal" candidate palette, unused (nothing imports it), retained pending owner decision **COLOR‑01 / D‑BRAND**. Do not treat as a second token system.

## 2. Token categories (in `tokens.css`)
1. **Primitives** — brand identity ramp, warm neutral ramp (`--slate-*`), scientific green ramp (`--green-*`), functional hues, service hues, data-viz ramps, type scale, spacing scale, radius, shadows, layout, motion, z-index.
2. **Semantic aliases** (what components consume) — `--canvas`, `--surface`, `--surface-2/3`, `--fg`, `--fg-muted`, `--border`, `--primary`, `--accent`, `--danger`, `--success`, `--warning`, `--info`, `--disabled`, `--ring`, plus `-soft`/`-fg` variants.
3. **Themes** — light (`:root`, `:root[data-theme="light"]`) and a separately-tuned dark (`:root[data-theme="dark"]`); never an inversion.
4. **Legacy aliases** — kept only so older surfaces migrate without breakage.

## 3. Theme architecture
Light is default; dark is a tuned set. Both define the same semantic variable names, so components never branch on theme. Theme is switched via `data-theme` on `:root`.

## 4. Typography
`--font-sans` (Manrope), `--font-fa` (Vazirmatn), `--font-display` (Lora), `--font-commerce` (Nunito Sans), `--font-report` (Source Serif 4), `--font-mono`. Type scale `--text-2xs`…`--text-5xl` + `--text-hero` (fluid). Fonts via `@fontsource-variable/*`. Persian/Arabic use `--font-fa` (set in `base.css` for `[lang=fa|ar|ur]`).

## 5. RTL/LTR
Logical CSS is used throughout (`inset-inline-start`, `margin-inline`, etc.). Direction comes from `packages/i18n` (`direction.tsx`, `RTL_LANGUAGES`); directional icons opt in via `.rtl-flip` / `.icon-directional` (mirrored under `[dir="rtl"]`). No hardcoded left/right in shared UI.

## 6. Spacing / radius / layout / motion
- Spacing: `--space-0`…`--space-16` (4px base). Radius: `--radius-sm`…`--radius-xl`, `--radius-pill`.
- Layout: `--container-max`, `--container-narrow`, `--sidebar-width`, `--header-height`.
- Motion: `--duration-fast/base/slow/data`, `--ease-standard/out`. Restrained; `prefers-reduced-motion` disables animation/transitions in `base.css`.

## 7. Tailwind 4 integration
`tailwind.css` maps tokens into Tailwind's `@theme` (`--color-*`, `--font-*`, `--radius-*`, `--shadow-*`, `--text-*`). Font stacks are duplicated there because `@theme` cannot reference same-name vars (kept in sync with `tokens.css`). No component uses raw Tailwind palette colours. `@source` scans `ui/src`, `frontend-core/src`, **and `app-shell/src`** (the last added in FE‑6 — without it the shared shell's `lg:*` responsive classes were purged and the shell rendered in mobile layout at every width).

## 8. Guards (must stay green)
- `npm run check:tokens` — forbids raw palette colours / hex in className or inline style across apps + `packages/ui`.
- `npm run check:boundaries` — enforces unit boundaries (no cross-unit relative imports, no app↔app, no package↔app, no frontend→engine, no ui/i18n→frontend-core cycle).

## 9. Accessibility foundation (design-system level)
- Focus: `:focus-visible` 2px ring using `--ring` (base.css); components use `--ring`.
- Contrast: semantic tokens are tuned for light/dark (not verified to full WCAG AA across every component — see limitations).
- Reduced motion: honored globally.
- Colour is never the sole indicator (components pair with text/icons).

## 10. Consuming the system
```ts
import "@eco-nojin/design-system/tokens.css";
import "@eco-nojin/design-system/tailwind.css";
import "@eco-nojin/design-system/base.css";
// then use semantic classes: bg-surface, text-fg, border-border, bg-primary, text-danger, ...
```

## 11. Limitations
- Dark theme and full WCAG 2.2 AA conformance are **not** fully verified across all components.
- No visual regression tooling is wired; verification is code + tests only.
- Legacy "Path A" palette (brand/*) remains until the owner closes COLOR‑01 / D‑BRAND.
- No visual showcase route ships yet (apps/brand uses the canonical tokens).

## 12. Shared application shell (`@eco-nojin/app-shell`)
Router-aware, content-agnostic shell used by apps (Console integrated in FE‑3):
- Components: `AppShell`, `AppHeader`, `AppSidebar`, `AppNav`, `PageHeader`, `Breadcrumbs`.
- Config: `{ brand, groups: NavGroup[], can?, headerActions?, sidebarFooter?, breadcrumbs?, footer?, content, labels?, storageKey? }`.
- Behaviour: responsive grid + collapsible desktop sidebar + mobile `<dialog>` drawer (Esc closes, persisted collapse), skip link, landmarks (`header/nav/main/footer`), `aria-current` active nav, RTL/LTR via logical CSS, semantic tokens only.
- Boundaries: `frontend-core` stays router-agnostic; `ui` stays presentational; the shell depends only on `react-router-dom` + design tokens.
- Limits: no visual regression tooling; WCAG 2.2 AA not fully verified.