# ADR-0007 — UI Kit: single @eco-nojin/ui + design tokens

- **Status:** ACCEPTED
- **Date:** 2026-11-22
- **Deciders:** owner (via resident agent)
- **Related:** Phase 2 of apps evolution plan

## Context
Upstream uses MUI, AntD, Element Plus, PatternFly, shadcn/Radix, Tailwind. Nojin already has packages/ui + packages/design-system with tokens.

## Options considered
| Option | Pros | Cons | Risk |
|---|---|---|---|
| Single @eco-nojin/ui + tokens | One design system, RTL-aware | Build components in-house | Low |
| Adopt shadcn/Radix | Faster component growth | Second design grammar | Medium |

## Decision
Single @eco-nojin/ui + design-system tokens. No MUI/AntD/Element Plus/PatternFly in product. shadcn/Radix may be studied as pattern reference only.

## Consequences
- Positive: no dual UI kits; tokens drive everything.
- Negative: component development cost.
- Follow-up work: chart plugin registry in packages/ui/charts.