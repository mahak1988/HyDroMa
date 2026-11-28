# Cache Architecture

**Status:** SCAFFOLDED. No Redis installed.

## Responsibility
Cache strategy, keys, expiration, invalidation; API/data/spatial/scientific caches; tenant isolation.

## Boundaries
- Never caches `/api/*` or `/hydroma-api/*` by default; no sensitive data in cache.
- Cache keys must include tenant/org scope.

## Dependencies
API, data access, spatial, scientific.

## Maturity / Future
SCAFFOLDED → adoption criteria defined → Redis only when measured need + owner approval (Stage 2+).