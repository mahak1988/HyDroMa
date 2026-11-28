# Audit Architecture (branch index)

**Status:** SCAFFOLDED. No audit functionality implemented. Authoritative depth: module catalog
(PLT-AUDIT, AI-AUDIT, ADM-AUDIT), `architecture/ECO-NOJIN-SECURITY-AND-INFRASTRUCTURE.md`.

## Audit record (target)

Actor · action · resource · timestamp · organization · request id · context · previous state
(applicability) · new state (applicability). Append-only; hash-chained integrity; access-controlled;
retention + privacy defined.

## Distinguish

Application logs ≠ security logs ≠ audit logs ≠ scientific provenance ≠ AI execution records. They
have different consumers, retention and integrity requirements.

## Current state

No audit store. Engine provenance is the only integrity mechanism present (scientific, not audit).

## Related

- [../security/README.md](../security/README.md) · [../observability/README.md](../observability/README.md)