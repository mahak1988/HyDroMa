# Security Architecture (branch index)

**Status:** SCAFFOLDED. No security infrastructure installed, no access policy changed, no secrets.
Authoritative depth: `architecture/ECO-NOJIN-SECURITY-AND-INFRASTRUCTURE.md`, `docs/security/`,
module catalog security zones (Z2–Z6).

## Scope

Authentication · authorization · IAM · RBAC · ABAC applicability · tenant isolation · application
security · API security · database security · storage security · infrastructure security · AI/agent
security · network security · secret management · encryption · audit · privacy · security testing ·
vulnerability + dependency management · threat modeling.

## Boundaries

Trust boundaries defined in [../system-boundaries.md](../system-boundaries.md). OWASP principles used
as reference. Default-deny; tenant-scoped every query; secrets never in Git.

## Current state

Documented controls; no IdP, no audit store, no secret store. Client permission claims exist but
server-side enforcement is not implemented.

## Related

- `docs/security/` · [../iam/README.md](../iam/README.md) · [../audit/README.md](../audit/README.md)