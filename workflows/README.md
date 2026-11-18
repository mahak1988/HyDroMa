# workflows/ — process definitions

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Workflow *definitions*, not a runtime. Execution belongs to `services/workflow` (which may adopt
Temporal/Kestra behind an adapter, D-07).

| Directory | Scope |
|---|---|
| `scientific` | data intake → validation → model run → review → publication |
| `business` | onboarding, approvals, organization lifecycle |
| `finance` | invoicing, payout approval, reconciliation checkpoints |
| `marketplace` | listing review, order fulfilment, dispute |
| `tourism` | reservation, modification, cancellation, no-show |
| `ai` | agent task intake, human-in-the-loop approval, escalation |

Every definition must name: trigger, steps, actors, approval gates, failure path, audit points.
