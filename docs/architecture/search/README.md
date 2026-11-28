# Search Architecture

**Status:** SCAFFOLDED. Client-side list filtering exists; no search index.

## Responsibility
Search API, index, domains, permissions, filters, ranking, metadata, testing.

## Boundaries
- Search results must respect tenant isolation and permissions.
- No external search engine installed.

## Dependencies
API, data, IAM.

## Maturity / Future
SCAFFOLDED → DB-backed search → dedicated index only when scale requires (Stage 5).