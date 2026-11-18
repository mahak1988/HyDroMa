# docs/security — security governance

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Scope: threat model, authn/authz policy, secret handling, tenancy isolation, audit requirements,
dependency and supply-chain review.

Existing inputs: `../../architecture/ECO-NOJIN-SECURITY-AND-INFRASTRUCTURE.md`.

Current rules in force: no secret in Git; no credential in a client bundle; every mutation audited;
permission checks re-evaluated server-side; upstream code reviewed before adoption.
