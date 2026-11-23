# Bundle size budget — Eco Nojin apps

Per-app initial JS bundle targets (gzipped) were the original contract, enforced
via Vite `chunkSizeWarningLimit` and reviewed in PRs. With the unified platform
those apps are sections of one SPA; the current gate is the unified budget in
[the next section](#unified-platform-budget).

## Legacy per-app budgets (archived)

| App | Initial JS (gzip) target | Map chunk (lazy) | Notes |
|---|---:|---:|---|
| home | ≤ 100 KB | — | Entry point only |
| portal | ≤ 150 KB | — | Static-first, prerendered |
| console | ≤ 200 KB | — | Lazy routes per page |
| scientific-workspace | ≤ 250 KB | ≤ 400 KB (MapLibre + deck.gl) | Map is lazy; deck.gl deferred |
| marketplace | ≤ 200 KB | — | Catalog fixture |
| tourism | ≤ 250 KB | ≤ 400 KB (TourismMap lazy) | Map lazy |
| platform | ≤ 250 KB | — | 73 pages lazy via PageRenderer |
| brand | ≤ 150 KB | — | Token showcase |
| field-collection | ≤ 250 KB | ≤ 400 KB (MapLibre lazy) | Map lazy |

Legacy rules that still apply:

- Map libraries (MapLibre/deck.gl) must be code-split and lazy-loaded.
- No app may import another app's bundle.
- Any PR exceeding a target by >10% requires justification in the PR description.

## Unified platform budget

The unified platform is one SPA on port 5180. Sections are lazy so the public
core and the workspace stay small; this gate keeps them that way.

| Chunk | Budget | Rationale |
| --- | --- | --- |
| Initial entry (`index-*.js`) | 900 KB | Public core + router + all shipped i18n catalogs. Minified, not gzipped. |
| Section entry (`router-*.js`) | 700 KB | One lazy section (tourism, market, landscape, science, admin), loaded on demand. |
| Vendor chunks (MapLibre, deck.gl, ScienceMap, expression engine) | not capped | Loaded only by the page that imports them; reported by the gate for visibility. |

Budgets are measured on the minified output in `apps/platform/dist/assets`
(after `pnpm run build:all`). Gzip sizes are printed for reference only.

### Gate

```bash
pnpm run build:all
pnpm run check:bundle
```

`check:bundle` is part of `pnpm run verify`, so a build that exceeds a budget
fails the same gate as typecheck, lint and tests.

### How to stay under budget

- Add a new section as a lazy route with its own `React.lazy` page chunks; do
  not import section pages from the platform router.
- Load mapping/3D libraries only from the page component that renders them, so
  Vite/rolldown can split the vendor chunk.
- Shared catalogs live in `packages/i18n`; adding a key there affects the
  initial chunk, so keep additions small and reuse existing keys.

### Current status

The gate prints the initial chunk, every section entry and the five largest
vendor chunks on each run. A red gate means the change that grew the chunk must
be split or reverted; raising a budget requires an explicit owner decision.