# apps/ — one platform, one port, specialised sections

**Status:** unified platform SPA (Phase 2 complete) · **One port:** `http://localhost:5180`

The runtime is **one platform application** (`apps/platform`, port 5181) served by the
unified host on port 5180: the **public core** lives at the root, and specialised
sections are reached from the platform header. `packages/configuration/apps.json`
is the registry (v2) — every entry carries `status`, `owner`, `dataMode`,
`requiresSession` and `apiNamespaces`; `scripts/app-manifest.mjs` enforces
five-way consistency (folder⇄registry, api usage, session primitives, test gates,
unique paths/ports) in `verify`.

## Runtime apps (7)

| App | Path | Internal port | Audience | Status | dataMode |
|---|---|---|---|---|---|
| `platform` | `/` | 5181 | everyone + operators | **live** | hybrid — public core at `/` (12 pages, real `/login`), workspace at `/platform` |
| `console` | `/console/` | 5175 | organizations | **live** | api — fully real identity, notifications, session |
| `scientific-workspace` | `/science/` | 5177 | scientists | **live** | api — model registry + runs via `hydroma-client` → local engine |
| `marketplace` | `/market/` | 5178 | buyers, sellers | beta | hybrid — real session + sellers; catalog fixture (owner decision pending) |
| `tourism` | `/tourism/` | 5179 | guests, hosts | beta | hybrid — real session gate + inquiries; booking backend pending |
| `field-collection` | `/field/` | 5185 | field workers | sandbox | offline — localStorage queue; real sync pending |
| `brand` | `/brand/` | 5182 | designers | sandbox | content — live tokens reference |

Migration target and phase order: `docs/reports/برنامه-پلتفرم-یکپارچه-2026-11-23.md`.
Blocked capabilities (never faked): `docs/BLOCKED-CAPABILITIES.md`.

## Sections bridge

While a section still runs as its own bundle, it is listed in
`apps/platform/src/sections/manifest.ts` (`external: true`) and the public header
links to it with a document navigation. A section becomes `internal` when its
routes move into the platform SPA as a lazy module.

## Run

```bash
pnpm run dev        # unified host on :5180 (API on :8000 + every app behind a proxy)
pnpm run seed       # load reference data (catalog categories) into the API database
pnpm run preview    # same host serving the production builds (build first)
pnpm run build      # build all apps with the right base path
pnpm run verify     # typecheck + lint + boundaries + tokens + app-manifest + unit + api tests + builds
```

Standalone section development keeps its own internal port (see registry), and
`/api` is proxied by every dev server and both hosts, so session cookies stay
same-origin everywhere.

## Rules for adding or changing an app

1. Registry entry first (`apps.json`, v2 fields required) — `pnpm run check:apps` fails otherwise.
2. DoD for `status: "live"`: e2e spec + a11y spec + real data source (no fixtures).
3. A blocked capability is labeled unavailable in the UI, never substituted with fake data.
4. Commits only on explicit owner request; one work package per commit.
