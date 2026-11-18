# Responsive Test — 375 to 1920px

**Date:** 2026-11-17. Real Chromium renders at each width; geometry measured from the DOM.

## Widths tested

375 (mobile S), 480 (mobile), 768 (tablet), 1024 (laptop), 1440 (desktop), 1920 (large desktop) + bonus 320.

## Method

At each width x locale (fa, en) x section (overview, brands, colors, type, components, science, market, i18n, a11y):
- measured documentElement.scrollWidth vs clientWidth (horizontal overflow)
- flagged elements whose bounding box exceeds the viewport
- flagged text clipping (scrollWidth > clientWidth on leaf text nodes)

## Findings BEFORE fix

| Width | Section | Issue |
|---|---|---|
| 375 | components | Data table overflowed viewport (scrollW 393 > 375); RTL table shifted left -18px |
| 375 | a11y | Alert box overflowed (scrollW 392 > 375) |
| 320 | brands/components/a11y | overflow (table, alert, swatch grid) |

## Fixes applied (QA copy only)

- .table -> display:block; overflow-x:auto with white-space:nowrap cells (horizontal scroll inside the table, not the page).
- .alert -> flex-wrap:wrap; overflow-wrap:anywhere.
- Tightened container/main padding at <=480px and <=375px.

## Findings AFTER fix

| Width | fa | en | Overflow |
|---|---|---|---|
| 320 | all sections | all sections | 0 |
| 375 | all sections | all sections | 0 |
| 480 | all sections | all sections | 0 |
| 768 | all sections | all sections | 0 |
| 1024 | all sections | all sections | 0 |
| 1440 | all sections | all sections | 0 |
| 1920 | all sections | all sections | 0 |

- Text clipping: 0 after fix.
- Header/nav: desktop shows full nav; <=480px nav collapses (already display:none at <=480 in original responsive.css).
- Grid: grid-2/3/4 collapse to 1 column <=480px; logos single-column.
- No element overlap, no broken SVG scaling, no font-load failure at any width.

## Screenshots

screenshots/responsive/overview-{375,480,768,1024,1440,1920}.png, components-375.png, science-375.png, market-375.png.

## Verdict

Responsive **PASS** (after QA corrections).