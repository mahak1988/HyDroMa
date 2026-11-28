# Observability Architecture

**Status:** SCAFFOLDED. No monitoring infrastructure installed.

## Responsibility
Logs, metrics, traces, health checks, alerts, dashboards, correlation IDs; API/DB/worker/HyDroMA/AI/provider health.

## Boundaries
- Does not own business logic; consumes events/contracts.
- OpenTelemetry is the candidate standard (not installed).
- Never logs credentials, tokens, or sensitive user data.

## Dependencies
Contracts from API, services, engines/hydroma, integrations, ai.

## Maturity / Future
SCAFFOLDED → STUB (health endpoints) → IMPLEMENTED (OTel collector) when Stage 2 begins.
Distinguish Observability (operational) from Analytics (product).