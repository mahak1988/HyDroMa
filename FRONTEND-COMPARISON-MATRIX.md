# FRONTEND-COMPARISON-MATRIX

**Date:** 2026-11-18
**Scope:** the four repositories actually downloaded and evaluated in batch-16.
**Caution:** this matrix compares *evidence*, not a selection. No project is chosen as a base.
Scores are 1–5 and are only meaningful relative to each other under the stated weights.

---

## 1. Side-by-side facts

| Dimension | nellavio | kiranism-dashboard | velora-ui | orbynadmin |
|---|---|---|---|---|
| License | MIT | MIT | MIT | MIT |
| Version evaluated | tag 2.0.1 | tag v2.0.0 | tag v0.11.0 | branch main |
| Framework | Next 16.1.6 / React 19.2.4 | Next 16.2.6 / React 19.2.4 | Next 16.3.7 / React 19.3.0 | Next 16.2.10 / React 19.2.4 |
| Product type | admin dashboard starter | admin dashboard starter | marketing site + component registry | admin dashboard template |
| Routes | 19 | 32 | 22 patterns (121+ keys) | 79 |
| TS/TSX files / LOC | 456 / 76.8k | 653 / 79.9k | 686 / 78.7k | 181 / 75.9k |
| Components | shadcn-style set + Storybook | shadcn on Base UI | 101 registry components + 31 blocks | shadcn set + 10 dashboards |
| Org/tenant model | demo role map (`admin/editor/viewer`) | Clerk Organizations | none | none |
| Auth dependency | better-auth (self-hosted, absent) | **Clerk SaaS (required)** | none | none |
| Backend dependency | GraphQL endpoint expected; falls back to bundled JSON | demo API layer inside app; Clerk required | none for public pages; optional Cloudflare function for waitlist | none (all mock) |
| i18n | `next-intl`, `en` + `pl` | none | none | none |
| RTL support | **none** | **none** | **none** | **none** |
| Theme | `next-themes` + colour customizer (react-colorful) | `next-themes` + theme switcher | `next-themes` | `next-themes` + accent/radius/font/sidebar customizer writing CSS variables |
| Animation | `tw-animate-css` | `motion` (limited) | `motion` (heavy, signature) | `tw-animate-css` |
| Install | `npm ci` OK | `npm install` OK (no npm lockfile; `bun.lock`) | `pnpm --frozen-lockfile` OK | `npm ci` OK |
| Typecheck | PASS | compiled in build | compiled in build | PASS |
| Production build | **FAIL** (prerender, Next 16.1.6) | **FAIL** (prerender, Next 16.2.6) | **PASS** | **FAIL** (prerender, Next 16.2.10) |
| Dev server pages | 200 on all tested routes | **500 everywhere** (Clerk keys) | 200 on all tested routes | 200 on all tested routes |
| Console/page errors (tested pages) | 0 / 0 | n/a | 2 console (1 external image timeout) / 0 | 0 / 0 |
| Mock vs real | mock JSON fallback; GraphQL contract defined | real mutation patterns, needs Clerk | static content | fully mock |
| Mobile 390 px | renders | not reachable | renders | renders |
| Pro/paid boundary | none | none | Pro present in marketing only, **not in repo** | none (states "no pro tier") |
| Provenance confidence | medium-high (514★, 3 releases, active) | high (7.3k★, releases) | medium-high (Colorlib org, releases) | **low** (single author, 2026-07, 19★, no releases) |

Excluded from comparison: **Basalt UI** — identity unresolved (see §4).

## 2. Weighted matrix

Weights reflect the platform's real constraints: multi-tenant console, fa/ar/en RTL, backend
independence, and rebrand ability.

| Criterion | Weight | nellavio | kiranism | velora-ui | orbynadmin |
|---|---|---|---|---|---|
| Architecture / code quality | 20 | 4 | 5 | 4 | 3 |
| Usability & completeness of UI inventory | 15 | 4 | 5 | 3 | 5 |
| Independence from external backend/SaaS | 15 | 4 | 1 | 5 | 5 |
| Rebrand feasibility (identity removal) | 10 | 4 | 3 | 4 | 3 |
| Token/theming architecture | 10 | 4 | 4 | 3 | 5 |
| Component portability | 10 | 3 | 4 | 5 | 4 |
| RTL readiness | 5 | 1 | 1 | 1 | 1 |
| i18n readiness | 5 | 3 | 1 | 1 | 1 |
| Animation capability | 5 | 2 | 3 | 5 | 3 |
| Licence/provenance clarity | 5 | 5 | 5 | 4 | 4 |
| **Weighted total / 100** | **100** | **73** | **70** | **75** | **75** |

Reading the numbers correctly:
- velora-ui and orbynadmin tie, but they are **not interchangeable**: velora wins on portability and
  animation, orbyn wins on UI inventory and theming.
- kiranism scores highest on engineering and lowest on independence; its 70 is dominated by the
  Clerk penalty, not by weak code.
- nellavio is the only project with i18n routing and a usable RBAC shape.
- **RTL = 1 for all four.** That single row is the most important line in this matrix: no candidate
  provides bidi support, so RTL is a build item for Nojin regardless of which patterns are borrowed.

## 3. Dimension detail (evidence)

### 3.1 Quality
- kiranism: feature-sliced `src/features/*`, per-feature API layer, SSR prefetch + `HydrationBoundary`,
  Zod validation, oxlint/oxfmt, cleanup script, Dockerfile. Highest.
- nellavio: clean separation (`services/`, `queries/`, `config/`, `components/views`), Storybook,
  Vitest + vitest-axe, but some demo-grade auth wiring.
- velora: disciplined docs pipeline and registry generation; less application architecture because it
  is not an application.
- orbyn: broad but shallow — 79 pages over 181 files, no tests, no auth, no API layer.

### 3.2 Usability of the UI inventory
- orbyn: 10 dashboards + project workspace + chat/mail/notes + auth + error states.
- kiranism: tables/forms/kanban/notifications/billing with real behaviour.
- nellavio: analytics/customers/orders/products/calendar/user-management/forms/charts/tables.
- velora: landing pages, blocks, component gallery — excellent for public surfaces, not for consoles.

### 3.3 RTL
- `html[dir]` is **not set** in any project; no `dir`-conditional logic; no logical CSS properties in
  the sampled styles; no bidi-safe icon mirroring.
- Practical consequence: RTL requires (a) `dir` at the root, (b) logical properties
  (`margin-inline`, `inset-inline`, `text-align: start`), (c) icon/spacing mirroring, (d) bidi-safe
  charts and tables. None of the four reduces that work.

### 3.4 i18n
- nellavio: `messages/en.json`, `messages/pl.json`, `next-intl` with `[locale]` segment and middleware.
  Locale set must be replaced and Arabic/Persian added.
- Others: hardcoded English strings; adopting them means an i18n retrofit across every screen.

### 3.5 Animation
- velora: `motion`, aurora/beam/marquee/parallax vocabulary, `reduced-motion` friendly per its README.
  Heaviest and most reusable for `portal`.
- orbyn/kiranism: `tw-animate-css` / light `motion` usage — enough for UI feedback, not for marketing.
- nellavio: minimal motion.

### 3.6 Backend independence
- velora: every public page renders with no API. Only optional Cloudflare function for waitlist.
- orbyn: everything is local mock; zero external calls.
- nellavio: renders from `backendBackup.json` when `GRAPHQL_URL` is unset — genuinely backend-optional,
  but its intended shape is GraphQL + better-auth.
- kiranism: **not independent** — Clerk middleware gates every route; without keys, 500.

## 4. Unverified candidates (not downloaded)

| Name | Findings | Status |
|---|---|---|
| OrbynAdmin | Only one repository with that name: `masondevx/orbynadmin` (MIT, 19★, created 2026-07, homepage `orbynadmin.vercel.app`, README claims "no pro tier"). Downloaded and evaluated with **low provenance confidence**. | **Conditionally verified** |
| Basalt UI | **Two different projects share the name**: `nocoo/basalt` (MIT, `basaltui.com`, 4★) and `jkrumm/basalt-ui` (Apache-2.0, `basalt-ui.com`, 0★). Both are public repos with different licences and different products. There is no verifiable "official" Basalt UI to pick. | **UNVERIFIED — not downloaded** |
| `basalt.dev` | Domain does not resolve (timeout) | n/a |

Per the mission rule, no substitute repository was chosen for Basalt UI.

## 5. Pattern-level recommendation (not a product decision)

| Need | Borrow the pattern from | Do not borrow |
|---|---|---|
| `apps/portal` public pages | velora-ui composition + motion | Pro assets (not in repo) |
| `apps/console` locale routing | nellavio `[locale]` + `next-intl` structure | its `en/pl` catalogs |
| `apps/console` RBAC shape | nellavio role/permission map (as a model only) | its demo store |
| `apps/console` module/API split | kiranism feature boundaries | Clerk coupling, unless D-04 accepts it |
| Design tokens | orbynadmin CSS-variable customizer as a *mechanism* proof | its palette/typography |
| Component portability | velora-ui registry model | its brand assets |
| RTL + i18n + Persian typography | **nothing here** — must be built in `packages/i18n` + `packages/design-system` | all four |
