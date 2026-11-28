# Configuration & Secrets Architecture

**Status:** SCAFFOLDED.

## Responsibility
Environment configuration, feature flags, app/db/service/engine/AI config; secrets; dev/test/staging/prod.

## Boundaries
- Secrets never in code/logs/reports; provided via environment/secret store.
- No production configuration changed by scaffolding.

## Dependencies
All components (read config); security (secrets).

## Maturity / Future
SCAFFOLDED → typed config loader → secret manager integration (owner-gated).