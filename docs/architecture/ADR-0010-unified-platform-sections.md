# ADR-0010 — Unified platform sections

**Status:** Accepted (phases 3–7, 2026-11-23)
**Context:** Eco Nojin was nine separate applications on one port. Phases 3–6
migrated the specialised workspaces into the platform SPA as lazy sections.
**Deciders:** Owner (catalog hybrid decision, phase 5 staging) + resident agent.

## Context

The unified host (`scripts/unified-dev.mjs`, `scripts/unified-serve.mjs`) already
served every bundle on port 5180, but each app kept its own router, session
provider, theme/i18n provider and navigation. That duplicated session handling,
made `/api` cookies fragile across origins, and multiplied bundle budgets.

## Decision

1. **One SPA**: `apps/platform` is the only user-facing application. The public
   core lives at `/`; the workspace lives at `/platform`; sections are lazy
   route trees inside the same SPA.
2. **Sections are internal**: tourism (`/tourism`), market (`/market`),
   landscape (`/landscape`), science (`/science`) and administration
   (`/landscape/admin`) are `React.lazy` modules. The section manifest in
   `apps/platform/src/sections/manifest.ts` records them; external redirects
   remain only for surfaces that have not migrated.
3. **One session**: the root `RealSessionProvider` (`baseUrl` `/api`) is the
   only session. Sections consume it through their own thin hooks
   (tourism `isHost`, market seller role, console `useSession`). No section
   creates a second `RealSessionProvider`.
4. **Same-origin API**: every request goes to `/api` and is proxied by Vite and
   by both hosts. Absolute `http://127.0.0.1:8000` URLs are forbidden in
   frontend code; e2e tests may talk to the API directly.
5. **No fake capability**: sections keep explicit `unavailable`, `pending` or
   `demo` states. The marketplace catalog stays content-backed while sellers
   are API records (owner decision: hybrid). Field observations sync for real
   through `POST /v1/resources/surveys`; statuses come from the API.
6. **Archived apps**: the legacy bundles moved to `archive/legacy-*` and were
   removed from the registry. They are still typechecked and linted from the
   archive, but `build:all`, `unified-dev` and `unified-serve` no longer see
   them; their routes live in the platform SPA.
7. **Budget gate**: `scripts/check-bundle-budget.mjs` caps the initial entry at
   900 KB and each lazy section entry (`router-*.js`) at 700 KB; vendor map/3D
   chunks are reported but not capped. The gate is part of `verify`.

## Consequences

- One origin, one cookie jar, one locale/theme provider; session behaviour is
  testable end-to-end with real API accounts.
- Section failures are isolated by lazy chunks and `Suspense` fallbacks; the
  public core keeps working if a section chunk fails.
- The platform initial chunk is larger than any single legacy app (all shared
  i18n catalogs are in the entry); the budget gate keeps it under 900 KB.
- Legacy app folders live under `archive/legacy-*`; they still typecheck and
  lint from there but are no longer served or built.
- The public marketing copy is currently authored in en/fa/ar; shared i18n
  catalog keys (auth, sections, apps, hydroma, …) exist in all 15 shipped
  locales. Translating the public core into the remaining 12 locales is open
  work and must use native copy, not machine translation passed off as final.

## References

- `docs/architecture/ROUTING.md`
- `docs/architecture/BUNDLE-BUDGET.md`
- `docs/BLOCKED-CAPABILITIES.md`
- `packages/configuration/apps.json`
- `apps/platform/src/sections/manifest.ts`