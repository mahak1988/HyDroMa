# Resilience Architecture

**Status:** SCAFFOLDED.

## Responsibility
Timeouts, retry, idempotency, failure isolation, circuit breakers, graceful degradation, health checks, backup/restore, DR.

## Boundaries
- Retries only for idempotent (GET) operations; mutations never auto-retried.
- No DR infrastructure installed.

## Dependencies
Observability, configuration, infrastructure.

## Maturity / Future
SCAFFOLDED → implemented per component as SLOs are defined (Stage 6).