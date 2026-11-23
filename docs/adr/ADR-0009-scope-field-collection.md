# ADR-0009 — Scope: field-collection app included; analytics/flow-builder deferred

- **Status:** ACCEPTED
- **Date:** 2026-11-22
- **Deciders:** owner (via resident agent)
- **Related:** Phase 6, 7 of apps evolution plan

## Context
Candidate new apps: field-collection (OpenForis Arena pattern), analytics (Superset as service), flow-builder (kestra/flowise).

## Options considered
| Option | Pros | Cons | Risk |
|---|---|---|---|
| Include field-collection; defer analytics & flow-builder | Focused scope, high value | Less feature breadth | Low |
| Include all three | More features | Scope creep, licence risk | High |

## Decision
Include field-collection (survey/map/validate) as a new app. Defer analytics (Superset only as standalone service, separate decision) and flow-builder (requires owner validation of need) to later phases.

## Consequences
- Positive: bounded scope; high-value field data capture.
- Negative: analytics/flow deferred.
- Follow-up work: create apps/field-collection; register in apps.json.