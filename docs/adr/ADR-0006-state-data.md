# ADR-0006 — State/data standard: TanStack Query + React Router data router

- **Status:** ACCEPTED
- **Date:** 2026-11-22
- **Deciders:** owner (via resident agent)
- **Related:** Phase 4 of apps evolution plan

## Context
Multiple state libraries exist upstream (Redux Toolkit, Zustand, Pinia, custom). Nojin already uses TanStack Query in console/marketplace.

## Options considered
| Option | Pros | Cons | Risk |
|---|---|---|---|
| TanStack Query + RR data router | Proven in medusa/novu/spree, low risk | Migration of any Redux code | Low |
| Redux Toolkit | Mature | Heavier, legacy pressure | Medium |

## Decision
TanStack Query + React Router data router as the standard for server data; Zustand only for small client-only state. No Redux in new code.

## Consequences
- Positive: consistent seam (VITE_API_URL) across apps; one query cache.
- Negative: existing fixture data must move behind query functions.
- Follow-up work: typed hooks in packages/api-client.