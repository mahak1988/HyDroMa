# apps/ — every user-facing surface, one origin

**Status:** implemented (frontend, demo data) · **One port:** `http://localhost:5180`

Every application lives here and is served from a single origin and a single port.
`packages/configuration/apps.json` is the registry: the dev host, the production host, the
entry page and the in-app switcher all read it, so adding an app is a one-file change.

| App | Path | Internal port | Audience | State |
|---|---|---|---|---|
| `home` | `/` | 5181 | everyone | entry page, links every surface |
| `portal` | `/portal/` | 5176 | public visitors | implemented — prerendered, PWA, fa/ar/en |
| `console` | `/console/` | 5175 | organizations | implemented (demo) — identity, tenancy, permissions |
| `scientific-workspace` | `/science/` | 5177 | scientists | implemented (demo) — indicators, maps, scenarios |
| `marketplace` | `/market/` | 5178 | buyers, sellers | implemented (demo) — catalog, cart, seller console |
| `tourism` | `/tourism/` | 5179 | guests, hosts | implemented (demo) — stays, experiences, bookings |
| `platform` | `/platform/` | 5183 | operators, communities | implemented (demo) — landscape, agriculture, MRV, projects, knowledge, finance, community, governance (72 pages) |
| `brand` | `/brand/` | 5182 | designers | implemented — live tokens, components, light/dark, identity |

## Run

```bash
npm run dev        # unified host on :5180 (starts every app behind a proxy)
npm run preview    # same host, serving the production builds (run build first)
npm run build      # builds all apps with the right base path, then the host serves them
npm run verify     # typecheck + lint + boundaries + tokens + unit tests + all builds
```

Standalone app development still works and keeps its own port:

```bash
npm run dev:console   # 5175
npm run dev:portal    # 5176
npm run dev:science   # 5177
npm run dev:market    # 5178
npm run dev:tourism   # 5179
npm run dev:platform  # 5183
npm run dev:brand     # 5182
npm run dev:home      # 5181
```

## Boundaries

Each app is its own bundle; apps never import another app's source. Shared behaviour lives in
`packages/*` and is consumed as a workspace dependency:

- `@eco-nojin/configuration` — app registry, ports, basename rules.
- `@eco-nojin/ui` — primitives, charts, `AppSwitcher` (renders only in unified mode).
- `@eco-nojin/icons` — 30 domain glyphs (catchment, groundwater, MRV, nomadic, …).
- `@eco-nojin/auth-client` — demo session primitives and the shared route guards.
- `@eco-nojin/scientific` — deterministic models with units, provenance and validation state.

`apps/platform` composes seven services behind one registry: 72 routes are generated from
`src/content/pages.ts` and rendered by six shared page patterns (dashboard, list, detail, wizard,
report, map). See `docs/platform-page-map.md` for the page-by-page mapping to the 120-page plan.
- `@eco-nojin/spatial` — map bootstrap, layer registry, token-driven colours.

`scripts/check-boundaries.mjs` enforces this on every run: 20 units, zero violations.

## Data

All apps run on demo data and are labelled as such in the UI. No app talks to a backend yet:
`apps/console/src/data/index.ts` switches to the HTTP client when `VITE_API_URL` is set, and every
other surface has the same seam. Payments, wallets and tokens are explicitly out of scope.