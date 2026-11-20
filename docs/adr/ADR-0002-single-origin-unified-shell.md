# ADR-0002 — One origin, one port, unified entry point

**Date:** 2026-11-20 · **Status:** accepted (owner decision)
**Supersedes:** the implicit assumption in `apps/README.md` that each app ships on its own origin.

## Context

Five applications were built as independent Vite projects, each with its own port (5175–5179),
its own router mounted at `/`, and no shared navigation. That is a good development model but a
poor product model: a reviewer had to remember five URLs, and nothing tied the surfaces together.
The owner asked for one port, one entry page and a visibly integrated product.

## Decision

1. **One user-facing origin and port:** `http://localhost:5180` in development (proxy) and the same
   port in production (`scripts/unified-serve.mjs`).
2. **Path ownership per app:** `/portal/`, `/console/`, `/science/`, `/market/`, `/tourism/`,
   `/brand/`, with `/` owned by the entry page. `packages/configuration/apps.json` is the only
   source of truth for these paths and for the internal ports.
3. **Each app keeps its own bundle and router**, mounted with `basename` derived from
   `import.meta.env.BASE_URL`, so no app imports another app's source and the boundary guard keeps
   working. This is a path-routed composition, not a single mega-bundle.
4. **A shared switcher** (`@eco-nojin/ui` → `AppSwitcher`) renders only when `BASE_URL !== "/"`;
   standalone app development and the existing e2e suites are therefore unaffected.
5. **The entry page** (`apps/home`) reads the same registry, so a new app appears there, in the
   switcher and in both hosts without further edits.

## Consequences

- One URL to review, one build command (`npm run build:all`), one verification command.
- Cross-app links are document navigations (full reload), not client-side transitions — accepted,
  because each app is an independent bundle.
- Deployment must serve each `apps/<id>/dist` under its prefix; `scripts/unified-serve.mjs` is the
  reference implementation and the contract for any future reverse proxy.
- A per-app standalone mode and port remain available for debugging and for the existing
  Playwright suites, which run against their own dev servers.