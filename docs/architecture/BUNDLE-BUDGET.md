# Bundle size budget — Eco Nojin apps

Per-app initial JS bundle targets (gzipped). Enforced via Vite `chunkSizeWarningLimit` and reviewed in PRs.

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

Rules:
- Map libraries (MapLibre/deck.gl) must be code-split and lazy-loaded.
- No app may import another app's bundle.
- Any PR exceeding a target by >10% requires justification in the PR description.