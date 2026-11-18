# infrastructure/ — runtime and operations

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Definition-only in this phase. No cloud resource, container, cluster or secret store is created.

| Area | Intended content |
|---|---|
| `environments` | dev/staging/prod parameter sets (no secrets) |
| `configuration` | typed config loading and validation rules |
| `security` | authn/authz policy, secret handling, key rotation procedure |
| `monitoring` | metrics, logs, traces, SLO definitions, alert routing |
| `backup` | backup scope, retention, restore test procedure |
| `deployment` | build/release pipeline definitions (per app and service) |

Hard rules: no secret in Git; no environment-specific value in code; every deployment must be
reproducible from a commit.
