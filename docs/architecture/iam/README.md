# IAM & Access Control Architecture (branch index)

**Status:** SCAFFOLDED. No IdP installed, no accounts created. Authoritative depth:
`architecture/ECO-NOJIN-MODULE-CATALOG.csv` (PLT-IAM/SESSION/ORG/RBAC/USER), `docs/architecture/frontend/AUTH_AND_PERMISSION_ARCHITECTURE.md`.

## Model

- **Identity ≠ Organization ≠ Role ≠ Permission ≠ Membership ≠ Resource ownership** (separate
  records, lifecycles). This separation enables multi-country/multi-org operation.
- Authentication: credentials, sessions, MFA, federation (adapter; provider TBD, D-04).
- Authorization: RBAC + ABAC applicability, default-deny, SoD, access review.
- Service identities and agent identities are distinct, scoped, and audited.

## Actor classes

Anonymous · registered user · organization member · manager · administrator · system administrator ·
service account · AI agent. Each has defined visibility and navigation; client role claims are never
trusted alone.

## Current state

- Client `auth-client` (session/claims) implemented; server IdP not implemented.
- Tenant isolation enforced in engine (organization scope) but no central authz service yet.

## Related

- [../system-boundaries.md](../system-boundaries.md) · `docs/security/` · D-04, D-PROD-02