# apps/ — one platform, one port, specialised sections

**Status:** unified platform SPA (ADR-0010) · **One port:** `http://localhost:5180`

The runtime is **one platform application** (`apps/platform`) served by the
unified host on port 5180. The **public core** lives at `/`, the workspace at
`/platform`, and the specialised sections are lazy route trees inside the same
SPA. `apps/brand` is a static design showcase at `/brand/`.

`packages/configuration/apps.json` is the registry (v2): every entry carries
`status`, `owner`, `dataMode`, `requiresSession` and `apiNamespaces`.
`scripts/app-manifest.mjs` enforces five-way consistency in `verify`.

## Sections (internal to the platform SPA)

| Section | Path | Kind | Notes |
|---|---|---|---|
| public core | `/` | static + real `/login` | marketing content, contact, auth |
| workspace | `/platform/*` | page registry | landscape/projects/mrv/knowledge pages |
| tourism | `/tourism/*` | lazy | real session gate; booking backend pending |
| market | `/market/*` | lazy | sellers from API; catalog content-backed (hybrid) |
| landscape | `/landscape/*` | lazy | shared page registry |
| field | `/landscape/field/*` | lazy (nested) | offline queue; real `/v1/resources/surveys` sync |
| admin | `/landscape/admin/*` | lazy (nested) | identity, users, notifications, profile, security |
| science | `/science/*` | lazy | `hydroma-client`; explicit unavailable states |
| brand | `/brand/` | separate static app | token showcase |

## Archived apps

`console`, `marketplace`, `tourism`, `field-collection` and
`scientific-workspace` were moved to `archive/legacy-*` and removed from the
registry. They are still typechecked and linted from the archive, but they are
not built, served or reachable at runtime — their routes live in the platform
SPA now. The registry contains `platform` and `brand` only.

## Run

```bash
pnpm run dev        # unified host :5180 + API :8000
pnpm run seed       # reference data (catalog categories)
pnpm run preview    # serve production builds (build first)
pnpm run build:all  # build live apps with the right base path
pnpm run verify     # typecheck + lint + boundaries + tokens + app-manifest
                    # + unit + API tests + build + bundle budget
pnpm run check:bundle  # bundle budget only (after a build)
```

`/api` is proxied by the dev server and both hosts, so session cookies stay
same-origin everywhere.

## Rules for adding or changing a section

1. Registry entry first (`apps.json`, v2 fields required); archived apps are
   skipped by build/dev.
2. Add the section as an internal lazy route in `src/sections/manifest.ts`;
   keep its links behind a `*/paths.ts` helper.
3. Reuse the root `RealSessionProvider`; never create a second session provider.
4. `status: "live"` requires e2e + a11y specs and a real data source.
5. A blocked capability is labeled unavailable in the UI, never substituted
   with fake data (`docs/BLOCKED-CAPABILITIES.md`).
6. Commits only on explicit owner request; one work package per commit.