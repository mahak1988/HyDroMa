# File & Object Storage Architecture (branch index)

**Status:** SCAFFOLDED. No object storage installed, no files migrated. Authoritative depth:
`infrastructure/README.md` (INF-STORAGE), module catalog (INF-STORAGE, PLT-DOC).

## Target

File/object storage · metadata · access control · file + organization ownership · upload/download ·
validation (MIME, size) · processing · versioning · retention · deletion · backup/recovery ·
lifecycle.

## Future file categories

Documents · images · reports · datasets · raster · scientific outputs · marketplace images · tourism
media · user uploads.

## Boundary

Database stores **metadata + reference**; object storage stores **bytes**. No large blob in the
relational store (D-DB-02). Every object is tenant/org-scoped and access-controlled.

## Current state

Filesystem + data zones only. No bucket, no CDN, no lifecycle.

## Related

- [../registries/infrastructure-registry.md](../registries/infrastructure-registry.md) · [../data-flow.md](../data-flow.md)