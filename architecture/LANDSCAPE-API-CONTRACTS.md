# LANDSCAPE-API-CONTRACTS
## قراردادهای API پیشنهادی — زبان و منظر

**Date:** 2026-11-18
**Status:** CONTRACT PROPOSAL — no endpoint exists, nothing is routed, no OpenAPI file is published.
**Rule:** these paths are proposals to be reconciled with the naming standard of `contracts/api`
before any implementation. They are not operational APIs.

---

## 1. Conventions (apply to every endpoint)

| Concern | Rule |
|---|---|
| Base path | `/v1/...`; breaking changes → `/v2` |
| Auth | OIDC bearer token; scopes + tenant claim; server-side permission check on every call |
| Tenant | `organization_id` from the token, never from the body; cross-tenant access → `404` |
| Locale | `Accept-Language` for response text; `?locale=` for a specific representation; errors localized |
| Pagination | cursor-based: `?cursor=…&limit=50`; response `{items, next_cursor}` |
| Filtering | explicit whitelisted params; unknown params → `422` (no silent ignore) |
| Concurrency | `ETag` + `If-Match` on all mutations of versioned resources |
| Idempotency | `Idempotency-Key` required on POST that creates money/projects/analysis |
| Async | long operations return `202 {job_id}` + `Location` |
| Errors | one envelope (§7), never provider/vendor shapes |
| Rate limits | per tenant + per endpoint; `429` with `Retry-After` |
| Caching | `Cache-Control` on public reads; `no-store` on private |
| Dates | ISO-8601 UTC for instants; `YYYY-MM-DD` for validity dates |
| Geometry | GeoJSON (RFC 7946) in requests; responses by reference (`geometry_ref`) when > 64 KB |

## 2. Internationalization API

| Method | Path | Purpose | Permission |
|---|---|---|---|
| GET | `/v1/languages` | registry projection (code, native name, direction, status, features) | `i18n.read` (public subset allowed) |
| GET | `/v1/languages/{code}` | one language entry incl. fonts/format defaults | `i18n.read` |
| GET | `/v1/locales` | locale catalogue + completeness % | `i18n.read` |
| GET | `/v1/translations/{locale}` | compiled static catalogs (namespaced, hashed) | `i18n.read` |
| POST | `/v1/translations/translate` | dynamic translation request (async if large) | `translation.request` |
| GET | `/v1/translations/cache/{key}` | cache/memory lookup status (no text by default) | `translation.read` |
| POST | `/v1/translations/review` | submit review decision | `translation.reviewer` |
| GET | `/v1/glossary` | glossary versions + domains | `glossary.read` |
| GET | `/v1/glossary/{term_id}` | term with equivalents, sources, status | `glossary.read` |

Notes:
- `GET /translations/{locale}` is a **build artifact endpoint** for tooling and admin preview; the
  product UI imports catalogs at build time and does not call it at render.
- `POST /translations/translate` body: `{texts[], source, target, contentType, glossaryVersion?,
  tenantPolicy}` → `202` for batches > 20 texts, otherwise `200` with states.
- Review endpoint never accepts `state: APPROVED` from an unauthenticated or agent caller.

## 3. Landscape API

| Method | Path | Purpose | Permission |
|---|---|---|---|
| GET | `/v1/landscapes` | list (filters: country, region, type, org, bbox, as_of) | `landscape.read` |
| POST | `/v1/landscapes` | create | `landscape.create` |
| GET | `/v1/landscapes/{id}` | profile + summary | `landscape.read` |
| PATCH | `/v1/landscapes/{id}` | update profile fields | `landscape.update` |
| GET | `/v1/landscapes/{id}/boundaries` | boundaries with validity + source | `landscape.geo.read` |
| POST | `/v1/landscapes/{id}/boundaries` | add boundary version | `landscape.geo.write` |
| GET | `/v1/landscapes/{id}/relationships` | overlaps/contains/adjacency | `landscape.read` |
| GET | `/v1/landscapes/{id}/map` | layer manifest + tile/STAC refs (no tiles proxied) | `landscape.read` |
| GET | `/v1/landscapes/{id}/indicators` | latest per indicator + quality/staleness | `landscape.read` |
| GET | `/v1/landscapes/{id}/projects` | linked projects | `landscape.read` |
| GET | `/v1/landscapes/{id}/communities` | communities in scope (visibility filtered) | `landscape.read` |
| GET | `/v1/landscapes/{id}/reports` | published reports | `landscape.read` |
| POST | `/v1/landscapes/{id}/analysis-requests` | request HyDroMA analysis | `landscape.analysis.request` |
| GET | `/v1/landscapes/{id}/analysis-results/{resultId}` | result refs + provenance | `landscape.analysis.read` |
| GET | `/v1/landscapes/{id}/history` | append-only change history | `landscape.audit` |

## 4. Village and Nomadic APIs

| Method | Path | Purpose | Permission |
|---|---|---|---|
| GET | `/v1/villages` | list (landscape, country, region) | `village.read` |
| POST | `/v1/villages` | create village profile | `village.create` |
| GET | `/v1/villages/{id}` | profile + 16 sections summary | `village.read` |
| GET | `/v1/villages/{id}/households` | **aggregated** household data by default | `village.households.read` |
| GET | `/v1/villages/{id}/businesses` | local businesses (links to marketplace sellers) | `village.read` |
| GET | `/v1/villages/{id}/projects` | development/restoration projects | `village.read` |
| GET | `/v1/nomadic-communities` | list | `nomadic.read` |
| POST | `/v1/nomadic-communities` | create | `nomadic.create` |
| GET | `/v1/nomadic-communities/{id}` | profile + social structure | `nomadic.read` |
| GET | `/v1/nomadic-communities/{id}/territories?season=&as_of=` | seasonal territories | `nomadic.read` |
| GET | `/v1/nomadic-communities/{id}/routes?season=` | migration routes + windows | `nomadic.read` |
| GET | `/v1/nomadic-communities/{id}/seasonal-activity?year=` | camps/water/occupancy | `nomadic.read` |
| GET | `/v1/nomadic-communities/{id}/rangelands` | used rangelands + capacity refs | `nomadic.read` |
| GET | `/v1/nomadic-communities/{id}/livestock` | herd systems (aggregated) | `nomadic.livestock.read` |

Privacy: household- and person-level endpoints never return raw identities to a caller without
`village.households.pii` **and** a matching data-purpose; default is aggregate (`count`, `bands`).

## 5. Shared resources

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/rangelands` · `/v1/rangelands/{id}` | rangeland registry + condition + plans |
| GET | `/v1/rangelands/{id}/capacity` | capacity records with provenance/quality |
| GET | `/v1/watersheds` · `/v1/watersheds/{id}/sub-basins` | basin hierarchy |
| GET | `/v1/projects` · `/v1/projects/{id}` | shared project registry |
| GET | `/v1/working-groups` · `/v1/working-groups/{id}/members` | governance |
| POST | `/v1/working-groups/{id}/decisions` | record decision (approval gate) |
| GET | `/v1/indicators` | indicator definitions + units |

## 6. Authorization matrix (excerpt)

| Endpoint class | Scope check | Permission | Extra condition |
|---|---|---|---|
| `GET /landscapes` | org + landscape scope | `landscape.read` | visibility ≤ caller's clearance |
| `POST /landscapes` | org | `landscape.create` | country admin+ |
| `POST boundaries` | org + landscape | `landscape.geo.write` | manager+ |
| `GET households` | org + landscape + village | `village.households.read` | aggregate unless PII grant |
| `POST analysis-requests` | org + landscape | `landscape.analysis.request` | dataset licence check |
| `POST decisions` | org + landscape + group | `governance.decide` | membership + quorum |
| `POST translations/review` | org | `translation.reviewer` | MFA session |
| `GET /languages` | none (public subset) | — | rate limited |

Roles are **data**, not enums (see `LANDSCAPE-MANAGEMENT-ARCHITECTURE.md` §8).

## 7. Error envelope

```json
{ "error": { "code": "LANDSCAPE_NOT_FOUND", "message_key": "landscape.error.not_found",
             "message": "…localized…", "details": [{"field": "id", "issue": "unknown"}],
             "correlation_id": "…", "retryable": false } }
```

| HTTP | Code examples | When |
|---|---|---|
| 400 | `INVALID_GEOMETRY`, `INVALID_TIME_RANGE` | malformed input |
| 401 | `UNAUTHENTICATED` | missing/expired token |
| 403 | `PERMISSION_DENIED`, `DATA_CLASSIFICATION_DENIED` | authenticated, not allowed |
| 404 | `LANDSCAPE_NOT_FOUND` | also used instead of 403 for cross-tenant probes |
| 409 | `VERSION_CONFLICT`, `OVERLAP_POLICY_CONFLICT` | ETag/stale write |
| 422 | `SCHEMA_VALIDATION_FAILED`, `UNSUPPORTED_LOCALE` | semantic errors |
| 429 | `RATE_LIMITED`, `TRANSLATION_QUOTA_EXCEEDED` | limits |
| 503 | `HYDROMA_UNAVAILABLE` | upstream down; cached results still served with `STALE_INPUT` |

## 8. Versioning and deprecation

- Semantic version in the path; additive fields are non-breaking.
- Removed fields require ≥ 1 release of dual-write + a deprecation header (`Sunset`).
- Contract tests compare the published schema against `contracts/api` on every build.

## 9. Intentionally not exposed

- Raw geometry of private land to unauthenticated callers.
- Household/person identifiers by default.
- Provider keys or provider-specific payloads.
- Model internals or dataset binaries (only signed references).
- Financial ledger endpoints (owned by `finance`).
- Any write endpoint callable by an agent without human approval.

## 10. Contract test gates

1. Every endpoint has schema + authz entry; CI fails on undocumented routes.
2. Pagination/filter/`ETag` behaviour covered by contract tests.
3. Tenant isolation test: a token from org A cannot read org B resources (404).
4. Localized error test: `message_key` resolves in all 15 locales.
5. Idempotency test: identical `Idempotency-Key` returns the same resource.
