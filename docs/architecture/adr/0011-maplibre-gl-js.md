# ADR-0011 — Adopt MapLibre GL JS for web mapping

Status: Proposed
Owner: Eco Nojin

## Context
Need lightweight, open-source web mapping without API keys or licensing cost.

## Decision
Adopt MapLibre GL JS as the primary web mapping library for Eco Nojin platform.

## Consequences
- No API key required for base usage.
- MIT license.
- Integration via `packages/spatial` and `apps/platform` map components.
- No operational cost.

## Risks
- Large bundle size; needs code splitting.
- Tile providers may require separate terms.