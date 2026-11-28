# Workflow & Automation Architecture (branch index)

**Status:** SCAFFOLDED. Definitions only; no external engine. Authoritative depth: `workflows/README.md`,
module catalog (WF-ENGINE/DEF/APPROVAL/SCHED/OUTBOX), `architecture/ECO-NOJIN-WORKFLOW-CATALOG.csv`.

## Target

- Versioned workflow definitions (trigger, steps, actors, approval gates, failure path, audit points).
- States and transitions explicit; permissions per transition; human-in-the-loop approval.
- Retry, failure, audit, versioning defined. Engine may adopt Temporal/Kestra behind an adapter (D-07).

## Candidate workflows

User/organization onboarding · projects · marketplace (listing review, fulfilment, dispute) ·
inventory · tourism (reservation/modify/cancel/no-show) · MRV · scientific model execution · data
acquisition · data verification · administrative approval · AI human-in-the-loop.

## Current state

- Definitions directories exist; no runtime. Engine-local workflow/scenario layer exists in HyDroMA
  (scientific, not business).

## Related

- [../component-registry.md](../component-registry.md) · D-07